import React from 'react'

const ImageLayout = () => {
    // Static saved image data
    const savedImages = [
        {
            id: 1,
            name: "Summer Design",
            thumbnail: "https://cdn.pixabay.com/photo/2026/02/10/11/03/jupilu-vietnamese-girl-10115376_1280.jpg",
            date: "Feb 18, 2024"
        },
        {
            id: 2,
            name: "Nature Design",
            thumbnail: "https://cdn.pixabay.com/photo/2025/09/13/07/48/tree-frog-9831777_1280.jpg",
            date: "Feb 18, 2024"
        },
    ]

    return (
        <div className="p-6 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-semibold text-gray-800">
                    Image Projects
                </h1>

                {/* Create New */}
                <a
                    href="/canva-clone"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                    Create Image
                </a>
            </div>

            {/* Projects */}
            {savedImages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {savedImages.map((image) => (
                        <a
                            key={image.id}
                            href="/canva-clone"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border rounded-lg overflow-hidden bg-white 
                                       hover:shadow-lg transition cursor-pointer group"
                        >
                            {/* Image */}
                            <div className="aspect-video bg-gray-100 overflow-hidden">
                                <img
                                    src={image.thumbnail}
                                    alt={image.name}
                                    className="w-full h-full object-cover 
                                               group-hover:scale-105 transition-transform duration-200"
                                />
                            </div>

                            {/* Info */}
                            <div className="p-3">
                                <h3 className="text-sm font-semibold text-gray-800">
                                    {image.name}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {image.date}
                                </p>
                            </div>
                        </a>
                    ))}
                </div>
            ) : (
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
            )}
        </div>
    )
}

export default ImageLayout
