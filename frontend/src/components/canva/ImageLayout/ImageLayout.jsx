import React, { useState, useEffect, memo } from 'react'
import { getUserImages, deleteImage, getPublicTemplateImages, cloneImage, saveImage } from '@/services/imageEditor/imageApi'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { FiPlus, FiZap, FiLayout } from 'react-icons/fi'
import { Sparkles, Trash2 } from 'lucide-react'
import ImagePopup from './imagePopup'

// ─── Helpers ────────────────────────────────────────────────────────────────

const isTransparent = (color) => {
    if (!color) return true
    const c = color.replace(/\s/g, '').toLowerCase()
    return c === 'transparent' || c === 'rgba(0,0,0,0)' || c === 'rgba(0,0,0,0.0)'
}

const getShapeSVG = (shape, width, height, fillColor, strokeColor, strokeWidth) => {
    const w = width, h = height
    const fill = isTransparent(fillColor) ? 'none' : fillColor
    const stroke = strokeColor || '#000000'
    const sw = strokeWidth || 1

    const generatePolygonPoints = (sides, radius, offsetAngle = 0) => {
        const points = []
        const cx = w / 2, cy = h / 2
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) + offsetAngle
            points.push(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle))
        }
        return points.join(',')
    }

    const svgPath = {
        line: `M0,${h / 2} L${w},${h / 2}`,
        rectangle: `M0,0 L${w},0 L${w},${h} L0,${h} Z`,
        circle: `M${w / 2},0 A${w / 2},${h / 2} 0 1,1 ${w / 2},${h} A${w / 2},${h / 2} 0 1,1 ${w / 2},0 Z`,
        ellipse: `M${w / 2},0 A${w / 2},${h / 2} 0 1,1 ${w / 2},${h} A${w / 2},${h / 2} 0 1,1 ${w / 2},0 Z`,
        triangle: `M${w / 2},0 L${w},${h} L0,${h} Z`,
        rightTriangle: `M0,0 L${w},0 L0,${h} Z`,
        star: `M${w / 2},${h * 0.1} L${w * 0.37},${h * 0.35} L${w * 0.1},${h * 0.35} L${w * 0.35},${h * 0.57} L${w * 0.2},${h * 0.9} L${w / 2},${h * 0.68} L${w * 0.8},${h * 0.9} L${w * 0.65},${h * 0.57} L${w * 0.9},${h * 0.35} L${w * 0.63},${h * 0.35} Z`,
        star6: (() => {
            const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2
            const pts = []
            for (let i = 0; i < 12; i++) {
                const angle = (i * Math.PI) / 6
                const radius = i % 2 === 0 ? r : r * 0.5
                pts.push(cx + radius * Math.cos(angle - Math.PI / 2), cy + radius * Math.sin(angle - Math.PI / 2))
            }
            return `M${pts.join(' L')} Z`
        })(),
        heart: `M${w / 2},${h * 0.9} C${w * 0.2},${h * 0.7} ${w * 0.1},${h * 0.5} ${w * 0.1},${h * 0.35} C${w * 0.1},${h * 0.15} ${w * 0.25},${h * 0.05} ${w * 0.35},${h * 0.05} C${w * 0.45},${h * 0.05} ${w / 2},${h * 0.2} L${w / 2},${h * 0.2} C${w / 2},${h * 0.2} ${w * 0.55},${h * 0.05} ${w * 0.65},${h * 0.05} C${w * 0.75},${h * 0.05} ${w * 0.9},${h * 0.15} ${w * 0.9},${h * 0.35} C${w * 0.9},${h * 0.5} ${w * 0.8},${h * 0.7} ${w / 2},${h * 0.9} Z`,
        diamond: `M${w / 2},0 L${w},${h / 2} L${w / 2},${h} L0,${h / 2} Z`,
        pentagon: (() => { const pts = generatePolygonPoints(5, Math.min(w, h) / 2, -Math.PI / 2); return `M${pts} Z` })(),
        hexagon: (() => { const pts = generatePolygonPoints(6, Math.min(w, h) / 2); return `M${pts} Z` })(),
        arrow: `M${w / 2},${h * 0.1} L${w * 0.7},${h * 0.6} L${w * 0.55},${h * 0.6} L${w * 0.55},${h * 0.9} L${w * 0.45},${h * 0.9} L${w * 0.45},${h * 0.6} L${w * 0.3},${h * 0.6} Z`,
        arrowLeft: `M${w * 0.1},${h / 2} L${w * 0.4},${h * 0.3} L${w * 0.4},${h * 0.45} L${w * 0.9},${h * 0.45} L${w * 0.9},${h * 0.55} L${w * 0.4},${h * 0.55} L${w * 0.4},${h * 0.7} Z`,
        arrowUp: `M${w / 2},${h * 0.1} L${w * 0.7},${h * 0.4} L${w * 0.55},${h * 0.4} L${w * 0.55},${h * 0.9} L${w * 0.45},${h * 0.9} L${w * 0.45},${h * 0.4} L${w * 0.3},${h * 0.4} Z`,
        arrowDown: `M${w / 2},${h * 0.9} L${w * 0.7},${h * 0.6} L${w * 0.55},${h * 0.6} L${w * 0.55},${h * 0.1} L${w * 0.45},${h * 0.1} L${w * 0.45},${h * 0.6} L${w * 0.3},${h * 0.6} Z`,
        cloud: `M${w * 0.3},${h * 0.6} C${w * 0.3},${h * 0.4} ${w * 0.45},${h * 0.2} ${w * 0.65},${h * 0.2} C${w * 0.8},${h * 0.2} ${w * 0.9},${h * 0.3} ${w * 0.9},${h * 0.45} L${w * 0.9},${h * 0.6} C${w * 0.95},${h * 0.6} ${w},${h * 0.65} ${w},${h * 0.75} L${w},${h * 0.85} C${w},${h * 0.92} ${w * 0.93},${h} ${w * 0.85},${h} L${w * 0.15},${h} C${w * 0.07},${h} 0,${h * 0.92} 0,${h * 0.85} L0,${h * 0.75} C0,${h * 0.65} ${w * 0.05},${h * 0.6} ${w * 0.1},${h * 0.6} C${w * 0.1},${h * 0.35} ${w * 0.2},${h * 0.2} ${w * 0.3},${h * 0.2} C${w * 0.15},${h * 0.2} ${w * 0.1},${h * 0.3} ${w * 0.1},${h * 0.4}`,
        roundedRectangle: `M${w * 0.1},0 L${w * 0.9},0 Q${w},0 ${w},${h * 0.1} L${w},${h * 0.9} Q${w},${h} ${w * 0.9},${h} L${w * 0.1},${h} Q0,${h} 0,${h * 0.9} L0,${h * 0.1} Q0,0 ${w * 0.1},0`,
    }

    const pathData = svgPath[shape] || svgPath.roundedRectangle
    return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;overflow:visible;"><path d="${pathData}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="miter"/></svg>`
}

// ─── Thumbnail Preview ───────────────────────────────────────────────────────

export const ImageThumbPreview = memo(({ image }) => {
    const layers = Array.isArray(image?.data)
        ? image.data
        : (image?.data?.layer || image?.data?.layers || [])
    const canvasSize = image?.data?.canvasSize || layers?.[0]?.canvasSize || { width: 800, height: 600 }
    const bgColor = image?.data?.canvasBgColor || layers?.[0]?.canvasBgColor || '#ffffff'
    const bgImage = image?.data?.canvasBgImage || layers?.[0]?.canvasBgImage || null
    const isGradient = bgColor && bgColor.includes('gradient')

    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{
                ...(isGradient ? { backgroundImage: bgColor } : { backgroundColor: isTransparent(bgColor) ? '#f8fafc' : bgColor }),
                backgroundImage: isGradient ? bgColor : (bgImage ? `url(${bgImage})` : 'none'),
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
            }}
        >
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
                            <div key={layer.id} style={{ ...commonStyle, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: 4, overflow: 'hidden', fontSize: layer.fontSize || 16, fontFamily: layer.fontFamily || 'Arial', fontWeight: layer.fontWeight || 400, fontStyle: layer.fontStyle || 'normal', textDecoration: layer.textDecoration || 'none', color: layer.color || '#111827', textAlign: layer.textAlign || 'left', whiteSpace: 'pre-wrap', lineHeight: 1.1 }}>
                                {layer.text}
                            </div>
                        )
                    }
                    if (layer.type === 'image') {
                        const src = layer.imageUrl || layer.url || layer.src
                        if (!src) return null
                        return <img key={layer.id} src={src} alt={layer.name || ''} draggable={false} style={{ ...commonStyle, objectFit: 'cover', opacity: (layer.opacity ?? 100) / 100, borderRadius: layer.cornerRadius || 0, filter: `brightness(${layer.brightness || 100}%) contrast(${layer.contrast || 100}%) blur(${layer.blur || 0}px)` }} />
                    }
                    if (layer.type === 'shape') {
                        if (layer.fillImageSrc && layer.fillType === 'image') {
                            return <div key={layer.id} style={{ ...commonStyle, backgroundImage: `url(${layer.fillImageSrc})`, backgroundSize: 'cover', backgroundPosition: 'center', border: `${layer.strokeWidth || 1}px solid ${layer.strokeColor || '#000000'}`, opacity: (layer.opacity ?? 100) / 100, borderRadius: layer.borderRadius || 0 }} />
                        }
                        const svgMarkup = getShapeSVG(layer.shape || 'roundedRectangle', layer.width || 100, layer.height || 100, layer.fillColor, layer.strokeColor, layer.strokeWidth)
                        return <div key={layer.id} style={{ position: 'absolute', left: layer.x || 0, top: layer.y || 0, width: layer.width || 0, height: layer.height || 0, transform: `rotate(${layer.rotation || 0}deg)`, transformOrigin: 'center center', opacity: (layer.opacity ?? 100) / 100 }} dangerouslySetInnerHTML={{ __html: svgMarkup }} />
                    }
                    return null
                })}
            </div>
        </div>
    )
})

// ─── Main Component ──────────────────────────────────────────────────────────

const ImageLayout = () => {
    const { user, isAdmin } = useAuth()
    const userId = user?._id

    // User images state
    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const ITEMS_PER_PAGE = 20

    // Templates state
    const [templates, setTemplates] = useState([])
    const [templatesLoading, setTemplatesLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState(null)
    const [showDeletePopup, setShowDeletePopup] = useState(false)
    const [selectedDeleteId, setSelectedDeleteId] = useState(null)

    // ── CSS injection (identical to Presentation.jsx) ──────────────────────
    useEffect(() => {
        const style = document.createElement('style')
        style.innerHTML = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            @keyframes wave {
                0%   { transform: translateX(0) translateZ(0) scaleY(1); }
                50%  { transform: translateX(-25%) translateZ(0) scaleY(0.8); }
                100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
            }
            @keyframes borderTrace {
                0%   { background-position: 0% 0%; }
                25%  { background-position: 100% 0%; }
                50%  { background-position: 100% 100%; }
                75%  { background-position: 0% 100%; }
                100% { background-position: 0% 0%; }
            }
            @keyframes glowPulse {
                0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.08), 0 8px 32px rgba(0,0,0,0.04); }
                50%       { box-shadow: 0 0 35px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.06); }
            }
            @keyframes shimmer {
                0%   { background-position: 100% 0; }
                100% { background-position: -100% 0; }
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(4px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            .wave-bg {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                z-index: -1;
                overflow: hidden;
            }
            .wave {
                position: absolute;
                width: 200%;
                height: 100%;
                background: linear-gradient(180deg, rgba(99,102,241,0.03) 0%, rgba(168,85,247,0.03) 100%);
                animation: wave 15s cubic-bezier(0.36,0.45,0.63,0.53) infinite;
            }
            .wave:nth-child(2) {
                top: 30%;
                background: linear-gradient(180deg, rgba(99,102,241,0.02) 0%, rgba(168,85,247,0.02) 100%);
                animation: wave 18s cubic-bezier(0.36,0.45,0.63,0.53) -5s infinite;
            }
            .wave:nth-child(3) {
                top: 60%;
                background: linear-gradient(180deg, rgba(99,102,241,0.01) 0%, rgba(168,85,247,0.01) 100%);
                animation: wave 20s cubic-bezier(0.36,0.45,0.63,0.53) -2s infinite;
            }
            .ai-btn-wrapper {
                position: relative; border-radius: 24px; padding: 2px;
                background: linear-gradient(90deg, #fbbf24, #f59e0b, #d97706, #fbbf24);
                background-size: 300% 300%;
                animation: borderTrace 4s linear infinite;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            }
            .ai-btn-wrapper:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
            .ai-btn-inner {
                border-radius: 22px;
                background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%);
                padding: 32px; display: flex; align-items: center; gap: 24px;
                position: relative; overflow: hidden;
            }
            .fresh-btn-wrapper {
                position: relative; border-radius: 24px; padding: 2px;
                background: linear-gradient(90deg, #1e40af, #3b82f6, #60a5fa, #0ea5e9, #1e40af);
                background-size: 300% 300%;
                animation: borderTrace 4s linear infinite;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            }
            .fresh-btn-wrapper:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(59,130,246,0.35), 0 10px 10px -5px rgba(59,130,246,0.15); }
            .fresh-btn-inner {
                border-radius: 22px;
                background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
                padding: 24px; display: flex; align-items: center; gap: 24px;
                position: relative; overflow: hidden;
            }
            .glow-card {
                background: rgba(255,255,255,0.75);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border-radius: 24px;
                border: 1px solid rgba(99,102,241,0.1);
                padding: 32px;
                animation: glowPulse 4s ease-in-out infinite;
                transition: box-shadow 0.3s ease, transform 0.3s ease;
            }
            .glow-card:hover { box-shadow: 0 0 45px rgba(99,102,241,0.2), 0 12px 40px rgba(0,0,0,0.08); transform: translateY(-2px); }
            .fade-in { animation: fadeIn 0.25s ease-in forwards; }
            @keyframes viewBtnShimmer {
                0%   { background-position: 200% center; }
                100% { background-position: -200% center; }
            }
            @keyframes viewBtnPulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(10,93,187,0.4); }
                50%       { box-shadow: 0 0 0 6px rgba(10,93,187,0); }
            }
            .view-btn {
                padding: 6px 14px;
                border-radius: 8px;
                border: 1.5px solid #0a5dbb;
                background: transparent;
                color: #0a5dbb;
                font-size: 0.85rem;
                font-weight: 600;
                cursor: pointer;
                flex-shrink: 0;
                position: relative;
                overflow: hidden;
                transition: color 0.22s ease, background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, transform 0.15s ease;
                letter-spacing: 0.01em;
            }
            .view-btn::before {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.45) 50%, transparent 80%);
                background-size: 200% 100%;
                background-position: 200% center;
                transition: background-position 0s;
                pointer-events: none;
            }
            .view-btn:hover {
                background: linear-gradient(135deg, #0a5dbb 0%, #1d7bff 100%);
                border-color: transparent;
                color: #fff;
                transform: translateY(-1px);
                box-shadow: 0 4px 14px rgba(10,93,187,0.35), 0 1px 4px rgba(10,93,187,0.2);
            }
            .view-btn:hover::before {
                background-position: -200% center;
                transition: background-position 0.6s ease;
            }
            .view-btn:active {
                transform: translateY(0px) scale(0.97);
                box-shadow: 0 2px 6px rgba(10,93,187,0.3);
                animation: viewBtnPulse 0.4s ease-out;
            }
        `
        document.head.appendChild(style)
        return () => { document.head.removeChild(style) }
    }, [])

    // ── Fetch user images ──────────────────────────────────────────────────
    useEffect(() => {
        let mounted = true
        const fetchImages = async () => {
            try {
                setLoading(true)
                const data = await getUserImages(userId, 1, ITEMS_PER_PAGE)
                if (mounted) {
                    const arr = Array.isArray(data) ? data : data?.data || []
                    setImages(arr)
                    setHasMore(arr.length === ITEMS_PER_PAGE)
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

    // ── Fetch templates ────────────────────────────────────────────────────
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const result = await getPublicTemplateImages()
                let data = []
                if (result?.status === 'success' && Array.isArray(result.data)) data = result.data
                else if (Array.isArray(result)) data = result
                else if (result?.data && Array.isArray(result.data)) data = result.data
                setTemplates(data)
            } catch (err) {
                console.error('Failed to load templates', err)
                toast.error('Failed to load templates')
            } finally {
                setTemplatesLoading(false)
            }
        }
        fetchTemplates()
    }, [])

    // ── Handlers ───────────────────────────────────────────────────────────
    const loadMore = async () => {
        if (loadingMore || !hasMore) return
        try {
            setLoadingMore(true)
            const nextPage = page + 1
            const data = await getUserImages(userId, nextPage, ITEMS_PER_PAGE)
            const arr = Array.isArray(data) ? data : data?.data || []
            if (arr.length > 0) {
                setImages(prev => [...prev, ...arr])
                setPage(nextPage)
                setHasMore(arr.length === ITEMS_PER_PAGE)
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

    const handleDeleteClick = (imageId) => {
        setSelectedDeleteId(imageId)
        setShowDeletePopup(true)
    }

    const confirmDeleteImage = async () => {
        if (!selectedDeleteId) return

        try {
            await deleteImage(selectedDeleteId)
            setImages(prev => prev.filter(img => img._id !== selectedDeleteId))
            toast.success('Design deleted successfully')
        } catch (err) {
            console.error('Delete error', err)
            toast.error('Failed to delete design')
        } finally {
            setShowDeletePopup(false)
            setSelectedDeleteId(null)
        }
    }

    const handleImport = async (image) => {
        if (isAdmin) {
            const targetId = image.imageId || image._id
            try { sessionStorage.setItem(`prefill_project_${targetId}`, JSON.stringify(image)) } catch (e) { /* noop */ }
            window.open(`/canva-clone/${targetId}`, '_blank')
            return
        }
        try {
            // Public admin templates live in Admin_Images; import by saving a new copy from the template data
            const resp = await saveImage({
                userId: user?._id || user?.id,
                title: (image.title || 'Untitled Template') + '_copy',
                data: image.data,
            })
            const newId = resp?.imageId || resp?.data?._id || resp?._id
            if (newId) {
                try {
                    sessionStorage.setItem(`prefill_project_${newId}`, JSON.stringify({
                        title: (image.title || 'Untitled Template') + '_copy',
                        data: image.data,
                    }))
                    sessionStorage.setItem(`prefill_import_flag_${newId}`, '1')
                } catch (e) { /* noop */ }
                window.open(`/canva-clone/${newId}`, '_blank')
            }
            toast.success('Template imported to your account')
        } catch (err) {
            console.error('Clone/import failed', err)
            toast.error('Failed to import template')
        }
    }

    const filteredImages = images
        .filter(img => (img.title || 'Untitled').toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <>
            <div className="min-h-screen bg-[#e9f4ff]">
                <div className="wave-bg">
                    <div className="wave" />
                    <div className="wave" />
                    <div className="wave" />
                </div>

                <div className="relative z-[1] min-h-screen origin-top scale-[0.9] px-5 pb-10 pt-[120px]">
                    <div className="mx-auto flex max-w-[1200px] flex-col gap-10">

                        {/* Header */}
                        <div className="mb-[10px] flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="m-0 font-serif text-[clamp(40px,8vw,64px)] font-normal leading-[1.1] tracking-[-0.02em] text-slate-900">
                                    Create Stunning Images
                                </h1>
                                <p className="mt-2 text-[1.1rem] font-normal text-slate-500">
                                    Design professional visuals in seconds with AI or start from scratch
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div
                                className="ai-btn-wrapper"
                                onClick={() => window.open('/create/ai-design', '_blank')}
                            >
                                <div className="ai-btn-inner">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                                        <Sparkles size={32} color="#fff" />
                                    </div>

                                    <div>
                                        <h2 className="m-0 text-2xl font-bold text-white">
                                            Create with AI
                                        </h2>
                                        <p className="mt-1 text-base text-white/80">
                                            Let AI generate a complete design from your topic.
                                        </p>
                                    </div>

                                    <div className="absolute bottom-[-10px] right-[-10px] opacity-50">
                                        <FiZap size={24} color="rgba(255,255,255,0.2)" />
                                    </div>
                                </div>
                            </div>

                            <div
                                className="fresh-btn-wrapper"
                                onClick={() => window.open('/canva-clone', '_blank')}
                            >
                                <div className="fresh-btn-inner">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-800 via-blue-500 to-sky-500 shadow-[0_10px_20px_rgba(59,130,246,0.35)]">
                                        <FiPlus size={28} color="#ffffff" />
                                    </div>

                                    <div>
                                        <h2 className="m-0 text-2xl font-bold text-slate-900">
                                            Create Fresh
                                        </h2>
                                        <p className="mt-1 text-base text-slate-500">
                                            Open our advanced editor and start your story from scratch.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Images */}
                        <div className="glow-card">
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <h2 className="m-0 font-serif text-[1.6rem] font-normal tracking-[-0.01em] text-slate-900">
                                        Recent Images
                                    </h2>

                                    {!loading && (
                                        <span className="whitespace-nowrap rounded-full bg-indigo-100 px-3 py-1 text-[0.8rem] font-semibold text-indigo-500">
                                            {filteredImages.length} {filteredImages.length === 1 ? 'image' : 'images'}
                                        </span>
                                    )}
                                </div>

                                <input
                                    type="text"
                                    placeholder="Search images..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-[220px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[0.9rem] text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            {error && (
                                <div className="mb-4 text-red-500">
                                    {error}
                                </div>
                            )}

                            <div className="max-h-[480px] overflow-y-auto pr-2.5">
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
                                    {filteredImages.map((image) => {
                                        const canvasSize = image.data?.canvasSize || { width: 800, height: 600 }

                                        return (
                                            <div
                                                key={image._id}
                                                onClick={() => window.open(`/canva-clone/${image._id}`, '_blank')}
                                                className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-indigo-500"
                                            >
                                                <div className="relative flex h-[140px] items-center justify-center overflow-hidden bg-slate-100">
                                                    <div
                                                        className="absolute inset-0"
                                                        ref={el => {
                                                            if (!el) return
                                                            const rect = el.getBoundingClientRect()
                                                            const scale = Math.min(
                                                                rect.width / (canvasSize.width || 800),
                                                                rect.height / (canvasSize.height || 600)
                                                            )
                                                            el.style.setProperty('--thumb-scale', String(scale))
                                                        }}
                                                    >
                                                        <ImageThumbPreview image={image} />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between gap-2 p-4">
                                                    <div className="min-w-0 flex-1 overflow-hidden">
                                                        <h3 className="truncate text-base font-semibold text-slate-900">
                                                            {image.title || 'Untitled'}
                                                        </h3>
                                                        <p className="mt-0.5 text-sm text-slate-500">
                                                            {new Date(image.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteClick(image._id)
                                                        }}
                                                        className="shrink-0 rounded-lg p-2 text-red-500 transition hover:bg-red-100"
                                                        title="Delete Design"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {hasMore && !searchTerm && !loading && (
                                <div className="mt-6 flex justify-center">
                                    <button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        className={`flex items-center gap-2 rounded-xl px-8 py-2.5 text-[0.95rem] font-bold text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition ${loadingMore
                                            ? 'cursor-not-allowed bg-blue-300'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                    >
                                        {loadingMore ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Loading...
                                            </>
                                        ) : (
                                            'Load More'
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Template Management */}
                        <div className="glow-card">
                            <div className="mb-5 flex items-center gap-2.5 text-slate-900">
                                <FiLayout size={20} color="#0f172a" />
                                <h2 className="m-0 font-serif text-[1.6rem] font-normal tracking-[-0.01em] text-slate-900">
                                    Template Management
                                </h2>
                            </div>

                            <div className="mt-5 max-h-[480px] overflow-y-auto pr-2.5">
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
                                    {templates.map((tpl) => {
                                        const canvasSize = tpl.data?.canvasSize || { width: 800, height: 600 }

                                        return (
                                            <div
                                                key={tpl._id}
                                                onClick={() => setSelectedImage(tpl)}
                                                className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-indigo-500"
                                            >
                                                <div className="relative flex h-[140px] items-center justify-center overflow-hidden bg-indigo-50">
                                                    <div
                                                        className="absolute inset-0"
                                                        ref={el => {
                                                            if (!el) return
                                                            const rect = el.getBoundingClientRect()
                                                            const scale = Math.min(
                                                                rect.width / (canvasSize.width || 800),
                                                                rect.height / (canvasSize.height || 600)
                                                            )
                                                            el.style.setProperty('--thumb-scale', String(scale))
                                                        }}
                                                    >
                                                        <ImageThumbPreview image={tpl} />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between gap-2 p-4">
                                                    <div className="min-w-0 flex-1 overflow-hidden">
                                                        <h3 className="truncate text-base font-semibold text-slate-900">
                                                            {tpl.title || 'Untitled Template'}
                                                        </h3>
                                                        <p className="mt-0.5 text-sm text-slate-500">
                                                            {new Date(tpl.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setSelectedImage(tpl)
                                                        }}
                                                        className="view-btn"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showDeletePopup && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/55 backdrop-blur-sm"
                    onClick={() => {
                        setShowDeletePopup(false)
                        setSelectedDeleteId(null)
                    }}
                >
                    <div
                        className="w-[90%] max-w-[420px] rounded-3xl bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-[18px] flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <Trash2 size={22} className="text-red-600" />
                            </div>

                            <div>
                                <h3 className="m-0 text-[1.2rem] font-bold text-slate-900">
                                    Delete Design
                                </h3>
                                <p className="mt-1 text-[0.92rem] text-slate-500">
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <p className="mb-6 text-[0.95rem] leading-relaxed text-slate-600">
                            Are you sure you want to delete this design permanently?
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeletePopup(false)
                                    setSelectedDeleteId(null)
                                }}
                                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-[18px] py-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmDeleteImage}
                                className="cursor-pointer rounded-xl bg-gradient-to-br from-red-500 to-red-600 px-[18px] py-[10px] font-semibold text-white transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ImagePopup
                image={selectedImage}
                thumbnail={null}
                onClose={() => setSelectedImage(null)}
                onImport={handleImport}
            />
        </>
    )
}

export default ImageLayout

