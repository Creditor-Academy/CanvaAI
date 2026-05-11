/**
 * useTablePicker Hook
 * 
 * Manages table picker grid state and positioning
 * Handles the floating table size selector UI
 */

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { toast } from 'sonner';
import focusUtils from '../components/editor/focusUtils';

const { onMenuOpen } = focusUtils;

/**
 * @typedef {Object} UseTablePickerReturn
 * @property {boolean} showTablePicker - Whether picker is visible
 * @property {Function} setShowTablePicker - Toggle picker visibility
 * @property {number} selectedRows - Currently selected rows in grid
 * @property {number} selectedCols - Currently selected columns in grid
 * @property {Function} setSelectedRows - Set selected rows
 * @property {Function} setSelectedCols - Set selected columns
 * @property {Object} tablePickerRef - Ref for picker element
 * @property {Object} tableButtonRef - Ref for trigger button
 * @property {Function} handleTablePickerClick - Click handler for table button
 * @property {Function} handleCellHover - Hover handler for grid cells
 * @property {Function} handleInsertTable - Insert selected table size
 */

/**
 * useTablePicker Hook
 * 
 * @param {any} editor - TipTap editor instance
 * @param {Function} runWithSavedSelection - Selection preservation helper
 * @param {Function} preventEditorBlur - Blur prevention helper
 * @returns {UseTablePickerReturn}
 */
const useTablePicker = (editor, runWithSavedSelection, preventEditorBlur) => {
  // State
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [selectedRows, setSelectedRows] = useState(0);
  const [selectedCols, setSelectedCols] = useState(0);

  // Refs
  const tablePickerRef = useRef(null);
  const tableButtonRef = useRef(null);

  /**
   * Handle table button click
   */
  const handleTablePickerClick = useCallback(() => {
    if (editor) {
      onMenuOpen(editor);
      setShowTablePicker(!showTablePicker);

      if (!showTablePicker) {
        toast.info('Select table size');
      }
    }
  }, [editor, showTablePicker]);

  /**
   * Handle cell hover in grid
   */
  const handleCellHover = useCallback((rows, cols) => {
    setSelectedRows(rows);
    setSelectedCols(cols);
  }, []);

  /**
   * Insert table with selected dimensions.
   *
   * CRITICAL: Must use `insertCustomTable` (registered by TableExtension.js,
   * which creates a `customTable` atom node).
   * `insertTable` belongs to @tiptap/extension-table which is NOT used in this
   * project — calling it throws "chain.insertTable is not a function".
   * `withHeaderRow` is also an @tiptap/extension-table-only attribute and must
   * be omitted — CustomTable.jsx handles header styling via its own attrs.
   */
  const handleInsertTable = useCallback(() => {
    if (editor && selectedRows > 0 && selectedCols > 0) {
      preventEditorBlur(() => {
        runWithSavedSelection(editor, (chain) =>
          chain.insertCustomTable({ rows: selectedRows, cols: selectedCols })
        );
        toast.success(`${selectedRows}×${selectedCols} table inserted`);
        setShowTablePicker(false);
        setSelectedRows(0);
        setSelectedCols(0);
      });
    }
  }, [editor, selectedRows, selectedCols, runWithSavedSelection, preventEditorBlur]);

  /**
   * Position the table picker dropdown
   */
  useLayoutEffect(() => {
    if (showTablePicker && tableButtonRef.current && tablePickerRef.current) {
      const buttonRect = tableButtonRef.current.getBoundingClientRect();
      const pickerElement = tablePickerRef.current;

      // CRITICAL FIX: Use position: fixed consistently — no scroll offset needed
      // PROBLEM: Viewport-relative values set as position: fixed offsets drift when
      // user scrolls between opening the picker and hovering over cells.
      // 
      // SOLUTION: Use position: fixed consistently
      pickerElement.style.position = 'fixed';
      pickerElement.style.left = `${buttonRect.left}px`;
      pickerElement.style.top = `${buttonRect.bottom + 8}px`;
    }
  }, [showTablePicker]);

  /**
   * Close table picker on scroll to prevent drift
   */
  useEffect(() => {
    if (!showTablePicker) return;
    const close = () => setShowTablePicker(false);
    window.addEventListener('scroll', close, { passive: true });
    return () => window.removeEventListener('scroll', close);
  }, [showTablePicker]);

  /**
   * Close table picker when clicking outside
   */
  useEffect(() => {
    if (!showTablePicker) return;

    const handleClickOutside = (event) => {
      if (tablePickerRef.current && !tablePickerRef.current.contains(event.target)) {
        const tableContainer = event.target.closest('[data-table-container]') ||
          event.target.closest('[data-table-button]') ||
          event.target.closest('.table-button') ||
          event.target.closest('button[data-icon="table"]') ||
          event.target === tableButtonRef.current;
        if (!tableContainer) {
          setShowTablePicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTablePicker]);

  return {
    showTablePicker,
    setShowTablePicker,
    selectedRows,
    selectedCols,
    setSelectedRows,
    setSelectedCols,
    tablePickerRef,
    tableButtonRef,
    handleTablePickerClick,
    handleCellHover,
    handleInsertTable,
  };
};

export default useTablePicker;