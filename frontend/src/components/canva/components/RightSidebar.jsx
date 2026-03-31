import React, { useRef } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiCopy,
  FiTrash2,
  FiType,
  FiSquare,
  FiImage,
  FiEdit3,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiMove
} from 'react-icons/fi'
import { uploadTemporaryImage } from '@/services/imageEditor/imageApi';

import {
  BrightnessControl,
  ContrastControl,
  BlurControl,
  ShadowsControl,
  OpacityControl
} from '../controls'
import TextEnhanceButton from '../TextEnhanceButton'

const RightSidebar = ({
  isRightSidebarCollapsed,
  setIsRightSidebarCollapsed,
  layers,
  selectedLayer,
  handleLayerSelect,
  handleLayerToggleVisibility,
  handleLayerDuplicate,
  handleLayerDelete,
  handleLayerMoveUp,
  handleLayerMoveDown,
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
  uploadedImages,
  strokeColorInputRef,
  textColorInputRef
}) => {
  const selectedTextLayer = layers.find(
    l => l.id === selectedLayer && l.type === 'text'
  )

  const selectedImageLayer = layers.find(
    l => l.id === selectedLayer && l.type === 'image'
  )

  const selectedLayerData = layers.find(l => l.id === selectedLayer)

  const shapeImgInputRef = useRef(null)


  const handleShapeImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const base64 = event.target.result;

        const payload = {
          userId: 'shape-user',        // or pass real userId from props
          base64Image: base64,
          serviceId: `shape-${Date.now()}`
        };

        const json = await uploadTemporaryImage(payload);

        if (json?.url) {
          handleShapeSettingsChange({
            fillImageSrc: json.url,   // ⭐ IMPORTANT (URL not base64)
            fillType: 'image',
            fillColor: null
          });
        }

      } catch (err) {
        console.error("Shape image upload error", err);
      }
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFillColorChange = (color) => {
    handleShapeSettingsChange({
      fillColor: color,
      fillType: 'color',
      fillImageSrc: null
    });
  };


  const handleStrokeColorChange = (color) => {
    handleShapeSettingsChange({
      strokeColor: color
    })
  }

  const selectedIndex = layers.findIndex(l => l.id === selectedLayer);

  return (
    <div>
      <div className={`fixed right-0 top-10 bg-white overflow-y-auto h-[calc(100vh-100px)] z-10 transition-all duration-300 custom-scrollbar ${isRightSidebarCollapsed ? 'w-[60px] pt-10 pb-20 px-2' : 'w-[320px] pt-10 pb-20 px-5'}`}>

        <div className="flex justify-between items-center mb-5 pb-2.5 border-b border-gray-200">
          {!isRightSidebarCollapsed && (
            <h3 className="m-0 text-base">Properties</h3>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsRightSidebarCollapsed(!isRightSidebarCollapsed)
            }}
            className="p-2 border border-gray-200 rounded-md bg-white flex items-center justify-center min-w-[32px] h-8 hover:bg-gray-50"
            type="button"
          >
            {isRightSidebarCollapsed ? (
              <FiArrowLeft size={16} />
            ) : (
              <FiArrowRight size={16} />
            )}
          </button>
        </div>


        <div className="max-h-[40vh] overflow-y-auto">
          {!isRightSidebarCollapsed && (
            layers.length === 0 ? (
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
                  className={`p-3 rounded-md my-1 text-sm cursor-pointer flex items-center justify-between transition-all ${selectedLayer === layer.id ? 'border-2 border-blue-600 bg-blue-50' : 'border border-gray-200 bg-white'}`}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className={`p-1 mr-2 ${isLayerDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
                      <FiMove size={16} />
                    </div>
                    <div onClick={() => handleLayerSelect(layer.id)} className="flex-1 min-w-0">
                      {renamingLayerId === layer.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={commitRenameLayer}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRenameLayer()
                            if (e.key === 'Escape') {
                              setRenamingLayerId(null)
                              setRenameValue('')
                            }
                          }}
                          className="w-full py-1 px-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <div
                          onDoubleClick={() => startRenameLayer(layer)}
                          className="font-medium overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                          {layer.name}
                        </div>
                      )}
                      <div className="text-xs text-gray-600">{layer.type}</div>
                    </div>
                  </div>

                  <div className="flex gap-1 items-center">
                    <button onClick={() => handleLayerToggleVisibility(layer.id)}>
                      {layer.visible ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                    </button>
                    <button onClick={() => handleLayerDuplicate(layer.id)}>
                      <FiCopy size={14} />
                    </button>
                    <button onClick={() => handleLayerDelete(layer.id)}>
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {selectedLayer && !isRightSidebarCollapsed && (
          <div className="mt-5 p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-4 mb-4">
              <button
                className={`px-4 py-2 rounded ${selectedIndex >= layers.length - 1 ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-500 text-white cursor-pointer'}`}
                onClick={() => handleLayerMoveUp && selectedLayer && handleLayerMoveUp(selectedLayer)}
                disabled={selectedIndex >= layers.length - 1}
              >
                Forward
              </button>
              <button
                className={`px-4 py-2 rounded ${selectedIndex <= 0 ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-500 text-white cursor-pointer'}`}
                onClick={() => handleLayerMoveDown && selectedLayer && handleLayerMoveDown(selectedLayer)}
                disabled={selectedIndex <= 0}
              >
                Backward
              </button>
            </div>
            <h4 className="mb-4 text-base">Properties</h4>

            <div className="mb-4 pb-3 border-b border-gray-200">
              <h5 className="mb-2 text-[13px] text-gray-700">Effects</h5>
              <BrightnessControl value={selectedLayerData?.brightness ?? 100} onChange={(v) => handleEffectChange('brightness', v)} />
              <ContrastControl value={selectedLayerData?.contrast ?? 100} onChange={(v) => handleEffectChange('contrast', v)} />
              <BlurControl value={selectedLayerData?.blur ?? 0} onChange={(v) => handleEffectChange('blur', v)} />
              <OpacityControl value={selectedLayerData?.opacity ?? 100} onChange={(v) => handleEffectChange('opacity', v)} />
              <ShadowsControl value={selectedLayerData?.shadows} onChange={(v) => handleEffectChange('shadows', v)} />
            </div>

            {selectedLayerData?.type === 'text' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Content</span>
                  <input
                    type="text"
                    value={selectedLayerData?.text || ''}
                    onChange={(e) => handleTextContentChange(e.target.value)}
                    className="py-1.5 px-2 border border-gray-300 rounded text-sm w-full ml-2"
                  />
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-4 gap-2 w-full ml-2 flex-col ">

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
                  <span className="text-sm font-medium text-gray-700">Color</span>
                  <div
                    onClick={() => textColorInputRef.current?.click()}
                    className="w-7 h-7 rounded-full border border-gray-300 cursor-pointer"
                    style={{ boxShadow: `inset 0 0 0 12px ${textSettings.color || '#000'}` }}
                  />
                  <input
                    ref={textColorInputRef}
                    type="color"
                    value={textSettings.color || '#000000'}
                    onChange={(e) => handleTextSettingsChange('color', e.target.value)}
                    className="absolute opacity-0 pointer-events-none w-0 h-0"
                  />
                </div>
              </>
            )}

            {selectedLayerData?.type === 'shape' && (
              <>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Image Fill</span>
                    <button
                      className="px-3 py-1 text-xs border border-gray-300 rounded"
                      onClick={() => shapeImgInputRef.current?.click()}
                    >
                      Upload
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={shapeImgInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleShapeImageUpload}
                  />
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Fill Color</span>
                  <input
                    type="color"
                    value={shapeSettings.fillColor || '#000000'}
                    onChange={(e) => handleFillColorChange(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Stroke Color</span>
                  <input
                    type="color"
                    value={shapeSettings.strokeColor || '#000000'}
                    onChange={(e) => handleStrokeColorChange(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Stroke Width</span>
                  <input
                    type="number"
                    min="0"
                    value={shapeSettings.strokeWidth ?? 0}
                    onChange={(e) =>
                      handleShapeSettingsChange(
                        'strokeWidth',
                        Number(e.target.value)
                      )
                    }
                    className="py-1 px-2 border border-gray-300 rounded text-sm w-20"
                  />
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


