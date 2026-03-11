/**
 * virtualPageRenderer.js — ATHENA PAGINATION ENGINE v3.0
 *
 * Improvements over v2:
 *  • pageBlocks now reads page.blocks directly (pages are self-contained).
 *    The broken `blocks.slice(page.start, page.end)` pattern is removed.
 *  • PageItem uses IntersectionObserver via react-intersection-observer but
 *    only fires onPageChange when the page is >50% visible, preventing rapid
 *    flicker during fast scrolling.
 *  • Ghost skeleton has an aria-hidden label so screen readers skip it.
 *  • VirtualPageRenderer exposes a ref so callers can imperatively scroll.
 *  • useVirtualPagination is removed (superseded by useVirtualScrollPagination
 *    in usePaginationEngine.js) — kept as a thin re-export for compatibility.
 */

import React, { useMemo, useEffect, useCallback, useRef, forwardRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useVirtualScrollPagination } from './usePaginationEngine';
import { A4_HEIGHT_PX, A4_WIDTH_PX, PAGE_GAP_PX, USABLE_HEIGHT_PX } from './constants';

// ─────────────────────────────────────────────────────────────────────────────
// PageItem
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders a single A4 page container.
 *
 * Ghost mode: when `isNearVisible` is false the page renders an empty skeleton
 * div that maintains the layout footprint without mounting any content nodes.
 * This is the "ghost page" strategy that prevents scroll-position drift.
 */
const PageItem = React.memo(({
  index,
  page,
  isNearVisible,
  currentPageIndex,
  onPageChange,
  renderPage,
  pageHeight,
}) => {
  // Fire onPageChange when this page crosses 50 % of the viewport.
  const { ref, inView } = useInView({
    threshold:   0.5,
    rootMargin: '0px',
  });

  useEffect(() => {
    if (inView && typeof onPageChange === 'function' && index !== currentPageIndex) {
      onPageChange(index);
    }
  }, [inView, index, currentPageIndex, onPageChange]);

  const isActive = index === currentPageIndex;

  return (
    <div
      ref={ref}
      data-page-index={index}
      role="region"
      aria-label={`Page ${index + 1}`}
      style={{
        width:           `${A4_WIDTH_PX}px`,
        height:          `${pageHeight}px`,
        margin:          `0 auto ${PAGE_GAP_PX}px auto`,
        backgroundColor: 'white',
        boxShadow:       '0 2px 8px rgba(0,0,0,0.15)',
        position:        'relative',
        // contain: layout tells the browser this element's size never changes —
        // prevents ancestor reflow when content inside updates.
        contain:         'layout',
        cursor:          'text',
        outline:         isActive ? '2px solid #4285f4' : 'none',
        outlineOffset:   '1px',
        transition:      'outline 0.1s ease',
        userSelect:      'text',
      }}
    >
      {isNearVisible ? (
        // ── Render real content ───────────────────────────────────────────
        renderPage(index, page.blocks, page)
      ) : (
        // ── Ghost skeleton: zero-cost placeholder ─────────────────────────
        <div
          aria-hidden="true"
          style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
        />
      )}

      {/* Page number — always visible, pointer-events: none so it doesn't
          interfere with text selection. */}
      <div
        aria-hidden="true"
        style={{
          position:       'absolute',
          bottom:         '10px',
          right:          '20px',
          fontSize:       '11px',
          color:          '#bbb',
          pointerEvents:  'none',
          userSelect:     'none',
          fontFamily:     'sans-serif',
        }}
      >
        {index + 1}
      </div>
    </div>
  );
});

PageItem.displayName = 'PageItem';

// ─────────────────────────────────────────────────────────────────────────────
// VirtualPageRenderer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders all pages in a vertically-scrollable viewport using the ghost-page
 * strategy: every page container is always present in the DOM; only pages near
 * the current viewport actually mount their content subtree.
 *
 * Props:
 *  pages            {Page[]}   - Array of page objects from usePaginationEngine
 *  currentPageIndex {number}   - 0-based index of the page in view
 *  onPageChange     {function} - Called with the new page index on scroll
 *  renderPage       {function} - (pageIndex, blocks, page) → ReactNode
 *  buffer           {number}   - Pages to render before/after current (default 2)
 *  pageHeight       {number}   - Override page height in px (default A4_HEIGHT_PX)
 *
 * Note: `blocks` prop from v2 is no longer needed — each page object already
 *       carries its own `.blocks` array.
 */
export const VirtualPageRenderer = forwardRef(({
  pages,
  currentPageIndex,
  onPageChange,
  renderPage,
  buffer    = 2,
  pageHeight = A4_HEIGHT_PX,
}, ref) => {
  // Total scroll height so the container reserves the right amount of space.
  const totalScrollHeight = useMemo(
    () => pages.length * (pageHeight + PAGE_GAP_PX) + PAGE_GAP_PX,
    [pages.length, pageHeight],
  );

  return (
    <div
      ref={ref}
      className="athena-document-viewport"
      style={{
        backgroundColor: '#f0f2f5',
        padding:         `${PAGE_GAP_PX}px 0`,
        minHeight:       '100vh',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        // Reserve total scroll space to prevent layout shift
        minHeight:       `${totalScrollHeight}px`,
      }}
    >
      {pages.map((page, index) => {
        // A page is "near visible" if it's within `buffer` pages of the
        // currently-active page.
        const isNearVisible = Math.abs(index - currentPageIndex) <= buffer;

        return (
          <PageItem
            key={page.id ?? `page-${index}`}
            index={index}
            page={page}
            isNearVisible={isNearVisible}
            currentPageIndex={currentPageIndex}
            onPageChange={onPageChange}
            renderPage={renderPage}
            pageHeight={pageHeight}
          />
        );
      })}
    </div>
  );
});

VirtualPageRenderer.displayName = 'VirtualPageRenderer';

// ─────────────────────────────────────────────────────────────────────────────
// useScrollPageTracker
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tracks which page is currently in view by observing scroll position.
 * An alternative to the IntersectionObserver approach inside PageItem —
 * useful when the scroll container is not the window.
 *
 * @param {object[]} pages     - Paginated page array
 * @param {number}   pageHeight - Height of each page (px)
 * @returns {{ currentPageIndex: number, scrollContainerRef: ref }}
 */
export const useScrollPageTracker = (pages, pageHeight = A4_HEIGHT_PX) => {
  const containerRef        = useRef(null);
  const currentPageIndexRef = useRef(0);
  const [currentPage, setCurrentPage] = React.useState(0);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop  = containerRef.current.scrollTop;
    const pageStride = pageHeight + PAGE_GAP_PX;
    const newIndex   = Math.min(
      Math.floor((scrollTop + pageStride / 2) / pageStride),
      pages.length - 1,
    );
    if (newIndex !== currentPageIndexRef.current) {
      currentPageIndexRef.current = newIndex;
      setCurrentPage(newIndex);
    }
  }, [pages.length, pageHeight]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return { currentPageIndex: currentPage, scrollContainerRef: containerRef };
};

// ─────────────────────────────────────────────────────────────────────────────
// Backward-compat re-export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @deprecated Use useVirtualScrollPagination from usePaginationEngine.js instead.
 */
export const useVirtualPagination = (blocks, currentPageIndex, options = {}) => {
  const { bufferSize = 1, maxPages = 50 } = options;
  const start = Math.max(0, currentPageIndex - bufferSize);
  const end   = Math.min(maxPages - 1, currentPageIndex + bufferSize);

  const visiblePages = useMemo(() => {
    const result = [];
    for (let i = start; i <= end; i++) result.push(i);
    return result;
  }, [start, end]);

  return {
    visiblePages,
    visibleRange: { start, end },
    isPageVisible: (i) => i >= start && i <= end,
  };
};

export default VirtualPageRenderer;