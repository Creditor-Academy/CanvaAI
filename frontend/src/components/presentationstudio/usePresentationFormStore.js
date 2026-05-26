import { create } from 'zustand';

const usePresentationFormStore = create((set) => ({
  tone: null,
  textAmount: 'medium',
  media: {
    enabled: true,
    style: 'realistic',
  },
  selectedTheme: null,

  setTone: (tone) => set({ tone }),
  setTextAmount: (value) => set({ textAmount: value }),
  setMediaStyle: (style) =>
    set((state) => ({
      media: {
        ...state.media,
        style,
      },
    })),
  setMediaEnabled: (enabled) =>
    set((state) => ({
      media: {
        ...state.media,
        enabled,
      },
    })),
  setTheme: (theme) => set({ selectedTheme: theme }),

  resetForm: () =>
    set({
      tone: null,
      textAmount: 'medium',
      media: {
        enabled: true,
        style: 'realistic',
      },
      selectedTheme: null,
    }),
}));

export default usePresentationFormStore;
