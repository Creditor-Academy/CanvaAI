import { create } from "zustand";
import { nanoid } from "nanoid";
import { createShapeLayer } from "../models/presentationModel";

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
                    text: "Double click to edit",
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
                    ...updates,
                    hasBeenEdited: true,
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
                        color: link ? "#2563eb" : layer.color,
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
      }


  };
});

export default usePresentationStore;
