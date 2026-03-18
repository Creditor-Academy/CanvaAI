import { getUserImages, deleteImage } from '@/services/imageEditor/imageApi'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import React, { useEffect, useState } from 'react'
import { exportCanvasAsImage } from '../export/exportCanvasAsImage'
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

const ImageUser = () => {
    const { user } = useAuth()
    const userId = user?._id

    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [thumbnails, setThumbnails] = useState({})

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

    useEffect(() => {
        if (!images.length) return

        let cancelled = false

        const run = async () => {

            const map = {}

            for (const image of images) {

                try {

                    const layers = image.data?.layer || []
                    const canvasSize =
                        image.data?.canvasSize || { width: 800, height: 600 }

                    const bgColor =
                        image.data?.canvasBgColor ||
                        layers[0]?.canvasBgColor ||
                        "#ffffff"

                    const bgImage =
                        image.data?.canvasBgImage ||
                        layers[0]?.canvasBgImage ||
                        null

                    const dataUrl = await exportCanvasAsImage(
                        layers,
                        canvasSize,
                        "jpeg",
                        0.7,
                        bgColor,
                        bgImage
                    )

                    map[image._id] = dataUrl

                } catch (e) {

                    // ⭐ fallback image
                    const imgLayer = image.data?.layer?.find(l => l.type === "image")
                    map[image._id] =
                        imgLayer?.src ||
                        imgLayer?.url ||
                        imgLayer?.imageUrl ||
                        null
                }
            }

            if (!cancelled) setThumbnails(map)
        }

        run()

        return () => { cancelled = true }

    }, [images])

    const handleDelete = async (imageId) => {
        if (!window.confirm('Are you sure you want to delete this design?')) return
        try {
            await deleteImage(imageId)
            setImages(prev => prev.filter(img => img._id !== imageId))
            setThumbnails(prev => { const copy = { ...prev }; delete copy[imageId]; return copy })
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

                <div className='flex gap-4 py-4 w-full'>
                    <Link
                        to="/create/ai-design"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Create With AI
                    </Link>

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
                            const canvasSize = image.data?.canvasSize || { width: 1200, height: 630 };
                            const aspectRatio = (canvasSize.height / canvasSize.width) * 100;
                            console.log("thumb", image._id, thumbnails[image._id])
                            return (
                                <a key={image._id} href={`/canva-clone/${image._id}`} target="_blank" rel="noopener noreferrer" className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 block">
                                    <div
                                        className="relative bg-slate-100 overflow-hidden"
                                        style={{
                                            aspectRatio: `${canvasSize.width} / ${canvasSize.height}`
                                        }}
                                    >
                                        {previewSrc === undefined ? (
                                            spinner
                                        ) : previewSrc ? (
                                            <img
                                                src={previewSrc}
                                                alt={image.title}
                                                className="absolute inset-0 w-full h-full object-contain bg-slate-50"
                                                style={{
                                                    backgroundColor: isTransparent(image.data?.canvasBgColor) ? '#f8fafc' : image.data?.canvasBgColor
                                                }}
                                            />
                                        ) : (
                                            <div className="text-xs text-gray-400">No preview</div>
                                        )}

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



