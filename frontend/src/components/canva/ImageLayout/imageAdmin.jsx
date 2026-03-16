import React, { useEffect, useState } from 'react'
import { getPublicTemplateImages, deleteImage, cloneImage } from '../../../services/imageEditor/imageApi'
import { exportCanvasAsImage } from '../export/exportCanvasAsImage'
import { toast } from 'sonner'
import { useAuth } from '../../../contexts/AuthContext'
import ImagePopup from './imagePopup'
const ImageAdmin = () => {
    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [thumbnails, setThumbnails] = useState({})
    const { isAdmin } = useAuth()
    const [selectedImage, setSelectedImage] = useState(null)


    const handleImport = async (image) => {
        const targetId = image.imageId || image._id;

        // Admins open the template directly (existing template metadata)
        if (isAdmin) {
            try {
                sessionStorage.setItem(`prefill_project_${targetId}`, JSON.stringify(image));
            } catch (err) {
                console.warn('Failed to store prefill project', err);
            }

            window.open(`/canva-clone/${targetId}`, '_blank');
            return;
        }

        // Non-admins: clone the template into their account, then open the cloned item
        try {
            const resp = await cloneImage(targetId);
            const newId = resp?.data?._id || resp?.imageId || resp?.data?.imageId || resp?._id || targetId;

            try {
                const payload = resp.data || resp;
                sessionStorage.setItem(`prefill_project_${newId}`, JSON.stringify(payload));
                sessionStorage.setItem(`prefill_import_flag_${newId}`, '1');
            } catch (err) {
                console.warn('Failed to store cloned prefill project', err);
            }

            window.open(`/canva-clone/${newId}`, '_blank');
            toast.success('Template imported to your account');
        } catch (err) {
            console.error('Clone/import failed', err);
            toast.error('Failed to import template');
        }
    }



    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setError(null)
            try {
                const result = await getPublicTemplateImages()
                console.log("Fetched Public Template Images:", result)

                // Handle different response formats
                let imageData = []
                if (result && result.status === 'success' && Array.isArray(result.data)) {
                    imageData = result.data
                } else if (Array.isArray(result)) {
                    imageData = result
                } else if (result && result.data && Array.isArray(result.data)) {
                    imageData = result.data
                }

                setImages(imageData)
            } catch (err) {
                setError(err.message || 'Failed to fetch')
                toast.error('Failed to load templates')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

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
        if (!window.confirm('Are you sure you want to delete this template?')) return
        try {
            await deleteImage(imageId)
            setImages(prev => prev.filter(img => img._id !== imageId))
            setThumbnails(prev => { const copy = { ...prev }; delete copy[imageId]; return copy })
            toast.success('Template deleted successfully')
        } catch (err) {
            console.error('Delete error', err)
            toast.error('Failed to delete template')
        }
    }

    const filteredImages = images.filter(img => (img.title || 'Untitled').toLowerCase().includes(searchTerm.toLowerCase()))

    return (
        <div className="bg-slate-50/50 p-8 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Template Management</h1>
                        <p className="text-slate-500 mt-1">Use the template library to manage your creative assets</p>
                    </div>
                </div>

                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="bg-white border border-slate-100 rounded-2xl h-64 animate-pulse" />
                        ))}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {!loading && filteredImages.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredImages.map(image => {
                            const previewSrc = thumbnails[image._id];
                            return (
                                <div
                                    key={image._id || image.imageId}
                                    className="group bg-white rounded-2xl border border-slate-300 overflow-hidden transition-all duration-300 block"
                                >
                                    <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                                        {previewSrc ? (
                                            <img
                                                src={previewSrc}
                                                alt={image.title}
                                                className="w-full h-full object-cover transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

                                        {/* {isAdmin && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleDelete(image._id)
                                                }}
                                                className="absolute top-3 left-3 p-2 bg-white/90 backdrop-blur-sm rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg cursor-pointer z-10 opacity-0 group-hover:opacity-100"
                                                title="Delete Template"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )} */}

                                    </div>

                                    <div className="p-5">
                                        <div className="flex items-start justify-between">
                                            <h3 className="text-slate-800 font-bold group-hover:text-blue-600 transition-colors truncate">
                                                {image.title || 'Untitled Template'}
                                            </h3>
                                            <button
                                                onClick={() => setSelectedImage(image)}
                                                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition cursor-pointer"
                                            >
                                                View
                                            </button>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {new Date(image.createdAt).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                                                    {image.data?.canvasSize ? `${image.data.canvasSize.width}×${image.data.canvasSize.height}` : '—'}
                                                </span>
                                                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium text-xs">
                                                    Template
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (!loading && (
                    <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="max-w-xs mx-auto">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No templates yet</h3>
                        </div>
                    </div>
                ))}
            </div>
            <ImagePopup
                image={selectedImage}
                thumbnail={selectedImage ? thumbnails[selectedImage._id] : null}
                onClose={() => setSelectedImage(null)}
                onImport={handleImport}
            />
        </div >
    )
}

export default ImageAdmin