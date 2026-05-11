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
import { useEditor, EditorContent, Extension } from '@tiptap/react';
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
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Subscript as TiptapSubscript } from '@tiptap/extension-subscript';
import { Superscript as TiptapSuperscript } from '@tiptap/extension-superscript';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Blockquote } from '@tiptap/extension-blockquote';
import { createLowlight, common } from 'lowlight';
import { Fragment, Slice } from '@tiptap/pm/model';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

// Custom extensions
import Indent from '../extensions/Indent.js';
import { Page, initializePagination } from '../extensions/Page.js';
import { TextDirection } from '../extensions/TextDirection.js';
import { ResizableImage } from '../extensions/ResizableImage.jsx';
import TableExtension from '../extensions/TableExtension.js';
import FontSize from '../extensions/FontSize.js';
import { paginateDocument, debouncePaginate } from '../utils/paginationEngine.js';
import { USABLE_HEIGHT_PX as USABLE_HEIGHT } from '../../../utils/pagination/constants';

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
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
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
      // ── LIST EXTENSIONS ───────────────────────────────────────────────────
      // StarterKit has bulletList, orderedList, listItem all disabled above.
      // We register the standalone packages so toggleBulletList() and
      // toggleOrderedList() exist on the chain. Without these three, the
      // commands are absent from the schema and silently fail in the toolbar.
      BulletList,
      OrderedList,
      ListItem,
      TaskList,
      TaskItem.configure({ nested: true }),
      Indent,
      TextDirection,
      TableExtension.configure({ resizable: true }),

      FontSize,
      Color,
      FontFamily,
      TiptapSubscript,
      TiptapSuperscript,
      ResizableImage,
      Blockquote,
      Extension.create({
        name: 'paginationCommands',
        addCommands() {
          return {
            forceRepaginate: () => ({ editor }) => {
              paginateDocument(editor, { force: true, reason: 'manual-trigger' });
              return true;
            },
          };
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'page') return placeholderText;
          return '';
        },
        includeChildren: true,
      }),
    ],
    editorProps: {
      transformPastedHTML: (html) => {
        // 🔥 GOOGLE DOCS-LEVEL PASTE SANITIZATION
        if (typeof document === 'undefined') return html;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const body = doc.body;

        // 1. Recursively Unwrap Structural Wrappers (Internal Athena or External Layouts)
        const unwrapRecursive = (root) => {
          const selectors = '.page, .page-content, .editor-pages-container, [data-page-number]';
          let found = root.querySelectorAll(selectors);
          while (found.length > 0) {
            found.forEach(el => {
              while (el.firstChild) {
                el.parentNode.insertBefore(el.firstChild, el);
              }
              el.remove();
            });
            found = root.querySelectorAll(selectors);
          }
        };
        unwrapRecursive(body);

        // 2. Surgical Style Stripping
        // Rule: Remove "Layout" (where it is), Keep "Formatting" (how it looks)
        const allElements = body.querySelectorAll('*');
        allElements.forEach(el => {
          if (el.style) {
            // ── REMOVE: Physical Layout & Positioning ──────────────────────
            el.style.position = '';
            el.style.top = '';
            el.style.left = '';
            el.style.right = '';
            el.style.bottom = '';
            el.style.float = '';
            el.style.transform = '';
            el.style.zoom = '';

            // ── REMOVE: External Margin/Padding (Athena owns these) ────────
            el.style.marginTop = '';
            el.style.marginBottom = '';
            el.style.paddingTop = '';
            el.style.paddingBottom = '';

            // ── REMOVE: Fixed Sizing (Let it flow) ──────────────────────────
            if (!['IMG', 'TABLE', 'IFRAME', 'VIDEO'].includes(el.tagName)) {
              el.style.width = '';
              el.style.height = '';
              el.style.maxHeight = '';
              el.style.minHeight = '';
            }

            // ── NORMALIZE: Line Height ──────────────────────────────────────
            el.style.lineHeight = '';
          }

          // 3. Remove metadata attributes
          el.removeAttribute('data-page-number');
          el.removeAttribute('data-block-id');
          el.removeAttribute('aria-hidden');

          // Cleanup Google Docs internal wrappers
          if (el.tagName === 'B' && el.style.fontWeight === 'normal') {
            while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
            el.remove();
          }
        });

        // 3. Final Cleanup: Remove empty structural artifacts
        body.querySelectorAll('div:empty, p:empty, span:empty').forEach(el => {
          if (el.tagName !== 'BR' && !el.hasChildNodes()) {
            el.remove();
          }
        });

        return body.innerHTML;
      },
      transformPasted: (slice) => {
        const unwrapPages = (fragment) => {
          const nodes = [];
          fragment.forEach(node => {
            if (node.type.name === 'page') {
              nodes.push(...unwrapPages(node.content));
            } else {
              nodes.push(node);
            }
          });
          return nodes;
        };

        const newNodes = unwrapPages(slice.content);
        if (newNodes.length === slice.content.childCount) return slice;

        // Correct depth adjustment: if we removed a 'page' wrapper, 
        // the content is now 1 level shallower.
        const openStart = Math.max(0, slice.openStart - 1);
        const openEnd = Math.max(0, slice.openEnd - 1);

        return new Slice(Fragment.fromArray(newNodes), openStart, openEnd);
      },
      handlePaste: (view) => {
        // ✅ Stage 1: Force immediate browser reflow before measurement
        // Accessing offsetHeight triggers a synchronous layout calculation
        void view.dom.offsetHeight;

        // ✅ Stage 2: Immediate "Flash" Pass (Pessimistic Estimation)
        requestAnimationFrame(() => {
          if (view.state.editor) {
            log('[EditorSurface] Paste detected: triggering immediate estimation pass');
            paginateDocument(view.state.editor, { force: true, reason: 'paste-immediate' });
          }
        });

        // ✅ Stage 3: Delayed "Final Audit" (Pixel-Perfect DOM measurement)
        // Gives the browser 500ms to finish rendering complex elements (images, tables)
        setTimeout(() => {
          if (!view.isDestroyed && view.state.editor) {
            log('[EditorSurface] Paste settling: triggering final DOM-aware audit');
            paginateDocument(view.state.editor, { force: true, reason: 'paste-final-audit' });
          }
        }, 500);

        return false;
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
          // ✅ GLOBAL HEIGHT AUDIT: Check all pages for overflows.
          // Images/tables might push content into the NEXT page, which also needs checking.
          const pages = document.querySelectorAll('.page-content');
          let hasOverflow = false;

          for (const page of pages) {
            // scrollHeight represents the total height of content inside the container
            if (page.scrollHeight > USABLE_HEIGHT - 2) {
              hasOverflow = true;
              break;
            }
          }

          if (hasOverflow) {
            requestAnimationFrame(() => {
              if (!editorInstance.isDestroyed && !editorInstance.storage.athena_is_paginating) {
                log('[EditorSurface] Visual overflow detected, forcing repagination');
                paginateDocument(editorInstance, { force: true, reason: 'visual-overflow' });
              }
            });
            debouncePaginate(editorInstance, 150);
            return;
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