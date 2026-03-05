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
  const timingBtnShadow = isTimingPanelOpen ? 'shadow-xl' : '';

  const cursorClass = isPanning
    ? 'cursor-grabbing'
    : (selectedTool === 'select' && !selectedPreset && !selectedLayerId)
      ? 'cursor-grab'
      : selectedPreset
        ? 'cursor-crosshair'
        : 'cursor-default';

  return (
    <section className="bg-slate-100 rounded-[22px] p-4 shadow-sm flex flex-col gap-3 h-full min-h-0 overflow-hidden">
      {/* Canvas toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-600 font-semibold text-sm">
            <Layers size={12} />
            <span>{activeSlide?.layers.length || 0} layers</span>
          </span>
          <span className="text-slate-600 text-sm">Tip: Choose a preset on the right, then click anywhere on the slide.</span>
        </div>

        {/* Timing control */}
        <div className="relative flex-shrink-0">
          <button
            ref={timingButtonRef}
            onClick={onTimingPanelToggle}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[14px] bg-white border border-slate-200 font-semibold text-slate-900 ${timingBtnShadow}`}
          >
            <Timer size={16} color="#4f46e5" />
            <span>{slideDuration}s</span>
          </button>

          {isTimingPanelOpen && (
            <div
              ref={timingPanelRef}
              className="absolute top-[calc(100%+10px)] right-0 w-80 rounded-[16px] bg-white border border-slate-200 shadow-2xl p-4 z-20 flex flex-col gap-3"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">Slide animation timing</span>
                <span className="text-sm text-slate-600 font-semibold">{slideDuration}s</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={slideDuration}
                  onChange={(e) => onSlideTimingChange(e.target.value)}
                  className="flex-1"
                />
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={slideDuration}
                  onChange={(e) => onSlideTimingChange(e.target.value)}
                  className="w-16 rounded-md border border-slate-200 px-2 py-1 text-center"
                />
              </div>

              <button
                onClick={onApplyTimingToAllSlides}
                className="rounded-md px-3 py-2 bg-indigo-600 text-white font-semibold"
              >
                Apply to all slides
              </button>

              <p className="m-0 text-sm text-slate-500 leading-6">Determines how long this slide stays visible when animations auto-play.</p>
            </div>
          )}
        </div>

        {/* Layout indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 font-semibold text-slate-900">
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
        className={`flex-1 flex items-start justify-start overflow-auto max-h-full max-w-full min-h-0 min-w-0 p-5 relative ${cursorClass} custom-scrollbar`}
      >
        <div
          ref={stageWrapperRef}
          style={{
            width: canvasRenderWidth,
            height: canvasRenderHeight,
            minWidth: canvasRenderWidth,
            minHeight: canvasRenderHeight,
            backgroundImage:
              'linear-gradient(0deg, transparent 24%, rgba(148, 163, 184, 0.08) 25%, rgba(148, 163, 184, 0.08) 26%, transparent 27%), linear-gradient(90deg, transparent 24%, rgba(148, 163, 184, 0.08) 25%, rgba(148, 163, 184, 0.08) 26%, transparent 27%)',
            backgroundSize: '40px 40px',
          }}
          className="bg-white rounded-[24px] shadow-2xl border border-slate-200 relative overflow-hidden flex-shrink-0"
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
