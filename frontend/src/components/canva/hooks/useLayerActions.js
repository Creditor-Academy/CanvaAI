import { useState, useCallback } from 'react';
import { isHeadingLayer } from '../../../utils/textUtils';

/**
 * Custom hook for layer management operations
 */
export const useLayerActions = (layers, setLayers, saveToHistory) => {
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [draggedLayer, setDraggedLayer] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(-1);
  const [isLayerDragging, setIsLayerDragging] = useState(false);
  const [renamingLayerId, setRenamingLayerId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const handleLayerSelect = useCallback((layerId) => {
    setSelectedLayer(layerId);
  }, []);

  const handleLayerDelete = useCallback((layerId) => {
    const newLayers = layers.filter(l => l.id !== layerId);
    setLayers(newLayers);
    if (selectedLayer === layerId) {
      setSelectedLayer(null);
    }
    saveToHistory(newLayers);
  }, [layers, selectedLayer, setLayers, saveToHistory]);

  const handleLayerToggleVisibility = useCallback((layerId) => {
    const newLayers = layers.map(l =>
      l.id === layerId ? { ...l, visible: !l.visible } : l
    );
    setLayers(newLayers);
    saveToHistory(newLayers);
  }, [layers, setLayers, saveToHistory]);

  const handleLayerDuplicate = useCallback((layerId) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      const newLayer = {
        ...layer,
        id: Date.now(),
        x: layer.x + 20,
        y: layer.y + 20,
        name: layer.name + ' Copy'
      };
      const newLayers = [...layers, newLayer];
      setLayers(newLayers);
      setSelectedLayer(newLayer.id);
      saveToHistory(newLayers);
    }
  }, [layers, setLayers, saveToHistory]);

  const handleLayerMoveUp = useCallback((layerId) => {
    const currentIndex = layers.findIndex(l => l.id === layerId);
    if (currentIndex < layers.length - 1) {
      const newLayers = [...layers];
      [newLayers[currentIndex], newLayers[currentIndex + 1]] = [newLayers[currentIndex + 1], newLayers[currentIndex]];
      setLayers(newLayers);
      saveToHistory(newLayers);
    }
  }, [layers, setLayers, saveToHistory]);

  const handleLayerMoveDown = useCallback((layerId) => {
    const currentIndex = layers.findIndex(l => l.id === layerId);
    if (currentIndex > 0) {
      const newLayers = [...layers];
      [newLayers[currentIndex], newLayers[currentIndex - 1]] = [newLayers[currentIndex - 1], newLayers[currentIndex]];
      setLayers(newLayers);
      saveToHistory(newLayers);
    }
  }, [layers, setLayers, saveToHistory]);

  const startRenameLayer = useCallback((layer) => {
    setRenamingLayerId(layer.id);
    setRenameValue(layer.name || '');
  }, []);

  const commitRenameLayer = useCallback(() => {
    if (!renamingLayerId) return;
    const trimmed = renameValue.trim();
    const newLayers = layers.map(l => 
      l.id === renamingLayerId ? { ...l, name: trimmed || l.name } : l
    );
    setLayers(newLayers);
    saveToHistory(newLayers);
    setRenamingLayerId(null);
    setRenameValue('');
  }, [renamingLayerId, renameValue, layers, setLayers, saveToHistory]);

  // Drag and drop handlers
  const handleLayerDragStart = useCallback((e, layerId) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    setDraggedLayer(layerId);
    setIsLayerDragging(true);
  }, []);

  const handleLayerDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleLayerDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(-1);
    }
  }, []);

  const handleLayerDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    if (draggedLayer === null) return;

    const draggedIndex = layers.findIndex(l => l.id === draggedLayer);
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedLayer(null);
      setDragOverIndex(-1);
      setIsLayerDragging(false);
      return;
    }

    const newLayers = [...layers];
    const draggedLayerData = newLayers[draggedIndex];
    newLayers.splice(draggedIndex, 1);
    const newIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newLayers.splice(newIndex, 0, draggedLayerData);

    setLayers(newLayers);
    saveToHistory(newLayers);
    setDraggedLayer(null);
    setDragOverIndex(-1);
    setIsLayerDragging(false);
  }, [draggedLayer, layers, setLayers, saveToHistory]);

  const handleLayerDragEnd = useCallback(() => {
    setDraggedLayer(null);
    setDragOverIndex(-1);
    setIsLayerDragging(false);
  }, []);

  const getLayerPrimaryColor = useCallback((layer) => {
    if (!layer) return '#000000';
    if (layer.type === 'text') return layer.color || '#000000';
    if (layer.type === 'shape') return layer.fillColor || '#3182ce';
    if (layer.type === 'drawing') return layer.color || '#000000';
    if (layer.type === 'image') return layer.strokeColor || '#000000';
    return '#000000';
  }, []);

  const handleQuickColorChange = useCallback((colorValue) => {
    if (!selectedLayer) return;
    const newLayers = layers.map(l => {
      if (l.id !== selectedLayer) return l;
      if (l.type === 'text') return { ...l, color: colorValue };
      if (l.type === 'shape') return { ...l, fillColor: colorValue };
      if (l.type === 'drawing') return { ...l, color: colorValue };
      if (l.type === 'image') return { ...l, strokeColor: colorValue };
      return l;
    });
    setLayers(newLayers);
    saveToHistory(newLayers);
  }, [selectedLayer, layers, setLayers, saveToHistory]);

  return {
    selectedLayer,
    setSelectedLayer,
    draggedLayer,
    dragOverIndex,
    isLayerDragging,
    renamingLayerId,
    setRenamingLayerId,
    renameValue,
    setRenameValue,
    handleLayerSelect,
    handleLayerDelete,
    handleLayerToggleVisibility,
    handleLayerDuplicate,
    handleLayerMoveUp,
    handleLayerMoveDown,
    startRenameLayer,
    commitRenameLayer,
    handleLayerDragStart,
    handleLayerDragOver,
    handleLayerDragLeave,
    handleLayerDrop,
    handleLayerDragEnd,
    getLayerPrimaryColor,
    handleQuickColorChange
  };
};
