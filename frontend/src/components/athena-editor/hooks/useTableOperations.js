/**
 * useTableOperations Hook
 * 
 * Table row/column CRUD operations
 * Handles all table manipulation commands
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { runWithSavedSelection } from '../editor/focusUtils';

/**
 * @typedef {Object} UseTableOperationsReturn
 * @property {Function} isInsideTable - Check if cursor is in table
 * @property {Function} addTableRow - Add row after current position
 * @property {Function} addTableColumn - Add column after current position
 * @property {Function} deleteTableRow - Delete current row
 * @property {Function} deleteTableColumn - Delete current column
 * @property {Function} toggleTableHeader - Toggle header cell
 * @property {Function} deleteTable - Delete entire table
 */

/**
 * useTableOperations Hook
 * 
 * @param {any} editor - TipTap editor instance
 * @param {Function} runWithSavedSelection - Selection preservation helper
 * @returns {UseTableOperationsReturn}
 */
const useTableOperations = (editor, runWithSavedSelection) => {
  /**
   * Check if cursor is inside a table
   * CRITICAL: Moved to top to avoid initialization issues
   */
  const isInsideTable = useCallback(() => {
    if (!editor) return false;

    try {
      const { state } = editor;
      const { selection } = state;
      const { $from } = selection;

      // Check if selection is inside a table
      for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node && (
          node.type.name === 'table' || 
          node.type.name === 'tableRow' || 
          node.type.name === 'tableCell' || 
          node.type.name === 'customTable'
        )) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking table position:', error);
      return false;
    }
  }, [editor]);

  /**
   * Add table row
   */
  const addTableRow = useCallback(() => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }
    if (editor.can().addRowAfter) {
      runWithSavedSelection(editor, (chain) => chain.addRowAfter());
      toast.success('Row added to table');
    } else {
      toast.error('No table selected or feature not available');
    }
  }, [editor, runWithSavedSelection]);

  /**
   * Add table column
   */
  const addTableColumn = useCallback(() => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }
    if (editor.can().addColumnAfter) {
      runWithSavedSelection(editor, (chain) => chain.addColumnAfter());
      toast.success('Column added to table');
    } else {
      toast.error('No table selected or feature not available');
    }
  }, [editor, runWithSavedSelection]);

  /**
   * Delete table row
   */
  const deleteTableRow = useCallback(() => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }
    if (editor.can().deleteRow) {
      runWithSavedSelection(editor, (chain) => chain.deleteRow());
      toast.success('Row deleted from table');
    } else {
      toast.error('No table selected or feature not available');
    }
  }, [editor, runWithSavedSelection]);

  /**
   * Delete table column
   */
  const deleteTableColumn = useCallback(() => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }
    if (editor.can().deleteColumn) {
      runWithSavedSelection(editor, (chain) => chain.deleteColumn());
      toast.success('Column deleted from table');
    } else {
      toast.error('No table selected or feature not available');
    }
  }, [editor, runWithSavedSelection]);

  /**
   * Toggle table header
   */
  const toggleTableHeader = useCallback(() => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }
    if (editor.can().toggleHeaderCell) {
      runWithSavedSelection(editor, (chain) => chain.toggleHeaderCell());
      toast.success('Table header toggled');
    } else {
      toast.error('No table selected or feature not available');
    }
  }, [editor, runWithSavedSelection]);

  /**
   * Delete entire table
   * Note: Should be wrapped in dialog confirmation before calling
   */
  const deleteTable = useCallback(() => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }
    if (editor.can().deleteTable) {
      runWithSavedSelection(editor, (chain) => chain.deleteTable());
      toast.success('Table deleted');
    } else {
      toast.error('No table selected or feature not available');
    }
  }, [editor, runWithSavedSelection]);

  return {
    isInsideTable,
    addTableRow,
    addTableColumn,
    deleteTableRow,
    deleteTableColumn,
    toggleTableHeader,
    deleteTable,
  };
};

export default useTableOperations;
