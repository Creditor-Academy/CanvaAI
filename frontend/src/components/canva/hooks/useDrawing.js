import { useState, useRef, useCallback } from 'react';
import { initialDrawingSettings } from '../state/initialState';

/**
 * Custom hook for drawing functionality
 */
export const useDrawing = (layers, setLayers, selectedTool, getCanvasPoint, saveToHistory, setSelectedLayer) => {
  const [drawingSettings, setDrawingSettings] = useState(initialDrawingSettings);
  const [drawingData, setDrawingData] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const lastPointRef = useRef(null);
  const lastTimeRef = useRef(0);

  const handleDrawingSettingsChange = useCallback((property, value) => {
    setDrawingSettings(prev => ({ ...prev, [property]: value }));
  }, []);

  const handleEraserAction = useCallback((x, y) => {
    const eraserRadius = drawingSettings.brushSize / 2;
    const layersToErase = layers.filter(layer => {
      if (!layer.visible || layer.type !== 'drawing') return false;
      const layerLeft = layer.x;
      const layerRight = layer.x + layer.width;
      const layerTop = layer.y;
      const layerBottom = layer.y + layer.height;
      const closestX = Math.max(layerLeft, Math.min(x, layerRight));
      const closestY = Math.max(layerTop, Math.min(y, layerBottom));
      const distance = Math.hypot(x - closestX, y - closestY);
      return distance <= eraserRadius;
    });

    if (layersToErase.length > 0) {
      const newLayers = layers.map(layer => {
        const layerToErase = layersToErase.find(l => l.id === layer.id);
        if (!layerToErase) return layer;
        const newPath = layer.path.filter(point => {
          const distance = Math.hypot(point.x - (x - layer.x), point.y - (y - layer.y));
          return distance > eraserRadius;
        });
        if (newPath.length < 2) return null;
        return { ...layer, path: newPath };
      }).filter(Boolean);

      setLayers(newLayers);
      saveToHistory(newLayers);
    }
  }, [layers, drawingSettings.brushSize, setLayers, saveToHistory]);

  const handleDrawingMouseDown = useCallback((e) => {
    if (!['brush', 'pen', 'eraser'].includes(selectedTool)) return;
    const { x, y } = getCanvasPoint(e.clientX, e.clientY);
    
    if (selectedTool === 'eraser') {
      setDrawingSettings(prev => ({ ...prev, isDrawing: true }));
      handleEraserAction(x, y);
      lastPointRef.current = { x, y, pressure: 1 };
      lastTimeRef.current = performance.now();
      return;
    }
    
    setDrawingSettings(prev => ({ ...prev, isDrawing: true }));
    const firstPoint = { x, y, pressure: 1 };
    lastPointRef.current = firstPoint;
    lastTimeRef.current = performance.now();
    setCurrentPath([firstPoint]);
  }, [selectedTool, getCanvasPoint, handleEraserAction]);

  const addPointToPath = useCallback((point) => {
    const now = performance.now();
    const minMs = 8;
    if (now - lastTimeRef.current < minMs) return false;
    
    const lastPoint = lastPointRef.current || point;
    const minDist = Math.max(1, drawingSettings.brushSize * 0.25);
    if (Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) < minDist) return false;
    
    lastTimeRef.current = now;
    lastPointRef.current = point;
    setCurrentPath(prev => [...prev, { ...point, pressure: 1 }]);
    return true;
  }, [drawingSettings.brushSize]);

  const finishDrawing = useCallback(() => {
    if (drawingSettings.isDrawing && selectedTool === 'eraser') {
      setDrawingSettings(prev => ({ ...prev, isDrawing: false }));
      return;
    }

    if (drawingSettings.isDrawing && currentPath.length > 1) {
      const minX = Math.min(...currentPath.map(p => p.x));
      const maxX = Math.max(...currentPath.map(p => p.x));
      const minY = Math.min(...currentPath.map(p => p.y));
      const maxY = Math.max(...currentPath.map(p => p.y));
      const padding = Math.max(drawingSettings.brushSize / 2, 5);
      const width = maxX - minX + padding * 2;
      const height = maxY - minY + padding * 2;

      if (width > 5 && height > 5) {
        const normalizedPath = currentPath.map(point => ({
          ...point,
          x: point.x - minX + padding,
          y: point.y - minY + padding
        }));

        const newDrawingPath = {
          id: Date.now(),
          type: 'drawing',
          name: `${drawingSettings.drawingMode.charAt(0).toUpperCase() + drawingSettings.drawingMode.slice(1)} Path`,
          path: normalizedPath,
          brushSize: drawingSettings.brushSize,
          color: drawingSettings.brushColor,
          mode: drawingSettings.drawingMode,
          opacity: drawingSettings.opacity,
          x: minX - padding,
          y: minY - padding,
          width: Math.max(width, 20),
          height: Math.max(height, 20),
          visible: true,
          locked: false
        };

        setLayers(prevLayers => {
          const newLayers = [...prevLayers, newDrawingPath];
          saveToHistory(newLayers);
          return newLayers;
        });
        setSelectedLayer(newDrawingPath.id);
      }
      setDrawingSettings(prev => ({ ...prev, isDrawing: false }));
      setCurrentPath([]);
    } else if (drawingSettings.isDrawing) {
      setDrawingSettings(prev => ({ ...prev, isDrawing: false }));
      setCurrentPath([]);
    }
  }, [drawingSettings, currentPath, selectedTool, setLayers, saveToHistory, setSelectedLayer]);

  return {
    drawingSettings,
    setDrawingSettings,
    drawingData,
    currentPath,
    setCurrentPath,
    handleDrawingSettingsChange,
    handleDrawingMouseDown,
    handleEraserAction,
    addPointToPath,
    finishDrawing
  };
};
