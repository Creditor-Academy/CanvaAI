import React, { useState, useRef, useEffect } from 'react';
import {
    FiBold, FiItalic, FiUnderline, FiAlignLeft, FiAlignCenter,
    FiAlignRight, FiType, FiZap, FiMove, FiChevronDown,
    FiRotateCcw, FiRotateCw, FiSave, FiDownload, FiCopy,
    FiEdit3, FiTrash2, FiMinus, FiPlus, FiFilter, FiCrop, FiLayers,
    FiFile, FiImage, FiSettings, FiStar, FiFolder, FiShare2, FiPlay, FiMessageSquare
} from 'react-icons/fi';

const EditingToolbar = ({
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
    onToggleVisibility,
    userRole,
}) => {
    const [showFontDropdown, setShowFontDropdown] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const fontDropdownRef = useRef(null);
    const menuRef = useRef(null);
    const exportDropdownRef = useRef(null);
    const colorPickerRef = useRef(null);

    const presetColors = [
        '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
        '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
        '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
        '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
        '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
        '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
    ];

    const fonts = [
        'Arial',
        'Helvetica',
        'Roboto',
        'Open Sans',
        'Lato',
        'Montserrat',
        'Poppins',
        'Inter',
        'Oswald',
        'Roboto Mono',
        'Raleway',
        'Ubuntu',
        'Merriweather',
        'Playfair Display',
        'Dancing Script'
    ];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target)) {
                setShowFontDropdown(false);
            }
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setActiveMenu(null);
            }
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
                setShowExportDropdown(false);
            }
            if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
                setShowColorPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isTextLayer = selectedLayer && layer?.type === 'text';
    const isImageLayer = selectedLayer && layer?.type === 'image';

    // Style Helpers
    const btnBase = "h-8 flex items-center justify-center gap-2 px-2.5 text-sm font-medium transition-all rounded-md";
    const btnGhost = `${btnBase} text-gray-600 hover:bg-gray-100 active:scale-95 disabled:opacity-30`;
    const btnOutline = `${btnBase} border border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 bg-white shadow-sm`;
    const btnPrimary = "h-9 px-4 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-all";
    const btnActive = `${btnBase} bg-blue-50 text-blue-600 border border-blue-200`;
    const toolGroup = "flex items-center gap-1 bg-gray-50/80 p-1 rounded-lg border border-gray-100";
    const verticalDivider = <div className="w-px h-5 bg-gray-200 mx-2" />;



    return (
        <div className="bg-white border-b border-gray-200 w-full sticky top-0 z-[100] flex flex-col antialiased">

            <div className="h-14 px-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                    {/* App Icon */}
                    <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center shadow-sm">
                        <FiFile className="text-white" size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800 truncate max-w-[200px]">
                            {projectName || 'Untitled Design'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">Auto-saved</span>
                    </div>
                </div>

                <div className="max-w-[1600px] w-full mx-auto px-4 h-12 flex items-center gap-3 overflow-x-visible overflow-y-visible no-scrollbar">

                    <div className={toolGroup}>
                        <button onClick={onUndo} disabled={!canUndo} className={btnGhost} title="Undo"><FiRotateCcw size={15} /></button>
                        <button onClick={onRedo} disabled={!canRedo} className={btnGhost} title="Redo"><FiRotateCw size={15} /></button>
                    </div>

                    <button onClick={onDuplicate} disabled={!hasSelection} className={btnGhost}>
                        <FiCopy size={15} />
                    </button>

                    <button
                        onClick={onToggleBackground}
                        className={`${btnOutline} ${isBgRemoved ? 'bg-red-50 border-red-200 text-red-600' : ''}`}
                        title={isBgRemoved ? "Restore Background" : "Remove Background"}
                    >
                        <FiTrash2 size={15} />
                        <span className="hidden lg:inline text-xs">{isBgRemoved ? "Restore BG" : "Remove BG"}</span>
                    </button>

                    {isTextLayer && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                            {verticalDivider}
                            <div className="relative" ref={fontDropdownRef}>
                                <button onClick={() => setShowFontDropdown(!showFontDropdown)} className={`${btnOutline} min-w-[140px] justify-between h-8`}>
                                    <span className="truncate text-xs" style={{ fontFamily: layer.fontFamily || 'Arial' }}>
                                        {layer.fontFamily || 'Arial'}
                                    </span>
                                    <FiChevronDown size={12} />
                                </button>
                                {showFontDropdown && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[110] py-1 min-w-[200px] max-h-64 overflow-y-auto">
                                        {fonts.map(f => (
                                            <button
                                                key={f}
                                                onClick={() => { onTextSettingsChange('fontFamily', f); setShowFontDropdown(false); }}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <span style={{ fontFamily: f }} className="text-sm text-gray-700">
                                                    {f}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>


                            <div className={toolGroup}>
                                <button onClick={() => onTextSettingsChange('fontSize', Math.max(8, (layer.fontSize || 16) - 1))} className="p-1 hover:text-blue-600"><FiMinus size={12} /></button>
                                <input type="number" value={layer.fontSize || 16} readOnly className="w-8 bg-transparent text-center text-xs font-bold" />
                                <button onClick={() => onTextSettingsChange('fontSize', Math.min(200, (layer.fontSize || 16) + 1))} className="p-1 hover:text-blue-600"><FiPlus size={12} /></button>
                            </div>


                            <div className={toolGroup}>
                                <button onClick={onToggleBold} className={layer.fontWeight === 'bold' ? 'text-blue-600 p-1' : 'p-1'}><FiBold size={15} /></button>
                                <button onClick={onToggleItalic} className={layer.fontStyle === 'italic' ? 'text-blue-600 p-1' : 'p-1'}><FiItalic size={15} /></button>
                                <button onClick={onToggleUnderline} className={layer.textDecoration === 'underline' ? 'text-blue-600 p-1' : 'p-1'}><FiUnderline size={15} /></button>
                                <div className="relative" ref={colorPickerRef}>
                                    <button
                                        onClick={() => setShowColorPicker(!showColorPicker)}
                                        className="p-1 border-l ml-1 pl-2 border-gray-200"
                                        title="Text Color"
                                    >
                                        <FiType size={15} style={{ borderBottom: `2px solid ${layer.color || '#000'}` }} />
                                    </button>
                                    {showColorPicker && (
                                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[150] p-3 w-64">
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
                                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200">
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
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={toolGroup}>
                                <button onClick={() => onTextAlignChange('left')} className={layer.textAlign === 'left' ? 'text-blue-600 p-1' : 'p-1'}><FiAlignLeft size={15} /></button>
                                <button onClick={() => onTextAlignChange('center')} className={layer.textAlign === 'center' ? 'text-blue-600 p-1' : 'p-1'}><FiAlignCenter size={15} /></button>
                                <button onClick={() => onTextAlignChange('right')} className={layer.textAlign === 'right' ? 'text-blue-600 p-1' : 'p-1'}><FiAlignRight size={15} /></button>
                            </div>

                        </div>
                    )}

                    {isImageLayer && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                            {verticalDivider}
                            <button onClick={onFlip} className={btnOutline}><FiRotateCw size={15} /><span className="text-xs">Flip</span></button>
                            <button onClick={onStartCrop} className={isCropping ? btnActive : btnOutline}><FiCrop size={15} /><span className="text-xs">Crop</span></button>
                        </div>
                    )}

                    <div className="flex-1" />

                    {/* Meta Tools */}
                    {selectedLayer && (
                        <div className="flex items-center gap-2">
                            <button onClick={onEffects} className={btnOutline}><FiZap size={15} className="text-amber-500" /><span className="text-xs">Effects</span></button>
                        </div>
                    )}
                </div>

                <div className='flex gap-4'>
                    <div className="flex items-center gap-4">
                        {/* Export Dropdown */}
                        <div
                            className="relative"
                            ref={exportDropdownRef}

                        >
                            <button
                                onClick={() => setShowExportDropdown(!showExportDropdown)}
                                className="flex items-center cursor-pointer gap-2 text-sm mr-2"
                            >
                                <span>Export</span>
                                <FiChevronDown size={14} />
                            </button>

                            {showExportDropdown && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-50">
                                    <button
                                        onClick={() => {
                                            onDownload('jpg');
                                            setShowExportDropdown(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                                    >
                                        .jpg
                                    </button>
                                    <button
                                        onClick={() => {
                                            onDownload('png');
                                            setShowExportDropdown(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                                    >
                                        .png
                                    </button>
                                    <button
                                        onClick={() => {
                                            onDownload('pdf');
                                            setShowExportDropdown(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                                    >
                                        .pdf
                                    </button>
                                    <button
                                        onClick={() => {
                                            onDownload('svg');
                                            setShowExportDropdown(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                                    >
                                        .svg
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {isExistingProject && userRole === 'admin' && (
                            <button
                                className="flex items-center cursor-pointer gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                                onClick={onToggleVisibility}
                                title="Toggle Public/Private"
                            >
                                <FiShare2 size={16} />
                                <span>Public</span>
                            </button>
                        )}
                        {/* Saving Status */}
                        <button
                            className="flex items-center cursor-pointer gap-2 text-sm mr-2"
                            onClick={onSave}
                        >
                            <FiSave className="animate-pulse text-gray-400" />
                            <span>{isExistingProject ? "Save" : "Save As"}</span>
                        </button>
                    </div>
                </div>


            </div>

        </div>
    );
};

export default EditingToolbar;



