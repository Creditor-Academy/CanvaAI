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
    console.log('[PageView] Rendering page:', pageNumber);
  }

  return (
    <NodeViewWrapper
      className="page"
      style={{ position: 'relative', breakInside: 'avoid' }}
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

      {/* This is where TipTap renders the page's block children */}
      <NodeViewContent
        className="page-content"
        style={{ height: '100%', minHeight: 'inherit' }}
      />
    </NodeViewWrapper>
  );
};

export default PageComponent;
