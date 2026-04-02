import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    FiBold, FiItalic, FiUnderline, FiAlignLeft, FiAlignCenter,
    FiAlignRight, FiType, FiZap, FiMove, FiChevronDown,
    FiRotateCcw, FiRotateCw, FiSave, FiDownload, FiCopy,
    FiEdit3, FiTrash2, FiMinus, FiPlus, FiFilter, FiCrop, FiLayers,
    FiFile, FiImage, FiSettings, FiStar, FiFolder, FiShare2, FiPlay, FiMessageSquare,
    FiEye, FiEyeOff, FiGrid, FiMaximize, FiMinimize, FiRefreshCw, FiCheck
} from 'react-icons/fi';
import ProjectNameModal from './ProjectNameModal';
import { exportImage } from '@/services/imageEditor/imageApi';

const EditingToolbar = ({
    imageId,
    selectedLayer,
    layer,
    onTextSettingsChange,
    onTextColorChange,
    onTextAlignChange,
    onToggleBold,
    onToggleItalic,
    onToggleUnderline,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onSave,
    onExport,
    onDownload,
    onDuplicate,
    hasSelection,
    selectedTool,
    handleToolSelect,
    onEdit,
    onEraser,
    onFlip,
    onEffects,
    onPosition,
    onToggleBackground,
    isBgRemoved,
    onStartCrop,
    isCropping,
    layers,
    canvasSize,
    zoom,
    pan,
    canvasBgColor,
    canvasBgImage,
    projectName,
    isExistingProject,
    userRole,
}) => {
    const [showFontDropdown, setShowFontDropdown] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [colorPickerPos, setColorPickerPos] = useState(null);
    const [fontDropdownPos, setFontDropdownPos] = useState(null);
    const [exportDropdownPos, setExportDropdownPos] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [showNamePrompt, setShowNamePrompt] = useState(false);
    const [pendingFormat, setPendingFormat] = useState(null);
    const [pendingName, setPendingName] = useState('');
    const [showSaveTooltip, setShowSaveTooltip] = useState(false);
    const [showProjectNameModal, setShowProjectNameModal] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const fontDropdownRef = useRef(null);
    const menuRef = useRef(null);
    const exportDropdownRef = useRef(null);
    const colorPickerRef = useRef(null);
    const colorPickerPortalRef = useRef(null);
    const fontDropdownPortalRef = useRef(null);
    const exportDropdownPortalRef = useRef(null);
    const saveButtonRef = useRef(null);

    const presetColors = [
        '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
        '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
        '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
        '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
        '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
        '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
    ];

    const fonts = [
        'Arial', 'Dancing Script', 'Helvetica', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
        'Poppins', 'Inter', 'Oswald', 'Roboto Mono', 'Raleway', 'Ubuntu',
        'Merriweather', 'Playfair Display',  'Courier New',
        'Georgia', 'Times New Roman', 'Verdana', 'Comic Sans MS',
        'Source Sans Pro', 'Nunito', 'Fira Sans', 'Work Sans', 'PT Sans',
        'Quicksand', 'Avenir', 'Segoe UI', 'Calibri', 'Garamond',
        'Baskerville', 'Lucida Sans', 'Trebuchet MS', 'Franklin Gothic',
        'Noto Sans', 'Noto Serif', 'Proxima Nova', 'Helvetica Neue', 'SF Pro Text'
    ];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target)) {
                const portalEl = fontDropdownPortalRef.current;
                if (!portalEl || !portalEl.contains(e.target)) setShowFontDropdown(false);
            }
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setActiveMenu(null);
            }
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
                const portalEl = exportDropdownPortalRef.current;
                if (!portalEl || !portalEl.contains(e.target)) setShowExportDropdown(false);
            }
            if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
                const portalEl = colorPickerPortalRef.current;
                if (!portalEl || !portalEl.contains(e.target)) setShowColorPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-hide success message after 3 seconds
    useEffect(() => {
        if (saveSuccess) {
            const timer = setTimeout(() => setSaveSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [saveSuccess]);

    const isTextLayer = selectedLayer && layer?.type === 'text';
    const isImageLayer = selectedLayer && layer?.type === 'image';

    // Local buffer for editing font size so user can type freely (allow empty)
    const [fontSizeInput, setFontSizeInput] = useState('');

    useEffect(() => {
        if (layer && typeof layer.fontSize === 'number') setFontSizeInput(String(layer.fontSize));
        else setFontSizeInput('');
    }, [layer?.fontSize, layer?.id]);

    // Handle save: always show ProjectNameModal (even for existing projects)
    const handleSaveClick = () => {
        setShowProjectNameModal(true);
    };

    const handleProjectNameConfirm = (name) => {
        setShowProjectNameModal(false);
        onSave(name);
        setSaveSuccess(true);
    };

    // Style Helpers
    const btnBase = "h-9 flex items-center justify-center gap-2 px-3 text-sm font-medium transition-all rounded-lg";
    const btnGhost = `${btnBase} text-gray-600 hover:bg-gray-100 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed`;
    const btnOutline = `${btnBase} border border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 bg-white shadow-sm hover:shadow`;
    const btnPrimary = "h-9 px-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 shadow-md hover:shadow-lg transition-all";
    const btnActive = `${btnBase} bg-blue-50 text-blue-600 border border-blue-200`;
    const toolGroup = "flex items-center gap-1 bg-gray-50/90 p-1 rounded-lg border border-gray-200/80 shadow-sm";
    const verticalDivider = <div className="w-px h-6 bg-gray-200 mx-2" />;

    return (
        <>
            <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 w-full sticky top-0 z-[100] flex flex-col antialiased shadow-sm">
                <div className="h-14 px-4 flex items-center justify-between border-b border-gray-100">
                    {/* Left section - Project info */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                            <FiFile className="text-white" size={18} />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-800 truncate max-w-[200px]">
                                    {projectName || 'Untitled Design'}
                                </span>
                                {isExistingProject && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded-full">
                                        Saved
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 font-medium">Auto-saved</span>
                                {saveSuccess && (
                                    <span className="text-[10px] text-green-600 font-medium flex items-center gap-1 animate-in fade-in">
                                        <FiCheck size={10} /> Saved
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Center section - Main toolbar */}
                    <div className="flex-1 flex items-center gap-2 overflow-x-auto px-4 no-scrollbar">
                        {/* Undo/Redo */}
                        <div className={toolGroup}>
                            <button
                                onClick={onUndo}
                                disabled={!canUndo}
                                className={btnGhost}
                                title="Undo (Ctrl+Z)"
                            >
                                <FiRotateCcw size={15} />
                            </button>
                            <button
                                onClick={onRedo}
                                disabled={!canRedo}
                                className={btnGhost}
                                title="Redo (Ctrl+Y)"
                            >
                                <FiRotateCw size={15} />
                            </button>
                        </div>

                        {/* Duplicate */}
                        <button
                            onClick={onDuplicate}
                            disabled={!hasSelection}
                            className={btnGhost}
                            title="Duplicate"
                        >
                            <FiCopy size={15} />
                        </button>

                        {/* Remove Background */}
                        <button
                            onClick={onToggleBackground}
                            className={`${btnOutline} ${isBgRemoved ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : ''}`}
                            title={isBgRemoved ? "Restore Background" : "Remove Background"}
                        >
                            <FiTrash2 size={15} />
                            <span className="hidden lg:inline text-xs">{isBgRemoved ? "Restore BG" : "Remove BG"}</span>
                        </button>

                        {/* Text Layer Specific Controls */}
                        {isTextLayer && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                {verticalDivider}

                                {/* Font Family Dropdown */}
                                <div className="relative" ref={fontDropdownRef}>
                                    <button
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setFontDropdownPos && setFontDropdownPos({
                                                top: rect.bottom + window.scrollY,
                                                left: rect.left + window.scrollX,
                                                width: 200
                                            });
                                            setShowFontDropdown(prev => !prev);
                                        }}
                                        className={`${btnOutline} min-w-[140px] justify-between`}
                                    >
                                        <span className="truncate text-xs" style={{ fontFamily: layer.fontFamily || 'Arial' }}>
                                            {layer.fontFamily || 'Arial'}
                                        </span>
                                        <FiChevronDown size={12} />
                                    </button>
                                    {showFontDropdown && typeof document !== 'undefined' && createPortal(
                                        <div
                                            ref={fontDropdownPortalRef}
                                            style={{
                                                position: 'absolute',
                                                top: (fontDropdownPos && fontDropdownPos.top) || 0,
                                                left: (fontDropdownPos && fontDropdownPos.left) || 0,
                                                width: (fontDropdownPos && fontDropdownPos.width) || 200,
                                                zIndex: 99999
                                            }}
                                            className="bg-white border border-gray-200 rounded-lg shadow-xl py-1 max-h-64 overflow-y-auto"
                                            onMouseDown={(e) => e.stopPropagation()}
                                        >
                                            {fonts.map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => {
                                                        onTextSettingsChange('fontFamily', f);
                                                        setShowFontDropdown(false);
                                                    }}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <span style={{ fontFamily: f }} className="text-sm text-gray-700">
                                                        {f}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>, document.body)
                                    }
                                </div>

                                {/* Font Size Controls */}
                                <div className={toolGroup}>
                                    <button
                                        onClick={() => {
                                            const newVal = Math.max(8, (layer?.fontSize || 16) - 1);
                                            onTextSettingsChange('fontSize', newVal);
                                            setFontSizeInput(String(newVal));
                                        }}
                                        className="p-1.5 hover:text-blue-600"
                                        title="Decrease font size"
                                    >
                                        <FiMinus size={12} />
                                    </button>

                                    {/* Numeric input to allow direct entry (buffered) */}
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={fontSizeInput}
                                        onChange={(e) => {
                                            // allow empty or numeric characters only
                                            const v = e.target.value.replace(/[^0-9]/g, '');
                                            setFontSizeInput(v);
                                        }}
                                        onBlur={() => {
                                            if (fontSizeInput === '') {
                                                // nothing committed, revert to current layer value
                                                setFontSizeInput(layer && typeof layer.fontSize === 'number' ? String(layer.fontSize) : '');
                                                return;
                                            }
                                            const n = parseInt(fontSizeInput || '0', 10);
                                            const clamped = Number.isNaN(n) ? 16 : Math.min(200, Math.max(8, n));
                                            onTextSettingsChange('fontSize', clamped);
                                            setFontSizeInput(String(clamped));
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.currentTarget.blur();
                                            } else if (e.key === 'Escape') {
                                                // revert edits
                                                setFontSizeInput(layer && typeof layer.fontSize === 'number' ? String(layer.fontSize) : '');
                                                e.currentTarget.blur();
                                            }
                                        }}
                                        className="w-14 text-center text-xs font-bold text-gray-700 bg-transparent border border-transparent focus:border-blue-300 focus:bg-white/5 rounded-sm p-1"
                                        title="Font size"
                                        disabled={!layer}
                                    />

                                    <button
                                        onClick={() => {
                                            const newVal = Math.min(200, (layer?.fontSize || 16) + 1);
                                            onTextSettingsChange('fontSize', newVal);
                                            setFontSizeInput(String(newVal));
                                        }}
                                        className="p-1.5 hover:text-blue-600"
                                        title="Increase font size"
                                    >
                                        <FiPlus size={12} />
                                    </button>
                                </div>

                                {/* Text Style Controls */}
                                <div className={toolGroup}>
                                    <button
                                        onClick={onToggleBold}
                                        className={`p-1.5 ${layer.fontWeight === 'bold' ? 'text-blue-600 bg-blue-50 rounded-md' : 'hover:text-blue-600'}`}
                                        title="Bold"
                                    >
                                        <FiBold size={15} />
                                    </button>
                                    <button
                                        onClick={onToggleItalic}
                                        className={`p-1.5 ${layer.fontStyle === 'italic' ? 'text-blue-600 bg-blue-50 rounded-md' : 'hover:text-blue-600'}`}
                                        title="Italic"
                                    >
                                        <FiItalic size={15} />
                                    </button>
                                    <button
                                        onClick={onToggleUnderline}
                                        className={`p-1.5 ${layer.textDecoration === 'underline' ? 'text-blue-600 bg-blue-50 rounded-md' : 'hover:text-blue-600'}`}
                                        title="Underline"
                                    >
                                        <FiUnderline size={15} />
                                    </button>

                                    {/* Color Picker */}
                                    <div className="relative" ref={colorPickerRef}>
                                        <button
                                            onClick={(e) => {
                                                const btn = saveButtonRef?.current || e.currentTarget;
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setColorPickerPos({
                                                    top: rect.bottom + window.scrollY,
                                                    left: rect.left + window.scrollX,
                                                    width: 256
                                                });
                                                setShowColorPicker(prev => !prev);
                                            }}
                                            className="p-1.5 border-l ml-1 pl-2 border-gray-200 hover:text-blue-600"
                                            title="Text Color"
                                        >
                                            <div className="relative">
                                                <FiType size={15} />
                                                <div
                                                    className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                                                    style={{ backgroundColor: layer.color || '#000' }}
                                                />
                                            </div>
                                        </button>
                                        {showColorPicker && colorPickerPos && createPortal(
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: colorPickerPos.top,
                                                    left: colorPickerPos.left,
                                                    width: colorPickerPos.width,
                                                    zIndex: 99999
                                                }}
                                                className="bg-white border border-gray-200 rounded-lg shadow-xl p-3"
                                                onMouseDown={(e) => e.stopPropagation()}
                                            >
                                                <div className="text-xs font-semibold text-gray-500 mb-2">Preset Colors</div>
                                                <div className="grid grid-cols-10 gap-1 mb-3">
                                                    {presetColors.map(c => (
                                                        <button
                                                            key={c}
                                                            onClick={() => {
                                                                onTextColorChange(c);
                                                                setShowColorPicker(false);
                                                            }}
                                                            className="w-5 h-5 rounded-sm border border-gray-200 hover:scale-110 transition-transform"
                                                            style={{ backgroundColor: c }}
                                                            title={c}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="border-t border-gray-100 pt-2">
                                                    <div className="text-xs font-semibold text-gray-500 mb-2">Custom</div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200">
                                                            <input
                                                                type="color"
                                                                value={layer.color || '#000000'}
                                                                onChange={(e) => onTextColorChange(e.target.value)}
                                                                className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0"
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-600 font-mono uppercase">
                                                            {layer.color || '#000000'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>, document.body)
                                        }
                                    </div>
                                </div>

                                {/* Text Alignment */}
                                <div className={toolGroup}>
                                    <button
                                        onClick={() => onTextAlignChange('left')}
                                        className={`p-1.5 ${layer.textAlign === 'left' ? 'text-blue-600 bg-blue-50 rounded-md' : 'hover:text-blue-600'}`}
                                        title="Align Left"
                                    >
                                        <FiAlignLeft size={15} />
                                    </button>
                                    <button
                                        onClick={() => onTextAlignChange('center')}
                                        className={`p-1.5 ${layer.textAlign === 'center' ? 'text-blue-600 bg-blue-50 rounded-md' : 'hover:text-blue-600'}`}
                                        title="Align Center"
                                    >
                                        <FiAlignCenter size={15} />
                                    </button>
                                    <button
                                        onClick={() => onTextAlignChange('right')}
                                        className={`p-1.5 ${layer.textAlign === 'right' ? 'text-blue-600 bg-blue-50 rounded-md' : 'hover:text-blue-600'}`}
                                        title="Align Right"
                                    >
                                        <FiAlignRight size={15} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Image Layer Specific Controls */}
                        {isImageLayer && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                {verticalDivider}
                                <button onClick={onFlip} className={btnOutline}>
                                    <FiRotateCw size={15} />
                                    <span className="text-xs">Flip</span>
                                </button>
                            </div>
                        )}

                    </div>

                    {/* Right section - Action buttons */}
                    <div className="flex items-center gap-3 min-w-[200px] justify-end">
                        {/* Export Dropdown */}
                        <div className="relative" ref={exportDropdownRef}>
                            <button
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setExportDropdownPos({
                                        top: rect.bottom + window.scrollY,
                                        left: Math.max(8, rect.right - 160 + window.scrollX),
                                        width: 160
                                    });
                                    setShowExportDropdown(prev => !prev);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FiDownload size={16} />
                                <span className="hidden sm:inline">Export</span>
                                <FiChevronDown size={14} />
                            </button>

                            {showExportDropdown && exportDropdownPos && typeof document !== 'undefined' && createPortal(
                                <div
                                    ref={exportDropdownPortalRef}
                                    style={{
                                        position: 'absolute',
                                        top: exportDropdownPos.top,
                                        left: exportDropdownPos.left,
                                        zIndex: 99999
                                    }}
                                    className="bg-white rounded-xl shadow-2xl py-2 border border-gray-100 animate-in fade-in zoom-in-95 duration-200 mr-4"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >

                                    {/* Header */}
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Export as</p>
                                    </div>

                                    {/* Format Options */}
                                    {[
                                        {
                                            format: 'png',
                                            label: 'PNG',
                                        },
                                        {
                                            format: 'jpg',
                                            label: 'JPG',
                                        },
                                        {
                                            format: 'webp',
                                            label: 'WEBP',
                                        },
                                    ].map((item, index) => (
                                        <button
                                            key={item.format}
                                            onClick={() => {
                                                // ask for filename before downloading
                                                setPendingFormat(item.format);
                                                setPendingName((projectName || 'design').toString().replace(/\s+/g, '-'));
                                                setShowNamePrompt(true);
                                                setShowExportDropdown(false);
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-150 flex items-center gap-3 group border-b last:border-b-0 border-gray-50"
                                        >


                                            {/* Content */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-gray-700">.{item.format}</span>
                                                </div>

                                            </div>
                                        </button>
                                    ))}
                                    {/* Filename prompt modal moved to top-level portal for full-screen centering */}

                                </div>, document.body)
                            }
                        </div>

                        {/* Save Button */}
                        <div className="relative" ref={saveButtonRef}>
                            <button
                                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                                onClick={handleSaveClick}
                                onMouseEnter={() => setShowSaveTooltip(true)}
                                onMouseLeave={() => setShowSaveTooltip(false)}
                            >
                                <FiSave size={16} />
                                <span>{isExistingProject ? "Update" : "Save"}</span>
                            </button>

                            {/* Tooltip */}
                            {showSaveTooltip && (
                                <div className="absolute top-full right-0 mt-2 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-50 animate-in fade-in slide-in-from-top-1">
                                    {isExistingProject
                                        ? "Save changes to existing project"
                                        : "Save as new project"}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Name Modal - Only shown for new projects */}
            <ProjectNameModal
                open={showProjectNameModal}
                onClose={() => setShowProjectNameModal(false)}
                onConfirm={handleProjectNameConfirm}
                initialName={projectName}
            />
            {/* Filename prompt modal rendered as a top-level portal to center on whole screen */}
            {showNamePrompt && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onMouseDown={() => setShowNamePrompt(false)} />
                    <div className="relative bg-white rounded-xl p-4 shadow-xl w-80">
                        <h4 className="text-sm font-semibold mb-2">Save image as</h4>
                        <input
                            autoFocus
                            value={pendingName}
                            onChange={(e) => setPendingName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md mb-3"
                            placeholder="filename without extension"
                        />
                        <div className="flex justify-end gap-2">
                            <button className="px-3 py-1 text-sm rounded-md" onClick={() => setShowNamePrompt(false)}>Cancel</button>
                            <button
                                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
                                onClick={async () => {
                                    try {
                                        const name = pendingName || 'design';

                                        const hasValidImageId =
                                            imageId &&
                                            imageId !== 'undefined' &&
                                            imageId !== 'null' &&
                                            typeof imageId === 'string';

                                        // Always attempt backend export if we have a valid imageId and format
                                        const useBackendExport = pendingFormat && hasValidImageId;

                                        if (useBackendExport) {
                                            const blob = await exportImage(imageId, pendingFormat);

                                            const url = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');

                                            link.href = url;
                                            link.download = `${name}.${pendingFormat}`;

                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);

                                            window.URL.revokeObjectURL(url);
                                        } else {
                                            // Use local canvas export which supports CSS gradients
                                            onDownload?.(pendingFormat, name);
                                        }

                                        setShowNamePrompt(false);
                                        setPendingFormat(null);
                                        setPendingName('');
                                    } catch (error) {
                                        console.error('Export failed:', error);

                                        // fallback if backend export fails
                                        onDownload?.(pendingFormat, pendingName || 'design');

                                        setShowNamePrompt(false);
                                        setPendingFormat(null);
                                        setPendingName('');
                                    }
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default EditingToolbar;



