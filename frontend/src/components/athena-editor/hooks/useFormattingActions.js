/**
 * useFormattingActions Hook
 * 
 * Centralized text formatting actions for the Athena Editor
 * Handles font, color, alignment, and basic text formatting operations
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { runWithSavedSelection } from '../editor/focusUtils';
import { FONT_SIZES } from '../constants/editorConstants';

/**
 * @typedef {Object} UseFormattingActionsReturn
 * @property {Function} setFontFamily - Set font family
 * @property {Function} setTextColor - Set text color
 * @property {Function} setHighlightColor - Set highlight color
 * @property {Function} clearFormatting - Remove all formatting
 * @property {Function} toggleBulletList - Toggle bullet list
 * @property {Function} toggleOrderedList - Toggle numbered list
 * @property {Function} removeListFormatting - Remove list formatting
 * @property {Function} toggleTaskList - Toggle task list
 * @property {Function} increaseFontSize - Increase font size
 * @property {Function} decreaseFontSize - Decrease font size
 * @property {Function} validateAndSetLink - Validate and insert link
 */

/**
 * useFormattingActions Hook
 * 
 * @param {any} editor - TipTap editor instance
 * @param {Function} setCurrentFont - State setter for current font
 * @param {Function} setCurrentTextColor - State setter for text color
 * @param {Function} setCurrentHighlight - State setter for highlight color
 * @returns {UseFormattingActionsReturn}
 */
const useFormattingActions = (editor, setCurrentFont, setCurrentTextColor, setCurrentHighlight) => {
  /**
   * Set font family with double-RAF for Radix Select compatibility
   */
  const setFontFamily = useCallback((font) => {
    setCurrentFont(font);
    // Double-RAF: fires after Radix Select's own async close frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        runWithSavedSelection(editor, (chain) => chain.setFontFamily(font));
      });
    });
  }, [editor, setCurrentFont]);

  /**
   * Set text color
   */
  const setTextColor = useCallback((color) => {
    setCurrentTextColor(color);
    runWithSavedSelection(editor, (chain) => chain.setColor(color));
  }, [editor, setCurrentTextColor]);

  /**
   * Set highlight color
   */
  const setHighlightColor = useCallback((color) => {
    setCurrentHighlight(color);
    runWithSavedSelection(editor, (chain) => chain.setHighlight({ color }));
  }, [editor, setCurrentHighlight]);

  /**
   * Clear all formatting
   */
  const clearFormatting = useCallback(() => {
    if (!editor) return;
    runWithSavedSelection(editor, (chain) => chain.unsetAllMarks().clearNodes());
    toast.success('Formatting cleared');
  }, [editor]);

  /**
   * Toggle bullet list
   */
  const toggleBulletList = useCallback(() => {
    runWithSavedSelection(editor, (chain) => chain.toggleBulletList());
    toast.success('Bullet list toggled');
  }, [editor]);

  /**
   * Toggle ordered list
   */
  const toggleOrderedList = useCallback(() => {
    runWithSavedSelection(editor, (chain) => chain.toggleOrderedList());
    toast.success('Numbered list toggled');
  }, [editor]);

  /**
   * Remove list formatting
   */
  const removeListFormatting = useCallback(() => {
    runWithSavedSelection(editor, (chain) => chain.liftListItem('listItem'));
    if (editor?.isActive('bulletList') || editor?.isActive('orderedList')) {
      runWithSavedSelection(editor, (chain) => chain.lift('listItem'));
    }
    toast.success('List formatting removed');
  }, [editor]);

  /**
   * Toggle task list
   */
  const toggleTaskList = useCallback(() => {
    runWithSavedSelection(editor, (chain) => chain.toggleTaskList());
    toast.success('Task list toggled');
  }, [editor]);

  /**
   * CRITICAL FIX: Handle custom sizes and provide user feedback at boundaries
   * 
   * PROBLEM: FONT_SIZES.indexOf(currentFontSize) returns -1 if the user typed a custom
   * size (e.g. 13) not in the preset array, causing -1 + 1 = 0 (always jumps to 8pt).
   * Also, when at min/max, function returns silently with no feedback.
   * 
   * SOLUTION: Handle custom sizes intelligently and show toast at boundaries
   */
  const increaseFontSize = useCallback((currentFontSize) => {
    const idx = FONT_SIZES.indexOf(currentFontSize);
    if (idx === -1) {
      // Custom size: find the next preset above it
      const next = FONT_SIZES.find(s => s > currentFontSize);
      if (next) {
        setCurrentFontSize(next);
      } else {
        toast.info('Already at maximum size');
      }
      return;
    }
    if (idx >= FONT_SIZES.length - 1) {
      toast.info('Already at maximum size');
      return;
    }
    setCurrentFontSize(FONT_SIZES[idx + 1]);
  }, [setCurrentFontSize]);

  /**
   * CRITICAL FIX: Handle custom sizes and provide user feedback at boundaries
   */
  const decreaseFontSize = useCallback((currentFontSize) => {
    const idx = FONT_SIZES.indexOf(currentFontSize);
    if (idx === -1) {
      // Custom size: find the next preset below it
      const prev = FONT_SIZES.slice().reverse().find(s => s < currentFontSize);
      if (prev) {
        setCurrentFontSize(prev);
      } else {
        toast.info('Already at minimum size');
      }
      return;
    }
    if (idx <= 0) {
      toast.info('Already at minimum size');
      return;
    }
    setCurrentFontSize(FONT_SIZES[idx - 1]);
  }, [setCurrentFontSize]);

  /**
   * CRITICAL FIX: Centralize all link insertion through validated dialog
   * 
   * PROBLEM: Three separate code paths use window.prompt('Enter URL:') to get a link.
   * window.prompt is blocked by iOS Safari's popup policy and in iframe embeds.
   * None of these paths validate the URL scheme, so javascript:alert(document.cookie)
   * is accepted and stored as a live XSS vector in the document JSON.
   * 
   * SOLUTION: Add URL scheme validation before any setLink call, use dialog instead of prompt
   * 
   * @param {string} href - The URL to validate and insert
   */
  const validateAndSetLink = useCallback((href) => {
    if (!href || !href.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    try {
      // Handle protocol-relative URLs (//example.com)
      const urlToValidate = href.startsWith('//') ? 'https:' + href : href;
      const url = new URL(urlToValidate);

      // Only allow safe protocols
      if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
        toast.error('Only http, https, mailto, and tel links are allowed');
        console.warn('Blocked unsafe URL protocol:', url.protocol, href);
        return;
      }

      // Valid URL - insert it
      runWithSavedSelection(editor, (chain) => chain.setLink({ href: url.href }));
      toast.success('Link inserted');

    } catch (error) {
      console.error('Invalid URL:', error);
      toast.error('Invalid URL format. Please enter a valid URL like https://example.com');
    }
  }, [editor]);

  return {
    setFontFamily,
    setTextColor,
    setHighlightColor,
    clearFormatting,
    toggleBulletList,
    toggleOrderedList,
    removeListFormatting,
    toggleTaskList,
    increaseFontSize,
    decreaseFontSize,
    validateAndSetLink,
  };
};

export default useFormattingActions;
