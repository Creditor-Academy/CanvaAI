import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Highlight } from '@tiptap/extension-highlight';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';

import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
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
  FileText,
  Star,
  FolderOpen,
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
  Bold,
  Italic,
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
  Square,
  Circle,
  Triangle,
  X,
  Moon,
  Copy,
  Scissors,
  FilePlus2,
  BarChart,
  Languages,
  ListChecks,
  Settings2,
  Keyboard,
  Info,
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
  Edit3,
  PlusCircle,
  RemoveFormatting
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { EditorToolbar } from './editor/EditorToolbar';
import { AISidebar } from './editor/AISidebar';
import { DocumentOutline } from './editor/DocumentOutline';
import { ExportMenu } from './editor/ExportMenu';
import { TemplateSidebar } from './editor/TemplateSidebar';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { motion, AnimatePresence } from 'framer-motion';

// Custom Font Size Extension
const FontSize = Node.create({
  name: 'fontSize',
  
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
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
        },
      },
    ];
  },
  
  addCommands() {
    return {
      setFontSize: (size) => ({ commands }) => {
        return commands.setMark('textStyle', { fontSize: size });
      },
      unsetFontSize: () => ({ commands }) => {
        return commands.unsetMark('textStyle', { attributes: { fontSize: null } });
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
    ]
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

const handleEditAction = (action, editor) => {
  if (!editor) return
  
  switch(action) {
    case 'undo':
      editor.chain().focus().undo().run()
      break
    case 'redo':
      editor.chain().focus().redo().run()
      break
    case 'cut':
      document.execCommand('cut')
      break
    case 'copy':
      document.execCommand('copy')
      toast.success('Copied to clipboard')
      break
    case 'paste':
      document.execCommand('paste')
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
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Heading...';
          }
          return 'Start typing or type "/" for commands...';
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        defaultProtocol: 'https',
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
        lastColumnResizable: true,
        cellMinWidth: 100,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TextStyle,
      Color,
      FontFamily,

      Subscript,
      Superscript,
      CodeBlockLowlight.configure({
        lowlight: createLowlight(common),
      }),
      FontSize,
      PageBreak,
      Color,
      FontFamily,
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
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[600px]',
        spellcheck: 'true',
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
    
    setDocumentStats({
      paragraphs,
      images,
      tables,
    });
  }, []);

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
    };
    
    localStorage.setItem('text-editor-document', JSON.stringify(content));
    setLastSaved(new Date());
    setSaveStatus('saved');
    toast.success('Document saved!');
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

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Google Docs-style Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          {/* Document Icon */}
          <div className="w-10 h-10 flex items-center justify-center">
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
          
          {/* Title and Menu */}
          <div className="flex flex-col">
            <Input
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="border-0 bg-transparent font-medium text-lg h-7 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 w-[300px]"
              
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
            <History className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MessageSquare className="w-4 h-4" />
          </Button>
          
          <Button 
            onClick={handleSave}
            variant="ghost"
            size="sm"
            className="h-8"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>

          <ExportMenu getHTML={getHTML} documentTitle={documentTitle} />
          
          <Button
            onClick={() => setIsTemplateSidebarOpen(true)}
            variant="outline"
            size="sm"
            className="h-8"
          >
            <FileText className="w-4 h-4 mr-1" />
            Templates
          </Button>
          
          <Button
            onClick={() => setIsAISidebarOpen(!isAISidebarOpen)}
            size="sm"
            className={`h-8 ${
              isAISidebarOpen 
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700' 
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            AI
          </Button>

          <Button variant="default" size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white">
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <EditorToolbar editor={editor} zoom={zoom} onZoomChange={handleZoomChange} />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Outline */}
        <DocumentOutline
          isOpen={isOutlineOpen}
          onClose={() => setIsOutlineOpen(false)}
          headings={headings}
          onHeadingClick={handleHeadingClick}
          documentTitle={documentTitle}
        />

        {/* Editor Area - Google Docs style paper */}
        <div className="flex-1 overflow-auto bg-secondary/30">
          <div className="flex justify-center py-6 px-4 min-h-full">
            <div 
              className="bg-background shadow-lg rounded-sm w-full max-w-[816px] min-h-[1056px]"
              style={{ 
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
              }}
            >
              <div className="p-16">
                <EditorContent 
                  editor={editor} 
                  className="prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[900px]"
                />
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
          <span>Zoom: {zoom}%</span>
        </div>
      </footer>

      {/* Template Sidebar */}
      <TemplateSidebar
        isOpen={isTemplateSidebarOpen}
        onClose={() => setIsTemplateSidebarOpen(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
};