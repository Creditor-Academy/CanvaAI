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

  // Helper: Distance from point to line segment
  const distToSegment = (p, v, w) => {
    const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  };

  const handleEraserAction = useCallback((x, y) => {
    const eraserRadius = drawingSettings.brushSize / 2;
    const lastPoint = lastPointRef.current || { x, y };

    // Find layers that might be hit
    const minX = Math.min(x, lastPoint.x) - eraserRadius;
    const maxX = Math.max(x, lastPoint.x) + eraserRadius;
    const minY = Math.min(y, lastPoint.y) - eraserRadius;
    const maxY = Math.max(y, lastPoint.y) + eraserRadius;

    const layersToUpdate = layers.filter(layer => {
      if (!layer.visible || layer.type !== 'drawing') return false;
      const layerLeft = layer.x;
      const layerRight = layer.x + layer.width;
      const layerTop = layer.y;
      const layerBottom = layer.y + layer.height;
      return !(layerLeft > maxX || layerRight < minX || layerTop > maxY || layerBottom < minY);
    });

    if (layersToUpdate.length > 0) {
      let hasChanges = false;

      const newLayers = layers.map(layer => {
        const layerToErase = layersToUpdate.find(l => l.id === layer.id);
        if (!layerToErase) return layer;

        // Densify with finer granularity for smoother erasure
        const densifiedPath = [];
        const maxSegmentLength = Math.max(eraserRadius * 0.3, 2); // Finer density

        for (let i = 0; i < layer.path.length; i++) {
          const point = layer.path[i];
          densifiedPath.push({ ...point });

          if (i < layer.path.length - 1 && !layer.path[i + 1].forceMove) {
            const nextPoint = layer.path[i + 1];
            const dx = nextPoint.x - point.x;
            const dy = nextPoint.y - point.y;
            const segmentLength = Math.hypot(dx, dy);

            if (segmentLength > maxSegmentLength) {
              const numIntermediatePoints = Math.ceil(segmentLength / maxSegmentLength);
              for (let j = 1; j < numIntermediatePoints; j++) {
                const t = j / numIntermediatePoints;
                densifiedPath.push({
                  x: point.x + dx * t,
                  y: point.y + dy * t,
                  pressure: point.pressure || 1
                });
              }
            }
          }
        }

        // Process with smoother boundary detection
        const newPath = [];
        let pathChanged = false;
        let wasErased = false;

        for (let i = 0; i < densifiedPath.length; i++) {
          const point = densifiedPath[i];
          const absPoint = { x: point.x + layer.x, y: point.y + layer.y };
          const distance = distToSegment(absPoint, lastPoint, { x, y });
          const isErased = distance <= eraserRadius;

          if (isErased) {
            pathChanged = true;
            wasErased = true;
          } else {
            // Keep this point
            if (wasErased && newPath.length > 0) {
              // Transition from erased to non-erased - start new segment
              newPath.push({ ...point, forceMove: true });
              wasErased = false;
            } else {
              newPath.push({ ...point });
            }
          }
        }

        if (!pathChanged) return layer;
        hasChanges = true;

        if (newPath.length === 0) return null; // Remove empty layers

        return { ...layer, path: newPath };
      }).filter(Boolean);

      if (hasChanges) {
        setLayers(newLayers);
      }
    }

    // Update last point for continuity
    lastPointRef.current = { x, y, pressure: 1 };

  }, [layers, drawingSettings.brushSize, setLayers]);

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
