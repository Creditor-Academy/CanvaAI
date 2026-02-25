import React from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  List, ListOrdered, ListChecks, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ArrowRightToLine, ArrowLeftToLine,
  X,
  Superscript, Subscript
} from 'lucide-react';
import { ToolbarButton } from '../../ui/ToolbarButton';
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../ui/dropdown-menu';
import { toast } from 'sonner';

export const FormatControls = ({ editor }) => {
  if (!editor) return null;

  const handleFormatAction = (format) => {
    switch (format) {
      case 'bold': editor.chain().focus().toggleBold().run(); break;
      case 'italic': editor.chain().focus().toggleItalic().run(); break;
      case 'underline': editor.chain().focus().toggleUnderline().run(); break;
      case 'strike': editor.chain().focus().toggleStrike().run(); break;
      case 'superscript': editor.chain().focus().toggleSuperscript().run(); break;
      case 'subscript': editor.chain().focus().toggleSubscript().run(); break;
    }
  };

  const toggleOrderedList = () => {
    editor.chain().focus().toggleOrderedList().run();
    toast.success('Numbered list toggled');
  };
  const toggleBulletList = () => {
    editor.chain().focus().toggleBulletList().run();
    toast.success('Bullet list toggled');
  };
  const toggleTaskList = () => {
    editor.chain().focus().toggleTaskList().run();
    toast.success('Task list toggled');
  };
  const removeListFormatting = () => {
    editor.chain().focus().liftListItem('listItem').run();
    if (editor.isActive('bulletList') || editor.isActive('orderedList')) {
      editor.chain().focus().lift('listItem').run();
    }
    toast.success('List formatting removed');
  };
  const hasListFormatting = () => editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList');

  const setTextAlign = (align) => editor.chain().focus().setTextAlign(align).run();
  const removeTextAlignment = () => {
    editor.chain().focus().unsetTextAlign().run();
    toast.success('Text alignment removed');
  };
  const hasTextAlignment = () => editor.isActive({ textAlign: 'center' }) || editor.isActive({ textAlign: 'right' }) || editor.isActive({ textAlign: 'justify' });

  const indent = () => {
    try {
      if (editor.isActive('listItem')) {
        const result = editor.chain().focus().sinkListItem('listItem').run();
        if (result) {
          toast.success('List item indented');
        }
      } else {
        const result = editor.chain().focus().indent().run();
        if (result) {
          toast.success('Text indented');
        }
      }
    } catch (error) {
      console.error('Indent error:', error);
      toast.error('Failed to indent text');
    }
  };
  const outdent = () => {
    try {
      if (editor.isActive('listItem')) {
        const result = editor.chain().focus().liftListItem('listItem').run();
        if (result) {
          toast.success('List item outdented');
        }
      } else {
        const result = editor.chain().focus().outdent().run();
        if (result) {
          toast.success('Text outdented');
        }
      }
    } catch (error) {
      console.error('Outdent error:', error);
      toast.error('Failed to outdent text');
    }
  };

  return (
    <div className="flex items-center gap-1">
      <ToolbarButton onClick={() => handleFormatAction('bold')} isActive={editor.isActive("bold")} tooltip="Bold (Ctrl+B)">
        <Bold className="w-4 h-4 text-blue-600" />
      </ToolbarButton>
      <ToolbarButton onClick={() => handleFormatAction('italic')} isActive={editor.isActive("italic")} tooltip="Italic (Ctrl+I)">
        <Italic className="w-4 h-4 text-blue-600" />
      </ToolbarButton>
      <ToolbarButton onClick={() => handleFormatAction('underline')} isActive={editor.isActive("underline")} tooltip="Underline (Ctrl+U)">
        <Underline className="w-4 h-4 text-blue-600" />
      </ToolbarButton>
      <ToolbarButton onClick={() => handleFormatAction('strike')} isActive={editor.isActive("strike")} tooltip="Strikethrough">
        <Strikethrough className="w-4 h-4 text-blue-600" />
      </ToolbarButton>
      
      <ToolbarButton onClick={() => handleFormatAction('superscript')} isActive={editor.isActive("superscript")} tooltip="Superscript">
        <Superscript className="w-4 h-4 text-blue-600" />
      </ToolbarButton>

      <ToolbarButton onClick={() => handleFormatAction('subscript')} isActive={editor.isActive("subscript")} tooltip="Subscript">
        <Subscript className="w-4 h-4 text-blue-600" />
      </ToolbarButton>
      
      <Separator orientation="vertical" className="mx-2 h-5" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-lg transition-all duration-300 ${hasListFormatting() ? "bg-green-100 text-green-700 border-green-300" : "bg-blue-50 text-blue-600"}`}>
            <List className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 bg-white z-[100] shadow-lg border border-gray-200 rounded-md p-1">
          <DropdownMenuItem onClick={toggleOrderedList}>
            <ListOrdered className="w-4 h-4 mr-2" /> Numbered List {editor.isActive("orderedList") && "✓"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleBulletList}>
            <List className="w-4 h-4 mr-2" /> Bullet List {editor.isActive("bulletList") && "✓"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleTaskList}>
            <ListChecks className="w-4 h-4 mr-2" /> Task List {editor.isActive("taskList") && "✓"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={removeListFormatting} disabled={!hasListFormatting()}>
            <X className="w-4 h-4 mr-2 text-red-500" /> Remove List Formatting
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-2 h-5" />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-lg transition-all duration-300 ${hasTextAlignment() || editor.isActive({ textAlign: 'left' }) ? "bg-green-100 text-green-700 border-green-300" : "bg-blue-50 text-blue-600"}`}>
            <AlignLeft className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 bg-white z-[100] shadow-lg border border-gray-200 rounded-md p-1">
          <DropdownMenuItem onClick={() => setTextAlign('left')}>
            <AlignLeft className="w-4 h-4 mr-2" /> Align Left {editor.isActive({ textAlign: 'left' }) && "✓"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTextAlign('center')}>
            <AlignCenter className="w-4 h-4 mr-2" /> Align Center {editor.isActive({ textAlign: 'center' }) && "✓"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTextAlign('right')}>
            <AlignRight className="w-4 h-4 mr-2" /> Align Right {editor.isActive({ textAlign: 'right' }) && "✓"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTextAlign('justify')}>
            <AlignJustify className="w-4 h-4 mr-2" /> Justify {editor.isActive({ textAlign: 'justify' }) && "✓"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={removeTextAlignment} disabled={!hasTextAlignment()}>
            <X className="w-4 h-4 mr-2 text-red-500" /> Remove Alignment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Separator orientation="vertical" className="mx-2 h-5" />
      
      <ToolbarButton onClick={indent} tooltip="Increase Indent">
        <ArrowRightToLine className="w-4 h-4 text-blue-600" />
      </ToolbarButton>
      <ToolbarButton onClick={outdent} tooltip="Decrease Indent">
        <ArrowLeftToLine className="w-4 h-4 text-blue-600" />
      </ToolbarButton>
    </div>
  );
};
