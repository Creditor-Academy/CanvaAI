import React, { useState, useMemo } from "react";
import { X, Download, Image as ImageIcon, ZoomIn } from "lucide-react";
import { useAuth } from '../../../contexts/AuthContext'
import { cloneImage } from '../../../services/imageEditor/imageApi'
import { toast } from 'sonner'

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

    return (
        <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            style={{ maxHeight: '400px', width: 'auto', backgroundColor: isTransparent(bgColor) ? '#f8fafc' : bgColor }}
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
                fill={isGradient ? 'white' : (isTransparent(bgColor) ? '#f8fafc' : bgColor)}
                style={isGradient ? { background: bgColor } : {}}
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

    console.log('ImagePopup rendering with image:', image);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={onClose}
        >
            {/* Modal content */}
            <div
                className="relative bg-white rounded-2xl max-w-2xl w-full mx-auto overflow-hidden shadow-2xl border border-slate-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <ImageIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Template Preview
                                </h2>
                                <p className="text-sm text-blue-100">
                                    Review your selected template
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 group"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Image container with enhanced styling */}
                <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8 min-h-[350px]">
                    {thumbnail ? (
                        <div className="relative group">
                            <img
                                src={thumbnail}
                                alt={image.title}
                                className="max-h-[300px] max-w-[90%] w-auto object-contain rounded-xl shadow-lg transition-all duration-300 group-hover:shadow-xl"
                            />

                            {/* Zoom indicator on hover */}
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                    <ZoomIn className="w-3.5 h-3.5" />
                                    <span>Preview</span>
                                </div>
                            </div>
                        </div>
                    ) : preview ? (
                        <div className="w-full h-full flex items-center justify-center">
                            {preview}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <ImageIcon className="w-10 h-10 text-slate-400" />
                            </div>
                            <p className="text-slate-600 font-semibold mb-2">Preview Not Available</p>
                            <p className="text-sm text-slate-500 mb-4">This template has no preview data</p>
                            {image.title && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <p className="text-sm font-medium text-slate-700">Template: {image.title}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Enhanced footer with better styling */}
                <div className="bg-white px-6 py-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-slate-900 truncate">
                                {image.title || "Untitled Template"}
                            </h3>
                            {image.description && (
                                <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                                    {image.description}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 ml-4">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 focus:ring-4 focus:ring-slate-100"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={async () => {
                                    // Always clone the template into the current user's account
                                    const targetId = image.imageId || image._id
                                    try {
                                        setImporting(true)
                                        const resp = await cloneImage(targetId)
                                        const newId = resp?.data?._id || resp?.imageId || resp?.data?.imageId || resp?._id || targetId
                                        try {
                                            const payload = resp.data || resp
                                            sessionStorage.setItem(`prefill_project_${newId}`, JSON.stringify(payload))
                                            sessionStorage.setItem(`prefill_import_flag_${newId}`, '1')
                                        } catch (err) {
                                            console.warn('Failed to store cloned prefill project', err)
                                        }
                                        window.open(`/canva-clone/${newId}`, '_blank')
                                        toast.success('Template imported to your account')
                                    } catch (err) {
                                        console.error('Clone/import failed', err)
                                        toast.error('Failed to import template')
                                    } finally {
                                        setImporting(false)
                                    }
                                }}
                                disabled={importing}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 focus:ring-4 focus:ring-blue-200 flex items-center gap-2 group disabled:opacity-60"
                            >
                                <Download className="w-4 h-4 group-hover:animate-bounce" />
                                {importing ? 'Importing...' : 'Import Template'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImagePopup;


