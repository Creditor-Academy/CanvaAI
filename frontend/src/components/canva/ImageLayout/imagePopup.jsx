import React, { useState } from "react";
import { X, Download, Image as ImageIcon, ZoomIn } from "lucide-react";
import { useAuth } from '../../../contexts/AuthContext'
import { cloneImage } from '../../../services/imageEditor/imageApi'
import { toast } from 'sonner'

const ImagePopup = ({ image, thumbnail, onClose, onImport }) => {
    const { isAdmin } = useAuth()
    const [importing, setImporting] = useState(false)
    if (!image) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl max-w-4xl w-full mx-auto overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300"
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
                <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8 min-h-[400px]">
                    {thumbnail ? (
                        <div className="relative group">
                            <img
                                src={thumbnail}
                                alt={image.title}
                                className="max-h-[450px] w-auto object-contain rounded-xl shadow-lg transition-all duration-300 group-hover:shadow-xl"
                            />

                            {/* Zoom indicator on hover */}
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                    <ZoomIn className="w-3.5 h-3.5" />
                                    <span>Preview</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-ping" />
                                </div>
                            </div>
                            <p className="text-slate-600 font-medium">Loading preview...</p>
                            <p className="text-sm text-slate-400 mt-1">This may take a moment</p>
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
                                    // If admin, delegate to parent handler (existing behavior)
                                    if (isAdmin) return onImport(image)

                                    // Non-admin: clone via API then open cloned project
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



