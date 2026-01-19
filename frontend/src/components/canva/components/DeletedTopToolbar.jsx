import React, { useState, useCallback } from 'react';
import { FiRotateCcw, FiRotateCw, FiZoomOut, FiZoomIn, FiMaximize, FiMinimize, FiGrid, FiSave, FiDownload, FiCopy } from 'react-icons/fi';

const TopToolbar = ({
  undo,
  redo,
  historyIndex,
  historyLength,
  zoom,
  setZoom,
  handleZoomOut,
  handleZoomIn,
  handleZoomReset,
  handleFitToScreen,
  showGrid,
  setShowGrid,
  canvasSize,
  selectedTool,
  onSave,
  onExport,
  onDuplicate,
  hasSelection
}) => {
  const [inputValue, setInputValue] = useState(zoom.toString());

  const handleZoomChange = useCallback((e) => {
    const value = e.target.value;
    setInputValue(value); // Allow typing any number
  }, []);

  const handleZoomBlur = useCallback((e) => {
    const value = parseInt(e.target.value);
    const clamped = Math.max(25, Math.min(400, isNaN(value) ? 100 : value));
    setZoom(clamped);
    setInputValue(clamped.toString());
  }, [setZoom]);

  const handleZoomEnter = useCallback((e) => {
    if (e.key === 'Enter') {
      handleZoomBlur(e);
      e.target.blur();
    }
  }, [handleZoomBlur]);

  React.useEffect(() => {
    setInputValue(zoom.toString());
  }, [zoom]);

  return (
    <div className="h-[60px] bg-white border-b border-gray-200 flex items-center px-5 gap-3 sticky top-0 z-[100] shadow-sm">
      <button 
        className="px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" 
        onClick={undo} 
        disabled={historyIndex <= 0}
      >
        <FiRotateCcw size={16} />
        Undo
      </button>
      <button 
        className="px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" 
        onClick={redo} 
        disabled={historyIndex >= (historyLength - 1)}
      >
        <FiRotateCw size={16} />
        Redo
      </button>

      <div className="w-px h-6 bg-gray-200 mx-2" />

      <div className="flex items-center gap-1">
        <button 
          className="px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300" 
          onClick={handleZoomOut}
        >
          <FiZoomOut size={16} />
        </button>
        
        <input 
          type="text"
          value={inputValue}
          onChange={handleZoomChange}
          onBlur={handleZoomBlur}
          onKeyDown={handleZoomEnter}
          className={`w-[60px] h-7 px-2 py-1 border rounded text-center text-sm font-mono outline-none bg-white text-gray-800 ${
            zoom.toString() === inputValue ? 'border-gray-200' : 'border-blue-500'
          }`}
          onFocus={(e) => e.target.select()}
        />
        
        <span className="text-xs text-gray-600 min-w-[12px]">%</span>
        
        <button 
          className="px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300" 
          onClick={handleZoomIn}
        >
          <FiZoomIn size={16} />
        </button>
      </div>

      <button 
        className="px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300" 
        onClick={handleZoomReset}
      >
        <FiMaximize size={16} />
      </button>
      <button 
        className="px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300" 
        onClick={handleFitToScreen} 
        title="Fit to Screen"
      >
        <FiMinimize size={16} />
      </button>

      <div className="w-px h-6 bg-gray-200 mx-2" />

      <button 
        className={`px-3 py-2 border border-gray-200 rounded-md cursor-pointer flex items-center gap-2 text-sm transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300 ${
          showGrid ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
        }`}
        onClick={() => setShowGrid(!showGrid)}
        title="Toggle Grid"
      >
        <FiGrid size={16} />
      </button>

      <div className="w-px h-6 bg-gray-200 mx-2" />

      <button 
        className="px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300" 
        onClick={onSave} 
        title="Save design"
      >
        <FiSave size={16} />
        Save
      </button>
      <button 
        className="px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300" 
        onClick={onExport}
      >
        <FiDownload size={16} />
        Export
      </button>
      <button 
        className="px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" 
        onClick={onDuplicate} 
        disabled={!hasSelection} 
        title={hasSelection ? 'Duplicate selected layer' : 'Select a layer to duplicate'}
      >
        <FiCopy size={16} />
        Duplicate
      </button>

      <div className="flex-1" />

      <span className="text-sm text-gray-600 mr-4">
        {canvasSize.width} × {canvasSize.height}
      </span>
      <span className="text-sm text-gray-600">
        {selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)}
      </span>
    </div>
  );
};

export default TopToolbar;
