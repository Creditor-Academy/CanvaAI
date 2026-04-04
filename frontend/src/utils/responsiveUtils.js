/**
 * Mobile Responsive Utilities
 * 
 * Helper functions and constants for building mobile-responsive components
 * Import these utilities in your components to ensure consistent responsive behavior
 */

// ==================== BREAKPOINT CONSTANTS ====================
export const BREAKPOINTS = {
  SM: 640,    // Small devices (landscape phones)
  MD: 768,    // Medium devices (tablets)
  LG: 1024,   // Large devices (desktops)
  XL: 1280,   // Extra large devices (large desktops)
  XXL: 1536,  // Extra extra large devices
};

// ==================== DEVICE DETECTION ====================

/**
 * Check if current viewport is mobile
 * @returns {boolean} True if viewport width <= 768px
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= BREAKPOINTS.MD;
};

/**
 * Check if current viewport is tablet
 * @returns {boolean} True if viewport width between 769px and 1024px
 */
export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > BREAKPOINTS.MD && window.innerWidth <= BREAKPOINTS.LG;
};

/**
 * Check if current viewport is desktop
 * @returns {boolean} True if viewport width > 1024px
 */
export const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > BREAKPOINTS.LG;
};

/**
 * Get current device type
 * @returns {'mobile' | 'tablet' | 'desktop'}
 */
export const getDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width <= BREAKPOINTS.MD) return 'mobile';
  if (width <= BREAKPOINTS.LG) return 'tablet';
  return 'desktop';
};

// ==================== RESPONSIVE HOOKS ====================

import { useState, useEffect } from 'react';

/**
 * Hook to track viewport dimensions
 * @returns {{ width: number, height: number }}
 */
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

/**
 * Hook to check if viewport matches a breakpoint
 * @param {number} maxWidth - Maximum width to match
 * @returns {boolean}
 */
export const useMediaQuery = (maxWidth) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${maxWidth}px)`);
    setMatches(media.matches);

    const listener = (e) => setMatches(e.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [maxWidth]);

  return matches;
};

/**
 * Hook to detect device type with reactive updates
 * @returns {'mobile' | 'tablet' | 'desktop'}
 */
export const useDeviceType = () => {
  const { width } = useViewport();
  
  if (width <= BREAKPOINTS.MD) return 'mobile';
  if (width <= BREAKPOINTS.LG) return 'tablet';
  return 'desktop';
};

// ==================== RESPONSIVE STYLES ====================

/**
 * Get responsive padding based on device type
 * @returns {string} Tailwind padding classes
 */
export const getResponsivePadding = () => {
  return 'p-3 md:p-4 lg:p-6 xl:p-8';
};

/**
 * Get responsive margin based on device type
 * @returns {string} Tailwind margin classes
 */
export const getResponsiveMargin = () => {
  return 'm-2 md:m-4 lg:m-6';
};

/**
 * Get responsive grid columns
 * @param {number} desktopCols - Number of columns on desktop
 * @returns {string} Tailwind grid classes
 */
export const getResponsiveGrid = (desktopCols = 3) => {
  const cols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };
  return cols[desktopCols] || cols[3];
};

/**
 * Get responsive font size
 * @param {string} base - Base font size class
 * @returns {string} Responsive font size classes
 */
export const getResponsiveFontSize = (base = 'text-base') => {
  const sizes = {
    'text-xs': 'text-xs sm:text-sm',
    'text-sm': 'text-sm md:text-base',
    'text-base': 'text-base md:text-lg',
    'text-lg': 'text-lg md:text-xl',
    'text-xl': 'text-xl md:text-2xl',
    'text-2xl': 'text-2xl md:text-3xl',
    'text-3xl': 'text-3xl md:text-4xl',
  };
  return sizes[base] || base;
};

/**
 * Get responsive spacing (gap)
 * @param {string} base - Base gap size
 * @returns {string} Responsive gap classes
 */
export const getResponsiveGap = (base = 'gap-4') => {
  const gaps = {
    'gap-2': 'gap-2 md:gap-4',
    'gap-4': 'gap-3 md:gap-4 lg:gap-6',
    'gap-6': 'gap-4 md:gap-6 lg:gap-8',
    'gap-8': 'gap-6 md:gap-8 lg:gap-12',
  };
  return gaps[base] || base;
};

// ==================== TOUCH OPTIMIZATIONS ====================

/**
 * Check if device supports touch
 * @returns {boolean}
 */
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * Get appropriate button size based on device
 * @returns {string} Size in pixels
 */
export const getTouchTargetSize = () => {
  return isTouchDevice() ? 44 : 32; // Minimum 44px for touch devices
};

// ==================== ORIENTATION DETECTION ====================

/**
 * Check if device is in landscape orientation
 * @returns {boolean}
 */
export const isLandscape = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
};

/**
 * Check if device is in portrait orientation
 * @returns {boolean}
 */
export const isPortrait = () => {
  if (typeof window === 'undefined') return false;
  return window.innerHeight > window.innerWidth;
};

// ==================== RESPONSIVE IMAGE ====================

/**
 * Get responsive image srcset
 * @param {string} baseUrl - Base URL of the image
 * @param {string} extension - Image extension
 * @returns {string} Srcset string
 */
export const getResponsiveImageSrcset = (baseUrl, extension = 'jpg') => {
  return `
    ${baseUrl}-320.${extension} 320w,
    ${baseUrl}-640.${extension} 640w,
    ${baseUrl}-768.${extension} 768w,
    ${baseUrl}-1024.${extension} 1024w,
    ${baseUrl}-1280.${extension} 1280w,
    ${baseUrl}.${extension} 1920w
  `;
};

/**
 * Get responsive image sizes attribute
 * @returns {string} Sizes attribute
 */
export const getResponsiveImageSizes = () => {
  return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
};

// ==================== UTILITY CLASSES ====================

/**
 * Common responsive container classes
 */
export const RESPONSIVE_CONTAINER = 'w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8';

/**
 * Common responsive flex container classes
 */
export const RESPONSIVE_FLEX = 'flex flex-col sm:flex-row items-start sm:items-center';

/**
 * Common responsive grid container classes
 */
export const RESPONSIVE_GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6';

/**
 * Common responsive card classes
 */
export const RESPONSIVE_CARD = 'rounded-lg shadow-md p-4 md:p-6 hover:shadow-lg transition-shadow';

/**
 * Common responsive button classes
 */
export const RESPONSIVE_BUTTON = 'px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium transition-all min-h-[44px]';
