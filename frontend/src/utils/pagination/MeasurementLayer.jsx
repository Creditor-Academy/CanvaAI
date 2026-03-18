/**
 * MeasurementLayer.jsx — Hidden DOM measurement layer for Google Docs pagination
 *
 * This component creates a hidden measurement container used by the pagination
 * engine to measure rendered DOM heights accurately (Google Docs approach).
 *
 * WHY THIS EXISTS:
 * - Google Docs uses real DOM measurements (offsetHeight), not estimation
 * - Browser rendering engine knows the truth about line wrapping, font metrics, etc.
 * - This provides pixel-perfect pagination matching Google Docs exactly
 *
 * USAGE:
 * Wrap your editor with <MeasurementLayer> to enable DOM-based pagination.
 */

import React, { useEffect, useRef } from 'react';
import { domMeasurer, GOOGLE_DOCS_CONFIG } from './layoutCalculator';

const MeasurementLayer = ({ children }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Initialize the global DOM measurement layer
    domMeasurer.init();

    return () => {
      // Cleanup on unmount
      domMeasurer.destroy();
    };
  }, []);

  return (
    <>
      {/* Hidden measurement container - injected by DOMMeasurementLayer class */}
      {/* This is managed by the singleton, not rendered here */}
      
      {/* Render children normally */}
      {children}
    </>
  );
};

/**
 * GoogleDocsConfigProvider - Provides Google Docs configuration context
 * 
 * Usage:
 * <GoogleDocsConfigProvider>
 *   <YourEditor />
 * </GoogleDocsConfigProvider>
 */
export const GoogleDocsConfigProvider = ({ children }) => {
  return (
    <div
      style={{
        fontFamily: `${GOOGLE_DOCS_CONFIG.FONT_FAMILY}, Arial, sans-serif`,
        fontSize: `${GOOGLE_DOCS_CONFIG.FONT_SIZE_PX}px`,
        lineHeight: `${GOOGLE_DOCS_CONFIG.LINE_HEIGHT_PX}px`,
      }}
    >
      <MeasurementLayer>
        {children}
      </MeasurementLayer>
    </div>
  );
};

export default MeasurementLayer;
