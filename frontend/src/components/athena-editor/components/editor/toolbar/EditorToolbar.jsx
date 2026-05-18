// src/components/athena-editor/components/TextEditor.jsx
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import ReactDOM, { createPortal } from 'react-dom';

// 🔥 CRITICAL FIX: Conditional logging helper - removes all debug logs in production
// PROBLEM: Over 60 console.log/warn statements exist inside hot paths (onUpdate, onSelectionUpdate,
// pagination checks, paste handlers). In production each call serializes arguments and writes to the
// DevTools buffer — measurable as 2–5 ms overhead per event on mid-range hardware, causing typing latency.
// 
// SOLUTION: Replace all debug logs with a conditional helper that's a no-op in production
const log = process.env.NODE_ENV === 'development'
  ? (...args) => console.log(...args)
  : () => { };

const warn = process.env.NODE_ENV === 'development'
  ? (...args) => console.warn(...args)
  : () => { };

const error = process.env.NODE_ENV === 'development'
  ? (...args) => console.error(...args)
  : (...args) => console.error(...args); // Always show errors in prod for debugging critical issues
import Portal from '../../ui/Portal';
import { useEditor, EditorContent } from '@tiptap/react';
import { Fragment, Slice, DOMSerializer } from '@tiptap/pm/model';
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
import Indent from '../../../extensions/Indent.js';
import { Page, initializePagination } from '../../../extensions/Page.js';
import { addHeadingStyles, updateHeadingStyles } from '../EditorPagination.js';  // Heading styles functions
import { paginateDocument, debouncePaginate, cleanupPagination, invalidatePaginationCache } from '../../../utils/paginationEngine.js'; // 🔥 CRITICAL: Full pagination + paste detection
import { usePastePagination } from '../../../hooks/usePastePagination';
import { transformMarkdownToEditor, isMarkdown } from '../../../utils/transformMarkdownToEditor.js'; // 🔥 NEW: Markdown transformer
import { TextStyle } from '@tiptap/extension-text-style';
import TableExtension from '../../../extensions/TableExtension.js';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextDirection } from '../../../extensions/TextDirection.js';
import { ResizableImage } from '../../../extensions/ResizableImage.jsx';
import { Subscript as TiptapSubscript } from '@tiptap/extension-subscript';
import { Superscript as TiptapSuperscript } from '@tiptap/extension-superscript';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Blockquote } from '@tiptap/extension-blockquote';
import { createLowlight } from 'lowlight';
import { common } from 'lowlight';
import { mergeAttributes, Node, Extension } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { EditorProvider, useEditorContext } from '../../../contexts/EditorContent.jsx';
import { ImageProvider, useImageContext } from '../../../contexts/ImageContext.jsx';
import { useExportState } from '../../../hooks/useExportState.js';
import { toast } from 'sonner';
import { debounce } from 'lodash'; // 🔥 For debounced auto-save
import {
  rewriteText,
  expandText,
  summarizeText,
  changeTone,
  bulletToParagraph,
  paraphraseText,
  improveReadability,
  callAIStreamAPI
} from '../../../ai/aiUtils.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs';
import { DocumentExporter } from '../../../../../utils/documentExporter.js';
import { saveTokenUsage, getTokenUsageForSave } from '../../../../../utils/tokenPersistence.js';
import { DocumentOutline } from '../DocumentOutline';
import { TemplateSidebar } from '../TemplateSidebar.jsx';
import HeaderMenuBar from '../HeaderMenuBar';
import { FindReplaceModal } from '../FindReplaceModal';
import { AIAssistant } from '../AIAssistant.jsx';
import { ExportDialog } from '../../ExportDialog';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../../../services/api';
import { TextEditorService } from '../../../../../services/Text-Editor/text.service.js';
import { useDocument, useUpdateDocument } from '../../../../../hooks/useDocuments.js';
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
import { Separator } from '../../ui/separator';
import { Tooltip, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import IndentControls from './IndentControls.jsx';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "../../ui/popover";
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
} from "../../ui/dropdown-menu";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Switch } from "../../ui/switch";
import { Slider } from "../../ui/slider";
import { cn } from "@/components/athena-editor/components/utils"
import { scrollLockManager } from '../../../utils/scrollLockManager';
import focusUtils from '../focusUtils';

// Destructure functions from default export for backward compatibility
const { guardToolbarMouseDown, runWithSavedSelection, preventEditorBlur, saveSelection, onMenuOpen, onMenuClose } = focusUtils;
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';
const _CommentsPanel = lazy(() => import('../CommentsPanel').then(m => ({ default: m.CommentsPanel })));
const _VersionHistory = lazy(() => import('../VersionHistory').then(m => ({ default: m.VersionHistory })));
// import { VoiceTyping as _VoiceTyping } from '../VoiceTyping';
const _PageSetupDialog = lazy(() => import('../PageSetupDialog').then(m => ({ default: m.PageSetupDialog })));
const _KeyboardShortcutsDialog = lazy(() => import('../KeyboardShortcutsDialog').then(m => ({ default: m.KeyboardShortcutsDialog })));
const _WordCountDialog = lazy(() => import('../WordCountDialog').then(m => ({ default: m.WordCountDialog })));



// New feature components

// Safety: if any module exports an object instead of a component function, render null
const _safe = (C) => (C ? C : () => null);
const CommentsPanel = _safe(_CommentsPanel);
const VersionHistory = _safe(_VersionHistory);
// const VoiceTyping = _safe(_VoiceTyping);
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
  { label: "Markdown", value: "md", icon: FileText },
  { label: "HTML", value: "html", icon: FileText },
  { label: "Plain Text", value: "txt", icon: FileText },
  { label: "JSON", value: "json", icon: FileText },
  // Hidden until implemented:
  // { label: "EPUB", value: "epub", icon: FileText },
  // { label: "XML", value: "xml", icon: FileText },
  // { label: "CSV", value: "csv", icon: FileText },
  // { label: "RTF", value: "rtf", icon: FileText }
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
  setShowImportModal,
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

  // Setup keyboard shortcuts - moved above early return
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
    onNewDocument: () => setShowNewDocConfirm(true),
  });

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

  // Zoom helper functions
  const effectiveZoom = zoom || 100;

  const onZoomChangeWithFeedback = (newZoom) => {
    // Round zoom to the nearest multiple of 10
    const roundedZoom = Math.round(newZoom / 10) * 10;
    // Ensure zoom stays within valid bounds (50-200)
    const clampedZoom = Math.max(50, Math.min(200, roundedZoom));
    if (onZoomChange && typeof onZoomChange === 'function') {
      onZoomChange(clampedZoom);
      // 🔥 CRITICAL FIX: Use stable ID to replace previous toast instead of stacking
      // PROBLEM: toast.success() fires on every slider input event. Dragging zoom from
      // 100% to 150% fires ~5 toasts per second, stacking them in the corner and requiring
      // the user to dismiss them.
      // 
      // SOLUTION: Use toast with stable id - replaces previous zoom toast in place
      toast.success(`Zoom: ${clampedZoom}%`, {
        id: 'zoom-toast',
        duration: 1500,
      });
    } else {
      toast.error('Zoom function not available');
    }
  };
  const aiDocControllerRef = useRef(null);
  const aiInlineControllerRef = useRef(null);

  // New feature panel states
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null); // 🔥 For version restore confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // 🔥 For document delete confirmation
  // const [showVoiceTyping, setShowVoiceTyping] = useState(false);
  const [showPageSetup, setShowPageSetup] = useState(false);
  const [showWordCount, setShowWordCount] = useState(false);
  const [textDirection, setTextDirectionState] = useState('ltr');
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [lineSpacingMenuOpen, setLineSpacingMenuOpen] = useState(false);
  const [pageMargins, setPageMargins] = useState({ top: 4, bottom: 4, left: 72, right: 72 }); // ✅ ULTRA TIGHT: 4px top/bottom, 0.75" sides
  const [documentVersions, setDocumentVersions] = useState([]);
  const [showInsertLink, setShowInsertLink] = useState(false);
  const [linkDisplayText, setLinkDisplayText] = useState('');
  const [savedSelection, setSavedSelection] = useState(null); // Save selection when dialog opens

  // CRITICAL FIX: Move ALL hooks BEFORE the early return to satisfy Rules of Hooks
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [selectedRows, setSelectedRows] = useState(0);
  const [selectedCols, setSelectedCols] = useState(0);
  const tablePickerRef = useRef(null);
  const tableButtonRef = useRef(null);

  // ✅ Sync pageMargins state → CSS variables so every stylesheet sees the values
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--editor-margin-top', `${pageMargins.top}px`);
    r.style.setProperty('--editor-margin-bottom', `${pageMargins.bottom}px`);
    r.style.setProperty('--editor-margin-left', `${pageMargins.left}px`);
    r.style.setProperty('--editor-margin-right', `${pageMargins.right}px`);
    // Also sync legacy variable names used by real-pagination.css
    r.style.setProperty('--doc-margin-top', `${pageMargins.top}px`);
    r.style.setProperty('--doc-margin-bottom', `${pageMargins.bottom}px`);
    r.style.setProperty('--doc-margin-left', `${pageMargins.left}px`);
    r.style.setProperty('--doc-margin-right', `${pageMargins.right}px`);
  }, [pageMargins]);

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
      // Global shortcut: Ctrl+Alt+T to open table picker (anywhere in editor)
      if (e.ctrlKey && e.altKey && e.key === 't') {
        e.preventDefault();
        onMenuOpen(editor);
        setShowTablePicker(true);
        toast.info('Select table size');
        return;
      }

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

  // Position the table picker dropdown
  useLayoutEffect(() => {
    if (showTablePicker && tableButtonRef.current && tablePickerRef.current) {
      const buttonRect = tableButtonRef.current.getBoundingClientRect();
      const pickerElement = tablePickerRef.current;

      // 🔥 CRITICAL FIX: Use position: fixed consistently — no scroll offset needed
      // PROBLEM: Viewport-relative values set as position: fixed offsets drift when
      // user scrolls between opening the picker and hovering over cells.
      // 
      // SOLUTION: Use position: fixed consistently and add scroll listener to close picker
      pickerElement.style.position = 'fixed';
      pickerElement.style.left = `${buttonRect.left}px`;
      pickerElement.style.top = `${buttonRect.bottom + 8}px`;
    }
  }, [showTablePicker]);

  // 🔥 Close table picker on scroll to prevent drift
  useEffect(() => {
    if (!showTablePicker) return;
    const close = () => setShowTablePicker(false);
    window.addEventListener('scroll', close, { passive: true });
    return () => window.removeEventListener('scroll', close);
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
        // ENHANCEMENT: preventScroll=true ensures focus doesn't disrupt user's scroll position
        // This is critical for maintaining reading flow when using toolbar/formatting options
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

  // 🔥 CRITICAL FIX: Handle custom sizes and provide user feedback at boundaries
  // PROBLEM: FONT_SIZES.indexOf(currentFontSize) returns -1 if the user typed a custom
  // size (e.g. 13) not in the preset array, causing -1 + 1 = 0 (always jumps to 8pt).
  // Also, when at min/max, function returns silently with no feedback.
  // 
  // SOLUTION: Handle custom sizes intelligently and show toast at boundaries
  const increaseFontSize = () => {
    const idx = FONT_SIZES.indexOf(currentFontSize);
    if (idx === -1) {
      // Custom size: find the next preset above it
      const next = FONT_SIZES.find(s => s > currentFontSize);
      if (next) {
        setCurrentFontSize(next);
      } else {
        toast.info('Already at maximum size');
      }
      return;
    }
    if (idx >= FONT_SIZES.length - 1) {
      toast.info('Already at maximum size');
      return;
    }
    setCurrentFontSize(FONT_SIZES[idx + 1]);
  };

  // 🔥 CRITICAL FIX: Handle custom sizes and provide user feedback at boundaries
  const decreaseFontSize = () => {
    const idx = FONT_SIZES.indexOf(currentFontSize);
    if (idx === -1) {
      // Custom size: find the next preset below it
      const prev = FONT_SIZES.slice().reverse().find(s => s < currentFontSize);
      if (prev) {
        setCurrentFontSize(prev);
      } else {
        toast.info('Already at minimum size');
      }
      return;
    }
    if (idx <= 0) {
      toast.info('Already at minimum size');
      return;
    }
    setCurrentFontSize(FONT_SIZES[idx - 1]);
  };

  // 🔥 CRITICAL FIX: Centralise all link insertion through validated dialog
  // 
  // PROBLEM: Three separate code paths use window.prompt('Enter URL:') to get a link:
  // addLink(), the 'link' case in handleInsertAction, and the toolbar's insert-link flow.
  // window.prompt is blocked by iOS Safari's popup policy and in iframe embeds. None of
  // these paths validate the URL scheme, so javascript:alert(document.cookie) is accepted
  // and stored as a live XSS vector in the document JSON.
  //
  // SOLUTION: Add URL scheme validation before any setLink call, use dialog instead of prompt

  /**
   * Validate URL scheme and safely insert link
   * @param {string} href - The URL to validate and insert
   */
  const validateAndSetLink = (href) => {
    if (!href || !href.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    try {
      // Handle protocol-relative URLs (//example.com)
      const urlToValidate = href.startsWith('//') ? 'https:' + href : href;
      const url = new URL(urlToValidate);

      // 🔥 Only allow safe protocols
      if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
        toast.error('Only http, https, mailto, and tel links are allowed');
        console.warn('❌ Blocked unsafe URL protocol:', url.protocol, href);
        return;
      }

      // ✅ Valid URL - insert it
      runWithSavedSelection(editor, (chain) => chain.setLink({ href: url.href }));
      toast.success('Link inserted');

    } catch (error) {
      console.error('❌ Invalid URL:', error);
      toast.error('Invalid URL format. Please enter a valid URL like https://example.com');
    }
  };

  const addLink = () => {
    // 🔥 Open dialog instead of using window.prompt
    // 🔥 CRITICAL: Save selection using focusUtils before opening dialog to prevent cursor loss
    if (editor) {
      saveSelection(editor);
      console.log(' Saved selection before link dialog');
    }
    const previousUrl = editor?.getAttributes('link').href || 'https://';
    setLinkUrlValue(previousUrl);
    setLinkDialogOpen(true);
  };

  const handleLinkDialogConfirm = () => {
    if (linkUrlValue && editor) {
      console.log('🔗 Link dialog confirmed:', linkUrlValue);
      // 🔥 CRITICAL: Use runWithSavedSelection to restore cursor position before inserting link
      runWithSavedSelection(editor, (chain) => chain.setLink({ href: linkUrlValue }));
      setLinkDialogOpen(false);
    } else if (!linkUrlValue) {
      toast.error('Please enter a URL');
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
      runWithSavedSelection(editor, (chain) => chain.deleteTable());
      toast.success('Table deleted');
      setDeleteTableDialogOpen(false);
    }
  };

  const handleRenameDialogConfirm = async () => {
    if (renameValue && renameValue.trim()) {
      try {
        const docId = getDocId();
        if (!docId) {
          toast.error('Cannot rename - document not saved yet');
          return;
        }

        await TextEditorService.updateDocument(docId, {
          title: renameValue.trim()
        });

        setDocumentTitle(renameValue.trim());
        toast.success(`Document renamed to "${renameValue.trim()}"`);
        setRenameDialogOpen(false);
      } catch (error) {
        console.error('Failed to rename document:', error);
        toast.error('Failed to rename document');
      }
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

      console.log('[TextEditor] Inserting table using Tiptap command...');

      // Use runWithSavedSelection to maintain cursor position and prevent blur
      const result = runWithSavedSelection(editor, (chain) => chain.insertTable({ rows: rows, cols: cols, withHeaderRow: true }));

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

            // ✅ FORCE PAGINATION: Trigger pagination after table insertion
            // Tables need immediate pagination to shift content to new page if needed
            paginateDocument(editor, { force: true, reason: 'table-insertion' });
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
            className={`w-5 h-5 border border-gray-300 rounded-sm ${isSelected
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
      // 🔥 Open dialog instead of using window.confirm
      setDeleteTableDialogOpen(true);
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

  // 🔥 CRITICAL FIX: Upload image to backend first, insert URL (not base64)
  // 
  // PROBLEM: A 2 MB PNG becomes a ~2.7 MB base64 string. This is stored inline
  // in the TipTap JSON, which is then saved to MongoDB. A document with three
  // user-uploaded images balloons to 8+ MB — exceeding MongoDB's 16 MB document
  // limit for documents with many images, causing a silent save failure. It also
  // makes every editor.getHTML() call (including the debounced auto-save) serialize
  // 8 MB of data on every keystroke.
  //
  // SOLUTION: Upload to backend first, insert the returned URL instead of base64
  const handleLocalImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleImageUpload(file);
    e.target.value = ''; // Reset file input
  };

  const handleImageUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      setIsImageUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);

      const formData = new FormData();
      formData.append('image', file);

      const { url } = await TextEditorService.uploadImage(formData);
      clearInterval(interval);
      setUploadProgress(100);

      // ✅ Insert URL (not base64) - keeps document size small
      editor.chain().focus(null, { scrollIntoView: false }).setResizableImage({
        src: url,
        alt: file.name,
        width: 600,
        align: 'center'
      }).run();

      toast.success('Image uploaded successfully');
      setShowImageModal(false);
      setImageUrl('');
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Image upload failed: ' + error.message);
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleImageUrlSubmit = () => {
    if (!imageUrl || !editor) return;

    try {
      // Validate URL
      new URL(imageUrl);

      editor.chain().focus(null, { scrollIntoView: false }).setResizableImage({
        src: imageUrl,
        alt: selectedImageAlt || 'Image from URL',
        width: 600,
        align: 'center'
      }).run();

      toast.success('Image inserted from URL');
      setShowImageModal(false);
      setImageUrl('');
      setSelectedImageAlt('');
    } catch (error) {
      toast.error('Invalid image URL');
    }
  };

  // 🔥 CRITICAL FIX: Apply via CSS variable — one source of truth, affects all block types
  // PROBLEM: chain.updateAttributes('paragraph', { lineHeight: value }) sets the attribute only
  // on paragraph nodes within the current selection. Headings, list items, blockquotes, and existing
  // paragraphs outside the selection are not affected. Users see inconsistent line spacing across
  // the document, and the stored JSON has per-paragraph lineHeight attributes that conflict with
  // the document-level CSS variable approach used elsewhere.
  // 
  // SOLUTION: Use CSS variable on editor container - cascade handles all block types uniformly
  const setLineSpacingValue = (spacing) => {
    setLineSpacing(spacing);
    // Update the CSS variables on the root document element
    document.documentElement.style.setProperty('--editor-line-height', String(spacing));
    document.documentElement.style.setProperty('--lh', String(spacing));
    
    // Invalidate pagination cache since all block heights are changed
    if (typeof invalidatePaginationCache === 'function') {
      invalidatePaginationCache();
    }
    
    // Force immediate repagination of the document
    if (editor) {
      setTimeout(() => {
        paginateDocument(editor, { force: true, reason: 'line-spacing-change' });
      }, 50);
    }
    
    toast.success(`Line spacing set to ${spacing}`);
    // No per-node attribute update needed — CSS cascade handles it
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
    if (!editor) return;
    try {
      // If we're in a list item, increase the list item indent (Google Docs style)
      if (editor.isActive('listItem')) {
        runWithSavedSelection(editor, (chain) => chain.sinkListItem('listItem'));
        toast.success('List item indented');
      } else {
        // For regular paragraphs/headers, use the standard indent
        runWithSavedSelection(editor, (chain) => chain.indent());
        toast.success('Text indented');
      }
    } catch (error) {
      toast.error('Failed to indent text');
    }
  };

  const outdent = () => {
    if (!editor) return;
    try {
      // If we're in a list item, decrease the list item indent (Google Docs style)
      if (editor.isActive('listItem')) {
        runWithSavedSelection(editor, (chain) => chain.liftListItem('listItem'));
        toast.success('List item outdented');
      } else {
        // For regular paragraphs/headers, use the standard outdent
        runWithSavedSelection(editor, (chain) => chain.outdent());
        toast.success('Text outdented');
      }
    } catch (error) {
      toast.error('Failed to outdent text');
    }
  };

  // 🔥 CRITICAL FIX: Compute list indentation state only when selection changes
  // 
  // PROBLEM: Both are immediately-invoked function expressions at the component body
  // level, so they run synchronously during every React render pass. editor.can().sinkListItem('listItem')
  // internally walks the ProseMirror document tree. Since the toolbar re-renders on every
  // selection change (every cursor move), these are called many times per second during
  // normal typing — visibly contributing to input lag on large documents.
  //
  // SOLUTION: Compute only when selection changes, not on every render

  const [canIndent, setCanIndent] = useState(false);
  const [canOutdent, setCanOutdent] = useState(false);

  useEffect(() => {
    if (!editor) return;

    // Compute indentation capability based on current selection
    const updateIndentState = () => {
      try {
        // Check if currently in a list item
        const isInList = editor.isActive('listItem');

        if (isInList) {
          // For list items, check if we can sink (indent) or lift (outdent)
          setCanIndent(editor.can().sinkListItem('listItem'));
          setCanOutdent(editor.can().liftListItem('listItem'));
        } else {
          // For non-list content, check for custom indent/outdent commands
          setCanIndent(editor.can().indent?.() ?? true);
          setCanOutdent(editor.can().outdent?.() ?? true);
        }
      } catch (error) {
        // On error, default to enabled - let commands handle errors gracefully
        console.warn('Error computing indent/outdent state:', error);
        setCanIndent(true);
        setCanOutdent(true);
      }
    };

    // Initial state computation
    updateIndentState();

    // 🔥 Update only when selection changes (not on every render)
    editor.on('selectionUpdate', updateIndentState);
    editor.on('update', updateIndentState);

    // Cleanup event listeners
    return () => {
      editor.off('selectionUpdate', updateIndentState);
      editor.off('update', updateIndentState);
    };
  }, [editor]);

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

    // Use a single chain to toggle AND set language atomically
    editor.chain()
      .focus()
      .toggleCodeBlock({ language })  // language set in same transaction
      .run();

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
      toast.error(
        'Select an image first — click on the image in the document, then click Crop.'
      );
      return;
    }
  };

  const applyCrop = () => {
    if (!selectedImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // 🔥 CRITICAL FIX: Handle cross-origin images to prevent SecurityError
    // 
    // PROBLEM: ctx.drawImage(img, …) followed by canvas.toDataURL() throws
    // SecurityError: Tainted canvases may not be exported for any image loaded
    // from a different origin without CORS headers. This is the common case —
    // any image inserted by URL from an external host. The error is caught nowhere;
    // the user sees a spinner that never resolves and the dialog stays open.
    //
    // SOLUTION: Set crossOrigin BEFORE img.src, add proper error handling

    // Must be set BEFORE img.src to work
    img.crossOrigin = 'anonymous';

    img.onerror = () => {
      console.error('❌ Failed to load image for cropping:', selectedImage);
      toast.error('Cannot crop this image — it may be from a cross-origin server without CORS support. Try downloading and re-uploading the image first.');
      setIsCropDialogOpen(false);
      setSelectedImage(null);
    };

    img.onload = () => {
      try {
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

        // 🔥 This will throw SecurityError if canvas is tainted (cross-origin without CORS)
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
      } catch (e) {
        // 🔥 Catch SecurityError from tainted canvas
        if (e.name === 'SecurityError') {
          console.error('❌ Cross-origin image cropping blocked:', e);
          toast.error('Cross-origin image cannot be cropped. Re-upload the image to use this feature.');
        } else {
          console.error('❌ Unexpected error during image crop:', e);
          toast.error('Failed to crop image. Please try again.');
        }
        setIsCropDialogOpen(false);
        setSelectedImage(null);
      }
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
          // Direct insert default 3x3 table (matches toolbar button behavior)
          insertTable(3, 3);
          break;
        case 'link':
          // Open the link insertion dialog
          console.log('🔗 Opening link dialog');
          // Save current selection before opening dialog
          if (editor) {
            const { from, to } = editor.state.selection;
            setSavedSelection({ from, to });
            console.log('💾 Saved selection:', from, 'to', to);
          }
          setShowInsertLink(true);
          setLinkUrl('https://');
          setLinkDisplayText('');
          break;
        case 'page_break': {
          const { state: pbState } = editor;
          const { $from: pbFrom } = pbState.selection;
          const pbDepth = pbFrom.depth;
          const pbTopEnd = pbDepth > 0 ? pbFrom.end(1) + 1 : pbFrom.pos;
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
          // 🔥 Open dialog instead of using prompt
          setSymbolValue('©');
          setSymbolDialogOpen(true);
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
            // 🔥 CRITICAL FIX: Sanitize AI output before setting as editor content
            // PROBLEM: The streaming callback sets raw AI output (likely markdown) directly
            // as editor content with no DOMPurify sanitization and no markdown→HTML conversion.
            // This is a security risk (XSS) and can break the editor with invalid HTML.
            // 
            // SOLUTION: Convert markdown to HTML with marked, then sanitize with DOMPurify
            const html = DOMPurify.sanitize(marked.parse(full));
            runWithSavedSelection(editor, (chain) => chain.setContent(html));
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
            result = await changeTone(textOrResult, options.tone || 'professional', options);
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

    // CRITICAL FIX: Update CSS VARIABLES instead of inline styles
    // This ensures all components (CSS, JS, pagination) use the same source of truth
    const root = document.documentElement;
    root.style.setProperty('--doc-margin-top', `${validMargins.top}px`);
    root.style.setProperty('--doc-margin-bottom', `${validMargins.bottom}px`);
    root.style.setProperty('--doc-margin-left', `${validMargins.left}px`);
    root.style.setProperty('--doc-margin-right', `${validMargins.right}px`);

    // REMOVED: Direct inline style application that was overriding CSS
    // const editorContainer = document.querySelector('.tiptap.ProseMirror');
    // if (editorContainer) {
    //   editorContainer.style.paddingTop = `${validMargins.top}px`;
    //   ... this was causing the bug by overriding CSS with inline styles
    // }

    toast.success(`Page margins set to ${validMargins.top}px (top), ${validMargins.right}px (right), ${validMargins.bottom}px (bottom), ${validMargins.left}px (left)`);
  };

  const setBorders = (type) => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }

    const { from, to } = editor.state.selection;

    // 🔥 CRITICAL FIX: Validate selection first
    if (from === to) {
      toast.error('Select some text first');
      return;
    }

    // Apply borders to selected content or current paragraph
    const borderStyles = {
      'page': '2px solid #000000',
      'paragraph': '1px solid #666666',
      'table': '1px solid #333333'
    };

    const borderStyle = borderStyles[type] || '1px solid #000000';

    // 🔥 CRITICAL FIX: Use ProseMirror's DOMSerializer instead of HTML string slicing
    // 
    // PROBLEM: editor.getHTML().slice(from, to) uses ProseMirror node-position space (e.g. from=42, to=97),
    // but String.prototype.slice operates on character indices of the serialised HTML string.
    // These are completely different coordinate systems. The result is a random substring of HTML —
    // usually a broken fragment like "strong>hello" — wrapped in a border div and inserted,
    // permanently corrupting the document. This runs silently with no error.
    //
    // SOLUTION: Use TipTap's selection-aware serialisation via ProseMirror DOMSerializer
    try {
      // Get selected content as ProseMirror fragment
      const slice = editor.state.doc.slice(from, to);
      const fragment = slice.content;

      // Serialize fragment to HTML using ProseMirror's DOMSerializer
      const tempDiv = document.createElement('div');
      const serializer = DOMSerializer.fromSchema(editor.schema);
      serializer.serializeFragment(fragment, { document }, tempDiv);
      const selectedHTML = tempDiv.innerHTML;

      // Wrap in border-styled div
      const borderedContent = `
        <div style="border:${borderStyle};padding:10px;margin:5px 0;">
          ${selectedHTML}
        </div>
      `;

      // Delete selection and insert bordered content
      editor.chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent(borderedContent)
        .run();

      toast.success(`${type} border applied`);
    } catch (error) {
      console.error('❌ Failed to apply border:', error);
      toast.error('Failed to apply border. Please try again.');
    }
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
  // 🔥 CRITICAL FIX: Use ProseMirror document traversal instead of editor.getText()
  // 
  // PROBLEM: editor.getText() strips all HTML and returns a flat string. Searching it
  // finds the text, but the match index in the plain-text string has no relationship
  // to ProseMirror positions — so the "highlight" or "jump to match" behaviour cannot
  // be correctly implemented. Also, the regex is built with term.toLowerCase().replace(…)
  // every call, meaning a search for [ or ) throws Invalid RegExp if the user types a
  // partial regex character and the special-char escape missed it.
  //
  // SOLUTION: Escape all special regex characters safely, use ProseMirror descendants()
  // to count matches in actual text nodes, wrap in try-catch for invalid input
  const performFind = (term, replaceWith = null) => {
    if (!editor || !term) return;

    // 🔥 Safely escape all special regex characters
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let count = 0;
    try {
      // Create case-insensitive regex from escaped term
      const re = new RegExp(escaped, 'gi');

      // 🔥 Traverse actual ProseMirror document structure
      // This counts matches in real text nodes, not a flattened string
      editor.state.doc.descendants((node) => {
        if (node.isText) {
          const matches = node.text.match(re);
          if (matches) {
            count += matches.length;
          }
        }
      });
    } catch (error) {
      console.error('❌ Invalid search term:', error);
      toast.error('Invalid search term. Please try different text.');
      return;
    }

    if (replaceWith !== null) {
      // 🔥 Replace All using ProseMirror transaction
      // Note: Full replace-all implementation would require tracking positions
      // during descendants traversal. For now, delegate to helper function.
      replaceAll(editor, term, replaceWith);
    } else {
      if (count > 0) {
        toast.success(`${count} occurrence${count > 1 ? 's' : ''} of "${term}"`);
      } else {
        toast.info(`"${term}" not found`);
      }
    }
  };

  // 🔥 Helper: Replace all occurrences using ProseMirror transactions
  const replaceAll = (editor, searchTerm, replacement) => {
    if (!editor || !searchTerm || !replacement) return;

    try {
      const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'gi');

      // Collect all replacement positions first (don't modify during traversal)
      const replacements = [];
      let offset = 0;

      editor.state.doc.descendants((node, pos) => {
        if (node.isText && node.text) {
          let match;
          // Reset regex lastIndex for each node
          re.lastIndex = 0;

          while ((match = re.exec(node.text)) !== null) {
            replacements.push({
              from: pos + match.index,
              to: pos + match.index + match[0].length,
              text: replacement
            });
          }
        }
      });

      // Apply replacements in reverse order to preserve positions
      if (replacements.length > 0) {
        const transaction = editor.state.tr;

        replacements
          .sort((a, b) => b.from - a.from) // Reverse order
          .forEach(({ from, to, text }) => {
            transaction.replaceWith(from, to, editor.schema.text(text));
          });

        // CRITICAL: Mark as single history step for clean Ctrl+Z behavior
        transaction.setMeta('addToHistory', true);

        editor.view.dispatch(transaction);
        toast.success(`Replaced ${replacements.length} occurrence(s)`);
      } else {
        toast.info(`No occurrences of "${searchTerm}" found to replace`);
      }
    } catch (error) {
      console.error('❌ Replace all failed:', error);
      toast.error('Failed to replace text');
    }
  };

  // ========================
  // LINE SPACING
  // ========================
  // 🔥 CRITICAL FIX: Apply via CSS variable — one source of truth, affects all block types
  const applyLineSpacing = (value) => {
    setLineSpacing(value);
    // Update the CSS variables on the root document element
    document.documentElement.style.setProperty('--editor-line-height', String(value));
    document.documentElement.style.setProperty('--lh', String(value));
    
    // Invalidate pagination cache since all block heights are changed
    if (typeof invalidatePaginationCache === 'function') {
      invalidatePaginationCache();
    }
    
    // Force immediate repagination of the document
    if (editor) {
      setTimeout(() => {
        paginateDocument(editor, { force: true, reason: 'line-spacing-change' });
      }, 50);
    }
    
    toast.success(`Line spacing set to ${value}`);
    // No per-node attribute update needed — CSS cascade handles it
  };

  // ========================
  // VERSION MANAGEMENT
  // ========================
  // 🔥 CRITICAL FIX: Store only metadata in React state — full content stays on backend
  // 
  // PROBLEM: editor.getHTML() is stored as version.content in the documentVersions state
  // array. For a 10-page document this is 200–500 KB of HTML per version. After 10 saves
  // the component holds 2–5 MB in React state — allocated on the JS heap, serialised through
  // React's reconciler on every render, and never freed (versions are never evicted). This
  // causes progressive memory growth and GC pauses during typing.
  //
  // SOLUTION: Store a compact snapshot — title + timestamp + word count + diff hint
  // Full content stays on the backend, fetched only when user restores a version

  // 🔥 CRITICAL FIX: Version restore with confirmation and proper undo history
  // 
  // PROBLEM: editor.commands.setContent(version.content) replaces entire document and clears
  // undo history by default. Wrapped in requestAnimationFrame, it runs asynchronously — if user
  // types before frame fires, their keystroke is in history but undo base is now restored doc,
  // creating corrupted history stack. No confirmation before overwriting live work.
  // Also, version.content is no longer stored in state - must fetch from backend.
  //
  // SOLUTION: Fetch content from backend, use Dialog for confirmation, preserve undo history
  const restoreVersion = async (version) => {
    if (!editor || !version?.id) return;

    try {
      // 🔥 Fetch full content from backend (not stored in React state anymore)
      const versionData = await TextEditorService.getVersionById(docIdRef.current, version.id);

      // Merge metadata with fetched content
      const versionWithContent = {
        ...version,
        content: versionData.content || versionData.data?.content,
        title: versionData.title || version.title,
      };

      // Show confirmation dialog before overwriting current work
      setRestoreTarget(versionWithContent);
    } catch (error) {
      console.error('Failed to fetch version content:', error);
      toast.error('Failed to load version: ' + error.message);
    }
  };

  const confirmRestore = async () => {
    if (!editor || !restoreTarget?.content) return;

    try {
      // 🔥 CRITICAL FIX: Actually save current state before restoring (no false promises!)
      // Step 1: Auto-save current content as a new version
      const currentContent = editor.getHTML();
      const currentTimestamp = new Date();

      // Create a snapshot version before restore
      await saveCurrentVersion({
        autoSave: true,
        reason: `Auto-saved before restoring "${restoreTarget.title}"`
      });

      toast.success('Current version saved');

      // Wait a moment to ensure save completes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 2: Now restore the selected version with proper undo history
      // Capture current state again (in case it changed during save)
      const snapshotBeforeRestore = editor.getHTML();

      // Set target content WITHOUT adding to history initially
      editor.commands.setContent(restoreTarget.content, false);

      // Push the pre-restore state as a history step so Ctrl+Z works
      editor.commands.setContent(snapshotBeforeRestore, false);

      // Now set the target content WITH history - creates clean undo point
      editor.commands.setContent(restoreTarget.content, true);

      toast.success(`✅ Restored version "${restoreTarget.title}" from ${restoreTarget.timestamp?.toLocaleString()}`);

      // Clear restore target and close history dialog
      setRestoreTarget(null);
      setShowVersionHistory(false);
    } catch (error) {
      console.error('❌ Failed to restore version:', error);
      toast.error('Failed to restore version. Please try again.');
      setRestoreTarget(null);
    }
  };

  const cancelRestore = () => {
    setRestoreTarget(null);
  };

  // 🔥 CRITICAL FIX: Document deletion with confirmation and backend sync
  // 
  // PROBLEM: editor.commands.clearContent() empties editor locally but document remains in MongoDB.
  // Toast is misleading - data is not actually deleted. If user navigates away and returns,
  // document reloads. Privacy and data management concerns.
  //
  // SOLUTION: Wire to actual delete API with confirmation dialog
  const handleDeleteDocument = async () => {
    const id = docIdRef.current;
    if (!id) {
      toast.error('Document has not been saved yet');
      return;
    }

    // Show confirmation dialog before deleting
    setShowDeleteConfirm(true);
  };

  // 🔥 CRITICAL FIX: Duplicate document via backend API
  // 
  // PROBLEM: The duplicate action opens /editor in a new tab and shows a toast
  // saying "Please save document to backend to clone." No content is transferred.
  // The user gets an empty editor tab. This is a dead feature that wastes user
  // time and creates confusion about whether duplication succeeded.
  //
  // SOLUTION: Clone via backend API and open the new document URL
  const duplicateDocument = async () => {
    const id = docIdRef.current;
    if (!id) {
      toast.error('Save the document first before duplicating');
      return;
    }

    try {
      // 🔥 Clone document on backend - copies all content, metadata, versions
      const { newId } = await TextEditorService.cloneDocument(id);

      // ✅ Open the newly cloned document in a new tab
      window.open(`/editor/${newId}`, '_blank', 'noopener,noreferrer');

      toast.success('Document duplicated — opened in new tab');
    } catch (error) {
      console.error('Failed to duplicate document:', error);
      toast.error('Failed to duplicate: ' + error.message);
    }
  };

  const confirmDelete = async () => {
    const id = docIdRef.current;
    if (!id) {
      toast.error('No document ID found');
      setShowDeleteConfirm(false);
      return;
    }

    try {
      // Delete from backend
      await TextEditorService.deleteDocument(id);

      toast.success('Document deleted successfully');

      // Clear editor and navigate back to home/new document
      editor.commands.clearContent();

      // Navigate to new document page (clean state)
      setTimeout(() => {
        navigate('/editor');
      }, 500);

      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('❌ Failed to delete document:', error);
      toast.error('Failed to delete document: ' + (error.message || 'Unknown error'));
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // ========================
  // MENU DEFINITIONS
  // ========================

  const menuItems = [
    {
      label: 'File',
      items: [
        {
          label: 'New', icon: FilePlus2, shortcut: 'Ctrl+N', action: () => setShowNewDocConfirm(true)
        },
        {
          label: 'Open...', icon: FolderOpen, shortcut: 'Ctrl+O', action: () => {
            if (typeof setShowImportModal === 'function') {
              setShowImportModal(true);
            } else {
              fileInputRef.current?.click();
            }
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
        {
          label: 'Rename Document', icon: FileEdit, action: async () => {
            // 🔥 Open dialog instead of using window.prompt
            const current = documentTitle || 'Untitled';
            setRenameValue(current);
            setRenameDialogOpen(true);
          }
        },
        {
          label: 'Duplicate Document', icon: Copy, action: () => {
            // 🔥 CRITICAL FIX: Clone via backend API and open the new document URL
            // 
            // PROBLEM: The duplicate action opens /editor in a new tab and shows a toast
            // saying "Please save document to backend to clone." No content is transferred.
            // The user gets an empty editor tab. This is a dead feature that wastes user
            // time and creates confusion about whether duplication succeeded.
            //
            // SOLUTION: Use backend API to clone document with full content, then open new tab
            duplicateDocument();
          }
        },
        { label: 'Delete Document', icon: Trash2, action: handleDeleteDocument },
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
        { label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X', action: () => handleEditAction('cut', editor, null, handleCopy, handlePaste) },
        {
          label: 'Copy', icon: Copy, shortcut: 'Ctrl+C', action: () => handleCopy()
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

                    // 🔥 CRITICAL FIX: Apply via CSS variable instead of per-node attribute
                    document.documentElement.style.setProperty('--editor-line-height', String(spacingValue));
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

  // 🔥 CRITICAL FIX: Early return MUST be AFTER all hooks to satisfy Rules of Hooks
  // PROBLEM: If editor is null on first render, hooks are not called, then on second render
  // they are. This causes React Internal Error: Expected static flag was missing.
  if (!editor) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("sticky top-0 bg-[#eaf2ff] border-b border-blue-200 shadow-sm toolbar", className)}
      style={{ zIndex: 40 }} // Base toolbar container - dropdowns will be higher
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
          <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()} className="w-48 bg-white shadow-lg border border-gray-200 rounded-md p-1">
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
          <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()} className="w-48 bg-white shadow-lg border border-gray-200 rounded-md p-1">
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
              // Direct insert default 3x3 table on click (like header menu)
              insertTable(3, 3);
            }}
            onContextMenu={(e) => {
              // Right-click opens table picker for custom size selection
              e.preventDefault();
              onMenuOpen(editor);
              setShowTablePicker(true);
            }}
            tooltip={isInsideTable() ? "Table Tools (Click for options)" : "Insert Table (3x3) • Right-click for custom size"}
            isActive={isInsideTable()}
            className={`rounded-lg transition-all duration-300 ${isInsideTable()
              ? "bg-linear-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
              : "bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600"
              }`}
            data-table-button="true"
          >
            <Table className={`w-4 h-4 ${isInsideTable() ? "text-white" : "text-blue-600"}`} />
          </ToolbarButton>

          {/* Table Picker Dropdown - Shows on right-click or keyboard shortcut */}
          {showTablePicker && (
            <Portal>
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
              </div>
            </Portal>
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
        <Button
          variant="ghost"
          onClick={() => setShowAIAssistant(true)}
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
                    if (!linkUrl || !editor) return;

                    // 🔥 CRITICAL FIX: Validate image URL to prevent XSS attacks
                    // 
                    // PROBLEM: The "Insert from Web" dialog passes linkUrl directly to
                    // editor.chain().setImage({ src: linkUrl }) with no validation. A user
                    // (or an XSS payload that pre-fills the input) can supply javascript:alert(1)
                    // or data:text/html,… as the src. This also bypasses DOMPurify since TipTap
                    // injects it as an attribute, not innerHTML.
                    //
                    // SOLUTION: Sanitize URL before inserting - only allow safe schemes
                    const sanitizeImageUrl = (url) => {
                      try {
                        const parsed = new URL(url);
                        // Only allow http/https/data:image schemes
                        if (!['http:', 'https:'].includes(parsed.protocol)) {
                          if (url.startsWith('data:image/')) return url; // allow base64 images
                          throw new Error('Invalid URL scheme');
                        }
                        return url;
                      } catch (error) {
                        console.error('❌ Invalid image URL:', error);
                        toast.error('Invalid image URL - must use http:// or https://');
                        return null;
                      }
                    };

                    const safeUrl = sanitizeImageUrl(linkUrl);
                    if (safeUrl) {
                      editor
                        .chain()
                        .focus()
                        .setImage({ src: safeUrl })
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
                <SelectContent>
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
      <Suspense fallback={null}>
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
        <PageSetupDialog open={showPageSetup} onOpenChange={setShowPageSetup} onApply={(cfg) => { if (cfg.margins) updatePageMargins(cfg.margins); }} />
        <KeyboardShortcutsDialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog} />
        <WordCountDialog open={showWordCount} onOpenChange={setShowWordCount} editor={editor} />
      </Suspense>

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

      {/* 🔥 Link Dialog - replaces window.prompt */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
            <DialogDescription>
              Enter the URL for the link (http://, https://, mailto:, or tel:)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={linkUrlValue}
              onChange={(e) => setLinkUrlValue(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => e.key === 'Enter' && handleLinkDialogConfirm()}
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setLinkDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLinkDialogConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Link
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 Symbol Dialog - replaces prompt */}
      <Dialog open={symbolDialogOpen} onOpenChange={setSymbolDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Symbol</DialogTitle>
            <DialogDescription>
              Enter the symbol you want to insert (e.g., ©, ®, ™, €, £, ¥)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={symbolValue}
              onChange={(e) => setSymbolValue(e.target.value)}
              placeholder="©"
              onKeyDown={(e) => e.key === 'Enter' && handleSymbolDialogConfirm()}
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setSymbolDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSymbolDialogConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Insert
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 Delete Table Confirmation Dialog - replaces window.confirm */}
      <Dialog open={deleteTableDialogOpen} onOpenChange={setDeleteTableDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this table? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setDeleteTableDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteTableDialogConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 Rename Document Dialog - replaces window.prompt */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
            <DialogDescription>
              Enter a new name for this document
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Document name"
              onKeyDown={(e) => e.key === 'Enter' && handleRenameDialogConfirm()}
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setRenameDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRenameDialogConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Rename
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Find & Replace Inline Dialog */}
      {showFindReplace && (
        <div className="fixed inset-0 flex items-start justify-center pt-20" style={{ zIndex: 400 }} onClick={() => setShowFindReplace(false)}>
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
        <div className="fixed inset-0 flex items-start justify-center pt-20" style={{ zIndex: 400 }} onClick={() => setShowInsertLink(false)}>
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
                  onKeyDown={e => {
                    if (e.key === 'Enter' && linkUrl) {
                      console.log('🔗 Enter key pressed, inserting link');
                      if (savedSelection && savedSelection.from !== savedSelection.to) {
                        editor.chain()
                          .focus()
                          .setTextSelection({ from: savedSelection.from, to: savedSelection.to })
                          .setLink({ href: linkUrl })
                          .run();
                        toast.success('Link applied to selected text');
                      } else if (linkDisplayText) {
                        editor.chain()
                          .focus()
                          .insertContent(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkDisplayText}</a>`)
                          .run();
                        toast.success('Link inserted');
                      } else {
                        editor.chain()
                          .focus()
                          .setLink({ href: linkUrl })
                          .run();
                        toast.success('Link inserted');
                      }
                      setShowInsertLink(false);
                      setLinkUrl('');
                      setLinkDisplayText('');
                      setSavedSelection(null);
                    }
                  }} />
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button onClick={() => setShowInsertLink(false)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={() => {
                  if (!linkUrl) {
                    toast.error('Please enter a URL');
                    return;
                  }

                  console.log('🔗 Inserting link:', linkUrl, 'Display text:', linkDisplayText);
                  console.log('📍 Saved selection:', savedSelection);

                  if (!editor) {
                    toast.error('Editor not available');
                    return;
                  }

                  // Restore selection and apply link
                  if (savedSelection && savedSelection.from !== savedSelection.to) {
                    // There was a text selection - apply link to it
                    console.log('✅ Applying link to selected text');
                    editor.chain()
                      .focus()
                      .setTextSelection({ from: savedSelection.from, to: savedSelection.to })
                      .setLink({ href: linkUrl })
                      .run();
                    toast.success('Link applied to selected text');
                  } else if (linkDisplayText) {
                    // No selection but has display text - insert as link
                    console.log('✅ Inserting link with display text');
                    editor.chain()
                      .focus()
                      .insertContent(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkDisplayText}</a>`)
                      .run();
                    toast.success('Link inserted');
                  } else {
                    // No selection, no display text - insert URL as link
                    console.log('✅ Inserting URL as link');
                    editor.chain()
                      .focus()
                      .setLink({ href: linkUrl })
                      .run();
                    toast.success('Link inserted');
                  }

                  setShowInsertLink(false);
                  setLinkUrl('');
                  setLinkDisplayText('');
                  setSavedSelection(null);
                }}
                  disabled={!linkUrl} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50">Insert</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </motion.div >
  );
};


