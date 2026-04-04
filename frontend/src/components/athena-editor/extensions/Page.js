/**
 * Page.js — TipTap Page Node Extension
 *
 * CRITICAL FIX: pageNumber attr MUST have `default: 1`
 * TipTap only uses parseHTML when deserializing from HTML.
 * When paginationEngine calls schema.nodes.page.create({ pageNumber: 2 }),
 * TipTap merges the passed attrs with the schema defaults — but if there
 * is no default declared, the attr slot doesn't exist in the spec and
 * the value is silently dropped, leaving node.attrs.pageNumber === undefined.
 *
 * REQUIRES FULL PAGE RELOAD after replacing this file.
 * HMR will NOT rebuild the TipTap schema — only a fresh editor mount will.
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import PageComponent from '../components/PageView.jsx';
import { 
  A4_HEIGHT_PX as PAGE_HEIGHT,
  A4_WIDTH_PX as PAGE_WIDTH,
  PAGE_MARGIN_TOP_PX as TOP_MARGIN,
  PAGE_MARGIN_BOTTOM_PX as BOTTOM_MARGIN,
  PAGE_MARGIN_LEFT_PX as LEFT_MARGIN,
  PAGE_MARGIN_RIGHT_PX as RIGHT_MARGIN
} from '../../../utils/pagination/constants';

// Computed usable height
const USABLE_HEIGHT = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;

/**
 * Legacy function - now a no-op for backward compatibility.
 * Styles are now in AthenaEditor.css using CSS custom properties.
 * Use updateHeadingStyles() from EditorPagination.js instead.
 */
export const addHeadingStyles = () => {
  // No-op: styles are loaded via AthenaEditor.css
};

// ── Page Node ─────────────────────────────────────────────────────────────────
export const Page = Node.create({
  name: 'page',
  group: 'block',
  // ✅ CRITICAL FIX: Only allow standard block content, NOT other pages
  // This prevents nested pages which cause overlapping/overlay bugs
  content: 'block+',
  // Explicitly define what blocks are allowed (exclude page node)
  defining: true,
  // Note: isolating is explicitly omitted to allow Backspace to join content across pages

  addAttributes() {
    return {
      // ⚠️ MUST have `default` — without it, programmatic .create() drops the value
      pageNumber: {
        default: 1,
        parseHTML:  el  => parseInt(el.getAttribute('data-page-number') || '1', 10),
        renderHTML: attrs => ({ 'data-page-number': attrs.pageNumber }),
      },
      isBlank: {
        default: false,
        parseHTML:  el    => el.getAttribute('data-is-blank') === 'true',
        renderHTML: attrs => ({ 'data-is-blank': String(attrs.isBlank) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-page-number]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'page' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PageComponent);
  },
});

// ── initializePagination ──────────────────────────────────────────────────────
// Wraps bare document content in page nodes on first load.
// All subsequent re-pagination is handled by paginationEngine.js
export const initializePagination = (editor, forceMode = false) => {
  console.log('[initializePagination] CALLED with editor:', !!editor, 'forceMode:', forceMode);

  if (!editor || editor.isDestroyed) return false;

  const { state, schema } = editor;
  if (!state?.doc) return false;

  const doc = state.doc;
  const firstChild = doc.firstChild;
  const alreadyPaged = firstChild?.type.name === 'page';

  console.log('[initializePagination] Current state:', {
    childCount: doc.childCount,
    firstChildType: firstChild?.type.name,
    alreadyPaged,
  });

  if (alreadyPaged && !forceMode) {
    console.log(`[initializePagination] Document already has ${doc.childCount} pages — skipping`);
    return true;
  }

  // Collect non-page top-level nodes
  const contentNodes = [];
  doc.forEach(node => {
    if (node.type.name !== 'page') contentNodes.push(node);
  });

  console.log(`[initializePagination] Found ${contentNodes.length} content nodes to wrap`);

  // Build initial pages
  let pages;
  const emptyPara = () => schema.nodes.paragraph.create();

  if (contentNodes.length === 0) {
    pages = [
      schema.nodes.page.create({ pageNumber: 1, isBlank: false }, [emptyPara()]),
      schema.nodes.page.create({ pageNumber: 2, isBlank: true  }, [emptyPara()]),
    ];
  } else {
    // Put all content on page 1 — paginationEngine will split correctly
    pages = [
      schema.nodes.page.create({ pageNumber: 1, isBlank: false }, contentNodes),
    ];
  }

  console.log(`[initializePagination] Dispatching ${pages.length} pages`);

  try {
    editor.storage.athena_is_paginating = true;
    const tr = state.tr.replaceWith(0, doc.content.size, pages);
    editor.view.dispatch(tr);
    Promise.resolve().then(() => { editor.storage.athena_is_paginating = false; });

    // Verification
    const newDoc = editor.state.doc;
    console.log(`[initializePagination] ✅ Document now has ${newDoc.childCount} pages`);
    newDoc.forEach((node, offset) => {
      console.log(`  Page at offset ${offset}: type=${node.type.name} pageNumber=${node.attrs.pageNumber}`);
    });

    return true;
  } catch (err) {
    console.error('[initializePagination] Error:', err);
    editor.storage.athena_is_paginating = false;
    return false;
  }
};

export default Page;