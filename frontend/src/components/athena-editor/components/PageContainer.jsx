import React, { useEffect, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import { DocumentExporter } from '../../utils/documentExporter';

/**
 * PageContainer Component
 * Wraps the TipTap editor with visual page margins and boundaries
 */
export const PageContainer = ({ 
  editor, 
  showMargins = true, 
  showPageNumbers = true,
  customMargins 
}) => {
  const [pagination, setPagination] = useState({ totalPages: 1, pages: [] });

  // Calculate pagination on content change
  useEffect(() => {
    if (editor) {
      const result = DocumentExporter.calculatePagination(editor, {
        marginTop: customMargins?.top || 96,
        marginBottom: customMargins?.bottom || 96,
        marginLeft: customMargins?.left || 96,
        marginRight: customMargins?.right || 96
      });
      setPagination(result);
    }
  }, [editor, editor?.state, customMargins]);

  return (
    <div className="page-preview-mode">
      {pagination.pages.map((page, pageIndex) => (
        <div 
          key={pageIndex} 
          className="page-container"
          style={{
            '--page-margin-top': `${customMargins?.top || 96}px`,
            '--page-margin-right': `${customMargins?.right || 96}px`,
            '--page-margin-bottom': `${customMargins?.bottom || 96}px`,
            '--page-margin-left': `${customMargins?.left || 96}px`
          }}
        >
          {/* Visual margin guides */}
          {showMargins && (
            <div className="margin-overlay">
              <div className="margin-top"></div>
              <div className="margin-bottom"></div>
              <div className="margin-left"></div>
              <div className="margin-right"></div>
            </div>
          )}

          {/* Margin size labels */}
          {showMargins && (
            <>
              <div className="margin-label top">
                {customMargins?.top || 96}px
              </div>
              <div className="margin-label bottom">
                {customMargins?.bottom || 96}px
              </div>
              <div className="margin-label left">
                {customMargins?.left || 96}px
              </div>
              <div className="margin-label right">
                {customMargins?.right || 96}px
              </div>
            </>
          )}

          {/* Page number indicator */}
          {showPageNumbers && (
            <div className="page-number-indicator">
              Page {pageIndex + 1} of {pagination.totalPages}
            </div>
          )}

          {/* Content area */}
          <div className="content-area">
            <EditorContent editor={editor} />
          </div>

          {/* Page break indicator (if next page exists) */}
          {pageIndex < pagination.pages.length - 1 && (
            <div className="page-break-indicator">
              <span>CONTINUED ON NEXT PAGE</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Usage Example:
 * 
 * import { PageContainer } from './components/PageContainer';
 * 
 * function MyEditor() {
 *   const editor = useEditor({ ... });
 *   
 *   return (
 *     <PageContainer 
 *       editor={editor}
 *       showMargins={true}
 *       showPageNumbers={true}
 *       customMargins={{
 *         top: 96,
 *         right: 96,
 *         bottom: 96,
 *         left: 96
 *       }}
 *     />
 *   );
 * }
 */
