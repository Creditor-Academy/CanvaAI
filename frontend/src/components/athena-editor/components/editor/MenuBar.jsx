import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Edit3,
  Eye,
  Search,
  Replace,
  Printer,
  Sparkles,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  Settings,
  Save,
  Download,
  Undo,
  Redo,
  Copy,
  Clipboard,
  Scissors,
  Trash2,
  BookOpen,
  Star,
  History,
  MessageSquare,
  ChevronRight,
  Check,
  X,
  FolderOpen,
  Keyboard,
  Info,
  BarChart
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
import { Label } from '../ui/label';

export const MenuBar = ({ 
  editor, 
  zoom, 
  onZoomChange, 
  onPrint, 
  onAISidebarToggle, 
  isAISidebarOpen 
}) => {
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

  const menuItems = [
    { id: 'file', label: 'File', icon: FileText },
    { id: 'edit', label: 'Edit', icon: Edit3 },
    { id: 'view', label: 'View', icon: Eye },
    { id: 'tools', label: 'Tools', icon: Settings },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ];

  // File menu items
  const fileMenuItems = [
    { id: 'new', label: 'New', icon: FileText, shortcut: 'Ctrl+N', onClick: () => toast.info('New document functionality to be implemented') },
    { id: 'open', label: 'Open', icon: FolderOpen, shortcut: 'Ctrl+O', onClick: () => toast.info('Open document functionality to be implemented') },
    { id: 'save', label: 'Save', icon: Save, shortcut: 'Ctrl+S', onClick: () => toast.info('Save functionality available in main toolbar') },
    { id: 'save-as', label: 'Save As', icon: Download, shortcut: 'Ctrl+Shift+S', onClick: () => toast.info('Save As functionality to be implemented') },
    { type: 'separator' },
    { id: 'print', label: 'Print', icon: Printer, shortcut: 'Ctrl+P', onClick: onPrint },
    { type: 'separator' },
    { id: 'export', label: 'Export', icon: Download, onClick: () => toast.info('Export functionality available in main toolbar') },
  ];

  // Edit menu items
  const editMenuItems = [
    { id: 'undo', label: 'Undo', icon: Undo, shortcut: 'Ctrl+Z', onClick: () => editor?.commands.undo() },
    { id: 'redo', label: 'Redo', icon: Redo, shortcut: 'Ctrl+Y', onClick: () => editor?.commands.redo() },
    { type: 'separator' },
    { id: 'cut', label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X', onClick: () => document.execCommand('cut') },
    { id: 'copy', label: 'Copy', icon: Copy, shortcut: 'Ctrl+C', onClick: () => document.execCommand('copy') },
    { id: 'paste', label: 'Paste', icon: Clipboard, shortcut: 'Ctrl+V', onClick: () => document.execCommand('paste') },
    { type: 'separator' },
    { id: 'find', label: 'Find', icon: Search, shortcut: 'Ctrl+F', onClick: () => setShowFindReplaceDialog(true) },
    { id: 'find-replace', label: 'Find and Replace', icon: Replace, shortcut: 'Ctrl+H', onClick: () => setShowFindReplaceDialog(true) },
    { type: 'separator' },
    { id: 'select-all', label: 'Select All', icon: Check, shortcut: 'Ctrl+A', onClick: () => editor?.commands.selectAll() },
  ];

  // View menu items
  const viewMenuItems = [
    { id: 'zoom-in', label: 'Zoom In', icon: ZoomIn, shortcut: 'Ctrl+Plus', onClick: () => onZoomChange(Math.min(200, zoom + 10)) },
    { id: 'zoom-out', label: 'Zoom Out', icon: ZoomOut, shortcut: 'Ctrl+Minus', onClick: () => onZoomChange(Math.max(50, zoom - 10)) },
    { id: 'zoom-reset', label: 'Reset Zoom', icon: Eye, shortcut: 'Ctrl+0', onClick: () => onZoomChange(100) },
    { type: 'separator' },
    { id: 'ai-sidebar', label: `${isAISidebarOpen ? 'Hide' : 'Show'} AI Sidebar`, icon: Sparkles, onClick: onAISidebarToggle },
  ];

  // Tools menu items
  const toolsMenuItems = [
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, onClick: onAISidebarToggle },
    { id: 'word-count', label: 'Word Count', icon: BookOpen, onClick: () => toast.info('Word count functionality to be implemented') },
    { id: 'document-stats', label: 'Document Statistics', icon: BarChart, onClick: () => toast.info('Document statistics functionality to be implemented') },
  ];

  // Help menu items
  const helpMenuItems = [
    { id: 'help', label: 'Help', icon: HelpCircle, onClick: () => toast.info('Help documentation to be implemented') },
    { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard, onClick: () => toast.info('Keyboard shortcuts to be implemented') },
    { type: 'separator' },
    { id: 'about', label: 'About', icon: Info, onClick: () => toast.info('About information to be implemented') },
  ];

  const handleMenuClick = (menuId) => {
    setShowMenuDropdown(showMenuDropdown === menuId ? null : menuId);
  };

  const renderDropdown = (menuId, items) => {
    const menuData = items.map((item, index) => {
      if (item.type === 'separator') {
        return <DropdownMenuSeparator key={`sep-${index}`} />;
      }
      
      return (
        <DropdownMenuItem 
          key={item.id} 
          onClick={item.onClick}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            {item.icon && <item.icon className="w-4 h-4" />}
            <span>{item.label}</span>
          </div>
          {item.shortcut && (
            <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
          )}
        </DropdownMenuItem>
      );
    });

    return (
      <DropdownMenuContent 
        className="w-56" 
        align="start"
        side="bottom"
      >
        {menuData}
      </DropdownMenuContent>
    );
  };

  const handleFind = () => {
    if (!editor || !findText) return;
    
    const content = editor.getText();
    const flags = matchCase ? 'g' : 'gi';
    const regex = matchWholeWord ? new RegExp(`\\b${findText}\\b`, flags) : new RegExp(findText, flags);
    const matches = content.match(regex);
    
    if (matches) {
      toast.success(`Found ${matches.length} occurrence${matches.length > 1 ? 's' : ''}`);
      // Highlight first match
      editor.commands.find(findText);
    } else {
      toast.warning('No matches found');
    }
  };

  const handleReplace = () => {
    if (!editor || !findText) return;
    
    const content = editor.getHTML();
    const flags = matchCase ? 'g' : 'gi';
    const regex = matchWholeWord ? new RegExp(`\\b${findText}\\b`, flags) : new RegExp(findText, flags);
    const newContent = content.replace(regex, replaceText);
    
    editor.commands.setContent(newContent);
    toast.success(`Replaced all occurrences of "${findText}"`);
    setShowFindReplaceDialog(false);
  };

  const handleReplaceAll = () => {
    if (!editor || !findText) return;
    
    const content = editor.getHTML();
    const flags = matchCase ? 'g' : 'gi';
    const regex = matchWholeWord ? new RegExp(`\\b${findText}\\b`, flags) : new RegExp(findText, flags);
    const matches = content.match(regex);
    
    if (matches) {
      const newContent = content.replace(regex, replaceText);
      editor.commands.setContent(newContent);
      toast.success(`Replaced ${matches.length} occurrence${matches.length > 1 ? 's' : ''}`);
      setShowFindReplaceDialog(false);
    } else {
      toast.warning('No matches found');
    }
  };

  return (
    <div className="flex items-center px-4 border-b border-gray-200 bg-white relative" ref={menuRef}>
      {menuItems.map((menu) => {
        let menuData = null;
        if (menu.id === 'file') menuData = fileMenuItems;
        else if (menu.id === 'edit') menuData = editMenuItems;
        else if (menu.id === 'view') menuData = viewMenuItems;
        else if (menu.id === 'tools') menuData = toolsMenuItems;
        else if (menu.id === 'help') menuData = helpMenuItems;

        return (
          <div key={menu.id} className="relative">
            <DropdownMenu open={showMenuDropdown === menu.id} onOpenChange={(open) => setShowMenuDropdown(open ? menu.id : null)}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors ${
                    showMenuDropdown === menu.id ? 'bg-gray-100' : ''
                  }`}
                >
                  <menu.icon className="w-4 h-4 mr-2" />
                  {menu.label}
                </Button>
              </DropdownMenuTrigger>
              {menuData && renderDropdown(menu.id, menuData)}
            </DropdownMenu>
          </div>
        );
      })}

      {/* Right-aligned Zoom Controls */}
      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-2">Zoom:</span>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7 text-gray-600"
            onClick={() => onZoomChange(Math.max(50, zoom - 10))}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="text-xs font-medium w-10 text-center">{zoom}%</span>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7 text-gray-600"
            onClick={() => onZoomChange(Math.min(200, zoom + 10))}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        
        {/* AI Sidebar Button */}
        <Button 
          variant={isAISidebarOpen ? "default" : "outline"} 
          size="sm"
          className="h-7 px-2 text-xs flex items-center gap-1"
          onClick={onAISidebarToggle}
        >
          <Sparkles className="w-3 h-3" />
          AI
        </Button>
        
        {/* Print Button */}
        <Button 
          variant="outline" 
          size="icon" 
          className="h-7 w-7 text-gray-600"
          onClick={onPrint}
        >
          <Printer className="w-3 h-3" />
        </Button>
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
                  id="match-case"
                  checked={matchCase}
                  onChange={(e) => setMatchCase(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="match-case" className="text-sm">
                  Match case
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="match-whole-word"
                  checked={matchWholeWord}
                  onChange={(e) => setMatchWholeWord(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="match-whole-word" className="text-sm">
                  Match whole word
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFindReplaceDialog(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleFind}>
              Find
            </Button>
            <Button variant="secondary" onClick={handleReplace}>
              Replace
            </Button>
            <Button onClick={handleReplaceAll}>
              Replace All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};