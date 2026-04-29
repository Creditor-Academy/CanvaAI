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
// = CSS page height − CSS margin-top − CSS margin-bottom
// 
// CSS Configuration (real-pagination.css):
//   --page-h:     1123px (total page height)
//   --pad-top:     48px (margin-top on .page-content)
//   --pad-bot:     48px (margin-bottom on .page-content)
//   --usable-h:   996px (1123 - 48 - 48 - 31 safety buffer)
//
// The CSS --usable-h (996px) ALREADY includes a 31px safety buffer.
// The .page-content div has height: 996px, which is the ACTUAL usable space.
// 
// ✅ CRITICAL: Do NOT subtract safety buffer again - CSS already did it!
// Using the full 1027px would cause overflow beyond .page-content height.
// Using 996px matches the actual rendered editable area exactly.

const CSS_USABLE_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM; // 1027px
const SAFETY_BUFFER_PX = 31; // Already applied in CSS --usable-h
export const USABLE_HEIGHT = CSS_USABLE_HEIGHT - SAFETY_BUFFER_PX; // 996px (matches CSS --usable-h)

// ── Per-element height constants (must match real-pagination.css) ──────────────
const TABLE_ROW_H    = 36;   // td: 6px*2 padding + 24px line = 36px ✓
const TABLE_MARGIN   = 22;   // table margin: 0.75em × 2 ≈ 22px ✓
const IMAGE_H        = 300;  // Modern default for AI generated figures
const IMAGE_MARGIN   = 24;   
const HR_H           = 24;   
const CODE_LINE_H    = 20;   
const CODE_PAD       = 30;   
const CODE_MARGIN    = 22;   
const BLOCKQUOTE_PAD = 8;    
// Heading extra px over one body LINE_H (larger font + top+bottom margin).
// Calibrated against the actual CSS heading rules in real-pagination.css.
// ✅ RECALIBRATED: Based on actual CSS rendering with em-based margins
// 
// CSS Calculations (base font: 14.667px):
// h1: font-size=2em(29.3px), line-height=1.3(38.1px), margin=1.5em+0.75em=2.25em(66px)
//     → Total for 1 line: 38.1px + 66px = 104.1px
//     → HEADING_EXTRA = 104.1 - 20(LINE_H) = 84px
//
// h2: font-size=1.5em(22px), line-height=1.3(28.6px), margin=1.25em+0.5em=1.75em(38.5px)
//     → Total for 1 line: 28.6px + 38.5px = 67.1px
//     → HEADING_EXTRA = 67.1 - 20 = 47px
//
// h3: font-size=1.25em(18.3px), line-height=1.4(25.7px), margin=1em+0.5em=1.5em(22px)
//     → Total for 1 line: 25.7px + 22px = 47.7px
//     → HEADING_EXTRA = 47.7 - 20 = 28px
//
// h4-h6: font-size=1em(14.7px), line-height=1.4(20.5px), margin=0.75em+0.4em=1.15em(16.9px)
//     → Total for 1 line: 20.5px + 16.9px = 37.4px
//     → HEADING_EXTRA = 37.4 - 20 = 17px
//
// ✅ FINAL VALUES: Increased slightly to account for edge cases and multi-line headings
const HEADING_EXTRA  = [0, 86, 49, 30, 19, 19, 19]; // index = heading level (recalibrated for CSS accuracy)

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
      // ✅ CRITICAL FIX: Use actual image height from attributes, not fallback
      // Images are inserted with explicit height (default 300px)
      const attrs = node.attrs || {};
      const explicitHeight = attrs.height || 0;
      
      // If image has explicit height attribute, use it (capped at 85% of page)
      // Otherwise use fallback
      const ih = explicitHeight > 0
        ? Math.min(explicitHeight, USABLE_HEIGHT * 0.85)
        : IMAGE_H;
      
      // Add margin for spacing
      h = ih + IMAGE_MARGIN;
      
      // Log for debugging
      if (explicitHeight > 0) {
        console.log(`[estimateHeight] Image with explicit height: ${explicitHeight}px -> estimated ${h}px (including margin)`);
      }
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
      let maxCellLines = 1;
      
      node.forEach(row => {
        rows++;
        // Check cells for multi-line content
        row.forEach(cell => {
          if (cell.content) {
            cell.forEach(cellContent => {
              if (cellContent.textContent) {
                const textLen = cellContent.textContent.length;
                const lines = Math.ceil(textLen / 60);
                maxCellLines = Math.max(maxCellLines, lines);
              }
            });
          }
        });
      });
      
      // Adjust row height if cells have multiple lines
      const effectiveRowH = maxCellLines > 1 
        ? TABLE_ROW_H + (maxCellLines - 1) * LINE_H 
        : TABLE_ROW_H;
      
      h = rows * effectiveRowH + TABLE_MARGIN;
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

// ── Split oversized nodes into real independent nodes ─────────────────────
// Paragraphs are split by lines, Tables are split by rows.
// Images/CodeBlocks are currently kept atomic.
const splitOversizedNode = (node, schema) => {
  const h = estimateHeight(node);
  if (h <= USABLE_HEIGHT) return [node];

  // HANDLE TABLES: Split by rows to fit within USABLE_HEIGHT
  if (node.type.name === 'table') {
    console.log(`[splitOversizedNode] Splitting oversized table (${h}px, est. ${Math.ceil(h / TABLE_ROW_H)} rows)`);
    const rows = [];
    node.forEach(row => rows.push(row));

    const result = [];
    let curRows = [];
    let curH = 0;

    // Calculate max rows that can fit on a page
    // USABLE_HEIGHT - TABLE_MARGIN (for table top/bottom margin)
    const maxTableContentHeight = USABLE_HEIGHT - TABLE_MARGIN;
    const maxRowsPerFragment = Math.floor(maxTableContentHeight / TABLE_ROW_H);
    
    console.log(`[splitOversizedNode] Table splitting: max ${maxRowsPerFragment} rows per fragment`);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Estimate actual row height based on cell content
      let rowH = TABLE_ROW_H; // Base height
      let maxCellLines = 1;
      
      // Check each cell in the row for multi-line content
      row.forEach(cell => {
        if (cell.content) {
          cell.forEach(cellContent => {
            if (cellContent.textContent) {
              const textLen = cellContent.textContent.length;
              // Estimate lines in cell (assuming ~60 chars per line in table cells)
              const lines = Math.ceil(textLen / 60);
              maxCellLines = Math.max(maxCellLines, lines);
            }
          });
        }
      });
      
      // If cell has multiple lines, adjust row height
      if (maxCellLines > 1) {
        rowH = TABLE_ROW_H + (maxCellLines - 1) * LINE_H;
      }
      
      // If adding this row would exceed the limit, push current chunk and start new one
      if (curRows.length > 0 && (curH + rowH) > maxTableContentHeight) {
        // Push current fragment
        result.push(schema.nodes.table.create(node.attrs, Fragment.fromArray([...curRows])));
        console.log(`[splitOversizedNode] Created table fragment with ${curRows.length} rows (${curH}px)`);
        
        // Start new fragment with current row
        curRows = [row];
        curH = rowH;
      } else {
        curRows.push(row);
        curH += rowH;
      }
    }
    
    // Push remaining rows
    if (curRows.length > 0) {
      result.push(schema.nodes.table.create(node.attrs, Fragment.fromArray([...curRows])));
      console.log(`[splitOversizedNode] Created final table fragment with ${curRows.length} rows (${curH}px)`);
    }
    
    console.log(`[splitOversizedNode] Table split into ${result.length} fragments`);
    return result;
  }

  // HANDLE PARAGRAPHS: Split by text lines
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

  // ── RUNTIME VALIDATION: Check if CSS and JS usable heights match ──────────
  // This helps debug paste scenarios where content might overflow
  if (options.force && typeof window !== 'undefined' && !window.__paginationValidated) {
    requestAnimationFrame(() => {
      const pageContent = document.querySelector('.page-content');
      if (pageContent) {
        const computedHeight = parseInt(getComputedStyle(pageContent).height);
        const cssUsableH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--usable-h'));
        
        console.log(`[paginateDocument] Usable Height Validation:`, {
          js_USABLE_HEIGHT: USABLE_HEIGHT,
          css_computed_height: computedHeight,
          css_variable_usable_h: cssUsableH,
          matches: computedHeight === USABLE_HEIGHT || cssUsableH === USABLE_HEIGHT ? '✅ YES' : '❌ NO - MISMATCH!'
        });
        
        if (computedHeight !== USABLE_HEIGHT && cssUsableH !== USABLE_HEIGHT) {
          console.warn(`[paginateDocument] ⚠️ USABLE_HEIGHT mismatch detected!`,
            `JS expects ${USABLE_HEIGHT}px, but CSS renders ${computedHeight}px (computed) or ${cssUsableH}px (CSS variable)`);
        }
      }
      window.__paginationValidated = true;
    });
  }

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

      // ── TABLE FRAGMENT HANDLING: Ensure tables don't overflow pages ──
      // If this is a table and it won't fit in remaining space, start new page
      if (b.node.type.name === 'table' && cur.length > 0) {
        const remainingSpace = USABLE_HEIGHT - curH + PARA_MARGIN;
        if (b.height > remainingSpace) {
          // Table won't fit, push current page and start new one
          pages.push(cur.map(u => u.node));
          cur = []; curH = 0;
        }
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
      } catch (selectionErr) {
        // If selection creation fails (e.g. position in non-selectable node like page),
        // use a fallback selection at the nearest valid position
        console.debug('[paginateDocument] Selection at invalid position, using fallback');
        try {
          // Try to find nearest valid text position
          const resolved = tr.doc.resolve(clamp(newFrom));
          if (resolved.parent.type.spec.content && resolved.parent.type.spec.content.includes('text')) {
            tr.setSelection(TextSelection.create(tr.doc, clamp(newFrom)));
          } else {
            // If still invalid, leave selection unset - ProseMirror will handle it
            console.debug('[paginateDocument] Using default selection placement');
          }
        } catch (_) {
          // Final fallback: leave selection as-is
        }
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