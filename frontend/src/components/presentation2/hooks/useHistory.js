import { useState, useCallback } from 'react';

/**
 * useHistory Hook
 * 
 * Provides undo/redo functionality for presentation state.
 * Maintains a history stack of presentation states.
 * 
 * @param {Object} initialState - Initial presentation state
 * @returns {Object} { state, setState, undo, redo, canUndo, canRedo }
 */
export const useHistory = (initialState) => {
  const [history, setHistory] = useState([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const currentState = history[historyIndex];
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  /**
   * Updates state and adds to history
   * @param {Object|Function} newStateOrUpdater - New state or updater function
   */
  const setState = useCallback((newStateOrUpdater) => {
    setHistory((prevHistory) => {
      const current = prevHistory[historyIndex];
      const newState = typeof newStateOrUpdater === 'function'
        ? newStateOrUpdater(current)
        : newStateOrUpdater;

      // Remove any future history if we're not at the end
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push(newState);
      
      // Limit history size to prevent memory issues
      const MAX_HISTORY = 50;
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
        setHistoryIndex((prev) => prev - 1);
      } else {
        setHistoryIndex((prev) => prev + 1);
      }

      return newHistory;
    });
  }, [historyIndex]);

  /**
   * Undo to previous state
   */
  const undo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex((prev) => prev - 1);
    }
  }, [canUndo]);

  /**
   * Redo to next state
   */
  const redo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex((prev) => prev + 1);
    }
  }, [canRedo]);

  return {
    state: currentState,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
