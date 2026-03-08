import { paginationEngine } from './paginationEngine';
import { USABLE_HEIGHT_PX, MAX_PAGES, A4_HEIGHT_PX } from './constants';

const MAX_CACHE_ENTRIES = 5;

export class VirtualPaginationManager {
  constructor(options = {}) {
    this.options = {
      usableHeight: USABLE_HEIGHT_PX,
      maxPages: MAX_PAGES,
      visiblePageBuffer: 3, // Render ±3 pages around current for smoother scroll
      ...options
    };
    
    this.visiblePages = new Set();
    this.pageCache = new Map(); // Cache for full pagination results
    this.lastContentHash = null;
    this._debounceId = null;
  }

  // Get only the pages that should be currently visible
  getVisiblePageRange(currentPageIndex, totalPages) {
    const start = Math.max(0, currentPageIndex - this.options.visiblePageBuffer);
    const end = Math.min(totalPages - 1, currentPageIndex + this.options.visiblePageBuffer);
    return { start, end };
  }

  // Determine which pages to render based on current viewport
  getPagesToRender(currentPageIndex, totalPages) {
    const { start, end } = this.getVisiblePageRange(currentPageIndex, totalPages);
    const pagesToRender = [];
    
    for (let i = start; i <= end; i++) {
      pagesToRender.push(i);
    }
    
    return pagesToRender;
  }

  // Paginate content and manage virtualization
  paginateContentWithVirtualization(nodes, currentPageIndex, options = {}) {
    const opts = { ...this.options, ...options };
    
    // Create a hash of the content to determine if we need to re-paginate
    const contentHash = this.generateContentHash(nodes);
    
    // Use cached result if content hasn't changed
    if (this.lastContentHash === contentHash && this.pageCache.has(contentHash)) {
      return this.getCachedResult(currentPageIndex, this.pageCache.get(contentHash));
    }
    
    // Perform full pagination
    const allPages = paginationEngine.paginateContent(nodes, opts);
    
    // Update cache
    this.lastContentHash = contentHash;
    this.pageCache.set(contentHash, allPages);
    // Enforce cache limit (simple FIFO)
    if (this.pageCache.size > MAX_CACHE_ENTRIES) {
      const firstKey = this.pageCache.keys().next().value;
      if (firstKey) this.pageCache.delete(firstKey);
    }
    
    // Return only visible pages for rendering
    return this.getCachedResult(currentPageIndex, allPages);
  }

  // Debounced pagination to avoid frequent recalculation during typing
  schedulePagination(nodes, currentPageIndex, options = {}, delay = 120) {
    return new Promise((resolve) => {
      if (this._debounceId) {
        clearTimeout(this._debounceId);
      }
      this._debounceId = setTimeout(() => {
        const result = this.paginateContentWithVirtualization(nodes, currentPageIndex, options);
        resolve(result);
      }, delay);
    });
  }

  getCachedResult(currentPageIndex, allPages) {
    const totalPages = allPages.length;
    const { start, end } = this.getVisiblePageRange(currentPageIndex, totalPages);
    
    // Prepare visible pages
    const visiblePages = allPages.slice(start, end + 1).map((page, index) => ({
      ...page,
      index: start + index, // Actual page index in the full document
      isVisible: true
    }));
    
    return {
      allPages,           // All pages for reference
      visiblePages,       // Pages to render
      startIndex: start,  // Index of first visible page
      endIndex: end,      // Index of last visible page
      total: totalPages   // Total number of pages
    };
  }

  generateContentHash(nodes) {
    // Stronger hash: include type and full text content to prevent collisions
    try {
      return JSON.stringify(
        nodes.map(n => ({
          type: n?.type?.name || 'unknown',
          text: n?.textContent || ''
        }))
      );
    } catch {
      // Fallback to a safer but still stronger representation
      return nodes.map(n => `${n?.type?.name || 'unknown'}-${n?.textContent || ''}`).join('|');
    }
  }

  // Clear cache when needed
  clearCache() {
    this.pageCache.clear();
    this.lastContentHash = null;
  }

  // Preload pages around a specific index (for smooth scrolling)
  preloadPages(nodes, targetPageIndex, options = {}) {
    const opts = { ...this.options, ...options };
    const totalPages = this.getTotalPages();
    
    // Get range to preload (wider than visible range)
    const buffer = opts.visiblePageBuffer + 2; // Extra buffer for preloading
    const start = Math.max(0, targetPageIndex - buffer);
    const end = Math.min(totalPages - 1, targetPageIndex + buffer);
    
    // This would typically trigger background pagination of nearby pages
    // For now, we ensure the full pagination is available
    const contentHash = this.generateContentHash(nodes);
    if (!this.pageCache.has(contentHash)) {
      const allPages = paginationEngine.paginateContent(nodes, opts);
      this.pageCache.set(contentHash, allPages);
      this.lastContentHash = contentHash;
      if (this.pageCache.size > MAX_CACHE_ENTRIES) {
        const firstKey = this.pageCache.keys().next().value;
        if (firstKey) this.pageCache.delete(firstKey);
      }
    }
    
    return { start, end };
  }

  getTotalPages() {
    if (this.pageCache.size === 0) return 0;
    
    const values = Array.from(this.pageCache.values());
    const latestCacheEntry = values[values.length - 1];
    return latestCacheEntry ? latestCacheEntry.length : 0;
  }

  // Build a simple page map for fast lookups (block index -> page index)
  buildPageMap(allPages) {
    const map = [];
    for (let i = 0; i < allPages.length; i++) {
      const p = allPages[i];
      map.push({ index: i, start: p.start, end: p.end });
    }
    return map;
  }

  // Find which page contains a given block index
  findPageIndexForBlockIndex(blockIndex, allPages) {
    for (let i = 0; i < allPages.length; i++) {
      const p = allPages[i];
      if (blockIndex >= p.start && blockIndex < p.end) return i;
    }
    return -1;
  }
}

// Export a default instance
export const virtualPaginationManager = new VirtualPaginationManager();

// Utility function to determine if a page should be rendered
export const shouldRenderPage = (pageIndex, currentPageIndex, buffer = 3) => {
  return Math.abs(pageIndex - currentPageIndex) <= buffer;
};

// Compute current page from scroll position and page height
export const computeCurrentPageIndex = (scrollTop, pageHeight = A4_HEIGHT_PX) => {
  if (!isFinite(scrollTop) || scrollTop < 0) return 0;
  return Math.max(0, Math.floor(scrollTop / Math.max(1, pageHeight)));
};
