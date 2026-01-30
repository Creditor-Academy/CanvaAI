import React from 'react'
import { FiArrowLeft, FiArrowRight, FiEye, FiEyeOff, FiCopy, FiTrash2, FiType, FiSquare, FiImage, FiEdit3, FiAlignLeft, FiAlignCenter, FiAlignRight, FiBold, FiItalic, FiUnderline, FiMove } from 'react-icons/fi';
import { BrightnessControl, ContrastControl, BlurControl, ShadowsControl, OpacityControl } from '../controls';
import TextEnhanceButton from '../TextEnhanceButton';

const RightSidebar = ({
  isRightSidebarCollapsed,
  setIsRightSidebarCollapsed,
  layers,
  selectedLayer,
  handleLayerSelect,
  handleLayerToggleVisibility,
  handleLayerDuplicate,
  handleLayerDelete,
  textSettings,
  handleTextContentChange,
  handleTextSettingsChange,
  shapeSettings,
  handleShapeSettingsChange,
  imageSettings,
  handleImageSettingsChange,
  drawingSettings,
  handleDrawingSettingsChange,
  setSelectedTool,
  handleLayerDragStart,
  handleLayerDragOver,
  handleLayerDragLeave,
  handleLayerDrop,
  handleLayerDragEnd,
  draggedLayer,
  dragOverIndex,
  isLayerDragging,
  renamingLayerId,
  setRenamingLayerId,
  renameValue,
  setRenameValue,
  startRenameLayer,
  commitRenameLayer,
  handleEffectChange,
  handleEnhanceText,
  isEnhancingText,
  isHeading,
  setIsHeading,
  fileInputRef,
  uploadedImages,
  strokeColorInputRef,
  textColorInputRef
}) => {

  const selectedTextLayer = layers.find(
    (l) => l.id === selectedLayer && l.type === 'text'
  );

  return (
    <div>
      {/* Right Sidebar */}
      <div className={`fixed right-5 top-20 bg-white overflow-y-auto h-[calc(100vh-100px)] z-10 transition-all duration-300   custom-scrollbar ${isRightSidebarCollapsed ? 'w-[60px] pt-10 pb-20 px-2' : 'w-[320px] pt-10 pb-20 px-5'
        }`}>
        {/* Toggle Button */}
        <div className="flex justify-between items-center mb-5 pb-2.5 border-b border-gray-200">
          {!isRightSidebarCollapsed && (
            <h3 className="m-0 text-base">Properties</h3>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRightSidebarCollapsed(!isRightSidebarCollapsed);
            }}
            className="p-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center justify-center transition-all duration-200 min-w-[32px] h-8 hover:bg-gray-50 z-20 relative"
            title={isRightSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            type="button"
          >
            {isRightSidebarCollapsed ? (
              <FiArrowLeft size={16} color="#666" />
            ) : (
              <FiArrowRight size={16} color="#666" />
            )}
          </button>
        </div>
        {!isRightSidebarCollapsed && (
          <>
            {layers.length === 0 ? (
              <div className="text-center text-gray-600 text-sm">
                No layers yet
              </div>
            ) : (
              layers.map((layer, index) => (
                <div
                  key={layer.id}
                  draggable
                  onDragStart={(e) => handleLayerDragStart(e, layer.id)}
                  onDragOver={(e) => handleLayerDragOver(e, index)}
                  onDragLeave={handleLayerDragLeave}
                  onDrop={(e) => handleLayerDrop(e, index)}
                  onDragEnd={handleLayerDragEnd}
                  className={`p-3 rounded-md my-1 text-sm cursor-pointer flex items-center justify-between transition-all duration-200 select-none ${draggedLayer === layer.id ? 'opacity-50 rotate-[5deg] shadow-lg' : ''
                    } ${dragOverIndex === index ? 'border-t-[3px] border-t-blue-600 bg-blue-50' : ''
                    } ${selectedLayer === layer.id ? 'border-2 border-blue-600 bg-blue-50' : 'border border-gray-200 bg-white'
                    }`}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div
                      className={`p-1 mr-2 text-gray-600 flex items-center justify-center ${isLayerDragging ? 'cursor-grabbing' : 'cursor-grab'
                        }`}
                      title="Drag to reorder"
                    >
                      <FiMove size={16} />
                    </div>
                    <div onClick={() => handleLayerSelect(layer.id)} className="flex-1 min-w-0">
                      {renamingLayerId === layer.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={commitRenameLayer}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitRenameLayer(); if (e.key === 'Escape') { setRenamingLayerId(null); setRenameValue(''); } }}
                          className="w-full py-1.5 px-1.5 border border-gray-300 rounded-md text-[13px]"
                        />
                      ) : (
                        <div
                          title="Double-click to rename"
                          onDoubleClick={() => startRenameLayer(layer)}
                          className="font-medium overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                          {layer.name}
                        </div>
                      )}
                      <div className="text-xs text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">{layer.type}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 items-center">
                    <button
                      className="p-1 border-none bg-transparent cursor-pointer rounded flex items-center justify-center opacity-100 transition-opacity duration-200 hover:bg-gray-100"
                      onClick={() => handleLayerToggleVisibility(layer.id)}
                      title={layer.visible ? 'Hide' : 'Show'}
                    >
                      {layer.visible ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                    </button>
                    <button
                      className="p-1 border-none bg-transparent cursor-pointer rounded flex items-center justify-center opacity-100 transition-opacity duration-200 hover:bg-gray-100"
                      onClick={() => handleLayerDuplicate(layer.id)}
                      title="Duplicate"
                    >
                      <FiCopy size={14} />
                    </button>
                    <button
                      className="p-1 border-none bg-transparent cursor-pointer rounded flex items-center justify-center opacity-100 transition-opacity duration-200 hover:bg-gray-100"
                      onClick={() => handleLayerDelete(layer.id)}
                      title="Delete"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Collapsed state - show layer count and quick actions */}
        {isRightSidebarCollapsed && (
          <div className="flex flex-col items-center gap-3 pt-2.5">
            <div className="text-center text-xs text-gray-600 font-medium">
              {layers.length} layers
            </div>
            {layers.length > 0 && (
              <div className="flex flex-col gap-2 w-full">
                {layers.slice(0, 3).map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => handleLayerSelect(layer.id)}
                    className={`p-2 rounded-md cursor-pointer flex items-center justify-center transition-all duration-200 min-h-[32px] ${selectedLayer === layer.id ? 'border-2 border-blue-600 bg-blue-50' : 'border border-gray-200 bg-white'
                      } hover:bg-gray-50`}
                    title={`${layer.name} (${layer.type})`}
                  >
                    {layer.type === 'text' && <FiType size={16} color="#666" />}
                    {layer.type === 'shape' && <FiSquare size={16} color="#666" />}
                    {layer.type === 'image' && <FiImage size={16} color="#666" />}
                    {layer.type === 'drawing' && <FiEdit3 size={16} color="#666" />}
                  </button>
                ))}
                {layers.length > 3 && (
                  <div className="text-center text-[10px] text-gray-400 py-1">
                    +{layers.length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Properties Panel */}
        {selectedLayer && !isRightSidebarCollapsed && (
          <div className="mt-5 p-4 bg-gray-50 rounded-lg">
            <h4 className="m-0 mb-4 text-base">Properties</h4>
            {/* Effects (applies to all layer types) */}
            {(() => {
              const sel = layers.find(l => l.id === selectedLayer);
              if (!sel) return null;
              return (
                <div className="mb-4 pb-3 border-b border-gray-200">
                  <h5 className="m-0 mb-2.5 text-[13px] text-gray-700">Effects</h5>
                  <BrightnessControl value={sel.brightness ?? 100} onChange={(v) => handleEffectChange('brightness', v)} />
                  <ContrastControl value={sel.contrast ?? 100} onChange={(v) => handleEffectChange('contrast', v)} />
                  <BlurControl value={sel.blur ?? 0} onChange={(v) => handleEffectChange('blur', v)} />
                  <OpacityControl value={sel.opacity ?? 100} onChange={(v) => handleEffectChange('opacity', v)} />
                  <ShadowsControl value={sel.shadows} onChange={(v) => handleEffectChange('shadows', v)} />
                </div>
              );
            })()}

            {layers.find(l => l.id === selectedLayer)?.type === 'text' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Content</span>
                  <input
                    type="text"
                    value={layers.find(l => l.id === selectedLayer)?.text || ''}
                    onChange={(e) => handleTextContentChange(e.target.value)}
                    className="py-1.5 px-2 border border-gray-300 rounded text-sm w-full ml-2"
                  />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 w-full ml-2">
                    <label className="flex items-center gap-1.5 text-[13px] text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isHeading}
                        onChange={(e) => setIsHeading(e.target.checked)}
                        className="cursor-pointer"
                      />
                      <span>Is Heading</span>
                    </label>
                    <TextEnhanceButton
                      onClick={handleEnhanceText}
                      disabled={isEnhancingText || !layers.find(l => l.id === selectedLayer)?.text?.trim()}
                      isEnhancing={isEnhancingText}
                      variant="inline"
                      size={14}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Font Size</span>
                  <input
                    type="number"
                    value={textSettings.fontSize}
                    onChange={(e) => handleTextSettingsChange('fontSize', parseInt(e.target.value))}
                    className="py-1.5 px-2 border border-gray-300 rounded text-sm w-20"
                  />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Font Family</span>
                  <select
                    value={textSettings.fontFamily}
                    onChange={(e) => handleTextSettingsChange('fontFamily', e.target.value)}
                    className="py-1.5 px-2 border border-gray-300 rounded text-sm w-20"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Poppins">Poppins</option>
                  </select>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Font Weight</span>
                  <select
                    value={textSettings.fontWeight}
                    onChange={(e) => handleTextSettingsChange('fontWeight', e.target.value)}
                    className="py-1.5 px-2 border border-gray-300 rounded text-sm w-20"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="lighter">Light</option>
                    <option value="bolder">Bolder</option>
                  </select>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Color</span>
                  <div
                    onClick={() => textColorInputRef.current && textColorInputRef.current.click()}
                    title={textSettings.color}
                    className="w-7 h-7 rounded-full border border-gray-300 cursor-pointer"
                    style={{ boxShadow: `inset 0 0 0 12px ${textSettings.color || '#000'}` }}
                  />
                  <input
                    ref={textColorInputRef}
                    type="color"
                    value={textSettings.color}
                    onChange={(e) => handleTextSettingsChange('color', e.target.value)}
                    className="absolute opacity-0 pointer-events-none w-0 h-0"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Align</span>

                  <div className="flex gap-1">
                    <button
                      className={`p-1 rounded flex items-center justify-center
        ${selectedTextLayer?.textAlign === 'left' ? 'bg-blue-600' : 'bg-transparent'}
        text-black hover:bg-gray-100`}
                      onClick={() => handleTextSettingsChange('textAlign', 'left')}
                    >
                      <FiAlignLeft size={14} />
                    </button>

                    <button
                      className={`p-1 rounded flex items-center justify-center
        ${selectedTextLayer?.textAlign === 'center' ? 'bg-blue-600' : 'bg-transparent'}
        text-black hover:bg-gray-100`}
                      onClick={() => handleTextSettingsChange('textAlign', 'center')}
                    >
                      <FiAlignCenter size={14} />
                    </button>

                    <button
                      className={`p-1 rounded flex items-center justify-center
        ${selectedTextLayer?.textAlign === 'right' ? 'bg-blue-600' : 'bg-transparent'}
        text-black hover:bg-gray-100`}
                      onClick={() => handleTextSettingsChange('textAlign', 'right')}
                    >
                      <FiAlignRight size={14} />
                    </button>
                  </div>
                </div>

              </>
            )}

            {layers.find(l => l.id === selectedLayer)?.type === 'shape' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Fill Type</span>
                  <select
                    value={shapeSettings.fillType}
                    onChange={(e) => handleShapeSettingsChange('fillType', e.target.value)}
                    className="py-1.5 px-2 border border-gray-300 rounded text-sm w-20"
                  >
                    <option value="color">Color</option>
                    <option value="image">Image</option>
                  </select>
                </div>
                {shapeSettings.fillType === 'image' && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Image Fit</span>
                      <select
                        value={shapeSettings.fillImageFit}
                        onChange={(e) => handleShapeSettingsChange('fillImageFit', e.target.value)}
                        className="py-1.5 px-2 border border-gray-300 rounded text-sm w-20"
                      >
                        <option value="cover">Cover</option>
                        <option value="contain">Contain</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                          title="Upload image to use as fill"
                        >
                          Upload image
                        </button>
                        {shapeSettings.fillImageSrc && (
                          <img src={shapeSettings.fillImageSrc} alt="fill" className="w-10 h-10 object-cover rounded border border-gray-200" />
                        )}
                      </div>
                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-1.5 max-h-[120px] overflow-y-auto">
                          {uploadedImages.map(ui => (
                            <button key={ui.id} onClick={() => handleShapeSettingsChange('fillImageSrc', ui.src)} title={ui.name} className={`p-0 rounded overflow-hidden bg-white ${shapeSettings.fillImageSrc === ui.src ? 'border-2 border-blue-600' : 'border border-gray-200'
                              }`}>
                              <img src={ui.src} alt={ui.name} className="w-full h-10 object-cover block" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Fill Color</span>
                  <input
                    type="color"
                    value={shapeSettings.fillColor}
                    onChange={(e) => handleShapeSettingsChange('fillColor', e.target.value)}
                    className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Stroke Color</span>
                  <input
                    type="color"
                    value={shapeSettings.strokeColor}
                    onChange={(e) => handleShapeSettingsChange('strokeColor', e.target.value)}
                    className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Stroke Width</span>
                  <input
                    type="number"
                    value={shapeSettings.strokeWidth}
                    onChange={(e) => handleShapeSettingsChange('strokeWidth', parseInt(e.target.value))}
                    className="py-1.5 px-2 border border-gray-300 rounded text-sm w-20"
                  />
                </div>
              </>
            )}

            {layers.find(l => l.id === selectedLayer)?.type === 'image' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Stroke Color</span>
                  <div
                    onClick={() => strokeColorInputRef.current && strokeColorInputRef.current.click()}
                    title={imageSettings.strokeColor}
                    className="w-7 h-7 rounded-full border border-gray-300 cursor-pointer"
                    style={{ boxShadow: `inset 0 0 0 12px ${imageSettings.strokeColor || '#000'}` }}
                  />
                  <input
                    ref={strokeColorInputRef}
                    type="color"
                    value={imageSettings.strokeColor}
                    onChange={(e) => handleImageSettingsChange('strokeColor', e.target.value)}
                    className="absolute opacity-0 pointer-events-none w-0 h-0"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Stroke Width</span>
                  <input
                    type="number"
                    value={imageSettings.strokeWidth}
                    onChange={(e) => handleImageSettingsChange('strokeWidth', parseInt(e.target.value) || 0)}
                    className="py-1.5 px-2 border border-gray-300 rounded text-sm w-20"
                  />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Stroke Style</span>
                  <select
                    value={imageSettings.strokeStyle}
                    onChange={(e) => handleImageSettingsChange('strokeStyle', e.target.value)}
                    className="py-1.5 px-2 border border-gray-300 rounded text-sm w-20"
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                  </select>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Corner Radius</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={imageSettings.cornerRadius}
                      onChange={(e) => handleImageSettingsChange('cornerRadius', parseInt(e.target.value))}
                      className="w-[100px]"
                    />
                    <span className="text-xs text-gray-600 min-w-[30px]">
                      {imageSettings.cornerRadius}px
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Saturation</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={imageSettings.saturation}
                      onChange={(e) => handleImageSettingsChange('saturation', parseInt(e.target.value))}
                      className="w-[100px]"
                    />
                    <span className="text-xs text-gray-600 min-w-[30px]">
                      {imageSettings.saturation}%
                    </span>
                  </div>
                </div>
              </>
            )}

            {layers.find(l => l.id === selectedLayer)?.type === 'drawing' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Brush Size</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={drawingSettings.brushSize}
                      onChange={(e) => handleDrawingSettingsChange('brushSize', parseInt(e.target.value))}
                      className="w-[100px]"
                    />
                    <span className="text-xs text-gray-600 min-w-[30px]">
                      {drawingSettings.brushSize}px
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Color</span>
                  <input
                    type="color"
                    value={drawingSettings.brushColor}
                    onChange={(e) => handleDrawingSettingsChange('brushColor', e.target.value)}
                    className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Opacity</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={drawingSettings.opacity}
                      onChange={(e) => handleDrawingSettingsChange('opacity', parseInt(e.target.value))}
                      className="w-[100px]"
                    />
                    <span className="text-xs text-gray-600 min-w-[30px]">
                      {drawingSettings.opacity}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Mode</span>
                  <select
                    value={drawingSettings.drawingMode}
                    onChange={(e) => {
                      handleDrawingSettingsChange('drawingMode', e.target.value);
                      setSelectedTool(e.target.value);
                    }}
                    className="py-1.5 px-2 border border-gray-300 rounded text-sm w-20"
                  >
                    <option value="brush">Brush</option>
                    <option value="pen">Pen</option>
                    <option value="eraser">Eraser</option>
                  </select>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RightSidebar;
