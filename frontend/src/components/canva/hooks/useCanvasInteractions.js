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
  /* ===================== STATE ===================== */

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  /* ===================== DRAG ===================== */

  const handleMouseDown = useCallback((e, layerId) => {
    if (selectedTool !== 'select' || !layerId) return;

    const { x, y } = getCanvasPoint(e.clientX, e.clientY);

    setIsDragging(true);
    setDragStart({ x, y });
    setSelectedLayer(layerId);
  }, [selectedTool, getCanvasPoint, setSelectedLayer]);

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
      return;
    }

    /* ----- RESIZE ----- */
    if (isResizing && resizeStart.layerId) {
      const { x, y } = getCanvasPoint(e.clientX, e.clientY);
      const dx = x - resizeStart.startX;
      const dy = y - resizeStart.startY;
      const MIN = 20;

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

          if (width < MIN || height < MIN) return layer;

          return { ...layer, x: lx, y: ly, width, height };
        })
      );
      return;
    }

    /* ----- DRAG ----- */
    if (isDragging && selectedLayer) {
      const { x, y } = getCanvasPoint(e.clientX, e.clientY);
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      setLayers(prev =>
        prev.map(l =>
          l.id === selectedLayer
            ? { ...l, x: l.x + dx, y: l.y + dy }
            : l
        )
      );

      setDragStart({ x, y });
    }
  }, [
    isDragging,
    isResizing,
    isRotating,
    selectedLayer,
    dragStart,
    resizeStart,
    rotateStart,
    getCanvasPoint,
    setLayers
  ]);

  /* ===================== MOUSE UP ===================== */

  const handleMouseUp = useCallback(() => {
    if (!isDragging && !isResizing && !isRotating) return;

    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);

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

    setLayers(curr => {
      saveToHistory(curr);
      return curr;
    });
  }, [isDragging, isResizing, isRotating, setLayers, saveToHistory]);

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
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsMouseOverCanvas(true);
  }, []);

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
  };
};
