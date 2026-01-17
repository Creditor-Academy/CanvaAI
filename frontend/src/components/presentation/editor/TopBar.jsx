import React, { useRef, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import UndoRedoControls from '../controls/UndoRedoControls';
import ZoomControls from '../controls/ZoomControls';

/**
 * TopBar - Google Slides-style top bar with 2 rows
 * Row 1: Logo, editable title, File/Edit/Insert/Format menus, Present, Share
 * Row 2: Minimal toolbar (Text, Image, Shape, Align, Background, Layout, Theme)
 */
const TopBar = ({
  layout,
  onBack,
  presentationTitle,
  onTitleChange,
  historyIndex,
  historyLength,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onFitToScreen,
  onZoomTo100,
  onPresent,
  onShare,
  selectedTool,
  onToolSelect,
  onBackgroundClick,
  onLayoutClick,
  onThemeClick,
  previewDropdownOpen,
  onPreviewDropdownToggle,
  onPreviewManual,
  onPreviewAutoplay,
  previewButtonRef,
  previewDropdownRef,
}) => {
  const titleInputRef = useRef(null);

  // For now, we'll keep the existing header structure but refactor it to match Google Slides style
  // This is a skeleton that will be enhanced step by step

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
        flexShrink: 0,
      }}
    >
      {/* Row 1: Logo, Title, Menus, Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        }}
      >
        <button
          onClick={onBack}
          style={{
            border: '1px solid rgba(99, 102, 241, 0.18)',
            background: 'rgba(99, 102, 241, 0.08)',
            color: '#4338ca',
            borderRadius: '8px',
            padding: '8px 10px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Logo placeholder */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.85rem',
            flexShrink: 0,
          }}
        >
          {layout.aspectLabel}
        </div>

        {/* Editable title */}
        <input
          ref={titleInputRef}
          type="text"
          value={presentationTitle || 'Untitled Presentation'}
          onChange={(e) => onTitleChange?.(e.target.value)}
          style={{
            border: 'none',
            background: 'transparent',
            fontWeight: 600,
            fontSize: '0.95rem',
            color: '#0f172a',
            padding: '4px 8px',
            borderRadius: '4px',
            minWidth: '200px',
            flex: '0 1 auto',
          }}
          onFocus={(e) => {
            e.target.style.background = 'rgba(15, 23, 42, 0.04)';
          }}
          onBlur={(e) => {
            e.target.style.background = 'transparent';
          }}
        />

        {/* Menu items placeholder (File, Edit, Insert, Format) */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: '16px' }}>
          {['File', 'Edit', 'Insert', 'Format'].map((menu) => (
            <button
              key={menu}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#475569',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {menu}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Actions: Undo/Redo, Zoom, Present, Share */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UndoRedoControls
            historyIndex={historyIndex}
            historyLength={historyLength}
            onUndo={onUndo}
            onRedo={onRedo}
          />
          <div
            style={{
              width: 1,
              height: 20,
              background: 'rgba(15, 23, 42, 0.1)',
            }}
          />
          <ZoomControls
            zoom={zoom}
            onZoomChange={onZoomChange}
            onFitToScreen={onFitToScreen}
            onZoomTo100={onZoomTo100}
            compact={true}
          />
          <div
            style={{
              width: 1,
              height: 20,
              background: 'rgba(15, 23, 42, 0.1)',
            }}
          />
          <div style={{ position: 'relative' }}>
            <button
              ref={previewButtonRef}
              onClick={onPreviewDropdownToggle}
              style={{
                border: '1px solid rgba(15, 23, 42, 0.1)',
                background: 'rgba(15, 23, 42, 0.04)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: '#0f172a',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              Present
              <span style={{ fontSize: '0.7rem' }}>▾</span>
            </button>
            {previewDropdownOpen && (
              <div
                ref={previewDropdownRef}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  width: 240,
                  borderRadius: 14,
                  background: '#ffffff',
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
                  padding: '8px 0',
                  zIndex: 50,
                }}
              >
                <button
                  onClick={onPreviewManual}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    padding: '10px 16px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>Present fullscreen</div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    Use ← → keys to move through slides.
                  </p>
                </button>
                <div
                  style={{
                    height: 1,
                    background: 'rgba(15, 23, 42, 0.06)',
                    margin: '4px 0',
                  }}
                />
                <button
                  onClick={onPreviewAutoplay}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    padding: '10px 16px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>Auto play</div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    Plays fullscreen using slide timings.
                  </p>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onShare}
            style={{
              border: 'none',
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              borderRadius: '8px',
              padding: '6px 20px',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 14px 30px rgba(251, 191, 36, 0.32)',
            }}
          >
            Share
          </button>
        </div>
      </div>

      {/* Row 2: Minimal toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
        }}
      >
        <button
          onClick={() => onToolSelect?.('text')}
          style={{
            border: selectedTool === 'text' ? '2px solid #4f46e5' : '1px solid rgba(15, 23, 42, 0.1)',
            background: selectedTool === 'text' ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
            borderRadius: '6px',
            padding: '6px 12px',
            fontWeight: 500,
            fontSize: '0.875rem',
            color: '#0f172a',
            cursor: 'pointer',
          }}
        >
          Text
        </button>
        <button
          onClick={() => onToolSelect?.('image')}
          style={{
            border: selectedTool === 'image' ? '2px solid #4f46e5' : '1px solid rgba(15, 23, 42, 0.1)',
            background: selectedTool === 'image' ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
            borderRadius: '6px',
            padding: '6px 12px',
            fontWeight: 500,
            fontSize: '0.875rem',
            color: '#0f172a',
            cursor: 'pointer',
          }}
        >
          Image
        </button>
        <button
          onClick={() => onToolSelect?.('shape')}
          style={{
            border: selectedTool === 'shape' ? '2px solid #4f46e5' : '1px solid rgba(15, 23, 42, 0.1)',
            background: selectedTool === 'shape' ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
            borderRadius: '6px',
            padding: '6px 12px',
            fontWeight: 500,
            fontSize: '0.875rem',
            color: '#0f172a',
            cursor: 'pointer',
          }}
        >
          Shape
        </button>
        <div
          style={{
            width: 1,
            height: 20,
            background: 'rgba(15, 23, 42, 0.1)',
            margin: '0 4px',
          }}
        />
        <button
          onClick={onBackgroundClick}
          style={{
            border: '1px solid rgba(15, 23, 42, 0.1)',
            background: 'transparent',
            borderRadius: '6px',
            padding: '6px 12px',
            fontWeight: 500,
            fontSize: '0.875rem',
            color: '#0f172a',
            cursor: 'pointer',
          }}
        >
          Background
        </button>
        <button
          onClick={onLayoutClick}
          style={{
            border: '1px solid rgba(15, 23, 42, 0.1)',
            background: 'transparent',
            borderRadius: '6px',
            padding: '6px 12px',
            fontWeight: 500,
            fontSize: '0.875rem',
            color: '#0f172a',
            cursor: 'pointer',
          }}
        >
          Layout
        </button>
        <button
          onClick={onThemeClick}
          style={{
            border: '1px solid rgba(15, 23, 42, 0.1)',
            background: 'transparent',
            borderRadius: '6px',
            padding: '6px 12px',
            fontWeight: 500,
            fontSize: '0.875rem',
            color: '#0f172a',
            cursor: 'pointer',
          }}
        >
          Theme
        </button>
      </div>
    </div>
  );
};

export default TopBar;
