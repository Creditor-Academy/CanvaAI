import { create } from "zustand";
import { nanoid } from "nanoid";
import { createShapeLayer, createImageLayer } from "../models/presentationModel";
import useHistoryStore from "./useHistoryStore";
import { convertTextToSlate, createInitialValue } from "../editors/slate/slateHelpers";

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

/* =========================
   DEFAULT LAYOUT
========================= */
const createDefaultTextLayers = () => [
  {
    id: nanoid(),
    type: "text",
    content: createInitialValue(),
    placeholder: "Click to add title",
    hasBeenEdited: false,
    x: 120,
    y: 160,
    width: 600,
    height: 80,
    fontSize: 48,
    fontFamily: "Arial",
    fontWeight: "bold",
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
    placeholder: "Click to add subtitle",
    hasBeenEdited: false,
    x: 180,
    y: 260,
    width: 600,
    height: 60,
    fontSize: 24,
    fontFamily: "Arial",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    textAlign: "center",
    color: "#343b44ff",
    link: "",
    rotation: 0,
  },
];


const usePresentationStore = create((set, get) => {
  const initialSlideId = nanoid();

  // Listen to history changes to ensure reactivity in UI components
  // that only subscribe to usePresentationStore.
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
       SLIDES
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

    setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),

    // History for undo/redo
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

    // Simplified access for TopBar
    get past() {
      return useHistoryStore.getState().past;
    },

    get future() {
      return useHistoryStore.getState().future;
    },

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

    deleteSlide: (slideId) => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();
      if (slides.length === 1) return;

      const updatedSlides = slides.filter((slide) => slide.id !== slideId);

      set({
        slides: updatedSlides,
        activeSlideId:
          activeSlideId === slideId
            ? updatedSlides[0].id
            : activeSlideId,
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

    updateSlideBackground: (slideId, color, saveHistory = true) => {
      if (saveHistory) get().saveToHistory();
      set((state) => ({
        slides: state.slides.map((slide) =>
          slide.id === slideId ? { ...slide, background: color } : slide
        ),
      }));
    },

    setSlideBackgroundImage: (slideId, imageSrc, saveHistory = true) => {
      if (saveHistory) get().saveToHistory();
      set((state) => ({
        slides: state.slides.map((slide) =>
          slide.id === slideId ? { ...slide, backgroundImage: imageSrc } : slide
        ),
      }));
    },

    /* =========================
       LAYERS (GENERAL)
    ========================= */
    selectedLayerId: null,

    setSelectedLayer: (layerId) => {
      set({ selectedLayerId: layerId, editingLayerId: null });
    },

    clearSelection: () => {
      set({ selectedLayerId: null, editingLayerId: null });
    },

    /* =========================
       EDITING MODE
    ========================= */
    editingLayerId: null,
    selectionMarks: {},

    setEditingLayer: (layerId) => {
      set({ editingLayerId: layerId });
    },

    clearEditingLayer: () => {
      set({ editingLayerId: null, selectionMarks: {} });
    },

    setSelectionMarks: (marks) => {
      set({ selectionMarks: marks });
    },

    getSelectedLayer: () => {
      const { slides, activeSlideId, selectedLayerId } = get();
      const slide = slides.find((s) => s.id === activeSlideId);
      return slide?.layers.find((l) => l.id === selectedLayerId) || null;
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
            ? {
              ...s,
              layers: [...s.layers, copiedLayer],
            }
            : s
        ),
        selectedLayerId: copiedLayer.id,
      });
    },

    updateLayerPosition: (layerId, x, y) => {
      // NOTE: saveToHistory should be called by the UI component onMouseDown
      // to avoid history spam during dragging.
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
      // NOTE: saveToHistory should be called by the UI component onMouseDown
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

    // Relative rotation for properties panel button
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
                  placeholder: "Click to add text",
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

    applyGlobalTextStyle: (layerId, styles) => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();

      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.map((layer) => {
                if (layer.id === layerId && layer.type === "text") {
                  // Merge styles into layer defaults AND content nodes
                  return {
                    ...layer,
                    ...styles,
                    content: applyStylesToNodes(layer.content || [], styles),
                  };
                }
                return layer;
              }),
            }
            : slide
        ),
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
                  ? { ...layer, textDecoration: layer.textDecoration === "underline" ? "none" : "underline" }
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
      // NOTE: saveToHistory should be called by the UI component onMouseDown
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
            ? {
              ...slide,
              layers: [...slide.layers, createShapeLayer(shapeType)],
            }
            : slide
        ),
      });
    },

    updateShapeLayer: (layerId, updates, saveHistory = true) => {
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
       IMAGE LAYERS
    ========================= */
    addImageLayer: (src) => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();
      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: [...slide.layers, createImageLayer(src)],
            }
            : slide
        ),
      });
    },

    /* =========================
       STYLE UPDATES (GENERIC)
    ========================= */
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
              layers: s.layers.map((l) =>
                l.id === layerId ? { ...l, x: newX, y: newY } : l
              ),
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

      [newLayers[layerIndex], newLayers[targetIndex]] = [
        newLayers[targetIndex],
        newLayers[layerIndex],
      ];

      set({
        slides: slides.map((s) =>
          s.id === activeSlideId ? { ...s, layers: newLayers } : s
        ),
      });
    },
    /* =========================
       TABLE LAYERS
    ========================= */
    addTableLayer: (rows = 3, cols = 3) => {
      get().saveToHistory();
      const { slides, activeSlideId } = get();

      const cells = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => "")
      );

      const newLayer = {
        id: crypto.randomUUID(),
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

    updateTableCell: (layerId, row, col, value, saveHistory = true) => {
      // Modified to support optional history save
      if (saveHistory) get().saveToHistory();
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
                    cells: layer.cells.map((r, ri) =>
                      r.map((c, ci) =>
                        ri === row && ci === col ? value : c
                      )
                    ),
                  }
                  : layer
              ),
            }
            : slide
        ),
      });
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
                      ...layer.cells,
                      Array.from({ length: layer.cols }, () => ""),
                    ],
                    height: layer.height + (layer.height / layer.rows), // Heuristic: increase height proportionally
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
                    cells: layer.cells.map((row) => [...row, ""]),
                    width: layer.width + (layer.width / layer.cols), // Heuristic: increase width proportionally
                  }
                  : layer
              ),
            }
            : slide
        ),
      });
    },
    // Migration helper (call this on slide load if needed, or perform lazy migration)
    migrateTextLayers: () => {
      set((state) => ({
        slides: state.slides.map((slide) => ({
          ...slide,
          layers: slide.layers.map((layer) => {
            if (layer.type === "text" && layer.text !== undefined && !layer.content) {
              const { text, ...rest } = layer;
              return {
                ...rest,
                content: convertTextToSlate(text),
              };
            }
            return layer;
          }),
        })),
      }));
    },
  };
});

export default usePresentationStore;
