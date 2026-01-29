import { create } from "zustand";

const useHistoryStore = create((set, get) => ({
  past: [],
  future: [],

  saveToHistory: (currentState) => {
    set((state) => ({
      past: [...state.past, JSON.parse(JSON.stringify(currentState))],
      future: [],
    }));
  },

  undo: (currentState) => {
    const { past } = get();
    if (past.length === 0) return null;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    set({
      past: newPast,
      future: [JSON.parse(JSON.stringify(currentState)), ...get().future],
    });

    return previous;
  },

  redo: (currentState) => {
    const { future } = get();
    if (future.length === 0) return null;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      past: [...get().past, JSON.parse(JSON.stringify(currentState))],
      future: newFuture,
    });

    return next;
  },
}));

export default useHistoryStore;