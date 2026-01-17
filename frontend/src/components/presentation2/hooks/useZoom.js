import { useState, useCallback, useMemo } from 'react';

/**
 * useZoom Hook
 * 
 * Manages zoom and pan state for the canvas.
 * 
 * @param {Object} options
 * @param {number} options.initialZoom - Initial zoom level (default: 1)
 * @param {number} options.minZoom - Minimum zoom level (default: 0.1)
 * @param {number} options.maxZoom - Maximum zoom level (default: 3)
 * @returns {Object} { zoom, setZoom, zoomIn, zoomOut, resetZoom, pan, setPan }
 */
export const useZoom = ({
  initialZoom = 1,
  minZoom = 0.1,
  maxZoom = 3,
} = {}) => {
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  /**
   * Zoom in by a factor
   */
  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.2, maxZoom));
  }, [maxZoom]);

  /**
   * Zoom out by a factor
   */
  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.2, minZoom));
  }, [minZoom]);

  /**
   * Reset zoom to 1
   */
  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  /**
   * Fit to screen (calculate zoom to fit canvas in viewport)
   * TODO: Implement based on viewport size
   */
  const fitToScreen = useCallback(() => {
    // TODO: Calculate zoom based on canvas size and viewport
    setZoom(1);
  }, []);

  /**
   * Update pan position
   */
  const updatePan = useCallback((newPan) => {
    setPan((prev) => ({
      x: typeof newPan.x === 'function' ? newPan.x(prev.x) : (newPan.x ?? prev.x),
      y: typeof newPan.y === 'function' ? newPan.y(prev.y) : (newPan.y ?? prev.y),
    }));
  }, []);

  return {
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    pan,
    setPan: updatePan,
  };
};
