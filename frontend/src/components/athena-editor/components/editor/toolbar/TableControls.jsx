import React, { useEffect } from 'react';
import {
  Rows,
  Columns,
  Trash2,
  Table2,
  Maximize,
  ArrowRightToLine,
  ArrowLeftToLine,
  CornerDownLeft
} from 'lucide-react';
import { ToolbarButton } from '../../ui/ToolbarButton';
import { Separator } from '../../ui/separator';
import { toast } from 'sonner';

export const TableControls = ({ editor }) => {
  const addTableRow = () => {
    if (editor && editor.can().addRowAfter()) {
      editor.chain().focus().addRowAfter().run();
      toast.success('Row added');
    }
  };

  const addTableColumn = () => {
    if (editor && editor.can().addColumnAfter()) {
      editor.chain().focus().addColumnAfter().run();
      toast.success('Column added');
    }
  };

  const deleteTableRow = () => {
    if (editor && editor.can().deleteRow()) {
      editor.chain().focus().deleteRow().run();
      toast.success('Row deleted');
    }
  };

  const deleteTableColumn = () => {
    if (editor && editor.can().deleteColumn()) {
      editor.chain().focus().deleteColumn().run();
      toast.success('Column deleted');
    }
  };

  const toggleTableHeader = () => {
    if (editor && editor.can().toggleHeaderCell()) {
      editor.chain().focus().toggleHeaderCell().run();
      toast.success('Header toggled');
    }
  };

  const deleteTable = () => {
    if (editor && editor.can().deleteTable()) {
      if (window.confirm('Are you sure you want to delete this table?')) {
        editor.chain().focus().deleteTable().run();
        toast.success('Table deleted');
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e) => {
      const isTableActive = editor.isActive('table') || editor.isActive('tableRow') || editor.isActive('tableCell');
      if (!isTableActive) return;
      
      // Ctrl+Shift+Enter to add row
      if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        addTableRow();
      }
      
      // Ctrl+Alt+Enter to add column
      if (e.ctrlKey && e.altKey && e.key === 'Enter') {
        e.preventDefault();
        addTableColumn();
      }
      
      // Ctrl+Shift+Delete to delete row
      if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
        e.preventDefault();
        deleteTableRow();
      }
      
      // Ctrl+Alt+Delete to delete column
      if (e.ctrlKey && e.altKey && e.key === 'Delete') {
        e.preventDefault();
        deleteTableColumn();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  if (!editor) return null;

  // Only show if cursor is inside a table
  const isTableActive = editor.isActive('table') || editor.isActive('tableRow') || editor.isActive('tableCell');

  if (!isTableActive) return null;

  return (
    <div className="flex items-center gap-1 animate-in fade-in duration-200">
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <ToolbarButton
        onClick={addTableRow}
        icon={Rows}
      />
      
      <ToolbarButton
        onClick={addTableColumn}
        icon={Columns}
      />
      
      <ToolbarButton
        onClick={deleteTableRow}
        icon={ArrowRightToLine} // Approximate icon for deleting row/line
        className="text-red-500 hover:text-red-600 hover:bg-red-50"
      />
      
      <ToolbarButton
        onClick={deleteTableColumn}
        icon={ArrowLeftToLine} // Approximate icon for deleting col
        className="text-red-500 hover:text-red-600 hover:bg-red-50"
      />
      
      <ToolbarButton
        onClick={toggleTableHeader}
        icon={Table2}
      />
      
      <ToolbarButton
        onClick={deleteTable}
        icon={Trash2}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      />
    </div>
  );
};
