import React from 'react';
import ReactDOM from 'react-dom';
import { X, ExternalLink } from 'lucide-react';

const TemplatePreviewModal = ({ isOpen, onClose, templateData, onImport }) => {
    if (!isOpen || !templateData) return null;

    const slides = Array.isArray(templateData.data?.slides)
        ? templateData.data.slides
        : (templateData.data?.layers ? [templateData.data] : []);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/35 flex items-center justify-center z-[99999]" onClick={onClose}>
            <div className="bg-white rounded-2xl w-[90%] max-w-[1000px] max-h-[85vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="m-0 text-2xl text-slate-900 font-semibold">{templateData.title || 'Template Preview'}</h2>
                    <button className="bg-transparent border-none text-slate-500 cursor-pointer p-1 rounded-lg transition-colors hover:bg-slate-100" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                        {slides.map((slide, index) => (
                            <SlideCard key={slide.id || index} slide={slide} index={index} />
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                    <button className="px-5 py-2.5 rounded-[10px] border border-slate-200 bg-white text-slate-600 font-medium cursor-pointer transition-all hover:bg-slate-50 active:scale-95" onClick={onClose}>Cancel</button>
                    <button 
                        className="px-6 py-2.5 rounded-[10px] border-none bg-[#0a4cdb] text-white font-semibold cursor-pointer flex items-center transition-all duration-200 shadow-[0_4px_6px_-1px_rgba(99,102,241,0.2)] hover:bg-[#093bb3] active:scale-95" 
                        onClick={onImport}
                    >
                        <ExternalLink size={18} className="mr-2" />
                        Import Template
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const SlideCard = ({ slide, index }) => {
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
        };

        return (
            <div key={layer.id} style={style}>
                {renderContent(layer)}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="aspect-video w-full shadow-sm rounded-xl overflow-hidden border border-slate-200">
                <div style={{
                    backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : 'none',
                    backgroundColor: slide.background || slide.backgroundColor || '#fff',
                }} className="w-full h-full bg-cover bg-center relative">
                    {slide.layers?.map(renderLayer)}
                </div>
            </div>
            <div className="text-[0.85rem] text-slate-500 text-center">Slide {index + 1}</div>
        </div>
    );
};

export default TemplatePreviewModal;
