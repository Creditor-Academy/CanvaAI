import React, { useState } from 'react';
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

export const InsertControls = ({ editor, handleInsertImage }) => {
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [selectedRows, setSelectedRows] = useState(0);
  const [selectedCols, setSelectedCols] = useState(0);
  const [showImageDialog, setShowImageDialog] = useState(false);

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

  // Table
  const insertTable = (rows, cols) => {
    if (editor) {
      editor
        .chain()
        .focus()
        .insertTable({ rows: rows, cols: cols, withHeaderRow: true })
        .run();
      toast.success(`${rows}x${cols} table inserted`);
      setShowTablePicker(false);
      setSelectedRows(0);
      setSelectedCols(0);
    }
  };

  const handleTablePickerHover = (row, col) => {
    setSelectedRows(row);
    setSelectedCols(col);
  };

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
            onClick={() => insertTable(row, col)}
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
        tooltip="Add Link"
      />

      {/* Image */}
      <ToolbarButton
        onClick={addImage}
        icon={ImageIcon}
        tooltip="Insert Image"
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
      <Popover open={showTablePicker} onOpenChange={setShowTablePicker}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <TableIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Insert Table</h4>
            <p className="text-sm text-muted-foreground">
              Select table dimensions
            </p>
            {renderTablePickerGrid()}
          </div>
        </PopoverContent>
      </Popover>

      {/* Breaks */}
      <ToolbarButton
        onClick={() => addSectionBreak('page')}
        icon={Minus}
        tooltip="Horizontal Rule"
      />
      
      <ToolbarButton
        onClick={() => editor.chain().focus().setPageBreak().run()}
        icon={Split}
        tooltip="Page Break"
      />

      <Separator orientation="vertical" className="h-6 mx-1" />
    </div>
  );
};
