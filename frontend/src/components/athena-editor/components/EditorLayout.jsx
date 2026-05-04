import React from 'react';

/**
 * EditorLayout Component
 * 
 * Defines the structural layout of the Athena Editor.
 * This separates the CSS layout concerns (Flexbox/Grid) from the logic.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.header - Top navigation/menu bar
 * @param {React.ReactNode} props.toolbar - Main editor toolbar
 * @param {React.ReactNode} props.outline - Document outline/headings sidebar
 * @param {React.ReactNode} props.surface - The actual TipTap editor surface
 * @param {React.ReactNode} props.footer - Status bar at the bottom
 * @param {React.ReactNode} props.sidebars - Floating sidebars (AI, Templates)
 * @param {React.ReactNode} props.modals - Global modals and dialogs
 */
export const EditorLayout = ({
  header,
  toolbar,
  outline,
  surface,
  footer,
  sidebars,
  modals
}) => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Header Layer */}
      {header}

      {/* 2. Toolbar Layer */}
      {toolbar}

      {/* 3. Main Viewport Layer (Outline + Surface) */}
      <div className="flex-1 flex overflow-hidden" style={{
        minHeight: 0,
        height: 'calc(100vh - 48px - 32px)', // Explicit: viewport - header - footer
        position: 'relative',
        flexShrink: 0,
        flexGrow: 1
      }}>
        {outline}
        {surface}
      </div>

      {/* 4. Footer Layer */}
      {footer}

      {/* 5. Overlay Layer (Sidebars & Modals) */}
      {sidebars}
      {modals}
    </div>
  );
};
