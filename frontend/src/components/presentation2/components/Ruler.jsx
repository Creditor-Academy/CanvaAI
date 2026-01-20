import React, { useMemo } from 'react';

/**
 * Ruler Component
 * 
 * Displays a ruler with measurements, similar to Google Slides.
 * Shows scale based on zoom level and canvas dimensions.
 * 
 * @param {string} orientation - 'horizontal' or 'vertical'
 * @param {number} length - Length of the ruler in pixels
 * @param {number} zoom - Current zoom level
 * @param {number} canvasSize - Canvas size in pixels (width for horizontal, height for vertical)
 * @param {number} scrollOffset - Scroll offset for syncing ruler with canvas
 */
const Ruler = ({ orientation = 'horizontal', length, zoom, canvasSize, scrollOffset = 0 }) => {
  // Convert pixels to inches (assuming 96 DPI)
  const PIXELS_PER_INCH = 96;
  
  // Calculate the scale - how many pixels per inch at current zoom
  const pixelsPerInch = PIXELS_PER_INCH * zoom;
  
  // Calculate how many inches fit in the visible ruler length
  const visibleInches = length / pixelsPerInch;
  
  // Determine the interval for tick marks based on zoom
  const getTickInterval = () => {
    if (zoom < 0.5) return 2; // Show 2 inch marks when zoomed out
    if (zoom < 1) return 1; // Show 1 inch marks
    if (zoom < 2) return 0.5; // Show 0.5 inch marks when zoomed in
    return 0.25; // Show 0.25 inch marks when very zoomed in
  };
  
  const tickInterval = getTickInterval();
  
  // Calculate start position based on scroll offset
  const startInch = Math.floor((scrollOffset / pixelsPerInch) / tickInterval) * tickInterval;
  const endInch = startInch + visibleInches + tickInterval;
  
  // Generate tick marks
  const ticks = useMemo(() => {
    const tickArray = [];
    for (let inch = startInch; inch <= endInch; inch += tickInterval) {
      // Calculate position relative to ruler start (accounting for scroll)
      const absolutePosition = inch * pixelsPerInch;
      const position = absolutePosition - scrollOffset;
      const isMajorTick = inch % 1 === 0; // Whole numbers are major ticks
      
      // Only include ticks that are visible in the ruler
      if (position >= -10 && position <= length + 10) {
        tickArray.push({
          position: Math.max(0, Math.min(length, position)),
          inch,
          isMajorTick,
        });
      }
    }
    return tickArray;
  }, [startInch, endInch, tickInterval, pixelsPerInch, length, scrollOffset]);

  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      className="bg-gray-50 border-b border-r border-gray-300 flex-shrink-0"
      style={{
        width: isHorizontal ? length : '20px',
        height: isHorizontal ? '20px' : length,
        position: 'relative',
        userSelect: 'none',
        fontSize: '10px',
        color: '#666',
      }}
    >
      {/* Ruler background with subtle pattern */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%)',
        }}
      />
      
      {/* Tick marks and labels */}
      {isHorizontal ? (
        // Horizontal ruler
        <>
          {ticks.map((tick, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                left: `${tick.position}px`,
                top: 0,
                width: '1px',
                height: tick.isMajorTick ? '12px' : '6px',
                background: '#999',
                transform: 'translateX(-0.5px)',
              }}
            />
          ))}
          {/* Labels for major ticks */}
          {ticks
            .filter((tick) => tick.isMajorTick && tick.position >= 0 && tick.position <= length)
            .map((tick, index) => (
              <div
                key={`label-${index}`}
                className="absolute"
                style={{
                  left: `${tick.position + 2}px`,
                  top: '2px',
                  fontSize: '10px',
                  color: '#333',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {Math.round(tick.inch)}
              </div>
            ))}
        </>
      ) : (
        // Vertical ruler
        <>
          {ticks.map((tick, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                top: `${tick.position}px`,
                left: 0,
                height: '1px',
                width: tick.isMajorTick ? '12px' : '6px',
                background: '#999',
                transform: 'translateY(-0.5px)',
              }}
            />
          ))}
          {/* Labels for major ticks */}
          {ticks
            .filter((tick) => tick.isMajorTick && tick.position >= 0 && tick.position <= length)
            .map((tick, index) => (
              <div
                key={`label-${index}`}
                className="absolute"
                style={{
                  top: `${tick.position + 2}px`,
                  left: '2px',
                  fontSize: '10px',
                  color: '#333',
                  fontWeight: 500,
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'left center',
                  whiteSpace: 'nowrap',
                }}
              >
                {Math.round(tick.inch)}
              </div>
            ))}
        </>
      )}
    </div>
  );
};

export default Ruler;
