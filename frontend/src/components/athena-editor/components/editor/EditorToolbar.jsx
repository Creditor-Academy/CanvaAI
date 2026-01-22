// src/components/athena-editor/components/editor/EditorToolbar.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Image,
  Table,
  Highlighter,
  Undo,
  Redo,
  Minus,
  Printer,
  Search,
  Type,
  ChevronDown,
  Plus,
  RemoveFormatting,
  Subscript,
  Superscript,
  MoreHorizontal,
  Ruler,
  Columns,
  Eraser,
  X,
  FileText,
  Edit3,
  Eye,
  PlusCircle,
  Settings,
  HelpCircle,
  Sparkles,
  Save,
  FolderOpen,
  Share2,
  FilePlus2,
  Download,
  Scissors,
  Copy,
  CheckSquare,
  Replace,
  SpellCheck,
  Hash,
  ZoomIn,
  ZoomOut,
  Maximize2,
  PanelLeft,
  MessageSquare,
  Moon,
  Calendar,
  Clock,
  Sigma,
  Calculator,
  Square,
  Circle,
  Triangle,
  Palette,
  Paintbrush,
  Heading,
  Text,
  BarChart,
  Languages,
  ListChecks,
  History,
  Settings2,
  Keyboard,
  Info,
  Star,
  Bug,
  LifeBuoy,
  BookOpen,
  Video,
  FileCode2,
  Grid,
  FileDown,
  FileUp,
  FileInput,
  FileOutput,
  FolderPlus,
  FolderMinus,
  MoreVertical,
  Menu,
  ChevronRight
} from 'lucide-react';
import { Separator } from '../ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '../ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '../ui/popover';
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
  DropdownMenuPortal,
  DropdownMenuCheckboxItem
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { cn } from '../utils';
import { toast } from 'sonner';

// Constants
const FONTS = [
  { label: "Arial", value: "Arial" },
  { label: "Georgia", value: "Georgia" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Courier New", value: "Courier New" },
  { label: "Verdana", value: "Verdana" },
  { label: "Trebuchet MS", value: "Trebuchet MS" },
  { label: "Comic Sans MS", value: "Comic Sans MS" },
  { label: "Impact", value: "Impact" }
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

const TEXT_COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9",
  "#efefef", "#f3f3f3", "#ffffff", "#980000", "#ff0000", "#ff9900", "#ffff00",
  "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff"
];

const HIGHLIGHT_COLORS = [
  "#ffff00", "#00ff00", "#00ffff", "#ff00ff", "#ff0000", "#0000ff",
  "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#cfe2f3", "#d9d2e9"
];

const STYLES = [
  { label: "Normal text", level: 0 },
  { label: "Title", level: 1 },
  { label: "Heading 1", level: 1 },
  { label: "Heading 2", level: 2 },
  { label: "Heading 3", level: 3 },
  { label: "Heading 4", level: 4 },
  { label: "Heading 5", level: 5 },
  { label: "Heading 6", level: 6 }
];

// ToolbarButton Component
const ToolbarButton = ({
  onClick,
  isActive = false,
  disabled = false,
  tooltip,
  children,
  className
}) => (
  <Tooltip delayDuration={300}>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "h-8 w-8 p-0 hover:bg-gray-100",
          isActive && "bg-blue-100 text-blue-600 hover:bg-blue-100",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="text-xs">
      {tooltip}
    </TooltipContent>
  </Tooltip>
);

export const EditorToolbar = ({ editor, zoom, onZoomChange, onSave }) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [currentFontSize, setCurrentFontSizeState] = useState(11);
  const [currentFont, setCurrentFont] = useState("Arial");
  const [currentTextColor, setCurrentTextColor] = useState("#000000");
  const [currentHighlight, setCurrentHighlight] = useState("#ffff00");
  const [lineSpacing, setLineSpacing] = useState(1.15);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);

  // Helper function to set font size
  const setCurrentFontSize = (size) => {
    if (editor) {
      editor
        .chain()
        .focus()
        .setMark("textStyle", { fontSize: `${size}px` })
        .run();
    }
    setCurrentFontSizeState(size);
  };

  useEffect(() => {
    if (editor && currentFontSize) {
      editor
        .chain()
        .setMark("textStyle", { fontSize: `${currentFontSize}px` })
        .run();
    }
  }, [editor, currentFontSize]);

  if (!editor) return null;

  // Formatting functions
  const setFontFamily = (font) => {
    setCurrentFont(font);
    if (editor) {
      editor
        .chain()
        .focus()
        .setFontFamily(font)
        .run();
    }
  };

  const setTextColor = (color) => {
    setCurrentTextColor(color);
    if (editor) {
      editor
        .chain()
        .focus()
        .setColor(color)
        .run();
    }
  };

  const setHighlightColor = (color) => {
    setCurrentHighlight(color);
    if (editor) {
      editor
        .chain()
        .focus()
        .setHighlight({ color })
        .run();
    }
  };

  const clearFormatting = () => {
    if (editor) {
      editor
        .chain()
        .focus()
        .unsetAllMarks()
        .clearNodes()
        .run();
      toast.success('Formatting cleared');
    }
  };

  const increaseFontSize = () => {
    const currentIndex = FONT_SIZES.indexOf(currentFontSize);
    if (currentIndex < FONT_SIZES.length - 1) {
      setCurrentFontSize(FONT_SIZES[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const currentIndex = FONT_SIZES.indexOf(currentFontSize);
    if (currentIndex > 0) {
      setCurrentFontSize(FONT_SIZES[currentIndex - 1]);
    }
  };

  const addLink = () => {
    const url = prompt('Enter URL:');
    if (url && editor) {
      editor
        .chain()
        .focus()
        .setLink({ href: url })
        .run();
      toast.success('Link added');
    }
  };

  const addImage = () => {
    const url = prompt('Enter image URL:');
    if (url && editor) {
      editor
        .chain()
        .focus()
        .setImage({ src: url })
        .run();
      toast.success('Image added');
    }
  };

  const addTable = () => {
    if (editor) {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
      toast.success('Table inserted');
    }
  };

  const handlePrint = () => {
    window.print();
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
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const setPageMargins = (margins) => {
    const editorContainer = document.querySelector(".ProseMirror");
    if (editorContainer) {
      editorContainer.style.padding = margins;
      toast.success(`Page margins set to ${margins}`);
    }
  };

  const setColumnLayout = (columns) => {
    const editorContainer = document.querySelector(".ProseMirror");
    if (editorContainer) {
      editorContainer.style.columnCount = String(columns);
      editorContainer.style.columnGap = "2rem";
      toast.success(`${columns} column layout applied`);
    }
  };

  const clearLayout = () => {
    const editorContainer = document.querySelector(".ProseMirror");
    if (editorContainer) {
      editorContainer.removeAttribute("style");
      toast.success("Layout cleared");
    }
  };

  const setLineSpacingValue = (spacing) => {
    const editorContainer = document.querySelector(".ProseMirror");
    if (editorContainer) {
      editorContainer.style.lineHeight = String(spacing);
      setLineSpacing(spacing);
      toast.success(`Line spacing set to ${spacing}`);
    }
  };

  // Menu items
  const menuItems = [
    { 
      label: "File", 
      items: [
        { label: "New", icon: FilePlus2, shortcut: "Ctrl+N", action: () => {
          if (window.confirm('Create new document? Current changes will be lost.')) {
            editor.commands.clearContent();
            toast.success('New document created');
          }
        } },
        { label: "Open...", icon: FolderOpen, shortcut: "Ctrl+O", action: () => toast.info('Open file dialog would appear here') },
        { label: "Save", icon: Save, shortcut: "Ctrl+S", action: onSave },
        { label: "Save As...", icon: Save, shortcut: "Ctrl+Shift+S", action: () => toast.info('Save As dialog would appear here') },
        { type: "separator" },
        { label: "Print", icon: Printer, shortcut: "Ctrl+P", action: handlePrint },
        { label: "Share", icon: Share2, action: () => toast.info('Share dialog would appear here') },
        { type: "separator" },
        { 
          label: "Export", 
          icon: Download,
          submenu: [
            { label: "Export as PDF", icon: FileText, action: () => toast.info('Exporting to PDF...') },
            { label: "Export as DOCX", icon: FileText, action: () => toast.info('Exporting to DOCX...') },
            { label: "Export as Markdown", icon: FileCode2, action: () => toast.info('Exporting to Markdown...') },
          ]
        },
      ]
    },
    { 
      label: "Edit", 
      items: [
        { label: "Undo", icon: Undo, shortcut: "Ctrl+Z", action: () => editor.chain().focus().undo().run() },
        { label: "Redo", icon: Redo, shortcut: "Ctrl+Y", action: () => editor.chain().focus().redo().run() },
        { type: "separator" },
        { label: "Cut", icon: Scissors, shortcut: "Ctrl+X", action: () => document.execCommand('cut') },
        { label: "Copy", icon: Copy, shortcut: "Ctrl+C", action: () => {
          document.execCommand('copy');
          toast.success('Copied to clipboard');
        } },
        { label: "Paste", icon: Copy, shortcut: "Ctrl+V", action: () => document.execCommand('paste') },
        { type: "separator" },
        { label: "Select All", icon: CheckSquare, shortcut: "Ctrl+A", action: () => editor.chain().focus().selectAll().run() },
        { label: "Find", icon: Search, shortcut: "Ctrl+F", action: () => setShowSearch(true) },
        { label: "Replace", icon: Replace, shortcut: "Ctrl+H", action: () => toast.info('Replace dialog would appear here') },
        { type: "separator" },
        { label: "Spell Check", icon: SpellCheck, action: () => toast.info('Spell check started') },
        { label: "Word Count", icon: Hash, action: () => {
          const text = editor.getText();
          const words = text.trim().split(/\s+/).filter(Boolean).length;
          const chars = text.length;
          toast.info(`Words: ${words}, Characters: ${chars}`);
        } },
      ]
    },
    { 
      label: "View", 
      items: [
        { 
          label: "Zoom", 
          icon: ZoomIn,
          submenu: [
            { label: "Zoom In", icon: ZoomIn, shortcut: "Ctrl++", action: () => onZoomChange(Math.min(200, zoom + 10)) },
            { label: "Zoom Out", icon: ZoomOut, shortcut: "Ctrl+-", action: () => onZoomChange(Math.max(50, zoom - 10)) },
            { label: "Zoom to 100%", icon: ZoomIn, shortcut: "Ctrl+0", action: () => onZoomChange(100) },
            { type: "separator" },
            { label: "50%", action: () => onZoomChange(50) },
            { label: "75%", action: () => onZoomChange(75) },
            { label: "100%", action: () => onZoomChange(100) },
            { label: "125%", action: () => onZoomChange(125) },
            { label: "150%", action: () => onZoomChange(150) },
            { label: "200%", action: () => onZoomChange(200) },
          ]
        },
        { label: "Full Screen", icon: Maximize2, shortcut: "F11", action: () => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        } },
        { type: "separator" },
        { 
          label: "Show/Hide", 
          icon: Eye,
          submenu: [
            { label: "Ruler", icon: Ruler, checked: showRuler, action: () => {
              setShowRuler(!showRuler);
              toast.info(`Ruler ${showRuler ? 'hidden' : 'shown'}`);
            } },
            { label: "Grid", icon: Grid, checked: showGrid, action: () => {
              setShowGrid(!showGrid);
              toast.info(`Grid ${showGrid ? 'hidden' : 'shown'}`);
            } },
            { label: "Navigation Pane", icon: PanelLeft, action: () => toast.info('Navigation panel toggled') },
            { label: "Comments", icon: MessageSquare, action: () => toast.info('Comments panel toggled') },
          ]
        },
        { type: "separator" },
        { label: "Dark Mode", icon: Moon, checked: isDarkMode, action: () => {
          setIsDarkMode(!isDarkMode);
          document.documentElement.classList.toggle('dark');
          toast.info(`Dark mode ${isDarkMode ? 'disabled' : 'enabled'}`);
        } },
      ]
    },
    { 
      label: "Insert", 
      items: [
        { label: "Image", icon: Image, action: addImage },
        { label: "Table", icon: Table, action: addTable },
        { label: "Link", icon: Link, shortcut: "Ctrl+K", action: addLink },
        { label: "Page Break", icon: Minus, action: () => {
          if (editor) {
            editor.chain().focus().setHorizontalRule().run();
            toast.success("Page break added");
          }
        } },
        { type: "separator" },
        { label: "Date", icon: Calendar, action: () => {
          const date = new Date().toLocaleDateString();
          editor?.chain().focus().insertContent(date).run();
          toast.success("Date inserted");
        } },
        { label: "Time", icon: Clock, action: () => {
          const time = new Date().toLocaleTimeString();
          editor?.chain().focus().insertContent(time).run();
          toast.success("Time inserted");
        } },
        { label: "Symbol", icon: Sigma, action: () => {
          const symbol = prompt('Enter symbol (e.g., ©, ®, ™):', '©');
          if (symbol && editor) {
            editor.chain().focus().insertContent(symbol).run();
            toast.success("Symbol inserted");
          }
        } },
        { label: "Equation", icon: Calculator, action: () => {
          editor?.chain().focus().insertContent('E = mc²').run();
          toast.success("Equation inserted");
        } },
        { type: "separator" },
        { 
          label: "Blocks", 
          icon: Square,
          submenu: [
            { label: "Code Block", icon: Code, action: () => {
              editor?.chain().focus().toggleCodeBlock().run();
              toast.success("Code block inserted");
            } },
            { label: "Quote", icon: Quote, action: () => {
              editor?.chain().focus().toggleBlockquote().run();
              toast.success("Quote block inserted");
            } },
            { label: "Horizontal Line", icon: Minus, action: () => {
              editor?.chain().focus().setHorizontalRule().run();
              toast.success("Horizontal line inserted");
            } },
          ]
        },
      ]
    },
    { 
      label: "Format", 
      items: [
        { 
          label: "Font", 
          icon: Type,
          submenu: [
            { label: "Bold", icon: Bold, shortcut: "Ctrl+B", action: () => editor?.chain().focus().toggleBold().run() },
            { label: "Italic", icon: Italic, shortcut: "Ctrl+I", action: () => editor?.chain().focus().toggleItalic().run() },
            { label: "Underline", icon: Underline, shortcut: "Ctrl+U", action: () => editor?.chain().focus().toggleUnderline().run() },
            { label: "Strikethrough", icon: Strikethrough, action: () => editor?.chain().focus().toggleStrike().run() },
            { type: "separator" },
            { label: "Superscript", icon: Superscript, shortcut: "Ctrl+Shift++", action: () => editor?.chain().focus().toggleSuperscript().run() },
            { label: "Subscript", icon: Subscript, shortcut: "Ctrl+=", action: () => editor?.chain().focus().toggleSubscript().run() },
          ]
        },
        { 
          label: "Paragraph", 
          icon: Text,
          submenu: [
            { label: "Heading 1", icon: Heading, shortcut: "Ctrl+Alt+1", action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
            { label: "Heading 2", icon: Heading, shortcut: "Ctrl+Alt+2", action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
            { label: "Heading 3", icon: Heading, shortcut: "Ctrl+Alt+3", action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
            { label: "Normal Text", icon: Text, action: () => editor?.chain().focus().setParagraph().run() },
            { type: "separator" },
            { label: "Bullet List", icon: List, action: () => editor?.chain().focus().toggleBulletList().run() },
            { label: "Numbered List", icon: ListOrdered, action: () => editor?.chain().focus().toggleOrderedList().run() },
            { type: "separator" },
            { label: "Align Left", icon: AlignLeft, action: () => editor?.chain().focus().setTextAlign('left').run() },
            { label: "Align Center", icon: AlignCenter, action: () => editor?.chain().focus().setTextAlign('center').run() },
            { label: "Align Right", icon: AlignRight, action: () => editor?.chain().focus().setTextAlign('right').run() },
            { label: "Justify", icon: AlignJustify, action: () => editor?.chain().focus().setTextAlign('justify').run() },
          ]
        },
        { type: "separator" },
        { label: "Clear Formatting", icon: RemoveFormatting, shortcut: "Ctrl+Space", action: clearFormatting },
      ]
    },
    { 
      label: "Tools", 
      items: [
        { label: "Spell Check", icon: SpellCheck, checked: spellCheckEnabled, action: () => {
          setSpellCheckEnabled(!spellCheckEnabled);
          toast.info(`Spell check ${spellCheckEnabled ? 'disabled' : 'enabled'}`);
        } },
        { label: "Word Count", icon: Hash, action: () => {
          const text = editor.getText();
          const words = text.trim().split(/\s+/).filter(Boolean).length;
          const chars = text.length;
          toast.info(`Words: ${words}, Characters: ${chars}`);
        } },
        { label: "AI Assistant", icon: Sparkles, action: () => toast.info('AI Assistant activated') },
        { type: "separator" },
        { label: "Table of Contents", icon: ListChecks, action: () => toast.info('Generating table of contents...') },
        { label: "Comments", icon: MessageSquare, action: () => toast.info('Comments panel toggled') },
        { label: "Version History", icon: History, action: () => toast.info('Version history opened') },
      ]
    },
    { 
      label: "Help", 
      items: [
        { label: "Help Center", icon: HelpCircle, action: () => window.open('https://help.example.com', '_blank') },
        { label: "Keyboard Shortcuts", icon: Keyboard, shortcut: "Ctrl+/", action: () => toast.info('Keyboard shortcuts dialog would appear here') },
        { label: "About", icon: Info, action: () => toast.info('Athena Editor v1.0.0\n© 2024 Athena Software') },
      ]
    }
  ];

  const handleMenuAction = (menuLabel, action) => {
    if (typeof action === 'function') {
      action();
    } else {
      console.log(`Menu action: ${menuLabel} -> ${action}`);
    }
  };

  const renderMenu = () => {
    return (
      <div className="flex items-center gap-0">
        {menuItems.map(item => (
          <DropdownMenu key={item.label}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-none"
              >
                {item.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[200px]">
              {item.items.map((menuItem, index) => {
                if (menuItem.type === "separator") {
                  return <DropdownMenuSeparator key={`sep-${index}`} />
                }
                
                if (menuItem.submenu) {
                  return (
                    <DropdownMenuSub key={`sub-${index}`}>
                      <DropdownMenuSubTrigger>
                        <menuItem.icon className="w-4 h-4 mr-2" />
                        {menuItem.label}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {menuItem.submenu.map((subItem, subIndex) => {
                          if (subItem.type === "separator") {
                            return <DropdownMenuSeparator key={`sub-sep-${subIndex}`} />
                          }
                          
                          if ('checked' in subItem) {
                            return (
                              <DropdownMenuCheckboxItem
                                key={`check-${subIndex}`}
                                checked={subItem.checked}
                                onCheckedChange={subItem.action}
                              >
                                {subItem.icon && <subItem.icon className="w-4 h-4 mr-2" />}
                                {subItem.label}
                                {subItem.shortcut && (
                                  <DropdownMenuShortcut>{subItem.shortcut}</DropdownMenuShortcut>
                                )}
                              </DropdownMenuCheckboxItem>
                            )
                          }
                          
                          return (
                            <DropdownMenuItem
                              key={`sub-${subIndex}`}
                              onClick={subItem.action}
                            >
                              {subItem.icon && <subItem.icon className="w-4 h-4 mr-2" />}
                              {subItem.label}
                              {subItem.shortcut && (
                                <DropdownMenuShortcut>{subItem.shortcut}</DropdownMenuShortcut>
                              )}
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )
                }
                
                if ('checked' in menuItem) {
                  return (
                    <DropdownMenuCheckboxItem
                      key={`check-${index}`}
                      checked={menuItem.checked}
                      onCheckedChange={menuItem.action}
                    >
                      <menuItem.icon className="w-4 h-4 mr-2" />
                      {menuItem.label}
                      {menuItem.shortcut && (
                        <DropdownMenuShortcut>{menuItem.shortcut}</DropdownMenuShortcut>
                      )}
                    </DropdownMenuCheckboxItem>
                  )
                }
                
                return (
                  <DropdownMenuItem
                    key={index}
                    onClick={menuItem.action}
                  >
                    <menuItem.icon className="w-4 h-4 mr-2" />
                    {menuItem.label}
                    {menuItem.shortcut && (
                      <DropdownMenuShortcut>{menuItem.shortcut}</DropdownMenuShortcut>
                    )}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="sticky top-0 z-40 bg-white border-b border-gray-200"
    >
      {/* Header with Menu */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Menu className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
              <FileText className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-600">Docs</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>

          <div className="flex items-center gap-2">
            <Input
              value="Untitled document"
              className="border-0 bg-transparent font-medium text-base h-7 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 w-[200px] text-gray-800"
              placeholder="Untitled document"
            />
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              All changes saved
            </span>
          </div>
        </div>

        {/* Center menu */}
        {renderMenu()}

        {/* Right section */}
        <div className="flex items-center gap-2">
          <ToolbarButton
            onClick={() => onZoomChange(Math.max(50, zoom - 10))}
            tooltip="Zoom Out"
          >
            <Minus className="w-3 h-3" />
          </ToolbarButton>
          <span className="text-xs text-gray-600 min-w-[40px] text-center">{zoom}%</span>
          <ToolbarButton
            onClick={() => onZoomChange(Math.min(200, zoom + 10))}
            tooltip="Zoom In"
          >
            <Plus className="w-3 h-3" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-4 mx-1" />

          <ToolbarButton
            onClick={() => setShowSearch(!showSearch)}
            tooltip="Search (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton onClick={handlePrint} tooltip="Print (Ctrl+P)">
            <Printer className="w-4 h-4" />
          </ToolbarButton>

          <Button
            className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>

          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
            U
          </div>
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div className="flex items-center px-4 py-2 gap-1.5 border-t border-gray-200 bg-gray-50">
        {/* Group 1: History */}
        <div className="flex items-center gap-1 pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            tooltip="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            tooltip="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Group 2: Font Family & Size */}
        <div className="flex items-center gap-1 pr-2">
          <select 
            value={currentFont}
            onChange={(e) => setFontFamily(e.target.value)}
            className="text-xs bg-white rounded px-2 py-1 h-7 min-w-[120px] hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {FONTS.map(font => (
              <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                {font.label}
              </option>
            ))}
          </select>

          <select 
            value={currentFontSize}
            onChange={(e) => setCurrentFontSize(parseInt(e.target.value))}
            className="text-xs bg-white rounded px-2 py-1 h-7 w-16 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {FONT_SIZES.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        {/* Group 3: Basic Formatting */}
        <div className="flex items-center gap-0.5 pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            tooltip="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            tooltip="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            tooltip="Underline (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            tooltip="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Group 4: Colors */}
        <div className="flex items-center gap-1 pr-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Type className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3">
              <div className="grid grid-cols-6 gap-1">
                {TEXT_COLORS.slice(0, 18).map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded border hover:scale-110 transition-transform",
                      currentTextColor === color && "ring-2 ring-blue-500"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setTextColor(color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Highlighter className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3">
              <div className="grid grid-cols-6 gap-1">
                {HIGHLIGHT_COLORS.slice(0, 18).map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded border hover:scale-110 transition-transform",
                      currentHighlight === color && "ring-2 ring-blue-500"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setHighlightColor(color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Group 5: Alignment */}
        <div className="flex items-center gap-0.5 pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            tooltip="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            tooltip="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            tooltip="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            tooltip="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Group 6: Lists */}
        <div className="flex items-center gap-0.5 pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            tooltip="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            tooltip="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Group 7: Insert */}
        <div className="flex items-center gap-0.5 pr-2">
          <ToolbarButton
            onClick={addLink}
            isActive={editor.isActive("link")}
            tooltip="Insert Link (Ctrl+K)"
          >
            <Link className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={addImage}
            tooltip="Insert Image"
          >
            <Image className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={addTable}
            tooltip="Insert Table"
          >
            <Table className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Group 8: More Formatting */}
        <div className="flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem 
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
              >
                <Superscript className="w-4 h-4 mr-2" /> Superscript
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => editor.chain().focus().toggleSubscript().run()}
              >
                <Subscript className="w-4 h-4 mr-2" /> Subscript
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              >
                <Quote className="w-4 h-4 mr-2" /> Block Quote
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              >
                <Code className="w-4 h-4 mr-2" /> Code Block
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={clearFormatting}
              >
                <RemoveFormatting className="w-4 h-4 mr-2" /> Clear Formatting
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Ruler className="w-4 h-4 mr-2" />
                  Page Settings
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setPageMargins("1in")}>
                    Standard Margins (1in)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPageMargins("0.5in")}>
                    Narrow Margins (0.5in)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setColumnLayout(2)}>
                    Two Columns
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setColumnLayout(3)}>
                    Three Columns
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={clearLayout}>
                    Clear Layout
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <AlignJustify className="w-4 h-4 mr-2" />
                  Line Spacing
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="p-4 w-64">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium">Line Height</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {lineSpacing.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[lineSpacing]}
                    max={3}
                    min={1}
                    step={0.1}
                    onValueChange={([value]) => setLineSpacingValue(value)}
                    className="w-full mb-4"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Single", value: 1 },
                      { label: "1.5", value: 1.5 },
                      { label: "Double", value: 2 }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        className={cn(
                          "p-2 rounded-md text-xs font-medium transition-all duration-200 bg-secondary text-secondary-foreground hover:bg-secondary/80",
                          lineSpacing === preset.value && "active"
                        )}
                        onClick={() => setLineSpacingValue(preset.value)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-2 bg-white border-t border-gray-200">
              <div className="flex items-center gap-2 max-w-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-8 text-sm"
                  />
                </div>
                <Button size="sm" variant="outline" className="h-8">
                  Find
                </Button>
                <Button size="sm" variant="outline" className="h-8">
                  Replace
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => setShowSearch(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EditorToolbar;