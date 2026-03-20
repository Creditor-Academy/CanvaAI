import { getUserImages, deleteImage } from '@/services/imageEditor/imageApi'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const isTransparent = (color) => {
    if (!color) return true;
    const c = color.replace(/\s/g, '').toLowerCase();
    return (
        c === 'transparent' ||
        c === 'rgba(0,0,0,0)' ||
        c === 'rgba(0,0,0,0.0)'
    );
};

// SVG Shape generators for thumbnail preview - supports all shape types
const getShapeSVG = (shape, width, height, fillColor, strokeColor, strokeWidth) => {
    const w = width, h = height;
    const fill = isTransparent(fillColor) ? 'none' : fillColor;
    const stroke = strokeColor || '#000000';
    const sw = strokeWidth || 1;

    // Generate polygon points for regular shapes
    const generatePolygonPoints = (sides, radius, offsetAngle = 0) => {
        const points = [];
        const cx = w / 2, cy = h / 2;
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) + offsetAngle;
            points.push(
                cx + radius * Math.cos(angle),
                cy + radius * Math.sin(angle)
            );
        }
        return points.join(',');
    };

    const svgPath = {
        // Basic shapes
        line: `M0,${h / 2} L${w},${h / 2}`,
        rectangle: `M0,0 L${w},0 L${w},${h} L0,${h} Z`,
        circle: `M${w / 2},0 A${w / 2},${h / 2} 0 1,1 ${w / 2},${h} A${w / 2},${h / 2} 0 1,1 ${w / 2},0 Z`,
        ellipse: `M${w / 2},0 A${w / 2},${h / 2} 0 1,1 ${w / 2},${h} A${w / 2},${h / 2} 0 1,1 ${w / 2},0 Z`,

        // Triangles
        triangle: `M${w / 2},0 L${w},${h} L0,${h} Z`,
        rightTriangle: `M0,0 L${w},0 L0,${h} Z`,

        // Stars
        star: `M${w / 2},${h * 0.1} L${w * 0.37},${h * 0.35} L${w * 0.1},${h * 0.35} L${w * 0.35},${h * 0.57} L${w * 0.2},${h * 0.9} L${w / 2},${h * 0.68} L${w * 0.8},${h * 0.9} L${w * 0.65},${h * 0.57} L${w * 0.9},${h * 0.35} L${w * 0.63},${h * 0.35} Z`,
        star6: (() => {
            const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2;
            let points = [];
            for (let i = 0; i < 12; i++) {
                const angle = (i * Math.PI) / 6;
                const radius = i % 2 === 0 ? r : r * 0.5;
                points.push(
                    cx + radius * Math.cos(angle - Math.PI / 2),
                    cy + radius * Math.sin(angle - Math.PI / 2)
                );
            }
            return `M${points.join(' L')} Z`;
        })(),

        // Heart
        heart: `M${w / 2},${h * 0.9} C${w * 0.2},${h * 0.7} ${w * 0.1},${h * 0.5} ${w * 0.1},${h * 0.35} C${w * 0.1},${h * 0.15} ${w * 0.25},${h * 0.05} ${w * 0.35},${h * 0.05} C${w * 0.45},${h * 0.05} ${w / 2},${h * 0.2} L${w / 2},${h * 0.2} C${w / 2},${h * 0.2} ${w * 0.55},${h * 0.05} ${w * 0.65},${h * 0.05} C${w * 0.75},${h * 0.05} ${w * 0.9},${h * 0.15} ${w * 0.9},${h * 0.35} C${w * 0.9},${h * 0.5} ${w * 0.8},${h * 0.7} ${w / 2},${h * 0.9} Z`,

        // Diamond
        diamond: `M${w / 2},0 L${w},${h / 2} L${w / 2},${h} L0,${h / 2} Z`,

        // Pentagon
        pentagon: (() => {
            const points = generatePolygonPoints(5, Math.min(w, h) / 2, -Math.PI / 2);
            return `M${points} Z`;
        })(),

        // Hexagon
        hexagon: (() => {
            const points = generatePolygonPoints(6, Math.min(w, h) / 2);
            return `M${points} Z`;
        })(),

        // Arrows
        arrow: `M${w / 2},${h * 0.1} L${w * 0.7},${h * 0.6} L${w * 0.55},${h * 0.6} L${w * 0.55},${h * 0.9} L${w * 0.45},${h * 0.9} L${w * 0.45},${h * 0.6} L${w * 0.3},${h * 0.6} Z`,
        arrowLeft: `M${w * 0.1},${h / 2} L${w * 0.4},${h * 0.3} L${w * 0.4},${h * 0.45} L${w * 0.9},${h * 0.45} L${w * 0.9},${h * 0.55} L${w * 0.4},${h * 0.55} L${w * 0.4},${h * 0.7} Z`,
        arrowUp: `M${w / 2},${h * 0.1} L${w * 0.7},${h * 0.4} L${w * 0.55},${h * 0.4} L${w * 0.55},${h * 0.9} L${w * 0.45},${h * 0.9} L${w * 0.45},${h * 0.4} L${w * 0.3},${h * 0.4} Z`,
        arrowDown: `M${w / 2},${h * 0.9} L${w * 0.7},${h * 0.6} L${w * 0.55},${h * 0.6} L${w * 0.55},${h * 0.1} L${w * 0.45},${h * 0.1} L${w * 0.45},${h * 0.6} L${w * 0.3},${h * 0.6} Z`,

        // Cloud
        cloud: `M${w * 0.3},${h * 0.6} C${w * 0.3},${h * 0.4} ${w * 0.45},${h * 0.2} ${w * 0.65},${h * 0.2} C${w * 0.8},${h * 0.2} ${w * 0.9},${h * 0.3} ${w * 0.9},${h * 0.45} L${w * 0.9},${h * 0.6} C${w * 0.95},${h * 0.6} ${w},${h * 0.65} ${w},${h * 0.75} L${w},${h * 0.85} C${w},${h * 0.92} ${w * 0.93},${h} ${w * 0.85},${h} L${w * 0.15},${h} C${w * 0.07},${h} ${w * 0},${h * 0.92} ${w * 0},${h * 0.85} L${w * 0},${h * 0.75} C${w * 0},${h * 0.65} ${w * 0.05},${h * 0.6} ${w * 0.1},${h * 0.6} C${w * 0.1},${h * 0.35} ${w * 0.2},${h * 0.2} ${w * 0.3},${h * 0.2} C${w * 0.15},${h * 0.2} ${w * 0.1},${h * 0.3} ${w * 0.1},${h * 0.4}`,

        // Rounded Rectangle (default fallback)
        roundedRectangle: `M${w * 0.1},0 L${w * 0.9},0 Q${w},0 ${w},${h * 0.1} L${w},${h * 0.9} Q${w},${h} ${w * 0.9},${h} L${w * 0.1},${h} Q0,${h} 0,${h * 0.9} L0,${h * 0.1} Q0,0 ${w * 0.1},0`
    };

    const pathData = svgPath[shape] || svgPath.roundedRectangle;

    return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;overflow:visible;">
        <path d="${pathData}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="miter"/>
    </svg>`;
};

const ImageThumbPreview = ({ image }) => {
    const layers = Array.isArray(image?.data)
        ? image.data
        : (image?.data?.layer || image?.data?.layers || [])

    const canvasSize = image?.data?.canvasSize || layers?.[0]?.canvasSize || { width: 800, height: 600 }
    const bgColor = image?.data?.canvasBgColor || layers?.[0]?.canvasBgColor || '#ffffff'
    const bgImage = image?.data?.canvasBgImage || layers?.[0]?.canvasBgImage || null

    // Check if bgColor is a gradient
    const isGradient = bgColor && bgColor.includes('gradient');

    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{
                ...(isGradient
                    ? { backgroundImage: bgColor }
                    : { backgroundColor: isTransparent(bgColor) ? '#f8fafc' : bgColor }
                ),
                backgroundImage: isGradient ? bgColor : (bgImage ? `url(${bgImage})` : 'none'),
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: canvasSize.width,
                    height: canvasSize.height,
                    transformOrigin: 'top left',
                    transform: `scale(${Math.min(1, (typeof window !== 'undefined' ? 1 : 1))})`,
                }}
            >
                {/* Scale using CSS zoom via container */}
            </div>

            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: canvasSize.width,
                    height: canvasSize.height,
                    transformOrigin: 'top left',
                    transform: 'scale(var(--thumb-scale, 1))',
                }}
                className="pointer-events-none"
            >
                {layers?.map((layer) => {
                    if (!layer || layer.visible === false) return null
                    const commonStyle = {
                        position: 'absolute',
                        left: layer.x || 0,
                        top: layer.y || 0,
                        width: layer.width || 0,
                        height: layer.height || 0,
                        transform: `rotate(${layer.rotation || 0}deg)`,
                        transformOrigin: 'center center',
                    }

                    if (layer.type === 'text') {
                        return (
                            <div
                                key={layer.id}
                                style={{
                                    ...commonStyle,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    padding: 4,
                                    overflow: 'hidden',
                                    fontSize: layer.fontSize || 16,
                                    fontFamily: layer.fontFamily || 'Arial',
                                    fontWeight: layer.fontWeight || 400,
                                    fontStyle: layer.fontStyle || 'normal',
                                    textDecoration: layer.textDecoration || 'none',
                                    color: layer.color || '#111827',
                                    textAlign: layer.textAlign || 'left',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: 1.1,
                                }}
                            >
                                {layer.text}
                            </div>
                        )
                    }

                    // Render image
                    if (layer.type === 'image') {
                        const src = layer.imageUrl || layer.url || layer.src
                        if (!src) return null
                        return (
                            <img
                                key={layer.id}
                                src={src}
                                alt={layer.name || ''}
                                draggable={false}
                                style={{
                                    ...commonStyle,
                                    objectFit: 'cover',
                                    opacity: ((layer.opacity ?? 100) / 100),
                                    borderRadius: layer.cornerRadius || 0,
                                    filter: `brightness(${layer.brightness || 100}%) contrast(${layer.contrast || 100}%) blur(${layer.blur || 0}px)`,
                                }}
                            />
                        )
                    }

                    // Render shapes (with proper SVG for specific shapes)
                    if (layer.type === 'shape') {
                        // If shape has image fill, render as div with background image
                        if (layer.fillImageSrc && layer.fillType === 'image') {
                            return (
                                <div
                                    key={layer.id}
                                    style={{
                                        ...commonStyle,
                                        backgroundImage: `url(${layer.fillImageSrc})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        border: `${layer.strokeWidth || 1}px solid ${layer.strokeColor || '#000000'}`,
                                        opacity: ((layer.opacity ?? 100) / 100),
                                        borderRadius: layer.borderRadius || 0,
                                    }}
                                />
                            )
                        }

                        // Render SVG shape
                        const shapeType = layer.shape || 'roundedRectangle';
                        const svgMarkup = getShapeSVG(
                            shapeType,
                            layer.width || 100,
                            layer.height || 100,
                            layer.fillColor,
                            layer.strokeColor,
                            layer.strokeWidth
                        );

                        return (
                            <div
                                key={layer.id}
                                style={{
                                    position: 'absolute',
                                    left: layer.x || 0,
                                    top: layer.y || 0,
                                    width: layer.width || 0,
                                    height: layer.height || 0,
                                    transform: `rotate(${layer.rotation || 0}deg)`,
                                    transformOrigin: 'center center',
                                    opacity: ((layer.opacity ?? 100) / 100),
                                }}
                                dangerouslySetInnerHTML={{ __html: svgMarkup }}
                            />
                        )
                    }

                    // Return null for other types
                    return null
                })}
            </div>
        </div>
    )
}

const ImageUser = () => {
    const { user } = useAuth()
    const userId = user?._id

    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        let mounted = true
        const fetchImages = async () => {
            try {
                setLoading(true)
                const data = await getUserImages(userId)
                if (mounted) setImages(data || [])
            } catch (err) {
                console.error('Load images error', err)
                if (mounted) setError('Failed to load images')
            } finally {
                if (mounted) setLoading(false)
            }
        }

        if (userId) fetchImages()
        return () => { mounted = false }
    }, [userId])

    const handleDelete = async (imageId) => {
        if (!window.confirm('Are you sure you want to delete this design?')) return
        try {
            await deleteImage(imageId)
            setImages(prev => prev.filter(img => img._id !== imageId))
            toast.success('Design deleted successfully')
        } catch (err) {
            console.error('Delete error', err)
            toast.error('Failed to delete design')
        }
    }

    const filteredImages = images
        .filter(img =>
            (img.title || 'Untitled')
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const spinner = (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    )
    return (
        <div className=" bg-slate-50/50">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items:center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Saved Images</h1>
                        <p className="text-slate-500 mt-1">Manage and edit your creative projects</p>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl w-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>




                    </div>

                </div>

                {/* --- Button Container --- */}
                <div className='flex flex-col  md:flex-row gap-6 py-8 w-full'>
                    {/* Create with AI Button */}
                    <Link
                        to="/create/ai-design"
                        className="flex-1 max-w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white p-6 rounded-2xl shadow-xl shadow-orange-200 transition-all flex items-center gap-4 active:scale-[0.98] group"
                    >
                        <div className="bg-white/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L14.85 8.65L21.5 11.5L14.85 14.35L12 21L9.15 14.35L2.5 11.5L9.15 8.65L12 2ZM12 5.37L10.38 9.12L6.63 10.75L10.38 12.38L12 16.13L13.62 12.38L17.37 10.75L13.62 9.12L12 5.37Z" />
                            </svg>
                        </div>
                        <div className="text-left">
                            <h2 className="text-xl font-bold">Create with AI</h2>
                            <p className="text-orange-50 text-xs opacity-90">Let AI generate a complete presentation from your topic.</p>
                        </div>
                    </Link>

                    {/* Create Fresh Button */}
                    <a
                        href="/canva-clone"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 max-w-full  bg-white border-2 border-blue-500/10 hover:border-blue-500 text-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all flex items-center gap-4 active:scale-[0.98] group relative overflow-hidden"
                    >
                        {/* Blue accent bar at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-blue-500 opacity-80" />

                        <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-200 group-hover:rotate-90 transition-transform">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v12m6-6H6" />
                            </svg>
                        </div>
                        <div className="text-left">
                            <h2 className="text-xl font-bold">Create Fresh</h2>
                            <p className="text-slate-500 text-xs">Open our advanced editor and start your story from scratch.</p>
                        </div>
                    </a>
                </div>

                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (<div key={i} className="bg-white border border-slate-100 rounded-2xl h-64 animate-pulse" />))}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3">{error}</div>
                )}

                {!loading && filteredImages.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredImages.map(image => {
                            const canvasSize = image.data?.canvasSize || { width: 1200, height: 630 };
                            const aspectRatio = (canvasSize.height / canvasSize.width) * 100;
                            return (
                                <a key={image._id} href={`/canva-clone/${image._id}`} target="_blank" rel="noopener noreferrer" className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 block">
                                    <div
                                        className="relative bg-slate-100 overflow-hidden"
                                        style={{
                                            aspectRatio: `${canvasSize.width} / ${canvasSize.height}`
                                        }}
                                    >
                                        <div
                                            className="absolute inset-0"
                                            style={{
                                                ['--thumb-scale']: `${Math.min(
                                                    1,
                                                    1
                                                )}`
                                            }}
                                            ref={(el) => {
                                                if (!el) return
                                                const rect = el.getBoundingClientRect()
                                                const cw = canvasSize?.width || 800
                                                const ch = canvasSize?.height || 600
                                                const scale = Math.min(rect.width / cw, rect.height / ch)
                                                el.style.setProperty('--thumb-scale', String(scale))
                                            }}
                                        >
                                            <ImageThumbPreview image={image} />
                                        </div>

                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(image._id); }} className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg cursor-pointer z-10" title="Delete Design">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>

                                    <div className="p-5">
                                        <div className="flex items-start justify-between">
                                            <h3 className="text-slate-800 font-bold group-hover:text-blue-600 transition-colors truncate">{image.title || 'Untitled Masterpiece'}</h3>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                                            <span className="flex items-center gap-1">{new Date(image.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full font-medium">{image.data?.canvasSize ? `${image.data.canvasSize.width}×${image.data.canvasSize.height}` : '—'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            )
                        })}
                    </div>
                ) : (!loading && (
                    <div className="text-center py-8 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="max-w-xs mx-auto">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No designs yet</h3>
                            <p className="text-slate-500 text-sm mb-8">Start your creative journey by creating your first digital masterpiece.</p>
                            <a href="/canva-clone" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">Start Creating</a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ImageUser



