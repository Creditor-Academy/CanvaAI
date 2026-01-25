import { create } from "zustand";
import { nanoid } from "nanoid";

const usePresentationStore = create((set, get) => {
  const initialSlideId = nanoid();

  return {
    // --------------------
    // SLIDES
    // --------------------
    slides: [
      {
        id: initialSlideId,
        background: "#ffffff",
        layers: [],
      },
    ],

    activeSlideId: initialSlideId,

    setActiveSlide: (slideId) => {
      set({ activeSlideId: slideId });
    },

    addSlide: () => {
      const newSlide = {
        id: nanoid(),
        background: "#ffffff",
        layers: [],
      };

      set((state) => ({
        slides: [...state.slides, newSlide],
        activeSlideId: newSlide.id,
      }));
    },

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

    // --------------------
    // TEXT LAYERS
    // --------------------
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
                    // ✅ Auto styles like Google Slides
                    color: link ? "#2563eb" : "#000000",
                    fontStyle: link ? "italic" : "normal",
                    textDecoration: link ? "underline" : "none",
                  }
                : layer
            ),
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
                    ? { ...layer, ...updates }
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

    // --------------------
    // SELECTION
    // --------------------
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



  };
});

export default usePresentationStore;