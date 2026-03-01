import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import pptxgen from 'pptxgenjs';

const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;

/**
 * PDF Export logic:
 * Uses html2canvas to capture slides.
 * To get high quality, we render at scale 2x or 3x.
 */
export const exportToPDF = async (slides, title = "Presentation") => {
    try {
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [SLIDE_WIDTH, SLIDE_HEIGHT]
        });

        // Create a hidden container for rendering
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = `${SLIDE_WIDTH}px`;
        container.style.height = `${SLIDE_HEIGHT}px`;
        container.style.zIndex = '-1';
        document.body.appendChild(container);

        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            
            // Render slide content into container
            // Since we're in a utility and not a component, 
            // we'll have to manually build the DOM or use a clever trick.
            // Trick: Create a temporary React root? No, too heavy.
            // Let's use the DOM approach.
            
            container.innerHTML = '';
            const slideDiv = document.createElement('div');
            slideDiv.style.width = '100%';
            slideDiv.style.height = '100%';
            slideDiv.style.position = 'relative';
            slideDiv.style.backgroundColor = slide.background || '#ffffff';
            slideDiv.style.backgroundImage = slide.backgroundImage ? `url(${slide.backgroundImage})` : 'none';
            slideDiv.style.backgroundSize = '100% 100%';
            slideDiv.style.overflow = 'hidden';
            container.appendChild(slideDiv);

            // Add layers - basic mapping
            // Note: Slate content is hard to render manually. 
            // We might need to use a dedicated renderer or just capture what's on screen if possible.
            // But what's on screen is only the ACTIVE slide.
            
            // BETTER STRATEGY: 
            // Use the SlideThumbnail component rendering logic but in a temporary div.
            // We'll pass the slide to a function that returns a DOM element.
            renderSlideToDOM(slide, slideDiv);

            // Wait a bit for images to load (if any)
            await new Promise(r => setTimeout(r, 500));

            const canvas = await html2canvas(slideDiv, {
                width: SLIDE_WIDTH,
                height: SLIDE_HEIGHT,
                scale: 2, // 2x scale for better quality
                useCORS: true,
                logging: false,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
        }

        pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
        document.body.removeChild(container);
    } catch (error) {
        console.error("PDF Export failed:", error);
        alert("Failed to export PDF. Check console for details.");
    }
};

/**
 * PPTX Export logic:
 * Uses pptxgenjs to build a real PPTX file.
 */
export const exportToPPTX = async (slides, title = "Presentation") => {
    try {
        const pptx = new pptxgen();
        pptx.layout = 'LAYOUT_16x9';
        pptx.title = title;

        for (const slideData of slides) {
            const slide = pptx.addSlide();
            
            // Set background
            if (slideData.backgroundImage) {
                slide.background = { path: slideData.backgroundImage };
            } else {
                slide.background = { color: (slideData.background || '#ffffff').replace('#', '') };
            }

            for (const layer of slideData.layers) {
                const xPct = (layer.x / SLIDE_WIDTH) * 100;
                const yPct = (layer.y / SLIDE_HEIGHT) * 100;
                const wPct = (layer.width / SLIDE_WIDTH) * 100;
                const hPct = (layer.height / SLIDE_HEIGHT) * 100;

                if (layer.type === 'text') {
                    // Extract plain text from Slate JSON
                    const plainText = extractPlainText(layer.content);
                    slide.addText(plainText, {
                        x: `${xPct}%`,
                        y: `${yPct}%`,
                        w: `${wPct}%`,
                        h: `${hPct}%`,
                        fontSize: layer.fontSize || 18,
                        color: (layer.color || '#000000').replace('#', ''),
                        fontFace: layer.fontFamily || 'Arial',
                        bold: layer.fontWeight === 'bold',
                        italic: layer.fontStyle === 'italic',
                        underline: layer.textDecoration === 'underline',
                        align: layer.textAlign || 'left',
                        rotate: layer.rotation || 0,
                    });
                } else if (layer.type === 'image') {
                    slide.addImage({
                        path: layer.imageUrl || layer.src,
                        x: `${xPct}%`,
                        y: `${yPct}%`,
                        w: `${wPct}%`,
                        h: `${hPct}%`,
                        rotate: layer.rotation || 0,
                        rounding: layer.borderRadius > 0,
                    });
                } else if (layer.type === 'shape') {
                    let shapeType = 'RECTANGLE';
                    if (layer.shapeType === 'circle') shapeType = 'ELLIPSE';
                    if (layer.shapeType === 'line') shapeType = 'LINE';

                    // Use the shapes/ShapeType from instance or class
                    const shapes = pptx.ShapeType || pptxgen.ShapeType || pptx.shapes || pptxgen.shapes;
                    const selectedShape = shapes ? shapes[shapeType] : shapeType;

                    slide.addShape(selectedShape, {
                        x: `${xPct}%`,
                        y: `${yPct}%`,
                        w: `${wPct}%`,
                        h: `${hPct}%`,
                        fill: { color: (layer.fill || '#3b82f6').replace('#', '') },
                        line: { color: (layer.stroke || '#000000').replace('#', ''), width: layer.strokeWidth || 1 },
                        rotate: layer.rotation || 0,
                    });
                }
            }
        }

        pptx.writeFile({ fileName: `${title.replace(/\s+/g, '_')}.pptx` });
    } catch (error) {
        console.error("PPTX Export failed:", error);
        alert("Failed to export PPTX. Check console for details.");
    }
};

/**
 * Helper to render a slide to DOM for html2canvas
 * This mimics SlideThumbnail logic but creates real DOM nodes.
 */
function renderSlideToDOM(slide, container) {
    slide.layers.forEach(layer => {
        const el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.left = `${layer.x}px`;
        el.style.top = `${layer.y}px`;
        el.style.width = `${layer.width}px`;
        el.style.height = `${layer.height}px`;
        el.style.transform = `rotate(${layer.rotation || 0}deg)`;
        el.style.transformOrigin = 'center center';
        
        if (layer.type === 'text') {
            el.style.fontSize = `${layer.fontSize}px`;
            el.style.color = layer.color;
            el.style.fontFamily = layer.fontFamily;
            el.style.textAlign = layer.textAlign;
            el.style.whiteSpace = 'pre-wrap';
            el.style.lineHeight = '1.2';
            // For Slate content, we'll use a simplified plain text renderer for now
            // or we could try to render the HTML if we had a static HTML generator.
            // Since html2canvas struggles with complex CSS, simple is safer.
            el.innerText = extractPlainText(layer.content);
        } else if (layer.type === 'image') {
            const img = document.createElement('img');
            img.src = layer.imageUrl || layer.src;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'fill';
            img.style.borderRadius = `${layer.borderRadius || 0}px`;
            img.style.border = `${layer.borderWidth || 0}px solid ${layer.borderColor || '#000'}`;
            el.appendChild(img);
        } else if (layer.type === 'shape') {
            el.style.backgroundColor = layer.fill;
            if (layer.shapeType === 'circle') el.style.borderRadius = '50%';
            if (layer.shapeType === 'roundRect') el.style.borderRadius = '12px';
            if (layer.shapeType === 'line' || layer.shapeType === 'arrow') {
                el.style.height = `${Math.max(2, layer.strokeWidth || 2)}px`;
                el.style.backgroundColor = layer.stroke;
            }
        } else if (layer.type === 'table') {
            el.style.display = 'grid';
            el.style.gridTemplateColumns = `repeat(${layer.cols}, 1fr)`;
            el.style.gridTemplateRows = `repeat(${layer.rows}, 1fr)`;
            el.style.border = `${layer.borderWidth || 1}px solid ${layer.borderColor || '#e5e7eb'}`;
            
            const totalCells = layer.rows * layer.cols;
            for(let i=0; i<totalCells; i++) {
                const cell = document.createElement('div');
                cell.style.border = `${layer.borderWidth || 1}px solid ${layer.borderColor || '#e5e7eb'}`;
                el.appendChild(cell);
            }
        }
        
        container.appendChild(el);
    });
}

/**
 * Extract plain text from Slate nodes
 */
function extractPlainText(nodes) {
    if (!nodes || !Array.isArray(nodes)) return "";
    return nodes.map(n => {
        if (n.text !== undefined) return n.text;
        if (n.children) return extractPlainText(n.children);
        return "";
    }).join("\n");
}
