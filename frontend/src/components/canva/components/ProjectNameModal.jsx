import React, { useState, useEffect } from 'react';
import { X, Save, Folder, AlertCircle } from 'lucide-react';

const ProjectNameModal = ({ open, onClose, onConfirm, initialName }) => {
    const [name, setName] = useState(initialName || '');
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setName(initialName || '');
            setError('');
        }
    }, [open, initialName]);

    if (!open) return null;

    const handleConfirm = () => {
        if (!name.trim()) {
            setError('Please enter a project name');
            return;
        }

        if (name.trim().length > 50) {
            setError('Project name must be less than 50 characters');
            return;
        }

        onConfirm(name.trim());
    };

    const handleInputChange = (e) => {
        setName(e.target.value);
        if (error) setError('');
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/20 rounded-xl">
                                <Folder className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Save Project
                                </h2>
                                <p className="text-sm text-blue-100">
                                    Give your project a descriptive name
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

                {/* Content */}
                <div className="p-6">
                    <div className="space-y-4">
                        {/* Input field with label */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Project Name
                                <span className="text-red-500 ml-1">*</span>
                            </label>

                            <div className="relative">
                                <input
                                    autoFocus
                                    type="text"
                                    value={name}
                                    onChange={handleInputChange}
                                    onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                                    placeholder="e.g., My Awesome Project"
                                    className={`
                                        w-full px-4 py-3.5 
                                        border-2 rounded-xl 
                                        text-gray-700 placeholder-gray-400
                                        transition-all duration-200
                                        focus:outline-none focus:ring-4
                                        ${error
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                                        }
                                    `}
                                />

                                {/* Character count */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <span className={`
                                        text-xs font-medium px-2 py-1 rounded-full
                                        ${name.length > 0
                                            ? name.length > 50
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-500'
                                        }
                                    `}>
                                        {name.length}/50
                                    </span>
                                </div>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2.5 rounded-lg animate-in slide-in-from-top-1 duration-200">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-sm font-medium">{error}</span>
                                </div>
                            )}

                            {/* Hint text */}
                            {!error && (
                                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                    <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                                    Use a descriptive name to easily identify your project later
                                </p>
                            )}
                        </div>

                    </div>
                </div>

                {/* Footer with action buttons */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 focus:ring-4 focus:ring-gray-100"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleConfirm}
                        disabled={!name.trim() || name.length > 50}
                        className={`
                            px-6 py-2.5 rounded-xl 
                            font-semibold 
                            flex items-center gap-2 
                            transition-all duration-200
                            focus:ring-4 focus:ring-blue-200
                            ${!name.trim() || name.length > 50
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30'
                            }
                        `}
                    >
                        <Save className="w-4 h-4" />
                        Save Project
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectNameModal;

