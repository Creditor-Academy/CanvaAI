import React from 'react';

/**
 * CanvasShell Component
 * 
 * Wrapper for the canvas area that handles:
 * - Canvas container styling
 * - Zoom/pan controls
 * - Canvas centering
 */
const CanvasShell = ({
  children,
  canvasWidth,
  canvasHeight,
  zoom,
  pan,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  className = '',
}) => {
  return (
    <div className="flex-1 bg-gray-100 overflow-hidden relative">
      {/* Canvas Container */}
      <div
        className="w-full h-full overflow-auto"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        style={{
          cursor: 'default',
        }}
      >
        {/* Centered Canvas Area */}
        <div
          className="flex items-center justify-center min-h-full min-w-full p-8"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          {/* Canvas */}
          <div
            className="bg-white shadow-2xl rounded-lg relative"
            style={{
              width: `${canvasWidth * zoom}px`,
              height: `${canvasHeight * zoom}px`,
              transformOrigin: 'center center',
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Zoom Indicator (optional) */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-xs">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};

export default CanvasShell;
