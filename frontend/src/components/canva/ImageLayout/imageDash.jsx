import { getUserImages, deleteImage, updateImageVisibility } from '@/services/imageEditor/imageApi'
import { Globe, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import React, { useEffect, useState } from 'react'
import { exportCanvasAsImage } from '../export/exportCanvasAsImage'

const isTransparent = (color) => {
    if (!color) return true;
    const c = color.replace(/\s/g, '').toLowerCase();
    return (
        c === 'transparent' ||
        c === 'rgba(0,0,0,0)' ||
        c === 'rgba(0,0,0,0.0)'
    );
};

const ImageDash = () => {
    const { user } = useAuth()
    const userId = user?._id

    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [thumbnails, setThumbnails] = useState({})
    const [visLoading, setVisLoading] = useState({})

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

    // Generate thumbnails incrementally (only for missing entries)
    useEffect(() => {
        let mounted = true

        const gen = async () => {
            const map = {}

            for (const image of images) {
                if (!mounted) break
                if (thumbnails[image._id]) continue

                try {
                    const layers = image.data?.layer || []
                    const canvasSize = image.data?.canvasSize || { width: 800, height: 600 }

                    // Use saved canvas-wide background when available
                    const bgColor = image.data?.canvasBgColor || layers[0]?.canvasBgColor || '#ffffff'
                    const bgImage = image.data?.canvasBgImage || layers[0]?.canvasBgImage || null

                    let dataUrl = null
                    try {
                        dataUrl = await exportCanvasAsImage(
                            layers,
                            canvasSize,
                            'png',
                            1,
                            bgColor,
                            bgImage
                        )
                    } catch (err) {
                        console.warn('exportCanvasAsImage failed for', image._id, err)
                    }

                    // Fallback: if export failed (CORS/remote images), use the first image layer src
                    if (!dataUrl) {
                        const firstImgLayer = (layers || []).find(l => l && l.type === 'image' && l.src)
                        if (firstImgLayer && firstImgLayer.src) {
                            dataUrl = firstImgLayer.src
                        }
                    }

                    if (mounted && dataUrl) map[image._id] = dataUrl
                } catch (err) {
                    console.warn('Thumbnail error for', image._id, err)
                }
            }

            if (mounted && Object.keys(map).length) {
                setThumbnails(prev => ({ ...prev, ...map }))
            }
        }

        if (images.length) gen()
        return () => { mounted = false }
    }, [images, thumbnails])

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
            setThumbnails(prev => { const copy = { ...prev }; delete copy[imageId]; return copy })
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

    const filteredImages = images.filter(img => (img.title || 'Untitled').toLowerCase().includes(searchTerm.toLowerCase()))

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
                            const previewSrc = thumbnails[image._id];
                            return (
                                <a key={image._id} href={`/canva-clone/${image._id}`} target="_blank" rel="noopener noreferrer" className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 block">
                                    <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                                        {previewSrc ? (
                                            <img src={previewSrc} alt={image.title} className="w-full h-full object-cover transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(image._id); }} className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg cursor-pointer z-10" title="Delete Design">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>

                                    <div className="p-5">
                                        <div className='flex justify-between'>
                                            <div className="flex items-start justify-between">
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




