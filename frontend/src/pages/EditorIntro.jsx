import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Upload, Search, Settings, Grid, ChevronRight, FileText, Clock, Star,
    Users, MoreVertical, ArrowRight, Trash2, Edit3, Copy, Download, Pin,
    PinOff, FolderOpen, Sparkles, BookOpen, Briefcase, Mail, AlignLeft,
    ListChecks, FileCode, ScrollText, X, Check, RefreshCw, Smile,
    Wand2, Feather, Newspaper, MessageSquare, Zap, ChevronLeft,
    SlidersHorizontal, Type, Globe, GraduationCap, Lightbulb, Heart,
    Target, Layers, CheckCircle2, ExternalLink
} from 'lucide-react';
import { Button } from '../components/athena-editor/components/ui/button';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useDocuments, useDeleteDocument } from '../hooks/useDocuments.js';
import { TextEditorService } from '../services/Text-Editor/text.service.js';
import { useAuth } from '../contexts/AuthContext';

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

const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) === 1 ? '' : 's'} ago`;
    return new Date(date).toLocaleDateString();
};

// ── ChatGPT-style Markdown Preview ───────────────────────────────────────────
const MarkdownPreview = ({ content }) => {
    const inlineFormat = (str) => str
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:0.85em;font-family:monospace;color:#d97706;">$1</code>')
        .replace(/~~(.+?)~~/g, '<del>$1</del>');

    const renderMarkdown = (text) => {
        if (!text) return [];
        const lines = text.split('\n');
        const elements = [];
        let i = 0;
        let listItems = [];
        let listType = null;
        let codeLines = [];
        let inCode = false;
        let codeLanguage = '';

        const flushList = () => {
            if (listItems.length === 0) return;
            if (listType === 'ol') {
                elements.push(
                    <ol key={`ol-${elements.length}`} style={{ paddingLeft: '1.5rem', margin: '0.5rem 0 0.75rem', lineHeight: 1.7 }}>
                        {listItems.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '0.25rem', color: '#374151', fontSize: '0.925rem' }}
                                dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
                        ))}
                    </ol>
                );
            } else {
                elements.push(
                    <ul key={`ul-${elements.length}`} style={{ paddingLeft: '1.5rem', margin: '0.5rem 0 0.75rem', listStyleType: 'disc', lineHeight: 1.7 }}>
                        {listItems.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '0.25rem', color: '#374151', fontSize: '0.925rem' }}
                                dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
                        ))}
                    </ul>
                );
            }
            listItems = [];
            listType = null;
        };

        while (i < lines.length) {
            const line = lines[i];

            // Code block fence
            if (line.startsWith('```')) {
                flushList();
                if (!inCode) {
                    inCode = true;
                    codeLanguage = line.slice(3).trim();
                    codeLines = [];
                } else {
                    inCode = false;
                    elements.push(
                        <div key={`code-${elements.length}`} style={{ margin: '1rem 0', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                            {codeLanguage && (
                                <div style={{ background: '#1e293b', padding: '5px 14px' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>{codeLanguage}</span>
                                </div>
                            )}
                            <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: '1rem', margin: 0, overflowX: 'auto', fontSize: '0.85rem', lineHeight: 1.6, fontFamily: 'monospace' }}>
                                <code>{codeLines.join('\n')}</code>
                            </pre>
                        </div>
                    );
                    codeLines = [];
                }
                i++; continue;
            }
            if (inCode) { codeLines.push(line); i++; continue; }

            // Horizontal rule
            if (/^---+$/.test(line.trim())) {
                flushList();
                elements.push(<hr key={`hr-${elements.length}`} style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1rem 0' }} />);
                i++; continue;
            }

            // Headings
            const h1 = line.match(/^# (.+)/);
            const h2 = line.match(/^## (.+)/);
            const h3 = line.match(/^### (.+)/);
            const h4 = line.match(/^#### (.+)/);
            if (h1) {
                flushList();
                elements.push(<h1 key={`h1-${elements.length}`} style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '1.4rem 0 0.4rem', lineHeight: 1.25, letterSpacing: '-0.02em' }} dangerouslySetInnerHTML={{ __html: inlineFormat(h1[1]) }} />);
                i++; continue;
            }
            if (h2) {
                flushList();
                elements.push(<h2 key={`h2-${elements.length}`} style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '1.25rem 0 0.35rem', lineHeight: 1.35, paddingBottom: '0.25rem', borderBottom: '1.5px solid #f1f5f9' }} dangerouslySetInnerHTML={{ __html: inlineFormat(h2[1]) }} />);
                i++; continue;
            }
            if (h3) {
                flushList();
                elements.push(<h3 key={`h3-${elements.length}`} style={{ fontSize: '0.975rem', fontWeight: 700, color: '#334155', margin: '1rem 0 0.25rem' }} dangerouslySetInnerHTML={{ __html: inlineFormat(h3[1]) }} />);
                i++; continue;
            }
            if (h4) {
                flushList();
                elements.push(<h4 key={`h4-${elements.length}`} style={{ fontSize: '0.925rem', fontWeight: 600, color: '#475569', margin: '0.8rem 0 0.2rem' }} dangerouslySetInnerHTML={{ __html: inlineFormat(h4[1]) }} />);
                i++; continue;
            }

            // Blockquote
            if (line.startsWith('> ')) {
                flushList();
                elements.push(
                    <blockquote key={`bq-${elements.length}`} style={{ borderLeft: '3px solid #f59e0b', paddingLeft: '1rem', margin: '0.75rem 0', color: '#64748b', fontStyle: 'italic', fontSize: '0.925rem', background: 'rgba(245,158,11,0.04)', borderRadius: '0 6px 6px 0', paddingTop: '0.4rem', paddingBottom: '0.4rem' }}
                        dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(2)) }} />
                );
                i++; continue;
            }

            // Ordered list
            const olMatch = line.match(/^(\d+)\.\s(.+)/);
            if (olMatch) {
                if (listType !== 'ol') { flushList(); listType = 'ol'; }
                listItems.push(olMatch[2]);
                i++; continue;
            }

            // Unordered list
            const ulMatch = line.match(/^[-*+]\s(.+)/);
            if (ulMatch) {
                if (listType !== 'ul') { flushList(); listType = 'ul'; }
                listItems.push(ulMatch[1]);
                i++; continue;
            }

            // Table
            if (line.startsWith('|') && lines[i + 1]?.match(/^\|[-| :]+\|$/)) {
                flushList();
                const headers = line.split('|').slice(1, -1).map(h => h.trim());
                const rows = [];
                i += 2;
                while (i < lines.length && lines[i].startsWith('|')) {
                    rows.push(lines[i].split('|').slice(1, -1).map(c => c.trim()));
                    i++;
                }
                elements.push(
                    <div key={`tbl-${elements.length}`} style={{ overflowX: 'auto', margin: '1rem 0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    {headers.map((h, hi) => (
                                        <th key={hi} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '2px solid #e5e7eb' }}
                                            dangerouslySetInnerHTML={{ __html: inlineFormat(h) }} />
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, ri) => (
                                    <tr key={ri} style={{ borderBottom: '1px solid #f1f5f9', background: ri % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        {row.map((cell, ci) => (
                                            <td key={ci} style={{ padding: '8px 12px', color: '#374151' }}
                                                dangerouslySetInnerHTML={{ __html: inlineFormat(cell) }} />
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
                continue;
            }

            // Empty line
            if (line.trim() === '') { flushList(); i++; continue; }

            // Paragraph
            flushList();
            elements.push(
                <p key={`p-${elements.length}`} style={{ fontSize: '0.925rem', lineHeight: 1.75, color: '#374151', margin: '0.4rem 0' }}
                    dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
            );
            i++;
        }

        flushList();
        return elements;
    };

    return (
        <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
            {renderMarkdown(content)}
        </div>
    );
};

const EditorIntro = () => {
    const [activeTab, setActiveTab] = useState('Recommended');
    const [searchQuery, setSearchQuery] = useState('');
    const [templateSearch, setTemplateSearch] = useState('');
    const [recentFilter, setRecentFilter] = useState('All');
    const [showUploadZone, setShowUploadZone] = useState(false);
    const [contextMenu, setContextMenu] = useState(null); // { docId, x, y }
    const [renameId, setRenameId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const fileInputRef = useRef(null);

    // 🚀 PRODUCTION-GRADE: Use React Query for document management
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    // Get proper user ID from auth context
    const currentUserId = React.useMemo(() => {
        return user?._id || user?.id || user?.user?._id || user?.user?.id;
    }, [user]);

    const {
        data: documents = [],
        isLoading,
        refetch,
        isError,
        error
    } = useDocuments(currentUserId);

    
    // Mutation for delete
    const deleteDocumentMutation = useDeleteDocument();

    // Manual refresh function
    const handleManualRefresh = async () => {
        await refetch();
        toast.success('Documents refreshed');
    };

    // AI Document Generator Modal State
    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiContentType, setAiContentType] = useState('document');
    const [aiLength, setAiLength] = useState('medium');
    const [aiTonality, setAiTonality] = useState('professional');
    const [isGenerating, setIsGenerating] = useState(false);
    const [genStep, setGenStep] = useState('config');      // 'config' | 'generating' | 'done'
    const [genProgress, setGenProgress] = useState(0);    // 0-100
    const [genPhaseLabel, setGenPhaseLabel] = useState('');
    const [generatedDocId, setGeneratedDocId] = useState(null);
    const [generatedDocTitle, setGeneratedDocTitle] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [wordCount, setWordCount] = useState(0);
    const [aiStep, setAiStep] = useState(1); // wizard step 1 or 2

    // 🚀 PRODUCTION-GRADE: React Query handles all data fetching automatically
    // No more polling! Data is fresh for 5 minutes (staleTime)

    // Optional: Refetch when page becomes visible (better than polling)
    /*
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Only refetch if data is stale (older than 5 min)
                refetch();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [refetch]);

    // Optional: Listen for storage events from other tabs
    React.useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'athena_document_refresh') {
                queryClient.invalidateQueries({ queryKey: ['documents'] });
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [queryClient]);
    */

    const openEditor = async (templateType = 'blank', docId = null) => {
        if (docId) {
            // MongoDB ID validation (24 character hex string)
            const isMongoId = /^[0-9a-fA-F]{24}$/.test(docId);

            try {
                let doc;
                if (isMongoId) {
                    // Load from backend directly ONCE - editor won't fetch again
                    const response = await TextEditorService.getDocumentById(docId);
                    doc = response.document || response;
                    
                    // Store document data in sessionStorage for the editor to use
                    sessionStorage.setItem(`doc_${docId}`, JSON.stringify(doc));
                } else {
                    // Invalid document ID format
                    console.error('Invalid document ID format:', docId);
                    toast.error('Document not found or invalid ID');
                    return;
                }

                // Open editor with just the ID - no need to pass data in URL
                const finalId = doc.id || doc._id || docId;
                const windowUrl = `/editor/${finalId}`;
                window.open(windowUrl, '_blank');
                return; // 🚀 CRITICAL: DO NOT execute the default blank editor open below

                // Update cache with new lastOpened time
                queryClient.setQueryData(['documents'], oldDocs =>
                    oldDocs.map(d =>
                        d.id === docId ? { ...d, lastOpened: Date.now() } : d
                    )
                );
            } catch (error) {
                console.error('Failed to load document:', error);
                // Silently fail - don't show error toast to user
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
            // Update cache only
            queryClient.setQueryData(['documents'], old => [newDoc, ...(old || [])]);
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
                queryClient.setQueryData(['documents'], old => [newDoc, ...(old || [])]);
                toast.success(`"${file.name}" imported`);
            };
            reader.readAsText(file);
        });
        setShowUploadZone(false);
    };

    const deleteDoc = async (id) => {
        if (!window.confirm('Delete this document?')) return;

        try {
            // Use React Query mutation with optimistic updates
            await deleteDocumentMutation.mutateAsync(id);

            // Trigger refresh across all tabs
            localStorage.setItem('athena_document_refresh', Date.now().toString());

            toast.success('Document deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete document: ' + (error.message || 'Unknown error'));
        }

        setContextMenu(null);
    };

    const pinDoc = (id) => {
        queryClient.setQueryData(['documents'], old =>
            old.map(d => d.id === id ? { ...d, pinned: !d.pinned } : d)
        );
        setContextMenu(null);
    };

    const duplicateDoc = (id) => {
        const doc = documents.find(d => d.id === id);
        if (!doc) return;
        const copy = { ...doc, id: `doc_${Date.now()}`, title: `${doc.title} (copy)`, createdAt: Date.now(), lastOpened: Date.now(), pinned: false, slideCount: doc.slideCount };
        queryClient.setQueryData(['documents'], old => [copy, ...(old || [])]);
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
        setGenStep('generating');
        setGenProgress(0);
        setGenPhaseLabel('Preparing your document…');

        try {
            // Import AI utils for document generation
            const { generateDocument } = await import('../components/athena-editor/ai/aiUtils.js');

            // Enhanced prompt engineering with structured output requirements
            const lengthConfig = {
                short: { words: 300, pages: 1, detail: 'concise overview' },
                medium: { words: 600, pages: 2, detail: 'moderate detail' },
                long: { words: 1200, pages: 3, detail: 'comprehensive coverage' },
                custom: { words: 800, pages: 2, detail: 'appropriate depth' }
            };

            const contentTypeEnhancements = {
                document: {
                    structure: '# Title\n\n## Executive Summary\n\n## Main Content\n\n## Key Takeaways\n\n## Conclusion',
                    elements: ['Clear headings', 'Bullet points for key information', 'Numbered lists for sequences', 'Bold text for emphasis'],
                    formatting: 'Use H1 for title, H2 for main sections, H3 for subsections'
                },
                essay: {
                    structure: '# Essay Title\n\n## Introduction\n- Hook\n- Background\n- Thesis Statement\n\n## Body Paragraph 1\n\n## Body Paragraph 2\n\n## Body Paragraph 3\n\n## Counterargument & Rebuttal\n\n## Conclusion',
                    elements: ['Strong thesis statement', 'Topic sentences', 'Supporting evidence', 'Smooth transitions', 'Proper citations if needed'],
                    formatting: 'Academic tone, formal language, third-person perspective'
                },
                report: {
                    structure: '# Report Title\n\n## Executive Summary\n\n## Introduction\n\n## Methodology / Approach\n\n## Findings / Analysis\n\n## Recommendations\n\n## Implementation Plan\n\n## Conclusion',
                    elements: ['Executive summary', 'Data-driven insights', 'Actionable recommendations', 'Timeline/milestones', 'Risk assessment'],
                    formatting: 'Professional business format, use tables where applicable'
                },
                article: {
                    structure: '# Catchy Title\n\n## Introduction (Hook + Context)\n\n## Main Point 1\n\n## Main Point 2\n\n## Main Point 3\n\n## Practical Tips / Examples\n\n## Conclusion + Call to Action',
                    elements: ['Engaging headline', 'Compelling intro', 'Subheadings every 2-3 paragraphs', 'Examples/case studies', 'Actionable takeaways'],
                    formatting: 'Conversational yet informative, use pull quotes'
                },
                story: {
                    structure: '# Story Title\n\n## Chapter/Scene 1: Setup\n\n## Chapter/Scene 2: Conflict\n\n## Chapter/Scene 3: Resolution\n\n## Epilogue (optional)',
                    elements: ['Character development', 'Setting description', 'Dialogue where appropriate', 'Plot progression', 'Emotional arc'],
                    formatting: 'Narrative style, show don\'t tell, sensory details'
                },
                poem: {
                    structure: '# Poem Title\n\n[Stanza 1]\n\n[Stanza 2]\n\n[Stanza 3]',
                    elements: ['Imagery', 'Metaphors/similes', 'Rhythm/rhyme scheme', 'Emotional resonance'],
                    formatting: 'Poetic structure with intentional line breaks'
                }
            };

            const tonalityEnhancements = {
                professional: {
                    voice: 'Formal and authoritative',
                    vocabulary: 'Industry-standard terminology',
                    sentenceStructure: 'Complete sentences, varied length',
                    avoid: 'Slang, contractions, overly casual language'
                },
                casual: {
                    voice: 'Friendly and approachable',
                    vocabulary: 'Everyday language',
                    sentenceStructure: 'Mix of short and medium sentences',
                    allow: 'Contractions, rhetorical questions, personal pronouns'
                },
                academic: {
                    voice: 'Scholarly and objective',
                    vocabulary: 'Technical terms with definitions',
                    sentenceStructure: 'Complex sentences with subordinate clauses',
                    require: 'Citations, evidence-based claims, hedging language'
                },
                creative: {
                    voice: 'Expressive and imaginative',
                    vocabulary: 'Vivid, descriptive words',
                    sentenceStructure: 'Varied for rhythm and flow',
                    techniques: 'Metaphors, similes, personification, alliteration'
                },
                persuasive: {
                    voice: 'Confident and compelling',
                    vocabulary: 'Power words, emotional triggers',
                    sentenceStructure: 'Short, punchy sentences mixed with longer explanations',
                    techniques: 'Rule of three, rhetorical questions, calls to action'
                },
                informative: {
                    voice: 'Clear and educational',
                    vocabulary: 'Accessible but accurate',
                    sentenceStructure: 'Straightforward, logical progression',
                    focus: 'Facts, data, step-by-step explanations'
                }
            };

            const config = lengthConfig[aiLength];
            const contentType = contentTypeEnhancements[aiContentType];
            const tonality = tonalityEnhancements[aiTonality];

            // Build enhanced prompt with structured output requirements
            const enhancedPrompt = `You are an expert ${aiContentType} writer known for producing high-quality, well-structured content.

## TASK
${contentType.structure.split('\n')[0].replace('# ', '')} about: "${aiTopic}"

## REQUIRED STRUCTURE
Follow this exact structure:
${contentType.structure}

## CONTENT REQUIREMENTS
- **Length**: Approximately ${config.words} words (${config.pages} page${config.pages > 1 ? 's' : ''})
- **Detail Level**: ${config.detail}
- **Voice**: ${tonality.voice}
- **Vocabulary**: ${tonality.vocabulary}
- **Sentence Structure**: ${tonality.sentenceStructure}
${tonality.avoid ? `- **Avoid**: ${tonality.avoid}` : ''}
${tonality.allow ? `- **You May Use**: ${tonality.allow}` : ''}
${tonality.require ? `- **Required**: ${tonality.require}` : ''}
${tonality.techniques ? `- **Literary Techniques**: ${tonality.techniques}` : ''}

## FORMATTING RULES
✅ Use proper Markdown formatting throughout
✅ ${contentType.formatting}
✅ Include these elements: ${contentType.elements.join(', ')}
✅ Use bold (**text**) for key terms and important points
✅ Use bullet points (- item) for lists
✅ Use numbered lists (1. item) for sequences
✅ Use horizontal rules (---) to separate major sections
✅ Use blockquotes (> text) for important quotes or highlights
✅ Use code blocks (\`\`\`) only for actual code examples
✅ Use tables for comparisons when appropriate

## QUALITY STANDARDS
- Start with a compelling title (H1)
- Write an engaging introduction that hooks the reader
- Use clear topic sentences for each paragraph
- Include smooth transitions between sections
- Provide concrete examples where relevant
- End with a strong conclusion
- Ensure logical flow and coherence
- Maintain consistent tone throughout
- Fact-check any claims or data
- Proofread for grammar and spelling

## OUTPUT FORMAT
Output ONLY the formatted content. No preamble, no "Here is your document", no explanations about what you're writing. Just the beautifully formatted ${aiContentType} itself.`;

            console.log('🤖 Generating AI document with enhanced prompt engineering:', {
                topic: aiTopic,
                contentType: aiContentType,
                length: `${config.words} words (${config.detail})`,
                tonality: tonality.voice,
                structure: contentType.structure.split('\n').filter(s => s.trim()).length + ' sections'
            });

            // Animate through generation phases
            setGenProgress(15); setGenPhaseLabel('Analysing your topic…');
            await new Promise(r => setTimeout(r, 400));
            setGenProgress(35); setGenPhaseLabel('Structuring content…');
            await new Promise(r => setTimeout(r, 300));
            setGenProgress(55); setGenPhaseLabel('Writing your document…');

            // Generate content using AI via backend API with enhanced prompt
            const generatedContent = await generateDocument({
                topic: enhancedPrompt,
                pages: config.pages,
                tone: aiTonality,
                type: aiContentType,
                temperature: aiTonality === 'creative' ? 0.8 : aiTonality === 'academic' ? 0.5 : 0.7,
                audience: aiTonality === 'professional' ? 'Business professionals and executives' :
                    aiTonality === 'academic' ? 'Researchers and academics' :
                        aiTonality === 'casual' ? 'General audience' : 'Educated readers',
                keyPoints: contentType.elements
            });

            // Count words for the done screen
            const wc = generatedContent.replace(/[#*`>\-]/g, '').split(/\s+/).filter(Boolean).length;
            setWordCount(wc);
            setGeneratedContent(generatedContent);
            setGenProgress(80); setGenPhaseLabel('Saving to your workspace…');
            await new Promise(r => setTimeout(r, 300));

            // Create new document with generated content
            const response = await TextEditorService.saveDocument({
                title: `${aiContentType.charAt(0).toUpperCase() + aiContentType.slice(1)}: ${aiTopic.substring(0, 40)}${aiTopic.length > 40 ? '...' : ''}`,
                data: {
                    content: generatedContent,
                    html: generatedContent
                }
            });

            // Backend /save returns: { message, documentId }
            // Fall back to .id or ._id for robustness
            const documentId = String(response.documentId || response.id || response._id || '');

            console.log('📄 Document saved with ID:', documentId);
            console.log('📊 Full response:', response);

            if (!documentId) {
                toast.error('Failed to get document ID from backend');
                setIsGenerating(false);
                return;
            }

            const docTitle = `${aiContentType.charAt(0).toUpperCase() + aiContentType.slice(1)}: ${aiTopic.substring(0, 40)}${aiTopic.length > 40 ? '...' : ''}`;

            const newDoc = {
                id: documentId,
                mongoBackendId: documentId,
                title: docTitle,
                content: generatedContent,
                createdAt: Date.now(),
                lastOpened: Date.now(),
                template: 'ai-generated',
                pinned: false,
                slideCount: 0
            };

            // Update cache manually to show new doc immediately
            queryClient.setQueryData(['documents'], old => [newDoc, ...(old || [])]);

            setGenProgress(100); setGenPhaseLabel('Done!');
            setGeneratedDocId(documentId);
            setGeneratedDocTitle(newDoc.title);
            setGenStep('done');
            toast.success('✨ Document ready!');
            // Don't close modal — show the done state so user can click Open

            // Editor will be opened from the done state UI

        } catch (error) {
            console.error('AI Generation error:', error);
            setGenStep('config');
            toast.error(error.message?.includes('API')
                ? 'AI service unavailable. Please check your API configuration.'
                : 'Failed to generate content. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const saveRename = () => {
        queryClient.setQueryData(['documents'], old =>
            old.map(d => d.id === renameId ? { ...d, title: renameValue || d.title } : d)
        );
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
                                onClick={handleManualRefresh}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-sm font-semibold transition-all disabled:opacity-50"
                                title="Refresh documents list"
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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
                                            {/* Document type badge */}
                                            <div className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border ${
                                                doc.template === 'ai-generated'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                    : 'bg-blue-50 text-blue-700 border-blue-100'
                                            }`}>
                                                {doc.template === 'ai-generated'
                                                    ? <><Sparkles className="w-3.5 h-3.5" /> AI</>
                                                    : doc.slideCount
                                                        ? <><Grid className="w-3.5 h-3.5" /> {doc.slideCount} Slides</>
                                                        : <><Grid className="w-3.5 h-3.5" /> {(doc.template && doc.template !== 'blank') ? doc.template : 'Document'}</>
                                                }
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

            {/* ══ AI Document Generator Modal ══════════════════════════════ */}
            <AnimatePresence>
                {showAIGenerator && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(10px)' }}
                        onClick={() => !isGenerating && setShowAIGenerator(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.94, opacity: 0, y: 24 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.94, opacity: 0, y: 16 }}
                            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                            className="w-full max-w-md max-h-[90vh] flex flex-col rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-200"
                            style={{ background: '#ffffff' }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* ── Generating State ─────────────────────────── */}
                            {genStep === 'generating' && (
                                <div className="flex flex-col items-center justify-center py-6 px-8 gap-5 text-center flex-1 overflow-y-auto custom-scrollbar">
                                    {/* Animated orb */}
                                    <div className="relative w-28 h-28 shrink-0">
                                        <motion.div
                                            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                            className="absolute inset-0 rounded-full"
                                            style={{ background: 'radial-gradient(circle, #f59e0b 0%, #f97316 50%, #ec4899 100%)', filter: 'blur(18px)' }}
                                        />
                                        <div className="relative w-28 h-28 rounded-full flex items-center justify-center"
                                            style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316,#ec4899)' }}>
                                            <Wand2 className="w-12 h-12 text-white" />
                                        </div>
                                        {/* Orbit ring */}
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                            className="absolute -inset-3 rounded-full"
                                            style={{ border: '2px dashed rgba(245,158,11,0.4)' }}
                                        />
                                    </div>

                                    <div className="space-y-2.5 w-full max-w-[280px]">
                                        <h3 className="text-[17px] font-bold text-slate-900">Creating your document</h3>
                                        <p className="text-sm font-medium" style={{ color: '#f59e0b' }}>{genPhaseLabel}</p>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full max-w-sm space-y-2 shrink-0">
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{ background: 'linear-gradient(90deg,#f59e0b,#f97316,#ec4899)' }}
                                                animate={{ width: `${genProgress}%` }}
                                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                            />
                                        </div>
                                        <p className="text-xs text-right" style={{ color: 'rgba(0,0,0,0.3)' }}>{genProgress}%</p>
                                    </div>

                                    {/* Animated dots */}
                                    <div className="flex gap-2 shrink-0">
                                        {[0, 1, 2].map(i => (
                                            <motion.div key={i}
                                                animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
                                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                                className="w-2 h-2 rounded-full"
                                                style={{ background: '#f59e0b' }}
                                            />
                                        ))}
                                    </div>

                                    {/* Topic preview */}
                                    <div className="max-w-sm px-5 py-3 rounded-2xl text-center shrink-0"
                                        style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                        <p className="text-xs" style={{ color: 'rgba(0,0,0,0.4)' }}>Writing about</p>
                                        <p className="text-sm font-semibold text-slate-900 mt-0.5 line-clamp-2">{aiTopic}</p>
                                    </div>
                                </div>
                            )}

                            {/* ── Done State ───────────────────────────────── */}
                            {genStep === 'done' && (
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    {/* ── Top success bar ── */}
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35 }}
                                        className="shrink-0 px-5 pt-4 pb-3 flex items-center justify-between gap-3"
                                        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'linear-gradient(135deg,rgba(34,197,94,0.06),rgba(245,158,11,0.04))' }}
                                    >
                                        {/* Left: icon + title */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative shrink-0">
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                                                    className="w-9 h-9 rounded-full flex items-center justify-center"
                                                    style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}
                                                >
                                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                                </motion.div>
                                                {[0,1,2,3].map(i => (
                                                    <motion.div key={i}
                                                        initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                                                        animate={{ scale: 1, x: Math.cos((i/4)*Math.PI*2)*22, y: Math.sin((i/4)*Math.PI*2)*22, opacity: 0 }}
                                                        transition={{ duration: 0.6, delay: 0.15 }}
                                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                                                        style={{ background: i % 2 === 0 ? '#f59e0b' : '#22c55e' }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">✨ Document Ready!</p>
                                                <p className="text-[11px] truncate" style={{ color: 'rgba(0,0,0,0.4)' }}>{generatedDocTitle}</p>
                                            </div>
                                        </div>
                                        {/* Right: stats + actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {[
                                                { icon: Type, label: `~${wordCount.toLocaleString()} words` },
                                                { icon: Layers, label: aiContentType.charAt(0).toUpperCase() + aiContentType.slice(1) },
                                                { icon: Target, label: aiTonality.charAt(0).toUpperCase() + aiTonality.slice(1) },
                                            ].map(({ icon: Icon, label }) => (
                                                <div key={label} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                                                    style={{ background: 'rgba(0,0,0,0.04)', color: 'rgba(0,0,0,0.55)' }}>
                                                    <Icon className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                                                    {label}
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    setShowAIGenerator(false);
                                                    setGenStep('config');
                                                    setAiTopic(''); setAiContentType('document');
                                                    setAiLength('medium'); setAiTonality('professional');
                                                    setAiStep(1); setGeneratedContent('');
                                                }}
                                                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                                                style={{ background: 'rgba(0,0,0,0.05)', color: 'rgba(0,0,0,0.55)' }}
                                            >
                                                New
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const url = `/editor/${generatedDocId}?docId=${generatedDocId}`;
                                                    const win = window.open(url, '_blank', 'noopener,noreferrer');
                                                    if (!win) toast.info('Allow popups to open the editor');
                                                    setShowAIGenerator(false);
                                                    setGenStep('config');
                                                }}
                                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-xs transition-all hover:opacity-90"
                                                style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#fff', boxShadow: '0 3px 12px rgba(245,158,11,0.35)' }}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                Open in Editor
                                            </button>
                                        </div>
                                    </motion.div>

                                    {/* ── Content preview (ChatGPT-style) ── */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2, duration: 0.4 }}
                                        className="flex-1 overflow-y-auto"
                                        style={{ background: '#fff' }}
                                    >
                                        {/* Document paper */}
                                        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 2.5rem 3rem' }}>
                                            {/* Paper header accent */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                                                <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: 'linear-gradient(180deg,#f59e0b,#f97316)' }} />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                    AI Generated · {aiTonality.charAt(0).toUpperCase() + aiTonality.slice(1)} tone
                                                </span>
                                            </div>
                                            {/* Rendered markdown */}
                                            <MarkdownPreview content={generatedContent} />
                                        </div>
                                    </motion.div>

                                    {/* ── Bottom mobile action bar ── */}
                                    <div className="md:hidden shrink-0 px-5 py-3 flex gap-2"
                                        style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                        <button
                                            onClick={() => {
                                                setShowAIGenerator(false);
                                                setGenStep('config');
                                                setAiTopic(''); setAiContentType('document');
                                                setAiLength('medium'); setAiTonality('professional');
                                                setAiStep(1); setGeneratedContent('');
                                            }}
                                            className="flex-1 h-10 rounded-2xl font-semibold text-sm transition-all"
                                            style={{ background: 'rgba(0,0,0,0.05)', color: 'rgba(0,0,0,0.6)' }}
                                        >
                                            Create Another
                                        </button>
                                        <button
                                            onClick={() => {
                                                const url = `/editor/${generatedDocId}?docId=${generatedDocId}`;
                                                const win = window.open(url, '_blank', 'noopener,noreferrer');
                                                if (!win) toast.info('Allow popups to open the editor');
                                                setShowAIGenerator(false);
                                                setGenStep('config');
                                            }}
                                            className="flex-1 h-10 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                                            style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#fff', boxShadow: '0 4px 20px rgba(245,158,11,0.4)' }}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Open in Editor
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── Config State (wizard) ─────────────────────── */}
                            {genStep === 'config' && (
                                <>
                                    {/* Header gradient bar */}
                                    <div className="relative px-6 pt-5 pb-3.5 shrink-0"
                                        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(249,115,22,0.08) 50%, rgba(236,72,153,0.06) 100%)' }}>
                                        <div className="absolute inset-0 opacity-5"
                                            style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #f59e0b 0%, transparent 60%), radial-gradient(circle at 80% 20%, #ec4899 0%, transparent 50%)' }} />
                                        <div className="relative flex items-center justify-between">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                    style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}>
                                                    <Sparkles className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">Create with AI</h2>
                                                    <p className="text-xs mt-0.5" style={{ color: 'rgba(0,0,0,0.45)' }}>
                                                        Step {aiStep} of 2 — {aiStep === 1 ? 'Your topic & type' : 'Style & length'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {/* Step indicators */}
                                                <div className="flex gap-1.5">
                                                    {[1, 2].map(s => (
                                                        <div key={s} className="w-8 h-1 rounded-full transition-all"
                                                            style={{ background: aiStep >= s ? 'linear-gradient(90deg,#f59e0b,#f97316)' : 'rgba(0,0,0,0.1)' }} />
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => setShowAIGenerator(false)}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                                                    style={{ background: 'rgba(0,0,0,0.04)' }}
                                                >
                                                    <X className="w-4 h-4 text-slate-600" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                                        {/* Step 1 — Topic + Type */}
                                        <AnimatePresence mode="wait">
                                            {aiStep === 1 && (
                                                <motion.div key="step1"
                                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                                    className="px-6 py-4 space-y-4">

                                                    {/* Topic textarea */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.4)' }}>
                                                            What's your document about?
                                                        </label>
                                                        <div className="relative">
                                                            <textarea
                                                                value={aiTopic}
                                                                onChange={(e) => setAiTopic(e.target.value.slice(0, 500))}
                                                                placeholder="e.g. A business proposal for a new renewable energy project in Southeast Asia..."
                                                                className="w-full h-22 p-4 rounded-xl text-sm transition-all focus:ring-2 focus:ring-orange-500/20 resize-none custom-scrollbar"
                                                                style={{
                                                                    background: 'rgba(0,0,0,0.02)',
                                                                    border: aiTopic.trim() ? '1.5px solid rgba(245,158,11,0.5)' : '1.5px solid rgba(0,0,0,0.06)',
                                                                    color: '#0f172a',
                                                                    caretColor: '#f59e0b',
                                                                }}
                                                                onFocus={e => e.target.style.border = '1.5px solid rgba(245,158,11,0.6)'}
                                                                onBlur={e => e.target.style.border = aiTopic.trim() ? '1.5px solid rgba(245,158,11,0.5)' : '1.5px solid rgba(0,0,0,0.06)'}
                                                            />
                                                            <div className="absolute bottom-3 right-3 text-[10px] font-medium"
                                                                style={{ color: aiTopic.length > 200 ? '#f97316' : 'rgba(0,0,0,0.2)' }}>
                                                                {aiTopic.length}/500
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Content type grid */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.4)' }}>
                                                            Document type
                                                        </label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {[
                                                                { id: 'document', label: 'Document', icon: FileText, desc: 'Standard professional doc' },
                                                                { id: 'resume', label: 'Resume', icon: Briefcase, desc: 'Career & professional bio' },
                                                                { id: 'report', label: 'Summary', icon: ScrollText, desc: 'Condensed key insights' },
                                                                { id: 'newsletter', label: 'Newsletter', icon: Mail, desc: 'Update & announcement' },
                                                            ].map(({ id, label, icon: Icon, desc }) => {
                                                                const active = aiContentType === id;
                                                                return (
                                                                    <button 
                                                                        key={id} 
                                                                        onClick={() => setAiContentType(id)}
                                                                        className={`relative p-4 rounded-2xl border-2 transition-all ${active ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:border-amber-300'}`}
                                                                    >
                                                                        <div className="absolute inset-0 rounded-2xl opacity-20"
                                                                            style={{ background: 'radial-gradient(circle at 50% 0%, #f59e0b, transparent 70%)' }} />
                                                                        <Icon className="w-5 h-5 relative z-10 transition-colors"
                                                                            style={{ color: active ? '#f59e0b' : 'rgba(0,0,0,0.4)' }} />
                                                                        <div className="relative z-10">
                                                                            <p className="text-[12px] font-bold"
                                                                                style={{ color: active ? '#d97706' : 'rgba(0,0,0,0.7)' }}>
                                                                                {label}
                                                                            </p>
                                                                            <p className="text-[10px] mt-0.5"
                                                                                style={{ color: 'rgba(0,0,0,0.35)' }}>
                                                                                {desc}
                                                                            </p>
                                                                        </div>
                                                                        { active && (
                                                                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                                                                                style={{ background: '#f59e0b' }}>
                                                                                <Check className="w-2.5 h-2.5 text-white" />
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                    </motion.div>
                                )}

                                        {/* Step 2 — Length + Tonality */}
                                        {aiStep === 2 && (
                                            <motion.div key="step2"
                                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                                className="px-6 py-4 space-y-4">

                                                {/* Topic recap */}
                                                <div className="flex items-start gap-3 px-4 py-3 rounded-2xl"
                                                    style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                                                    <Sparkles className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#f59e0b' }} />
                                                    <p className="text-sm line-clamp-2" style={{ color: 'rgba(0,0,0,0.6)' }}>{aiTopic}</p>
                                                </div>

                                                {/* Length */}
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.4)' }}>
                                                        Length
                                                    </label>
                                                    <div className="grid grid-cols-3 gap-2.5">
                                                        {[
                                                            { id: 'short', label: 'Short', words: '~300', pages: '1 page', bar: 'w-1/3' },
                                                            { id: 'medium', label: 'Medium', words: '~600', pages: '2 pages', bar: 'w-2/3' },
                                                            { id: 'long', label: 'Long', words: '~1200', pages: '3+ pages', bar: 'w-full' },
                                                        ].map(({ id, label, words, pages, bar }) => {
                                                            const active = aiLength === id;
                                                            return (
                                                                <button key={id} onClick={() => setAiLength(id)}
                                                                    className="relative flex flex-col gap-2 px-3.5 py-3 rounded-2xl text-left transition-all"
                                                                    style={{
                                                                        background: active ? 'rgba(245,158,11,0.08)' : 'rgba(0,0,0,0.02)',
                                                                        border: active ? '1.5px solid rgba(245,158,11,0.4)' : '1.5px solid rgba(0,0,0,0.05)',
                                                                    }}
                                                                >
                                                                    <p className="text-sm font-bold" style={{ color: active ? '#d97706' : 'rgba(0,0,0,0.7)' }}>
                                                                        {label}
                                                                    </p>
                                                                    {/* Mini bar visualisation */}
                                                                    <div className="h-1 w-full rounded-full" style={{ background: 'rgba(0,0,0,0.05)' }}>
                                                                        <div className={`h-full rounded-full ${bar}`}
                                                                            style={{ background: active ? 'linear-gradient(90deg,#f59e0b,#f97316)' : 'rgba(0,0,0,0.15)' }} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[11px] font-semibold" style={{ color: active ? '#f59e0b' : 'rgba(0,0,0,0.45)' }}>{words} words</p>
                                                                        <p className="text-[10px]" style={{ color: 'rgba(0,0,0,0.3)' }}>{pages}</p>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Tonality */}
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.4)' }}>
                                                        Tonality
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                            { id: 'professional', label: 'Professional', icon: Briefcase, color: '#60a5fa' },
                                                            { id: 'casual', label: 'Casual', icon: MessageSquare, color: '#34d399' },
                                                            { id: 'academic', label: 'Academic', icon: GraduationCap, color: '#a78bfa' },
                                                            { id: 'creative', label: 'Creative', icon: Feather, color: '#f472b6' },
                                                            { id: 'persuasive', label: 'Persuasive', icon: Zap, color: '#fb923c' },
                                                            { id: 'informative', label: 'Informative', icon: Lightbulb, color: '#facc15' },
                                                        ].map(({ id, label, icon: Icon, color }) => {
                                                            const active = aiTonality === id;
                                                            return (
                                                                <button key={id} onClick={() => setAiTonality(id)}
                                                                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
                                                                    style={{
                                                                        background: active ? `${color}10` : 'rgba(0,0,0,0.02)',
                                                                        border: active ? `1.5px solid ${color}40` : '1.5px solid rgba(0,0,0,0.05)',
                                                                    }}
                                                                >
                                                                    <Icon className="w-4 h-4 shrink-0" style={{ color: active ? color : 'rgba(0,0,0,0.3)' }} />
                                                                    <span className="text-[12px] font-semibold" style={{ color: active ? color : 'rgba(0,0,0,0.5)' }}>
                                                                        {label}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Footer nav */}
                                <div className="px-6 pb-5 pt-1.5 flex items-center justify-between gap-3 shrink-0"
                                    style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                    <div className="flex items-center gap-2">
                                        {aiStep === 2 && (
                                            <button onClick={() => setAiStep(1)}
                                                className="flex items-center gap-1.5 px-4 h-10 rounded-2xl text-sm font-semibold transition-all"
                                                style={{ background: 'rgba(0,0,0,0.04)', color: 'rgba(0,0,0,0.6)' }}>
                                                <ChevronLeft className="w-4 h-4" /> Back
                                            </button>
                                        )}
                                        <p className="text-[11px]" style={{ color: 'rgba(0,0,0,0.3)' }}>
                                            ✨ AI-generated content may require review
                                        </p>
                                    </div>
                                    <div className="flex gap-2.5">
                                        {aiStep === 1 ? (
                                            <button
                                                onClick={() => { if (aiTopic.trim()) setAiStep(2); else toast.error('Please enter a topic first'); }}
                                                className="flex items-center gap-2 px-6 h-10 rounded-2xl font-bold text-sm transition-all hover:opacity-90"
                                                style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#fff', boxShadow: '0 4px 16px rgba(245,158,11,0.35)' }}>
                                                Continue <ChevronRight className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleAIGenerate}
                                                disabled={isGenerating || !aiTopic.trim()}
                                                className="flex items-center gap-2 px-6 h-10 rounded-2xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40"
                                                style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#fff', boxShadow: '0 4px 16px rgba(245,158,11,0.35)' }}>
                                                <Wand2 className="w-4 h-4" />
                                                Generate
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);
};


export default EditorIntro;