/**
 * paginationEngine.js
 *
 * Uses content-based height estimation (no live DOM measurement).
 * DOM measurement inside fixed-height page containers is always wrong —
 * the container forces 1123px so every child reports inflated heights.
 *
 * IMPORTANT: This module must be a singleton. If Vite HMR creates two
 * instances, both will have their own _isPaginating flag and fight each other.
 * If you see two different ?t= timestamps in console, do a full page reload.
 */

// ── Page geometry (MUST MATCH CSS!) ─────────────────────────────────────────────
// CSS: .page { min-height: 1123px; padding: 48px 72px; }
// Actual usable height = 1123 - 48 - 48 = 1027px (NOT 931px!)
const PAGE_HEIGHT   = 1123;
const MARGIN_TOP    = 48;   // Match CSS padding-top
const MARGIN_BOTTOM = 48;   // Match CSS padding-bottom
export const USABLE_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM; // 1027px

// ── Typography model (11pt Inter, 1.6 line-height, 650px usable width) ────────
const LINE_H         = 28;   // px per line
const CHARS_PER_LINE = 95;   // characters per line at 650px
const PARA_MARGIN    = 14;   // bottom margin per block
const TABLE_ROW_H    = 32;   // px per table row (reduced from 40px for accuracy)
const IMAGE_H        = 200;  // fallback image height
const HR_H           = 24;   // horizontal rule height
const CODE_PAD       = 24;   // code block top+bottom padding
const MAX_PAGES      = 100;  // Maximum number of pages to create

// ── Module-level singleton flags ──────────────────────────────────────────────
// Stored on window so HMR module reloads share the same flag
const getFlag  = k  => window[`__athena_${k}`] ?? false;
const setFlag  = (k, v) => { window[`__athena_${k}`] = v; };

// ── Height estimator ──────────────────────────────────────────────────────────
const estimateHeight = (node) => {
  switch (node.type.name) {
    case 'horizontalRule':
      return HR_H;

    case 'image':
      return node.attrs.height > 0
        ? Math.min(node.attrs.height, USABLE_HEIGHT * 0.8)
        : IMAGE_H;

    case 'heading': {
      const lines = Math.max(1, Math.ceil((node.textContent.length || 1) / CHARS_PER_LINE));
      const extra = [0, 16, 10, 6, 4, 2, 2][node.attrs.level] ?? 4;
      const h = lines * (LINE_H + extra) + PARA_MARGIN;
      // 🔥 DEBUG: Log suspicious heights
      if (h > USABLE_HEIGHT * 0.5) {
        console.warn(`⚠️ [estimateHeight] ${node.type.name} estimated at ${h}px (text: ${node.textContent.length} chars)`);
      }
      return h;
    }

    case 'codeBlock': {
      const lines = Math.max(1, (node.textContent || '').split('\n').length);
      const h = lines * LINE_H + CODE_PAD + PARA_MARGIN;
      if (h > USABLE_HEIGHT * 0.5) {
        console.warn(`⚠️ [estimateHeight] codeBlock estimated at ${h}px (${lines} lines)`);
      }
      return h;
    }

    case 'blockquote': {
      let h = 8;
      node.forEach(child => { h += estimateHeight(child); });
      return h;
    }

    case 'table': {
      let rows = 0;
      node.forEach(() => rows++);
      const h = rows * TABLE_ROW_H + PARA_MARGIN;
      if (h > USABLE_HEIGHT * 0.5) {
        console.warn(`⚠️ [estimateHeight] table estimated at ${h}px (${rows} rows)`);
      }
      return h;
    }

    case 'bulletList':
    case 'orderedList':
    case 'taskList': {
      let h = 0;
      node.forEach(item => {
        item.forEach(child => { h += estimateHeight(child); });
      });
      const totalH = h + PARA_MARGIN;
      if (totalH > USABLE_HEIGHT * 0.5) {
        console.warn(`⚠️ [estimateHeight] list estimated at ${totalH}px`);
      }
      return totalH;
    }

    default: { // paragraph and anything else
      const len   = node.textContent.length;
      const lines = len === 0 ? 1 : Math.max(1, Math.ceil(len / CHARS_PER_LINE));
      const h = lines * LINE_H + PARA_MARGIN;
      
      // 🔥 CRITICAL DEBUG: Log EVERY paragraph height to catch the bug
      console.log(`[estimateHeight] Paragraph: ${len} chars → ${lines} lines → ${h}px`, {
        nodeType: node.type.name,
        textLength: len,
        calculatedLines: lines,
        finalHeight: h,
        expectedRange: '20-120px'
      });
      
      // 🚨 SAFEGUARD: Cap paragraph height to prevent catastrophic overflow
      const cappedHeight = Math.min(h, USABLE_HEIGHT * 0.3); // Max 30% of page
      
      if (h !== cappedHeight) {
        console.error(`🚨 [estimateHeight] Paragraph capped from ${h}px to ${cappedHeight}px - THIS IS THE BUG!`);
      }
      
      return cappedHeight;
    }
  }
};

// ── Flatten all blocks out of page wrappers ───────────────────────────────────
const flattenBlocks = (doc) => {
  const out = [];
  doc.forEach(child => {
    if (child.type.name === 'page') {
      child.forEach(block => out.push(block));
    } else {
      out.push(child);
    }
  });
  return out;
};

// ── Core pagination ───────────────────────────────────────────────────────────
export const paginateDocument = (editor, options = {}) => {
  if (getFlag('pasteInFlight') && !options.force)  return false;
  if (getFlag('isPaginating'))                      return false;
  if (!editor || editor.isDestroyed)                return false;
  if (editor.storage?.athena_is_paginating)         return false;

  const { state, schema } = editor;
  if (!state?.doc) return false;

  setFlag('isPaginating', true);

  try {
    const { doc } = state;
    const allBlocks = flattenBlocks(doc);
    if (allBlocks.length === 0) { setFlag('isPaginating', false); return false; }

    // Estimate heights
    const blocksWithH = allBlocks.map(node => ({
      node,
      height: estimateHeight(node),
    }));

    const totalH = blocksWithH.reduce((s, b) => s + b.height, 0);
    console.log(`[paginateDocument] ${allBlocks.length} blocks, total height ${Math.round(totalH)}px, usable/page ${USABLE_HEIGHT}px`);

    // Bin into pages
    const pages = [];
    let cur = [], curH = 0;

    for (const b of blocksWithH) {
      if (pages.length >= MAX_PAGES) break;
      if (curH + b.height > USABLE_HEIGHT && cur.length > 0) {
        pages.push(cur); cur = []; curH = 0;
      }
      cur.push(b); curH += b.height;
    }
    if (cur.length > 0) pages.push(cur);

    console.log(`[paginateDocument] → ${pages.length} pages`);

    // No-op check: same page count + same block distribution
    // Skip this check when force mode is enabled
    if (!options.force && doc.childCount === pages.length) {
      let same = true, bi = 0;
      doc.forEach(pageNode => {
        if (pageNode.type.name !== 'page') { same = false; return; }
        pageNode.forEach(block => {
          if (bi >= allBlocks.length || block !== allBlocks[bi++]) same = false;
        });
      });
      if (same) {
        console.log('[paginateDocument] No change — skipping dispatch');
        setFlag('isPaginating', false);
        return false;
      }
    }

    // Build page nodes — pageNumber attr is set explicitly here
    console.log(`[paginateDocument] Building ${pages.length} page nodes`);
    const newPages = pages.map((pg, i) => {
      const attrs = { pageNumber: i + 1, isBlank: false };
      console.log(`[paginateDocument] Creating page node:`, attrs);
      const node = schema.nodes.page.create(attrs, pg.map(b => b.node));
      console.log(`[paginateDocument] Page node created with attrs:`, node.attrs);
      return node;
    });

    // Save cursor
    const savedFrom = state.selection.from;

    // Tag + dispatch
    editor.storage.athena_is_paginating = true;
    editor.view.dispatch(state.tr.replaceWith(0, doc.content.size, newPages));

    // Restore cursor (best-effort)
    try {
      const maxPos = editor.state.doc.content.size - 1;
      editor.commands.setTextSelection(Math.min(savedFrom, maxPos));
    } catch (_) {}

    // Clear guard after the synchronous onUpdate call finishes
    Promise.resolve().then(() => {
      editor.storage.athena_is_paginating = false;
    });

    setFlag('isPaginating', false);
    return true;

  } catch (err) {
    console.error('[paginateDocument]', err);
    setFlag('isPaginating', false);
    if (editor.storage) editor.storage.athena_is_paginating = false;
    return false;
  }
};

// ── Debounced wrapper — use this from onUpdate ────────────────────────────────
let _timer = null;
export const debouncePaginate = (editor, delay = 300) => {
  clearTimeout(_timer);
  _timer = setTimeout(() => {
    if (!editor?.storage?.athena_is_paginating) paginateDocument(editor);
  }, delay);
};

// ── Post-paste ────────────────────────────────────────────────────────────────
export const forceRepaginate = (editor) => {
  clearTimeout(_timer);
  requestAnimationFrame(() => paginateDocument(editor, { force: true }));
};

// ── Call once from editor onCreate ───────────────────────────────────────────
export const setupPasteDetection = (editor) => {
  if (!editor) return;
  editor.on('paste', () => {
    console.log('[pasteDetection] Paste detected — freezing pagination');
    setFlag('pasteInFlight', true);
    clearTimeout(_timer);
    setTimeout(() => {
      setFlag('pasteInFlight', false);
      forceRepaginate(editor);
    }, 150);
  });
};

export const safePaginate         = paginateDocument;
export const debounceSafePaginate = debouncePaginate;
export default { paginateDocument, debouncePaginate, safePaginate, debounceSafePaginate };