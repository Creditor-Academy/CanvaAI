import React from 'react';
import { ChevronRight } from 'lucide-react';
import TextEnhanceControls from '../ai/TextEnhanceControls';
import ImageGenerateControls from '../ai/ImageGenerateControls';

/**
 * RightPanel - Minimal vertical blocks
 * Block 1: Themes
 * Block 2: AI actions (rewrite text, generate slide/image)
 * Block 3: Present / Export
 * 
 * Advanced effects and layer manager are hidden by default (not deleted)
 */
const RightPanel = ({
  isVisible,
  onToggleVisibility,
  // Themes
  onThemeSelect,
  // AI actions
  selectedLayer,
  onApplyEnhancedText,
  onAddGeneratedImage,
  // Present / Export
  onPresent,
  onExport,
  // Advanced controls (hidden by default, can be toggled)
  showAdvancedControls,
  onToggleAdvancedControls,
  renderAdvancedControls,
}) => {
  if (!isVisible) return null;

  return (
    <aside
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '12px 14px',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: 0,
        maxHeight: '100%',
        height: '100%',
      }}
      className="custom-scrollbar"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>Properties</span>
        <button
          onClick={onToggleVisibility}
          title="Hide panel"
          style={{
            border: 'none',
            background: 'rgba(15, 23, 42, 0.06)',
            color: '#475569',
            borderRadius: 10,
            padding: '4px',
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Block 1: Themes */}
      <div
        style={{
          padding: '12px',
          background: 'rgba(248, 250, 252, 0.5)',
          borderRadius: '12px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        }}
      >
        <div
          style={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#94a3b8',
            fontWeight: 700,
            marginBottom: '10px',
          }}
        >
          Themes
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Theme options placeholder - will be implemented with actual theme data */}
          <button
            onClick={() => onThemeSelect?.('default')}
            style={{
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: '#ffffff',
              borderRadius: '8px',
              padding: '8px 12px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#0f172a',
            }}
          >
            Default
          </button>
          <button
            onClick={() => onThemeSelect?.('modern')}
            style={{
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: '#ffffff',
              borderRadius: '8px',
              padding: '8px 12px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#0f172a',
            }}
          >
            Modern
          </button>
          <button
            onClick={() => onThemeSelect?.('minimal')}
            style={{
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: '#ffffff',
              borderRadius: '8px',
              padding: '8px 12px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#0f172a',
            }}
          >
            Minimal
          </button>
        </div>
      </div>

      {/* Block 2: AI Actions */}
      <div
        style={{
          padding: '12px',
          background: 'rgba(248, 250, 252, 0.5)',
          borderRadius: '12px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        }}
      >
        <div
          style={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#94a3b8',
            fontWeight: 700,
            marginBottom: '10px',
          }}
        >
          AI Actions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Text enhancement */}
          {selectedLayer?.type === 'text' && (
            <TextEnhanceControls layer={selectedLayer} onApply={onApplyEnhancedText} />
          )}
          
          {/* Image generation */}
          <ImageGenerateControls onImageReady={onAddGeneratedImage} />
          
          {/* Generate slide placeholder */}
          <button
            onClick={() => {
              // Placeholder for generate slide action
              console.log('Generate slide clicked');
            }}
            style={{
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: '#ffffff',
              borderRadius: '8px',
              padding: '10px 12px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#0f172a',
              fontWeight: 500,
            }}
          >
            Generate Slide
          </button>
        </div>
      </div>

      {/* Block 3: Present / Export */}
      <div
        style={{
          padding: '12px',
          background: 'rgba(248, 250, 252, 0.5)',
          borderRadius: '12px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        }}
      >
        <div
          style={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#94a3b8',
            fontWeight: 700,
            marginBottom: '10px',
          }}
        >
          Actions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={onPresent}
            style={{
              border: 'none',
              background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
              borderRadius: '8px',
              padding: '10px 12px',
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#ffffff',
              fontWeight: 600,
            }}
          >
            Present
          </button>
          <button
            onClick={onExport}
            style={{
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: '#ffffff',
              borderRadius: '8px',
              padding: '10px 12px',
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#0f172a',
              fontWeight: 500,
            }}
          >
            Export
          </button>
        </div>
      </div>

      {/* Advanced controls toggle (hidden by default) */}
      {showAdvancedControls && renderAdvancedControls && (
        <div
          style={{
            padding: '12px',
            background: 'rgba(248, 250, 252, 0.5)',
            borderRadius: '12px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#94a3b8',
              fontWeight: 700,
              marginBottom: '10px',
            }}
          >
            Advanced
          </div>
          {renderAdvancedControls()}
        </div>
      )}

      {/* Toggle for advanced controls */}
      <button
        onClick={onToggleAdvancedControls}
        style={{
          border: '1px solid rgba(148, 163, 184, 0.2)',
          background: 'transparent',
          borderRadius: '8px',
          padding: '8px 12px',
          textAlign: 'center',
          cursor: 'pointer',
          fontSize: '0.75rem',
          color: '#64748b',
          fontWeight: 500,
        }}
      >
        {showAdvancedControls ? 'Hide' : 'Show'} Advanced
      </button>
    </aside>
  );
};

export default RightPanel;
