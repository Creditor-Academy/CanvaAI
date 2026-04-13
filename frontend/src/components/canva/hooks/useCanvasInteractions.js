import { useState, useCallback, useEffect } from 'react';
import { useAlignment } from './useAlignment';

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
  saveToHistory,
  canvasSize
) => {
  /* ===================== ALIGNMENT ===================== */
  const { snap, alignmentGuides, setAlignmentGuides, clearGuides } = useAlignment(layers, canvasSize);
  /* ===================== STATE ===================== */

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialLayers, setInitialLayers] = useState([]);

  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    direction: null,
    layerId: null,
  });

  const [isRotating, setIsRotating] = useState(false);
  const [rotateStart, setRotateStart] = useState({
    cx: 0,
    cy: 0,
    startAngleDeg: 0,
    startRotation: 0,
    layerId: null,
  });

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseOverCanvas, setIsMouseOverCanvas] = useState(false);
  const [rotateGuide, setRotateGuide] = useState(null);

  /* ===================== DRAG ===================== */

  const handleMouseDown = useCallback((e, layerId) => {
    if (selectedTool !== 'select' || !layerId) return;

    const { x, y } = getCanvasPoint(e.clientX, e.clientY);

    setIsDragging(true);
    setDragStart({ x, y });
    setInitialLayers([...layers]); // Store current state of all layers
    setSelectedLayer(layerId);
  }, [selectedTool, getCanvasPoint, setSelectedLayer, layers]);

  /* ===================== RESIZE ===================== */

  const handleResizeMouseDown = useCallback((e, layer, direction) => {
    e.stopPropagation();
    if (selectedTool !== 'select') return;

    const { x, y } = getCanvasPoint(e.clientX, e.clientY);

    setIsResizing(true);
    setResizeStart({
      startX: x,
      startY: y,
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
      direction,
      layerId: layer.id,
    });

    setSelectedLayer(layer.id);
  }, [selectedTool, getCanvasPoint, setSelectedLayer]);

  /* ===================== ROTATE ===================== */

  const handleRotateMouseDown = useCallback((e, layer) => {
    e.stopPropagation();
    if (selectedTool !== 'select') return;

    const cx = layer.x + layer.width / 2;
    const cy = layer.y + layer.height / 2;
    const { x, y } = getCanvasPoint(e.clientX, e.clientY);

    const startAngleDeg =
      Math.atan2(y - cy, x - cx) * (180 / Math.PI);

    setIsRotating(true);
    setRotateStart({
      cx,
      cy,
      startAngleDeg,
      startRotation: layer.rotation || 0,
      layerId: layer.id,
    });

    setSelectedLayer(layer.id);
  }, [selectedTool, getCanvasPoint, setSelectedLayer]);

  /* ===================== MOUSE MOVE ===================== */

  const handleMouseMove = useCallback((e) => {
    /* ----- ROTATE ----- */
    if (isRotating && rotateStart.layerId) {
      const { x, y } = getCanvasPoint(e.clientX, e.clientY);
      const dx = x - rotateStart.cx;
      const dy = y - rotateStart.cy;

      let angle =
        rotateStart.startRotation +
        (Math.atan2(dy, dx) * (180 / Math.PI) - rotateStart.startAngleDeg);

      if (e.shiftKey) {
        angle = Math.round(angle / 15) * 15;
      }

      setLayers(prev =>
        prev.map(l =>
          l.id === rotateStart.layerId
            ? { ...l, rotation: angle }
            : l
        )
      );

      // Rotation snap indicators: snap to nearest multiple of 45° (0,45,90,...)
      // Show guide only when the current angle is within a small tolerance of the snap angle.
      const norm = ((angle % 360) + 360) % 360;
      const nearest = Math.round(norm / 45) * 45;
      const delta = Math.abs(norm - nearest);
      const diff = Math.min(delta, 360 - delta);
      const TOL_DEG = 1; // strict tolerance: 1 degree

      if (diff <= TOL_DEG) {
        const snappedAngle = ((nearest % 360) + 360) % 360;
        setRotateGuide({ angle: snappedAngle, cx: rotateStart.cx, cy: rotateStart.cy });
      } else {
        setRotateGuide(null);
      }

      // Always clear alignment guides while rotating to avoid mixing guide types
      setAlignmentGuides({ x: [], y: [] });
      return;
    }

    /* ----- RESIZE ----- */
    if (isResizing && resizeStart.layerId) {
      const { x, y } = getCanvasPoint(e.clientX, e.clientY);

      let dx = x - resizeStart.startX;
      let dy = y - resizeStart.startY;

      const MIN = 20;

      // 🔒 Detect corner handles
      const isCorner = [
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right'
      ].includes(resizeStart.direction);

      // 🔒 Lock diagonal movement (force both x & y together)
      if (isCorner) {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        const dominant = Math.max(absX, absY);

        dx = dx < 0 ? -dominant : dominant;
        dy = dy < 0 ? -dominant : dominant;
      }

      setLayers(prev =>
        prev.map(layer => {
          if (layer.id !== resizeStart.layerId) return layer;

          let { x: lx, y: ly, width, height } = resizeStart;

          switch (resizeStart.direction) {
            case 'top-left':
              lx += dx;
              ly += dy;
              width -= dx;
              height -= dy;
              break;

            case 'top-center':
              ly += dy;
              height -= dy;
              break;

            case 'top-right':
              ly += dy;
              width += dx;
              height -= dy;
              break;

            case 'right-center':
              width += dx;
              break;

            case 'bottom-right':
              width += dx;
              height += dy;
              break;

            case 'bottom-center':
              height += dy;
              break;

            case 'bottom-left':
              lx += dx;
              width -= dx;
              height += dy;
              break;

            case 'left-center':
              lx += dx;
              width -= dx;
              break;

            default:
              break;
          }

          // 🚫 Prevent too small size
          if (width < MIN || height < MIN) return layer;

          return {
            ...layer,
            x: lx,
            y: ly,
            width,
            height
          };
        })
      );

      return;
    }

    /* ----- DRAG ----- */
    if (isDragging && selectedLayer) {
      const { x, y } = getCanvasPoint(e.clientX, e.clientY);
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      // Find the initial layer to calculate new position from
      const initialLayer = initialLayers.find(l => l.id === selectedLayer);

      if (initialLayer) {
        // Calculate raw new position based on total delta from start
        const rawX = initialLayer.x + dx;
        const rawY = initialLayer.y + dy;

        // Snap the candidate position
        const { x: finalX, y: finalY, guides } = snap({ ...initialLayer, x: rawX, y: rawY });

        // Set alignment guides for visualization
        setAlignmentGuides(guides);

        // Update the layer position in state
        setLayers(prev =>
          prev.map(l => l.id === selectedLayer ? { ...l, x: finalX, y: finalY } : l)
        );
      }
    }
  }, [
    isDragging,
    isResizing,
    isRotating,
    selectedLayer,
    dragStart,
    initialLayers,
    resizeStart,
    rotateStart,
    getCanvasPoint,
    setLayers,
    snap,
    setAlignmentGuides
  ]);

  /* ===================== MOUSE UP ===================== */

  const handleMouseUp = useCallback(() => {
    if (!isDragging && !isResizing && !isRotating) return;

    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);

    // Clear alignment guides when drag ends
    clearGuides();

    setResizeStart({
      startX: 0,
      startY: 0,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      direction: null,
      layerId: null,
    });

    setRotateStart({
      cx: 0,
      cy: 0,
      startAngleDeg: 0,
      startRotation: 0,
      layerId: null,
    });

    // clear rotate guide
    setRotateGuide(null);

    setLayers(curr => {
      saveToHistory(curr);
      return curr;
    });
  }, [isDragging, isResizing, isRotating, setLayers, saveToHistory, clearGuides]);

  /* ===================== GLOBAL LISTENERS ===================== */

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

  /* ===================== CANVAS HELPERS ===================== */

  const handleCanvasMouseMove = useCallback((e) => {
    // Convert to canvas coordinates for proper cursor positioning
    const { x, y } = getCanvasPoint(e.clientX, e.clientY);
    setMousePosition({ x, y });
    setIsMouseOverCanvas(true);
  }, [getCanvasPoint]);

  const handleCanvasMouseLeave = useCallback(() => {
    setIsMouseOverCanvas(false);
  }, []);

  const handleCanvasClick = useCallback((e, handleAddElement) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool !== 'select') {
      handleAddElement?.(x, y);
    } else {
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
    handleCanvasClick,
    alignmentGuides, // Export guides
    rotateGuide,
  };
};
