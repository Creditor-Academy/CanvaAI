import React from 'react';
import ReactDOM from 'react-dom';
import { X, ExternalLink } from 'lucide-react';

const TemplatePreviewModal = ({ isOpen, onClose, templateData, onImport }) => {
    if (!isOpen || !templateData) return null;

    const slides = Array.isArray(templateData.data?.slides)
        ? templateData.data.slides
        : (templateData.data?.layers ? [templateData.data] : []);

    return ReactDOM.createPortal(
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>{templateData.title || 'Template Preview'}</h2>
                    <button style={styles.closeBtn} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div style={styles.content}>
                    <div style={styles.grid}>
                        {slides.map((slide, index) => (
                            <SlideCard key={slide.id || index} slide={slide} index={index} />
                        ))}
                    </div>
                </div>

                <div style={styles.footer}>
                    <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    <button style={styles.importBtn} onClick={onImport}>
                        <ExternalLink size={18} style={{ marginRight: '8px' }} />
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
                <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                    {layer.content?.map((block, i) => {
                        if (block.type === 'bulleted-list') {
                            return (
                                <ul key={i} style={{ margin: 0, paddingLeft: '1.2em', listStyleType: 'disc' }}>
                                    {block.children?.map((item, j) => (
                                        <li key={j} style={{ fontSize: 'inherit' }}>
                                            {item.children?.map((span, k) => renderSpan(span, k))}
                                        </li>
                                    ))}
                                </ul>
                            );
                        }
                        if (block.type === 'numbered-list') {
                            return (
                                <ol key={i} style={{ margin: 0, paddingLeft: '1.2em', listStyleType: 'decimal' }}>
                                    {block.children?.map((item, j) => (
                                        <li key={j} style={{ fontSize: 'inherit' }}>
                                            {item.children?.map((span, k) => renderSpan(span, k))}
                                        </li>
                                    ))}
                                </ol>
                            );
                        }
                        return (
                            <p key={i} style={{ margin: 0, minHeight: '1em' }}>
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
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: `${(layer.borderRadius || 0) * 0.25}px`,
                    }}
                />
            );
        }

        if (layer.type === 'table') {
            const rows = layer.rows || 0;
            const cols = layer.cols || 0;
            return (
                <div style={{
                    display: 'grid',
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    width: '100%',
                    height: '100%',
                    border: '0.5px solid #ccc',
                    backgroundColor: layer.tableBgColor || 'transparent'
                }}>
                    {layer.cells?.map((row, ri) =>
                        row.map((cell, ci) => (
                            <div key={`${ri}-${ci}`} style={{
                                border: '0.1px solid #ddd',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '4px',
                                padding: '1px'
                            }}>
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
        <div style={styles.slideCard}>
            <div style={styles.slideThumbnailWrapper}>
                <div style={{
                    ...styles.slideThumbnail,
                    backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : 'none',
                    backgroundColor: slide.background || slide.backgroundColor || '#fff',
                }}>
                    {slide.layers?.map(renderLayer)}
                </div>
            </div>
            <div style={styles.slideNumber}>Slide {index + 1}</div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '1000px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    header: {
        padding: '24px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        margin: 0,
        fontSize: '1.5rem',
        color: '#0f172a',
        fontWeight: 600,
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: '#64748b',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '8px',
        transition: 'background 0.2s',
    },
    content: {
        flex: 1,
        overflowY: 'auto',
        padding: '32px',
        backgroundColor: '#f8fafc',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px',
    },
    slideCard: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    slideThumbnailWrapper: {
        aspectRatio: '16/9',
        width: '100%',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
    },
    slideThumbnail: {
        width: '100%',
        height: '100%',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        backgroundColor: '#fff',
    },
    slideNumber: {
        fontSize: '0.85rem',
        color: '#64748b',
        textAlign: 'center',
    },
    footer: {
        padding: '24px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
    },
    cancelBtn: {
        padding: '10px 20px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#fff',
        color: '#475569',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    importBtn: {
        padding: '10px 24px',
        borderRadius: '10px',
        border: 'none',
        backgroundColor: '#0a4cdbff',
        color: '#fff',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.2s',
        boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)',
    },
};

export default TemplatePreviewModal;
