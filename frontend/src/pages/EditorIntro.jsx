import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Upload, Search, Settings, Grid, ChevronRight, FileText, Clock, Star,
    Users, MoreVertical, ArrowRight, Trash2, Edit3, Copy, Download, Pin,
    PinOff, FolderOpen, Sparkles, BookOpen, Briefcase, Mail, AlignLeft,
    ListChecks, FileCode, ScrollText, X, Check
} from 'lucide-react';
import { Button } from '../components/athena-editor/components/ui/button';
import { toast } from 'sonner';

// ── Template content map ──────────────────────────────────────────────────────
const TEMPLATE_CONTENT = {
    blank: '',
    resume: `<h1>Your Name</h1><p><strong>Email:</strong> you@email.com | <strong>Phone:</strong> +1 555-000-0000 | <strong>Location:</strong> City, State</p><h2>Summary</h2><p>Experienced professional with a track-record of delivering results...</p><h2>Experience</h2><p><strong>Senior Engineer</strong> — Acme Corp (2020–Present)</p><ul><li>Led cross-functional team of 8 engineers</li><li>Improved system performance by 40%</li></ul><h2>Education</h2><p><strong>B.S. Computer Science</strong> — State University (2016)</p><h2>Skills</h2><p>JavaScript, React, Node.js, Python, SQL, Leadership</p>`,
    report: `<h1>Project Proposal</h1><p><em>Prepared by: [Your Name] · Date: ${new Date().toLocaleDateString()}</em></p><h2>Executive Summary</h2><p>This proposal outlines the plan for [Project Name], which aims to [primary goal]...</p><h2>Problem Statement</h2><p>Currently, [describe the problem your project solves]...</p><h2>Proposed Solution</h2><p>We propose to [describe your solution]...</p><h2>Timeline</h2><p><strong>Phase 1:</strong> Research & Planning — 2 weeks</p><p><strong>Phase 2:</strong> Development — 6 weeks</p><p><strong>Phase 3:</strong> Testing & Launch — 2 weeks</p><h2>Budget</h2><p>Estimated total: $00,000</p>`,
    letter: `<p>${new Date().toLocaleDateString()}</p><br/><p>[Recipient Name]<br/>[Company]<br/>[Address]</p><br/><p>Dear [Name],</p><p>I am writing to [purpose of the letter]. I hope this letter finds you well.</p><p>[Body paragraph 1]</p><p>[Body paragraph 2]</p><p>Thank you for your time and consideration. Please do not hesitate to contact me at [your contact information].</p><br/><p>Sincerely,</p><p>[Your Name]<br/>[Title]</p>`,
    newsletter: `<h1>📰 Monthly Newsletter</h1><p><em>${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Edition</em></p><h2>🌟 Highlights This Month</h2><p>Here are the top stories from our team...</p><h2>📊 Key Metrics</h2><p>• Users: 10,000+<br/>• Engagement: ↑ 23%<br/>• Revenue: ↑ 15%</p><h2>🔮 What's Coming Next</h2><p>Stay tuned for exciting updates including...</p><h2>📩 Stay Connected</h2><p>Follow us on social media and subscribe to our newsletter for more updates.</p>`,
    meeting: `<h1>Meeting Notes</h1><p><strong>Date:</strong> ${new Date().toLocaleDateString()} | <strong>Attendees:</strong> [Names]</p><h2>Agenda</h2><ol><li>Review last week's action items</li><li>Project status update</li><li>New business</li></ol><h2>Discussion</h2><p>[Key points discussed]</p><h2>Action Items</h2><ul><li>[ ] [Person] — [Task] — Due: [Date]</li><li>[ ] [Person] — [Task] — Due: [Date]</li></ul><h2>Next Meeting</h2><p>[Date and time of next meeting]</p>`,
    essay: `<h1>Essay Title</h1><p><em>By [Author Name]</em></p><h2>Introduction</h2><p>The purpose of this essay is to explore [topic]. Throughout this paper, I will argue that [thesis statement]...</p><h2>Background</h2><p>[Provide context and background information on your topic]</p><h2>Main Argument</h2><p>[Present your main arguments with supporting evidence]</p><h2>Counterargument</h2><p>Some may argue that [counterargument]. However, this view overlooks [your rebuttal]...</p><h2>Conclusion</h2><p>In conclusion, [restated thesis and key takeaways].</p><h2>References</h2><p>[1] Author, A. (Year). Title. Publisher.</p>`,
};

const TEMPLATE_TABS = [
    { label: 'Recommended', icon: Sparkles },
    { label: 'Resumes', icon: Briefcase },
    { label: 'Reports', icon: ScrollText },
    { label: 'Essays', icon: BookOpen },
    { label: 'Letters', icon: Mail },
    { label: 'Newsletters', icon: AlignLeft },
    { label: 'Meeting Notes', icon: ListChecks },
    { label: 'Code Docs', icon: FileCode },
];

const TEMPLATES = [
    { id: 'blank', title: 'Blank Document', type: 'blank', tab: 'Recommended', color: '#e2e8f0' },
    { id: 'resume', title: 'Executive Resume', type: 'resume', tab: 'Resumes', author: 'Classic Layout', color: '#dbeafe' },
    { id: 'report', title: 'Project Proposal', type: 'report', tab: 'Reports', author: 'Business Style', color: '#dcfce7' },
    { id: 'essay', title: 'Academic Essay', type: 'essay', tab: 'Essays', author: 'APA Format', color: '#fef3c7' },
    { id: 'letter', title: 'Business Letter', type: 'letter', tab: 'Letters', author: 'Formal', color: '#f3e8ff' },
    { id: 'newsletter', title: 'Monthly Newsletter', type: 'newsletter', tab: 'Newsletters', author: 'Modern Style', color: '#ffe4e6' },
    { id: 'meeting', title: 'Meeting Notes', type: 'meeting', tab: 'Meeting Notes', author: 'Structured', color: '#e0f2fe' },
    { id: 'blank', title: 'Code Documentation', type: 'blank', tab: 'Code Docs', author: 'Developer', color: '#1e293b', dark: true },
];

const STORAGE_KEY = 'athena_documents';

const loadDocuments = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveDocuments = (docs) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    } catch (e) {
        console.warn('Could not save documents', e);
    }
};

const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) === 1 ? '' : 's'} ago`;
    return new Date(date).toLocaleDateString();
};

const EditorIntro = () => {
    const [activeTab, setActiveTab] = useState('Recommended');
    const [documents, setDocuments] = useState(loadDocuments);
    const [searchQuery, setSearchQuery] = useState('');
    const [templateSearch, setTemplateSearch] = useState('');
    const [recentFilter, setRecentFilter] = useState('All');
    const [showUploadZone, setShowUploadZone] = useState(false);
    const [contextMenu, setContextMenu] = useState(null); // { docId, x, y }
    const [renameId, setRenameId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const fileInputRef = useRef(null);

    // Update docs list when localStorage changes (e.g. from editor tab)
    useEffect(() => {
        const onStorage = () => setDocuments(loadDocuments());
        window.addEventListener('storage', onStorage);

        // Also poll every 5s (for same-tab edits)
        const interval = setInterval(() => setDocuments(loadDocuments()), 5000);
        return () => { window.removeEventListener('storage', onStorage); clearInterval(interval); };
    }, []);

    const persistDocs = (docs) => {
        setDocuments(docs);
        saveDocuments(docs);
    };

    const openEditor = (templateType = 'blank', docId = null) => {
        if (docId) {
            // Open existing document
            localStorage.setItem('athena_active_doc_id', docId);
            const doc = documents.find(d => d.id === docId);
            if (doc) {
                localStorage.setItem('athena_active_doc_content', doc.content || '');
                localStorage.setItem('athena_active_doc_title', doc.title || 'Untitled');
                // Update last opened
                persistDocs(documents.map(d => d.id === docId ? { ...d, lastOpened: Date.now() } : d));
            }
        } else {
            // New document from template
            const content = TEMPLATE_CONTENT[templateType] || '';
            const newDoc = {
                id: `doc_${Date.now()}`,
                title: templateType === 'blank' ? 'Untitled Document' : `New ${templateType.charAt(0).toUpperCase() + templateType.slice(1)}`,
                content,
                createdAt: Date.now(),
                lastOpened: Date.now(),
                template: templateType,
                pinned: false,
            };
            const updated = [newDoc, ...documents];
            persistDocs(updated);
            localStorage.setItem('athena_active_doc_id', newDoc.id);
            localStorage.setItem('athena_active_doc_content', content);
            localStorage.setItem('athena_active_doc_title', newDoc.title);
        }
        window.open('/editor', '_blank');
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const content = ev.target.result;
                const newDoc = {
                    id: `doc_${Date.now()}_${Math.random()}`,
                    title: file.name.replace(/\.(txt|html|md)$/i, ''),
                    content: `<pre>${content}</pre>`,
                    createdAt: Date.now(),
                    lastOpened: Date.now(),
                    template: 'upload',
                    pinned: false,
                };
                persistDocs(prev => {
                    const updated = [newDoc, ...prev];
                    saveDocuments(updated);
                    return updated;
                });
                toast.success(`"${file.name}" imported`);
            };
            reader.readAsText(file);
        });
        setShowUploadZone(false);
    };

    const deleteDoc = (id) => {
        if (!window.confirm('Delete this document?')) return;
        persistDocs(documents.filter(d => d.id !== id));
        toast.success('Document deleted');
        setContextMenu(null);
    };

    const pinDoc = (id) => {
        persistDocs(documents.map(d => d.id === id ? { ...d, pinned: !d.pinned } : d));
        setContextMenu(null);
    };

    const duplicateDoc = (id) => {
        const doc = documents.find(d => d.id === id);
        if (!doc) return;
        const copy = { ...doc, id: `doc_${Date.now()}`, title: `${doc.title} (copy)`, createdAt: Date.now(), lastOpened: Date.now(), pinned: false };
        persistDocs([copy, ...documents]);
        toast.success('Document duplicated');
        setContextMenu(null);
    };

    const startRename = (doc) => {
        setRenameId(doc.id);
        setRenameValue(doc.title);
        setContextMenu(null);
    };

    const saveRename = () => {
        persistDocs(documents.map(d => d.id === renameId ? { ...d, title: renameValue || d.title } : d));
        setRenameId(null);
    };

    // Filter templates
    const filteredTemplates = TEMPLATES.filter(t => {
        const tabMatch = activeTab === 'Recommended' ? true : t.tab === activeTab;
        const searchMatch = !templateSearch || t.title.toLowerCase().includes(templateSearch.toLowerCase());
        return tabMatch && searchMatch;
    });

    // Filter documents
    const searchedDocs = documents.filter(d =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const pinnedDocs = searchedDocs.filter(d => d.pinned);
    const regularDocs = searchedDocs.filter(d => !d.pinned)
        .sort((a, b) => b.lastOpened - a.lastOpened);

    const recentDocs = recentFilter === 'Pinned'
        ? [...pinnedDocs, ...regularDocs].filter(d => d.pinned)
        : [...pinnedDocs, ...regularDocs];

    return (
        <div
            className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans overflow-y-auto"
            onClick={() => setContextMenu(null)}
        >
            {/* ── Header ── */}
            <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="text-slate-500"><Grid className="w-5 h-5" /></Button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-extrabold text-slate-900 tracking-tight text-lg select-none">Athena</span>
                    </div>
                </div>

                <div className="flex-1 max-w-xl px-6 hidden md:block">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search documents…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full h-9 bg-slate-100 border border-transparent focus:bg-white focus:border-blue-400 rounded-xl pl-10 pr-4 text-sm outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="hidden sm:flex items-center gap-1.5 border-slate-200 text-slate-600 hover:bg-slate-50"
                        onClick={() => setShowUploadZone(true)}
                    >
                        <Upload className="w-4 h-4" /> Import
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-500"><Settings className="w-5 h-5" /></Button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm cursor-pointer">
                        YO
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-8 pb-24">
                {/* ── Hero banner ── */}
                <section className="mt-8 relative rounded-3xl overflow-hidden flex flex-col justify-center bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 shadow-xl min-h-[200px] px-10 py-10">
                    {/* Decorative blobs */}
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none" />
                    <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-indigo-300/10 rounded-full translate-y-1/2 blur-2xl pointer-events-none" />

                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
                        <p className="text-white/70 text-sm font-medium mb-1">Welcome back 👋</p>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-6">
                            What would you like to create today?
                        </h1>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                onClick={() => openEditor('blank')}
                                className="inline-flex items-center gap-3 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm"
                            >
                                <Plus className="w-5 h-5" /> New Blank Document
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                onClick={() => setShowUploadZone(true)}
                                className="inline-flex items-center gap-3 bg-white/10 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-all text-sm"
                            >
                                <Upload className="w-5 h-5" /> Import File
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                onClick={() => openEditor('blank')}
                                className="inline-flex items-center gap-3 bg-white/10 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-all text-sm"
                            >
                                <Sparkles className="w-5 h-5" /> Generate with AI
                            </motion.button>
                        </div>
                    </motion.div>
                </section>

                {/* ── Templates ── */}
                <section className="mt-12">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-bold text-slate-900">Start from a template</h2>
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search templates"
                                value={templateSearch}
                                onChange={e => setTemplateSearch(e.target.value)}
                                className="h-8 bg-slate-100 rounded-lg pl-8 pr-3 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 w-48 transition-all"
                            />
                        </div>
                    </div>

                    {/* Tab bar */}
                    <div className="flex gap-1 overflow-x-auto pb-1 mb-6 no-scrollbar">
                        {TEMPLATE_TABS.map(({ label, icon: Icon }) => (
                            <button
                                key={label}
                                onClick={() => setActiveTab(label)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeTab === label
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                <Icon className="w-3.5 h-3.5" /> {label}
                            </button>
                        ))}
                    </div>

                    {/* Template grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredTemplates.map((template, idx) => (
                            <motion.div
                                key={`${template.id}-${idx}`}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                onClick={() => openEditor(template.type)}
                                className="group cursor-pointer"
                            >
                                <div
                                    className="aspect-[3/4] rounded-xl overflow-hidden shadow-sm border border-slate-200 group-hover:ring-2 group-hover:ring-blue-500 group-hover:border-transparent transition-all duration-200 relative flex flex-col p-3"
                                    style={{ backgroundColor: template.color }}
                                >
                                    {template.dark && <div className="absolute inset-0 bg-slate-900 opacity-95 rounded-xl" />}
                                    <div className="relative z-10 flex flex-col h-full gap-1.5">
                                        {template.type === 'blank' && !template.dark ? (
                                            <div className="flex-1 flex items-center justify-center">
                                                <div className="w-10 h-12 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center group-hover:border-blue-400 transition-colors">
                                                    <Plus className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className={`h-2.5 w-3/4 rounded ${template.dark ? 'bg-white/30' : 'bg-white/70'}`} />
                                                <div className={`h-1.5 w-full rounded ${template.dark ? 'bg-white/15' : 'bg-white/50'}`} />
                                                <div className={`h-1.5 w-4/5 rounded ${template.dark ? 'bg-white/15' : 'bg-white/50'}`} />
                                                <div className={`h-1.5 w-full rounded ${template.dark ? 'bg-white/10' : 'bg-white/40'}`} />
                                                <div className="flex-1" />
                                                <div className={`h-1.5 w-1/2 rounded ${template.dark ? 'bg-white/10' : 'bg-white/40'}`} />
                                            </>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors rounded-xl" />
                                </div>
                                <div className="mt-2 px-0.5">
                                    <h3 className={`text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1`}>
                                        {template.title}
                                    </h3>
                                    {template.author && (
                                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{template.author}</p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ── Recent Documents ── */}
                <section className="mt-14">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-bold text-slate-900">Recent documents</h2>
                        <div className="flex gap-1">
                            {['All', 'Pinned'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setRecentFilter(f)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${recentFilter === f ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'text-slate-500 hover:bg-slate-100'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {recentDocs.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm text-center py-16 px-6">
                            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium text-sm">
                                {searchQuery ? `No documents match "${searchQuery}"` : 'No recent documents'}
                            </p>
                            <p className="text-slate-400 text-xs mt-1">Create a new document or import a file to get started</p>
                            <Button onClick={() => openEditor('blank')} className="mt-5 bg-blue-600 text-white text-xs">
                                <Plus className="w-3.5 h-3.5 mr-1" /> New Document
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {/* Column header */}
                            <div className="grid grid-cols-[1fr_160px_100px_40px] px-5 py-2.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <span>Name</span>
                                <span>Last Opened</span>
                                <span>Type</span>
                                <span />
                            </div>

                            {recentDocs.slice(0, 10).map((doc, idx) => (
                                <div
                                    key={doc.id}
                                    className="grid grid-cols-[1fr_160px_100px_40px] px-5 py-3.5 items-center hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group relative cursor-pointer"
                                    onClick={() => openEditor(null, doc.id)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setContextMenu({ docId: doc.id, x: e.clientX, y: e.clientY });
                                    }}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-10 bg-blue-50 rounded flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div className="min-w-0">
                                            {renameId === doc.id ? (
                                                <input
                                                    autoFocus
                                                    value={renameValue}
                                                    onChange={e => setRenameValue(e.target.value)}
                                                    onBlur={saveRename}
                                                    onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setRenameId(null); }}
                                                    onClick={e => e.stopPropagation()}
                                                    className="text-sm border border-blue-400 rounded px-1 py-0.5 w-full focus:outline-none"
                                                />
                                            ) : (
                                                <h4 className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                                    {doc.pinned && <span className="mr-1 text-amber-500" title="Pinned">📌</span>}
                                                    {doc.title}
                                                </h4>
                                            )}
                                            <p className="text-[10px] text-slate-400 mt-0.5 truncate capitalize">{doc.template || 'document'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                                        {timeAgo(doc.lastOpened)}
                                    </div>
                                    <div className="text-xs text-slate-400 capitalize truncate">{doc.template === 'blank' ? 'Document' : doc.template || 'Document'}</div>
                                    <button
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100 text-slate-400"
                                        onClick={(e) => { e.stopPropagation(); setContextMenu({ docId: doc.id, x: e.clientX, y: e.clientY }); }}
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {recentDocs.length > 10 && (
                                <div className="px-5 py-3 border-t border-slate-100 text-center">
                                    <button className="text-xs text-blue-600 font-semibold hover:underline">
                                        Show all {recentDocs.length} documents
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </main>

            {/* ── FAB ── */}
            <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                onClick={() => openEditor('blank')}
                className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-[100] group hover:bg-blue-700 transition-colors"
                title="New Document"
            >
                <Plus className="w-6 h-6 transition-transform group-hover:rotate-90 duration-200" />
            </motion.button>

            {/* ── Context Menu ── */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed z-[200] bg-white rounded-xl shadow-2xl border border-slate-200 py-1 w-44 text-sm"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        onClick={e => e.stopPropagation()}
                    >
                        {[
                            { icon: ArrowRight, label: 'Open', action: () => { openEditor(null, contextMenu.docId); setContextMenu(null); } },
                            { icon: Edit3, label: 'Rename', action: () => { startRename(documents.find(d => d.id === contextMenu.docId)); } },
                            { icon: documents.find(d => d.id === contextMenu?.docId)?.pinned ? PinOff : Pin, label: documents.find(d => d.id === contextMenu?.docId)?.pinned ? 'Unpin' : 'Pin to top', action: () => pinDoc(contextMenu.docId) },
                            { icon: Copy, label: 'Duplicate', action: () => duplicateDoc(contextMenu.docId) },
                            { type: 'sep' },
                            { icon: Trash2, label: 'Delete', action: () => deleteDoc(contextMenu.docId), danger: true },
                        ].map((item, i) => item.type === 'sep' ? (
                            <div key={i} className="border-t border-slate-100 my-1" />
                        ) : (
                            <button
                                key={i}
                                onClick={item.action}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 transition-colors text-left ${item.danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-700'}`}
                            >
                                <item.icon className="w-3.5 h-3.5" /> {item.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Upload Dropzone Modal ── */}
            <AnimatePresence>
                {showUploadZone && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-[150]" onClick={() => setShowUploadZone(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                            className="fixed inset-0 z-[160] flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-slate-900">Import File</h2>
                                    <button onClick={() => setShowUploadZone(false)} className="p-1 rounded-lg hover:bg-slate-100">
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-blue-300 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
                                >
                                    <Upload className="w-10 h-10 text-blue-400 mx-auto mb-3 group-hover:text-blue-600 transition-colors" />
                                    <p className="font-semibold text-slate-700 mb-1">Click to browse or drag & drop</p>
                                    <p className="text-xs text-slate-400">Supports .txt, .html, .md files</p>
                                </div>
                                <input ref={fileInputRef} type="file" accept=".txt,.html,.md,.rtf" multiple className="hidden" onChange={handleFileUpload} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EditorIntro;
