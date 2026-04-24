import React from 'react';
import { FiX, FiMaximize, FiMonitor, FiSmartphone, FiImage, FiHash, FiYoutube, FiFacebook } from 'react-icons/fi';
import { initialTemplates } from '../state/initialState';

// Helper to get icon for specific template names/types
const getLayoutIcon = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('default') || lowerName.includes('canvas') || lowerName.includes('standard')) return <FiMaximize className="text-blue-500" />;
    if (lowerName.includes('mobile') || lowerName.includes('view') || lowerName.includes('story')) return <FiSmartphone className="text-green-500" />;
    if (lowerName.includes('facebook') || lowerName.includes('cover')) return <FiFacebook className="text-blue-600" />;
    if (lowerName.includes('youtube') || lowerName.includes('thumbnail')) return <FiYoutube className="text-red-500" />;
    if (lowerName.includes('banner')) return <FiHash className="text-orange-500" />;
    if (lowerName.includes('presentation')) return <FiMonitor className="text-purple-500" />;
    return <FiImage className="text-slate-400" />;
};

const ChooseImageLayout = ({ open, onClose, onSelect }) => {
    if (!open) return null;

    // Filter out initialTemplates to show only those available in the array (active ones)
    const activeLayouts = initialTemplates;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" 
                onClick={onClose} 
            />
            
            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Choose a Layout</h2>
                        <p className="text-slate-500 text-sm mt-1">Select dimensions for your fresh design</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                    {activeLayouts.map((layout) => (
                        <button
                            key={layout.id}
                            onClick={() => onSelect(layout)}
                            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-50 hover:border-blue-500 hover:bg-blue-50/50 transition-all group text-left"
                        >
                            <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                {getLayoutIcon(layout.name)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {layout.name}
                                </h3>
                                <p className="text-xs font-medium text-slate-400 mt-0.5 uppercase tracking-wider">
                                    {layout.width} x {layout.height} • {layout.category}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 font-bold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChooseImageLayout;