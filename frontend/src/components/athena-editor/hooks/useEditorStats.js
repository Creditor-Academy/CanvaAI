/**
 * useEditorStats Hook
 * 
 * Tracks and calculates document statistics:
 * - Word count
 * - Character count
 * - Reading time
 * - Document outline (headings)
 * - Content metrics (paragraphs, images, tables)
 * 
 * Optimized with refs to prevent re-renders on every keystroke.
 * 
 * @module useEditorStats
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { estimateTokensFast } from '../../../utils/realtimeTokenCounter';

/**
 * Custom hook for editor statistics
 * 
 * @param {Object} options
 * @param {Object} options.editor - TipTap editor instance
 * @param {number} options.updateDelay - Delay before syncing stats to state (default: 1000ms)
 * @returns {Object} Document statistics and metadata
 */
export function useEditorStats({ editor, updateDelay = 1000 }) {
  // Refs for high-frequency updates (no re-renders)
  const wordCountRef = useRef(0);
  const characterCountRef = useRef(0);
  const readingTimeRef = useRef(0);
  const headingsRef = useRef([]);
  const paragraphsRef = useRef(0);
  const imagesRef = useRef(0);
  const tablesRef = useRef(0);
  const listsRef = useRef([]);
  const imagesDataRef = useRef([]);
  const linksRef = useRef([]);
  const tokenCountRef = useRef(0);

  // State for UI display (updated infrequently)
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [headings, setHeadings] = useState([]);
  const [paragraphs, setParagraphs] = useState(0);
  const [images, setImages] = useState(0);
  const [tables, setTables] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);

  /**
   * Extract document statistics from TipTap document
   * Updates refs only - does NOT trigger re-renders
   */
  const extractStats = useCallback((editorInstance) => {
    if (!editorInstance?.state?.doc) return;

    const text = editorInstance.state.doc.textContent;
    const words = text.trim().split(/\s+/).filter(Boolean).length;

    // Update refs (no re-render)
    wordCountRef.current = words;
    characterCountRef.current = text.length;
    readingTimeRef.current = Math.ceil(words / 200); // 200 WPM reading speed

    // Async token estimation (runs in background, doesn't block sync stats)
    estimateTokensFast(text).then(result => {
      tokenCountRef.current = result.tokens;
    });

    // Extract headings and content structure
    const newHeadings = [];
    let paragraphCount = 0;
    let imageCount = 0;
    let tableCount = 0;
    const newLists = [];
    const newImagesData = [];
    const newLinks = [];

    editorInstance.state.doc.descendants((node, pos) => {
      const type = node.type.name;
      
      if (type === 'heading') {
        newHeadings.push({
          level: node.attrs.level,
          text: node.textContent,
          id: `heading-${pos}`
        });
      } else if (type === 'paragraph') {
        paragraphCount++;
      } else if (type === 'image' || type === 'resizableImage') {
        imageCount++;
        newImagesData.push({
          src: node.attrs.src,
          alt: node.attrs.alt,
          width: node.attrs.width,
          height: node.attrs.height
        });
      } else if (type === 'table' || type === 'customTable') {
        tableCount++;
      } else if (type === 'bulletList' || type === 'orderedList' || type === 'taskList') {
        newLists.push({
          type: type,
          pos: pos
        });
      } else if (type === 'link' || node.marks?.some(m => m.type.name === 'link')) {
        const linkMark = node.marks?.find(m => m.type.name === 'link');
        if (linkMark) {
          newLinks.push({
            href: linkMark.attrs.href,
            text: node.textContent
          });
        }
      }
    });

    // Update all refs
    headingsRef.current = newHeadings;
    paragraphsRef.current = paragraphCount;
    imagesRef.current = imageCount;
    tablesRef.current = tableCount;
    listsRef.current = newLists;
    imagesDataRef.current = newImagesData;
    linksRef.current = newLinks;
  }, []);

  /**
   * Sync refs to React state for UI updates
   * Called periodically, not on every keystroke
   */
  const syncStatsToState = useCallback(() => {
    // Bail out if editor is destroyed
    if (!editor || editor.isDestroyed) {
      return;
    }

    const newWordCount = wordCountRef.current;
    const newCharCount = characterCountRef.current;
    const newReadingTime = readingTimeRef.current;
    const newHeadings = headingsRef.current;
    const newParagraphs = paragraphsRef.current;
    const newImages = imagesRef.current;
    const newTables = tablesRef.current;

    // Only update state if values have changed (prevent unnecessary re-renders)
    setWordCount((prev) => prev !== newWordCount ? newWordCount : prev);
    setCharacterCount((prev) => prev !== newCharCount ? newCharCount : prev);
    setReadingTime((prev) => prev !== newReadingTime ? newReadingTime : prev);
    setHeadings((prev) => {
      // Deep comparison for headings array
      if (prev.length !== newHeadings.length) return newHeadings;
      const changed = prev.some((h, i) => 
        h.level !== newHeadings[i]?.level || 
        h.text !== newHeadings[i]?.text ||
        h.id !== newHeadings[i]?.id
      );
      return changed ? newHeadings : prev;
    });
    setParagraphs((prev) => prev !== newParagraphs ? newParagraphs : prev);
    setImages((prev) => prev !== newImages ? newImages : prev);
    setTables((prev) => prev !== newTables ? newTables : prev);
    
    const newTokenCount = tokenCountRef.current;
    setTokenCount((prev) => prev !== newTokenCount ? newTokenCount : prev);
  }, [editor]);

  /**
   * Set up periodic stats synchronization
   * Updates UI every `updateDelay` ms
   */
  useEffect(() => {
    // Initial sync
    if (editor && !editor.isDestroyed) {
      extractStats(editor);
      syncStatsToState();
    }

    // Set up interval to sync periodically
    const intervalId = setInterval(() => {
      if (editor && !editor.isDestroyed) {
        extractStats(editor);
        syncStatsToState();
      }
    }, updateDelay);

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
      console.log('🧹 Cleaned up stats sync interval');
    };
  }, [editor, extractStats, syncStatsToState, updateDelay]);

  /**
   * Force immediate stats update
   * Useful after major content changes
   */
  const forceUpdateStats = useCallback(() => {
    if (editor && !editor.isDestroyed) {
      extractStats(editor);
      syncStatsToState();
    }
  }, [editor, extractStats, syncStatsToState]);

  return {
    // Stats (reactive)
    wordCount,
    characterCount,
    readingTime,
    headings,
    paragraphs,
    images,
    tables,
    tokenCount,
    
    // Raw refs (for internal use without re-renders)
    refs: {
      wordCountRef,
      characterCountRef,
      readingTimeRef,
      headingsRef,
      paragraphsRef,
      imagesRef,
      tablesRef,
      listsRef,
      imagesDataRef,
      linksRef,
      tokenCountRef,
    },
    
    // Helpers
    extractStats,
    forceUpdateStats,
  };
}
