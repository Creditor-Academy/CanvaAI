import { useState, useCallback } from 'react';

/**
 * useSelection Hook
 * 
 * Manages selection state for layers on the canvas.
 * Supports single and multi-selection.
 * 
 * @returns {Object} { selectedIds, selectLayer, deselectLayer, clearSelection, isSelected }
 */
export const useSelection = () => {
  const [selectedIds, setSelectedIds] = useState([]);

  /**
   * Select a layer (replaces current selection)
   * @param {string} layerId
   * @param {boolean} multiSelect - If true, adds to selection instead of replacing
   */
  const selectLayer = useCallback((layerId, multiSelect = false) => {
    if (!layerId) {
      setSelectedIds([]);
      return;
    }

    if (multiSelect) {
      setSelectedIds((prev) => {
        if (prev.includes(layerId)) {
          return prev.filter((id) => id !== layerId);
        }
        return [...prev, layerId];
      });
    } else {
      setSelectedIds([layerId]);
    }
  }, []);

  /**
   * Deselect a specific layer
   * @param {string} layerId
   */
  const deselectLayer = useCallback((layerId) => {
    setSelectedIds((prev) => prev.filter((id) => id !== layerId));
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  /**
   * Check if a layer is selected
   * @param {string} layerId
   * @returns {boolean}
   */
  const isSelected = useCallback((layerId) => {
    return selectedIds.includes(layerId);
  }, [selectedIds]);

  return {
    selectedIds,
    selectLayer,
    deselectLayer,
    clearSelection,
    isSelected,
  };
};
