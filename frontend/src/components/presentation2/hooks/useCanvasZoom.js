import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useCanvasZoom Hook
 * 
 * Handles canvas-only zoom with:
 * - Trackpad pinch or Ctrl + mouse wheel
 * - Cursor-centric zoom (zooms towards mouse position)
 * - Smooth interpolation
 * - Prevents browser zoom when inside canvas
 * 
 * @param {Object} options
 * @param {number} options.initialZoom - Initial zoom level (default: 1)
 * @param {number} options.minZoom - Minimum zoom (default: 0.2)
 * @param {number} options.maxZoom - Maximum zoom (default: 4)
 * @param {number} options.zoomStep - Zoom step for smooth interpolation (default: 0.1)
 * @returns {Object} { zoom, setZoom, zoomIn, zoomOut, resetZoom, fitToScreen, containerRef, isPanning, handleWheel, handlePanStart, handlePanMove, handlePanEnd }
 */
export const useCanvasZoom = ({
  initialZoom = 1,
  minZoom = 0.2,
  maxZoom = 4,
  zoomStep = 0.1,
} = {}) => {
  const [zoom, setZoom] = useState(initialZoom);
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef(null);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const zoomTargetRef = useRef(null);
  const animationFrameRef = useRef(null);

  /**
   * Clamp zoom value between min and max
   */
  const clampZoom = useCallback((value) => {
    return Math.max(minZoom, Math.min(maxZoom, value));
  }, [minZoom, maxZoom]);

  /**
   * Smooth zoom interpolation
   */
  const smoothZoomTo = useCallback((targetZoom, centerX, centerY) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const startZoom = zoom;
    const startTime = performance.now();
    const duration = 200; // 200ms animation

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentZoom = startZoom + (targetZoom - startZoom) * easeProgress;
      setZoom(clampZoom(currentZoom));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [zoom, clampZoom]);

  /**
   * Zoom towards a specific point (cursor-centric zoom)
   */
  const zoomTowardsPoint = useCallback((delta, clientX, clientY) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Get mouse position relative to container viewport
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    
    // Get current scroll position
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    
    // Calculate mouse position in the scrollable content space
    const contentX = mouseX + scrollLeft;
    const contentY = mouseY + scrollTop;
    
    // Calculate zoom factor
    const zoomFactor = delta > 0 ? 1 + zoomStep : 1 - zoomStep;
    const newZoom = clampZoom(zoom * zoomFactor);
    
    if (newZoom === zoom) return; // Already at limit
    
    const zoomRatio = newZoom / zoom;
    
    // Calculate new scroll position to keep the point under cursor fixed
    // When zooming, the content scales, so we adjust scroll to maintain cursor position
    const newScrollLeft = contentX - (mouseX * zoomRatio);
    const newScrollTop = contentY - (mouseY * zoomRatio);
    
    // Update zoom
    setZoom(newZoom);
    
    // Update scroll position to maintain cursor position
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollLeft = newScrollLeft;
        containerRef.current.scrollTop = newScrollTop;
      }
    });
  }, [zoom, zoomStep, clampZoom]);

  /**
   * Handle wheel event for zoom
   */
  const handleWheel = useCallback((e) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Check if cursor is inside the canvas container
    const isInsideCanvas = (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    );

    // Only handle zoom if Ctrl/Cmd is pressed and cursor is inside canvas
    if ((e.ctrlKey || e.metaKey) && isInsideCanvas) {
      e.preventDefault();
      e.stopPropagation();

      // Use deltaY for zoom (negative = zoom in, positive = zoom out)
      const delta = -e.deltaY;
      
      // Zoom towards mouse cursor position
      zoomTowardsPoint(delta, e.clientX, e.clientY);
    }
  }, [zoomTowardsPoint]);

  /**
   * Handle pan start (space + drag or middle mouse button)
   */
  const handlePanStart = useCallback((e) => {
    if (!containerRef.current) return;
    
    // Check if space is pressed or middle mouse button or shift+drag
    const isSpacePressed = e.key === ' ' || (e.type === 'mousedown' && e.button === 1);
    const isPanGesture = e.type === 'mousedown' && (e.button === 1 || e.shiftKey);
    
    if (isSpacePressed || isPanGesture) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: containerRef.current.scrollLeft,
        scrollTop: containerRef.current.scrollTop,
      };
    }
  }, []);

  /**
   * Handle pan move
   */
  const handlePanMove = useCallback((e) => {
    if (!isPanning || !containerRef.current) return;
    
    e.preventDefault();
    const deltaX = e.clientX - panStartRef.current.x;
    const deltaY = e.clientY - panStartRef.current.y;
    
    containerRef.current.scrollLeft = panStartRef.current.scrollLeft - deltaX;
    containerRef.current.scrollTop = panStartRef.current.scrollTop - deltaY;
  }, [isPanning]);

  /**
   * Handle pan end
   */
  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  /**
   * Zoom in (towards center)
   */
  const zoomIn = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    zoomTowardsPoint(100, centerX, centerY);
  }, [zoomTowardsPoint]);

  /**
   * Zoom out (from center)
   */
  const zoomOut = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    zoomTowardsPoint(-100, centerX, centerY);
  }, [zoomTowardsPoint]);

  /**
   * Reset zoom to 100%
   */
  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  /**
   * Fit to screen
   */
  const fitToScreen = useCallback((canvasWidth, canvasHeight) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const availableWidth = container.clientWidth - 80; // Account for padding (40px each side)
    const availableHeight = container.clientHeight - 80;
    
    if (availableWidth <= 0 || availableHeight <= 0) return;
    
    const scaleX = availableWidth / canvasWidth;
    const scaleY = availableHeight / canvasHeight;
    const fitZoom = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%
    
    setZoom(clampZoom(fitZoom));
    
    // Center the canvas after fitting
    requestAnimationFrame(() => {
      if (containerRef.current) {
        const canvasWrapper = containerRef.current.querySelector('.flex.items-center.justify-center');
        if (canvasWrapper) {
          const wrapperRect = canvasWrapper.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          containerRef.current.scrollLeft = (wrapperRect.width - containerRect.width) / 2;
          containerRef.current.scrollTop = (wrapperRect.height - containerRect.height) / 2;
        }
      }
    });
  }, [clampZoom]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle keyboard events for panning
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === ' ') {
        handlePanEnd();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mouseup', handlePanEnd);
    document.addEventListener('mouseleave', handlePanEnd);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mouseup', handlePanEnd);
      document.removeEventListener('mouseleave', handlePanEnd);
    };
  }, [handlePanEnd]);

  return {
    zoom,
    setZoom: (newZoom) => setZoom(clampZoom(newZoom)),
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    isPanning,
    containerRef,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
  };
};
