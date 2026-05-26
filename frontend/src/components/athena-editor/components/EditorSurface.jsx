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
import { paginateDocument, debouncePaginate, invalidatePaginationCache } from '../utils/paginationEngine.js';
import { USABLE_HEIGHT_PX as USABLE_HEIGHT } from '../../../utils/pagination/constants';
import { TextEditorService } from '../../../services/Text-Editor/text.service.js';
import { toast } from 'sonner';
import { useFormattingState } from '../contexts/EditorContent.jsx';
import focusUtils from './editor/focusUtils';

// Helper to convert base64 data URL to a File object
const dataURLtoFile = (dataurl, filename) => {
  try {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch (err) {
    console.error('Failed to convert dataURL to File:', err);
    return null;
  }
};

// Helper to upload a file to backend and insert it into ProseMirror
const uploadAndInsertImage = async (editor, file, pos = null) => {
  if (!editor || editor.isDestroyed) return;
  const toastId = toast.loading(`Uploading image: ${file.name || 'image'}...`);
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await TextEditorService.uploadImage(formData);
    
    if (response && response.url) {
      toast.success('Image uploaded and inserted successfully! 🎉', { id: toastId });
      
      // Use Tiptap command to set image at target pos
      if (pos !== null) {
        editor.chain().focus().insertContentAt(pos, {
          type: 'image',
          attrs: {
            src: response.url,
            alt: file.name || 'image',
            title: file.name || 'image',
            width: 400,
            height: 300,
            align: 'left'
          }
        }).run();
      } else {
        editor.chain().focus().setResizableImage({
          src: response.url,
          alt: file.name || 'image',
          title: file.name || 'image',
          width: 400,
          height: 300,
          align: 'left'
        }).run();
      }
      
      // Trigger pagination to update layouts
      setTimeout(() => {
        if (!editor.isDestroyed) {
          paginateDocument(editor, { force: true, reason: 'image-paste-drop' });
        }
      }, 300);
    } else {
      throw new Error('Upload returned no URL');
    }
  } catch (error) {
    console.error('Failed to upload pasted/dropped image:', error);
    toast.error('Failed to upload image: ' + (error.message || 'Unknown error'), { id: toastId });
  }
};

// Helper to insert parsed HTML at selection
const insertHTMLAtSelection = (editor, html) => {
  if (!editor || editor.isDestroyed) return;
  editor.commands.insertContent(html);
  
  // Trigger estimation and pagination
  setTimeout(() => {
    if (!editor.isDestroyed) {
      paginateDocument(editor, { force: true, reason: 'html-paste-settled' });
    }
  }, 300);
};

// Helper to upload base64 images within pasted HTML to S3 and then insert
const uploadBase64ImagesAndInsert = async (editor, html) => {
  if (!editor || editor.isDestroyed) return;
  const toastId = toast.loading('Processing pasted image(s)...');
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const imgs = Array.from(doc.querySelectorAll('img[src^="data:"]'));

    if (imgs.length === 0) {
      toast.dismiss(toastId);
      insertHTMLAtSelection(editor, html);
      return;
    }

    toast.loading(`Uploading ${imgs.length} image(s)...`, { id: toastId });

    const uploadPromises = imgs.map(async (img, idx) => {
      const src = img.getAttribute('src');
      const filename = img.getAttribute('alt') || `pasted-image-${idx + 1}.png`;
      const file = dataURLtoFile(src, filename);
      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        const response = await TextEditorService.uploadImage(formData);
        if (response && response.url) {
          img.setAttribute('src', response.url);
          // Set custom attributes for our resizable image
          img.setAttribute('data-type', 'resizable-image');
          img.setAttribute('data-width', '400');
          img.setAttribute('data-height', '300');
          img.setAttribute('data-align', 'left');
        }
      }
    });

    await Promise.all(uploadPromises);

    toast.success('Pasted images uploaded to S3 successfully! 🎉', { id: toastId });
    
    const cleanedHtml = doc.body.innerHTML;
    insertHTMLAtSelection(editor, cleanedHtml);

  } catch (err) {
    console.error('Failed to process pasted base64 images:', err);
    toast.error('Failed to process pasted images, inserting as is...', { id: toastId });
    insertHTMLAtSelection(editor, html);
  }
};

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
  const { lineSpacing } = useFormattingState() || { lineSpacing: 1.3 };
  const { setActiveEditor } = focusUtils;
  const internalEditorRef = useRef(null);
  const lastCheckTimeRef = useRef(0);
  const CHECK_THROTTLE = 250; // ms

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        document: false,
        undoRedo: false,
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
      handlePaste: (view, event) => {
        const editorInstance = editor || view.state.editor;

        // 1. Intercept Image File Paste
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf('image') === 0) {
              const file = item.getAsFile();
              if (file) {
                event.preventDefault();
                uploadAndInsertImage(editorInstance, file);
                return true; // handled
              }
            }
          }
        }

        // 2. Intercept HTML containing base64 images
        const html = event.clipboardData?.getData('text/html');
        if (html && html.includes('src="data:image/')) {
          event.preventDefault();
          uploadBase64ImagesAndInsert(editorInstance, html);
          return true; // handled
        }

        // 3. Fallback to normal paste logic
        // ✅ Stage 1: Force immediate browser reflow before measurement
        void view.dom.offsetHeight;

        // ✅ Stage 2: Immediate "Flash" Pass (Pessimistic Estimation)
        requestAnimationFrame(() => {
          if (editorInstance && !editorInstance.isDestroyed) {
            log('[EditorSurface] Paste detected: triggering immediate estimation pass');
            paginateDocument(editorInstance, { force: true, reason: 'paste-immediate' });
          }
        });

        // ✅ Stage 3: Delayed "Final Audit" (Pixel-Perfect DOM measurement)
        setTimeout(() => {
          if (editorInstance && !editorInstance.isDestroyed) {
            log('[EditorSurface] Paste settling: triggering final DOM-aware audit');
            paginateDocument(editorInstance, { force: true, reason: 'paste-final-audit' });
          }
        }, 500);

        return false;
      },
      handleDrop: (view, event) => {
        const editorInstance = editor || view.state.editor;
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          const file = files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            // Get coordinates of the drop
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (coordinates) {
              uploadAndInsertImage(editorInstance, file, coordinates.pos);
            } else {
              uploadAndInsertImage(editorInstance, file);
            }
            return true; // handled
          }
        }
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
      
      // ✅ LCP OPTIMIZATION: Use double RAF instead of arbitrary setTimeout(50).
      // This ensures the first paint has happened and the browser is ready for measurement.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!editorInstance.isDestroyed) {
            initializePagination(editorInstance);
          }
        });
      });

      if (onCreate) {
        onCreate({ editor: editorInstance });
      }
    },
    onUpdate: ({ editor: editorInstance }) => {
      // Pagination logic moved from TextEditor.jsx to keep it unified
      if (editorInstance.storage.athena_is_paginating || isPasting) {
        return;
      }

      // Always fire the parent callback synchronously — it only reads state, no DOM work.
      if (onUpdate) {
        onUpdate({ editor: editorInstance });
      }

      // Defer all DOM measurement and pagination out of React's commit phase.
      requestAnimationFrame(() => {
        if (editorInstance.isDestroyed || editorInstance.storage.athena_is_paginating) return;

        // 🚀 OPTIMIZATION: Throttle the synchronous overflow check.
        // DOM measurements (scrollHeight) force reflow — skip on rapid keystrokes.
        const now = Date.now();
        const shouldCheckSync = isPasting || (now - lastCheckTimeRef.current > CHECK_THROTTLE);

        if (shouldCheckSync) {
          lastCheckTimeRef.current = now;
          try {
            // ✅ LOCALIZED HEIGHT AUDIT: Only check the page where the cursor is.
            // This is much faster than checking every page in the document.
            const { from } = editorInstance.state.selection;
            const pos = editorInstance.view.domAtPos(from);
            const currentPage = pos.node instanceof HTMLElement 
              ? pos.node.closest('.page-content') 
              : pos.node.parentElement?.closest('.page-content');

            if (currentPage) {
              const zoomFactor = (zoom || 100) / 100;
              const style = window.getComputedStyle(currentPage);
              const pt = parseFloat(style.paddingTop) || 0;
              const pb = parseFloat(style.paddingBottom) || 0;
              const contentHeight = (currentPage.scrollHeight - pt - pb) / zoomFactor;

              if (contentHeight > USABLE_HEIGHT - 2) {
                log('[EditorSurface] Visual overflow detected on current page, forcing repagination');
                paginateDocument(editorInstance, { force: true, reason: 'localized-overflow' });
                return;
              }
            } else {
              // Fallback: if we can't find current page, check all (but this should be rare)
              const pages = document.querySelectorAll('.page-content');
              const zoomFactor = (zoom || 100) / 100;
              for (const page of pages) {
                const style = window.getComputedStyle(page);
                const pt = parseFloat(style.paddingTop) || 0;
                const pb = parseFloat(style.paddingBottom) || 0;
                const contentHeight = (page.scrollHeight - pt - pb) / zoomFactor;

                if (contentHeight > USABLE_HEIGHT - 2) {
                  paginateDocument(editorInstance, { force: true, reason: 'global-overflow-fallback' });
                  return;
                }
              }
            }
          } catch (err) {
            log('[EditorSurface.onUpdate] DOM measurement failed:', err);
          }
        }

        debouncePaginate(editorInstance, 150);
      });
    },
    onSelectionUpdate: ({ editor: editorInstance }) => {
      if (onSelectionUpdate) {
        // 🔥 CRITICAL: Defer selection updates to avoid flushSync warnings in React 18/19
        requestAnimationFrame(() => {
          if (!editorInstance.isDestroyed) {
            onSelectionUpdate({ editor: editorInstance });
          }
        });
      }
    },
    onDestroy: () => {
      if (onDestroy) {
        onDestroy();
      }
    },
  });

  // Sync line-spacing custom properties and trigger repagination on change
  useEffect(() => {
    if (lineSpacing) {
      document.documentElement.style.setProperty('--editor-line-height', String(lineSpacing));
      document.documentElement.style.setProperty('--lh', String(lineSpacing));
      
      // Calculate dynamic pixel values too
      const baseFontSize = 14.667;
      const lhPx = `${Math.ceil(baseFontSize * lineSpacing)}px`;
      document.documentElement.style.setProperty('--editor-line-height-px', lhPx);
      document.documentElement.style.setProperty('--lh-px', lhPx);
      
      // Invalidate pagination cache since block metrics changed
      if (typeof invalidatePaginationCache === 'function') {
        invalidatePaginationCache();
      }
      
      // Repaginate the editor
      if (editor && !editor.isDestroyed) {
        paginateDocument(editor, { force: true, reason: 'line-spacing-change-effect' });
      }
    }
  }, [lineSpacing, editor]);

  // Sync editor instance to parent ref
  useEffect(() => {
    if (editor) {
      setActiveEditor(editor);
      if (editorRef) {
        editorRef.current = editor;
      }
      internalEditorRef.current = editor;
    }
  }, [editor, editorRef, setActiveEditor]);

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
