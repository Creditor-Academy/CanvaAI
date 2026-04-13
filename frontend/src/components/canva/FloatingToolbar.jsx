import React from 'react';
import { createPortal } from 'react-dom';
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
  getLayerPrimaryColor,
  // optional absolute screen position (px) -- when provided toolbar will render into document.body at fixed coords
  position, // { left, top }
  zoom // optional zoom percentage (100 = 100%) to counter-scale when rendering inline
}) => {
  if (!layer) return null;

  const hasTextContent = layer.type === 'text' && layer.text?.trim();

  const toolbarInner = (
    <div
      className="flex items-center gap-3 rounded-2xl border border-gray-400 bg-white/95 px-3.5 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.14)] backdrop-blur-sm z-50"
      onMouseDown={(e) => e.stopPropagation()}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Color Picker */}
      {layer.type === 'text' && (
        <label className="relative h-9 w-9 overflow-hidden rounded-xl border border-gray-200 cursor-pointer">
          <input
            type="color"
            aria-label="Change color"
            value={getLayerPrimaryColor(layer)}
            onChange={(e) => onColorChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />

          <div
            className="h-full w-full"
            style={{ backgroundColor: getLayerPrimaryColor(layer) }}
          />
        </label>
      )}

      {/* Duplicate Button */}
      <button
        type="button"
        title="Duplicate"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white cursor-pointer transition-colors hover:bg-gray-50"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDuplicate(layer.id);
        }}
      >
        <FiCopy size={18} color="#111827" />
      </button>

      {/* Delete Button */}
      <button
        type="button"
        title="Delete"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white cursor-pointer transition-colors hover:bg-gray-50"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(layer.id);
        }}
      >
        <FiTrash2 size={18} color="#dc2626" />
      </button>

      {/* Enhance Button (only for text layers) */}
      {layer.type === 'text' && (
        <>
          <TextEnhanceButton
            onClick={onEnhance}
            disabled={isEnhancing || !hasTextContent}
            isEnhancing={isEnhancing}
            variant="floating"
            size={18}
          />
          <TextStyleButton
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openTextStyleModal'));
            }}
            disabled={!hasTextContent}
            variant="floating"
            size={18}
          />
        </>
      )}
    </div>
  );

  // If position provided, render as fixed portal (screen coords)
  if (position && typeof document !== 'undefined') {
    const portalStyle = {
      position: 'fixed',
      left: position.left,
      top: position.top,
      transform: 'translate(-50%, -100%)',
      pointerEvents: 'auto',
      zIndex: 99999
    };
    const portal = (
      <div style={portalStyle}>
        {toolbarInner}
      </div>
    );
    return createPortal(portal, document.body);
  }

  // Inline mode: keep toolbar absolutely positioned relative to layer.
  // Accept optional `zoom` prop on `layer.__toolbarZoom` to counter-scale when canvas is zoomed.
  const zoomVal = zoom || (layer && layer.__toolbarZoom) || 100;
  const scale = zoomVal / 100;
  const inlineStyle = {
    position: 'absolute',
    top: '-64px',
    left: '0px',
    transformOrigin: 'top left',
    transform: `scale(${scale})`,
    pointerEvents: 'auto',
    zIndex: 99999
  };

  return (
    <div style={inlineStyle}>
      {toolbarInner}
    </div>
  );
};

export default FloatingToolbar;

