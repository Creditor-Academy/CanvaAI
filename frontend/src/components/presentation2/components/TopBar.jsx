import React, { useState, useRef, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  Type,
  Image as ImageIcon,
  Shapes,
  Minus,
  MessageSquarePlus,
  Play,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Printer,
  Paintbrush,
  Star,
  Folder,
  Share2,
  MessageCircle,
  FileText,
  Save,
  Check,
  Scissors,
  Copy,
  Clipboard,
  Bold,
  Italic,
  Underline,
  Superscript,
  Subscript,
  PlusCircle,
  MinusCircle,
  Palette,
  Highlighter,
  Table,
  PieChart,
  TrendingUp,
  Upload,
  Link,
  SpellCheck,
  BarChart,
} from 'lucide-react';

/**
 * TopBar Component
 * 
 * Google Slides-style toolbar with 3 rows:
 * 1. Title bar (title, actions, share, present)
 * 2. Menu bar (File, Edit, View, etc.)
 * 3. Toolbar (tools and actions)
 */
const TopBar = ({
  // Title bar props
  presentationTitle,
  onTitleChange,
  isSaved = true,
  onStar,
  onMove,
  onShare,
  onPresent,
  onComment,
  
  // History props
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  
  // Zoom props
  zoom,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  
  // Tool props
  onToolSelect,
  selectedTool,
  
  // Actions
  onAddSlide,
  onPrint,
  onFormatPainter,
  onBackground,
  onLayout,
  onTheme,
  onTransition,
  
  // Menu handlers
  onRename,
  onCut,
  onCopy,
  onPaste,
  onInsertImage,
  onInsertImageFromUrl,
  onInsertTextBox,
  onInsertTitleBox,
  onInsertShape,
  onInsertTable,
  onInsertChart,
  onFormatBold,
  onFormatItalic,
  onFormatUnderline,
  onFormatSuperscript,
  onFormatSubscript,
  onFormatSizeIncrease,
  onFormatSizeDecrease,
  onFormatColor,
  onFormatHighlightColor,
  onFormatCapitalization,
  onSlideChangeBackground,
  onSlideDuplicate,
  onSpellingCheck,
}) => {
  const [showMenuDropdown, setShowMenuDropdown] = useState(null);
  const [showSubmenu, setShowSubmenu] = useState(null);
  const [showZoomDropdown, setShowZoomDropdown] = useState(false);
  const menuRef = useRef(null);
  const zoomRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenuDropdown(null);
        setShowSubmenu(null);
      }
      if (zoomRef.current && !zoomRef.current.contains(event.target)) {
        setShowZoomDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { id: 'file', label: 'File' },
    // { id: 'edit', label: 'Edit' },
    // { id: 'view', label: 'View' },
    { id: 'insert', label: 'Insert' },
    { id: 'format', label: 'Format' },
    { id: 'slide', label: 'Slide' },
    // { id: 'arrange', label: 'Arrange' },
    { id: 'tools', label: 'Tools' },
    // { id: 'extensions', label: 'Extensions' },
    // { id: 'help', label: 'Help' },
  ];

  const tools = [
    { id: 'select', icon: null, label: 'Select' }, // Special handling for cursor
    { id: 'text', icon: Type, label: 'Text box' },
    { id: 'image', icon: ImageIcon, label: 'Image' },
    { id: 'shape', icon: Shapes, label: 'Shape' },
    { id: 'line', icon: Minus, label: 'Line' },
  ];

  const handleMenuClick = (menuId) => {
    setShowMenuDropdown(showMenuDropdown === menuId ? null : menuId);
  };

  // File menu items
  const fileMenuItems = [
    { id: 'rename', label: 'Rename', icon: FileText, onClick: onRename },
    { id: 'cut', label: 'Cut', icon: Scissors, onClick: onCut, shortcut: 'Ctrl+X' },
    { id: 'copy', label: 'Copy', icon: Copy, onClick: onCopy, shortcut: 'Ctrl+C' },
    { id: 'paste', label: 'Paste', icon: Clipboard, onClick: onPaste, shortcut: 'Ctrl+V' },
  ];

  // Insert menu items
  const insertMenuItems = [
    { 
      id: 'image', 
      label: 'Image', 
      icon: ImageIcon, 
      hasSubmenu: true,
      submenu: [
        { id: 'upload', label: 'Upload from computer', icon: Upload, onClick: onInsertImage },
        { id: 'url', label: 'Insert from URL', icon: Link, onClick: onInsertImageFromUrl },
      ]
    },
    { id: 'textbox', label: 'Text box', icon: Type, onClick: onInsertTextBox },
    { id: 'titlebox', label: 'Title box', icon: Type, onClick: onInsertTitleBox },
    { id: 'shape', label: 'Shape', icon: Shapes, onClick: onInsertShape },
    { id: 'newslide', label: 'New slide', icon: Plus, onClick: onAddSlide },
    { id: 'table', label: 'Table', icon: Table, onClick: onInsertTable },
    { 
      id: 'chart', 
      label: 'Chart', 
      icon: PieChart,
      hasSubmenu: true,
      submenu: [
        { id: 'pie', label: 'Pie chart', icon: PieChart, onClick: () => onInsertChart?.('pie') },
        { id: 'line', label: 'Line chart', icon: TrendingUp, onClick: () => onInsertChart?.('line') },
        { id: 'bar', label: 'Bar chart', icon: BarChart, onClick: () => onInsertChart?.('bar') },
      ]
    },
  ];

  // Format menu items
  const formatMenuItems = [
    {
      id: 'text',
      label: 'Text',
      hasSubmenu: true,
      submenu: [
        { id: 'bold', label: 'Bold', icon: Bold, onClick: onFormatBold, shortcut: 'Ctrl+B' },
        { id: 'italic', label: 'Italic', icon: Italic, onClick: onFormatItalic, shortcut: 'Ctrl+I' },
        { id: 'underline', label: 'Underline', icon: Underline, onClick: onFormatUnderline, shortcut: 'Ctrl+U' },
        { id: 'superscript', label: 'Superscript', icon: Superscript, onClick: onFormatSuperscript },
        { id: 'subscript', label: 'Subscript', icon: Subscript, onClick: onFormatSubscript },
      ]
    },
    {
      id: 'size',
      label: 'Size',
      hasSubmenu: true,
      submenu: [
        { id: 'increase', label: 'Increase', icon: PlusCircle, onClick: onFormatSizeIncrease },
        { id: 'decrease', label: 'Decrease', icon: MinusCircle, onClick: onFormatSizeDecrease },
      ]
    },
    { id: 'color', label: 'Color', icon: Palette, onClick: onFormatColor },
    { id: 'highlight', label: 'Highlight color', icon: Highlighter, onClick: onFormatHighlightColor },
    {
      id: 'capitalization',
      label: 'Capitalization',
      hasSubmenu: true,
      submenu: [
        { id: 'lowercase', label: 'lowercase', onClick: () => onFormatCapitalization?.('lowercase') },
        { id: 'uppercase', label: 'UPPERCASE', onClick: () => onFormatCapitalization?.('uppercase') },
        { id: 'title', label: 'Title Case', onClick: () => onFormatCapitalization?.('title') },
      ]
    },
  ];

  // Slide menu items
  const slideMenuItems = [
    { id: 'new', label: 'New slide', icon: Plus, onClick: onAddSlide },
    { id: 'background', label: 'Change background', icon: Palette, onClick: onSlideChangeBackground },
    { id: 'duplicate', label: 'Duplicate slide', icon: Copy, onClick: onSlideDuplicate },
  ];

  // Tools menu items
  const toolsMenuItems = [
    { id: 'spelling', label: 'Spelling check', icon: SpellCheck, onClick: onSpellingCheck },
  ];

  // Render dropdown menu
  const renderDropdown = (menuId, items) => {
    if (showMenuDropdown !== menuId) return null;

    return (
      <div className="absolute top-full left-0 mt-0 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-[200px] py-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isSubmenuOpen = showSubmenu === `${menuId}-${item.id}`;

          if (item.hasSubmenu) {
            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => setShowSubmenu(`${menuId}-${item.id}`)}
                onMouseLeave={() => setShowSubmenu(null)}
              >
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon size={16} />}
                    <span>{item.label}</span>
                  </div>
                  <span className="text-gray-400">›</span>
                </button>
                {isSubmenuOpen && item.submenu && (
                  <div className="absolute left-full top-0 ml-1 bg-white border border-gray-300 rounded shadow-lg min-w-[180px] py-1 z-50">
                    {item.submenu.map((subItem) => {
                      const SubIcon = subItem.icon;
                      return (
                        <button
                          key={subItem.id}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between gap-2"
                          onClick={() => {
                            subItem.onClick?.();
                            setShowMenuDropdown(null);
                            setShowSubmenu(null);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {SubIcon && <SubIcon size={16} />}
                            <span>{subItem.label}</span>
                          </div>
                          {subItem.shortcut && (
                            <span className="text-xs text-gray-400">{subItem.shortcut}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between gap-2"
              onClick={() => {
                item.onClick?.();
                setShowMenuDropdown(null);
                setShowSubmenu(null);
              }}
            >
              <div className="flex items-center gap-2">
                {Icon && <Icon size={16} />}
                <span>{item.label}</span>
              </div>
              {item.shortcut && (
                <span className="text-xs text-gray-400">{item.shortcut}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full bg-white border-b border-gray-200">
      {/* Row 1: Title Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Logo/Icon */}
          <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-yellow-800" />
          </div>

          {/* Title Input */}
          <input
            type="text"
            value={presentationTitle || 'Untitled presentation'}
            onChange={(e) => onTitleChange?.(e.target.value)}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm font-medium text-gray-900 px-2 py-1 rounded hover:bg-gray-100 focus:bg-white focus:ring-1 focus:ring-blue-500"
            style={{ maxWidth: '400px' }}
          />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={onStar}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              title="Star"
            >
              <Star size={18} className="text-gray-600" />
            </button>
            <button
              onClick={onMove}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              title="Move"
            >
              <Folder size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Save Status */}
          <div className="flex items-center gap-1 px-2 text-xs text-gray-600">
            {isSaved ? (
              <>
                <Check size={14} className="text-green-600" />
                <span>All changes saved</span>
              </>
            ) : (
              <>
                <Save size={14} className="text-orange-600" />
                <span>Saving...</span>
              </>
            )}
          </div>

          {/* Share Button */}
          <button
            onClick={onShare}
            className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Share2 size={14} />
            <span>Share</span>
          </button>

          {/* Comment & Present */}
          <div className="flex items-center gap-1 border-l border-gray-300 pl-2 ml-2">
            <button
              onClick={onComment}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              title="Comments"
            >
              <MessageCircle size={18} className="text-gray-600" />
            </button>
            <button
              onClick={onPresent}
              className="px-3 py-1.5 rounded hover:bg-gray-200 transition-colors flex items-center gap-1 text-sm font-medium text-gray-700"
              title="Present"
            >
              <Play size={16} />
              <span>Present</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Menu Bar */}
      <div className="flex items-center px-4 border-b border-gray-200 bg-white relative" ref={menuRef}>
        {menuItems.map((menu) => {
          let menuData = null;
          if (menu.id === 'file') menuData = fileMenuItems;
          else if (menu.id === 'insert') menuData = insertMenuItems;
          else if (menu.id === 'format') menuData = formatMenuItems;
          else if (menu.id === 'slide') menuData = slideMenuItems;
          else if (menu.id === 'tools') menuData = toolsMenuItems;

          return (
            <div key={menu.id} className="relative">
              <button
                onClick={() => handleMenuClick(menu.id)}
                className={`px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors ${
                  showMenuDropdown === menu.id ? 'bg-gray-100' : ''
                }`}
              >
                {menu.label}
              </button>
              {menuData && renderDropdown(menu.id, menuData)}
            </div>
          );
        })}
      </div>

      {/* Row 3: Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2" ref={zoomRef}>
          <button
            onClick={onZoomOut}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={16} className="text-gray-700" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowZoomDropdown(!showZoomDropdown)}
              className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 rounded transition-colors flex items-center gap-1"
            >
              <span>{Math.round(zoom * 100)}%</span>
              <span className="text-[10px]">▾</span>
            </button>
            {showZoomDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-[120px]">
                <button
                  onClick={() => {
                    onZoomChange?.(0.5);
                    setShowZoomDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                >
                  50%
                </button>
                <button
                  onClick={() => {
                    onZoomChange?.(0.75);
                    setShowZoomDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                >
                  75%
                </button>
                <button
                  onClick={() => {
                    onZoomChange?.(1);
                    setShowZoomDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                >
                  100%
                </button>
                <button
                  onClick={() => {
                    onZoomChange?.(1.5);
                    setShowZoomDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                >
                  150%
                </button>
                <button
                  onClick={() => {
                    onZoomChange?.(2);
                    setShowZoomDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                >
                  200%
                </button>
                <div className="border-t border-gray-200" />
                <button
                  onClick={() => {
                    onFitToScreen?.();
                    setShowZoomDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Maximize2 size={14} />
                  <span>Fit</span>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onZoomIn}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Add Slide */}
        <div className="flex items-center gap-0 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={onAddSlide}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="New slide"
          >
            <Plus size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-0 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Undo"
          >
            <Undo2 size={16} className="text-gray-700" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Redo"
          >
            <Redo2 size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Print & Format Painter */}
        <div className="flex items-center gap-0 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={onPrint}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Print"
          >
            <Printer size={16} className="text-gray-700" />
          </button>
          <button
            onClick={onFormatPainter}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Format painter"
          >
            <Paintbrush size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Fit */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={onFitToScreen}
            className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 rounded transition-colors flex items-center gap-1"
            title="Fit to screen"
          >
            <Maximize2 size={14} />
            <span>Fit</span>
          </button>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-0">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = selectedTool === tool.id;
            
            if (tool.id === 'select') {
              return (
                <button
                  key={tool.id}
                  onClick={() => onToolSelect?.('select')}
                  className={`px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                  title={tool.label}
                >
                  <span className="text-lg leading-none">↖</span>
                  <span>{tool.label}</span>
                </button>
              );
            }
            
            return (
              <button
                key={tool.id}
                onClick={() => onToolSelect?.(tool.id)}
                className={`p-1.5 rounded transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
                title={tool.label}
              >
                {Icon && <Icon size={16} />}
              </button>
            );
          })}
        </div>

        {/* Comment */}
        <div className="flex items-center gap-0 border-l border-gray-300 pl-2 ml-2">
          <button
            onClick={onComment}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Comment"
          >
            <MessageSquarePlus size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Text Actions */}
        <div className="flex items-center gap-1 border-l border-gray-300 pl-2 ml-2">
          <button
            onClick={onBackground}
            className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 rounded transition-colors"
          >
            Background
          </button>
          <button
            onClick={onLayout}
            className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 rounded transition-colors"
          >
            Layout
          </button>
          <button
            onClick={onTheme}
            className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 rounded transition-colors"
          >
            Theme
          </button>
          <button
            onClick={onTransition}
            className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 rounded transition-colors"
          >
            Transition
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
