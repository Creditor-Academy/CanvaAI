import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    History, X, Clock, RotateCcw, Eye, Tag, Plus,
    ChevronRight, User, GitCompare, Star, Save
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';

const VersionHistory = ({ isOpen, onClose, editor, versions, onSaveVersion, onRestoreVersion }) => {
    const [previewVersion, setPreviewVersion] = useState(null);
    const [namingId, setNamingId] = useState(null);
    const [tempName, setTempName] = useState('');
    const [compareMode, setCompareMode] = useState(false);
    const [compareVersions, setCompareVersions] = useState([]);

    if (!isOpen) return null;

    const formatDate = (date) => {
        const d = new Date(date);
        return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const handleRestore = (version) => {
        if (window.confirm(`Restore to version "${version.title}"? Current changes will be saved as a new version.`)) {
            if (onRestoreVersion) {
                onRestoreVersion(version);
            } else if (editor) {
                editor.commands.setContent(version.content || '');
                toast.success(`Restored to "${version.title}"`);
                onClose();
            }
        }
    };

    const handleNameVersion = (version) => {
        setNamingId(version.id);
        setTempName(version.title || '');
    };

    const saveVersionName = (version) => {
        if (onSaveVersion) {
            onSaveVersion({ ...version, title: tempName || version.title });
        }
        toast.success('Version named');
        setNamingId(null);
    };

    const toggleCompare = (version) => {
        if (!compareMode) return;
        setCompareVersions(prev => {
            if (prev.find(v => v.id === version.id)) {
                return prev.filter(v => v.id !== version.id);
            }
            if (prev.length >= 2) return [prev[1], version];
            return [...prev, version];
        });
    };

    const safeVersions = versions && versions.length > 0 ? versions : [
        { id: Date.now(), title: 'Current Version', timestamp: new Date(), author: 'You', content: '', isAutoSave: false }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 320 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 320 }}
            className="fixed right-0 top-0 h-full w-80 bg-white border-l border-blue-100 shadow-2xl z-40 flex flex-col"
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-900 text-sm">Version History</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setCompareMode(!compareMode)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${compareMode ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <GitCompare className="w-3 h-3 inline mr-1" />
                        Compare
                    </button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Save current version */}
            <div className="p-3 border-b border-blue-50">
                <Button
                    size="sm"
                    className="w-full text-xs bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => {
                        if (onSaveVersion && editor) {
                            onSaveVersion({
                                id: Date.now(),
                                title: `Version ${safeVersions.length + 1}`,
                                content: editor.getHTML(),
                                timestamp: new Date(),
                                author: 'You',
                            });
                            toast.success('Version saved');
                        } else {
                            toast.info('Version saved locally');
                        }
                    }}
                >
                    <Save className="w-3 h-3 mr-1" />
                    Save Current Version
                </Button>
            </div>

            {compareMode && compareVersions.length === 2 && (
                <div className="px-3 py-2 bg-purple-50 border-b border-purple-100">
                    <p className="text-xs text-purple-700 font-medium">Comparing: {compareVersions[0].title} vs {compareVersions[1].title}</p>
                    <Button
                        size="sm"
                        variant="outline"
                        className="mt-1 h-6 text-xs w-full border-purple-300 text-purple-700"
                        onClick={() => {
                            toast.info('Visual diff coming soon — comparing in text mode');
                            setCompareMode(false);
                            setCompareVersions([]);
                        }}
                    >
                        View Diff
                    </Button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {safeVersions.map((version, index) => (
                    <div
                        key={version.id}
                        className={`p-3 border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer ${compareVersions.find(v => v.id === version.id) ? 'bg-purple-50' : ''}`}
                        onClick={() => compareMode ? toggleCompare(version) : setPreviewVersion(version)}
                    >
                        <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${index === 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <div className="flex-1 min-w-0">
                                {namingId === version.id ? (
                                    <div className="flex gap-1">
                                        <Input
                                            autoFocus
                                            value={tempName}
                                            onChange={e => setTempName(e.target.value)}
                                            className="h-6 text-xs flex-1"
                                            onKeyDown={e => { if (e.key === 'Enter') saveVersionName(version); if (e.key === 'Escape') setNamingId(null); }}
                                        />
                                        <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => saveVersionName(version)}>✓</Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-medium text-gray-800 truncate">{version.title}</span>
                                        {index === 0 && <span className="text-[9px] bg-green-100 text-green-700 px-1 rounded">Current</span>}
                                        {version.isNamed && <Star className="w-2.5 h-2.5 text-yellow-500 flex-shrink-0" />}
                                    </div>
                                )}
                                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>{formatDate(version.timestamp)}</span>
                                    <span>·</span>
                                    <User className="w-2.5 h-2.5" />
                                    <span>{version.author || 'You'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                                <button
                                    onClick={e => { e.stopPropagation(); handleNameVersion(version); }}
                                    className="p-1 rounded hover:bg-gray-100 text-gray-400"
                                    title="Name this version"
                                >
                                    <Tag className="w-3 h-3" />
                                </button>
                                {index !== 0 && (
                                    <button
                                        onClick={e => { e.stopPropagation(); handleRestore(version); }}
                                        className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600"
                                        title="Restore this version"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Preview overlay */}
            {previewVersion && (
                <div className="absolute inset-0 bg-white z-10 flex flex-col">
                    <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                        <div>
                            <h3 className="text-sm font-semibold">{previewVersion.title}</h3>
                            <p className="text-[10px] text-gray-400">{formatDate(previewVersion.timestamp)}</p>
                        </div>
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                className="h-7 text-xs bg-blue-500 text-white"
                                onClick={() => { handleRestore(previewVersion); setPreviewVersion(null); }}
                            >
                                <RotateCcw className="w-3 h-3 mr-1" /> Restore
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7" onClick={() => setPreviewVersion(null)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <div
                        className="flex-1 overflow-auto p-4 prose prose-sm max-w-none text-xs"
                        dangerouslySetInnerHTML={{ __html: previewVersion.content || '<p><em>No content in this version</em></p>' }}
                    />
                </div>
            )}
        </motion.div>
    );
};

export { VersionHistory };
