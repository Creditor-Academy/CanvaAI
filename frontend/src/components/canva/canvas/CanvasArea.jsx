import React, { useMemo, useCallback, memo, useEffect, useState, useRef } from 'react'
import { FiRotateCw } from 'react-icons/fi'
import { getFilterCSS, getShadowCSS, hexToRgba } from '../../../utils/styleUtils'
import FloatingToolbar from '../FloatingToolbar'
import { MdDeleteOutline } from "react-icons/md";

const LayerComponent = memo(({
  layer, isSelected, selectedTool, getShapeDisplayProps, onLayerSelect,
  onMouseDown, onResizeMouseDown, onRotateMouseDown, onTextContentChange,
  setSelectedLayer, getLayerPrimaryColor, onQuickColorChange, onDuplicate,
  onDelete, onEnhanceText, isEnhancingText
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(layer.text || '');
  const textareaRef = useRef(null);
  const textDivRef = useRef(null);

  // Sync local text with layer text when layer changes (e.g., Undo/Redo)
  useEffect(() => {
    setLocalText(layer.text || '');
  }, [layer.text]);

  // Focus and move cursor to end when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    if (layer.type === 'text') {
      // Clear placeholder text automatically for a better UX
      const placeholders = ['Add a heading', 'Add a subheading', 'Add some body text'];
      if (placeholders.includes(layer.text)) {
        setLocalText('');
      }
      setIsEditing(true);
    }
  }, [layer.type, layer.text]);

  const handleTextBlur = useCallback(() => {
    setIsEditing(false);
    if (localText !== layer.text) {
      onTextContentChange(localText);
    }
  }, [localText, layer.text, onTextContentChange]);

  const handleKeyDown = useCallback((e) => {
    // Save on Enter (unless Shift is held for new lines)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextBlur();
    }
    // Revert on Escape
    else if (e.key === 'Escape') {
      setLocalText(layer.text || '');
      setIsEditing(false);
    }
  }, [handleTextBlur, layer.text]);

  const displayProps = useMemo(() =>
    layer.type === 'shape' ? getShapeDisplayProps(layer.shape) : null
    , [layer.type, layer.shape, getShapeDisplayProps]);

  const renderContent = useMemo(() => {
    const commonStyle = {
      filter: getFilterCSS({
        brightness: layer.brightness ?? 100,
        contrast: layer.contrast ?? 100,
        blur: layer.blur ?? 0
      }),
      opacity: (layer.opacity ?? 100) / 100,
    };

    // Common text styles that both div and textarea should share
    const textStyle = {
      ...commonStyle,
      fontSize: layer.fontSize || 16,
      fontFamily: layer.fontFamily || 'Arial',
      fontWeight: layer.fontWeight || 'normal',
      color: layer.color || '#000000',
      textAlign: layer.textAlign || 'left',
      textShadow: layer.shadows?.enabled
        ? `${layer.shadows.x ?? 0}px ${layer.shadows.y ?? 0}px ${layer.shadows.blur ?? 0}px ${hexToRgba(layer.shadows.color, (layer.shadows.opacity ?? 50) / 100)}`
        : 'none',
      wordWrap: 'break-word',
      whiteSpace: 'pre-wrap',
      lineHeight: '1.2',
      fontStyle: layer.fontStyle || 'normal',
      letterSpacing: layer.letterSpacing || 'normal',
      textDecoration: layer.textDecoration || 'none',
      boxSizing: 'border-box',
    };

    switch (layer.type) {
      case 'text':
        if (isEditing) {
          return (
            <textarea
              ref={textareaRef}
              className="w-full h-full bg-transparent resize-none outline-none overflow-hidden"
              style={{
                ...textStyle,
                // FIX: Match the exact padding/margin of the div
                padding: '0.25rem',
                margin: '0',
                border: 'none',
                cursor: 'text',
                // FIX: Textarea specific adjustments
                resize: 'none',
                // FIX: Align text properly
                verticalAlign: 'top',
                // FIX: Remove default textarea styles
                overflow: 'hidden',
                // FIX: Match the display properties
                display: 'flex',
                alignItems: 'center',
                // FIX: Ensure it takes full height
                height: '100%',
                minHeight: '100%',
                maxHeight: '100%',
              }}
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              onBlur={handleTextBlur}
              onKeyDown={handleKeyDown}
              // Stop propagation so clicking inside doesn't trigger canvas drag
              onMouseDown={(e) => e.stopPropagation()}
              spellCheck="false"
              // FIX: Remove default textarea behavior
              rows={1}
            />
          );
        }

        return (
          <div
            ref={textDivRef}
            className={`w-full h-full p-1 overflow-hidden cursor-move ${isEditing ? 'select-text' : 'select-none'
              }`}
            style={{
              ...textStyle,
              padding: '0.25rem',
              margin: '0',
            }}
            onDoubleClick={handleDoubleClick}
          >
            {layer.text || (
              <span style={{ opacity: 0.4 }}>
                {layer.name === 'Heading'
                  ? 'Add a heading'
                  : layer.name === 'Subheading'
                    ? 'Add a subheading'
                    : 'Add Text'}
              </span>
            )}
          </div>

        );

      case 'shape':
        return (
          <div
            className="w-full h-full"
            style={{
              ...commonStyle,
              backgroundColor: layer.fillType === 'image' ? 'transparent' : layer.fillColor,
              backgroundImage: layer.fillType === 'image' ? `url(${layer.fillImageSrc})` : 'none',
              backgroundSize: layer.fillImageFit === 'contain' ? 'contain' : 'cover',
              border: `${layer.strokeWidth}px solid ${layer.strokeColor}`,
              borderRadius: displayProps?.borderRadius,
              clipPath: displayProps?.clipPath,
              boxShadow: getShadowCSS(layer.shadows),
            }}
          />
        );

      case 'image':
        return (
          <div
            className="w-full h-full overflow-hidden relative"
            style={{
              ...commonStyle,
              borderRadius: `${layer.cornerRadius ?? 4}px`,
              boxShadow: getShadowCSS(layer.shadows),
              transform: layer.flipped ? 'scaleX(-1)' : 'none'
            }}
          >
            <img src={layer.src} alt={layer.name} className="w-full h-full object-contain block bg-no-repeat " draggable={false} />
          </div>
        );
   
      case 'drawing':
        return (
          <svg width={layer.width} height={layer.height} className="absolute top-0 left-0 pointer-events-none" style={commonStyle}>
            <path
              d={layer.path.map((p, i) => (i === 0 || p.forceMove) ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ')}
              stroke={layer.mode === 'eraser' ? '#ffffff' : layer.color}
              strokeWidth={layer.brushSize}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      default: return null;
    }
  }, [layer, displayProps, isEditing, localText, handleDoubleClick, handleTextBlur, handleKeyDown]);

  const handleLayerClick = useCallback((e) => {
    e.stopPropagation();
    if (!isEditing) onLayerSelect(layer.id);
  }, [layer.id, isEditing, onLayerSelect]);

  const handleLayerMouseDown = useCallback((e) => {
    if (!isEditing) {
      e.preventDefault(); // 🔑 stops text selection
      onMouseDown(e, layer.id);
    }
  }, [isEditing, onMouseDown, layer.id]);

  return (
    <div
      className="absolute select-none"
      style={{
        left: layer.x,
        top: layer.y,
        width: layer.width,
        height: layer.height,
        border: (isSelected) ? '2px dashed #3182ce' : 'none',
        zIndex: isSelected ? 1000 : layer.zIndex,
        display: layer.visible ? 'block' : 'none',
        transform: `rotate(${layer.rotation || 0}deg)`,
        transformOrigin: 'center center',
        cursor: isEditing ? 'text' : (selectedTool === 'select' ? 'move' : 'default'),
      }}
      onClick={handleLayerClick}
      onMouseDown={handleLayerMouseDown}
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

          {/* 🔵 Corner Resize Handles */}
          <div
            onMouseDown={(e) => onResizeMouseDown(e, layer, 'top-left')}
            className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-blue-600 border-2 border-white cursor-nwse-resize z-[1001]"
          />

          <div
            onMouseDown={(e) => onResizeMouseDown(e, layer, 'top-right')}
            className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-blue-600 border-2 border-white cursor-nesw-resize z-[1001]"
          />

          <div
            onMouseDown={(e) => onResizeMouseDown(e, layer, 'bottom-left')}
            className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-blue-600 border-2 border-white cursor-nesw-resize z-[1001]"
          />

          <div
            onMouseDown={(e) => onResizeMouseDown(e, layer, 'bottom-right')}
            className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-blue-600 border-2 border-white cursor-nwse-resize z-[1001]"
          />

          {/* 🔵 Edge Center Resize Handles */}
          <div
            onMouseDown={(e) => onResizeMouseDown(e, layer, 'top-center')}
            className="absolute left-1/2 -top-1.5 -translate-x-1/2 w-3 h-3 bg-blue-600 border-2 border-white cursor-ns-resize z-[1001]"
          />

          <div
            onMouseDown={(e) => onResizeMouseDown(e, layer, 'bottom-center')}
            className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-blue-600 border-2 border-white cursor-ns-resize z-[1001]"
          />

          <div
            onMouseDown={(e) => onResizeMouseDown(e, layer, 'left-center')}
            className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 border-2 border-white cursor-ew-resize z-[1001]"
          />

          <div
            onMouseDown={(e) => onResizeMouseDown(e, layer, 'right-center')}
            className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 border-2 border-white cursor-ew-resize z-[1001]"
          />

          {/* 🔄 Rotate Handle */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-px h-8 bg-blue-600" />

          <div
            onMouseDown={(e) => onRotateMouseDown(e, layer)}
            className="absolute -top-14 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-blue-600 cursor-grab flex items-center justify-center z-[1001]"
          >
            <FiRotateCw size={12} color="#3182ce" />
          </div>
        </>
      )}


    </div>
  );
});
const CanvasArea = ({
  canvasAreaRef, contentWrapperRef, canvasRef, canvasSize, zoom, showGrid, pan,
  handleCanvasClick, handleDrawingMouseDown, handleCanvasMouseMove, handleCanvasMouseLeave,
  layers, selectedLayer, selectedTool, handleLayerSelect, handleMouseDown,
  handleResizeMouseDown, handleRotateMouseDown, handleTextContentChange,
  drawingSettings, currentPath, isMouseOverCanvas, mousePosition,
  getShapeDisplayProps, handleQuickColorChange, handleLayerDuplicate, handleLayerDelete,
  handleEnhanceText, isEnhancingText, getLayerPrimaryColor, setSelectedLayer,
  canvasBgColor = '#ffffff', canvasBgImage = null, handleUndo, handleRedo,
  pageId, onPageRemove, canRemovePage = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) return;
      if ((e.ctrlKey || e.metaKey)) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          handleUndo?.();
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          handleRedo?.();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return (
    <div
      ref={canvasAreaRef}
      className="flex-1 relative overflow-hidden bg-[#f0f2f5] flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {canRemovePage && isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Remove page?')) onPageRemove(pageId);
          }}
          className="absolute top-4 right-4 z-[2000] bg-white text-red-500 rounded-full p-2 shadow-xl hover:bg-red-50 transition-all"
        >
          <MdDeleteOutline size={24} />
        </button>
      )}

      <div
        ref={contentWrapperRef}
        className="relative transition-transform duration-75 ease-out"
        style={{
          width: `${canvasSize.width * (zoom / 100)}px`,
          height: `${canvasSize.height * (zoom / 100)}px`,
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          willChange: 'transform',
        }}
      >
        <div
          ref={canvasRef}
          className="absolute top-0 left-0 origin-top-left shadow-2xl"
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            transform: `scale(${zoom / 100})`,
            background: canvasBgColor,
            backgroundImage: [
              showGrid ? 'radial-gradient(circle, #ddd 1px, transparent 1px)' : null,
              canvasBgImage ? `url(${canvasBgImage})` : null
            ].filter(Boolean).join(', '),

            /* ✅ ONLY FIX */
            backgroundSize: canvasBgImage ? '100% 100%' : '20px 20px',
            backgroundRepeat: canvasBgImage ? 'no-repeat' : 'repeat',
            backgroundPosition: 'center',

            cursor: selectedTool === 'select' ? 'default' : (selectedTool === 'eraser' ? 'none' : 'crosshair'),
          }}
          onClick={handleCanvasClick}
          onMouseDown={handleDrawingMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
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


          {/* 🔴 Current Drawing Path Rendering */}
          {currentPath.length > 1 && (
            <svg
              className="absolute top-0 left-0 pointer-events-none"
              style={{
                width: `${canvasSize.width}px`,
                height: `${canvasSize.height}px`,
                zIndex: 1500, // Ensure it's above other layers
                filter: getFilterCSS({
                  brightness: 100,
                  contrast: 100,
                  blur: 0
                }),
                opacity: (drawingSettings.opacity ?? 100) / 100,
              }}
            >
              <path
                d={currentPath.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ')}
                stroke={drawingSettings.drawingMode === 'eraser' ? '#ffffff' : drawingSettings.brushColor}
                strokeWidth={drawingSettings.brushSize}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {selectedTool === 'eraser' && isMouseOverCanvas && (
            <div
              className="absolute rounded-full border-2 border-slate-400 bg-white/50 pointer-events-none z-[2000] shadow-sm"
              style={{
                left: mousePosition.x,
                top: mousePosition.y,
                width: drawingSettings.brushSize,
                height: drawingSettings.brushSize,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(CanvasArea);
