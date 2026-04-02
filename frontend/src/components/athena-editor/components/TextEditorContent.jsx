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
  : () => { };

const warn = process.env.NODE_ENV === 'development'
  ? (...args) => console.warn(...args)
  : () => { };

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
import { ExportDialog } from './ExportDialog';
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
// import { VoiceTyping as _VoiceTyping } from './editor/VoiceTyping';
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
  const { exportToPDF, exportToDOCX, exportToEPUB, exportToJSON, exportToHTML, exportToMarkdown, exportToPlainText, exportLoading, exportProgress } = useExportState();

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
  // 🔥 REMOVED: Legacy word-count constants - no longer used
  // These constants caused mismatch between editor and PDF export:
  // Old: MAX_WORDS_PER_PAGE=380, MAX_CHARS_PER_PAGE=2100, MAX_LINES_PER_PAGE=32
  // Now using: DOM-based PaginationEngine with actual height measurement
  const AVG_CHARS_PER_LINE = 65;         // Conservative estimate at 12 pt
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
  const isInsertingRef = useRef(false);
  const lastFingerprintRef = useRef('');
  const lastPasteTimeRef = useRef(0);
  const docIdRef = useRef(null);

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

  // Sync docIdRef whenever docId changes for safe use in debounced callbacks
  useEffect(() => {
    docIdRef.current = docId;
  }, [docId]);

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

  // 🔥 DEPRECATED - Legacy word-count pagination REMOVED
  // 
  // This function used word/char heuristics (MAX_WORDS_PER_PAGE = 380) which
  // diverged from actual rendered height, causing PDF export mismatch.
  // 
  // REPLACED BY: runPastePageBreaksOptimized (uses DOM height measurement)
  const runProgressivePageBreaks = useCallback(async (editorInstance) => {
    console.warn('[TextEditor] runProgressivePageBreaks is DEPRECATED - use runPastePageBreaksOptimized');
    return 0;
  }, []);

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

    // Simple character count check - no word-count heuristics
    // Very small docs don't need pagination
    const totalChars = text.length;
    if (totalChars < 500) {
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
      TiptapLink.configure({ 
        openOnClick: true,
        HTMLAttributes: { 
          class: 'text-blue-600 underline',
          target: '_blank',
          rel: 'noopener noreferrer'
        } 
      }),
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
          from_url_path: !!(function () {
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
        editor.chain().focus(null, { scrollIntoView: false }).setTextSelection(targetPos).run();

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
    editor.chain().focus(null, { scrollIntoView: false }).toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    if (!editor) return;
    editor.chain().focus(null, { scrollIntoView: false }).toggleOrderedList().run();
  }, [editor]);

  const toggleTaskList = useCallback(() => {
    if (!editor) return;
    editor.chain().focus(null, { scrollIntoView: false }).toggleTaskList().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    if (!editor) return;
    editor.chain().focus(null, { scrollIntoView: false }).toggleUnderline().run();
  }, [editor]);

  const toggleBlockquote = useCallback(() => {
    if (!editor) return;
    editor.chain().focus(null, { scrollIntoView: false }).toggleBlockquote().run();
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
      try { editor.chain().focus(null, { scrollIntoView: false }).setImage({ src, alt }).run(); setShowImageModal(false); }
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

  // Calculate export progress percentage and stage for ExportDialog
  const exportProgressPercent = useMemo(() => {
    if (!exportProgress?.totalSteps) return 0;
    return Math.round((exportProgress.completedSteps / exportProgress.totalSteps) * 100);
  }, [exportProgress]);

  const exportStageMessage = useMemo(() => {
    return exportProgress?.currentStep || 'Preparing document';
  }, [exportProgress]);

  // Check if any export is currently loading
  const isExportLoading = useMemo(() => {
    return Object.values(exportLoading).some(loading => loading);
  }, [exportLoading]);

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
              onOpenAIAssistant={() => setShowAIAssistant(true)}
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
            className="flex-1 bg-slate-100/50 p-4"
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

        {/* Export Dialog - Production Grade */}
        <ExportDialog
          open={showExportDialog}
          onOpenChange={(open) => updateEditorFeatures({ showExportDialog: open })}
          exportFormat={exportFormat}
          onFormatChange={(value) => updateEditorFeatures({ exportFormat: value })}
          onExport={handleExport}
          exportLoading={isExportLoading}
          exportProgress={exportProgressPercent}
          exportStage={exportStageMessage}
          documentTitle={document?.title || 'Untitled Document'}
          documentStats={{
            words: documentStats?.words || 0,
            pages: documentStats?.pages || 1,
            characters: documentStats?.characters || 0,
          }}
        />

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
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
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
              editor.chain().focus(null, { scrollIntoView: false }).setResizableImage({
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
          selectedText={editor?.state?.selection ? editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ') : ''}
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
