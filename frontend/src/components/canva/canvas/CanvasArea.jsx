import React, { useMemo, useCallback, memo, useEffect, useState, useRef } from 'react'
import { FiRotateCw } from 'react-icons/fi'
import { getFilterCSS, getShadowCSS, hexToRgba } from '../../../utils/styleUtils'
import FloatingToolbar from '../FloatingToolbar'
import { MdDeleteOutline } from "react-icons/md";
import CropOverlay from './CropOverlay';

const LayerComponent = memo(({
  layer, isSelected, selectedTool, getShapeDisplayProps, onLayerSelect,
  onMouseDown, onResizeMouseDown, onRotateMouseDown, onTextContentChange,
  setSelectedLayer, getLayerPrimaryColor, onQuickColorChange, onDuplicate,
  onDelete, onEnhanceText, isEnhancingText, renderLayerUIOnly = false
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
    if (renderLayerUIOnly) return null; // 🔴 Skip content in UI mode

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
        {
          const strokeW = (layer.strokeWidth == null) ? 1 : Math.max(1, layer.strokeWidth);
          const strokeC = layer.strokeColor || '#000000';
          const baseBoxShadow = getShadowCSS(layer.shadows) || 'none';

          // Check if this is a path-based shape (like heart or cloud)
          const isPathShape = displayProps?.isPathShape;
          const pathData = displayProps?.pathData;
          const isLineShape = displayProps?.isLineShape;

          // Handle line shapes
          if (isLineShape) {
            const lineColor = layer.fillColor || layer.strokeColor || '#000000';
            const lineWidth = (layer.strokeWidth == null) ? 2 : Math.max(1, layer.strokeWidth);

            return (
              <div className="w-full h-full relative" style={{ ...commonStyle }}>
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${layer.width} ${layer.height}`}
                  preserveAspectRatio="none"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'visible'
                  }}
                >
                  <line
                    x1="0"
                    y1={layer.height / 2}
                    x2={layer.width}
                    y2={layer.height / 2}
                    stroke={lineColor}
                    strokeWidth={lineWidth}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            );
          }

          // Handle path-based shapes (heart, cloud)
          if (isPathShape && pathData) {
            // Generate a unique ID for patterns
            const patternId = `pattern-${layer.id}-${Date.now()}`;

            return (
              <div className="w-full h-full relative" style={{ ...commonStyle }}>
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 24 24"
                  preserveAspectRatio="xMidYMid meet"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'visible'
                  }}
                >
                  {/* Define patterns for image fills */}
                  {layer.fillType === 'image' && layer.fillImageSrc && (
                    <defs>
                      <pattern
                        id={patternId}
                        patternUnits="objectBoundingBox"
                        width="1"
                        height="1"
                        viewBox="0 0 24 24"
                        preserveAspectRatio="xMidYMid slice"
                      >
                        <image
                          href={layer.fillImageSrc}
                          width="24"
                          height="24"
                          preserveAspectRatio="xMidYMid slice"
                        />
                      </pattern>
                    </defs>
                  )}

                  {/* Fill path - use pattern if image fill, otherwise use fill color */}
                  <path
                    d={pathData}
                    fill={
                      layer.fillType === 'image' && layer.fillImageSrc
                        ? `url(#${patternId})`
                        : (layer.fillColor || '#3182ce')
                    }
                    stroke="none"
                  />

                  {/* Stroke path (if stroke width > 0) */}
                  {strokeW > 0 && (
                    <path
                      d={pathData}
                      fill="none"
                      stroke={strokeC}
                      strokeWidth={strokeW / (24 / Math.min(layer.width, layer.height) * 2)}
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </svg>
              </div>
            );
          }


          // Original clip-path based rendering for other shapes
          const clip = displayProps?.clipPath;

          const renderClipStroke = () => {
            if (!clip || clip === 'none') return null;

            // polygon(...) => extract points
            if (clip.startsWith('polygon(')) {
              const inner = clip.slice('polygon('.length, -1);
              const points = inner.split(',').map(pt => {
                const [x, y] = pt.trim().split(/\s+/);
                return `${x.replace('%', '')},${y.replace('%', '')}`;
              }).join(' ');

              return (
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                >
                  <polygon points={points} fill="none" stroke={strokeC} strokeWidth={strokeW} vectorEffect="non-scaling-stroke" />
                </svg>
              );
            }

            // path("M...") or path('M...') => extract path d
            const pathMatch = clip.match(/path\((?:"|'?)(.+?)(?:"|'?)\)/);
            if (pathMatch) {
              const d = pathMatch[1];
              return (
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                >
                  <path d={d} fill="none" stroke={strokeC} strokeWidth={strokeW} vectorEffect="non-scaling-stroke" />
                </svg>
              );
            }

            return null;
          };

          const showSvgStroke = clip && clip !== 'none';

          return (
            <div className="w-full h-full relative" style={{ ...commonStyle }}>
              <div
                className="w-full h-full"
                style={{
                  backgroundColor: layer.fillType === 'image' ? 'transparent' : layer.fillColor,
                  backgroundImage: layer.fillType === 'image' ? `url(${layer.fillImageSrc})` : 'none',
                  backgroundSize: layer.fillImageFit === 'contain' ? 'contain' : 'cover',
                  borderRadius: displayProps?.borderRadius,
                  clipPath: clip,
                  boxShadow: baseBoxShadow,
                }}
              />

              {showSvgStroke && renderClipStroke()}
              {!showSvgStroke && strokeW > 0 && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  border: `${strokeW}px solid ${strokeC}`,
                  borderRadius: displayProps?.borderRadius,
                  pointerEvents: 'none',
                  clipPath: clip // Apply same clip path to border
                }} />
              )}
            </div>
          );
        }

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
            <img
              src={layer.src}
              alt={layer.name}
              className="w-full h-full object-cover block"
              draggable={false}
            />
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
  }, [layer, displayProps, isEditing, localText, handleDoubleClick, handleTextBlur, handleKeyDown, renderLayerUIOnly]);

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
        border: (isSelected && renderLayerUIOnly) ? '2px dashed #3182ce' : 'none',
        zIndex: isSelected ? 1000 : layer.zIndex,
        display: layer.visible ? 'block' : 'none',
        transform: `rotate(${layer.rotation || 0}deg)`,
        transformOrigin: 'center center',
        cursor: isEditing ? 'text' : (selectedTool === 'select' ? 'move' : 'default'),
        // 🔴 UI Mode: pointer-events-none parent, children auto. Content Mode: auto (unless drawing)
        pointerEvents: renderLayerUIOnly
          ? 'none'
          : (['brush', 'pen', 'eraser'].includes(selectedTool) ? 'none' : 'auto'),
      }}
      onClick={handleLayerClick}
      onMouseDown={renderLayerUIOnly ? undefined : handleLayerMouseDown} // Only handle drag in content mode
    >
      {!renderLayerUIOnly && renderContent}

      {/* 🔴 Handles only appear in UI Mode */}
      {isSelected && renderLayerUIOnly && (
        <>
          {/* Enable pointer events for handles so they can be clicked */}
          <div style={{ pointerEvents: 'auto' }}>
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
  pageId, onPageRemove, canRemovePage = true, alignmentGuides = { x: [], y: [] },
  cropState = null, onApplyCrop, onCancelCrop
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
      className="flex-1 relative overflow-visible  flex items-center justify-center"
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
          className="absolute top-0 left-0 origin-top-left border border-gray-300"
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            transform: `scale(${zoom / 100})`,
            background: canvasBgImage ? 'none' : canvasBgColor,
            backgroundImage: canvasBgImage ? `url(${canvasBgImage})` : (canvasBgColor.includes('gradient') ? canvasBgColor : 'none'),
            backgroundSize: canvasBgImage ? '100% 100%' : 'auto',
            backgroundRepeat: canvasBgImage ? 'no-repeat' : 'repeat',
            backgroundPosition: 'center',

            cursor: selectedTool === 'select' ? 'default' : (selectedTool === 'eraser' ? 'none' : 'crosshair'),
            // 🔴 Content gets clipped, UI gets separate layer
            overflow: 'visible', // Kept visible here, but handled by internal structures? 
            // WAIT - Strategy changed. 
            // To get clipping on content but not on UI, we need TWO containers.
            // But canvasRef provides the BACKGROUND.
            // If canvasRef is 'visible', background is visible? Background matches size, so it's fine.
            // Content layers need to be in an overflow-hidden box.
          }}
          onClick={handleCanvasClick}
          onMouseDown={handleDrawingMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
        >
          {/* 0. Grid Overlay (Separate from background to handle sizing/export interactions) */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundImage: 'radial-gradient(circle, #999 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                backgroundPosition: 'center'
              }}
              data-html2canvas-ignore="true"
            />
          )}

          {/* 1. Content Layer (Clipped) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Pointer events none on wrapper? No, users need to click content. 
                  But overflow-hidden might clip interactions? 
                  If interactions are strictly inside, it's fine.
              */}
            <div className="w-full h-full pointer-events-auto">
              {layers.map(layer => (
                <LayerComponent
                  key={layer.id}
                  layer={layer}
                  isSelected={false} // 🔴 Don't render UI here
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
                  renderLayerUIOnly={false} // 🔴 Content Mode
                />
              ))}
            </div>
          </div>


          {/* 🔴 Current Drawing Path Rendering (Inside Content Layer? Or on top?) 
              On top is fine, clipped? Drawing usually stays on canvas.
          */}
          {currentPath.length > 1 && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <svg
                className="absolute top-0 left-0"
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
            </div>
          )}

          {/* 2. UI Layer (Visible Overflow, Top Level) */}
          <div className="absolute inset-0 overflow-visible pointer-events-none">
            {layers.filter(l => l.id === selectedLayer).map(layer => (
              <LayerComponent
                key={`ui-${layer.id}`}
                layer={layer}
                isSelected={true} // 🔴 Render UI here
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
                renderLayerUIOnly={true} // 🔴 UI Mode
              />
            ))}
          </div>

          {/* 3. Alignment Guides Layer */}
          <div className="absolute inset-0 pointer-events-none z-[1400]">
            {alignmentGuides && alignmentGuides.x.map((val, i) => (
              <div
                key={`guide-x-${i}`}
                className="absolute top-0 bottom-0 border-l border-dashed border-pink-500"
                style={{ left: val, width: '1px' }}
              />
            ))}
            {alignmentGuides && alignmentGuides.y.map((val, i) => (
              <div
                key={`guide-y-${i}`}
                className="absolute left-0 right-0 border-t border-dashed border-pink-500"
                style={{ top: val, height: '1px' }}
              />
            ))}
          </div>

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

          {/* Crop Overlay */}
          {cropState !== null && cropState && selectedLayer && (() => {
            const layer = layers.find(l => l.id === selectedLayer);
            return layer && layer.type === 'image' && cropState.layerId === selectedLayer ? (
              <CropOverlay
                layer={layer}
                onApply={onApplyCrop}
                onCancel={onCancelCrop}
                zoom={zoom}
              />
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
};

export default memo(CanvasArea);
