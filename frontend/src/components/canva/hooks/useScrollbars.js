import { useState, useCallback, useEffect, useRef } from 'react';
import { SCROLLER_THICKNESS, SCROLLER_MARGIN, initialScrollMetrics } from '../state/initialState';

/**
 * Custom hook for managing custom scrollbars
 */
export const useScrollbars = (canvasAreaRef, contentWrapperRef, zoom, pan, canvasSize, layers, hasChosenTemplate) => {
  const [scrollMetrics, setScrollMetrics] = useState(initialScrollMetrics);
  const hDragRef = useRef({ isDragging: false, startX: 0, startScrollLeft: 0 });
  const vDragRef = useRef({ isDragging: false, startY: 0, startScrollTop: 0 });

  const updateScrollMetrics = useCallback(() => {
    const area = canvasAreaRef.current;
    const contentEl = contentWrapperRef.current;
    if (!area || !contentEl) return;

    const contentWidth = contentEl.scrollWidth || contentEl.offsetWidth || 0;
    const contentHeight = contentEl.scrollHeight || contentEl.offsetHeight || 0;
    const viewportWidth = area.clientWidth;
    const viewportHeight = area.clientHeight;
    const scrollLeft = area.scrollLeft;
    const scrollTop = area.scrollTop;

    const showH = contentWidth > viewportWidth + 1;
    const showV = contentHeight > viewportHeight + 1;

    const hTrackLen = Math.max(0, viewportWidth - (showV ? SCROLLER_THICKNESS + SCROLLER_MARGIN : 0) - SCROLLER_MARGIN * 2);
    const vTrackLen = Math.max(0, viewportHeight - (showH ? SCROLLER_THICKNESS + SCROLLER_MARGIN : 0) - SCROLLER_MARGIN * 2);

    const minThumb = 24;
    const hThumbSize = !showH ? 0 : Math.max(minThumb, Math.floor((viewportWidth / contentWidth) * hTrackLen));
    const vThumbSize = !showV ? 0 : Math.max(minThumb, Math.floor((viewportHeight / contentHeight) * vTrackLen));

    const hScrollable = Math.max(1, contentWidth - viewportWidth);
    const vScrollable = Math.max(1, contentHeight - viewportHeight);
    const hMovable = Math.max(0, hTrackLen - hThumbSize);
    const vMovable = Math.max(0, vTrackLen - vThumbSize);

    const hThumbPos = !showH ? 0 : Math.min(hMovable, Math.floor((scrollLeft / hScrollable) * hMovable));
    const vThumbPos = !showV ? 0 : Math.min(vMovable, Math.floor((scrollTop / vScrollable) * vMovable));

    setScrollMetrics({
      contentWidth,
      contentHeight,
      viewportWidth,
      viewportHeight,
      scrollLeft,
      scrollTop,
      hThumbSize,
      vThumbSize,
      hThumbPos,
      vThumbPos,
      showH,
      showV
    });
  }, []);

  useEffect(() => {
    updateScrollMetrics();
  }, [zoom, pan, canvasSize.width, canvasSize.height, layers.length, hasChosenTemplate, updateScrollMetrics]);

  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!area) return;
    const onScroll = () => updateScrollMetrics();
    area.addEventListener('scroll', onScroll, { passive: true });
    const onResize = () => updateScrollMetrics();
    window.addEventListener('resize', onResize);
    let ro;
    if ('ResizeObserver' in window && contentWrapperRef.current) {
      ro = new ResizeObserver(() => updateScrollMetrics());
      ro.observe(contentWrapperRef.current);
    }
    updateScrollMetrics();
    return () => {
      area.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
    };
  }, [updateScrollMetrics, canvasAreaRef, contentWrapperRef]);

  useEffect(() => {
    const onMouseMove = (e) => {
      const area = canvasAreaRef.current;
      if (!area) return;
      
      if (hDragRef.current.isDragging) {
        e.preventDefault();
        const { startX, startScrollLeft } = hDragRef.current;
        const dx = e.clientX - startX;
        const hTrackLen = Math.max(0, scrollMetrics.viewportWidth - (scrollMetrics.showV ? SCROLLER_THICKNESS + SCROLLER_MARGIN : 0) - SCROLLER_MARGIN * 2);
        const movable = Math.max(1, hTrackLen - scrollMetrics.hThumbSize);
        const scrollable = Math.max(1, scrollMetrics.contentWidth - scrollMetrics.viewportWidth);
        const scrollDelta = (dx / movable) * scrollable;
        area.scrollLeft = Math.min(scrollable, Math.max(0, startScrollLeft + scrollDelta));
        updateScrollMetrics();
      }
      
      if (vDragRef.current.isDragging) {
        e.preventDefault();
        const { startY, startScrollTop } = vDragRef.current;
        const dy = e.clientY - startY;
        const vTrackLen = Math.max(0, scrollMetrics.viewportHeight - (scrollMetrics.showH ? SCROLLER_THICKNESS + SCROLLER_MARGIN : 0) - SCROLLER_MARGIN * 2);
        const movable = Math.max(1, vTrackLen - scrollMetrics.vThumbSize);
        const scrollable = Math.max(1, scrollMetrics.contentHeight - scrollMetrics.viewportHeight);
        const scrollDelta = (dy / movable) * scrollable;
        area.scrollTop = Math.min(scrollable, Math.max(0, startScrollTop + scrollDelta));
        updateScrollMetrics();
      }
    };

    const onMouseUp = () => {
      if (hDragRef.current.isDragging || vDragRef.current.isDragging) {
        hDragRef.current.isDragging = false;
        vDragRef.current.isDragging = false;
        document.body.style.cursor = 'default';
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [scrollMetrics, updateScrollMetrics]);

  const handleHThumbMouseDown = useCallback((e) => {
    e.preventDefault();
    const area = canvasAreaRef.current;
    if (!area) return;
    hDragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startScrollLeft: area.scrollLeft
    };
    document.body.style.cursor = 'grabbing';
  }, []);

  const handleVThumbMouseDown = useCallback((e) => {
    e.preventDefault();
    const area = canvasAreaRef.current;
    if (!area) return;
    vDragRef.current = {
      isDragging: true,
      startY: e.clientY,
      startScrollTop: area.scrollTop
    };
    document.body.style.cursor = 'grabbing';
  }, []);

  const handleHTrackClick = useCallback((e) => {
    const area = canvasAreaRef.current;
    if (!area) return;
    const track = e.currentTarget;
    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left - SCROLLER_MARGIN;
    const hTrackLen = Math.max(0, scrollMetrics.viewportWidth - (scrollMetrics.showV ? SCROLLER_THICKNESS + SCROLLER_MARGIN : 0) - SCROLLER_MARGIN * 2);
    const movable = Math.max(1, hTrackLen - scrollMetrics.hThumbSize);
    const ratio = Math.min(1, Math.max(0, clickX / movable));
    const scrollable = Math.max(0, scrollMetrics.contentWidth - scrollMetrics.viewportWidth);
    area.scrollLeft = Math.floor(ratio * scrollable);
    updateScrollMetrics();
  }, [scrollMetrics, updateScrollMetrics]);

  const handleVTrackClick = useCallback((e) => {
    const area = canvasAreaRef.current;
    if (!area) return;
    const track = e.currentTarget;
    const rect = track.getBoundingClientRect();
    const clickY = e.clientY - rect.top - SCROLLER_MARGIN;
    const vTrackLen = Math.max(0, scrollMetrics.viewportHeight - (scrollMetrics.showH ? SCROLLER_THICKNESS + SCROLLER_MARGIN : 0) - SCROLLER_MARGIN * 2);
    const movable = Math.max(1, vTrackLen - scrollMetrics.vThumbSize);
    const ratio = Math.min(1, Math.max(0, clickY / movable));
    const scrollable = Math.max(0, scrollMetrics.contentHeight - scrollMetrics.viewportHeight);
    area.scrollTop = Math.floor(ratio * scrollable);
    updateScrollMetrics();
  }, [scrollMetrics, updateScrollMetrics]);

  return {
    scrollMetrics,
    handleHThumbMouseDown,
    handleVThumbMouseDown,
    handleHTrackClick,
    handleVTrackClick
  };
};
