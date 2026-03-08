import { calculateRealisticBlockHeight, estimateParagraphSplit, BLOCK_TYPES } from './layoutCalculator';
import { USABLE_HEIGHT_PX, MIN_WIDOW_ORPHAN_HEIGHT, MAX_PAGES, CACHE_SIZE_LIMIT } from './constants';

export class PaginationEngine {
  constructor(options = {}) {
    this.options = {
      usableHeight: USABLE_HEIGHT_PX,
      minWidowOrphanHeight: MIN_WIDOW_ORPHAN_HEIGHT,
      maxPages: MAX_PAGES,
      measureHeight: options.measureHeight || null,
      ...options
    };
    this.cache = new Map(); // For storing calculated heights
    this.heightCache = new Map(); // For storing block heights
    this.debugMode = options.debugMode || false;
    this.perfLogEnabled = options.perfLogEnabled || false;
    this.isPaginating = false; // Guard against re-entrant pagination
  }

  // Main pagination algorithm - builds page ranges incrementally
  paginateContent(nodes, options = {}) {
    // Prevent re-entrant pagination
    if (this.isPaginating) {
      if (this.debugMode) {
        console.log("Pagination blocked - already running");
      }
      return [];
    }

    this.isPaginating = true;

    if (this.debugMode) {
      console.time("pagination");
    }

    try {
      // Implement Never-Ending Page by short-circuiting pagination logic
      // This forces all content into exactly one "Page" node that will expand indefinitely.
      if (nodes.length === 0) return [];
      return [{ start: 0, end: nodes.length }];

      const opts = { ...this.options, ...options };

      // Use a safety buffer to absorb floating point errors
      const SAFETY_BUFFER = 2;
      const PAGE_LIMIT = opts.usableHeight - SAFETY_BUFFER;

      const pages = []; // Will contain { start, end } ranges instead of content
      let currentHeight = 0;
      let pageStart = 0;

      const safeHeight = (n) => {
        const h = Math.max(0, Math.ceil(this.getBlockHeight(n)));
        return isFinite(h) ? h : 0;
      };

      // Process each node and assign to pages by index range
      for (let i = 0; i < nodes.length; i++) {
        if (pages.length >= opts.maxPages) break;
        const node = nodes[i];
        let height = safeHeight(node);

        // If this single block is larger than the page limit, force it to start on a new page
        if (height > PAGE_LIMIT) {
          if (i > pageStart) {
            pages.push({ start: pageStart, end: i });
          }
          pages.push({ start: i, end: i + 1 });
          pageStart = i + 1;
          currentHeight = 0;
          continue;
        }

        // Early cut: if the remaining space on the page is too small to host reasonable content,
        // start a new page before placing the next block (widow/orphan prevention).
        const remainingBefore = PAGE_LIMIT - currentHeight;
        if (currentHeight > 0 && remainingBefore < opts.minWidowOrphanHeight) {
          pages.push({ start: pageStart, end: i });
          pageStart = i;
          currentHeight = 0;
        }

        // Keep-with-next for headings: if a heading would be the last item with too little space
        // for the following block, push heading to next page with its following block.
        if (node?.type?.name === 'heading' && i + 1 < nodes.length) {
          const nextHeight = safeHeight(nodes[i + 1]);
          const remainingIfPlaced = PAGE_LIMIT - (currentHeight + height);
          // If placing heading leaves too little room for at least a minimal next block, move heading to next page
          if (remainingIfPlaced < Math.min(opts.minWidowOrphanHeight, nextHeight)) {
            if (i > pageStart) {
              pages.push({ start: pageStart, end: i });
            }
            pageStart = i;
            currentHeight = 0;
          }
        }

        // If the block doesn't fit, attempt split for paragraphs, otherwise start a new page
        if (currentHeight + height > PAGE_LIMIT) {
          let splitHandled = false;
          if (node?.type?.name === 'paragraph') {
            const available = PAGE_LIMIT - currentHeight;
            const split = estimateParagraphSplit(node, available);
            if (split && split.part1 && split.part2) {
              nodes.splice(i, 1, split.part1, split.part2);
              const h1 = Math.max(0, Math.ceil(this.getBlockHeight(split.part1)));
              if (currentHeight + h1 <= PAGE_LIMIT) {
                currentHeight += h1;
                pages.push({ start: pageStart, end: i + 1 });
                pageStart = i + 1;
                currentHeight = 0;
                splitHandled = true;
                continue;
              } else {
                nodes.splice(i, 2, split.part1);
                height = h1;
              }
            }
          }
          if (!splitHandled) {
            if (i > pageStart) {
              pages.push({ start: pageStart, end: i });
            }
            pageStart = i;
            currentHeight = height;
          }
        } else {
          currentHeight += height;
        }
      }

      // Add the final page
      if (pageStart < nodes.length) {
        pages.push({ start: pageStart, end: nodes.length });
      }

      if (this.debugMode) {
        console.timeEnd("pagination");
        console.log(`Paginated ${nodes.length} nodes into ${pages.length} pages`);
        console.log(`Current height on last page: ${currentHeight}, PAGE_LIMIT: ${PAGE_LIMIT}`);
      }

      if (this.perfLogEnabled) {
        const endTime = performance.now();
        console.log(`Pagination took ${endTime - startTime} milliseconds for ${nodes.length} nodes`);
      }

      // Optional stabilization pass to avoid oscillation
      let pass = 0;
      let stable = false;
      while (!stable && pass < 3) {
        const re = this._paginateOnce(nodes, opts);
        stable = this.arePagesEqual(pages, re);
        if (!stable) pages.splice(0, pages.length, ...re);
        pass += 1;
      }

      this.isPaginating = false;
      return pages;
    } catch (err) {
      this.isPaginating = false;
      if (this.debugMode) console.error('[paginationEngine] paginateContent error:', err);
      return [];
    }
  }

  _paginateOnce(nodes, opts) {
    if (nodes.length === 0) return [];
    return [{ start: 0, end: nodes.length }];
    let currentHeight = 0;
    let pageStart = 0;
    const safeHeight = (n) => {
      const h = Math.max(0, Math.ceil(this.getBlockHeight(n)));
      return isFinite(h) ? h : 0;
    };
    for (let i = 0; i < nodes.length; i++) {
      if (pages.length >= opts.maxPages) break;
      const node = nodes[i];
      const height = safeHeight(node);
      if (height > PAGE_LIMIT) {
        if (i > pageStart) pages.push({ start: pageStart, end: i });
        pages.push({ start: i, end: i + 1 });
        pageStart = i + 1;
        currentHeight = 0;
        continue;
      }
      const remainingBefore = PAGE_LIMIT - currentHeight;
      if (currentHeight > 0 && remainingBefore < opts.minWidowOrphanHeight) {
        pages.push({ start: pageStart, end: i });
        pageStart = i;
        currentHeight = 0;
      }
      if (currentHeight + height > PAGE_LIMIT) {
        if (i > pageStart) pages.push({ start: pageStart, end: i });
        pageStart = i;
        currentHeight = height;
      } else {
        currentHeight += height;
      }
    }
    if (pageStart < nodes.length) pages.push({ start: pageStart, end: nodes.length });
    return pages;
  }

  // Helper methods
  getBlockHeight(node) {
    const cacheKey = this.generateCacheKey(node);
    if (this.heightCache.has(cacheKey)) {
      return this.heightCache.get(cacheKey);
    }

    let height = 0;
    if (typeof this.options.measureHeight === 'function') {
      try {
        const measured = this.options.measureHeight(node);
        if (Number.isFinite(measured) && measured > 0) {
          height = measured;
        }
      } catch { void 0 }
    }
    if (!height) {
      height = calculateRealisticBlockHeight(node);
    }
    this.heightCache.set(cacheKey, height);

    // Manage cache size to prevent memory bloat
    if (this.heightCache.size > CACHE_SIZE_LIMIT) {
      const firstKey = this.heightCache.keys().next().value;
      if (firstKey) {
        this.heightCache.delete(firstKey);
      }
    }

    return height;
  }

  generateCacheKey(node) {
    const t = node?.type?.name || '';
    const l = node?.textContent?.length || 0;
    const a = JSON.stringify(node?.attrs || {});
    return `${t}_${l}_${a}`;
  }

  handleOverflow(node, height, currentPageNodes, pages, currentHeight, pageNum, opts) {
    const availableSpace = opts.usableHeight - currentHeight;

    // Handle paragraph splitting with widow/orphan prevention
    if (node.type.name === 'paragraph' && availableSpace > opts.minWidowOrphanHeight) {
      // Attempt to split paragraph
      const splitResult = estimateParagraphSplit(node, availableSpace);
      if (splitResult && splitResult.part1 && splitResult.part2) {
        currentPageNodes.push(splitResult.part1);
        this.finishPage(pages, currentPageNodes, currentHeight, pageNum++);
        // Return the remainder to be processed in the next iteration
        return { needsReprocess: true, remainder: splitResult.part2, newPageCreated: true, nextPageNum: pageNum };
      }
    }

    // For tables and atomic blocks, move to next page
    if (this.isTable(node) || this.isAtomic(node)) {
      if (currentPageNodes.length > 0) {
        this.finishPage(pages, currentPageNodes, currentHeight, pageNum++);
      }
      currentPageNodes = [node];
      currentHeight = height;
    } else {
      // For other blocks, start new page
      this.finishPage(pages, currentPageNodes, currentHeight, pageNum++);
      currentPageNodes = [node];
      currentHeight = height;
    }

    return { newPageCreated: true, nextPageNum: pageNum };
  }

  finishPage(pages, currentPageNodes, currentHeight, pageNum) {
    if (currentPageNodes.length > 0) {
      pages.push({
        id: pageNum,
        blocks: [...currentPageNodes],
        height: currentHeight
      });
    }
  }

  isHeading(node) {
    return node && node.type.name === 'heading';
  }

  isTable(node) {
    return node && (node.type.name === 'table' || node.type.name === 'customTable');
  }

  isAtomic(node) {
    return node && ['image', 'codeBlock', 'divider', 'horizontalRule'].includes(node.type.name);
  }

  // Method to clear cache when needed
  clearCache() {
    this.cache.clear();
  }

  // Method to update options
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }

  // Performance utility: Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      limit: CACHE_SIZE_LIMIT
    };
  }

  // Compare two page arrays to prevent unnecessary updates
  arePagesEqual(pagesA, pagesB) {
    if (!pagesB || pagesA.length !== pagesB.length) return false;

    for (let i = 0; i < pagesA.length; i++) {
      if (pagesA[i].start !== pagesB[i].start ||
        pagesA[i].end !== pagesB[i].end) {
        return false;
      }
    }

    return true;
  }

  // Clear height cache to force recalculation
  clearHeightCache() {
    this.heightCache.clear();
  }

  // Incremental pagination function - extends existing pagination when content changes minimally
  extendPagination(existingPages, blocks, changedIndex = 0) {
    // If no changes or changes are at the end, we can optimize by only recalculating from the change point
    if (changedIndex === blocks.length - 1) {
      // Last block changed, just recalculate from the page where this block belongs
      const relevantPageIndex = this.findBlockPageIndex(existingPages, changedIndex);
      if (relevantPageIndex !== -1) {
        return this.recalculateFromPage(existingPages, blocks, relevantPageIndex);
      }
    }

    // Otherwise, do a full recalculation
    return this.paginateContent(blocks);
  }

  // Helper to find which page a block belongs to
  findBlockPageIndex(pages, blockIndex) {
    for (let i = 0; i < pages.length; i++) {
      if (blockIndex >= pages[i].start && blockIndex < pages[i].end) {
        return i;
      }
    }
    return -1;
  }

  // Recalculate pagination from a specific page onwards
  recalculateFromPage(existingPages, blocks, fromPageIndex) {
    // Keep pages before the change
    const newPages = existingPages.slice(0, fromPageIndex);

    // Get the blocks from the changed page onwards
    const blocksFromChangedPage = [];
    for (let i = fromPageIndex; i < existingPages.length; i++) {
      const page = existingPages[i];
      for (let j = page.start; j < page.end; j++) {
        if (j < blocks.length) {
          blocksFromChangedPage.push(blocks[j]);
        }
      }
    }

    // Repaginate the remaining blocks
    const remainingPages = this.paginateContent(blocksFromChangedPage);

    // Adjust the start/end indices to match the original document positions
    const adjustedRemainingPages = remainingPages.map(page => ({
      start: page.start + existingPages[fromPageIndex].start,
      end: page.end + existingPages[fromPageIndex].start
    }));

    return [...newPages, ...adjustedRemainingPages];
  }
}

// Export a default instance for convenience
export const paginationEngine = new PaginationEngine();

// Utility function to flatten ProseMirror document into nodes array
export const flattenDocument = (doc) => {
  const blocks = [];
  const ALLOWED_BLOCKS = new Set([
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
    'customTable'
  ]);

  doc.descendants((node) => {
    if (node.type.name === 'page') {
      return true;
    }
    const isBlock = node.isBlock || node.isTextblock || ALLOWED_BLOCKS.has(node.type.name);
    if (isBlock) {
      blocks.push(node);
      return false;
    }
    return true;
  });

  return blocks;
};

// Performance utility: Debounced pagination function to avoid excessive calls
export const createDebouncedPagination = (delay = 300) => {
  let timeoutId = null;
  return (engine, nodes, options, existingPages = []) => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        // Use incremental pagination if we have existing pages and minimal changes
        let result;
        if (existingPages.length > 0) {
          result = engine.extendPagination(existingPages, nodes, nodes.length - 1);
        } else {
          result = engine.paginateContent(nodes, options);
        }

        // Add additional stability check - ensure page count doesn't grow unexpectedly
        if (existingPages.length > 0 && result.length > existingPages.length + 1) {
          // If page count increased by more than 1, there might be instability
          // Log for debugging
          console.warn(`Possible pagination instability: pages increased from ${existingPages.length} to ${result.length}`);
        }

        resolve(result);
      }, delay);
    });
  };
};