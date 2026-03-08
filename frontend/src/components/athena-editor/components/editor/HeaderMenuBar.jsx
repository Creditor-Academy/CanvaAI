import React, { useState, useRef, useEffect } from 'react';
import PasteIconSvg from '../../assets/editor-paste-word-svgrepo-com.svg';
import {
  Save, Download, Trash2, Sparkles, Wand2, CheckCircle2, AlertCircle, Brain, PenTool,
  Languages, ListChecks, Lightbulb, FileText, Edit3, Eye, Settings, HelpCircle,
  FolderOpen, Printer, Undo, Redo, Copy, Clipboard, Scissors, Search, Replace,
  BookOpen, Star, History, MessageSquare, Keyboard, Info, BarChart, ZoomIn, ZoomOut,
  Plus, Minus, X, FileEdit, RotateCcw, ImageIcon, TableIcon, Link, Bold, Italic, Underline,
  Strikethrough, Code, AlignLeft, AlignCenter, AlignRight, AlignJustify, Superscript, Subscript,
  Hash, SpellCheck, ArrowRightToLine, Maximize2, Smile, Mic, FilePlus2
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
import { guardToolbarMouseDown, saveSelection, onMenuOpen, onMenuClose, runWithSavedSelection, preventEditorBlur } from './focusUtils';

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
  onAISidebarToggle,
  isAISidebarOpen
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [showMenuDropdown, setShowMenuDropdown] = useState(null);
  const [showFindReplaceDialog, setShowFindReplaceDialog] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const menuRef = useRef(null);

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

  // AI Document Analysis and Suggestions
  const analyzeDocument = async () => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }

    setIsAnalyzing(true);
    try {
      const content = editor.getText();
      const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

      // Get AI analysis
      const prompt = `Analyze this document and provide brief insights on:
1. Writing quality (score 1-10)
2. Readability (score 1-10)
3. Top 3 suggestions for improvement
4. Overall tone

Document content (${wordCount} words):
${content.substring(0, 2000)}...`;

      const result = await callAIStreamAPI('generate', {
        prompt,
        temperature: 0.3,
        maxTokens: 500
      });

      setAnalysisResults({
        wordCount,
        aiInsights: result,
        timestamp: new Date()
      });

      setShowAIPanel(true);
      toast.success('Document analyzed successfully!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze document');
    } finally {
      setIsAnalyzing(false);
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
    { id: 'new', label: 'New', icon: FileText, shortcut: 'Ctrl+N', onClick: () => { if (window.confirm('Create new document? Current changes will be lost.')) { editor?.commands.clearContent(); toast.success('New document created'); } } },
    { id: 'open', label: 'Open...', icon: FolderOpen, shortcut: 'Ctrl+O', onClick: () => toast.info('Open file dialog') },
    { id: 'save', label: 'Save', icon: Save, shortcut: 'Ctrl+S', onClick: onSave },
    { id: 'save-as', label: 'Save As', icon: Download, shortcut: 'Ctrl+Shift+S', onClick: onExport },
    { type: 'separator' },
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
    { id: 'rename', label: 'Rename Document', icon: FileEdit, onClick: () => { const current = 'Untitled'; const newName = window.prompt('Rename document:', current); if (newName && newName.trim()) { toast.success(`Document renamed to "${newName.trim()}"`); } } },
    { id: 'duplicate', label: 'Duplicate Document', icon: Copy, onClick: () => { if (editor) { const html = editor.getHTML(); const newWindow = window.open('/editor', '_blank'); if (newWindow) { newWindow.addEventListener('load', () => { try { newWindow.localStorage?.setItem('duplicatedContent', html); } catch (e) { void 0 } }); } toast.success('Document duplicated in new tab'); } } },
    { id: 'delete', label: 'Delete Document', icon: Trash2, onClick: () => { if (window.confirm('Delete this document? This cannot be undone.')) { editor?.commands.clearContent(); toast.success('Document deleted'); onDelete?.(); } } },
    { id: 'restore', label: 'Restore Document', icon: RotateCcw, onClick: () => toast.info('Version history dialog') },
    { type: 'separator' },
    { id: 'templates', label: 'Document Templates', icon: FileText, onClick: () => toast.info('Template selection dialog') },
    { id: 'settings', label: 'Document Settings', icon: Settings, onClick: () => toast.info('Document settings dialog') },
  ];

  // Edit menu items
  const editMenuItems = [
    { id: 'undo', label: 'Undo', icon: Undo, shortcut: 'Ctrl+Z', onClick: () => editor?.chain().focus().undo().run() },
    { id: 'redo', label: 'Redo', icon: Redo, shortcut: 'Ctrl+Y', onClick: () => editor?.chain().focus().redo().run() },
    { type: 'separator' },
    { id: 'cut', label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X', onClick: () => document.execCommand('cut') },
    { id: 'copy', label: 'Copy', icon: Copy, shortcut: 'Ctrl+C', onClick: () => { document.execCommand('copy'); toast.success('Copied to clipboard'); } },
    {
      id: 'paste', label: 'Paste', icon: PasteIcon, shortcut: 'Ctrl+V', onClick: async () => {
        try {
          if (navigator.clipboard?.readText) {
            const text = await navigator.clipboard.readText();
            editor?.chain().focus().insertContent(text).run();
          } else {
            document.execCommand('paste');
          }
        } catch {
          document.execCommand('paste');
        }
      }
    },
    {
      id: 'paste-plain', label: 'Paste Without Formatting', icon: Clipboard, shortcut: 'Ctrl+Shift+V', onClick: async () => {
        try {
          const text = await navigator.clipboard.readText();
          editor?.chain().focus().insertContent(text).run();
        } catch {
          toast.info('Use Ctrl+Shift+V to paste as plain text');
        }
      }
    },
    { type: 'separator' },
    { id: 'select-all', label: 'Select All', icon: CheckCircle2, shortcut: 'Ctrl+A', onClick: () => editor?.chain().focus().selectAll().run() },
    { id: 'find', label: 'Find', icon: Search, shortcut: 'Ctrl+F', onClick: () => setShowFindReplaceDialog(true) },
    { id: 'replace', label: 'Replace', icon: Replace, shortcut: 'Ctrl+H', onClick: () => setShowFindReplaceDialog(true) },
    { id: 'go-to', label: 'Go To', icon: ArrowRightToLine, shortcut: 'Ctrl+G', onClick: () => toast.info('Go to dialog') },
    { type: 'separator' },
    { id: 'spell-check', label: 'Spell Check', icon: SpellCheck, onClick: () => toast.info('Spell check started') },
    { id: 'word-count', label: 'Word Count', icon: Hash, onClick: () => { const text = editor?.getText() || ''; const words = text.trim().split(/\s+/).filter(Boolean).length; const chars = text.length; toast.info(`Words: ${words}, Characters: ${chars}`); } },
  ];

  // View menu items
  const viewMenuItems = [
    {
      id: 'zoom',
      label: 'Zoom',
      icon: ZoomIn,
      submenu: [
        { id: 'zoom-in', label: 'Zoom In', icon: ZoomIn, shortcut: 'Ctrl++', onClick: () => onZoomChange(Math.min(200, zoom + 10)) },
        { id: 'zoom-out', label: 'Zoom Out', icon: ZoomOut, shortcut: 'Ctrl+-', onClick: () => onZoomChange(Math.max(50, zoom - 10)) },
        { id: 'zoom-reset', label: 'Reset Zoom', icon: Eye, shortcut: 'Ctrl+0', onClick: () => onZoomChange(100) },
        { type: 'separator' },
        { id: '50%', label: '50%', onClick: () => onZoomChange(50) },
        { id: '75%', label: '75%', onClick: () => onZoomChange(75) },
        { id: '100%', label: '100%', onClick: () => onZoomChange(100) },
        { id: '125%', label: '125%', onClick: () => onZoomChange(125) },
        { id: '150%', label: '150%', onClick: () => onZoomChange(150) },
        { id: '200%', label: '200%', onClick: () => onZoomChange(200) },
      ]
    },
    { type: 'separator' },
    { id: 'ai-sidebar', label: 'Toggle AI Sidebar', icon: Sparkles, onClick: onAISidebarToggle },
    { id: 'fullscreen', label: 'Full Screen', icon: Maximize2, shortcut: 'F11', onClick: () => toast.info('Fullscreen mode') },
  ];

  // Insert menu items
  const insertMenuItems = [
    {
      id: 'image', label: 'Image', icon: ImageIcon, onClick: () => {
        const url = window.prompt('Enter image URL');
        if (url) runWithSavedSelection(editor, (chain) => chain.setImage({ src: url }));
      }
    },
    { id: 'table', label: 'Table', icon: TableIcon, onClick: () => runWithSavedSelection(editor, (chain) => chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true })) },
    {
      id: 'link', label: 'Link', icon: Link, shortcut: 'Ctrl+K', onClick: () => {
        const href = window.prompt('Enter URL');
        if (href) runWithSavedSelection(editor, (chain) => chain.setLink({ href }));
      }
    },
    { id: 'comment', label: 'Comment', icon: MessageSquare, shortcut: 'Ctrl+Alt+M', onClick: () => toast.info('Add comment') },
    { type: 'separator' },
    { id: 'page-break', label: 'Page Break', icon: Minus, onClick: () => runWithSavedSelection(editor, (chain) => chain.insertContent({ type: 'pageBreak', attrs: { cssHeight: '120px' } })) },
    { id: 'horizontal-rule', label: 'Horizontal Line', icon: Minus, onClick: () => runWithSavedSelection(editor, (chain) => chain.setHorizontalRule()) },
    { type: 'separator' },
    { id: 'special-characters', label: 'Special Characters', icon: Hash, onClick: () => toast.info('Special characters dialog') },
    { id: 'emoji', label: 'Emoji', icon: Smile, onClick: () => toast.info('Emoji picker') },
  ];

  // Format menu items
  const formatMenuItems = [
    { id: 'bold', label: 'Bold', icon: Bold, shortcut: 'Ctrl+B', onClick: () => runWithSavedSelection(editor, (chain) => chain.toggleBold()) },
    { id: 'italic', label: 'Italic', icon: Italic, shortcut: 'Ctrl+I', onClick: () => runWithSavedSelection(editor, (chain) => chain.toggleItalic()) },
    { id: 'underline', label: 'Underline', icon: Underline, shortcut: 'Ctrl+U', onClick: () => runWithSavedSelection(editor, (chain) => chain.toggleUnderline()) },
    { id: 'strike', label: 'Strikethrough', icon: Strikethrough, shortcut: 'Ctrl+Shift+X', onClick: () => runWithSavedSelection(editor, (chain) => chain.toggleStrike()) },
    { id: 'superscript', label: 'Superscript', icon: Superscript, shortcut: 'Ctrl+.', onClick: () => runWithSavedSelection(editor, (chain) => chain.toggleSuperscript()) },
    { id: 'subscript', label: 'Subscript', icon: Subscript, shortcut: 'Ctrl+,', onClick: () => runWithSavedSelection(editor, (chain) => chain.toggleSubscript()) },
    { type: 'separator' },
    { id: 'code', label: 'Code', icon: Code, shortcut: 'Ctrl+E', onClick: () => runWithSavedSelection(editor, (chain) => chain.toggleCode()) },
    { id: 'clear-format', label: 'Clear Formatting', icon: X, shortcut: 'Ctrl+\\', onClick: () => runWithSavedSelection(editor, (chain) => chain.unsetAllMarks().clearNodes()) },
    { type: 'separator' },
    {
      id: 'alignment',
      label: 'Alignment',
      icon: AlignLeft,
      submenu: [
        { id: 'left', label: 'Align Left', icon: AlignLeft, onClick: () => runWithSavedSelection(editor, (chain) => chain.setTextAlign('left')) },
        { id: 'center', label: 'Align Center', icon: AlignCenter, onClick: () => runWithSavedSelection(editor, (chain) => chain.setTextAlign('center')) },
        { id: 'right', label: 'Align Right', icon: AlignRight, onClick: () => runWithSavedSelection(editor, (chain) => chain.setTextAlign('right')) },
        { id: 'justify', label: 'Justify', icon: AlignJustify, onClick: () => runWithSavedSelection(editor, (chain) => chain.setTextAlign('justify')) },
      ]
    },
  ];

  // Tools menu items
  const toolsMenuItems = [
    { id: 'ai-assistant', label: 'AI Assistant', icon: Brain, onClick: analyzeDocument },
    { id: 'word-count', label: 'Word Count', icon: Hash, onClick: () => { const text = editor?.getText() || ''; const words = text.trim().split(/\s+/).filter(Boolean).length; toast.info(`Words: ${words}`); } },
    { id: 'document-stats', label: 'Document Statistics', icon: BarChart, onClick: () => toast.info('Document statistics panel') },
    { type: 'separator' },
    { id: 'spell-check', label: 'Spell Check', icon: SpellCheck, onClick: () => toast.info('Spell check tool') },
    { id: 'grammar-check', label: 'Grammar Check', icon: CheckCircle2, onClick: () => fixGrammar() },
    { type: 'separator' },
    { id: 'translate', label: 'Translate', icon: Languages, onClick: () => translateText() }
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
              className="text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-800 flex justify-between items-center cursor-pointer"
              onMouseDown={(e) => { guardToolbarMouseDown(e, editor); }}
            >
              <div className="flex items-center">
                {menuItem.icon && <menuItem.icon className="mr-2 h-4 w-4 text-gray-600" />}
                <span>{menuItem.label}</span>
              </div>
              <span className="ml-auto text-[10px] text-gray-400">›</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent onCloseAutoFocus={(e) => e.preventDefault()} className="w-56 bg-white border border-gray-100 shadow-xl rounded-md p-1">
              {menuItem.submenu.map((subItem, subIndex) => renderMenuItem(subItem, subIndex))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      }

      // Regular menu item
      return (
        <DropdownMenuItem
          key={menuItem.id || menuItem.label}
          onMouseDown={(e) => { preventEditorBlur(e); }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            saveSelection(editor);
            runWithSavedSelection(editor, (chain) => {
              try { menuItem.onClick?.(); } catch { void 0 }
              return chain;
            });
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
                      guardToolbarMouseDown(e, editor);
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

      {/* AI Analysis Panel */}
      {showAIPanel && analysisResults && (
        <div className="fixed top-20 right-4 w-96 bg-white rounded-2xl shadow-2xl border border-indigo-100 z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                <h3 className="font-bold text-lg">Athena AI Insights</h3>
              </div>
              <button
                onClick={() => setShowAIPanel(false)}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                <div className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">Word Count</div>
                <div className="text-2xl font-bold text-indigo-900">{analysisResults.wordCount}</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                <div className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Read Time</div>
                <div className="text-2xl font-bold text-purple-900">{Math.ceil(analysisResults.wordCount / 200)} min</div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                AI Recommendations
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200">
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {analysisResults.aiInsights || 'Analysis in progress...'}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Actions</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={quickImprove}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Wand2 className="w-3 h-3" />
                  Improve Text
                </button>
                <button
                  onClick={generateSummary}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <ListChecks className="w-3 h-3" />
                  Summarize
                </button>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Powered by Athena Intelligence</span>
              <CheckCircle2 className="w-3 h-3 text-green-500" />
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default HeaderMenuBar;
