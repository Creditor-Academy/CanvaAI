import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Upload, Search, Settings, Grid, ChevronRight, FileText, Clock, Star,
    Users, MoreVertical, ArrowRight, Trash2, Edit3, Copy, Download, Pin,
    PinOff, FolderOpen, Sparkles, BookOpen, Briefcase, Mail, AlignLeft,
    ListChecks, FileCode, ScrollText, X, Check, RefreshCw, Smile
} from 'lucide-react';
import { Button } from '../components/athena-editor/components/ui/button';
import { toast } from 'sonner';
import { TextEditorService } from '../services/Text-Editor/text.service.js';

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

// ── Backend API Integration ──────────────────────────────────────────────
const STORAGE_KEY = 'athena_documents';

// Load documents from backend API
const loadDocumentsFromBackend = async () => {
    try {
        const result = await TextEditorService.getAllDocuments();
        return result.documents || [];
    } catch (error) {
        console.error('Failed to load documents from backend:', error);
        return [];
    }
};

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
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [templateSearch, setTemplateSearch] = useState('');
    const [recentFilter, setRecentFilter] = useState('All');
    const [showUploadZone, setShowUploadZone] = useState(false);
    const [contextMenu, setContextMenu] = useState(null); // { docId, x, y }
    const [renameId, setRenameId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const fileInputRef = useRef(null);
    
    // AI Document Generator Modal State
    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiContentType, setAiContentType] = useState('document');
    const [aiLength, setAiLength] = useState('medium');
    const [aiTonality, setAiTonality] = useState('professional');
    const [isGenerating, setIsGenerating] = useState(false);

    // Load documents from backend on mount
    useEffect(() => {
        const fetchDocuments = async () => {
            setIsLoading(true);
            try {
                // Fetch ONLY from backend - no localStorage merging
                const backendResult = await TextEditorService.getAllDocuments();
                const backendDocs = backendResult?.documents || [];
                
                // Transform backend docs for UI display
                const formattedDocs = backendDocs.map(backendDoc => ({
                    id: backendDoc.id,
                    title: backendDoc.title || 'Untitled Document',
                    createdAt: new Date(backendDoc.createdAt).getTime(),
                    updatedAt: new Date(backendDoc.updatedAt).getTime(),
                    lastOpened: new Date(backendDoc.updatedAt).getTime(),
                    template: 'document',
                    pinned: false,
                    slideCount: 0,
                    isBackend: true
                }));
                
                console.log(`📊 Loaded ${formattedDocs.length} documents from backend`);
                setDocuments(formattedDocs);
            } catch (error) {
                console.error('Error loading documents:', error);
                setDocuments([]); // Show empty if backend fails
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchDocuments();
        
        // Refresh documents when returning from editor tab
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('🔄 Refreshing documents list from backend');
                fetchDocuments();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Listen for refresh signal from editor tabs
        const handleStorageChange = (e) => {
            if (e.key === 'athena_document_refresh') {
                console.log('📡 Received refresh signal from editor, updating documents...');
                fetchDocuments();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        // Poll every 5s for updates
        const interval = setInterval(() => {
            fetchDocuments(); // Always fetch fresh from backend
        }, 5000);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    const persistDocs = (docs) => {
        setDocuments(docs);
        saveDocuments(docs);
    };

    const openEditor = async (templateType = 'blank', docId = null) => {
        if (docId) {
            // Check if this is a MongoDB ID (24 character hex string) or localStorage ID
            const isMongoId = /^[0-9a-fA-F]{24}$/.test(docId);
            
            try {
                let doc;
                if (isMongoId) {
                    // Load from backend directly
                    doc = await TextEditorService.getDocumentById(docId);
                    console.log('📄 Loaded document from backend:', {
                        id: doc.id,
                        title: doc.title,
                        hasHtml: !!doc.data?.html,
                        hasContent: !!doc.data?.content,
                        htmlLength: doc.data?.html?.length || 0
                    });
                } else {
                    // For localStorage IDs, check if it has backend reference
                    const localDoc = documents.find(d => d.id === docId);
                    if (!localDoc) {
                        throw new Error('Document not found');
                    }
                    
                    // If document has mongoBackendId, load from backend
                    if (localDoc.mongoBackendId) {
                        doc = await TextEditorService.getDocumentById(localDoc.mongoBackendId);
                    } else {
                        // Document exists only in localStorage - show error
                        toast.error('This document needs to be saved to backend first');
                        return;
                    }
                }
                
                // Pass document data via URL params for the editor to fetch
                // Editor will call the API directly to get content
                const windowUrl = `/editor/${doc.id}?docId=${doc.id}`;
                window.open(windowUrl, '_blank');
                
                // Update last opened in local state
                const updatedDocs = documents.map(d => 
                    d.id === docId ? { ...d, lastOpened: Date.now() } : d
                );
                persistDocs(updatedDocs);
            } catch (error) {
                console.error('Failed to load document:', error);
                toast.error('Failed to load document: ' + (error.message || 'Unknown error'));
                return;
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
                slideCount: 0
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

    const deleteDoc = async (id) => {
        if (!window.confirm('Delete this document?')) return;
        
        try {
            // Delete from backend
            await TextEditorService.deleteDocument(id);
            console.log('✅ Document deleted from backend:', id);
            
            // Trigger refresh across all tabs
            localStorage.setItem('athena_document_refresh', Date.now().toString());
            
            // Update local state immediately
            setDocuments(documents.filter(d => d.id !== id));
            toast.success('Document deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete document: ' + (error.message || 'Unknown error'));
        }
        
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

    // AI Document Generation
    const handleAIGenerate = async () => {
        if (!aiTopic.trim()) {
            toast.error('Please enter a topic');
            return;
        }

        setIsGenerating(true);

        try {
            // Import AI utils for document generation
            const { generateDocument } = await import('../components/athena-editor/ai/aiUtils.js');

            // Build the prompt based on user selections
            const lengthInstructions = {
                short: 'Keep it concise and brief (around 300 words)',
                medium: 'Provide moderate detail (around 600 words)',
                long: 'Be comprehensive and detailed (around 1200 words)',
                custom: 'Adjust length as appropriate for the content'
            };

            const tonalityStyle = {
                professional: 'Use formal, business-appropriate language',
                casual: 'Use friendly, conversational tone',
                academic: 'Use scholarly, research-based language with citations',
                creative: 'Use imaginative, engaging storytelling style',
                persuasive: 'Use compelling, argumentative language to convince readers',
                informative: 'Use clear, educational language focused on facts'
            };

            const contentTypeTemplates = {
                document: 'Create a well-structured document',
                essay: 'Write an academic essay with introduction, body paragraphs, and conclusion',
                report: 'Generate a formal business report with executive summary and recommendations',
                article: 'Write an engaging article or blog post',
                story: 'Create a narrative story with characters and plot',
                poem: 'Compose a creative poem'
            };

            const fullPrompt = `${contentTypeTemplates[aiContentType]} about: ${aiTopic}. \n\nStyle instructions:\n- Length: ${lengthInstructions[aiLength]}\n- Tonality: ${tonalityStyle[aiTonality]}\n\nFormat the content with proper headings, paragraphs, and structure appropriate for a ${aiContentType}.`;

            console.log('🤖 Generating AI document with:', {
                topic: aiTopic,
                contentType: aiContentType,
                length: aiLength,
                tonality: aiTonality
            });

            // Generate content using AI via backend API
            const generatedContent = await generateDocument({
                topic: aiTopic,
                pages: aiLength === 'long' ? 3 : aiLength === 'medium' ? 2 : 1,
                tone: aiTonality,
                type: aiContentType,
                temperature: 0.7
            });

            console.log('✅ Content generated successfully');

            // Create new document with generated content
            const response = await TextEditorService.saveDocument({
                title: `${aiContentType.charAt(0).toUpperCase() + aiContentType.slice(1)}: ${aiTopic.substring(0, 40)}${aiTopic.length > 40 ? '...' : ''}`,
                data: {
                    content: generatedContent,
                    html: generatedContent
                }
            });

            const documentId = response.document?.id || response.id;
            
            console.log('📄 Document saved with ID:', documentId);

            const newDoc = {
                id: documentId || `doc_${Date.now()}`,
                mongoBackendId: documentId,
                title: response.document?.title || response.title || aiTopic.substring(0, 50),
                content: generatedContent,
                createdAt: Date.now(),
                lastOpened: Date.now(),
                template: 'ai-generated',
                pinned: false,
                slideCount: 0
            };

            // Update local state
            persistDocs(prev => {
                const updated = [newDoc, ...prev];
                saveDocuments(updated);
                return updated;
            });

            toast.success('✨ Document generated successfully!');
            setShowAIGenerator(false);

            // Reset form
            setAiTopic('');
            setAiContentType('document');
            setAiLength('medium');
            setAiTonality('professional');

            // Open the editor with the generated document
            if (documentId) {
                // Use the correct route format: /editor/:mongoId
                const editorUrl = `/editor/${documentId}`;
                console.log('🚀 Opening editor at:', editorUrl);
                window.open(editorUrl, '_blank');
            } else {
                toast.error('Failed to get document ID');
            }

        } catch (error) {
            console.error('AI Generation error:', error);
            toast.error(error.message?.includes('API') 
                ? 'AI service unavailable. Please check your API configuration.'
                : 'Failed to generate content. Please try again.');
        } finally {
            setIsGenerating(false);
        }
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
                        onClick={() => setShowAIGenerator(true)}
                        className="bg-amber-400 hover:bg-amber-500 rounded-3xl p-7 flex gap-5 cursor-pointer shadow-lg transition-colors items-center"
                    >
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Sparkles className="w-9 h-9 text-white" />
                        </div>
                        <div className="flex-1 text-white">
                            <h2 className="text-xl font-extrabold leading-tight">Create with AI</h2>
                            <p className="text-sm text-white/90 mt-1">Let AI generate a complete Document from your topic.</p>
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

                {/* ── Recent Documents (Updated to visual thumbnails) ── */}
                <section className="mt-12 bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-[20px] font-extrabold text-slate-950">Recent Documents</h2>
                        <div className="flex gap-2.5">
                            {/* Refresh Button */}
                            <button
                                onClick={() => {
                                    console.log('🔄 Manual refresh triggered');
                                    const fetchDocs = async () => {
                                        setIsLoading(true);
                                        try {
                                            const backendResult = await TextEditorService.getAllDocuments();
                                            const backendDocs = backendResult?.documents || [];
                                            const localDocs = loadDocuments();
                                            const mergedDocs = backendDocs.map(backendDoc => {
                                                const matchingLocal = localDocs.find(d => 
                                                    d.mongoBackendId === backendDoc.id || 
                                                    (d.title === backendDoc.title && Math.abs(d.createdAt - new Date(backendDoc.createdAt).getTime()) < 60000)
                                                );
                                                return {
                                                    id: backendDoc.id,
                                                    title: backendDoc.title,
                                                    content: '',
                                                    createdAt: new Date(backendDoc.createdAt).getTime(),
                                                    lastOpened: matchingLocal?.lastOpened || Date.now(),
                                                    template: matchingLocal?.template || 'document',
                                                    pinned: matchingLocal?.pinned || false,
                                                    slideCount: 0,
                                                    isBackend: true
                                                };
                                            });
                                            setDocuments(mergedDocs);
                                            toast.success('Documents refreshed');
                                        } catch (error) {
                                            console.error('Refresh error:', error);
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    };
                                    fetchDocs();
                                }}
                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-sm font-semibold transition-all"
                                title="Refresh documents list"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                            
                            {/* Search keeps functioning */}
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search documents"
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
                                {searchQuery ? `No documents match "${searchQuery}"` : 'No recent documents         '}
                            </p>
                            <p className="text-slate-400 text-sm mt-1.5">Start with AI or create a new one to get started</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {recentDocs.slice(0, 8).map((doc, idx) => (
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
                                    {/* Visual representation of the document card (placeholder) */}
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

                {/* ── Start from a template (Updated to document thumbnails) ── */}
                <section className="mt-14 bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-[20px] font-extrabold text-slate-950">Featured Documents</h2>
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
                title="New Document"
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
                                    <h2 className="text-2xl font-extrabold text-slate-950">Import Document</h2>
                                    <button onClick={() => setShowUploadZone(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-blue-200 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/70 transition-all group shadow-inner"
                                >
                                    <Upload className="w-14 h-14 text-blue-400 mx-auto mb-5 group-hover:text-blue-600 transition-colors" />
                                    <p className="font-extrabold text-slate-800 text-lg mb-1.5">Click to browse or drag & drop for Document</p>
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

            {/* AI Document Generator Modal */}
            <AnimatePresence>
                {showAIGenerator && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => !isGenerating && setShowAIGenerator(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: -20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                            <Sparkles className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">Create with AI</h2>
                                            <p className="text-white/90 text-xs">Let AI generate your document</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => !isGenerating && setShowAIGenerator(false)}
                                        className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                                {/* Topic Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                        <AlignLeft className="w-3.5 h-3.5 text-amber-500" />
                                        What should your document be about?
                                    </label>
                                    <textarea
                                        value={aiTopic}
                                        onChange={(e) => setAiTopic(e.target.value)}
                                        placeholder="e.g., The impact of artificial intelligence on modern healthcare..."
                                        className="w-full min-h-[80px] p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none text-sm placeholder:text-slate-400"
                                        disabled={isGenerating}
                                    />
                                </div>

                                {/* Content Type Selection */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                                        Content Type
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'document', label: 'Document', icon: FileText },
                                            { id: 'essay', label: 'Essay', icon: BookOpen },
                                            { id: 'report', label: 'Report', icon: Briefcase },
                                            { id: 'article', label: 'Article', icon: ScrollText },
                                            { id: 'story', label: 'Story', icon: Sparkles },
                                            { id: 'poem', label: 'Poem', icon: Sparkles }
                                        ].map((type) => {
                                            const Icon = type.icon;
                                            return (
                                                <button
                                                    key={type.id}
                                                    onClick={() => setAiContentType(type.id)}
                                                    disabled={isGenerating}
                                                    className={`p-2.5 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                                                        aiContentType === type.id
                                                            ? 'border-amber-400 bg-amber-50 text-amber-700'
                                                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                                    }`}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                    <span className="text-[11px] font-medium">{type.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Length & Tonality */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Length */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                            <ScrollText className="w-3.5 h-3.5 text-amber-500" />
                                            Length
                                        </label>
                                        <div className="space-y-1.5">
                                            {[
                                                { id: 'short', label: 'Short', desc: '~300 words' },
                                                { id: 'medium', label: 'Medium', desc: '~600 words' },
                                                { id: 'long', label: 'Long', desc: '~1200 words' }
                                            ].map((option) => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => setAiLength(option.id)}
                                                    disabled={isGenerating}
                                                    className={`w-full p-2.5 rounded-xl border-2 transition-all text-left ${
                                                        aiLength === option.id
                                                            ? 'border-amber-400 bg-amber-50'
                                                            : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-slate-800">{option.label}</span>
                                                        <span className="text-[10px] text-slate-500">{option.desc}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tonality */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                            <Smile className="w-3.5 h-3.5 text-amber-500" />
                                            Tonality
                                        </label>
                                        <select
                                            value={aiTonality}
                                            onChange={(e) => setAiTonality(e.target.value)}
                                            disabled={isGenerating}
                                            className="w-full p-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 bg-white text-sm font-medium"
                                        >
                                            <option value="professional">Professional</option>
                                            <option value="casual">Casual</option>
                                            <option value="academic">Academic</option>
                                            <option value="creative">Creative</option>
                                            <option value="persuasive">Persuasive</option>
                                            <option value="informative">Informative</option>
                                        </select>
                                        <div className="text-[10px] text-slate-500 mt-1.5 p-2 bg-slate-50 rounded-lg">
                                            {aiTonality === 'professional' && 'Formal, business-appropriate language'}
                                            {aiTonality === 'casual' && 'Friendly, conversational tone'}
                                            {aiTonality === 'academic' && 'Scholarly, research-based language'}
                                            {aiTonality === 'creative' && 'Imaginative, engaging storytelling'}
                                            {aiTonality === 'persuasive' && 'Compelling, argumentative language'}
                                            {aiTonality === 'informative' && 'Clear, educational language'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="bg-slate-50 px-5 py-4 flex items-center justify-between border-t border-slate-200 flex-shrink-0">
                                <p className="text-[10px] text-slate-500">
                                    ✨ AI-generated content may require review and editing
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setShowAIGenerator(false)}
                                        disabled={isGenerating}
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl font-semibold border-2 text-sm px-4"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleAIGenerate}
                                        disabled={isGenerating || !aiTopic.trim()}
                                        size="sm"
                                        className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed px-6 text-sm"
                                    >
                                        {isGenerating ? (
                                            <span className="flex items-center gap-1.5">
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Generating...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5">
                                                <Sparkles className="w-4 h-4" />
                                                Generate Document
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EditorIntro;