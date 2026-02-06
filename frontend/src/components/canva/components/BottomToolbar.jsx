import React, { useState, useEffect, useCallback } from 'react';
import {
  FiGrid,
  FiMaximize,
  FiMinimize,
  FiHelpCircle,
  FiRotateCcw,
  FiRotateCw,
  FiZoomOut,
  FiZoomIn,
  FiSave,
  FiDownload,
  FiCopy
} from 'react-icons/fi';

const BottomToolbar = ({
  zoom,
  setZoom,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showGrid,
  onToggleGrid,
  onMaximize,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  handleZoomOut,
  handleZoomIn,
  handleZoomReset,
  handleFitToScreen,
  onSave,
  onExport,
  onDuplicate,
  hasSelection,
  canvasSize,
  setCanvasSize,
  selectedTool
}) => {
  const [zoomValue, setZoomValue] = useState(zoom);
  const [inputValue, setInputValue] = useState(zoom.toString());

  useEffect(() => {
    setZoomValue(zoom);
    setInputValue(zoom.toString());
  }, [zoom]);

  const handleZoomChange = (e) => {
    const value = parseInt(e.target.value) || 100;
    const clamped = Math.max(25, Math.min(200, value));
    setZoomValue(clamped);
    setZoom(clamped);
  };

  const handleZoomInputChange = useCallback((e) => {
    const value = e.target.value;
    setInputValue(value);
  }, []);

  const handleZoomBlur = useCallback((e) => {
    const value = parseInt(e.target.value);
    const clamped = Math.max(25, Math.min(200, isNaN(value) ? 100 : value));
    setZoom(clamped);
    setInputValue(clamped.toString());
  }, [setZoom]);

  const handleZoomEnter = useCallback((e) => {
    if (e.key === 'Enter') {
      handleZoomBlur(e);
      e.target.blur();
    }
  }, [handleZoomBlur]);

  return (
    <div className="h-[50px] bg-gray-100 border-t border-gray-200 flex items-center px-5 gap-4 sticky bottom-0 z-[100] shadow-sm">

      {(onSave || onExport || onDuplicate) && <div className="w-px h-6 bg-gray-300 mx-1" />}

      <div className="flex-1" />

      {/* Zoom controls */}
      {handleZoomOut && handleZoomIn && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            className="px-2 py-1.5 border border-gray-300 rounded-md bg-white cursor-pointer flex items-center justify-center text-xs text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-400"
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
            className={`w-[50px] h-7 px-1 py-0.5 border rounded text-center text-xs font-mono outline-none bg-white text-gray-800 ${zoom.toString() === inputValue ? 'border-gray-300' : 'border-blue-500'
              }`}
            onFocus={(e) => e.target.select()}
          />

          <span className="text-xs text-gray-600 min-w-[10px]">%</span>

          <button
            type="button"
            onClick={handleZoomIn}
            className="px-2 py-1.5 border border-gray-300 rounded-md bg-white cursor-pointer flex items-center justify-center text-xs text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-400"
            title="Zoom In"
          >
            <FiZoomIn size={14} />
          </button>
        </div>
      )}

      {/* Zoom Reset and Fit to Screen */}
      {handleZoomReset && (
        <button
          type="button"
          onClick={handleZoomReset}
          className="px-2 py-1.5 border border-gray-300 rounded-md bg-white cursor-pointer flex items-center justify-center text-xs text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-400"
          title="Reset Zoom"
        >
          <FiMaximize size={14} />
        </button>
      )}
      {/* {handleFitToScreen && (
        <button
          type="button"
          onClick={handleFitToScreen}
          className="px-2 py-1.5 border border-gray-300 rounded-md bg-white cursor-pointer flex items-center justify-center text-xs text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-400"
          title="Fit to Screen"
        >
          <FiMinimize size={14} />
        </button>
      )} */}

      {(handleZoomOut || handleZoomReset || handleFitToScreen) && <div className="w-px h-6 bg-gray-300 mx-1" />}

      {/* Zoom Slider */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min="25"
          max="200"
          value={zoomValue}
          onChange={handleZoomChange}
          className="w-32 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((zoomValue - 25) / (200 - 25)) * 100}%, #e5e7eb ${((zoomValue - 25) / (200 - 25)) * 100}%, #e5e7eb 100%)`
          }}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          }
          input[type="range"]::-moz-range-thumb {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
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

      {/* Canvas Size Controls */}
      {canvasSize && setCanvasSize && (
        <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md bg-white">
          <span className="text-xs text-gray-600 font-medium">Size:</span>
          <input
            type="number"
            value={canvasSize.width}
            onChange={(e) => setCanvasSize(prev => ({ ...prev, width: parseInt(e.target.value) || 800 }))}
            className="w-16 h-6 px-1.5 border border-gray-300 rounded text-xs text-center text-gray-800 focus:outline-none focus:border-blue-500"
            title="Width"
          />
          <span className="text-xs text-gray-400">×</span>
          <input
            type="number"
            value={canvasSize.height}
            onChange={(e) => setCanvasSize(prev => ({ ...prev, height: parseInt(e.target.value) || 600 }))}
            className="w-16 h-6 px-1.5 border border-gray-300 rounded text-xs text-center text-gray-800 focus:outline-none focus:border-blue-500"
            title="Height"
          />
        </div>
      )}

      {/* Grid Toggle */}
      <button
        type="button"
        onClick={onToggleGrid}
        className={`p-2 border border-gray-300 rounded-md cursor-pointer transition-all duration-200 ${showGrid ? 'bg-blue-600 text-white border-blue-400' : 'bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-400'
          }`}
        title="Toggle Grid"
      >
        <FiGrid size={16} />
      </button>

      {/* Maximize */}
      <button
        type="button"
        onClick={onMaximize}
        className="p-2 border border-gray-300 rounded-md bg-white cursor-pointer text-gray-800 transition-all duration-200 hover:bg-gray-50 hover:border-gray-400"
        title="Maximize"
      >
        <FiMaximize size={16} />
      </button>

      {/* Help */}
      <button
        type="button"
        className="p-2 border border-gray-300 rounded-md bg-white cursor-pointer text-gray-800 transition-all duration-200 hover:bg-gray-50 hover:border-gray-400"
        title="Help"
      >
        <FiHelpCircle size={16} />
      </button>
    </div>
  );
};

export default BottomToolbar;
