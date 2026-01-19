import React from 'react'
import { FiType, FiImage, FiSquare, FiCircle, FiTriangle, FiEdit3, FiMove, FiCrop, FiFilter, FiZap, FiUpload, FiGrid, FiMaximize, FiStar, FiHeart, FiX, FiArrowUp, FiArrowDown, FiArrowLeft, FiArrowRight, FiChevronDown, FiChevronRight, FiCloud } from 'react-icons/fi'
import AIImageGenerator from '../AIImageGenerator'
import BackgroundColor from './BackgroundColor'

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
  imageSettings,
  onCanvasBgColorChange,
  templates,
  handleTemplateSelect,
  drawingSettings,
  handleDrawingSettingsChange,
  canvasSize,
  setCanvasSize
}) => {
  return (
    <div className="w-[280px] min-w-[280px] flex-[0_0_280px] bg-slate-600 border-r-2 border-slate-800 p-5 overflow-y-auto sticky top-0 h-screen z-[2] text-white shadow-[4px_0_12px_rgba(0,0,0,0.15)] custom-scrollbar">
      {/* Header */}
      <div className="pb-5 flex items-center gap-2.5 border-b border-slate-700 mb-5">
        <div className="w-9 h-9 rounded-xl bg-transparent flex items-center justify-center">
          <span className="text-white font-bold text-[1.35rem]">🎨</span>
        </div>
        <span className="font-bold text-[1.12rem] text-white">Design Tools</span>
      </div>

      {/* Selection Tool */}
      <div>
        <button
          type="button"
          className="py-3.5 px-[18px] border border-slate-700 rounded-xl bg-slate-800 cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-between font-semibold transition-all duration-300 shadow-sm hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSection('background');
          }}
        >
          <span className="flex items-center gap-2">
            Background Color
          </span>
          {openSections.background ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
        </button>
        {openSections.background && (
          <div className="pl-2">
            <div className="border border-slate-700 rounded-lg bg-slate-700 p-2 mt-1.5">
              <BackgroundColor onColorChange={onCanvasBgColorChange} />
            </div>
          </div>
        )}

        <button
          type="button"
          className="py-3.5 px-[18px] border border-slate-700 rounded-xl bg-slate-800 cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-between font-semibold transition-all duration-300 shadow-sm hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSection('selection');
          }}
        >
          <span className="flex items-center gap-2">
            <FiMove size={16} />
            Selection
          </span>
          {openSections.selection ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
        </button>
        {openSections.selection && (
          <div className="pl-2">
            <div className="border border-slate-700 rounded-lg bg-slate-700 p-2 mt-1.5">
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'select' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'select' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('select')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToolSelect('select');
                }}
              >
                <FiMove size={16} />
                Select & Move
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Text Tools */}
      <div className="mt-3">
        <button
          type="button"
          className="py-3.5 px-[18px] border border-slate-700 rounded-xl bg-slate-800 cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-between font-semibold transition-all duration-300 shadow-sm hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSection('text');
          }}
        >
          <span className="flex items-center gap-2">
            <FiType size={16} />
            Text
          </span>
          {openSections.text ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
        </button>
        {openSections.text && (
          <div className="pl-2">
            <div className="border border-slate-700 rounded-lg bg-slate-700 p-2 mt-1.5">
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'heading' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'heading' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('heading')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(100, 100, 'heading');
                  setSelectedTool('select');
                }}
              >
                <FiType size={16} />
                Add Heading
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'subheading' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'subheading' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('subheading')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(100, 150, 'subheading');
                  setSelectedTool('select');
                }}
              >
                <FiType size={16} />
                Add Subheading
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'textbox' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'textbox' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('textbox')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(100, 200, 'textbox');
                  setSelectedTool('select');
                }}
              >
                <FiType size={16} />
                Add Text Box
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shape Tools */}
      <div className="mt-3">
        <button
          type="button"
          className="py-3.5 px-[18px] border border-slate-700 rounded-xl bg-slate-800 cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-between font-semibold transition-all duration-300 shadow-sm hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSection('shapes');
          }}
        >
          <span className="flex items-center gap-2">
            <FiSquare size={16} />
            Shapes
          </span>
          {openSections.shapes ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
        </button>
        {openSections.shapes && (
          <div className="pl-2">
            <div className="border border-slate-700 rounded-lg bg-slate-700 p-2 mt-1.5">
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'rectangle' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'rectangle' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('rectangle')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(120, 120, 'rectangle'); 
                  setSelectedTool('select'); 
                }}
              >
                <FiSquare size={16} />
                Rectangle
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'roundedRectangle' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'roundedRectangle' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('roundedRectangle')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(140, 140, 'roundedRectangle'); 
                  setSelectedTool('select'); 
                }}
              >
                <FiSquare size={16} />
                Rounded Rectangle
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'circle' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'circle' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('circle')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(160, 160, 'circle'); 
                  setSelectedTool('select'); 
                }}
              >
                <FiCircle size={16} />
                Circle
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'ellipse' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'ellipse' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('ellipse')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(180, 180, 'ellipse'); 
                  setSelectedTool('select'); 
                }}
              >
                <FiCircle size={16} />
                Ellipse
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'triangle' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'triangle' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('triangle')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(200, 200, 'triangle'); 
                  setSelectedTool('select'); 
                }}
              >
                <FiTriangle size={16} />
                Triangle
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'rightTriangle' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'rightTriangle' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('rightTriangle')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(220, 220, 'rightTriangle'); 
                  setSelectedTool('select'); 
                }}
              >
                <FiTriangle size={16} />
                Right Triangle
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'star' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'star' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('star')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(240, 240, 'star'); 
                  setSelectedTool('select'); 
                }}
              >
                <FiStar size={16} />
                Star
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'star6' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'star6' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('star6')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(260, 260, 'star6'); 
                  setSelectedTool('select'); 
                }}
              >
                <FiStar size={16} />
                6-Point Star
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'heart' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'heart' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('heart')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(280, 280, 'heart'); 
                  setSelectedTool('select'); 
                }}
              >
                <FiHeart size={16} />
                Heart
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'diamond' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'diamond' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('diamond')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(300, 300, 'diamond'); 
                  setSelectedTool('select'); 
                }}
              >
                <FiSquare size={16} />
                Diamond
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'pentagon' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'pentagon' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('pentagon')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(320, 320, 'pentagon'); 
                  setSelectedTool('select'); 
                }}
              >
                <FiSquare size={16} />
                Pentagon
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'hexagon' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'hexagon' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('hexagon')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(340, 340, 'hexagon'); 
                  setSelectedTool('select'); 
                }}
              >
                <FiSquare size={16} />
                Hexagon
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'arrow' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'arrow' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('arrow')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(360, 360, 'arrow'); 
                  setSelectedTool('select'); 
                }}
              >
                <FiArrowRight size={16} />
                Arrow
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'arrowLeft' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'arrowLeft' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('arrowLeft')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(380, 380, 'arrowLeft'); 
                  setSelectedTool('select'); 
                }}
              >
                <FiArrowLeft size={16} />
                Arrow Left
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'arrowUp' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'arrowUp' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('arrowUp')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(400, 400, 'arrowUp'); 
                  setSelectedTool('select'); 
                }}
              >
                <FiArrowUp size={16} />
                Arrow Up
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'arrowDown' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'arrowDown' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('arrowDown')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(420, 420, 'arrowDown'); 
                  setSelectedTool('select'); 
                }}
              >
                <FiArrowDown size={16} />
                Arrow Down
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'cloud' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'cloud' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('cloud')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddElement(440, 440, 'cloud'); 
                  setSelectedTool('select'); 
                }}
              >
                <FiCloud size={16} />
                Cloud
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawing Tools */}
      <div className="mt-3">
        <button
          className="py-3.5 px-[18px] border border-slate-700 rounded-xl bg-slate-800 cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-between font-semibold transition-all duration-300 shadow-sm hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSection('drawing');
          }}
        >
          <span className="flex items-center gap-2">
            <FiEdit3 size={16} />
            Drawing
          </span>
          {openSections.drawing ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
        </button>
        {openSections.drawing && (
          <div className="pl-2">
            <div className="border border-slate-700 rounded-lg bg-slate-700 p-2 mt-1.5">
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'brush' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'brush' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('brush')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToolSelect('brush');
                }}
              >
                <FiEdit3 size={16} />
                Brush
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'pen' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'pen' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('pen')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToolSelect('pen');
                }}
              >
                <FiEdit3 size={16} />
                Pen
              </button>
              <button
                type="button"
                className={`py-3.5 px-[18px] rounded-xl cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm ${
                  hoveredOption === 'eraser' ? 'border border-white bg-slate-700' : 'border-none bg-transparent'
                } ${
                  selectedTool === 'eraser' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
                } hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md`}
                onMouseEnter={() => setHoveredOption('eraser')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToolSelect('eraser');
                }}
              >
                <FiX size={16} />
                Eraser
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Effects & Filters */}
      <div className="mt-5">
        <h4 className="text-sm mb-2.5">Effects</h4>
        <button
          type="button"
          className={`py-3.5 px-[18px] border border-slate-700 rounded-xl bg-slate-800 cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md ${
            selectedTool === 'blur' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleToolSelect('blur');
          }}
        >
          <FiFilter size={16} />
          Blur
        </button>
        <button
          type="button"
          className={`py-3.5 px-[18px] border border-slate-700 rounded-xl bg-slate-800 cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md ${
            selectedTool === 'sharpen' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleToolSelect('sharpen');
          }}
        >
          <FiZap size={16} />
          Sharpen
        </button>
        <button
          type="button"
          className={`py-3.5 px-[18px] border border-slate-700 rounded-xl bg-slate-800 cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-start font-semibold transition-all duration-300 shadow-sm hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md ${
            selectedTool === 'crop' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)] -translate-y-0.5' : ''
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleToolSelect('crop');
          }}
        >
          <FiCrop size={16} />
          Crop
        </button>
      </div>

      {/* Media Tools */}
      <div className="mt-3">
        <button
          className="py-3.5 px-[18px] border border-slate-700 rounded-xl bg-slate-800 cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-between font-semibold transition-all duration-300 shadow-sm hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSection('media');
          }}
        >
          <span className="flex items-center gap-2">
            <FiImage size={16} />
            Media
          </span>
          {openSections.media ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
        </button>
        {openSections.media && (
          <div className="pl-2">
            <div className="border border-slate-700 rounded-lg bg-slate-700 p-2 mt-1.5">
              <button
                type="button"
                className={`py-5 px-4 border-2 border-dashed rounded-xl cursor-pointer my-2 flex flex-col items-center gap-2.5 text-sm font-semibold w-full justify-center transition-all duration-300 text-white min-h-[90px] ${
                  hoveredOption === 'upload'
                    ? 'bg-gradient-to-br from-purple-600 to-blue-600 border-purple-400 shadow-[0_6px_16px_rgba(139,92,246,0.4)] -translate-y-0.5'
                    : 'bg-gradient-to-br from-purple-500 to-blue-500 border-purple-500 shadow-[0_4px_12px_rgba(139,92,246,0.3)]'
                }`}
                onMouseEnter={() => setHoveredOption('upload')}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <FiUpload size={20} color="#ffffff" />
                <span className="text-white text-[13px] font-semibold text-center leading-tight">Upload Image</span>
              </button>

              {/* AI Generate Image Section */}
              <AIImageGenerator
                onImageGenerated={handleAIGeneratedImage}
                hoveredOption={hoveredOption}
                setHoveredOption={setHoveredOption}
                imageSettings={imageSettings}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {uploadedImages.length > 0 && (
                <div className="mt-2.5 grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto">
                  {uploadedImages.map(img => (
                    <button
                      type="button"
                      key={img.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLayerDuplicate(img.id);
                      }}
                      className={`p-0 rounded-md overflow-hidden cursor-pointer bg-white ${
                        hoveredOption === `uploaded-${img.id}` ? 'border-2 border-blue-600' : 'border border-gray-200'
                      }`}
                      onMouseEnter={() => setHoveredOption(`uploaded-${img.id}`)}
                      onMouseLeave={() => setHoveredOption(null)}
                      title={`Add ${img.name} to canvas`}
                    >
                      <img src={img.src} alt={img.name} className="w-full h-[70px] object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Templates */}
      <div className="mt-3">
        <button
          className="py-3.5 px-[18px] border border-slate-700 rounded-xl bg-slate-800 cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-between font-semibold transition-all duration-300 shadow-sm hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSection('templates');
          }}
        >
          <span className="flex items-center gap-2">
            <FiGrid size={16} />
            Templates
          </span>
          {openSections.templates ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
        </button>
        {openSections.templates && (
          <div className="pl-2">
            <div className="border border-slate-700 rounded-lg bg-slate-700 p-2 mt-1.5">
              <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto">
                {templates.map(template => (
                  <button
                    key={template.id}
                    className={`py-1.5 px-1.5 text-[11px] flex flex-col items-center gap-0.5 min-h-[60px] rounded-xl cursor-pointer my-1 transition-all duration-300 ${
                      hoveredOption === `tpl-${template.id}` ? 'border border-white bg-slate-700' : 'border border-gray-200 bg-white'
                    }`}
                    onMouseEnter={() => setHoveredOption(`tpl-${template.id}`)}
                    onMouseLeave={() => setHoveredOption(null)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTemplateSelect(template);
                    }}
                    title={`${template.name} - ${template.width}×${template.height}`}
                  >
                    <span className="text-base">{template.thumbnail}</span>
                    <span className="text-[10px] font-medium">{template.name}</span>
                    <span className="text-[9px] text-gray-600">
                      {template.width}×{template.height}
                    </span>
                    <span className="text-[8px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                      {template.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drawing Settings */}
      {['brush', 'pen', 'eraser'].includes(selectedTool) && (
        <div className="mt-3">
          <div className="border border-gray-200 rounded-lg bg-gray-50 p-3 mt-1.5">
            <h4 className="text-sm mb-3 text-gray-700">
              {selectedTool === 'eraser' ? 'Eraser Settings' : 'Drawing Settings'}
            </h4>
            <div className="mb-3">
              <label className="text-xs text-gray-600 block mb-1">
                {selectedTool === 'eraser' ? 'Eraser Size' : 'Brush Size'}: {drawingSettings.brushSize}px
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={drawingSettings.brushSize}
                onChange={(e) => handleDrawingSettingsChange('brushSize', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-600 block mb-1">
                {selectedTool === 'eraser' ? 'Eraser Color' : 'Color'}
              </label>
              <input
                type="color"
                value={drawingSettings.brushColor}
                onChange={(e) => handleDrawingSettingsChange('brushColor', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded"
              />
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-600 block mb-1">
                Opacity: {drawingSettings.opacity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={drawingSettings.opacity}
                onChange={(e) => handleDrawingSettingsChange('opacity', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">
                Tool Mode
              </label>
              <select
                value={drawingSettings.drawingMode}
                onChange={(e) => {
                  handleDrawingSettingsChange('drawingMode', e.target.value);
                  setSelectedTool(e.target.value);
                }}
                className="w-full py-1.5 px-2 border border-gray-300 rounded text-sm"
              >
                <option value="brush">Brush</option>
                <option value="pen">Pen</option>
                <option value="eraser">Eraser</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Size Controls */}
      <div className="mt-3">
        <button
          className="py-3.5 px-[18px] border border-slate-700 rounded-xl bg-slate-800 cursor-pointer my-1 flex items-center gap-3.5 text-[15px] text-slate-50 w-full justify-between font-semibold transition-all duration-300 shadow-sm hover:bg-slate-700 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSection('canvas');
          }}
        >
          <span className="flex items-center gap-2">
            <FiMaximize size={16} />
            Canvas Size
          </span>
          {openSections.canvas ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
        </button>
        {openSections.canvas && (
          <div className="pl-2">
            <div className="border border-slate-700 rounded-lg bg-slate-700 p-2 mt-1.5">
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  placeholder="Width"
                  value={canvasSize.width}
                  onChange={(e) => setCanvasSize(prev => ({ ...prev, width: parseInt(e.target.value) || 800 }))}
                  className="py-1.5 px-2 border border-gray-300 rounded text-sm w-20"
                />
                <input
                  type="number"
                  placeholder="Height"
                  value={canvasSize.height}
                  onChange={(e) => setCanvasSize(prev => ({ ...prev, height: parseInt(e.target.value) || 600 }))}
                  className="py-1.5 px-2 border border-gray-300 rounded text-sm w-20"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LeftCanvasSidebar
