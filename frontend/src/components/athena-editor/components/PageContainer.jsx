import React, { useEffect, useState, useRef } from 'react';
import { EditorContent } from '@tiptap/react';
import { DocumentExporter } from '../../utils/documentExporter';

/**
 * PageContainer
 * Wraps the TipTap editor with visual page margins and page-number indicators.
 *
 * Fix 1: Removed console.log from production path.
 * Fix 2: useEffect dep was `editor?.state?.doc` (object identity never changes
 *         after mount → effect never re-ran on content edits). Replaced with a
 *         stable version counter derived from editor.state via an onUpdate listener.
 * Fix 3: `<EditorContent>` must be rendered exactly once per editor instance.
 *         The previous code rendered it inside every page's map iteration, causing
 *         TipTap to mount/unmount the ProseMirror view repeatedly. The editor is
 *         now rendered once; pagination metadata drives purely decorative UI.
 */
export const PageContainer = ({
  editor,
  showMargins = true,
  showPageNumbers = true,
  customMargins,
}) => {
  const [totalPages, setTotalPages] = useState(1);
  // Stable counter incremented by editor's onUpdate so the effect re-runs.
  const updateCountRef = useRef(0);
  const [updateTick, setUpdateTick] = useState(0);

  // Subscribe to editor content changes.
  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      updateCountRef.current += 1;
      setUpdateTick(updateCountRef.current);
    };
    editor.on('update', handler);
    return () => editor.off('update', handler);
  }, [editor]);

  // Recalculate page count whenever content changes.
  useEffect(() => {
    if (!editor) return;
    try {
      const result = DocumentExporter.calculatePagination(editor, {
        marginTop:    customMargins?.top    ?? 96,
        marginBottom: customMargins?.bottom ?? 96,
        marginLeft:   customMargins?.left   ?? 96,
        marginRight:  customMargins?.right  ?? 96,
      });
      setTotalPages(result?.totalPages ?? 1);
    } catch {
      setTotalPages(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, updateTick, customMargins]);

  if (!editor) return null;

  const marginStyle = {
    '--page-margin-top':    `${customMargins?.top    ?? 96}px`,
    '--page-margin-right':  `${customMargins?.right  ?? 96}px`,
    '--page-margin-bottom': `${customMargins?.bottom ?? 96}px`,
    '--page-margin-left':   `${customMargins?.left   ?? 96}px`,
  };

  return (
    <div className="page-preview-mode" style={marginStyle}>
      {/* Visual margin guides — purely decorative, rendered once */}
      {showMargins && (
        <div className="margin-overlay" aria-hidden="true">
          <div className="margin-top" />
          <div className="margin-bottom" />
          <div className="margin-left" />
          <div className="margin-right" />
        </div>
      )}

      {/* Margin size labels */}
      {showMargins && (
        <>
          <div className="margin-label top">{customMargins?.top    ?? 96}px</div>
          <div className="margin-label bottom">{customMargins?.bottom ?? 96}px</div>
          <div className="margin-label left">{customMargins?.left   ?? 96}px</div>
          <div className="margin-label right">{customMargins?.right  ?? 96}px</div>
        </>
      )}

      {/* The single EditorContent instance — TipTap owns the DOM here */}
      <div className="content-area">
        <EditorContent editor={editor} />
      </div>

      {/* Page count footer */}
      {showPageNumbers && totalPages > 0 && (
        <div className="page-number-indicator" aria-live="polite">
          {totalPages} page{totalPages !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};