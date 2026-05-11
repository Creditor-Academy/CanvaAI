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
import { TextSelection } from '@tiptap/pm/state';
import {
  A4_HEIGHT_PX as PAGE_HEIGHT,
  PAGE_MARGIN_TOP_PX as MARGIN_TOP,
  PAGE_MARGIN_BOTTOM_PX as MARGIN_BOTTOM,
  LINE_HEIGHT_PX as LINE_H,
  CHARS_PER_LINE,
  SAFETY_BUFFER_PX,
  USABLE_HEIGHT_PX as USABLE_HEIGHT,
  USABLE_WIDTH_PX as USABLE_WIDTH,
} from '../../../utils/pagination/constants';

export const PARA_MARGIN_PX = 8;

// ── Per-element height constants (must match real-pagination.css) ──────────────
const TABLE_ROW_H = 31;   // td: 6px*2 padding + 19px line = 31px (matches CSS)
const TABLE_MARGIN = 22;   // table margin: 0.75em × 2 ≈ 22px ✓
// IMAGE_H: conservative fallback used only when width+height attrs are absent.
// 200px is a safer default than 300px — avoids overestimating and wasting page space.
// Once the image loads, forceRepaginate fires and corrects this.
const IMAGE_H = 200;
const IMAGE_MARGIN = 24;
// CUSTOM_TABLE: atom node — no children to measure. Per-row heuristic.
// Default 3 rows × TABLE_ROW_H + TABLE_MARGIN
const CUSTOM_TABLE_DEFAULT_ROWS = 3;
const HR_H = 24;
const CODE_LINE_H = 20;
const CODE_PAD = 30;
const CODE_MARGIN = 22;
const BLOCKQUOTE_PAD = 8;
// Heading extra px over one body LINE_H (larger font + top+bottom margin).
// Calibrated against the actual CSS heading rules in real-pagination.css.
// ✅ CRITICAL SYNC: These values MUST match src/styles/editor/04b-editor-content.css
// The modern editor uses tight 1rem total margins for headings.
const getHeadingExtra = (level, baseFontSize) => {
  const rootFS = baseFontSize || 14.667;
  const ratio = rootFS / 14.667;
  switch (level) {
    case 1: return 86 * ratio; // 104px total
    case 2: return 49 * ratio; // 67px total
    case 3: return 30 * ratio; // 48px total
    default: return 19 * ratio; // 37px total
  }
};

const MAX_PAGES = 200;

// ── Singleton flags (window so HMR reloads share state) ──────────────────────
const getFlag = (k) => window[`__athena_${k}`] ?? false;
const setFlag = (k, v) => { window[`__athena_${k}`] = v; };

// ── Height cache (Now versioned to prevent stale measurements after zoom/width changes) ─────
let _heightCache = new WeakMap();
let _currentCacheVersion = '';

const getCacheKey = (editor) => {
  const zoom = editor.storage?.athena_zoom || 100;
  const width = USABLE_WIDTH; // Simplified for now, or use measured width if available
  return `${zoom}_${width}`;
};

/**
 * Force clear the height cache. Call this on font-size or typography changes.
 */
export const invalidatePaginationCache = () => {
  _heightCache = new WeakMap();
  _currentCacheVersion = '';
  console.log('[paginationEngine] Layout cache invalidated');
};

const getMaxFontSize = (node) => {
  let maxFS = 14.667; // Default base font size (11pt = 14.667px)

  if (node.isText) {
    const fsMark = node.marks?.find(m => m.type.name === 'textStyle' && m.attrs.fontSize);
    if (fsMark) {
      const fsAttr = fsMark.attrs.fontSize;
      let s = parseFloat(fsAttr);
      if (!isNaN(s)) {
        // ── UNIT CONVERSION (Fixes 11pt vs 11px drift) ──
        // If the size is explicitly in 'pt' (Google Docs style), convert to px.
        // 1pt = 1.333px (96dpi / 72pt per inch)
        if (typeof fsAttr === 'string' && fsAttr.toLowerCase().endsWith('pt')) {
          s = s * (96 / 72);
        }
        maxFS = s;
      }
    }
  } else if (node.content) {
    node.content.forEach(child => {
      const fs = getMaxFontSize(child);
      if (fs > maxFS) maxFS = fs;
    });
  }
  return maxFS;
};

/**
 * Gets line height and characters per line based on font size.
 * Body text uses fixed 22px (14.667px × 1.5).
 * Large text scales proportionally via 1.5× multiplier.
 * List items use 1.6× line-height (CSS .page li { line-height: 1.6 } wins cascade).
 */
const getBlockMetrics = (fontSize, width = USABLE_WIDTH, isListChild = false) => {
  // CSS: .page li { line-height: 1.6 } (second rule wins over the 1.36 rule)
  const lhMultiplier = isListChild ? 1.6 : 1.3; // Synced with CSS --lh: 1.3
  if (fontSize <= 15) {
    return {
      lh: Math.ceil(LINE_H * (isListChild ? 1.6 / 1.3 : 1)), // Normalize list-items relative to base LINE_H
      cpl: CHARS_PER_LINE
    };
  }
  const lh = Math.ceil(fontSize * lhMultiplier);
  const cpl = Math.max(8, Math.floor(width / (fontSize * 0.432)));
  return { lh, cpl };
};

export const estimateHeight = (node, isListChild = false, width = USABLE_WIDTH) => {
  // Don't serve cached heights for list children — their effective width differs
  // from top-level blocks and the cache key doesn't encode that distinction.
  if (!isListChild && _heightCache.has(node)) return _heightCache.get(node);

  let h;
  switch (node.type.name) {
    case 'horizontalRule':
      h = HR_H;
      break;

    // ── customTable: atom node with no PM children — measure via attrs or DOM ──
    // TableExtension.js creates this as atom:true so node.forEach() yields nothing.
    // Rows are stored in node.attrs.rows (default 3).
    case 'customTable': {
      const rows = node.attrs?.rows ?? CUSTOM_TABLE_DEFAULT_ROWS;
      // Replicate the same heuristic as the standard table case:
      // each row = TABLE_ROW_H, plus TABLE_MARGIN for the wrapper.
      h = rows * TABLE_ROW_H + TABLE_MARGIN;
      break;
    }

    case 'page': {
      let totalH = 0;
      node.forEach(child => {
        totalH += estimateHeight(child, false, width);
      });
      h = totalH;
      break;
    }

    case 'image':
    case 'resizableImage': {
      const attrs = node.attrs || {};
      const explicitHeight = attrs.height || 0;
      const explicitWidth = attrs.width || 0;

      let ih;
      if (explicitHeight > 0 && explicitWidth > 0) {
        // Calculate stable height based on aspect ratio and usable width
        const ratio = explicitHeight / explicitWidth;
        const effectiveWidth = Math.min(explicitWidth, USABLE_WIDTH);
        ih = Math.min(effectiveWidth * ratio, USABLE_HEIGHT * 0.9);
      } else if (explicitHeight > 0) {
        ih = Math.min(explicitHeight, USABLE_HEIGHT * 0.9);
      } else {
        // No dimensions known yet — use conservative fallback.
        // The caller (EditorToolbar / ResizableImage) MUST call forceRepaginate()
        // inside the image's onLoad handler so the real height is applied.
        ih = IMAGE_H;
      }

      h = ih + IMAGE_MARGIN;
      break;
    }

    case 'heading': {
      const lvl = Math.min(node.attrs?.level ?? 1, 6);
      const maxFS = getMaxFontSize(node);
      const { lh, cpl } = getBlockMetrics(maxFS);

      const len = node.textContent.length || 1;
      const lines = Math.max(1, Math.ceil(len / cpl));
      // ✅ ADDED: 1.05 expansion buffer to account for word-wrap and kerning variance
      h = (lines * lh + getHeadingExtra(lvl, maxFS)) * 1.05;
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
      // Per-row height: measure each row independently to avoid a single long cell
      // inflating every other row's height estimate.
      let totalTableH = TABLE_MARGIN;

      node.forEach(row => {
        let rowMaxLines = 1;
        let rowMaxLH = LINE_H;

        row.forEach(cell => {
          if (!cell.content) return;
          const cellFS = getMaxFontSize(cell);
          const { lh: cellLH } = getBlockMetrics(cellFS);
          rowMaxLH = Math.max(rowMaxLH, cellLH);

          cell.forEach(cellContent => {
            if (!cellContent.textContent) return;
            const textLen = cellContent.textContent.length;
            const cellCPL = Math.max(10, Math.floor(60 * (14.667 / cellFS)));
            const lines = Math.ceil(textLen / cellCPL);
            rowMaxLines = Math.max(rowMaxLines, lines);
          });
        });

        const rowH = rowMaxLines > 1
          ? TABLE_ROW_H + (rowMaxLines - 1) * rowMaxLH
          : Math.max(TABLE_ROW_H, rowMaxLH + 12);

        totalTableH += rowH;
      });

      h = totalTableH;
      break;
    }

    case 'bulletList':
    case 'orderedList':
    case 'taskList': {
      h = 0;
      node.forEach(item => {
        // CSS: li { margin-bottom: 0.25em } = 0.25 * 14.667 = 3.67px → 4px
        // No top padding on li (the second CSS rule wins the cascade — it has no padding)
        let itemH = 4; // margin-bottom only, matching splitOversizedNode and CSS
        item.forEach(child => {
          itemH += estimateHeight(child, true, width);
        });
        h += itemH;
      });
      h += PARA_MARGIN_PX;
      break;
    }

    default: { // paragraph + unknown block types
      if (!node.textContent) {
        h = LINE_H + PARA_MARGIN_PX;
        break;
      }

      // CSS: .page ul, .page ol { padding-left: 2em } (second rule wins cascade)
      // 2em = 2 * 14.667 = 29.3px indent for list children
      const maxWidth = isListChild ? (width - 29) : width;

      // ── GRANULAR LINE-BY-LINE ESTIMATION ──
      const items = [];
      node.forEach(child => {
        if (child.type.name === 'hardBreak') {
          items.push({ type: 'break' });
        } else {
          const fs = getMaxFontSize(child);
          // Pass isListChild so lh uses 1.6× multiplier for list item text
          const metrics = getBlockMetrics(fs, maxWidth, isListChild);
          items.push({ type: 'text', len: child.textContent.length, ...metrics });
        }
      });

      let totalParaH = 0;
      let currentLineSpace = maxWidth;
      let currentLineMaxLH = 0;

      items.forEach(item => {
        if (item.type === 'break') {
          // Hard break forces the current line to end and a new line to start
          totalParaH += Math.max(currentLineMaxLH, LINE_H);
          currentLineSpace = maxWidth;
          currentLineMaxLH = 0;
          return;
        }

        let remainingLen = item.len;
        while (remainingLen > 0) {
          const charWidth = maxWidth / item.cpl;
          const canFit = Math.floor(currentLineSpace / charWidth);

          if (canFit >= remainingLen) {
            currentLineMaxLH = Math.max(currentLineMaxLH, item.lh);
            currentLineSpace -= remainingLen * charWidth;
            remainingLen = 0;
          } else {
            currentLineMaxLH = Math.max(currentLineMaxLH, item.lh);
            totalParaH += currentLineMaxLH;
            remainingLen -= Math.max(1, canFit);
            currentLineMaxLH = item.lh;
            currentLineSpace = maxWidth;
          }
        }
      });
      totalParaH += currentLineMaxLH;

      // ── LARGE-FONT EXPANSION BUFFER ──
      // For paragraphs with font sizes above body size, the char-width model
      // tends to slightly undercount wrapped lines due to kerning and font metrics.
      // Apply a 1.08 expansion factor when max font > 16px to avoid underestimation.
      const maxFontInPara = items.reduce((m, it) => it.lh ? Math.max(m, it.lh) : m, LINE_H);
      const expansionFactor = maxFontInPara > Math.ceil(16 * 1.3) ? 1.08 : 1.0;

      h = (totalParaH + (isListChild ? 0 : PARA_MARGIN_PX)) * expansionFactor;
      break;
    }

  }

  // Only cache top-level measurements; list-child measurements use a narrower
  // width (650px vs 698px) and must not pollute the top-level cache entry.
  if (!isListChild) _heightCache.set(node, h);
  return h;
};

// ── Flatten page wrappers → flat block list ───────────────────────────────────
const flattenBlocks = (node) => {
  const out = [];
  node.forEach(child => {
    if (child.type.name === 'page') {
      out.push(...flattenBlocks(child));
    } else {
      out.push(child);
    }
  });
  return out;
};

// ── Split oversized nodes into real independent nodes ─────────────────────
// targetHeight should be USABLE_HEIGHT - PARA_MARGIN for full pages, or 
// remaining height for partial pages.
const splitOversizedNode = (node, schema, targetHeight = (USABLE_HEIGHT - PARA_MARGIN_PX), width = USABLE_WIDTH) => {
  if (!node) return [];

  // 1. HANDLE LISTS
  if (['bulletList', 'orderedList', 'taskList'].includes(node.type.name)) {
    const items = [];
    node.forEach(item => items.push(item));

    // If it's a single massive list item, we must split the paragraph inside it
    if (items.length <= 1) {
      const item = items[0];
      if (item && item.childCount === 1 && item.firstChild.type.name === 'paragraph') {
        const paraFragments = splitOversizedNode(item.firstChild, schema, targetHeight - 4, width);
        if (paraFragments.length > 1) {
          return paraFragments.map((pf) => {
            const newListItem = schema.nodes.listItem.create(item.attrs, Fragment.from(pf));
            return node.type.create(node.attrs, Fragment.from(newListItem));
          });
        }
      }
      return [node];
    }

    const result = [];
    let curItems = [];
    let curH = 0;
    let currentLimit = targetHeight;

    for (const item of items) {
      // Pass isListChild = true
      let itemH = 4; // margin-bottom
      item.forEach(child => { itemH += estimateHeight(child, true); });

      // If adding this item exceeds the limit, wrap the current items and start a new list
      if (curItems.length > 0 && curH + itemH > currentLimit) {
        result.push(node.type.create(node.attrs, Fragment.fromArray([...curItems])));
        curItems = [item];
        curH = itemH;
        currentLimit = USABLE_HEIGHT - PARA_MARGIN_PX; // Subsequent pages get full height
      } else {
        curItems.push(item);
        curH += itemH;
      }
    }

    if (curItems.length > 0) {
      result.push(node.type.create(node.attrs, Fragment.fromArray([...curItems])));
    }
    return result;
  }

  // HANDLE TABLES: Split by rows
  if (node.type.name === 'table') {
    const rows = [];
    node.forEach(row => rows.push(row));
    if (rows.length <= 1) return [node];

    const result = [];
    let curRows = [];
    let curH = 0;
    let currentLimit = targetHeight;

    for (const row of rows) {
      // Per-row height: mirrors estimateHeight case 'table' logic exactly
      let rowMaxLines = 1;
      let rowMaxLH = LINE_H;
      row.forEach(cell => {
        cell.forEach(p => {
          if (!p.textContent) return;
          const cellFS = getMaxFontSize(cell);
          const { lh: cellLH } = getBlockMetrics(cellFS);
          rowMaxLH = Math.max(rowMaxLH, cellLH);
          const cellCPL = Math.max(10, Math.floor(60 * (14.667 / cellFS)));
          const lines = Math.ceil(p.textContent.length / cellCPL);
          rowMaxLines = Math.max(rowMaxLines, lines);
        });
      });
      const rowH = rowMaxLines > 1
        ? TABLE_ROW_H + (rowMaxLines - 1) * rowMaxLH
        : Math.max(TABLE_ROW_H, rowMaxLH + 12);

      if (curRows.length > 0 && curH + rowH > currentLimit) {
        result.push(schema.nodes.table.create(node.attrs, Fragment.fromArray([...curRows])));
        curRows = [row];
        curH = rowH;
        currentLimit = USABLE_HEIGHT - PARA_MARGIN_PX; // following fragments use full page
      } else {
        curRows.push(row);
        curH += rowH;
      }
    }

    if (curRows.length > 0) {
      result.push(schema.nodes.table.create(node.attrs, Fragment.fromArray([...curRows])));
    }
    return result;
  }

  // HANDLE PARAGRAPHS: Split by text lines
  if (node.type.name !== 'paragraph') return [node];

  const chars = [];
  node.forEach(inline => {
    if (inline.isText) {
      const fs = getMaxFontSize(inline);
      const { lh, cpl } = getBlockMetrics(fs, width); // use passed width, not USABLE_WIDTH
      for (const ch of inline.text) {
        chars.push({ ch, marks: inline.marks, lh, cpl });
      }
    }
  });

  if (chars.length === 0) return [node];

  const result = [];
  let remainingChars = [...chars];
  let currentLimit = targetHeight;

  while (remainingChars.length > 0) {
    const splitIdx = findSplitPoint(remainingChars, currentLimit, width); // pass width
    const actualSplit = splitIdx === 0 ? 1 : splitIdx;

    const chunk = remainingChars.slice(0, actualSplit);
    remainingChars = remainingChars.slice(actualSplit);

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

    // After first split, subsequent splits use full page height
    currentLimit = USABLE_HEIGHT - PARA_MARGIN_PX;
  }

  return result;
};

/**
 * DETERMINISTIC SUB-LAYOUT SIMULATION
 * Simulates how a subset of text characters would wrap and how much height they would occupy.
 * This is the 'Measurement Engine' core that drives pagination decisions.
 * @param {Array} chars - character array with {lh, cpl} per char
 * @param {number} lineWidth - usable line width in px (varies for list children)
 */
const simulateSubLayout = (chars, lineWidth = USABLE_WIDTH) => {
  if (chars.length === 0) return { height: 0, lastLineWidth: 0 };

  let totalH = 0;
  let currentLineSpace = lineWidth;
  let currentLineMaxLH = 0;

  for (const char of chars) {
    // charWidth derived from cpl which was calculated against lineWidth
    const charWidth = lineWidth / char.cpl;
    if (currentLineSpace < charWidth + 2) { // 2px browser rounding tolerance
      totalH += currentLineMaxLH;
      currentLineSpace = lineWidth;
      currentLineMaxLH = 0;
    }
    currentLineSpace -= charWidth;
    currentLineMaxLH = Math.max(currentLineMaxLH, char.lh);
  }

  return { height: totalH + currentLineMaxLH, lastLineWidth: lineWidth - currentLineSpace };
};

/**
 * BINARY SEARCH SPLITTING
 * Finds the optimal character index to split a paragraph so it fits within availableHeight.
 * Significantly faster than linear iteration for production-scale documents.
 * @param {Array} chars
 * @param {number} availableHeight
 * @param {number} lineWidth - usable line width (narrower inside lists)
 */
const findSplitPoint = (chars, availableHeight, lineWidth = USABLE_WIDTH) => {
  let low = 0;
  let high = chars.length;
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (simulateSubLayout(chars.slice(0, mid), lineWidth).height <= availableHeight) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return best;
};

const marksEqual = (a, b) => {
  if (a.length !== b.length) return false;
  return a.every((m, i) =>
    m.type.name === b[i].type.name &&
    JSON.stringify(m.attrs) === JSON.stringify(b[i].attrs)
  );
};

// ── Widow / Orphan Control ─────────────────────────────────────────────────────
// Minimum lines that must remain on a page after a paragraph split.
// Prevents single-line fragments at the top or bottom of a page.
const WIDOW_ORPHAN_MIN_LINES = 2;

// ── DOM Height Measurement (PRIMARY — replaces heuristics when DOM is available) ─
/**
 * Measures the actual rendered height of a block via getBoundingClientRect().
 * This is the correct production approach: it accounts for fonts, kerning,
 * ligatures, zoom, and DPI instead of approximating via character counts.
 *
 * Returns null if the node is not yet in the live DOM (unmounted, virtualised),
 * or if the DOM content doesn't match the PM node (stale after paste).
 * Falls back to estimateHeight() in that case.
 */
const measureDOMHeight = (editor, pmPos, pmNode) => {
  try {
    if (!editor?.view) return null;

    // Resolve the actual DOM element for this position.
    // ProseMirror's nodeDOM() sometimes returns wrappers or virtual nodes.
    // we use domAtPos to get the container and then find the nearest block.
    const { node: parentDOM } = editor.view.domAtPos(pmPos);
    let domEl = editor.view.nodeDOM(pmPos);

    // Fallback: If nodeDOM fails, try to find the actual element from parent
    if (!domEl || !(domEl instanceof HTMLElement)) {
      domEl = parentDOM instanceof HTMLElement ? parentDOM : parentDOM.parentElement;
    }

    if (!domEl || !(domEl instanceof HTMLElement)) return null;

    // Safety check: ensure we aren't measuring the whole page content area or page wrapper
    if (domEl.classList.contains('page-content') || domEl.classList.contains('page')) return null;

    // ── STALE DOM GUARD (BUG-F fix) ──────────────────────────────────────────
    // After paste, TipTap may not have flushed its DOM update yet.
    // If the PM node has text content but the DOM element shows different text,
    // the measurement is stale. Return null to fall back to estimateHeight.
    if (pmNode && pmNode.textContent && domEl.textContent !== undefined) {
      const pmText = pmNode.textContent.trim().slice(0, 50);
      const domText = domEl.textContent.trim().slice(0, 50);
      if (pmText.length > 10 && domText !== pmText) return null;
    }

    const rect = domEl.getBoundingClientRect();
    if (rect.height <= 0) return null;

    // ✅ CRITICAL FIX: Account for vertical margins which are excluded from getBoundingClientRect
    // This resolves the 14-15 line overflow issue by accurately measuring paragraph/heading spacing.
    const style = window.getComputedStyle(domEl);
    const margins = (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);

    const zoom = editor.storage?.athena_zoom || 100;
    return (rect.height + margins) / (zoom / 100);
  } catch (_) {
    return null;
  }
};

// ── DOM Range Paragraph Splitting (HIGH-FIDELITY) ─────────────────────────────
/**
 * Uses the browser's Range API to find the exact character offset where a
 * paragraph would exceed `availableH` pixels, then returns two PM paragraph
 * nodes: the part that fits and the remainder.
 *
 * This handles mixed fonts, bold/italic, ligatures, and kerning automatically
 * because the browser has already laid out the text.
 *
 * Returns null if DOM is unavailable or the split cannot be determined.
 */
const splitByDOMRange = (editor, pmNode, pmPos, availableH, schema) => {
  try {
    if (!editor?.view) return null;
    const domEl = editor.view.nodeDOM(pmPos);
    if (!domEl || !(domEl instanceof HTMLElement)) return null;

    // Collect all text leaves from the PM node into a flat char array
    const inlineChars = [];
    pmNode.forEach(inline => {
      if (inline.isText) {
        for (const ch of inline.text) {
          inlineChars.push({ ch, marks: inline.marks });
        }
      }
    });
    if (inlineChars.length < WIDOW_ORPHAN_MIN_LINES) return null;

    // Build flat list of DOM text nodes inside this element
    const textNodes = [];
    const walker = document.createTreeWalker(domEl, NodeFilter.SHOW_TEXT);
    let tn;
    while ((tn = walker.nextNode())) textNodes.push(tn);
    if (textNodes.length === 0) return null;

    // Flat list of (textNode, charOffset) for binary search
    const domChars = [];
    for (const tNode of textNodes) {
      for (let i = 0; i < tNode.textContent.length; i++) {
        domChars.push({ node: tNode, offset: i });
      }
    }

    const zoom = editor.storage?.athena_zoom || 100;
    const domRect = domEl.getBoundingClientRect();
    const splitY = domRect.top + (availableH * (zoom / 100));
    const range = document.createRange();

    // Binary search: find largest prefix whose bottom is ≤ splitY
    // Binary search: find largest prefix whose bottom is ≤ splitY
    let lo = 1, hi = domChars.length, best = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const { node: dn, offset: di } = domChars[mid - 1];

      // ✅ FIDELITY FIX: Construct range starting at the first text node, not the element container
      const firstChar = domChars[0];
      range.setStart(firstChar.node, firstChar.offset);
      range.setEnd(dn, di + 1);

      const r = range.getBoundingClientRect();
      if (r.bottom <= splitY) { best = mid; lo = mid + 1; }
      else { hi = mid - 1; }
    }

    // Enforce widow/orphan: ensure both fragments have meaningful content
    const minChars = WIDOW_ORPHAN_MIN_LINES * Math.max(8, Math.floor(USABLE_WIDTH / 80));
    if (best < minChars || best > inlineChars.length - minChars) return null;

    const buildRuns = (chars) => {
      const runs = []; let i = 0;
      while (i < chars.length) {
        const { marks } = chars[i];
        let j = i + 1;
        while (j < chars.length && marksEqual(chars[j].marks, marks)) j++;
        runs.push(schema.text(chars.slice(i, j).map(c => c.ch).join(''), marks));
        i = j;
      }
      return runs;
    };

    return [
      schema.nodes.paragraph.create(pmNode.attrs, Fragment.fromArray(buildRuns(inlineChars.slice(0, best)))),
      schema.nodes.paragraph.create(pmNode.attrs, Fragment.fromArray(buildRuns(inlineChars.slice(best)))),
    ];
  } catch (e) {
    // DOM Range can fail if layout isn't stable yet — safe to swallow
    return null;
  }
};


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
        const blockEnd = blockStart + block.content.size;
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
export const paginateDocument = async (editor, options = {}) => {
  if (options.force) {
    invalidatePaginationCache();

    // 🔥 CRITICAL: Wait for fonts to be ready before measuring
    // This ensures font-size/family changes have stabilized in the DOM
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.ready;
    }
  }

  // ── RUNTIME VALIDATION: Check if CSS and JS usable heights match ──────────
  // This helps debug paste scenarios where content might overflow
  if (options.force && typeof window !== 'undefined' && !window.__paginationValidated) {
    requestAnimationFrame(() => {
      const pageContent = document.querySelector('.page-content');
      if (pageContent) {
        const contentHeight = pageContent.scrollHeight;
        const pageHeight = 1123; // Standard A4
        const maxHeight = USABLE_HEIGHT;   // Use the calibrated constant directly

        // If content exceeds usable height, trigger IMMEDIATE pagination
        if (contentHeight > maxHeight) {
          paginateDocument(editor, { force: true });
        }

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
  if (getFlag('isPaginating')) return false;
  if (!editor || editor.isDestroyed) return false;
  if (editor.storage?.athena_is_paginating) return false;

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
      const lastSize = editor.storage._lastDocSize ?? 0;
      const delta = Math.abs(currentSize - lastSize);

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

    // ── DYNAMIC USABLE HEIGHT MEASUREMENT ──
    // We read the CSS-constrained height of .page-content, NOT getBoundingClientRect
    // which returns the expanded content height (overflow:visible makes it grow).
    // The correct approach is clientHeight (content box height declared by CSS padding
    // model), or parsing the computed height style directly.
    let dynamicUsableHeight = USABLE_HEIGHT;
    const zoom = editor.storage?.athena_zoom || 100;
    const zoomFactor = zoom / 100;

    if (typeof document !== 'undefined') {
      const samplePage = document.querySelector('.page-content');
      if (samplePage) {
        // clientHeight = padded content area height (matches what the CSS padding model
        // declares via padding-top + padding-bottom + inner height).
        // This is stable regardless of how much content is inside.
        const cssHeight = samplePage.clientHeight;
        if (cssHeight > 100) {
          dynamicUsableHeight = cssHeight / zoomFactor;
          console.debug('[paginateDocument] Calibrated usable height (clientHeight):', dynamicUsableHeight);
        }
      }
    }

    // Use clientWidth for the usable width — also unaffected by content overflow
    const effectiveWidth = (() => {
      if (typeof document === 'undefined') return USABLE_WIDTH;
      const samplePage = document.querySelector('.page-content');
      if (!samplePage) return USABLE_WIDTH;
      const cw = samplePage.clientWidth;
      // clientWidth includes horizontal padding — subtract left+right padding to get content width
      const style = window.getComputedStyle(samplePage);
      const pl = parseFloat(style.paddingLeft) || 0;
      const pr = parseFloat(style.paddingRight) || 0;
      const contentW = (cw - pl - pr) / zoomFactor;
      return contentW > 100 ? contentW : USABLE_WIDTH;
    })();

    const currentKey = getCacheKey(editor);
    if (_currentCacheVersion !== currentKey) {
      _heightCache = new WeakMap();
      _currentCacheVersion = currentKey;
      console.debug('[paginateDocument] Metrics change detected. Cache reset:', currentKey);
    }

    // ── DYNAMIC BOTTOM CALIBRATION ──
    // The effective usable height must guarantee that NO content ever hides
    // behind the bottom margin. We reserve:
    //   • LINE_H (19px) — one full body line as a hard safety margin.
    //     This is the primary fix for "last few lines hidden behind bottom margin".
    //     Even if CSS clips at exactly dynamicUsableHeight, subpixel rendering and
    //     font metrics cause the last line to occasionally overlap the bottom padding.
    //   • 2px — subpixel rounding tolerance on top of that.
    // Together: 21px safety floor ≈ one body line. This corrects the edge cases for:
    //   a) Arial 11pt (default): last line sits 2px above bottom margin
    //   b) Large font (18-24pt): bottom of last line is fully clear of margin
    //   c) Images: bottom edge never bleeds into margin
    //   d) Tables: last row is fully visible
    const dynamicBuffer = LINE_H + 2; // one full line + subpixel tolerance
    const effectiveUsableHeight = dynamicUsableHeight - dynamicBuffer;

    const pages = [];
    let cur = [];
    let curH = 0;

    const blockPosMap = new Map();
    {
      let pos = 0;
      doc.forEach(pageNode => {
        pos += 1; // page opening token
        pageNode.forEach(block => {
          blockPosMap.set(block, pos);
          pos += block.nodeSize;
        });
        pos += 1; // page closing token
      });
    }

    let blocksToProcess = [...rawBlocks];
    let safetyCounter = 0;

    while (blocksToProcess.length > 0 && safetyCounter < 5000) {
      safetyCounter++;
      const node = blocksToProcess.shift();

      // ── PRIMARY: DOM height measurement ────────────────────────────────────
      const pmPos = blockPosMap.get(node);
      const domH = pmPos != null ? measureDOMHeight(editor, pmPos, node) : null;
      const h = domH ?? estimateHeight(node, false, effectiveWidth);

      if (pages.length >= MAX_PAGES) break;

      // ── KEEP-WITH-NEXT: Headings must not be orphaned at page bottom ───────
      if (node.type.name === 'heading' && blocksToProcess.length > 0) {
        const nextNode = blocksToProcess[0];
        const nextPmPos = blockPosMap.get(nextNode);
        const nextDomH = nextPmPos != null ? measureDOMHeight(editor, nextPmPos, nextNode) : null;
        const nextH = nextDomH ?? estimateHeight(nextNode, false, effectiveWidth);

        const afterHeadingH = curH + h;
        const afterNextH = afterHeadingH + nextH;

        if (afterHeadingH <= effectiveUsableHeight && afterNextH > effectiveUsableHeight) {
          if (cur.length > 0) {
            pages.push(cur);
            cur = []; curH = 0;
          }
        }
      }

      const newH = curH + h;

      // ✅ BUG-6 FIX: Account for the fact that the last block on a page 
      // has its bottom margin removed in CSS (.page > *:last-child { margin-bottom: 0 }).
      // This allows fitting one more block if only its margin causes the overflow.
      if (newH - PARA_MARGIN_PX <= effectiveUsableHeight) {
        cur.push(node);
        curH = newH;
      } else {
        // Case 2: Block doesn't fit. Attempt partial-fit split.
        const isSplittable =
          node.type.name === 'paragraph'
            ? node.textContent.length > 20
            : ['bulletList', 'orderedList', 'taskList', 'table'].includes(node.type.name);
        // Note: customTable (atom) is NOT splittable — it moves whole to the next page

        if (isSplittable) {
          const availableH = effectiveUsableHeight - curH;

          if (availableH > 44) { // Minimum: 2 lines
            let fragments = null;
            if (node.type.name === 'paragraph' && pmPos != null) {
              fragments = splitByDOMRange(editor, node, pmPos, availableH, schema);
            }

            if (!fragments || fragments.length <= 1) {
              fragments = splitOversizedNode(node, schema, availableH, effectiveWidth);
            }

            if (fragments && fragments.length > 1) {
              const firstH = domH != null ? availableH : estimateHeight(fragments[0]);

              if (firstH <= availableH + 4) { // 4px tolerance
                cur.push(fragments[0]);
                pages.push(cur);
                cur = []; curH = 0;
                blocksToProcess = [...fragments.slice(1), ...blocksToProcess];
                continue;
              }
            }
          }
        }

        if (cur.length > 0) {
          pages.push(cur);
          cur = []; curH = 0;
        }

        if (h > effectiveUsableHeight) {
          const fragments = splitOversizedNode(node, schema, effectiveUsableHeight);
          if (fragments.length <= 1) {
            cur.push(node);
            curH = h;
          } else {
            blocksToProcess = [...fragments, ...blocksToProcess];
          }
        } else {
          cur.push(node);
          curH = h;
        }
      }
    }
    if (cur.length > 0) pages.push(cur);


    // ── EDGE CASE 6: No pages generated ───────────────────────────────────
    if (pages.length === 0) {
      pages.push([schema.nodes.paragraph.create()]);
    }

    // ── No-op check ───────────────────────────────────────────────────────
    if (!options.force && doc.childCount === pages.length) {
      const finalBlocks = pages.flat();
      let same = true, bi = 0;
      doc.forEach(pageNode => {
        if (pageNode.type.name !== 'page') { same = false; return; }
        pageNode.forEach(block => {
          if (bi >= finalBlocks.length || block !== finalBlocks[bi++]) same = false;
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
    const oldFrom = state.selection.from;
    const oldTo = state.selection.to;
    const isCollapsed = state.selection.empty;

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
      const newTo = isCollapsed ? newFrom : computeNewCursorPos(doc, tr.doc, oldTo);
      const clamp = (p) => Math.min(Math.max(1, p), tr.doc.content.size - 1);

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
      const target = pageEls[cursorPageIdx];

      if (target) {
        const cRect = container.getBoundingClientRect();
        const pRect = target.getBoundingClientRect();
        const pageTopInContainer = pRect.top - cRect.top + container.scrollTop;
        const pageBottomInContainer = pRect.bottom - cRect.top + container.scrollTop;
        const viewTop = container.scrollTop;
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

      try { editor.storage.onPaginationComplete?.(); } catch (_) { }
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
let _timer = null;
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
  invalidatePaginationCache(); // properly rebuild the WeakMap on force runs
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      paginateDocument(editor, { force: true });
    });
  });
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
    const els = c.querySelectorAll('.page');
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
    editor.storage.athena_is_paginating = false;
    editor.storage._lastDocSize = 0;
    editor.storage._lastPaginationFingerprint = null;
    editor.storage._paginationRetryCount = 0;
  }
};

// ── Setup paste detection (intentionally empty — owned by usePastePagination) ──
export const setupPasteDetection = (_editor) => { };

// ── Exports ───────────────────────────────────────────────────────────────────
export { flattenBlocks, splitOversizedNode, _heightCache };
export const safePaginate = paginateDocument;
export const debounceSafePaginate = debouncePaginate;
export const scrollToDocumentTop = scrollToTop;
export const scrollToPageNav = scrollToPage;
export const cleanup = cleanupPagination;
export default {
  paginateDocument, debouncePaginate, forceRepaginate,
  safePaginate, debounceSafePaginate,
  cleanupPagination, scrollToTop, scrollToPage, setupPasteDetection,
};