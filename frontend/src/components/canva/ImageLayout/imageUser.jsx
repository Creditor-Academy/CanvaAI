import { getUserImages, deleteImage } from '@/services/imageEditor/imageApi'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import React, { useEffect, useState, memo } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus, FiZap } from 'react-icons/fi'
import { Sparkles } from 'lucide-react'

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

const ImageThumbPreview = memo(({ image }) => {
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
                    top: '50%',
                    left: '50%',
                    width: canvasSize.width,
                    height: canvasSize.height,
                    transformOrigin: 'center',
                    transform: 'translate(-50%, -50%) scale(var(--thumb-scale, 1))',
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
})

const ImageUser = () => {
    const { user } = useAuth()
    const userId = user?._id

    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const ITEMS_PER_PAGE = 20

    useEffect(() => {
        const style = document.createElement('style')
        style.innerHTML = `
            @keyframes borderTrace {
                0% { background-position: 0% 0%; }
                25% { background-position: 100% 0%; }
                50% { background-position: 100% 100%; }
                75% { background-position: 0% 100%; }
                100% { background-position: 0% 0%; }
            }
            @keyframes glowPulse {
                0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.08), 0 8px 32px rgba(0,0,0,0.04); }
                50% { box-shadow: 0 0 35px rgba(99, 102, 241, 0.15), 0 8px 32px rgba(0,0,0,0.06); }
            }
            @keyframes shimmer {
                0% { background-position: 100% 0 }
                100% { background-position: -100% 0 }
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(4px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .glow-card {
                background: rgba(255, 255, 255, 0.75);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border-radius: 24px;
                border: 1px solid rgba(99, 102, 241, 0.1);
                padding: 32px;
                animation: glowPulse 4s ease-in-out infinite;
                transition: box-shadow 0.3s ease, transform 0.3s ease;
            }
            .glow-card:hover {
                box-shadow: 0 0 45px rgba(99, 102, 241, 0.2), 0 12px 40px rgba(0,0,0,0.08);
                transform: translateY(-2px);
            }
            .fade-in {
                animation: fadeIn 0.25s ease-in forwards;
            }
            .ai-btn-wrapper {
                position: relative;
                border-radius: 24px;
                padding: 2px;
                background: linear-gradient(90deg, #fbbf24, #f59e0b, #d97706, #fbbf24);
                background-size: 300% 300%;
                animation: borderTrace 4s linear infinite;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            }
            .ai-btn-wrapper:hover {
                transform: translateY(-4px);
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
            }
            .ai-btn-inner {
                border-radius: 22px;
                background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%);
                padding: 24px 32px;
                display: flex;
                align-items: center;
                gap: 24px;
                position: relative;
                overflow: hidden;
            }
            .fresh-btn-wrapper {
                position: relative;
                border-radius: 24px;
                padding: 2px;
                background: linear-gradient(90deg, #1e40af, #3b82f6, #60a5fa, #0ea5e9, #1e40af);
                background-size: 300% 300%;
                animation: borderTrace 4s linear infinite;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            }
            .fresh-btn-wrapper:hover {
                transform: translateY(-4px);
                box-shadow: 0 20px 25px -5px rgba(59,130,246,0.35), 0 10px 10px -5px rgba(59,130,246,0.15);
            }
            .fresh-btn-inner {
                border-radius: 22px;
                background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
                padding: 24px 32px;
                display: flex;
                align-items: center;
                gap: 24px;
                position: relative;
                overflow: hidden;
            }
        `
        document.head.appendChild(style)
        return () => { document.head.removeChild(style) }
    }, [])

    useEffect(() => {
        let mounted = true
        const fetchImages = async () => {
            try {
                setLoading(true)
                const data = await getUserImages(userId, 1, ITEMS_PER_PAGE)
                if (mounted) {
                    const imageArray = Array.isArray(data) ? data : data?.data || []
                    setImages(imageArray)
                    setHasMore(imageArray.length === ITEMS_PER_PAGE)
                    setPage(1)
                }
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

    const loadMore = async () => {
        if (loadingMore || !hasMore) return
        try {
            setLoadingMore(true)
            const nextPage = page + 1
            const data = await getUserImages(userId, nextPage, ITEMS_PER_PAGE)
            const imageArray = Array.isArray(data) ? data : data?.data || []
            if (imageArray.length > 0) {
                setImages(prev => [...prev, ...imageArray])
                setPage(nextPage)
                setHasMore(imageArray.length === ITEMS_PER_PAGE)
            } else {
                setHasMore(false)
            }
        } catch (err) {
            console.error('Load more error', err)
            toast.error('Failed to load more images')
        } finally {
            setLoadingMore(false)
        }
    }

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

    return (
        <div style={{ background: '#e9f4ff', minHeight: '100vh' }}>
            <div style={imgStyles.container}>
                <div style={imgStyles.content}>

                    {/* Header */}
                    <div style={imgStyles.header}>
                        <div>
                            <h1 style={imgStyles.title}>Your Saved Images</h1>
                            <p style={imgStyles.subtitle}>Manage and edit your creative projects</p>
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={imgStyles.searchInput}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={imgStyles.actionGrid}>
                        <div className="ai-btn-wrapper" onClick={() => window.open('/create/ai-design', '_blank')}>
                            <div className="ai-btn-inner">
                                <div style={imgStyles.iconContainer}>
                                    <Sparkles size={32} color="#fff" />
                                </div>
                                <div>
                                    <h2 style={{ ...imgStyles.actionTitle, color: '#fff' }}>Create with AI</h2>
                                    <p style={{ ...imgStyles.actionDesc, color: 'rgba(255,255,255,0.8)' }}>
                                        Let AI generate a complete design from your topic.
                                    </p>
                                </div>
                                <div style={imgStyles.zapIcon}>
                                    <FiZap size={24} color="rgba(255,255,255,0.2)" />
                                </div>
                            </div>
                        </div>

                        <div className="fresh-btn-wrapper" onClick={() => window.open('/canva-clone', '_blank')}>
                            <div className="fresh-btn-inner">
                                <div style={{
                                    ...imgStyles.iconContainer,
                                    background: 'linear-gradient(135deg, #1e40af, #3b82f6, #0ea5e9)',
                                    boxShadow: '0 10px 20px rgba(59,130,246,0.35)'
                                }}>
                                    <FiPlus size={28} color="#ffffff" />
                                </div>
                                <div>
                                    <h2 style={imgStyles.actionTitle}>Create Fresh</h2>
                                    <p style={imgStyles.actionDesc}>Open our advanced editor and start your story from scratch.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Images — Glowing Card */}
                    <div className="glow-card">
                        <div style={imgStyles.sectionHeader}>
                            <h2 style={imgStyles.sectionTitle}>Recent Images</h2>
                        </div>

                        {error && (
                            <div style={{ color: '#ef4444', marginBottom: '16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>{error}</div>
                        )}

                        <div style={imgStyles.scrollContainer}>
                            {loading ? (
                                <div style={imgStyles.grid}>
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} style={imgStyles.card}>
                                            <div style={{ ...imgStyles.cardPreview, background: 'linear-gradient(90deg, #f0f0f0 25%, #e4e4e4 37%, #f0f0f0 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite' }} />
                                            <div style={imgStyles.cardInfo}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ height: '16px', background: '#f0f0f0', borderRadius: '8px', marginBottom: '8px', animation: 'shimmer 1.4s ease infinite', backgroundSize: '400% 100%' }} />
                                                    <div style={{ height: '12px', background: '#f0f0f0', borderRadius: '8px', width: '60%', animation: 'shimmer 1.4s ease infinite', backgroundSize: '400% 100%' }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredImages.length === 0 ? (
                                <div style={imgStyles.emptyCard}>
                                    <p style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', margin: 0 }}>
                                        {searchTerm ? 'No images match your search.' : 'No images yet. Start creating!'}
                                    </p>
                                </div>
                            ) : (
                                <div style={imgStyles.grid} className="fade-in">
                                    {filteredImages.map(image => {
                                        const canvasSize = image.data?.canvasSize || { width: 800, height: 600 }
                                        return (
                                            <div
                                                key={image._id}
                                                onClick={() => window.open(`/canva-clone/${image._id}`, '_blank')}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-4px)'
                                                    e.currentTarget.style.borderColor = '#6366f1'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)'
                                                    e.currentTarget.style.borderColor = '#e2e8f0'
                                                }}
                                                style={imgStyles.card}
                                            >
                                                <div style={{ ...imgStyles.cardPreview, position: 'relative', overflow: 'hidden' }}>
                                                    <div
                                                        style={{ position: 'absolute', inset: 0 }}
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
                                                </div>
                                                <div style={imgStyles.cardInfo}>
                                                    <div style={imgStyles.cardText}>
                                                        <h3 style={imgStyles.cardTitle}>{image.title || 'Untitled'}</h3>
                                                        <p style={imgStyles.cardDate}>{new Date(image.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(image._id) }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                                        style={imgStyles.deleteBtn}
                                                        title="Delete Design"
                                                    >
                                                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {hasMore && !searchTerm && !loading && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    style={{
                                        padding: '10px 32px',
                                        background: loadingMore ? '#93c5fd' : '#2563eb',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                        fontWeight: 700,
                                        fontSize: '0.95rem',
                                        cursor: loadingMore ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                                    }}
                                >
                                    {loadingMore ? (
                                        <>
                                            <div style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                            Loading...
                                        </>
                                    ) : 'Load More'}
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}

const imgStyles = {
    container: {
        minHeight: '100vh',
        background: 'transparent',
        padding: '40px 20px 40px',
        position: 'relative',
        zIndex: 1,
    },
    content: {
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
    },
    header: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '10px',
    },
    title: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 'clamp(32px, 6vw, 52px)',
        fontWeight: 400,
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
        color: '#0f172a',
        margin: 0,
    },
    subtitle: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '1.05rem',
        color: '#64748b',
        marginTop: '8px',
        fontWeight: 400,
    },
    searchInput: {
        padding: '10px 16px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        background: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '0.9rem',
        color: '#0f172a',
        outline: 'none',
        width: '220px',
    },
    actionGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '24px',
    },
    iconContainer: {
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    actionTitle: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '1.5rem',
        fontWeight: 700,
        margin: 0,
        color: '#0f172a',
    },
    actionDesc: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '1rem',
        margin: '4px 0 0',
        color: '#64748b',
    },
    zapIcon: {
        position: 'absolute',
        right: '-10px',
        bottom: '-10px',
        opacity: 0.5,
    },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: '#0f172a',
        marginBottom: '20px',
    },
    sectionTitle: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '1.6rem',
        fontWeight: 400,
        margin: 0,
        color: '#0f172a',
        letterSpacing: '-0.01em',
    },
    scrollContainer: {
        maxHeight: '480px',
        overflowY: 'auto',
        paddingRight: '10px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '20px',
    },
    card: {
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s, border-color 0.2s',
    },
    cardPreview: {
        height: '140px',
        background: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardInfo: {
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardText: {
        overflow: 'hidden',
    },
    cardTitle: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '1rem',
        fontWeight: 600,
        margin: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        color: '#0f172a',
    },
    cardDate: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '0.85rem',
        color: '#64748b',
        margin: '2px 0 0',
    },
    deleteBtn: {
        background: 'none',
        border: 'none',
        color: '#ef4444',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
    },
    emptyCard: {
        padding: '60px',
        background: '#fff',
        borderRadius: '16px',
        border: '2px dashed #e2e8f0',
        textAlign: 'center',
        color: '#64748b',
    },
}

export default ImageUser