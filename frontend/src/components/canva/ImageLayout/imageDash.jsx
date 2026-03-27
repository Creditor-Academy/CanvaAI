import { getUserImages, deleteImage, updateImageVisibility } from '@/services/imageEditor/imageApi'
import { Globe, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import React, { useEffect, useState } from 'react'


const getShapeSVG = (shape, width, height, fillColor, strokeColor, strokeWidth) => {

    const w = width
    const h = height
    const fill = fillColor || 'none'
    const stroke = strokeColor || '#000'
    const sw = strokeWidth || 1

    const paths = {
        rectangle: `M0 0 L${w} 0 L${w} ${h} L0 ${h} Z`,
        circle: `M${w / 2} 0 A${w / 2} ${h / 2} 0 1 1 ${w / 2} ${h} A${w / 2} ${h / 2} 0 1 1 ${w / 2} 0 Z`,
        triangle: `M${w / 2} 0 L${w} ${h} L0 ${h} Z`,
        diamond: `M${w / 2} 0 L${w} ${h / 2} L${w / 2} ${h} L0 ${h / 2} Z`
    }

    const d = paths[shape] || paths.rectangle

    return `
        <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
            <path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />
        </svg>
    `
}

const isTransparent = (color) => {
    if (!color) return true;
    const c = color.replace(/\s/g, '').toLowerCase();
    return (
        c === 'transparent' ||
        c === 'rgba(0,0,0,0)' ||
        c === 'rgba(0,0,0,0.0)'
    );
};

export const ImageThumbPreview = React.memo(({ image }) => {

    const layers = Array.isArray(image?.data)
        ? image.data
        : (image?.data?.layer || image?.data?.layers || [])

    const canvasSize = image?.data?.canvasSize || { width: 800, height: 600 }
    const bgColor = image?.data?.canvasBgColor || '#ffffff'
    const bgImage = image?.data?.canvasBgImage || null

    const isGradient = bgColor && bgColor.includes('gradient')

    const style = isGradient
        ? {
            backgroundImage: bgColor
        }
        : {
            backgroundColor: isTransparent(bgColor) ? '#f8fafc' : bgColor,
            backgroundImage: bgImage ? `url(${bgImage})` : 'none'
        }

    return (
        <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{
                ...style,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
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
                    transform: 'scale(var(--thumb-scale,1))'
                }}
            >
                {layers?.map(layer => {

                    if (!layer || layer.visible === false) return null

                    const style = {
                        position: 'absolute',
                        left: layer.x || 0,
                        top: layer.y || 0,
                        width: layer.width || 0,
                        height: layer.height || 0,
                        transform: `rotate(${layer.rotation || 0}deg)`
                    }

                    if (layer.type === 'text') {
                        return (
                            <div key={layer.id} style={{
                                ...style,
                                fontSize: layer.fontSize || 16,
                                fontFamily: layer.fontFamily || 'Arial',
                                color: layer.color || '#111',
                                display: 'flex',
                                alignItems: 'center',
                                padding: 4,
                                whiteSpace: 'pre-wrap'
                            }}>
                                {layer.text}
                            </div>
                        )
                    }

                    if (layer.type === 'image') {
                        const src = layer.imageUrl || layer.url || layer.src
                        if (!src) return null

                        return (
                            <img
                                key={layer.id}
                                src={src}
                                draggable={false}
                                style={{
                                    ...style,
                                    objectFit: 'cover',
                                    opacity: ((layer.opacity ?? 100) / 100)
                                }}
                            />
                        )
                    }
                    if (layer.type === 'shape') {

                        const svg = getShapeSVG(
                            layer.shape,
                            layer.width || 100,
                            layer.height || 100,
                            layer.fillColor,
                            layer.strokeColor,
                            layer.strokeWidth
                        )

                        return (
                            <div
                                key={layer.id}
                                style={{
                                    ...style,
                                    opacity: ((layer.opacity ?? 100) / 100)
                                }}
                                dangerouslySetInnerHTML={{ __html: svg }}
                            />
                        )
                    }

                    return null
                })}
            </div>
        </div>
    )
})

const ImageDash = () => {
    const { user } = useAuth()
    const userId = user?._id

    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [visLoading, setVisLoading] = useState({})

    useEffect(() => {
        let mounted = true
        const fetchImages = async () => {
            try {
                setLoading(true)
                const res = await getUserImages(userId)
                if (mounted) setImages(Array.isArray(res) ? res : res?.data || [])
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


    useEffect(() => {
        window.dispatchEvent(new Event('resize'))
    }, [images])

    const handleDelete = async (imageId) => {
        try {
            const img = images.find(i => i._id === imageId)
            if (!img) return

            const confirmMsg = img.isPublic
                ? 'Your data is published. Do you want to delete it?'
                : 'Are you sure you want to delete this design?'

            if (!window.confirm(confirmMsg)) return

            // If published, first unpublish so it is removed from public listings
            if (img.isPublic) {
                try {
                    await updateImageVisibility(imageId, { userId, isPublic: false })
                } catch (err) {
                    console.warn('Failed to unpublish before delete', err)
                }
            }

            await deleteImage(imageId)
            setImages(prev => prev.filter(img => img._id !== imageId))
            toast.success('Design deleted successfully')
        } catch (err) {
            console.error('Delete error', err)
            toast.error('Failed to delete design')
        }
    }

    const handleVisibilityChange = async (imageId, currentStatus) => {
        try {
            setVisLoading(prev => ({ ...prev, [imageId]: true }))
            const payload = { userId, isPublic: !currentStatus }
            await updateImageVisibility(imageId, payload)
            setImages(prev => prev.map(img => img._id === imageId ? { ...img, isPublic: !currentStatus } : img))
            toast.success(!currentStatus ? 'Image published' : 'Image unpublished')
        } catch (err) {
            console.error('Update visibility error', err)
            toast.error('Failed to update visibility')
        } finally {
            setVisLoading(prev => { const copy = { ...prev }; delete copy[imageId]; return copy })
        }
    }
    const filteredImages = images
        .filter(img => (img.title || 'Untitled').toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return (
        <div className=" bg-slate-50/50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items:center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Images</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl w-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        <a
                            href="/canva-clone"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Create New Design
                        </a>
                    </div>
                </div>

                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                                <div className="aspect-[16/10] bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 relative overflow-hidden">
                                    <div className="absolute inset-0 animate-pulse" />
                                </div>
                                <div className="p-5">
                                    <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-100 rounded-lg mb-3 animate-pulse" />
                                    <div className="flex items-center justify-between">
                                        <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-100 rounded w-20 animate-pulse" />
                                        <div className="h-5 bg-green-100 rounded-full w-16 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3">{error}</div>
                )}

                {!loading && filteredImages.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredImages.map(image => {
                            const canvasSize = image.data?.canvasSize || { width: 1200, height: 630 }
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
                                                ['--thumb-scale']: '1',
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
                                        <div className='flex justify-between items-center'>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-slate-800 font-bold group-hover:text-blue-600 transition-colors truncate">{image.title || 'Untitled Masterpiece'}</h3>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleVisibilityChange(image._id, image.isPublic);
                                                }}
                                                disabled={!!visLoading[image._id]}
                                                aria-busy={!!visLoading[image._id]}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${image.isPublic
                                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                    } ${visLoading[image._id] ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                title={image.isPublic ? "Unpublish image" : "Publish image"}
                                            >
                                                {visLoading[image._id] ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                        <span className="text-xs">Updating...</span>
                                                    </>
                                                ) : (image.isPublic ? (
                                                    <>
                                                        <Globe size={14} />
                                                        Published
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock size={14} />
                                                        Private
                                                    </>
                                                ))}
                                            </button>

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
                    <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="max-w-xs mx-auto">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
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

export default ImageDash




