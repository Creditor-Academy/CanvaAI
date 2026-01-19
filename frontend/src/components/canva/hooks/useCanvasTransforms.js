import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for managing canvas transforms (zoom, pan)
 */
export const useCanvasTransforms = (initialZoom = 100, initialPan = { x: 0, y: 0 }) => {
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState(initialPan);
  const canvasRef = useRef(null);

  const getCanvasPoint = useCallback((clientX, clientY) => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return { x: 0, y: 0 };
    const rect = canvasEl.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    const scale = zoom / 100;
    const x = rawX / scale - pan.x;
    const y = rawY / scale - pan.y;
    return { x, y };
  }, [zoom, pan]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 25, 400));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 25, 25));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleFitToScreen = useCallback((canvasAreaRef, canvasSize) => {
    const area = canvasAreaRef.current;
    if (!area) return;
    const availableWidth = area.clientWidth - 40;
    const availableHeight = area.clientHeight - 40;
    if (availableWidth <= 0 || availableHeight <= 0) return;
    const scale = Math.min(
      availableWidth / canvasSize.width,
      availableHeight / canvasSize.height
    );
    const target = Math.min(Math.max(Math.floor(scale * 100), 10), 400);
    setZoom(target);
    setPan({ x: 0, y: 0 });
  }, []);

  return {
    zoom,
    pan,
    setZoom,
    setPan,
    canvasRef,
    getCanvasPoint,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleFitToScreen
  };
};
