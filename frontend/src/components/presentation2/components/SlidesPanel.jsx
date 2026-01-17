import React from 'react';
import { Plus } from 'lucide-react';

/**
 * SlidesPanel Component
 * 
 * Left panel showing slide thumbnails.
 * Only action: "+ Add Slide"
 */
const SlidesPanel = ({
  slides = [],
  activeSlideId,
  onSlideSelect,
  onAddSlide,
}) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Slides</h2>
        <button
          onClick={onAddSlide}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus size={16} />
          <span>Add Slide</span>
        </button>
      </div>

      {/* Slide Thumbnails */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {slides.map((slide, index) => {
          const isActive = slide.id === activeSlideId;
          return (
            <div
              key={slide.id}
              onClick={() => onSlideSelect?.(slide.id)}
              className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                isActive
                  ? 'border-blue-600 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Thumbnail */}
              <div
                className="aspect-video rounded bg-white flex items-center justify-center"
                style={{ backgroundColor: slide.background }}
              >
                <span className="text-xs text-gray-400">
                  {slide.layers.length} {slide.layers.length === 1 ? 'layer' : 'layers'}
                </span>
              </div>

              {/* Slide Number */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-blue-600 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SlidesPanel;