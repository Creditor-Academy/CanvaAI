import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for canvas interactions (drag, resize, rotate)
 */
export const useCanvasInteractions = (
  layers,
  setLayers,
  selectedLayer,
  setSelectedLayer,
  selectedTool,
  getCanvasPoint,
  saveToHistory
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, layerId: null });
  const [isRotating, setIsRotating] = useState(false);
  const [rotateStart, setRotateStart] = useState({ cx: 0, cy: 0, startAngleDeg: 0, startRotation: 0, layerId: null });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseOverCanvas, setIsMouseOverCanvas] = useState(false);

  const handleMouseDown = useCallback((e, layerId) => {
    if (selectedTool === 'select' && layerId) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setSelectedLayer(layerId);
    }
  }, [selectedTool, setSelectedLayer]);

  const handleResizeMouseDown = useCallback((e, layer) => {
    e.stopPropagation();
    if (selectedTool !== 'select') return;
    setIsResizing(true);
    setResizeStart({ 
      x: e.clientX, 
      y: e.clientY, 
      width: layer.width, 
      height: layer.height, 
      layerId: layer.id 
    });
    setSelectedLayer(layer.id);
  }, [selectedTool, setSelectedLayer]);

  const handleRotateMouseDown = useCallback((e, layer) => {
    e.stopPropagation();
    if (selectedTool !== 'select') return;
    const centerX = layer.x + layer.width / 2;
    const centerY = layer.y + layer.height / 2;
    const { x: mouseX, y: mouseY } = getCanvasPoint(e.clientX, e.clientY);
    const startAngleDeg = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
    setIsRotating(true);
    setRotateStart({ 
      cx: centerX, 
      cy: centerY, 
      startAngleDeg, 
      startRotation: layer.rotation || 0, 
      layerId: layer.id 
    });
    setSelectedLayer(layer.id);
  }, [selectedTool, getCanvasPoint, setSelectedLayer]);

  const handleMouseMove = useCallback((e) => {
    if (isRotating && rotateStart.layerId) {
      const { x: mouseX, y: mouseY } = getCanvasPoint(e.clientX, e.clientY);
      const dx = mouseX - rotateStart.cx;
      const dy = mouseY - rotateStart.cy;
      const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
      let newRotation = rotateStart.startRotation + (angleDeg - rotateStart.startAngleDeg);
      if (e.shiftKey) {
        newRotation = Math.round(newRotation / 15) * 15;
      }
      if (newRotation >= 180) newRotation -= 360;
      if (newRotation < -180) newRotation += 360;
      setLayers(prevLayers => prevLayers.map(layer =>
        layer.id === rotateStart.layerId
          ? { ...layer, rotation: newRotation }
          : layer
      ));
      return;
    }

    if (isResizing && resizeStart.layerId) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      setLayers(prevLayers => prevLayers.map(layer => {
        if (layer.id !== resizeStart.layerId) return layer;
        const rawWidth = Math.max(10, resizeStart.width + deltaX);
        const rawHeight = Math.max(10, resizeStart.height + deltaY);
        const newWidth = Math.max(10, rawWidth);
        const newHeight = Math.max(10, rawHeight);
        return { ...layer, width: newWidth, height: newHeight };
      }));
      return;
    }

    if (isDragging && selectedLayer) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setLayers(prevLayers => prevLayers.map(layer => {
        if (layer.id !== selectedLayer) return layer;
        const nextX = layer.x + deltaX;
        const nextY = layer.y + deltaY;
        return { ...layer, x: nextX, y: nextY };
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, isResizing, isRotating, selectedLayer, dragStart, resizeStart, rotateStart, getCanvasPoint, setLayers]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setLayers(currentLayers => {
        saveToHistory(currentLayers);
        return currentLayers;
      });
    }
    if (isRotating) {
      setIsRotating(false);
      setRotateStart({ cx: 0, cy: 0, startAngleDeg: 0, startRotation: 0, layerId: null });
      setLayers(currentLayers => {
        saveToHistory(currentLayers);
        return currentLayers;
      });
    }
    if (isResizing) {
      setIsResizing(false);
      setResizeStart({ x: 0, y: 0, width: 0, height: 0, layerId: null });
      setLayers(currentLayers => {
        saveToHistory(currentLayers);
        return currentLayers;
      });
    }
  }, [isDragging, isResizing, isRotating, setLayers, saveToHistory]);

  useEffect(() => {
    if (isDragging || isResizing || isRotating) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, isRotating, handleMouseMove, handleMouseUp]);

  const handleCanvasMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
    setIsMouseOverCanvas(true);
  }, []);

  const handleCanvasMouseLeave = useCallback(() => {
    setIsMouseOverCanvas(false);
  }, []);

  const handleCanvasClick = useCallback((e, handleAddElement) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (selectedTool !== 'select' && !['brush', 'pen', 'eraser'].includes(selectedTool)) {
      handleAddElement(x, y);
    } else if (selectedTool === 'select') {
      setSelectedLayer(null);
    }
  }, [selectedTool, setSelectedLayer]);

  return {
    isDragging,
    isResizing,
    isRotating,
    mousePosition,
    isMouseOverCanvas,
    handleMouseDown,
    handleResizeMouseDown,
    handleRotateMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseLeave,
    handleCanvasClick
  };
};
