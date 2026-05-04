/**
 * EditorSurface Component
 * 
 * Encapsulates the TipTap editor configuration and rendering surface.
 * This includes:
 * - useEditor initialization with all extensions
 * - EditorContent wrapper with pagination
 * - Editor container with zoom support
 * 
 * @module EditorSurface
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
import Placeholder from '@tiptap/extension-placeholder';
import { Underline as TiptapUnderline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Highlight } from '@tiptap/extension-highlight';
import { Typography } from '@tiptap/extension-typography';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Focus } from '@tiptap/extension-focus';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Link as TiptapLink } from '@tiptap/extension-link';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { ListItem } from '@tiptap/extension-list-item';
import { Table as TiptapTable, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Subscript as TiptapSubscript } from '@tiptap/extension-subscript';
import { Superscript as TiptapSuperscript } from '@tiptap/extension-superscript';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Blockquote } from '@tiptap/extension-blockquote';
import { createLowlight, common } from 'lowlight';
import { Fragment } from '@tiptap/pm/model';

// Custom extensions
import Indent from '../extensions/Indent.js';
import { Page, initializePagination } from '../extensions/Page.js';
import { TextDirection } from '../extensions/TextDirection.js';
import { ResizableImage } from '../extensions/ResizableImage.jsx';
import TableExtension from '../extensions/TableExtension.js';
import FontSize from '../extensions/FontSize.js';
import { paginateDocument, debouncePaginate } from '../utils/paginationEngine.js';

// Utils
const log = process.env.NODE_ENV === 'development' ? (...args) => console.log(...args) : () => { };

/**
 * EditorSurface Component
 * 
 * @param {Object} props
 * @param {Object} props.initialContent - Initial TipTap JSON content
 * @param {string} props.placeholderText - Placeholder text for empty editor
 * @param {Function} props.onUpdate - Callback when editor content changes
 * @param {Function} props.onSelectionUpdate - Callback when selection changes
 * @param {Function} props.onCreate - Callback when editor is created
 * @param {Function} props.onDestroy - Callback when editor is destroyed
 * @param {Object} props.editorRef - Ref to store editor instance
 * @param {number} props.zoom - Zoom level percentage
 * @param {Object} props.containerRef - Ref for editor container
 * @param {boolean} props.isPasting - Flag to indicate if a paste is in progress
 * @returns {JSX.Element}
 */
export function EditorSurface({
  initialContent = '',
  placeholderText = 'Start typing or press / for AI commands...',
  onUpdate,
  onSelectionUpdate,
  onCreate,
  onDestroy,
  editorRef,
  zoom = 100,
  containerRef,
  isPasting = false,
}) {
  const internalEditorRef = useRef(null);
  const lastCheckTimeRef = useRef(0);
  const CHECK_THROTTLE = 250; // ms

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        document: false,
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        blockquote: false,
        underline: false,
        link: false,
        listItem: false,
        codeBlock: false,
        bulletList: false,
        orderedList: false,
        hardBreak: false
      }),
      Document.extend({ content: 'page+' }),
      Page,
      TextStyle,
      TiptapUnderline,
      TiptapLink.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' } }),
      TextAlign.configure({ types: ['heading', 'paragraph', 'table'] }),
      Highlight.configure({ multicolor: true }),
      Typography,
      CharacterCount,
      Focus.configure({ className: 'has-focus', mode: 'all' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Indent,
      TextDirection,
      TableExtension.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      FontSize,
      Color,
      FontFamily,
      TiptapSubscript,
      TiptapSuperscript,
      ResizableImage,
      Blockquote,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'page') return placeholderText;
          return '';
        },
        includeChildren: true,
      }),
    ],
    editorProps: {
      transformPasted: (slice) => {
        const hasPageNodes = slice.content.some(node => node.type.name === 'page');
        if (!hasPageNodes) return slice;

        const newNodes = [];
        slice.content.forEach(node => {
          if (node.type.name === 'page') {
            node.content.forEach(child => newNodes.push(child));
          } else {
            newNodes.push(node);
          }
        });

        return slice.copy(Fragment.fromArray(newNodes));
      },
      handleKeyDown: (view, event) => {
        if (event.shiftKey && event.key === 'Enter') {
          event.preventDefault();
          const { state, dispatch } = view;
          const { $from } = state.selection;
          const parentAttrs = $from.parent.attrs;
          const tr = state.tr.replaceSelectionWith(
            state.schema.nodes.paragraph.create(parentAttrs)
          );
          dispatch(tr);
          return true;
        }
        return false;
      },
      attributes: {
        class: 'focus:outline-none table-border-black',
        spellcheck: 'true',
        'data-testid': 'editor-content'
      },
    },
    onCreate: ({ editor: editorInstance }) => {
      log('[EditorSurface.onCreate] Editor created, initializing pages...');
      setTimeout(() => {
        initializePagination(editorInstance);
      }, 50);

      if (onCreate) {
        onCreate({ editor: editorInstance });
      }
    },
    onUpdate: ({ editor: editorInstance }) => {
      // Pagination logic moved from TextEditor.jsx to keep it unified
      if (editorInstance.storage.athena_is_paginating || isPasting) {
        return;
      }

      // 🚀 OPTIMIZATION (Suggestion 3): Throttle immediate overflow check
      // PROBLEM: DOM measurements (scrollHeight) trigger reflow. Doing this on every
      // keystroke causes typing latency.
      // SOLUTION: Only check synchronously every 250ms or if pasting.
      const now = Date.now();
      const shouldCheckSync = isPasting || (now - lastCheckTimeRef.current > CHECK_THROTTLE);

      if (shouldCheckSync) {
        lastCheckTimeRef.current = now;
        try {
          const currentPage = editorInstance.view.dom.closest('.page');
          const pageContent = currentPage?.querySelector('.page-content');
          
          if (currentPage && pageContent) {
            const contentHeight = pageContent.scrollHeight;
            const pageHeight = parseInt(getComputedStyle(currentPage).height) || 1123;
            const maxHeight = pageHeight - 96;
            
            if (contentHeight > maxHeight) {
              requestAnimationFrame(() => {
                if (!editorInstance.isDestroyed && !editorInstance.storage.athena_is_paginating) {
                  paginateDocument(editorInstance, { force: true, reason: 'content-overflow' });
                }
              });
              debouncePaginate(editorInstance, 150);
              return;
            }
          }
        } catch (err) {
          log('[EditorSurface.onUpdate] DOM measurement failed:', err);
        }
      }

      debouncePaginate(editorInstance, 150);

      if (onUpdate) {
        onUpdate({ editor: editorInstance });
      }
    },
    onSelectionUpdate: ({ editor: editorInstance }) => {
      if (onSelectionUpdate) {
        onSelectionUpdate({ editor: editorInstance });
      }
    },
    onDestroy: () => {
      if (onDestroy) {
        onDestroy();
      }
    },
  });

  // Sync editor instance to parent ref
  useEffect(() => {
    if (editor) {
      if (editorRef) {
        editorRef.current = editor;
      }
      internalEditorRef.current = editor;
    }
  }, [editor, editorRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editor && !editor.isDestroyed) {
        editor.destroy();
      }
    };
  }, [editor]);

  const effectiveZoom = zoom || 100;

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-slate-100/50"
      style={{
        position: 'relative',
        minHeight: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {editor && (
        <div
          className="editor-pages-container"
          style={{
            transform: `scale(${effectiveZoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-out',
            width: `${100 * (100 / effectiveZoom)}%`,
            flex: 1,
            minHeight: 0,
            padding: '56px 0 16px 0'
          }}
        >
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}

export default EditorSurface;
