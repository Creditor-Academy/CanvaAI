// layout/aiAutoAlign.js
import { SLIDE, MARGIN, SAFE, GAP } from "./constants";

// Mathematical properties of the Canvas (Cartesian constraints)
const CANVAS = {
  W: SLIDE.WIDTH,     // 960
  H: SLIDE.HEIGHT,    // 540
  P: 30,              // Strict safe padding globally (left, top, right, bottom)
};
const WORKSPACE = {
  W: CANVAS.W - 2 * CANVAS.P, // 900
  H: CANVAS.H - 2 * CANVAS.P, // 480
};

const TITLE_FONT_SIZE = 24;

function extractPlainText(layer) {
  if (layer.text) return typeof layer.text === "string" ? layer.text : "";
  if (!Array.isArray(layer.content)) return "";

  function extractDeepText(nodes) {
    if (!Array.isArray(nodes)) return "";
    let text = "";
    for (const node of nodes) {
      if (node.text) text += node.text;
      if (node.children) text += extractDeepText(node.children);
    }
    return text;
  }

  return extractDeepText(layer.content);
}

function normalizeStructure(layer) {
  if (layer.type === "numbered-list" || layer.type === "bulleted-list") {
    const { children, content, type, ...rest } = layer;
    return {
      ...rest,
      type: "text",
      content: [
        {
          type: type,
          children: children || content || []
        }
      ]
    };
  }
  return layer;
}

function detectRole(layer) {
  if (layer.role) return layer.role;

  if (layer.type === "text") {
    if (Array.isArray(layer.content) && layer.content.some(c => c.type === "numbered-list" || c.type === "bulleted-list")) {
      return "list";
    }

    const text = extractPlainText(layer);
    if (text.length < 50) return "title";
    if (text.length < 150) return "subtitle";
    return "body";
  }

  if (layer.type === "image") return "image";
  if (layer.type === "table") return "table";

  return "unknown";
}

function detectLayoutMode(layers) {
  const hasImage = layers.some(l => l.role === "image");
  const hasList = layers.some(l => l.role === "list");
  if (hasImage && hasList) return "split";
  return "stack";
}

export function autoAlignAISlides(slides, config = {}) {
  if (!slides || !Array.isArray(slides)) return [];

  return slides.map((slide, mapIndex) => {
    const slideIndex = config.slideIndex !== undefined ? config.slideIndex : mapIndex;
    const newSlide = { 
      ...slide, 
      meta: { ...(slide.meta || {}), autoAligned: true } 
    };

    if (!newSlide.layers || newSlide.layers.length === 0) return newSlide;

    // 1. Normalize
    let layers = newSlide.layers.map(l => normalizeStructure({ ...l }));
    layers.forEach(l => {
      l.role = detectRole(l);
    });

    const mode = detectLayoutMode(layers);

    const titles = layers.filter(l => l.role === "title");
    const subtitles = layers.filter(l => l.role === "subtitle");
    const images = layers.filter(l => l.role === "image");
    const lists = layers.filter(l => l.role === "list");
    const bodies = layers.filter(l => l.role === "body" || l.role === "unknown" || l.role === "table");

    // Dynamic height and font estimation mapping
    // We treat the canvas mathematically. We count exact lines per ast node.
    const getLinesCount = (content, assumedWidth, fontSize) => {
        let totalLines = 0;
        if (!Array.isArray(content)) return 1;
        for (const node of content) {
           if (node.type === 'list-item' || node.type === 'paragraph') {
             const t = extractPlainText({ content: [node] });
             // Safe character width estimator: 0.42 times font size yields a stronger buffer against wrapping edge cases
             const charsPerLine = assumedWidth / (fontSize * 0.42);
             totalLines += Math.max(1, Math.ceil(t.length / charsPerLine));
           } else if (node.children) {
             totalLines += getLinesCount(node.children, assumedWidth, fontSize);
           }
        }
        return totalLines === 0 ? 1 : totalLines;
    };

    const attachGeometry = (item, w, targetFontSize) => {
        item.width = w;

        // Enforce title font size globally
        if (item.role === 'title') {
            item.fontSize = TITLE_FONT_SIZE;
            targetFontSize = TITLE_FONT_SIZE;
        } else {
            item.fontSize = targetFontSize;
        }
        
        if (item.role === 'image') {
           item.height = 180;
           return 180;
        }

        const lines = getLinesCount(item.content || [], w, targetFontSize);
        // Fonts like Georgia/Lato take up more width than we predict. Use 0.45 aspect ratio safety.
        // Increase padding between elements to 24px and line-height spacing to 1.6 to prevent visual UI overflow.
        const calculatedHeight = (lines * targetFontSize * 1.6) + 24;
        item.height = calculatedHeight;
        return calculatedHeight;
    };

    let startY = 10;

    // Phase 1: Titles and Subtitles always top
    [...titles].forEach(t => { 
        t.x = CANVAS.P; 
        t.y = startY; 
        startY += attachGeometry(t, WORKSPACE.W, TITLE_FONT_SIZE) + 16; 
    });
    [...subtitles].forEach(s => { 
        s.x = CANVAS.P; 
        s.y = startY; 
        startY += attachGeometry(s, WORKSPACE.W, 24) + 16; 
    });

    // Mathematical Plane Scale Correction predicting overflow
    let remainingSpaceY = CANVAS.H - startY - CANVAS.P;
    if (remainingSpaceY < 200 && (lists.length > 0 || images.length > 0)) {
        startY = CANVAS.P;
        [...titles].forEach(t => { 
            t.x = CANVAS.P; 
            t.y = startY; 
            startY += attachGeometry(t, WORKSPACE.W, TITLE_FONT_SIZE) + 12; 
        });
        [...subtitles].forEach(s => { 
            s.x = CANVAS.P; 
            s.y = startY; 
            startY += attachGeometry(s, WORKSPACE.W, 20) + 12; 
        });
        remainingSpaceY = CANVAS.H - startY - CANVAS.P;
    }

    // Determine ordering to match user preference:
    // User likes "Body before Split" on odd slides, and "Split before Body" on even slides.
    const isEvenSlide = slideIndex % 2 === 0;

    const renderBody = () => {
        [...bodies].forEach(b => { 
            b.x = CANVAS.P; 
            b.y = startY; 
            startY += attachGeometry(b, WORKSPACE.W, 16) + 20; 
        });
    };

    const renderSplit = () => {
        if (mode === "split") {
            const COL_GAP = 24;
            const COL_W = (WORKSPACE.W - COL_GAP) / 2;
            
            let leftCol = isEvenSlide ? lists : images;
            let rightCol = isEvenSlide ? images : lists;
            
            if (leftCol.length === 0) leftCol = rightCol.splice(1);

            let ly = startY;
            leftCol.forEach(item => {
                item.x = CANVAS.P;
                item.y = ly;
                ly += attachGeometry(item, COL_W, 15) + 20;
            });

            let ry = startY;
            rightCol.forEach(item => {
                item.x = CANVAS.P + COL_W + COL_GAP;
                item.y = ry;
                ry += attachGeometry(item, COL_W, 15) + 20;
            });

            startY = Math.max(ly, ry);
        } else {
            const remaining = [...images, ...lists];
            remaining.forEach(item => {
                item.x = CANVAS.P;
                item.y = startY;
                startY += attachGeometry(item, WORKSPACE.W, 16) + 20;
            });
        }
    };

    // Layout Flow Mapping
    if (isEvenSlide) {
        // Body first, then split (Slide 1 style)
        renderBody();
        renderSplit();
    } else {
        // Split first, then body (Slide 2 style)
        renderSplit();
        renderBody();
    }

    // Final clipping constraint: Force strictly into bounds without deforming scale
    layers.forEach(layer => {
        layer.x = layer.x || CANVAS.P;
        layer.y = layer.y || CANVAS.P;
        
        // Prevent going out of the canvas entirely
        if (layer.x + layer.width > CANVAS.W) layer.width = CANVAS.W - layer.x - CANVAS.P;
        if (layer.y + layer.height > CANVAS.H) layer.height = CANVAS.H - layer.y - CANVAS.P;
    });

    newSlide.layers = layers;
    return newSlide;
  });
}
