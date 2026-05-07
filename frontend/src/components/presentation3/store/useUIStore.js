import { create } from "zustand";

export const useUIStore = create((set) => ({
  isLoading: false,
  loadingType: null,
  loadingMessage: "",
  notifications: [],

  startLoading: (type = "top", message = "") =>
    set({
      isLoading: true,
      loadingType: type,
      loadingMessage: message,
    }),

  stopLoading: () =>
    set({
      isLoading: false,
      loadingType: null,
      loadingMessage: "",
    }),

  addNotification: (message, type = "success", duration = 3000) =>
    set((state) => {
      // Deduplicate: skip if a notification with the same message is already active
      if (state.notifications.some((n) => n.message === message)) return state;
      return {
        notifications: [
          ...state.notifications,
          {
            id: Date.now() + Math.random(),
            message,
            type,
            duration,
          },
        ],
      };
    }),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));