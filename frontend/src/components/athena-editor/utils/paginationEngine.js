/**
 * paginationEngine.js
 *
 * Content-based height estimation — no live DOM measurement.
 * DOM measurement inside fixed-height page containers is always wrong:
 * the container forces 1123px so every child reports inflated heights.
 *
 * IMPORTANT: This module must be a singleton. If Vite HMR creates two
 * instances, both will have their own _isPaginating flag and fight each other.
 * If you see two different ?t= timestamps in console, do a full page reload.
 *
 * ── History of bugs fixed in this version ────────────────────────────────────
 *
 * BUG-1  transformPasted crash ("Cannot read properties of undefined")
 *        Fixed in TextEditor.jsx — see companion note at bottom of this file.
 *
 * BUG-2  Pasted text stays on one page even when height > USABLE_HEIGHT.
 *        Root cause A: binning loop condition `cur.length > 0` is false on
 *          the very first block, so a lone oversized block always lands on
 *          page 1 without triggering a page break.
 *        Root cause B: previous "proxy" fix shared the same ProseMirror node
 *          object across multiple pages. ProseMirror silently drops all but
 *          the first occurrence → pages 2+ render blank.
 *        Fix: splitOversizedNode() creates REAL new paragraph nodes (copies
 *          of the original with sliced text runs) so each page gets its own
 *          independent node object. The original node is never referenced twice.
 *
 * BUG-3  Guards 2 & 3 blocked legitimate single-block pastes even with
 *        force:true. Removed — splitting handles the real case.
 */

import { Fragment } from '@tiptap/pm/model';
import {
  A4_HEIGHT_PX as PAGE_HEIGHT,
  PAGE_MARGIN_TOP_PX as MARGIN_TOP,
  PAGE_MARGIN_BOTTOM_PX as MARGIN_BOTTOM,
} from '../../../utils/pagination/constants';

// Computed usable height
export const USABLE_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

// ── Typography model (11pt Inter, 1.6 line-height, 650px usable width) ────────
// ✅ FIX 1: Corrected constants based on actual rendered measurements
const LINE_H         = 22;   // px per line (was 28 — 11pt Inter at 1.6lh = ~22px actual)
const CHARS_PER_LINE = 88;   // chars per line (was 95 — more conservative for mixed content)
const PARA_MARGIN    = 16;   // bottom margin (was 14)
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
      
      // ✅ FIX 1: Remove the 30% cap - it was masking the real problem
      // If paragraph is taller than a page, it will get its own page naturally
      if (h > USABLE_HEIGHT) {
        console.warn(`[estimateHeight] Paragraph exceeds page height: ${h}px (${len} chars) — will occupy its own page`);
      }
      
      return h; // Return real estimate, no cap
    }
  }
};

// ── Split an oversized node into REAL new ProseMirror nodes ──────────────────
const splitOversizedNode = (node, schema) => {
  const h = estimateHeight(node);
  
  console.log('[splitOversizedNode] Called with:', {
    nodeType: node.type.name,
    textLength: node.textContent.length,
    estimatedHeight: h,
    usableHeight: USABLE_HEIGHT,
    shouldSplit: h > USABLE_HEIGHT
  });
  
  if (h <= USABLE_HEIGHT) {
    console.log('[splitOversizedNode] Node fits on one page, returning as-is');
    return [node];
  }

  // Only paragraphs can be meaningfully split by text content.
  if (node.type.name !== 'paragraph') {
    console.log('[splitOversizedNode] Not a paragraph, returning as-is');
    return [node];
  }

  // How many lines fit on one page
  const linesPerPage = Math.floor((USABLE_HEIGHT - PARA_MARGIN) / LINE_H);
  const charsPerPage = linesPerPage * CHARS_PER_LINE;
  
  console.log('[splitOversizedNode] Calculated capacity:', { linesPerPage, charsPerPage });

  // Collect all inline content as {text, marks} segments
  const segments = [];
  node.forEach(inline => {
    if (inline.isText) {
      segments.push({ text: inline.text, marks: inline.marks });
    }
  });

  console.log('[splitOversizedNode] Found segments:', segments.length);

  if (segments.length === 0) {
    console.log('[splitOversizedNode] No text segments found, returning as-is');
    return [node];
  }

  // Merge all text so we can slice by character count
  const chars = []; // Array of { ch: string, marks: Mark[] }
  for (const seg of segments) {
    for (const ch of seg.text) {
      chars.push({ ch, marks: seg.marks });
    }
  }

  console.log('[splitOversizedNode] Total characters:', chars.length);

  if (chars.length === 0) {
    console.log('[splitOversizedNode] No characters after processing, returning as-is');
    return [node];
  }

  // Slice characters into page-sized chunks and rebuild paragraphs
  const result = [];
  let offset = 0;
  let chunkIndex = 0;

  while (offset < chars.length) {
    const chunk = chars.slice(offset, offset + charsPerPage);
    offset += charsPerPage;
    chunkIndex++;

    console.log('[splitOversizedNode] Processing chunk', chunkIndex, ':', {
      charCount: chunk.length,
      textPreview: chunk.map(c => c.ch).slice(0, 50).join('') + '...'
    });

    // Re-group consecutive characters that share the same marks into text nodes
    const inlineNodes = [];
    let runStart = 0;

    while (runStart < chunk.length) {
      const runMarks = chunk[runStart].marks;
      let runEnd = runStart + 1;

      while (
        runEnd < chunk.length &&
        marksEqual(chunk[runEnd].marks, runMarks)
      ) {
        runEnd++;
      }

      const text = chunk.slice(runStart, runEnd).map(c => c.ch).join('');
      inlineNodes.push(schema.text(text, runMarks));
      runStart = runEnd;
    }

    // Create a new paragraph node with the same attrs as the original
    const paragraphNode = schema.nodes.paragraph.create(
      node.attrs,
      Fragment.fromArray(inlineNodes)
    );
    
    console.log('[splitOversizedNode] Created paragraph chunk', chunkIndex, ':', {
      textLength: paragraphNode.textContent.length,
      textPreview: paragraphNode.textContent.substring(0, 50) + '...'
    });
    
    result.push(paragraphNode);
  }

  console.log('[splitOversizedNode] Returning', result.length, 'split nodes');
  return result;
};

// Helper: structural mark equality (avoids reference comparison)
const marksEqual = (a, b) => {
  if (a.length !== b.length) return false;
  return a.every((m, i) =>
    m.type.name === b[i].type.name &&
    JSON.stringify(m.attrs) === JSON.stringify(b[i].attrs)
  );
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

    // Guard: single empty paragraph — user just moved cursor, skip
    if (
      allBlocks.length === 1 &&
      allBlocks[0].type.name === 'paragraph' &&
      allBlocks[0].textContent.length === 0 &&
      !options.force
    ) {
      setFlag('isPaginating', false);
      return false;
    }

    // Expand any block that is taller than one page into multiple real nodes.
    // This ensures each page gets independent node objects (no shared references).
    const blocksWithH = allBlocks.flatMap(node => {
      // Split oversized paragraphs into independent copies with sliced text
      const splitNodes = splitOversizedNode(node, schema);
      
      // DEBUG: Log what we're getting from splitOversizedNode
      console.log('[paginateDocument] splitOversizedNode returned:', {
        originalNode: node.type.name,
        originalText: node.textContent.substring(0, 50) + '...',
        splitCount: splitNodes.length,
        splitNodes: splitNodes.map((n, i) => ({
          index: i,
          type: n.type.name,
          textLength: n.textContent.length,
          textPreview: n.textContent.substring(0, 30) + '...'
        }))
      });
      
      // Re-wrap with height estimates for the binning loop
      return splitNodes.map(splitNode => ({
        node: splitNode,
        height: estimateHeight(splitNode),
      }));
    });

    const totalH = blocksWithH.reduce((s, b) => s + b.height, 0);
    console.log(
      `[paginateDocument] ${allBlocks.length} blocks → ${blocksWithH.length} layout-units,` +
      ` total height ${Math.round(totalH)}px, usable/page ${USABLE_HEIGHT}px`
    );

    // Bin layout-units into pages
    // FIX-2: Because oversized blocks are now split into USABLE_HEIGHT-sized proxies,
    // the binning condition triggers correctly even for a single-block document.
    const pages = [];   // Array<Array<layoutUnit>>
    let cur = [], curH = 0;

    for (const b of blocksWithH) {
      if (pages.length >= MAX_PAGES) break;
      if (cur.length > 0 && curH + b.height > USABLE_HEIGHT) {
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

    // ✅ BUG 2 FIX: Stamp fingerprint ONLY when we actually dispatch (after no-op check passes)
    const fingerprint = JSON.stringify(pages.map(pg => pg.length));
    if (editor.storage._lastPaginationFingerprint === fingerprint && !options.force) {
      console.log('[paginateDocument] Fingerprint match — skipping dispatch');
      setFlag('isPaginating', false);
      return false;
    }
    editor.storage._lastPaginationFingerprint = fingerprint;

    // Build page nodes — pageNumber attr is set explicitly here
    // FIX-2: Each layout-unit now contains an actual split node with real content
    console.log(`[paginateDocument] Building ${pages.length} page nodes`);
    const newPages = pages.map((pg, i) => {
      const attrs = { pageNumber: i + 1, isBlank: false };
      
      // Extract the actual nodes from layout-units
      const pageNodes = pg.map(unit => unit.node);
      
      console.log(`[paginateDocument] Creating page ${i + 1} with ${pageNodes.length} nodes`, {
        pageNumber: i + 1,
        unitsInPage: pg.length,
        nodes: pageNodes.map((n, idx) => ({
          index: idx,
          type: n.type.name,
          textLength: n.textContent.length,
          textPreview: n.textContent.substring(0, 30) + '...'
        }))
      });
      
      const node = schema.nodes.page.create(attrs, pageNodes);
      
      // 🔥 CRITICAL FIX: Verify page node has correct structure
      if (!node.attrs.pageNumber || node.attrs.pageNumber < 1) {
        console.error('[paginateDocument] ⚠️ INVALID PAGE NODE CREATED - missing pageNumber!');
      }
      
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
      
      // 🔥 AUTOMATIC OUTLINE SCANNER: Trigger heading extraction after pagination
      if (editor.storage.onPaginationComplete) {
        try {
          console.log('[paginateDocument] 📑 Triggering outline scanner after pagination');
          editor.storage.onPaginationComplete();
        } catch (error) {
          console.error('[paginateDocument] ❌ Error in onPaginationComplete callback:', error);
        }
      }
    });

    // ✅ FIX 3: Keep the flag set until after onUpdate has been called and returned
    // Defer clearing into next microtask to prevent racing calls from slipping through
    Promise.resolve().then(() => {
      setFlag('isPaginating', false);   // ✅ cleared AFTER the resulting onUpdate fires
    });
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
let _lastForceTime = 0; // ✅ BUG 3 FIX: Track last force time for cooldown

export const debouncePaginate = (editor, delay = 300) => {
  clearTimeout(_timer);
  // ✅ Don't schedule if a force-repaginate just ran (within 600ms)
  if (Date.now() - _lastForceTime < 600) {
    console.log('[debouncePaginate] Backing off - forceRepaginate just ran');
    return;
  }
  _timer = setTimeout(() => {
    if (!editor?.storage?.athena_is_paginating) paginateDocument(editor);
  }, delay);
};

// ── Post-paste ────────────────────────────────────────────────────────────────
export const forceRepaginate = (editor) => {
  clearTimeout(_timer);
  _lastForceTime = Date.now();  // ✅ mark force time so debouncePaginate backs off
  requestAnimationFrame(() => paginateDocument(editor, { force: true }));
};

// ── Call once from editor onCreate ───────────────────────────────────────────
// ✅ DEPRECATED: Removed to prevent double-pagination race with usePastePagination
// The ProseMirror plugin in usePastePagination handles all paste interception.
export const setupPasteDetection = (editor) => {
  if (!editor) return;
  // Intentionally empty — paste handling moved to usePastePagination hook
};

export const safePaginate         = paginateDocument;
export const debounceSafePaginate = debouncePaginate;
export default { paginateDocument, debouncePaginate, safePaginate, debounceSafePaginate };