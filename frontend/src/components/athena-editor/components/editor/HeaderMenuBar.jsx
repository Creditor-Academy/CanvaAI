import React, { useState, useRef, useEffect } from 'react';
import PasteIconSvg from '../../assets/editor-paste-word-svgrepo-com.svg';
import {
  Save, Download, Trash2, Sparkles, Wand2, CheckCircle2, AlertCircle, Brain, PenTool,
  Languages, ListChecks, Lightbulb, FileText, Edit3, Eye, Settings, HelpCircle,
  FolderOpen, Printer, Undo, Redo, Copy, Clipboard, Scissors, Search, Replace,
  BookOpen, Star, History, MessageSquare, Keyboard, Info, BarChart, ZoomIn, ZoomOut,
  Plus, Minus, X, FileEdit, RotateCcw, ImageIcon, TableIcon, Link, Bold, Italic, Underline,
  Strikethrough, Code, AlignLeft, AlignCenter, AlignRight, AlignJustify, Superscript, Subscript,
  Hash, SpellCheck, ArrowRightToLine, Maximize2, Smile, Mic, FilePlus2,
  List, ListOrdered, CheckSquare, IndentIncrease, IndentDecrease
} from 'lucide-react';
import { callAIStreamAPI } from '../../ai/aiUtils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuShortcut,
} from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import focusUtils from './focusUtils';

// Destructure functions from default export for backward compatibility
const { guardToolbarMouseDown, saveSelection, onMenuOpen, onMenuClose, runWithSavedSelection, preventEditorBlur } = focusUtils;

// Custom Paste Icon Component using local SVG
const PasteIcon = ({ className, size = 20 }) => (
  <img
    src={PasteIconSvg}
    alt="Paste"
    className={className}
    width={size}
    height={size}
    style={{ display: 'inline-block' }}
  />
);

const HeaderMenuBar = React.memo(({
  onSave,
  onExport,
  onDelete,
  editor,
  zoom,
  onZoomChange,
  onPrint,
  onFindReplace,
  onOpenAIAssistant,  // New callback to open unified AI Assistant
  // Format callbacks
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onToggleStrikethrough,
  onToggleSuperscript,
  onToggleSubscript,
  onToggleCode,
  onClearFormatting,
  onSetTextAlign,
  // Edit callbacks
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onPastePlainText,
  onSelectAll,
  // Insert callbacks
  onInsertImage,
  onInsertTable,
  onInsertLink,
  onInsertPageBreak,
  onInsertHorizontalRule,
  // Other callbacks
  onToggleSpellCheck,
  onGrammarCheck
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(null);
  const [showFindReplaceDialog, setShowFindReplaceDialog] = useState(false);
  const [showNewDocConfirm, setShowNewDocConfirm] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const menuRef = useRef(null);
  
  // Debug: Log callback props on mount
  useEffect(() => {
    console.log('🔧 [HeaderMenuBar] Zoom callbacks available:', { 
      hasEditor: !!editor, 
      hasZoom: !!zoom, 
      hasOnZoomChange: typeof onZoomChange === 'function' 
    });
  }, [zoom, onZoomChange]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenuDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // AI Document Analysis - Opens unified AI Assistant
  const analyzeDocument = () => {
    if (onOpenAIAssistant) {
      onOpenAIAssistant();
    } else {
      toast.info('Click the AI Assistant button (✨) in the toolbar for advanced AI features');
    }
  };

  // AI Quick Improve
  const quickImprove = async () => {
    if (!editor) return;

    const selection = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to);

    if (!selectedText) {
      toast.error('Please select text to improve');
      return;
    }

    try {
      const controller = new AbortController();
      const improved = await callAIStreamAPI('generate', {
        prompt: `Improve this text for clarity, impact, and professionalism while maintaining its original meaning:\n\n${selectedText}`,
        temperature: 0.5,
        maxTokens: 1000
      }, null, controller.signal);

      // Replace selected text with improved version
      editor.chain().insertContent(improved).run();

      toast.success('Text improved with AI! ✨');
    } catch (error) {
      toast.error('Failed to improve text');
    }
  };

  // Generate Summary
  const generateSummary = async () => {
    if (!editor) return;

    const content = editor.getText();
    const wordCount = content.trim().split(/\s+/).length;

    if (wordCount < 50) {
      toast.error('Document too short for summary');
      return;
    }

    try {
      const controller = new AbortController();
      const summary = await callAIStreamAPI('generate', {
        prompt: `Create a concise bullet-point summary of this document:\n\n${content.substring(0, 3000)}`,
        temperature: 0.4,
        maxTokens: 800
      }, null, controller.signal);

      // Insert summary at beginning
      editor.chain()
        .insertContentAt(0, {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '📋 AI Summary' }]
        })
        .insertContentAt(1, {
          type: 'paragraph',
          content: [{ type: 'text', text: summary }]
        })
        .run();

      toast.success('Summary generated! 📝');
    } catch (error) {
      toast.error('Failed to generate summary');
    }
  };

  // Translate Selection
  const translateText = async (targetLanguage = 'Spanish') => {
    if (!editor) return;

    const selection = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to);

    if (!selectedText) {
      toast.error('Please select text to translate');
      return;
    }

    try {
      const controller = new AbortController();
      const translated = await callAIStreamAPI('generate', {
        prompt: `Translate the following text to ${targetLanguage}. Only output the translation:\n\n${selectedText}`,
        temperature: 0.3,
        maxTokens: 1000
      }, null, controller.signal);

      editor.chain().insertContent(translated).run();

      toast.success(`Translated to ${targetLanguage}! 🌍`);
    } catch (error) {
      toast.error('Translation failed');
    }
  };

  // Fix Grammar
  const fixGrammar = async () => {
    if (!editor) return;

    const selection = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to);

    if (!selectedText) {
      toast.error('Please select text to check grammar');
      return;
    }

    try {
      const controller = new AbortController();
      const fixed = await callAIStreamAPI('generate', {
        prompt: `Fix all grammar, spelling, and punctuation errors in this text. Maintain the original meaning and style:\n\n${selectedText}`,
        temperature: 0.2,
        maxTokens: 1000
      }, null, controller.signal);

      editor.chain().insertContent(fixed).run();

      toast.success('Grammar corrected! ✓');
    } catch (error) {
      toast.error('Grammar check failed');
    }
  };

  const menuItems = [
    { id: 'file', label: 'File' },
    { id: 'edit', label: 'Edit' },
    { id: 'view', label: 'View' },
    { id: 'insert', label: 'Insert' },
    { id: 'format', label: 'Format' },
    { id: 'tools', label: 'Tools' },
  ];

  // File menu items
  const fileMenuItems = [
    { id: 'new', label: 'New Page', icon: FileText, shortcut: 'Ctrl+N', onClick: () => setShowNewDocConfirm(true) },
    { id: 'open', label: 'Open...', icon: FolderOpen, shortcut: 'Ctrl+O', onClick: () => toast.info('Open file dialog') },
    { id: 'save', label: 'Save', icon: Save, shortcut: 'Ctrl+S', onClick: onSave },
    { id: 'print', label: 'Print', icon: Printer, shortcut: 'Ctrl+P', onClick: onPrint },
    { type: 'separator' },
    {
      id: 'export',
      label: 'Export',
      icon: Download,
      submenu: [
        // Open the export dialog; format selection happens in the dialog
        { id: 'pdf', label: 'Export as PDF', icon: Download, onClick: onExport },
        { id: 'docx', label: 'Export as Word', icon: Download, onClick: onExport },
        { id: 'html', label: 'Export as HTML', icon: Download, onClick: onExport },
        { id: 'txt', label: 'Export as Text', icon: Download, onClick: onExport },
      ]
    },
    { type: 'separator' },
    
  ];

  // Edit menu items - Using callback props
  const editMenuItems = [
    { id: 'undo', label: 'Undo', icon: Undo, shortcut: 'Ctrl+Z', onClick: onUndo },
    { id: 'redo', label: 'Redo', icon: Redo, shortcut: 'Ctrl+Y', onClick: onRedo },
    { type: 'separator' },
    { id: 'cut', label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X', onClick: onCut },
    { id: 'copy', label: 'Copy', icon: Copy, shortcut: 'Ctrl+C', onClick: onCopy },
    { id: 'paste', label: 'Paste', icon: PasteIcon, shortcut: 'Ctrl+V', onClick: onPaste },
    {
      id: 'paste-plain', label: 'Paste Without Formatting', icon: Clipboard, shortcut: 'Ctrl+Shift+V', onClick: onPastePlainText
    },
    { type: 'separator' },
    { id: 'select-all', label: 'Select All', icon: CheckCircle2, shortcut: 'Ctrl+A', onClick: onSelectAll },
    { id: 'find-replace', label: 'Find and replace', icon: Search, shortcut: 'Ctrl+F', onClick: onFindReplace },
    { type: 'separator' },
  ];

  // View menu items
  const viewMenuItems = [
    {
      id: 'zoom',
      label: 'Zoom',
      icon: ZoomIn,
      submenu: [
        { id: 'zoom-in', label: 'Zoom In', icon: ZoomIn, shortcut: 'Ctrl++', onClick: () => onZoomChange?.(Math.min(200, zoom + 10)) },
        { id: 'zoom-out', label: 'Zoom Out', icon: ZoomOut, shortcut: 'Ctrl+-', onClick: () => onZoomChange?.(Math.max(50, zoom - 10)) },
        { id: 'zoom-reset', label: 'Reset Zoom', icon: Eye, shortcut: 'Ctrl+0', onClick: () => onZoomChange?.(100) },
        { type: 'separator' },
        { id: '50%', label: '50%', onClick: () => onZoomChange?.(50) },
        { id: '75%', label: '75%', onClick: () => onZoomChange?.(75) },
        { id: '100%', label: '100%', onClick: () => onZoomChange?.(100) },
        { id: '125%', label: '125%', onClick: () => onZoomChange?.(125) },
        { id: '150%', label: '150%', onClick: () => onZoomChange?.(150) },
        { id: '200%', label: '200%', onClick: () => onZoomChange?.(200) },
      ]
    },
    { type: 'separator' },
    { id: 'fullscreen', label: 'Full Screen', icon: Maximize2, shortcut: 'F11', onClick: () => toast.info('Fullscreen mode') },
  ];

  // Insert menu items - Using callback props
  const insertMenuItems = [
    { id: 'image', label: 'Image', icon: ImageIcon, onClick: onInsertImage },
    { id: 'table', label: 'Table', icon: TableIcon, onClick: onInsertTable },
    { id: 'link', label: 'Link', icon: Link, shortcut: 'Ctrl+K', onClick: onInsertLink },
    { id: 'comment', label: 'Comment', icon: MessageSquare, shortcut: 'Ctrl+Alt+M', onClick: () => toast.info('Add comment') },
    { type: 'separator' },
    { id: 'page-break', label: 'Page Break', icon: Minus, onClick: onInsertPageBreak },
    { id: 'horizontal-rule', label: 'Horizontal Line', icon: Minus, onClick: onInsertHorizontalRule },
  ];

  // Format menu items - Using callback props
  const formatMenuItems = [
    { id: 'bold', label: 'Bold', icon: Bold, shortcut: 'Ctrl+B', onClick: onToggleBold },
    { id: 'italic', label: 'Italic', icon: Italic, shortcut: 'Ctrl+I', onClick: onToggleItalic },
    { id: 'underline', label: 'Underline', icon: Underline, shortcut: 'Ctrl+U', onClick: onToggleUnderline },
    { id: 'strike', label: 'Strikethrough', icon: Strikethrough, shortcut: 'Ctrl+Shift+X', onClick: onToggleStrikethrough },
    { id: 'superscript', label: 'Superscript', icon: Superscript, shortcut: 'Ctrl+.', onClick: onToggleSuperscript },
    { id: 'subscript', label: 'Subscript', icon: Subscript, shortcut: 'Ctrl+,', onClick: onToggleSubscript },
    { type: 'separator' },
    { id: 'code', label: 'Code', icon: Code, shortcut: 'Ctrl+E', onClick: onToggleCode },
    { id: 'clear-format', label: 'Clear Formatting', icon: X, shortcut: 'Ctrl+\\', onClick: onClearFormatting },
    { type: 'separator' },
    {
      id: 'alignment',
      label: 'Alignment',
      icon: AlignLeft,
      submenu: [
        { id: 'left', label: 'Align Left', icon: AlignLeft, onClick: () => onSetTextAlign('left') },
        { id: 'center', label: 'Align Center', icon: AlignCenter, onClick: () => onSetTextAlign('center') },
        { id: 'right', label: 'Align Right', icon: AlignRight, onClick: () => onSetTextAlign('right') },
        { id: 'justify', label: 'Justify', icon: AlignJustify, onClick: () => onSetTextAlign('justify') },
      ]
    },
  ];

  // Tools menu items - Using callback props
  const toolsMenuItems = [
    { id: 'ai-assistant', label: 'AI Assistant', icon: Brain, onClick: analyzeDocument },
    { id: 'spell-check', label: 'Spell Check', icon: SpellCheck, onClick: onToggleSpellCheck },
    { id: 'grammar-check', label: 'Grammar Check', icon: CheckCircle2, onClick: onGrammarCheck },
  ];

  const renderDropdown = (menuId, menuData) => {
    const renderMenuItem = (menuItem, index) => {
      if (menuItem.type === 'separator') {
        return <DropdownMenuSeparator key={`sep-${index}`} className="bg-gray-100" />;
      }

      // Handle submenu items
      if (menuItem.submenu) {
        return (
          <DropdownMenuSub key={menuItem.id || index}>
            <DropdownMenuSubTrigger
              onMouseDown={(e) => { 
                // CRITICAL: Don't interfere with click events
                console.log('🖱️ [SubMenu] Mouse down on:', menuItem.label);
              }}
              className="text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-800 flex justify-between items-center cursor-pointer"
            >
              <div className="flex items-center">
                {menuItem.icon && <menuItem.icon className="mr-2 h-4 w-4 text-gray-600" />}
                <span>{menuItem.label}</span>
              </div>
              <span className="ml-auto text-[10px] text-gray-400">›</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent 
              onCloseAutoFocus={(e) => e.preventDefault()} 
              className="w-56 bg-white border border-gray-100 shadow-xl rounded-md p-1"
            >
              {menuItem.submenu.map((subItem, subIndex) => renderMenuItem(subItem, subIndex))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      }

      // Regular menu item - Execute directly from onMouseDown since click never fires
      return (
        <DropdownMenuItem
          key={menuItem.id || menuItem.label}
          onMouseDown={(e) => { 
            console.log('🖱️ [HeaderMenuBar] Mouse down:', menuItem.label, 'Button:', e.button);
            // Execute callback directly from onMouseDown since Radix blocks onClick
            if (e.button === 0 && menuItem.onClick) {  // Left click only
              e.preventDefault();
              console.log('🎯 Executing callback from onMouseDown...');
              try {
                menuItem.onClick();
                console.log('✅ Callback executed!');
              } catch (error) {
                console.error('❌ Callback failed:', error.message);
              }
            }
          }}
          disabled={menuItem.disabled}
          className="text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-800 flex justify-between items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center">
            {menuItem.icon && <menuItem.icon className="mr-2 h-4 w-4 text-gray-600" />}
            <span>{menuItem.label}</span>
          </div>
          {menuItem.shortcut && (
            <span className="ml-auto text-[10px] text-gray-400">{menuItem.shortcut}</span>
          )}
        </DropdownMenuItem>
      );
    };

    return (
      <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()} className="w-56 bg-white border border-gray-100 shadow-xl rounded-md p-1">
        {menuData.map(renderMenuItem)}
      </DropdownMenuContent>
    );
  };

  return (
    <>
      <div ref={menuRef} className="flex items-center gap-0 h-full">
        {/* Menu Bar Items */}
        {menuItems.map((menu) => {
          let menuData = null;
          if (menu.id === 'file') menuData = fileMenuItems;
          else if (menu.id === 'edit') menuData = editMenuItems;
          else if (menu.id === 'view') menuData = viewMenuItems;
          else if (menu.id === 'insert') menuData = insertMenuItems;
          else if (menu.id === 'format') menuData = formatMenuItems;
    
          else if (menu.id === 'tools') menuData = toolsMenuItems;

          return (
            <div key={menu.id} className="relative">
              <DropdownMenu
                open={showMenuDropdown === menu.id}
                onOpenChange={(open) => {
                  setShowMenuDropdown(open ? menu.id : null);
                  if (open) onMenuOpen(editor); else onMenuClose(editor);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    onMouseDown={(e) => {
                      // CRITICAL: Don't interfere with click events
                      // Just log for debugging
                      console.log('🖱️ [MainMenu] Mouse down on:', menu.label);
                    }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${showMenuDropdown === menu.id
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {menu.icon && <menu.icon className="w-4 h-4" />}
                      {menu.label}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                {menuData && renderDropdown(menu.id, menuData)}
              </DropdownMenu>
            </div>
          );

        })}

        {/* Save Button */}
        <button
          onClick={onSave}
          className="ml-2 flex items-center gap-1.5 px-4 py-1.5 bg-[#FFB000] hover:bg-[#e69e00] text-black rounded-full font-medium text-sm transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2875FF] hover:bg-[#1d63e0] text-white rounded-full font-medium text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Find and Replace Dialog */}
      <Dialog open={showFindReplaceDialog} onOpenChange={setShowFindReplaceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Find and Replace</DialogTitle>
            <DialogDescription>
              Search for text and replace it throughout your document.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="find" className="text-right">
                Find
              </Label>
              <Input
                id="find"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className="col-span-3"
                placeholder="Enter text to find"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="replace" className="text-right">
                Replace
              </Label>
              <Input
                id="replace"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="col-span-3"
                placeholder="Enter replacement text"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="matchCase"
                  checked={matchCase}
                  onChange={(e) => setMatchCase(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="matchCase" className="text-sm font-normal">
                  Match case
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="matchWholeWord"
                  checked={matchWholeWord}
                  onChange={(e) => setMatchWholeWord(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="matchWholeWord" className="text-sm font-normal">
                  Match whole word
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFindReplaceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (editor && findText) {
                editor.commands.findAndReplace(findText, replaceText, { matchCase, wholeWord: matchWholeWord });
                setShowFindReplaceDialog(false);
                toast.success('Replace operation completed');
              }
            }}>
              Replace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Document Confirmation Dialog */}
      <Dialog open={showNewDocConfirm} onOpenChange={setShowNewDocConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to create a new document? All current changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setShowNewDocConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (editor) {
                  editor.commands.clearContent();
                  toast.success('New document created');
                }
                setShowNewDocConfirm(false);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Document
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
});

export default HeaderMenuBar;
