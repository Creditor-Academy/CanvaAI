import React, { useState, useEffect, useCallback } from 'react';
import {
  FiGrid,
  FiMaximize,
  FiHelpCircle,
  FiZoomOut,
  FiZoomIn
} from 'react-icons/fi';

const MIN_ZOOM = 25;
const MAX_ZOOM = 150;

const BottomToolbar = ({
  zoom,
  setZoom,
  currentPage = 1,
  totalPages = 1,
  showGrid,
  onToggleGrid,
  onMaximize,
  handleZoomOut,
  handleZoomIn,
  handleZoomReset,
  canvasSize,
  setCanvasSize
}) => {
  const [zoomValue, setZoomValue] = useState(zoom);
  const [inputValue, setInputValue] = useState(zoom.toString());

  // Sync when zoom changes externally
  useEffect(() => {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    setZoomValue(clamped);
    setInputValue(clamped.toString());
  }, [zoom]);

  // Slider change
  const handleZoomChange = (e) => {
    const value = parseInt(e.target.value) || 100;
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
    setZoomValue(clamped);
    setZoom(clamped);
  };

  // Input typing
  const handleZoomInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  // When input loses focus
  const handleZoomBlur = useCallback((e) => {
    const value = parseInt(e.target.value);
    const clamped = Math.max(
      MIN_ZOOM,
      Math.min(MAX_ZOOM, isNaN(value) ? 100 : value)
    );
    setZoom(clamped);
    setInputValue(clamped.toString());
  }, [setZoom]);

  const handleZoomEnter = useCallback((e) => {
    if (e.key === 'Enter') {
      handleZoomBlur(e);
      e.target.blur();
    }
  }, [handleZoomBlur]);

  // Gradient for slider
  const sliderPercent =
    ((zoomValue - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100;

  return (
    <div className="h-[50px] bg-gray-100 border-t border-gray-200 flex items-center px-5 gap-4 sticky bottom-0 z-[100] shadow-sm">

      <div className="flex-1" />

      {/* Zoom Buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setZoom(prev => Math.max(MIN_ZOOM, prev - 10))}
          className="px-2 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
          title="Zoom Out"
        >
          <FiZoomOut size={14} />
        </button>

        <input
          type="text"
          value={inputValue}
          onChange={handleZoomInputChange}
          onBlur={handleZoomBlur}
          onKeyDown={handleZoomEnter}
          className={`w-[50px] h-7 px-1 border rounded text-center text-xs font-mono bg-white ${zoom.toString() === inputValue
              ? 'border-gray-300'
              : 'border-blue-500'
            }`}
          onFocus={(e) => e.target.select()}
        />

        <span className="text-xs text-gray-600">%</span>

        <button
          type="button"
          onClick={() => setZoom(prev => Math.min(MAX_ZOOM, prev + 10))}
          className="px-2 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
          title="Zoom In"
        >
          <FiZoomIn size={14} />
        </button>
      </div>

      {/* Reset Zoom */}
      <button
        type="button"
        onClick={() => setZoom(100)}
        className="px-2 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
        title="Reset Zoom"
      >
        <FiMaximize size={14} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Zoom Slider */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          value={zoomValue}
          onChange={handleZoomChange}
          className="w-32 h-1 appearance-none cursor-pointer rounded-lg"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${sliderPercent}%, #e5e7eb ${sliderPercent}%, #e5e7eb 100%)`
          }}
        />

        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #3b82f6;
            border: 2px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            cursor: pointer;
          }
          input[type="range"]::-moz-range-thumb {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #3b82f6;
            border: 2px solid white;
            cursor: pointer;
          }
        `}</style>

        <span className="text-sm text-gray-700 font-mono min-w-[45px] text-right">
          {zoomValue}%
        </span>
      </div>

      {/* Page Info */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-700">
          Pages {currentPage}/{totalPages}
        </span>
      </div>

      {/* Canvas Size */}
      {canvasSize && setCanvasSize && (
        <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md bg-white">
          <span className="text-xs text-gray-600 font-medium">Size:</span>
          <input
            type="number"
            value={canvasSize.width}
            onChange={(e) =>
              setCanvasSize(prev => ({
                ...prev,
                width: parseInt(e.target.value) || 800
              }))
            }
            className="w-16 h-6 px-1 border border-gray-300 rounded text-xs text-center"
          />
          <span className="text-xs text-gray-400">×</span>
          <input
            type="number"
            value={canvasSize.height}
            onChange={(e) =>
              setCanvasSize(prev => ({
                ...prev,
                height: parseInt(e.target.value) || 600
              }))
            }
            className="w-16 h-6 px-1 border border-gray-300 rounded text-xs text-center"
          />
        </div>
      )}

      {/* Grid Toggle */}
      <button
        type="button"
        onClick={onToggleGrid}
        className={`p-2 border rounded-md ${showGrid
            ? 'bg-blue-600 text-white border-blue-400'
            : 'bg-white text-gray-800 hover:bg-gray-50'
          }`}
        title="Toggle Grid"
      >
        <FiGrid size={16} />
      </button>

      {/* Maximize */}
      <button
        type="button"
        onClick={onMaximize}
        className="p-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
        title="Maximize"
      >
        <FiMaximize size={16} />
      </button>

      {/* Help */}
      <button
        type="button"
        className="p-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
        title="Help"
      >
        <FiHelpCircle size={16} />
      </button>
    </div>
  );
};

export default BottomToolbar;
