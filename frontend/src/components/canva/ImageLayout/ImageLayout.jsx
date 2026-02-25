import { getUserImages } from '@/services/imageEditor/imageApi'
import { useAuth } from '@/contexts/AuthContext'
import React, { useEffect, useState } from 'react'

const ImageLayout = () => {
    const { user } = useAuth()
    const userId = user?._id

    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchImages = async () => {
            try {
                setLoading(true)
                const data = await getUserImages(userId)
                setImages(data)
            } catch (err) {
                setError("Failed to load images")
            } finally {
                setLoading(false)
            }
        }

        if (userId) {
            fetchImages()
        }
    }, [userId])

    return (
        <div className="p-6 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-semibold text-gray-800">
                    Image Projects
                </h1>

                <a
                    href="/canva-clone"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                    Create Image
                </a>
            </div>

            {/* Loading */}
            {loading && (
                <p className="text-gray-500">Loading images...</p>
            )}

            {/* Error */}
            {error && (
                <p className="text-red-500">{error}</p>
            )}

            {/* Projects */}
            {!loading && images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {images.map((image) => (
                        <a
                            key={image._id}
                            href={`/canva-clone/${image._id}`} // open specific project
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border rounded-lg overflow-hidden bg-white 
                                       hover:shadow-lg transition cursor-pointer group"
                        >
                            {/* Thumbnail (placeholder for now) */}
                            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-400 text-sm">
                                    Preview
                                </span>
                            </div>

                            {/* Info */}
                            <div className="p-3">
                                <h3 className="text-sm font-semibold text-gray-800">
                                    {image.title || "Untitled"}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {new Date(image.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </a>
                    ))}
                </div>
            ) : (
                !loading && (
                    <div className="text-center py-16 border rounded-lg bg-gray-50">
                        <p className="text-gray-600 mb-4">No images yet</p>
                        <a
                            href="/canva-clone"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                        >
                            Create Image
                        </a>
                    </div>
                )
            )}
        </div>
    )
}

export default ImageLayout
