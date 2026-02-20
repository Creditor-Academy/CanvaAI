import { create } from "zustand";

const useHistoryStore = create((set, get) => ({
  past: [],
  future: [],

  saveToHistory: (currentState) => {
    const { past } = get();
    const lastState = past.length > 0 ? past[past.length - 1] : null;

    // Deep comparison to avoid saving duplicate states (e.g., when clicking/selecting without changes)
    const serializedState = JSON.stringify(currentState);
    if (lastState && JSON.stringify(lastState) === serializedState) {
      return;
    }

    set((state) => ({
      past: [...state.past, JSON.parse(serializedState)],
      future: [],
    }));
  },

  undo: (currentState) => {
    const { past } = get();
    if (past.length === 0) return null;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    set((state) => ({
      past: newPast,
      future: [JSON.parse(JSON.stringify(currentState)), ...state.future],
    }));

    return previous;
  },

  redo: (currentState) => {
    const { future } = get();
    if (future.length === 0) return null;

    const next = future[0];
    const newFuture = future.slice(1);

    set((state) => ({
      past: [...state.past, JSON.parse(JSON.stringify(currentState))],
      future: newFuture,
    }));

    return next;
  },

  clear: () => {
    set({ past: [], future: [] });
  },
}));

export default useHistoryStore;