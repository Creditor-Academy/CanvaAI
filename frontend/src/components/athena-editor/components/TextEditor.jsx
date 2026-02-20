import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Highlight } from '@tiptap/extension-highlight';
import { Typography } from '@tiptap/extension-typography';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Focus } from '@tiptap/extension-focus';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { ListItem } from '@tiptap/extension-list-item';
import Indent from '../extensions/Indent.js';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { TextStyle } from '@tiptap/extension-text-style';
import TableExtension from '../extensions/TableExtension.js';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { ResizableImage } from '../extensions/ResizableImage.jsx';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Blockquote } from '@tiptap/extension-blockquote';
import { createLowlight } from 'lowlight';
import { common } from 'lowlight';
import { mergeAttributes, Node, Extension } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import {
  Sparkles,
  Save,
  Trash2,
  FileText,
  BookOpen,
  PenTool,
  Square,
  Circle,
  Triangle,
  ArrowRight,
  MessageCircle,
  Star,
  Share2,
  MessageSquare,
  History,
  Menu,
  MoreVertical,
  Cloud,
  Download,
  Printer,
  Eye,
  Settings,
  HelpCircle,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Book,
  Layout,
  Plus,
  FilePlus,
  Type,
  ChevronRight,
  MoreHorizontal,
  Lock,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Highlighter,
  Undo,
  Redo,
  Minus,
  Search,
  Palette,
  Paintbrush,
  Heading,
  Text as TextIcon,
  Eraser,
  ChevronDown,
  CheckSquare,
  Replace,
  SpellCheck,
  Hash,
  PanelLeft,
  Ruler,
  Columns,
  Calculator,
  Calendar,
  Clock,
  Sigma,
  FilePlus2,
  BarChart,
  Languages,
  ListChecks,
  Settings2,
  Keyboard,
  Info,
  Bug,
  LifeBuoy,
  Video,
  FileCode2,
  Grid,
  FileDown,
  FileUp,
  FileInput,
  FileOutput,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  Edit3,
  PlusCircle,
  X,
  Moon,
  Copy,
  Scissors,
  Upload,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { EditorToolbar } from './editor/EditorToolbar';
import { AISidebar } from './editor/AISidebar';
import { DocumentOutline } from './editor/DocumentOutline';
import { TemplateSidebar } from './editor/TemplateSidebar.jsx';
import { DocumentExporter } from '../../../utils/documentExporter.js';
import { saveAs } from 'file-saver';

// Context providers
import { EditorProvider, useEditorContext } from '../contexts/EditorContent.jsx';
import { ImageProvider, useImageContext } from '../contexts/ImageContext.jsx';

// Export state hook
import { useExportState } from '../hooks/useExportState.js';
import { Label } from './ui/label.jsx';
import { Textarea } from './ui/textarea.jsx';
import { Switch } from './ui/switch.jsx';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { cn } from "./utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuShortcut,
  DropdownMenuPortal
} from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { motion, AnimatePresence } from 'framer-motion';

// Custom Font Size Extension - Refactored to use TextStyle global attributes
const FontSize = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: [TextStyle.name],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize: (fontSize) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: fontSize.includes('px') ? fontSize : `${fontSize}px` })
          .run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .run();
      },
    };
  },
});



// Custom Page Break Extension
const PageBreak = Node.create({
  name: 'pageBreak',

  group: 'block',

  selectable: true,

  draggable: true,

  atom: true, // Crucial: treats the node as a single unit

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
    ];
  },

  renderHTML() {
    return ['div', { 'data-type': 'page-break' }];
  },
});



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

// Handler functions
const handleFileAction = (action, editor) => {
  switch (action) {
    case 'new':
      if (window.confirm('Are you sure you want to create a new document? Your current changes will be lost.')) {
        editor?.commands.clearContent()
        toast.success('New document created')
      }
      break
    case 'open':
      toast.info('Open file dialog would appear here')
      break
    case 'save':
      toast.success('Document saved')
      break
    case 'print':
      window.print()
      break
    default:
      break
  }
}

const handleViewAction = (action, editorActions, zoom) => {
  switch (action) {
    case 'zoom_in':
      editorActions.setZoom(prev => Math.min(200, prev + 10));
      toast.success(`Zoom: ${Math.min(200, (zoom || 100) + 10)}%`);
      break;
    case 'zoom_out':
      editorActions.setZoom(prev => Math.max(50, prev - 10));
      toast.success(`Zoom: ${Math.max(50, (zoom || 100) - 10)}%`);
      break;
    case 'zoom_100':
      editorActions.setZoom(100);
      toast.success('Zoom reset to 100%');
      break;
    case 'zoom_50':
      editorActions.setZoom(50);
      toast.success('Zoom set to 50%');
      break;
    case 'zoom_75':
      editorActions.setZoom(75);
      toast.success('Zoom set to 75%');
      break;
    case 'zoom_125':
      editorActions.setZoom(125);
      toast.success('Zoom set to 125%');
      break;
    case 'zoom_150':
      editorActions.setZoom(150);
      toast.success('Zoom set to 150%');
      break;
    case 'zoom_200':
      editorActions.setZoom(200);
      toast.success('Zoom set to 200%');
      break;
    case 'fullscreen':
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        toast.success('Entered fullscreen mode');
      } else {
        document.exitFullscreen();
        toast.success('Exited fullscreen mode');
      }
      break;
    default:
      if (action.startsWith('zoom_')) {
        const zoomValue = parseInt(action.split('_')[1]);
        if (!isNaN(zoomValue)) {
          editorActions.setZoom(zoomValue);
          toast.success(`Zoom set to ${zoomValue}%`);
        }
      }
      break;
  }
};

const handleEditAction = (action, editor, evt = null, handleCopy, handlePaste) => {
  if (!editor) return

  switch (action) {
    case 'undo':
      editor.chain().focus().undo().run()
      break
    case 'redo':
      editor.chain().focus().redo().run()
      break
    case 'cut':
      // Custom cut handler
      handleCopy(); // Copy first
      editor.commands.deleteSelection(); // Then delete
      toast.success('Content cut to clipboard');
      break
    case 'copy':
      // Custom copy handler to preserve formatting
      handleCopy()
      break
    case 'paste':
      // Prevent default paste and use custom handler
      evt && evt.preventDefault()
      handlePaste(evt)
      break
    case 'select_all':
      editor.chain().focus().selectAll().run()
      break
    case 'find':
      // Trigger find functionality
      const searchInput = document.querySelector('input[placeholder*="Search"]')
      if (searchInput) {
        searchInput.focus()
      }
      break
    case 'replace':
      toast.info('Replace dialog would appear here')
      break
    case 'spell_check':
      toast.info('Spell check started')
      break
    case 'word_count':
      const text = editor.getText()
      const words = text.trim().split(/\s+/).filter(Boolean).length
      const chars = text.length
      toast.info(`Words: ${words}, Characters: ${chars}`)
      break
    default:
      break
  }
}

const handleInsertAction = (action, editor) => {
  if (!editor) return

  switch (action) {
    case 'image':
      const url = prompt('Enter image URL:')
      if (url) {
        editor.chain().focus().setImage({ src: url }).run()
      }
      break
    case 'table':
      // Try custom table first, fallback to standard table
      if (editor.can().insertCustomTable) {
        editor.chain().focus().insertCustomTable({
          rows: 3,
          cols: 3,
          cells: Array(3).fill().map(() => Array(3).fill('')),
          borderColor: '#d1d5db',
          fontSize: 14,
          color: '#000000',
          textAlign: 'left'
        }).run();
      } else {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      }
      break
    case 'link':
      const linkUrl = prompt('Enter URL:')
      if (linkUrl) {
        editor.chain().focus().setLink({ href: linkUrl }).run()
      }
      break
    case 'page_break':
      editor.chain().focus().setHorizontalRule().run()
      break
    case 'date':
      const date = new Date().toLocaleDateString()
      editor.chain().focus().insertContent(date).run()
      break
    case 'time':
      const time = new Date().toLocaleTimeString()
      editor.chain().focus().insertContent(time).run()
      break
    case 'symbol':
      const symbol = prompt('Enter symbol (e.g., ©, ®, ™):', '©')
      if (symbol) {
        editor.chain().focus().insertContent(symbol).run()
      }
      break
    case 'equation':
      editor.chain().focus().insertContent('\\[E = mc^2\\]').run()
      break
    case 'code_block':
      editor.chain().focus().toggleCodeBlock().run()
      break
    case 'quote':
      editor.chain().focus().toggleBlockquote().run()
      break
    default:
      break
  }
}

const handleFormatAction = (action, editor) => {
  if (!editor) return

  switch (action) {
    case 'bold':
      editor.chain().focus().toggleBold().run()
      break
    case 'italic':
      editor.chain().focus().toggleItalic().run()
      break
    case 'underline':
      editor.chain().focus().toggleUnderline().run()
      break
    case 'strike':
      editor.chain().focus().toggleStrike().run()
      break
    case 'superscript':
      editor.chain().focus().toggleSuperscript().run()
      break
    case 'subscript':
      editor.chain().focus().toggleSubscript().run()
      break
  }
}

// Wrapper component that provides context to the editor
const TextEditorWithProviders = () => {
  return (
    <EditorProvider>
      <ImageProvider>
        <TextEditorContent />
      </ImageProvider>
    </EditorProvider>
  );
};

// Main TextEditor component that uses context providers
const TextEditorContent = () => {
  // Constants for page management
  const PAGE_HEIGHT = 1122; // A4 height in points at 96 DPI (11.69 inches * 96)
  const PAGE_WIDTH = 793;   // A4 width in points at 96 DPI (8.27 inches * 96)
  const LINE_HEIGHT = 1.5;

  // Use context hooks for state management with safe defaults
  const { state: editorState = {}, actions: editorActions = {} } = useEditorContext() || {};
  const { state: imageState = {}, actions: imageActions = {} } = useImageContext() || {};

  // Use export state hook
  const { exportToPDF, exportToDOCX, exportToEPUB, exportToJSON, exportToHTML, exportToMarkdown, exportToPlainText, exportLoading } = useExportState();

  // Destructure state from contexts with defaults
  const {
    isAISidebarOpen = false,
    showReferencesPanel = false,
    showExportDialog = false,
    showTemplateSidebar = false,
    exportFormat = 'pdf',
    exportOptions = {
      includePageNumbers: true,
      includeHeader: true,
      includeFooter: true,
      exportComments: false,
      exportTrackChanges: false
    },
    documentTitle = 'Untitled Document',
    lastSaved = null,
    zoom = 100,
    saveStatus = 'saved',
    documentStats = {
      paragraphs: 0,
      images: 0,
      tables: 0,
      pages: 1
    }
  } = editorState;

  // Destructure actions from contexts with safe fallbacks
  const {
    setSaveStatus = () => { },
    setLastSaved = () => { },
    setDocumentStats = () => { },
    setDocumentTitle = () => { },
    updateEditorFeatures = () => { },
    updateExportOptions = () => { },
    updateUIState = () => { },
    updateDocumentStats: updateDocumentStatsAction = () => { }
  } = editorActions;

  // State variables
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [headings, setHeadings] = useState([]);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [isStarred, setIsStarred] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);


  // Document management states
  const [documentVersions, setDocumentVersions] = useState([
    {
      id: Date.now(),
      timestamp: new Date(),
      title: 'Initial Version',
      content: '',
      author: 'Current User'
    }
  ]);
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempTitle, setTempTitle] = useState(documentTitle);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Advanced formatting states
  const [paragraphSpacing, setParagraphSpacing] = useState({ before: 0, after: 0 });
  const [indentLevel, setIndentLevel] = useState(0);
  const [textDirection, setTextDirection] = useState('ltr');

  // Headings & Structure states
  const [customHeadingStyles, setCustomHeadingStyles] = useState({});
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  const [activeHeadingLevel, setActiveHeadingLevel] = useState(0);
  const [showHeadingStyles, setShowHeadingStyles] = useState(false);

  // Page Layout & Setup states
  const [pageSize, setPageSize] = useState('A4');
  const [pageOrientation, setPageOrientation] = useState('portrait');
  const [pageMargins, setPageMargins] = useState({
    top: 72,
    bottom: 72,
    left: 72,
    right: 72
  });
  const [columnLayout, setColumnLayout] = useState({
    count: 1,
    spacing: 36,
    equalWidth: true
  });
  const [pageColor, setPageColor] = useState('#ffffff');
  const [showPageSetup, setShowPageSetup] = useState(false);
  const [sectionBreaks, setSectionBreaks] = useState([]);

  // Media Elements states
  const [mediaElements, setMediaElements] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showMediaPanel, setShowMediaPanel] = useState(false);

  // Image Upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageProperties, setImageProperties] = useState({
    width: 'auto',
    height: 'auto',
    alignment: 'left',
    wrap: 'inline',
    rotation: 0,
    opacity: 100,
    borderColor: '#000000',
    borderWidth: 0
  });
  const [watermarks, setWatermarks] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [drawingMode, setDrawingMode] = useState(null);
  const [drawingColor, setDrawingColor] = useState('#000000');
  const [drawingStrokeWidth, setDrawingStrokeWidth] = useState(2);

  // Image insertion states
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageInsertMethod, setImageInsertMethod] = useState('url');
  const [imageUrl, setImageUrl] = useState('');
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [unsplashImages, setUnsplashImages] = useState([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [selectedImageAlt, setSelectedImageAlt] = useState('');
  const [isImageUploading, setIsImageUploading] = useState(false);

  // References & Links states
  const [bookmarks, setBookmarks] = useState([]);
  const [footnotes, setFootnotes] = useState([]);
  const [citations, setCitations] = useState([]);
  const [crossReferences, setCrossReferences] = useState([]);
  const [bibliography, setBibliography] = useState([]);
  const [citationStyle, setCitationStyle] = useState('apa');

  // Additional state variables
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [pages, setPages] = useState([{ id: 1, content: '', height: 0 }]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageContents, setPageContents] = useState(['']);
  const [isPageCalculationLocked, setIsPageCalculationLocked] = useState(false);

  // Pagination memoization refs
  const lastPaginationContentRef = useRef('');
  const paragraphHeightCacheRef = useRef(new Map());

  // Create refs
  const editorRef = useRef(null);
  const contentContainerRef = useRef(null);

  // Debounce refs for performance
  const statsTimeoutRef = useRef(null);
  const paginationTimeoutRef = useRef(null);
  const pagesUpdateTimeoutRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  // Function to calculate content height for a page - FIXED: removed dependencies that cause loops
  const calculateContentHeight = useCallback((htmlContent) => {
    if (!htmlContent || htmlContent.trim() === '') return 0;

    // Check cache first to avoid expensive DOM measurements
    if (paragraphHeightCacheRef.current.has(htmlContent)) {
      return paragraphHeightCacheRef.current.get(htmlContent);
    }

    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `
      position: absolute;
      visibility: hidden;
      width: ${PAGE_WIDTH - (pageMargins.left + pageMargins.right)}px; 
      font-family: var(--athena-font-body);
      font-size: 11pt;
      line-height: 1.5;
      padding: 0;
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    `;

    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);

    const height = tempDiv.offsetHeight;
    document.body.removeChild(tempDiv);

    // Store in cache for future use
    paragraphHeightCacheRef.current.set(htmlContent, height);

    return height;
  }, [pageMargins.left, pageMargins.right]);

  // Function to split content into pages (Google Docs style) - FIXED: removed problematic dependencies
  const splitContentIntoPages = useCallback((fullContent) => {
    if (!fullContent || fullContent.trim() === '') {
      return [{ id: 1, content: '', height: 0 }];
    }

    const maxPageHeight = PAGE_HEIGHT - 144; // Fixed margins
    const pages = [];
    let currentPageContent = '';
    let currentHeight = 0;
    let pageId = 1;

    // Split by paragraphs and process each
    const paragraphs = fullContent.split(/(?=<p[^>]*>|<\/p>|<h[1-6][^>]*>|<\/h[1-6]>|<div[^>]*>|<\/div>|<ul[^>]*>|<\/ul>|<ol[^>]*>|<\/ol>|<li[^>]*>|<\/li>)/gi)
      .filter(p => p.trim().length > 0);

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];

      // Calculate height of this paragraph
      const paragraphHeight = calculateContentHeight(paragraph);

      // If adding this paragraph would exceed page height, start new page
      if (currentHeight + paragraphHeight > maxPageHeight && currentHeight > 0) {
        // Save current page
        pages.push({
          id: pageId,
          content: currentPageContent,
          height: currentHeight
        });

        // Start new page
        pageId++;
        currentPageContent = paragraph;
        currentHeight = paragraphHeight;
      } else {
        // Add to current page
        currentPageContent += paragraph;
        currentHeight += paragraphHeight;
      }

      // If we're at the last paragraph, add the current page
      if (i === paragraphs.length - 1 && currentPageContent.trim()) {
        pages.push({
          id: pageId,
          content: currentPageContent,
          height: currentHeight
        });
      }
    }

    // Ensure at least one page exists
    if (pages.length === 0) {
      pages.push({ id: 1, content: '', height: 0 });
    }

    return pages;
  }, [calculateContentHeight]); // Only depends on calculateContentHeight

  // Update pages when content changes - FIXED: Count physical page breaks
  const updatePages = useCallback((editorInstance) => {
    if (!editorInstance || isPageCalculationLocked) return;

    // Additional guard: check if editor is ready and has state
    if (!editorInstance.state || !editorInstance.state.doc) {
      // Silently return when editor isn't ready - this is normal during initialization
      return;
    }

    setIsPageCalculationLocked(true);

    try {
      let pageBreakCount = 0;
      // Additional safety check
      if (!editorInstance.state.doc) {
        console.warn('Editor doc not available');
        return;
      }
      editorInstance.state.doc.descendants((node) => {
        if (node.type.name === 'pageBreak') pageBreakCount++;
      });

      const totalPages = pageBreakCount + 1;

      if (totalPages !== pages.length) {
        // Create dummy pages array just for the length/indicator
        const newPages = Array.from({ length: totalPages }, (_, i) => ({
          id: i + 1,
          content: '', // Not needed for single-view editor
          height: 1122.5
        }));

        setPages(newPages);

        if (setDocumentStats) {
          setDocumentStats(prev => ({
            ...prev,
            pages: totalPages
          }));
        }
      }
    } catch (error) {
      console.error('Error updating pages:', error);
    } finally {
      setTimeout(() => setIsPageCalculationLocked(false), 100);
    }
  }, [isPageCalculationLocked, pages.length, setDocumentStats]);


  // Main editor instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          HTMLAttributes: {
            class: 'bullet-list',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'ordered-list',
          },
        },
        blockquote: false,
        // Disable extensions we want to configure separately
        underline: false,
        link: false,
        listItem: false,
        codeBlock: false,
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      // Add custom Underline, Link, BulletList, OrderedList, ListItem, CodeBlockLowlight
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),

      ListItem,
      Blockquote.configure({
        HTMLAttributes: {
          class: 'blockquote',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight: createLowlight(common),
      }),
      Highlight.configure({ multicolor: true }),
      Typography,
      CharacterCount,
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
      Placeholder.configure({
        placeholder: 'Start typing or press / for commands...',
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg',
        },
      }),
      ResizableImage,
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'task-item',
        },
        nested: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'table-border-black',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      TableExtension,
      Subscript,
      Superscript,
      Indent,
      PageBreak,
    ],
    content: '',
    editable: true,
    autofocus: true,
    onUpdate: ({ editor: editorInstance }) => {
      try {
        // Mark as modified immediately
        setSaveStatus('modified');

        // 1. Debounced Stats Update (Word count, Headings, Doc stats)
        if (statsTimeoutRef.current) clearTimeout(statsTimeoutRef.current);

        statsTimeoutRef.current = setTimeout(() => {
          if (!editorInstance || !editorInstance.state || !editorInstance.state.doc) return;

          // Word Count & Reading Time
          const text = editorInstance.state.doc.textContent;
          const words = text.trim().split(/\s+/).filter(Boolean).length;
          const characters = text.length;
          const readingTimeMinutes = Math.ceil(words / 200);

          setWordCount(words);
          setCharacterCount(characters);
          setReadingTime(readingTimeMinutes);

          // Combined Descendant Iteration
          const newHeadings = [];
          let paragraphs = 0;
          let images = 0;
          let tables = 0;

          editorInstance.state.doc.descendants((node, pos) => {
            const type = node.type.name;
            if (type === 'heading') {
              newHeadings.push({
                level: node.attrs.level,
                text: node.textContent,
                id: `heading-${pos}`,
              });
            } else if (type === 'paragraph') {
              paragraphs++;
            } else if (type === 'image') {
              images++;
            } else if (type === 'table') {
              tables++;
            }
          });

          setHeadings(newHeadings);

          if (updateDocumentStatsAction) {
            updateDocumentStatsAction(prev => ({
              ...prev,
              paragraphs,
              images,
              tables
            }));
          }
        }, 500);

        // 2. Automatic Pagination Logic
        if (paginationTimeoutRef.current) clearTimeout(paginationTimeoutRef.current);

        paginationTimeoutRef.current = setTimeout(() => {
          if (!editorInstance || !editorInstance.view) return;

          try {
            const { state, view } = editorInstance;
            const { selection } = state;
            const { $from } = selection;

            const coords = view.coordsAtPos($from.pos);
            if (!coords) return;

            const editorElement = view.dom;
            const editorRect = editorElement.getBoundingClientRect();

            const zoomFactor = (zoom || 100) / 100;
            const relativeTop = (coords.top - editorRect.top + editorElement.scrollTop) / zoomFactor;

            const pageHeight = 1122.5;
            const gapHeight = 40;
            const totalPageHeight = pageHeight + gapHeight;
            const positionInPage = relativeTop % totalPageHeight;
            const threshold = pageHeight - pageMargins.bottom - 10;

            if (positionInPage > threshold && positionInPage < pageHeight) {
              const splitPos = $from.parent.type.name !== 'paragraph' ? $from.before() : $from.pos;
              let hasPageBreakNearby = false;
              state.doc.nodesBetween(Math.max(0, splitPos - 5), Math.min(state.doc.content.size, splitPos + 5), (node) => {
                if (node.type.name === 'pageBreak') hasPageBreakNearby = true;
              });

              if (!hasPageBreakNearby) {
                editorInstance.chain().focus().insertContentAt(splitPos, { type: 'pageBreak' }).run();
              }
            }
          } catch (e) {
            // Coords might not be available yet or other view issues
          }
        }, 300);

        // 3. Page Structure Update
        if (pagesUpdateTimeoutRef.current) clearTimeout(pagesUpdateTimeoutRef.current);

        pagesUpdateTimeoutRef.current = setTimeout(() => {
          if (editorInstance && editorInstance.state && editorInstance.state.doc) {
            updatePages(editorInstance);
          }
        }, 500);

        // 4. Auto Save
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

        autoSaveTimeoutRef.current = setTimeout(() => {
          handleAutoSave();
        }, 3000);

      } catch (error) {
        console.error('Error in onUpdate:', error);
      }
    },

    onSelectionUpdate: ({ editor: editorInstance }) => {
      const { from, to } = editorInstance.state.selection;
      if (from !== to) {
        const text = editorInstance.state.doc.textBetween(from, to, ' ');
        setSelectedText(text);
      } else {
        setSelectedText('');
      }

      // Update active heading level based on current selection
      if (from === to) {
        // Cursor is at a single position
        const node = editorInstance.state.doc.nodeAt(from);
        if (node && node.type.name === 'heading') {
          setActiveHeadingLevel(node.attrs.level);
        } else {
          setActiveHeadingLevel(0);
        }
      } else {
        // There's a selection
        let foundHeadingLevel = 0;
        editorInstance.state.doc.nodesBetween(from, to, (node) => {
          if (node.type.name === 'heading') {
            foundHeadingLevel = node.attrs.level;
            return false; // Stop iteration
          }
          return true;
        });
        setActiveHeadingLevel(foundHeadingLevel);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[600px] table-border-black',
        spellcheck: 'true',
        'data-testid': 'editor-content'
      },
      handleKeyDown: (view, event) => {
        // Handle slash commands
        if (event.key === '/' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          updateEditorFeatures({ isAISidebarOpen: true });
          return true;
        }

        // Handle Enter key in lists
        if (event.key === 'Enter' && !event.shiftKey) {
          const { state } = view;
          const { $from } = state.selection;
          const parent = $from.node(-1);

          if (parent && (parent.type.name === 'listItem')) {
            // If we're in an empty list item, break out of the list
            if ($from.parent.content.size === 0) {
              event.preventDefault();
              if (editor) {
                editor.chain().focus().liftListItem('listItem').run();
                return true;
              }
            }
          }
        }

        // Handle Tab and Shift+Tab for list indentation
        if (event.key === 'Tab') {
          event.preventDefault();
          if (editor) {
            if (event.shiftKey) {
              editor.chain().focus().liftListItem('listItem').run();
            } else {
              editor.chain().focus().sinkListItem('listItem').run();
            }
            return true;
          }
        }

        return false;
      }
    },
  });

  // Store editor reference
  useEffect(() => {
    if (editor) {
      editorRef.current = editor;

      // Load initial content
      const savedContent = localStorage.getItem('text-editor-document');
      if (savedContent) {
        try {
          const parsed = JSON.parse(savedContent);
          editor.commands.setContent(parsed.html || '');
          if (parsed.title) {
            setDocumentTitle(parsed.title);
          }
        } catch (error) {
          console.error('Error loading saved content:', error);
        }
      }
    }
  }, [editor]); // Removed setDocumentTitle to prevent infinite loop

  // Custom clipboard handlers
  const handleCopy = useCallback(async () => {
    if (!editor) return;

    try {
      const { from, to } = editor.state.selection;

      if (from === to) {
        toast.info('Nothing selected to copy');
        return;
      }

      const text = editor.state.doc.textBetween(from, to, ' ');

      if (navigator.clipboard && window.ClipboardItem) {
        try {
          const clipboardItem = new ClipboardItem({
            'text/plain': new Blob([text], { type: 'text/plain' })
          });

          await navigator.clipboard.write([clipboardItem]);
          toast.success('Content copied to clipboard');
        } catch (err) {
          console.error('Clipboard API failed:', err);
          document.execCommand('copy');
          toast.success('Content copied to clipboard');
        }
      } else {
        document.execCommand('copy');
        toast.success('Content copied to clipboard');
      }
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy content');
    }
  }, [editor]);

  const handlePaste = useCallback(async (event) => {
    if (!editor) return;

    try {
      event.preventDefault();

      let pastedText = '';

      if (navigator.clipboard && window.ClipboardItem) {
        try {
          const clipboardItems = await navigator.clipboard.read();
          for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {
              if (type === 'text/html') {
                const blob = await clipboardItem.getType(type);
                pastedText = await blob.text();
                break;
              } else if (type === 'text/plain' && !pastedText) {
                const blob = await clipboardItem.getType(type);
                pastedText = await blob.text();
              }
            }
            if (pastedText) break;
          }
        } catch (error) {
          console.error('Clipboard API failed:', error);
          pastedText = event.clipboardData?.getData('text/plain') || '';
        }
      } else {
        pastedText = event.clipboardData?.getData('text/plain') || '';
      }

      if (pastedText) {
        editor.chain().focus().insertContent(pastedText).run();
        toast.success('Content pasted successfully');
      }
    } catch (error) {
      console.error('Paste error:', error);
      toast.error('Failed to paste content');
    }
  }, [editor]);

  // Enhanced insertImage function that uses ResizableImage extension with fallbacks
  const insertImage = useCallback((src, alt = '', width = 400, height = 300, options = {}) => {
    if (!editor || !src) {
      console.error('Editor not ready or image source not provided');
      toast.error('Cannot insert image');
      return;
    }

    try {
      // Try using the ResizableImage extension first
      editor.chain().focus().setResizableImage({
        src: src,
        alt: alt,
        title: alt || 'Image',
        width: width,
        height: height,
        originalWidth: width,
        originalHeight: height,
        align: 'left',
        ...options
      }).run();

      toast.success('Image inserted successfully');
      setShowImageModal(false);

      // Update document stats
      updateDocumentStatsAction(prev => ({
        ...prev,
        images: prev.images + 1
      }));
    } catch (error) {
      console.error('Resizable image insertion failed:', error);

      try {
        // Fallback to regular Image extension
        editor.chain().focus().setImage({
          src: src,
          alt: alt,
          title: alt || 'Image',
          ...options
        }).run();

        toast.success('Image inserted (using fallback)');
        setShowImageModal(false);

        // Update document stats
        updateDocumentStatsAction(prev => ({
          ...prev,
          images: prev.images + 1
        }));
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);

        try {
          // Last resort: insert as HTML
          editor.chain().focus().insertContent(
            `<img src="${src}" alt="${alt || 'Image'}" width="${width}" height="${height}" style="max-width: 100%; height: auto;" />`
          ).run();

          toast.success('Image inserted (as HTML)');
          setShowImageModal(false);

          // Update document stats
          updateDocumentStatsAction(prev => ({
            ...prev,
            images: prev.images + 1
          }));
        } catch (htmlError) {
          console.error('HTML insertion failed:', htmlError);
          toast.error('Failed to insert image. Please check your editor configuration.');
        }
      }
    }
  }, [editor, updateDocumentStatsAction]);

  // Function to handle multiple image uploads
  const handleMultipleImageUpload = useCallback(async (event) => {
    try {
      const files = Array.from(event.target.files);

      if (!files || files.length === 0) {
        toast.error('❌ No files selected');
        return;
      }

      toast.loading(`🔍 Processing ${files.length} file(s)...`);

      const validFiles = files.filter(file => {
        const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'].includes(file.type);
        const isValidSize = file.size <= 10 * 1024 * 1024;

        if (!isValidType) {
          toast.error(`❌ Skipped ${file.name}: Invalid file type. Supported: JPG, PNG, GIF, WebP, SVG, BMP`);
        }
        if (!isValidSize) {
          toast.error(`❌ Skipped ${file.name}: File too large. Maximum size: 10MB`);
        }

        return isValidType && isValidSize;
      });

      if (validFiles.length === 0) {
        toast.dismiss();
        toast.error('⚠️ No valid images to upload. Please check file types and sizes.');
        return;
      }

      toast.dismiss();
      toast.success(`✅ ${validFiles.length} valid image(s) ready for upload`);

      // Set selected files
      setSelectedFiles(prev => [...prev, ...validFiles]);

      // Create preview for the first newly added image if no preview exists
      if (validFiles[0] && !imagePreview) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(validFiles[0]);
      }

    } catch (error) {
      console.error('Multiple image upload error:', error);
      toast.dismiss();
      toast.error('❌ Failed to process selected files. Please try again.');
    }
  }, [imagePreview]);

  // Function to handle image URL insertion with enhanced validation and feedback
  const handleImageUrlSubmit = useCallback(() => {
    try {
      if (!imageUrl.trim()) {
        toast.error('❌ Please enter an image URL');
        return;
      }

      // Basic URL validation
      let validUrl = '';
      try {
        const url = new URL(imageUrl);
        validUrl = imageUrl;
      } catch (error) {
        // If URL parsing fails, try adding https:// prefix
        try {
          const urlWithProtocol = imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`;
          new URL(urlWithProtocol);
          validUrl = urlWithProtocol;
        } catch (innerError) {
          toast.error('❌ Please enter a valid URL (e.g., https://example.com/image.jpg)');
          return;
        }
      }

      // Show loading state
      toast.loading('📥 Inserting image from URL...');

      // Test if the URL is accessible
      const img = new Image();
      img.onload = () => {
        toast.dismiss();
        insertImage(validUrl, selectedImageAlt || 'Image from URL');
        setImageUrl('');
        setSelectedImageAlt('');
        toast.success('✅ Image inserted successfully!');
      };

      img.onerror = () => {
        toast.dismiss();
        toast.error('❌ Could not load image from URL. Please check if the URL is correct and accessible.');
      };

      img.src = validUrl;

    } catch (error) {
      console.error('URL image insertion error:', error);
      toast.dismiss();
      toast.error('❌ Failed to insert image. Please try again.');
    }
  }, [imageUrl, selectedImageAlt, insertImage]);

  // Enhanced image upload functions
  const handleImageUpload = useCallback(async (event) => {
    try {
      const files = Array.from(event.target.files);

      if (!files || files.length === 0) {
        toast.error('No file selected');
        return;
      }

      // Validate all files
      const validFiles = files.filter(file => {
        const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'].includes(file.type);
        const isValidSize = file.size <= 10 * 1024 * 1024;

        if (!isValidType) {
          toast.error(`❌ Skipped ${file.name}: Invalid file type. Supported: JPG, PNG, GIF, WebP, SVG, BMP`);
        }
        if (!isValidSize) {
          toast.error(`❌ Skipped ${file.name}: File too large. Maximum size: 10MB`);
        }

        return isValidType && isValidSize;
      });

      if (validFiles.length === 0) {
        toast.error('⚠️ No valid images to upload. Please check file types and sizes.');
        return;
      }

      // Set selected files and show preview
      setSelectedFiles(validFiles);

      // Create preview for the first image
      if (validFiles[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(validFiles[0]);
      }

      toast.success(`✅ ${validFiles.length} valid image(s) selected. Click "Insert Image" to upload.`);
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('❌ Failed to process selected files. Please try again.');
    }
  }, []);

  // New function to confirm and insert selected images
  const confirmImageUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error('No images selected');
      return;
    }

    setIsImageUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      try {
        // Create a temporary URL for the image
        const imageUrl = URL.createObjectURL(file);

        // Get image dimensions
        const img = new Image();

        await new Promise((resolve, reject) => {
          img.onload = () => {
            const width = img.width;
            const height = img.height;

            // Insert the image into the editor
            insertImage(imageUrl, file.name, width, height, {
              fileName: file.name,
              fileSize: file.size,
              originalWidth: width,
              originalHeight: height
            });

            // Update progress
            setUploadProgress(((i + 1) / selectedFiles.length) * 100);

            // Clean up the object URL
            setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
            resolve();
          };

          img.onerror = () => {
            // If we can't get dimensions, use default
            insertImage(imageUrl, file.name, 400, 300, {
              fileName: file.name,
              fileSize: file.size
            });

            // Update progress
            setUploadProgress(((i + 1) / selectedFiles.length) * 100);

            // Clean up the object URL
            setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
            resolve();
          };

          img.src = imageUrl;
        });

        // Small delay between inserts
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    // Reset states
    setIsImageUploading(false);
    setUploadProgress(0);
    setSelectedFiles([]);
    setImagePreview('');

    toast.success(`Successfully uploaded ${selectedFiles.length} image(s)`);

    // Close modal if all uploads are complete
    setTimeout(() => {
      if (selectedFiles.length > 0) {
        setShowImageModal(false);
      }
    }, 1000);
  }, [selectedFiles, insertImage]);

  // Function to remove a selected file
  const removeSelectedFile = useCallback((index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    // Update preview if we removed the first image
    if (index === 0 && newFiles.length > 0) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(newFiles[0]);
    } else if (newFiles.length === 0) {
      setImagePreview('');
    }
  }, [selectedFiles]);

  // Function to clear all selected files
  const clearSelectedFiles = useCallback(() => {
    setSelectedFiles([]);
    setImagePreview('');
  }, []);

  // Function to handle quick image insertion
  const handleQuickImageInsert = useCallback((url, alt = '') => {
    setImageUrl(url);
    setSelectedImageAlt(alt);
    handleImageUrlSubmit();
  }, [handleImageUrlSubmit]);

  // Function to test image insertion (for debugging) with enhanced feedback
  const testImageInsertion = useCallback(() => {
    try {
      if (!editor) {
        toast.error('❌ Editor not ready. Please wait for the editor to load.');
        return;
      }

      const testImageUrl = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&auto=format&fit=crop';

      toast.loading('🧪 Testing image insertion...');

      // Test with ResizableImage
      editor.chain().focus().setResizableImage({
        src: testImageUrl,
        alt: 'Test image',
        width: 400,
        height: 300,
        align: 'left'
      }).run();

      toast.dismiss();
      toast.success('✅ Test image inserted successfully with ResizableImage extension!');

      // Close modal after successful test
      setTimeout(() => setShowImageModal(false), 1500);

    } catch (error) {
      console.error('ResizableImage test failed:', error);
      toast.dismiss();

      try {
        // Fallback to regular Image
        editor.chain().focus().setImage({
          src: testImageUrl,
          alt: 'Test image'
        }).run();

        toast.success('✅ Test image inserted successfully with regular Image extension!');

        // Close modal after successful test
        setTimeout(() => setShowImageModal(false), 1500);

      } catch (fallbackError) {
        console.error('Regular Image test failed:', fallbackError);
        toast.error('❌ Test insertion failed. Please check console for technical details.');
      }
    }
  }, [editor]);

  // Page management functions
  const addNewPage = useCallback(() => {
    if (editor) {
      // Insert a page break to simulate a new page
      editor.chain().focus().setHorizontalRule().run();
      // Add a page marker for better page management
      editor.chain().focus().insertContent('<div data-page-marker="true" style="page-break-after: always; height: 1px; background: transparent;"></div>').run();
      toast.success('New page added');
    }
  }, [editor]);

  const addPageBreak = useCallback(() => {
    if (editor) {
      editor.chain().focus().setHorizontalRule().run();
      toast.success('Page break inserted');
    }
  }, [editor]);

  const insertPageNumber = useCallback(() => {
    if (editor) {
      const currentPageNumber = pages.findIndex(page => page.id === currentPage) + 1;
      editor.chain().focus().insertContent(
        `<span data-page-number="${currentPageNumber}" style="user-select: none; color: #666; font-size: 12px;">${currentPageNumber}</span>`
      ).run();
      toast.success(`Page ${currentPageNumber} number inserted`);
    }
  }, [editor, pages, currentPage]);

  const goToPage = useCallback((pageNumber) => {
    if (pageNumber < 1 || pageNumber > pages.length) {
      toast.error(`Invalid page number. Please enter between 1 and ${pages.length}`);
      return;
    }

    setCurrentPage(pageNumber);

    // Scroll to the page
    const pageElement = document.getElementById(`page-${pageNumber}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    toast.success(`Navigated to page ${pageNumber}`);
  }, [pages]);

  const handleAutoSave = useCallback(() => {
    if (!editor) return;

    try {
      const content = {
        title: documentTitle,
        html: editor.getHTML(),
        savedAt: new Date().toISOString(),
        metadata: {
          wordCount,
          characterCount,
          lastModified: new Date().toISOString()
        }
      };

      localStorage.setItem('text-editor-document', JSON.stringify(content));
      setLastSaved(new Date());
      setSaveStatus('saved');
      toast.success('Document auto-saved!');
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }, [editor, documentTitle, wordCount, characterCount, setLastSaved, setSaveStatus]);

  const handleSave = useCallback(() => {
    if (!editor) return;

    try {
      const content = {
        title: documentTitle,
        html: editor.getHTML(),
        savedAt: new Date().toISOString(),
        metadata: {
          wordCount,
          characterCount,
          lastModified: new Date().toISOString()
        }
      };

      localStorage.setItem('text-editor-document', JSON.stringify(content));

      setLastSaved(new Date());
      setSaveStatus('saved');
      toast.success('Document saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save document');
    }
  }, [editor, documentTitle, wordCount, characterCount, setLastSaved, setSaveStatus]);

  const handlePrint = useCallback(async () => {
    if (!editor) return;

    try {
      await DocumentExporter.printDocument(editor, {
        title: documentTitle || 'Document'
      });
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print document');
    }
  }, [editor, documentTitle]);

  const handleExport = useCallback(async () => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }

    // Check if editor has content before attempting export
    const editorContent = editor.getHTML();
    if (!editorContent || editorContent === '<p></p>' || editorContent.trim() === '<p></p>') {
      toast.error('Cannot export: Document is empty');
      updateEditorFeatures({ showExportDialog: false });
      return;
    }

    const options = {
      filename: `${documentTitle || 'document'}.${exportFormat}`,
      includePageNumbers: exportOptions.includePageNumbers,
      includeHeader: exportOptions.includeHeader,
      includeFooter: exportOptions.includeFooter,
      title: documentTitle || 'My Document'
    };

    try {
      switch (exportFormat) {
        case 'pdf':
          if (exportLoading.pdf) {
            toast.info('PDF export is already in progress');
            return;
          }
          await exportToPDF(editor, options);
          break;
        case 'docx':
          if (exportLoading.docx) {
            toast.info('DOCX export is already in progress');
            return;
          }
          await exportToDOCX(editor, options);
          break;
        case 'epub':
          if (exportLoading.epub) {
            toast.info('EPUB export is already in progress');
            return;
          }
          await exportToEPUB(editor, options);
          break;
        case 'md':
          if (exportLoading.md) {
            toast.info('Markdown export is already in progress');
            return;
          }
          await exportToMarkdown(editor, options);
          break;
        case 'txt':
          if (exportLoading.txt) {
            toast.info('Plain text export is already in progress');
            return;
          }
          await exportToPlainText(editor, options);
          break;
        case 'html':
          if (exportLoading.html) {
            toast.info('HTML export is already in progress');
            return;
          }
          await exportToHTML(editor, options);
          break;
        case 'json':
          if (exportLoading.json) {
            toast.info('JSON export is already in progress');
            return;
          }
          await exportToJSON(editor, options);
          break;
        default:
          toast.error(`Unsupported export format: ${exportFormat}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      // Close export dialog after processing
      updateEditorFeatures({ showExportDialog: false });
    }
  }, [editor, documentTitle, exportFormat, exportOptions, exportLoading, updateEditorFeatures, exportToPDF, exportToDOCX, exportToEPUB, exportToJSON, exportToMarkdown, exportToPlainText, exportToHTML]);

  const handleAIGenerate = useCallback(async (content) => {
    if (!editor) return;

    try {
      if (content.startsWith('API:')) {
        const prompt = content.substring(4);
        toast.info(`Generating content for: "${prompt}"`);
        editor.chain().focus().insertContent(`<p>${prompt} - AI generated content would appear here.</p>`).run();
      } else {
        editor.chain().focus().insertContent(content).run();
      }
      updateEditorFeatures({ isAISidebarOpen: false });
    } catch (error) {
      console.error('AI generate error:', error);
      toast.error('Failed to generate content');
    }
  }, [editor, updateEditorFeatures]);

  const handleTransformText = useCallback(async (action, result) => {
    if (!editor) return;

    try {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        editor.chain().focus().deleteRange({ from, to }).insertContent(result).run();
        toast.success(`Text ${action}ed successfully!`);
      }
    } catch (error) {
      console.error('Transform text error:', error);
      toast.error('Failed to transform text');
    }
  }, [editor]);

  const handleHeadingClick = useCallback((id) => {
    if (!editor) return;

    try {
      const pos = parseInt(id.replace('heading-', ''));
      editor.chain().focus().setTextSelection(pos).run();
    } catch (error) {
      console.error('Heading click error:', error);
    }
  }, [editor]);

  const handleZoomChange = useCallback((newZoom) => {
    updateUIState({ zoom: newZoom });
  }, [updateUIState]);

  const handleTemplateSelect = useCallback((template) => {
    if (editor) {
      try {
        editor.commands.setContent(template.content);
        setDocumentTitle(template.name);
        toast.success(`Template "${template.name}" applied!`);
      } catch (error) {
        console.error('Template select error:', error);
        toast.error('Failed to apply template');
      }
    }
  }, [editor, setDocumentTitle]);

  const openExportDialog = useCallback(() => {
    updateEditorFeatures({ showExportDialog: true });
  }, [updateEditorFeatures]);

  // Document Management Functions
  const handleRenameDocument = useCallback(() => {
    if (isRenaming) {
      setDocumentTitle(tempTitle);
      setIsRenaming(false);
      toast.success('Document renamed successfully');
    } else {
      setTempTitle(documentTitle);
      setIsRenaming(true);
    }
  }, [isRenaming, tempTitle, documentTitle, setDocumentTitle]);

  const handleDeleteDocument = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      try {
        editor?.commands.clearContent();
        setDocumentTitle('Untitled Document');
        localStorage.removeItem('text-editor-document');
        toast.success('Document deleted');
      } catch (error) {
        console.error('Delete document error:', error);
        toast.error('Failed to delete document');
      }
    }
  }, [editor, setDocumentTitle]);

  const handleRestoreVersion = useCallback((versionId) => {
    const version = documentVersions.find(v => v.id === versionId);
    if (version && editor) {
      try {
        editor.commands.setContent(version.content);
        setDocumentTitle(version.title);
        toast.success(`Restored version from ${version.timestamp.toLocaleString()}`);
        setShowVersionHistory(false);
      } catch (error) {
        console.error('Restore version error:', error);
        toast.error('Failed to restore version');
      }
    }
  }, [editor, documentVersions, setDocumentTitle]);

  // Advanced Formatting Functions
  const handleLineSpacing = useCallback((spacing) => {
    setLineSpacing(spacing);
    if (editor) {
      editor.commands.updateAttributes('paragraph', { lineHeight: spacing });
      editor.commands.updateAttributes('heading', { lineHeight: spacing });
    }
    toast.success(`Line spacing set to ${spacing}`);
  }, [editor]);

  const handleIndent = useCallback((direction) => {
    if (!editor) return;

    if (direction === 'increase') {
      setIndentLevel(prev => prev + 1);
      editor.commands.sinkListItem('listItem');
    } else {
      setIndentLevel(prev => Math.max(0, prev - 1));
      editor.commands.liftListItem('listItem');
    }
  }, [editor]);

  const handleTextDirection = useCallback((direction) => {
    setTextDirection(direction);
    if (editor) {
      editor.commands.setTextAlign(direction === 'rtl' ? 'right' : 'left');
    }
    toast.success(`Text direction set to ${direction.toUpperCase()}`);
  }, [editor]);

  const handleParagraphSpacing = useCallback((type, value) => {
    setParagraphSpacing(prev => ({
      ...prev,
      [type]: value
    }));

    if (editor) {
      const style = `${type === 'before' ? 'margin-top' : 'margin-bottom'}: ${value}px`;
      editor.commands.updateAttributes('paragraph', { style });
    }
  }, [editor]);

  // Headings & Structure Functions
  const handleHeadingChange = useCallback((level) => {
    if (!editor) return;

    try {
      if (level === 0) {
        editor.chain().focus().setParagraph().run();
      } else {
        editor.chain().focus().toggleHeading({ level }).run();
      }

      setActiveHeadingLevel(level);
      toast.success(`Heading level ${level === 0 ? 'Normal' : level} applied`);
    } catch (error) {
      console.error('Heading change error:', error);
    }
  }, [editor]);

  // Toggle functions for lists and blockquote
  const toggleBulletList = useCallback(() => {
    if (!editor) {
      console.error('Editor not available');
      toast.error('Editor not ready');
      return;
    }

    try {
      const isActive = editor.isActive('bulletList');

      if (isActive) {
        // If bullet list is active, turn it off
        editor.chain().focus().toggleBulletList().run();
        toast.success('Bullet list disabled');
      } else {
        // If ordered list is active, turn it off first
        if (editor.isActive('orderedList')) {
          editor.chain().focus().toggleOrderedList().run();
        }

        // Then turn on bullet list
        editor.chain().focus().toggleBulletList().run();

        // Apply automatic indentation for better visual structure (Google Docs style)
        setTimeout(() => {
          if (editor.isActive('bulletList')) {
            // Apply small indent to make list items visually distinct
            editor.chain().focus().updateAttributes('listItem', { indent: 1 }).run();
          }
        }, 50);

        toast.success('Bullet list enabled with indentation');
      }
    } catch (error) {
      console.error('Error toggling bullet list:', error);
      toast.error('Failed to toggle bullet list');
    }
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    if (!editor) {
      console.error('Editor not available');
      toast.error('Editor not ready');
      return;
    }

    try {
      const isActive = editor.isActive('orderedList');

      if (isActive) {
        // If ordered list is active, turn it off
        editor.chain().focus().toggleOrderedList().run();
        toast.success('Numbered list disabled');
      } else {
        // If bullet list is active, turn it off first
        if (editor.isActive('bulletList')) {
          editor.chain().focus().toggleBulletList().run();
        }

        // Then turn on ordered list
        editor.chain().focus().toggleOrderedList().run();

        // Apply automatic indentation for better visual structure (Google Docs style)
        setTimeout(() => {
          if (editor.isActive('orderedList')) {
            // Apply small indent to make list items visually distinct
            editor.chain().focus().updateAttributes('listItem', { indent: 1 }).run();
          }
        }, 50);

        toast.success('Numbered list enabled with indentation');
      }
    } catch (error) {
      console.error('Error toggling ordered list:', error);
      toast.error('Failed to toggle numbered list');
    }
  }, [editor]);

  const toggleTaskList = useCallback(() => {
    if (!editor) return;

    try {
      editor.chain().focus().toggleTaskList().run();

      // Apply automatic indentation for better visual structure (Google Docs style)
      setTimeout(() => {
        if (editor.isActive('taskList')) {
          // Apply small indent to make task list items visually distinct
          editor.chain().focus().updateAttributes('listItem', { indent: 1 }).run();
        }
      }, 50);

      toast.success('Task list enabled with indentation');
    } catch (error) {
      console.error('Error toggling task list:', error);
      toast.error('Failed to toggle task list');
    }
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    if (!editor) return;

    try {
      editor.chain().focus().toggleUnderline().run();
      toast.success('Underline toggled');
    } catch (error) {
      console.error('Error toggling underline:', error);
      toast.error('Failed to toggle underline');
    }
  }, [editor]);

  const toggleBlockquote = useCallback(() => {
    if (!editor) {
      console.error('Editor not available');
      toast.error('Editor not ready');
      return;
    }

    try {
      const isActive = editor.isActive('blockquote');

      if (isActive) {
        // If blockquote is active, turn it off
        editor.chain().focus().toggleBlockquote().run();
        toast.success('Blockquote disabled');
      } else {
        // If we're in a list, lift out of it first
        if (editor.isActive('listItem')) {
          editor.chain().focus().liftListItem('listItem').run();
        }

        // Then turn on blockquote
        editor.chain().focus().toggleBlockquote().run();
        toast.success('Blockquote enabled');
      }
    } catch (error) {
      console.error('Error toggling blockquote:', error);
      toast.error('Failed to toggle blockquote');
    }
  }, [editor]);

  const saveCustomHeadingStyle = useCallback((level, styles) => {
    setCustomHeadingStyles(prev => ({
      ...prev,
      [level]: styles
    }));

    // Apply styles to existing headings of this level
    if (editor) {
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading' && node.attrs.level === level) {
          editor.commands.updateAttributes('heading', styles);
        }
      });
    }

    toast.success(`Custom style saved for Heading ${level}`);
  }, [editor]);

  const toggleSectionCollapse = useCallback((headingId) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(headingId)) {
        newSet.delete(headingId);
      } else {
        newSet.add(headingId);
      }
      return newSet;
    });
  }, []);

  const applyHeadingStyle = useCallback((level) => {
    const customStyle = customHeadingStyles[level];
    if (customStyle && editor) {
      editor.commands.updateAttributes('heading', customStyle);
      toast.success(`Applied custom style to Heading ${level}`);
    }
  }, [customHeadingStyles, editor]);

  // Page Layout & Setup Functions
  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    toast.success(`Page size changed to ${size}`);
  }, []);

  const handleOrientationChange = useCallback((orientation) => {
    setPageOrientation(orientation);
    toast.success(`Page orientation changed to ${orientation}`);
  }, []);

  const handleMarginChange = useCallback((side, value) => {
    setPageMargins(prev => ({
      ...prev,
      [side]: value
    }));
    toast.success(`${side.charAt(0).toUpperCase() + side.slice(1)} margin updated`);
  }, []);

  const handleColumnChange = useCallback((property, value) => {
    setColumnLayout(prev => ({
      ...prev,
      [property]: value
    }));
    toast.success(`Column ${property} updated`);
  }, []);

  const handlePageColorChange = useCallback((color) => {
    setPageColor(color);
    toast.success('Page color updated');
  }, []);

  const addSectionBreak = useCallback((type = 'next-page') => {
    const newBreak = {
      id: Date.now(),
      type: type,
      position: editor?.state.selection.from || 0,
      timestamp: new Date()
    };

    setSectionBreaks(prev => [...prev, newBreak]);
    toast.success(`Section break (${type}) added`);

    // In a real implementation, this would insert a section break node
    if (editor) {
      editor.chain().focus().setHorizontalRule().run();
    }
  }, [editor]);

  // Media Elements Functions
  const addImageFromUrl = useCallback(() => {
    const url = prompt('Enter image URL:');
    if (url && editor) {
      try {
        editor.chain().focus().setImage({ src: url }).run();
        toast.success('Image added from URL');
      } catch (error) {
        console.error('Error inserting image:', error);
        toast.error('Failed to insert image');
      }
    }
  }, [editor]);

  const addLocalImage = useCallback(async (file) => {
    if (!file || !editor) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result;
        if (imageDataUrl && editor) {
          try {
            editor.chain().focus().setImage({ src: imageDataUrl }).run();
            toast.success(`Image "${file.name}" added`);
          } catch (error) {
            console.error('Error inserting image:', error);
            toast.error('Failed to insert image');
          }
        }
      };
      reader.onerror = () => {
        toast.error('Failed to read image file');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to add image');
    }
  }, [editor]);

  const addWatermark = useCallback((text, options = {}) => {
    const newWatermark = {
      id: Date.now(),
      type: 'watermark',
      content: text,
      ...options,
      position: 'background',
      opacity: options.opacity || 20,
      rotation: options.rotation || -45
    };

    setWatermarks(prev => [...prev, newWatermark]);
    toast.success(`Watermark "${text}" added`);
  }, []);

  const addShape = useCallback((shapeType, properties = {}) => {
    const newShape = {
      id: Date.now(),
      type: 'shape',
      shapeType: shapeType,
      properties: {
        color: drawingColor,
        strokeWidth: drawingStrokeWidth,
        ...properties
      },
      position: editor?.state.selection.from || 0
    };

    setShapes(prev => [...prev, newShape]);
    setDrawingMode(null);
    toast.success(`${shapeType} shape added`);
  }, [editor, drawingColor, drawingStrokeWidth]);

  const startDrawing = useCallback((mode) => {
    setDrawingMode(mode);
    toast.info(`Drawing mode: ${mode}. Click and drag to draw.`);
  }, []);

  const groupSelectedElements = useCallback(() => {
    if (selectedMedia && selectedMedia.length > 1) {
      const groupId = Date.now();
      const groupedElements = selectedMedia.map(id => ({
        ...mediaElements.find(m => m.id === id),
        groupId
      }));

      setMediaElements(prev => [
        ...prev.filter(m => !selectedMedia.includes(m.id)),
        ...groupedElements
      ]);

      toast.success(`Grouped ${selectedMedia.length} elements`);
    }
  }, [selectedMedia, mediaElements]);

  const ungroupElements = useCallback((groupId) => {
    setMediaElements(prev =>
      prev.map(media =>
        media.groupId === groupId
          ? { ...media, groupId: undefined }
          : media
      )
    );
    toast.success('Elements ungrouped');
  }, []);

  const handleInsertImage = useCallback(() => {
    setShowImageModal(true);
    setImageInsertMethod('url');
    setImageUrl('');
    setImageSearchQuery('');
    setSelectedImageAlt('');
  }, []);

  // Clean up on unmount - FIXED: Add pagesUpdateTimeout cleanup
  useEffect(() => {
    return () => {
      clearTimeout(window.autoSaveTimer);
      clearTimeout(window.pagesUpdateTimeout);
      clearTimeout(window.paginationTimeout);
    };
  }, []);

  // Clear pagination cache when layout changes
  useEffect(() => {
    if (paragraphHeightCacheRef.current) {
      paragraphHeightCacheRef.current.clear();
    }
    lastPaginationContentRef.current = '';

    // Trigger update if editor exists
    if (editor) {
      updatePages(editor);
    }
  }, [pageSize, pageOrientation, pageMargins, editor, updatePages]);

  // Render the editor content
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Google Docs-style Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          {/* Document Icon */}
          <div className="w-10 h-10 flex items-center justify-center">
            <FileText className="w-8 h-8 text-blue-500" />
          </div>

          {/* Document Title Input */}
          <div className="flex flex-col">
            <Input
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Document Title"
              className="text-lg font-medium w-75 border-none focus:ring-0 focus:outline-none px-2 py-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last edit was {lastSaved.toLocaleTimeString()}
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsStarred(!isStarred)}
          >
            <Star className={`w-4 h-4 ${isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOutlineOpen(!isOutlineOpen)}
          >
            <FolderOpen className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8">
            <History className="w-4 h-4" onClick={() => setShowVersionHistory(true)} />
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MessageSquare className="w-4 h-4" />
          </Button>

          <Button
            onClick={handleSave}
            size="sm"
            className="h-8 bg-linear-to-r from-amber-400 to-amber-500 text-black hover:from-amber-500 hover:to-amber-600 transition-all duration-300"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>

          <Button
            onClick={openExportDialog}
            size="sm"
            className="h-8 bg-linear-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>

          <Button
            onClick={handleDeleteDocument}
            variant="ghost"
            size="sm"
            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
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
        setIsAISidebarOpen={(open) => updateEditorFeatures({ isAISidebarOpen: open })}
        isAISidebarOpen={isAISidebarOpen}
        documentTitle={documentTitle}
        addNewPage={addNewPage}
        addPageBreak={addPageBreak}
        insertPageNumber={insertPageNumber}
        handleHeadingChange={handleHeadingChange}
        activeHeadingLevel={activeHeadingLevel}
        toggleBulletList={toggleBulletList}
        toggleOrderedList={toggleOrderedList}
        toggleTaskList={toggleTaskList}
        toggleUnderline={toggleUnderline}
        toggleBlockquote={toggleBlockquote}

        openExportDialog={openExportDialog}
        exportLoading={exportLoading}
        setIsTemplateSidebarOpen={(open) => updateEditorFeatures({ showTemplateSidebar: open })}
        isTemplateSidebarOpen={showTemplateSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Outline */}
        <DocumentOutline
          isOpen={isOutlineOpen}
          onClose={() => setIsOutlineOpen(false)}
          headings={headings}
          onHeadingClick={handleHeadingClick}
          documentTitle={documentTitle}
          collapsedSections={collapsedSections}
          onToggleCollapse={toggleSectionCollapse}
        />

        {/* Editor Area - Single editor for all pages */}
        <div
          ref={contentContainerRef}
          className="flex-1 overflow-auto bg-slate-100/50 custom-scrollbar hidden-scrollbar"
          onPaste={handlePaste}
          onCopy={handleCopy}
        >
          <div className="editor-pages-container">
            {/* Single editor that spans all pages and fits into a repeating CSS background */}
            {editor && (
              <div
                className="editor-workspace-scaled"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                  '--page-margin-top': `${pageMargins.top}px`,
                  '--page-margin-bottom': `${pageMargins.bottom}px`,
                  '--page-margin-left': `${pageMargins.left}px`,
                  '--page-margin-right': `${pageMargins.right}px`,
                  '--page-gap': '40px'
                }}
              >
                {/* Editor Content Overlay */}
                <div
                  className="relative z-10 w-full"
                  style={{
                    paddingTop: `${pageMargins.top}px`,
                    paddingLeft: `${pageMargins.left}px`,
                    paddingRight: `${pageMargins.right}px`,
                    paddingBottom: `${pageMargins.bottom}px`,
                  }}
                >
                  <EditorContent
                    editor={editor}
                    className="min-h-[1122.5px] tip-tap-editor w-full max-w-full overflow-x-hidden"
                  />

                </div>
              </div>
            )}

            {/* Render page indicators for multi-page content */}
            {pages.length > 1 && (
              <div className="mt-8 flex flex-wrap gap-2 justify-center pb-20">
                {pages.map((page) => (
                  <Button
                    key={page.id}
                    variant={currentPage === page.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(page.id)}
                    className="text-xs"
                  >
                    Page {page.id}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Sidebar */}
        <AISidebar
          isOpen={isAISidebarOpen}
          onClose={() => updateEditorFeatures({ isAISidebarOpen: false })}
          onGenerate={handleAIGenerate}
          selectedText={selectedText}
          onTransformText={handleTransformText}
        />
      </div>

      {/* Status Bar */}
      <footer className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-background text-xs text-muted-foreground">

        <div className="flex items-center gap-4">

          <span>{wordCount} words</span>
          <span>{characterCount} characters</span>
          <span>{readingTime} min read</span>
          <span>{headings.length} headings</span>
          <div className="flex items-center gap-2">
            <span>•</span>
            <span className={`${saveStatus === 'modified' ? 'text-orange-500' : 'text-green-500'}`}>
              {saveStatus === 'modified' ? '● Unsaved changes' : '● Saved'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>{documentStats.paragraphs} paras</span>
          <span>{documentStats.images} images</span>
          <span>{documentStats.tables} tables</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const pageInput = prompt(`Go to page (1-${pages.length}):`, currentPage.toString());
                if (pageInput) {
                  const pageNumber = parseInt(pageInput);
                  if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= pages.length) {
                    goToPage(pageNumber);
                  } else {
                    toast.error(`Please enter a valid page number between 1 and ${pages.length}`);
                  }
                }
              }}
              className="h-7 px-2 text-xs"
            >
              Page {currentPage} of {pages.length}
            </Button>
          </div>
          <span>Zoom: {zoom}%</span>
        </div>
      </footer >

      {/* Template Sidebar */}
      < TemplateSidebar
        isOpen={showTemplateSidebar}
        onClose={() => updateEditorFeatures({ showTemplateSidebar: false })}
        onSelectTemplate={handleTemplateSelect}
      />

      {/* Export Dialog */}
      < Dialog open={showExportDialog} onOpenChange={(open) => updateEditorFeatures({ showExportDialog: open })}>
        <DialogContent className="max-w-md bg-white" aria-describedby="export-dialog-description">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <DialogTitle>Export Document</DialogTitle>
                <DialogDescription id="export-dialog-description">
                  Choose format and options for exporting your document. PDF exports as printable HTML that you can save as PDF using your browser's print function.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={exportFormat} onValueChange={(value) => updateEditorFeatures({ exportFormat: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      PDF
                    </div>
                  </SelectItem>
                  <SelectItem value="docx">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      DOCX
                    </div>
                  </SelectItem>
                  <SelectItem value="epub">
                    <div className="flex items-center gap-2">
                      <Book className="w-4 h-4" />
                      EPUB eBook
                    </div>
                  </SelectItem>
                  <SelectItem value="md">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Markdown
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      JSON Data
                    </div>
                  </SelectItem>
                  <SelectItem value="txt">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Plain Text
                    </div>
                  </SelectItem>
                  <SelectItem value="html">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      HTML
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Export Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="pageNumbers"
                    checked={exportOptions.includePageNumbers}
                    onCheckedChange={(checked) =>
                      updateExportOptions({ includePageNumbers: checked })
                    }
                  />
                  <Label htmlFor="pageNumbers">Include Page Numbers</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="header"
                    checked={exportOptions.includeHeader}
                    onCheckedChange={(checked) =>
                      updateExportOptions({ includeHeader: checked })
                    }
                  />
                  <Label htmlFor="header">Include Header</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="footer"
                    checked={exportOptions.includeFooter}
                    onCheckedChange={(checked) =>
                      updateExportOptions({ includeFooter: checked })
                    }
                  />
                  <Label htmlFor="footer">Include Footer</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="comments"
                    checked={exportOptions.exportComments}
                    onCheckedChange={(checked) =>
                      updateExportOptions({ exportComments: checked })
                    }
                  />
                  <Label htmlFor="comments">Export Comments</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="trackChanges"
                    checked={exportOptions.exportTrackChanges}
                    onCheckedChange={(checked) =>
                      updateExportOptions({ exportTrackChanges: checked })
                    }
                  />
                  <Label htmlFor="trackChanges">Export Track Changes</Label>
                </div>
              </div>
            </div>

            {exportFormat === 'pdf' && (
              <div className="space-y-2">
                <Label>PDF Quality</Label>
                <Select defaultValue="high">
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="low">Low (Smaller file)</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High (Print quality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => updateEditorFeatures({ showExportDialog: false })}
              disabled={exportLoading[exportFormat]}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              className="bg-linear-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
              disabled={exportLoading[exportFormat]}
            >
              {exportLoading[exportFormat] ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Version History Modal */}
      < AnimatePresence >
        {showVersionHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVersionHistory(false)}
              className="fixed inset-0 bg-black/20 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Version History</h2>
                    <button
                      onClick={() => setShowVersionHistory(false)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  <div className="space-y-4">
                    {documentVersions.map((version) => (
                      <div
                        key={version.id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{version.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {version.timestamp.toLocaleString()} • {version.author}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleRestoreVersion(version.id)}
                            size="sm"
                            className="h-8"
                          >
                            Restore
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence >

      {/* Heading Styles Modal */}
      < AnimatePresence >
        {showHeadingStyles && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHeadingStyles(false)}
              className="fixed inset-0 bg-black/20 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Heading Styles</h2>
                    <button
                      onClick={() => setShowHeadingStyles(false)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  <div className="space-y-6">
                    {[1, 2, 3, 4, 5, 6].map(level => (
                      <div key={level} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-gray-900">Heading {level}</h3>
                          <Button
                            onClick={() => applyHeadingStyle(level)}
                            size="sm"
                            variant="outline"
                            className="h-8"
                          >
                            Apply Style
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                            <Input
                              type="number"
                              defaultValue={24 + (7 - level) * 4}
                              onChange={(e) => {
                                const styles = customHeadingStyles[level] || {};
                                styles.fontSize = `${e.target.value}px`;
                                saveCustomHeadingStyle(level, styles);
                              }}
                              className="h-8"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Font Weight</label>
                            <select
                              defaultValue="bold"
                              onChange={(e) => {
                                const styles = customHeadingStyles[level] || {};
                                styles.fontWeight = e.target.value;
                                saveCustomHeadingStyle(level, styles);
                              }}
                              className="w-full h-8 px-3 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="normal">Normal</option>
                              <option value="bold">Bold</option>
                              <option value="600">Semi-Bold</option>
                              <option value="800">Extra Bold</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                  <Button
                    onClick={() => setShowHeadingStyles(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowHeadingStyles(false);
                      toast.success('Heading styles updated');
                    }}
                  >
                    Save All Styles
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence >

      {/* Page Setup Modal */}
      < AnimatePresence >
        {showPageSetup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPageSetup(false)}
              className="fixed inset-0 bg-black/20 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Page Setup</h2>
                    <button
                      onClick={() => setShowPageSetup(false)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Page Size & Orientation */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Page Size & Orientation</h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Page Size</label>
                        <select
                          value={pageSize}
                          onChange={(e) => handlePageSizeChange(e.target.value)}
                          className="w-full h-10 px-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="A4">A4 (210 × 297 mm)</option>
                          <option value="Letter">Letter (8.5 × 11 in)</option>
                          <option value="Legal">Legal (8.5 × 14 in)</option>
                          <option value="A3">A3 (297 × 420 mm)</option>
                          <option value="A5">A5 (148 × 210 mm)</option>
                          <option value="B5">B5 (176 × 250 mm)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Orientation</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOrientationChange('portrait')}
                            className={`flex-1 py-2 px-4 border rounded-md ${pageOrientation === 'portrait' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'}`}
                          >
                            Portrait
                          </button>
                          <button
                            onClick={() => handleOrientationChange('landscape')}
                            className={`flex-1 py-2 px-4 border rounded-md ${pageOrientation === 'landscape' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'}`}
                          >
                            Landscape
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Margins */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Margins (points)</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {['top', 'bottom', 'left', 'right'].map(side => (
                          <div key={side}>
                            <label className="block text-sm font-medium text-gray-700 capitalize mb-1">{side}</label>
                            <Input
                              type="number"
                              value={pageMargins[side]}
                              onChange={(e) => handleMarginChange(side, parseInt(e.target.value) || 0)}
                              className="h-10"
                              min="0"
                              max="500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Columns */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Columns</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Number of Columns</label>
                        <Input
                          type="number"
                          value={columnLayout.count}
                          onChange={(e) => handleColumnChange('count', parseInt(e.target.value) || 1)}
                          className="h-10"
                          min="1"
                          max="3"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Column Spacing (points)</label>
                        <Input
                          type="number"
                          value={columnLayout.spacing}
                          onChange={(e) => handleColumnChange('spacing', parseInt(e.target.value) || 0)}
                          className="h-10"
                          min="0"
                          max="200"
                        />
                      </div>
                    </div>

                    {/* Page Color */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Page Appearance</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Page Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={pageColor}
                            onChange={(e) => handlePageColorChange(e.target.value)}
                            className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                          />
                          <span className="text-sm text-gray-600">{pageColor}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Quick Colors</label>
                        <div className="flex flex-wrap gap-2">
                          {['#ffffff', '#ffffe0', '#e0ffff', '#ffe0e0', '#e0e0ff', '#e0ffe0'].map(color => (
                            <button
                              key={color}
                              onClick={() => handlePageColorChange(color)}
                              className={`w-8 h-8 rounded border-2 ${pageColor === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}`}
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                  <Button
                    onClick={() => setShowPageSetup(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPageSetup(false);
                      toast.success('Page setup updated');
                    }}
                  >
                    Apply Changes
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence >

      {/* Media Panel Modal */}
      < AnimatePresence >
        {showMediaPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMediaPanel(false)}
              className="fixed inset-0 bg-black/20 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Media Elements</h2>
                    <button
                      onClick={() => setShowMediaPanel(false)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh]">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Images Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Images
                      </h3>

                      <div className="space-y-3">
                        <Button
                          onClick={addImageFromUrl}
                          variant="outline"
                          className="w-full"
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Add from URL
                        </Button>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => addLocalImage(e.target.files?.[0])}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>

                        {selectedMedia && mediaElements.find(m => m.id === selectedMedia)?.type === 'image' && (
                          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                            <h4 className="font-medium text-gray-900">Image Properties</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Width</label>
                                <Input
                                  value={imageProperties.width}
                                  onChange={(e) => setImageProperties(prev => ({ ...prev, width: e.target.value }))}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Height</label>
                                <Input
                                  value={imageProperties.height}
                                  onChange={(e) => setImageProperties(prev => ({ ...prev, height: e.target.value }))}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Alignment</label>
                              <select
                                value={imageProperties.alignment}
                                onChange={(e) => setImageProperties(prev => ({ ...prev, alignment: e.target.value }))}
                                className="w-full h-8 text-xs border border-gray-300 rounded px-2"
                              >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Rotation (degrees)</label>
                              <Input
                                type="number"
                                value={imageProperties.rotation}
                                onChange={(e) => setImageProperties(prev => ({ ...prev, rotation: parseInt(e.target.value) || 0 }))}
                                className="h-8 text-xs"
                                min="-360"
                                max="360"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Watermarks Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Watermarks
                      </h3>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Add Text Watermark</label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter watermark text"
                              id="watermark-input"
                              className="flex-1"
                            />
                            <Button
                              onClick={() => {
                                const input = document.getElementById('watermark-input');
                                if (input?.value) {
                                  addWatermark(input.value);
                                  input.value = '';
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <Button
                            onClick={() => addWatermark('CONFIDENTIAL', { opacity: 30, fontSize: '24px' })}
                            variant="outline"
                            size="sm"
                          >
                            Confidential
                          </Button>
                          <Button
                            onClick={() => addWatermark('DRAFT', { opacity: 25, fontSize: '32px' })}
                            variant="outline"
                            size="sm"
                          >
                            Draft
                          </Button>
                          <Button
                            onClick={() => addWatermark('SAMPLE', { opacity: 20, fontSize: '28px' })}
                            variant="outline"
                            size="sm"
                          >
                            Sample
                          </Button>
                          <Button
                            onClick={() => addWatermark(new Date().getFullYear().toString(), { opacity: 15, fontSize: '16px', position: 'bottom-right' })}
                            variant="outline"
                            size="sm"
                          >
                            Year
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Shapes & Drawing Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Square className="w-5 h-5" />
                        Shapes & Drawing
                      </h3>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Drawing Tools</label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={() => startDrawing('rectangle')}
                              variant={drawingMode === 'rectangle' ? 'default' : 'outline'}
                              size="sm"
                            >
                              <Square className="w-4 h-4 mr-1" />
                              Rectangle
                            </Button>
                            <Button
                              onClick={() => startDrawing('circle')}
                              variant={drawingMode === 'circle' ? 'default' : 'outline'}
                              size="sm"
                            >
                              <Circle className="w-4 h-4 mr-1" />
                              Circle
                            </Button>
                            <Button
                              onClick={() => startDrawing('line')}
                              variant={drawingMode === 'line' ? 'default' : 'outline'}
                              size="sm"
                            >
                              <Minus className="w-4 h-4 mr-1" />
                              Line
                            </Button>
                            <Button
                              onClick={() => startDrawing('freehand')}
                              variant={drawingMode === 'freehand' ? 'default' : 'outline'}
                              size="sm"
                            >
                              <PenTool className="w-4 h-4 mr-1" />
                              Freehand
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Drawing Properties</label>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-600">Color:</span>
                            <input
                              type="color"
                              value={drawingColor}
                              onChange={(e) => setDrawingColor(e.target.value)}
                              className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Stroke Width</label>
                            <Input
                              type="range"
                              value={drawingStrokeWidth}
                              onChange={(e) => setDrawingStrokeWidth(parseInt(e.target.value) || 1)}
                              min="1"
                              max="10"
                              className="w-full"
                            />
                            <span className="text-xs text-gray-500">{drawingStrokeWidth}px</span>
                          </div>
                        </div>

                        <div className="border-t pt-3">
                          <h4 className="font-medium text-gray-900 mb-2">Quick Shapes</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              onClick={() => addShape('rectangle')}
                              variant="outline"
                              size="sm"
                            >
                              ▭
                            </Button>
                            <Button
                              onClick={() => addShape('circle')}
                              variant="outline"
                              size="sm"
                            >
                              ○
                            </Button>
                            <Button
                              onClick={() => addShape('triangle')}
                              variant="outline"
                              size="sm"
                            >
                              triangle
                            </Button>
                            <Button
                              onClick={() => addShape('arrow')}
                              variant="outline"
                              size="sm"
                            >
                              →
                            </Button>
                            <Button
                              onClick={() => addShape('callout')}
                              variant="outline"
                              size="sm"
                            >
                              💬
                            </Button>
                            <Button
                              onClick={() => addShape('star')}
                              variant="outline"
                              size="sm"
                            >
                              ★
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                  <Button
                    onClick={() => setShowMediaPanel(false)}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence >

      {/* Image Insertion Modal */}
      < AnimatePresence >
        {showImageModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowImageModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Insert Image</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Add images to your document
                      </p>
                    </div>
                    <button
                      onClick={() => setShowImageModal(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Method Tabs */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant={imageInsertMethod === 'url' ? 'default' : 'outline'}
                      onClick={() => setImageInsertMethod('url')}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <LinkIcon className="w-4 h-4" />
                      From URL
                    </Button>
                    <Button
                      variant={imageInsertMethod === 'upload' ? 'default' : 'outline'}
                      onClick={() => setImageInsertMethod('upload')}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </Button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  <Tabs value={imageInsertMethod} onValueChange={setImageInsertMethod} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="url" className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        From URL
                      </TabsTrigger>
                      <TabsTrigger value="upload" className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="url" className="mt-0 space-y-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Image URL
                          </label>
                          <div className="flex gap-2">
                            <Input
                              type="url"
                              value={imageUrl}
                              onChange={(e) => setImageUrl(e.target.value)}
                              placeholder="https://example.com/image.jpg"
                              className="flex-1"
                              onKeyDown={(e) => e.key === 'Enter' && handleImageUrlSubmit()}
                            />
                            <Button onClick={handleImageUrlSubmit}>
                              Insert
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Supported formats: JPG, PNG, GIF, WebP, SVG, BMP
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alternative Text (Optional)
                          </label>
                          <Input
                            value={selectedImageAlt}
                            onChange={(e) => setSelectedImageAlt(e.target.value)}
                            placeholder="Describe the image for accessibility"
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Examples</h4>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            {
                              url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&auto=format&fit=crop',
                              alt: 'Colorful gradient background',
                              label: 'Gradient'
                            },
                            {
                              url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&auto=format&fit=crop',
                              alt: 'Bright colorful background',
                              label: 'Colorful'
                            },
                            {
                              url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop',
                              alt: 'Abstract background',
                              label: 'Abstract'
                            }
                          ].map((img, index) => (
                            <button
                              key={index}
                              onClick={() => handleQuickImageInsert(img.url, img.alt)}
                              className="relative group overflow-hidden rounded-lg border border-gray-200 hover:border-blue-500 transition-all"
                            >
                              <div className="aspect-video bg-gray-100 overflow-hidden">
                                <img
                                  src={img.url}
                                  alt={img.label}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              </div>
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                              <div className="p-2 text-xs truncate bg-white font-medium">{img.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="upload" className="mt-0 space-y-6">
                      <div className="space-y-6">
                        <div
                          className={`border-2 border-dashed ${(isImageUploading || false) ? 'border-gray-400 bg-gray-200/50 cursor-not-allowed' : 'border-gray-300 hover:border-blue-500'} rounded-xl p-8 text-center transition-colors bg-gray-50/50 cursor-pointer`}
                          onClick={!(isImageUploading || false) ? () => document.getElementById('image-upload')?.click() : undefined}
                        >
                          <div className="flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                              <Upload className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Click to upload images
                              </h3>
                              <p className="text-sm text-gray-600 mb-4">
                                or drag and drop
                              </p>
                              <Button
                                variant="outline"
                                className="gap-2"
                                disabled={isImageUploading || false}
                              >
                                <FolderOpen className="w-4 h-4" />
                                Browse Files
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              Supports JPG, PNG, GIF, WebP, SVG, BMP (Max 10MB each)
                            </p>
                          </div>
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={isImageUploading || false}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Multiple Images
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleMultipleImageUpload}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
                            disabled={isImageUploading || false}
                          />
                        </div>

                        {selectedFiles.length > 0 && (
                          <div className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-medium text-gray-700">Selected Files ({selectedFiles.length})</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={clearSelectedFiles}
                              >
                                Clear All
                              </Button>
                            </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {selectedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                                  <span className="text-sm truncate flex-1">{file.name}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSelectedFile(index)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50/50">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {imageInsertMethod === 'url' && (
                        <span className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4" />
                          Insert images from web URLs
                        </span>
                      )}
                      {imageInsertMethod === 'upload' && (
                        <span className="flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Upload images from your device
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowImageModal(false)}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (imageInsertMethod === 'url') {
                            handleImageUrlSubmit();
                          } else {
                            // For upload method, trigger the hidden file input
                            document.getElementById('image-upload')?.click();
                          }
                        }}
                        disabled={isImageUploading || false}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Insert Image
                      </Button>
                      <Button
                        onClick={testImageInsertion}
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-100"
                      >
                        <Bug className="w-4 h-4 mr-2" />
                        Test
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence >
    </div >
  );
};

// Export the component with providers wrapped
export default TextEditorWithProviders;