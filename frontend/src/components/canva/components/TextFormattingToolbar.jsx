import React, { useState, useRef, useEffect } from 'react';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiAlignJustify,
  FiType,
  FiZap,
  FiMove,
  FiChevronDown,
  FiRotateCcw,
  FiRotateCw,
  FiSave,
  FiDownload,
  FiCopy
} from 'react-icons/fi';

const TextFormattingToolbar = ({
  selectedLayer,
  layer,
  textSettings,
  onTextSettingsChange,
  onTextColorChange,
  onTextAlignChange,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onToggleStrikethrough,
  onToggleCase,
  onEffects,
  onAnimate,
  onPosition,
  // TopToolbar features
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  onExport,
  onDuplicate,
  hasSelection
}) => {
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const fontDropdownRef = useRef(null);

  const fonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
    'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
    'Trebuchet MS', 'Arial Black', 'Impact', 'Libre Baskerville',
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Playfair Display'
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target)) {
        setShowFontDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Always show toolbar, but disable controls when no text layer is selected
  const isTextLayerSelected = selectedLayer && layer && layer.type === 'text';

  const currentFontSize = isTextLayerSelected ? (layer.fontSize || textSettings.fontSize || 16) : (textSettings.fontSize || 16);
  const currentFontFamily = isTextLayerSelected ? (layer.fontFamily || textSettings.fontFamily || 'Arial') : (textSettings.fontFamily || 'Arial');
  const isBold = isTextLayerSelected ? (layer.fontWeight === 'bold' || layer.fontWeight === '700') : false;
  const isItalic = isTextLayerSelected ? (layer.fontStyle === 'italic') : false;
  const isUnderline = isTextLayerSelected ? (layer.textDecoration === 'underline') : false;
  const isStrikethrough = isTextLayerSelected ? (layer.textDecoration === 'line-through') : false;
  const currentAlign = isTextLayerSelected ? (layer.textAlign || 'left') : (textSettings.textAlign || 'left');
  const currentColor = isTextLayerSelected ? (layer.color || '#000000') : (textSettings.color || '#000000');

  const handleFontSizeDecrease = () => {
    const newSize = Math.max(8, currentFontSize - 2);
    onTextSettingsChange('fontSize', newSize);
  };

  const handleFontSizeIncrease = () => {
    const newSize = Math.min(200, currentFontSize + 2);
    onTextSettingsChange('fontSize', newSize);
  };

  const handleFontFamilySelect = (font) => {
    onTextSettingsChange('fontFamily', font);
    setShowFontDropdown(false);
  };

  const handleColorSelect = (color) => {
    onTextColorChange(color);
    setShowColorPicker(false);
  };

  const commonColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
  ];

  return (
    <div className="h-[120px] bg-white border-b border-gray-200 flex flex-col px-5 py-2 gap-2 shadow-sm">
      {/* Row 1 */}
      <div className="flex items-center gap-3">
        {/* Undo/Redo buttons */}
        {onUndo && onRedo && (
          <>
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="px-3 py-1.5 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRotateCcw size={16} />
              Undo
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="px-3 py-1.5 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRotateCw size={16} />
              Redo
            </button>
            <div className="w-px h-6 bg-gray-200" />
          </>
        )}

        {/* Font Family Dropdown */}
        <div className="relative" ref={fontDropdownRef}>
          <button
            type="button"
            onClick={() => setShowFontDropdown(!showFontDropdown)}
            className="px-3 py-1.5 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300 min-w-[160px] justify-between"
          >
            <span>{currentFontFamily}</span>
            <FiChevronDown size={14} />
          </button>
          {showFontDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[100] max-h-[200px] overflow-y-auto min-w-[200px]">
              {fonts.map((font) => (
                <button
                  key={font}
                  type="button"
                  onClick={() => handleFontFamilySelect(font)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* Font Size Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleFontSizeDecrease}
            disabled={!isTextLayerSelected}
            className={`px-2 py-1.5 border border-gray-200 rounded-md bg-white cursor-pointer text-sm text-gray-800 transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 ${!isTextLayerSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            -
          </button>
          <input
            type="number"
            value={currentFontSize}
            onChange={(e) => {
              if (!isTextLayerSelected) return;
              const value = parseInt(e.target.value) || 16;
              const clamped = Math.max(8, Math.min(200, value));
              onTextSettingsChange('fontSize', clamped);
            }}
            disabled={!isTextLayerSelected}
            className={`w-[60px] h-8 px-2 border border-gray-200 rounded text-center text-sm outline-none bg-white text-gray-800 ${!isTextLayerSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
            min="8"
            max="200"
          />
          <button
            type="button"
            onClick={handleFontSizeIncrease}
            disabled={!isTextLayerSelected}
            className={`px-2 py-1.5 border border-gray-200 rounded-md bg-white cursor-pointer text-sm text-gray-800 transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 ${!isTextLayerSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            +
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* Text Color Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="px-3 py-1.5 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-300"
            title="Text Color"
          >
            <div className="relative">
              <FiType size={18} className="text-gray-800" />
              <div
                className="absolute bottom-0 left-0 w-full h-0.5"
                style={{ backgroundColor: currentColor }}
              />
            </div>
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[100] p-3">
              <div className="grid grid-cols-5 gap-2 mb-2">
                {commonColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition-all"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <input
                type="color"
                value={currentColor}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="w-full h-8 cursor-pointer"
              />
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* Text Style Buttons */}
        <button
          type="button"
          onClick={onToggleBold}
          disabled={!isTextLayerSelected}
          className={`px-3 py-1.5 border border-gray-200 rounded-md cursor-pointer flex items-center justify-center text-sm transition-all duration-200 font-bold ${isBold ? 'bg-blue-600 text-white border-blue-400' : 'bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-300'
            } ${!isTextLayerSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Bold"
        >
          <FiBold size={16} />
        </button>
        <button
          type="button"
          onClick={onToggleItalic}
          disabled={!isTextLayerSelected}
          className={`px-3 py-1.5 border border-gray-200 rounded-md cursor-pointer flex items-center justify-center text-sm transition-all duration-200 ${isItalic ? 'bg-purple-600 text-white border-purple-400' : 'bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-300'
            } ${!isTextLayerSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Italic"
          style={{ fontStyle: 'italic' }}
        >
          <FiItalic size={16} />
        </button>
        <button
          type="button"
          onClick={onToggleUnderline}
          disabled={!isTextLayerSelected}
          className={`px-3 py-1.5 border border-gray-200 rounded-md cursor-pointer flex items-center justify-center text-sm transition-all duration-200 ${isUnderline ? 'bg-blue-600 text-white border-blue-400' : 'bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-300'
            } ${!isTextLayerSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Underline"
        >
          <FiUnderline size={16} />
        </button>
        <button
          type="button"
          onClick={onToggleStrikethrough}
          disabled={!isTextLayerSelected}
          className={`px-3 py-1.5 border border-gray-200 rounded-md cursor-pointer flex items-center justify-center text-sm transition-all duration-200 ${isStrikethrough ? 'bg-blue-600 text-white border-blue-400' : 'bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-300'
            } ${!isTextLayerSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Strikethrough"
          style={{ textDecoration: 'line-through' }}
        >
          S
        </button>
        <button
          type="button"
          onClick={onToggleCase}
          disabled={!isTextLayerSelected}
          className={`px-3 py-1.5 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center justify-center text-sm text-gray-800 transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 ${!isTextLayerSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Change Case"
        >
          aA
        </button>

        <div className="w-px h-6 bg-gray-200" />

        {/* Text Alignment */}
        <button
          type="button"
          onClick={() => onTextAlignChange('left')}
          disabled={!isTextLayerSelected}
          className={`px-3 py-1.5 border border-gray-200 rounded-md cursor-pointer flex items-center justify-center text-sm transition-all duration-200 ${currentAlign === 'left' ? 'bg-blue-600 text-white border-blue-400' : 'bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-300'
            } ${!isTextLayerSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Align Left"
        >
          <FiAlignLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => onTextAlignChange('center')}
          disabled={!isTextLayerSelected}
          className={`px-3 py-1.5 border border-gray-200 rounded-md cursor-pointer flex items-center justify-center text-sm transition-all duration-200 ${currentAlign === 'center' ? 'bg-blue-600 text-white border-blue-400' : 'bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-300'
            } ${!isTextLayerSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Align Center"
        >
          <FiAlignCenter size={16} />
        </button>
        <button
          type="button"
          onClick={() => onTextAlignChange('right')}
          disabled={!isTextLayerSelected}
          className={`px-3 py-1.5 border border-gray-200 rounded-md cursor-pointer flex items-center justify-center text-sm transition-all duration-200 ${currentAlign === 'right' ? 'bg-blue-600 text-white border-blue-400' : 'bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-300'
            } ${!isTextLayerSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Align Right"
        >
          <FiAlignRight size={16} />
        </button>
        <button
          type="button"
          onClick={() => onTextAlignChange('justify')}
          disabled={!isTextLayerSelected}
          className={`px-3 py-1.5 border border-gray-200 rounded-md cursor-pointer flex items-center justify-center text-sm transition-all duration-200 ${currentAlign === 'justify' ? 'bg-blue-600 text-white border-blue-400' : 'bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-300'
            } ${!isTextLayerSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Justify"
        >
          <FiAlignJustify size={16} />
        </button>
      </div>

      {/* Row 2 */}
      <div className="flex items-center gap-3">
        {/* Save/Export/Duplicate buttons */}
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            className="px-3 py-1.5 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300"
            title="Save design"
          >
            <FiSave size={16} />
            Save
          </button>
        )}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="px-3 py-1.5 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300"
          >
            <FiDownload size={16} />
            Export
          </button>
        )}
        {onDuplicate && (
          <button
            type="button"
            onClick={onDuplicate}
            disabled={!hasSelection}
            className="px-3 py-1.5 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title={hasSelection ? 'Duplicate selected layer' : 'Select a layer to duplicate'}
          >
            <FiCopy size={16} />
            Duplicate
          </button>
        )}

        {(onSave || onExport || onDuplicate) && <div className="w-px h-6 bg-gray-200" />}

        {/* Effects, Animate, Position */}
        <button
          type="button"
          onClick={onEffects}
          className="px-3 py-1.5 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300"
          title="Effects"
        >
          <FiZap size={16} />
          Effects
        </button>
        <button
          type="button"
          onClick={onAnimate}
          className="px-3 py-1.5 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300"
          title="Animate"
        >
          Animate
        </button>
        <button
          type="button"
          onClick={onPosition}
          className="px-3 py-1.5 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300"
          title="Position"
        >
          <FiMove size={16} />
          Position
        </button>
      </div>
    </div>
  );
};

export default TextFormattingToolbar;
