import { create } from "zustand";
import { nanoid } from "nanoid";
import { createShapeLayer, createImageLayer } from "../models/presentationModel";

/* =========================
   DEFAULT LAYOUT
========================= */
const createDefaultTextLayers = () => [
  {
    id: nanoid(),
    type: "text",
    text: "",
    placeholder: "Click to add title",
    hasBeenEdited: false,
    x: 120,
    y: 160,
    width: 720,
    height: 80,
    fontSize: 48,
    fontFamily: "Arial",
    fontWeight: "bold",
    fontStyle: "normal",
    textDecoration: "none",
    textAlign: "center",
    color: "#000000",
    link: "",
  },
  {
    id: nanoid(),
    type: "text",
    text: "",
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
    color: "#4b5563",
    link: "",
  },
];


const usePresentationStore = create((set, get) => {
  const initialSlideId = nanoid();

  return {
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

    setActiveSlide: (slideId) => {
      set({ activeSlideId: slideId, selectedLayerId: null });
    },

    addSlide: () =>
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
      }),

    deleteSlide: (slideId) => {
      const { slides, activeSlideId } = get();
      if (slides.length === 1) return;

      const updatedSlides = slides.filter(
        (slide) => slide.id !== slideId
      );

      set({
        slides: updatedSlides,
        activeSlideId:
          activeSlideId === slideId
            ? updatedSlides[0].id
            : activeSlideId,
        selectedLayerId: null,
      });
    },

    updateSlideBackground: (slideId, color) => {
      set((state) => ({
        slides: state.slides.map((slide) =>
          slide.id === slideId
            ? { ...slide, background: color }
            : slide
        ),
      }));
    },

    /* =========================
       TEXT LAYERS
    ========================= */
    addTextLayer: () => {
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
                  text: "",
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
                },
              ],
            }
            : slide
        ),
      });
    },

    updateTextLayer: (layerId, updates) => {
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
                    ...updates, // ✅ Respect caller intent
                  }
                  : layer
              ),
            }
            : slide
        ),
      });
    },



    toggleBold: (layerId) => {
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
                    fontWeight:
                      layer.fontWeight === "bold"
                        ? "normal"
                        : "bold",
                  }
                  : layer
              ),
            }
            : slide
        ),
      });
    },

    toggleItalic: (layerId) => {
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
                    fontStyle:
                      layer.fontStyle === "italic"
                        ? "normal"
                        : "italic",
                  }
                  : layer
              ),
            }
            : slide
        ),
      });
    },

    toggleUnderline: (layerId) => {
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
                    textDecoration:
                      layer.textDecoration === "underline"
                        ? "none"
                        : "underline",
                  }
                  : layer
              ),
            }
            : slide
        ),
      });
    },

    setTextLink: (layerId, link) => {
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
                    link,
                    color: link ? "#9aa3b6" : layer.color,
                    fontStyle: link ? "italic" : layer.fontStyle,
                    textDecoration: link
                      ? "underline"
                      : layer.textDecoration,
                  }
                  : layer
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
                  ? {
                    ...layer,
                    width: Math.max(40, width),
                    height: Math.max(30, height),
                  }
                  : layer
              ),
            }
            : slide
        ),
      });
    },

    setTextAlignment: (layerId, align) => {
      const { slides, activeSlideId } = get();

      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId
                  ? { ...layer, textAlign: align }
                  : layer
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
                layer.id === layerId
                  ? { ...layer, rotation }
                  : layer
              ),
            }
            : slide
        ),
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
                layer.id === layerId
                  ? { ...layer, x, y }
                  : layer
              ),
            }
            : slide
        ),
      });
    },

    alignLayer: (layerId, alignment) => {
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
        case 'center':
          newX = (SLIDE_WIDTH - layer.width) / 2;
          newY = (SLIDE_HEIGHT - layer.height) / 2;
          break;
        case 'top':
          newX = (SLIDE_WIDTH - layer.width) / 2;
          newY = PADDING;
          break;
        case 'bottom':
          newX = (SLIDE_WIDTH - layer.width) / 2;
          newY = SLIDE_HEIGHT - layer.height - PADDING;
          break;
        case 'left':
          newX = PADDING;
          newY = (SLIDE_HEIGHT - layer.height) / 2;
          break;
        case 'right':
          newX = SLIDE_WIDTH - layer.width - PADDING;
          newY = (SLIDE_HEIGHT - layer.height) / 2;
          break;
        case 'top-left':
          newX = PADDING;
          newY = PADDING;
          break;
        case 'top-right':
          newX = SLIDE_WIDTH - layer.width - PADDING;
          newY = PADDING;
          break;
        case 'bottom-left':
          newX = PADDING;
          newY = SLIDE_HEIGHT - layer.height - PADDING;
          break;
        case 'bottom-right':
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

    /* =========================
       SELECTION
    ========================= */
    selectedLayerId: null,

    setSelectedLayer: (layerId) => {
      set({ selectedLayerId: layerId });
    },

    clearSelection: () => {
      set({ selectedLayerId: null });
    },

    getSelectedLayer: () => {
      const { slides, activeSlideId, selectedLayerId } = get();
      const slide = slides.find(
        (s) => s.id === activeSlideId
      );
      return (
        slide?.layers.find(
          (l) => l.id === selectedLayerId
        ) || null
      );
    },

    deleteSelectedLayer: () => {
      const { slides, activeSlideId, selectedLayerId } = get();
      if (!selectedLayerId) return;

      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: slide.layers.filter(
                (l) => l.id !== selectedLayerId
              ),
            }
            : slide
        ),
        selectedLayerId: null,
      });
    },

    // Duplicate Slide
    duplicateSlide: (slideId) => {
      const { slides } = get();

      const slideIndex = slides.findIndex(
        (s) => s.id === slideId
      );

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
      updatedSlides.splice(
        slideIndex + 1,
        0,
        duplicatedSlide
      );

      set({
        slides: updatedSlides,
        activeSlideId: duplicatedSlide.id,
        selectedLayerId: null,
      });
    },


    // ADD SHAPE 
    addShapeLayer: (shapeType) => {
      const { slides, activeSlideId } = get();

      set({
        slides: slides.map(slide =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: [
                ...slide.layers,
                createShapeLayer(shapeType)
              ]
            }
            : slide
        )
      });
    },

    updateShapeLayer: (layerId, updates) => {
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
                    ...updates,
                  }
                  : layer
              ),
            }
            : slide
        ),
      });
    }


    ,

    /* =========================
       IMAGE LAYERS
    ========================= */
    addImageLayer: (src) => {
      const { slides, activeSlideId } = get();

      set({
        slides: slides.map((slide) =>
          slide.id === activeSlideId
            ? {
              ...slide,
              layers: [
                ...slide.layers,
                createImageLayer(src),
              ],
            }
            : slide
        ),
      });
    },

    setSlideBackgroundImage: (slideId, imageSrc) => {
      const { slides } = get();

      set({
        slides: slides.map((slide) =>
          slide.id === slideId
            ? {
              ...slide,
              backgroundImage: imageSrc,
            }
            : slide
        ),
      });
    },

    /* =========================
       LAYER ORDERING
    ========================= */
    reorderLayer: (layerId, direction) => {
      // direction: 'forward' | 'backward'
      const { slides, activeSlideId } = get();
      const slide = slides.find((s) => s.id === activeSlideId);
      if (!slide) return;

      const layerIndex = slide.layers.findIndex(
        (l) => l.id === layerId
      );
      if (layerIndex === -1) return;

      // Check bounds
      if (direction === "backward" && layerIndex === 0) return;
      if (
        direction === "forward" &&
        layerIndex === slide.layers.length - 1
      )
        return;

      const newLayers = [...slide.layers];
      const targetIndex =
        direction === "forward" ? layerIndex + 1 : layerIndex - 1;

      // Swap
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
  };
});

export default usePresentationStore;