import React, { useState } from 'react';
import {
  Type,
  Square,
  Image as ImageIcon,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Minus,
  Plus,
} from 'lucide-react';

/**
 * PropertiesPanel Component
 * 
 * Shows properties for selected layers or slide background
 * - Text properties (color, font, size, alignment)
 * - Shape properties (fill, stroke, shape type)
 * - Background color
 * - Layer position/size
 */
const PropertiesPanel = ({
  selectedLayers = [],
  activeSlide,
  onUpdateLayer,
  onUpdateSlideBackground,
  canvasWidth,
  canvasHeight,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(null); // 'text', 'fill', 'stroke', 'background'

  // Common colors palette
  const colorPalette = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b',
    '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
    '#d946ef', '#ec4899', '#f43f5e', '#64748b', '#475569',
  ];

  // Get the first selected layer (for now, handle single selection)
  const selectedLayer = selectedLayers.length > 0 ? selectedLayers[0] : null;
  const layerType = selectedLayer?.type;

  // Handle color change
  const handleColorChange = (color, type) => {
    if (type === 'background') {
      onUpdateSlideBackground?.(color);
    } else if (selectedLayer) {
      const updates = {};
      if (type === 'text') {
        updates.color = color;
      } else if (type === 'fill') {
        updates.fill = color;
      } else if (type === 'stroke') {
        updates.stroke = color;
      }
      onUpdateLayer?.(selectedLayer.id, { style: { ...selectedLayer.style, ...updates } });
    }
    setShowColorPicker(null);
  };

  // Handle text property change
  const handleTextPropertyChange = (property, value) => {
    if (selectedLayer && selectedLayer.type === 'text') {
      onUpdateLayer?.(selectedLayer.id, {
        style: { ...selectedLayer.style, [property]: value },
      });
    }
  };

  // Handle shape property change
  const handleShapePropertyChange = (property, value) => {
    if (selectedLayer && selectedLayer.type === 'shape') {
      onUpdateLayer?.(selectedLayer.id, {
        style: { ...selectedLayer.style, [property]: value },
      });
    }
  };

  // Handle font size change
  const handleFontSizeChange = (delta) => {
    if (selectedLayer && selectedLayer.type === 'text') {
      const currentSize = selectedLayer.style?.fontSize || 24;
      const newSize = Math.max(8, Math.min(200, currentSize + delta));
      handleTextPropertyChange('fontSize', newSize);
    }
  };

  // Handle shape type change
  const handleShapeTypeChange = (shapeType) => {
    handleShapePropertyChange('shape', shapeType);
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-3">
          <h3 className="text-sm font-semibold text-gray-700">
            {selectedLayer ? `Edit ${layerType}` : 'Slide Properties'}
          </h3>
        </div>

        {/* Background Color (always visible) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <Palette size={14} />
            <span>Background Color</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowColorPicker(showColorPicker === 'background' ? null : 'background')}
              className="w-10 h-10 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
              style={{ backgroundColor: activeSlide?.background || '#ffffff' }}
              title="Background color"
            />
                {showColorPicker === 'background' && (
                  <div className="absolute z-50 mt-12 ml-0 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                <div className="grid grid-cols-10 gap-1 mb-2">
                  {colorPalette.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color, 'background')}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={activeSlide?.background || '#ffffff'}
                  onChange={(e) => handleColorChange(e.target.value, 'background')}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
            )}
            <input
              type="text"
              value={activeSlide?.background || '#ffffff'}
              onChange={(e) => handleColorChange(e.target.value, 'background')}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
              placeholder="#ffffff"
            />
          </div>
        </div>

        {/* Text Properties */}
        {selectedLayer && layerType === 'text' && (
          <>
            {/* Text Color */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <Type size={14} />
                <span>Text Color</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowColorPicker(showColorPicker === 'text' ? null : 'text')}
                  className="w-10 h-10 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: selectedLayer.style?.color || '#000000' }}
                  title="Text color"
                />
                {showColorPicker === 'text' && (
                  <div className="absolute z-50 mt-12 ml-0 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                    <div className="grid grid-cols-10 gap-1 mb-2">
                      {colorPalette.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorChange(color, 'text')}
                          className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={selectedLayer.style?.color || '#000000'}
                      onChange={(e) => handleColorChange(e.target.value, 'text')}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                )}
                <input
                  type="text"
                  value={selectedLayer.style?.color || '#000000'}
                  onChange={(e) => handleColorChange(e.target.value, 'text')}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600">Font Size</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFontSizeChange(-2)}
                  className="p-1 rounded hover:bg-gray-100"
                  title="Decrease font size"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  value={selectedLayer.style?.fontSize || 24}
                  onChange={(e) => handleTextPropertyChange('fontSize', parseInt(e.target.value) || 24)}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded text-center"
                  min="8"
                  max="200"
                />
                <button
                  onClick={() => handleFontSizeChange(2)}
                  className="p-1 rounded hover:bg-gray-100"
                  title="Increase font size"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600">Font Family</div>
              <select
                value={selectedLayer.style?.fontFamily || 'Arial'}
                onChange={(e) => handleTextPropertyChange('fontFamily', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
                <option value="Georgia">Georgia</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
              </select>
            </div>

            {/* Text Alignment */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600">Alignment</div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleTextPropertyChange('textAlign', 'left')}
                  className={`p-2 rounded ${
                    (selectedLayer.style?.textAlign || 'left') === 'left'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                  title="Align left"
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onClick={() => handleTextPropertyChange('textAlign', 'center')}
                  className={`p-2 rounded ${
                    selectedLayer.style?.textAlign === 'center'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                  title="Align center"
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  onClick={() => handleTextPropertyChange('textAlign', 'right')}
                  className={`p-2 rounded ${
                    selectedLayer.style?.textAlign === 'right'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                  title="Align right"
                >
                  <AlignRight size={16} />
                </button>
              </div>
            </div>

            {/* Text Style */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600">Style</div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const currentWeight = selectedLayer.style?.fontWeight || 'normal';
                    handleTextPropertyChange('fontWeight', currentWeight === 'bold' ? 'normal' : 'bold');
                  }}
                  className={`p-2 rounded ${
                    selectedLayer.style?.fontWeight === 'bold'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                  title="Bold"
                >
                  <Bold size={16} />
                </button>
                <button
                  onClick={() => {
                    const currentStyle = selectedLayer.style?.fontStyle || 'normal';
                    handleTextPropertyChange('fontStyle', currentStyle === 'italic' ? 'normal' : 'italic');
                  }}
                  className={`p-2 rounded ${
                    selectedLayer.style?.fontStyle === 'italic'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                  title="Italic"
                >
                  <Italic size={16} />
                </button>
                <button
                  onClick={() => {
                    const currentDecoration = selectedLayer.style?.textDecoration || 'none';
                    handleTextPropertyChange('textDecoration', currentDecoration === 'underline' ? 'none' : 'underline');
                  }}
                  className={`p-2 rounded ${
                    selectedLayer.style?.textDecoration === 'underline'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                  title="Underline"
                >
                  <Underline size={16} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Shape Properties */}
        {selectedLayer && layerType === 'shape' && (
          <>
            {/* Shape Type */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600">Shape Type</div>
              <div className="grid grid-cols-4 gap-2">
                {['rectangle', 'circle', 'triangle', 'line'].map((shapeType) => (
                  <button
                    key={shapeType}
                    onClick={() => handleShapeTypeChange(shapeType)}
                    className={`p-2 rounded border-2 ${
                      (selectedLayer.style?.shape || 'rectangle') === shapeType
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    title={shapeType}
                  >
                    <Square size={16} className="mx-auto" />
                  </button>
                ))}
              </div>
            </div>

            {/* Fill Color */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <Palette size={14} />
                <span>Fill Color</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowColorPicker(showColorPicker === 'fill' ? null : 'fill')}
                  className="w-10 h-10 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: selectedLayer.style?.fill || '#3b82f6' }}
                  title="Fill color"
                />
                {showColorPicker === 'fill' && (
                  <div className="absolute z-50 mt-12 ml-0 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                    <div className="grid grid-cols-10 gap-1 mb-2">
                      {colorPalette.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorChange(color, 'fill')}
                          className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={selectedLayer.style?.fill || '#3b82f6'}
                      onChange={(e) => handleColorChange(e.target.value, 'fill')}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                )}
                <input
                  type="text"
                  value={selectedLayer.style?.fill || '#3b82f6'}
                  onChange={(e) => handleColorChange(e.target.value, 'fill')}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            {/* Stroke Color */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <Palette size={14} />
                <span>Stroke Color</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowColorPicker(showColorPicker === 'stroke' ? null : 'stroke')}
                  className="w-10 h-10 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: selectedLayer.style?.stroke || 'transparent' }}
                  title="Stroke color"
                />
                {showColorPicker === 'stroke' && (
                  <div className="absolute z-50 mt-12 ml-0 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                    <div className="grid grid-cols-10 gap-1 mb-2">
                      {colorPalette.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorChange(color, 'stroke')}
                          className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={selectedLayer.style?.stroke || '#000000'}
                      onChange={(e) => handleColorChange(e.target.value, 'stroke')}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                )}
                <input
                  type="text"
                  value={selectedLayer.style?.stroke || 'transparent'}
                  onChange={(e) => handleColorChange(e.target.value, 'stroke')}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="transparent"
                />
              </div>
            </div>

            {/* Stroke Width */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600">Stroke Width</div>
              <input
                type="number"
                value={selectedLayer.style?.strokeWidth || 0}
                onChange={(e) => handleShapePropertyChange('strokeWidth', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                min="0"
                max="20"
              />
            </div>
          </>
        )}

        {/* Image Properties */}
        {selectedLayer && layerType === 'image' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <ImageIcon size={14} />
              <span>Image</span>
            </div>
            <p className="text-xs text-gray-500">
              Image properties coming soon
            </p>
          </div>
        )}

        {/* Position & Size (for all layers) */}
        {selectedLayer && (
          <div className="space-y-3 pt-3 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-600">Position & Size</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">X</label>
                <input
                  type="number"
                  value={Math.round(selectedLayer.x)}
                  onChange={(e) => onUpdateLayer?.(selectedLayer.id, { x: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Y</label>
                <input
                  type="number"
                  value={Math.round(selectedLayer.y)}
                  onChange={(e) => onUpdateLayer?.(selectedLayer.id, { y: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Width</label>
                <input
                  type="number"
                  value={Math.round(selectedLayer.width)}
                  onChange={(e) => onUpdateLayer?.(selectedLayer.id, { width: parseFloat(e.target.value) || 100 })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Height</label>
                <input
                  type="number"
                  value={Math.round(selectedLayer.height)}
                  onChange={(e) => onUpdateLayer?.(selectedLayer.id, { height: parseFloat(e.target.value) || 100 })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* No Selection Message */}
        {!selectedLayer && (
          <div className="text-center py-8 text-sm text-gray-500">
            <p>Select a layer to edit properties</p>
            <p className="text-xs mt-2">or change slide background</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
