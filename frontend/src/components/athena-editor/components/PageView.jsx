import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';

/**
 * PageView (NodeView renderer for the "page" ProseMirror node)
 *
 * Fix 1: Removed console.warn / console.log from the render path.
 *         These fire on every re-render, producing thousands of lines of noise
 *         in production DevTools and measurable GC pressure.
 * Fix 2: pageNumber < 1 guard now returns a recoverable fallback label instead
 *         of just logging and continuing with broken output.
 * Fix 3: Removed inline styles that duplicated CSS rules already defined in
 *         AthenaEditor.css (isolation, zIndex, overflow, display). A single
 *         source of truth prevents specificity conflicts.
 * Fix 4: Added aria-label so screen readers can identify page regions.
 */
const PageComponent = ({ node }) => {
  const pageNumber = node.attrs?.pageNumber;

  // Derive a safe display label — never shows "Page 0" or "Page undefined".
  const pageLabel =
    typeof pageNumber === 'number' && pageNumber >= 1
      ? `Page ${pageNumber}`
      : null;

  return (
    <NodeViewWrapper
      className="page"
      aria-label={pageLabel ?? 'Editor page'}
    >
      {/* Page number label — conditionally rendered, purely decorative */}
      {pageLabel && (
        <div
          className="page-number-label"
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-24px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '12px',
            color: '#94a3b8',
            fontWeight: 500,
            userSelect: 'none',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {pageLabel}
        </div>
      )}

      {/* Page content — TipTap injects child nodes here */}
      <NodeViewContent className="page-content" />
    </NodeViewWrapper>
  );
};

export default PageComponent;