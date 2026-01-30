import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  FiType, FiImage, FiSquare, FiCircle, FiTriangle, FiEdit3,
  FiUpload, FiGrid, FiMaximize, FiStar, FiHeart, FiX,
  FiArrowUp, FiArrowDown, FiArrowLeft, FiArrowRight,
  FiChevronDown, FiChevronRight, FiCloud, FiMousePointer, FiLayers
} from 'react-icons/fi'
import AIImageGenerator from '../AIImageGenerator'
import BackgroundColor from './BackgroundColor'
import { MdDisabledVisible } from 'react-icons/md'

const LeftCanvasSidebar = ({
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
}) => {
  const [hoveredButtonTooltip, setHoveredButtonTooltip] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedSectionPosition, setExpandedSectionPosition] = useState({ x: 0, y: 0, width: 0 });
  const [referencePosition, setReferencePosition] = useState(null); // Store the "Background Settings" position
  const buttonRefs = useRef({});

  // Refined Styles
  const styles = {
    sidebarContainer: "pb-10 flex-[0_0_100px] border-r border-slate-800 flex flex-col items-center py-6 gap-2 z-[10] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-full",
    parentButton: (isActive) => `relative group flex flex-col items-center justify-center gap-0 w-12 h-12 rounded-2xl transition-all duration-300 mx-1 ${isActive
      ? 'bg-blue-600/20 text-blue-500 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
      : 'hover:bg-slate-800/50 text-slate-700 border border-transparent hover:border-slate-400 hover:text-slate-900'
      }`,
    childButton: (isSelected, isHovered) => `
      group relative py-3 px-4 rounded-xl cursor-pointer flex items-center gap-3 text-sm font-medium transition-all duration-200 w-full
      ${isSelected
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
        : `text-slate-300 ${isHovered ? 'bg-slate-700 text-white' : 'bg-transparent'}`
      }
    `,
    uploadButton: "w-full py-6 px-4 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center gap-2 hover:border-blue-500 hover:bg-blue-500/5 transition-all duration-300 group",
    portalContainer: "fixed z-[9999] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-left-4 duration-200"
  };

  const tooltipTexts = {
    'background': 'Canvas Background',
    'text': 'Typography',
    'shapes': 'Shapes & Icons',
    'drawing': 'Freehand Draw',
    'media': 'Images & AI',
    'templates': 'Layouts',
    'canvas': 'Dimensions',
    'stockImages': 'Stock Images'
  };

  const shapeConfigs = [
    { key: 'rectangle', label: 'Rectangle', icon: <FiSquare size={18} />, size: [120, 120] },
    { key: 'circle', label: 'Circle', icon: <FiCircle size={18} />, size: [160, 160] },
    { key: 'triangle', label: 'Triangle', icon: <FiTriangle size={18} />, size: [200, 200] },
    { key: 'star', label: 'Star', icon: <FiStar size={18} />, size: [240, 240] },
    { key: 'heart', label: 'Heart', icon: <FiHeart size={18} />, size: [280, 280] },
    { key: 'cloud', label: 'Cloud', icon: <FiCloud size={18} />, size: [440, 440] },
    { key: 'arrowRight', label: 'Arrow', icon: <FiArrowRight size={18} />, size: [360, 360] },
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
      src: 'https://images.unsplash.com/photo-1761839257513-a921710a4291?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxfHx8ZW58MHx8fHx8',
      name: 'Stock Image 1'
    },
    {
      id: 'stock-2',
      src: 'https://plus.unsplash.com/premium_photo-1764598889620-d6b8667f3c77?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyfHx8ZW58MHx8fHx8',
      name: 'Stock Image 2'
    },
    {
      id: 'stock-3',
      src: 'https://images.unsplash.com/photo-1768409234914-96f61529b7e2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0fHx8ZW58MHx8fHx8',
      name: 'Stock Image 3'
    },
    {
      id: 'stock-4',
      src: 'https://plus.unsplash.com/premium_photo-1766012368210-14b362ad9805?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw2fHx8ZW58MHx8fHx8',
      name: 'Stock Image 4'
    },
    {
      id: 'stock-5',
      src: 'https://images.unsplash.com/photo-1768449864366-b78dda95c9a0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxMHx8fGVufDB8fHx8fA%3D%3D',
      name: 'Stock Image 5'
    },
    {
      id: 'stock-6',
      src: 'https://plus.unsplash.com/premium_photo-1766012368356-69b7ee24081d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxMXx8fGVufDB8fHx8fA%3D%3D',
      name: 'Stock Image 6'
    }
  ];

  const handleButtonMouseEnter = useCallback((text, buttonElement) => {
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      setTooltipPosition({ x: rect.right + 12, y: rect.top + rect.height / 2 });
      setHoveredButtonTooltip(text);
    }
  }, []);

  const handleSectionToggle = useCallback((sectionKey, buttonElement) => {
    const isCurrentlyOpen = openSections[sectionKey];
    if (expandedSection && expandedSection !== sectionKey) setExpandedSection(null);

    toggleSection(sectionKey);

    if (!isCurrentlyOpen && buttonElement) {
      const portalWidth = 300;
      let position;

      // If this is the "background" button, calculate and store its position as reference
      if (sectionKey === 'background') {
        const rect = buttonElement.getBoundingClientRect();
        const spacing = 12;
        const x = rect.right + spacing;
        const y = Math.max(20, rect.top);
        position = { x, y, width: portalWidth };
        setReferencePosition(position); // Store as reference for all other portals
      } else {
        // For all other buttons, use the reference position (from "background" button)
        position = referencePosition || (() => {
          // Fallback: calculate from current button if reference doesn't exist yet
          const rect = buttonElement.getBoundingClientRect();
          const spacing = 12;
          const x = rect.right + spacing;
          const y = Math.max(20, rect.top);
          return { x, y, width: portalWidth };
        })();
      }

      setExpandedSectionPosition(position);
      setExpandedSection(sectionKey);
    } else {
      setExpandedSection(null);
    }
  }, [expandedSection, openSections, toggleSection, referencePosition]);

  // Initialize reference position from "background" button on mount
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

  const Tooltip = ({ text }) => {
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
  };

  const ParentButton = ({ sectionKey, icon, label }) => {
    const isActive = expandedSection === sectionKey;
    return (
      <div className="relative">
        <button
          ref={(el) => buttonRefs.current[sectionKey] = el}
          className={`${styles.parentButton(isActive)} parent-nav-btn`}
          onMouseEnter={(e) => handleButtonMouseEnter(sectionKey, e.currentTarget)}
          onMouseLeave={() => setHoveredButtonTooltip(null)}
          onClick={(e) => handleSectionToggle(sectionKey, e.currentTarget)}
        >
          <span className="text-slate-700 group-hover:text-slate-900">{icon}</span>
          <span className="text-[8px] font-medium uppercase tracking-wider text-slate-600 group-hover:text-slate-900 opacity-80 group-hover:opacity-100">{label}</span>
          {isActive && <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-500 rounded-full" />}
        </button>
        <Tooltip text={sectionKey} />
      </div>
    );
  };

  const ExpandedSectionPortal = ({ sectionKey, title, children }) => {
    if (expandedSection !== sectionKey) return null;
    return createPortal(
      <div
        className={`${styles.portalContainer} expanded-section-portal`}
        style={{
          left: `${expandedSectionPosition.x}px`,
          top: `${expandedSectionPosition.y}px`,
          width: `${expandedSectionPosition.width}px`,
          maxHeight: `calc(100vh - ${expandedSectionPosition.y + 20}px)`,
          height: 'auto',
          transform: 'translateY(0)'
        }}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 flex-shrink-0">
          <h3 className="text-white font-bold tracking-tight">{title}</h3>
          <button onClick={() => { setExpandedSection(null); toggleSection(sectionKey); }} className="p-1 hover:bg-slate-800 rounded-md text-slate-400"><FiX /></button>
        </div>
        <div className="p-4 overflow-y-auto pb-10 custom-scrollbar" style={{ maxHeight: `calc(100vh - 160px)`, height: 'auto', minHeight: '400px' }}>
          {children}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className={styles.sidebarContainer}>

        <ParentButton sectionKey="background" icon={<FiGrid size={16} />} label="Canvas" />
        <ParentButton sectionKey="text" icon={<FiType size={16} />} label="Text" />
        <ParentButton sectionKey="shapes" icon={<FiSquare size={16} />} label="Shapes" />
        <ParentButton sectionKey="drawing" icon={<FiEdit3 size={16} />} label="Draw" />
        <ParentButton sectionKey="media" icon={<FiImage size={16} />} label="Media" />
        <ParentButton sectionKey="stockImages" icon={<FiLayers size={16} />} label="Stock" />
        <ParentButton sectionKey="templates" icon={<FiStar size={16} />} label="Magic" />

        {/* Portals */}
        <ExpandedSectionPortal sectionKey="background" title="Background Settings">
          <BackgroundColor onColorChange={onCanvasBgColorChange} />
        </ExpandedSectionPortal>

        <ExpandedSectionPortal sectionKey="text" title="Typography">
          <div className="flex flex-col gap-2">
            {textConfigs.map(({ key, label, icon, size }) => (
              <button
                key={key}
                className={styles.childButton(selectedTool === key, hoveredOption === key)}
                onMouseEnter={() => setHoveredOption(key)}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { handleAddElement(size[0], size[1], key); setSelectedTool('select'); }}
              >
                <span className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg group-hover:bg-blue-500 transition-colors">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </ExpandedSectionPortal>

        <ExpandedSectionPortal sectionKey="shapes" title="Elements">
          <div className="grid grid-cols-2 gap-3">
            {shapeConfigs.map(({ key, label, icon, size }) => (
              <button
                key={key}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-800 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-slate-400 hover:text-white"
                onClick={() => { handleAddElement(size[0], size[1], key); setSelectedTool('select'); }}
              >
                {icon}
                <span className="text-[11px] font-medium">{label}</span>
              </button>
            ))}
          </div>
        </ExpandedSectionPortal>

        <ExpandedSectionPortal sectionKey="drawing" title="Drawing Tools">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-2">
              {drawingConfigs.map(({ key, label, icon }) => (
                <button
                  key={key}
                  className={styles.childButton(selectedTool === key, hoveredOption === key)}
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

        <ExpandedSectionPortal sectionKey="media" title="Assets">
          <button
            className={styles.uploadButton}
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

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

          {uploadedImages.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Recently Uploaded</h4>
              <div className="grid grid-cols-2 gap-2">
                {uploadedImages.map(img => (
                  <div
                    key={img.id}
                    onClick={() => handleAddUploadedImage ? handleAddUploadedImage(img) : handleLayerDuplicate(img.id)}
                    className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-slate-800 hover:border-blue-500 transition-all"
                  >
                    <img src={img.src} alt={img.name || 'Uploaded image'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <FiArrowUp className="text-white" size={20} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ExpandedSectionPortal>

        <ExpandedSectionPortal sectionKey="stockImages" title="Stock Images">
          <div className="grid grid-cols-2 gap-3">
            {stockImages.map(image => (
              <div
                key={image.id}
                onClick={() => onCanvasBgImageChange ? onCanvasBgImageChange(image.src) : null}
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-slate-800 hover:border-blue-500 transition-all"
              >
                <img
                  src={image.src}
                  alt={image.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <FiArrowUp className="text-white" size={20} />
                </div>
              </div>
            ))}
          </div>
        </ExpandedSectionPortal>

        <ExpandedSectionPortal sectionKey="templates" title="Design Templates">
          <div className="grid grid-cols-1 gap-3 pb-20">
            {templates.map(template => (
              <button
                key={template.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700 hover:border-blue-500 transition-all text-left group"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="text-2xl bg-slate-800 w-12 h-12 flex items-center justify-center rounded-lg group-hover:scale-110 transition-transform">
                  {template.thumbnail}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{template.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-tight">{template.width} × {template.height}</p>
                </div>
              </button>
            ))}
          </div>
        </ExpandedSectionPortal>
      </div>
    </div>
  )
}

export default LeftCanvasSidebar;


