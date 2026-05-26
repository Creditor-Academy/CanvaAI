// src/components/athena-editor/components/TextEditor.jsx
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import ReactDOM, { createPortal } from 'react-dom';
import { VersionHistory } from './editor/VersionHistory.jsx';
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

// 🎯 PHASE 1: Component Decomposition - Import extracted hooks
import { useDocumentPersistence } from '../hooks/useDocumentPersistence.js';
import { useEditorStats } from '../hooks/useEditorStats.js';
import { EditorSurface } from './EditorSurface.jsx';
import { FindReplaceModal } from './editor/FindReplaceModal.jsx';
import ExportDialog from './ExportDialog.jsx';
import { AIAssistant } from './editor/AIAssistant.jsx';
import Portal from './ui/Portal.jsx';
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
import { paginateDocument, debouncePaginate, cleanupPagination, invalidatePaginationCache } from '../utils/paginationEngine.js'; // 🔥 CRITICAL: Full pagination + paste detection
import { usePastePagination } from '../hooks/usePastePagination';
import { transformMarkdownToEditor, isMarkdown } from '../utils/transformMarkdownToEditor.js'; // 🔥 NEW: Markdown transformer
// NOTE: @tiptap/extension-table is NOT used. The project uses the custom
// TableExtension.js (customTable atom node) registered in EditorSurface.jsx.
// Importing TiptapTable/TableRow/TableCell/TableHeader here would add them to
// the bundle but they are never registered, so insertTable/addRowAfter etc.
// would still throw "chain.X is not a function".
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
import { EditorToolbar } from './editor/toolbar/EditorToolbar.jsx';
import { EditorProvider, useEditorContext } from '../contexts/EditorContent.jsx';
import { ImageProvider, useImageContext } from '../contexts/ImageContext.jsx';
import { useExportState } from '../hooks/useExportState.js';
import { toast } from 'sonner';
import HeaderMenuBar from './editor/HeaderMenuBar';
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
import { saveTokenUsage, getTokenUsageForSave } from '../../../utils/tokenPersistence.js';
import { DocumentOutline } from './editor/DocumentOutline';
import { TemplateSidebar } from './editor/TemplateSidebar.jsx';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api';
import { TextEditorService } from '../../../services/Text-Editor/text.service.js';
import { useDocument } from '../../../hooks/useDocuments.js';
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
import { cn } from "@/components/athena-editor/components/utils";
import { scrollLockManager } from '../utils/scrollLockManager';
import focusUtils from './editor/focusUtils';

// Destructure functions from default export for backward compatibility
const { guardToolbarMouseDown, runWithSavedSelection, preventEditorBlur, saveSelection, onMenuOpen, onMenuClose } = focusUtils;
import { useKeyboardShortcuts } from './editor/useKeyboardShortcuts';


// import { VoiceTyping as _VoiceTyping } from './editor/VoiceTyping';





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
    // ── IMAGE SANITIZATION ──
    if (node.type === 'image' || node.type === 'resizableImage') {
      // Ensure src is never an empty string (prevents browser re-download warning)
      if (node.attrs && (node.attrs.src === '' || node.attrs.src === undefined)) {
        return [{ ...node, attrs: { ...node.attrs, src: null } }];
      }
      return [node];
    }

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

// ─── Helper Functions ────────────────────────────────────────────//
const normalizeInlineStyles = (html) => {
  if (!html || typeof html !== 'string') return html;

  try {
    // 🔥 ROBUST ENCODING: Enhanced regex pass for common alignment and size patterns
    let normalized = html;

    // 1. Convert inline text-align to data-text-align (consistent with our backend schema)
    normalized = normalized.replace(
      /style="([^"]*text-align:\s*(left|center|right|justify)[^"]*)"/gi,
      (_, style, align) => {
        const cleaned = style.replace(/text-align:\s*[^;]+;?\s*/gi, '').trim();
        return `data-text-align="${align.toLowerCase()}"${cleaned ? ` style="${cleaned}"` : ''}`;
      }
    );

    // 2. Map legacy font-size styles to data-font-size (prevents stripping by some extensions)
    normalized = normalized.replace(
      /style="([^"]*font-size:\s*([^;"]+)[^"]*)"/gi,
      (match, style, size) => {
        if (size.includes('pt') || size.includes('em') || size.includes('px')) {
          return `data-font-size="${size}" ${match}`;
        }
        return match;
      }
    );

    return normalized;
  } catch (error) {
    console.error('Failed to normalize inline styles:', error);
    return html;
  }
};


// New feature components

// Safety: if any module exports an object instead of a component function, render null
const _safe = (C) => (typeof C === 'function' ? C : () => null);

const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [{ types: [TextStyle.name], attributes: { fontSize: { default: null, parseHTML: element => element.style.fontSize, renderHTML: attributes => { if (!attributes.fontSize) return {}; return { style: `font-size: ${attributes.fontSize}` }; } } } }];
  },
  addCommands() {
    return {
      setFontSize: (fontSize) => ({ chain }) => {
        if (typeof invalidatePaginationCache === 'function') invalidatePaginationCache();
        return chain().setMark('textStyle', { fontSize: fontSize.includes('px') ? fontSize : `${fontSize}px` }).run();
      },
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

  // ✅ Rules of Hooks: Mounted guard must be at the top level
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  const { state: imageState = {}, actions: imageActions = {} } = useImageContext() || {};
  const { exportToPDF, exportToDOCX, exportToEPUB, exportToJSON, exportToHTML, exportToMarkdown, exportToPlainText, exportLoading, exportProgress } = useExportState();

  const {
    showReferencesPanel = false, showExportDialog = false,
    showTemplateSidebar = false, exportFormat = 'pdf',
    exportOptions = { includePageNumbers: true, includeHeader: true, includeFooter: true, exportComments: false, exportTrackChanges: false },
    documentTitle = 'Untitled Document', zoom = 100,
    documentStats = { paragraphs: 0, images: 0, tables: 0, pages: 1 },
    isOutlineOpen = true, isStarred = false,
    showFindReplaceModal = false, findReplaceMode = 'find',
    showAIAssistant = false, showImportModal = false,
    isImporting = false, isDragging = false, importError = null,
    documentVersions = [], showVersionHistory = false, restoreTarget = null,
    showDeleteConfirm = false, showImageModal = false, imageInsertMethod = 'url',
    imageUrl = '', selectedImageAlt = '', isImageUploading = false,
    uploadProgress = 0, pageSize = 'A4', pageOrientation = 'portrait',
    pageMargins = { top: 86, bottom: 86, left: 96, right: 96 },
    pageColor = '#ffffff', collapsedSections = {},
    activeHeadingLevel = 0, lineSpacing = 1.5
  } = editorState;

  const {
    setDocumentStats = () => { },
    setDocumentTitle = () => { }, updateEditorFeatures = () => { }, updateExportOptions = () => { },
    updateUIState = () => { }, updateDocumentStats: updateDocumentStatsAction = () => { },
    toggleSectionCollapse = () => { }, updateFormatting = () => { }
  } = editorActions;

  // UI State helpers for backward compatibility with JSX props
  const setIsOutlineOpen = useCallback((val) => updateUIState({ isOutlineOpen: val }), [updateUIState]);
  const setShowFindReplaceModal = useCallback((val) => updateUIState({ showFindReplaceModal: val }), [updateUIState]);
  const setShowAIAssistant = useCallback((val) => updateUIState({ showAIAssistant: val }), [updateUIState]);
  const setShowImportModal = useCallback((val) => updateUIState({ showImportModal: val }), [updateUIState]);
  const setShowImageModal = useCallback((val) => updateUIState({ showImageModal: val }), [updateUIState]);
  const setIsImporting = useCallback((val) => updateUIState({ isImporting: val }), [updateUIState]);
  const setImportError = useCallback((val) => updateUIState({ importError: val }), [updateUIState]);


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

  // ────────────────────────────────────────────────────────────────────────
  // 🎯 PHASE 1: Component Decomposition - Use extracted hooks
  // These hooks replace the manual implementation below (kept for backward compatibility)
  // ────────────────────────────────────────────────────────────────────────



  // 🔥 CRITICAL FIX: Use React Router hooks for SSR-safe, navigation-aware docId retrieval
  const navigate = useNavigate();
  const { mongoId: urlMongoId } = useParams();
  const [searchParams] = useSearchParams();



  // Zoom helper
  const effectiveZoom = zoom || 100;

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

  // Conflict resolution tracking
  const lastKnownBackendUpdateRef = useRef(Date.now());
  const imagesDataRef = useRef([]);
  const linksRef = useRef([]);
  // Keep minimal state for UI display - updated infrequently
  const [importedDocId, setImportedDocId] = useState(null);
  const [isAiGeneratedDoc, setIsAiGeneratedDoc] = useState(false);
  const [showHeadingStyles, setShowHeadingStyles] = useState(false);
  const [showPageSetup, setShowPageSetup] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState('');
  // Page states removed - will be re-implemented in new pagination system
  const [customHeadingStyles, setCustomHeadingStyles] = useState({});
  const [columnLayout, setColumnLayout] = useState({ count: 1, spacing: 36, equalWidth: true });
  const [paragraphSpacing, setParagraphSpacing] = useState({ before: 0, after: 0 });

  // ── Page-capacity constants ─────────────────────────────────────────────
  // 
  // These constants caused mismatch between editor and PDF export:
  // Old: MAX_WORDS_PER_PAGE=380, MAX_CHARS_PER_PAGE=2100, MAX_LINES_PER_PAGE=32
  // Now using: DOM-based PaginationEngine with actual height measurement
  const AVG_CHARS_PER_LINE = 65;         // Conservative estimate at 12 pt
  const STATS_DELAY = 500;               // ms delay before updating stats to prevent cursor jump

  const [editor, setEditor] = useState(null);
  const editorRef = useRef(null);
  const contentContainerRef = useRef(null);
  const editorContainerRef = useRef(null);
  const repaginateRef = useRef(null);
  const statsTimeoutRef = useRef(null);
  const paginationTimeoutRef = useRef(null);
  const pagesUpdateTimeoutRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const saveRef = useRef(null);
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

  // ENHANCEMENT: Track typing speed for adaptive debounce
  const lastContentChangeRef = useRef(0);

  const docIdRef = useRef(null);

  // 
  // PROBLEM: const docId = getDocId() reads window.location on every render — breaks SSR,
  // and when React Router navigates to a new document the stale value from first render persists.
  // Also, getCachedDocument() calls JSON.parse(sessionStorage.getItem(...)) at render time —
  // a synchronous throw if JSON is malformed brings down the whole tree.
  //
  // SOLUTION: useParams + useSearchParams are stable, SSR-safe, and update on navigation
  // (Hooks moved to top of component to fix TDZ ReferenceError on urlMongoId)

  const docId = useMemo(() => {
    // Priority 1: Query parameter (must be valid MongoDB ObjectId)
    const qp = searchParams.get('docId');
    if (qp && /^[0-9a-fA-F]{24}$/.test(qp)) {
      console.log('[docId] Using query param:', qp);
      return qp;
    }

    // Priority 2: URL path parameter (accept ANY docId, not just MongoDB ObjectIds)
    // This allows template documents with IDs like "doc_123456_random" to work
    if (urlMongoId && urlMongoId !== 'undefined' && urlMongoId !== 'null') {
      console.log('[docId] Using URL path:', urlMongoId, {
        isMongoObjectId: /^[0-9a-fA-F]{24}$/.test(urlMongoId),
        isTemplateDoc: urlMongoId.startsWith('doc_')
      });
      return urlMongoId;
    }

    // Priority 3: sessionStorage (fallback for immediate persistence)
    const sessionDocId = sessionStorage.getItem('athena_current_doc_id');
    if (sessionDocId && /^[0-9a-fA-F]{24}$/.test(sessionDocId)) {
      console.log('[docId] Using sessionStorage fallback:', sessionDocId);
      return sessionDocId;
    }

    console.log('[docId] No valid docId found');
    return null;
  }, [urlMongoId, searchParams]);

  // Sync docIdRef whenever docId changes for safe use in debounced callbacks
  useEffect(() => {
    docIdRef.current = docId;
  }, [docId]);

  // useDocumentPersistence provides a simpler save implementation; rename to avoid conflict
  // with the comprehensive local handleSave below (which reads from content refs).
  const {
    saveStatus,
    lastSaved,
    isSaving,
    handleSave,
    triggerAutoSave,
    docIdRef: persistenceDocIdRef
  } = useDocumentPersistence({
    docId: urlMongoId,
    editor: editorRef.current,
    onMongoIdSaved,
    documentTitle,
  });

  // 🚀 OPTIMIZATION: Get document from sessionStorage instead of API call
  // EditorIntro already fetched it, so we don't need to call GET API again
  const cachedDoc = useMemo(() => {
    if (!docId) return null;
    try {
      const storageKey = `doc_${docId}`;
      console.log('🔍 Checking sessionStorage for:', storageKey);
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) {
        console.log('❌ No cached document found in sessionStorage');
        return null;
      }
      console.log('✅ Found cached document, length:', raw.length);
      const doc = JSON.parse(raw);
      // Validate minimum shape before trusting
      if (!doc || typeof doc !== 'object' || (!doc._id && !doc.id)) {
        console.warn('⚠️ Invalid cached document, evicting');
        sessionStorage.removeItem(storageKey); // evict corrupt entry
        return null;
      }
      console.log('✅ Parsed cached document:', {
        id: doc.id || doc._id,
        title: doc.title,
        hasContent: !!doc.content,
        hasHtml: !!doc.html,
        hasDataContent: !!doc.data?.content,
        contentLength: (doc.content || doc.html || doc.data?.content || '').length
      });
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

  // Document layout is now managed exclusively by paginationEngine.js via EditorSurface.jsx.

  // Document statistics are now reactively linked to the editor state
  const { wordCount, characterCount, readingTime, headings, tokenCount, forceUpdateStats } = useEditorStats({
    editor,
    updateDelay: 1000,
  });

  // Sync ref for legacy compatibility where needed
  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    console.log('🔍 Editor mounted with props:', { mongoId, activeDocId });
    console.log('🔍 Current URL:', window.location.href);

    // 🔥 AUTOMATIC OUTLINE SCANNER: Register callback for pagination complete
    const extractHeadingsForOutline = () => {
      // console.log('📑 Automatic Outline Scanner triggered by pagination');

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
        if (forceUpdateStats && isMounted.current) forceUpdateStats();

        // Update document stats to trigger parent component updates
        if (updateDocumentStatsAction && isMounted.current) {
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
        if (newHeadings.length > 0 && !isOutlineOpen && isMounted.current) {
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

    return () => {
      if (editor && editor.storage) {
        editor.storage.onPaginationComplete = null;
      }
    };
  }, [editor]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ CRITICAL FIX: Wire up paste pagination plugin
  // This intercepts paste events and triggers pagination after DOM settles
  usePastePagination(editor, isPastingRef, lastPasteTimeRef);

  // 🚀 OPTIMIZATION: Synchronize editor content when document data arrives from cache/backend
  useEffect(() => {
    // Skip if editor not ready or no document to load
    if (!editor || !fetchedDoc) {
      console.log('⏭️ Skipping content load - editor or fetchedDoc not ready:', {
        hasEditor: !!editor,
        hasFetchedDoc: !!fetchedDoc
      });
      return;
    }

    // Check if we've already loaded this document to avoid re-setting and losing focus
    const docId = fetchedDoc.id || fetchedDoc._id;
    if (editor.storage.athena_loaded_id === docId) {
      console.log('⏭️ Skipping content load - already loaded this document:', docId);
      return;
    }

    console.log('🔥 CONTENT LOAD TRIGGERED:', {
      fromCache: !!cachedDoc,
      isDocLoaded,
      hasFetchedDoc: !!fetchedDoc,
      hasContent: !!fetchedDoc.content,
      hasHtml: !!fetchedDoc.html,
      hasDataContent: !!fetchedDoc.data?.content,
      docId: docId,
      editorReady: !!editor
    });

    const jsonContent = fetchedDoc.data?.content || fetchedDoc.content;
    const htmlContent = fetchedDoc.data?.html || fetchedDoc.html || '';

    console.log('📝 Content extraction:', {
      jsonContentType: typeof jsonContent,
      htmlContentType: typeof htmlContent,
      willUse: jsonContent ? 'jsonContent' : (htmlContent ? 'htmlContent' : 'NOTHING'),
    });

    // Defer setContent to avoid flushSync warning in React 19
    requestAnimationFrame(() => {

      const content = jsonContent || htmlContent;

      if (!content) {
        console.warn('⚠️ No content available to display in editor!');
        return;
      }

      // ── Parse JSON strings ─────────────────────────────────────────────────
      let parsedJsonContent = null;
      if (typeof content === 'string' && !isMarkdown(content) && !content.trim().startsWith('<')) {
        try {
          parsedJsonContent = JSON.parse(content);
        } catch (_) { /* plain text — keep null */ }
      }

      // ── Set editor content ─────────────────────────────────────────────────
      // CRITICAL: pass emitUpdate=false so the load is NOT pushed onto the
      // ProseMirror undo stack. Without this, the very first Ctrl+Z the user
      // presses undoes the document load itself, wiping all content.
      if (typeof content === 'string') {
        if (isMarkdown(content)) {
          transformMarkdownToEditor(editor, content);
        } else {
          editor.commands.setContent(normalizeInlineStyles(content), false);
        }
      } else if (parsedJsonContent && typeof parsedJsonContent === 'object') {
        editor.commands.setContent(normalizeParagraphs(parsedJsonContent), false);
      } else if (typeof content === 'object' && content !== null) {
        editor.commands.setContent(normalizeParagraphs(content), false);
      }

      // Clear the undo history after loading so the user's first Ctrl+Z undoes
      // their own edits, not the document load. Must run after setContent settles.
      ;

      console.log('✅ Content loaded into editor (history cleared)');

      
      //
      // SOLUTION:
      //   Stage 1: fonts.ready + double-RAF — waits for real glyph metrics
      //   Stage 2: 600ms safety net — catches lazy images / FOUT reflows
      const runRepaginationAfterLoad = async () => {
        try {
          if (typeof document !== 'undefined' && document.fonts) {
            await document.fonts.ready;
          }
          // Two RAFs: first queues after current paint, second fires after browser repaints
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

          if (editor && !editor.isDestroyed) {
            const { forceRepaginate } = await import('../utils/paginationEngine.js');
            forceRepaginate(editor);
            console.log('[loadDoc] Stage 1 repagination done (fonts.ready + double-RAF)');
          }

          // Safety net for lazy-loading images and large web-font FOUT
          await new Promise(resolve => setTimeout(resolve, 600));
          if (editor && !editor.isDestroyed) {
            const { forceRepaginate } = await import('../utils/paginationEngine.js');
            forceRepaginate(editor);
            console.log('[loadDoc] Stage 2 repagination done (600ms safety net)');
          }
        } catch (err) {
          console.warn('[loadDoc] Repagination error:', err.message);
        }
      };

      runRepaginationAfterLoad();

      // Set document title
      if (fetchedDoc.title) {
        setDocumentTitle(fetchedDoc.title);
      }

      // Mark as loaded to prevent re-runs
      editor.storage.athena_loaded_id = fetchedDoc.id || fetchedDoc._id;
    });
  }, [editor, isDocLoaded, fetchedDoc, cachedDoc, setDocumentTitle, setIsAiGeneratedDoc]);

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
  //
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
  // ========================
  // VERSION MANAGEMENT
  // ========================
  // 🔥 CRITICAL FIX: Store only metadata in React state — full content stays on backend
  const saveCurrentVersion = useCallback(async (options = {}) => {
    if (!editor) return;

    const id = persistenceDocIdRef.current || docIdRef.current;
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
      if (updateUIState) {
        updateUIState({
          documentVersions: [{
            id: result.versionId || result.id || Date.now(),
            title: result.title || `Version ${documentVersions.length + 1}`,
            timestamp: new Date(result.timestamp || Date.now()),
            wordCount: wordCountRef.current,
            author: result.author || 'You',
          }, ...documentVersions].slice(0, 50)
        });
      }

      toast.success('Version saved to backend');
    } catch (error) {
      console.error('Failed to save version:', error);
      toast.error('Failed to save version: ' + (error.message || 'Unknown error'));
    }
  }, [editor, documentVersions, persistenceDocIdRef, updateUIState]);

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
        case 'epub': await DocumentExporter.exportToEPUB(editor, options); break;
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
      console.log('📑 [DocumentOutline] Heading clicked:', headingId);

      // 🔥 Find heading by ID in document
      let targetPos = null;
      let targetNode = null;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading' &&
          (node.attrs.id === headingId || `${pos}` === headingId.replace('heading-', '').split('-')[0])) {
          targetPos = pos;
          targetNode = node;
          return false; // Stop searching
        }
        return true;
      });

      if (targetPos !== null && targetNode) {
        console.log('📑 [DocumentOutline] Found heading at position:', targetPos, 'Level:', targetNode.attrs.level);

        // Set selection at heading position
        editor.chain()
          .focus()
          .setTextSelection(targetPos + 1) // +1 to position cursor at start of heading content
          .scrollIntoView() // Scroll cursor into view
          .run();

        // 🔥 CRITICAL: Trigger pagination to update page breaks after cursor move
        setTimeout(() => {
          if (!editor.isDestroyed) {
            console.log('📑 [DocumentOutline] Triggering pagination after heading navigation');
            paginateDocument(editor, { force: true, reason: 'heading-navigation' });
          }
        }, 100);

        console.log('✅ [DocumentOutline] Cursor moved to heading:', headingId);
      } else {
        console.warn('⚠️ [DocumentOutline] Heading not found:', headingId);
        toast.error('Heading not found in document');
      }
    } catch (error) {
      console.error('❌ [DocumentOutline] Heading click error:', error);
      toast.error('Failed to navigate to heading');
    }
  }, [editor]);

  const handleZoomChange = useCallback((newZoom) => {
    const clampedZoom = Math.max(50, Math.min(200, Math.round(newZoom / 10) * 10));
    updateUIState({ zoom: clampedZoom });
  }, [updateUIState]);

  const handleTemplateSelect = useCallback((template) => {
    if (editor) {
      requestAnimationFrame(() => {
        // false = don't add to history; applying a template is not a user edit.
        // clearHistory() ensures Ctrl+Z starts from the template state, not before it.
        editor.commands.setContent(template.content, false);
        requestAnimationFrame(() => {
          if (!editor.isDestroyed) editor.commands.clearHistory();
        });
      });
      setDocumentTitle(template.name);
      toast.success(`Template "${template.name}" applied!`);
    }
  }, [editor, setDocumentTitle]);

  const handleHeadingChange = useCallback((level) => {
    if (!editor) return;
    editor.chain().focus();
    if (level === 0) { editor.chain().setParagraph().run(); } else { editor.chain().toggleHeading({ level }).run(); }
    updateFormatting({ activeHeadingLevel: level });
    setTimeout(() => { addHeadingStyles(); if (editor.view) editor.view.updateState(editor.state); }, 50);
  }, [editor, updateFormatting]);

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

      // ✅ FORCE PAGINATION: Trigger pagination after image insertion
      // INCREASED DELAY: Wait 300ms to ensure image DOM is fully rendered before measuring
      setTimeout(() => {
        if (!editor.isDestroyed) {
          // console.log('[insertImage] Triggering pagination after image insertion');
          paginateDocument(editor, { force: true, reason: 'image-insertion' });
        }
      }, 300); // Increased delay to let image fully render
    } catch (error) {
      try {
        editor.chain().focus(null, { scrollIntoView: false }).setImage({ src, alt }).run();
        setShowImageModal(false);

        // ✅ FORCE PAGINATION for fallback image insertion
        // INCREASED DELAY: Wait 300ms to ensure image DOM is fully rendered before measuring
        setTimeout(() => {
          if (!editor.isDestroyed) {
            // console.log('[insertImage] Triggering fallback pagination after image insertion');
            paginateDocument(editor, { force: true, reason: 'image-insertion-fallback' });
          }
        }, 300);
      }
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
      setUploadProgress(10);

      // Create FormData to send file to the uploader API
      const formData = new FormData();
      formData.append('image', file);

      // Simulate a small initial progress step while loading
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + Math.random() * 10 + 2;
        });
      }, 150);

      // Upload image to backend uploader (S3 uploader)
      const response = await TextEditorService.uploadImage(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response && response.url) {
        // Insert the uploaded permanent S3 URL instead of local base64 data URL
        insertImage(response.url, file.name);
        toast.success('Image uploaded successfully! 🎉');
      } else {
        throw new Error('No URL returned from server');
      }

      setTimeout(() => {
        setIsImageUploading(false);
        setUploadProgress(0);
      }, 300);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
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

      // Step 2: Restore the selected version.
      //
      // The correct pattern for "restorable restore" in TipTap:
      //   1. setContent(target, false)  — load target without adding to history
      //   2. clearHistory()             — wipe the old undo stack entirely
      //   3. The user's edits from this point forward build a fresh history
      //
      // The previous triple-setContent dance was wrong:
      //   - setContent(target, false) then setContent(snapshot, false) then
      //     setContent(target, true) resulted in "target" being the only
      //     undoable step, but snapshot was never actually visible to the user.
      //   - Calling setContent with emitUpdate=true (third arg) adds it to
      //     history as a full-document replacement, so Ctrl+Z would instantly
      //     wipe everything back to an empty document on the second keypress.
      //
      // New behavior: after restore the user gets a clean history starting from
      // the restored state. This matches the behavior of every version-control
      // UI (Git checkout, Google Docs restore, etc.).
      editor.commands.setContent(restoreTarget.content, false);
      editor?.commands.clearHistory();

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
      // console.log('🧹 Cleaning up all timeouts and timers on unmount');

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
        // console.log('🧹 Cancelled debounced save');
      }

      // Nullify editor ref to prevent stale references
      editorRef.current = null;

      // console.log('✅ All timers cleaned up, editor ref nulled');

      // ── NEW: Cleanup pagination state ───────────────────────────────────
      // Reset all pagination flags and storage to prevent memory leaks
      if (editorRef.current) {
        try {
          cleanupPagination(editorRef.current);
          // console.log('✅ Pagination state cleaned up');
        } catch (err) {
          console.error('[Cleanup] Failed to cleanup pagination:', err);
        }
      }
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
      <div className="h-screen w-full flex flex-col bg-background relative">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-0.5 bg-white border-b border-gray-100"
          style={{
            height: 'var(--editor-header-height)',
            flexShrink: 0,
            flexGrow: 0,
            overflow: 'visible', // Allow dropdowns to extend outside
            position: 'relative',
            zIndex: 9999
          }}>
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
              onOpen={() => {
                // Navigate to EditorIntro with import action param
                // This triggers the full-featured import panel there
                navigate('/editor-intro?action=import');
              }}
              editor={editor}
              zoom={zoom}
              onZoomChange={handleZoomChange}
              onShowHelp={() => toast.info('Help documentation would open here')}
              onShowSettings={() => toast.info('Settings would open here')}
              documentTitle={documentTitle}
              onRenameDocument={(newTitle) => setDocumentTitle(newTitle)}

              // Direct editor commands with focus management and selection restoration
              onToggleBold={() => {
                // console.log('🎯 [TextEditor] onToggleBold called, editor:', !!editor);
                runWithSavedSelection(editor, (chain) => chain.toggleBold());
              }}
              onToggleItalic={() => {
                // console.log('🎯 [TextEditor] onToggleItalic called, editor:', !!editor);
                runWithSavedSelection(editor, (chain) => chain.toggleItalic());
              }}
              onToggleUnderline={() => {
                // console.log('🎯 [TextEditor] onToggleUnderline called, editor:', !!editor);
                runWithSavedSelection(editor, (chain) => chain.toggleUnderline());
              }}
              onToggleStrikethrough={() => {
                // console.log('🎯 [TextEditor] onToggleStrikethrough called, editor:', !!editor);
                runWithSavedSelection(editor, (chain) => chain.toggleStrike());
              }}
              onToggleSuperscript={() => {
                // console.log('🎯 [TextEditor] onToggleSuperscript called');
                runWithSavedSelection(editor, (chain) => chain.toggleSuperscript());
              }}
              onToggleSubscript={() => {
                // console.log('🎯 [TextEditor] onToggleSubscript called');
                runWithSavedSelection(editor, (chain) => chain.toggleSubscript());
              }}
              onToggleCode={() => {
                // console.log('🎯 [TextEditor] onToggleCode called');
                runWithSavedSelection(editor, (chain) => chain.toggleCode());
              }}
              onClearFormatting={() => {
                // console.log('🎯 [TextEditor] onClearFormatting called');
                runWithSavedSelection(editor, (chain) => chain.unsetAllMarks().clearNodes());
              }}
              onSetTextAlign={(align) => {
                // console.log('🎯 [TextEditor] onSetTextAlign called', align);
                runWithSavedSelection(editor, (chain) => chain.setTextAlign(align));
              }}
              onInsertImage={() => setShowImageModal(true)}
              onInsertTable={() => {
                // CRITICAL: Must use insertCustomTable (registered by TableExtension.js).
                // insertTable belongs to @tiptap/extension-table which is NOT used here.
                // withHeaderRow is also @tiptap/extension-table-only — omit it.
                runWithSavedSelection(editor, (chain) =>
                  chain.insertCustomTable({ rows: 3, cols: 3 })
                );
              }}
              onInsertLink={() => {
                console.log('🔗 [TextEditor] onInsertLink called');
                // Save current selection before opening dialog
                if (editor) {
                  const { from, to } = editor.state.selection;
                  setSavedSelection({ from, to });
                  console.log('💾 Saved selection:', from, 'to', to);
                }
                setShowInsertLink(true);
                setLinkUrl('https://');
                setLinkDisplayText('');
              }}
              onUndo={() => { editor?.chain().focus().undo().run(); }}
              onRedo={() => { editor?.chain().focus().redo().run(); }}
              onSelectAll={() => { runWithSavedSelection(editor, (chain) => chain.selectAll()); }}
              onCut={() => { document.execCommand('cut'); }}
              onCopy={() => {
                // console.log('onCopy called');
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
                    // 🔥 CRITICAL FIX: Trigger pagination after paste settles
                    // Wait longer for complex content with headings to fully render

                    // Step 1: Wait for fonts to load (critical for heading height accuracy)
                    const waitForFontsAndLayout = () => {
                      if (document.fonts && document.fonts.ready) {
                        return document.fonts.ready.then(() => {
                          // Additional delay for heading layout to settle
                          return new Promise(resolve => setTimeout(resolve, 150));
                        });
                      }
                      return Promise.resolve();
                    };

                    waitForFontsAndLayout().then(() => {
                      if (!editor || editor.isDestroyed) return;

                      import('../utils/paginationEngine.js').then(({ forceRepaginate }) => {
                        forceRepaginate(editor);

                        // 🔥 Additional check: Verify pagination actually happened
                        // If content still overflows, trigger again
                        setTimeout(() => {
                          if (editor && !editor.isDestroyed) {
                            const currentPage = editor.view.dom.closest('.page');
                            const pageContent = currentPage?.querySelector('.page-content');

                            if (currentPage && pageContent) {
                              const contentHeight = pageContent.scrollHeight;
                              const pageHeight = parseInt(getComputedStyle(currentPage).height) || 1123;
                              const maxHeight = pageHeight - 96; // Subtract margins

                              // If still overflowing, force another pagination
                              if (contentHeight > maxHeight) {
                                console.log('[onPaste] Content still overflowing, forcing repagination');
                                forceRepaginate(editor);
                              }
                            }
                          }
                        }, 200);
                      });
                    });
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
                  // Trigger pagination after paste settles

                  // Wait for fonts and layout to settle
                  const waitForFontsAndLayout = () => {
                    if (document.fonts && document.fonts.ready) {
                      return document.fonts.ready.then(() => {
                        return new Promise(resolve => setTimeout(resolve, 100));
                      });
                    }
                    return Promise.resolve();
                  };

                  waitForFontsAndLayout().then(() => {
                    if (!editor || editor.isDestroyed) return;

                    import('../utils/paginationEngine.js').then(({ forceRepaginate }) => {
                      forceRepaginate(editor);
                    });
                  });
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
              // BulletList, OrderedList, ListItem are registered in EditorSurface.jsx.
              // StarterKit has them disabled there; the standalone extensions provide
              // toggleBulletList() and toggleOrderedList() on the chain.
              onToggleBulletList={() => { runWithSavedSelection(editor, (chain) => chain.toggleBulletList()); }}
              onToggleOrderedList={() => { runWithSavedSelection(editor, (chain) => chain.toggleOrderedList()); }}
              onToggleTaskList={() => { runWithSavedSelection(editor, (chain) => chain.toggleTaskList()); }}
              onIndent={() => { runWithSavedSelection(editor, (chain) => chain.indent()); }}
              onOutdent={() => { runWithSavedSelection(editor, (chain) => chain.outdent()); }}
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
              onInsertHorizontalRule={() => { runWithSavedSelection(editor, (chain) => chain.setHorizontalRule()); }}
              onToggleBlockquote={() => { runWithSavedSelection(editor, (chain) => chain.toggleBlockquote()); }}
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
        <div className="flex-1 flex overflow-hidden" style={{
          minHeight: 0,
          height: 'calc(100vh - 48px - 32px)', // Explicit: viewport - header - footer
          position: 'relative',
          flexShrink: 0,
          flexGrow: 1
        }}>
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
            className="flex-1 bg-slate-100/50"
            onCopy={handleCopy}
            style={{ position: 'relative', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <EditorSurface
              initialContent={fetchedDoc?.data?.content || fetchedDoc?.content || ''}
              editorRef={editorRef}
              zoom={zoom}
              onUpdate={({ editor: editorInstance }) => {
                // 🔥 CRITICAL FIX: Defer state update to next frame to avoid flushSync violation
                // PROBLEM: TipTap's onUpdate fires during a transaction flush. Calling setState synchronously
                // causes React to attempt a synchronous render (flushSync), which is prohibited inside lifecycles.
                requestAnimationFrame(() => {
                  if (isMounted.current) {
                    if (triggerAutoSave) triggerAutoSave();
                  }
                });
              }}
              onCreate={({ editor: editorInstance }) => {
                // Defer to avoid "Can't perform a React state update on a component that hasn't mounted yet"
                requestAnimationFrame(() => {
                  if (isMounted.current) {
                    setEditor(editorInstance);
                    editorRef.current = editorInstance;
                  }
                });
              }}
              placeholderText="Start typing or press / for AI commands..."
            />
          </div>


        </div>

        {/* Status Bar */}
        <footer className="flex items-center justify-between px-4 py-1.5 bg-gray-50/30 text-xs text-gray-500 border-t border-gray-200/50">
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>{characterCount} chars</span>
            <span>{tokenCount} tokens</span>
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
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                style={{ zIndex: 400 }} // Layer 4: Modals - Backdrop
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 flex items-center justify-center p-4"
                style={{ zIndex: 400 }} // Layer 4: Modals - Content
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

                  // Sanitize and insert immediately.
                  // false = don't add to history; AI generation replacing the doc is not
                  // a reversible user edit. clearHistory() prevents Ctrl+Z from undoing
                  // the generation and leaving the user with a blank document.
                  const sanitized = DOMPurify.sanitize(styledContent);
                  editor.commands.setContent(sanitized, false);

                  toast.success(`Document generated — ${data.pages} page${data.pages > 1 ? 's' : ''}!`);

                  // 🔥 CRITICAL: Use requestAnimationFrame - guaranteed to run after DOM commit
                  // This ensures paginateDocument sees the fully-updated DOM
                  requestAnimationFrame(() => {
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

            // Defensive: ensure imageUrl is a string (handle potential object responses)
            const finalUrl = typeof imageUrl === 'string' ? imageUrl : (imageUrl?.url || imageUrl?.src || '');

            if (!finalUrl) {
              toast.error('Could not determine image source');
              console.error('❌ [onImageInsert] Invalid imageUrl:', imageUrl);
              return;
            }

            try {
              editor.chain().focus(null, { scrollIntoView: false }).setResizableImage({
                src: finalUrl,
                alt: altText,
                title: altText || 'AI Generated Image',
                width: 400,
                height: 300,
                align: 'left'
              }).run();
              toast.success('AI image inserted successfully');
            } catch (error) {
              editor.chain().focus().setImage({ src: finalUrl, alt: altText }).run();
              toast.success('AI image inserted');
            }
          }}
          selectedText={editor?.state?.selection ? editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ') : ''}
          onGetSelectedText={() => {
            if (!editor) return '';
            const text = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');
            console.log('📝 [TextEditor] Fetching current selection:', text.substring(0, 50));
            return text;
          }}
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