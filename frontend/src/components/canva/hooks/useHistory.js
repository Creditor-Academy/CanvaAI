import { useState, useCallback } from 'react';

/**
 * Custom hook for managing undo/redo history
 */
export const useHistory = (initialLayers = []) => {
  const [history, setHistory] = useState([[...initialLayers]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const saveToHistory = useCallback((newLayers) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push([...newLayers]);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const resetHistory = useCallback((newLayers = []) => {
    setHistory([[...newLayers]]);
    setHistoryIndex(0);
  }, []);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      return [...history[historyIndex - 1]];
    }
    return null;
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      return [...history[historyIndex + 1]];
    }
    return null;
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    history,
    historyIndex,
    saveToHistory,
    resetHistory,
    undo,
    redo,
    canUndo,
    canRedo
  };
};
