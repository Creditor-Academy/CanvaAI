import React, { useState, useMemo } from "react";
import ReactDOM from "react-dom";
import { X, Download, Image as ImageIcon, ExternalLink } from "lucide-react";
import { useAuth } from '../../../contexts/AuthContext'
import { cloneImage } from '../../../services/imageEditor/imageApi'
import { toast } from 'sonner'
import axios from "axios";

const handleCloneImage = async (imageId) => {
    console.log('importing image', imageId);
    try {
        const token = localStorage.getItem("token");
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

        const response = await axios.get(
            `${API_BASE_URL}/api/images/clone/${imageId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        console.log(response.data,"This is the response data");
        return response.data; // ✅ IMPORTANT
    } catch (err) {
        console.error('Clone/import failed', err);
        throw err; // let caller handle error
    }
};

// Helper function - check if color is transparent
const isTransparent = (color) => {
    if (!color) return true;
    const c = color.replace(/\s/g, '').toLowerCase();
    return (
        c === 'transparent' ||
        c === 'rgba(0,0,0,0)' ||
        c === 'rgba(0,0,0,0.0)'
    );
};

// Render image preview from data
const renderImagePreview = (image) => {
    if (!image?.data) {
        console.warn('No image data provided for preview');
        return null;
    }

    const layers = Array.isArray(image.data)
        ? image.data
        : (image.data?.layer || image.data?.layers || []);

    const canvasSize = image.data?.canvasSize || layers?.[0]?.canvasSize || { width: 800, height: 600 };
    const bgColor = image.data?.canvasBgColor || layers?.[0]?.canvasBgColor || '#ffffff';
    const bgImage = image.data?.canvasBgImage || layers?.[0]?.canvasBgImage || null;

    const isGradient = bgColor && bgColor.includes('gradient');

    // Ensure canvas size has valid dimensions
    const width = Math.max(canvasSize?.width || 800, 100);
    const height = Math.max(canvasSize?.height || 600, 100);


    
    const svgBackgroundStyle = bgImage
        ? { background: '#ffffff' }
        : (isGradient
            ? { background: bgColor }
            : { backgroundColor: isTransparent(bgColor) ? '#f8fafc' : bgColor });

    return (
        <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            style={{ maxHeight: '400px', width: 'auto', ...svgBackgroundStyle }}
        >
            {/* Background */}
            <defs>
                {bgImage && (
                    <pattern id="bgPattern" patternUnits="objectBoundingBox" width="1" height="1">
                        <image href={bgImage} width={width} height={height} preserveAspectRatio="xMidYMid slice" />
                    </pattern>
                )}
            </defs>

            {/* Background rect */}
            <rect
                width={width}
                height={height}
                fill={isGradient ? 'transparent' : (isTransparent(bgColor) ? '#f8fafc' : bgColor)}
            />
            {bgImage && (
                <rect
                    width={width}
                    height={height}
                    fill="url(#bgPattern)"
                />
            )}

            {/* Render layers */}
            {layers?.map((layer) => {
                if (!layer || layer.visible === false) return null;

                const commonStyle = {
                    x: layer.x || 0,
                    y: layer.y || 0,
                    width: layer.width || 0,
                    height: layer.height || 0,
                    opacity: (layer.opacity ?? 100) / 100,
                };

                if (layer.type === 'text') {
                    return (
                        <text
                            key={layer.id}
                            x={commonStyle.x + (layer.width || 0) / 2}
                            y={commonStyle.y + (layer.height || 0) / 2}
                            fontSize={layer.fontSize || 16}
                            fontFamily={layer.fontFamily || 'Arial'}
                            fontWeight={layer.fontWeight || 400}
                            fill={layer.color || '#111827'}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            opacity={commonStyle.opacity}
                        >
                            {layer.text}
                        </text>
                    );
                }

                if (layer.type === 'image') {
                    const src = layer.imageUrl || layer.url || layer.src;
                    if (!src) return null;
                    return (
                        <image
                            key={layer.id}
                            href={src}
                            x={commonStyle.x}
                            y={commonStyle.y}
                            width={commonStyle.width}
                            height={commonStyle.height}
                            opacity={commonStyle.opacity}
                            preserveAspectRatio="xMidYMid slice"
                        />
                    );
                }

                if (layer.type === 'shape') {
                    const fill = isTransparent(layer.fillColor) ? 'none' : layer.fillColor;
                    const stroke = layer.strokeColor || '#000000';
                    const sw = layer.strokeWidth || 1;

                    // Simple rect for shape preview
                    return (
                        <rect
                            key={layer.id}
                            x={commonStyle.x}
                            y={commonStyle.y}
                            width={commonStyle.width}
                            height={commonStyle.height}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={sw}
                            opacity={commonStyle.opacity}
                            rx={layer.shape === 'roundedRectangle' ? '8' : '0'}
                        />
                    );
                }

                return null;
            })}
        </svg>
    );
};

const ImagePopup = ({ image, thumbnail, onClose, onImport }) => {
    const { isAdmin } = useAuth()
    const [importing, setImporting] = useState(false)

    // IMPORTANT: Hooks must be called in same order every render
    // Generate preview BEFORE the early return
    const preview = useMemo(() => {
        if (!image) return null;
        return renderImagePreview(image);
    }, [image]);

    if (!image) {
        return null;
    }

    const portalTarget = document.getElementById('modal-root') || document.body;

    return ReactDOM.createPortal(
        <div style={popupStyles.overlay} onClick={onClose}>
            <div style={popupStyles.modal} onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div style={popupStyles.header}>
                    <h2 style={popupStyles.title}>{image.title || 'Template Preview'}</h2>
                    <button style={popupStyles.closeBtn} onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                {/* Preview area */}
                <div style={popupStyles.content}>
                    {preview ? (
                        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {preview}
                        </div>
                    ) : (
                        <div style={popupStyles.emptyPreview}>
                            <div style={popupStyles.emptyIcon}>
                                <ImageIcon size={40} color="#94a3b8" />
                            </div>
                            <p style={popupStyles.emptyText}>No preview available</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={popupStyles.footer}>
                    <button style={popupStyles.cancelBtn} onClick={onClose}>Cancel</button>
                    <button
                        style={{ ...popupStyles.importBtn, opacity: importing ? 0.6 : 1 }}
                        disabled={importing}
                       onClick={async () => {
    const targetId = image.imageId;
    console.log(targetId,"This is the target id");

    try {
        setImporting(true);

        const data = await handleCloneImage(targetId);
        // console.log("data : ",data._id, " : data inside data",data.data._id) // ✅ correct
        const newId = data.data._id;
        console.log(data,"This is the data");

        // Save prefill data
        try {
            sessionStorage.setItem(
                `prefill_project_${newId}`,
                JSON.stringify(data)
            );
            sessionStorage.setItem(
                `prefill_import_flag_${newId}`,
                '1'
            );
        } catch (err) {
            console.warn('Failed to store cloned prefill project', err);
        }
            console.log(newId,"This is new id")
        toast.success('Template imported to your account');
        window.location.href = `/canva-clone/${newId}`;
        onClose();

    } catch (err) {
        console.error('Clone/import failed', err);
        toast.error('Failed to import template');
    } finally {
        setImporting(false);
    }
}}
                    >
                        <ExternalLink size={16} style={{ marginRight: '8px' }} />
                        {importing ? 'Importing...' : 'Import Template'}
                    </button>
                    {/* <button>
                        onclick = {handleCloneImage(image.imageId)}
                        import button
                    </button> */}
                </div>
            </div>
        </div>,
        portalTarget
    );
};

const popupStyles = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483647,
        padding: '20px',
        pointerEvents: 'all',
        willChange: 'transform',
        isolation: 'isolate',
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '640px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        overflow: 'hidden',
    },
    header: {
        padding: '20px 24px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
    },
    title: {
        margin: 0,
        fontSize: '1.25rem',
        fontWeight: 600,
        color: '#0f172a',
        fontFamily: 'Georgia, "Times New Roman", serif',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: '#64748b',
        cursor: 'pointer',
        padding: '6px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    content: {
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '260px',
    },
    emptyPreview: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
    },
    emptyIcon: {
        width: '72px',
        height: '72px',
        background: '#e2e8f0',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#64748b',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '0.95rem',
    },
    footer: {
        padding: '20px 24px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        flexShrink: 0,
        backgroundColor: '#fff',
    },
    cancelBtn: {
        padding: '10px 20px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#fff',
        color: '#475569',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '0.9rem',
    },
    importBtn: {
        padding: '10px 24px',
        borderRadius: '10px',
        border: 'none',
        backgroundColor: '#0a4cdb',
        color: '#fff',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '0.9rem',
        boxShadow: '0 4px 6px -1px rgba(99,102,241,0.2)',
    },
};

export default ImagePopup;

