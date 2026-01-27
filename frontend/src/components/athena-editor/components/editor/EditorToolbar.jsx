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
  Image as ImageIcon,
  Table as TableIcon,
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
  ChevronRight,
  ArrowRightToLine,
  ArrowLeftToLine,
  Link as LinkIcon,
  FilePlus,
  Trash2,
  EyeOff,
  PaintBucket,
  Crop,
  Maximize,
  Minimize,
  RotateCw,
  RotateCcw,
  Filter,
  Layers,
  Grid3x3,
  RulerIcon
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
  DropdownMenuCheckboxItem,
  DropdownMenuLabel
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
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
          "h-9 w-9 p-0 hover:bg-gray-100 rounded-lg",
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

export const EditorToolbar = ({ 
  editor, 
  zoom, 
  onZoomChange, 
  onSave, 
  handleInsertImage, 
  setShowReferencesPanel, 
  setIsAISidebarOpen,
  isAISidebarOpen,
  onExportPDF,
  onPrint,
  showFormatMenu,
  setShowFormatMenu,
  showInsertMenu,
  setShowInsertMenu,
  addNewPage,  // Added page functions
  addPageBreak,
  insertPageNumber,
  handleHeadingChange,  // Added heading function
  activeHeadingLevel  // Added active heading level
}) => {
  const [linkUrl, setLinkUrl] = useState("");
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
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [showImageDialog, setShowImageDialog] = useState(false);

  // Helper function to set font size
  const setCurrentFontSize = (size) => {
    if (editor) {
      editor
        .chain()
        .focus()
        .setMark('fontSize', { fontSize: `${size}px` })
        .run();
    }
    setCurrentFontSizeState(size);
  };

  useEffect(() => {
    if (editor && currentFontSize) {
      editor
        .chain()
        .setMark('fontSize', { fontSize: `${currentFontSize}px` })
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
    // Call the image insertion handler from TextEditor
    if (handleInsertImage) {
      handleInsertImage();
    } else {
      // Fallback to simple prompt if handler not provided
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

  const addSectionBreak = (type = 'page') => {
    if (editor) {
      // Insert a horizontal rule to simulate section break
      editor
        .chain()
        .focus()
        .setHorizontalRule()
        .run();
      
      toast.success(`Section break (${type}) inserted`);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleExportPDF = () => {
    if (onExportPDF) {
      onExportPDF();
    } else {
      toast.info('PDF export functionality would be implemented here');
    }
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
      // Apply to current selection or paragraph
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
  const toggleBulletList = () => {
    if (editor) {
      editor.chain().focus().toggleBulletList().run();
    }
  };

  const toggleOrderedList = () => {
    if (editor) {
      editor.chain().focus().toggleOrderedList().run();
    }
  };

  const setTextAlign = (alignment) => {
    if (editor) {
      editor.chain().focus().setTextAlign(alignment).run();
    }
  };

  const indent = () => {
    if (editor) {
      editor.chain().focus().indent().run();
    }
  };

  const outdent = () => {
    if (editor) {
      editor.chain().focus().outdent().run();
    }
  };

  const toggleBlockquote = () => {
    if (editor) {
      editor.chain().focus().toggleBlockquote().run();
    }
  };

  const toggleCodeBlock = () => {
    if (editor) {
      editor.chain().focus().toggleCodeBlock().run();
    }
  };

  const clearAllFormatting = () => {
    if (editor) {
      editor.chain().focus().unsetAllMarks().clearNodes().setParagraph().run();
      toast.success('Formatting cleared');
    }
  };

  const openImageCropper = () => {
    // Find the closest image in the editor
    const { from, to } = editor.view.state.selection;
    let foundImage = false;
    
    // Look for image in the current selection
    editor.state.doc.nodesBetween(from, to, (node) => {
      if (node.type.name === 'image') {
        const imgSrc = node.attrs.src;
        setSelectedImage(imgSrc);
        setIsCropDialogOpen(true);
        
        // Load image to get dimensions
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
          // Set default crop area to center 50% of the image
          setCropArea({
            x: img.width * 0.25,
            y: img.height * 0.25,
            width: img.width * 0.5,
            height: img.height * 0.5
          });
        };
        img.src = imgSrc;
        foundImage = true;
        return false; // Stop iteration
      }
      return true;
    });
    
    // If no image in selection, try to find any image in the document
    if (!foundImage) {
      editor.state.doc.descendants(node => {
        if (node.type.name === 'image') {
          const imgSrc = node.attrs.src;
          setSelectedImage(imgSrc);
          setIsCropDialogOpen(true);
          
          // Load image to get dimensions
          const img = new Image();
          img.onload = () => {
            setImageDimensions({ width: img.width, height: img.height });
            // Set default crop area to center 50% of the image
            setCropArea({
              x: img.width * 0.25,
              y: img.height * 0.25,
              width: img.width * 0.5,
              height: img.height * 0.5
            });
          };
          img.src = imgSrc;
          foundImage = true;
          return false; // Stop iteration
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
    
    // Create a canvas to perform the crop
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas dimensions to the cropped area
      canvas.width = cropArea.width;
      canvas.height = cropArea.height;
      
      // Draw the cropped portion
      ctx.drawImage(
        img,
        cropArea.x, // sx
        cropArea.y, // sy
        cropArea.width, // sWidth
        cropArea.height, // sHeight
        0, // dx
        0, // dy
        cropArea.width, // dWidth
        cropArea.height // dHeight
      );
      
      // Convert to data URL and update the image in the editor
      const croppedImageDataUrl = canvas.toDataURL('image/png');
      
      // Find and replace the image in the editor
      // First, find the position of the original image
      let imagePos = null;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'image' && node.attrs.src === selectedImage) {
          imagePos = pos;
          return false; // Stop iteration
        }
        return true;
      });
      
      if (imagePos !== null) {
        // Replace the image at the found position
        editor.commands.deleteRange({ from: imagePos, to: imagePos + 1 });
        editor.commands.insertContentAt(imagePos, {
          type: 'image',
          attrs: { src: croppedImageDataUrl }
        });
      } else {
        // If we couldn't find the original image, just insert the new one
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
    if (!editor) return;
    
    switch(action) {
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
        break;
      case 'subscript':
        editor.chain().focus().toggleSubscript().run();
        break;
      default:
        break;
    }
  };

  const handleInsertAction = (action) => {
    if (!editor) return;
    
    switch(action) {
      case 'image':
        if (handleInsertImage) {
          handleInsertImage();
        } else {
          const url = prompt('Enter image URL:');
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }
        break;
      case 'table':
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
      case 'link':
        const linkUrl = prompt('Enter URL:');
        if (linkUrl) {
          editor.chain().focus().setLink({ href: linkUrl }).run();
        }
        break;
      case 'page_break':
        editor.chain().focus().setHorizontalRule().run();
        break;
      case 'date':
        const date = new Date().toLocaleDateString();
        editor.chain().focus().insertContent(date).run();
        break;
      case 'time':
        const time = new Date().toLocaleTimeString();
        editor.chain().focus().insertContent(time).run();
        break;
      case 'symbol':
        const symbol = prompt('Enter symbol (e.g., ©, ®, ™):', '©');
        if (symbol) {
          editor.chain().focus().insertContent(symbol).run();
        }
        break;
      case 'equation':
        editor.chain().focus().insertContent('\\[E = mc^2\\]').run();
        break;
      case 'code_block':
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case 'quote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      default:
        break;
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
        { label: "Save", icon: Save, shortcut: "Ctrl+S", action: () => {
          if (onSave) onSave();
        } },
        { label: "Save As...", icon: Save, shortcut: "Ctrl+Shift+S", action: () => toast.info('Save As dialog would appear here') },
        { type: "separator" },
        { label: "Print", icon: Printer, shortcut: "Ctrl+P", action: handlePrint },
        { type: "separator" },
        { 
          label: "Export", 
          icon: Download,
          submenu: [
            { label: "Export as PDF", icon: FileText, action: handleExportPDF },
            { label: "Export as DOCX", icon: FileText, action: () => toast.info('Exporting to DOCX...') },
            { label: "Export as HTML", icon: FileCode2, action: () => toast.info('Exporting to HTML...') },
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
        { label: "Image", icon: ImageIcon, action: () => handleInsertAction('image') },
        { label: "Crop Image", icon: Crop, action: openImageCropper },
        { label: "Table", icon: TableIcon, action: () => handleInsertAction('table') },
        { label: "Link", icon: LinkIcon, shortcut: "Ctrl+K", action: () => handleInsertAction('link') },
        { label: "References", icon: BookOpen, action: () => {
          if (setShowReferencesPanel) {
            setShowReferencesPanel(true);
          }
        } },
        { label: "Page Break", icon: Minus, action: () => handleInsertAction('page_break') },
        { type: "separator" },
        { label: "Date", icon: Calendar, action: () => handleInsertAction('date') },
        { label: "Time", icon: Clock, action: () => handleInsertAction('time') },
        { label: "Symbol", icon: Sigma, action: () => handleInsertAction('symbol') },
        { label: "Equation", icon: Calculator, action: () => handleInsertAction('equation') },
        { type: "separator" },
        { 
          label: "Blocks", 
          icon: Square,
          submenu: [
            { label: "Code Block", icon: Code, action: () => handleInsertAction('code_block') },
            { label: "Quote", icon: Quote, action: () => handleInsertAction('quote') },
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
            { label: "Bold", icon: Bold, shortcut: "Ctrl+B", action: () => handleFormatAction('bold') },
            { label: "Italic", icon: Italic, shortcut: "Ctrl+I", action: () => handleFormatAction('italic') },
            { label: "Underline", icon: Underline, shortcut: "Ctrl+U", action: () => handleFormatAction('underline') },
            { label: "Strikethrough", icon: Strikethrough, action: () => handleFormatAction('strike') },
            { type: "separator" },
            { label: "Superscript", icon: Superscript, shortcut: "Ctrl+Shift++", action: () => handleFormatAction('superscript') },
            { label: "Subscript", icon: Subscript, shortcut: "Ctrl+=", action: () => handleFormatAction('subscript') },
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
            { type: "separator" },
            { label: "Align Left", icon: AlignLeft, action: () => setTextAlign('left') },
            { label: "Align Center", icon: AlignCenter, action: () => setTextAlign('center') },
            { label: "Align Right", icon: AlignRight, action: () => setTextAlign('right') },
            { label: "Justify", icon: AlignJustify, action: () => setTextAlign('justify') },
          ]
        },
        { type: "separator" },
        { label: "Clear Formatting", icon: RemoveFormatting, shortcut: "Ctrl+Space", action: clearAllFormatting },
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
        { type: "separator" },
        { label: "Table of Contents", icon: ListChecks, action: () => toast.info('Generating table of contents...') },
        { label: "Comments", icon: MessageSquare, action: () => toast.info('Comments panel toggled') },
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
      className="sticky top-0 z-40 bg-white border-b border-gray-300 shadow-sm"
    >
      {/* Header with Menu */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold text-lg">
              ATHENA-AI EDITOR
            </div>
            <span className="text-xs flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${onSave ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className={onSave ? 'text-green-600' : 'text-gray-600'}>
                {onSave ? 'Editor ready' : 'Loading...'}
              </span>
            </span>
          </div>
         </div>

        {/* Center menu */}
        {renderMenu()}

        {/* Right section */}
        <div className="flex items-center gap-2">
          <ToolbarButton
            onClick={() => onZoomChange && onZoomChange(Math.max(50, zoom - 10))}
            tooltip="Zoom Out"
            className="rounded-lg bg-gray-100 hover:bg-gray-200 h-7 w-7 p-0"
          >
            <Minus className="w-3 h-3 text-gray-600" />
          </ToolbarButton>
          <div className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-700 min-w-[40px] text-center">
            {zoom}%
          </div>
          <ToolbarButton
            onClick={() => onZoomChange && onZoomChange(Math.min(200, zoom + 10))}
            tooltip="Zoom In"
            className="rounded-lg bg-gray-100 hover:bg-gray-200 h-7 w-7 p-0"
          >
            <Plus className="w-3 h-3 text-gray-600" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-2" />

          <ToolbarButton
            onClick={() => setShowSearch(!showSearch)}
            tooltip="Search (Ctrl+F)"
            className="rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <Search className="w-4 h-4 text-gray-600" />
          </ToolbarButton>

          <ToolbarButton 
            onClick={handlePrint} 
            tooltip="Print (Ctrl+P)"
            className="rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <Printer className="w-4 h-4 text-gray-600" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => {
              if (typeof setIsAISidebarOpen === 'function') {
                setIsAISidebarOpen(true);
              } else {
                toast.info('AI sidebar not available');
              }
            }}
            tooltip="AI Assistance"
            className="rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
          </ToolbarButton>

          <Button
            onClick={onSave}
            size="sm"
            variant="default"
            className="h-7 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-3 h-3 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* Compact Single-Row Toolbar */}
      <div className="flex items-center px-4 py-2 gap-1 border-t border-gray-200 bg-white overflow-x-auto">
        {/* History Controls */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          tooltip="Undo (Ctrl+Z)"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <Undo className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          tooltip="Redo (Ctrl+Y)"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <Redo className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        
        <Separator orientation="vertical" className="mx-2 h-6" />

        {/* Font Controls */}
        <select 
          value={currentFont}
          onChange={(e) => setFontFamily(e.target.value)}
          className="text-sm bg-white rounded-lg px-3 py-1.5 h-9 min-w-[120px] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm border border-gray-300"
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
          className="text-sm bg-white rounded-lg px-3 py-1.5 h-9 w-16 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm border border-gray-300"
        >
          {FONT_SIZES.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        
        <select 
          value={activeHeadingLevel || 0}
          onChange={(e) => handleHeadingChange(parseInt(e.target.value))}
          className="text-sm bg-white rounded-lg px-3 py-1.5 h-9 w-20 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm border border-gray-300"
        >
          <option value={0}>Normal</option>
          <option value={1}>H1</option>
          <option value={2}>H2</option>
          <option value={3}>H3</option>
          <option value={4}>H4</option>
          <option value={5}>H5</option>
          <option value={6}>H6</option>
        </select>
        
        <Separator orientation="vertical" className="mx-2 h-6" />

        {/* Basic Formatting */}
        <ToolbarButton
          onClick={() => handleFormatAction('bold')}
          isActive={editor.isActive("bold")}
          tooltip="Bold (Ctrl+B)"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <Bold className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleFormatAction('italic')}
          isActive={editor.isActive("italic")}
          tooltip="Italic (Ctrl+I)"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <Italic className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleFormatAction('underline')}
          isActive={editor.isActive("underline")}
          tooltip="Underline (Ctrl+U)"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <Underline className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleFormatAction('strike')}
          isActive={editor.isActive("strike")}
          tooltip="Strikethrough"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <Strikethrough className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        
        <Separator orientation="vertical" className="mx-2 h-6" />

        {/* Colors */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded bg-gray-100 hover:bg-gray-200">
              <Palette className="w-5 h-5 text-gray-700" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3 rounded-xl shadow-lg border border-gray-200">
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
              <div>
                <h4 className="text-xs font-medium mb-2">Highlight</h4>
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
          </PopoverContent>
        </Popover>
        
        <ToolbarButton
          onClick={() => setHighlightColor(currentHighlight)}
          tooltip="Highlight"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <Highlighter className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        
        <Separator orientation="vertical" className="mx-2 h-6" />

        {/* Lists */}
        <ToolbarButton
          onClick={toggleBulletList}
          isActive={editor.isActive("bulletList")}
          tooltip="Bullet List"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <List className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        <ToolbarButton
          onClick={toggleOrderedList}
          isActive={editor.isActive("orderedList")}
          tooltip="Numbered List"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <ListOrdered className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        
        <Separator orientation="vertical" className="mx-2 h-6" />
        
        {/* Text Alignment */}
        <ToolbarButton
          onClick={() => setTextAlign('left')}
          isActive={editor.isActive({ textAlign: 'left' })}
          tooltip="Align Left"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <AlignLeft className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setTextAlign('center')}
          isActive={editor.isActive({ textAlign: 'center' })}
          tooltip="Align Center"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <AlignCenter className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setTextAlign('right')}
          isActive={editor.isActive({ textAlign: 'right' })}
          tooltip="Align Right"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <AlignRight className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setTextAlign('justify')}
          isActive={editor.isActive({ textAlign: 'justify' })}
          tooltip="Justify"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <AlignJustify className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        
        <Separator orientation="vertical" className="mx-2 h-6" />
        
        {/* Indentation */}
        <ToolbarButton
          onClick={indent}
          tooltip="Increase Indent"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <ArrowRightToLine className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        <ToolbarButton
          onClick={outdent}
          tooltip="Decrease Indent"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <ArrowLeftToLine className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        
        <Separator orientation="vertical" className="mx-2 h-6" />
        
        {/* Quick Insert */}
        <ToolbarButton
          onClick={() => {
            if (handleInsertImage) {
              handleInsertImage();
            } else {
              setShowImageDialog(true);
            }
          }}
          tooltip="Insert Image"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <ImageIcon className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => handleInsertAction('link')}
          tooltip="Insert Link"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <LinkIcon className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => handleInsertAction('table')}
          tooltip="Insert Table"
          className="rounded bg-gray-100 hover:bg-gray-200"
        >
          <TableIcon className="w-5 h-5 text-gray-700" />
        </ToolbarButton>
        
        <Separator orientation="vertical" className="mx-2 h-6" />
        
        {/* More Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded bg-gray-100 hover:bg-gray-200">
              <MoreHorizontal className="w-5 h-5 text-gray-700" />
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
            <DropdownMenuItem onClick={clearAllFormatting}>
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
          </DropdownMenuContent>
        </DropdownMenu>
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
                  onChange={(e) => setCropArea({...cropArea, x: parseInt(e.target.value)})}
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
                  onChange={(e) => setCropArea({...cropArea, y: parseInt(e.target.value)})}
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
                  onChange={(e) => setCropArea({...cropArea, width: parseInt(e.target.value)})}
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
                  onChange={(e) => setCropArea({...cropArea, height: parseInt(e.target.value)})}
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
      
      {/* Image Insert Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
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
    </motion.div>
  );
};

export default EditorToolbar;