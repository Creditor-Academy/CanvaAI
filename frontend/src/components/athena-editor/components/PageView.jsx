import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';

const PageComponent = ({ node }) => {
  const pageNumber = node.attrs.pageNumber;

  if (pageNumber === undefined) {
    // This means Page.js schema doesn't have `default: 1` on pageNumber attr,
    // OR the editor was not restarted after updating Page.js.
    // Fix: ensure Page.js addAttributes() has `pageNumber: { default: 1, ... }`
    // then do a FULL page reload (Ctrl+Shift+R), not just HMR.
    console.warn('[PageView] pageNumber attr is undefined — check Page.js schema attrs.pageNumber.default');
  } else {
    console.log('[PageView] Rendering page:', pageNumber, 'with attrs:', node.attrs);
    
    // 🔥 CRITICAL FIX: Detect and warn about page overlay issues
    if (pageNumber < 1) {
      console.error('[PageView] ⚠️ INVALID page number:', pageNumber, '- This may cause rendering issues!');
    }
  }

  return (
    <NodeViewWrapper
      className="page"
      style={{ 
        position: 'relative', 
        breakInside: 'avoid',
        // ✅ FIX 4: Match CSS exactly - fixed height and overflow hidden
        display: 'block',       // ensures block flow, not inline
        overflow: 'hidden',     // clip content that overflows height
        isolation: 'isolate',   // Create new stacking context
        zIndex: 0,              // Explicit z-index for proper stacking
      }}
    >
      {/* Page number label */}
      <div
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
        {pageNumber !== undefined ? `Page ${pageNumber}` : ''}
      </div>

      {/* 🔥 CRITICAL FIX: Removed inline styles that caused CSS overlay issues
          Let CSS handle all styling - no inline height/min-height inheritance */}
      <NodeViewContent className="page-content" />
    </NodeViewWrapper>
  );
};

export default PageComponent;
