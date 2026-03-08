import React, { useMemo, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

// Virtual Page Renderer Component
const PageItem = React.memo(({ index, isVisible, currentPageIndex, page, blocks, onPageChange, renderPage, pageHeight }) => {
  const { ref, inView } = useInView({ threshold: 0.4 });

  useEffect(() => {
    if (inView && typeof onPageChange === 'function' && index !== currentPageIndex) {
      onPageChange(index);
    }
  }, [inView, index, currentPageIndex, onPageChange]);

  return (
    <div
      ref={ref}
      className={`page-wrapper ${index === currentPageIndex ? 'current-page' : ''}`}
      style={{
        height: pageHeight,
        visibility: isVisible ? 'visible' : 'hidden',
        contain: 'layout paint',
        willChange: 'transform'
      }}
    >
      {isVisible && renderPage(index, blocks, page)}
    </div>
  );
});

export const VirtualPageRenderer = React.memo(({ 
  pages, 
  blocks, 
  currentPageIndex, 
  onPageChange,
  renderPage,
  buffer = 2,
  pageHeight = 1123
}) => {
  const range = useMemo(() => {
    const start = Math.max(0, currentPageIndex - buffer);
    const end = Math.min(pages.length - 1, currentPageIndex + buffer);
    return { start, end };
  }, [currentPageIndex, pages.length, buffer]);

  return (
    <div className="virtual-pages-container">
      {pages.map((page, index) => {
        const isVisible = index >= range.start && index <= range.end;
        const pageBlocks = isVisible ? blocks.slice(page.start, page.end) : [];
        return (
          <PageItem
            key={`page-${index}`}
            index={index}
            isVisible={isVisible}
            currentPageIndex={currentPageIndex}
            page={page}
            blocks={pageBlocks}
            onPageChange={onPageChange}
            renderPage={renderPage}
            pageHeight={pageHeight}
          />
        );
      })}
    </div>
  );
});

// Hook to manage virtual pagination
export const useVirtualPagination = (blocks, currentPageIndex, options = {}) => {
  const {
    bufferSize = 1, // Number of pages before/after current to keep rendered
    maxPages = 50
  } = options;

  // Calculate visible page range
  const visibleRange = useMemo(() => {
    const start = Math.max(0, currentPageIndex - bufferSize);
    const end = Math.min(maxPages - 1, currentPageIndex + bufferSize);
    return { start, end };
  }, [currentPageIndex, bufferSize, maxPages]);

  // Get visible pages based on range
  const visiblePages = useMemo(() => {
    const pages = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      pages.push(i);
    }
    return pages;
  }, [visibleRange]);

  return {
    visiblePages,
    visibleRange,
    isPageVisible: (pageIndex) => {
      return pageIndex >= visibleRange.start && pageIndex <= visibleRange.end;
    }
  };
};

// Function to get page from range
export const getPageFromRange = (blocks, pageRange) => {
  if (!pageRange || typeof pageRange.start !== 'number' || typeof pageRange.end !== 'number') {
    return [];
  }
  return blocks.slice(pageRange.start, pageRange.end);
};

// Lazy pagination builder that extends pages as needed
export class LazyPaginationBuilder {
  constructor(options = {}) {
    this.options = {
      pageHeight: 1003,
      maxPages: 50,
      bufferPages: 3,
      lineHeight: 24,
      charsPerLine: 70,
      measureHeight: null,
      ...options
    };
    this.pageCache = new Map(); // docHash -> pages
    this.maxCacheEntries = 5;
  }

  // Build pages incrementally until content fits or max pages reached
  buildPagesUntilPosition(blocks, maxPages = 5, heightCache = new Map(), docHash = null) {
    // Use cached pages if document hash matches
    if (docHash && this.pageCache.has(docHash)) {
      const cached = this.pageCache.get(docHash);
      if (Array.isArray(cached) && cached.length > 0) {
        // Return only up to maxPages worth of cached pagination
        return cached.slice(0, Math.min(maxPages, cached.length));
      }
    }

    const { pageHeight, maxPages: globalMaxPages } = this.options;
    const maxPageCount = Math.min(maxPages, globalMaxPages);
    
    const pages = [];
    let currentHeight = 0;
    let pageStart = 0;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockId = this.getBlockId(block);
      const measured = typeof this.options.measureHeight === 'function' ? this.options.measureHeight(block) : null;
      const height = heightCache.get(blockId) || measured || this.estimateBlockHeight(block);

      if (currentHeight + height > pageHeight) {
        // Start a new page if we have content on current page
        if (i > pageStart) {
          pages.push({ start: pageStart, end: i });
        }

        // Check if we've reached max pages
        if (pages.length >= maxPageCount) {
          break;
        }

        // Start new page with current block
        pageStart = i;
        currentHeight = height;
      } else {
        currentHeight += height;
      }
    }

    // Add the final page if there's remaining content
    if (pageStart < blocks.length && pages.length < maxPageCount) {
      pages.push({ start: pageStart, end: blocks.length });
    }

    // Cache the result for this document hash
    if (docHash) {
      this.pageCache.set(docHash, pages);
      if (this.pageCache.size > this.maxCacheEntries) {
        const firstKey = this.pageCache.keys().next().value;
        if (firstKey) this.pageCache.delete(firstKey);
      }
    }

    return pages;
  }

  // Extend pagination when user scrolls near bottom
  extendPagination(existingPages, blocks, additionalPages = 1) {
    if (existingPages.length === 0) {
      return this.buildPagesUntilPosition(blocks, additionalPages);
    }

    // Get the last page's end position
    const lastPage = existingPages[existingPages.length - 1];
    const remainingBlocks = blocks.slice(lastPage.end);

    if (remainingBlocks.length === 0) {
      return existingPages; // No more content to paginate
    }

    // Build additional pages from remaining content
    const additionalPagesResult = this.buildPagesUntilPosition(
      remainingBlocks, 
      additionalPages
    );

    // Adjust indices to account for existing pages
    const adjustedPages = additionalPagesResult.map(page => ({
      start: page.start + lastPage.end,
      end: page.end + lastPage.end
    }));

    return [...existingPages, ...adjustedPages];
  }

  // Reflow from a given page index when earlier content changes
  reflowFromPage(existingPages, blocks, fromPageIndex = 0) {
    if (fromPageIndex <= 0) {
      return this.buildPagesUntilPosition(blocks, this.options.maxPages);
    }
    // Keep pages before the reflow point
    const preserved = existingPages.slice(0, fromPageIndex);
    // Collect remaining blocks from the reflow point
    const startBlockIndex = existingPages[fromPageIndex]?.start ?? 0;
    const remainingBlocks = blocks.slice(startBlockIndex);
    const recomputed = this.buildPagesUntilPosition(remainingBlocks, this.options.maxPages);
    // Offset recomputed ranges
    const adjusted = recomputed.map(p => ({ start: p.start + startBlockIndex, end: p.end + startBlockIndex }));
    return [...preserved, ...adjusted];
  }

  // Helper methods
  getBlockId(block) {
    if (block?.attrs?.id) return String(block.attrs.id);
    if (block?.attrs?.dataId) return String(block.attrs.dataId);
    const type = block?.type?.name || 'unknown';
    const text = block?.textContent || '';
    return `${type}:${text}`;
  }

  estimateBlockHeight(block) {
    const textLength = block.textContent?.length || 0;
    const lineHeight = this.options.lineHeight;
    const charsPerLine = this.options.charsPerLine;
    const estimatedLines = Math.ceil(textLength / Math.max(10, charsPerLine));
    const base = Math.max(estimatedLines * lineHeight, lineHeight);
    const type = block?.type?.name;
    if (type === 'heading') return Math.max(base, lineHeight * 2);
    if (type === 'image' || type === 'table' || type === 'codeBlock') return Math.max(base, lineHeight * 8);
    return base;
  }
}

export const lazyPaginationBuilder = new LazyPaginationBuilder();
