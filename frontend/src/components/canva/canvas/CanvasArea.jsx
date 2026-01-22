import React, { useMemo, useCallback, memo, useEffect, useState } from 'react'
import { FiRotateCw, FiX } from 'react-icons/fi'
import { getFilterCSS, getShadowCSS, hexToRgba } from '../../../utils/styleUtils'
import FloatingToolbar from '../FloatingToolbar'
import { MdDeleteOutline } from "react-icons/md";

const LayerComponent = memo(({
  layer,
  isSelected,
  selectedTool,
  getShapeDisplayProps,
  onLayerSelect,
  onMouseDown,
  onResizeMouseDown,
  onRotateMouseDown,
  onTextContentChange,
  setSelectedLayer,
  getLayerPrimaryColor,
  onQuickColorChange,
  onDuplicate,
  onDelete,
  onEnhanceText,
  isEnhancingText
}) => {
  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    if (layer.type === 'text') {
      setSelectedLayer(layer.id);
      const newText = window.prompt('Edit text', layer.text || '');
      if (newText !== null) {
        setSelectedLayer(layer.id);
        onTextContentChange(newText);
      }
    }
  }, [layer, setSelectedLayer, onTextContentChange]);

  const displayProps = useMemo(() => {
    if (layer.type === 'shape') {
      return getShapeDisplayProps(layer.shape);
    }
    return null;
  }, [layer.type, layer.shape, getShapeDisplayProps]);

  const renderContent = useMemo(() => {
    switch (layer.type) {
      case 'text':
        return (
          <div
            className="w-full h-full flex items-center p-1 select-text overflow-hidden"
            style={{
              fontSize: layer.fontSize || 16,
              fontFamily: layer.fontFamily || 'Arial',
              fontWeight: layer.fontWeight || 'normal',
              fontStyle: layer.fontStyle || 'normal',
              textDecoration: layer.textDecoration || 'none',
              color: layer.color || '#000000',
              textAlign: layer.textAlign || 'left',
              filter: getFilterCSS({
                brightness: layer.brightness ?? 100,
                contrast: layer.contrast ?? 100,
                blur: layer.blur ?? 0
              }),
              textShadow: layer.shadows?.enabled
                ? `${layer.shadows.x ?? 0}px ${layer.shadows.y ?? 0}px ${layer.shadows.blur ?? 0}px ${hexToRgba(layer.shadows.color, (layer.shadows.opacity ?? 50) / 100)}`
                : 'none',
              opacity: (layer.opacity ?? 100) / 100,
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap'
            }}
            onDoubleClick={handleDoubleClick}
          >
            {layer.text || ''}
          </div>
        );

      case 'shape':
        if (layer.fillType === 'image' && layer.fillImageSrc) {
          return (
            <div
              className="w-full h-full relative overflow-hidden"
              style={{
                border: `${layer.strokeWidth}px solid ${layer.strokeColor}`,
                borderRadius: displayProps?.borderRadius,
                clipPath: displayProps?.clipPath,
                backgroundImage: `url(${layer.fillImageSrc})`,
                backgroundSize: layer.fillImageFit === 'contain' ? 'contain' : 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                filter: getFilterCSS({
                  brightness: layer.brightness ?? 100,
                  contrast: layer.contrast ?? 100,
                  blur: layer.blur ?? 0
                }),
                boxShadow: getShadowCSS(layer.shadows),
                opacity: (layer.opacity ?? 100) / 100
              }}
            />
          );
        }
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: layer.fillColor,
              border: `${layer.strokeWidth}px solid ${layer.strokeColor}`,
              borderRadius: displayProps?.borderRadius,
              clipPath: displayProps?.clipPath,
              filter: getFilterCSS({
                brightness: layer.brightness ?? 100,
                contrast: layer.contrast ?? 100,
                blur: layer.blur ?? 0
              }),
              boxShadow: getShadowCSS(layer.shadows),
              opacity: (layer.opacity ?? 100) / 100
            }}
          />
        );

      case 'image':
        return (
          <div
            className="w-full h-full overflow-hidden relative"
            style={{
              borderRadius: `${layer.cornerRadius ?? 4}px`,
              filter: getFilterCSS({
                brightness: layer.brightness ?? 100,
                contrast: layer.contrast ?? 100,
                blur: layer.blur ?? 0
              }),
              boxShadow: getShadowCSS(layer.shadows),
              opacity: (layer.opacity ?? 100) / 100,
              transform: layer.flipped ? 'scaleX(-1)' : 'none'
            }}
          >
            <img
              src={layer.src}
              alt={layer.name}
              className="w-full h-full object-contain block"
              draggable={false}
              loading="lazy"
            />
            {(layer.strokeWidth ?? 0) > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  borderRadius: `${layer.cornerRadius ?? 4}px`,
                  border: `${layer.strokeWidth ?? 0}px ${layer.strokeStyle === 'dashed' ? 'dashed' : 'solid'} ${layer.strokeColor ?? '#000'}`
                }}
              />
            )}
          </div>
        );

      case 'drawing':
        return (
          <svg
            width={layer.width}
            height={layer.height}
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              filter: getFilterCSS({
                brightness: layer.brightness ?? 100,
                contrast: layer.contrast ?? 100,
                blur: layer.blur ?? 0
              }),
              opacity: (layer.opacity ?? 100) / 100
            }}
            viewBox={`0 0 ${layer.width} ${layer.height}`}
          >
            <path
              d={layer.path.map((point, index) =>
                index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
              ).join(' ')}
              stroke={layer.mode === 'eraser' ? '#ffffff' : layer.color}
              strokeWidth={layer.brushSize}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={layer.opacity / 100}
              style={{
                mixBlendMode: layer.mode === 'eraser' ? 'multiply' : 'normal'
              }}
            />
          </svg>
        );

      default:
        return null;
    }
  }, [layer, displayProps, handleDoubleClick]);

  return (
    <div
      className="absolute select-none transform-gpu"
      style={{
        left: layer.x,
        top: layer.y,
        width: layer.width,
        height: layer.height,
        border: isSelected ? '2px dashed #3182ce' : 'none',
        cursor: selectedTool === 'select' ? 'move' : 'default',
        display: layer.visible ? 'block' : 'none',
        transform: `rotate(${layer.rotation || 0}deg)`,
        transformOrigin: 'center center'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onLayerSelect(layer.id);
      }}
      onMouseDown={(e) => onMouseDown(e, layer.id)}
    >
      {renderContent}

      {isSelected && (
        <>
          <FloatingToolbar
            layer={layer}
            onColorChange={onQuickColorChange}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onEnhance={onEnhanceText}
            isEnhancing={isEnhancingText}
            getLayerPrimaryColor={getLayerPrimaryColor}
          />

          <div
            onMouseDown={(e) => onResizeMouseDown(e, layer)}
            className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-blue-600  cursor-nwse-resize border-2 border-white z-50 transform-gpu"
            style={{
              boxShadow: '0 0 0 1px #3182ce'
            }}
            title="Resize"
          />

          <>
            <div
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-px h-8 bg-blue-600 z-[99]"
            />
            <div
              onMouseDown={(e) => onRotateMouseDown(e, layer)}
              className="absolute -top-14 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-blue-600 shadow-[0_0_0_1px_#3182ce] cursor-grab flex items-center justify-center z-[100] transform-gpu"
              title="Rotate (hold Shift to snap)"
            >
              <FiRotateCw size={12} color="#3182ce" />
            </div>
          </>
        </>
      )}
    </div>
  );
});

LayerComponent.displayName = 'LayerComponent';

const CanvasArea = ({
  canvasAreaRef,
  contentWrapperRef,
  canvasRef,
  canvasSize,
  zoom,
  showGrid,
  pan,
  handleCanvasClick,
  handleDrawingMouseDown,
  handleCanvasMouseMove,
  handleCanvasMouseLeave,
  layers,
  hasChosenTemplate,
  templates,
  handleTemplateSelect,
  selectedLayer,
  selectedTool,
  handleLayerSelect,
  handleMouseDown,
  handleResizeMouseDown,
  handleRotateMouseDown,
  handleTextContentChange,
  drawingSettings,
  currentPath,
  isMouseOverCanvas,
  mousePosition,
  scrollMetrics,
  SCROLLER_MARGIN,
  SCROLLER_THICKNESS,
  handleHTrackClick,
  handleHThumbMouseDown,
  handleVTrackClick,
  handleVThumbMouseDown,
  getShapeDisplayProps,
  handleQuickColorChange,
  handleLayerDuplicate,
  handleLayerDelete,
  handleEnhanceText,
  isEnhancingText,
  getLayerPrimaryColor,
  setSelectedLayer,
  canvasBgColor = '#22c55e',
  canvasBgImage = null,
  handleUndo,
  handleRedo,
  pageId,
  onPageRemove,
  canRemovePage = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const canvasStyle = useMemo(() => ({
    width: `${canvasSize.width}px`,
    height: `${canvasSize.height}px`,
    cursor: selectedTool === 'select' ? 'default' :
      selectedTool === 'eraser' ? 'crosshair' :
        ['brush', 'pen'].includes(selectedTool) ? 'crosshair' : 'crosshair',
    backgroundImage: showGrid ? 'radial-gradient(circle, #ccc 1px, transparent 1px)' : 'none',
    backgroundSize: '20px 20px'
  }), [canvasSize, selectedTool, showGrid]);

  const invisibleSpacerStyle = useMemo(() => ({
    width: canvasSize.width * (zoom / 100),
    height: canvasSize.height * (zoom / 100),
  }), [canvasSize, zoom]);

  const eraserPreviewStyle = useMemo(() => ({
    left: `${mousePosition.x}px`,
    top: `${mousePosition.y}px`,
    width: `${drawingSettings.brushSize}px`,
    height: `${drawingSettings.brushSize}px`,
    border: `2px solid ${drawingSettings.brushColor}`,
    backgroundColor: `${drawingSettings.brushColor}20`,
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.3)'
  }), [mousePosition, drawingSettings]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle if not typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          e.stopPropagation();
          if (handleUndo) {
            handleUndo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          e.stopPropagation();
          if (handleRedo) {
            handleRedo();
          }
        }
      }
    };

    // Add event listener to the canvas area container
    const canvasArea = canvasAreaRef?.current;
    if (canvasArea) {
      canvasArea.addEventListener('keydown', handleKeyDown);
      // Make the canvas area focusable to receive keyboard events
      canvasArea.setAttribute('tabindex', '0');
    }

    return () => {
      if (canvasArea) {
        canvasArea.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [handleUndo, handleRedo, canvasAreaRef]);

  return (
    <>
      <style>{`
        .canvas-area::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
        .canvas-area {
          -ms-overflow-style: none;
          scrollbar-width: 0;
        }
      `}</style>
      <div
        className="flex-1 flex flex-col items-start justify-start relative overflow-y-auto overflow-x-visible canvas-area"
        ref={canvasAreaRef}
        style={{
          scrollbarWidth: '0',
          msOverflowStyle: 'none',
          margin: '0',
          padding: 'o',
          minHeight: 0,
          height: '100%',
          maxHeight: '100%',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Page Remove Icon - appears on hover, positioned outside the canvas sheet on the right side */}
        {canRemovePage && onPageRemove && pageId && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Are you sure you want to remove this page?')) {
                onPageRemove(pageId);
              }
            }}
            className={`absolute cursor-pointer z-[1001]text-white rounded-full p-2 shadow-lg transition-all duration-200 transform-gpu ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
              }`}
            style={{
              top: `${pan.y + 8}px`,
              left: `${pan.x + canvasSize.width * (zoom / 100) + 8}px`,
              transition: 'opacity 0.2s ease, transform 0.2s ease',
            }}
            title="Remove Page"
            aria-label="Remove Page"
          >
            <MdDeleteOutline size={24} />
          </button>
        )}

        <div
          ref={contentWrapperRef}
          className="relative mx-auto shadow-sm"
          style={{
            width: `${canvasSize.width * (zoom / 100)}px`,
            height: `${canvasSize.height * (zoom / 100)}px`,
            minHeight: `${canvasSize.height * (zoom / 100)}px`,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'top left',
            margin: '0',
            padding: '0',
          }}
        >
          {/* Invisible spacer to create scrollable area - must be in document flow */}
          <div
            aria-hidden="true"
            style={{
              width: `${canvasSize.width * (zoom / 100)}px`,
              height: `${canvasSize.height * (zoom / 100)}px`,
              pointerEvents: 'none',
              opacity: 0,
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />

          <div
            className="relative overflow-hidden border-2 border-gray-200 shadow-sm transform-gpu"
            style={{
              ...canvasStyle,
              backgroundColor: canvasBgImage ? 'transparent' : canvasBgColor,
              backgroundImage: canvasBgImage ? `url(${canvasBgImage})` : 'none',
              backgroundSize: canvasBgImage ? 'cover' : 'auto',
              backgroundPosition: canvasBgImage ? 'center' : 'initial',
              backgroundRepeat: canvasBgImage ? 'no-repeat' : 'initial',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`,
            }}
            onClick={handleCanvasClick}
            onMouseDown={handleDrawingMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            ref={canvasRef}
          >
            {layers.map(layer => (
              <LayerComponent
                key={layer.id}
                layer={layer}
                isSelected={selectedLayer === layer.id}
                selectedTool={selectedTool}
                getShapeDisplayProps={getShapeDisplayProps}
                onLayerSelect={handleLayerSelect}
                onMouseDown={handleMouseDown}
                onResizeMouseDown={handleResizeMouseDown}
                onRotateMouseDown={handleRotateMouseDown}
                onTextContentChange={handleTextContentChange}
                setSelectedLayer={setSelectedLayer}
                getLayerPrimaryColor={getLayerPrimaryColor}
                onQuickColorChange={handleQuickColorChange}
                onDuplicate={handleLayerDuplicate}
                onDelete={handleLayerDelete}
                onEnhanceText={handleEnhanceText}
                isEnhancingText={isEnhancingText}
              />
            ))}

            {/* Eraser preview - circular cursor */}
            {selectedTool === 'eraser' && isMouseOverCanvas && (
              <div
                className="absolute rounded-full pointer-events-none z-[1000] transform-gpu"
                style={eraserPreviewStyle}
              />
            )}

            {/* Current drawing path preview */}
            {drawingSettings.isDrawing && currentPath.length > 0 && selectedTool !== 'eraser' && (
              <svg
                className="absolute top-0 left-0 pointer-events-none z-[1000]"
                style={{
                  width: canvasSize.width,
                  height: canvasSize.height,
                }}
                viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
              >
                <path
                  d={currentPath.map((point, index) =>
                    index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
                  ).join(' ')}
                  stroke={drawingSettings.drawingMode === 'eraser' ? '#ffffff' : drawingSettings.brushColor}
                  strokeWidth={drawingSettings.brushSize}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={drawingSettings.opacity / 100}
                  style={{
                    mixBlendMode: drawingSettings.drawingMode === 'eraser' ? 'multiply' : 'normal'
                  }}
                />
              </svg>
            )}
          </div>
        </div>

      </div>
    </>
  )
}

export default memo(CanvasArea)




