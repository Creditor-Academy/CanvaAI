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

// Custom extensions
import Indent from '../extensions/Indent.js';
import { Page } from '../extensions/Page.js';
import { TextDirection } from '../extensions/TextDirection.js';
import { ResizableImage } from '../extensions/ResizableImage.jsx';
import TableExtension from '../extensions/TableExtension.js';
import { normalizeInlineStyles } from '../utils/contentHelpers.js';
import { Fragment } from '@tiptap/pm/model';

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
 * @param {Function} props.onCopy - Copy handler
 * @param {Object} props.containerRef - Ref for editor container
 * @returns {JSX.Element}
 */
export function EditorSurface({
  initialContent,
  placeholderText = 'Start typing or press / for AI commands...',
  onUpdate,
  onSelectionUpdate,
  onCreate,
  onDestroy,
  editorRef,
  zoom = 100,
  onCopy,
  containerRef,
}) {
  const internalEditorRef = useRef(null);

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
      Color,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TiptapUnderline,
      TiptapLink.configure({
        openOnClick: true,
        HTMLAttributes: { class: 'editor-link' }
      }),
      TiptapImage,
      BulletList,
      OrderedList,
      ListItem,
      Indent,
      TiptapTable.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TableExtension,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Typography,
      CharacterCount.configure({ limit: 50000 }),
      Focus.configure({ mode: 'all', className: 'has-focus' }),
      Placeholder.configure({ placeholder: placeholderText }),
      TextDirection,
      ResizableImage,
      TiptapSubscript,
      TiptapSuperscript,
      CodeBlockLowlight.configure({ lowlight: createLowlight(common) }),
      Blockquote,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none editor-content',
        spellcheck: 'true',
      },
      transformPasted(slice) {
        let hasPageNodes = false;
        slice.content.forEach(node => {
          if (node.type.name === 'page') hasPageNodes = true;
        });

        if (!hasPageNodes) return slice;

        // Flatten: pull children out of each page wrapper
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

      /**
       * 🔥 CRITICAL FIX: Preserve formatting from external sources
       * Normalizes HTML before Tiptap schema parsing to ensure "encoding" of 
       * styles (like text-align) is preserved correctly.
       */
      transformPastedHTML(html) {
        if (!html) return html;
        
        // 1. Apply our custom normalization (handles text-align -> data-text-align)
        let normalized = normalizeInlineStyles(html);
        
        // 2. Clean up Google Docs "font-weight:normal" junk that strips bold
        normalized = normalized.replace(/<b\s+style="font-weight:\s*normal[^"]*"[^>]*>(.*?)<\/b>/gi, '$1');
        
        // 3. Ensure paragraphs from sources with large margins don't break our page layout
        normalized = normalized.replace(/margin-(top|bottom):\s*[^;!]+(!important)?/gi, '');

        return normalized;
      },
      handleDOMEvents: {
        copy: (view, event) => {
          if (onCopy) {
            onCopy(event);
          }
          return false;
        },
      },
    },
    onUpdate: ({ editor: editorInstance }) => {
      if (onUpdate) {
        onUpdate(editorInstance);
      }
    },
    onSelectionUpdate: ({ editor: editorInstance }) => {
      if (onSelectionUpdate) {
        onSelectionUpdate(editorInstance);
      }
    },
    onCreate: ({ editor: editorInstance }) => {
      if (onCreate) {
        onCreate(editorInstance);
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
      onCopy={onCopy}
      style={{
        position: 'relative',
        minHeight: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Editor Pages Container with Zoom */}
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

/**
 * Import TiptapImage separately to avoid naming conflicts
 */
import { Image as TiptapImage } from '@tiptap/extension-image';
import FontSize from '../extensions/FontSize.js';

export default EditorSurface;
