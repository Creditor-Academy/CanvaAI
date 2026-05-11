/**
 * useTableOperations Hook
 *
 * Table row/column CRUD operations for the `customTable` atom node
 * (TableExtension.js / CustomTable.jsx).
 *
 * ARCHITECTURE NOTE — why these commands differ from @tiptap/extension-table:
 * ─────────────────────────────────────────────────────────────────────────────
 * The project uses a custom `customTable` node with `atom: true`.
 * Atom nodes have no ProseMirror children — all data lives in node.attrs:
 *   { rows, cols, cells: string[][] }
 *
 * Commands like addRowAfter, addColumnAfter, deleteRow, deleteColumn,
 * toggleHeaderCell, and deleteTable all belong to @tiptap/extension-table
 * and do NOT exist in this schema. Calling them throws
 * "chain.X is not a function" or silently returns false.
 *
 * Fix: every operation reads the current attrs, mutates the cells array,
 * and writes back via editor.commands.updateAttributes / insertContent /
 * deleteSelection. This keeps the ProseMirror transaction model intact.
 */

import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Find the customTable node nearest to the current selection.
 * Returns { node, pos } or null if cursor is not inside one.
 */
function findCustomTableAtSelection(editor) {
  if (!editor) return null;
  const { state } = editor;
  const { selection } = state;
  const { $from } = selection;

  // Walk up the ancestor chain
  for (let depth = $from.depth; depth >= 0; depth--) {
    const node = $from.node(depth);
    if (node?.type.name === 'customTable') {
      return { node, pos: $from.before(depth) };
    }
  }

  // Also check if the selection IS directly on the atom node
  const { from } = selection;
  const resolved = state.doc.resolve(from);
  for (let d = resolved.depth; d >= 0; d--) {
    const n = resolved.node(d);
    if (n?.type.name === 'customTable') {
      return { node: n, pos: resolved.before(d) };
    }
  }

  return null;
}

/**
 * useTableOperations Hook
 *
 * @param {any} editor - TipTap editor instance
 * @returns {UseTableOperationsReturn}
 */
const useTableOperations = (editor) => {
  /**
   * Check if cursor is inside (or on) a customTable node.
   */
  const isInsideTable = useCallback(() => {
    return findCustomTableAtSelection(editor) !== null;
  }, [editor]);

  /**
   * Internal helper: update attrs of the nearest customTable.
   * Returns true on success, false if no table found.
   */
  const updateTableAttrs = useCallback((updater) => {
    if (!editor) return false;
    const found = findCustomTableAtSelection(editor);
    if (!found) {
      toast.error('Place the cursor inside a table first');
      return false;
    }
    const { node, pos } = found;
    const newAttrs = updater(node.attrs);
    if (!newAttrs) return false;

    const { state, view } = editor;
    const tr = state.tr.setNodeMarkup(pos, null, newAttrs);
    view.dispatch(tr);
    return true;
  }, [editor]);

  /**
   * Add a row after the last row.
   * Appends a new empty row to node.attrs.cells and increments rows.
   */
  const addTableRow = useCallback(() => {
    const ok = updateTableAttrs(({ rows, cols, cells, ...rest }) => {
      const newRow = Array.from({ length: cols }, () => '');
      return {
        ...rest,
        rows: rows + 1,
        cols,
        cells: [...(cells || []), newRow],
      };
    });
    if (ok) toast.success('Row added');
  }, [updateTableAttrs]);

  /**
   * Delete the last row.
   * Removes the last entry from cells and decrements rows.
   * Prevents deleting the only remaining row.
   */
  const deleteTableRow = useCallback(() => {
    const ok = updateTableAttrs(({ rows, cols, cells, ...rest }) => {
      if (rows <= 1) {
        toast.error('Table must have at least one row');
        return null;
      }
      return {
        ...rest,
        rows: rows - 1,
        cols,
        cells: (cells || []).slice(0, rows - 1),
      };
    });
    if (ok) toast.success('Last row deleted');
  }, [updateTableAttrs]);

  /**
   * Add a column after the last column.
   * Appends an empty string to every row in cells and increments cols.
   */
  const addTableColumn = useCallback(() => {
    const ok = updateTableAttrs(({ rows, cols, cells, ...rest }) => {
      return {
        ...rest,
        rows,
        cols: cols + 1,
        cells: (cells || []).map(row => [...row, '']),
      };
    });
    if (ok) toast.success('Column added');
  }, [updateTableAttrs]);

  /**
   * Delete the last column.
   * Removes the last element from every row and decrements cols.
   * Prevents deleting the only remaining column.
   */
  const deleteTableColumn = useCallback(() => {
    const ok = updateTableAttrs(({ rows, cols, cells, ...rest }) => {
      if (cols <= 1) {
        toast.error('Table must have at least one column');
        return null;
      }
      return {
        ...rest,
        rows,
        cols: cols - 1,
        cells: (cells || []).map(row => row.slice(0, cols - 1)),
      };
    });
    if (ok) toast.success('Last column deleted');
  }, [updateTableAttrs]);

  /**
   * Toggle header styling.
   * customTable uses a flat fontWeight attr for the entire table.
   * Toggling bold on the first row is approximated by toggling fontWeight.
   */
  const toggleTableHeader = useCallback(() => {
    const ok = updateTableAttrs((attrs) => ({
      ...attrs,
      fontWeight: attrs.fontWeight === 'bold' ? 'normal' : 'bold',
    }));
    if (ok) toast.success('Table header style toggled');
  }, [updateTableAttrs]);

  /**
   * Delete the entire customTable node from the document.
   */
  const deleteTable = useCallback(() => {
    if (!editor) return;
    const found = findCustomTableAtSelection(editor);
    if (!found) {
      toast.error('Place the cursor inside a table first');
      return;
    }
    const { node, pos } = found;
    const { state, view } = editor;
    const tr = state.tr.delete(pos, pos + node.nodeSize);
    view.dispatch(tr);
    toast.success('Table deleted');
  }, [editor]);

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