import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import { createPortal } from 'react-dom'
import {
  FiType, FiImage, FiSquare, FiCircle, FiTriangle, FiEdit3,
  FiUpload, FiGrid, FiMaximize, FiStar, FiHeart, FiX,
  FiArrowUp, FiArrowDown, FiArrowLeft, FiArrowRight,
  FiChevronDown, FiChevronRight, FiCloud, FiMousePointer, FiLayers
} from 'react-icons/fi'
import AIImageGenerator from '../AIImageGenerator'
import { uploadTemporaryImage } from '@/services/imageEditor/imageApi'
import BackgroundColor from './BackgroundColor'
import { useAuth } from '@/contexts/AuthContext'
import { MdDisabledVisible } from 'react-icons/md'
import { designTemplates } from './DesignLibrary';

// --- Sub-components moved outside to prevent unmounting on parent re-renders ---

const Tooltip = memo(({ text, hoveredButtonTooltip, tooltipPosition, tooltipTexts }) => {
  if (!hoveredButtonTooltip || hoveredButtonTooltip !== text) return null;
  return createPortal(
    <div
      className="fixed z-[10000] bg-white text-slate-900 px-3 py-1.5 rounded-lg shadow-xl text-xs font-bold whitespace-nowrap pointer-events-none transition-opacity"
      style={{ left: `${tooltipPosition.x}px`, top: `${tooltipPosition.y}px`, transform: 'translateY(-50%)' }}
    >
      {tooltipTexts[text] || text}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-white"></div>
    </div>,
    document.body
  );
});

const ParentButton = memo(({ sectionKey, icon, label, isActive, onMouseEnter, onMouseLeave, onClick, buttonRef, tooltipTexts, hoveredButtonTooltip, tooltipPosition }) => {
  const buttonStyle = (isActive) => `relative group flex flex-col items-center justify-center gap-0 w-12 h-12 rounded-2xl transition-all duration-300 mx-1 ${isActive
    ? 'bg-blue-600/20 text-blue-500 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
    : 'hover:bg-slate-800/50 text-slate-700 border border-transparent hover:border-slate-400 hover:text-slate-900'
    }`;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className={`${buttonStyle(isActive)} parent-nav-btn`}
        onMouseEnter={(e) => onMouseEnter(sectionKey, e.currentTarget)}
        onMouseLeave={onMouseLeave}
        onClick={(e) => onClick(sectionKey, e.currentTarget)}
      >
        <span className="text-slate-700 group-hover:text-slate-900">{icon}</span>
        <span className="text-[8px] font-medium uppercase tracking-wider text-slate-600 group-hover:text-slate-900 opacity-80 group-hover:opacity-100">{label}</span>
        {isActive && <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-500 rounded-full" />}
      </button>
      <Tooltip
        text={sectionKey}
        hoveredButtonTooltip={hoveredButtonTooltip}
        tooltipPosition={tooltipPosition}
        tooltipTexts={tooltipTexts}
      />
    </div>
  );
});

const ExpandedSectionPortal = memo(({ sectionKey, expandedSection, title, children, position, onClose }) => {
  if (expandedSection !== sectionKey) return null;
  const portalStyle = "fixed z-[9999] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-left-4 duration-200";

  return createPortal(
    <div
      className={`${portalStyle} expanded-section-portal`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${position.width}px`,
        maxHeight: `calc(100vh - ${position.y + 20}px)`,
        height: 'auto',
        transform: 'translateY(0)'
      }}
    >
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 flex-shrink-0">
        <h3 className="text-white font-bold tracking-tight">{title}</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-md text-slate-400"><FiX /></button>
      </div>
      <div className="p-4 overflow-y-auto pb-10 custom-scrollbar pb-32" style={{ maxHeight: `calc(100vh - 160px)`, height: 'auto', minHeight: '400px' }}>
        {children}
      </div>
    </div>,
    document.body
  );
});

const LeftCanvasSidebar = memo(({
  toggleSection,
  openSections,
  hoveredOption,
  setHoveredOption,
  selectedTool,
  handleToolSelect,
  handleAddElement,
  setSelectedTool,
  fileInputRef,
  handleImageUpload,
  uploadedImages,
  handleLayerDuplicate,
  handleAIGeneratedImage,
  handleAddUploadedImage,
  imageSettings,
  onCanvasBgColorChange,
  onCanvasBgImageChange,
  templates,
  handleTemplateSelect,
  drawingSettings,
  handleDrawingSettingsChange,
  handleAddSticker,
  handleApplyDesignTemplate,
  onSave,
  layers,
  hasUnsavedChanges,
  activeTemplateId

}) => {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id || '';
  const [hoveredButtonTooltip, setHoveredButtonTooltip] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedSectionPosition, setExpandedSectionPosition] = useState({ x: 0, y: 0, width: 0 });
  const [expandedTemplateId, setExpandedTemplateId] = useState(null);
  const [referencePosition, setReferencePosition] = useState(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState(null);
  const buttonRefs = useRef({});
  const bgFileInputRef = useRef(null);

  const handleBgFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (onCanvasBgImageChange) {
        onCanvasBgImageChange(event.target.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  }, [onCanvasBgImageChange]);

  const sidebarContainerStyle = "pb-10 flex-[0_0_100px] border-r border-slate-800 flex flex-col items-center py-6 gap-2 z-[10] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-full";
  const childButtonStyle = (isSelected, isHovered) => `
    group relative py-3 px-4 rounded-xl cursor-pointer flex items-center gap-3 text-sm font-medium transition-all duration-200 w-full
    ${isSelected
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
      : `text-slate-300 ${isHovered ? 'bg-slate-700 text-white' : 'bg-transparent'}`
    }
  `;
  const uploadButtonStyle = "w-full py-6 px-4 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center gap-2 hover:border-blue-500 hover:bg-blue-500/5 transition-all duration-300 group";

  const tooltipTexts = {
    'background': 'Canvas Background',
    'text': 'Typography',
    'shapes': 'Shapes & Icons',
    'drawing': 'Freehand Draw',
    'media': 'Images & AI',
    'templates': 'Templates',
    'canvas': 'Dimensions',
    'stockImages': 'Stock Images'
  };


  const shapeConfigs = [
    {
      key: 'line', label: 'Line', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ), size: [200, 6]
    },
    { key: 'rectangle', label: 'Rectangle', icon: <FiSquare size={18} />, size: [120, 120] },
    {
      key: 'roundedRectangle', label: 'Rounded Rect', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ), size: [180, 120]
    },
    { key: 'circle', label: 'Circle', icon: <FiCircle size={18} />, size: [160, 160] },
    {
      key: 'ellipse', label: 'Ellipse', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="12" cy="12" rx="8" ry="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      ), size: [160, 100]
    },
    { key: 'triangle', label: 'Triangle', icon: <FiTriangle size={18} />, size: [200, 200] },
    {
      key: 'rightTriangle', label: 'Right Triangle', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4v16h16L4 4z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      ), size: [200, 200]
    },
    { key: 'star', label: 'Star', icon: <FiStar size={18} />, size: [240, 240] },
    { key: 'star6', label: '6-Point Star', icon: <FiStar size={18} />, size: [260, 260] },
    {
      key: 'heart',
      label: 'Heart',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      ),
      size: [280, 280]
    },
    {
      key: 'diamond', label: 'Diamond', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="12,3 20,12 12,21 4,12" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      ), size: [160, 160]
    },
    {
      key: 'pentagon', label: 'Pentagon', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="12,3 20,9 16,20 8,20 4,9" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      ), size: [180, 180]
    },
    {
      key: 'hexagon', label: 'Hexagon', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      ), size: [180, 180]
    },
    { key: 'arrow', label: 'Arrow', icon: <FiArrowRight size={18} />, size: [360, 360] },

    { key: 'arrowLeft', label: 'Left Arrow', icon: <FiArrowLeft size={18} />, size: [200, 200] },
    { key: 'arrowUp', label: 'Up Arrow', icon: <FiArrowUp size={18} />, size: [200, 200] },
    { key: 'arrowDown', label: 'Down Arrow', icon: <FiArrowDown size={18} />, size: [200, 200] },
    { key: 'cloud', label: 'Cloud', icon: <FiCloud size={18} />, size: [440, 440] },
  ];

  const textConfigs = [
    { key: 'heading', label: 'Add Heading', icon: <FiType size={20} className="text-xl" />, size: [100, 100] },
    { key: 'subheading', label: 'Add Subheading', icon: <FiType size={16} />, size: [100, 150] },
    { key: 'textbox', label: 'Add Text Box', icon: <FiType size={14} />, size: [100, 200] }
  ];

  const drawingConfigs = [
    { key: 'brush', label: 'Soft Brush', icon: <FiEdit3 size={18} /> },
    { key: 'pen', label: 'Sharp Pen', icon: <FiEdit3 size={18} /> },
    { key: 'eraser', label: 'Eraser', icon: <FiX size={18} /> }
  ];

  const stockImages = [
    {
      id: 'stock-1',
      src: 'https://images.unsplash.com/photo-1666334111978-614a8d680bbf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGdyZWV0aW5nJTIwY2FyZHMlMjBkZWZhdWx0fGVufDB8fDB8fHww',
      name: 'Greeting Card 1'
    },
    {
      id: 'stock-2',
      src: 'https://plus.unsplash.com/premium_photo-1718119435904-856798cccb7f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGdyZWV0aW5nJTIwY2FyZHN8ZW58MHx8MHx8fDA%3D',
      name: 'Greeting Card 2'
    },
    {
      id: 'stock-3',
      src: 'https://images.unsplash.com/photo-1612774103836-6f1c15e7d3da?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGdyZWV0aW5nJTIwY2FyZHxlbnwwfHwwfHx8MA%3D%3D',
      name: 'Greeting Card 3'
    },
    {
      id: 'stock-4',
      src: 'https://plus.unsplash.com/premium_photo-1718428773716-a58c246f7414?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGdyZWV0aW5nJTIwY2FyZHMlMjBkZWZhdWx0fGVufDB8fDB8fHww',
      name: 'Greeting Card 4'
    },
    {
      id: 'stock-5',
      src: 'https://images.unsplash.com/photo-1764385827388-2560c0cdc1e9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8aW52aXRhdGlvbiUyMGNhcmRzfGVufDB8fDB8fHww',
      name: 'Invitation Card'
    },
    {
      id: 'stock-6',
      src: 'https://plus.unsplash.com/premium_photo-1727805664106-b76f1ecad1e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8bmV3JTIweWVhcnxlbnwwfHwwfHx8MA%3D%3D',
      name: 'New Year Card'
    },
    {
      id: 'stock-7',
      src: 'https://images.unsplash.com/photo-1692902288471-4beec045f56d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cmFrc2hhYmFuZGhhbnxlbnwwfHwwfHx8MA%3D%3D',
      name: 'Raksha Bandhan Card'
    }
  ];


  const emojiImages = [
    {
      id: 'emoji1',
      src: 'https://cdn.pixabay.com/photo/2017/08/17/15/39/love-2651743_1280.png',
      name: 'Love'
    },
    {
      id: 'emoji2',
      src: 'https://cdn.pixabay.com/photo/2022/07/15/05/48/hairy-cartoon-7322434_1280.png',
      name: 'Cartoon'
    },
    {
      id: 'emoji3',
      src: 'https://cdn.pixabay.com/photo/2022/09/28/23/41/emotions-7486199_1280.png',
      name: 'Emotions'
    },
    {
      id: 'emoji4',
      src: 'https://cdn.pixabay.com/photo/2020/08/27/16/26/face-5522356_1280.png',
      name: 'Face'
    }

  ];


  const handleButtonMouseEnter = useCallback((text, buttonElement) => {
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      setTooltipPosition({ x: rect.right + 12, y: rect.top + rect.height / 2 });
      setHoveredButtonTooltip(text);
    }
  }, []);

  const handleButtonMouseLeave = useCallback(() => {
    setHoveredButtonTooltip(null);
  }, []);

  const handleSectionToggleInternal = useCallback((sectionKey, buttonElement) => {
    // Determine the new state after toggle
    const isCurrentlyOpen = openSections[sectionKey];

    // Close any other open expanded sections
    if (expandedSection && expandedSection !== sectionKey) {
      setExpandedSection(null);
    }

    // Toggle the section in the parent component
    toggleSection(sectionKey);

    // Since state is asynchronous, the new state will be the opposite of current state
    if (isCurrentlyOpen) {
      // If it was open, it will now be closed, so hide the expanded view
      setExpandedSection(null);
    } else {
      // If it was closed, it will now be open, so show the expanded view
      if (buttonElement) {
        const portalWidth = 300;
        let position;

        if (sectionKey === 'background') {
          const rect = buttonElement.getBoundingClientRect();
          const spacing = 12;
          const x = rect.right + spacing;
          const y = Math.max(20, rect.top);
          position = { x, y, width: portalWidth };
          setReferencePosition(position);
        } else {
          position = referencePosition || (() => {
            const rect = buttonElement.getBoundingClientRect();
            const spacing = 12;
            const x = rect.right + spacing;
            const y = Math.max(20, rect.top);
            return { x, y, width: portalWidth };
          })();
        }

        setExpandedSectionPosition(position);
        setExpandedSection(sectionKey);
      }
    }
  }, [expandedSection, openSections, toggleSection, referencePosition]);

  const handleCloseSection = useCallback((sectionKey) => {
    setExpandedSection(null);
    toggleSection(sectionKey);
  }, [toggleSection]);

  useEffect(() => {
    const backgroundButton = buttonRefs.current['background'];
    if (backgroundButton && !referencePosition) {
      const rect = backgroundButton.getBoundingClientRect();
      const portalWidth = 300;
      const spacing = 12;
      const x = rect.right + spacing;
      const y = Math.max(20, rect.top);
      setReferencePosition({ x, y, width: portalWidth });
    }
  }, [referencePosition]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (expandedSection && !event.target.closest('.expanded-section-portal') && !event.target.closest('.parent-nav-btn')) {
        setExpandedSection(null);
        toggleSection(expandedSection);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandedSection, toggleSection]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className={sidebarContainerStyle}>
        <ParentButton
          sectionKey="background" icon={<FiGrid size={16} />} label="Bg Color"
          isActive={expandedSection === "background"}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
          onClick={handleSectionToggleInternal}
          buttonRef={(el) => buttonRefs.current["background"] = el}
          tooltipTexts={tooltipTexts}
          hoveredButtonTooltip={hoveredButtonTooltip}
          tooltipPosition={tooltipPosition}
        />
        <ParentButton
          sectionKey="text" icon={<FiType size={16} />} label="Add Text"
          isActive={expandedSection === "text"}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
          onClick={handleSectionToggleInternal}
          buttonRef={(el) => buttonRefs.current["text"] = el}
          tooltipTexts={tooltipTexts}
          hoveredButtonTooltip={hoveredButtonTooltip}
          tooltipPosition={tooltipPosition}
        />
        <ParentButton
          sectionKey="shapes" icon={<FiSquare size={16} />} label="Shapes"
          isActive={expandedSection === "shapes"}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
          onClick={handleSectionToggleInternal}
          buttonRef={(el) => buttonRefs.current["shapes"] = el}
          tooltipTexts={tooltipTexts}
          hoveredButtonTooltip={hoveredButtonTooltip}
          tooltipPosition={tooltipPosition}
        />
        <ParentButton
          sectionKey="drawing" icon={<FiEdit3 size={16} />} label="Draw"
          isActive={expandedSection === "drawing"}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
          onClick={handleSectionToggleInternal}
          buttonRef={(el) => buttonRefs.current["drawing"] = el}
          tooltipTexts={tooltipTexts}
          hoveredButtonTooltip={hoveredButtonTooltip}
          tooltipPosition={tooltipPosition}
        />
        <ParentButton
          sectionKey="media" icon={<FiImage size={16} />} label="AI Image"
          isActive={expandedSection === "media"}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
          onClick={handleSectionToggleInternal}
          buttonRef={(el) => buttonRefs.current["media"] = el}
          tooltipTexts={tooltipTexts}
          hoveredButtonTooltip={hoveredButtonTooltip}
          tooltipPosition={tooltipPosition}
        />
        <ParentButton
          sectionKey="stockImages" icon={<FiLayers size={16} />} label="BG Images"
          isActive={expandedSection === "stockImages"}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
          onClick={handleSectionToggleInternal}
          buttonRef={(el) => buttonRefs.current["stockImages"] = el}
          tooltipTexts={tooltipTexts}
          hoveredButtonTooltip={hoveredButtonTooltip}
          tooltipPosition={tooltipPosition}
        />
        <ParentButton
          sectionKey="templates" icon={<FiStar size={16} />} label="Layout"
          isActive={expandedSection === "templates"}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
          onClick={handleSectionToggleInternal}
          buttonRef={(el) => buttonRefs.current["templates"] = el}
          tooltipTexts={tooltipTexts}
          hoveredButtonTooltip={hoveredButtonTooltip}
          tooltipPosition={tooltipPosition}
        />
        <ParentButton
          sectionKey="emoji" icon={<FiStar size={16} />} label="Emoji"
          isActive={expandedSection === "emoji"}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
          onClick={handleSectionToggleInternal}
          buttonRef={(el) => buttonRefs.current["emoji"] = el}
          tooltipTexts={tooltipTexts}
          hoveredButtonTooltip={hoveredButtonTooltip}
          tooltipPosition={tooltipPosition}
        />


        {/* Portals */}
        <ExpandedSectionPortal
          sectionKey="background" title="Background Settings"
          expandedSection={expandedSection} position={expandedSectionPosition}
          onClose={() => handleCloseSection("background")}
        >
          <BackgroundColor onColorChange={onCanvasBgColorChange} />
        </ExpandedSectionPortal>

        <ExpandedSectionPortal
          sectionKey="text" title="Typography"
          expandedSection={expandedSection} position={expandedSectionPosition}
          onClose={() => handleCloseSection("text")}
        >
          <div className="flex flex-col gap-2">
            {textConfigs.map(({ key, label, icon, size }) => (
              <button
                key={key}
                className={childButtonStyle(selectedTool === key, hoveredOption === key)}
                onMouseEnter={() => setHoveredOption(key)}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={() => { handleAddElement(size[0], size[1], key); setSelectedTool('select'); }}
              >
                <span className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg group-hover:bg-blue-500 transition-colors">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </ExpandedSectionPortal>

        <ExpandedSectionPortal
          sectionKey="shapes" title="Elements"
          expandedSection={expandedSection} position={expandedSectionPosition}
          onClose={() => handleCloseSection("shapes")}
        >
          <div className="grid grid-cols-5 gap-3">
            {shapeConfigs.map(({ key, label, icon, size }) => (
              <button
                key={key}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-800 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-slate-400 hover:text-white"
                onClick={() => { handleAddElement(size[0], size[1], key); setSelectedTool('select'); }}
              >
                {icon}
              </button>
            ))}
          </div>
        </ExpandedSectionPortal>

        <ExpandedSectionPortal
          sectionKey="drawing" title="Drawing Tools"
          expandedSection={expandedSection} position={expandedSectionPosition}
          onClose={() => handleCloseSection("drawing")}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-2">
              {drawingConfigs.map(({ key, label, icon }) => (
                <button
                  key={key}
                  className={childButtonStyle(selectedTool === key, hoveredOption === key)}
                  onClick={() => handleToolSelect(key)}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {['brush', 'pen', 'eraser'].includes(selectedTool) && (
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span>Stroke Width</span>
                    <span>{drawingSettings.brushSize}px</span>
                  </div>
                  <input
                    type="range" min="1" max="50"
                    value={drawingSettings.brushSize}
                    onChange={(e) => handleDrawingSettingsChange('brushSize', parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-2">Color Preset</label>
                  <input
                    type="color"
                    value={drawingSettings.brushColor}
                    onChange={(e) => handleDrawingSettingsChange('brushColor', e.target.value)}
                    className="w-full h-10 rounded-lg bg-slate-900 border-none cursor-pointer"
                  />
                </div>
              </div>
            )}


          </div>
        </ExpandedSectionPortal>

        <ExpandedSectionPortal
          sectionKey="media" title="Assets"
          expandedSection={expandedSection} position={expandedSectionPosition}
          onClose={() => handleCloseSection("media")}
        >
          <button
            className={uploadButtonStyle}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <FiUpload size={20} />
            </div>
            <span className="text-sm font-semibold text-slate-200">Upload Media</span>
            <span className="text-[10px] text-slate-500">PNG, JPG, SVG up to 10MB</span>
          </button>

          <div className="mt-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">AI Generator</h4>
            <AIImageGenerator
              onImageGenerated={handleAIGeneratedImage}
              hoveredOption={hoveredOption}
              setHoveredOption={setHoveredOption}
              imageSettings={imageSettings}
            />
          </div>



          {uploadedImages.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Recently Uploaded</h4>
              <div className="grid grid-cols-2 gap-2">
                {uploadedImages.map(img => (
                  <div
                    key={img.id}
                    className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-slate-800 hover:border-blue-500 transition-all"
                  >
                    <img src={img.src} alt={img.name || 'Uploaded image'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 px-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddUploadedImage ? handleAddUploadedImage(img) : handleLayerDuplicate(img.id); }}
                        className="w-full py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <FiArrowUp size={12} /> Add to Page
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onCanvasBgImageChange ? onCanvasBgImageChange(img.src) : null; }}
                        className="w-full py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <FiImage size={12} /> Set as BG
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ExpandedSectionPortal>

        <ExpandedSectionPortal
          sectionKey="stockImages" title="Stock Images"
          expandedSection={expandedSection} position={expandedSectionPosition}
          onClose={() => handleCloseSection("stockImages")}
        >
          <div
            onClick={() => bgFileInputRef.current?.click()}
            className="w-full py-6 px-4 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center gap-2 hover:border-blue-500 hover:bg-blue-500/5 transition-all duration-300 group mb-6 cursor-pointer text-slate-200"
          >
            Upload Stock Images
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stockImages.map(image => (
              <div
                key={image.id}
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-slate-800 hover:border-blue-500 transition-all"
              >
                <img
                  src={image.src}
                  alt={image.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 px-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddUploadedImage ? handleAddUploadedImage({ src: image.src, name: image.name }) : null; }}
                    className="w-full py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <FiArrowUp size={12} /> Add to Page
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCanvasBgImageChange ? onCanvasBgImageChange(image.src) : null; }}
                    className="w-full py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <FiImage size={12} /> Set as BG
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ExpandedSectionPortal>

        <ExpandedSectionPortal
          sectionKey="templates" title="Design Templates"
          expandedSection={expandedSection} position={expandedSectionPosition}
          onClose={() => handleCloseSection("templates")}
        >
          <div className="flex flex-col gap-3 pb-10">
            {templates.map(template => (
              <div key={template.id} className="flex flex-col gap-2">
                <button
                  className={`flex flex-col p-4 rounded-xl border transition-all text-left group ${expandedTemplateId === template.id ? 'bg-blue-600 border-blue-400' : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'}`}
                  onClick={() => {
                    const isClosing = expandedTemplateId === template.id;
                    const isAlreadyActive = activeTemplateId === template.id;

                    if (isClosing) {
                      setExpandedTemplateId(null);
                      return;
                    }

                    if (isAlreadyActive) {
                      // Just toggle accordion for current active layout
                      setExpandedTemplateId(template.id);
                      return;
                    }

                    if (hasUnsavedChanges) {
                      setPendingTemplate(template);
                      setShowSaveConfirm(true);
                    } else {
                      handleTemplateSelect(template);
                      setExpandedTemplateId(template.id);
                    }
                  }}
                >
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <p className="text-sm font-bold text-white">{template.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{template.category} • {template.width} × {template.height}</p>
                    </div>
                    {expandedTemplateId === template.id ? <FiChevronDown className="text-white" /> : <FiChevronRight className="text-slate-400" />}
                  </div>
                </button>

                {expandedTemplateId === template.id && (
                  <div className="grid grid-cols-2 gap-2 mt-2 px-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {designTemplates
                      .filter(dt => dt.width === template.width && dt.height === template.height)
                      .map(dt => (
                        <div
                          key={dt.id}
                          onClick={() => handleApplyDesignTemplate(dt)}
                          className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-slate-700 hover:border-blue-500 transition-all bg-slate-800"
                        >
                          <img
                            src={dt.preview}
                            alt={dt.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                            <p className="text-[9px] font-bold text-white truncate">{dt.name}</p>
                          </div>
                        </div>
                      ))}
                    {designTemplates.filter(dt => dt.width === template.width && dt.height === template.height).length === 0 && (
                      <div className="col-span-2 py-4 text-center">
                        <p className="text-slate-500 text-[10px]">No templates for this size yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ExpandedSectionPortal>

        <ExpandedSectionPortal
          sectionKey="emoji"
          title="Stickers"
          expandedSection={expandedSection}
          position={expandedSectionPosition}
          onClose={() => handleCloseSection("emoji")}
        >
          <div className="grid grid-cols-2 gap-3">
            {emojiImages.map(emoji => (
              <div
                key={emoji.id}
                onClick={() => handleAddSticker(emoji.src)}   // 👈 USE HERE
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-slate-800 hover:border-blue-500 transition-all"
              >
                <img
                  src={emoji.src}
                  alt={emoji.name}
                  className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </ExpandedSectionPortal>




      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={async (e) => {
          // If parent provided a custom handler, delegate to it
          if (typeof handleImageUpload === 'function') {
            handleImageUpload(e);
            return;
          }

          const file = e.target.files?.[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = async (ev) => {
            try {
              const base64 = ev.target.result;

              const userIdVal = currentUserId
              const serviceIdVal = (typeof activeTemplateId !== 'undefined' && activeTemplateId) ? activeTemplateId : `srv-${Date.now()}`;

              const payload = {
                userId: userIdVal,
                base64Image: base64,
                serviceId: serviceIdVal,
              };

              const json = await uploadTemporaryImage(payload);
              if (json && json.url) {
                // Add uploaded image to library/list if handler provided
                if (typeof handleAddUploadedImage === 'function') {
                  handleAddUploadedImage({ src: json.url, name: file.name });
                }
                // Also notify canvas background setter if available (optional)
                if (typeof onCanvasBgImageChange === 'function') {
                  // Do not auto-set background by default; keep commented for optional usage
                  // onCanvasBgImageChange(json.url);
                }
              }
            } catch (err) {
              console.error('Error uploading temporary image', err);
            }
          };
          reader.readAsDataURL(file);
          e.target.value = '';
        }}
        className="hidden"
      />
      <input ref={bgFileInputRef} type="file" accept="image/*" onChange={handleBgFileChange} className="hidden" />

      {/* Save Changes Confirmation Modal */}
      {showSaveConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiGrid className="text-blue-400 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Unsaved Changes</h3>
            <p className="text-slate-400 text-center text-sm mb-8">Do you want to save previous changes before switching to a new template?</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  if (onSave) await onSave();
                  setShowSaveConfirm(false);
                  if (pendingTemplate) {
                    handleTemplateSelect(pendingTemplate);
                    setExpandedTemplateId(pendingTemplate.id);
                  }
                  setPendingTemplate(null);
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowSaveConfirm(false);
                  if (pendingTemplate) {
                    handleTemplateSelect(pendingTemplate);
                    setExpandedTemplateId(pendingTemplate.id);
                  }
                  setPendingTemplate(null);
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all"
              >
                Discard & Continue
              </button>
              <button
                onClick={() => {
                  setShowSaveConfirm(false);
                  setPendingTemplate(null);
                }}
                className="w-full py-3 bg-transparent text-slate-500 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
});

export default LeftCanvasSidebar;