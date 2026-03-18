/**
 * paginationEngine.js — ATHENA PAGINATION ENGINE v4.0 (GOOGLE DOCS EDITION)
 *
 * Production-grade pagination matching Google Docs precisely.
 *
 * Key improvements in v4.0:
 * • Uses Google Docs exact typography (Arial 11pt, 1.15 spacing, 48 lines/page)
 * • Prefers ~810px usable height (48 lines) instead of max ~931px
 * • DOM-measurement-ready: can use offsetHeight from rendered content
 * • Falls back to estimation when DOM not available (SSR, pre-render)
 * • Smart page break decisions based on actual content height
 *
 * GOOGLE DOCS CONFIGURATION:
 * - Font: Arial 11pt (14.67px at 96 DPI)
 * - Line spacing: 1.15
 * - Line height: 16.87px
 * - Lines per page: 48
 * - Content height: 809.76px ≈ 810px
 */

import {
  calculateBlockHeight,
  calculateFullBlockHeight,
  estimateParagraphSplit,
  blockMarginBottom,
  BLOCK_TYPES,
  countWordsAndChars,
  countWordsAndCharsInRange,
  measureBlockHeight,
  getPreferredUsableHeight,
  getMaxUsableHeight,
} from './layoutCalculator';

import {
  USABLE_HEIGHT_PX,
  MIN_WIDOW_ORPHAN_HEIGHT,
  MAX_PAGES,
  CACHE_SIZE_LIMIT,
  MAX_WORDS_PER_PAGE,
  MAX_CHARS_PER_PAGE,
  GOOGLE_DOCS_CONFIG,
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
   * @param {boolean} options.useGoogleDocsConfig - Use Google Docs preferred height (~810px)
   * @param {object}  options.styles        - Global style overrides forwarded to height calc
   * @param {boolean} options.debugMode
   * @param {boolean} options.perfLogEnabled
   * @param {object}  options.editorView    - TipTap/ProseMirror editor view for DOM access
   */
  constructor(options = {}) {
    // Google Docs mode: prefer ~810px (48 lines) for better pagination
    const useGoogleDocsConfig = options.useGoogleDocsConfig ?? true;
    const googleDocsHeight = useGoogleDocsConfig ? getPreferredUsableHeight() : USABLE_HEIGHT_PX;
    
    this.usableHeight    = options.usableHeight ?? googleDocsHeight;
    this.styles          = options.styles          ?? {};
    this.debugMode       = options.debugMode       ?? false;
    this.perfLogEnabled  = options.perfLogEnabled  ?? false;
    this.useGoogleDocsConfig = useGoogleDocsConfig;
    this.editorView      = options.editorView || null; // Store editor view for DOM access

    // LRU cache: Map preserves insertion order; we evict oldest entries.
    this.cache = new Map(); // hash → { contentHeight, fullHeight, marginBottom }
    
    // Enhanced tracking for better page break decisions
    this._lastPageBreakIndex = -1; // Track last page break position
    this._consecutiveBlocksOnPage = 0; // Track block density
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Measure a rendered DOM element and return its height.
   * This is the Google Docs approach: offsetHeight is the source of truth.
   *
   * @param {HTMLElement} element - Rendered DOM element
   * @returns {number} Height in px (offsetHeight)
   */
  measureElementHeight(element) {
    if (!element) return 0;
    
    // Use actual DOM measurement (Google Docs approach)
    const measuredHeight = measureBlockHeight(element);
    
    if (measuredHeight > 0) {
      // DOM measurement successful
      return measuredHeight;
    }
    
    // Fallback to estimation if DOM not available
    return this._estimateHeightFromNode(element);
  }

  /**
   * Estimate height from ProseMirror node when DOM not available.
   * Falls back to calculation-based approach.
   *
   * @param {object} node - ProseMirror node
   * @returns {number} Estimated height in px
   * @private
   */
  _estimateHeightFromNode(node) {
    if (!node) return 0;
    const { fullH } = this._getBlockHeights(node);
    return fullH;
  }

  /**
   * Get DOM node for a block using ProseMirror's node-to-DOM mapping.
   * Uses the editor view's built-in getDOM() method for reliable lookup.
   *
   * @param {object} block - ProseMirror node
   * @param {number} blockIndex - Index in the flattened blocks array
   * @returns {HTMLElement|null}
   * @private
   */
  _getNodeDOMNode(block, blockIndex) {
    if (!this.editorView) return null;
    
    try {
      // Method 1: Try direct DOM query with data attribute (if available)
      if (typeof blockIndex === 'number') {
        const domByAttr = document.querySelector(`[data-block-index="${blockIndex}"]`);
        if (domByAttr) return domByAttr;
      }
      
      // Method 2: Use ProseMirror's node-to-DOM mapping
      // Find the position of this node in the document
      let foundPos = null;
      this.editorView.state.doc.descendants((node, pos) => {
        if (node === block && foundPos === null) {
          foundPos = pos;
          return false; // stop searching
        }
        return true; // continue searching
      });
      
      if (foundPos !== null) {
        // Use nodeDOM to get the DOM element at this position
        const dom = this.editorView.nodeDOM(foundPos);
        return dom || null;
      }
    } catch (err) {
      console.warn('[PaginationEngine] Failed to get DOM node:', err);
    }
    
    return null;
  }

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
    
    // Reset tracking state for new pagination run
    this._lastPageBreakIndex = -1;
    this._consecutiveBlocksOnPage = 0;

    const pushPage = (reason = 'normal') => {
      if (currentBlocks.length === 0) return;
      
      // Enhanced: Track page break patterns for better decisions
      this._lastPageBreakIndex = currentIndices[currentIndices.length - 1];
      
      const page = this._createPage(currentBlocks, currentIndices);
      pages.push(page);
      
      if (this.debugMode) {
        const heightInfo = this.useGoogleDocsConfig 
          ? `Google Docs mode: ${Math.round(this.usableHeight)}px (48 lines)`
          : `Standard mode: ${Math.round(this.usableHeight)}px`;
        console.log(`[PaginationEngine] Page ${pages.length} created (${reason}): ${page.blocks.length} blocks, ${Math.round(page.height)}px - ${heightInfo}`);
      }
      
      if (pages.length >= MAX_PAGES) throw new Error('MAX_PAGES exceeded');
      currentBlocks  = [];
      currentIndices = [];
      currentY       = 0;
      currentWords   = 0;
      currentChars   = 0;
      this._consecutiveBlocksOnPage = 0;
    };

    for (let i = 0; i < blocks.length; i++) {
      const block           = blocks[i];
      
      // ── DOM-BASED MEASUREMENT (Google Docs approach) ─────────────────────
      // Measure REAL rendered height, not estimation
      const fullH = this.measureElementHeight(blocks[i].domNode || this._getNodeDOMNode(block, i));
      
      // Count words and characters for tracking only (not pagination decisions)
      const { words: blockWords, chars: blockChars } = countWordsAndChars(block);
      this._consecutiveBlocksOnPage++;

      // ── Enhanced Check: Prevent awkward mid-section breaks ────────────────
      // Track if we're in a sequence of related blocks (e.g., multiple paragraphs under same heading)
      const isContinuationOfSequence = this._isBlockSequence(blocks, i, this._lastPageBreakIndex);
      
      // ── STRICT GOOGLE DOCS HEIGHT ENFORCEMENT ─────────────────────────────
      // Google Docs breaks at ~810px (48 lines), NOT at the absolute max (~931px)
      // This prevents text from bleeding too close to the bottom margin
      const PREFERRED_LIMIT = this.usableHeight;  // 810px in Google Docs mode
      const ABSOLUTE_LIMIT = getMaxUsableHeight(); // 931px - emergency fallback
      
      const potentialHeight = currentY + fullH;
      
      // ── Case 1: Block fits comfortably within preferred limit ─────────────
      const SAFETY_BUFFER_PX = 2;
      const effectiveMaxHeight = PREFERRED_LIMIT - SAFETY_BUFFER_PX;
      
      if (potentialHeight <= effectiveMaxHeight) {
        currentBlocks.push(block);
        currentIndices.push(i);
        currentY += fullH;
        currentWords += blockWords;
        currentChars += blockChars;
        continue;
      }
      
      // ── Case 2: Exceeds preferred but still under absolute limit ──────────
      // Only allow if it's a small overflow (< 20% of a line ~3px)
      // This prevents micro-adjustments from triggering unnecessary breaks
      const isMinorOverflow = potentialHeight <= effectiveMaxHeight + 3;
      if (isMinorOverflow && potentialHeight <= ABSOLUTE_LIMIT) {
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
        pushPage('oversized block');
        currentBlocks.push(block);
        currentIndices.push(i);
        currentY = fullH;
        currentWords = blockWords;
        currentChars = blockChars;
        continue;
      }

      // ── Enhanced Case 3b: Smart section boundary detection ───────────────
      // Prefer breaking at natural boundaries (after headings, before lists, etc.)
      const canBreakAtBoundary = this._findOptimalBreakPoint(blocks, i, currentBlocks);
      if (canBreakAtBoundary !== null && canBreakAtBoundary < i) {
        // Move blocks up to optimal break point to current page
        for (let j = this._getLastSafeBreakIndex(blocks, currentIndices, i) + 1; j <= canBreakAtBoundary; j++) {
          const boundaryBlock = blocks[j];
          const { fullH: boundaryH } = this._getBlockHeights(boundaryBlock);
          const { words: bWords, chars: bChars } = countWordsAndChars(boundaryBlock);
          
          if (currentY + boundaryH <= this.usableHeight &&
              currentWords + bWords <= MAX_WORDS_PER_PAGE &&
              currentChars + bChars <= MAX_CHARS_PER_PAGE) {
            currentBlocks.push(boundaryBlock);
            currentIndices.push(j);
            currentY += boundaryH;
            currentWords += bWords;
            currentChars += bChars;
          }
        }
        pushPage('section boundary');
      }

      // ── Case 3: Block exceeds preferred limit — check for paragraph split ───
      // Google Docs splits paragraphs rather than pushing entire blocks to next page
      if (isSplittable(block) && potentialHeight > PREFERRED_LIMIT) {
        // Calculate remaining space on current page (using preferred limit)
        const remainingSpace = PREFERRED_LIMIT - currentY;
        
        // Only attempt split if there's reasonable space left (> 2 lines ~34px)
        if (remainingSpace > MIN_WIDOW_ORPHAN_HEIGHT) {
          const splitResult = estimateParagraphSplit(block, remainingSpace, this.styles);
          
          if (splitResult && splitResult.part1Height > 0 && splitResult.part2Height > 0) {
            // Count words/chars in each part
            const part1Counts = countWordsAndChars(splitResult.part1);
            const part2Counts = countWordsAndChars(splitResult.part2);
            
            // Check content limits
            const part1WouldExceedWords = currentWords + part1Counts.words > MAX_WORDS_PER_PAGE;
            const part1WouldExceedChars = currentChars + part1Counts.chars > MAX_CHARS_PER_PAGE;
            
            // If part1 still fits within limits, proceed with split
            if (!part1WouldExceedWords && !part1WouldExceedChars) {
              // part1 goes on current page
              currentBlocks.push(splitResult.part1);
              currentIndices.push(i);
              currentWords += part1Counts.words;
              currentChars += part1Counts.chars;
              
              // Push the completed page
              pushPage('paragraph split at preferred limit');
              
              // part2 starts the next page
              currentBlocks = [splitResult.part2];
              currentIndices = [i];
              currentY = splitResult.part2Height + blockMarginBottom(block);
              currentWords = part2Counts.words;
              currentChars = part2Counts.chars;
              continue;
            }
          }
        }
      }

      // ── Case 4: Widow/orphan check ────────────────────────────────────────
      const remaining = this.usableHeight - currentY;
      if (remaining < MIN_WIDOW_ORPHAN_HEIGHT) {
        // Not enough room even for a stub — push block to next page.
        pushPage('widow/orphan prevention');
        currentBlocks.push(block);
        currentIndices.push(i);
        currentY = fullH;
        currentWords = blockWords;
        currentChars = blockChars;
        continue;
      }

      // ── Case 5: Can't split — move entire block to next page ─────────────
      pushPage('unsplittable block');
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

  // ── Enhanced Internal Helpers ─────────────────────────────────────────────

  /**
   * Detect if current block is part of a logical sequence (e.g., paragraphs under same heading).
   * Helps avoid awkward mid-section page breaks.
   * 
   * @param {object[]} blocks - All document blocks
   * @param {number} currentIndex - Current block index
   * @param {number} lastBreakIndex - Index of last page break
   * @returns {boolean}
   */
  _isBlockSequence(blocks, currentIndex, lastBreakIndex) {
    if (currentIndex === 0 || lastBreakIndex >= currentIndex - 1) return false;
    
    const prevBlock = blocks[currentIndex - 1];
    const currBlock = blocks[currentIndex];
    const prevType = getTypeName(prevBlock);
    const currType = getTypeName(currBlock);
    
    // Sequence indicators:
    // 1. Multiple consecutive paragraphs
    // 2. List items in same list
    // 3. Table rows
    // 4. Code block continuation
    
    if (prevType === 'paragraph' && currType === 'paragraph') return true;
    if ((prevType === 'bulletList' || prevType === 'orderedList') && 
        (currType === 'bulletList' || currType === 'orderedList')) return true;
    if (prevType === 'listItem' && currType === 'listItem') return true;
    if (prevType === 'codeBlock' && currType === 'codeBlock') return true;
    
    return false;
  }

  /**
   * Find optimal break point before current position.
   * Prefers natural boundaries: after headings, before lists, between sections.
   * 
   * @param {object[]} blocks - All document blocks
   * @param {number} currentIndex - Current block that doesn't fit
   * @param {object[]} currentBlocks - Blocks already on current page
   * @returns {number|null} Optimal break index or null if not found
   */
  _findOptimalBreakPoint(blocks, currentIndex, currentBlocks) {
    if (currentBlocks.length < 2) return null;
    
    // Look backwards from current position to find good break points
    const lookbackRange = Math.min(5, currentBlocks.length);
    
    for (let offset = 1; offset <= lookbackRange; offset++) {
      const checkIndex = currentIndex - offset;
      if (checkIndex < 0) break;
      
      const block = blocks[checkIndex];
      const type = getTypeName(block);
      
      // Prefer breaking after these block types:
      if (type === 'heading') return checkIndex;
      if (type === 'horizontalRule') return checkIndex;
      if (type === 'image') return checkIndex;
      if (type === 'table') return checkIndex;
      
      // Avoid breaking inside lists
      if (type === 'listItem' || type === 'bulletList' || type === 'orderedList') {
        continue; // Skip and look further back
      }
    }
    
    return null; // No optimal break found
  }

  /**
   * Get the last safe break index from current page's blocks.
   * Used to determine where to resume when pushing blocks after boundary optimization.
   * 
   * @param {object[]} blocks - All document blocks
   * @param {number[]} currentIndices - Indices of blocks on current page
   * @param {number} searchFromIndex - Index to search forward from
   * @returns {number} Last safe break index
   */
  _getLastSafeBreakIndex(blocks, currentIndices, searchFromIndex) {
    if (currentIndices.length === 0) return -1;
    return currentIndices[currentIndices.length - 1];
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