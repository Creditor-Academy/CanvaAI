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
    onPosition
}) => {
    const [showFontDropdown, setShowFontDropdown] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const fontDropdownRef = useRef(null);
    const menuRef = useRef(null);

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

    const menuItems = [
        { id: 'file', label: 'File' },
        { id: 'insert', label: 'Insert' },
        { id: 'format', label: 'Format' },
        { id: 'slide', label: 'Slide' },
        { id: 'tools', label: 'Tools' }
    ];

    return (
        <div className="bg-white border-b border-gray-200 w-full sticky top-0 z-[100] flex flex-col antialiased">


            {/* 2. MENU BAR (File, Insert, etc) */}
            <div className="flex items-center h-9 px-4 border-b border-gray-100" ref={menuRef}>
                {menuItems.map((item) => (
                    <div key={item.id} className="relative">
                        <button
                            onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                            className={`px-3 h-7 flex items-center text-sm font-normal text-gray-700 hover:bg-gray-100 rounded transition-colors ${activeMenu === item.id ? 'bg-gray-100 text-gray-900' : ''
                                }`}
                        >
                            {item.label}
                        </button>
                        {activeMenu === item.id && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[110] py-1 min-w-[200px]">
                                <div className="px-3 py-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
                                    {item.label} Options
                                </div>
                                <div className="border-t border-gray-100"></div>
                                <div className="px-1 py-1">
                                    {['New', 'Open', 'Download', 'History'].map(opt => (
                                        <div key={opt}
                                            onClick={() => opt === 'Download' && onDownload()}
                                            className="px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded cursor-pointer transition-colors">
                                            {opt}...
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="h-14 px-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                    {/* App Icon */}
                    <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center shadow-sm">
                        <FiFile className="text-white" size={18} />
                    </div>
                    {/* Title & Icons */}
                    <div>Untitled Image</div>
                </div>

                <div className="max-w-[1600px] w-full mx-auto px-4 h-12 flex items-center gap-3 overflow-x-visible overflow-y-visible no-scrollbar">

                    <div className={toolGroup}>
                        <button onClick={onUndo} disabled={!canUndo} className={btnGhost} title="Undo"><FiRotateCcw size={15} /></button>
                        <button onClick={onRedo} disabled={!canRedo} className={btnGhost} title="Redo"><FiRotateCw size={15} /></button>
                    </div>

                    <button onClick={onDuplicate} disabled={!hasSelection} className={btnGhost}>
                        <FiCopy size={15} /> <span className="hidden lg:inline text-xs">Duplicate</span>
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
                                <button onClick={() => setShowColorPicker(!showColorPicker)} className="p-1 border-l ml-1 pl-2 border-gray-200"><FiType size={15} style={{ borderBottom: `2px solid ${layer.color || '#000'}` }} /></button>
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
                            <button onClick={onEdit} className={btnOutline}><FiEdit3 size={15} /><span className="text-xs">Edit</span></button>
                            <button onClick={onEraser} className={btnOutline}><FiTrash2 size={15} /><span className="text-xs">Remove BG</span></button>
                            <button onClick={onFlip} className={btnOutline}><FiRotateCw size={15} /><span className="text-xs">Flip</span></button>
                            <button onClick={() => handleToolSelect('crop')} className={selectedTool === 'crop' ? btnActive : btnOutline}><FiCrop size={15} /><span className="text-xs">Crop</span></button>
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
                        {/* Saving Status */}
                        <button
                            onClick={onDownload}
                            className="flex items-center cursor-pointer gap-2 text-sm mr-2">
                            <span>Download</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Saving Status */}
                        <button className="flex items-center cursor-pointer gap-2 text-sm mr-2">
                            <FiSave className="animate-pulse text-gray-400" />
                            <span>Save</span>
                        </button>
                    </div>
                </div>


            </div>

        </div>
    );
};

export default EditingToolbar;

