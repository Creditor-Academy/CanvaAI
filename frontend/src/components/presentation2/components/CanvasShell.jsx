import React, { useRef, useEffect, useState } from 'react';
import Ruler from './Ruler';

/**
 * CanvasShell Component
 * 
 * Wrapper for the canvas area that handles:
 * - Canvas container styling
 * - Zoom/pan controls
 * - Canvas centering
 * - Rulers (horizontal and vertical)
 */
const CanvasShell = ({
  children,
  canvasWidth,
  canvasHeight,
  zoom,
  onWheel,
  onPanStart,
  onPanMove,
  onPanEnd,
  containerRef: externalContainerRef,
  className = '',
}) => {
  const internalContainerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [rulerDimensions, setRulerDimensions] = useState({ width: 0, height: 0 });
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  
  // Use external containerRef if provided, otherwise use internal
  const containerRef = externalContainerRef || internalContainerRef;

  // Update ruler dimensions based on container size
  useEffect(() => {
    const updateDimensions = () => {
      if (scrollContainerRef.current) {
        const rect = scrollContainerRef.current.getBoundingClientRect();
        setRulerDimensions({
          width: rect.width, // Full width of canvas container
          height: rect.height, // Full height of canvas container
        });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }
    window.addEventListener('resize', updateDimensions);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Sync scroll position with rulers
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      setScrollPosition({
        x: scrollContainer.scrollLeft,
        y: scrollContainer.scrollTop,
      });
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Attach wheel event listener with passive: false for preventDefault
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !onWheel) return;

    const handleWheelEvent = (e) => {
      onWheel(e);
    };

    // Use addEventListener with passive: false to allow preventDefault
    container.addEventListener('wheel', handleWheelEvent, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheelEvent);
    };
  }, [onWheel]);

  // Calculate visible canvas area for rulers
  const scaledCanvasWidth = canvasWidth * zoom;
  const scaledCanvasHeight = canvasHeight * zoom;

  return (
    <div className="flex-1 bg-gray-100 overflow-hidden relative flex flex-col">
      {/* Top Row: Corner + Horizontal Ruler */}
      <div className="flex flex-shrink-0" style={{ height: '20px' }}>
        {/* Corner piece (where rulers meet) */}
        <div
          className="flex-shrink-0 bg-gray-50 border-b border-r border-gray-300"
          style={{
            width: '20px',
            height: '20px',
            background: 'linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%)',
          }}
        />
        {/* Horizontal Ruler */}
        <div className="flex-1 overflow-hidden relative">
          <Ruler
            orientation="horizontal"
            length={rulerDimensions.width || 800}
            zoom={zoom}
            canvasSize={canvasWidth}
            scrollOffset={scrollPosition.x}
          />
        </div>
      </div>

      {/* Bottom Row: Vertical Ruler + Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Vertical Ruler */}
        <div className="flex-shrink-0" style={{ width: '20px' }}>
          <Ruler
            orientation="vertical"
            length={rulerDimensions.height || 600}
            zoom={zoom}
            canvasSize={canvasHeight}
            scrollOffset={scrollPosition.y}
          />
        </div>

        {/* Canvas Container */}
        <div
          ref={(node) => {
            if (externalContainerRef) {
              externalContainerRef.current = node;
            } else {
              internalContainerRef.current = node;
            }
            scrollContainerRef.current = node;
          }}
          className="flex-1 overflow-auto"
          onMouseDown={onPanStart}
          onMouseMove={onPanMove}
          onMouseUp={onPanEnd}
          onMouseLeave={onPanEnd}
          style={{
            cursor: 'default',
            touchAction: 'pan-x pan-y pinch-zoom',
            willChange: 'scroll-position',
          }}
        >
          {/* Centered Canvas Area */}
          <div
            className="flex items-center justify-center min-h-full min-w-full p-8"
          >
            {/* Canvas - Zoom applied using transform: scale() */}
            <div
              className="bg-white shadow-2xl rounded-lg relative"
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                willChange: 'transform',
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Indicator */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-xs z-10">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};

export default CanvasShell;
