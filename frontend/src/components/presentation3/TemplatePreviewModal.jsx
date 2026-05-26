import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

const TemplatePreviewModal = ({ isOpen, onClose, templateData, onImport }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (isOpen) setCurrentIndex(0);
    }, [isOpen, templateData]);

    if (!isOpen || !templateData) return null;

    const slides = Array.isArray(templateData.data?.slides)
        ? templateData.data.slides
        : (templateData.data?.layers ? [templateData.data] : []);

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[99999] backdrop-blur-md px-4 sm:px-8" onClick={onClose}>

            {/* Outside Close Button */}
            <button 
                className="absolute top-6 right-6 sm:top-10 sm:right-10 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-xl border border-white/10 group active:scale-90 z-[100000]" 
                onClick={onClose}
                title="Close Preview"
            >
                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            <div className="bg-white rounded-[32px] w-full max-w-[1200px] max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-[0_32px_80px_rgba(0,0,0,0.5)] overflow-hidden" onClick={(e) => e.stopPropagation()}>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                    
                    {/* Top Section: Slider + Info Sidebar */}
                    <div className="flex flex-col lg:flex-row border-b border-slate-100 min-h-0 lg:min-h-[500px]">
                        
                        {/* Left Column: Featured Slider */}
                        <div className="flex-[2.5] bg-slate-50/50 p-6 sm:p-12 flex items-center justify-center gap-4 select-none relative group/slider border-r border-slate-100">
                            <button 
                                className="absolute left-4 sm:left-6 z-20 w-10 h-10 sm:w-14 sm:h-14 rounded-full border border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-center text-slate-700 transition-all hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-[0_8px_20px_rgba(79,70,229,0.3)] active:scale-90 shrink-0 disabled:opacity-20 shadow-xl"
                                onClick={handlePrev}
                                disabled={slides.length <= 1}
                            >
                                <ChevronLeft size={24} />
                            </button>

                            <div className="flex-1 w-full max-w-[760px] relative px-4">
                                <div className="relative group">
                                    <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[22px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                                    <div className="relative">
                                        {slides[currentIndex] && (
                                            <div className="animate-in fade-in zoom-in duration-500">
                                                <SlideCard slide={slides[currentIndex]} index={currentIndex} isLarge />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Slide Counter Indicator */}
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
                                    {slides.map((_, i) => (
                                        <button
                                            key={i} 
                                            onClick={() => setCurrentIndex(i)}
                                            className={`h-2 rounded-full transition-all duration-500 cursor-pointer border-none p-0 ${i === currentIndex ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button 
                                className="absolute right-4 sm:right-6 z-20 w-10 h-10 sm:w-14 sm:h-14 rounded-full border border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-center text-slate-700 transition-all hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-[0_8px_20px_rgba(79,70,229,0.3)] active:scale-90 shrink-0 disabled:opacity-20 shadow-xl"
                                onClick={handleNext}
                                disabled={slides.length <= 1}
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        {/* Right Column: Template Info Sidebar */}
                        <div className="flex-1 p-8 sm:p-12 bg-white flex flex-col justify-center border-t lg:border-t-0">
                            <div className="max-w-[320px] mx-auto lg:mx-0 w-full">
                            
                                
                                <h2 className="m-0 text-3xl sm:text-4xl text-slate-900 font-extrabold tracking-tight leading-[1.1] mb-6">
                                    {templateData.title || 'Untitled Presentation'}
                                </h2>

                                <div className="flex items-center gap-4 py-6 border-y border-slate-100 mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50/50 flex items-center justify-center text-indigo-500 shrink-0">
                                        <ChevronRight size={28} className="rotate-90 sm:rotate-0" />
                                    </div>
                                    <div>
                                        <p className="m-0 text-lg font-black text-slate-900 leading-none mb-1.5">{slides.length} {slides.length === 1 ? 'Slide' : 'Slides'}</p>
                                        <p className="m-0 text-[0.8rem] font-medium text-slate-500 uppercase tracking-wider">Professional Pack</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-slate-50 mt-8">
                                    <button
                                        className="w-full py-4 rounded-2xl border-none bg-indigo-600 text-white font-bold text-base cursor-pointer flex items-center justify-center transition-all duration-300 shadow-[0_12px_24px_rgba(79,70,229,0.25)] hover:bg-indigo-700 hover:shadow-[0_16px_32px_rgba(79,70,229,0.35)] active:scale-95 group"
                                        onClick={onImport}
                                    >
                                        <ExternalLink size={20} className="mr-3 group-hover:scale-110 transition-transform" />
                                        Import Template
                                    </button>
                                    <button 
                                        className="w-full py-4 rounded-2xl border border-slate-200 bg-white text-slate-600 font-bold text-sm cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95" 
                                        onClick={onClose}
                                    >
                                        Dismiss Preview
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Thumbnails Grid */}
                    <div className="p-8 sm:p-12 pt-10 sm:pt-14 bg-slate-50/30">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-px flex-1 bg-slate-200" />
                            <h3 className="text-[0.75rem] font-black text-slate-400 uppercase tracking-[0.2em] px-4">All Slides</h3>
                            <div className="h-px flex-1 bg-slate-200" />
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                            {slides.map((slide, index) => (
                                <button
                                    key={slide.id || index} 
                                    onClick={() => setCurrentIndex(index)}
                                    className={`group/thumb relative cursor-pointer border-none p-0 transition-all duration-200 rounded-xl overflow-hidden  ${index === currentIndex ? 'ring-2 ring-indigo-600 transform scale-[1.05] shadow-2xl' : 'hover:opacity-100  hover:scale-105'}`}
                                >
                                    <SlideCard slide={slide} index={index} />
                                    {index === currentIndex && (
                                        <div className="absolute inset-0 bg-indigo-600/10 pointer-events-none border-2 border-indigo-600/20 rounded-xl" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
};

const SlideCard = ({ slide, index, isLarge = false }) => {
    const REF_WIDTH = 1000;

    const renderSpan = (span, k) => (
        <span key={k} style={{
            fontWeight: span.bold ? 'bold' : 'normal',
            fontStyle: span.italic ? 'italic' : 'normal',
            textDecoration: span.underline ? 'underline' : 'none',
            color: span.color || 'inherit',
            fontFamily: span.fontFamily || 'inherit',
        }}>
            {span.text}
        </span>
    );

    const renderContent = (layer) => {
        if (layer.type === 'text') {
            return (
                <div className="w-full h-full overflow-hidden">
                    {layer.content?.map((block, i) => {
                        if (block.type === 'bulleted-list') {
                            return (
                                <ul key={i} className="m-0 pl-[1.2em] list-disc">
                                    {block.children?.map((item, j) => (
                                        <li key={j} className="text-inherit">
                                            {item.children?.map((span, k) => renderSpan(span, k))}
                                        </li>
                                    ))}
                                </ul>
                            );
                        }
                        if (block.type === 'numbered-list') {
                            return (
                                <ol key={i} className="m-0 pl-[1.2em] list-decimal">
                                    {block.children?.map((item, j) => (
                                        <li key={j} className="text-inherit">
                                            {item.children?.map((span, k) => renderSpan(span, k))}
                                        </li>
                                    ))}
                                </ol>
                            );
                        }
                        return (
                            <p key={i} className="m-0 min-h-[1em]">
                                {block.children?.map((span, k) => renderSpan(span, k))}
                            </p>
                        );
                    })}
                </div>
            );
        }

        if (layer.type === 'image') {
            return (
                <img
                    src={layer.imageUrl || layer.src}
                    alt=""
                    style={{
                        borderRadius: `${(layer.borderRadius || 0) * 0.25}px`,
                    }}
                    className="w-full h-full object-cover"
                />
            );
        }

        if (layer.type === 'table') {
            const rows = layer.rows || 0;
            const cols = layer.cols || 0;
            return (
                <div style={{
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    backgroundColor: layer.tableBgColor || 'transparent'
                }} className="grid w-full h-full border-[0.5px] border-[#ccc]">
                    {layer.cells?.map((row, ri) =>
                        row.map((cell, ci) => (
                            <div key={`${ri}-${ci}`} className="border-[0.1px] border-[#ddd] flex items-center justify-center text-[4px] p-[1px]">
                                {cell.content?.[0]?.children?.[0]?.text?.substring(0, 5)}
                            </div>
                        ))
                    )}
                </div>
            );
        }
        return null;
    };

    const renderLayer = (layer) => {
        const x = (layer.x / REF_WIDTH) * 100;
        const y = (layer.y / (REF_WIDTH * 0.5625)) * 100;
        const w = (layer.width / REF_WIDTH) * 100;
        const h = (layer.height / (REF_WIDTH * 0.5625)) * 100;

        const isHeading = layer.role === "heading" || layer.role === "title";

        const style = {
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: `${w}%`,
            height: `${h}%`,
            fontSize: `${(layer.fontSize || 16) * 0.28}px`,
            color: layer.color || '#000',
            textAlign: layer.textAlign || 'left',
            transform: `rotate(${layer.rotation || 0}deg)`,
            pointerEvents: 'none',
            zIndex: 10,
            ...(isHeading && { textTransform: "uppercase" }),
        };

        return (
            <div key={layer.id} style={style}>
                {renderContent(layer)}
            </div>
        );
    };

    return (
        <div className={`flex flex-col ${isLarge ? 'gap-0' : 'gap-3'}`}>
            <div className={`aspect-video w-full overflow-hidden border border-slate-200 ${isLarge ? 'rounded-2xl shadow-2xl' : 'shadow-sm rounded-xl'}`}>
                <div style={{
                    backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : 'none',
                    backgroundColor: slide.background || slide.backgroundColor || '#fff',
                }} className="w-full h-full bg-cover bg-center relative">
                    {slide.layers?.map(renderLayer)}
                </div>
            </div>
            {!isLarge && <div className="text-[0.85rem] text-slate-500 text-center font-medium">Slide {index + 1}</div>}
        </div>
    );
};

export default TemplatePreviewModal;
