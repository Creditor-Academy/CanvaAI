/**
 * paginationEngine.js — Google Docs-level pagination
 *
 * ── Cursor instability bugs fixed in this version ─────────────────────────────
 *
 * BUG-1  Wrong selection mapping after replaceWith.
 *        tr.mapping.map(pos) through a full-document replacement
 *        (replaceWith(0, doc.content.size, newContent)) always maps
 *        every position to 0 or content.size. Cursor jumped to start/end.
 *        FIX: Compute the cursor's position relative to its block within
 *        the old document, then walk the new document to find the matching
 *        block by index and reconstruct an absolute position. This survives
 *        the full replacement and lands the cursor in the right spot.
 *
 * BUG-2  Scroll reposition on every keystroke.
 *        The RAF scroll handler ran after every pagination dispatch
 *        (scrollTop = ratio * scrollHeight) causing the viewport to jump.
 *        FIX: Only scroll when the cursor page is genuinely out of view.
 *        Use IntersectionObserver-style rect comparison, not a ratio.
 *
 * BUG-3  debouncePaginate had no backoff after forceRepaginate.
 *        Paste → forceRepaginate → onUpdate (300ms) → debouncePaginate
 *        → second full replacement → second cursor remap. Double jump.
 *        FIX: _lastForceTime guard: skip debounce for 800ms after force.
 *
 * BUG-4  Micro-change guard updated _lastDocSize even when skipping.
 *        Delta accumulated across skipped keystrokes until it crossed 4,
 *        then fired pagination with wrong accumulated delta. Periodic jump.
 *        FIX: Only update _lastDocSize when pagination actually runs.
 *        Also expanded the guard: skip when totalH < 90% of USABLE_HEIGHT.
 *
 * BUG-5  Phantom 24px first-page capacity reduction.
 *        CSS has --pad-top: 15px, identical for all pages. There is no
 *        extra 24px on page 1. The reduction caused block distribution to
 *        differ from what CSS rendered, making page breaks wrong on page 1
 *        and triggering repeated re-pagination on that page.
 *        FIX: All pages use the same USABLE_HEIGHT capacity.
 *
 * BUG-6  PARA_MARGIN subtracted from curH only on the last page.
 *        CSS .page > *:last-child { margin-bottom: 0 } applies to every
 *        page's last block, not just the document's last page.
 *        FIX: During binning, when a block would overflow, check with
 *        (curH + b.height - PARA_MARGIN) to account for last-block margin
 *        removal on every page, not only the last one.
 */

import { Fragment, Slice } from '@tiptap/pm/model';
import { TextSelection }   from '@tiptap/pm/state';
import {
  A4_HEIGHT_PX          as PAGE_HEIGHT,
  PAGE_MARGIN_TOP_PX    as MARGIN_TOP,
  PAGE_MARGIN_BOTTOM_PX as MARGIN_BOTTOM,
  LINE_HEIGHT_PX        as LINE_H,
  PARA_MARGIN_PX        as PARA_MARGIN,
  CHARS_PER_LINE,
} from '../../../utils/pagination/constants';

// ── Usable content height per page ────────────────────────────────────────────
// = CSS page height − CSS padding-top − CSS padding-bottom
// NO ghost zone or proactive buffer: natural line-packing leaves 11px already.
export const USABLE_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

// ── Per-element height constants (must match real-pagination.css) ──────────────
const TABLE_ROW_H    = 36;   // td padding 6px×2 + LINE_H(24) = 36px
const TABLE_MARGIN   = 22;   // table margin: 0.75em × 2 ≈ 22px
const IMAGE_H        = 200;  // fallback when attrs.height == 0
const IMAGE_MARGIN   = 22;   // img margin: 0.75em × 2 ≈ 22px
const HR_H           = 32;   // border(1) + margin(1em×2≈29px) + rounding(2)
const CODE_LINE_H    = 20;   // 0.875em × 1.5lh = 19.2px → 20px
const CODE_PAD       = 30;   // pre padding: 1em × 2 ≈ 29.3px → 30px
const CODE_MARGIN    = 22;   // pre margin: 0.75em × 2 ≈ 22px
const BLOCKQUOTE_PAD = 6;    // 0.2em top + 0.2em bottom ≈ 6px
// Heading extra px over one body LINE_H (larger font + top+bottom margin).
// Calibrated against the SINGLE set of heading rules in real-pagination.css.
const HEADING_EXTRA  = [0, 54, 43, 37, 29, 29, 29]; // index = heading level

const MAX_PAGES = 200;

// ── Singleton flags (window so HMR reloads share state) ──────────────────────
const getFlag = (k)    => window[`__athena_${k}`] ?? false;
const setFlag = (k, v) => { window[`__athena_${k}`] = v; };

// ── Height cache (WeakMap → automatic GC when nodes are discarded) ─────────────
const _heightCache = new WeakMap();

export const estimateHeight = (node) => {
  if (_heightCache.has(node)) return _heightCache.get(node);

  let h;
  switch (node.type.name) {
    case 'horizontalRule':
      h = HR_H;
      break;

    case 'image': {
      const ih = node.attrs?.height > 0
        ? Math.min(node.attrs.height, USABLE_HEIGHT * 0.85)
        : IMAGE_H;
      h = ih + IMAGE_MARGIN;
      break;
    }

    case 'heading': {
      const lvl = Math.min(node.attrs?.level ?? 1, 6);
      const len = node.textContent.length || 1;
      // Larger heading font → fewer chars fit per line
      const cpl   = Math.max(20, Math.round(CHARS_PER_LINE / (1 + (6 - lvl) * 0.08)));
      const lines = Math.max(1, Math.ceil(len / cpl));
      const hlh   = Math.round(LINE_H * (0.95 - (lvl - 1) * 0.02));
      h = lines * hlh + HEADING_EXTRA[lvl];
      break;
    }

    case 'codeBlock': {
      const lines = Math.max(1, (node.textContent || '').split('\n').length);
      h = lines * CODE_LINE_H + CODE_PAD + CODE_MARGIN;
      break;
    }

    case 'blockquote': {
      h = BLOCKQUOTE_PAD;
      node.forEach(child => { h += estimateHeight(child); });
      break;
    }

    case 'table': {
      let rows = 0;
      node.forEach(() => rows++);
      h = rows * TABLE_ROW_H + TABLE_MARGIN;
      break;
    }

    case 'bulletList':
    case 'orderedList':
    case 'taskList': {
      h = 0;
      node.forEach(item => {
        h += 4; // li margin-bottom: 0.25em ≈ 3.7px → 4px
        item.forEach(child => { h += estimateHeight(child); });
      });
      h += PARA_MARGIN;
      break;
    }

    default: { // paragraph + unknown block types
      const len = node.textContent.length;
      h = len === 0
        ? LINE_H + PARA_MARGIN
        : Math.max(1, Math.ceil(len / CHARS_PER_LINE)) * LINE_H + PARA_MARGIN;
      break;
    }
  }

  _heightCache.set(node, h);
  return h;
};

// ── Flatten page wrappers → flat block list ───────────────────────────────────
const flattenBlocks = (doc) => {
  const out = [];
  doc.forEach(child => {
    if (child.type.name === 'page') child.forEach(b => out.push(b));
    else out.push(child);
  });
  return out;
};

// ── Split oversized paragraph into real independent nodes ─────────────────────
// Non-paragraph blocks (tables, images) that are taller than USABLE_HEIGHT
// get their own page. We cannot split them without losing semantics.
const splitOversizedNode = (node, schema) => {
  if (estimateHeight(node) <= USABLE_HEIGHT) return [node];
  if (node.type.name !== 'paragraph') return [node];

  const linesPerPage = Math.floor((USABLE_HEIGHT - PARA_MARGIN) / LINE_H);
  const charsPerPage = linesPerPage * CHARS_PER_LINE;

  const chars = [];
  node.forEach(inline => {
    if (inline.isText) for (const ch of inline.text) chars.push({ ch, marks: inline.marks });
  });
  if (chars.length === 0) return [node];

  const result = [];
  let offset = 0;
  while (offset < chars.length) {
    const chunk = chars.slice(offset, offset + charsPerPage);
    offset += charsPerPage;
    const runs = [];
    let rs = 0;
    while (rs < chunk.length) {
      const rm = chunk[rs].marks;
      let re = rs + 1;
      while (re < chunk.length && marksEqual(chunk[re].marks, rm)) re++;
      runs.push(schema.text(chunk.slice(rs, re).map(c => c.ch).join(''), rm));
      rs = re;
    }
    result.push(schema.nodes.paragraph.create(node.attrs, Fragment.fromArray(runs)));
  }
  return result;
};

const marksEqual = (a, b) => {
  if (a.length !== b.length) return false;
  return a.every((m, i) =>
    m.type.name === b[i].type.name &&
    JSON.stringify(m.attrs) === JSON.stringify(b[i].attrs)
  );
};

// ── Cursor position reconstruction after full-document replacement ─────────────
//
// WHY tr.mapping.map() is WRONG here:
//   state.tr.replaceWith(0, doc.content.size, newContent) replaces the entire
//   document in a single step. ProseMirror maps positions through this step
//   by returning 0 (start) or newContent.size (end) for any input position.
//   There is no structural mapping because the entire content was replaced.
//
// CORRECT APPROACH:
//   1. Before dispatch: record which block index contains the cursor and
//      the cursor's byte offset within that block.
//   2. After dispatch: walk the new document to find the block at the same
//      index (blocks may have shifted pages but their order is preserved),
//      then add the byte offset back. Clamp to valid bounds.
//
// This gives a semantically correct cursor position even after a full
// document replacement, which is exactly what pagination does.
const computeNewCursorPos = (oldDoc, newDoc, oldFrom) => {
  try {
    // Find which flat block the cursor was in and its offset within that block
    const oldBlocks = flattenBlocks(oldDoc);
    let blockIdx = 0;
    let offsetInBlock = 0;
    let accumulated = 0; // absolute position up to start of each page+block

    // Walk the old document structure to find cursor position
    let found = false;
    oldDoc.forEach((pageNode) => {
      if (found) return;
      const pageStart = accumulated + 1; // +1 for the page node's opening token
      pageNode.forEach((block) => {
        if (found) return;
        const blockStart = accumulated + 1; // +1 for block opening token
        const blockEnd   = blockStart + block.content.size;
        if (oldFrom >= blockStart && oldFrom <= blockEnd) {
          offsetInBlock = oldFrom - blockStart;
          found = true;
        } else {
          blockIdx++;
        }
        accumulated += block.nodeSize;
      });
      accumulated += 2; // page open + close tokens (excluding children already counted)
    });

    if (!found) return Math.min(oldFrom, newDoc.content.size - 1);

    // Walk the new document to find the block at blockIdx
    let newBlockIdx = 0;
    let newPos = 1; // start after document open token
    let targetPos = -1;

    newDoc.forEach((pageNode) => {
      if (targetPos !== -1) return;
      newPos += 1; // page opening token
      pageNode.forEach((block) => {
        if (targetPos !== -1) return;
        if (newBlockIdx === blockIdx) {
          // Found the block — add the offset within it
          const clamped = Math.min(offsetInBlock, block.content.size);
          targetPos = newPos + clamped;
        }
        newBlockIdx++;
        newPos += block.nodeSize;
      });
      newPos += 1; // page closing token
    });

    if (targetPos === -1) {
      // Block index out of range (doc got shorter) — put cursor at end
      return Math.max(1, newDoc.content.size - 1);
    }

    return Math.min(Math.max(1, targetPos), newDoc.content.size - 1);
  } catch (_) {
    return Math.min(Math.max(1, oldFrom), newDoc.content.size - 1);
  }
};

// ── Core pagination function ───────────────────────────────────────────────────
export const paginateDocument = (editor, options = {}) => {

  // ── Guards ────────────────────────────────────────────────────────────────
  if (getFlag('pasteInFlight') && !options.force) return false;
  if (getFlag('isPaginating'))                    return false;
  if (!editor || editor.isDestroyed)              return false;
  if (editor.storage?.athena_is_paginating)       return false;

  const { state, schema } = editor;
  if (!state?.doc || state.doc.content.size === 0) return false;

  setFlag('isPaginating', true);

  try {
    const { doc } = state;
    const rawBlocks = flattenBlocks(doc);

    // ── EDGE CASE 1: Empty document ────────────────────────────────────────
    if (rawBlocks.length === 0) {
      setFlag('isPaginating', false);
      return false;
    }

    // ── EDGE CASE 2: Single empty paragraph ───────────────────────────────
    if (
      !options.force &&
      rawBlocks.length === 1 &&
      rawBlocks[0].type.name === 'paragraph' &&
      rawBlocks[0].textContent.length === 0
    ) {
      setFlag('isPaginating', false);
      return false;
    }

    // ── EDGE CASE 3: Micro-change optimisation (BUG-4 fixed) ─────────────
    // Only skip when document is safely under 90% full AND change is tiny.
    // _lastDocSize is updated ONLY when pagination actually runs (not on skip).
    if (!options.force) {
      const currentSize = doc.content.size;
      const lastSize    = editor.storage._lastDocSize ?? 0;
      const delta       = Math.abs(currentSize - lastSize);

      if (lastSize > 0 && delta > 0 && delta < 4) {
        const totalH = rawBlocks.reduce((s, n) => s + estimateHeight(n), 0);
        if (totalH < USABLE_HEIGHT * 0.90) {
          // Tiny change + document well under capacity → safe to skip
          // Do NOT update _lastDocSize here (BUG-4 fix)
          setFlag('isPaginating', false);
          return false;
        }
      }
      // Update size only when we proceed with pagination
      editor.storage._lastDocSize = currentSize;
    }

    // Expand oversized blocks into real independent paragraph nodes
    const allBlocks   = rawBlocks.flatMap(n => splitOversizedNode(n, schema));
    const blocksWithH = allBlocks.map(n => ({ node: n, height: estimateHeight(n) }));
    const totalH      = blocksWithH.reduce((s, b) => s + b.height, 0);

    // ── EDGE CASE 4: Exceeds MAX_PAGES ────────────────────────────────────
    if (totalH > MAX_PAGES * USABLE_HEIGHT) {
      console.warn(`[paginateDocument] Content exceeds MAX_PAGES (${MAX_PAGES}). Truncating.`);
    }

    // ── Bin blocks into pages (BUG-5 and BUG-6 fixed) ────────────────────
    //
    // BUG-5 fix: No first-page capacity reduction — all pages use USABLE_HEIGHT.
    // BUG-6 fix: When checking overflow, subtract PARA_MARGIN from the running
    //   height because CSS removes the last block's margin-bottom on every page
    //   (via .page > *:last-child { margin-bottom: 0 }). This is symmetrical
    //   with how we estimated the block's height (which included PARA_MARGIN).
    const pages = [];
    let cur  = [];
    let curH = 0;

    for (const b of blocksWithH) {
      if (pages.length >= MAX_PAGES) break;

      // ── EDGE CASE 5: Block larger than a full page ───────────────────
      if (b.height > USABLE_HEIGHT) {
        if (cur.length > 0) {
          pages.push(cur.map(u => u.node));
          cur = []; curH = 0;
        }
        pages.push([b.node]); // oversized block on its own page
        continue;
      }

      // Overflow check: account for last-block margin removal (BUG-6 fix).
      // The effective used height when b is the last block on this page would
      // be (curH + b.height - PARA_MARGIN). If that exceeds capacity, start new page.
      const effectiveH = curH + b.height - PARA_MARGIN;
      if (cur.length > 0 && effectiveH > USABLE_HEIGHT) {
        pages.push(cur.map(u => u.node));
        cur = []; curH = 0;
      }

      cur.push(b);
      curH += b.height;
    }
    if (cur.length > 0) pages.push(cur.map(u => u.node));

    // ── EDGE CASE 6: No pages generated ───────────────────────────────────
    if (pages.length === 0) {
      pages.push([schema.nodes.paragraph.create()]);
    }

    // ── No-op check ───────────────────────────────────────────────────────
    if (!options.force && doc.childCount === pages.length) {
      let same = true, bi = 0;
      doc.forEach(pageNode => {
        if (pageNode.type.name !== 'page') { same = false; return; }
        pageNode.forEach(block => {
          if (bi >= allBlocks.length || block !== allBlocks[bi++]) same = false;
        });
      });
      if (same) { setFlag('isPaginating', false); return false; }
    }

    // ── Fingerprint check ─────────────────────────────────────────────────
    const fingerprint = JSON.stringify(pages.map(pg => pg.length));
    if (!options.force && editor.storage._lastPaginationFingerprint === fingerprint) {
      setFlag('isPaginating', false);
      return false;
    }
    editor.storage._lastPaginationFingerprint = fingerprint;

    // ── Build page nodes ──────────────────────────────────────────────────
    const newPages = pages.map((nodes, i) =>
      schema.nodes.page.create({ pageNumber: i + 1, isBlank: false }, nodes)
    );

    // ── Capture pre-dispatch state for cursor reconstruction (BUG-1 fix) ──
    const oldFrom       = state.selection.from;
    const oldTo         = state.selection.to;
    const isCollapsed   = state.selection.empty;

    // Capture scroll state before dispatch
    const container = editor.view.dom.closest?.('.editor-pages-container')
                   ?? editor.view.dom.parentElement?.closest('.editor-pages-container');
    const savedScrollTop = container?.scrollTop ?? 0;

    // Find which page index contains the cursor (for scroll restore)
    let cursorPageIdx = 0;
    {
      let acc = 0;
      for (let i = 0; i < pages.length; i++) {
        const pageSize = pages[i].reduce((s, n) => s + n.nodeSize + 2, 0); // +2 for page tokens
        if (oldFrom >= acc && oldFrom < acc + pageSize) { cursorPageIdx = i; break; }
        acc += pageSize + 2;
      }
    }

    // ── Dispatch ─────────────────────────────────────────────────────────
    editor.storage.athena_is_paginating = true;

    let newDocForCursor;
    try {
      const tr = state.tr.replaceWith(0, doc.content.size, Fragment.fromArray(newPages));
      if (!tr?.steps?.length) throw new Error('Empty transaction');

      // Set the cursor on the transaction using reconstructed position (BUG-1 fix)
      newDocForCursor = tr.doc;
      const newFrom = computeNewCursorPos(doc, tr.doc, oldFrom);
      const newTo   = isCollapsed ? newFrom : computeNewCursorPos(doc, tr.doc, oldTo);
      const clamp   = (p) => Math.min(Math.max(1, p), tr.doc.content.size - 1);

      try {
        tr.setSelection(TextSelection.create(tr.doc, clamp(newFrom), clamp(newTo)));
      } catch (_) {
        // If selection creation fails (e.g. position in non-selectable node),
        // leave the selection unset — ProseMirror will place it at a valid spot.
      }

      editor.view.dispatch(tr);
    } catch (txErr) {
      console.error('[paginateDocument] Transaction failed:', txErr);
      editor.storage.athena_is_paginating = false;
      setFlag('isPaginating', false);
      return false;
    }

    // ── Scroll restore (BUG-2 fix) ────────────────────────────────────────
    // Only scroll when the cursor's page is completely outside the visible viewport.
    // Never jump the scroll on a keystroke that keeps the cursor on-screen.
    requestAnimationFrame(() => {
      editor.storage.athena_is_paginating = false;

      if (!container) {
        setFlag('isPaginating', false);
        return;
      }

      const pageEls = container.querySelectorAll('.page');
      const target  = pageEls[cursorPageIdx];

      if (target) {
        const cRect = container.getBoundingClientRect();
        const pRect = target.getBoundingClientRect();
        const pageTopInContainer    = pRect.top  - cRect.top  + container.scrollTop;
        const pageBottomInContainer = pRect.bottom - cRect.top + container.scrollTop;
        const viewTop    = container.scrollTop;
        const viewBottom = container.scrollTop + container.clientHeight;

        // Only scroll if cursor page is NOT visible at all
        // More generous visibility check - if ANY part of page is visible, don't scroll
        const pageFullyAbove = pageBottomInContainer <= viewTop;
        const pageFullyBelow = pageTopInContainer >= viewBottom;
        
        if (pageFullyBelow) {
          // Page is below viewport - scroll down to show it
          container.scrollTop = Math.max(0, pageTopInContainer - 40); // 40px breathing room
        } else if (pageFullyAbove) {
          // Page is above viewport - scroll up to show it
          container.scrollTop = Math.max(0, pageTopInContainer - 40);
        }
        // If page is partially or fully visible, DON'T scroll - let user control it
      }

      setFlag('isPaginating', false);

      try { editor.storage.onPaginationComplete?.(); } catch (_) {}
    });

    return true;

  } catch (err) {
    console.error('[paginateDocument] Fatal error:', err);
    setFlag('isPaginating', false);
    if (editor.storage) {
      editor.storage.athena_is_paginating = false;
      editor.storage._paginationRetryCount =
        (editor.storage._paginationRetryCount ?? 0) + 1;
    }
    return false;
  }
};

// ── Debounced wrapper (BUG-3 fix: backoff after forceRepaginate) ──────────────
let _timer         = null;
let _lastForceTime = 0;

export const debouncePaginate = (editor, delay = 300) => {
  clearTimeout(_timer);
  // Back off for 800ms after forceRepaginate to prevent double-dispatch
  if (Date.now() - _lastForceTime < 800) return;
  _timer = setTimeout(() => {
    if (!editor?.storage?.athena_is_paginating) paginateDocument(editor);
  }, delay);
};

// ── Force repaginate (paste / load) ──────────────────────────────────────────
export const forceRepaginate = (editor) => {
  clearTimeout(_timer);
  _lastForceTime = Date.now();
  _heightCache.delete; // clear for force runs (cannot clear WeakMap, so rebuild naturally)
  requestAnimationFrame(() => paginateDocument(editor, { force: true }));
};

// ── Scroll helpers ────────────────────────────────────────────────────────────
export const scrollToTop = (editor, { behavior = 'smooth' } = {}) => {
  const c = editor?.view?.dom?.parentElement?.closest('.editor-pages-container');
  c?.scrollTo({ top: 0, behavior });
};

export const scrollToPage = (editor, pageNumber, { behavior = 'smooth', offset = 20 } = {}) => {
  if (!editor?.view || pageNumber < 1) return;
  const c = editor.view.dom.parentElement?.closest('.editor-pages-container');
  if (!c) return;
  requestAnimationFrame(() => {
    const els    = c.querySelectorAll('.page');
    const target = els[Math.min(pageNumber - 1, els.length - 1)];
    if (!target) return;
    const top = target.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - offset;
    c.scrollTo({ top: Math.max(0, top), behavior });
  });
};

// ── Cleanup ───────────────────────────────────────────────────────────────────
export const cleanupPagination = (editor) => {
  clearTimeout(_timer);
  _timer = null;
  setFlag('isPaginating', false);
  setFlag('pasteInFlight', false);
  if (editor?.storage) {
    editor.storage.athena_is_paginating       = false;
    editor.storage._lastDocSize               = 0;
    editor.storage._lastPaginationFingerprint = null;
    editor.storage._paginationRetryCount      = 0;
  }
};

// ── Setup paste detection (intentionally empty — owned by usePastePagination) ──
export const setupPasteDetection = (_editor) => {};

// ── Exports ───────────────────────────────────────────────────────────────────
export { flattenBlocks, splitOversizedNode, _heightCache };
export const safePaginate          = paginateDocument;
export const debounceSafePaginate  = debouncePaginate;
export const scrollToDocumentTop   = scrollToTop;
export const scrollToPageNav       = scrollToPage;
export const cleanup               = cleanupPagination;
export default {
  paginateDocument, debouncePaginate, forceRepaginate,
  safePaginate, debounceSafePaginate,
  cleanupPagination, scrollToTop, scrollToPage, setupPasteDetection,
};