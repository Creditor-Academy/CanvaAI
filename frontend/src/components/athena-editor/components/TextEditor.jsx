import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Highlight } from '@tiptap/extension-highlight';
import { Typography } from '@tiptap/extension-typography';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Focus } from '@tiptap/extension-focus';
import { Collaboration } from '@tiptap/extension-collaboration';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Blockquote } from '@tiptap/extension-blockquote';
import Indent from '../extensions/Indent.js';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { ResizableImage } from '../extensions/ResizableImage.jsx';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import { common } from 'lowlight';
import { mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Node } from '@tiptap/core';
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

// Custom Font Size Extension
const FontSize = TextStyle.extend({
  name: 'fontSize',
  
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize,
        renderHTML: attributes => {
          if (!attributes.fontSize) return {};
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },
  
  addCommands() {
    return {
      setFontSize: (size) => ({ commands }) => {
        return commands.setMark('fontSize', { fontSize: size });
      },
      unsetFontSize: () => ({ commands }) => {
        return commands.unsetMark('fontSize');
      },
    };
  },
});

// React component for page break
const PageBreakComponent = ({ node, updateAttributes }) => {
  return (
    <div 
      className="relative my-10"
      contentEditable={false}
    >
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-dashed border-gray-300"></div>
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 py-1 text-xs text-gray-400 rounded-lg border border-gray-200">
          Page Break
        </span>
      </div>
    </div>
  );
};

// Custom Page Break Extension
const PageBreak = Node.create({
  name: 'pageBreak',
  
  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  content: 'inline*',

  marks: '',

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-type': 'page-break',
      style: 'page-break-after: always; border-top: 1px dashed #e5e7eb; margin: 40px 0; text-align: center; height: 1px;',
    }), [
      'span',
      { style: 'background: white; padding: 0 12px; color: #9ca3af; font-size: 12px; position: relative; top: -12px;' },
      'Page Break'
    ]];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PageBreakComponent);
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
  switch(action) {
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

const handleViewAction = (action, editor, setZoom) => {
  switch(action) {
    case 'zoom_in':
      setZoom(prev => Math.min(200, prev + 10))
      break
    case 'zoom_out':
      setZoom(prev => Math.max(50, prev - 10))
      break
    case 'zoom_100':
      setZoom(100)
      break
    case 'fullscreen':
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
      break
    default:
      if (action.startsWith('zoom_')) {
        const zoomValue = parseInt(action.split('_')[1])
        if (!isNaN(zoomValue)) {
          setZoom(zoomValue)
        }
      }
      break
  }
}

const handleEditAction = (action, editor, evt = null) => {
  if (!editor) return
  
  switch(action) {
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
  
  switch(action) {
    case 'image':
      const url = prompt('Enter image URL:')
      if (url) {
        editor.chain().focus().setImage({ src: url }).run()
      }
      break
    case 'table':
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
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
  
  switch(action) {
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

export const TextEditor = () => {
  // Custom clipboard handlers
  const handleCopy = async () => {
    if (!editor) return;
    
    try {
      // Get the current selection
      const { from, to } = editor.state.selection;
      
      if (from === to) {
        toast.info('Nothing selected to copy');
        return;
      }
      
      // Create a fragment from the selected content
      const slice = editor.state.doc.slice(from, to);
      
      // Use the editor's serializer to convert to HTML
      const fragment = slice.content;
      const htmlString = editor.schema.serializer.serializeFragment(fragment);
      
      // Create a temporary div to get HTML string
      const tempDiv = document.createElement('div');
      tempDiv.appendChild(htmlString);
      const finalHtmlString = tempDiv.innerHTML;
      
      // Get plain text as well
      const plainText = editor.state.doc.textBetween(from, to, ' ');
      
      // Use Clipboard API if available
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          const clipboardItem = new ClipboardItem({
            'text/html': new Blob([finalHtmlString], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' })
          });
          
          await navigator.clipboard.write([clipboardItem]);
          toast.success('Content copied to clipboard');
        } catch (err) {
          console.error('Failed to copy to clipboard:', err);
          // Fallback to execCommand
          document.execCommand('copy');
          toast.success('Content copied to clipboard');
        }
      } else {
        // Fallback for older browsers
        document.execCommand('copy');
        toast.success('Content copied to clipboard');
      }
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy content');
    }
  };

  const handlePaste = async (event) => {
    if (!editor) return;
    
    try {
      // Check if Clipboard API is available
      if (navigator.clipboard && window.ClipboardItem) {
        // Modern approach using Clipboard API
        const clipboardItems = await navigator.clipboard.read();
        
        for (const clipboardItem of clipboardItems) {
          for (const type of clipboardItem.types) {
            if (type === 'text/html') {
              const blob = await clipboardItem.getType(type);
              const htmlString = await blob.text();
              
              // Insert HTML content
              editor.commands.insertContent(htmlString);
              toast.success('Content pasted from clipboard');
              return;
            } else if (type === 'text/plain') {
              const blob = await clipboardItem.getType(type);
              const plainText = await blob.text();
              
              // Insert plain text
              editor.commands.insertContent(plainText);
              toast.success('Text pasted from clipboard');
              return;
            }
          }
        }
      } else {
        // Fallback: Get clipboard data from event
        const clipboardData = event?.clipboardData || window.clipboardData;
        if (clipboardData) {
          const html = clipboardData.getData('text/html');
          const text = clipboardData.getData('text/plain');
          
          if (html) {
            // Prefer HTML content if available
            editor.commands.insertContent(html);
            toast.success('HTML content pasted from clipboard');
          } else {
            // Fallback to plain text
            editor.commands.insertContent(text);
            toast.success('Text pasted from clipboard');
          }
        } else {
          // If no clipboard data in event, let Tiptap handle it naturally
          toast.info('Using default paste behavior');
        }
      }
    } catch (error) {
      console.error('Paste failed:', error);
      
      // Ultimate fallback
      try {
        // Get clipboard data manually
        const clipboardData = event?.clipboardData || window.clipboardData;
        if (clipboardData) {
          const html = clipboardData.getData('text/html');
          const text = clipboardData.getData('text/plain');
          
          if (html) {
            editor.commands.insertContent(html);
          } else {
            editor.commands.insertContent(text);
          }
          toast.success('Content pasted (fallback)');
        }
      } catch (fallbackError) {
        console.error('Fallback paste also failed:', fallbackError);
        toast.error('Failed to paste content. Please try again.');
      }
    }
  };

  const [documentTitle, setDocumentTitle] = useState('Untitled Document');
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isTemplateSidebarOpen, setIsTemplateSidebarOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [headings, setHeadings] = useState([]);
  const [lastSaved, setLastSaved] = useState(new Date());
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [documentStats, setDocumentStats] = useState({
    paragraphs: 0,
    images: 0,
    tables: 0,
    pages: 1,  // Initial page count
  });
  
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
  const [lineSpacing, setLineSpacing] = useState(1.15);
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
    top: 72,    // 1 inch in points
    bottom: 72,
    left: 72,
    right: 72
  });
  const [columnLayout, setColumnLayout] = useState({
    count: 1,
    spacing: 36, // 0.5 inch in points
    equalWidth: true
  });
  const [pageColor, setPageColor] = useState('#ffffff');
  const [showPageSetup, setShowPageSetup] = useState(false);
  const [sectionBreaks, setSectionBreaks] = useState([]);
  const [showRuler, setShowRuler] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  
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
  const [drawingMode, setDrawingMode] = useState(null); // 'rectangle', 'circle', 'line', 'freehand'
  const [drawingColor, setDrawingColor] = useState('#000000');
  const [drawingStrokeWidth, setDrawingStrokeWidth] = useState(2);
  
  // Image insertion states
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageInsertMethod, setImageInsertMethod] = useState('url'); // 'url', 'upload', 'unsplash'
  const [imageUrl, setImageUrl] = useState('');
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [unsplashImages, setUnsplashImages] = useState([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [selectedImageAlt, setSelectedImageAlt] = useState('');
  const [isImageUploading, setIsImageUploading] = useState(false);

  // Export states
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportOptions, setExportOptions] = useState({
    includePageNumbers: true,
    includeHeader: true,
    includeFooter: true,
    exportComments: false,
    exportTrackChanges: false
  });

  // References & Links states
  const [bookmarks, setBookmarks] = useState([]);
  const [footnotes, setFootnotes] = useState([]);
  const [citations, setCitations] = useState([]);
  const [crossReferences, setCrossReferences] = useState([]);
  const [bibliography, setBibliography] = useState([]);
  const [showReferencesPanel, setShowReferencesPanel] = useState(false);
  const [citationStyle, setCitationStyle] = useState('apa'); // apa, mla, chicago

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        codeBlock: true,
        code: true,
        link: true,
        underline: true,
        listItem: true,
        bulletList: true,
        orderedList: true,
        blockquote: true,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Heading...';
          }
          return 'Start typing or type "/" for commands...';
        },
      }),
      Blockquote,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
        lastColumnResizable: true,
        cellMinWidth: 100,
        HTMLAttributes: {
          class: 'table-border-black',
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: 'cell-border-black',
        },
      }),
      TableHeader,
      TextStyle,
      Color,
      FontFamily,
      Subscript,
      Superscript,
      TaskList,
      TaskItem,
      CodeBlockLowlight.configure({
        lowlight: createLowlight(common),
      }),
      FontSize,
      Typography,
      Indent,
      ResizableImage,
      PageBreak,
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
      CharacterCount.configure({
        limit: 100000,
      }),
    ],
    content: `
      <h1 style="font-family: 'Inter', sans-serif; font-weight: 700;">Welcome to TEXT Editor Pro</h1>
      <p style="font-family: 'Inter', sans-serif; color: #4b5563;">
        This is a <mark style="background-color: #fef3c7;">professional-grade</mark> document editor with 
        <strong> AI-powered features</strong>. Start writing your next masterpiece!
      </p>
      <h2 style="font-family: 'Inter', sans-serif; font-weight: 600; color: #1f2937;">Getting Started</h2>
      <p style="font-family: 'Inter', sans-serif;">
        Use the <strong>toolbar above</strong> to format your text, add headings, lists, and more. 
        Click the <button style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 12px; border-radius: 20px; border: none; font-weight: 500; cursor: pointer; font-size: 14px;">✨ AI</button> 
        button to access <strong>AI-powered writing assistance</strong>.
      </p>
      <h3 style="font-family: 'Inter', sans-serif; font-weight: 600; color: #374151;">Features</h3>
      <ul style="font-family: 'Inter', sans-serif;">
        <li>Rich text formatting (bold, italic, underline, etc.)</li>
        <li>Multiple heading levels with proper hierarchy</li>
        <li>Smart lists and blockquotes</li>
        <li>Code blocks with syntax highlighting</li>
        <li>Resizable tables and images</li>
        <li>Page breaks and print layout</li>
        <li>AI-powered content generation and enhancement</li>
      </ul>
      <blockquote style="border-left: 4px solid #3b82f6; padding-left: 20px; margin: 24px 0; color: #6b7280; font-style: italic;">
        "The first draft is just you telling yourself the story." 
        <br />
        <strong style="color: #374151;">— Terry Pratchett</strong>
      </blockquote>
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h4 style="font-family: 'Inter', sans-serif; font-weight: 600; color: #0369a1;">💡 Pro Tip</h4>
        <p style="font-family: 'Inter', sans-serif; color: #0c4a6e; margin-bottom: 8px;">
          Press <kbd style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Ctrl + /</kbd> 
          to open command palette for quick actions.
        </p>
      </div>
    `,
    onUpdate: ({ editor }) => {
      updateDocumentStats(editor);
      updateHeadings(editor);
      updateWordCount(editor);
      updatePageCount(editor);
      setSaveStatus('modified');
      
      // Auto-save after 3 seconds of inactivity
      const timer = setTimeout(() => {
        if (saveStatus === 'modified') {
          handleAutoSave();
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, ' ');
        setSelectedText(text);
      } else {
        setSelectedText('');
      }
      
      // Update active heading level based on current selection
      if (from === to) {
        // Cursor is at a single position
        const node = editor.state.doc.nodeAt(from);
        if (node && node.type.name === 'heading') {
          setActiveHeadingLevel(node.attrs.level);
        } else {
          setActiveHeadingLevel(0);
        }
      } else {
        // There's a selection
        let foundHeadingLevel = 0;
        editor.state.doc.nodesBetween(from, to, (node) => {
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
      },
      
      // Add custom styles for tables
      contentAttributes: {
        style: `
          table.table-border-black { 
            border-collapse: collapse; 
            border: 2px solid #000000; 
            width: 100%; 
            background-color: #ffffff; 
            box-shadow: 0 0 0 1px #000000; 
          }
          table.table-border-black td, 
          table.table-border-black th { 
            border: 1px solid #000000; 
            padding: 8px; 
            background-color: #ffffff; 
            vertical-align: top; 
          }
          .cell-border-black { 
            border: 1px solid #000000 !important; 
            padding: 8px; 
            background-color: #ffffff; 
          }
          table.table-border-black th {
            background-color: #f8f9fa !important;
            font-weight: bold;
          }
        `,
      },
      
      handleKeyDown: (view, event) => {
        // Handle slash commands
        if (event.key === '/' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          setIsAISidebarOpen(true);
          return true;
        }
        return false;
      },
    },
  });

  // Update the handleInsertImage function
  const handleInsertImage = () => {
    setShowImageModal(true);
    setImageInsertMethod('url');
    setImageUrl('');
    setImageSearchQuery('');
    setSelectedImageAlt('');
  };

  // Enhanced insertImage function that uses ResizableImage extension with fallbacks
  const insertImage = (src, alt = '', width = 400, height = 300, options = {}) => {
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
      setDocumentStats(prev => ({
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
        setDocumentStats(prev => ({
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
          setDocumentStats(prev => ({
            ...prev,
            images: prev.images + 1
          }));
        } catch (htmlError) {
          console.error('HTML insertion failed:', htmlError);
          toast.error('Failed to insert image. Please check your editor configuration.');
        }
      }
    }
  };


  // Function to handle multiple image uploads with enhanced state management and error handling
  const handleMultipleImageUpload = async (event) => {
    try {
      const files = Array.from(event.target.files);
      
      if (!files || files.length === 0) {
        toast.error('❌ No files selected');
        return;
      }
      
      // Show processing message
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
  };

  // Function to handle image URL insertion with enhanced validation and feedback
  const handleImageUrlSubmit = () => {
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
  };

  // Enhanced image upload functions with improved state management and error handling
  const handleImageUpload = async (event) => {
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
  };

  // New function to confirm and insert selected images
  const confirmImageUpload = async () => {
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
  };

  // Function to remove a selected file
  const removeSelectedFile = (index) => {
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
  };

  // Function to clear all selected files
  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    setImagePreview('');
  };

  // Function to handle quick image insertion
  const handleQuickImageInsert = (url, alt = '') => {
    setImageUrl(url);
    setSelectedImageAlt(alt);
    handleImageUrlSubmit();
  };

  // Function to test image insertion (for debugging) with enhanced feedback
  const testImageInsertion = () => {
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
  };


  const updateHeadings = useCallback((editor) => {
    const newHeadings = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        newHeadings.push({
          level: node.attrs.level,
          text: node.textContent,
          id: `heading-${pos}`,
        });
      }
    });
    setHeadings(newHeadings);
  }, []);

  const updateWordCount = useCallback((editor) => {
    const text = editor.state.doc.textContent;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const characters = text.length;
    const readingTimeMinutes = Math.ceil(words / 200);
    
    setWordCount(words);
    setCharacterCount(characters);
    setReadingTime(readingTimeMinutes);
  }, []);

  const updateDocumentStats = useCallback((editor) => {
    let paragraphs = 0;
    let images = 0;
    let tables = 0;
    
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'paragraph') paragraphs++;
      if (node.type.name === 'image') images++;
      if (node.type.name === 'table') tables++;
    });
    
    // Count page breaks to estimate pages
    const content = editor.getHTML();
    const pageBreakCount = (content.match(/<hr/g) || []).length;
    const pageCount = pageBreakCount + 1; // +1 for the initial page
    
    setDocumentStats({
      paragraphs,
      images,
      tables,
      pages: pageCount
    });
  }, []);

  // Page management functions
  const addNewPage = () => {
    if (editor) {
      // Insert a page break to simulate a new page
      editor.chain().focus().setPageBreak().run();
      toast.success('New page added');
    }
  };

  const addPageBreak = () => {
    if (editor) {
      editor.chain().focus().setHorizontalRule().run();
      toast.success('Page break added');
    }
  };

  const insertPageNumber = () => {
    if (editor) {
      const currentPageNumber = documentStats.pages || 1;
      editor.chain().focus().insertContent(`Page ${currentPageNumber}`).run();
      toast.success('Page number inserted');
    }
  };

  const goToPage = (pageNumber) => {
    // Scroll to the specified page (this is a simplified implementation)
    const pageElements = document.querySelectorAll('[data-page-number]');
    if (pageElements[pageNumber - 1]) {
      pageElements[pageNumber - 1].scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Update document stats to include page count
  const updatePageCount = (editorInstance) => {
    if (editorInstance) {
      const content = editorInstance.getHTML();
      // Count page breaks to estimate pages
      const pageBreakCount = (content.match(/<hr/g) || []).length;
      const pageCount = pageBreakCount + 1; // +1 for the initial page
      
      setDocumentStats(prev => ({
        ...prev,
        pages: pageCount
      }));
    }
  };

  const handleAutoSave = () => {
    if (!editor) return;
    
    const content = {
      title: documentTitle,
      html: editor.getHTML(),
      savedAt: new Date().toISOString(),
    };
    
    localStorage.setItem('text-editor-document', JSON.stringify(content));
    setLastSaved(new Date());
    setSaveStatus('saved');
    toast.success('Document auto-saved!');
  };

  useEffect(() => {
    if (editor) {
      updateHeadings(editor);
      updateWordCount(editor);
    }
  }, [editor, updateHeadings, updateWordCount]);

  const handleSave = () => {
    if (!editor) return;
    
    const content = {
      title: documentTitle,
      html: editor.getHTML(),
      savedAt: new Date().toISOString(),
      metadata: {
        wordCount: editor.storage.characterCount.words(),
        characterCount: editor.storage.characterCount.characters(),
        lastModified: new Date().toISOString()
      }
    };
    
    // Save to localStorage
    localStorage.setItem('text-editor-document', JSON.stringify(content));
    
    setLastSaved(new Date());
    setSaveStatus('saved');
    toast.success('Document saved successfully!');
  };

  const handlePrint = () => {
    if (!editor) return;
    
    // Create a temporary print window with proper document styling
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (!printWindow) {
      toast.error('Could not open print window. Please check your popup blocker.');
      return;
    }
    
    const editorContent = editor.getHTML();
    
    // Create a styled print document
    const printContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${documentTitle || 'Document'}</title>
        <style>
          @page {
            margin: 20mm;
            size: A4;
          }
          @media print {
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            .page-break { page-break-before: always; }
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
            max-width: 210mm; /* A4 width */
            margin: 0 auto;
            padding: 15mm;
            background: white;
          }
          .document-header {
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .document-title {
            font-size: 18pt;
            font-weight: bold;
            margin: 0 0 10px 0;
          }
          .document-meta {
            font-size: 10pt;
            color: #666;
            margin: 0;
          }
          .ProseMirror {
            min-height: auto;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          h1 { font-size: 16pt; font-weight: bold; margin: 20px 0 10px 0; }
          h2 { font-size: 14pt; font-weight: bold; margin: 18px 0 8px 0; }
          h3 { font-size: 13pt; font-weight: bold; margin: 16px 0 6px 0; }
          p { margin: 8px 0; }
          ul, ol { margin: 8px 0 8px 20px; }
          li { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
        </style>
      </head>
      <body>
        <div class="document-header">
          <h1 class="document-title">${documentTitle || 'Untitled Document'}</h1>
          <p class="document-meta">Printed on ${new Date().toLocaleString()}</p>
        </div>
        <div class="ProseMirror">${editorContent}</div>
        <script>
          // Wait for content to load, then print
          setTimeout(() => {
            window.print();
            // Close the window after printing if the user cancels or completes print
            setTimeout(() => {
              window.close();
            }, 1000);
          }, 1000);
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleExport = async () => {
    if (!editor) return;
    
    try {
      const options = {
        filename: `${documentTitle || 'document'}.${exportFormat}`,
        includePageNumbers: exportOptions.includePageNumbers,
        includeHeader: exportOptions.includeHeader,
        includeFooter: exportOptions.includeFooter,
        title: documentTitle || 'My Document'
      };

      switch (exportFormat) {
        case 'pdf':
          await DocumentExporter.exportToPDF(editor, options);
          toast.info('PDF file downloaded. Open it and use Ctrl+P → "Save as PDF"');
          break;
        case 'docx':
          await DocumentExporter.exportToDOCX(editor, options);
          break;
        case 'md':
          DocumentExporter.exportToMarkdown(editor, options);
          break;
        case 'txt':
          DocumentExporter.exportToPlainText(editor, options);
          break;
        case 'html':
          // HTML export
          const htmlContent = DocumentExporter.getHTMLContent(editor);
          const fullHTML = DocumentExporter.wrapHTMLForPDF(htmlContent, options);
          const blob = new Blob([fullHTML], { type: 'text/html' });
          DocumentExporter.downloadBlob(blob, 'document.html');
          toast.success('HTML document exported');
          break;
        default:
          toast.info(`Exporting as ${exportFormat.toUpperCase()}...`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
    
    setShowExportDialog(false);
  };

  const handleAIGenerate = async (content) => {
    if (!editor) return;
    
    if (content.startsWith('API:')) {
      // Simulate API call
      const prompt = content.substring(4);
      toast.info(`Generating content for: "${prompt}"`);
      editor.chain().focus().insertContent(`<p>${prompt} - AI generated content would appear here.</p>`).run();
    } else {
      editor.chain().focus().insertContent(content).run();
    }
    setIsAISidebarOpen(false);
  };

  const handleTransformText = async (action, result) => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor.chain().focus().deleteRange({ from, to }).insertContent(result).run();
      toast.success(`Text ${action}ed successfully!`);
    }
  };

  const handleHeadingClick = (id) => {
    const pos = parseInt(id.replace('heading-', ''));
    if (editor) {
      editor.chain().focus().setTextSelection(pos).run();
    }
  };

  const getHTML = () => editor?.getHTML() || '';

  const handleZoomChange = (newZoom) => {
    setZoom(newZoom);
  };

  const handleTemplateSelect = (template) => {
    if (editor) {
      editor.commands.setContent(template.content);
      setDocumentTitle(template.name);
      toast.success(`Template "${template.name}" applied!`);
    }
  };

  // Document Management Functions
  const handleRenameDocument = () => {
    if (isRenaming) {
      setDocumentTitle(tempTitle);
      setIsRenaming(false);
      toast.success('Document renamed successfully');
    } else {
      setTempTitle(documentTitle);
      setIsRenaming(true);
    }
  };

  const handleDuplicateDocument = () => {
    const newTitle = `${documentTitle} (Copy)`;
    const content = editor?.getHTML() || '';
    
    // Create new version entry
    const newVersion = {
      id: Date.now(),
      timestamp: new Date(),
      title: `Copy of ${documentTitle}`,
      content: content,
      author: 'Current User'
    };
    
    setDocumentVersions(prev => [...prev, newVersion]);
    setDocumentTitle(newTitle);
    toast.success(`Document duplicated as "${newTitle}"`);
  };

  const handleDeleteDocument = () => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      // In a real app, this would delete from storage
      toast.success('Document deleted');
      // Reset to new document
      editor?.commands.clearContent();
      setDocumentTitle('Untitled Document');
    }
  };

  const handleSaveVersion = () => {
    const content = editor?.getHTML() || '';
    const newVersion = {
      id: Date.now(),
      timestamp: new Date(),
      title: `Version ${documentVersions.length + 1}`,
      content: content,
      author: 'Current User'
    };
    
    setDocumentVersions(prev => [...prev, newVersion]);
    toast.success('Version saved successfully');
  };

  const handleRestoreVersion = (versionId) => {
    const version = documentVersions.find(v => v.id === versionId);
    if (version && editor) {
      editor.commands.setContent(version.content);
      setDocumentTitle(version.title);
      toast.success(`Restored version from ${version.timestamp.toLocaleString()}`);
      setShowVersionHistory(false);
    }
  };

  // Advanced Formatting Functions
  const handleLineSpacing = (spacing) => {
    setLineSpacing(spacing);
    if (editor) {
      editor.commands.updateAttributes('paragraph', { lineHeight: spacing });
      editor.commands.updateAttributes('heading', { lineHeight: spacing });
    }
    toast.success(`Line spacing set to ${spacing}`);
  };

  const handleIndent = (direction) => {
    if (!editor) return;
    
    if (direction === 'increase') {
      setIndentLevel(prev => prev + 1);
      editor.commands.sinkListItem('listItem');
    } else {
      setIndentLevel(prev => Math.max(0, prev - 1));
      editor.commands.liftListItem('listItem');
    }
  };

  const handleTextDirection = (direction) => {
    setTextDirection(direction);
    if (editor) {
      editor.commands.setTextAlign(direction === 'rtl' ? 'right' : 'left');
    }
    toast.success(`Text direction set to ${direction.toUpperCase()}`);
  };

  const handleParagraphSpacing = (type, value) => {
    setParagraphSpacing(prev => ({
      ...prev,
      [type]: value
    }));
    
    if (editor) {
      const style = `${type === 'before' ? 'margin-top' : 'margin-bottom'}: ${value}px`;
      editor.commands.updateAttributes('paragraph', { style });
    }
  };

  // Headings & Structure Functions
  const handleHeadingChange = (level) => {
    if (!editor) return;
    
    if (level === 0) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level }).run();
    }
    
    setActiveHeadingLevel(level);
    toast.success(`Heading level ${level === 0 ? 'Normal' : level} applied`);
  };

  const toggleBulletList = () => {
    if (!editor) return;
    editor.chain().focus().toggleBulletList().run();
  };

  const toggleOrderedList = () => {
    if (!editor) return;
    editor.chain().focus().toggleOrderedList().run();
  };

  const toggleTaskList = () => {
    if (!editor) return;
    editor.chain().focus().toggleTaskList().run();
  };

  const saveCustomHeadingStyle = (level, styles) => {
    setCustomHeadingStyles(prev => ({
      ...prev,
      [level]: styles
    }));
    
    // Apply styles to existing headings of this level
    if (editor) {
      const headingNodes = editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading' && node.attrs.level === level) {
          editor.commands.updateAttributes('heading', styles);
        }
      });
    }
    
    toast.success(`Custom style saved for Heading ${level}`);
  };

  const toggleSectionCollapse = (headingId) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(headingId)) {
        newSet.delete(headingId);
      } else {
        newSet.add(headingId);
      }
      return newSet;
    });
  };

  const applyHeadingStyle = (level) => {
    const customStyle = customHeadingStyles[level];
    if (customStyle && editor) {
      editor.commands.updateAttributes('heading', customStyle);
      toast.success(`Applied custom style to Heading ${level}`);
    }
  };

  const updateDocumentOutline = useCallback(() => {
    if (!editor) return;
    
    const headings = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        headings.push({
          id: `heading-${pos}`,
          level: node.attrs.level,
          text: node.textContent,
          pos: pos,
          collapsed: collapsedSections.has(`heading-${pos}`)
        });
      }
    });
    
    setHeadings(headings);
  }, [editor, collapsedSections]);

  // Page Layout & Setup Functions
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    toast.success(`Page size changed to ${size}`);
  };

  const handleOrientationChange = (orientation) => {
    setPageOrientation(orientation);
    toast.success(`Page orientation changed to ${orientation}`);
  };

  const handleMarginChange = (side, value) => {
    setPageMargins(prev => ({
      ...prev,
      [side]: value
    }));
    toast.success(`${side.charAt(0).toUpperCase() + side.slice(1)} margin updated`);
  };

  const handleColumnChange = (property, value) => {
    setColumnLayout(prev => ({
      ...prev,
      [property]: value
    }));
    toast.success(`Column ${property} updated`);
  };

  const handlePageColorChange = (color) => {
    setPageColor(color);
    toast.success('Page color updated');
  };

  const addSectionBreak = (type = 'next-page') => {
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
  };

  const toggleRuler = () => {
    setShowRuler(!showRuler);
    toast.success(`Ruler ${showRuler ? 'hidden' : 'shown'}`);
  };

  const toggleGrid = () => {
    setShowGrid(!showGrid);
    toast.success(`Grid ${showGrid ? 'hidden' : 'shown'}`);
  };

  // Media Elements Functions
  const addImageFromUrl = () => {
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
  };

  const addLocalImage = async (file) => {
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
  };

  const addWatermark = (text, options = {}) => {
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
  };

  const addShape = (shapeType, properties = {}) => {
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
  };

  const startDrawing = (mode) => {
    setDrawingMode(mode);
    toast.info(`Drawing mode: ${mode}. Click and drag to draw.`);
  };

  const groupSelectedElements = () => {
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
  };

  const ungroupElements = (groupId) => {
    setMediaElements(prev => 
      prev.map(media => 
        media.groupId === groupId 
          ? { ...media, groupId: undefined }
          : media
      )
    );
    toast.success('Elements ungrouped');
  };

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
              className="text-lg font-medium w-[300px] border-none focus:ring-0 focus:outline-none px-2 py-1"
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
            className="h-8 bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:from-amber-500 hover:to-amber-600 transition-all duration-300"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>

          <Button
            onClick={() => setShowExportDialog(true)}
            size="sm"
            className="h-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
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
        handleInsertImage={handleInsertImage}
        setShowReferencesPanel={setShowReferencesPanel}
        setIsAISidebarOpen={setIsAISidebarOpen}
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
        setIsTemplateSidebarOpen={setIsTemplateSidebarOpen}
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

        {/* Editor Area - Google Docs style paper */}
        <div className="flex-1 overflow-auto bg-secondary/30">
          <div className="flex justify-center py-6 px-4 min-h-full">
            <div 
              className="bg-background shadow-lg rounded-sm w-full max-w-[816px] min-h-[1056px]"
              style={{ 
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                backgroundColor: pageColor,
                padding: `${pageMargins.top}px ${pageMargins.right}px ${pageMargins.bottom}px ${pageMargins.left}px`
              }}
            >
              <div className="p-16">
                {/* Column layout simulation */}
                {columnLayout.count > 1 ? (
                  <div 
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns: `repeat(${columnLayout.count}, 1fr)`,
                      columnGap: `${columnLayout.spacing}px`
                    }}
                  >
                    <div>
                      <EditorContent 
                        editor={editor} 
                        className="prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[900px]"
                      />
                    </div>
                    {Array.from({ length: columnLayout.count - 1 }).map((_, i) => (
                      <div key={i} className="border-l border-gray-200 pl-4">
                        <div className="text-gray-400 text-sm">Column {i + 2}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EditorContent 
                    editor={editor} 
                    className="prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[900px]"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Sidebar */}
        <AISidebar
          isOpen={isAISidebarOpen}
          onClose={() => setIsAISidebarOpen(false)}
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
          <span>{documentStats.pages} pages</span>
          <span>Zoom: {zoom}%</span>
        </div>
      </footer>

      {/* Template Sidebar */}
      <TemplateSidebar
        isOpen={isTemplateSidebarOpen}
        onClose={() => setIsTemplateSidebarOpen(false)}
        onSelectTemplate={handleTemplateSelect}
      />

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Export Document</DialogTitle>
            <DialogDescription>
              Choose format and options for exporting your document. PDF exports as printable HTML that you can save as PDF using your browser's print function.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
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
                  <SelectItem value="md">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Markdown
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
                      setExportOptions({...exportOptions, includePageNumbers: checked})
                    }
                  />
                  <Label htmlFor="pageNumbers">Include Page Numbers</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="header"
                    checked={exportOptions.includeHeader}
                    onCheckedChange={(checked) => 
                      setExportOptions({...exportOptions, includeHeader: checked})
                    }
                  />
                  <Label htmlFor="header">Include Header</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="footer"
                    checked={exportOptions.includeFooter}
                    onCheckedChange={(checked) => 
                      setExportOptions({...exportOptions, includeFooter: checked})
                    }
                  />
                  <Label htmlFor="footer">Include Footer</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="comments"
                    checked={exportOptions.exportComments}
                    onCheckedChange={(checked) => 
                      setExportOptions({...exportOptions, exportComments: checked})
                    }
                  />
                  <Label htmlFor="comments">Export Comments</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="trackChanges"
                    checked={exportOptions.exportTrackChanges}
                    onCheckedChange={(checked) => 
                      setExportOptions({...exportOptions, exportTrackChanges: checked})
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
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Modal */}
      <AnimatePresence>
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
      </AnimatePresence>

      {/* Heading Styles Modal */}
      <AnimatePresence>
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
      </AnimatePresence>

      {/* Page Setup Modal */}
      <AnimatePresence>
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
      </AnimatePresence>

      {/* Media Panel Modal */}
      <AnimatePresence>
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
                                  onChange={(e) => setImageProperties(prev => ({...prev, width: e.target.value}))}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Height</label>
                                <Input
                                  value={imageProperties.height}
                                  onChange={(e) => setImageProperties(prev => ({...prev, height: e.target.value}))}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Alignment</label>
                              <select
                                value={imageProperties.alignment}
                                onChange={(e) => setImageProperties(prev => ({...prev, alignment: e.target.value}))}
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
                                onChange={(e) => setImageProperties(prev => ({...prev, rotation: parseInt(e.target.value) || 0}))}
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
      </AnimatePresence>

      {/* Image Insertion Modal */}
      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
};

export default TextEditor;