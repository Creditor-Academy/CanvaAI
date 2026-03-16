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
                slideCount: 0 // Initialize slideCount
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
                    slideCount: 0
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
        const copy = { ...doc, id: `doc_${Date.now()}`, title: `${doc.title} (copy)`, createdAt: Date.now(), lastOpened: Date.now(), pinned: false, slideCount: doc.slideCount };
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

    // Placeholder content for visual recent documents (thumbnails)
    const recentSlideshowPlaceholder = (title, slideCount) => (
        <div className="aspect-[16/9] border border-slate-200 rounded-lg p-3 bg-slate-50 flex flex-col gap-2 overflow-hidden shadow-inner">
            <p className="text-[11px] font-bold text-slate-800 line-clamp-1">{title}</p>
            <div className="h-1.5 w-full rounded bg-white/70" />
            <div className="h-1.5 w-3/4 rounded bg-white/50" />
            <div className="h-1.5 w-full rounded bg-white/40" />
            <div className="flex-1" />
            <div className="h-1.5 w-1/2 rounded bg-white/40" />
        </div>
    );


    return (
        <div
            className="min-h-screen bg-[#f1f5f9] text-slate-800 font-sans overflow-y-auto pl-[60px]"
            onClick={() => setContextMenu(null)}
        >
            {/* ── Main Content ── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-8 pb-24 pt-8">

                {/* ── Title Header ── */}
                <header className="mb-10 py-10">
                    <h1 className="text-[32px] font-extrabold text-slate-950 tracking-tight leading-tight">Write Better. Format Faster. Edit Smarter.</h1>
                    <p className="text-slate-600 text-[14px] mt-1.5">"Create, edit, and share content effortlessly with our advanced editing tool."</p>
                </header>

                {/* ── Main Action Cards ── */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <motion.div
                        whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.99 }}
                        onClick={() => openEditor('blank')} // Keep logic to start blank, or map to an AI generator if implemented
                        className="bg-amber-400 hover:bg-amber-500 rounded-3xl p-7 flex gap-5 cursor-pointer shadow-lg transition-colors items-center"
                    >
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Sparkles className="w-9 h-9 text-white" />
                        </div>
                        <div className="flex-1 text-white">
                            <h2 className="text-xl font-extrabold leading-tight">Create with AI</h2>
                            <p className="text-sm text-white/90 mt-1">Let AI generate a complete presentation from your topic.</p>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.99 }}
                        onClick={() => openEditor('blank')}
                        className="bg-blue-600 hover:bg-blue-700 rounded-3xl p-7 flex gap-5 cursor-pointer shadow-lg transition-colors items-center"
                    >
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Plus className="w-9 h-9 text-white" />
                        </div>
                        <div className="flex-1 text-white">
                            <h2 className="text-xl font-extrabold leading-tight">Create Fresh</h2>
                            <p className="text-sm text-white/90 mt-1">Open our advanced editor and start your story from scratch.</p>
                        </div>
                    </motion.div>
                </section>

                {/* ── Recent Presentations (Updated to visual thumbnails) ── */}
                <section className="mt-12 bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-[20px] font-extrabold text-slate-950">Recent Presentations</h2>
                        <div className="flex gap-2.5">
                            {/* Search keeps functioning */}
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search presentations"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="h-10 w-64 bg-slate-100 rounded-full pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
                                />
                            </div>
                            {/* Filter keeps functioning */}
                            <div className="flex gap-1 bg-slate-100 rounded-full p-1 border border-slate-200 shadow-inner">
                                {['All', 'Pinned'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setRecentFilter(f)}
                                        className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${recentFilter === f ? 'bg-white text-blue-700 shadow-md' : 'text-slate-500 hover:bg-white/60'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {recentDocs.length === 0 ? (
                        <div className="text-center py-20 px-6 border-2 border-dashed border-slate-200 rounded-2xl">
                            <FileText className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-600 font-bold text-lg">
                                {searchQuery ? `No presentations match "${searchQuery}"` : 'No recent presentations'}
                            </p>
                            <p className="text-slate-400 text-sm mt-1.5">Start with AI or create a new one to get started</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {recentDocs.slice(0, 10).map((doc, idx) => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                                    className="group relative cursor-pointer"
                                    onClick={() => openEditor(null, doc.id)} // Keep opening existing
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setContextMenu({ docId: doc.id, x: e.clientX, y: e.clientY });
                                    }}
                                >
                                    {/* Visual representation card */}
                                    {recentSlideshowPlaceholder(doc.title, doc.slideCount)}

                                    {/* Footer with actions and info */}
                                    <div className="mt-4 flex items-center justify-between gap-2 px-1">
                                        <div className="min-w-0">
                                            {renameId === doc.id ? (
                                                <input
                                                    autoFocus
                                                    value={renameValue}
                                                    onChange={e => setRenameValue(e.target.value)}
                                                    onBlur={saveRename}
                                                    onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setRenameId(null); }}
                                                    onClick={e => e.stopPropagation()}
                                                    className="text-[13px] border border-blue-400 rounded-lg px-2 py-1 w-full focus:outline-none bg-white shadow-md z-10 relative"
                                                />
                                            ) : (
                                                <h4 className="text-[13px] font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                                    {doc.pinned && <span className="mr-1.5 text-amber-500" title="Pinned">📌</span>}
                                                    {doc.title}
                                                </h4>
                                            )}
                                            <p className="text-[11px] text-slate-500 mt-1 capitalize flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-slate-300" />
                                                {timeAgo(doc.lastOpened)} · {doc.template || 'document'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {/* Slide Count Label (matches image) */}
                                            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold px-3 py-1.5 rounded-full border border-blue-100">
                                                <Grid className="w-3.5 h-3.5" />
                                                {doc.slideCount ? `${doc.slideCount} Slides` : 'Blank'}
                                            </div>

                                            {/* Three-dot menu button */}
                                            <button
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                                                onClick={(e) => { e.stopPropagation(); setContextMenu({ docId: doc.id, x: e.clientX, y: e.clientY }); }}
                                            >
                                                <MoreVertical className="w-4.5 h-4.5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Start from a template (Updated to presentation thumbnails) ── */}
                <section className="mt-14 bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-[20px] font-extrabold text-slate-950">Featured Templates</h2>
                        {/* Tab bar is cleaner in the new layout */}
                        <div className="flex gap-1.5 bg-slate-100 rounded-full p-1.5 border border-slate-200 shadow-inner max-w-lg overflow-x-auto no-scrollbar">
                            {TEMPLATE_TABS.map(({ label, icon: Icon }) => (
                                <button
                                    key={label}
                                    onClick={() => setActiveTab(label)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all ${activeTab === label
                                        ? 'bg-white text-blue-700 shadow-md'
                                        : 'text-slate-600 hover:bg-white/60'}`}
                                >
                                    <Icon className="w-4 h-4" /> {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search inside templates block functioning */}
                    <div className="mb-8 relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search templates"
                            value={templateSearch}
                            onChange={e => setTemplateSearch(e.target.value)}
                            className="h-10 w-full bg-slate-100 rounded-full pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all border border-slate-200"
                        />
                    </div>

                    {/* Template grid (visual placeholders) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredTemplates.map((template, idx) => (
                            <motion.div
                                key={`${template.id}-${idx}`}
                                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                                onClick={() => openEditor(template.type)}
                                className="group cursor-pointer relative"
                            >
                                {/* Thumbnail card */}
                                <div className="aspect-[16/9] rounded-2xl overflow-hidden shadow-md border border-slate-200 transition-all group-hover:shadow-lg group-hover:scale-[1.01] p-5 flex flex-col gap-2.5 relative"
                                    style={{ backgroundColor: template.color }}
                                >
                                    {template.dark && <div className="absolute inset-0 bg-slate-950 opacity-90 rounded-2xl" />}
                                    <div className="relative z-10 flex flex-col h-full gap-2">
                                        <div className="flex items-center justify-between">
                                            <div className={`h-3 w-3/4 rounded-full ${template.dark ? 'bg-white/30' : 'bg-white/60'}`} />
                                            <Grid className={`w-4 h-4 ${template.dark ? 'bg-white/10' : 'bg-white/40'}`} />
                                        </div>
                                        <div className={`h-2 w-full rounded-full ${template.dark ? 'bg-white/15' : 'bg-white/40'}`} />
                                        <div className={`h-2 w-4/5 rounded-full ${template.dark ? 'bg-white/15' : 'bg-white/40'}`} />
                                        <div className="flex-1" />
                                        <div className={`h-1.5 w-1/2 rounded-full ${template.dark ? 'bg-white/10' : 'bg-white/30'}`} />
                                    </div>
                                    <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors rounded-2xl" />
                                </div>

                                {/* Text & info */}
                                <div className="mt-4 flex items-center justify-between gap-3 px-1">
                                    <div className="min-w-0">
                                        <h3 className="text-[13px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{template.title}</h3>
                                        {template.author && <p className="text-[11px] text-slate-500 mt-1 truncate">{template.author}</p>}
                                    </div>
                                    <Button onClick={() => openEditor(template.type)} size="sm" className="bg-blue-600 text-white rounded-full text-xs px-5 h-8 font-semibold">
                                        View
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </main>

            {/* ── Existing Context Menu ── (Position adjusted slightly for new layout context) */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed z-[200] bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 w-48 text-[13px]"
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
                            <div key={i} className="border-t border-slate-100 my-1.5" />
                        ) : (
                            <button
                                key={i}
                                onClick={item.action}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-800'}`}
                            >
                                <item.icon className={`w-4 h-4 ${item.danger ? 'text-red-500' : 'text-slate-500'}`} /> {item.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── FAB & Modals (Keep as-is for functionality) ── */}
            <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                onClick={() => openEditor('blank')}
                className="fixed bottom-8 right-8 w-15 h-15 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-[100] group hover:bg-blue-700 transition-colors"
                title="New Presentation"
            >
                <Plus className="w-7 h-7 transition-transform group-hover:rotate-90 duration-200" />
            </motion.button>

            {/* ── Upload Dropzone Modal ── */}
            <AnimatePresence>
                {showUploadZone && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-[150]" onClick={() => setShowUploadZone(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 25 }}
                            className="fixed inset-0 z-[160] flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-3xl shadow-3xl w-full max-w-xl p-10" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-extrabold text-slate-950">Import Presentation File</h2>
                                    <button onClick={() => setShowUploadZone(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-blue-200 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/70 transition-all group shadow-inner"
                                >
                                    <Upload className="w-14 h-14 text-blue-400 mx-auto mb-5 group-hover:text-blue-600 transition-colors" />
                                    <p className="font-extrabold text-slate-800 text-lg mb-1.5">Click to browse or drag & drop</p>
                                    <p className="text-sm text-slate-500">Supports .txt, .html, .md, .rtf files for slide generation</p>
                                </div>
                                <input ref={fileInputRef} type="file" accept=".txt,.html,.md,.rtf" multiple className="hidden" onChange={handleFileUpload} />
                                <div className='flex justify-end mt-8'>
                                    <Button onClick={() => setShowUploadZone(false)} size="lg" className="bg-slate-200 text-slate-800 rounded-full font-bold">Cancel</Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EditorIntro;