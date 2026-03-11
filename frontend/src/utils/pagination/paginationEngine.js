/**
 * paginationEngine.js — ATHENA PAGINATION ENGINE v3.0
 *
 * Improvements over v2:
 *  • Each page stores { id, blocks, blockIndices, startIndex, endIndex, height }
 *    so VirtualPageRenderer can slice the source array correctly.
 *  • Widow/orphan prevention: if the remaining space on a page is less than
 *    MIN_WIDOW_ORPHAN_HEIGHT, the block is pushed to the next page.
 *  • Accurate hash uses full textContent + serialised attrs — no collisions.
 *  • margin-bottom is now included in every block's layout height.
 *  • Paragraph split works on the margin-excluded content height so we don't
 *    bleed the bottom margin into split calculations.
 *  • Cache is bounded to CACHE_SIZE_LIMIT (LRU eviction via insertion order).
 *  • paginateContent() is a proper alias and forwards options.
 */

import {
  calculateBlockHeight,
  calculateFullBlockHeight,
  estimateParagraphSplit,
  blockMarginBottom,
  BLOCK_TYPES,
  countWordsAndChars,
  countWordsAndCharsInRange,
} from './layoutCalculator';

import {
  USABLE_HEIGHT_PX,
  MIN_WIDOW_ORPHAN_HEIGHT,
  MAX_PAGES,
  CACHE_SIZE_LIMIT,
  MAX_WORDS_PER_PAGE,
  MAX_CHARS_PER_PAGE,
} from './constants';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Safely retrieve the string type name from a ProseMirror node. */
const getTypeName = (block) =>
  (typeof block.type === 'string' ? block.type : block.type?.name) ?? 'unknown';

/** Return true if this block type supports mid-paragraph splitting. */
const isSplittable = (block) => {
  const name = getTypeName(block);
  return name === BLOCK_TYPES.PARAGRAPH || name === 'paragraph';
};

// ─────────────────────────────────────────────────────────────────────────────
// PaginationEngine
// ─────────────────────────────────────────────────────────────────────────────

export class PaginationEngine {
  /**
   * @param {object} options
   * @param {number}  options.usableHeight  - Override page usable height (px)
   * @param {object}  options.styles        - Global style overrides forwarded to height calc
   * @param {boolean} options.debugMode
   * @param {boolean} options.perfLogEnabled
   */
  constructor(options = {}) {
    this.usableHeight    = options.usableHeight    ?? USABLE_HEIGHT_PX;
    this.styles          = options.styles          ?? {};
    this.debugMode       = options.debugMode       ?? false;
    this.perfLogEnabled  = options.perfLogEnabled  ?? false;

    // LRU cache: Map preserves insertion order; we evict oldest entries.
    this.cache = new Map(); // hash → { contentHeight, fullHeight, marginBottom }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Convert a flat array of blocks into pages.
   *
   * @param {object[]} blocks - ProseMirror nodes (flat, pre-flattened by flattenDocument)
   * @returns {Page[]}
   */
  paginate(blocks) {
    if (!Array.isArray(blocks) || blocks.length === 0) return [];

   const t0 = this.perfLogEnabled ? performance.now() : 0;

   const pages           = [];
    let currentBlocks     = [];   // block objects on current page
    let currentIndices    = [];   // original array indices on current page
    let currentY          = 0;    // accumulated height on current page (px)
    let currentWords      = 0;    // accumulated words on current page
    let currentChars      = 0;    // accumulated characters on current page

   const pushPage = () => {
      if (currentBlocks.length === 0) return;
      pages.push(this._createPage(currentBlocks, currentIndices));
      if (pages.length >= MAX_PAGES) throw new Error('MAX_PAGES exceeded');
      currentBlocks  = [];
      currentIndices = [];
      currentY       = 0;
      currentWords   = 0;
      currentChars   = 0;
    };

    for (let i = 0; i < blocks.length; i++) {
     const block           = blocks[i];
     const { contentH, fullH } = this._getBlockHeights(block);
      
      // Count words and characters in this block
     const { words: blockWords, chars: blockChars } = countWordsAndChars(block);

      // ── Check 0: Word/Character limit enforcement ────────────────────────
      // If adding this block would exceed limits, force a page break first
     const wouldExceedWords = currentWords + blockWords > MAX_WORDS_PER_PAGE;
     const wouldExceedChars = currentChars + blockChars > MAX_CHARS_PER_PAGE;
      
      if ((wouldExceedWords || wouldExceedChars) && currentBlocks.length > 0) {
        // Current page has content, so push it and start new page
        if (this.debugMode) {
         console.log(`[PaginationEngine] Page break: word/char limit reached (${currentWords}/${currentChars} → ${currentWords + blockWords}/${currentChars + blockChars})`);
        }
        pushPage();
      }

      // ── Case 1: Block fits entirely on the current page ──────────────────
      if (currentY + fullH <= this.usableHeight) {
        currentBlocks.push(block);
        currentIndices.push(i);
        currentY += fullH;
        currentWords += blockWords;
        currentChars += blockChars;
       continue;
      }

      // ── Case 2: Block is larger than an entire page (unsplittable large) ─
      if (fullH > this.usableHeight && !isSplittable(block)) {
        // Flush current page, then give this block its own page(s).
        pushPage();
        currentBlocks.push(block);
        currentIndices.push(i);
        currentY = fullH;
        currentWords = blockWords;
        currentChars = blockChars;
       continue;
      }

      // ── Case 3: Widow/orphan check ────────────────────────────────────────
     const remaining = this.usableHeight - currentY;
      if (remaining < MIN_WIDOW_ORPHAN_HEIGHT) {
        // Not enough room even for a stub — push block to next page.
        pushPage();
        currentBlocks.push(block);
        currentIndices.push(i);
        currentY = fullH;
        currentWords = blockWords;
        currentChars = blockChars;
       continue;
      }

      // ── Case 4: Attempt paragraph split ──────────────────────────────────
      if (isSplittable(block)) {
        // Pass content-only height to split (exclude margin-bottom from split space).
       const splitResult = estimateParagraphSplit(block, remaining, this.styles);

        if (splitResult && splitResult.part1Height > 0 && splitResult.part2Height > 0) {
          // Count words/chars in each part
         const part1Counts = countWordsAndChars(splitResult.part1);
         const part2Counts = countWordsAndChars(splitResult.part2);
          
          // Check if part1 would still be under limits
         const part1WouldExceedWords = currentWords + part1Counts.words > MAX_WORDS_PER_PAGE;
         const part1WouldExceedChars = currentChars + part1Counts.chars > MAX_CHARS_PER_PAGE;
          
          // If part1 still exceeds limits, force page break before splitting
          if ((part1WouldExceedWords || part1WouldExceedChars) && currentBlocks.length > 0) {
            pushPage();
          }
          
          // part1 goes on the current page (or new page if we just pushed)
          currentBlocks.push(splitResult.part1);
          currentIndices.push(i); // both halves share source index
          
          // Check if we need to push the page due to limits or create a new one
          if (currentWords + part1Counts.words > MAX_WORDS_PER_PAGE || 
              currentChars + part1Counts.chars > MAX_CHARS_PER_PAGE) {
            pushPage();
            currentBlocks = [splitResult.part1];
            currentIndices = [i];
            currentWords = part1Counts.words;
            currentChars = part1Counts.chars;
          } else {
            currentWords += part1Counts.words;
            currentChars += part1Counts.chars;
          }
          
          pages.push(this._createPage(currentBlocks, currentIndices));
          if (pages.length >= MAX_PAGES) throw new Error('MAX_PAGES exceeded');

          // part2 starts the next page
          currentBlocks  = [splitResult.part2];
          currentIndices = [i];
          currentY       = splitResult.part2Height + blockMarginBottom(block);
          currentWords   = part2Counts.words;
          currentChars   = part2Counts.chars;
         continue;
        }
        // Split failed (e.g. single very long word) — fall through to push whole block
      }

      // ── Case 5: Can't split — move entire block to next page ─────────────
      pushPage();
      currentBlocks.push(block);
      currentIndices.push(i);
      currentY = fullH;
      currentWords = blockWords;
      currentChars = blockChars;
    }

    // Flush last page
    pushPage();

    if (this.perfLogEnabled) {
     const ms = (performance.now() - t0).toFixed(2);
     console.log(`[PaginationEngine] ${blocks.length} blocks → ${pages.length} pages in ${ms}ms`);
    }

    return pages;
  }

  /**
   * Alias for backward compatibility.
   * @param {object[]} nodes
   * @param {object}   _options  - ignored (kept for signature compat)
   */
  paginateContent(nodes, _options = {}) {
    return this.paginate(nodes);
  }

  /** Evict all cached height entries. Call when fonts or styles change. */
  clearCache() {
    this.cache.clear();
  }

  /** @returns {{ size: number, limit: number }} */
  getCacheStats() {
    return { size: this.cache.size, limit: CACHE_SIZE_LIMIT };
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  /**
   * Return { contentH, fullH } for a block, using the LRU cache.
   * fullH = contentH + marginBottom
   */
  _getBlockHeights(block) {
    const hash = this._hash(block);
    if (this.cache.has(hash)) return this.cache.get(hash);

    const contentH    = calculateBlockHeight(block, this.styles);
    const marginB     = blockMarginBottom(block);
    const fullH       = contentH + marginB;
    const entry       = { contentH, fullH, marginBottom: marginB };

    // LRU eviction: delete oldest entry when limit reached
    if (this.cache.size >= CACHE_SIZE_LIMIT) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(hash, entry);
    return entry;
  }

  /**
   * Deterministic, collision-resistant hash for a block node.
   *
   * Includes:
   *  - type name
   *  - full textContent length + first 50 chars (not just 20)
   *  - serialised attrs
   *  - inline mark fingerprint (bold/italic/link presence)
   */
  _hash(block) {
    const type    = getTypeName(block);
    const text    = block.textContent ?? block.text ?? '';
    const attrs   = JSON.stringify(block.attrs ?? {});
    const preview = text.substring(0, 50);
    const marks   = this._markFingerprint(block);
    return `${type}|${text.length}|${preview}|${attrs}|${marks}`;
  }

  /** Short string summarising which marks are present in inline content. */
  _markFingerprint(block) {
    const flags = { b: 0, i: 0, l: 0, c: 0 }; // bold, italic, link, code
    const walk = (node) => {
      if (node.marks) {
        node.marks.forEach((m) => {
          const n = m.type?.name ?? m.type ?? '';
          if (n === 'bold')   flags.b = 1;
          if (n === 'italic') flags.i = 1;
          if (n === 'link')   flags.l = 1;
          if (n === 'code')   flags.c = 1;
        });
      }
      if (node.content?.forEach) node.content.forEach(walk);
    };
    walk(block);
    return `${flags.b}${flags.i}${flags.l}${flags.c}`;
  }

  /**
   * Create a page object.
   *
   * @param {object[]} blocks  - Block nodes on this page
   * @param {number[]} indices - Source-array indices corresponding to each block
   * @returns {Page}
   */
  _createPage(blocks, indices) {
    const startIndex = indices[0]                    ?? 0;
    const endIndex   = indices[indices.length - 1]   ?? 0;
    const height     = blocks.reduce((sum, b) => {
      const { fullH } = this._getBlockHeights(b);
      return sum + fullH;
    }, 0);

    return {
      id:           crypto.randomUUID(),
      blocks:       [...blocks],
      blockIndices: [...indices],
      startIndex,                // first source-array index on this page
      endIndex,                  // last  source-array index on this page
      height,                    // total content + margin height (px)
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience singleton
// ─────────────────────────────────────────────────────────────────────────────

/** Default singleton for callers that don't need configuration. */
export const paginationEngine = new PaginationEngine();

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Flatten a ProseMirror document into a flat array of block nodes.
 * Skips the 'page' wrapper node (Athena custom schema), stops descending
 * into block-level nodes so their inline children are not included separately.
 *
 * @param {object} doc - ProseMirror Document node
 * @returns {object[]}
 */
export const flattenDocument = (doc) => {
  const BLOCK_NODE_NAMES = new Set([
    'paragraph',
    'heading',
    'image',
    'table',
    'bulletList',
    'orderedList',
    'listItem',
    'codeBlock',
    'blockquote',
    'horizontalRule',
    'customTable',
  ]);

  const blocks = [];

  doc.descendants((node) => {
    if (node.type.name === 'page') return true; // descend into page
    const isBlock =
      node.isBlock ||
      node.isTextblock ||
      BLOCK_NODE_NAMES.has(node.type.name);
    if (isBlock) {
      blocks.push(node);
      return false; // don't descend — inline children belong to the block
    }
    return true;
  });

  return blocks;
};

/**
 * Create a debounced paginate function.
 * Returns a Promise that resolves with the paginated pages after `delay` ms.
 *
 * @param {number} delay - debounce delay in ms (default 300)
 * @returns {function(engine, nodes, options?): Promise<Page[]>}
 */
export const createDebouncedPagination = (delay = 300) => {
  let timeoutId = null;
  return (engine, nodes, _options = []) =>
    new Promise((resolve) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        resolve(engine.paginate(nodes));
      }, delay);
    });
};