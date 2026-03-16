// src/components/athena-editor/components/TextEditor.jsx
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import { Plugin, PluginKey } from 'prosemirror-state';
import { StarterKit } from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import Placeholder from '@tiptap/extension-placeholder';
import { Underline as TiptapUnderline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Highlight } from '@tiptap/extension-highlight';
import { Typography } from '@tiptap/extension-typography';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Focus } from '@tiptap/extension-focus';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Link as TiptapLink } from '@tiptap/extension-link';
import { Image as TiptapImage } from '@tiptap/extension-image';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { ListItem } from '@tiptap/extension-list-item';
import Indent from '../extensions/Indent.js';
import { addHeadingStyles } from '../extensions/Page.js';  // Only need heading styles function
import { Table as TiptapTable, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { TextStyle } from '@tiptap/extension-text-style';
import TableExtension from '../extensions/TableExtension.js';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextDirection } from '../extensions/TextDirection.js';
import { ResizableImage } from '../extensions/ResizableImage.jsx';
import { Subscript as TiptapSubscript } from '@tiptap/extension-subscript';
import { Superscript as TiptapSuperscript } from '@tiptap/extension-superscript';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Blockquote } from '@tiptap/extension-blockquote';
import { createLowlight } from 'lowlight';
import { common } from 'lowlight';
import { mergeAttributes, Node, Extension } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { EditorProvider, useEditorContext } from '../contexts/EditorContent.jsx';
import { ImageProvider, useImageContext } from '../contexts/ImageContext.jsx';
import { useExportState } from '../hooks/useExportState.js';
import { toast } from 'sonner';
import {
  rewriteText,
  expandText,
  summarizeText,
  changeTone,
  bulletToParagraph,
  paraphraseText,
  improveReadability,
  callAIStreamAPI
} from '../ai/aiUtils.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { DocumentExporter } from '../../../utils/documentExporter.js';
import { DocumentOutline } from './editor/DocumentOutline';
import { TemplateSidebar } from './editor/TemplateSidebar.jsx';
import HeaderMenuBar from './editor/HeaderMenuBar';
import { FindReplaceModal } from './editor/FindReplaceModal';
import { AIAssistant } from './editor/AIAssistant.jsx';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api';
import { TextEditorService } from '../../../services/Text-Editor/text.service.js';
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
  Plus,
  RemoveFormatting,
  Subscript,
  Superscript,
  Ruler,
  Columns,
  X,
  FileText,
  Edit3,
  Eye,
  Settings,
  HelpCircle,
  Sparkles,
  Save,
  FolderOpen,
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
  Star,
  Palette,
  Paintbrush,
  Heading,
  Text,
  BarChart,
  Languages,
  ListChecks,
  History,
  Keyboard,
  Info,
  FilePlus2,
  LayoutTemplate,
  Grid3x3,
  IndentIncrease,
  IndentDecrease,
  Rows,
  Wand2,
  Table2,
  Bookmark,
  Mail,
  Tag,
  Terminal,
  Droplet,
  Maximize,
  RotateCw,
  Crop,
  ArrowRightToLine,
  ArrowLeftToLine,
  FilePlus,
  CornerDownLeft,
  Split,
  Code2,
  Clipboard,
  Brain,
  Trash2,
  ChevronDown,
  Play,
  RefreshCw,
  BookOpen,
  Check,
  FileEdit,
  RotateCcw,
  Droplets,
  Smile,
  Upload
} from 'lucide-react';
import { Separator } from './ui/separator';
import { Tooltip, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import IndentControls from './editor/toolbar/IndentControls.jsx';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "./ui/popover";
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
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import { cn } from "./utils";
import { scrollLockManager } from '../utils/scrollLockManager';
import { guardToolbarMouseDown, runWithSavedSelection, preventEditorBlur, saveSelection, onMenuOpen, onMenuClose } from './editor/focusUtils';
import { useKeyboardShortcuts } from './editor/useKeyboardShortcuts';

// New feature components
import { CommentsPanel as _CommentsPanel } from './editor/CommentsPanel';
import { VersionHistory as _VersionHistory } from './editor/VersionHistory';
import { VoiceTyping as _VoiceTyping } from './editor/VoiceTyping';
import { PageSetupDialog as _PageSetupDialog } from './editor/PageSetupDialog';
import { KeyboardShortcutsDialog as _KeyboardShortcutsDialog } from './editor/KeyboardShortcutsDialog';
import { WordCountDialog as _WordCountDialog } from './editor/WordCountDialog';

// Safety: if any module exports an object instead of a component function, render null
const _safe = (C) => (typeof C === 'function' ? C : () => null);
const CommentsPanel = _safe(_CommentsPanel);
const VersionHistory = _safe(_VersionHistory);
const VoiceTyping = _safe(_VoiceTyping);
const PageSetupDialog = _safe(_PageSetupDialog);
const KeyboardShortcutsDialog = _safe(_KeyboardShortcutsDialog);
const WordCountDialog = _safe(_WordCountDialog);


// Constants
const FONTS = [
  { label: "Arial", value: "Arial" },
  { label: "Georgia", value: "Georgia" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Courier New", value: "Courier New" },
  { label: "Verdana", value: "Verdana" },
  { label: "Trebuchet MS", value: "Trebuchet MS" },
  { label: "Comic Sans MS", value: "Comic Sans MS" },
  { label: "Impact", value: "Impact" },
  { label: "Helvetica", value: "Helvetica" },
  { label: "Tahoma", value: "Tahoma" },
  { label: "Palatino", value: "Palatino Linotype" },
  { label: "Garamond", value: "Garamond" }
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

const TEXT_COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9",
  "#efefef", "#f3f3f3", "#ffffff", "#980000", "#ff0000", "#ff9900", "#ffff00",
  "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff",
  "#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3",
  "#cfe2f3", "#d9d2e9", "#ead1dc", "#ea9999", "#f9cb9c", "#ffe599",
  "#b6d7a8", "#a2c4c9", "#9fc5e8", "#b4a7d6", "#d5a6bd", "#cc4125",
  "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3d85c6", "#674ea7",
  "#a64d79"
];

const HIGHLIGHT_COLORS = [
  "#ffff00", "#00ff00", "#00ffff", "#ff00ff", "#ff0000", "#0000ff",
  "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#cfe2f3", "#d9d2e9",
  "#ead1dc", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9",
  "#9fc5e8", "#b4a7d6", "#d5a6bd", "#e6b8af", "#f4cccc", "#fce5cd",
  "#fff2cc", "#d9ead3", "#d0e0e3", "#cfe2f3", "#d9d2e9", "#ead1dc"
];

const TONES = [
  "Professional", "Casual", "Academic", "Creative", "Technical",
  "Formal", "Friendly", "Persuasive", "Informative", "Narrative"
];

const EXPORT_FORMATS = [
  { label: "PDF", value: "pdf", icon: FileText },
  { label: "DOCX", value: "docx", icon: FileText },
  { label: "EPUB", value: "epub", icon: FileText },
  { label: "Markdown", value: "md", icon: FileText },
  { label: "HTML", value: "html", icon: FileText },
  { label: "Plain Text", value: "txt", icon: FileText },
  { label: "JSON", value: "json", icon: FileText },
  { label: "XML", value: "xml", icon: FileText },
  { label: "CSV", value: "csv", icon: FileText },
  { label: "RTF", value: "rtf", icon: FileText }
];

const CODE_LANGUAGES = [
  "javascript", "python", "java", "c", "cpp", "csharp", "php", "ruby",
  "go", "swift", "kotlin", "typescript", "html", "css", "sql", "bash",
  "rust", "scala", "r", "dart", "lua", "perl", "haskell", "elixir"
];

// ToolbarButton Component
const ToolbarButton = ({
  editor,
  onClick,
  isActive = false,
  disabled = false,
  tooltip,
  children,
  className,
  ariaLabel
}) => {
  let cleanClass = className || "";
  if (cleanClass.includes("from-blue-") || cleanClass.includes("from-green-") || cleanClass.includes("from-gray-")) {
    cleanClass = "";
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      onMouseDown={(e) => { guardToolbarMouseDown(e, editor); }}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || tooltip}
      className={cn(
        "h-8 w-8 p-0 rounded-full flex items-center justify-center transition-all duration-200 border",
        isActive
          ? "bg-green-100 border-green-300 text-green-600 shadow-inner"
          : "bg-transparent border-transparent text-blue-500 hover:bg-blue-100/50 hover:border-blue-200",
        disabled && "opacity-50 cursor-not-allowed",
        cleanClass
      )}
    >
      {children}
    </Button>
  );
};

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
  // Routing
  navigateTo,
  // Export Loading State
  exportLoading,
  // Blockquote function
  toggleBlockquote,
  className
}) => {
  // Removed debug log to prevent console spam

  // Setup keyboard shortcuts
  useKeyboardShortcuts(editor, {
    onSave,
    onPrint: () => {
      setTimeout(() => {
        if (onPrint && typeof onPrint === 'function') {
          const content = editor && typeof editor.getHTML === 'function' ? editor.getHTML() : '';
          onPrint(content);
        } else {
          handlePrint(); // Use the fallback print function
        }
      }, 100);
    },
    onSearch: () => setShowSearch(prev => !prev),
    onHelp: () => setShowShortcutsDialog(true),
    onNewDocument: () => {
      if (window.confirm('Create new document? Current changes will be lost.')) {
        editor.commands.clearContent();
      }
    }
  });

  // Check if cursor is inside a table - moved to top to avoid initialization issues
  const isInsideTable = () => {
    if (!editor) return false;

    try {
      const { state } = editor;
      const { selection } = state;
      const { $from } = selection;

      // Check if selection is inside a table
      for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node && (node.type.name === 'table' || node.type.name === 'tableRow' || node.type.name === 'tableCell' || node.type.name === 'customTable')) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking table position:', error);
      return false;
    }
  };

  const [linkUrl, setLinkUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const [currentFontSize, setCurrentFontSizeState] = useState(11);
  const [currentFont, setCurrentFont] = useState("Arial");
  const [currentTextColor, setCurrentTextColor] = useState("#000000");
  const [currentHighlight, setCurrentHighlight] = useState("#ffff00");
  const [lineSpacing, setLineSpacing] = useState(1.15);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);

  // Zoom helper functions
  const effectiveZoom = zoom || 100;

  const onZoomChangeWithFeedback = (newZoom) => {
    // Round zoom to the nearest multiple of 10
    const roundedZoom = Math.round(newZoom / 10) * 10;
    // Ensure zoom stays within valid bounds (50-200)
    const clampedZoom = Math.max(50, Math.min(200, roundedZoom));
    if (onZoomChange && typeof onZoomChange === 'function') {
      onZoomChange(clampedZoom);
      toast.success(`Zoom set to ${clampedZoom}%`);
    } else {
      toast.error('Zoom function not available');
    }
  };
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('');
  const [exportProgressMessage, setExportProgressMessage] = useState('');

  // Routing
  const navigate = useNavigate();

  // AI States
    const [showCodeBlockMenu, setShowCodeBlockMenu] = useState(false);
  const [showCodeBlockConfigDialog, setShowCodeBlockConfigDialog] = useState(false);
  const [selectedCodeLanguage, setSelectedCodeLanguage] = useState('javascript');
  const [codeExecutionEnabled, setCodeExecutionEnabled] = useState(false);
  const [codeTheme, setCodeTheme] = useState('default');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [codeWrapEnabled, setCodeWrapEnabled] = useState(false);

  // Document Generation States
  const [documentTopic, setDocumentTopic] = useState("");
  const [documentPages, setDocumentPages] = useState(1);
  const [documentTone, setDocumentTone] = useState("Professional");
  const [documentType, setDocumentType] = useState("Technical Document");
  const [documentCreativity, setDocumentCreativity] = useState([0.7]);

  // File upload ref
  const fileInputRef = useRef(null);
  const aiDocControllerRef = useRef(null);
  const aiInlineControllerRef = useRef(null);

  // New feature panel states
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showVoiceTyping, setShowVoiceTyping] = useState(false);
  const [showPageSetup, setShowPageSetup] = useState(false);
  const [showWordCount, setShowWordCount] = useState(false);
  const [textDirection, setTextDirectionState] = useState('ltr');
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [lineSpacingMenuOpen, setLineSpacingMenuOpen] = useState(false);
  const [pageMargins, setPageMargins] = useState({ top: 96, bottom: 96, left: 96, right: 96 });
  const [documentVersions, setDocumentVersions] = useState([]);
  const [showInsertLink, setShowInsertLink] = useState(false);
  const [linkDisplayText, setLinkDisplayText] = useState('');

  // Auto-hide export progress messages after 5 seconds
  useEffect(() => {
    if (exportProgressMessage) {
      const timer = setTimeout(() => {
        setExportProgressMessage('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [exportProgressMessage]);

  // Keyboard shortcuts for table manipulation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isInsideTable()) return;

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
  }, [editor]); // Use editor as dependency instead of isInsideTable()

  // Helper function to set font size
  const setCurrentFontSize = (size) => {
    setCurrentFontSizeState(size);
    // Double-RAF: fires after Radix Select's own async close frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        runWithSavedSelection(editor, (chain) => chain.setFontSize(`${size}px`));
      });
    });
  };

  if (!editor) return null;

  // ========================
  // ROUTING FUNCTIONS
  // ========================

  const handleNavigation = (path) => {
    if (navigateTo && typeof navigateTo === 'function') {
      navigateTo(path);
    } else {
      navigate(path);
    }
  };

  const handleExternalLink = (url) => {
    window.open(url, '_blank');
  };

  // ========================
  // FORMATTING FUNCTIONS
  // ========================

  // Manage inert on the editor content while menus are open to satisfy ARIA guidance
  const setContentInert = (inert) => {
    try {
      const container = document.querySelector('.document-container')?.parentElement
        || document.querySelector('.content-container')
        || document.querySelector('.ProseMirror')?.closest('.document-container')?.parentElement;
      if (!container) return;
      if (inert) {
        if (window.isToolbarInteraction) return;
        container.setAttribute('inert', '');
      } else {
        container.removeAttribute('inert');
      }
    } catch { }
  };

  // Focus helpers for ARIA-safe menu interactions
  const blurEditor = () => {
    try {
      if (editor?.view?.dom && typeof editor.view.dom.blur === 'function') {
        editor.view.dom.blur();
      }
    } catch { }
  };
  const focusEditor = () => {
    try {
      if (editor?.view?.dom && typeof editor.view.dom.focus === 'function') {
        editor.view.dom.focus({ preventScroll: true });
      }
    } catch { }
  };

  const setFontFamily = (font) => {
    setCurrentFont(font);
    // Double-RAF: fires after Radix Select's own async close frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        runWithSavedSelection(editor, (chain) => chain.setFontFamily(font));
      });
    });
  };

  const setTextColor = (color) => {
    setCurrentTextColor(color);
    runWithSavedSelection(editor, (chain) => chain.setColor(color));
  };

  const setHighlightColor = (color) => {
    setCurrentHighlight(color);
    runWithSavedSelection(editor, (chain) => chain.setHighlight({ color }));
  };

  const clearFormatting = () => {
    if (!editor) return;
    runWithSavedSelection(editor, (chain) => chain.unsetAllMarks().clearNodes());
    toast.success('Formatting cleared');
  };

  // List toggle functions
  const toggleBulletList = () => {
    runWithSavedSelection(editor, (chain) => chain.toggleBulletList());
    toast.success('Bullet list toggled');
  };

  const toggleOrderedList = () => {
    runWithSavedSelection(editor, (chain) => chain.toggleOrderedList());
    toast.success('Numbered list toggled');
  };

  const removeListFormatting = () => {
    runWithSavedSelection(editor, (chain) => chain.liftListItem('listItem'));
    if (editor?.isActive('bulletList') || editor?.isActive('orderedList')) {
      runWithSavedSelection(editor, (chain) => chain.lift('listItem'));
    }
    toast.success('List formatting removed');
  };

  const toggleTaskList = () => {
    runWithSavedSelection(editor, (chain) => chain.toggleTaskList());
    toast.success('Task list toggled');
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
    const previousUrl = editor?.getAttributes('link').href;
    const url = prompt('Enter URL:', previousUrl || '');
    if (url && editor) {
      runWithSavedSelection(editor, (chain) => chain.setLink({ href: url }));
      toast.success('Link added');
    }
  };

  const addImage = () => {
    if (handleInsertImage) {
      handleInsertImage();
    } else {
      const url = prompt('Enter image URL:');
      if (url && editor) {
        runWithSavedSelection(editor, (chain) => chain.setImage({ src: url }));
        toast.success('Image added');
      }
    }
  };

  const [showTablePicker, setShowTablePicker] = useState(false);
  const [selectedRows, setSelectedRows] = useState(0);
  const [selectedCols, setSelectedCols] = useState(0);
  const tablePickerRef = useRef(null);
  const tableButtonRef = useRef(null);

  // Position the table picker dropdown
  useLayoutEffect(() => {
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
          event.target.closest('button[data-icon="table"]') ||
          event.target === tableButtonRef.current;
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

  const insertTable = (rows, cols) => {
    console.log('[TextEditor] insertTable called with:', rows, 'x', cols);
    
    if (!editor || editor.isDestroyed) {
      console.error('[TextEditor] Editor not available or destroyed');
      toast.error('Editor not available');
      return;
    }

    try {
      // Validate input
      if (!rows || !cols || rows <= 0 || cols <= 0) {
        console.error('[TextEditor] Invalid dimensions:', rows, 'x', cols);
        toast.error('Invalid table dimensions');
        return;
      }

      console.log('[TextEditor] Building table structure...');
      
      // Build table HTML for reliable insertion
      const tableHTML = `
        <table style="border-collapse: collapse; width: 100%; border: 2px solid #000;">
          <tbody>
            ${Array.from({ length: rows }, (_, rowIndex) => `
              <tr>
                ${Array.from({ length: cols }, () => `
                  <${rowIndex === 0 ? 'th' : 'td'} 
                    style="border: 2px solid #333; padding: 8px; min-width: 60px; ${rowIndex === 0 ? 'background-color: #e0e0e0; font-weight: bold;' : ''}">
                    <p></p>
                  </${rowIndex === 0 ? 'th' : 'td'}>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      console.log('[TextEditor] Inserting table HTML...');
      
      // Use runWithSavedSelection to maintain cursor position and prevent blur
      const result = runWithSavedSelection(editor, (chain) => chain.insertContent(tableHTML));
      
      console.log('[TextEditor] Insert result:', result);
      
      // Close picker and reset state
      setShowTablePicker(false);
      setSelectedRows(0);
      setSelectedCols(0);
      
      if (result) {
        toast.success(`${rows}×${cols} table inserted`);
        // Focus the editor after a short delay
        setTimeout(() => {
          if (!editor.isDestroyed) {
            editor.commands.focus();
          }
        }, 50);
      } else {
        console.error('[TextEditor] Table insertion failed');
        toast.error('Failed to insert table');
      }
    } catch (err) {
      console.error('[TextEditor] Table insertion error:', err);
      toast.error('Could not insert table: ' + err.message);
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
    const gridSize = 10;
    const cells = [];

    for (let row = 1; row <= gridSize; row++) {
      for (let col = 1; col <= gridSize; col++) {
        const isSelected = row <= selectedRows && col <= selectedCols;
        cells.push(
          <div
            key={`${row}-${col}`}
            className={`w-5 h-5 border border-gray-300 rounded-sm ${
              isSelected 
                ? 'bg-blue-500 border-blue-600 shadow-sm' 
                : 'bg-white hover:bg-blue-100'
            } cursor-pointer transition-all duration-150 transform hover:scale-110`}
            onMouseEnter={() => handleTablePickerHover(row, col)}
            onMouseDown={(e) => {
              preventEditorBlur(e);
              insertTable(row, col);
            }}
            style={{
              gridColumn: col,
              gridRow: row
            }}
          />
        );
      }
    }

    return (
      <div className="p-2">
        <div 
          className="grid gap-0.5 bg-white p-1"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, min-content)`,
            gridTemplateRows: `repeat(${gridSize}, min-content)`
          }}
        >
          {cells}
        </div>
        <div className="text-center mt-3 text-sm text-gray-700 font-semibold min-w-[120px]">
          {selectedRows > 0 && selectedCols > 0 
            ? `${selectedCols} × ${selectedRows} Table` 
            : 'Select table size'}
        </div>
      </div>
    );
  };

  // Table manipulation functions for Tiptap tables
  const addTableRow = () => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }
    if (editor.can().addRowAfter) {
      runWithSavedSelection(editor, (chain) => chain.addRowAfter());
      toast.success('Row added to table');
    } else {
      toast.error('No table selected or feature not available');
    }
  };

  const addTableColumn = () => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }
    if (editor.can().addColumnAfter) {
      runWithSavedSelection(editor, (chain) => chain.addColumnAfter());
      toast.success('Column added to table');
    } else {
      toast.error('No table selected or feature not available');
    }
  };

  const deleteTableRow = () => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }
    if (editor.can().deleteRow) {
      runWithSavedSelection(editor, (chain) => chain.deleteRow());
      toast.success('Row deleted from table');
    } else {
      toast.error('No table selected or feature not available');
    }
  };

  const deleteTableColumn = () => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }
    if (editor.can().deleteColumn) {
      runWithSavedSelection(editor, (chain) => chain.deleteColumn());
      toast.success('Column deleted from table');
    } else {
      toast.error('No table selected or feature not available');
    }
  };

  const toggleTableHeader = () => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }
    if (editor.can().toggleHeaderCell) {
      runWithSavedSelection(editor, (chain) => chain.toggleHeaderCell());
      toast.success('Table header toggled');
    } else {
      toast.error('No table selected or feature not available');
    }
  };

  const deleteTable = () => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }
    if (editor.can().deleteTable) {
      if (window.confirm('Are you sure you want to delete this table?')) {
        runWithSavedSelection(editor, (chain) => chain.deleteTable());
        toast.success('Table deleted');
      }
    } else {
      toast.error('No table selected or feature not available');
    }
  };

  const addSectionBreak = (type = 'page') => {
    if (editor) {
      runWithSavedSelection(editor, (chain) => chain.setHorizontalRule());

      toast.success(`Section break (${type}) inserted`);
    }
  };

  const handlePrint = () => {
    // Calling browser print directly now that @media print CSS is optimized
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
        setShowImageDialog(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const setLineSpacingValue = (spacing) => {
    if (editor) {
      runWithSavedSelection(editor, (chain) => chain.updateAttributes('paragraph', { lineHeight: spacing }));
      setLineSpacing(spacing);
      toast.success(`Line spacing set to ${spacing}`);
    }
  };

  // Document Structure Functions
  const setTextAlign = (alignment) => {
    runWithSavedSelection(editor, (chain) => chain.setTextAlign(alignment));
  };

  const removeTextAlignment = () => {
    runWithSavedSelection(editor, (chain) => chain.unsetTextAlign());
    toast.success('Text alignment removed');
  };

  const getCurrentTextAlign = () => {
    if (!editor) return 'left';

    if (editor.isActive({ textAlign: 'center' })) return 'center';
    if (editor.isActive({ textAlign: 'right' })) return 'right';
    if (editor.isActive({ textAlign: 'justify' })) return 'justify';
    return 'left';
  };

  const getCurrentListType = () => {
    if (!editor) return null;

    if (editor.isActive('bulletList')) return 'bullet';
    if (editor.isActive('orderedList')) return 'ordered';
    if (editor.isActive('taskList')) return 'task';
    return null;
  };

  const hasListFormatting = () => {
    if (!editor) return false;
    return editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList');
  };

  const hasTextAlignment = () => {
    if (!editor) return false;
    return editor.isActive({ textAlign: 'center' }) ||
      editor.isActive({ textAlign: 'right' }) ||
      editor.isActive({ textAlign: 'justify' });
  };


  const indent = () => {
    console.log('Indent button clicked');
    console.log('Editor available:', !!editor);
    if (editor) {
      console.log('Editor commands:', Object.keys(editor.commands));
      console.log('Is active listItem:', editor.isActive('listItem'));
      console.log('Can indent:', editor.can().indent());

      try {
        // If we're in a list item, increase the list item indent (Google Docs style)
        if (editor.isActive('listItem')) {
          console.log('Indenting list item');
          runWithSavedSelection(editor, (chain) => chain.sinkListItem('listItem'));
          toast.success('List item indented');
        } else {
          // For regular paragraphs/headers, use the standard indent
          console.log('Indenting regular text');
          runWithSavedSelection(editor, (chain) => chain.indent());
          toast.success('Text indented');
        }
      } catch (error) {
        console.error('Indent error:', error);
        toast.error('Failed to indent text');
      }
    } else {
      console.log('No editor available');
    }
  };

  const outdent = () => {
    console.log('Outdent button clicked');
    console.log('Editor available:', !!editor);
    if (editor) {
      console.log('Editor commands:', Object.keys(editor.commands));
      console.log('Is active listItem:', editor.isActive('listItem'));
      console.log('Can outdent:', editor.can().outdent());

      try {
        // If we're in a list item, decrease the list item indent (Google Docs style)
        if (editor.isActive('listItem')) {
          console.log('Outdenting list item');
          runWithSavedSelection(editor, (chain) => chain.liftListItem('listItem'));
          toast.success('List item outdented');
        } else {
          // For regular paragraphs/headers, use the standard outdent
          console.log('Outdenting regular text');
          runWithSavedSelection(editor, (chain) => chain.outdent());
          toast.success('Text outdented');
        }
      } catch (error) {
        console.error('Outdent error:', error);
        toast.error('Failed to outdent text');
      }
    } else {
      console.log('No editor available');
    }
  };

  // Context-aware enablement for indentation controls
  const canIndent = (() => {
    if (!editor) return false;
    try {
      if (editor.isActive('listItem')) {
        return editor.can().sinkListItem('listItem');
      }
      return typeof editor.can().indent === 'function' ? editor.can().indent() : true;
    } catch {
      return true;
    }
  })();

  const canOutdent = (() => {
    if (!editor) return false;
    try {
      if (editor.isActive('listItem')) {
        return editor.can().liftListItem('listItem');
      }
      return typeof editor.can().outdent === 'function' ? editor.can().outdent() : true;
    } catch {
      return true;
    }
  })();

  const toggleCodeBlock = () => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }
    runWithSavedSelection(editor, (chain) => chain.toggleCodeBlock());
    toast.success('Code block toggled');
  };

  const insertCodeBlockWithLanguage = (language) => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }

    // Set the language and insert code block
    runWithSavedSelection(editor, (chain) => chain.toggleCodeBlock());

    // Update the code block attributes with language
    if (editor.isActive('codeBlock')) {
      editor.commands.updateAttributes('codeBlock', { language });
    }

    setSelectedCodeLanguage(language);
    setShowCodeBlockMenu(false);
    toast.success(`${language} code block inserted`);
  };

  const toggleCodeExecution = () => {
    setCodeExecutionEnabled(!codeExecutionEnabled);
    toast.info(`Code execution ${!codeExecutionEnabled ? 'enabled' : 'disabled'}`);
  };

  const executeCodeBlock = () => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }

    // Get the current code block content
    const codeBlock = editor.state.doc.cut(editor.state.selection.from, editor.state.selection.to);
    const codeContent = codeBlock.textContent || '';

    if (!codeContent.trim()) {
      toast.error('No code to execute');
      return;
    }

    toast.success('Code execution started...');
    // In a real implementation, this would execute the code in a secure sandbox
    console.log('Executing code:', codeContent);
  };

  const applyCodeBlockConfiguration = () => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }

    // Apply the current configuration to the code block
    if (editor.isActive('codeBlock')) {
      editor.commands.updateAttributes('codeBlock', {
        language: selectedCodeLanguage,
        theme: codeTheme,
        lineNumbers: showLineNumbers,
        wrap: codeWrapEnabled
      });

      toast.success('Code block configuration applied');
    }

    setShowCodeBlockConfigDialog(false);
  };

  const resetCodeBlockConfiguration = () => {
    setCodeTheme('default');
    setShowLineNumbers(true);
    setCodeWrapEnabled(false);
    setSelectedCodeLanguage('javascript');
    toast.info('Code block configuration reset to defaults');
  };

  const openCodeBlockConfigDialog = () => {
    setShowCodeBlockConfigDialog(true);
    setShowCodeBlockMenu(false);
  };

  const updateCodeBlockTheme = (theme) => {
    setCodeTheme(theme);
    if (editor && editor.isActive('codeBlock')) {
      editor.commands.updateAttributes('codeBlock', { theme });
    }
  };

  const toggleLineNumbers = () => {
    const newValue = !showLineNumbers;
    setShowLineNumbers(newValue);
    if (editor && editor.isActive('codeBlock')) {
      editor.commands.updateAttributes('codeBlock', { lineNumbers: newValue });
    }
  };

  const toggleCodeWrap = () => {
    const newValue = !codeWrapEnabled;
    setCodeWrapEnabled(newValue);
    if (editor && editor.isActive('codeBlock')) {
      editor.commands.updateAttributes('codeBlock', { wrap: newValue });
    }
  };



  const openImageCropper = () => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }
    if (!editor.view || !editor.view.state || !editor.view.state.selection) {
      toast.error('Editor is not ready');
      return;
    }

    const { from, to } = editor.view.state.selection;
    let foundImage = false;

    editor.state.doc.nodesBetween(from, to, (node) => {
      if (node.type.name === 'image') {
        const imgSrc = node.attrs.src;
        setSelectedImage(imgSrc);
        setIsCropDialogOpen(true);

        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
          setCropArea({
            x: img.width * 0.25,
            y: img.height * 0.25,
            width: img.width * 0.5,
            height: img.height * 0.5
          });
        };
        img.src = imgSrc;
        foundImage = true;
        return false;
      }
      return true;
    });

    if (!foundImage) {
      editor.state.doc.descendants(node => {
        if (node.type.name === 'image') {
          const imgSrc = node.attrs.src;
          setSelectedImage(imgSrc);
          setIsCropDialogOpen(true);

          const img = new Image();
          img.onload = () => {
            setImageDimensions({ width: img.width, height: img.height });
            setCropArea({
              x: img.width * 0.25,
              y: img.height * 0.25,
              width: img.width * 0.5,
              height: img.height * 0.5
            });
          };
          img.src = imgSrc;
          foundImage = true;
          return false;
        }
        return true;
      });
    }

    if (!foundImage) {
      toast.error('Please insert an image to crop');
    }
  };

  const applyCrop = () => {
    if (!selectedImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = cropArea.width;
      canvas.height = cropArea.height;

      ctx.drawImage(
        img,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      );

      const croppedImageDataUrl = canvas.toDataURL('image/png');

      let imagePos = null;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'image' && node.attrs.src === selectedImage) {
          imagePos = pos;
          return false;
        }
        return true;
      });

      if (imagePos !== null) {
        editor.commands.deleteRange({ from: imagePos, to: imagePos + 1 });
        editor.commands.insertContentAt(imagePos, {
          type: 'image',
          attrs: { src: croppedImageDataUrl }
        });
      } else {
        editor.commands.insertContent({
          type: 'image',
          attrs: { src: croppedImageDataUrl }
        });
      }

      toast.success('Image cropped successfully');
      setIsCropDialogOpen(false);
      setSelectedImage(null);
    };

    img.src = selectedImage;
  };

  const cancelCrop = () => {
    setIsCropDialogOpen(false);
    setSelectedImage(null);
  };

  // Formatting action handlers
  const handleFormatAction = (action) => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }
    try {
      const run = (runner) => runWithSavedSelection(editor, (chain) => runner(chain));
      switch (action) {
        case 'bold':
          run((chain) => chain.toggleBold());
          break;
        case 'italic':
          run((chain) => chain.toggleItalic());
          break;
        case 'underline':
          run((chain) => chain.toggleUnderline());
          break;
        case 'strike':
          run((chain) => chain.toggleStrike());
          break;
        case 'superscript':
          run((chain) => chain.toggleSuperscript());
          toast.success('Superscript applied');
          break;
        case 'subscript':
          run((chain) => chain.toggleSubscript());
          toast.success('Subscript applied');
          break;
        default:
          toast.error('Unknown format action');
          break;
      }
    } catch (error) {
      console.error('Format action error:', error);
      toast.error('Failed to apply formatting');
    }
  };

  const handleInsertAction = (action) => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }

    try {
      switch (action) {
        case 'image':
          if (handleInsertImage) {
            handleInsertImage();
          } else {
            const url = prompt('Enter image URL:');
            if (url) {
              runWithSavedSelection(editor, (chain) => chain.setImage({ src: url }));
              toast.success('Image inserted');
            }
          }
          break;
        case 'table':
          setShowTablePicker(!showTablePicker);
          break;
        case 'link':
          const linkUrl = prompt('Enter URL:');
          if (linkUrl) {
            runWithSavedSelection(editor, (chain) => chain.setLink({ href: linkUrl }));
            toast.success('Link inserted');
          }
          break;
        case 'page_break': {
          const { state: pbState } = editor;
          const { $from: pbFrom } = pbState.selection;
          const pbDepth   = pbFrom.depth;
          const pbTopEnd  = pbDepth > 0 ? pbFrom.end(1) + 1 : pbFrom.pos;
          const pbInsertPos = Math.min(pbTopEnd, pbState.doc.content.size);
          editor.chain().insertContentAt(pbInsertPos, { type: 'pageBreak' }).run();
          toast.success('Page break inserted');
          break;
        }
        case 'date':
          const date = new Date().toLocaleDateString();
          runWithSavedSelection(editor, (chain) => chain.insertContent(date));
          toast.success('Date inserted');
          break;
        case 'time':
          const time = new Date().toLocaleTimeString();
          runWithSavedSelection(editor, (chain) => chain.insertContent(time));
          toast.success('Time inserted');
          break;
        case 'symbol':
          const symbol = prompt('Enter symbol (e.g., ©, ®, ™):', '©');
          if (symbol) {
            runWithSavedSelection(editor, (chain) => chain.insertContent(symbol));
            toast.success('Symbol inserted');
          }
          break;
        case 'equation':
          runWithSavedSelection(editor, (chain) => chain.insertContent('\\[E = mc^2\\]'));
          toast.success('Equation inserted');
          break;
        case 'code_block':
          runWithSavedSelection(editor, (chain) => chain.toggleCodeBlock());
          toast.success('Code block toggled');
          break;
        case 'quote':
          runWithSavedSelection(editor, (chain) => chain.toggleBlockquote());
          toast.success('Quote toggled');
          break;
        default:
          toast.error('Unknown insert action');
          break;
      }
    } catch (error) {
      console.error('Insert action error:', error);
      toast.error('Failed to perform insert action');
    }
  };

  // ========================
  // AI FUNCTIONS
  // ========================

  const handleGenerateDocument = async () => {
    const controller = new AbortController();
    aiDocControllerRef.current && aiDocControllerRef.current.abort?.();
    aiDocControllerRef.current = controller;
    if (!documentTopic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    if (onGenerateDocument) {
      onGenerateDocument({
        topic: documentTopic,
        pages: documentPages,
        tone: documentTone,
        type: documentType
      });
    } else {
      setShowAIDocumentGenerator(false);
      editor.commands.clearContent();
      editor.commands.insertContent("<h1>Athena is forging your document...</h1><p>Please wait while the AI generates your content.</p>");

      try {
        await generateDocument(
          {
            topic: documentTopic,
            pages: documentPages,
            tone: documentTone,
            type: documentType,
            temperature: documentCreativity[0]
          },
          (full) => {
            runWithSavedSelection(editor, (chain) => chain.setContent(full));
          },
          { signal: controller.signal }
        );
        toast.success('Document forged successfully');
      } catch (error) {
        toast.error('Failed to generate document');
      }
    }

    setShowAIDocumentGenerator(false);
  };

  const handleAIInlineAction = async (actionOrMode, textOrResult) => {
    const controller = new AbortController();
    aiInlineControllerRef.current && aiInlineControllerRef.current.abort?.();
    aiInlineControllerRef.current = controller;
    if (!textOrResult) {
      toast.error('No content to process');
      return;
    }

    // New behavior: Commit a previously generated result
    if (actionOrMode === 'replace' || actionOrMode === 'insert') {
      const mode = actionOrMode;
      const result = textOrResult;

      if (!editor) {
        toast.error('Editor not ready');
        return;
      }

      const { from, to } = editor.state.selection;

      if (mode === 'replace') {
        runWithSavedSelection(editor, (chain) => chain.deleteRange({ from, to }).insertContent(result));
        toast.success('Text replaced with AI version');
      } else {
        runWithSavedSelection(editor, (chain) => chain.insertContentAt(to, `\n\n${result}`));
        toast.success('AI content inserted after selection');
      }
      return;
    }

    // Old behavior: Perform transformation directly (if called from elsewhere)
    if (onAIInlineAction) {
      onAIInlineAction(actionOrMode, textOrResult);
    } else {
      try {
        let result;
        const options = { temperature: 0.7, signal: controller.signal };

        switch (actionOrMode) {
          case 'rewrite': 
            result = await rewriteText(textOrResult, options); 
            break;
          case 'expand': 
            result = await expandText(textOrResult, options); 
            break;
          case 'summarize': 
            result = await summarizeText(textOrResult, options); 
            break;
          case 'change_tone': 
            result = await changeTone(textOrResult, 'professional', options); 
            break;
          case 'bullets_to_paragraph': 
            result = await bulletToParagraph(textOrResult, options); 
            break;
          case 'paraphrase': 
            result = await paraphraseText(textOrResult, options); 
            break;
          case 'improve_readability': 
            result = await improveReadability(textOrResult, options); 
            break;
          case 'custom': 
            // For custom actions, use a generic enhancement prompt
            const customPrompt = `Improve and enhance the following text: ${textOrResult}`;
            result = await callAIStreamAPI('generate', { prompt: customPrompt, temperature: 0.7 }, null, options.signal);
            break;
          default: 
            toast.error(`Unknown AI action: ${actionOrMode}`);
            return;
        }

        if (!editor) {
          toast.error('Editor is not ready');
          return;
        }

        const { from, to } = editor.state.selection;
        runWithSavedSelection(editor, (chain) => chain.deleteRange({ from, to }).insertContent(result));
        toast.success(`${actionOrMode.replace('_', ' ')} completed`);
      } catch (error) {
        toast.error(`Failed to ${actionOrMode.replace('_', ' ')} text`);
      }
    }
  };

  const handleCodeAssistant = async (mode, resultCode, language) => {
    if (!resultCode) {
      toast.error('No code to process');
      return;
    }

    // New behavior: Commit a previously generated result
    if (mode === 'replace' || mode === 'insert') {
      if (!editor) {
        toast.error('Editor not ready');
        return;
      }

      const { to } = editor.state.selection;

      // Wrap in code block if it's not already
      let formattedCode = resultCode;
      if (!resultCode.includes('```')) {
        formattedCode = `\`\`\`${language}\n${resultCode}\n\`\`\``;
      }

      if (mode === 'replace') {
        const { from, to: rangeTo } = editor.state.selection;
        runWithSavedSelection(editor, (chain) => chain.deleteRange({ from, to: rangeTo }).insertContent(formattedCode));
        toast.success('Code replaced with AI version');
      } else {
        runWithSavedSelection(editor, (chain) => chain.insertContentAt(to, `\n\n${formattedCode}`));
        toast.success('Code inserted after selection');
      }
      return;
    }

    if (onCodeAssistant) {
      onCodeAssistant(mode, resultCode, language);
    } else {
      try {
        let result = resultCode;
        const options = { temperature: 0.2 };

        switch (mode) {
          case 'generate': result = await generateCode(resultCode, language, options); break;
          case 'explain': result = await explainCode(resultCode, language, options); break;
          case 'refactor': result = await refactorCode(resultCode, language, options); break;
          case 'add_comments': result = await addComments(resultCode, language, options); break;
          default: return;
        }

        if (!editor) return;

        let formattedCode = result;
        if (!result.includes('```')) {
          formattedCode = `\`\`\`${language}\n${result}\n\`\`\``;
        }

        runWithSavedSelection(editor, (chain) => chain.insertContent(formattedCode));
        toast.success(`Code ${mode} completed`);
      } catch (error) {
        toast.error(`Forge failed`);
      }
    }
  };

  // ========================
  // LAYOUT FUNCTIONS
  // ========================

  const updatePageMargins = (margins) => {
    if (!margins || typeof margins !== 'object') {
      toast.error('Invalid margins provided');
      return;
    }

    // Validate margin values
    const validMargins = {
      top: Math.max(0, Math.min(200, margins.top || 72)),
      right: Math.max(0, Math.min(200, margins.right || 72)),
      bottom: Math.max(0, Math.min(200, margins.bottom || 72)),
      left: Math.max(0, Math.min(200, margins.left || 72))
    };

    // Update state
    setPageMargins(validMargins);

    // Update CSS variables for page margins
    document.documentElement.style.setProperty('--page-margin-top', `${validMargins.top}px`);
    document.documentElement.style.setProperty('--page-margin-right', `${validMargins.right}px`);
    document.documentElement.style.setProperty('--page-margin-bottom', `${validMargins.bottom}px`);
    document.documentElement.style.setProperty('--page-margin-left', `${validMargins.left}px`);

    // Also update editor container styling
    const editorContainer = document.querySelector('.tiptap.ProseMirror');
    if (editorContainer) {
      editorContainer.style.paddingTop = `${validMargins.top}px`;
      editorContainer.style.paddingRight = `${validMargins.right}px`;
      editorContainer.style.paddingBottom = `${validMargins.bottom}px`;
      editorContainer.style.paddingLeft = `${validMargins.left}px`;
    }

    toast.success(`Page margins set to ${validMargins.top}px (top), ${validMargins.right}px (right), ${validMargins.bottom}px (bottom), ${validMargins.left}px (left)`);
  };

  const setBorders = (type) => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }

    // Apply borders to selected content or current paragraph
    const borderStyles = {
      'page': '2px solid #000000',
      'paragraph': '1px solid #666666',
      'table': '1px solid #333333'
    };

    const borderStyle = borderStyles[type] || '1px solid #000000';

    const { from, to } = editor.state.selection;
    const borderedContent = `
      <div style="border:${borderStyle};padding:10px;margin:5px 0;">
        ${editor.getHTML().slice(from, to)}
      </div>
    `;
    runWithSavedSelection(editor, (chain) => chain.insertContent(borderedContent));
    toast.success(`${type} border applied`);
  };

  const insertSectionBreak = () => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }

    // Insert a proper section break with styling
    const sectionBreakHTML = `
        <div class="section-break" style="
        page-break-before: always;
        border-top: 1px dashed #cccccc;
        margin: 20px 0;
        text-align: center;
        color: #666666;
        font-size: 12px;
      ">
          SECTION BREAK
        </div>
        `;
    runWithSavedSelection(editor, (chain) => chain.insertContent(sectionBreakHTML));
    toast.success('Section break inserted');
  };

  // Page management functions are passed as props
  // addNewPage, addPageBreak, and insertPageNumber are received as props

  // ========================
  // TEXT DIRECTION (LTR/RTL)
  // ========================
  const setTextDir = (dir) => {
    if (!editor) return;
    setTextDirectionState(dir);
    runWithSavedSelection(editor, (chain) => chain.setTextDirection(dir));
    toast.success(`Text direction set to ${dir.toUpperCase()}`);
  };

  // ========================
  // FIND & REPLACE (live)
  // ========================
  const performFind = (term, replaceWith = null) => {
    if (!editor || !term) return;
    const text = editor.getText();
    const found = (text.toLowerCase().match(new RegExp(term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (replaceWith !== null) {
      const selText = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);
      if (selText && selText.toLowerCase() === term.toLowerCase()) {
        const { from, to } = editor.state.selection;
        runWithSavedSelection(editor, (chain) => chain.deleteRange({ from, to }).insertContent(replaceWith));
        toast.success('Replaced current selection');
      } else {
        toast.info(`Found ${found}. Replace current selection only (non-destructive).`);
      }
    } else {
      if (found > 0) toast.success(`Found ${found} occurrence(s) of "${term}"`);
      else toast.info(`"${term}" not found`);
    }
  };

  // ========================
  // LINE SPACING
  // ========================
  const applyLineSpacing = (value) => {
    setLineSpacing(value);
    if (!editor) return;
    runWithSavedSelection(editor, (chain) => chain.updateAttributes('paragraph', { lineHeight: value }));
    toast.success(`Line spacing set to ${value}`);
  };

  // ========================
  // VERSION MANAGEMENT
  // ========================
  const saveCurrentVersion = (version) => {
    if (version) {
      setDocumentVersions(prev => {
        const updated = prev.filter(v => v.id !== version.id);
        return [version, ...updated];
      });
    } else if (editor) {
      const newVersion = {
        id: Date.now(),
        title: `Version ${documentVersions.length + 1}`,
        content: editor.getHTML(),
        timestamp: new Date(),
        author: 'You',
      };
      setDocumentVersions(prev => [newVersion, ...prev]);
      toast.success('Version saved');
    }
  };

  const restoreVersion = (version) => {
    if (editor && version.content) {
      editor.commands.setContent(version.content);
      toast.success(`Restored to "${version.title}"`);
    }
  };

  // ========================
  // MENU DEFINITIONS
  // ========================

  const menuItems = [
    {
      label: 'File',
      items: [
        {
          label: 'New', icon: FilePlus2, shortcut: 'Ctrl+N', action: () => {
            if (window.confirm('Create new document? Current changes will be lost.')) {
              editor.commands.clearContent();
              toast.success('New document created');
            }
          }
        },
        {
          label: 'Open...', icon: FolderOpen, shortcut: 'Ctrl+O', action: () => {
            fileInputRef.current?.click();
          }
        },

        {
          label: 'Print', icon: Printer, shortcut: 'Ctrl+P', action: () => {
            setTimeout(() => {
              if (onPrint && typeof onPrint === 'function') {
                const content = editor && typeof editor.getHTML === 'function' ? editor.getHTML() : '';
                onPrint(content);
              } else {
                handlePrint();
              }
            }, 100);
          }
        },
        { type: 'separator' },
        {
          label: 'Export',
          icon: Download,
          submenu: EXPORT_FORMATS.map(format => ({
            label: exportLoading && exportLoading[format.value] ? `Exporting as ${format.label}...` : `Export as ${format.label}`,
            icon: exportLoading && exportLoading[format.value] ? Download : format.icon,
            action: () => {
              if (exportLoading && exportLoading[format.value]) {
                toast.info(`${format.label} export is already in progress`);
                return;
              }
              setExportFormat(format.value);
              setShowExportDialog(true);
            },
            disabled: exportLoading && exportLoading[format.value]
          }))
        },
        { type: 'separator' },
        {
          label: 'Rename Document', icon: FileEdit, action: () => {
            const current = documentTitle || 'Untitled';
            const newName = window.prompt('Rename document:', current);
            if (newName && newName.trim()) {
              toast.success(`Document renamed to "${newName.trim()}"`);
            }
          }
        },
        {
          label: 'Duplicate Document', icon: Copy, action: () => {
            if (editor) {
              const html = editor.getHTML();
              // Note: Removed localStorage usage. Pass content via URL params or backend storage.
              // For now, just open a new editor tab - user will need to manually copy content
              // or save both documents to backend and clone there.
              const newWindow = window.open('/editor', '_blank');
              toast.success('New editor tab opened. Please save document to backend to clone.');
            }
          }
        },
        { label: 'Delete Document', icon: Trash2, action: () => { if (window.confirm('Delete this document? This cannot be undone.')) { editor.commands.clearContent(); toast.success('Document deleted'); } } },
        { label: 'Restore Document', icon: RotateCcw, action: () => setShowVersionHistory(true) },
        { type: 'separator' },
        { label: 'Document Templates', icon: FileText, action: () => toast.info('Template selection dialog') },
        { label: 'Document Settings', icon: Settings, action: () => toast.info('Document settings dialog') },
      ]
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', icon: Undo, shortcut: 'Ctrl+Z', action: () => editor.chain().focus().undo().run() },
        { label: 'Redo', icon: Redo, shortcut: 'Ctrl+Y', action: () => editor.chain().focus().redo().run() },
        { type: 'separator' },
        { label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X', action: () => document.execCommand('cut') },
        {
          label: 'Copy', icon: Copy, shortcut: 'Ctrl+C', action: () => {
            document.execCommand('copy');
            toast.success('Copied to clipboard');
          }
        },
        { label: 'Paste', icon: Copy, shortcut: 'Ctrl+V', action: () => handleEditAction('paste', editor, null, handleCopy, handlePaste) },
        { label: 'Paste Without Formatting', icon: Clipboard, shortcut: 'Ctrl+Shift+V', action: () => handleEditAction('paste_plain', editor, null, handleCopy, handlePaste) },
        { type: 'separator' },
        { label: 'Select All', icon: CheckSquare, shortcut: 'Ctrl+A', action: () => editor.chain().focus().selectAll().run() },
        { label: 'Find', icon: Search, shortcut: 'Ctrl+F', action: () => setShowSearch(true) },
        { label: 'Replace', icon: Replace, shortcut: 'Ctrl+H', action: () => toast.info('Replace dialog would appear here') },
        { label: 'Go To', icon: Hash, shortcut: 'Ctrl+G', action: () => toast.info('Go to dialog') },
        { type: 'separator' },
        { label: 'Spell Check', icon: SpellCheck, action: () => toast.info('Spell check started') },
        {
          label: 'Word Count', icon: Hash, action: () => {
            const text = editor.getText();
            const words = text.trim().split(/\s+/).filter(Boolean).length;
            const chars = text.length;
            toast.info(`Words: ${words}, Characters: ${chars}`);
          }
        },
      ]
    },
    {
      label: 'View',
      items: [
        {
          label: 'Zoom',
          icon: ZoomIn,
          submenu: [
            {
              label: 'Zoom In', icon: ZoomIn, shortcut: 'Ctrl++', action: () => {
                if (onZoomChange && typeof onZoomChange === 'function') {
                  const currentZoom = zoom || 100;
                  const newZoom = Math.min(200, currentZoom + 10);
                  // Round to nearest multiple of 10
                  const roundedZoom = Math.round(newZoom / 10) * 10;
                  const clampedZoom = Math.max(50, Math.min(200, roundedZoom));
                  onZoomChange(clampedZoom);
                } else {
                  toast.error('Zoom function not available');
                }
              }
            },
            {
              label: 'Zoom Out', icon: ZoomOut, shortcut: 'Ctrl+-', action: () => {
                if (onZoomChange && typeof onZoomChange === 'function') {
                  const currentZoom = zoom || 100;
                  const newZoom = Math.max(50, currentZoom - 10);
                  // Round to nearest multiple of 10
                  const roundedZoom = Math.round(newZoom / 10) * 10;
                  const clampedZoom = Math.max(50, Math.min(200, roundedZoom));
                  onZoomChange(clampedZoom);
                } else {
                  toast.error('Zoom function not available');
                }
              }
            },
            {
              label: 'Zoom to 100%', icon: ZoomIn, shortcut: 'Ctrl+0', action: () => {
                if (onZoomChange && typeof onZoomChange === 'function') {
                  onZoomChange(100);
                } else {
                  toast.error('Zoom function not available');
                }
              }
            },
            { type: 'separator' },
            { label: '50%', action: () => onZoomChangeWithFeedback(50) },
            { label: '75%', action: () => onZoomChangeWithFeedback(75) },
            { label: '100%', action: () => onZoomChangeWithFeedback(100) },
            { label: '125%', action: () => onZoomChangeWithFeedback(125) },
            { label: '150%', action: () => onZoomChangeWithFeedback(150) },
            { label: '200%', action: () => onZoomChangeWithFeedback(200) },
          ]
        },
        {
          label: 'Full Screen', icon: Maximize2, shortcut: 'F11', action: () => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Show/Hide',
          icon: Eye,
          submenu: [
            {
              label: 'Ruler', icon: Ruler, checked: showRuler, action: () => setShowRuler(!showRuler)
            },
            {
              label: 'Grid', icon: Grid3x3, checked: showGrid, action: () => setShowGrid(!showGrid)
            },
            { label: 'Navigation Pane', icon: PanelLeft, action: () => toast.info('Navigation panel toggled') },
          ]
        },
        { type: 'separator' },
        {
          label: 'Dark Mode', icon: Moon, checked: isDarkMode, action: () => {
            setIsDarkMode(!isDarkMode);
            document.documentElement.classList.toggle('dark');
          }
        },
      ]
    },
    {
      label: 'Insert',
      items: [
        { label: 'Page Break', icon: Minus, action: () => handleInsertAction('page_break') },
        { label: 'Section Break', icon: Split, action: insertSectionBreak },
        { label: 'Page Number', icon: Hash, action: () => insertPageNumber() },
        { type: 'separator' },
        { label: 'Image', icon: Image, action: () => handleInsertAction('image') },
        { label: 'Crop Image', icon: Crop, action: openImageCropper },
        {
          label: 'Table', icon: Table, action: () => {
            if (isInsideTable()) {
              toast.info('Inside table - use More Options menu for table tools');
            } else {
              setShowTablePicker(!showTablePicker);
            }
          }
        },
        { label: "Advanced Table", icon: Table2, action: () => toast.info('Advanced table dialog') },
        { label: "Link", icon: Link, shortcut: "Ctrl+K", action: () => handleInsertAction('link') },
        { label: "Bookmark", icon: Bookmark, action: () => toast.info('Insert bookmark dialog') },
        { label: "Cross Reference", icon: Link, action: () => toast.info('Cross reference dialog') },
        { type: "separator" },
        { label: "Header", icon: Heading, action: () => toast.info('Insert header') },
        { label: "Footer", icon: Text, action: () => toast.info('Insert footer') },
        { label: "Footnote", icon: FileText, action: () => toast.info('Insert footnote') },
        { label: "Endnote", icon: FileText, action: () => toast.info('Insert endnote') },
        { type: "separator" },
        { label: "Date", icon: Calendar, action: () => handleInsertAction('date') },
        { label: "Time", icon: Clock, action: () => handleInsertAction('time') },
        { label: "Symbol", icon: Sigma, action: () => handleInsertAction('symbol') },
        { label: "Equation", icon: Calculator, action: () => handleInsertAction('equation') },
        { label: "Field", icon: Hash, action: () => toast.info('Insert field dialog') },
        { label: "Text Box", icon: Square, action: () => toast.info('Insert text box functionality') },
        { label: "Watermark", icon: Droplets, action: () => toast.info('Insert watermark functionality') },
        { type: "separator" },
      ]
    },
    {
      label: 'Format',
      items: [
        { label: 'Bold', icon: Bold, shortcut: 'Ctrl+B', action: () => handleFormatAction('bold') },
        { label: 'Italic', icon: Italic, shortcut: 'Ctrl+I', action: () => handleFormatAction('italic') },
        { label: 'Underline', icon: Underline, shortcut: 'Ctrl+U', action: () => handleFormatAction('underline') },
        { label: 'Strikethrough', icon: Strikethrough, action: () => handleFormatAction('strike') },
        { type: 'separator' },
        { label: 'Superscript', icon: Superscript, action: () => handleFormatAction('superscript') },
        { label: 'Subscript', icon: Subscript, action: () => handleFormatAction('subscript') },
        { type: 'separator' },
        {
          label: 'Align',
          icon: AlignLeft,
          submenu: [
            { label: "Bold", icon: Bold, shortcut: "Ctrl+B", action: () => handleFormatAction('bold') },
            { label: "Italic", icon: Italic, shortcut: "Ctrl+I", action: () => handleFormatAction('italic') },
            { label: "Underline", icon: Underline, shortcut: "Ctrl+U", action: () => handleFormatAction('underline') },
            { label: "Strikethrough", icon: Strikethrough, action: () => handleFormatAction('strike') },
            { type: "separator" },
            { label: "Superscript", icon: Superscript, shortcut: "Ctrl+Shift++", action: () => handleFormatAction('superscript') },
            { label: "Subscript", icon: Subscript, shortcut: "Ctrl+=", action: () => handleFormatAction('subscript') },
            { type: "separator" },
            { label: "Text Color", icon: Palette, action: () => setShowFormatMenu('color') },
            { label: "Highlight Color", icon: Highlighter, action: () => setShowFormatMenu('highlight') },
            { label: "Increase Font Size", icon: Plus, action: increaseFontSize },
            { label: "Decrease Font Size", icon: Minus, action: decreaseFontSize },
            { label: "Clear Formatting", icon: RemoveFormatting, shortcut: "Ctrl+Space", action: clearFormatting },
          ]
        },
        {
          label: "Paragraph",
          icon: Text,
          submenu: [
            { label: "Heading 1", icon: Heading, shortcut: "Ctrl+Alt+1", action: () => handleHeadingChange(1) },
            { label: "Heading 2", icon: Heading, shortcut: "Ctrl+Alt+2", action: () => handleHeadingChange(2) },
            { label: "Heading 3", icon: Heading, shortcut: "Ctrl+Alt+3", action: () => handleHeadingChange(3) },
            { label: "Heading 4", icon: Heading, action: () => handleHeadingChange(4) },
            { label: "Heading 5", icon: Heading, action: () => handleHeadingChange(5) },
            { label: "Heading 6", icon: Heading, action: () => handleHeadingChange(6) },
            { label: "Normal Text", icon: Text, action: () => handleHeadingChange(0) },
            { type: "separator" },
            { label: "Bullet List", icon: List, action: () => toggleBulletList() },
            { label: "Numbered List", icon: ListOrdered, action: () => toggleOrderedList() },
            { label: "Task List", icon: ListChecks, action: () => toggleTaskList() },
            { type: "separator" },
            {
              label: "Remove List Formatting",
              icon: X,
              action: () => removeListFormatting(),
              disabled: !hasListFormatting()
            },
            {
              label: "Multilevel List", icon: ListChecks, action: () => {
                if (editor) {
                  // Create a sample multilevel list structure
                  const multilevelList = `
        <ol>
          <li>First level item
            <ol>
              <li>Second level item
                <ol>
                  <li>Third level item</li>
                </ol>
              </li>
              <li>Another second level item</li>
            </ol>
          </li>
          <li>Another first level item</li>
        </ol>
        `;
                  runWithSavedSelection(editor, (chain) => chain.insertContent(multilevelList));
                  toast.success('Multilevel list inserted');
                }
              }
            },
            { type: "separator" },
            { label: "Align Left", icon: AlignLeft, action: () => setTextAlign('left') },
            { label: "Align Center", icon: AlignCenter, action: () => setTextAlign('center') },
            { label: "Align Right", icon: AlignRight, action: () => setTextAlign('right') },
            { label: "Justify", icon: AlignJustify, action: () => setTextAlign('justify') },
            { type: "separator" },
            {
              label: "Remove Alignment",
              icon: X,
              action: () => removeTextAlignment(),
              disabled: !hasTextAlignment()
            },
            { type: "separator" },
            { label: "Increase Indent", icon: IndentIncrease, action: indent },
            { label: "Decrease Indent", icon: IndentDecrease, action: outdent },
            { type: "separator" },
            {
              label: "Line Spacing", icon: Rows, action: () => {
                if (editor) {
                  // Show line spacing options
                  const spacingOptions = [
                    { label: 'Single', value: 1 },
                    { label: '1.15', value: 1.15 },
                    { label: '1.5', value: 1.5 },
                    { label: 'Double', value: 2 }
                  ];

                  const selectedSpacing = prompt(
                    'Select line spacing:\n' +
                    spacingOptions.map(opt => `${opt.label}: ${opt.value}`).join('\n') +
                    '\n\nEnter value (e.g., 1.5):',
                    '1.15'
                  );

                  if (selectedSpacing && !isNaN(parseFloat(selectedSpacing))) {
                    const spacingValue = parseFloat(selectedSpacing);
                    setLineSpacing(spacingValue);

                    // Apply line height to current paragraph
                    runWithSavedSelection(editor, (chain) => chain.updateAttributes('paragraph', { lineHeight: spacingValue }));
                    toast.success(`Line spacing set to ${spacingValue}`);
                  }
                }
              }
            },
            {
              label: "Paragraph Spacing", icon: Rows, action: () => {
                if (editor) {
                  const beforeSpacing = prompt('Paragraph spacing before (points):', '0');
                  const afterSpacing = prompt('Paragraph spacing after (points):', '0');

                  if (beforeSpacing !== null && afterSpacing !== null) {
                    const beforeValue = parseInt(beforeSpacing) || 0;
                    const afterValue = parseInt(afterSpacing) || 0;

                    // Apply paragraph spacing using custom styles
                    const spacingHTML = `
        <p style="margin-top: ${beforeValue}px; margin-bottom: ${afterValue}px;">
          ${editor.state.doc.textBetween(
                      editor.state.selection.from,
                      editor.state.selection.to,
                      ' '
                    ) || 'Paragraph with custom spacing'}
        </p>
        `;

                    runWithSavedSelection(editor, (chain) => chain.insertContent(spacingHTML));
                    toast.success(`Paragraph spacing set: ${beforeValue}pt before, ${afterValue}pt after`);
                  }
                }
              }
            },
            { label: "Keep Lines Together", icon: AlignCenter, action: () => toast.info('Keep lines together toggled') },
            { label: "Page Break Before", icon: CornerDownLeft, action: () => toast.info('Page break before applied') },
          ]
        },
        {
          label: "Styles",
          icon: Type,
          submenu: [
            { label: "Clear All Formatting", icon: RemoveFormatting, action: clearFormatting },
            { label: "Apply Style", icon: Paintbrush, action: () => toast.info('Style gallery') },
            { label: "Create New Style", icon: Plus, action: () => toast.info('Create style dialog') },
            { label: "Style Inspector", icon: Eye, action: () => toast.info('Style inspector panel') },
            { label: "Text Color", icon: Palette, action: () => setShowFormatMenu('color') },
            { label: "Highlight Color", icon: Highlighter, action: () => setShowFormatMenu('highlight') },
            { label: "Clear Formatting", icon: RemoveFormatting, shortcut: "Ctrl+Space", action: clearFormatting },
          ]
        },
      ]
    },
    {
      label: 'Tools',
      items: [
        { label: 'Spelling & Grammar', icon: SpellCheck, action: () => toast.info('Spell check started') },
        {
          label: 'Word Count', icon: Hash, action: () => setShowWordCount(true)
        },
        { type: 'separator' },
        { label: 'Voice Typing', icon: MessageSquare, action: () => setShowVoiceTyping(true) },
        { type: 'separator' },
        { label: 'Find & Replace', icon: Replace, shortcut: 'Ctrl+H', action: () => setShowFindReplace(true) },
        { label: 'Find', icon: Search, shortcut: 'Ctrl+F', action: () => setShowSearch(true) },
        { type: 'separator' },
        { label: 'Page Setup', icon: Ruler, action: () => setShowPageSetup(true) },
        { label: 'Version History', icon: History, action: () => { saveCurrentVersion(); setShowVersionHistory(true); } },
        { label: 'Comments', icon: MessageSquare, action: () => setShowCommentsPanel(!showCommentsPanel) },
        { type: 'separator' },
        { label: 'Text Direction: LTR', icon: AlignLeft, action: () => setTextDir('ltr') },
        { label: 'Text Direction: RTL', icon: AlignRight, action: () => setTextDir('rtl') },
        { type: 'separator' },
        { label: 'Compare Documents', icon: FileText, action: () => toast.info('Compare documents dialog') },
        { label: 'Citations', icon: Bookmark, action: () => setShowReferencesPanel(true) },
      ]
    },
    {
      label: 'AI Assistant',
      items: [
        {
          label: "Generate Document",
          icon: Sparkles,
          action: () => setShowAIDocumentGenerator(true)
        },
        {
          label: "Inline AI Actions",
          icon: Wand2,
          action: () => setShowAIInlineActions(true)
        },
        {
          label: "Code Assistant",
          icon: Code,
          action: () => setShowCodeAssistant(true)
        },
        { type: "separator" },
        {
          label: "AI Settings",
          icon: Settings,
          action: () => toast.info('AI Settings dialog')
        },
        {
          label: "AI History",
          icon: History,
          action: () => toast.info('AI History panel')
        },
      ]
    }
  ];

  const renderMenu = () => {
    return (
      <div className="flex items-center gap-0">
        {menuItems.map(item => (
          <DropdownMenu modal={false} key={item.label} onOpenChange={(open) => {
            if (open) {
              onMenuOpen(editor);
              setContentInert(open);
            } else {
              setContentInert(open);
              onMenuClose(editor);
            }
          }}>
            <DropdownMenuTrigger asChild>
              <Button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Cache current selection for later restoration
                  try { saveSelection(editor); } catch { }
                  // Signal toolbar interaction to prevent auto-scroll
                  window.isToolbarInteraction = true;
                  window.wasToolbarInteractionRecent = true;
                  setTimeout(() => {
                    window.isToolbarInteraction = false;
                    window.wasToolbarInteractionRecent = false;
                  }, 300);
                }}
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-sm font-medium text-gray-700 hover:bg-blue-100/50 hover:text-blue-800 rounded-md transition-colors"
              >
                {item.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()} className="w-56 bg-white border border-blue-100 shadow-xl rounded-md p-1">
              {item.items.map((menuItem, index) => {
                if (menuItem.type === 'separator') {
                  return <DropdownMenuSeparator key={index} className="bg-blue-50" />;
                }

                if (menuItem.submenu) {
                  return (
                    <DropdownMenuSub key={menuItem.label}>
                      <DropdownMenuSubTrigger className="text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-800">
                        {menuItem.icon && <menuItem.icon className="mr-2 h-4 w-4 text-blue-500" />}
                        <span>{menuItem.label}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent onCloseAutoFocus={(e) => e.preventDefault()} className="w-48 bg-white border border-blue-100 shadow-xl rounded-md p-1">
                        {menuItem.submenu.map((subItem, subIndex) => {
                          if (subItem.type === 'separator') {
                            return <DropdownMenuSeparator key={subIndex} className="bg-blue-50" />;
                          }
                          return (
                            <DropdownMenuItem
                              key={subItem.label}
                              onClick={subItem.action}
                              disabled={subItem.disabled}
                              className="text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-800"
                            >
                              {subItem.icon && <subItem.icon className="mr-2 h-4 w-4 text-blue-500" />}
                              <span>{subItem.label}</span>
                            </DropdownMenuItem>
                          );
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
                      className="hover:bg-linear-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all duration-200"
                    >
                      {menuItem.icon && typeof menuItem.icon === 'function' && <menuItem.icon className="w-4 h-4 mr-2" />}
                      {menuItem.label}
                      {menuItem.shortcut && (
                        <DropdownMenuShortcut>{menuItem.shortcut}</DropdownMenuShortcut>
                      )}
                    </DropdownMenuCheckboxItem>
                  )
                }

                return (
                  <DropdownMenuItem
                    key={menuItem.label}
                    onClick={menuItem.action}
                    className="text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-800 flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      {menuItem.icon && <menuItem.icon className="mr-2 h-4 w-4 text-blue-500" />}
                      <span>{menuItem.label}</span>
                    </div>
                    {menuItem.shortcut && (
                      <span className="ml-auto text-[10px] text-gray-400">{menuItem.shortcut}</span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>
    );
  };

  // Hidden file input
  const hiddenFileInput = (
    <input
      type="file"
      ref={fileInputRef}
      style={{ display: 'none' }}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          toast.info(`Opening ${file.name}`);
          // Handle file opening logic here
        }
      }}
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("sticky top-0 z-40 bg-[#eaf2ff] border-b border-blue-200 shadow-sm toolbar", className)}
      style={{ contain: 'layout style' }}
      onMouseDown={(e) => {
        const t = e.target;
        if (t && (t.closest('input,textarea,select,[contenteditable="true"],[role="textbox"]'))) return;
        guardToolbarMouseDown(e, editor);
      }}
      onPointerDown={(e) => {
        const t = e.target;
        if (t && (t.closest('input,textarea,select,[contenteditable="true"],[role="textbox"]'))) return;
        guardToolbarMouseDown(e, editor);
      }}
    >
      {/* Header with Menu */}
      <div className="flex items-center justify-between px-4 py-1 border-b border-blue-100">
        {/* Menus removed - now in HeaderMenuBar */}
      </div>

      {/* Compact Single-Row Toolbar */}
      <div
        className="flex items-center px-4 py-0.5 gap-1.5 overflow-x-auto"
        style={{ contain: 'layout' }}
        onMouseDown={(e) => guardToolbarMouseDown(e, editor)}
        onPointerDown={(e) => guardToolbarMouseDown(e, editor)}
      >
        {/* History Controls */}
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="rounded-lg bg-linear-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-600 border border-blue-200 transition-all duration-300"
        >
          <Undo className="w-4 h-4 text-blue-600" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="rounded-lg bg-linear-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-600 border border-blue-200 transition-all duration-300"
        >
          <Redo className="w-4 h-4 text-blue-600" />
        </ToolbarButton>

        <div className="mx-1.5 h-6 w-px bg-blue-200/60" />

        {/* Font Controls */}
        <Select
          modal={false}
          value={currentFont}
          onOpenChange={(open) => {
            if (open) {
              onMenuOpen(editor);
              setContentInert(open);
            } else {
              setContentInert(open);
              onMenuClose(editor);
            }
          }}
          onValueChange={(value) => setFontFamily(value)}
        >
          <SelectTrigger onMouseDown={(e) => { preventEditorBlur(e); }} className="text-xs bg-[#f4f8ff] text-gray-700 rounded-full px-2 h-8 w-[110px] hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 border border-blue-200 shadow-sm transition-colors truncate">
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent onCloseAutoFocus={(e) => e.preventDefault()} className="rounded-md border-slate-200 shadow-xl bg-white w-[110px]">
            {FONTS.map(font => (
              <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }} className="truncate text-xs">
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          modal={false}
          value={String(currentFontSize)}
          onOpenChange={(open) => {
            if (open) {
              onMenuOpen(editor);
              setContentInert(open);
            } else {
              setContentInert(open);
              onMenuClose(editor);
            }
          }}
          onValueChange={(value) => setCurrentFontSize(parseInt(value))}
        >
          <SelectTrigger onMouseDown={(e) => { preventEditorBlur(e); }} className="text-xs bg-[#f4f8ff] text-gray-700 rounded-full px-2 h-8 w-16 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 border border-blue-200 shadow-sm transition-colors">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent onCloseAutoFocus={(e) => e.preventDefault()} className="rounded-md border-slate-200 shadow-xl bg-white">
            {FONT_SIZES.map(size => (
              <SelectItem key={String(size)} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Select
            modal={false}
            value={String(activeHeadingLevel || 0)}
            onOpenChange={(open) => {
              if (open) {
                onMenuOpen(editor);
                setContentInert(open);
              } else {
                setContentInert(open);
                onMenuClose(editor);
              }
            }}
            onValueChange={(value) => {
              console.log('Toolbar heading change to:', value);
              handleHeadingChange(parseInt(value));
            }}
          >
            <SelectTrigger onMouseDown={(e) => { preventEditorBlur(e); }} className="text-xs bg-[#f4f8ff] text-gray-700 rounded-full px-2 h-8 min-w-0 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 border border-blue-200 shadow-sm transition-colors">
              <SelectValue placeholder="Heading" />
            </SelectTrigger>
            <SelectContent onCloseAutoFocus={(e) => e.preventDefault()} className="rounded-md border-slate-200 shadow-xl bg-white">
              <SelectItem value="0">Normal</SelectItem>
              <SelectItem value="1">H1</SelectItem>
              <SelectItem value="2">H2</SelectItem>
              <SelectItem value="3">H3</SelectItem>
              <SelectItem value="4">H4</SelectItem>
              <SelectItem value="5">H5</SelectItem>
              <SelectItem value="6">H6</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-50 rounded-full">
            Level: {activeHeadingLevel || 0}
          </div>
        </div>

        <div className="mx-1.5 h-6 w-px bg-blue-200/60" />

        {/* Basic Formatting */}
        <ToolbarButton
          editor={editor}
          onClick={() => handleFormatAction('bold')}
          isActive={editor.isActive("bold")}
          className="rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <Bold className="w-4 h-4 text-blue-600" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          onClick={() => handleFormatAction('italic')}
          isActive={editor.isActive("italic")}
          className="rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <Italic className="w-4 h-4 text-blue-600" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          onClick={() => handleFormatAction('underline')}
          isActive={editor.isActive("underline")}
          className="rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <Underline className="w-4 h-4 text-blue-600" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          onClick={() => handleFormatAction('strike')}
          isActive={editor.isActive("strike")}
          className="rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <Strikethrough className="w-4 h-4 text-blue-600" />
        </ToolbarButton>

        <div className="mx-1.5 h-6 w-px bg-blue-200/60" />

        {/* Text Color Dropdown */}
        <DropdownMenu modal={false} onOpenChange={(open) => {
          if (open) {
            onMenuOpen(editor);
            setContentInert(open);
          } else {
            setContentInert(open);
            onMenuClose(editor);
          }
        }}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try { saveSelection(editor); } catch { }
                // Signal toolbar interaction to prevent auto-scroll
                window.isToolbarInteraction = true;
                window.wasToolbarInteractionRecent = true;
                setTimeout(() => {
                  window.isToolbarInteraction = false;
                  window.wasToolbarInteractionRecent = false;
                }, 300);
              }}
              className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 transition-all duration-300"
            >
              <Palette className="w-4 h-4 text-blue-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()} className="w-72 p-0 rounded-2xl shadow-2xl border border-gray-200 bg-white overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-white">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Text Color
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">Choose the perfect color for your text</p>
            </div>
            
            {/* Color Grid */}
            <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              {/* Quick Access - Recent Colors */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Standard Colors
                </h4>
                <div className="grid grid-cols-12 gap-1.5">
                  {TEXT_COLORS.slice(0, 12).map((color, index) => (
                    <button
                      key={color}
                      className={cn(
                        "w-7 h-7 rounded-lg border-2 transition-all duration-200 hover:scale-125 hover:shadow-lg hover:-translate-y-0.5",
                        currentTextColor === color 
                          ? "ring-2 ring-blue-500 ring-offset-2 border-blue-500 scale-110 shadow-md" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setTextColor(color)}
                      title={color}
                    >
                      {index < 6 && currentTextColor === color && (
                        <Check className="w-3 h-3 mx-auto text-white drop-shadow-lg" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warm Colors */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  Warm Colors
                </h4>
                <div className="grid grid-cols-12 gap-1.5">
                  {TEXT_COLORS.slice(12, 24).map(color => (
                    <button
                      key={color}
                      className={cn(
                        "w-7 h-7 rounded-lg border-2 transition-all duration-200 hover:scale-125 hover:shadow-lg hover:-translate-y-0.5",
                        currentTextColor === color 
                          ? "ring-2 ring-blue-500 ring-offset-2 border-blue-500 scale-110 shadow-md" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setTextColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Cool Colors */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Cool Colors
                </h4>
                <div className="grid grid-cols-12 gap-1.5">
                  {TEXT_COLORS.slice(24, 36).map(color => (
                    <button
                      key={color}
                      className={cn(
                        "w-7 h-7 rounded-lg border-2 transition-all duration-200 hover:scale-125 hover:shadow-lg hover:-translate-y-0.5",
                        currentTextColor === color 
                          ? "ring-2 ring-blue-500 ring-offset-2 border-blue-500 scale-110 shadow-md" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setTextColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Neutral & Pastel Colors */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                  Neutral & Pastel
                </h4>
                <div className="grid grid-cols-12 gap-1.5">
                  {TEXT_COLORS.slice(36, 48).map(color => (
                    <button
                      key={color}
                      className={cn(
                        "w-7 h-7 rounded-lg border-2 transition-all duration-200 hover:scale-125 hover:shadow-lg hover:-translate-y-0.5",
                        currentTextColor === color 
                          ? "ring-2 ring-blue-500 ring-offset-2 border-blue-500 scale-110 shadow-md" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setTextColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Additional Colors */}
              {TEXT_COLORS.length > 48 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    More Colors
                  </h4>
                  <div className="grid grid-cols-12 gap-1.5">
                    {TEXT_COLORS.slice(48).map(color => (
                      <button
                        key={color}
                        className={cn(
                          "w-7 h-7 rounded-lg border-2 transition-all duration-200 hover:scale-125 hover:shadow-lg hover:-translate-y-0.5",
                          currentTextColor === color 
                            ? "ring-2 ring-blue-500 ring-offset-2 border-blue-500 scale-110 shadow-md" 
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setTextColor(color)}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Current Color Preview */}
            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 font-medium">Current:</span>
                  <div 
                    className="w-6 h-6 rounded-md border-2 border-white shadow-sm" 
                    style={{ backgroundColor: currentTextColor }}
                  />
                  <span className="text-xs font-mono text-gray-700 uppercase">{currentTextColor}</span>
                </div>
                <button
                  onClick={() => setTextColor('#000000')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Reset to Black
                </button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Highlight Color Dropdown */}
        <DropdownMenu modal={false} onOpenChange={(open) => {
          if (open) {
            onMenuOpen(editor);
            setContentInert(open);
          } else {
            setContentInert(open);
            onMenuClose(editor);
          }
        }}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try { saveSelection(editor); } catch { }
                // Signal toolbar interaction to prevent auto-scroll
                window.isToolbarInteraction = true;
                window.wasToolbarInteractionRecent = true;
                setTimeout(() => {
                  window.isToolbarInteraction = false;
                  window.wasToolbarInteractionRecent = false;
                }, 300);
              }}
              className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 transition-all duration-300"
            >
              <Highlighter className="w-4 h-4 text-blue-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()} className="w-72 p-0 rounded-2xl shadow-2xl border border-gray-200 bg-white overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-3 text-white">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Highlighter className="w-4 h-4" />
                Highlight Color
              </h3>
              <p className="text-xs text-yellow-100 mt-0.5">Make your text stand out</p>
            </div>
            
            {/* Color Grid */}
            <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              {/* Bright Highlights */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                  Bright & Vibrant
                </h4>
                <div className="grid grid-cols-8 gap-2">
                  {HIGHLIGHT_COLORS.slice(0, 8).map(color => (
                    <button
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded-xl border-2 transition-all duration-200 hover:scale-125 hover:shadow-xl hover:-translate-y-0.5",
                        currentHighlight === color 
                          ? "ring-2 ring-orange-500 ring-offset-2 border-orange-500 scale-110 shadow-lg" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setHighlightColor(color)}
                      title={color}
                    >
                      {currentHighlight === color && (
                        <Check className="w-4 h-4 mx-auto text-white drop-shadow-lg" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pastel Highlights */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-300"></span>
                  Soft Pastels
                </h4>
                <div className="grid grid-cols-8 gap-2">
                  {HIGHLIGHT_COLORS.slice(8, 16).map(color => (
                    <button
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded-xl border-2 transition-all duration-200 hover:scale-125 hover:shadow-xl hover:-translate-y-0.5",
                        currentHighlight === color 
                          ? "ring-2 ring-orange-500 ring-offset-2 border-orange-500 scale-110 shadow-lg" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setHighlightColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Light Highlights */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                  Light Shades
                </h4>
                <div className="grid grid-cols-8 gap-2">
                  {HIGHLIGHT_COLORS.slice(16, 24).map(color => (
                    <button
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded-xl border-2 transition-all duration-200 hover:scale-125 hover:shadow-xl hover:-translate-y-0.5",
                        currentHighlight === color 
                          ? "ring-2 ring-orange-500 ring-offset-2 border-orange-500 scale-110 shadow-lg" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setHighlightColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Subtle Highlights */}
              {HIGHLIGHT_COLORS.length > 24 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-300"></span>
                    More Options
                  </h4>
                  <div className="grid grid-cols-8 gap-2">
                    {HIGHLIGHT_COLORS.slice(24).map(color => (
                      <button
                        key={color}
                        className={cn(
                          "w-8 h-8 rounded-xl border-2 transition-all duration-200 hover:scale-125 hover:shadow-xl hover:-translate-y-0.5",
                          currentHighlight === color 
                            ? "ring-2 ring-orange-500 ring-offset-2 border-orange-500 scale-110 shadow-lg" 
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setHighlightColor(color)}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Current Color Preview */}
            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 font-medium">Current:</span>
                  <div 
                    className="w-6 h-6 rounded-md border-2 border-white shadow-sm" 
                    style={{ backgroundColor: currentHighlight || 'transparent' }}
                  />
                  <span className="text-xs font-mono text-gray-700 uppercase">{currentHighlight || 'None'}</span>
                </div>
                <button
                  onClick={() => setHighlightColor(null)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
                >
                  Remove Highlight
                </button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-1.5 h-6 w-px bg-blue-200/60" />

        {/* Lists Dropdown */}
        <DropdownMenu modal={false} onOpenChange={(open) => {
          if (open) {
            onMenuOpen(editor);
            setContentInert(open);
          } else {
            setContentInert(open);
            onMenuClose(editor);
          }
        }}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try { saveSelection(editor); } catch { }
                // Signal toolbar interaction to prevent auto-scroll
                window.isToolbarInteraction = true;
                window.wasToolbarInteractionRecent = true;
                setTimeout(() => {
                  window.isToolbarInteraction = false;
                  window.wasToolbarInteractionRecent = false;
                }, 300);
              }}
              className={`h-9 w-9 rounded-lg transition-all duration-300 ${(editor.isActive("bulletList") || editor.isActive("orderedList") || editor.isActive("taskList"))
                ? "bg-linear-to-br from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 text-green-700 border-2 border-green-300"
                : "bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600"
                }`}
            >
              <List className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()} className="w-48 bg-white z-100 shadow-lg border border-gray-200 rounded-md p-1">
            <DropdownMenuItem
              onClick={() => {
                console.log('Numbered list selected');
                toggleOrderedList();
              }}
              className={`hover:bg-linear-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-200 cursor-pointer px-2 py-1.5 text-sm rounded-sm ${editor.isActive("orderedList") ? "bg-linear-to-r from-green-50 to-green-100 text-green-700 font-medium" : ""
                }`}
            >
              <ListOrdered className="w-4 h-4 mr-2" />
              Numbered List {editor.isActive("orderedList") && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                console.log('Bullet list selected');
                toggleBulletList();
              }}
              className={`hover:bg-linear-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-200 cursor-pointer px-2 py-1.5 text-sm rounded-sm ${editor.isActive("bulletList") ? "bg-linear-to-r from-green-50 to-green-100 text-green-700 font-medium" : ""
                }`}
            >
              <List className="w-4 h-4 mr-2" />
              Bullet List {editor.isActive("bulletList") && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                console.log('Task list selected');
                toggleTaskList();
              }}
              className={`hover:bg-linear-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-200 cursor-pointer px-2 py-1.5 text-sm rounded-sm ${editor.isActive("taskList") ? "bg-linear-to-r from-green-50 to-green-100 text-green-700 font-medium" : ""
                }`}
            >
              <ListChecks className="w-4 h-4 mr-2" />
              Task List {editor.isActive("taskList") && "✓"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                console.log('Remove list formatting selected');
                removeListFormatting();
              }}
              disabled={!hasListFormatting()}
              className={`hover:bg-linear-to-r hover:from-red-50 hover:to-red-100 transition-all duration-200 cursor-pointer px-2 py-1.5 text-sm rounded-sm ${!hasListFormatting() ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              <X className="w-4 h-4 mr-2 text-red-500" />
              Remove List Formatting
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>


        <div className="mx-1.5 h-6 w-px bg-blue-200/60" />

        {/* Text Alignment Dropdown */}
        <DropdownMenu modal={false} onOpenChange={(open) => {
          if (open) {
            onMenuOpen(editor);
            setContentInert(open);
          } else {
            setContentInert(open);
            onMenuClose(editor);
          }
        }}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Signal toolbar interaction to prevent auto-scroll
                window.isToolbarInteraction = true;
                setTimeout(() => {
                  window.isToolbarInteraction = false;
                }, 300);
              }}
              className={`h-9 w-9 rounded-lg transition-all duration-300 ${(editor.isActive({ textAlign: 'left' }) || editor.isActive({ textAlign: 'center' }) || editor.isActive({ textAlign: 'right' }) || editor.isActive({ textAlign: 'justify' }))
                ? "bg-linear-to-br from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 text-green-700 border-2 border-green-300"
                : "bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600"
                }`}
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()} className="w-48 bg-white z-100 shadow-lg border border-gray-200 rounded-md p-1">
            <DropdownMenuItem
              onClick={() => {
                console.log('Align left selected');
                setTextAlign('left');
              }}
              className={`hover:bg-linear-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-200 cursor-pointer px-2 py-1.5 text-sm rounded-sm ${editor.isActive({ textAlign: 'left' }) ? "bg-linear-to-r from-green-50 to-green-100 text-green-700 font-medium" : ""
                }`}
            >
              <AlignLeft className="w-4 h-4 mr-2" />
              Align Left {editor.isActive({ textAlign: 'left' }) && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                console.log('Align center selected');
                setTextAlign('center');
              }}
              className={`hover:bg-linear-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-200 cursor-pointer px-2 py-1.5 text-sm rounded-sm ${editor.isActive({ textAlign: 'center' }) ? "bg-linear-to-r from-green-50 to-green-100 text-green-700 font-medium" : ""
                }`}
            >
              <AlignCenter className="w-4 h-4 mr-2" />
              Align Center {editor.isActive({ textAlign: 'center' }) && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                console.log('Align right selected');
                setTextAlign('right');
              }}
              className={`hover:bg-linear-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-200 cursor-pointer px-2 py-1.5 text-sm rounded-sm ${editor.isActive({ textAlign: 'right' }) ? "bg-linear-to-r from-green-50 to-green-100 text-green-700 font-medium" : ""
                }`}
            >
              <AlignRight className="w-4 h-4 mr-2" />
              Align Right {editor.isActive({ textAlign: 'right' }) && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                console.log('Justify selected');
                setTextAlign('justify');
              }}
              className={`hover:bg-linear-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-200 cursor-pointer px-2 py-1.5 text-sm rounded-sm ${editor.isActive({ textAlign: 'justify' }) ? "bg-linear-to-r from-green-50 to-green-100 text-green-700 font-medium" : ""
                }`}
            >
              <AlignJustify className="w-4 h-4 mr-2" />
              Justify {editor.isActive({ textAlign: 'justify' }) && "✓"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                console.log('Remove alignment selected');
                removeTextAlignment();
              }}
              disabled={!hasTextAlignment()}
              className={`hover:bg-linear-to-r hover:from-red-50 hover:to-red-100 transition-all duration-200 cursor-pointer px-2 py-1.5 text-sm rounded-sm ${!hasTextAlignment() ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              <X className="w-4 h-4 mr-2 text-red-500" />
              Remove Alignment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-1.5 h-6 w-px bg-blue-200/60" />

        {/* Indentation */}
        <IndentControls editor={editor} />

        <div className="mx-1.5 h-6 w-px bg-blue-200/60" />

        {/* Quick Insert */}
        <ToolbarButton
          editor={editor}
          onClick={() => {
            // Directly trigger the file input for image upload
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.multiple = true;
            fileInput.onchange = async (e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 0 && editor) {
                // Process each selected file
                for (const file of files) {
                  const reader = new FileReader();

                  reader.onload = (readerEvent) => {
                    const imageDataUrl = readerEvent.target?.result;
                    if (imageDataUrl && typeof imageDataUrl === 'string') {
                      // Insert the image into the editor using the setImage extension
                      // First try with ResizableImage if available, otherwise use setImage
                      if (editor.commands.setResizableImage) {
                        runWithSavedSelection(editor, (chain) =>
                          chain.setResizableImage({
                            src: imageDataUrl,
                            alt: file.name,
                            title: file.name
                          })
                        );
                      } else {
                        runWithSavedSelection(editor, (chain) =>
                          chain.setImage({
                            src: imageDataUrl,
                            alt: file.name,
                            title: file.name
                          })
                        );
                      }
                      toast.success(`Image ${file.name} inserted successfully`);
                    }
                  };

                  reader.onerror = () => {
                    toast.error(`Failed to read image ${file.name}`);
                  };

                  reader.readAsDataURL(file);
                }
              }
            };
            fileInput.click();
          }}
          className="rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <Image className="w-4 h-4 text-blue-600" />
        </ToolbarButton>

        <ToolbarButton
          editor={editor}
          onClick={() => {
            if (setIsTemplateSidebarOpen) {
              setIsTemplateSidebarOpen(true);
            } else {
              toast.info('Template sidebar is not available');
            }
          }}
          className="rounded-lg bg-gradient-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <LayoutTemplate className="w-4 h-4 text-blue-600" />
        </ToolbarButton>

        <ToolbarButton
          editor={editor}
          onClick={() => handleInsertAction('link')}
          className="rounded-lg bg-gradient-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <Link className="w-4 h-4 text-blue-600" />
        </ToolbarButton>

        {/* Table Button with Picker */}
        <div className="relative inline-block" data-table-container="true" style={{ position: 'relative', display: 'inline-block' }} ref={tableButtonRef}>
          <ToolbarButton
            editor={editor}
            onClick={() => {
              if (showTablePicker) {
                setShowTablePicker(false);
                setSelectedRows(0);
                setSelectedCols(0);
                onMenuClose(editor);
              } else {
                onMenuOpen(editor);
                setShowTablePicker(true);
              }
            }}
            tooltip={isInsideTable() ? "Table Tools (Click for options)" : "Insert Table"}
            isActive={isInsideTable()}
            className={`rounded-lg transition-all duration-300 ${isInsideTable()
              ? "bg-linear-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
              : "bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600"
              }`}
            data-table-button="true"
          >
            <Table className={`w-4 h-4 ${isInsideTable() ? "text-white" : "text-blue-600"}`} />
          </ToolbarButton>

          {/* Table Picker Dropdown - Rendered in Portal to escape overflowing containers */}
          {showTablePicker && ReactDOM.createPortal(
            <div
              className="rounded-lg shadow-xl border border-gray-200 animate-in fade-in zoom-in duration-200"
              ref={tablePickerRef}
              style={{
                position: 'fixed',
                zIndex: 9999,
                backgroundColor: 'white',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                padding: '8px'
              }}
            >
              {renderTablePickerGrid()}
            </div>,
            document.body
          )}
        </div>

        {/* Code Block with Configuration Dropdown */}
        <div className="relative">
          <div className="flex items-center rounded-lg bg-linear-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200">
            <ToolbarButton
              editor={editor}
              onClick={toggleCodeBlock}
              isActive={editor.isActive('codeBlock')}
              className="h-8 w-8 rounded-r-none bg-transparent hover:bg-transparent"
            >
              <Code className="w-4 h-4 text-blue-600" />
            </ToolbarButton>
            <DropdownMenu modal={false} open={showCodeBlockMenu} onOpenChange={(open) => {
              setShowCodeBlockMenu(open);
              if (open) {
                onMenuOpen(editor);
              } else {
                onMenuClose(editor);
              }
            }}>
              <DropdownMenuTrigger asChild>
                <Button
                  onMouseDown={(e) => {
                    preventEditorBlur(e);
                    try { saveSelection(editor); } catch { }
                    window.isToolbarInteraction = true;
                    setTimeout(() => { window.isToolbarInteraction = false; }, 300);
                  }}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-6 rounded-l-none bg-transparent hover:bg-blue-200 hover:text-blue-700 transition-all duration-200 border-l border-blue-300"
                  onClick={() => setShowCodeBlockMenu(!showCodeBlockMenu)}
                >
                  <ChevronDown className="w-3 h-3 text-blue-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                onCloseAutoFocus={(e) => e.preventDefault()}
                className="w-64 bg-white border border-blue-200 rounded-lg shadow-lg p-2"
                align="start"
                side="bottom"
              >
                <div className="px-2 py-1">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Code Block Configuration</h3>

                  {/* Language Selection */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Language</label>
                    <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                      {CODE_LANGUAGES.slice(0, 12).map((lang) => (
                        <button
                          key={lang}
                          onMouseDown={(e) => {
                            preventEditorBlur(e);
                            runWithSavedSelection(editor, (chain) => { insertCodeBlockWithLanguage(lang); return chain; });
                          }}
                          className={`text-xs px-2 py-1 rounded text-left transition-all duration-200 ${selectedCodeLanguage === lang
                            ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white'
                            : 'bg-linear-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 hover:border hover:border-blue-300'
                            }`}
                        >
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Execution Controls */}
                  <div className="pt-2 border-t border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Execution Context</span>
                      <button
                        onClick={toggleCodeExecution}
                        className={`text-xs px-2 py-1 rounded transition-all duration-200 ${codeExecutionEnabled
                          ? 'bg-linear-to-r from-green-500 to-green-600 text-white'
                          : 'bg-linear-to-r from-gray-200 to-gray-300 text-gray-700'
                          }`}
                      >
                        {codeExecutionEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {codeExecutionEnabled && (
                      <button
                        onMouseDown={(e) => {
                          preventEditorBlur(e);
                          runWithSavedSelection(editor, () => { executeCodeBlock(); });
                        }}
                        disabled={!editor.isActive('codeBlock')}
                        className="w-full text-xs bg-linear-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-1"
                      >
                        <Play className="w-3 h-3 inline mr-1" />
                        Execute Code Block
                      </button>
                    )}

                    <p className="text-xs text-gray-500 mt-2 italic">
                      {codeExecutionEnabled
                        ? 'Code execution enabled (simulated in dev mode)'
                        : 'Enable execution to run code snippets'
                      }
                    </p>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <ToolbarButton
          editor={editor}
          onClick={() => toggleBlockquote()}
          isActive={editor.isActive('blockquote')}
          className="rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <Quote className="w-4 h-4 text-blue-600" />
        </ToolbarButton>
      
        <div className="mx-1.5 h-6 w-px bg-blue-200/60" />
      
        {/* AI Assistant Button - Rectangular with Sparkle Icon */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              onMouseDown={(e) => {
                preventEditorBlur(e);
                try { saveSelection(editor); } catch { }
                window.isToolbarInteraction = true;
                setTimeout(() => { window.isToolbarInteraction = false; }, 300);
              }}
              className="h-8 px-3 rounded-lg flex items-center gap-2 transition-all duration-300 bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border border-purple-300 shadow-md hover:shadow-lg text-white"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-xs font-semibold">AI Assist</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            onCloseAutoFocus={(e) => e.preventDefault()} 
            className="w-96 p-0 rounded-2xl shadow-2xl border border-purple-200 bg-white overflow-hidden"
            align="end"
            side="bottom"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-4 text-white">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Assistant
              </h3>
              <p className="text-xs text-purple-100 mt-1">Generate, transform, and enhance content with AI</p>
            </div>
                  
            {/* Content */}
            <div className="p-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {/* Quick Actions - Always Available */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Quick Actions
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => {
                      setShowAIAssistant(true);
                      onMenuClose(editor);
                      // Force focus on image generation by ensuring no text is selected
                      if (editor) {
                        editor.chain().focus().run();
                      }
                    }}
                    className="w-full text-left text-sm px-4 py-2.5 rounded-xl bg-linear-to-r from-blue-50 to-cyan-50 text-blue-800 hover:from-blue-100 hover:to-cyan-100 transition-all duration-200 border border-blue-200 hover:border-blue-300 hover:shadow-md font-medium"
                  >
                    <Image className="w-4 h-4 inline mr-2" />
                    Generate Image with AI
                  </button>
                </div>
              </div>
      
              {/* Transform & Enhance Section - Always Visible */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Transform Selected Text
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={!editor || editor.state.selection.from === editor.state.selection.to}
                    onClick={async () => {
                      const text = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);
                      if (text) {
                        await handleAIInlineAction('summarize', text);
                        onMenuClose(editor);
                      } else {
                        toast.error('Please select text first');
                      }
                    }}
                    className={`text-sm px-3 py-2.5 rounded-xl transition-all duration-200 border text-left font-medium ${
                      !editor || editor.state.selection.from === editor.state.selection.to
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-linear-to-br from-orange-50 to-orange-100 text-orange-800 hover:from-orange-100 hover:to-orange-200 border-orange-200 hover:border-orange-300'
                    }`}
                  >
                    <Minus className="w-4 h-4 inline mr-2" />
                    Summarize
                  </button>
                  <button
                    disabled={!editor || editor.state.selection.from === editor.state.selection.to}
                    onClick={async () => {
                      const text = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);
                      if (text) {
                        await handleAIInlineAction('expand', text);
                        onMenuClose(editor);
                      } else {
                        toast.error('Please select text first');
                      }
                    }}
                    className={`text-sm px-3 py-2.5 rounded-xl transition-all duration-200 border text-left font-medium ${
                      !editor || editor.state.selection.from === editor.state.selection.to
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-linear-to-br from-green-50 to-green-100 text-green-800 hover:from-green-100 hover:to-green-200 border-green-200 hover:border-green-300'
                    }`}
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Expand Content
                  </button>
                  <button
                    disabled={!editor || editor.state.selection.from === editor.state.selection.to}
                    onClick={async () => {
                      const text = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);
                      if (text) {
                        await handleAIInlineAction('rewrite', text);
                        onMenuClose(editor);
                      } else {
                        toast.error('Please select text first');
                      }
                    }}
                    className={`text-sm px-3 py-2.5 rounded-xl transition-all duration-200 border text-left font-medium col-span-2 ${
                      !editor || editor.state.selection.from === editor.state.selection.to
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-linear-to-br from-blue-50 to-blue-100 text-blue-800 hover:from-blue-100 hover:to-blue-200 border-blue-200 hover:border-blue-300'
                    }`}
                  >
                    <Wand2 className="w-4 h-4 inline mr-2" />
                    Enhance Content
                  </button>
                </div>
              </div>

              {/* AI Agent Inline Changes Section */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  AI Agent Inline Changes
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={async () => {
                      const text = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);
                      if (text) {
                        await handleAIInlineAction('change_tone', text);
                      } else {
                        toast.error('Please select text first');
                      }
                      onMenuClose(editor);
                    }}
                    className="w-full text-left text-sm px-4 py-2.5 rounded-xl bg-linear-to-r from-purple-50 to-indigo-50 text-purple-800 hover:from-purple-100 hover:to-indigo-100 transition-all duration-200 border border-purple-200 hover:border-purple-300 hover:shadow-md font-medium"
                  >
                    <Smile className="w-4 h-4 inline mr-2" />
                    Change Tone
                  </button>
                  <button
                    onClick={async () => {
                      const text = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);
                      if (text) {
                        await handleAIInlineAction('paraphrase', text);
                      } else {
                        toast.error('Please select text first');
                      }
                      onMenuClose(editor);
                    }}
                    className="w-full text-left text-sm px-4 py-2.5 rounded-xl bg-linear-to-r from-amber-50 to-yellow-50 text-amber-800 hover:from-amber-100 hover:to-yellow-100 transition-all duration-200 border border-amber-200 hover:border-amber-300 hover:shadow-md font-medium"
                  >
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    Paraphrase
                  </button>
                  <button
                    onClick={async () => {
                      const text = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);
                      if (text) {
                        await handleAIInlineAction('improve_readability', text);
                      } else {
                        toast.error('Please select text first');
                      }
                      onMenuClose(editor);
                    }}
                    className="w-full text-left text-sm px-4 py-2.5 rounded-xl bg-linear-to-r from-emerald-50 to-green-50 text-emerald-800 hover:from-emerald-100 hover:to-green-100 transition-all duration-200 border border-emerald-200 hover:border-emerald-300 hover:shadow-md font-medium"
                  >
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Improve Readability
                  </button>
                </div>
              </div>
            </div>
      
            {/* Footer */}
            <div className="border-t border-purple-200 px-5 py-3 bg-purple-50">
              <p className="text-xs text-purple-700 text-center font-medium">
                <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
                Powered by Athena AI
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      
        <Separator orientation="vertical" className="mx-2 h-5" />
      </div >

      {/* Search Bar */}
      < AnimatePresence >
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
      </AnimatePresence >

      {/* Hidden file input */}
      {hiddenFileInput}



      {/* Image Cropping Dialog */}

      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedImage && (
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Image to crop"
                  className="max-w-full max-h-[50vh] block mx-auto"
                  style={{ maxWidth: '100%', maxHeight: '50vh' }}
                />

                {/* Crop overlay - simplified visualization */}
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-blue-500"
                  style={{
                    left: `${(cropArea.x / imageDimensions.width) * 100}%`,
                    top: `${(cropArea.y / imageDimensions.height) * 100}%`,
                    width: `${(cropArea.width / imageDimensions.width) * 100}%`,
                    height: `${(cropArea.height / imageDimensions.height) * 100}%`,
                  }}>
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20"></div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">X Position</label>
                <Input
                  type="range"
                  min="0"
                  max={imageDimensions.width}
                  value={cropArea.x}
                  onChange={(e) => setCropArea({ ...cropArea, x: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">{Math.round(cropArea.x)}px</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Y Position</label>
                <Input
                  type="range"
                  min="0"
                  max={imageDimensions.height}
                  value={cropArea.y}
                  onChange={(e) => setCropArea({ ...cropArea, y: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">{Math.round(cropArea.y)}px</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Width</label>
                <Input
                  type="range"
                  min="50"
                  max={imageDimensions.width - cropArea.x}
                  value={cropArea.width}
                  onChange={(e) => setCropArea({ ...cropArea, width: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">{Math.round(cropArea.width)}px</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Height</label>
                <Input
                  type="range"
                  min="50"
                  max={imageDimensions.height - cropArea.y}
                  value={cropArea.height}
                  onChange={(e) => setCropArea({ ...cropArea, height: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">{Math.round(cropArea.height)}px</div>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Selected area: {Math.round(cropArea.width)} × {Math.round(cropArea.height)} pixels
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelCrop}>Cancel</Button>
            <Button onClick={applyCrop}>Apply Crop</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-md bg-white" aria-describedby="insert-image-description">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogDescription id="insert-image-description">
              Add images to your document from URL or file upload
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Insert from Web</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter image URL..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    if (linkUrl && editor) {
                      editor
                        .chain()
                        .focus()
                        .setImage({ src: linkUrl })
                        .run();
                      toast.success('Image added from URL');
                      setShowImageDialog(false);
                      setLinkUrl('');
                    }
                  }}
                  disabled={!linkUrl}
                >
                  Insert
                </Button>
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium mb-2">Upload from Local Storage</label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleLocalImageUpload}
                className="cursor-pointer"
              />
            </div>

            <div className="text-xs text-gray-500 mt-2">
              Supported formats: JPG, PNG, GIF, WEBP
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowImageDialog(false);
              setLinkUrl('');
            }}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Export Document</DialogTitle>
            <DialogDescription>
              Select the format to export your document
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="text-center mb-4">
              <div className="text-lg font-semibold">{exportFormat ? exportFormat.toUpperCase() : 'SELECT FORMAT'}</div>
              <div className="text-sm text-gray-500">Ready to export</div>
            </div>

            <div className="space-y-2">
              {EXPORT_FORMATS.map((format) => (
                <div
                  key={format.value}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${exportFormat === format.value
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                    }`}
                  onClick={() => setExportFormat(format.value)}
                >
                  {format.icon && typeof format.icon === 'function' && <format.icon className="w-5 h-5 mr-3 text-blue-600" />}
                  <span className="font-medium">{format.label}</span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowExportDialog(false);
                setExportFormat('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Trigger export based on the selected format
                if (onExport && typeof onExport === 'function') {
                  setExportProgressMessage(`Processing document content...`);
                  onExport(exportFormat);
                } else {
                  setExportProgressMessage(`Preparing ${exportFormat.toUpperCase()} export...`);
                  // Simulate export process
                  setTimeout(() => {
                    setExportProgressMessage(`Export completed as ${exportFormat.toUpperCase()}`);
                  }, 2000);
                }
                setShowExportDialog(false);
                setExportFormat('');
              }}
              disabled={!exportFormat}
            >
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Code Block Configuration Dialog */}
      <Dialog open={showCodeBlockConfigDialog} onOpenChange={setShowCodeBlockConfigDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-blue-600" />
              Code Block Configuration
            </DialogTitle>
            <DialogDescription>
              Configure advanced settings for your code blocks
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Language Selection */}
            <div className="space-y-2">
              <Label htmlFor="codeLanguage">Default Language</Label>
              <Select value={selectedCodeLanguage} onValueChange={setSelectedCodeLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language..." />
                </SelectTrigger>
                <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                  {CODE_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Theme Selection */}
            <div className="space-y-2">
              <Label>Code Theme</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'default', label: 'Default' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                  { value: 'monokai', label: 'Monokai' },
                  { value: 'github', label: 'GitHub' },
                  { value: 'solarized', label: 'Solarized' }
                ].map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => updateCodeBlockTheme(theme.value)}
                    className={`text-xs px-3 py-2 rounded transition-all duration-200 ${codeTheme === theme.value
                      ? 'ring-2 ring-blue-500 ring-offset-2'
                      : ''
                      } ${theme.value === 'default' ? 'bg-linear-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200' :
                        theme.value === 'dark' ? 'bg-linear-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800' :
                          theme.value === 'light' ? 'bg-linear-to-r from-white to-gray-50 text-gray-800 hover:from-gray-50 hover:to-white border' :
                            theme.value === 'monokai' ? 'bg-linear-to-r from-purple-900 to-indigo-900 text-purple-200 hover:from-purple-800 hover:to-indigo-800' :
                              theme.value === 'github' ? 'bg-linear-to-r from-gray-100 to-white text-gray-800 hover:from-gray-200 hover:to-gray-50' :
                                theme.value === 'solarized' ? 'bg-linear-to-r from-amber-50 to-yellow-100 text-amber-800 hover:from-amber-100 hover:to-yellow-200' :
                                  'bg-linear-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
                      }`}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Display Options</h4>

              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <span className="text-sm">Show Line Numbers</span>
                </Label>
                <Switch
                  checked={showLineNumbers}
                  onCheckedChange={toggleLineNumbers}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <span className="text-sm">Wrap Long Lines</span>
                </Label>
                <Switch
                  checked={codeWrapEnabled}
                  onCheckedChange={toggleCodeWrap}
                />
              </div>
            </div>

            {/* Execution Context */}
            <div className="space-y-3 pt-3 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700">Execution Context</h4>

              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <span className="text-sm">Enable Code Execution</span>
                  <span className="text-xs text-gray-500">(Development Mode)</span>
                </Label>
                <Switch
                  checked={codeExecutionEnabled}
                  onCheckedChange={toggleCodeExecution}
                />
              </div>

              <p className="text-xs text-gray-500">
                {codeExecutionEnabled
                  ? 'Code execution is enabled for testing and development purposes'
                  : 'Enable to execute code snippets directly in the editor'
                }
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetCodeBlockConfiguration}>
              Reset Defaults
            </Button>
            <Button variant="outline" onClick={() => setShowCodeBlockConfigDialog(false)}>
              Cancel
            </Button>
            <Button onClick={applyCodeBlockConfiguration}>
              Apply Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Progress Toast */}
      <AnimatePresence>
        {exportProgressMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>{exportProgressMessage}</span>
            <button
              onClick={() => setExportProgressMessage('')}
              className="ml-2 text-white hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === NEW FEATURE PANELS === */}
      <AnimatePresence>
        {showCommentsPanel && (
          <CommentsPanel isOpen={showCommentsPanel} onClose={() => setShowCommentsPanel(false)} editor={editor} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showVersionHistory && (
          <VersionHistory
            isOpen={showVersionHistory} onClose={() => setShowVersionHistory(false)}
            editor={editor} versions={documentVersions}
            onSaveVersion={saveCurrentVersion} onRestoreVersion={restoreVersion}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showVoiceTyping && (
          <VoiceTyping isOpen={showVoiceTyping} onClose={() => setShowVoiceTyping(false)} editor={editor} />
        )}
      </AnimatePresence>
      <PageSetupDialog open={showPageSetup} onOpenChange={setShowPageSetup} onApply={(cfg) => { if (cfg.margins) updatePageMargins(cfg.margins); }} />
      <KeyboardShortcutsDialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog} />
      <WordCountDialog open={showWordCount} onOpenChange={setShowWordCount} editor={editor} />

      {/* Find & Replace Inline Dialog */}
      {showFindReplace && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={() => setShowFindReplace(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 w-110 p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" /> Find &amp; Replace
              </h3>
              <button onClick={() => setShowFindReplace(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Find</label>
                <div className="flex gap-2">
                  <input autoFocus type="text" value={findText} onChange={e => setFindText(e.target.value)} placeholder="Search text..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    onKeyDown={e => { if (e.key === 'Enter') performFind(findText); }} />
                  <button onClick={() => performFind(findText)} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">Find</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Replace with</label>
                <div className="flex gap-2">
                  <input type="text" value={replaceText} onChange={e => setReplaceText(e.target.value)} placeholder="Replacement text..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  <button onClick={() => performFind(findText, replaceText)} disabled={!findText || !replaceText}
                    className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">Replace All</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Insert Dialog */}
      {showInsertLink && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={() => setShowInsertLink(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 w-96 p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 text-base mb-4">Insert Link</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Display Text</label>
                <input autoFocus type="text" value={linkDisplayText} onChange={e => setLinkDisplayText(e.target.value)} placeholder="Link text..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">URL</label>
                <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  onKeyDown={e => { if (e.key === 'Enter' && linkUrl) { runWithSavedSelection(editor, (chain) => chain.setLink({ href: linkUrl })); toast.success('Link inserted'); setShowInsertLink(false); setLinkUrl(''); setLinkDisplayText(''); } }} />
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button onClick={() => setShowInsertLink(false)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={() => { if (!linkUrl) return; runWithSavedSelection(editor, (chain) => chain.setLink({ href: linkUrl })); toast.success('Link inserted'); setShowInsertLink(false); setLinkUrl(''); setLinkDisplayText(''); }}
                  disabled={!linkUrl} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50">Insert</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Dialog */}
      <AIAssistant 
        open={showAIAssistant} 
        onOpenChange={setShowAIAssistant}
        onGenerateDocument={(data) => {
          console.log('Generate document:', data);
          // Handle document generation
          setShowAIAssistant(false);
        }}
        onInlineAction={(behavior, content) => {
          if (!editor) return;
          if (behavior === 'replace') {
            editor.chain().focus().deleteSelection().insertContent(content).run();
          } else if (behavior === 'append') {
            editor.chain().focus().insertContent(`<p>${content}</p>`).run();
          }
          toast.success('AI action applied');
        }}
        onImageInsert={(imageUrl, altText) => {
          if (!editor) return;
          try {
            editor.chain().focus().setResizableImage({ 
              src: imageUrl, 
              alt: altText, 
              title: altText || 'AI Generated Image', 
              width: 400, 
              height: 300, 
              align: 'left' 
            }).run();
            toast.success('AI image inserted successfully');
          } catch (error) {
            editor.chain().focus().setImage({ src: imageUrl, alt: altText }).run();
            toast.success('AI image inserted');
          }
        }}
        selectedText={editor ? editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ') : ''}
      />

    </motion.div >
  );
};


// ─── Add heading styles helper ────────────────────────────────────────────────


// ─── Custom Extensions ────────────────────────────────────────────────────────
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [{ types: [TextStyle.name], attributes: { fontSize: { default: null, parseHTML: element => element.style.fontSize, renderHTML: attributes => { if (!attributes.fontSize) return {}; return { style: `font-size: ${attributes.fontSize}` }; } } } }];
  },
  addCommands() {
    return {
      setFontSize: (fontSize) => ({ chain }) => chain().setMark('textStyle', { fontSize: fontSize.includes('px') ? fontSize : `${fontSize}px` }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).run(),
    };
  },
});

const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  selectable: false,
  draggable: false,
  atom: true,
  parseHTML() { return [{ tag: 'div[data-type="page-break"]' }]; },
  renderHTML() { return ['div', { 'data-type': 'page-break' }]; },
});

// ─── Wrapper component with providers ────────────────────────────────────────
const TextEditorWithProviders = ({ 
  initialContent = null, 
  activeDocId = null, 
  mongoId = null,
  onMongoIdSaved = null,
  onDeleteDocument = null
}) => {
  return (
    <EditorProvider>
      <ImageProvider>
        <TextEditorContent 
          initialContent={initialContent}
          activeDocId={activeDocId}
          mongoId={mongoId}
          onMongoIdSaved={onMongoIdSaved}
          onDeleteDocument={onDeleteDocument}
        />
      </ImageProvider>
    </EditorProvider>
  );
};

// ─── Main TextEditorContent component ─────────────────────────────────────────
const TextEditorContent = ({ 
  initialContent = null, 
  activeDocId = null, 
  mongoId = null,
  onMongoIdSaved = null,
  onDeleteDocument = null
}) => {
  const PAGE_HEIGHT = 1122.5;
  const PAGE_WIDTH = 793.7;

  const { state: editorState = {}, actions: editorActions = {} } = useEditorContext() || {};
  const { state: imageState = {}, actions: imageActions = {} } = useImageContext() || {};
  const { exportToPDF, exportToDOCX, exportToEPUB, exportToJSON, exportToHTML, exportToMarkdown, exportToPlainText, exportLoading } = useExportState();

  const {
    showReferencesPanel = false, showExportDialog = false,
    showTemplateSidebar = false, exportFormat = 'pdf',
    exportOptions = { includePageNumbers: true, includeHeader: true, includeFooter: true, exportComments: false, exportTrackChanges: false },
    documentTitle = 'Untitled Document', lastSaved = null, zoom = 100,
    saveStatus = 'saved', documentStats = { paragraphs: 0, images: 0, tables: 0, pages: 1 }
  } = editorState;

  const {
    setSaveStatus = () => {}, setLastSaved = () => {}, setDocumentStats = () => {},
    setDocumentTitle = () => {}, updateEditorFeatures = () => {}, updateExportOptions = () => {},
    updateUIState = () => {}, updateDocumentStats: updateDocumentStatsAction = () => {}
  } = editorActions;

  const [isOutlineOpen, setIsOutlineOpen] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const [headings, setHeadings] = useState([]);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [isStarred, setIsStarred] = useState(false);
  const [showFindReplaceModal, setShowFindReplaceModal] = useState(false);
  const [findReplaceMode, setFindReplaceMode] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [documentVersions, setDocumentVersions] = useState([{ id: Date.now(), timestamp: new Date(), title: 'Initial Version', content: '', author: 'Current User' }]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [activeHeadingLevel, setActiveHeadingLevel] = useState(0);
  const [showHeadingStyles, setShowHeadingStyles] = useState(false);
  const [pageSize, setPageSize] = useState('A4');
  const [pageOrientation, setPageOrientation] = useState('portrait');
  const [pageMargins, setPageMargins] = useState({ top: 96, bottom: 96, left: 96, right: 96 });

  // Keep --page-margin-* CSS variables in sync with state (runs on mount too)
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--page-margin-top',    `${pageMargins.top}px`);
    r.style.setProperty('--page-margin-right',  `${pageMargins.right}px`);
    r.style.setProperty('--page-margin-bottom', `${pageMargins.bottom}px`);
    r.style.setProperty('--page-margin-left',   `${pageMargins.left}px`);
    r.style.setProperty('--page-break-gap',     '40px');
  }, [pageMargins]);

  const [pageColor, setPageColor] = useState('#ffffff');
  const [showPageSetup, setShowPageSetup] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageInsertMethod, setImageInsertMethod] = useState('url');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImageAlt, setSelectedImageAlt] = useState('');
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [pages, setPages] = useState([{ id: 1, content: '', height: 0 }]);
  const [currentPage, setCurrentPage] = useState(1);
  const [customHeadingStyles, setCustomHeadingStyles] = useState({});
  const [columnLayout, setColumnLayout] = useState({ count: 1, spacing: 36, equalWidth: true });
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  const [paragraphSpacing, setParagraphSpacing] = useState({ before: 0, after: 0 });

  // ── Page-capacity constants ─────────────────────────────────────────────
  // A4 page: 210×297 mm @ 96 dpi = 794×1123 px
  // Margins: 1 in (72 pt) top/bottom/left/right
  // Usable height: 1123 - 144 = 979 px
  // Font: 12 pt = 16 px rendered; line height 1.15 → 18.4 px/line
  // Lines per page: floor(979 / 18.4) = 53 raw lines, but paragraphs have
  //   spacing-after, headings are taller, lists add bullets → effective ~32 lines
  // Words per line at 65 chars/line ÷ 5.5 chars/word ≈ 11.8 words/line
  // Words per page: 32 × 11.8 ≈ 378 → use 380 (conservative)
  // Chars per page: 32 × 65 = 2080 → use 2100 (conservative)
  const MAX_WORDS_PER_PAGE = 380;        // 12 pt / 1.15 spacing, ~32 lines/page
  const MAX_CHARS_PER_PAGE = 2100;       // 32 lines × 65 chars/line
  const MAX_LINES_PER_PAGE = 32;         // 12 pt / 1.15 spacing on A4

  const editorRef = useRef(null);
  const contentContainerRef = useRef(null);
  const repaginateRef = useRef(null);
  const statsTimeoutRef = useRef(null);
  const paginationTimeoutRef = useRef(null);
  const pagesUpdateTimeoutRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const handleAutoSaveRef = useRef(null);
  const lastPaginationContentRef = useRef('');
  const paragraphHeightCacheRef = useRef(new Map());

  // ── Paste page-break system refs ──────────────────────────────────────────
  // isPastingRef   : true from handlePaste until PASTE_SETTLE_MS after paste lands.
  //                  Prevents onUpdate from running the scanner mid-paste.
  // pasteTimerRef  : the settle-delay timer; cleared on each new paste.
  // isInsertingRef : re-entrancy guard — true only while insertions are running.
  //                  Always reset in a finally block so it can never stay locked.
  // lastFingerprintRef : content fingerprint of the last successfully-scanned doc.
  //                  Prevents re-scanning identical content on every keystroke.
  const isPastingRef       = useRef(false);
  const pasteTimerRef      = useRef(null);
  const isInsertingRef     = useRef(false);
  const lastFingerprintRef = useRef('');

  // Page-limit config — single source of truth passed to all scanner functions
  const pageCfg = {
    MAX_WORDS_PER_PAGE,
    MAX_CHARS_PER_PAGE,
    MAX_LINES_PER_PAGE,
    AVG_CHARS_PER_LINE: 65,   // 12pt font, 1-inch margins, A4 width
    PASTE_SETTLE_MS:    300,   // ms after paste before scanning
    MAX_BREAKS_PER_RUN: 2000, // hard cap — prevents runaway on huge pastes
  };

  const dynamicManualPagination = useCallback((editorInstance) => {
    // Count pageBreak nodes to derive total page count.
    // Uses doc.descendants (not doc.forEach) because we only need to COUNT,
    // not insert — descendants is fine for read-only traversal.
    if (!editorInstance?.state?.doc) return;
    let pageBreakCount = 0;
    editorInstance.state.doc.descendants((node) => {
      if (node.type.name === 'pageBreak') pageBreakCount++;
    });
    const totalPages = Math.max(1, pageBreakCount + 1);
    // Avoid setState thrash: only update when the count actually changes
    setPages((prev) => {
      if (prev.length === totalPages) return prev;
      return Array.from({ length: totalPages }, (_, i) => ({
        id: i + 1,
        content: '',
        height: 1122.5,
      }));
    });
    if (setDocumentStats) {
      setDocumentStats((prev) => {
        if (prev?.pages === totalPages) return prev;
        return { ...prev, pages: totalPages };
      });
    }
  }, [setDocumentStats]); // removed pages.length — functional setState avoids stale closure

  // ── runPastePageBreaks ────────────────────────────────────────────────────
  //
  // Single-pass scanner + single-transaction inserter.
  //
  // WHY doc.forEach instead of descendants():
  //   descendants() yields Text leaf nodes whose positions are INSIDE inline
  //   content. Inserting a block node (pageBreak) at an inline position
  //   violates the schema — ProseMirror silently rejects it. doc.forEach walks
  //   only the top-level blocks, whose offsets are always valid block-insertion
  //   positions.
  //
  // WHY one chain.run() for all inserts:
  //   Inserting breaks one-at-a-time fires onUpdate after each insert, which
  //   re-runs this scanner, which queues more breaks → infinite loop.
  //   One transaction = one onUpdate = no feedback loop.
  //
  // WHY offset accumulator:
  //   Each inserted pageBreak (nodeSize=1) shifts every subsequent position by
  //   +1. We apply a running offset so positions stay accurate without
  //   re-scanning the doc.
  //
  // ── runPastePageBreaks ────────────────────────────────────────────────────
  //
  // Single-pass scanner + single-transaction inserter.
  //
  // Design constraints:
  //   1. doc.forEach (top-level blocks only) — descendants() visits inline
  //      text nodes whose positions are inside inline content; inserting a
  //      block node there violates the schema.
  //   2. One chain.run() for ALL insertions — one transaction → one onUpdate
  //      → no feedback loop.
  //   3. Running offset — each inserted pageBreak (nodeSize 1) shifts every
  //      subsequent raw position by +1.
  //   4. isInsertingRef mutex — prevents re-entrant calls. Always released in
  //      finally so it can never stay locked.
  //   5. Per-block line estimation accounts for heading size multipliers and
  //      minimum 1-line floor so empty paragraphs are counted.
  //
  const runPastePageBreaks = useCallback((editorInstance) => {
    if (isInsertingRef.current) return 0;
    if (!editorInstance?.state?.doc) return 0;

    isInsertingRef.current = true;
    let inserted = 0;

    try {
      const doc        = editorInstance.state.doc;
      const totalChars = doc.textContent.length;

      if (totalChars > 5000) {
        toast.info(
          `Processing document (${Math.round(totalChars / 100) / 10}K chars)…`,
          { id: 'paste-processing', duration: 2000 }
        );
      }

      // ── Pass 1: collect insertion positions ───────────────────────────
      const insertAt  = [];
      let pageWords   = 0;
      let pageChars   = 0;
      let pageLines   = 0;
      let blockCount  = 0;

      doc.forEach((blockNode, topOffset) => {
        blockCount++;

        // Existing break → start a fresh page
        if (blockNode.type.name === 'pageBreak') {
          pageWords = 0;
          pageChars = 0;
          pageLines = 0;
          return;
        }

        const text       = blockNode.textContent || '';
        const blockWords = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
        const blockChars = text.length;

        // Heading nodes are taller — heading level 1 ≈ 3 normal lines,
        // level 2 ≈ 2, levels 3-6 ≈ 1.5.  Paragraph/list → 1× multiplier.
        // Minimum 1 line so blank paragraphs are not ignored (they still
        // consume vertical space via paragraph spacing).
        let lineMultiplier = 1;
        if (blockNode.type.name === 'heading') {
          const lvl = blockNode.attrs?.level ?? 3;
          lineMultiplier = lvl === 1 ? 3 : lvl === 2 ? 2 : 1.5;
        }
        const rawLines   = Math.ceil(blockChars / pageCfg.AVG_CHARS_PER_LINE) || 1;
        const blockLines = Math.max(1, Math.ceil(rawLines * lineMultiplier));

        pageWords += blockWords;
        pageChars += blockChars;
        pageLines += blockLines;

        const overflow =
          pageWords > pageCfg.MAX_WORDS_PER_PAGE ||
          pageChars > pageCfg.MAX_CHARS_PER_PAGE ||
          pageLines > pageCfg.MAX_LINES_PER_PAGE;

        if (overflow && insertAt.length < pageCfg.MAX_BREAKS_PER_RUN) {
          // Insert BEFORE this block → it becomes the first block of the new page
          insertAt.push(topOffset);
          // New page starts carrying this block's contribution
          pageWords = blockWords;
          pageChars = blockChars;
          pageLines = blockLines;
        }
      });

      // Stamp fingerprint regardless of whether we found breaks.
      // Without this, every keystroke after a full scan (that found nothing)
      // re-runs the full scan because the fingerprint never advanced.
      const txt = doc.textContent;
      lastFingerprintRef.current = `${txt.length}:${txt.substring(0, 80)}`;

      if (insertAt.length === 0) {
        if (totalChars > 5000) {
          toast.success('Document processed — no additional breaks needed.', {
            id: 'paste-processing', duration: 2000,
          });
        }
        return 0;
      }

      // ── Pass 2: single chained transaction ────────────────────────────

      let offset = 0;
      let chain  = editorInstance.chain();

      for (const rawPos of insertAt) {
        // rawPos is a content-relative offset from doc.forEach (0-based from doc.content start).
        // ProseMirror absolute position = rawPos + 1 (the doc node's own opening token is pos 0).
        // offset accumulates +1 for every pageBreak already inserted in this batch.
        chain  = chain.insertContentAt(rawPos + 1 + offset, { type: 'pageBreak' });
        offset += 1;
      }

      chain.run(); // exactly one onUpdate
      inserted = insertAt.length;

      if (totalChars > 5000) {
        const pages = insertAt.length + 1;
        setTimeout(() => {
          toast.success(
            `✓ Document paginated — ${inserted} break${inserted !== 1 ? 's' : ''} inserted, ${pages} pages`,
            { id: 'paste-processing', duration: 3000 }
          );
        }, 100);
      }

    } catch (err) {
      console.error('[PastePageBreaks] error:', err);
      toast.error('Failed to paginate document', {
        id: 'paste-processing', duration: 4000,
      });
    } finally {
      isInsertingRef.current = false; // always released
    }

    return inserted;
  }, []); // pageCfg is a stable plain-object literal — no closure deps
  
  // ── runProgressivePageBreaks ─────────────────────────────────────────────
  //
  // For documents > 20 K characters we break the work into chunks to keep
  // the UI responsive. Each chunk yields to the event loop before continuing.
  //
  // The key insight: we can't call runPastePageBreaks multiple times on the
  // SAME document state (the mutex prevents it and positions shift after each
  // insertion). Instead we do ONE full scan, collect ALL positions, then
  // insert them in batches of CHUNK_SIZE, yielding between batches.
  //
  const runProgressivePageBreaks = useCallback(async (editorInstance) => {
    if (isInsertingRef.current) return;
    if (!editorInstance?.state?.doc) return;

    const totalChars = editorInstance.state.doc.textContent.length;
    if (totalChars <= 20000) {
      // Small enough — delegate to the standard single-pass function
      runPastePageBreaks(editorInstance);
      return;
    }

    isInsertingRef.current = true;
    const CHUNK_SIZE = 100; // insertions per batch before yielding

    try {
      const doc = editorInstance.state.doc;

      toast.loading(
        `Paginating large document (${Math.round(totalChars / 1000)}K chars)…`,
        { id: 'progressive-paste', duration: 30000 }
      );

      // ── Pass 1: full scan (same logic as runPastePageBreaks) ──────────
      const insertAt  = [];
      let pageWords   = 0;
      let pageChars   = 0;
      let pageLines   = 0;

      doc.forEach((blockNode, topOffset) => {
        if (blockNode.type.name === 'pageBreak') {
          pageWords = 0; pageChars = 0; pageLines = 0;
          return;
        }

        const text       = blockNode.textContent || '';
        const blockWords = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
        const blockChars = text.length;
        let lineMultiplier = 1;
        if (blockNode.type.name === 'heading') {
          const lvl = blockNode.attrs?.level ?? 3;
          lineMultiplier = lvl === 1 ? 3 : lvl === 2 ? 2 : 1.5;
        }
        const rawLines   = Math.ceil(blockChars / pageCfg.AVG_CHARS_PER_LINE) || 1;
        const blockLines = Math.max(1, Math.ceil(rawLines * lineMultiplier));

        pageWords += blockWords;
        pageChars += blockChars;
        pageLines += blockLines;

        const overflow =
          pageWords > pageCfg.MAX_WORDS_PER_PAGE ||
          pageChars > pageCfg.MAX_CHARS_PER_PAGE ||
          pageLines > pageCfg.MAX_LINES_PER_PAGE;

        if (overflow && insertAt.length < pageCfg.MAX_BREAKS_PER_RUN) {
          insertAt.push(topOffset);
          pageWords = blockWords;
          pageChars = blockChars;
          pageLines = blockLines;
        }
      });

      // Stamp fingerprint before any insertion so the resulting onUpdate
      // exits the fingerprint guard without re-scanning.
      const txt = doc.textContent;
      lastFingerprintRef.current = `${txt.length}:${txt.substring(0, 80)}`;

      if (insertAt.length === 0) {
        toast.success('Document processed — no breaks needed.', {
          id: 'progressive-paste', duration: 2000,
        });
        return;
      }

      // ── Pass 2: insert in CHUNK_SIZE batches, yielding between each ───
      const totalBreaks = insertAt.length;
      let offset        = 0;
      let batchStart    = 0;

      while (batchStart < totalBreaks) {
        if (editorInstance.isDestroyed) break;

        // Release mutex briefly between batches so UI can repaint
        isInsertingRef.current = false;
        await new Promise((r) => setTimeout(r, 16)); // ~1 frame
        isInsertingRef.current = true;

        if (editorInstance.isDestroyed) break;

        const batchEnd = Math.min(batchStart + CHUNK_SIZE, totalBreaks);
        let chain = editorInstance.chain();
        for (let i = batchStart; i < batchEnd; i++) {
          chain  = chain.insertContentAt(insertAt[i] + 1 + offset, { type: 'pageBreak' });
          offset += 1;
        }
        chain.run();

        toast.loading(
          `Paginating… ${Math.min(batchEnd, totalBreaks)}/${totalBreaks} breaks`,
          { id: 'progressive-paste' }
        );

        batchStart = batchEnd;
      }

      const pages = totalBreaks + 1;
      toast.success(
        `✓ Large document paginated — ${totalBreaks} breaks, ${pages} pages`,
        { id: 'progressive-paste', duration: 4000 }
      );

    } catch (err) {
      console.error('[ProgressivePagination] error:', err);
      toast.error('Pagination failed for large document', {
        id: 'progressive-paste', duration: 4000,
      });
    } finally {
      isInsertingRef.current = false;
    }
  }, [runPastePageBreaks]);

  // ── checkAndInsertAutoPageBreaks ─────────────────────────────────────────
  //
  // Called from onUpdate for normal typing (NOT during paste).
  //
  // Optimisation layers (innermost to outermost):
  //   1. Paste guard — skip entirely if paste is in flight.
  //   2. Re-entrancy guard — skip if an insertion is running.
  //   3. Content fingerprint — skip if doc text hasn't changed since last scan.
  //   4. Quick capacity check — count words/chars in the WHOLE doc first;
  //      if still well under capacity (< 80 % of one page) skip the full scan.
  //      This avoids the full forEach on every keystroke for short documents.
  //
  const checkAndInsertAutoPageBreaks = useCallback((editorInstance) => {
    if (isPastingRef.current)   return; // paste system handles it
    if (isInsertingRef.current) return; // re-entrancy guard
    if (!editorInstance?.state?.doc) return;

    const doc  = editorInstance.state.doc;
    const text = doc.textContent;

    // Fingerprint guard — no change since last scan
    const fingerprint = `${text.length}:${text.substring(0, 80)}`;
    if (fingerprint === lastFingerprintRef.current) return;

    // Quick capacity pre-check: if total doc is < 80 % of one page,
    // there is nothing to paginate yet → update fingerprint and bail.
    const totalWords = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const totalChars = text.length;
    const threshold  = 0.8;
    if (
      totalWords < pageCfg.MAX_WORDS_PER_PAGE * threshold &&
      totalChars < pageCfg.MAX_CHARS_PER_PAGE * threshold
    ) {
      lastFingerprintRef.current = fingerprint;
      return;
    }

    // Full scan needed — stamp fingerprint first so the resulting onUpdate exits
    lastFingerprintRef.current = fingerprint;
    runPastePageBreaks(editorInstance);
  }, [runPastePageBreaks]);

  // ── ProseMirror paste-interception plugin ────────────────────────────────
  //
  // CRITICAL: wrapped in useRef so the Plugin object is created ONCE.
  // If new Plugin() is called on every render, Tiptap sees a new extension
  // array reference on every render, tears down the editor, and the
  // handlePaste registered in the actual editor is always a stale closure
  // that never fires — meaning isPastingRef is never set and the scanner
  // runs mid-paste against a half-committed document.
  //
  // handlePaste fires SYNCHRONOUSLY before ProseMirror commits the paste
  // transaction. isPastingRef=true makes onUpdate skip the scanner.
  // After 400 ms (enough for ProseMirror schema normalisation + React batch)
  // we reset the flag, clear the fingerprint, and run the scanner once
  // against the fully settled document.
  //
  const pastePluginRef = useRef(null);
  if (!pastePluginRef.current) {
    pastePluginRef.current = new Plugin({
      key: new PluginKey('athena-paste-page-break'),
      props: {
        handlePaste: (_view, _event, _slice) => {
          isPastingRef.current = true;
          if (pasteTimerRef.current) clearTimeout(pasteTimerRef.current);

          pasteTimerRef.current = setTimeout(() => {
            isPastingRef.current       = false;
            lastFingerprintRef.current = ''; // force full re-scan
            // editorRef.current is the stable Tiptap editor reference
            const ed = editorRef.current;
            if (ed && !ed.isDestroyed) {
              // Check document size and choose processing mode
              const totalChars = ed.state.doc?.textContent?.length || 0;
              if (totalChars > 20000) {
                // Use progressive batched mode for very large documents (>20K chars)
                runProgressivePageBreaks(ed);
              } else {
                // Use single-pass mode for normal-sized documents
                runPastePageBreaks(ed);
              }
            }
          }, 300); // 300 ms — enough for ProseMirror + React to settle

          return false; // let ProseMirror handle the actual paste insertion
        },
      },
    });
  }
  const pastePlugin = pastePluginRef.current;



  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        document: false,
        heading: { levels: [1,2,3,4,5,6] }, 
        blockquote: false, 
        underline: false, 
        link: false, 
        listItem: false, 
        codeBlock: false,
        bulletList: false,
        orderedList: false
      }),
      Document.extend({ content: 'block+' }),  // Accept blocks directly (ENDLESS PAGE)
      TextStyle, Color, FontFamily, FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TiptapUnderline,
      TiptapLink.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline' } }),
      ListItem,
      Blockquote.configure({ HTMLAttributes: { class: 'blockquote' } }),
      CodeBlockLowlight.configure({ lowlight: createLowlight(common) }),
      Highlight.configure({ multicolor: true }),
      Typography, CharacterCount,
      Focus.configure({ className: 'has-focus', mode: 'all' }),
      Placeholder.configure({ placeholder: 'Start typing or press / for commands...' }),
      TiptapImage.configure({ HTMLAttributes: { class: 'rounded-lg' } }),
      ResizableImage,
      TaskList.configure({ HTMLAttributes: { class: 'task-list' } }),
      TaskItem.configure({ HTMLAttributes: { class: 'task-item' }, nested: true }),
      TiptapTable.configure({ resizable: true, HTMLAttributes: { class: 'table-border-black' } }),
      TableRow, TableCell, TableHeader, TableExtension,
      TiptapSubscript, TiptapSuperscript, Indent, PageBreak, TextDirection,  // PageBreak for visual section breaks
      BulletList.configure({ HTMLAttributes: { class: 'bullet-list' } }),
      OrderedList.configure({ HTMLAttributes: { class: 'ordered-list' } }),
      pastePlugin,
    ],
    content: '',  // Start empty - endless page with auto page breaks
    editable: true,
    autofocus: true,
    onUpdate: ({ editor: editorInstance }) => {
      setSaveStatus('modified');
      setTimeout(() => addHeadingStyles(), 10);
      
      // During a paste isPastingRef.current is true — the pastePlugin's
      // settle timer will call runPastePageBreaks once the doc is stable.
      // For normal typing: debounce the check so rapid keystrokes don't
      // queue many scans. 250 ms is fast enough to feel responsive but
      // slow enough for the user to finish a word before we scan.
      if (!isPastingRef.current) {
        if (paginationTimeoutRef.current) clearTimeout(paginationTimeoutRef.current);
        paginationTimeoutRef.current = setTimeout(() => {
          if (!isPastingRef.current && editorRef.current && !editorRef.current.isDestroyed) {
            checkAndInsertAutoPageBreaks(editorRef.current);
          }
        }, 250);
      }
      
      if (statsTimeoutRef.current) clearTimeout(statsTimeoutRef.current);
      statsTimeoutRef.current = setTimeout(() => {
        if (!editorInstance?.state?.doc) return;
        const text = editorInstance.state.doc.textContent;
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        setWordCount(words);
        setCharacterCount(text.length);
        setReadingTime(Math.ceil(words / 200));
        const newHeadings = [];
        let paragraphs = 0, images = 0, tables = 0;
        editorInstance.state.doc.descendants((node, pos) => {
          const type = node.type.name;
          if (type === 'heading') newHeadings.push({ level: node.attrs.level, text: node.textContent, id: `heading-${pos}` });
          else if (type === 'paragraph') paragraphs++;
          else if (type === 'image') images++;
          else if (type === 'table') tables++;
        });
        setHeadings(newHeadings);
        if (updateDocumentStatsAction) updateDocumentStatsAction(prev => ({ ...prev, paragraphs, images, tables }));
      }, 500);
      if (pagesUpdateTimeoutRef.current) clearTimeout(pagesUpdateTimeoutRef.current);
      pagesUpdateTimeoutRef.current = setTimeout(() => { 
        if (editorInstance?.state?.doc) {
          dynamicManualPagination(editorInstance);
          // Ensure editor maintains focus after pagination updates
          requestAnimationFrame(() => {
            if (!editorInstance.isDestroyed && editorInstance.view) {
              editorInstance.view.focus();
            }
          });
        }
      }, 400);
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = setTimeout(() => handleAutoSaveRef.current?.(), 3000);
    },
    onSelectionUpdate: ({ editor: editorInstance }) => {
      const { from, to } = editorInstance.state.selection;
      setSelectedText(from !== to ? editorInstance.state.doc.textBetween(from, to, ' ') : '');
      let newHeadingLevel = 0;
      editorInstance.state.doc.nodesBetween(from, to, (node) => {
        if (node.type.name === 'heading') { newHeadingLevel = node.attrs.level; return false; }
        return true;
      });
      setActiveHeadingLevel(newHeadingLevel);
    },
    editorProps: {
      attributes: { class: 'prose prose-lg max-w-none focus:outline-none min-h-[600px] table-border-black', spellcheck: 'true', 'data-testid': 'editor-content' },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editorRef.current = editor;
    
    // ENDLESS PAGE MODE - No pagination initialization needed
    // Content flows naturally without page wrapping
    
    // Note: localStorage has been removed. Initial content should be passed via props
    // or loaded from backend API. Currently no initial content is being loaded.
    // To load initial content, pass it as a prop to the TextEditor component.
  }, [editor]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = useCallback(async () => {
    if (!editor) return;
    try {
      const { from, to } = editor.state.selection;
      if (from === to) { toast.info('Nothing selected to copy'); return; }
      const text = editor.state.doc.textBetween(from, to, ' ');
      if (navigator.clipboard) { await navigator.clipboard.writeText(text); } else { document.execCommand('copy'); }
      toast.success('Content copied to clipboard');
    } catch (error) { toast.error('Failed to copy content'); }
  }, [editor]);

  const handlePaste = useCallback(() => {}, []);

  const handleAutoSave = useCallback(async () => {
    if (!editor) return;
    try {
      const html = editor.getHTML();
      // Note: Auto-save to backend (MongoDB) has been disabled.
      // Backend save should be handled through parent component callbacks.
      
      // Just update local state
      setLastSaved(new Date());
      setSaveStatus('saved');
    } catch (error) { 
      console.error('Auto-save error:', error);
      setSaveStatus('error');
    }
  }, [editor, documentTitle, setLastSaved, setSaveStatus]);
  
  // Wire handleAutoSave to ref to avoid TDZ and stale closures
  handleAutoSaveRef.current = handleAutoSave;

  const handleSave = useCallback(async () => {
    if (!editor) return;
    try {
      // Create comprehensive JSON export with all document features
      const documentData = {
        // Document Metadata
        metadata: {
          title: documentTitle || 'Untitled Document',
          createdAt: new Date().toISOString(),
          savedAt: new Date().toISOString(),
          version: '1.0',
          application: 'Athena Editor',
          applicationVersion: '1.0.0'
        },
        
        // Document Content
        content: {
          html: editor.getHTML(),
          text: editor.getText(),
          json: editor.getJSON()
        },
        
        // Document Statistics
        statistics: {
          characterCount: editor.getText().length,
          wordCount: editor.getText().trim().split(/\s+/).filter(w => w.length > 0).length,
          paragraphCount: editor.state.doc.childCount,
          selection: {
            from: editor.state.selection.from,
            to: editor.state.selection.to,
            anchor: editor.state.selection.anchor,
            head: editor.state.selection.head
          }
        },
        
        // Document Styles and Formatting
        styles: {
          marks: editor.getAttributes('textStyle'),
          activeStyles: {
            bold: editor.isActive('bold'),
            italic: editor.isActive('italic'),
            underline: editor.isActive('underline'),
            strike: editor.isActive('strike'),
            code: editor.isActive('code'),
            link: editor.isActive('link')
          }
        },
        
        // Document Structure
        structure: {
          headings: [],
          paragraphs: [],
          lists: [],
          tables: [],
          images: [],
          links: []
        },
        
        // Editor State
        editorState: {
          zoom: zoom,
          isEditable: editor.isEditable,
          isFocused: editor.isFocused
        }
      };
      
      // Extract document structure by traversing the document
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          documentData.structure.headings.push({
            level: node.attrs.level,
            content: node.textContent,
            position: pos
          });
        } else if (node.type.name === 'paragraph') {
          documentData.structure.paragraphs.push({
            content: node.textContent,
            position: pos,
            marks: node.marks.map(m => ({ type: m.type.name, attrs: m.attrs }))
          });
        } else if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
          documentData.structure.lists.push({
            type: node.type.name,
            content: node.textContent,
            position: pos
          });
        } else if (node.type.name === 'table') {
          documentData.structure.tables.push({
            rows: node.childCount,
            position: pos
          });
        } else if (node.type.name === 'image') {
          documentData.structure.images.push({
            src: node.attrs.src,
            alt: node.attrs.alt,
            position: pos
          });
        }
        
        // Extract links from marks
        node.marks.forEach(mark => {
          if (mark.type.name === 'link') {
            documentData.structure.links.push({
              href: mark.attrs.href,
              text: node.textContent,
              position: pos
            });
          }
        });
      });
      
      // Note: Removed localStorage backup. Only save to backend (MongoDB).
      
      // Save to backend (MongoDB) using TextEditorService
      if (activeDocId) {
        try {
          // Use mongoId from state/props instead of localStorage
          if (mongoId) {
            // Update existing document using /api/text-editor/document/:id
            await TextEditorService.updateDocument(mongoId, {
              title: documentTitle,
              data: {
                content: editor.getJSON(),
                html: editor.getHTML()
              }
            });
          } else {
            // Save new document using /api/text-editor/save
            const result = await TextEditorService.saveDocument({
              title: documentTitle,
              data: {
                content: editor.getJSON(),
                html: editor.getHTML()
              }
            });
            // Parent component should track the MongoDB ID via callback or state
            onMongoIdSaved?.(activeDocId, result.id);
          }
          
          setLastSaved(new Date());
          setSaveStatus('saved');
          toast.success('Document saved to backend successfully! 💾');
        } catch (backendError) {
          console.error('Backend save error:', backendError);
          toast.error('Failed to save to backend: ' + (backendError.message || 'Unknown error'));
          setSaveStatus('error');
          return; // Stop here if backend save fails
        }
      } else {
        // No activeDocId - just local state update
        setLastSaved(new Date());
        setSaveStatus('saved');
        toast.success('Document saved! 💾');
      }
      
      // Document saved successfully to backend - no file export
    } catch (error) {
      console.error('❌ Save error:', error);
      console.error('Error stack:', error.stack);
      // Only show error if it's not just an export failure
      if (error.message && error.message.includes('export')) {
        console.warn('Export failed but document was saved');
      } else {
        toast.error('Failed to save document: ' + (error.message || 'Unknown error'));
      }
    }
  }, [editor, documentTitle, zoom, setLastSaved, setSaveStatus, api]);

  const handlePrint = useCallback(async () => {
    if (!editor) return;
    try { await DocumentExporter.printDocument(editor, { title: documentTitle || 'Document' }); }
    catch (error) { toast.error('Failed to print document'); }
  }, [editor, documentTitle]);

  const handleFindReplace = useCallback((isReplaceMode = false) => {
    setFindReplaceMode(isReplaceMode); setShowFindReplaceModal(true);
  }, []);

  const handleExport = useCallback(async () => {
    if (!editor) { toast.error('Editor not available'); return; }
    const options = { filename: `${documentTitle || 'document'}.${exportFormat}`, title: documentTitle || 'My Document' };
    try {
      switch (exportFormat) {
        case 'pdf': await exportToPDF(editor, options); break;
        case 'docx': await exportToDOCX(editor, options); break;
        case 'epub': await exportToEPUB(editor, options); break;
        case 'md': await exportToMarkdown(editor, options); break;
        case 'txt': await exportToPlainText(editor, options); break;
        case 'html': await exportToHTML(editor, options); break;
        case 'json': await exportToJSON(editor, options); break;
        default: toast.error(`Unsupported export format: ${exportFormat}`);
      }
    } catch (error) { toast.error('Export failed'); }
    finally { updateEditorFeatures({ showExportDialog: false }); }
  }, [editor, documentTitle, exportFormat, updateEditorFeatures, exportToPDF, exportToDOCX, exportToEPUB, exportToMarkdown, exportToPlainText, exportToHTML, exportToJSON]);

  const openExportDialog = useCallback(() => { updateEditorFeatures({ showExportDialog: true }); }, [updateEditorFeatures]);

  const handleAIGenerate = useCallback(async (content) => {
    if (!editor) return;
    try {
      const html = marked.parse(content);
      editor.chain().focus().insertContent(DOMPurify.sanitize(html)).run();
    } catch (error) { toast.error('Failed to generate content'); }
  }, [editor, updateEditorFeatures]);

  const handleTransformText = useCallback(async (action, result) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from !== to) { editor.chain().focus().deleteRange({ from, to }).insertContent(result).run(); }
  }, [editor]);

  const handleHeadingClick = useCallback((id) => {
    if (!editor) return;
    try { const pos = parseInt(id.replace('heading-', '')); editor.chain().focus().setTextSelection(pos).run(); }
    catch (error) { console.error('Heading click error:', error); }
  }, [editor]);

  const handleZoomChange = useCallback((newZoom) => {
    const clampedZoom = Math.max(50, Math.min(200, Math.round(newZoom / 10) * 10));
    updateUIState({ zoom: clampedZoom });
  }, [updateUIState]);

  const handleTemplateSelect = useCallback((template) => {
    if (editor) { editor.commands.setContent(template.content); setDocumentTitle(template.name); toast.success(`Template "${template.name}" applied!`); }
  }, [editor, setDocumentTitle]);

  const handleHeadingChange = useCallback((level) => {
    if (!editor) return;
    editor.chain().focus();
    if (level === 0) { editor.chain().setParagraph().run(); } else { editor.chain().toggleHeading({ level }).run(); }
    setActiveHeadingLevel(level);
    setTimeout(() => { addHeadingStyles(); if (editor.view) editor.view.updateState(editor.state); }, 50);
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const toggleTaskList = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleTaskList().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleUnderline().run();
  }, [editor]);

  const toggleBlockquote = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleBlockquote().run();
  }, [editor]);

  const addNewPage = useCallback(() => {
    if (!editor) return;
    // Insert a real pageBreak node at the end of the current top-level block.
    // Using setHorizontalRule() was wrong — it inserts <hr>, which is never
    // counted by dynamicManualPagination and has no visual page-break effect.
    const { state } = editor;
    const { $from }  = state.selection;
    // Walk up to the top-level block and insert after it
    const depth      = $from.depth;
    const topEnd     = depth > 0 ? $from.end(1) + 1 : $from.pos;
    const insertPos  = Math.min(topEnd, state.doc.content.size);
    editor.chain().insertContentAt(insertPos, { type: 'pageBreak' }).run();
    toast.success('New page added');
  }, [editor]);

  const addPageBreak = useCallback(() => {
    if (!editor) return;
    const { state } = editor;
    const { $from }  = state.selection;
    const depth      = $from.depth;
    const topEnd     = depth > 0 ? $from.end(1) + 1 : $from.pos;
    const insertPos  = Math.min(topEnd, state.doc.content.size);
    editor.chain().insertContentAt(insertPos, { type: 'pageBreak' }).run();
    toast.success('Page break inserted');
  }, [editor]);

  const insertPageNumber = useCallback(() => {
    if (editor) { editor.chain().focus().insertContent(`<span style="color:#666;font-size:12px;">${currentPage}</span>`).run(); }
  }, [editor, currentPage]);

  const goToPage = useCallback((pageNumber) => {
    if (pageNumber < 1 || pageNumber > pages.length) { toast.error(`Invalid page number`); return; }
    setCurrentPage(pageNumber);
    const pageElement = document.getElementById(`page-${pageNumber}`);
    if (pageElement) pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [pages]);

  const handleInsertImage = useCallback(() => {
    setShowImageModal(true); setImageInsertMethod('url'); setImageUrl(''); setSelectedImageAlt('');
  }, []);

  const insertImage = useCallback((src, alt = '', width = 400, height = 300) => {
    if (!editor || !src) return;
    try {
      editor.chain().focus().setResizableImage({ src, alt, title: alt || 'Image', width, height, align: 'left' }).run();
      toast.success('Image inserted successfully');
      setShowImageModal(false);
    } catch (error) {
      try { editor.chain().focus().setImage({ src, alt }).run(); setShowImageModal(false); }
      catch (e) { toast.error('Failed to insert image'); }
    }
  }, [editor]);

  const handleImageUrlSubmit = useCallback(() => {
    if (!imageUrl.trim()) { toast.error('Please enter an image URL'); return; }
    insertImage(imageUrl, selectedImageAlt || 'Image');
    setImageUrl(''); setSelectedImageAlt('');
  }, [imageUrl, selectedImageAlt, insertImage]);

  const handleImageUpload = useCallback(async (file) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setIsImageUploading(true);
      setUploadProgress(0);

      // Simulate upload progress for better UX
      const simulateProgress = () => {
        return new Promise((resolve) => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 15 + 5; // Random progress between 5-20%
            if (progress >= 90) {
              progress = 90;
              clearInterval(interval);
              resolve();
            } else {
              setUploadProgress(Math.min(progress, 90));
            }
          }, 200); // Update every 200ms
        });
      };

      // Start simulating progress
      await simulateProgress();

      // Read the file
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(Math.min(percentComplete + 90, 95)); // Scale to 90-95% range
        }
      };

      reader.onload = (e) => {
        if (e.target?.result) {
          setUploadProgress(100);
          
          // Small delay to show 100% completion
          setTimeout(() => {
            insertImage(e.target.result, file.name);
            setIsImageUploading(false);
            setUploadProgress(0);
            toast.success('Image uploaded successfully! 🎉');
          }, 300);
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read image file');
        setIsImageUploading(false);
        setUploadProgress(0);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      setIsImageUploading(false);
      setUploadProgress(0);
    }
  }, [insertImage]);

  const handleDeleteDocument = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      editor?.commands.clearContent(); setDocumentTitle('Untitled Document');
      // Note: Removed localStorage deletion. Backend deletion should be handled via API call.
      toast.success('Document cleared');
      // Call backend deletion if needed
      onDeleteDocument?.();
    }
  }, [editor, setDocumentTitle, onDeleteDocument]);

  const handleRestoreVersion = useCallback((versionId) => {
    const version = documentVersions.find(v => v.id === versionId);
    if (version && editor) { editor.commands.setContent(version.content); setDocumentTitle(version.title); setShowVersionHistory(false); }
  }, [editor, documentVersions, setDocumentTitle]);

  const applyHeadingStyle = useCallback((level) => {
    const customStyle = customHeadingStyles[level];
    if (customStyle && editor) { editor.commands.updateAttributes('heading', customStyle); }
  }, [customHeadingStyles, editor]);

  const saveCustomHeadingStyle = useCallback((level, styles) => {
    setCustomHeadingStyles(prev => ({ ...prev, [level]: styles }));
  }, []);

  const toggleSectionCollapse = useCallback((headingId) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      newSet.has(headingId) ? newSet.delete(headingId) : newSet.add(headingId);
      return newSet;
    });
  }, []);

  useEffect(() => { return () => { clearTimeout(statsTimeoutRef.current); clearTimeout(pagesUpdateTimeoutRef.current); clearTimeout(autoSaveTimeoutRef.current); clearTimeout(pasteTimerRef.current); }; }, []);

  return (
    <TooltipProvider>
      <div className="h-screen w-full flex flex-col bg-background overflow-x-hidden relative">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-0.5 bg-white border-b border-gray-100 z-30">
          <div className="flex items-center gap-3">
            <div className="bg-[#1a73e8] p-1.5 rounded shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <input
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Untitled Document"
              className="text-lg font-medium border-none outline-none bg-transparent p-0 min-w-[120px] tracking-tight text-gray-800 uppercase"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600" onClick={() => setIsOutlineOpen(!isOutlineOpen)}>
                <PanelLeft className="w-4 h-4" />
              </Button>
            </div>
            <HeaderMenuBar
              onSave={handleSave}
              onExport={openExportDialog}
              onPrint={handlePrint}
              onDelete={handleDeleteDocument}
              onFindReplace={handleFindReplace}
              editor={editor}
              zoom={zoom}
              onZoomChange={handleZoomChange}
              onShowHelp={() => toast.info('Help documentation would open here')}
              onShowSettings={() => toast.info('Settings would open here')}
              documentTitle={documentTitle}
              onRenameDocument={(newTitle) => setDocumentTitle(newTitle)}
              
              // Direct editor commands with focus management and selection restoration
              onToggleBold={() => { 
                console.log('🎯 [TextEditor] onToggleBold called, editor:', !!editor); 
                runWithSavedSelection(editor, (chain) => chain.toggleBold()); 
              }}
              onToggleItalic={() => { 
                console.log('🎯 [TextEditor] onToggleItalic called, editor:', !!editor); 
                runWithSavedSelection(editor, (chain) => chain.toggleItalic()); 
              }}
              onToggleUnderline={() => { 
                console.log('🎯 [TextEditor] onToggleUnderline called, editor:', !!editor); 
                runWithSavedSelection(editor, (chain) => chain.toggleUnderline()); 
              }}
              onToggleStrikethrough={() => { 
                console.log('🎯 [TextEditor] onToggleStrikethrough called, editor:', !!editor); 
                runWithSavedSelection(editor, (chain) => chain.toggleStrike()); 
              }}
              onToggleSuperscript={() => { 
                console.log('🎯 [TextEditor] onToggleSuperscript called'); 
                runWithSavedSelection(editor, (chain) => chain.toggleSuperscript()); 
              }}
              onToggleSubscript={() => { 
                console.log('🎯 [TextEditor] onToggleSubscript called'); 
                runWithSavedSelection(editor, (chain) => chain.toggleSubscript()); 
              }}
              onToggleCode={() => { 
                console.log('🎯 [TextEditor] onToggleCode called'); 
                runWithSavedSelection(editor, (chain) => chain.toggleCode()); 
              }}
              onClearFormatting={() => { 
                console.log('🎯 [TextEditor] onClearFormatting called'); 
                runWithSavedSelection(editor, (chain) => chain.unsetAllMarks().clearNodes()); 
              }}
              onSetTextAlign={(align) => { 
                console.log('🎯 [TextEditor] onSetTextAlign called', align); 
                runWithSavedSelection(editor, (chain) => chain.setTextAlign(align)); 
              }}
              onInsertImage={() => setShowImageModal(true)}
              onInsertTable={() => setShowTablePicker(!showTablePicker)}
              onInsertLink={() => {
                const url = window.prompt('Enter URL:');
                if (url && editor) {
                  editor.chain().focus().setLink({ href: url }).run();
                  toast.success('Link added');
                }
              }}
              onUndo={() => { console.log('onUndo called'); runWithSavedSelection(editor, (chain) => chain.undo()); }}
              onRedo={() => { console.log('onRedo called'); runWithSavedSelection(editor, (chain) => chain.redo()); }}
              onSelectAll={() => { console.log('onSelectAll called'); runWithSavedSelection(editor, (chain) => chain.selectAll()); }}
              onCut={() => { console.log('onCut called'); document.execCommand('cut'); }}
              onCopy={() => { console.log('onCopy called'); document.execCommand('copy'); }}
              onPaste={async () => {
                console.log('onPaste called');
                try {
                  if (navigator.clipboard?.readText) {
                    const text = await navigator.clipboard.readText();
                    runWithSavedSelection(editor, (chain) => chain.insertContent(text));
                  } else {
                    document.execCommand('paste');
                  }
                } catch {
                  document.execCommand('paste');
                }
              }}
              onPastePlainText={async () => {
                console.log('onPastePlainText called');
                try {
                  const text = await navigator.clipboard.readText();
                  runWithSavedSelection(editor, (chain) => chain.insertContent(text));
                } catch {
                  toast.info('Use Ctrl+Shift+V to paste as plain text');
                }
              }}
              onToggleSpellCheck={() => {
                console.log('onToggleSpellCheck called');
                const currentState = editor?.view?.dom?.getAttribute('spellcheck') !== 'false';
                const newState = !currentState;
                if (editor?.view?.dom) {
                  editor.view.dom.setAttribute('spellcheck', newState);
                }
                toast.success(`Spell check ${newState ? 'enabled' : 'disabled'}`);
              }}
              onToggleBulletList={() => { console.log('onToggleBulletList called'); runWithSavedSelection(editor, (chain) => chain.toggleBulletList()); }}
              onToggleOrderedList={() => { console.log('onToggleOrderedList called'); runWithSavedSelection(editor, (chain) => chain.toggleOrderedList()); }}
              onToggleTaskList={() => { console.log('onToggleTaskList called'); runWithSavedSelection(editor, (chain) => chain.toggleTaskList()); }}
              onIndent={() => { console.log('onIndent called'); runWithSavedSelection(editor, (chain) => chain.indent()); }}
              onOutdent={() => { console.log('onOutdent called'); runWithSavedSelection(editor, (chain) => chain.outdent()); }}
              onInsertPageBreak={() => {
                console.log('onInsertPageBreak called');
                runWithSavedSelection(editor, () => {
                  const { state } = editor;
                  const { $from } = state.selection;
                  const depth = $from.depth;
                  const topEnd = depth > 0 ? $from.end(1) + 1 : $from.pos;
                  const insertPos = Math.min(topEnd, state.doc.content.size);
                  editor.chain().insertContentAt(insertPos, { type: 'pageBreak' }).run();
                  toast.success('Page break inserted');
                });
              }}
              onInsertHorizontalRule={() => { console.log('onInsertHorizontalRule called'); runWithSavedSelection(editor, (chain) => chain.setHorizontalRule()); }}
              onToggleBlockquote={() => { console.log('onToggleBlockquote called'); runWithSavedSelection(editor, (chain) => chain.toggleBlockquote()); }}
            />
          </div>
        </header>

        {/* Toolbar */}
        <EditorToolbar
          editor={editor}
          zoom={zoom}
          onZoomChange={handleZoomChange}
          onSave={handleSave}
          onPrint={handlePrint}
          handleInsertImage={handleInsertImage}
          setShowReferencesPanel={(show) => updateEditorFeatures({ showReferencesPanel: show })}
          documentTitle={documentTitle}
          addNewPage={addNewPage}
          addPageBreak={addPageBreak}
          insertPageNumber={insertPageNumber}
          handleHeadingChange={handleHeadingChange}
          activeHeadingLevel={activeHeadingLevel}
          toggleBulletList={toggleBulletList}
          toggleOrderedList={toggleOrderedList}
          toggleTaskList={toggleTaskList}
          setShowAIAssistant={setShowAIAssistant}
          toggleUnderline={toggleUnderline}
          toggleBlockquote={toggleBlockquote}
          openExportDialog={openExportDialog}
          exportLoading={exportLoading}
          setIsTemplateSidebarOpen={(open) => updateEditorFeatures({ showTemplateSidebar: open })}
          isTemplateSidebarOpen={showTemplateSidebar}
        />

        {/* Find & Replace */}
        <FindReplaceModal
          isOpen={showFindReplaceModal}
          onClose={() => setShowFindReplaceModal(false)}
          editor={editor}
          isReplaceMode={findReplaceMode}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <DocumentOutline
            isOpen={isOutlineOpen}
            onClose={() => setIsOutlineOpen(false)}
            headings={headings}
            onHeadingClick={handleHeadingClick}
            documentTitle={documentTitle}
            collapsedSections={collapsedSections}
            onToggleCollapse={toggleSectionCollapse}
          />

          <div
            ref={contentContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-100/50 p-4"
            onCopy={handleCopy}
          >
            <div
              className="athena-workspace"
              style={zoom !== 100 ? { transform: `scale(${zoom / 100})`, transformOrigin: 'top center' } : undefined}
            >
            <div className="editor-content-container">
              {editor && (
                <EditorContent editor={editor} className="tip-tap-editor" />
              )}
            </div>
              
              
            </div>
          </div>


        </div>

        {/* Status Bar */}
        <footer className="flex items-center justify-between px-4 py-1.5 bg-gray-50/30 text-xs text-gray-500 border-t border-gray-200/50">
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>{characterCount} chars</span>
            <span>{readingTime}m read</span>
            <div className="flex items-center gap-1.5 pl-3 border-l border-gray-300/50">
              <div className={`w-2 h-2 rounded-full ${saveStatus === 'modified' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
              <span className={saveStatus === 'modified' ? 'text-orange-600' : 'text-green-600'}>
                {saveStatus === 'modified' ? 'Unsaved' : 'Saved'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span>{zoom}%</span>
          </div>
        </footer>

        {/* Template Sidebar */}
        <TemplateSidebar
          isOpen={showTemplateSidebar}
          onClose={() => updateEditorFeatures({ showTemplateSidebar: false })}
          onSelectTemplate={handleTemplateSelect}
        />

        {/* Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={(open) => updateEditorFeatures({ showExportDialog: open })}>
          <DialogContent className="max-w-md bg-white" aria-describedby="export-dialog-description">
            <DialogHeader>
              <DialogTitle>Export Document</DialogTitle>
              <DialogDescription id="export-dialog-description">Choose format and options for exporting your document.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={exportFormat} onValueChange={(value) => updateEditorFeatures({ exportFormat: value })}>
                  <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
                  <SelectContent className="bg-white">
                    {[['pdf','PDF'],['docx','DOCX'],['md','Markdown'],['txt','Plain Text'],['html','HTML'],['json','JSON']].map(([v,l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => updateEditorFeatures({ showExportDialog: false })}>Cancel</Button>
              <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Version History */}
        <AnimatePresence>
          {showVersionHistory && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowVersionHistory(false)} className="fixed inset-0 bg-black/20 z-50" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Version History</h2>
                    <button onClick={() => setShowVersionHistory(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                    {documentVersions.map((version) => (
                      <div key={version.id} className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{version.title}</h3>
                          <p className="text-sm text-gray-500">{version.timestamp.toLocaleString()} · {version.author}</p>
                        </div>
                        <Button onClick={() => handleRestoreVersion(version.id)} size="sm">Restore</Button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Enhanced Image Modal */}
<AnimatePresence>
  {showImageModal && (
    <>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
        onClick={() => setShowImageModal(false)} 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
        className="fixed inset-0 z-[101] flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Add Image</h2>
              <p className="text-xs text-slate-500">Upload, link, or search for visuals</p>
            </div>
            <button onClick={() => setShowImageModal(false)} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* Navigation Tabs */}
            <div className="flex p-0.5 bg-slate-100 rounded-lg mb-4 w-fit">
              {['upload', 'url', 'stock'].map((method) => (
                <button
                  key={method}
                  onClick={() => setImageInsertMethod(method)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    imageInsertMethod === method ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </button>
              ))}
            </div>

            {/* Content Areas */}
            <div className="space-y-4">
              {imageInsertMethod === 'upload' && (
                <div 
                  className="border-2 border-dashed border-slate-200 rounded-xl p-6 transition-colors hover:border-blue-400 hover:bg-blue-50/30 group cursor-pointer text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      handleImageUpload(file);
                    } else {
                      toast.error('Please drop an image file');
                    }
                  }}
                >
                  <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG or WebP (max 5MB)</p>
                  
                  {/* Progress Bar - Show during upload */}
                  {isImageUploading && (
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Uploading...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 animate-pulse">Please wait while we process your image...</p>
                    </div>
                  )}
                  
                  {!isImageUploading && (
                    <>
                      <input type="file" className="hidden" id="image-upload" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0])} />
                      <Button variant="outline" className="mt-3 h-8 text-xs" onClick={() => document.getElementById('image-upload').click()}>
                        Browse Files
                      </Button>
                    </>
                  )}
                </div>
              )}

              {imageInsertMethod === 'url' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Image URL</Label>
                    <div className="relative">
                      <Link className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                      <Input 
                        className="pl-9 h-9 text-sm" 
                        placeholder="Paste image link here..." 
                        value={imageUrl} 
                        onChange={(e) => setImageUrl(e.target.value)} 
                      />
                    </div>
                  </div>
                  {imageUrl && (
                    <div className="rounded-lg overflow-hidden border border-slate-100 bg-slate-50 aspect-video flex items-center justify-center relative group">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" onError={(e) => e.target.src = 'fallback-url'} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Image Preview</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer with Metadata & Actions */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input 
                  placeholder="Alt text (e.g. 'Dog running in park')" 
                  value={selectedImageAlt} 
                  onChange={(e) => setSelectedImageAlt(e.target.value)}
                  className="bg-white h-9 text-sm"
                />
              </div>
              <Select defaultValue="center">
                <SelectTrigger className="w-[130px] h-9 bg-white text-sm">
                  <SelectValue placeholder="Alignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="full">Full Width</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" className="h-9" onClick={() => setShowImageModal(false)}>Cancel</Button>
              <Button 
                disabled={!imageUrl && imageInsertMethod !== 'upload'} 
                onClick={handleImageUrlSubmit}
                className="bg-blue-600 hover:bg-blue-700 h-9 px-6 text-sm"
              >
                Insert Image
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

        {/* AI Assistant Panel */}
        <AIAssistant
          open={showAIAssistant}
          onOpenChange={setShowAIAssistant}
          onGenerateDocument={(data) => {
            console.log('Generate document:', data);
            toast.success(`Generating ${data.type} - ${data.pages} page${data.pages > 1 ? 's' : ''}`);
          }}
          onInlineAction={(behavior, content) => {
            if (!editor) return;
            if (behavior === 'replace') {
              editor.chain().focus().deleteSelection().insertContent(content).run();
            } else if (behavior === 'append') {
              editor.chain().focus().insertContent(`<p>${content}</p>`).run();
            }
            toast.success('AI action applied');
          }}
          onImageInsert={(imageUrl, altText) => {
            if (!editor) return;
            try {
              editor.chain().focus().setResizableImage({ 
                src: imageUrl, 
                alt: altText, 
                title: altText || 'AI Generated Image', 
                width: 400, 
                height: 300, 
                align: 'left' 
              }).run();
              toast.success('AI image inserted successfully');
            } catch (error) {
              editor.chain().focus().setImage({ src: imageUrl, alt: altText }).run();
              toast.success('AI image inserted');
            }
          }}
          selectedText={editor?.state?.doc?.textBetween(editor.state.selection.from, editor.state.selection.to, ' ') || ''}
        />
      </div>
    </TooltipProvider>
  );
};

export default TextEditorWithProviders;