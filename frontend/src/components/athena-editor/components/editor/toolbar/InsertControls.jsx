import React, { useState, useRef, useEffect } from 'react';
import ReactDOM, { createPortal } from 'react-dom';
import Portal from '../../ui/Portal';
import {
  Link,
  Image as ImageIcon,
  Table as TableIcon,
  Split,
  FilePlus,
  Minus,
  Upload
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '../../ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Separator } from '../../ui/separator';
import { ToolbarButton } from '../../ui/ToolbarButton';
import { toast } from 'sonner';
import { runWithSavedSelection, preventEditorBlur, saveSelection } from '../focusUtils';

export const InsertControls = ({ editor, handleInsertImage }) => {
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [selectedRows, setSelectedRows] = useState(0);
  const [selectedCols, setSelectedCols] = useState(0);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const tablePickerRef = useRef(null);
  const tableButtonRef = useRef(null);

  if (!editor) return null;

  // Link
  const addLink = () => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = prompt('Enter URL:', previousUrl || '');
    if (url && editor) {
      editor
        .chain()
        .focus()
        .setLink({ href: url })
        .run();
      toast.success('Link added');
    }
  };

  // Image
  const addImage = () => {
    if (handleInsertImage) {
      handleInsertImage();
    } else {
      setShowImageDialog(true);
    }
  };

  const handleUrlImageUpload = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('imageUrl');

    if (url && editor) {
      editor
        .chain()
        .focus()
        .setImage({ src: url })
        .run();
      toast.success('Image added');
      setShowImageDialog(false);
    }
  };

  const handleLocalImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target?.result;
      if (editor && imageDataUrl) {
        editor
          .chain()
          .focus()
          .setImage({ src: imageDataUrl })
          .run();
        toast.success("Image uploaded");
        setShowImageDialog(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Table - Simple implementation using HTML insertion
  const insertTable = (rows, cols) => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }

    try {
      // Close the picker first
      setShowTablePicker(false);
      setSelectedRows(0);
      setSelectedCols(0);

      // Focus editor and insert table using Tiptap command
      const result = editor.chain().focus().insertTable({ rows: rows, cols: cols, withHeaderRow: true }).run();
      
      if (result) {
        toast.success(`${rows}×${cols} table inserted`);
      } else {
        toast.error('Failed to insert table');
      }
    } catch (err) {
      console.error('[InsertControls] Table insertion error:', err);
      toast.error('Could not insert table: ' + err.message);
    }
  };

  const handleTablePickerHover = (row, col) => {
    console.log('[InsertControls] handleTablePickerHover:', row, 'x', col);
    setSelectedRows(row);
    setSelectedCols(col);
  };

  // Position the table picker dropdown
  useEffect(() => {
    if (showTablePicker && tableButtonRef.current && tablePickerRef.current) {
      const buttonRect = tableButtonRef.current.getBoundingClientRect();
      const pickerElement = tablePickerRef.current;

      // Position the dropdown below the button
      pickerElement.style.left = `${buttonRect.left}px`;
      pickerElement.style.top = `${buttonRect.bottom + 8}px`; // 8px margin
    }
  }, [showTablePicker]);

  // Close table picker when clicking outside
  useEffect(() => {
    if (!showTablePicker) return;

    const handleClickOutside = (event) => {
      if (tablePickerRef.current && !tablePickerRef.current.contains(event.target)) {
        const tableContainer = event.target.closest('[data-table-container]') ||
          event.target.closest('[data-table-button]') ||
          event.target.closest('.table-button') ||
          event.target.closest('button[data-icon="table"]');
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

  const renderTablePickerGrid = () => {
    const gridSize = 8;
    const cells = [];

    for (let row = 1; row <= gridSize; row++) {
      for (let col = 1; col <= gridSize; col++) {
        const isSelected = row <= selectedRows && col <= selectedCols;
        cells.push(
          <div
            key={`${row}-${col}`}
            className={`w-4 h-4 border border-gray-300 ${isSelected ? 'bg-blue-500' : 'bg-white'} hover:bg-blue-300 cursor-pointer transition-colors`}
            onMouseEnter={() => handleTablePickerHover(row, col)}
            onClick={(e) => {
              e.stopPropagation();
              console.log('[InsertControls] Grid cell clicked:', row, 'x', col);
              insertTable(row, col);
            }}
          />
        );
      }
    }

    return (
      <div className="mb-4">
        <div className="grid grid-cols-8 gap-px bg-gray-300 p-1 rounded border border-gray-300">
          {cells}
        </div>
        <div className="text-center mt-2 text-sm text-gray-600">
          {selectedRows > 0 && selectedCols > 0 ? `${selectedRows}×${selectedCols} Table` : 'Select table size'}
        </div>
      </div>
    );
  };

  // Breaks
  const addSectionBreak = (type = 'page') => {
    if (editor) {
      editor
        .chain()
        .focus()
        .setHorizontalRule()
        .run();

      toast.success(`Section break (${type}) inserted`);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Link */}
      <ToolbarButton
        onClick={addLink}
        isActive={editor.isActive('link')}
        icon={Link}
      />

      {/* Image */}
      <ToolbarButton
        onClick={addImage}
        icon={ImageIcon}
      />

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogDescription>
              Upload an image or provide a URL.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleLocalImageUpload}
                />
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Upload from computer</span>
              </div>
              <div className="flex flex-col gap-2">
                <form onSubmit={handleUrlImageUpload} className="flex flex-col gap-2 h-full justify-center">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input id="imageUrl" name="imageUrl" placeholder="https://..." />
                  <Button type="submit" size="sm" className="mt-2">Insert from URL</Button>
                </form>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="relative inline-block" data-table-container="true" ref={tableButtonRef}>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            console.log('[InsertControls] Table button clicked');
            setShowTablePicker(!showTablePicker);
          }}
          onMouseDown={(e) => { 
            console.log('[InsertControls] Table button mousedown, preventing default');
            e.preventDefault(); 
            if (editor) saveSelection(editor); 
          }} 
          className="h-8 w-8 p-0 hover:bg-gray-100"
          data-table-button="true"
        >
          <TableIcon className="h-4 w-4" />
        </Button>

        {/* Table Picker Dropdown - Rendered in Portal to escape overflowing containers */}
        {showTablePicker && (
          <Portal>
            <div
              className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200"
              ref={tablePickerRef}
              style={{
                position: 'fixed',
                zIndex: 9999,
                backgroundColor: 'white',
              }}
            >
              {renderTablePickerGrid()}
            </div>
          </Portal>
        )}
      </div>

      {/* Breaks */}
      <ToolbarButton
        onClick={() => addSectionBreak('page')}
        icon={Minus}
      />

      <ToolbarButton
        onClick={() => editor.chain().focus().setPageBreak().run()}
        icon={Split}
      />

      <Separator orientation="vertical" className="h-6 mx-1" />
    </div>
  );
};
