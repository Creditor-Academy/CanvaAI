import React from 'react';
import { FiCopy, FiTrash2 } from 'react-icons/fi';
import TextEnhanceButton from './TextEnhanceButton';
import TextStyleButton from './TextStyleButton';

/**
 * FloatingToolbar - Floating action bar that appears above selected elements
 * Contains color picker, duplicate, delete, and enhance (for text) buttons
 */

const FloatingToolbar = ({
  layer,
  onColorChange,
  onDuplicate,
  onDelete,
  onEnhance,
  isEnhancing = false,
  getLayerPrimaryColor
}) => {
  if (!layer) return null;

  const hasTextContent = layer.type === 'text' && layer.text?.trim();

  return (
    <div 
      className="absolute -top-11 left-0 flex items-center gap-2 bg-white/95 border border-gray-500 px-2.5 py-1.5 shadow-[0_6px_16px_rgba(0,0,0,0.12)] backdrop-blur-sm z-20" 
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Color Picker */}
      <input
        type="color"
        aria-label="Change color"
        value={getLayerPrimaryColor(layer)}
        onChange={(e) => onColorChange(e.target.value)}
        className="w-7 h-7 p-0 border border-gray-200 rounded-lg bg-none cursor-pointer appearance-none"
        style={{
          WebkitAppearance: 'none',
          appearance: 'none'
        }}
      />
      
      {/* Duplicate Button */}
      <button
        type="button"
        title="Duplicate"
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDuplicate(layer.id);
        }}
      >
        <FiCopy size={16} color="#111827" />
      </button>
      
      {/* Delete Button */}
      <button
        type="button"
        title="Delete"
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(layer.id);
        }}
      >
        <FiTrash2 size={16} color="#dc2626" />
      </button>
      
      {/* Enhance Button (only for text layers) */}
      {layer.type === 'text' && (
        <>
          <TextEnhanceButton
            onClick={onEnhance}
            disabled={isEnhancing || !hasTextContent}
            isEnhancing={isEnhancing}
            variant="floating"
            size={16}
          />
          <TextStyleButton
            onClick={() => {
              // Dispatch event to open the modal in the parent component
              window.dispatchEvent(new CustomEvent('openTextStyleModal'));
            }}
            disabled={!hasTextContent}
            variant="floating"
            size={16}
          />
        </>
      )}
    </div>
  );
};

export default FloatingToolbar;
