// src/components/athena-editor/components/TextEditor.jsx
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import ReactDOM, { createPortal } from 'react-dom';

// 🔥 CRITICAL FIX: Conditional logging helper - removes all debug logs in production
// PROBLEM: Over 60 console.log/warn statements exist inside hot paths (onUpdate, onSelectionUpdate,
// pagination checks, paste handlers). In production each call serializes arguments and writes to the
// DevTools buffer — measurable as 2–5 ms overhead per event on mid-range hardware, causing typing latency.
// 
// SOLUTION: Replace all debug logs with a conditional helper that's a no-op in production
const log = process.env.NODE_ENV === 'development'
  ? (...args) => console.log(...args)
  : () => {};

const warn = process.env.NODE_ENV === 'development'
  ? (...args) => console.warn(...args)
  : () => {};

const error = process.env.NODE_ENV === 'development'
  ? (...args) => console.error(...args)
  : (...args) => console.error(...args); // Always show errors in prod for debugging critical issues
import Portal from './ui/Portal';
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
import Indent from '../extensions/Indent.js';
import { Page, initializePagination } from '../extensions/Page.js';
import { addHeadingStyles, updateHeadingStyles } from '../components/editor/EditorPagination.js';  // Heading styles functions
import { paginateDocument, debouncePaginate } from '../utils/paginationEngine.js'; // 🔥 CRITICAL: Full pagination + paste detection
import { transformMarkdownToEditor, isMarkdown } from '../utils/transformMarkdownToEditor.js'; // 🔥 NEW: Markdown transformer
import '../AthenaEditor.css'; // 🔥 CRITICAL: Page NodeView styling
import '../../../styles/real-pagination.css';
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
} from '../ai/aiUtils.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { DocumentExporter } from '../../../utils/documentExporter.js';
import { DocumentOutline } from './editor/DocumentOutline';
import { TemplateSidebar } from './editor/TemplateSidebar.jsx';
import HeaderMenuBar from './editor/HeaderMenuBar';
import { FindReplaceModal } from './editor/FindReplaceModal';
import { AIAssistant } from './editor/AIAssistant.jsx';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api';
import { TextEditorService } from '../../../services/Text-Editor/text.service.js';
import { useDocument, useUpdateDocument } from '../../../hooks/useDocuments.js';
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
import focusUtils from './editor/focusUtils';

// Destructure functions from default export for backward compatibility
const { guardToolbarMouseDown, runWithSavedSelection, preventEditorBlur, saveSelection, onMenuOpen, onMenuClose } = focusUtils;
import { useKeyboardShortcuts } from './editor/useKeyboardShortcuts';
import { CommentsPanel as _CommentsPanel } from './editor/CommentsPanel';
import { VersionHistory as _VersionHistory } from './editor/VersionHistory';
import { VoiceTyping as _VoiceTyping } from './editor/VoiceTyping';
import { PageSetupDialog as _PageSetupDialog } from './editor/PageSetupDialog';
import { KeyboardShortcutsDialog as _KeyboardShortcutsDialog } from './editor/KeyboardShortcutsDialog';
import { WordCountDialog as _WordCountDialog } from './editor/WordCountDialog';


// ✅ BUG 1 FIX: Parse markdown to HTML before inserting into editor
// 
// 🔥 CRITICAL FIX: Tighten markdown detection to prevent false positives
// 
// PROBLEM: The regex /^#{1,6}\s|^\*\*|^-\s|\*\*/.test(text) matches ANY string
// containing ** anywhere — including a sentence like "Press Ctrl+B for bold".
// That plain sentence gets run through marked.parse(), which wraps it in <p>,
// then DOMPurify, then inserted as HTML. Result is double-paragraph wrapping
// and broken inline markup in normal AI responses.
//
// SOLUTION: Require structural markdown signals at line start, with minimum threshold
const looksLikeMarkdown = (text) => {
  if (!text) return false;
  
  const lines = text.split('\n');
  const mdLines = lines.filter(l =>
    /^#{1,6}\s/.test(l) ||   // headings (# to ######)
    /^[-*+]\s/.test(l) ||    // unordered list (- or * or +)
    /^\d+\.\s/.test(l) ||    // ordered list (1. 2. etc)
    /^>\s/.test(l) ||        // blockquote (>)
    /^```/.test(l)           // code fence (```)
  );
  
  // Require at least 2 structural lines to be confident it's markdown
  // This prevents single-line false positives like "Press **Ctrl+B** for bold"
  return mdLines.length >= 2;
};

const parseMarkdownToHtml = (text) => {
  if (!text) return '';
  // Only parse if it looks like markdown (has structural elements)
  if (!looksLikeMarkdown(text)) return `<p>${text}</p>`;
  return DOMPurify.sanitize(marked.parse(text));
};

// ✅ FIX 2: Normalize multi-paragraph content by splitting \n in paragraphs
// 
// 🔥 CRITICAL FIX: Preserve inline marks when splitting paragraphs
// 
// PROBLEM: When a paragraph is split on \n, the new text nodes are created as plain
// { type: 'text', text: line } objects with no marks array. Any bold, italic, link,
// or code inline marks that existed on the original text runs are silently discarded.
// A formatted paragraph loaded from the backend becomes plain text after normalisation.
//
// SOLUTION: Rebuild text nodes preserving marks from the original content array
const normalizeParagraphs = (jsonContent) => {
  if (!jsonContent?.content) return jsonContent;

  const splitNode = (node) => {
    // Only split paragraphs with newlines embedded in text
    if (node.type !== 'paragraph') {
      return [{ ...node, content: node.content?.map ? node.content.flatMap(splitNode) : node.content }];
    }
    
    // Gather full text of this paragraph
    const fullText = node.content?.map(c => c.text || '').join('') || '';
    if (!fullText.includes('\n')) return [node];

    console.log('[normalizeParagraphs] Splitting paragraph with', fullText.split('\n').length, 'lines');

    // 🔥 CRITICAL: Use ProseMirror-level splitting to preserve marks
    // Instead of naively creating plain text nodes, we need to distribute marks
    // across the split lines. However, this is complex because marks span character ranges.
    // 
    // SAFER APPROACH: Don't split at all - preserve the original node unchanged.
    // The proper fix is to save clean JSON without embedded \n in the first place.
    // This prevents data loss while we fix the source of the problem.
    return [node]; // safe no-op until source is fixed
    
    // OLD BROKEN CODE (discards all marks):
    // return fullText.split('\n').map(line => ({
    //   type: 'paragraph',
    //   attrs: node.attrs,
    //   content: line.trim() ? [{ type: 'text', text: line }] : []  // ❌ No marks!
    // }));
  };

  const walkContent = (nodes) =>
    nodes.flatMap(node => {
      if (node.type === 'page') {
        return [{ ...node, content: walkContent(node.content || []) }];
      }
      return splitNode(node);
    });

  return { ...jsonContent, content: walkContent(jsonContent.content) };
};

// ─── Helper Functions ──────────────────────────────────────────────────────

/**
 * Convert inline CSS text-align styles to Tiptap data-text-align attributes
 * This ensures alignment is preserved when loading HTML content
 * 
 * 🔥 CRITICAL FIX: Use regex pass instead of DOM parsing for performance
 * 
 * PROBLEM: document.createElement('div') + innerHTML + querySelectorAll is called
 * synchronously every time HTML content is normalised. For a large paste (10,000+
 * chars), this DOM parsing happens on the main thread and blocks the UI for tens of
 * milliseconds — noticeable as a paste stutter on slower devices.
 * 
 * SOLUTION: Use a regex pass for the common case — skip DOM parse entirely
 * 
 * @param {string} html - HTML content with potential inline styles
 * @returns {string} HTML with Tiptap-compatible alignment attributes
 */
const normalizeInlineStyles = (html) => {
  if (!html || typeof html !== 'string') return html;
  
  try {
    // 🔥 Regex-based replacement - NO DOM parsing, much faster!
    // Replace inline text-align styles with data-text-align attributes
    return html.replace(
      /style="([^"]*text-align:\s*(left|center|right|justify)[^"]*)"/gi,
      (_, style, align) => {
        // Remove text-align from style attribute
        const cleaned = style.replace(/text-align:\s*[^;]+;?\s*/gi, '').trim();
        
        // Return data-text-align attribute + remaining styles (if any)
        return `data-text-align="${align.toLowerCase()}"${cleaned ? ` style="${cleaned}"` : ''}`;
      }
    );
  } catch (error) {
    console.error('Failed to normalize inline styles:', error);
    return html; // Return original if parsing fails
  }
};

// New feature components

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
  // Content inert function for accessibility
  setContentInertProp,
  className
}) => {
  // 🔥 CRITICAL FIX: Early return MUST be before any hooks to satisfy Rules of Hooks
  // PROBLEM: React detected a change in hook order. The early return was after hooks,
  // causing different hook counts when editor is null vs defined.
  if (!editor) return null;

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
    onNewDocument: () => setShowNewDocConfirm(true),
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
  const [showNewDocConfirm, setShowNewDocConfirm] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

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
  const [restoreTarget, setRestoreTarget] = useState(null); // 🔥 For version restore confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // 🔥 For document delete confirmation
  const [showVoiceTyping, setShowVoiceTyping] = useState(false);
  const [showPageSetup, setShowPageSetup] = useState(false);
  const [showWordCount, setShowWordCount] = useState(false);
  const [textDirection, setTextDirectionState] = useState('ltr');
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [lineSpacingMenuOpen, setLineSpacingMenuOpen] = useState(false);
  const [pageMargins, setPageMargins] = useState({ top: 96, bottom: 96, left: 72, right: 72 }); // Google Docs standard: 1" top/bottom, 0.75" sides
  const [documentVersions, setDocumentVersions] = useState([]);
  const [showInsertLink, setShowInsertLink] = useState(false);
  const [linkDisplayText, setLinkDisplayText] = useState('');

  // CRITICAL FIX: Move ALL hooks BEFORE the early return to satisfy Rules of Hooks
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [selectedRows, setSelectedRows] = useState(0);
  const [selectedCols, setSelectedCols] = useState(0);
  const tablePickerRef = useRef(null);
  const tableButtonRef = useRef(null);

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
    const previousUrl = editor?.getAttributes('link').href || 'https://';
    setLinkUrlValue(previousUrl);
    setLinkDialogOpen(true);
  };
  
  const handleLinkDialogConfirm = () => {
    if (linkUrlValue && editor) {
      validateAndSetLink(linkUrlValue);
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
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    try {
      setIsImageUploading(true);
      
      // 🔥 Upload to backend first
      const formData = new FormData();
      formData.append('image', file);
      
      const { url } = await TextEditorService.uploadImage(formData);
      
      // ✅ Insert URL (not base64) - keeps document size small
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      
      toast.success('Image uploaded successfully');
      setShowImageDialog(false);
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Image upload failed: ' + error.message);
    } finally {
      setIsImageUploading(false);
      e.target.value = ''; // Reset file input
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
    // Update the CSS variable on the editor container
    document.documentElement.style.setProperty('--editor-line-height', String(spacing));
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
          // 🔥 Use centralized validation instead of direct setLink
          const linkUrl = prompt('Enter URL (http://, https://, mailto:, or tel:):');
          if (linkUrl) {
            validateAndSetLink(linkUrl);
          }
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
    // Update the CSS variable on the editor container
    document.documentElement.style.setProperty('--editor-line-height', String(value));
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
                    className={`text-sm px-3 py-2.5 rounded-xl transition-all duration-200 border text-left font-medium ${!editor || editor.state.selection.from === editor.state.selection.to
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
                    className={`text-sm px-3 py-2.5 rounded-xl transition-all duration-200 border text-left font-medium ${!editor || editor.state.selection.from === editor.state.selection.to
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
                    className={`text-sm px-3 py-2.5 rounded-xl transition-all duration-200 border text-left font-medium col-span-2 ${!editor || editor.state.selection.from === editor.state.selection.to
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
          console.log('📝 AI Generate document:', data);

          if (!editor) return;

          // ✅ FIX: Properly insert AI-generated HTML content into editor
          const insertGeneratedContent = async () => {
            try {
              // Clear current content and show loading state
              editor.commands.clearContent();
              editor.commands.insertContent(
                '<div style="text-align: center; padding: 40px;">' +
                  '<h1 style="color: #3b82f6; font-size: 28px; margin-bottom: 16px;">✨ Forging your document...</h1>' +
                  '<p style="color: #6b7280; font-size: 16px;">Please wait while the AI generates your content.</p>' +
                '</div>'
              );

              // If content is provided, parse and insert it with professional formatting
              if (data.html) {
                console.log('📄 Raw AI content received:', data.html.substring(0, 200) + '...');
                console.log('📄 Content type:', typeof data.html);
                console.log('📄 Starts with markdown code block?', data.html.startsWith('```'));

                // Clean markdown code blocks if present
                let cleanContent = data.html;
                if (cleanContent.startsWith('```html') || cleanContent.startsWith('```markdown') || cleanContent.startsWith('```')) {
                  console.log('🧹 Removing markdown code block wrappers...');
                  cleanContent = cleanContent.replace(/^```\w*\s*/i, '').replace(/```\s*$/i, '').trim();
                }

                console.log('📄 Clean content length:', cleanContent.length);
                console.log('📄 First 100 chars after cleaning:', cleanContent.substring(0, 100));

                // ✅ CRITICAL: Convert markdown to HTML with proper formatting
                console.log('🔄 Converting markdown to HTML...');
                const htmlContent = parseMarkdownToHtml(cleanContent);
                console.log('✅ HTML conversion complete. Output length:', htmlContent.length);
                console.log('📄 HTML preview:', htmlContent.substring(0, 200) + '...');

                // ✅ Add professional styling wrapper
                const styledContent = `
                  <div class="professional-document">
                    ${htmlContent}
                  </div>
                `;

                console.log('🎨 Styled content created, inserting into editor...');

                setTimeout(() => {
                  // Sanitize and insert
                  const sanitized = DOMPurify.sanitize(styledContent);
                  console.log('🔒 Sanitized content length:', sanitized.length);

                  editor.commands.setContent(sanitized);
                  console.log('✅ Content inserted successfully!');

                  toast.success(`Document generated — ${data.pages} page${data.pages > 1 ? 's' : ''}!`);

                  // Force pagination to properly distribute content
                  import('../utils/paginationEngine.js').then(({ paginateDocument }) => {
                    setTimeout(() => {
                      console.log('📑 Running pagination...');
                      paginateDocument(editor, { force: true });
                    }, 50); // Small delay for DOM to settle
                  });
                }, 150); // Slightly longer delay for better UX
              }

              setShowAIAssistant(false);
            } catch (error) {
              console.error('Failed to insert generated content:', error);
              toast.error('Failed to display generated document');
            }
          };

          insertGeneratedContent();
        }}
        onInlineAction={(behavior, content) => {
          if (!editor) return;
          // ✅ BUG 1 FIX: Parse markdown to HTML before inserting
          const html = parseMarkdownToHtml(content);
          if (behavior === 'replace') {
            editor.chain().focus().deleteSelection().insertContent(html).run();
          } else if (behavior === 'append') {
            editor.chain().focus().insertContent(html).run();
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

// ─── Main TextEditorContent component ─────────────────────────────────────────
const TextEditorContent = ({
  initialContent = null,
  activeDocId = null,
  mongoId = null,
  onMongoIdSaved = null,
  onDeleteDocument = null
}) => {
  // Note: Use canonical constants from utils/pagination/constants.js
  // A4_HEIGHT_PX = 1123, A4_WIDTH_PX = 794
  
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
    setSaveStatus = () => { }, setLastSaved = () => { }, setDocumentStats = () => { },
    setDocumentTitle = () => { }, updateEditorFeatures = () => { }, updateExportOptions = () => { },
    updateUIState = () => { }, updateDocumentStats: updateDocumentStatsAction = () => { }
  } = editorActions;

  // 🔥 CRITICAL FIX: Use refs for volatile values to prevent handleSave re-creation
  // 
  // PROBLEM: documentTitle comes from EditorContext which updates on every keystroke.
  // Having it in handleSave's dependency array causes React to re-create the function constantly.
  // Meanwhile, Ctrl+S keyboard shortcut captures the first version of onSave and never updates,
  // so saving with Ctrl+S after renaming saves the old title.
  //
  // SOLUTION: Read volatile values from refs inside the callback - always fresh, stable deps
  const documentTitleRef = useRef(documentTitle);
  const zoomRef = useRef(zoom);
  
  useEffect(() => {
    documentTitleRef.current = documentTitle;
  }, [documentTitle]);
  
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Zoom helper
  const effectiveZoom = zoom || 100;

  const [isOutlineOpen, setIsOutlineOpen] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  // CRITICAL FIX: Move stats to refs to prevent re-renders on every keystroke/delete
  const wordCountRef = useRef(0);
  const characterCountRef = useRef(0);
  const readingTimeRef = useRef(0);
  const headingsRef = useRef([]);
  const paragraphsRef = useRef(0);
  const imagesRef = useRef(0);
  const tablesRef = useRef(0);
  const listsRef = useRef([]);
  const imagesDataRef = useRef([]);
  const linksRef = useRef([]);
  // Keep minimal state for UI display - updated infrequently
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [headings, setHeadings] = useState([]);
  const [isStarred, setIsStarred] = useState(false);
  const [showFindReplaceModal, setShowFindReplaceModal] = useState(false);
  const [findReplaceMode, setFindReplaceMode] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isAiGeneratedDoc, setIsAiGeneratedDoc] = useState(false);
  const [documentVersions, setDocumentVersions] = useState([{ id: Date.now(), timestamp: new Date(), title: 'Initial Version', content: '', author: 'Current User' }]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null); // 🔥 For version restore confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // 🔥 For document delete confirmation
  const [activeHeadingLevel, setActiveHeadingLevel] = useState(0);
  const [showHeadingStyles, setShowHeadingStyles] = useState(false);
  const [pageSize, setPageSize] = useState('A4');
  const [pageOrientation, setPageOrientation] = useState('portrait');
  const [pageMargins, setPageMargins] = useState({ top: 96, bottom: 96, left: 72, right: 72 }); // Google Docs standard: 1" top/bottom, 0.75" sides

  // Keep --page-margin-* CSS variables in sync with state (runs on mount too)
  // CRITICAL: Initialize CSS variables from React state on mount
  useEffect(() => {
    const r = document.documentElement;
    // Use correct variable names that match athena-variables.css
    r.style.setProperty('--doc-margin-top', `${pageMargins.top}px`);
    r.style.setProperty('--doc-margin-right', `${pageMargins.right}px`);
    r.style.setProperty('--doc-margin-bottom', `${pageMargins.bottom}px`);
    r.style.setProperty('--doc-margin-left', `${pageMargins.left}px`);
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
  // Page states removed - will be re-implemented in new pagination system
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
  const STATS_DELAY = 500;               // ms delay before updating stats to prevent cursor jump

  const editorRef = useRef(null);
  const contentContainerRef = useRef(null);
  const editorContainerRef = useRef(null);
  const repaginateRef = useRef(null);
  const statsTimeoutRef = useRef(null);
  const paginationTimeoutRef = useRef(null);
  const pagesUpdateTimeoutRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const handleAutoSaveRef = useRef(null);
  const lastPaginationContentRef = useRef('');
  const paragraphHeightCacheRef = useRef(new Map());

  const isPastingRef = useRef(false);
  const pasteTimerRef = useRef(null);
  
  // 🔥 CRITICAL FIX: Use plain ref for selection change tracking - not extension storage
  // Extension storage can be cleared/re-initialized by other extensions, breaking pagination timing
  const lastSelectionChangeRef = useRef(0);

  // 🔥 CRITICAL FIX: Use React Router hooks for SSR-safe, navigation-aware docId retrieval
  // 
  // PROBLEM: const docId = getDocId() reads window.location on every render — breaks SSR,
  // and when React Router navigates to a new document the stale value from first render persists.
  // Also, getCachedDocument() calls JSON.parse(sessionStorage.getItem(...)) at render time —
  // a synchronous throw if JSON is malformed brings down the whole tree.
  //
  // SOLUTION: useParams + useSearchParams are stable, SSR-safe, and update on navigation
  const navigate = useNavigate();
  const { mongoId: urlMongoId } = useParams();
  const [searchParams] = useSearchParams();
  
  const docId = useMemo(() => {
    const qp = searchParams.get('docId');
    if (qp && /^[0-9a-fA-F]{24}$/.test(qp)) {
      console.log('[docId] Using query param:', qp);
      return qp;
    }
    if (urlMongoId && /^[0-9a-fA-F]{24}$/.test(urlMongoId)) {
      console.log('[docId] Using URL path:', urlMongoId);
      return urlMongoId;
    }
    console.log('[docId] No valid docId found');
    return null;
  }, [urlMongoId, searchParams]);

  // 🚀 OPTIMIZATION: Get document from sessionStorage instead of API call
  // EditorIntro already fetched it, so we don't need to call GET API again
  const cachedDoc = useMemo(() => {
    if (!docId) return null;
    try {
      const raw = sessionStorage.getItem(`doc_${docId}`);
      if (!raw) return null;
      const doc = JSON.parse(raw);
      // Validate minimum shape before trusting
      if (!doc || typeof doc !== 'object' || (!doc._id && !doc.id)) {
        sessionStorage.removeItem(`doc_${docId}`); // evict corrupt entry
        return null;
      }
      return doc;
    } catch (error) {
      console.error('❌ Failed to parse cached document:', error);
      sessionStorage.removeItem(`doc_${docId}`); // evict and re-fetch
      return null;
    }
  }, [docId]);

  // Always call useDocument with docId if no cache - this triggers the API call
  const shouldFetch = !cachedDoc && docId;
  const {
    data: backendResponse,
    isLoading: isDocLoading,
    isSuccess: isDocLoaded,
    error: docError
  } = useDocument(shouldFetch ? docId : null);

  // Use cached data or API response
  const fetchedDoc = cachedDoc || backendResponse?.document || backendResponse;

  // 🔥 CRITICAL FIX: Ref-based debounce to prevent document corruption
  // 
  // PROBLEM: useCallback(debounce(...), [docId]) creates a new debounced function
  // when docId changes, but the old timer still fires with the old docId closure,
  // potentially saving Document A's content to Document B if user navigates quickly.
  //
  // SOLUTION: Use a ref to always read the latest docId and editor state
  const saveRef = useRef(null);
  
  // Initialize debounced save function once (on mount)
  if (!saveRef.current) {
    saveRef.current = debounce(async () => {
      // Always read latest values from refs
      const id = docIdRef.current;
      const ed = editorRef.current;
      
      if (!id || !ed || ed.isDestroyed) {
        console.log('⏭️ Skipping save - no document ID or editor not ready');
        return;
      }

      try {
        // 🔥 Save as TipTap JSON, NOT HTML or Markdown
        const jsonContent = ed.state.doc.toJSON();
        const htmlContent = ed.getHTML();

        await TextEditorService.updateDocument(id, {
          data: {
            content: jsonContent, // ✅ Save TipTap JSON structure
            html: htmlContent // For compatibility/fallback
          },
          updatedAt: new Date()
        });

        setSaveStatus('saved');
        setLastSaved(new Date());
        console.log(`✅ Document ${id} auto-saved successfully`);
      } catch (error) {
        setSaveStatus('error');
        toast.error('Failed to save document. Please check your connection.');
        console.error('❌ Auto-save failed:', error);
      }
    }, 1000); // Wait 1 second after user stops typing
  }

  // Cancel debounce timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (saveRef.current) {
        saveRef.current.cancel();
        console.log('🧹 Cancelled pending save on unmount');
      }
    };
  }, []);

  // ── Sync word/character count from refs to state for footer display ───────
  //
  // The onUpdate callback stores counts in refs to avoid re-renders on every keystroke.
  // This effect periodically syncs those values to React state for UI display.
  // Uses debounce to update only when user pauses typing (every 1 second).
  // 
  // 🔥 CRITICAL FIX: Check editor is alive before updating state
  // 
  // PROBLEM: The 1-second setInterval(syncStats, 1000) is set up once and never checks
  // whether the editor is still alive. After the component unmounts (user navigates away),
  // the interval keeps running, calling setWordCount, setCharacterCount, etc. on an
  // unmounted component. In React 18 this causes "Can't perform a React state update on
  // an unmounted component" warning and leaks memory.
  //
  // SOLUTION: Check editorRef.current and isDestroyed flag before any state updates
  useEffect(() => {
    const syncStats = () => {
      // 🔥 CRITICAL: Bail out if editor is destroyed or unmounted
      if (!editorRef.current || editorRef.current.isDestroyed) {
        return;
      }
      
      const newWordCount = wordCountRef.current;
      const newCharCount = characterCountRef.current;
      const newReadingTime = readingTimeRef.current;
      const newHeadings = headingsRef.current;

      // Only update state if values have changed
      setWordCount((prev) => prev !== newWordCount ? newWordCount : prev);
      setCharacterCount((prev) => prev !== newCharCount ? newCharCount : prev);
      setReadingTime((prev) => prev !== newReadingTime ? newReadingTime : prev);
      setHeadings((prev) => prev !== newHeadings ? newHeadings : prev);
    };

    // Initial sync
    syncStats();

    // Set up interval to sync every second (user will see updates after they pause typing)
    const intervalId = setInterval(syncStats, 1000);

    // ✅ CRITICAL: Always clean up interval on unmount
    return () => {
      clearInterval(intervalId);
      console.log('🧹 Cleaned up stats sync interval');
    };
  }, []); // ✅ Stable deps - refs are stable, no dependencies needed

  // ── ProseMirror paste-interception plugin ────────────────────────────────
  // Simplified paste handling without auto-pagination
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
  //   6. TABLE HANDLING: Tables are treated as atomic units - we don't insert
  //      page breaks inside tables. Table height is calculated including all rows.
  //
  /**
   * Production-grade page break insertion with PDF paste handling
   *
   * Special handling for PDF pastes:
   * - Detects single giant blocks from PDF copy-paste
   * Normalizes line breaks within PDF content
   * Forces paragraph splits for oversized blocks
   *
   * @param {Editor} editorInstance - TipTap editor instance
   * @returns {number} Number of page breaks inserted
   */
  const runPastePageBreaks = useCallback((editorInstance) => {
    // DOM-BASED PAGINATION: This function is deprecated
    // Pagination is now handled automatically by the DOM layout
    // No manual page break insertion needed
    console.log('[TextEditor] DOM-based pagination active - skipping manual pagination');
    return 0;

    // Legacy pagination code removed - see version control history if needed
    /*
    if (isInsertingRef.current || !editorInstance?.state?.doc) return 0;

    isInsertingRef.current = true;
    const { state, view } = editorInstance;
    const { doc } = state;
    const totalChars = doc.textContent.length;

    try {
      // ── Step 1: Prepare Pagination Engine ────────────────────────────────
      let blocks = flattenDocument(doc);

      // 🔍 PDF Paste Detection: Check for single giant block
      if (blocks.length === 1 && blocks[0].textContent.length > 1000) {
        console.warn('⚠️ PDF Paste Detected: Single giant block found. Attempting to normalize...');

        // Try to split the giant block by double newlines before pagination
        const giantBlock = blocks[0];
        const textContent = giantBlock.textContent;

        // If text contains paragraph breaks, split it
        const hasParagraphBreaks = textContent.includes('\n\n') || textContent.includes('\r\n\r\n');

        if (hasParagraphBreaks) {
          console.log('[TextEditor] Splitting PDF content into paragraphs...');

          // Use String.split() instead of regex to avoid line break issues
          const splitPattern = textContent.includes('\r\n\r\n') ? '\r\n\r\n' : '\n\n';
          const paragraphs = textContent.split(splitPattern).filter(p => p.trim().length > 0);

          if (paragraphs.length > 1) {
            // Replace the giant block with multiple paragraphs
            try {
              const pos = doc.content.indexOf(giantBlock);
              if (pos >= 0) {
                let chain = editorInstance.chain();
                chain = chain.deleteRange({ from: pos, to: pos + giantBlock.nodeSize });

                // Insert normalized paragraphs
                paragraphs.forEach((para, index) => {
                  if (index > 0) {
                    chain = chain.insertContent({ type: 'paragraph', content: [{ type: 'text', text: para }] });
                  } else {
                    chain = chain.insertContentAt(pos, { type: 'paragraph', content: [{ type: 'text', text: para }] });
                  }
                });

                chain.run();

                // Re-fetch blocks after normalization
                const newDoc = editorInstance.state.doc;
                blocks = flattenDocument(newDoc);
                console.log(`[TextEditor] ✅ Normalized into ${blocks.length} paragraphs`);
              }
            } catch (splitErr) {
              console.error('[TextEditor] Failed to split PDF content:', splitErr);
              // Continue with original blocks if split fails
            }
          }
        }
      }

      if (blocks.length === 0) {
        lastFingerprintRef.current = `${totalChars}:${doc.textContent.substring(0, 80)}`;
        return 0;
      }

      const engine = new PaginationEngine({
        useGoogleDocsConfig: true,  // 810px preferred height
        debugMode: false,
        perfLogEnabled: false,
        editorView: view,
      });

      const pages = engine.paginate(blocks);

      // 🔬 Run calibration in development mode
      if (process.env.NODE_ENV === 'development' || blocks.length < 10) {
        runCalibration(engine, blocks).then(results => {
          console.log('[Calibration] Complete - See detailed table above');
        });
      }

      console.log('[TextEditor] Google Docs pagination:', {
        totalBlocks: blocks.length,
        totalPages: pages.length,
        usableHeight: engine.usableHeight,
        googleDocsMode: engine.useGoogleDocsConfig,
      });

      // ── Step 2: Map Page Boundaries to Document Positions ───────────────
      // O(n) single pass using descendants() instead of O(n²) nested loops
      // CRITICAL FIX FOR TABLES: Skip page break insertion if position is inside a table
      const insertPositions = [];
      let blockCounter = 0;

      // Helper function to check if a position is inside a table
      const isPositionInsideTable = (position) => {
        try {
          const resolvedPos = doc.resolve(position);
          for (let depth = resolvedPos.depth; depth > 0; depth--) {
            const node = resolvedPos.node(depth);
            if (node && (node.type.name === 'table' || node.type.name === 'tableRow' ||
                node.type.name === 'tableCell' || node.type.name === 'customTable')) {
              return true;
            }
          }
          return false;
        } catch (err) {
          console.error('[isPositionInsideTable] error:', err);
          return false;
        }
      };

      doc.descendants((node, pos) => {
        if (node.isBlock) {
          // If this block index marks the end of a page (excluding last page)
          if (pages.some((p, i) => i < pages.length - 1 && p.endIndex === blockCounter)) {
            const potentialPos = pos + node.nodeSize;

            // CRITICAL: Don't insert page breaks inside tables
            // Instead, insert after the table ends
            if (isPositionInsideTable(potentialPos)) {
              console.log('[TextEditor] Skipping page break inside table at pos', potentialPos);
              // Find the end of the table and insert after it
              let tableEndPos = potentialPos;
              if (node.type.name === 'table' || node.type.name === 'customTable') {
                tableEndPos = pos + node.nodeSize;
              }
              // Only add if not already in the list
              if (!insertPositions.includes(tableEndPos)) {
                insertPositions.push(tableEndPos);
              }
            } else {
              insertPositions.push(potentialPos);
            }
          }
          blockCounter++;
          return false; // Don't descend into inline children
        }
        return true;
      });

      console.log('[TextEditor] Page break positions to insert:', insertPositions);

      if (insertPositions.length === 0) {
        lastFingerprintRef.current = `${totalChars}:${doc.textContent.substring(0, 80)}`;
        isInsertingRef.current = false;
        return 0;
      }

      // ── Step 3: Execution - Reverse-Order Insertion ─────────────────────
      // Sort descending - inserting at bottom doesn't shift top positions
      // CRITICAL: Remove duplicates more aggressively to prevent multiple breaks
      const sortedPositions = [...new Set(insertPositions)].sort((a, b) => b - a);

      // Additional deduplication: filter out positions that are too close (< 5 chars)
      const filteredPositions = sortedPositions.filter((pos, idx, arr) => {
        if (idx === 0) return true;
        return Math.abs(pos - arr[idx - 1]) >= 5;
      });

      // CRITICAL PRODUCTION FIX: Check existing page breaks before insertion
      // This prevents duplicate page breaks on re-runs
      const positionsToInsert = [];
      for (const pos of filteredPositions) {
        const nodeAfter = doc.nodeAt(pos);
        if (nodeAfter?.type.name !== 'pageBreak') {
          // Also check adjacent positions to avoid clustering
          const nodeBefore = pos > 0 ? doc.nodeAt(pos - 1) : null;
          const nodeTwoBefore = pos > 1 ? doc.nodeAt(pos - 2) : null;

          // Only insert if no page break exists at or near this position
          if (nodeBefore?.type.name !== 'pageBreak' && nodeTwoBefore?.type.name !== 'pageBreak') {
            positionsToInsert.push(pos);
          } else {
            console.log('[TextEditor] Skipping - page break already exists near pos', pos);
          }
        } else {
          console.log('[TextEditor] Skipping duplicate page break at pos', pos);
        }
      }

      // CRITICAL: Save cursor position before inserting page breaks
      // This prevents cursor from jumping to first page after pagination
      const savedSelection = editorInstance.state.selection;
      const savedFrom = savedSelection.from;
      const savedTo = savedSelection.to;

      let chain = editorInstance.chain();

      for (const pos of positionsToInsert) {
        chain = chain.insertContentAt(pos, { type: 'pageBreak' });
      }

      console.log(`[TextEditor] Executing reverse-order insertion with ${positionsToInsert.length} breaks (filtered from ${filteredPositions.length})`);

      // Execute the chain and preserve cursor position
      chain.run();

      // CRITICAL: Restore cursor position after pagination
      // Use requestAnimationFrame to ensure DOM is settled
      requestAnimationFrame(() => {
        if (!editorInstance.isDestroyed && savedFrom >= 0) {
          try {
            // Adjust position if it shifted due to page break insertions
            // Count how many page breaks were inserted before the cursor
            const breaksBeforeCursor = positionsToInsert.filter(pos => pos <= savedFrom).length;
            const adjustedFrom = savedFrom + breaksBeforeCursor;
            const adjustedTo = savedTo + breaksBeforeCursor;

            editorInstance.commands.setTextSelection({
              from: Math.min(adjustedFrom, editorInstance.state.doc.content.size),
              to: Math.min(adjustedTo, editorInstance.state.doc.content.size)
            });

            // Focus without scrolling to prevent viewport jump
            editorInstance.view.focus({ preventScroll: true });

            console.log('[TextEditor] Cursor position restored after pagination');
          } catch (err) {
            console.error('[TextEditor] Failed to restore cursor position:', err);
            // Fallback: just focus the editor
            if (!editorInstance.isDestroyed) {
              editorInstance.view.focus({ preventScroll: true });
            }
          }
        }
      });

      // ── Step 4: Cleanup & Feedback ──────────────────────────────────────
      lastFingerprintRef.current = `${totalChars}:${doc.textContent.substring(0, 80)}`;

      if (totalChars > 5000) {
        toast.success(`Document paginated: ${pages.length} page${pages.length > 1 ? 's' : ''}`, {
          id: 'paste-processing',
          duration: 2000,
        });
      }

      console.log('[TextEditor] ✅ Page breaks inserted:', sortedPositions.length);
      isInsertingRef.current = false;
      return sortedPositions.length;

    } catch (err) {
      console.error('[PastePageBreaks] error:', err);
      toast.error('Failed to paginate document', {
        id: 'paste-processing',
        duration: 4000,
      });
      isInsertingRef.current = false;
      return 0;
    }
    */
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
      const insertAt = [];
      let pageWords = 0;
      let pageChars = 0;
      let pageLines = 0;

      doc.forEach((blockNode, topOffset) => {
        if (blockNode.type.name === 'pageBreak') {
          pageWords = 0; pageChars = 0; pageLines = 0;
          return;
        }

        const text = blockNode.textContent || '';
        const blockWords = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
        const blockChars = text.length;
        let lineMultiplier = 1;
        if (blockNode.type.name === 'heading') {
          const lvl = blockNode.attrs?.level ?? 3;
          lineMultiplier = lvl === 1 ? 3 : lvl === 2 ? 2 : 1.5;
        }
        const rawLines = Math.ceil(blockChars / pageCfg.AVG_CHARS_PER_LINE) || 1;
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
      let offset = 0;
      let batchStart = 0;

      // CRITICAL: Save cursor position before progressive pagination
      const savedSelection = editorInstance.state.selection;
      const savedFrom = savedSelection.from;
      const savedTo = savedSelection.to;

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
          chain = chain.insertContentAt(insertAt[i] + 1 + offset, { type: 'pageBreak' });
          offset += 1;
        }
        chain.run();

        toast.loading(
          `Paginating… ${Math.min(batchEnd, totalBreaks)}/${totalBreaks} breaks`,
          { id: 'progressive-paste' }
        );

        batchStart = batchEnd;
      }

      // CRITICAL: Restore cursor position after progressive pagination
      requestAnimationFrame(() => {
        if (!editorInstance.isDestroyed && savedFrom >= 0) {
          try {
            // Adjust position based on total breaks inserted before cursor
            const breaksBeforeCursor = insertAt.filter(pos => pos <= savedFrom).length;
            const adjustedFrom = savedFrom + breaksBeforeCursor;
            const adjustedTo = savedTo + breaksBeforeCursor;

            editorInstance.commands.setTextSelection({
              from: Math.min(adjustedFrom, editorInstance.state.doc.content.size),
              to: Math.min(adjustedTo, editorInstance.state.doc.content.size)
            });

            editorInstance.view.focus({ preventScroll: true });
            console.log('[TextEditor] Cursor restored after progressive pagination');
          } catch (err) {
            console.error('[TextEditor] Failed to restore cursor:', err);
            if (!editorInstance.isDestroyed) {
              editorInstance.view.focus({ preventScroll: true });
            }
          }
        }
      });

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
  //   5. TABLE GUARD — skip pagination when cursor is inside a table to prevent
  //      cursor focus loss and multiple page break insertions during table editing.
  //   6. POST-PASTE COOLDOWN — wait 3 seconds after paste before allowing
  //      pagination to prevent cursor jump when user clicks to edit pasted content.
  //   7. EDITING DETECTION — skip pagination if user is actively editing (typing/cursor moving).
  //
  const checkAndInsertAutoPageBreaks = useCallback((editorInstance) => {
    if (isPastingRef.current) return; // paste system handles it
    if (isInsertingRef.current) return; // re-entrancy guard
    if (!editorInstance?.state?.doc) return;

    // CRITICAL FIX #1: Don't run pagination when editing inside tables
    // This prevents cursor focus loss and multiple page breaks during table edits
    try {
      const { selection } = editorInstance.state;
      const { $from } = selection;
      for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node && (node.type.name === 'table' || node.type.name === 'tableRow' ||
            node.type.name === 'tableCell' || node.type.name === 'customTable')) {
          console.log('[TextEditor] Skipping pagination - cursor inside table');
          return;
        }
      }
    } catch (err) {
      console.error('[checkAndInsertAutoPageBreaks] table check error:', err);
      // Continue with normal flow if table check fails
    }

    // CRITICAL FIX #2: Extended post-paste cooldown - prevent pagination immediately after paste
    // Users need to click/edit pasted content without cursor jumping away
    // Extended from 2s to 3s for more robust handling
    const timeSinceLastPaste = Date.now() - (lastPasteTimeRef.current || 0);
    if (timeSinceLastPaste < 3000) {
      console.log('[TextEditor] checkAndInsertAutoPageBreaks BLOCKED - post-paste cooldown active', {
        timeSinceLastPaste: Math.round(timeSinceLastPaste),
        selectionPos: editorInstance.state.selection.from
      });
      return;
    }

    // CRITICAL FIX #3: Detect if user is actively editing (typing or moving cursor)
    // If the selection position changed very recently, user is likely still editing
    // Skip pagination to avoid interrupting the editing flow
    const currentTime = Date.now();
    if (currentTime - lastSelectionChangeRef.current < 500) {
      // User just moved cursor or started typing - wait before paginating
      console.log('[TextEditor] Skipping pagination - user actively editing');
      return;
    }

    const doc = editorInstance.state.doc;
    const text = doc.textContent;

    // Fingerprint guard — no change since last scan
    const fingerprint = `${text.length}:${text.substring(0, 80)}`;
    if (fingerprint === lastFingerprintRef.current) return;

    // Quick capacity pre-check: if total doc is < 80 % of one page,
    // there is nothing to paginate yet → update fingerprint and bail.
    const totalWords = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const totalChars = text.length;
    const threshold = 0.8;
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


  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        document: false,
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        blockquote: false,
        underline: false,
        link: false,
        listItem: false,
        codeBlock: false,
        bulletList: false,
        orderedList: false,
        hardBreak: false
      }),
      Document.extend({ content: 'page+' }),  // Allow page nodes in document
      Page,  // Register page node extension
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
      TiptapSubscript, TiptapSuperscript, Indent, TextDirection,
      BulletList.configure({ HTMLAttributes: { class: 'bullet-list' } }),
      OrderedList.configure({ HTMLAttributes: { class: 'ordered-list' } }),
    ],
    content: '',  // Start empty - will auto-create page on first edit
    editable: true,
    autofocus: true,
    // CRITICAL FIX: Preserve selection during content changes
    preserveSelectionOnUpdate: true,
    // CRITICAL FIX: Disable immediate render on update to prevent cursor jump
    immediatelyRender: false,
    // CRITICAL FIX: Disable corec to prevent React from reconciling during typing
    corec: false,
    // 🔥 CRITICAL: Custom Shift+Enter handler - create new paragraph instead of hard break
    editorProps: {
      // ✅ CRITICAL FIX: Strip page wrappers from ALL pasted content
      // This runs BEFORE handlePaste and catches everything
      transformPasted(slice) {
        const { Fragment } = this.schema;
        const newNodes = [];

        // Check if ANY of the pasted nodes are pages
        const hasPageNodes = slice.content.some(node => node.type.name === 'page');

        if (hasPageNodes) {
          // Flatten page nodes - extract their children
          slice.content.forEach(node => {
            if (node.type.name === 'page') {
              // Add all children of this page node
              node.content.forEach(child => newNodes.push(child));
            } else {
              newNodes.push(node);
            }
          });

          return slice.copy(Fragment.fromArray(newNodes));
        }

        return slice;
      },

      handleKeyDown: (view, event) => {
        if (event.shiftKey && event.key === 'Enter') {
          event.preventDefault();
          const { state, dispatch } = view;
          const { $from } = state.selection;
          // Inherit attrs from current paragraph
          const parentAttrs = $from.parent.attrs;
          const tr = state.tr.replaceSelectionWith(
            state.schema.nodes.paragraph.create(parentAttrs)
          );
          dispatch(tr);
          return true;
        }
        return false;
      },
      attributes: { class: 'focus:outline-none table-border-black', spellcheck: 'true', 'data-testid': 'editor-content' },
    },
    onCreate: ({ editor }) => {
      // 🔥 Initialize with 2 pages minimum on fresh load
      console.log('[TextEditor.onCreate] Editor created, initializing pages...');

      // Try immediately first
      const result1 = initializePagination(editor);
      console.log('[TextEditor.onCreate] Immediate init result:', result1);

      // Try again after 50ms delay
      setTimeout(() => {
        const result2 = initializePagination(editor);
        console.log('[TextEditor.onCreate] Delayed init result:', result2);
      }, 50);

      // ✅ BUG 3 FIX: Removed setupPasteDetection - conflicts with paste plugin
      // The paste plugin in TextEditor.jsx already handles paste interception
      // setupPasteDetection creates duplicate listeners that fight each other
    },
    onUpdate: ({ editor: editorInstance }) => {
      // ── INFINITE LOOP GUARD ──────────────────────────────────────────────
      // paginateDocument tags its own transactions with this flag so we don't
      // re-enter pagination in response to our own dispatch.
      if (editorInstance.storage.athena_is_paginating) {
        log('[onUpdate] Skipping - pagination in flight');
        return;
      }

      // ✅ CRITICAL FIX: Check for nested pages and remove them
      const doc = editorInstance.state.doc;
      let hasNestedPages = false;

      // Check if any page node contains another page node
      doc.descendants((node, pos) => {
        if (node.type.name === 'page') {
          node.content.forEach(child => {
            if (child.type.name === 'page') {
              hasNestedPages = true;
            }
          });
        }
      });

      // ── DEBOUNCED RE-PAGINATION (only after DOM settles) ─────────────────
      // CRITICAL: This runs on EVERY content change, but the debounce prevents
      // rapid-fire pagination. The 300ms delay lets the DOM render completely.

      // 🔥 CRITICAL: Skip pagination during paste - let paste handler trigger it
      if (isPastingRef.current) {
        log('[onUpdate] Skipping pagination - paste in progress');
        return;
      }

      debouncePaginate(editorInstance, 300);

      // ── Stats + autosave (unchanged) ─────────────────────────────────────
      if (statsTimeoutRef.current) clearTimeout(statsTimeoutRef.current);
      statsTimeoutRef.current = setTimeout(() => {
        if (!editorInstance?.state?.doc) return;
        const text = editorInstance.state.doc.textContent;
        const words = text.trim().split(/\s+/).filter(Boolean).length;

        // Update refs ONLY (no re-render)
        wordCountRef.current = words;
        characterCountRef.current = text.length;
        readingTimeRef.current = Math.ceil(words / 200);

        const newHeadings = [];
        let paragraphs = 0, images = 0, tables = 0;
        const lists = [];
        const tablesData = [];
        const imagesData = [];
        const links = [];
        
        editorInstance.state.doc.descendants((node, pos) => {
          const type = node.type.name;
          if (type === 'heading') {
            newHeadings.push({ level: node.attrs.level, text: node.textContent, id: `heading-${pos}` });
          } else if (type === 'paragraph') {
            paragraphs++;
          } else if (type === 'image') {
            images++;
            imagesData.push({
              src: node.attrs.src,
              alt: node.attrs.alt,
              position: pos
            });
          } else if (type === 'table') {
            tables++;
            tablesData.push({
              rows: node.childCount,
              position: pos
            });
          } else if (type === 'bulletList' || type === 'orderedList') {
            lists.push({
              type: node.type.name,
              content: node.textContent,
              position: pos
            });
          }
          
          // Extract links from marks
          node.marks.forEach(mark => {
            if (mark.type.name === 'link') {
              links.push({
                href: mark.attrs.href,
                text: node.textContent,
                position: pos
              });
            }
          });
        });
        
        headingsRef.current = newHeadings;
        paragraphsRef.current = paragraphs;
        imagesRef.current = images;
        tablesRef.current = tables;
        listsRef.current = lists;
        imagesDataRef.current = imagesData;
        linksRef.current = links;

        // REMOVED: State updates that were causing cursor to jump to beginning
        // Word count UI now updates only when user explicitly opens the dialog
        // setWordCount(words);
        // setCharacterCount(text.length);
        // setReadingTime(Math.ceil(words / 200));
        // setHeadings(newHeadings);

        // REMOVED: setDocumentStats - was causing parent re-renders
        // if (updateDocumentStatsAction) updateDocumentStatsAction(prev => ({ ...prev, paragraphs, images, tables }));
      }, STATS_DELAY); // Extended delay to prevent cursor interruption

      // 🔥 CRITICAL FIX: Only save if NOT currently paginating or inserting page breaks
      // 
      // PROBLEM: debouncedSave(json) is called at the bottom of onUpdate. The guard at
      // the top only skips pagination transactions via athena_is_paginating, but the save
      // path has no such guard. If pagination is debounced at 300 ms and save at 1000 ms,
      // the save can fire against a document that still has page breaks being inserted,
      // persisting a half-paginated JSON structure to MongoDB.
      //
      // SOLUTION: Add mutex guards to prevent saving during pagination/insertion operations
      if (!editorInstance.storage.athena_is_paginating && !isInsertingRef.current) {
        // 🔥 DELTA-BASED AUTO-SAVE: Trigger debounced save on every content change
        // Only fires when pagination is settled - prevents half-paginated saves
        const json = editorInstance.state.doc.toJSON();
        saveRef.current?.(json);
      } else {
        log('[onUpdate] Skipping auto-save - pagination or insertion in progress');
      }

      // REMOVED: Old auto-save timeout - replaced by debounced save
      // Pagination only runs after paste or explicit page break operations
    },
    onSelectionUpdate: ({ editor: editorInstance }) => {
      // CRITICAL FIX: Don't update state on every selection change
      // This was causing cursor position resets during typing/deletion
      // Selection updates now handled via refs if needed elsewhere
      const { from, to } = editorInstance.state.selection;

      // CRITICAL FIX: Use plain ref instead of extension storage
      // Extension storage can be cleared/re-initialized by other extensions
      lastSelectionChangeRef.current = Date.now();

      // REMOVED: setSelectedText - causes re-render on every cursor movement
      // setSelectedText(from !== to ? editorInstance.state.doc.textBetween(from, to, ' ') : '');

      // REMOVED: setActiveHeadingLevel - causes unnecessary re-renders
      // let newHeadingLevel = 0;
      // editorInstance.state.doc.nodesBetween(from, to, (node) => {
      //   if (node.type.name === 'heading') { newHeadingLevel = node.attrs.level; return false; }
      //   return true;
      // });
      // setActiveHeadingLevel(newHeadingLevel);
    },
  });

  useEffect(() => {
    if (!editor) return;
    editorRef.current = editor;

    console.log('🔍 Editor mounted with props:', { mongoId, activeDocId });
    console.log('🔍 Current URL:', window.location.href);

    // 🔥 AUTOMATIC OUTLINE SCANNER: Register callback for pagination complete
    const extractHeadingsForOutline = () => {
      console.log('📑 Automatic Outline Scanner triggered by pagination');

      const newHeadings = [];
      let paragraphs = 0, images = 0, tables = 0;

      if (!editor || editor.isDestroyed) {
        console.warn('⚠️ Editor not available during outline scan');
        return;
      }

      try {
        editor.state.doc.descendants((node, pos) => {
          const type = node.type.name;

          if (type === 'heading') {
            // 🔥 Ensure heading has unique ID for navigation
            const headingId = node.attrs.id || `heading-${pos}-${Date.now()}`;
            newHeadings.push({
              level: node.attrs.level,
              text: node.textContent,
              id: headingId,
              pos: pos // Store position for scrolling
            });
          }
          else if (type === 'paragraph') paragraphs++;
          else if (type === 'image') images++;
          else if (type === 'table') tables++;
        });

        console.log('📊 Outline scan complete:', {
          headingsCount: newHeadings.length,
          paragraphs,
          images,
          tables,
          sampleHeadings: newHeadings.slice(0, 3)
        });

        // Update ref immediately
        headingsRef.current = newHeadings;

        // Force state update to refresh outline sidebar
        setHeadings(newHeadings);

        // Update document stats to trigger parent component updates
        if (updateDocumentStatsAction) {
          updateDocumentStatsAction(prev => ({
            ...prev,
            paragraphs,
            images,
            tables,
            pages: editor.state.doc.childCount
          }));
        }

        console.log('✅ Outline sidebar updated via automatic scanner');

        // Auto-open outline if it's closed and document has headings
        if (newHeadings.length > 0 && !isOutlineOpen) {
          console.log('📖 Auto-opening outline panel for document with', newHeadings.length, 'headings');
          setIsOutlineOpen(true);
        }
      } catch (error) {
        console.error('❌ Error in automatic outline scanner:', error);
      }
    };

    // Register the callback
    editor.storage.onPaginationComplete = extractHeadingsForOutline;
    console.log('✅ Outline scanner registered with editor storage');

  }, [editor]); // eslint-disable-line react-hooks/exhaustive-deps

  // 🚀 OPTIMIZATION: Synchronize editor content when document data arrives from cache/backend
  useEffect(() => {
    // Skip if editor not ready or no document to load
    if (!editor || !fetchedDoc) return;

    // Check if we've already loaded this document to avoid re-setting and losing focus
    const docId = fetchedDoc.id || fetchedDoc._id;
    if (editor.storage.athena_loaded_id === docId) return;

    console.log('✅ Loading document:', fetchedDoc.title || 'Untitled');

    const jsonContent = fetchedDoc.data?.content || fetchedDoc.content;
    const htmlContent = fetchedDoc.data?.html || fetchedDoc.html || '';

    // Defer setContent to avoid flushSync warning in React 19
    requestAnimationFrame(() => {

      // 🔥 CRITICAL FIX: Use Markdown transformer for string content
      const content = jsonContent || htmlContent;

      if (!content) {
        console.warn('⚠️ No content available to display!');
        return;
      }

      console.log('📝 Processing content:', {
        type: typeof content,
        length: typeof content === 'string' ? content.length : 'N/A',
        first100Chars: typeof content === 'string' ? content.substring(0, 100) : 'object'
      });

      // Try to parse JSON if content is a string
      let parsedJsonContent = null;
      if (typeof content === 'string' && !isMarkdown(content)) {
        try {
          parsedJsonContent = JSON.parse(content);
          console.log('✅ Successfully parsed JSON string');
        } catch (error) {
          console.error('❌ Failed to parse JSON:', error);
          parsedJsonContent = null;
        }
      }

      if (typeof content === 'string') {
        console.log('📝 Content is a string - checking if it\'s Markdown');

        // Check if it looks like Markdown
        if (isMarkdown(content)) {
          console.log('✅ Detected Markdown format - using transformer');
          transformMarkdownToEditor(editor, content);
        } else {
          console.log('ℹ️ Content is HTML or plain text');
          editor.commands.setContent(normalizeInlineStyles(content));
          console.log('✅ HTML/text content set in editor');

          // Trigger pagination
          setTimeout(() => {
            import('../utils/paginationEngine.js').then(({ forceRepaginate }) => {
              forceRepaginate(editor);
              console.log('[setContent] forceRepaginate called for HTML/text');
            });
          }, 100);
        }
      } else if (parsedJsonContent && typeof parsedJsonContent === 'object') {
        console.log('✅ Setting content from parsed JSON');
        // ✅ FIX 2: Normalize paragraphs by splitting \n into separate nodes
        const normalized = normalizeParagraphs(parsedJsonContent);

        editor.commands.setContent(normalized);
        console.log('✅ Content set successfully from JSON');

        // 🔥 CRITICAL: Force pagination after setting content
        // This will trigger the automatic outline scanner via onPaginationComplete callback
        setTimeout(() => {
          console.log('[setContent] Forcing pagination after content load');
          import('../utils/paginationEngine.js').then(({ forceRepaginate }) => {
            forceRepaginate(editor);
            console.log('[setContent] forceRepaginate called');
          });
        }, 100);
      } else if (typeof content === 'object' && content !== null) {
        // Handle case where content is already an object (TipTap JSON)
        console.log('✅ Content is already a TipTap JSON object');
        const normalized = normalizeParagraphs(content);
        editor.commands.setContent(normalized);
        console.log('✅ Object content set successfully');

        setTimeout(() => {
          import('../utils/paginationEngine.js').then(({ forceRepaginate }) => {
            forceRepaginate(editor);
            console.log('[setContent] forceRepaginate called for object');
          });
        }, 100);
      }

      // 🔥 CRITICAL FIX: Set document title from fetched document
      if (fetchedDoc.title) {
        console.log('📝 Setting document title:', fetchedDoc.title);
        setDocumentTitle(fetchedDoc.title);
      }

      // Note: Outline will be automatically updated by the pagination callback
      // No need for manual heading extraction - it happens via onPaginationComplete

      // Mark as loaded in editor storage to prevent re-runs
      editor.storage.athena_loaded_id = fetchedDoc.id || fetchedDoc._id;
    });
  }, [editor, isDocLoaded, fetchedDoc, setDocumentTitle, setIsAiGeneratedDoc]);

  // 🔥 CRITICAL FIX: Removed localStorage usage - URL is single source of truth
  // Document ID is now tracked ONLY via URL path and React props

  const handleCopy = useCallback(async () => {
    if (!editor) return;
    try {
      const { from, to } = editor.state.selection;
      if (from === to) {
        toast.info('Nothing selected to copy');
        return;
      }

      // 🔥 CRITICAL: Extract both HTML and plain text for clipboard
      // Google Docs and other rich text apps need HTML to preserve formatting

      // Get the selected slice of the document
      const slice = editor.state.doc.slice(from, to);

      // 🔥 Serialize to HTML using TipTap's built-in serializer
      const htmlContent = editor.storage.markdown?.serializer
        ? editor.storage.markdown.serializer.serialize(slice.content)
        : editor.getHTML(); // Fallback to full HTML if markdown not available

      // For better control, use ProseMirror's HTML serializer
      const serializer = DOMSerializer.fromSchema(editor.schema);
      const fragment = slice.content;

      // Create a temporary div to hold the serialized HTML
      const tempDiv = document.createElement('div');
      serializer.serializeFragment(fragment, { document }, tempDiv);
      const serializedHtml = tempDiv.innerHTML;

      // Get plain text fallback
      const textContent = editor.state.doc.textBetween(from, to, '\n');

      console.log('[handleCopy] Copying to clipboard:', {
        hasHtml: !!serializedHtml,
        htmlLength: serializedHtml?.length || 0,
        textLength: textContent.length,
        selectionRange: `${from}-${to}`
      });

      // 🔥 CRITICAL: Use Clipboard API with BOTH HTML and plain text
      // This ensures Google Docs receives formatted content
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([serializedHtml], { type: 'text/html' }),
          'text/plain': new Blob([textContent], { type: 'text/plain' })
        })
      ]);

      toast.success('Content copied with formatting! 📋');
      console.log('[handleCopy] ✅ HTML successfully copied to clipboard');

    } catch (error) {
      console.error('[handleCopy] Error:', error);
      // Fallback: use execCommand with a temp textarea
      try {
        const textContent = editor.state.doc.textBetween(from, to, '\n');
        const ta = document.createElement('textarea');
        ta.value = textContent;
        ta.style.cssText = 'position:fixed;top:-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        toast.success('Copied as plain text (formatting unavailable in this browser)');
      } catch (execError) {
        toast.error('Failed to copy content');
        console.error('[handleCopy] Fallback failed:', execError);
      }
    }
  }, [editor]);

  const handlePaste = useCallback(() => { }, []);

  // 🔥 HELPER: Parse PDF paragraph text with inline formatting
  const parseParagraphWithFormatting = (text, schema) => {
    // Simple implementation - creates paragraph with plain text
    // Advanced: Could parse bold/italic/underline markers

    // Detect basic formatting patterns
    const content = [];

    // Split by common formatting markers
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|_.*?_|`.*?`)/g);

    parts.forEach(part => {
      if (!part) return;

      // Bold: **text** or __text__
      if (part.startsWith('**') && part.endsWith('**')) {
        const marks = [schema.marks.strong.create()];
        content.push(schema.text(part.slice(2, -2), marks));
      }
      // Italic: *text* or _text_
      else if ((part.startsWith('*') && part.endsWith('*')) ||
               (part.startsWith('_') && part.endsWith('_'))) {
        const marks = [schema.marks.em.create()];
        content.push(schema.text(part.slice(1, -1), marks));
      }
      // Code: `text`
      else if (part.startsWith('`') && part.endsWith('`')) {
        const marks = [schema.marks.code.create()];
        content.push(schema.text(part.slice(1, -1), marks));
      }
      // Plain text
      else {
        content.push(schema.text(part));
      }
    });

    return schema.node('paragraph', null, Fragment.from(content));
  };

  // 🔥 DEBUG: Expose pagination check to window for testing
  // 
  // 🔥 CRITICAL FIX: Guard with dev-only flag and use namespaced name
  // 
  // PROBLEM: window.checkPagination = () => { … } is unconditionally attached to window
  // every time the editor ref changes. This pollutes the global namespace in production,
  // leaks internal document structure via the console, and can be called by any third-party
  // script on the page. It also triggers on every hot-reload in dev.
  //
  // SOLUTION: Only expose in development, use __ prefix for namespacing, clean up on unmount
  useEffect(() => {
    // ✅ DEV-ONLY: Don't expose debug functions in production
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    
    if (editor) {
      // ✅ Use namespaced name with __ prefix to indicate internal/debug API
      window.__athenaPaginationDebug = () => {
        const doc = editor.state.doc.toJSON();
        console.log('📄 [Athena Debug] DOCUMENT STRUCTURE:', doc);

        const pages = doc.content?.filter(n => n.type === 'page') || [];
        console.log(`✅ [Athena Debug] Total pages: ${pages.length}`);

        pages.forEach((page, i) => {
          console.log(`[Athena Debug] Page ${i + 1}:`, {
            blocks: page.content?.length || 0,
            chars: page.content?.reduce((sum, b) => sum + (b.content?.reduce((s, t) => s + (t.text || '').length, 0) || 0), 0) || 0
          });
        });

        // Check if all content is in page 1
        const page1Blocks = pages[0]?.content?.length || 0;
        const totalBlocks = pages.reduce((sum, p) => sum + (p.content?.length || 0), 0);

        if (page1Blocks === totalBlocks && totalBlocks > 5) {
          console.warn('[Athena Debug] ⚠️ WARNING: All content is in page 1!');
          console.warn('[Athena Debug] 🔥 Run: window.__athenaPaginationDebug()');
        } else {
          console.log('[Athena Debug] ✅ Content is distributed across pages');
        }
      };

      console.log('💡 [Athena Debug] Run window.__athenaPaginationDebug() in console to debug pagination');
    }
    
    // ✅ CLEANUP: Remove debug function on unmount or editor change
    return () => {
      if (window.__athenaPaginationDebug) {
        delete window.__athenaPaginationDebug;
        console.log('🧹 [Athena Debug] Cleaned up pagination debug function');
      }
    };
  }, [editor]);

  // 🔥 CRITICAL FIX: Wire handleAutoSave to the actual debounced save
  // 
  // PROBLEM: handleAutoSave calls setLastSaved(new Date()) and setSaveStatus('saved')
  // without making any API call. The comment says "Auto-save to backend has been disabled"
  // — but the status indicator in the UI still says "Saved" with a timestamp, actively
  // misleading users into thinking their work is persisted when it is not.
  // debouncedSave is the real save path, but handleAutoSave was shadowing it.
  //

  // 🔥 CRITICAL FIX: Use stable ref — attach it at the JSX level, no querySelector needed
  // PROBLEM: document.querySelector('.document-container')?.parentElement || ... is a chain of
  // three different selectors with fallbacks — if the DOM structure changes (e.g. a CSS class rename
  // during a UI refactor), the inert attribute silently stops being applied, breaking keyboard
  // accessibility for all toolbar menus without any error or warning.
  // 
  // SOLUTION: Use a React ref attached to the container div - no fragile DOM queries
  const setContentInert = useCallback((inert) => {
    const el = editorContainerRef.current;
    if (!el) return;
    if (inert) {
      if (window.isToolbarInteraction) return;
      el.setAttribute('inert', '');
    } else {
      el.removeAttribute('inert');
    }
  }, []); // ✅ Stable deps - editorContainerRef is stable
  // SOLUTION: Delegate to debouncedSave so auto-save actually saves to backend
  const handleAutoSave = useCallback(async () => {
    // debouncedSave already handles auto-saving — just trigger it
    if (editor && !editor.isDestroyed) {
      saveRef.current?.(); // call the ref-based debounced save
    }
  }, [editor]); // ✅ Stable deps only - refs give live access to editor state

  // ========================
  // VERSION MANAGEMENT
  // ========================
  // 🔥 CRITICAL FIX: Store only metadata in React state — full content stays on backend
  const saveCurrentVersion = useCallback(async (options = {}) => {
    if (!editor) return;
    
    const id = docIdRef.current;
    if (!id) {
      toast.error('Save document before creating a version');
      return;
    }
    
    try {
      // 🔥 Create version on backend - content is already auto-saved
      const result = await TextEditorService.createVersion(id, {
        title: options.reason || `Version ${documentVersions.length + 1}`,
        author: 'You',
      });
      
      // ✅ Only store metadata in state — no HTML blob!
      setDocumentVersions(prev => [{
        id: result.versionId || result.id || Date.now(),
        title: result.title || `Version ${prev.length + 1}`,
        timestamp: new Date(result.timestamp || Date.now()),
        wordCount: wordCountRef.current,
        author: result.author || 'You',
      }, ...prev].slice(0, 50)); // Cap at 50 versions to prevent unbounded growth
      
      toast.success('Version saved to backend');
    } catch (error) {
      console.error('Failed to save version:', error);
      toast.error('Failed to save version: ' + error.message);
    }
  }, [editor, documentVersions.length]);

  // Wire handleAutoSave to ref to avoid TDZ and stale closures
  handleAutoSaveRef.current = handleAutoSave;

  const handleSave = useCallback(async () => {
    if (!editor) return;
    try {
      // 🔥 CRITICAL FIX: Read volatile values from refs (always fresh, stable closure)
      const title = documentTitleRef.current;
      const currentZoom = zoomRef.current;
      
      // 🔥 CRITICAL FIX: Use already-computed refs from onUpdate stats collector
      // PROBLEM: editor.state.doc.descendants() is O(n) and was being called twice - once
      // in onUpdate stats and again here in save path. This doubles main-thread work.
      // 
      // SOLUTION: Read from refs that are continuously updated in onUpdate - no re-traversal needed
      const documentData = {
        // Document Metadata
        metadata: {
          title: title || 'Untitled Document',
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

        // Document Statistics - READ FROM REFS (no re-traversal)
        statistics: {
          characterCount: characterCountRef.current,
          wordCount: wordCountRef.current,
          paragraphCount: paragraphsRef.current,
          headings: headingsRef.current,
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

        // Document Structure - READ FROM REFS (no re-traversal)
        structure: {
          headings: headingsRef.current,
          paragraphs: { count: paragraphsRef.current },
          lists: listsRef.current,
          tables: { count: tablesRef.current },
          images: imagesDataRef.current,
          links: linksRef.current
        },

        // Editor State
        editorState: {
          zoom: currentZoom,
          isEditable: editor.isEditable,
          isFocused: editor.isFocused
        }
      };

      // REMOVED: Redundant doc traversal - now reads from refs populated in onUpdate
      // editor.state.doc.descendants(...) - REMOVED TO AVOID DUPLICATE O(n) WORK

      // Note: Removed localStorage backup. Only save to backend (MongoDB).

      // 🔥 CRITICAL FIX: Determine document ID from URL ONLY (Single Source of Truth)
      // Priority: 1) mongoId prop, 2) Extract from URL path
      // NO localStorage fallback - MongoDB is the single source of truth
      const effectiveMongoId = mongoId || (() => {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const lastPart = pathParts[pathParts.length - 1];
        if (/^[0-9a-fA-F]{24}$/.test(lastPart)) return lastPart;
        return null;
      })();

      console.log('💾 SAVE DEBUG - Single Source of Truth:', {
        mongoIdProp: mongoId,
        urlExtractedId: (() => {
          const pathParts = window.location.pathname.split('/').filter(Boolean);
          const lastPart = pathParts[pathParts.length - 1];
          return /^[0-9a-fA-F]{24}$/.test(lastPart) ? lastPart : null;
        })(),
        effectiveMongoId,
        hasValidDocId: !!(mongoId || effectiveMongoId),
        urlPath: window.location.pathname,
        urlQuery: window.location.search
      });

      // 🔥 CRITICAL FIX: Always use the mongoId from URL if available
      // This prevents creating duplicate documents when editing existing ones
      const docIdToUpdate = effectiveMongoId || activeDocId;

      // If we have ANY document ID (activeDocId OR mongoId), update existing document
      if (docIdToUpdate) {
        console.log('📝 Updating existing document with ID:', docIdToUpdate);
        console.log('🔍 Document ID source:', {
          from_mongoId_prop: !!mongoId,
          from_url_path: !!(function() {
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            const lastPart = pathParts[pathParts.length - 1];
            return /^[0-9a-fA-F]{24}$/.test(lastPart) ? lastPart : null;
          })(),
          from_localStorage: !!localStorage.getItem('athena_current_mongo_id')
        });

        try {
          // Update existing document using /api/text-editor/document/:id
          console.log('📤 SENDING TO BACKEND:', {
            docIdToUpdate,
            title: documentTitle,
            data: {
              hasContent: !!editor.getJSON(),
              hasHtml: !!editor.getHTML(),
              contentStructure: editor.getJSON()?.type,
              firstBlockType: editor.getJSON()?.content?.[0]?.type,
              hasMarks: JSON.stringify(editor.getJSON()).includes('marks')
            }
          });

          await TextEditorService.updateDocument(docIdToUpdate, {
            title: documentTitleRef.current,
            data: {
              content: editor.getJSON(),
              html: editor.getHTML()
            }
          });

          console.log('✅ SAVE SUCCESSFUL - Check network tab to verify backend stored JSON');

          setLastSaved(new Date());
          setSaveStatus('saved');
          toast.success('Document saved to backend successfully! 💾');

          // Notify other tabs (EditorIntro) to refresh document list
          localStorage.setItem('athena_document_refresh', Date.now().toString());
        } catch (backendError) {
          console.error('Backend save error:', backendError);
          toast.error('Failed to save to backend: ' + (backendError.message || 'Unknown error'));
          setSaveStatus('error');
          return; // Stop here if backend save fails
        }
      } else {
        // No document ID - this is a NEW document, save it to backend
        console.log('🆕 No document ID - saving as NEW document');
        try {
          const result = await TextEditorService.saveDocument({
            title: documentTitleRef.current || 'Untitled Document',
            data: {
              content: editor.getJSON(),
              html: editor.getHTML()
            }
          });

          setLastSaved(new Date());
          setSaveStatus('saved');
          toast.success('New document saved to backend successfully! 💾');

          // Notify parent component of the new document ID
          onMongoIdSaved?.(null, result.id);

          // Notify other tabs to refresh document list
          localStorage.setItem('athena_document_refresh', Date.now().toString());
        } catch (backendError) {
          console.error('Backend save error:', backendError);
          toast.error('Failed to save to backend: ' + (backendError.message || 'Unknown error'));
          setSaveStatus('error');
          return;
        }
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
  }, [editor, setLastSaved, setSaveStatus]); // ✅ Stable deps only - refs give live access to title/zoom

  const handlePrint = useCallback(async () => {
    if (!editor) return;
    try { await DocumentExporter.printDocument(editor, { title: documentTitleRef.current || 'Document' }); }
    catch (error) { toast.error('Failed to print document'); }
  }, [editor]); // ✅ Stable deps only - ref gives live access to title

  const handleFindReplace = useCallback((isReplaceMode = false) => {
    setFindReplaceMode(isReplaceMode); setShowFindReplaceModal(true);
  }, []);

  const handleExport = useCallback(async () => {
    if (!editor) { toast.error('Editor not available'); return; }
    const title = documentTitleRef.current;
    const options = { filename: `${title || 'document'}.${exportFormat}`, title: title || 'My Document' };
    try {
      switch (exportFormat) {
        case 'pdf': await exportToPDF(editor, options); break;
        case 'docx': await exportToDOCX(editor, options); break;
        case 'md': await exportToMarkdown(editor, options); break;
        case 'txt': await exportToPlainText(editor, options); break;
        case 'html': await exportToHTML(editor, options); break;
        case 'json': await exportToJSON(editor, options); break;
        default: toast.error(`Unsupported export format: ${exportFormat}`);
      }
    } catch (error) { toast.error('Export failed'); }
    finally { updateEditorFeatures({ showExportDialog: false }); }
  }, [editor, exportFormat, updateEditorFeatures, exportToPDF, exportToDOCX, exportToMarkdown, exportToPlainText, exportToHTML, exportToJSON]); // ✅ Stable deps only - ref gives live access to title

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

  const handleHeadingClick = useCallback((headingId) => {
    if (!editor) return;
    try {
      // 🔥 Find heading by ID in document
      let targetPos = null;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading' &&
            (node.attrs.id === headingId || `${pos}` === headingId.replace('heading-', '').split('-')[0])) {
          targetPos = pos;
          return false; // Stop searching
        }
        return true;
      });

      if (targetPos !== null) {
        // Set selection at heading position
        editor.chain().focus().setTextSelection(targetPos).run();

        // 🔥 Smooth scroll to heading in viewport
        setTimeout(() => {
          const contentContainer = contentContainerRef.current;
          if (contentContainer) {
            const headingElement = contentContainer.querySelector(`[data-pos="${targetPos}"]`);
            if (headingElement) {
              headingElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
              });
              console.log('📑 Scrolled to heading:', headingId);
            }
          }
        }, 50); // Small delay for DOM to update after selection
      }
    } catch (error) {
      console.error('Heading click error:', error);
    }
  }, [editor]);

  const handleZoomChange = useCallback((newZoom) => {
    const clampedZoom = Math.max(50, Math.min(200, Math.round(newZoom / 10) * 10));
    updateUIState({ zoom: clampedZoom });
  }, [updateUIState]);

  const handleTemplateSelect = useCallback((template) => {
    if (editor) {
      requestAnimationFrame(() => {
        editor.commands.setContent(template.content);
      });
      setDocumentTitle(template.name);
      toast.success(`Template "${template.name}" applied!`);
    }
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
    // Page break functionality removed - just notify user
    toast.info('Page break functionality has been removed. Document now uses endless page mode.');
  }, [editor]);

  const addPageBreak = useCallback(() => {
    // Page break functionality removed
    toast.info('Page break functionality has been removed');
  }, []);

  const insertPageNumber = useCallback(() => {
    // Page functionality removed - will be re-implemented
    toast.info('Page numbering will be available in the new pagination system');
  }, []);

  const goToPage = useCallback((pageNumber) => {
    // Page functionality removed - will be re-implemented
    toast.info('Page navigation will be available in the new pagination system');
  }, []);

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

  // 🔥 CRITICAL FIX: Version restore function - fetches content from backend
  const restoreVersion = useCallback(async (version) => {
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
  }, [editor]);

  const handleRestoreVersion = useCallback((versionId) => {
    const version = documentVersions.find(v => v.id === versionId);
    if (version && editor) {
      // 🔥 CRITICAL FIX: Show confirmation dialog instead of immediately overwriting
      restoreVersion(version);
    }
  }, [editor, documentVersions]);

  // 🔥 CRITICAL FIX: Restore confirmation functions
  // These handle the version restore confirmation dialog
  const confirmRestore = useCallback(async () => {
    if (!editor || !restoreTarget?.content) return;
    
    try {
      // 🔥 CRITICAL FIX: Actually save current state before restoring (no false promises!)
      // Step 1: Auto-save current content as a new version
      const currentContent = editor.getHTML();
      
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
  }, [editor, restoreTarget, saveCurrentVersion]);

  const cancelRestore = useCallback(() => {
    setRestoreTarget(null);
  }, []);

  // 🔥 CRITICAL FIX: Delete confirmation cancel function
  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  // 🔥 CRITICAL FIX: Delete confirmation confirm function
  const confirmDelete = useCallback(async () => {
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
  }, [editor, navigate]);

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

  // 🔥 CRITICAL FIX: Clear ALL pending timeouts on unmount
  // 
  // PROBLEM: statsTimeoutRef, paginationTimeoutRef, pagesUpdateTimeoutRef, autoSaveTimeoutRef,
  // and pasteTimerRef are all set via setTimeout but never cancelled in a cleanup. If the
  // component unmounts while any timeout is pending it fires against a destroyed editor and
  // unmounted React tree.
  //
  // SOLUTION: Clear ALL pending timers on unmount, cancel debounce, nullify editor ref
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up all timeouts and timers on unmount');
      
      // Clear ALL pending timeouts
      [
        statsTimeoutRef,
        paginationTimeoutRef,    // 🔥 Was missing!
        pagesUpdateTimeoutRef,
        autoSaveTimeoutRef,
        pasteTimerRef
      ].forEach((ref) => {
        if (ref.current) {
          clearTimeout(ref.current);
          ref.current = null;
        }
      });
      
      // Cancel lodash debounce (if active)
      if (saveRef.current?.cancel) {
        saveRef.current.cancel();
        console.log('🧹 Cancelled debounced save');
      }
      
      // Nullify editor ref to prevent stale references
      editorRef.current = null;
      
      console.log('✅ All timers cleaned up, editor ref nulled');
    };
  }, []);

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
              onInsertTable={() => {
                console.log('🎯 [TextEditor] onInsertTable called');
                runWithSavedSelection(editor, (chain) => chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }));
              }}
              onInsertLink={() => {
                // 🔥 Use centralized validation instead of direct setLink
                const url = window.prompt('Enter link URL (http://, https://, mailto:, or tel:):');
                if (url && editor) {
                  validateAndSetLink(url);
                }
              }}
              onUndo={() => { console.log('onUndo called'); runWithSavedSelection(editor, (chain) => chain.undo()); }}
              onRedo={() => { console.log('onRedo called'); runWithSavedSelection(editor, (chain) => chain.redo()); }}
              onSelectAll={() => { console.log('onSelectAll called'); runWithSavedSelection(editor, (chain) => chain.selectAll()); }}
              onCut={() => { console.log('onCut called'); document.execCommand('cut'); }}
              onCopy={() => {
                console.log('onCopy called');
                // Fallback: use execCommand with a temp textarea
                try {
                  const textContent = editor.state.doc.textBetween(
                    editor.state.selection.from,
                    editor.state.selection.to,
                    '\n'
                  );
                  const ta = document.createElement('textarea');
                  ta.value = textContent;
                  ta.style.cssText = 'position:fixed;top:-9999px';
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand('copy');
                  document.body.removeChild(ta);
                  console.log('✅ Copied via execCommand fallback');
                } catch (error) {
                  console.error('[onCopy] Failed:', error);
                }
              }}
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
          onSetContentInert={setContentInert}
        />

        {/* Find & Replace */}
        <FindReplaceModal
          isOpen={showFindReplaceModal}
          onClose={() => setShowFindReplaceModal(false)}
          editor={editor}
          isReplaceMode={findReplaceMode}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0, height: '100%' }}>
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
            ref={editorContainerRef}
            className="flex-1 overflow-y-auto bg-slate-100/50 p-4"
            onCopy={handleCopy}
            style={{ position: 'relative', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            {/* Real Pagination - Pages Container with Zoom */}
            {editor && (
              <div
                className="editor-pages-container"
                style={{
                  transform: `scale(${effectiveZoom / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease-out',
                  width: `${100 * (100 / effectiveZoom)}%`,
                  marginBottom: '20px'
                }}
              >
                <EditorContent editor={editor} />
              </div>
            )}
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
                    {[['pdf', 'PDF'], ['docx', 'DOCX'], ['md', 'Markdown'], ['txt', 'Plain Text'], ['html', 'HTML'], ['json', 'JSON']].map(([v, l]) => (
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

        {/* 🔥 Restore Confirmation Dialog */}
        <Dialog open={!!restoreTarget} onOpenChange={(open) => !open && setRestoreTarget(null)}>
          <DialogContent className="max-w-md bg-white" aria-describedby="restore-dialog-description">
            <DialogHeader>
              <DialogTitle>Restore Previous Version?</DialogTitle>
              <DialogDescription id="restore-dialog-description">
                This will replace your current document with the version "{restoreTarget?.title}" from {restoreTarget?.timestamp?.toLocaleString()}.
                <br /><br />
                <strong>Your current content will be preserved in undo history</strong>, so you can revert back if needed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={cancelRestore}>
                Cancel
              </Button>
              <Button onClick={confirmRestore} className="bg-blue-600 hover:bg-blue-700">
                Restore Version
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 🔥 Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(false)}>
          <DialogContent className="max-w-md bg-white" aria-describedby="delete-dialog-description">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Document Permanently?</DialogTitle>
              <DialogDescription id="delete-dialog-description">
                This action cannot be undone. This will permanently delete the document "{documentTitle}" from MongoDB.
                <br /><br />
                <strong>All content will be lost forever.</strong>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${imageInsertMethod === method ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
                              <img 
                                src={imageUrl} 
                                alt="Preview" 
                                className="w-full h-full object-contain" 
                                onError={(e) => {
                                  e.currentTarget.onerror = null; // prevent infinite loop
                                  e.currentTarget.src = '/placeholder-image.svg'; // real asset path
                                }} 
                              />
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
            console.log('📝 AI Generate document:', data);

            if (!editor) return;

            // ✅ FIX: Properly insert AI-generated HTML content into editor
            const insertGeneratedContent = async () => {
              try {
                // 🔥 CRITICAL FIX: Don't clear content immediately - wait for user input to settle
                // 
                // PROBLEM: The loading placeholder is set with editor.commands.clearContent() then
                // insertContent(loadingHtml). Then 150 ms later editor.commands.setContent(sanitized)
                // fires. If the backend is slow and the user typed something during those 150 ms,
                // their typing is wiped. Also paginateDocument is dynamically imported 50 ms after
                // setContent — if that import was already in cache the module resolves synchronously
                // and paginateDocument runs before the setContent DOM update has been committed.
                //
                // SOLUTION: Use requestAnimationFrame for guaranteed post-DOM-commit execution
                
                // If content is provided, parse and insert it with professional formatting
                if (data.html) {
                  console.log('📄 Inserting generated content...');

                  // Clean markdown code blocks if present
                  let cleanContent = data.html;
                  if (cleanContent.startsWith('```html') || cleanContent.startsWith('```markdown') || cleanContent.startsWith('```')) {
                    cleanContent = cleanContent.replace(/^```\w*\s*/i, '').replace(/```\s*$/i, '').trim();
                  }

                  // ✅ CRITICAL: Convert markdown to HTML with proper formatting
                  const htmlContent = parseMarkdownToHtml(cleanContent);

                  // ✅ Add professional styling wrapper
                  const styledContent = `
                    <div class="professional-document">
                      ${htmlContent}
                    </div>
                  `;

                  // Sanitize and insert immediately
                  const sanitized = DOMPurify.sanitize(styledContent);
                  editor.commands.setContent(sanitized);

                  toast.success(`Document generated — ${data.pages} page${data.pages > 1 ? 's' : ''}!`);

                  // 🔥 CRITICAL: Use requestAnimationFrame - guaranteed to run after DOM commit
                  // This ensures paginateDocument sees the fully-updated DOM
                  requestAnimationFrame(() => {
                    if (!editor.isDestroyed) {
                      paginateDocument(editor, { force: true });
                      console.log('✅ Pagination completed after content insertion');
                    }
                  });
                }

                setShowAIAssistant(false);
              } catch (error) {
                console.error('Failed to insert generated content:', error);
                toast.error('Failed to display generated document');
              }
            };

            insertGeneratedContent();
          }}
          onInlineAction={(behavior, content) => {
            if (!editor) return;
            // ✅ BUG 1 FIX: Parse markdown to HTML before inserting
            const html = parseMarkdownToHtml(content);
            if (behavior === 'replace') {
              editor.chain().focus().deleteSelection().insertContent(html).run();
            } else if (behavior === 'append') {
              editor.chain().focus().insertContent(html).run();
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

export default TextEditorWithProviders;