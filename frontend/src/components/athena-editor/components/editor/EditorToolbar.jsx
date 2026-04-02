/**
 * EditorToolbar Component
 * 
 * Main toolbar for the Athena Editor
 * Contains all formatting controls, insert menus, and view options
 * 
 * NOTE: This component has been extracted from TextEditor.jsx (lines 480-4720)
 * during Phase 2 refactoring to improve maintainability and separation of concerns.
 */

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import ToolbarButton from '../toolbar/ToolbarButton';
import { FONTS, FONT_SIZES, TEXT_COLORS, HIGHLIGHT_COLORS, TONES, CODE_LANGUAGES, EXPORT_FORMATS } from '../../constants/editorConstants';
import useFormattingActions from '../../hooks/useFormattingActions';
import useTablePicker from '../../hooks/useTablePicker';
import useTableOperations from '../../hooks/useTableOperations';
import { guardToolbarMouseDown, runWithSavedSelection, preventEditorBlur } from '../editor/focusUtils';

// Icon imports - keeping all original icons
import {
  Bold, Italic, Underline, Strikethrough, Code, List, ListOrdered, Quote,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Link, Image, Table,
  Highlighter, Undo, Redo, Minus, Printer, Search, Type, Plus,
  RemoveFormatting, Subscript, Superscript, Ruler, Columns, X, FileText,
  Edit3, Eye, Settings, HelpCircle, Sparkles, Save, FolderOpen, Download,
  Scissors, Copy, CheckSquare, Replace, SpellCheck, Hash, ZoomIn, ZoomOut,
  Maximize2, PanelLeft, MessageSquare, Moon, Calendar, Clock, Sigma,
  Calculator, Square, Circle, Star, Palette, Paintbrush, Heading, Text,
  BarChart, Languages, ListChecks, History, Keyboard, Info, FilePlus2,
  LayoutTemplate, Grid3x3, IndentIncrease, IndentDecrease, Rows, Wand2,
  Table2, Bookmark, Mail, Tag, Terminal, Droplet, Maximize, RotateCw,
  Crop, ArrowRightToLine, ArrowLeftToLine, FilePlus, CornerDownLeft, Split,
  Code2, Clipboard, Brain, Trash2, ChevronDown, Play, RefreshCw, BookOpen,
  Check, FileEdit, RotateCcw, Droplets, Smile, Upload
} from 'lucide-react';

import {
  Popover, PopoverContent, PopoverTrigger
} from "../ui/popover";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuShortcut,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel
} from "../ui/dropdown-menu";

import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { cn } from "../utils";
import IndentControls from './toolbar/IndentControls.jsx';

/**
 * @typedef {Object} EditorToolbarProps
 * @property {any} editor - TipTap editor instance
 * @property {number} zoom - Current zoom level
 * @property {Function} onZoomChange - Zoom change handler
 * @property {Function} onSave - Save handler
 * @property {Function} handleInsertImage - Image insert handler
 * @property {Function} setShowReferencesPanel - References panel toggle
 * @property {string} documentTitle - Document title
 * @property {Function} onPrint - Print handler
 * @property {Function} setShowFormatMenu - Format menu toggle
 * @property {boolean} showInsertMenu - Insert menu visibility
 * @property {Function} setShowInsertMenu - Insert menu toggle
 * @property {Function} addNewPage - Add new page handler
 * @property {Function} addPageBreak - Add page break handler
 * @property {Function} insertPageNumber - Insert page number handler
 * @property {Function} handleHeadingChange - Heading change handler
 * @property {number} activeHeadingLevel - Active heading level
 * @property {Function} onGenerateDocument - Generate document handler
 * @property {Function} onAIInlineAction - AI inline action handler
 * @property {Function} onCodeAssistant - Code assistant handler
 * @property {Function} onExport - Export handler
 * @property {boolean} isTemplateSidebarOpen - Template sidebar state
 * @property {Function} setIsTemplateSidebarOpen - Template sidebar toggle
 * @property {Function} navigateTo - Navigation handler
 * @property {boolean} exportLoading - Export loading state
 * @property {Function} toggleBlockquote - Blockquote toggle handler
 * @property {Function} setShowAIAssistant - AI assistant toggle
 * @property {Function} setContentInertProp - Content inert setter
 * @property {Function} onSetContentInert - Legacy content inert setter
 * @property {string} [className] - Additional CSS classes
 */

/**
 * EditorToolbar Component
 * 
 * @param {EditorToolbarProps} props
 * @returns {JSX.Element}
 */
export const EditorToolbar = ({
  editor,
  zoom,
  onZoomChange,
  onSave,
  handleInsertImage,
  setShowReferencesPanel,
  documentTitle,
  onPrint,
  setShowFormatMenu,
  showInsertMenu,
  setShowInsertMenu,
  addNewPage,
  addPageBreak,
  insertPageNumber,
  handleHeadingChange,
  activeHeadingLevel,
  onGenerateDocument,
  onAIInlineAction,
  onCodeAssistant,
  onExport,
  // Template Sidebar
  setIsTemplateSidebarOpen,
  isTemplateSidebarOpen,
  // Routing
  navigateTo,
  // Export Loading State
  exportLoading,
  // Blockquote function
  toggleBlockquote,
  // AI Assistant opener — drives the panel in TextEditorContent
  setShowAIAssistant,
  // Content inert function for accessibility
  setContentInertProp,
  // Legacy alias accepted from parent via onSetContentInert prop
  onSetContentInert,
  className
}) => {
  // Resolve setContentInert from whichever prop name the parent passes.
  // Fallback to no-op so calls never throw even if neither is provided.
  const setContentInert = React.useCallback((open) => {
    if (typeof onSetContentInert === 'function') onSetContentInert(open);
    else if (typeof setContentInertProp === 'function') setContentInertProp(open);
  }, [onSetContentInert, setContentInertProp]);

  // 🔥 Hook states moved above early return (Rules of Hooks)
  const [linkUrl, setLinkUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [showNewDocConfirm, setShowNewDocConfirm] = useState(false);

  // 🔥 Dialog states for replacing window.prompt/confirm
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrlValue, setLinkUrlValue] = useState('');
  const [symbolDialogOpen, setSymbolDialogOpen] = useState(false);
  const [symbolValue, setSymbolValue] = useState('©');
  const [deleteTableDialogOpen, setDeleteTableDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const [currentFontSize, setCurrentFontSizeState] = useState(11);
  const [currentFont, setCurrentFont] = useState("Arial");
  const [currentTextColor, setCurrentTextColor] = useState("#000000");
  const [currentHighlight, setCurrentHighlight] = useState("#ffff00");
  const [lineSpacing, setLineSpacing] = useState(1.15);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);

  // ============================================================
  // CUSTOM HOOKS - Extracted logic from original component
  // ============================================================

  // Formatting actions hook
  const formatting = useFormattingActions(
    editor,
    setCurrentFont,
    setCurrentTextColor,
    setCurrentHighlight
  );

  // Table picker hook
  const tablePicker = useTablePicker(editor, runWithSavedSelection, preventEditorBlur);

  // Table operations hook
  const tableOps = useTableOperations(editor, runWithSavedSelection);

  // ============================================================
  // HELPER FUNCTIONS - Preserved from original implementation
  // ============================================================

  // Font size helpers (using constants from editorConstants.js)
  const increaseFontSize = () => formatting.increaseFontSize(currentFontSize);
  const decreaseFontSize = () => formatting.decreaseFontSize(currentFontSize);

  const setCurrentFontSize = (size) => {
    setCurrentFontSizeState(size);
    if (editor) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          runWithSavedSelection(editor, (chain) => chain.setFontSize(`${size}px`));
        });
      });
    }
  };

  // Link dialog handlers
  const handleLinkDialogConfirm = () => {
    if (linkUrlValue && editor) {
      formatting.validateAndSetLink(linkUrlValue);
      setLinkDialogOpen(false);
    }
  };

  const handleSymbolDialogConfirm = () => {
    if (symbolValue && editor) {
      runWithSavedSelection(editor, (chain) => chain.insertContent(symbolValue));
      toast.success('Symbol inserted');
      setSymbolDialogOpen(false);
    }
  };

  const handleDeleteTableDialogConfirm = () => {
    if (editor && editor.can().deleteTable) {
      tableOps.deleteTable();
      setDeleteTableDialogOpen(false);
    }
  };

  const handleRenameDialogConfirm = async () => {
    if (renameValue && renameValue.trim()) {
      try {
        // Note: Actual rename logic should be implemented here
        toast.success('Document renamed');
        setRenameDialogOpen(false);
      } catch (error) {
        toast.error('Failed to rename document');
      }
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setShowSearch(false);
  };

  // ============================================================
  // RENDER - Toolbar UI
  // ============================================================

  return (
    <>
      {/* Main Toolbar Container */}
      <div className={cn("w-full bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-wrap", className)}>
        
        {/* File Operations Group */}
        <div className="flex items-center gap-1 border-r pr-2">
          <ToolbarButton
            editor={editor}
            onClick={onSave}
            tooltip="Save (Ctrl+S)"
            ariaLabel="Save document"
          >
            <Save className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            editor={editor}
            onClick={() => navigateTo('/documents')}
            tooltip="Open Document"
            ariaLabel="Open document"
          >
            <FolderOpen className="w-4 h-4" />
          </ToolbarButton>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToolbarButton
                editor={editor}
                tooltip="Export"
                ariaLabel="Export document"
              >
                <Download className="w-4 h-4" />
                <ChevronDown className="w-3 h-3 ml-1" />
              </ToolbarButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Export As</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {EXPORT_FORMATS.map((format) => (
                <DropdownMenuItem
                  key={format.value}
                  onClick={() => onExport(format.value)}
                  disabled={exportLoading}
                >
                  <format.icon className="w-4 h-4 mr-2" />
                  {format.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <ToolbarButton
            editor={editor}
            onClick={onPrint}
            tooltip="Print (Ctrl+P)"
            ariaLabel="Print document"
          >
            <Printer className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Undo/Redo Group */}
        <div className="flex items-center gap-1 border-r pr-2">
          <ToolbarButton
            editor={editor}
            onClick={() => editor?.chain().focus().undo().run()}
            tooltip="Undo (Ctrl+Z)"
            ariaLabel="Undo"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            editor={editor}
            onClick={() => editor?.chain().focus().redo().run()}
            tooltip="Redo (Ctrl+Y)"
            ariaLabel="Redo"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Font Family & Size */}
        <div className="flex items-center gap-2 border-r pr-2">
          <Select value={currentFont} onValueChange={formatting.setFontFamily}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentFontSize.toString()}
            onValueChange={(val) => setCurrentFontSize(parseInt(val))}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}pt
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r pr-2">
          <ToolbarButton
            editor={editor}
            onClick={() => editor?.chain().focus(null, { scrollIntoView: false }).toggleBold().run()}
            isActive={editor?.isActive('bold')}
            tooltip="Bold (Ctrl+B)"
            ariaLabel="Bold"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            editor={editor}
            onClick={() => editor?.chain().focus(null, { scrollIntoView: false }).toggleItalic().run()}
            isActive={editor?.isActive('italic')}
            tooltip="Italic (Ctrl+I)"
            ariaLabel="Italic"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            editor={editor}
            onClick={() => editor?.chain().focus(null, { scrollIntoView: false }).toggleUnderline().run()}
            isActive={editor?.isActive('underline')}
            tooltip="Underline (Ctrl+U)"
            ariaLabel="Underline"
          >
            <Underline className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            editor={editor}
            onClick={() => editor?.chain().focus(null, { scrollIntoView: false }).toggleStrike().run()}
            isActive={editor?.isActive('strike')}
            tooltip="Strikethrough"
            ariaLabel="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-1 border-r pr-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToolbarButton
                editor={editor}
                tooltip="Text Color"
                ariaLabel="Text color"
              >
                <Type className="w-4 h-4" />
                <ChevronDown className="w-3 h-3 ml-1" />
              </ToolbarButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <div className="grid grid-cols-5 gap-1 p-2">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => formatting.setTextColor(color)}
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    aria-label={`Set color ${color}`}
                  />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToolbarButton
                editor={editor}
                tooltip="Highlight Color"
                ariaLabel="Highlight color"
              >
                <Highlighter className="w-4 h-4" />
                <ChevronDown className="w-3 h-3 ml-1" />
              </ToolbarButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <div className="grid grid-cols-5 gap-1 p-2">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => formatting.setHighlightColor(color)}
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    aria-label={`Set highlight ${color}`}
                  />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 border-r pr-2">
          <ToolbarButton
            editor={editor}
            onClick={() => editor?.chain().focus(null, { scrollIntoView: false }).setTextAlign('left').run()}
            isActive={editor?.isActive({ textAlign: 'left' })}
            tooltip="Align Left"
            ariaLabel="Align left"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            editor={editor}
            onClick={() => editor?.chain().focus(null, { scrollIntoView: false }).setTextAlign('center').run()}
            isActive={editor?.isActive({ textAlign: 'center' })}
            tooltip="Align Center"
            ariaLabel="Align center"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            editor={editor}
            onClick={() => editor?.chain().focus(null, { scrollIntoView: false }).setTextAlign('right').run()}
            isActive={editor?.isActive({ textAlign: 'right' })}
            tooltip="Align Right"
            ariaLabel="Align right"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            editor={editor}
            onClick={() => editor?.chain().focus(null, { scrollIntoView: false }).setTextAlign('justify').run()}
            isActive={editor?.isActive({ textAlign: 'justify' })}
            tooltip="Justify"
            ariaLabel="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r pr-2">
          <ToolbarButton
            editor={editor}
            onClick={formatting.toggleBulletList}
            isActive={editor?.isActive('bulletList')}
            tooltip="Bullet List"
            ariaLabel="Bullet list"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            editor={editor}
            onClick={formatting.toggleOrderedList}
            isActive={editor?.isActive('orderedList')}
            tooltip="Numbered List"
            ariaLabel="Numbered list"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            editor={editor}
            onClick={formatting.toggleTaskList}
            isActive={editor?.isActive('taskList')}
            tooltip="Task List"
            ariaLabel="Task list"
          >
            <CheckSquare className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Insert Elements */}
        <div className="flex items-center gap-1 border-r pr-2">
          <ToolbarButton
            editor={editor}
            onClick={() => formatting.validateAndSetLink('https://')}
            isActive={editor?.isActive('link')}
            tooltip="Link"
            ariaLabel="Insert link"
          >
            <Link className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            editor={editor}
            onClick={handleInsertImage}
            tooltip="Image"
            ariaLabel="Insert image"
          >
            <Image className="w-4 h-4" />
          </ToolbarButton>

          {/* Table Picker */}
          <div ref={tablePicker.tableButtonRef}>
            <ToolbarButton
              editor={editor}
              onClick={tablePicker.handleTablePickerClick}
              isActive={tableOps.isInsideTable()}
              tooltip="Insert Table"
              ariaLabel="Insert table"
            >
              <Table className="w-4 h-4" />
            </ToolbarButton>

            {/* Table Picker Grid Popup */}
            {tablePicker.showTablePicker && (
              <div
                ref={tablePicker.tablePickerRef}
                className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-2"
              >
                <div className="grid grid-cols-8 gap-1">
                  {Array.from({ length: 8 }).map((_, row) =>
                    Array.from({ length: 8 }).map((_, col) => (
                      <button
                        key={`${row}-${col}`}
                        onMouseEnter={() => tablePicker.handleCellHover(row + 1, col + 1)}
                        onClick={tablePicker.handleInsertTable}
                        className={`w-6 h-6 border ${
                          row < tablePicker.selectedRows && col < tablePicker.selectedCols
                            ? 'bg-blue-500 border-blue-600'
                            : 'bg-gray-100 border-gray-300'
                        }`}
                        aria-label={`${row + 1}x${col + 1} table`}
                      />
                    ))
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-600 text-center">
                  {tablePicker.selectedRows}x{tablePicker.selectedCols}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* More Options */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            editor={editor}
            onClick={toggleBlockquote}
            tooltip="Blockquote"
            ariaLabel="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            editor={editor}
            onClick={() => editor?.chain().focus(null, { scrollIntoView: false }).toggleCode().run()}
            isActive={editor?.isActive('code')}
            tooltip="Code"
            ariaLabel="Code"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            editor={editor}
            onClick={formatting.clearFormatting}
            tooltip="Clear Formatting"
            ariaLabel="Clear formatting"
          >
            <RemoveFormatting className="w-4 h-4" />
          </ToolbarButton>
        </div>

      </div>

      {/* ============================================================
          DIALOGS - Moved from inline JSX for better organization
          ============================================================ */}

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
            <DialogDescription>
              Enter the URL you want to link to
            </DialogDescription>
          </DialogHeader>
          <Input
            value={linkUrlValue}
            onChange={(e) => setLinkUrlValue(e.target.value)}
            placeholder="https://example.com"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLinkDialogConfirm}>
              Insert Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Symbol Dialog */}
      <Dialog open={symbolDialogOpen} onOpenChange={setSymbolDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Symbol</DialogTitle>
            <DialogDescription>
              Choose a symbol to insert
            </DialogDescription>
          </DialogHeader>
          <Select value={symbolValue} onValueChange={setSymbolValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select symbol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="©">© Copyright</SelectItem>
              <SelectItem value="®">® Registered</SelectItem>
              <SelectItem value="™">™ Trademark</SelectItem>
              <SelectItem value="€">€ Euro</SelectItem>
              <SelectItem value="£">£ Pound</SelectItem>
              <SelectItem value="¥">¥ Yen</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSymbolDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSymbolDialogConfirm}>
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Table Dialog */}
      <Dialog open={deleteTableDialogOpen} onOpenChange={setDeleteTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this table? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTableDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTableDialogConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
            <DialogDescription>
              Enter a new name for this document
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Document name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameDialogConfirm}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditorToolbar;
