import { useState, useRef, useCallback, useEffect  } from 'react';
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
  const layersRef = useRef(layers);

  // Keep layersRef updated from prop
  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

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

  // Helper: Rotate a point around a center
  const rotatePoint = (p, center, angleDeg) => {
    if (!angleDeg) return p;
    const angleRad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    };
  };

  const handleEraserAction = useCallback((x, y) => {
    const eraserRadius = drawingSettings.brushSize / 2;
    const lastPoint = lastPointRef.current || { x, y };

    // Update last point immediately for the next event
    lastPointRef.current = { x, y };

    setLayers(currentLayers => {
      // Find layers that might be hit
      const minX = Math.min(x, lastPoint.x) - eraserRadius - 100; 
      const maxX = Math.max(x, lastPoint.x) + eraserRadius + 100;
      const minY = Math.min(y, lastPoint.y) - eraserRadius - 100;
      const maxY = Math.max(y, lastPoint.y) + eraserRadius + 100;

      const layersToUpdate = currentLayers.filter(layer => {
        if (!layer.visible || layer.type !== 'drawing') return false;
        return !(layer.x > maxX || (layer.x + layer.width) < minX || layer.y > maxY || (layer.y + layer.height) < minY);
      });

      if (layersToUpdate.length === 0) return currentLayers;

      let hasGlobalChanges = false;
      const nextLayers = currentLayers.map(layer => {
        const layerToErase = layersToUpdate.find(l => l.id === layer.id);
        if (!layerToErase) return layer;

        const drawingRadius = (layer.brushSize || 0) / 2;
        const totalEraserRadius = eraserRadius; // Match the visual eraser icon exactly

        // --- ROTATION SUPPORT ---
        // Calculate layer center for rotation transform
        const cx = layer.x + layer.width / 2;
        const cy = layer.y + layer.height / 2;
        const rotation = layer.rotation || 0;

        // Transform eraser segment to layer's local (unrotated) space
        const localLast = rotatePoint(lastPoint, { x: cx, y: cy }, -rotation);
        const localCurrent = rotatePoint({ x, y }, { x: cx, y: cy }, -rotation);
        
        // Adjust for layer top-left position (points in layer.path are relative to this)
        const p1 = { x: localLast.x - layer.x, y: localLast.y - layer.y };
        const p2 = { x: localCurrent.x - layer.x, y: localCurrent.y - layer.y };

        // Optimized densification
        const path = layer.path;
        const densifiedPath = [];
        const maxSegmentLength = 1; // Extremely fine for "pixel-perfect" erasure

        for (let i = 0; i < path.length; i++) {
          const point = path[i];
          densifiedPath.push(point);

          if (i < path.length - 1 && !path[i+1].forceMove) {
            const nextPoint = path[i+1];
            const dx = nextPoint.x - point.x;
            const dy = nextPoint.y - point.y;
            const dist = Math.hypot(dx, dy);

            if (dist > maxSegmentLength) {
              const steps = Math.ceil(dist / maxSegmentLength);
              for (let j = 1; j < steps; j++) {
                const t = j / steps;
                densifiedPath.push({
                  x: point.x + dx * t,
                  y: point.y + dy * t,
                  pressure: point.pressure || 1
                });
              }
            }
          }
        }

        const newPath = [];
        let layerChanged = false;
        let wasErased = false;

        for (let i = 0; i < densifiedPath.length; i++) {
          const p = densifiedPath[i];
          // Check distance in local space
          const dist = distToSegment(p, p1, p2);
          
          if (dist <= totalEraserRadius) {
            layerChanged = true;
            wasErased = true;
          } else {
            if (wasErased && newPath.length > 0) {
              newPath.push({ ...p, forceMove: true });
            } else {
              newPath.push(p);
            }
            wasErased = false;
          }
        }

        if (!layerChanged) return layer;
        hasGlobalChanges = true;
        if (newPath.length === 0) return null;
        return { ...layer, path: newPath };
      }).filter(Boolean);

      if (hasGlobalChanges) {
        layersRef.current = nextLayers; // Sync ref immediately
        return nextLayers;
      }
      return currentLayers;
    });
  }, [drawingSettings.brushSize, setLayers]);

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
      saveToHistory(layersRef.current);
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
  }, [drawingSettings, currentPath, selectedTool, setLayers, saveToHistory, setSelectedLayer, layers]);

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
