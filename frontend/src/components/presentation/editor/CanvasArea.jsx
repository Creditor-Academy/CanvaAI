import React from 'react';
import { Layers, Timer, Maximize } from 'lucide-react';

/**
 * CanvasArea - Center section containing the react-konva Stage
 * This component wraps the canvas rendering area
 */
const CanvasArea = ({
  layout,
  activeSlide,
  canvasRenderWidth,
  canvasRenderHeight,
  scale,
  isPanning,
  selectedTool,
  selectedPreset,
  selectedLayerId,
  slideDuration,
  isTimingPanelOpen,
  onTimingPanelToggle,
  onSlideTimingChange,
  onApplyTimingToAllSlides,
  canvasContainerRef,
  stageWrapperRef,
  stageRef,
  onWheel,
  onPanStart,
  onPanEnd,
  onStageClick,
  timingButtonRef,
  timingPanelRef,
  // Render props for complex canvas content
  renderStageContent,
  renderLayerActionBar,
}) => {
  return (
    <section
      style={{
        background: '#f1f5f9',
        borderRadius: '22px',
        padding: '16px',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Canvas toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 10,
              background: 'rgba(79, 70, 229, 0.12)',
              color: '#4338ca',
              fontWeight: 600,
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
            }}
          >
            <Layers size={12} />
            <span>{activeSlide?.layers.length || 0} layers</span>
          </span>
          <span style={{ color: '#475569', fontSize: '0.75rem' }}>
            Tip: Choose a preset on the right, then click anywhere on the slide.
          </span>
        </div>

        {/* Timing control */}
        <div style={{ position: 'relative', flex: '0 1 auto' }}>
          <button
            ref={timingButtonRef}
            onClick={onTimingPanelToggle}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 14,
              background: '#ffffff',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              fontWeight: 600,
              color: '#0f172a',
              cursor: 'pointer',
              boxShadow: isTimingPanelOpen ? '0 10px 25px rgba(15, 23, 42, 0.12)' : 'none',
            }}
          >
            <Timer size={16} color="#4f46e5" />
            <span>{slideDuration}s</span>
          </button>
          {isTimingPanelOpen && (
            <div
              ref={timingPanelRef}
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: 320,
                borderRadius: 16,
                background: '#ffffff',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.2)',
                padding: '14px 16px',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Slide animation timing</span>
                <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                  {slideDuration}s
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={slideDuration}
                  onChange={(e) => onSlideTimingChange(e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={slideDuration}
                  onChange={(e) => onSlideTimingChange(e.target.value)}
                  style={{
                    width: 60,
                    borderRadius: 10,
                    border: '1px solid rgba(148, 163, 184, 0.5)',
                    padding: '6px 8px',
                    textAlign: 'center',
                  }}
                />
              </div>
              <button
                onClick={onApplyTimingToAllSlides}
                style={{
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 12px',
                  background: '#4f46e5',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Apply to all slides
              </button>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>
                Determines how long this slide stays visible when animations auto-play.
              </p>
            </div>
          )}
        </div>

        {/* Layout indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 12px',
            borderRadius: 12,
            background: '#ffffff',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            fontWeight: 600,
            color: '#0f172a',
          }}
        >
          <Maximize size={14} />
          {layout.aspectLabel}
        </div>
      </div>

      {/* Canvas container */}
      <div
        ref={canvasContainerRef}
        onWheel={onWheel}
        onMouseDown={onPanStart}
        onMouseLeave={onPanEnd}
        data-canvas-container
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          overflowY: 'auto',
          overflowX: 'auto',
          maxHeight: '100%',
          maxWidth: '100%',
          minHeight: 0,
          minWidth: 0,
          padding: '20px',
          position: 'relative',
          cursor: isPanning
            ? 'grabbing'
            : selectedTool === 'select' && !selectedPreset && !selectedLayerId
              ? 'grab'
              : selectedPreset
                ? 'crosshair'
                : 'default',
        }}
        className="custom-scrollbar"
      >
        <div
          ref={stageWrapperRef}
          style={{
            width: canvasRenderWidth,
            height: canvasRenderHeight,
            minWidth: canvasRenderWidth,
            minHeight: canvasRenderHeight,
            background: '#ffffff',
            borderRadius: 24,
            boxShadow: '0 30px 60px rgba(15, 23, 42, 0.14)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            backgroundImage:
              'linear-gradient(0deg, transparent 24%, rgba(148, 163, 184, 0.08) 25%, rgba(148, 163, 184, 0.08) 26%, transparent 27%), linear-gradient(90deg, transparent 24%, rgba(148, 163, 184, 0.08) 25%, rgba(148, 163, 184, 0.08) 26%, transparent 27%)',
            backgroundSize: '40px 40px',
          }}
        >
          {/* Stage content is rendered via render prop */}
          {renderStageContent && renderStageContent()}

          {/* GIF Overlay Layer (for animated GIF support) */}
          {activeSlide?.layers?.map(layer => {
            if (layer.type === 'image' && layer.isGif) {
              return (
                <img
                  key={layer.id}
                  src={layer.src}
                  alt=""
                  style={{
                    position: 'absolute',
                    left: layer.x,
                    top: layer.y,
                    width: layer.width,
                    height: layer.height,
                    pointerEvents: 'none',
                    zIndex: 50
                  }}
                  draggable={false}
                />
              );
            }
            return null;
          })}


          {/* Layer action bar */}
          {renderLayerActionBar && renderLayerActionBar()}
        </div>
      </div>
    </section>
  );
};

export default CanvasArea;
