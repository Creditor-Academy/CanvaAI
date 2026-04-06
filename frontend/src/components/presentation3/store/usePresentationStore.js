import { create } from "zustand";
import { nanoid } from "nanoid";
import { createShapeLayer, createImageLayer } from "../models/presentationModel";
import useHistoryStore from "./useHistoryStore";
import { convertTextToSlate, createInitialValue } from "../editors/slate/slateHelpers";

// Module-level set — tracks slides that were just created by AI and need one-time auto-stack.
// Not persisted to the store state so it is never saved to the database.
const _aiGeneratedSlideIds = new Set();
export const isAIGeneratedSlide = (slideId) => _aiGeneratedSlideIds.has(slideId);
export const clearAIGeneratedSlide = (slideId) => _aiGeneratedSlideIds.delete(slideId);

// Helper to ensure colors are in #rrggbb format for <input type="color">
export const normalizeColor = (color) => {
  if (!color || typeof color !== "string") return "#000000";
  // Convert #rgb to #rrggbb
  if (color.length === 4 && color.startsWith("#")) {
    return "#" + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  }
  // If it's not a hex color (like 'transparent' or 'red'), return black or a default for picker
  if (!color.startsWith("#")) {
    // For picker, we need a valid hex. For style, we can keep the original.
    // We'll handle this in the components using normalizeColor for pickers only.
    return color;
  }
  return color;
};

const normalizeTableLayer = (layer) => {
  if (!layer || layer.type !== "table") return layer;

  // 🔒 Skip normalization if table is already properly structured
  if (
    Array.isArray(layer.cells) &&
    Array.isArray(layer.cells[0]) &&
    Array.isArray(layer.cells[0][0]?.content)
  ) {
    return layer;
  }

  // 0. Handle nested content object if AI provided it that way
  let source = layer;
  if (layer.content && typeof layer.content === "object" && !Array.isArray(layer.content)) {
    // If the content object has rows/cols/cells, it's a nested data format
    if (layer.content.rows || layer.content.cols || layer.content.cells) {
      source = layer.content;
    }
  }

  // 1. Determine dimensions and format
  let headers = source.headerRow || source.headers;
  let dataRows = Array.isArray(source.rows) ? source.rows : (source.rowsData || source.rows_data || []);
  let cells = source.cells;

  let nRows = typeof source.rows === "number" ? source.rows : 0;
  let nCols = typeof source.cols === "number" ? source.cols : 0;

  // Format B: headerRow + rows[][] array
  if (Array.isArray(headers) && Array.isArray(dataRows)) {
    nRows = dataRows.length + 1;
    nCols = headers.length;
  }
  // Format A / 2D: Infer dimensions if missing
  else if (Array.isArray(cells) && cells.length > 0) {
    if (!nRows || !nCols) {
      if (Array.isArray(cells[0])) {
        nRows = cells.length;
        nCols = cells[0].length;
      } else {
        let maxR = 0; let maxC = 0;
        cells.forEach(c => {
          const r = c.row ?? 0; const col = c.col ?? 0;
          if (r > maxR) maxR = r;
          if (col > maxC) maxC = col;
        });
        nRows = maxR + 1;
        nCols = maxC + 1;
      }
    }
  }

  nRows = Math.max(nRows, 1);
  nCols = Math.max(nCols, 1);

  // 2. Create clean grid with unique object references (Deep Clone Pattern)
  const grid = Array.from({ length: nRows }, () =>
    Array.from({ length: nCols }, () => ({
      content: createInitialValue(),
      fontSize: 14,
      color: "#000000",
      fontFamily: "Arial",
      textAlign: "center",
    }))
  );

  const toSlate = (raw) => {
    if (!raw) return createInitialValue();
    // Handle cell object vs raw content
    const data = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? (raw.content || raw) : raw;

    if (typeof data === "string") return convertTextToSlate(data);
    if (Array.isArray(data)) return JSON.parse(JSON.stringify(data)); // Deep clone Slate array

    if (typeof data === "object") {
      const { text, ...marks } = data;
      return [
        {
          type: "paragraph",
          children: [{ text: text || "", ...marks }],
        },
      ];
    }
    return createInitialValue();
  };

  // 3. Fill grid
  if (Array.isArray(headers) && Array.isArray(dataRows)) {
    headers.forEach((h, c) => {
      if (c < nCols) {
        grid[0][c].content = toSlate(h);
        if (grid[0][c].content[0]?.children[0]) {
          grid[0][c].content[0].children[0].bold = true;
        }
      }
    });
    dataRows.forEach((row, r) => {
      if (Array.isArray(row) && (r + 1) < nRows) {
        row.forEach((cell, c) => {
          if (c < nCols) grid[r + 1][c].content = toSlate(cell);
        });
      }
    });
  } else if (Array.isArray(cells)) {
    const is2D = Array.isArray(cells[0]);
    cells.forEach((item, idx) => {
      if (is2D) {
        const r = idx;
        if (r < nRows) {
          item.forEach((cell, c) => {
            if (c < nCols) grid[r][c].content = toSlate(cell);
          });
        }
      } else {
        const r = item.row ?? Math.floor(idx / nCols);
        const c = item.col ?? (idx % nCols);
        if (r < nRows && c < nCols) grid[r][c].content = toSlate(item);
      }
    });
  }

  return {
    ...layer,
    rows: nRows,
    cols: nCols,
    cells: grid,
    borderWidth: layer.borderWidth ?? 1,
    borderColor: normalizeColor(layer.borderColor || "#000000"),
    tableBgColor: normalizeColor(layer.tableBgColor || "transparent"),
  };
};

const normalizeCells = (cells, rows, cols) => {
  // Legacy helper - kept for compatibility but normalizeTableLayer is preferred
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      content: createInitialValue(),
      fontSize: 14,
      color: "#000000",
      fontFamily: "Arial",
      textAlign: "center",
    }))
  );
};

/* =========================
   NORMALIZATION HELPERS
========================= */

/**
 * Normalizes an AI-generated layer to remove invalid absolute positioning
 * from list item children and text nodes, ensuring flow layout works correctly.
 */
export function normalizeAILayer(layer) {
  if (!layer || layer.type !== "text" || !Array.isArray(layer?.content)) {
    return layer;
  }

  const hasList = layer.content.some(
    (node) => node?.type === "bulleted-list" || node?.type === "numbered-list"
  );

  if (!hasList) {
    return layer;
  }

  const cleanNode = (node) => {
    if (node === null || node === undefined) return null;

    if (typeof node.text === "string") {
      if (node.text.trim() === "") return null;

      const validTextNode = { text: node.text };
      if (node.color !== undefined) validTextNode.color = node.color;
      if (node.fontSize !== undefined) validTextNode.fontSize = node.fontSize;
      if (node.fontFamily !== undefined) validTextNode.fontFamily = node.fontFamily;
      if (node.fontWeight !== undefined) validTextNode.fontWeight = node.fontWeight;
      if (node.fontStyle !== undefined) validTextNode.fontStyle = node.fontStyle;
      if (node.textDecoration !== undefined) validTextNode.textDecoration = node.textDecoration;

      return validTextNode;
    }

    if (Array.isArray(node.children)) {
      const cleanedChildren = node.children.map(cleanNode).filter((child) => child !== null);
      if (cleanedChildren.length === 0) return null;

      const { x, y, width, height, rotation, ...safeProps } = node;
      return { ...safeProps, children: cleanedChildren };
    }

    const { x, y, width, height, rotation, ...safeProps } = node;
    if (Object.keys(safeProps).length === 0) return null;

    return safeProps;
  };

  return {
    ...layer,
    content: layer.content.map(cleanNode).filter((node) => node !== null),
  };
}

const normalizeLayer = (layer, forceNewId = false) => {
  if (!layer) return layer;

  let normalizedLayer = {
    ...layer,
    id: forceNewId ? nanoid() : (layer.id || nanoid()),
  };

  // 1. Tables
  if (normalizedLayer.type === "table") {
    normalizedLayer = normalizeTableLayer(normalizedLayer);
  }

  // 2. Images (handle nested src object from AI)
  if (normalizedLayer.type === "image") {
    if (typeof normalizedLayer.src === "object" && normalizedLayer.src !== null) {
      normalizedLayer.imageUrl = normalizedLayer.src.url;
      normalizedLayer.imageKey = normalizedLayer.src.key;
      normalizedLayer.src = normalizedLayer.src.url;
    }
    if (!normalizedLayer.imageUrl && typeof normalizedLayer.src === "string") {
      normalizedLayer.imageUrl = normalizedLayer.src;
    }
  }

  // General Color Normalization
  if (normalizedLayer.color) normalizedLayer.color = normalizeColor(normalizedLayer.color);
  if (normalizedLayer.backgroundColor) normalizedLayer.backgroundColor = normalizeColor(normalizedLayer.backgroundColor);

  // 3. Legacy Lists (v2 style hardcoded lists)
  if (
    (normalizedLayer.type === "bulleted-list" || normalizedLayer.type === "numbered-list") &&
    normalizedLayer.children
  ) {
    const listType = normalizedLayer.type;
    normalizedLayer = {
      ...normalizedLayer,
      type: "text",
      content: [
        {
          type: listType,
          children: normalizedLayer.children,
        },
      ],
      fontSize: normalizedLayer.fontSize || 24,
      fontFamily: normalizedLayer.fontFamily || "Arial",
      color: normalizedLayer.color || "#000000",
      textAlign: normalizedLayer.textAlign || "left",
    };
    delete normalizedLayer.children;
  }

  // 4. Migration for old text layers without content
  if (normalizedLayer.type === "text" && normalizedLayer.text !== undefined && !normalizedLayer.content) {
    const { text, ...rest } = normalizedLayer;
    normalizedLayer = {
      ...rest,
      content: convertTextToSlate(text),
    };
  }

  // 5. Shapes (migration and defaults)
  if (normalizedLayer.type === "shape") {
    // Migrate old names
    if (normalizedLayer.fill !== undefined && normalizedLayer.fillColor === undefined) {
      normalizedLayer.fillColor = normalizedLayer.fill;
    }
    if (normalizedLayer.stroke !== undefined && normalizedLayer.strokeColor === undefined) {
      normalizedLayer.strokeColor = normalizedLayer.stroke;
    }

    // Ensure defaults
    if (normalizedLayer.strokeWidth === undefined) {
      normalizedLayer.strokeWidth = (normalizedLayer.shapeType === "line" || normalizedLayer.shapeType === "arrow") ? 8 : 1;
    }
    if (normalizedLayer.fillColor === undefined) {
      normalizedLayer.fillColor = (normalizedLayer.shapeType === "line" || normalizedLayer.shapeType === "arrow") ? "transparent" : "#ffffff";
    }
    if (normalizedLayer.strokeColor === undefined) {
      normalizedLayer.strokeColor = "#1e40af";
    }
  }

  // APPLY AI LIST NORMALIZATION
  if (normalizedLayer.type === "text") {
    normalizedLayer = normalizeAILayer(normalizedLayer);

    // Safeguard: Force width and height to be strictly numbers. 
    // AI often sends 'auto', '100%', or leaves it undefined which breaks drag rendering completely.
    const safeWidth = Number(normalizedLayer.width);
    const safeHeight = Number(normalizedLayer.height);

    normalizedLayer.width = isNaN(safeWidth) || safeWidth < 200 ? 700 : safeWidth;
    normalizedLayer.height = isNaN(safeHeight) || safeHeight < 40 ? 100 : safeHeight;
  }

  // Safeguard: x/y must always be valid numbers for all layer types.
  // AI often sends null/undefined which makes the drag offset calculation produce NaN,
  // causing the element to snap to (0,0) and showing "NaN, NaN" in the position readout.
  const rawX = Number(normalizedLayer.x);
  const rawY = Number(normalizedLayer.y);
  normalizedLayer.x = isNaN(rawX) ? 0 : rawX;
  normalizedLayer.y = isNaN(rawY) ? 0 : rawY;

  return normalizedLayer;
};

const normalizeSlide = (slide, forceNewId = false) => {
  if (!slide) return slide;

  // Slides produced by the layout engine carry layoutProcessed: true.
  // Their x/y/width/height are final — do NOT re-normalize layers.
  // Only regenerate the slide id if requested (e.g. duplicate).
  if (slide.layoutProcessed) {
    return {
      ...slide,
      id: forceNewId ? nanoid() : (slide.id || nanoid()),
    };
  }

  return {
    ...slide,
    id: forceNewId ? nanoid() : (slide.id || nanoid()),
    layers: (slide.layers || []).map((layer) => normalizeLayer(layer, forceNewId)),
  };
};

/* =========================
   TEXT STYLING HELPERS
========================= */

const applyStylesToNodes = (nodes, styles) => {
  return nodes.map((node) => {
    if (node.text !== undefined) {
      const newNode = { ...node };
      if (styles.color !== undefined) newNode.color = styles.color;
      if (styles.fontSize !== undefined) newNode.fontSize = styles.fontSize;
      if (styles.fontFamily !== undefined) newNode.fontFamily = styles.fontFamily;
      if (styles.fontWeight !== undefined) {
        if (styles.fontWeight === "bold") newNode.bold = true;
        else delete newNode.bold;
      }
      if (styles.fontStyle !== undefined) {
        if (styles.fontStyle === "italic") newNode.italic = true;
        else delete newNode.italic;
      }
      if (styles.textDecoration !== undefined) {
        if (styles.textDecoration.includes("underline")) newNode.underline = true;
        else delete newNode.underline;
      }
      return newNode;
    }
    if (node.children) {
      const newNode = {
        ...node,
        children: applyStylesToNodes(node.children, styles),
      };
      if (styles.textAlign !== undefined) newNode.textAlign = styles.textAlign;
      return newNode;
    }
    return node;
  });
};

const applyMarkToAllLeaves = (content, property, value) => {
  if (!content) return content;

  return content.map((block) => ({
    ...block,
    children: block.children
      ? block.children.map((child) => ({
        ...child,
        [property]: value,
      }))
      : [],
  }));
};

/* =========================
   DEFAULT LAYOUT
========================= */
const createDefaultTextLayers = () => [
  {
    id: nanoid(),
    type: "text",
    content: createInitialValue(),
    placeholder: "Double click to add title",
    hasBeenEdited: false,
    x: 180,
    y: 160,
    width: 600,
    height: 80,
    fontSize: 48,
    fontFamily: "Arial",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    textAlign: "center",
    color: "#000000",
    link: "",
    rotation: 0,
  },
  {
    id: nanoid(),
    type: "text",
    content: createInitialValue(),
    placeholder: "Double click to add subtitle",
    hasBeenEdited: false,
    x: 180,
    y: 280,
    width: 600,
    height: 60,
    fontSize: 24,
    fontFamily: "Arial",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    textAlign: "center",
    color: "#000000",
    link: "",
    rotation: 0,
  },
];

/* =========================
   STORE DEFINITION
========================= */

const usePresentationStore = create((set, get) => {
  const initialSlideId = nanoid();

  // Listen to history changes to ensure reactivity in UI components
  useHistoryStore.subscribe((historyState) => {
    set({
      pastCount: historyState.past.length,
      futureCount: historyState.future.length,
    });
  });

  return {
    pastCount: 0,
    futureCount: 0,

    /* =========================
       SLIDES STATE
    ========================= */
    slides: [
      {
        id: initialSlideId,
        background: "#ffffff",
        layers: createDefaultTextLayers(),
      },
    ],
    activeSlideId: initialSlideId,
    canvasZoom: 1.0,

    /* =========================
       PRESENTATION METADATA
    ========================= */
    presentationId: null,
    title: "Untitled Presentation",
    isSaving: false,

    setPresentationId: (id) => set({ presentationId: id }),
    setTitle: (title) => set({ title }),
    updatePresentationState: (updates) => set(updates),

    /* =========================
       LOAD / RESET
    ========================= */
    setPresentation: (data) => {
      const rawSlides = data.slides || (data.data && data.data.slides) || [];
      const slides = rawSlides.map((slide) => normalizeSlide(slide));

      const id =
        data.presentationId ||
        data._id ||
        data.id ||
        (data.data && (data.data._id || data.data.id));

      set({
        presentationId: id,
        title: data.title || (data.data && data.data.title) || "Untitled Presentation",
        slides: slides,
        activeSlideId: slides.length > 0 ? slides[0].id : null,
        selectedLayerId: null,
      });
      useHistoryStore.getState().clear();
    },

    resetPresentation: () => {
      const newSlideId = nanoid();
      const defaultSlides = [
        {
          id: newSlideId,
          background: "#ffffff",
          layers: createDefaultTextLayers(),
        },
      ];

      set({
        presentationId: null,
        title: "Untitled Presentation",
        slides: defaultSlides,
        activeSlideId: newSlideId,
        selectedLayerId: null,
      });
      useHistoryStore.getState().clear();
    },

    setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),

    /* =========================
       HISTORY
    ========================= */
    saveToHistory: () => {
      useHistoryStore.getState().saveToHistory(get().slides);
    },

    undo: () => {
      const newSlides = useHistoryStore.getState().undo(get().slides);
      if (newSlides) {
        set({ slides: newSlides });
      }
    },

    redo: () => {
      const newSlides = useHistoryStore.getState().redo(get().slides);
      if (newSlides) {
        set({ slides: newSlides });
      }
    },

    get past() {
      return useHistoryStore.getState().past;
    },
    get future() {
      return useHistoryStore.getState().future;
    },

    /* =========================
       SLIDE MANIPULATION
    ========================= */
    setActiveSlide: (slideId) => {
      set({ activeSlideId: slideId, selectedLayerId: null });
    },

    addSlide: () => {
      get().saveToHistory();
      set((state) => {
        const newSlideId = nanoid();
        return {
          slides: [
            ...state.slides,
            {
              id: newSlideId,
              background: "#ffffff",
              layers: createDefaultTextLayers(),
            },
          ],
          activeSlideId: newSlideId,
          selectedLayerId: null,
        };
      });
    },

    appendSlide: (slideData) => {
      get().saveToHistory();
      const normalizedSlide = normalizeSlide(slideData, true);
      // Flag this slide so CanvasShell runs auto-stack exactly once for AI content.
      _aiGeneratedSlideIds.add(normalizedSlide.id);
      set((state) => ({
        slides: [...state.slides, normalizedSlide],
        activeSlideId: normalizedSlide.id,
        selectedLayerId: null,
      }));
    },

    updateSlide: (slideId, slideData) => {
      get().saveToHistory();
      const normalizedSlide = normalizeSlide(slideData);
      set((state) => ({
        slides: state.slides.map((s) =>
          s.id === slideId ? { ...normalizedSlide, id: slideId } : s
        ),
      }));
    },

    appendLayersToSlide: (slideId, layersData) => {
      if (!layersData) return;
      get().saveToHistory();
      // Flag this slide so CanvasShell runs auto-stack exactly once for AI content.
      _aiGeneratedSlideIds.add(slideId);

      // Safe extraction of layers
      const incomingLayers = Array.isArray(layersData.layers)
        ? layersData.layers
        : Array.isArray(layersData)
          ? layersData
          : [];

      set((state) => ({
        slides: state.slides.map((slide) => {
          if (slide.id !== slideId) return slide;

          const newNormalizedLayers = incomingLayers.map((layer) => {
            // Regeneration of unique IDs to prevent collisions
            return normalizeLayer({
              ...layer,
              id: nanoid(),
            });
          });

          return {
            ...slide,
            layers: [...(slide.layers || []), ...newNormalizedLayers],
          };
        }),
      }));
    },

    deleteSlide: (slideId) => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();
      if (slides.length === 1) return;

      const updatedSlides = slides.filter((slide) => slide.id !== slideId);

      set({
        slides: updatedSlides,
        activeSlideId:
          activeSlideId === slideId ? updatedSlides[0].id : activeSlideId,
        selectedLayerId: null,
      });
    },

    duplicateSlide: (slideId) => {
      get().saveToHistory();
      const { slides } = get();
      const slideIndex = slides.findIndex((s) => s.id === slideId);
      if (slideIndex === -1) return;

      const slideToDuplicate = slides[slideIndex];
      const duplicatedSlide = {
        ...slideToDuplicate,
        id: nanoid(),
        layers: slideToDuplicate.layers.map((layer) => ({
          ...layer,
          id: nanoid(),
        })),
      };

      const updatedSlides = [...slides];
      updatedSlides.splice(slideIndex + 1, 0, duplicatedSlide);

      set({
        slides: updatedSlides,
        activeSlideId: duplicatedSlide.id,
        selectedLayerId: null,
      });
    },

    moveSlide: (dragIndex, hoverIndex, saveHistory = false) => {
      if (saveHistory) get().saveToHistory();
      const { slides } = get();
      if (
        dragIndex < 0 ||
        dragIndex >= slides.length ||
        hoverIndex < 0 ||
        hoverIndex >= slides.length
      ) {
        return;
      }

      const draggedSlide = slides[dragIndex];
      const updatedSlides = [...slides];
      updatedSlides.splice(dragIndex, 1);
      updatedSlides.splice(hoverIndex, 0, draggedSlide);

      set({ slides: updatedSlides });
    },

    updateSlideBackground: (slideId, color, saveHistory = true) => {
      if (saveHistory) get().saveToHistory();
      set((state) => ({
        slides: state.slides.map((slide) =>
          slide.id === slideId ? { ...slide, background: color } : slide
        ),
      }));
    },

    setSlideBackgroundImage: (slideId, imageSrc, imageKey, saveHistory = true) => {
      if (saveHistory) get().saveToHistory();
      set((state) => ({
        slides: state.slides.map((slide) =>
          slide.id === slideId
            ? {
              ...slide,
              backgroundImage: imageSrc,
              backgroundKey: imageKey,
              backgroundType: imageSrc ? "image" : undefined,
            }
            : slide
        ),
      }));
    },

    /* =========================
       LAYER MANAGEMENT (GENERAL)
    ========================= */
    selectedLayerId: null,
    editingLayerId: null,
    editingCell: null,
    activeEditor: null,
    selectionMarks: {},

    setSelectedLayer: (layerId) => {
      set({ selectedLayerId: layerId, editingLayerId: null, editingCell: null });
    },

    clearSelection: () => {
      set({ selectedLayerId: null, editingLayerId: null, editingCell: null });
    },

    setEditingLayer: (layerId) => {
      set({ editingLayerId: layerId });
    },

    clearEditingLayer: () => {
      set({ editingLayerId: null, selectionMarks: {} });
    },

    setSelectionMarks: (marks) => {
      set({ selectionMarks: marks });
    },

    setEditingCell: (cell) => set({ editingCell: cell }),
    setActiveEditor: (editor) => set({ activeEditor: editor }),

    getSelectedLayer: () => {
      const { slides, activeSlideId, selectedLayerId } = get();
      const slide = slides.find((s) => s.id === activeSlideId);
      return slide?.layers?.find((l) => l.id === selectedLayerId) || null;
    },

    deleteSelectedLayer: () => {
      get().saveToHistory();
      const { slides, activeSlideId, selectedLayerId } = get();
      if (!selectedLayerId) return;

      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.filter((l) => l.id !== selectedLayerId),
            }
            : slide
        ),
        selectedLayerId: null,
      });
    },

    copySelectedLayer: () => {
      get().saveToHistory();
      const { slides, activeSlideId, selectedLayerId } = get();
      if (!selectedLayerId) return;

      const slide = slides.find((s) => s.id === activeSlideId);
      if (!slide) return;

      const layerToCopy = slide.layers.find((l) => l.id === selectedLayerId);
      if (!layerToCopy) return;

      const copiedLayer = {
        ...JSON.parse(JSON.stringify(layerToCopy)),
        id: crypto.randomUUID(),
        x: layerToCopy.x + 20,
        y: layerToCopy.y + 20,
      };

      set({
        slides: slides.map((s) =>
          s.id === activeSlideId
            ? { ...s, layers: [...s.layers, copiedLayer] }
            : s
        ),
        selectedLayerId: copiedLayer.id,
      });
    },

    updateLayerPosition: (layerId, x, y) => {
      const { slides, activeSlideId } = get();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId ? { ...layer, x, y } : layer
              ),
            }
            : slide
        ),
      });
    },

    updateLayerRotation: (layerId, rotation) => {
      const { slides, activeSlideId } = get();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId ? { ...layer, rotation } : layer
              ),
            }
            : slide
        ),
      });
    },

    rotateLayer: (layerId, degrees) => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId
                  ? { ...layer, rotation: (layer.rotation || 0) + degrees }
                  : layer
              ),
            }
            : slide
        ),
      });
    },

    /* =========================
       TEXT LAYERS
    ========================= */
    addTextLayer: () => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: [
                ...slide.layers,
                {
                  id: nanoid(),
                  type: "text",
                  x: 120,
                  y: 120,
                  width: 260,
                  height: 80,
                  content: createInitialValue(),
                  placeholder: "Double click to add text",
                  hasBeenEdited: false,
                  fontSize: 24,
                  color: "#000000",
                  fontFamily: "Arial",
                  fontWeight: "normal",
                  fontStyle: "normal",
                  textDecoration: "none",
                  textAlign: "left",
                  link: "",
                  rotation: 0,
                },
              ],
            }
            : slide
        ),
      });
    },

    updateTextLayer: (layerId, updates, saveHistory = true) => {
      if (saveHistory) get().saveToHistory();
      const { slides, activeSlideId } = get();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId ? { ...layer, ...updates } : layer
              ),
            }
            : slide
        ),
      });
    },

    applyGlobalTextStyle: (layerId, style, saveHistory = true) => {
      if (saveHistory) get().saveToHistory();
      set((state) => {
        const slides = state.slides.map((slide) => ({
          ...slide,
          layers: slide.layers.map((layer) => {
            if (layer.id !== layerId) return layer;
            let updatedLayer = { ...layer, ...style };

            if (layer.type === "text" && layer.content) {
              // Build a flat map of Slate-mark keys → values from the style object
              const markUpdates = {};
              Object.entries(style).forEach(([key, value]) => {
                if (key === "fontWeight") {
                  markUpdates.bold = value === "bold" ? true : undefined;
                } else if (key === "fontStyle") {
                  markUpdates.italic = value === "italic" ? true : undefined;
                } else if (key === "textDecoration") {
                  markUpdates.underline = value === "underline" ? true : undefined;
                } else if (["color", "fontFamily", "fontSize"].includes(key)) {
                  markUpdates[key] = value;
                }
              });

              const textAlign = style.textAlign;
              const hasMarkUpdates = Object.keys(markUpdates).length > 0;

              // Recursively walk every node in the Slate tree.
              // - True leaf: has a "text" string property → apply inline marks.
              // - Element: has a "children" array → recurse into children; set textAlign if needed.
              // - Malformed AI node { text:"...", children:[] }: treat as leaf (text takes priority).
              const applyToNode = (node) => {
                // It's a leaf if it has a "text" string (even if it also has empty children)
                if (typeof node.text === "string") {
                  if (!hasMarkUpdates) return node;
                  const newNode = { ...node };
                  Object.entries(markUpdates).forEach(([k, v]) => {
                    if (v === undefined) delete newNode[k];
                    else newNode[k] = v;
                  });
                  return newNode;
                }

                // It's an element node with children to recurse into
                if (Array.isArray(node.children)) {
                  const newNode = {
                    ...node,
                    children: node.children.map(applyToNode),
                  };
                  if (textAlign !== undefined) newNode.textAlign = textAlign;
                  return newNode;
                }

                // Unknown node shape — return as-is
                return node;
              };

              updatedLayer.content = layer.content.map(applyToNode);
            }
            return updatedLayer;
          }),
        }));
        return { slides };
      });
    },

    toggleBold: (layerId) => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId
                  ? { ...layer, fontWeight: layer.fontWeight === "bold" ? "normal" : "bold" }
                  : layer
              ),
            }
            : slide
        ),
      });
    },

    toggleItalic: (layerId) => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId
                  ? { ...layer, fontStyle: layer.fontStyle === "italic" ? "normal" : "italic" }
                  : layer
              ),
            }
            : slide
        ),
      });
    },

    toggleUnderline: (layerId) => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId
                  ? {
                    ...layer,
                    textDecoration: layer.textDecoration === "underline" ? "none" : "underline",
                  }
                  : layer
              ),
            }
            : slide
        ),
      });
    },

    setTextAlignment: (layerId, align) => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId ? { ...layer, textAlign: align } : layer
              ),
            }
            : slide
        ),
      });
    },

    resizeTextBox: (layerId, width, height) => {
      const { slides, activeSlideId } = get();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId
                  ? { ...layer, width: Math.max(40, width), height: Math.max(30, height) }
                  : layer
              ),
            }
            : slide
        ),
      });
    },

    /* =========================
       SHAPE LAYERS
    ========================= */
    addShapeLayer: (shapeType) => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? { ...slide, layers: [...slide.layers, createShapeLayer(shapeType)] }
            : slide
        ),
      });
    },

    updateShapeLayer: (layerId, updates, saveHistory = true) => {
      if (saveHistory) get().saveToHistory();
      const { slides, activeSlideId } = get();

      // Safety: Clamp strokeWidth if it's being updated
      let safeUpdates = { ...updates };
      if (safeUpdates.strokeWidth !== undefined) {
        safeUpdates.strokeWidth = Math.max(0, Number(safeUpdates.strokeWidth));
      }

      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId ? { ...layer, ...safeUpdates } : layer
              ),
            }
            : slide
        ),
      });
    },

    /* =========================
       IMAGE LAYERS
    ========================= */
    addImageLayer: (src, imageUrl, imageKey) => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? { ...slide, layers: [...slide.layers, createImageLayer(src, imageUrl, imageKey)] }
            : slide
        ),
      });
    },

    updateLayerStyle: (layerId, updates, saveHistory = true) => {
      if (saveHistory) get().saveToHistory();
      const { slides, activeSlideId } = get();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId ? { ...layer, ...updates } : layer
              ),
            }
            : slide
        ),
      });
    },

    /* =========================
       ALIGNMENT & ORDERING
    ========================= */
    alignLayer: (layerId, alignment) => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();
      const slide = slides.find((s) => s.id === activeSlideId);
      if (!slide) return;

      const layer = slide.layers.find((l) => l.id === layerId);
      if (!layer) return;

      const SLIDE_WIDTH = 960;
      const SLIDE_HEIGHT = 540;
      const PADDING = 20;

      let newX = layer.x;
      let newY = layer.y;

      switch (alignment) {
        case "center":
          newX = (SLIDE_WIDTH - layer.width) / 2;
          newY = (SLIDE_HEIGHT - layer.height) / 2;
          break;
        case "top":
          newX = (SLIDE_WIDTH - layer.width) / 2;
          newY = PADDING;
          break;
        case "bottom":
          newX = (SLIDE_WIDTH - layer.width) / 2;
          newY = SLIDE_HEIGHT - layer.height - PADDING;
          break;
        case "left":
          newX = PADDING;
          newY = (SLIDE_HEIGHT - layer.height) / 2;
          break;
        case "right":
          newX = SLIDE_WIDTH - layer.width - PADDING;
          newY = (SLIDE_HEIGHT - layer.height) / 2;
          break;
        case "top-left":
          newX = PADDING;
          newY = PADDING;
          break;
        case "top-right":
          newX = SLIDE_WIDTH - layer.width - PADDING;
          newY = PADDING;
          break;
        case "bottom-left":
          newX = PADDING;
          newY = SLIDE_HEIGHT - layer.height - PADDING;
          break;
        case "bottom-right":
          newX = SLIDE_WIDTH - layer.width - PADDING;
          newY = SLIDE_HEIGHT - layer.height - PADDING;
          break;
        default:
          return;
      }

      set({
        slides: slides.map((s) =>
          s.id === activeSlideId
            ? {
              ...s,
              layers: s.layers.map((l) => (l.id === layerId ? { ...l, x: newX, y: newY } : l)),
            }
            : s
        ),
      });
    },

    reorderLayer: (layerId, direction) => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();
      const slide = slides.find((s) => s.id === activeSlideId);
      if (!slide) return;

      const layerIndex = slide.layers.findIndex((l) => l.id === layerId);
      if (layerIndex === -1) return;

      if (direction === "backward" && layerIndex === 0) return;
      if (direction === "forward" && layerIndex === slide.layers.length - 1) return;

      const newLayers = [...slide.layers];
      const targetIndex = direction === "forward" ? layerIndex + 1 : layerIndex - 1;
      [newLayers[layerIndex], newLayers[targetIndex]] = [newLayers[targetIndex], newLayers[layerIndex]];

      set({
        slides: slides.map((s) => (s.id === activeSlideId ? { ...s, layers: newLayers } : s)),
      });
    },

    /* =========================
       TABLE LAYERS
    ========================= */
    addTableLayer: (rows = 3, cols = 3) => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();
      const cells = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
          content: createInitialValue(),
          fontFamily: "Arial",
          fontSize: 14,
          color: "#000000",
          textAlign: "center",
        }))
      );

      const newLayer = {
        id: nanoid(),
        type: "table",
        x: 200,
        y: 150,
        width: 400,
        height: 200,
        rows,
        cols,
        cells,
        tableBgColor: "transparent",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        fontSize: 14,
        color: "#000000",
        textAlign: "center",
        rotation: 0,
      };

      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? { ...slide, layers: [...slide.layers, newLayer] }
            : slide
        ),
        selectedLayerId: newLayer.id,
      });
    },

    updateTableCell: (tableId, row, col, updates, saveHistory = false) => {
      if (saveHistory) get().saveToHistory();
      set((state) => ({
        slides: state.slides.map((slide) =>
          slide.id !== state.activeSlideId
            ? slide
            : {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id !== tableId
                  ? layer
                  : {
                    ...layer,
                    cells: layer.cells.map((rArr, rIndex) =>
                      rIndex !== row
                        ? rArr
                        : rArr.map((cell, cIndex) =>
                          cIndex !== col ? cell : { ...cell, ...updates }
                        )
                    ),
                  }
              ),
            }
        ),
      }));
    },

    addTableRow: (layerId) => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId && layer.type === "table"
                  ? {
                    ...layer,
                    rows: layer.rows + 1,
                    cells: [
                      ...layer.cells.map((row) => row.map((cell) => ({ ...cell }))),
                      Array.from({ length: layer.cols }, () => ({
                        content: createInitialValue(),
                        fontFamily: "Arial",
                        fontSize: 14,
                        color: "#000000",
                        textAlign: "center",
                      })),
                    ],
                  }
                  : layer
              ),
            }
            : slide
        ),
      });
    },

    addTableColumn: (layerId) => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId && layer.type === "table"
                  ? {
                    ...layer,
                    cols: layer.cols + 1,
                    cells: layer.cells.map((row) => [
                      ...row.map((cell) => ({ ...cell })),
                      {
                        content: createInitialValue(),
                        fontFamily: "Arial",
                        fontSize: 14,
                        color: "#000000",
                        textAlign: "center",
                      },
                    ]),
                  }
                  : layer
              ),
            }
            : slide
        ),
      });
    },

    removeTableRow: (layerId) => {
      const { slides, activeSlideId } = get();
      const slide = slides.find((s) => s.id === activeSlideId);
      const layer = slide?.layers.find((l) => l.id === layerId);
      if (!layer || layer.type !== "table" || layer.rows <= 1) return;

      get().saveToHistory();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.map((l) =>
                l.id === layerId
                  ? {
                    ...l,
                    rows: l.rows - 1,
                    cells: l.cells.slice(0, -1).map((row) => row.map((cell) => ({ ...cell }))),
                  }
                  : l
              ),
            }
            : slide
        ),
      });
    },

    removeTableColumn: (layerId) => {
      const { slides, activeSlideId } = get();
      const slide = slides.find((s) => s.id === activeSlideId);
      const layer = slide?.layers.find((l) => l.id === layerId);
      if (!layer || layer.type !== "table" || layer.cols <= 1) return;

      get().saveToHistory();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.map((l) =>
                l.id === layerId
                  ? {
                    ...l,
                    cols: l.cols - 1,
                    cells: l.cells.map((row) =>
                      row.slice(0, -1).map((cell) => ({ ...cell }))
                    ),
                  }
                  : l
              ),
            }
            : slide
        ),
      });
    },

    migrateTextLayers: () => {
      set((state) => ({
        slides: state.slides.map((slide) => normalizeSlide(slide)),
      }));
    },
    normalizeColor,
  };
});

export default usePresentationStore;
