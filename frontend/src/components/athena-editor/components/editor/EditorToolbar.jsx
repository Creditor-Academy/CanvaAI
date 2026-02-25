// src/components/athena-editor/components/editor/EditorToolbar.jsx
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
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
  Image as ImageIcon,
  Table as TableIcon,
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
  MoreHorizontal,
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
  FileEdit,
  RotateCcw,
  Droplets,
} from 'lucide-react';
import { Separator } from '../ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '../ui/tooltip';
import IndentControls from './toolbar/IndentControls.jsx';
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
  DropdownMenuCheckboxItem,
  DropdownMenuLabel
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { cn } from '../utils';
import { toast } from 'sonner';

// AI Assistant Components
import { AIInlineActions } from './AIInlineActions.tsx';
import { CodeAssistant } from './CodeAssistant';

// Import AI-related utilities
import { generateDocument, rewriteText, expandText, summarizeText, changeTone, fixGrammar, bulletToParagraph, generateCode, explainCode, refactorCode, addComments } from '../../ai/aiUtils';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

// New feature components
import { CommentsPanel } from './CommentsPanel';
import { VersionHistory } from './VersionHistory';
import { VoiceTyping } from './VoiceTyping';
import { PageSetupDialog } from './PageSetupDialog';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { WordCountDialog } from './WordCountDialog';


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
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
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
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs bg-gray-800 text-white px-2 py-1 rounded shadow-lg">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

export const EditorToolbar = ({
  editor,
  zoom,
  onZoomChange,
  onSave,
  handleInsertImage,
  setShowReferencesPanel,
  setIsAISidebarOpen,
  isAISidebarOpen,
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
  toggleBlockquote
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
        if (node && (node.type.name === 'table' || node.type.name === 'tableRow' || node.type.name === 'tableCell')) {
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
  const [showAIDocumentGenerator, setShowAIDocumentGenerator] = useState(false);
  const [showAIInlineActions, setShowAIInlineActions] = useState(false);
  const [showCodeAssistant, setShowCodeAssistant] = useState(false);
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
  const [pageMargins, setPageMargins] = useState({ top: 72, bottom: 72, left: 72, right: 72 });
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
    if (editor) {
      editor
        .chain()
        .focus()
        .setFontSize(`${size}px`)
        .run();
    }
    setCurrentFontSizeState(size);
  };

  useEffect(() => {
    if (editor && currentFontSize) {
      editor
        .chain()
        .setFontSize(`${currentFontSize}px`)
        .run();
    }
  }, [editor, currentFontSize]);

  if (!editor) return null;

  // ========================
  // ROUTING FUNCTIONS
  // ========================

  const handleNavigation = (path) => {
    if (navigateTo) {
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

  // List toggle functions
  const toggleBulletList = () => {
    if (editor) {
      editor
        .chain()
        .focus()
        .toggleBulletList()
        .run();
      toast.success('Bullet list toggled');
    }
  };

  const toggleOrderedList = () => {
    if (editor) {
      editor
        .chain()
        .focus()
        .toggleOrderedList()
        .run();
      toast.success('Numbered list toggled');
    }
  };

  const removeListFormatting = () => {
    if (editor) {
      // Remove both bullet and ordered list formatting
      editor
        .chain()
        .focus()
        .liftListItem('listItem')
        .run();

      // Also try to convert list items back to paragraphs
      if (editor.isActive('bulletList') || editor.isActive('orderedList')) {
        editor
          .chain()
          .focus()
          .lift('listItem')
          .run();
      }

      toast.success('List formatting removed');
    }
  };

  const toggleTaskList = () => {
    if (editor) {
      editor
        .chain()
        .focus()
        .toggleTaskList()
        .run();
      toast.success('Task list toggled');
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
    const previousUrl = editor?.getAttributes('link').href;
    const url = prompt('Enter URL:', previousUrl || '');
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
    if (handleInsertImage) {
      handleInsertImage();
    } else {
      const url = prompt('Enter image URL:');
      if (url && editor) {
        editor
          .chain()
          .focus()
          .setImage({ src: url })
          .run();
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
    if (editor) {
      // Use standard Tiptap table
      editor
        .chain()
        .focus()
        .insertTable({ rows: rows, cols: cols, withHeaderRow: true })
        .run();
      toast.success(`${rows}x${cols} table inserted`);
      setShowTablePicker(false);
      setSelectedRows(0);
      setSelectedCols(0);
    } else {
      toast.error('Editor not available');
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
            className={`w-5 h-5 border border-gray-200 ${isSelected ? 'bg-blue-100 border-blue-300' : 'bg-white'} hover:bg-blue-50 cursor-pointer transition-colors`}
            onMouseEnter={() => handleTablePickerHover(row, col)}
            onClick={() => insertTable(row, col)}
          />
        );
      }
    }

    return (
      <div className="p-2">
        <div className="grid grid-cols-10 gap-0.5 bg-white p-1">
          {cells}
        </div>
        <div className="text-center mt-2 text-sm text-gray-600 font-medium">
          {selectedRows > 0 && selectedCols > 0 ? `${selectedCols} x ${selectedRows}` : 'Select table size'}
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
      editor.chain().focus().addRowAfter().run();
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
      editor.chain().focus().addColumnAfter().run();
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
      editor.chain().focus().deleteRow().run();
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
      editor.chain().focus().deleteColumn().run();
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
      editor.chain().focus().toggleHeaderCell().run();
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
        editor.chain().focus().deleteTable().run();
        toast.success('Table deleted');
      }
    } else {
      toast.error('No table selected or feature not available');
    }
  };

  const addSectionBreak = (type = 'page') => {
    if (editor) {
      editor
        .chain()
        .focus()
        .setHorizontalRule()
        .run();

      toast.success(`Section break (${type}) inserted`);
    }
  };

  const handlePrint = () => {
    // Small delay to ensure editor content is ready
    setTimeout(() => {
      if (onPrint && typeof onPrint === 'function') {
        // Pass the editor content to the parent component's print handler
        const content = editor && typeof editor.getHTML === 'function' ? editor.getHTML() : '';
        onPrint(content);
      } else {
        // Fallback: Create a print-friendly version directly
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          // Ensure editor exists and has content
          let content = '';

          try {
            content = editor && typeof editor.getHTML === 'function' ? editor.getHTML() : '';

            // If editor.getHTML() is not available or returns empty, try alternative methods
            if (!content) {
              // Try to get content from editor state
              if (editor && editor.state) {
                content = editor.state.doc.textContent || '';
                // Convert plain text to HTML if needed
                if (content && !content.includes('<')) {
                  content = `<p>${content.replace(/\n/g, '</p><p>').replace(/\r/g, '<br>')}</p>`;
                }
              }
            }
          } catch (error) {
            console.error('Error getting editor content:', error);
            content = '<p>Error retrieving content. Please try again.</p>';
          }

          // Check if content is empty and provide fallback
          const htmlContent = content && content.trim() !== '' ? content : '<p>No content to print</p>';

          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Print Document</title>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    margin: 0 auto;
                    max-width: 1000px;
                    line-height: 1.6;
                    min-height: 200px;
                  }
                  @media print {
                    body { margin: 0; padding: 0.5in; }
                  }
                  /* Ensure all content is visible */
                  * { visibility: visible; }
                  img { max-width: 100%; height: auto; }
                </style>
              </head>
              <body>
                ${htmlContent}
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();

          // Wait for content to render then print
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
              printWindow.close();
            }, 500);
          };
        }
      }
    }, 100); // Small delay to ensure editor state is ready
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
    if (editor && editor.state && editor.state.selection) {
      const { from, to } = editor.state.selection;
      editor
        .chain()
        .focus()
        .updateAttributes('paragraph', { lineHeight: spacing })
        .run();
      setLineSpacing(spacing);
      toast.success(`Line spacing set to ${spacing}`);
    }
  };

  // Document Structure Functions
  const setTextAlign = (alignment) => {
    if (editor) {
      editor.chain().focus().setTextAlign(alignment).run();
    }
  };

  const removeTextAlignment = () => {
    if (editor) {
      // Remove text alignment by setting it back to default (left)
      editor
        .chain()
        .focus()
        .unsetTextAlign()
        .run();
      toast.success('Text alignment removed');
    }
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
          const result = editor.chain().focus().sinkListItem('listItem').run();
          console.log('Sink list item result:', result);
          toast.success('List item indented');
        } else {
          // For regular paragraphs/headers, use the standard indent
          console.log('Indenting regular text');
          const result = editor.chain().focus().indent().run();
          console.log('Indent result:', result);
          if (result) {
            toast.success('Text indented');
          }
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
          const result = editor.chain().focus().liftListItem('listItem').run();
          console.log('Lift list item result:', result);
          toast.success('List item outdented');
        } else {
          // For regular paragraphs/headers, use the standard outdent
          console.log('Outdenting regular text');
          const result = editor.chain().focus().outdent().run();
          console.log('Outdent result:', result);
          if (result) {
            toast.success('Text outdented');
          }
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
    editor.chain().focus().toggleCodeBlock().run();
    toast.success('Code block toggled');
  };

  const insertCodeBlockWithLanguage = (language) => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }

    // Set the language and insert code block
    editor.chain().focus().toggleCodeBlock().run();

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
      switch (action) {
        case 'bold':
          editor.chain().focus().toggleBold().run();
          break;
        case 'italic':
          editor.chain().focus().toggleItalic().run();
          break;
        case 'underline':
          editor.chain().focus().toggleUnderline().run();
          break;
        case 'strike':
          editor.chain().focus().toggleStrike().run();
          break;
        case 'superscript':
          editor.chain().focus().toggleSuperscript().run();
          toast.success('Superscript applied');
          break;
        case 'subscript':
          editor.chain().focus().toggleSubscript().run();
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
              editor.chain().focus().setImage({ src: url }).run();
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
            editor.chain().focus().setLink({ href: linkUrl }).run();
            toast.success('Link inserted');
          }
          break;
        case 'page_break':
          editor.chain().focus().setHorizontalRule().run();
          toast.success('Page break inserted');
          break;
        case 'date':
          const date = new Date().toLocaleDateString();
          editor.chain().focus().insertContent(date).run();
          toast.success('Date inserted');
          break;
        case 'time':
          const time = new Date().toLocaleTimeString();
          editor.chain().focus().insertContent(time).run();
          toast.success('Time inserted');
          break;
        case 'symbol':
          const symbol = prompt('Enter symbol (e.g., ©, ®, ™):', '©');
          if (symbol) {
            editor.chain().focus().insertContent(symbol).run();
            toast.success('Symbol inserted');
          }
          break;
        case 'equation':
          editor.chain().focus().insertContent('\\[E = mc^2\\]').run();
          toast.success('Equation inserted');
          break;
        case 'code_block':
          editor.chain().focus().toggleCodeBlock().run();
          toast.success('Code block toggled');
          break;
        case 'quote':
          editor.chain().focus().toggleBlockquote().run();
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
            editor.commands.setContent(full);
          }
        );
        toast.success('Document forged successfully');
      } catch (error) {
        toast.error('Failed to generate document');
      }
    }

    setShowAIDocumentGenerator(false);
  };

  const handleAIInlineAction = async (actionOrMode, textOrResult) => {
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
        editor.chain().focus().insertContent(result).run();
        toast.success('Text replaced with AI version');
      } else {
        // Insert after selection
        editor.chain().focus().insertContentAt(to, `\n\n${result}`).run();
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
        const options = { temperature: 0.7 };

        switch (actionOrMode) {
          case 'rewrite': result = await rewriteText(textOrResult, options); break;
          case 'expand': result = await expandText(textOrResult, options); break;
          case 'summarize': result = await summarizeText(textOrResult, options); break;
          case 'change_tone': result = await changeTone(textOrResult, 'professional', options); break;
          case 'fix_grammar': result = await fixGrammar(textOrResult, options); break;
          case 'bullets_to_paragraph': result = await bulletToParagraph(textOrResult, options); break;
          default: return;
        }

        if (!editor) {
          toast.error('Editor is not ready');
          return;
        }

        const { from, to } = editor.state.selection;
        editor.commands.deleteRange({ from, to });
        editor.commands.insertContent(result);
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
        editor.chain().focus().deleteRange({ from, to: rangeTo }).insertContent(formattedCode).run();
        toast.success('Code replaced with AI version');
      } else {
        editor.chain().focus().insertContentAt(to, `\n\n${formattedCode}`).run();
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

        editor.commands.insertContent(formattedCode);
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

    // Wrap current selection or paragraph with bordered div
    const borderedContent = `
        <div style="
        border: ${borderStyle};
        padding: 10px;
        margin: 5px 0;
      ">
          ${editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ' '
    ) || 'Content with border'}
        </div>
        `;

    editor.chain().focus().insertContent(borderedContent).run();
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
    editor.chain().focus().insertContent(sectionBreakHTML).run();
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
    editor.chain().focus().setTextDirection(dir).run();
    toast.success(`Text direction set to ${dir.toUpperCase()}`);
  };

  // ========================
  // FIND & REPLACE (live)
  // ========================
  const performFind = (term, replaceWith = null) => {
    if (!editor || !term) return;
    const content = editor.getHTML();
    if (replaceWith !== null) {
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const newContent = content.replace(regex, replaceWith);
      editor.commands.setContent(newContent);
      toast.success(`Replaced occurrences of "${term}"`);
    } else {
      const text = editor.getText();
      const found = (text.toLowerCase().match(new RegExp(term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
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
    // Apply lineHeight to all paragraphs via CSS
    const editorEl = document.querySelector('.tiptap.ProseMirror');
    if (editorEl) editorEl.style.lineHeight = value.toString();
    editor.chain().focus().run();
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
              const newWindow = window.open('/editor', '_blank');
              if (newWindow) {
                newWindow.addEventListener('load', () => {
                  try { newWindow.localStorage?.setItem('duplicatedContent', html); } catch (e) { }
                });
              }
              toast.success('Document duplicated in new tab');
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
        { label: 'Image', icon: ImageIcon, action: () => handleInsertAction('image') },
        { label: 'Crop Image', icon: Crop, action: openImageCropper },
        {
          label: 'Table', icon: TableIcon, action: () => {
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
                  editor.chain().focus().insertContent(multilevelList).run();
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
                    editor.chain().focus().setLineHeight(spacingValue).run();
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

                    editor.chain().focus().insertContent(spacingHTML).run();
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
    },
    {
      label: 'Help',
      items: [
        { label: 'Help Center', icon: HelpCircle, action: () => handleExternalLink('https://help.athena-ai.com') },
        { label: 'Keyboard Shortcuts', icon: Keyboard, shortcut: 'Ctrl+/', action: () => setShowShortcutsDialog(true) },
        { type: 'separator' },
        { label: 'About', icon: Info, action: () => toast.info('Athena-AI Editor v2.0') },
      ]
    }
  ];

  const renderMenu = () => {
    return (
      <div className="flex items-center gap-0">
        {menuItems.map(item => (
          <DropdownMenu key={item.label}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-sm font-medium text-gray-700 hover:bg-blue-100/50 hover:text-blue-800 rounded-md transition-colors"
              >
                {item.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white border border-blue-100 shadow-xl rounded-md p-1">
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
                      <DropdownMenuSubContent className="w-48 bg-white border border-blue-100 shadow-xl rounded-md p-1">
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
      className="sticky top-0 z-40 bg-[#eaf2ff] border-b border-blue-200 shadow-sm"
      style={{ contain: 'layout style' }}
    >
      {/* Header with Menu */}
      <div className="flex items-center justify-between px-4 py-1 border-b border-blue-100">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 font-bold tracking-wider" style={{ fontSize: "1.05rem" }}>ATHENA-AI EDITOR</span>
          <div className="flex items-center gap-1.5 ml-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-green-500 font-medium">Editor ready</span>
          </div>
        </div>

        <div className="flex-1 flex justify-start ml-8">
          {renderMenu()}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full px-1 bg-white/50 border border-transparent hover:bg-white transition-colors">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-blue-600 hover:bg-transparent" onClick={() => onZoomChangeWithFeedback(Math.max(50, effectiveZoom - 10))}><Minus className="w-3.5 h-3.5" /></Button>
            <span className="text-xs font-medium w-12 text-center text-gray-700 bg-white rounded py-1 border border-blue-50">{effectiveZoom}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-blue-600 hover:bg-transparent" onClick={() => onZoomChangeWithFeedback(Math.min(200, effectiveZoom + 10))}><Plus className="w-3.5 h-3.5" /></Button>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white text-blue-600 hover:bg-blue-50 shadow-sm transition-colors border border-transparent" onClick={() => setShowSearch(true)}><Search className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white text-blue-600 hover:bg-blue-50 shadow-sm transition-colors border border-transparent" onClick={() => handlePrint()}><Printer className="w-4 h-4" /></Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full transition-colors border border-transparent shadow-sm ${isAISidebarOpen
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-200'
              }`}
            onClick={() => setIsAISidebarOpen(!isAISidebarOpen)}
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Compact Single-Row Toolbar */}
      <div className="flex items-center px-4 py-0.5 gap-1.5 overflow-x-auto" style={{ contain: 'layout' }}>
        {/* History Controls */}
        < ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          tooltip="Undo (Ctrl+Z)"
          className="rounded-lg bg-linear-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-600 border border-blue-200 transition-all duration-300"
        >
          <Undo className="w-4 h-4 text-blue-600" />
        </ToolbarButton >
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          tooltip="Redo (Ctrl+Y)"
          className="rounded-lg bg-linear-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-600 border border-blue-200 transition-all duration-300"
        >
          <Redo className="w-4 h-4 text-blue-600" />
        </ToolbarButton>

        <div className="mx-1.5 h-6 w-px bg-blue-200/60" />

        {/* Font Controls */}
        <select
          value={currentFont}
          onChange={(e) => setFontFamily(e.target.value)}
          className="text-xs bg-[#f4f8ff] text-gray-700 rounded-full px-3 h-8 min-w-25 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 border border-blue-200 shadow-sm transition-colors"
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
          className="text-xs bg-[#f4f8ff] text-gray-700 rounded-full px-3 h-8 w-16 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 border border-blue-200 shadow-sm transition-colors"
        >
          {FONT_SIZES.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <select
            value={activeHeadingLevel || 0}
            onChange={(e) => {
              console.log('Toolbar heading change to:', e.target.value);
              handleHeadingChange(parseInt(e.target.value));
            }}
            className="text-xs bg-[#f4f8ff] text-gray-700 rounded-full px-3 h-8 min-w-22.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 border border-blue-200 shadow-sm transition-colors"
          >
            <option value={0}>Normal</option>
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
            <option value={4}>H4</option>
            <option value={5}>H5</option>
            <option value={6}>H6</option>
          </select>
          <div className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-50 rounded-full">
            Level: {activeHeadingLevel || 0}
          </div>
        </div>

        <div className="mx-1.5 h-6 w-px bg-blue-200/60" />

        {/* Basic Formatting */}
        <ToolbarButton
          onClick={() => handleFormatAction('bold')}
          isActive={editor.isActive("bold")}
          tooltip="Bold (Ctrl+B)"
          className="rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <Bold className="w-4 h-4 text-blue-600" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleFormatAction('italic')}
          isActive={editor.isActive("italic")}
          tooltip="Italic (Ctrl+I)"
          className="rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <Italic className="w-4 h-4 text-blue-600" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleFormatAction('underline')}
          isActive={editor.isActive("underline")}
          tooltip="Underline (Ctrl+U)"
          className="rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <Underline className="w-4 h-4 text-blue-600" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleFormatAction('strike')}
          isActive={editor.isActive("strike")}
          tooltip="Strikethrough"
          className="rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <Strikethrough className="w-4 h-4 text-blue-600" />
        </ToolbarButton>

        <div className="mx-1.5 h-6 w-px bg-blue-200/60" />

        {/* Text Color Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 transition-all duration-300">
              <Palette className="w-4 h-4 text-blue-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 p-3 rounded-xl shadow-lg border border-gray-200 bg-white">
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium mb-2">Text Color</h4>
                <div className="grid grid-cols-6 gap-1">
                  {TEXT_COLORS.slice(0, 12).map(color => (
                    <button
                      key={color}
                      className={cn(
                        "w-6 h-6 rounded border hover:scale-110 transition-transform shadow-sm",
                        currentTextColor === color && "ring-2 ring-blue-500"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setTextColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Highlight Color Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 transition-all duration-300">
              <Highlighter className="w-4 h-4 text-blue-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 p-3 rounded-xl shadow-lg border border-gray-200 bg-white">
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium mb-2">Highlight Color</h4>
                <div className="grid grid-cols-6 gap-1">
                  {HIGHLIGHT_COLORS.slice(0, 12).map(color => (
                    <button
                      key={color}
                      className={cn(
                        "w-6 h-6 rounded border hover:scale-110 transition-transform shadow-sm",
                        currentHighlight === color && "ring-2 ring-blue-500"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setHighlightColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-1.5 h-6 w-px bg-blue-200/60" />

        {/* Lists Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-lg transition-all duration-300 ${(editor.isActive("bulletList") || editor.isActive("orderedList") || editor.isActive("taskList"))
                ? "bg-linear-to-br from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 text-green-700 border-2 border-green-300"
                : "bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600"
                }`}
            >
              <List className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 bg-white z-100 shadow-lg border border-gray-200 rounded-md p-1">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-lg transition-all duration-300 ${(editor.isActive({ textAlign: 'left' }) || editor.isActive({ textAlign: 'center' }) || editor.isActive({ textAlign: 'right' }) || editor.isActive({ textAlign: 'justify' }))
                ? "bg-linear-to-br from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 text-green-700 border-2 border-green-300"
                : "bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600"
                }`}
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 bg-white z-100 shadow-lg border border-gray-200 rounded-md p-1">
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
                        editor
                          .chain()
                          .focus()
                          .setResizableImage({
                            src: imageDataUrl,
                            alt: file.name,
                            title: file.name
                          })
                          .run();
                      } else {
                        editor
                          .chain()
                          .focus()
                          .setImage({
                            src: imageDataUrl,
                            alt: file.name,
                            title: file.name
                          })
                          .run();
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
          tooltip="Insert Image"
          className="rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <ImageIcon className="w-4 h-4 text-blue-600" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => {
            if (setIsTemplateSidebarOpen) {
              setIsTemplateSidebarOpen(true);
            } else {
              toast.info('Template sidebar is not available');
            }
          }}
          tooltip="Templates"
          className="rounded-lg bg-gradient-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <LayoutTemplate className="w-4 h-4 text-blue-600" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => handleInsertAction('link')}
          tooltip="Insert Link"
          className="rounded-lg bg-gradient-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <Link className="w-4 h-4 text-blue-600" />
        </ToolbarButton>

        {/* Table Button with Picker */}
        <div className="relative inline-block" data-table-container="true" style={{ position: 'relative', display: 'inline-block' }} ref={tableButtonRef}>
          <ToolbarButton
            onClick={() => {
              if (showTablePicker) {
                setShowTablePicker(false);
                setSelectedRows(0);
                setSelectedCols(0);
              } else {
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
            <TableIcon className={`w-4 h-4 ${isInsideTable() ? "text-white" : "text-blue-600"}`} />
          </ToolbarButton>

          {/* Table Picker Dropdown - Rendered in Portal to escape overflowing containers */}
          {showTablePicker && ReactDOM.createPortal(
            <div
              className="fixed z-9999 bg-white rounded-lg shadow-xl border border-gray-200"
              ref={tablePickerRef}
              style={{
                position: 'fixed',
                zIndex: 9999,
                backgroundColor: 'white',
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
              onClick={toggleCodeBlock}
              isActive={editor.isActive('codeBlock')}
              tooltip="Insert Code Block"
              className="h-8 w-8 rounded-r-none bg-transparent hover:bg-transparent"
            >
              <Code className="w-4 h-4 text-blue-600" />
            </ToolbarButton>
            <DropdownMenu open={showCodeBlockMenu} onOpenChange={setShowCodeBlockMenu}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-6 rounded-l-none bg-transparent hover:bg-blue-200 hover:text-blue-700 transition-all duration-200 border-l border-blue-300"
                  onClick={() => setShowCodeBlockMenu(!showCodeBlockMenu)}
                >
                  <ChevronDown className="w-3 h-3 text-blue-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
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
                          onClick={() => insertCodeBlockWithLanguage(lang)}
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
                        onClick={executeCodeBlock}
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
          onClick={toggleBlockquote}
          isActive={editor.isActive('blockquote')}
          tooltip="Insert Block Quote"
          className="rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <Quote className="w-4 h-4 text-blue-600" />
        </ToolbarButton>

        <div className="mx-1.5 h-6 w-px bg-blue-200/60" />

        {/* AI Tools */}
        <ToolbarButton
          onClick={() => setShowAIDocumentGenerator(true)}
          tooltip="Generate Document with AI"
          className="rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => setShowAIInlineActions(true)}
          tooltip="AI Inline Actions"
          className="rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <Wand2 className="w-4 h-4 text-blue-600" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => setShowCodeAssistant(true)}
          tooltip="Code Assistant"
          className="rounded-lg bg-linear-to-br from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-600 transition-all duration-300"
        >
          <Code2 className="w-4 h-4 text-blue-600" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-2 h-5" />

        {/* More Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded bg-gray-100 hover:bg-gray-200">
              <MoreHorizontal className="w-4 h-4 text-gray-700" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Additional Options</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleFormatAction('superscript')}>
              <Superscript className="w-4 h-4 mr-2" /> Superscript
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFormatAction('subscript')}>
              <Subscript className="w-4 h-4 mr-2" /> Subscript
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleBlockquote}>
              <Quote className="w-4 h-4 mr-2" /> Block Quote
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleCodeBlock}>
              <Code className="w-4 h-4 mr-2" /> Code Block
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openCodeBlockConfigDialog}>
              <Code2 className="w-4 h-4 mr-2" /> Code Block Configuration
            </DropdownMenuItem>
            <DropdownMenuItem onClick={executeCodeBlock} disabled={!editor.isActive('codeBlock') || !codeExecutionEnabled}>
              <Play className="w-4 h-4 mr-2" /> Execute Code Block
            </DropdownMenuItem>
            <DropdownMenuItem onClick={clearFormatting}>
              <RemoveFormatting className="w-4 h-4 mr-2" /> Clear Formatting
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleInsertAction('page_break')}>
              <Minus className="w-4 h-4 mr-2" /> Page Break
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openImageCropper}>
              <Crop className="w-4 h-4 mr-2" /> Crop Image
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={addNewPage}>
              <FilePlus className="w-4 h-4 mr-2" /> Add New Page
            </DropdownMenuItem>
            <DropdownMenuItem onClick={addPageBreak}>
              <MoreHorizontal className="w-4 h-4 mr-2" /> Insert Page Break
            </DropdownMenuItem>
            <DropdownMenuItem onClick={insertPageNumber}>
              <Hash className="w-4 h-4 mr-2" /> Insert Page Number
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Table Tools</DropdownMenuLabel>
            <DropdownMenuItem onClick={addTableRow} disabled={!isInsideTable()}>
              <Rows className="w-4 h-4 mr-2" /> Add Row
            </DropdownMenuItem>
            <DropdownMenuItem onClick={addTableColumn} disabled={!isInsideTable()}>
              <Columns className="w-4 h-4 mr-2" /> Add Column
            </DropdownMenuItem>
            <DropdownMenuItem onClick={deleteTableRow} disabled={!isInsideTable()}>
              <Minus className="w-4 h-4 mr-2" /> Delete Row
            </DropdownMenuItem>
            <DropdownMenuItem onClick={deleteTableColumn} disabled={!isInsideTable()}>
              <Minus className="w-4 h-4 mr-2" /> Delete Column
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTableHeader} disabled={!isInsideTable()}>
              <Heading className="w-4 h-4 mr-2" /> Toggle Header
            </DropdownMenuItem>
            <DropdownMenuItem onClick={deleteTable} disabled={!isInsideTable()}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Table
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowPageSetup(true)}>
              <Ruler className="w-4 h-4 mr-2" /> Page Setup
            </DropdownMenuItem>
            <DropdownMenuItem onClick={insertSectionBreak}>
              <Split className="w-4 h-4 mr-2" /> Insert Section Break
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

      {/* AI Document Generator Dialog */}
      <Dialog open={showAIDocumentGenerator} onOpenChange={setShowAIDocumentGenerator}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-xl border border-blue-200/60 rounded-4xl shadow-2xl overflow-hidden p-0" aria-describedby="ai-document-generator-description">
          <div className="bg-linear-to-r from-[#0c496e] to-[#1e40af] px-8 py-6 text-white relative shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Sparkles className="w-5 h-5 text-gold" style={{ color: '#fabf23' }} />
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-white">Generate with AI</DialogTitle>
              </div>
              <DialogDescription className="text-blue-100/80 font-medium">
                Describe your vision and Athena will craft a professional document for you.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            <div className="space-y-3">
              <Label htmlFor="topic" className="text-sm font-bold text-[#0c496e] ml-1 uppercase tracking-wider">Document Topic</Label>
              <div className="relative group">
                <Input
                  id="topic"
                  placeholder="e.g., Marketing Strategy for 2026..."
                  value={documentTopic}
                  onChange={(e) => setDocumentTopic(e.target.value)}
                  className="h-14 bg-slate-50 border-slate-200 rounded-2xl pl-4 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all shadow-sm group-hover:shadow-md border-2 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="pages" className="text-sm font-bold text-[#0c496e] ml-1 uppercase tracking-wider">Length</Label>
                <Select value={documentPages.toString()} onValueChange={(value) => setDocumentPages(parseInt(value))}>
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all border-2">
                    <SelectValue placeholder="Select pages" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    {[1, 2, 3, 5, 10].map(num => (
                      <SelectItem key={num} value={num.toString()} className="rounded-lg">{num} page{num > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="tone" className="text-sm font-bold text-[#0c496e] ml-1 uppercase tracking-wider">Tone of Voice</Label>
                <Select value={documentTone} onValueChange={setDocumentTone}>
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all border-2">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    {TONES.map(tone => (
                      <SelectItem key={tone} value={tone} className="rounded-lg">{tone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="type" className="text-sm font-bold text-[#0c496e] ml-1 uppercase tracking-wider">Document Category</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all border-2">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    {['Technical Document', 'Blog Post', 'Research Paper', 'Business Report', 'Creative Story', 'Meeting Minutes'].map(type => (
                      <SelectItem key={type} value={type} className="rounded-lg">{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-sm font-bold text-[#0c496e] ml-1 uppercase tracking-wider">Creativity</Label>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                    {Math.round(documentCreativity[0] * 100)}%
                  </span>
                </div>
                <div className="h-12 flex items-center px-2">
                  <Slider
                    value={documentCreativity}
                    onValueChange={setDocumentCreativity}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowAIDocumentGenerator(false)}
                className="flex-1 h-12 rounded-xl border-2 border-slate-200 hover:bg-slate-50 font-bold text-slate-600 transition-all font-sans"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleGenerateDocument();
                  setShowAIDocumentGenerator(false);
                }}
                disabled={!documentTopic || !documentTopic.trim()}
                className="flex-2 h-14 rounded-xl bg-linear-to-r from-[#0c496e] to-[#1e40af] hover:shadow-xl shadow-[#0c496e]/20 text-white font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Forge Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* AI Inline Actions */}
      <AIInlineActions
        open={showAIInlineActions}
        onOpenChange={setShowAIInlineActions}
        onAction={handleAIInlineAction}
        selectedText={editor && editor.state && editor.state.selection && editor.state.selection.$from ? editor.state.doc.textBetween(editor.state.selection.from, Math.min(editor.state.selection.to, editor.state.selection.from + 1000)) || "" : ""}
      />

      {/* Code Assistant */}
      <CodeAssistant
        open={showCodeAssistant}
        onOpenChange={setShowCodeAssistant}
        onAction={handleCodeAssistant}
        selectedCode={editor && editor.state && editor.state.selection && editor.state.selection.$from ? editor.state.doc.textBetween(editor.state.selection.from, Math.min(editor.state.selection.to, editor.state.selection.from + 1000)) || "" : ""}
      />

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
                  <format.icon className="w-5 h-5 mr-3 text-blue-600" />
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
                  onKeyDown={e => { if (e.key === 'Enter' && linkUrl) { editor.chain().focus().setLink({ href: linkUrl }).run(); toast.success('Link inserted'); setShowInsertLink(false); setLinkUrl(''); setLinkDisplayText(''); } }} />
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button onClick={() => setShowInsertLink(false)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={() => { if (!linkUrl) return; editor.chain().focus().setLink({ href: linkUrl }).run(); toast.success('Link inserted'); setShowInsertLink(false); setLinkUrl(''); setLinkDisplayText(''); }}
                  disabled={!linkUrl} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50">Insert</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </motion.div >
  );
};


export default EditorToolbar;
