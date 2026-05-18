import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Upload, Search, Settings, Grid, ChevronRight, FileText, Clock, Star,
    Users, MoreVertical, ArrowRight, Trash2, Edit3, Copy, Download, Pin,
    PinOff, FolderOpen, Sparkles, BookOpen, Briefcase, Mail, AlignLeft,
    ListChecks, FileCode, ScrollText, X, Check, RefreshCw, Smile,
    Wand2, Feather, Newspaper, MessageSquare, Zap, ChevronLeft, ChevronDown, ChevronUp,
    SlidersHorizontal, Type, Globe, GraduationCap, Lightbulb, Heart,
    Target, Layers, CheckCircle2, ExternalLink, PenLine, FileSpreadsheet, Megaphone,
    AlertCircle, Loader2, FileUp, BookMarked, LayoutTemplate,
} from 'lucide-react';
import { Button } from '../components/athena-editor/components/ui/button';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useDocuments, useDeleteDocument } from '../hooks/useDocuments.js';
import { TextEditorService } from '../services/Text-Editor/text.service.js';
import { useAuth } from '../contexts/AuthContext';
import { TEMPLATES as SIDEBAR_TEMPLATES } from '../components/athena-editor/components/editor/TemplateSidebar.jsx';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DocumentImporter } from '../utils/documentImporter';

// ── Template content map ──────────────────────────────────────────────────────
const TEMPLATE_CONTENT = {
    blank: '',
    resume: `<h1>Your Name</h1><p><strong>Email:</strong> you@email.com | <strong>Phone:</strong> +1 555-000-0000 | <strong>Location:</strong> City, State</p><h2>Summary</h2><p>Experienced professional with a track-record of delivering results...</p><h2>Experience</h2><p><strong>Senior Engineer</strong> — Acme Corp (2020–Present)</p><ul><li>Led cross-functional team of 8 engineers</li><li>Improved system performance by 40%</li></ul><h2>Education</h2><p><strong>B.S. Computer Science</strong> — State University (2016)</p><h2>Skills</h2><p>JavaScript, React, Node.js, Python, SQL, Leadership</p>`,
    report: `<h1>Project Proposal</h1><p><em>Prepared by: [Your Name] · Date: ${new Date().toLocaleDateString()}</em></p><h2>Executive Summary</h2><p>This proposal outlines the plan for [Project Name], which aims to [primary goal]...</p><h2>Problem Statement</h2><p>Currently, [describe the problem your project solves]...</p><h2>Proposed Solution</h2><p>We propose to [describe your solution]...</p><h2>Timeline</h2><p><strong>Phase 1:</strong> Research & Planning — 2 weeks</p><p><strong>Phase 2:</strong> Development — 6 weeks</p><p><strong>Phase 3:</strong> Testing & Launch — 2 weeks</p><h2>Budget</h2><p>Estimated total: $00,000</p>`,
    letter: `<p>${new Date().toLocaleDateString()}</p><br/><p>[Recipient Name]<br/>[Company]<br/>[Address]</p><br/><p>Dear [Name],</p><p>I am writing to [purpose of the letter]. I hope this letter finds you well.</p><p>[Body paragraph 1]</p><p>[Body paragraph 2]</p><p>Thank you for your time and consideration. Please do not hesitate to contact me at [your contact information].</p><br/><p>Sincerely,</p><p>[Your Name]<br/>[Title]</p>`,
    newsletter: `<h1>Monthly Newsletter</h1><p><em>${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Edition</em></p><h2>Highlights This Month</h2><p>Here are the top stories from our team...</p><h2>Key Metrics</h2><p>• Users: 10,000+<br/>• Engagement: ↑ 23%<br/>• Revenue: ↑ 15%</p><h2>What's Coming Next</h2><p>Stay tuned for exciting updates including...</p><h2>Stay Connected</h2><p>Follow us on social media and subscribe to our newsletter for more updates.</p>`,
    meeting: `<h1>Meeting Notes</h1><p><strong>Date:</strong> ${new Date().toLocaleDateString()} | <strong>Attendees:</strong> [Names]</p><h2>Agenda</h2><ol><li>Review last week's action items</li><li>Project status update</li><li>New business</li></ol><h2>Discussion</h2><p>[Key points discussed]</p><h2>Action Items</h2><ul><li>[ ] [Person] — [Task] — Due: [Date]</li><li>[ ] [Person] — [Task] — Due: [Date]</li></ul><h2>Next Meeting</h2><p>[Date and time of next meeting]</p>`,
    essay: `<h1>Essay Title</h1><p><em>By [Author Name]</em></p><h2>Introduction</h2><p>The purpose of this essay is to explore [topic]. Throughout this paper, I will argue that [thesis statement]...</p><h2>Background</h2><p>[Provide context and background information on your topic]</p><h2>Main Argument</h2><p>[Present your main arguments with supporting evidence]</p><h2>Counterargument</h2><p>Some may argue that [counterargument]. However, this view overlooks [your rebuttal]...</p><h2>Conclusion</h2><p>In conclusion, [restated thesis and key takeaways].</p><h2>References</h2><p>[1] Author, A. (Year). Title. Publisher.</p>`,
};

const TEMPLATE_TABS = [
    { label: 'All', icon: LayoutTemplate },
    { label: 'General', icon: FileText },
    { label: 'Professional', icon: Briefcase },
    { label: 'Academic', icon: GraduationCap },
    { label: 'Marketing', icon: Megaphone },
    { label: 'Creative', icon: Feather },
];

const TEMPLATES = SIDEBAR_TEMPLATES.map(template => ({
    id: template.id,
    title: template.name,
    type: template.id,
    tab: template.category,
    author: template.description,
    color: template.color + '40',
    icon: template.icon,
    content: template.content,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
};

const sanitizeFilename = (name) =>
    String(name ?? 'document').replace(/[^\w\s.\-]/g, '').trim().slice(0, 80) || 'Untitled';

// ── Document thumbnail skeleton ───────────────────────────────────────────────
const DocThumbnail = ({ title, template, pinned }) => {
    const isAI = template === 'ai-generated';
    
    // ── Template-specific mini layouts ───────────────────────────────────────
    const renderContent = () => {
        switch (template) {
            case 'resume':
                return (
                    <div className="flex-1 p-3 flex flex-col gap-2 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-slate-200" />
                            <div className="flex-1 space-y-1">
                                <div className="h-2 w-full rounded bg-slate-200" />
                                <div className="h-1 w-2/3 rounded bg-slate-100" />
                            </div>
                        </div>
                        <div className="h-1.5 w-1/3 rounded bg-blue-100" />
                        <div className="flex gap-2">
                            <div className="flex-1 space-y-1.5">
                                <div className="h-1 w-full rounded bg-slate-100" />
                                <div className="h-1 w-full rounded bg-slate-100" />
                                <div className="h-1 w-4/5 rounded bg-slate-100" />
                            </div>
                            <div className="w-1/3 space-y-1.5">
                                <div className="h-1 w-full rounded bg-slate-100" />
                                <div className="h-1 w-full rounded bg-slate-100" />
                            </div>
                        </div>
                        <div className="h-1.5 w-1/3 rounded bg-blue-100 mt-1" />
                        <div className="space-y-1.5">
                            <div className="h-1 w-full rounded bg-slate-100" />
                            <div className="h-1 w-5/6 rounded bg-slate-100" />
                        </div>
                    </div>
                );
            case 'meeting-notes':
                return (
                    <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-hidden">
                        <div className="h-2.5 w-3/4 rounded bg-purple-100" />
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-200" />
                                <div className="h-1 w-1/2 rounded bg-slate-100" />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-200" />
                                <div className="h-1 w-2/3 rounded bg-slate-100" />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-200" />
                                <div className="h-1 w-1/3 rounded bg-slate-100" />
                            </div>
                        </div>
                        <div className="h-px w-full bg-slate-100" />
                        <div className="grid grid-cols-2 gap-2">
                            <div className="h-4 rounded bg-slate-50 border border-slate-100" />
                            <div className="h-4 rounded bg-slate-50 border border-slate-100" />
                        </div>
                    </div>
                );
            case 'cover-letter':
                return (
                    <div className="flex-1 p-3 flex flex-col gap-2 overflow-hidden">
                        <div className="self-end w-1/2 space-y-1 mb-2">
                            <div className="h-1 w-full rounded bg-slate-100" />
                            <div className="h-1 w-4/5 rounded bg-slate-100" />
                        </div>
                        <div className="w-1/3 h-1.5 rounded bg-cyan-100 mb-1" />
                        <div className="space-y-1.5">
                            <div className="h-1 w-full rounded bg-slate-100" />
                            <div className="h-1 w-full rounded bg-slate-100" />
                            <div className="h-1 w-full rounded bg-slate-100" />
                            <div className="h-1 w-5/6 rounded bg-slate-100" />
                        </div>
                        <div className="mt-2 w-1/4 h-1.5 rounded bg-slate-200" />
                    </div>
                );
            case 'project-proposal':
                return (
                    <div className="flex-1 p-3 flex flex-col gap-2 overflow-hidden">
                        <div className="h-3 w-4/5 rounded bg-blue-100 mb-1" />
                        <div className="h-1.5 w-1/2 rounded bg-slate-100" />
                        <div className="mt-2 space-y-2">
                            <div className="h-8 rounded bg-slate-50 border border-slate-100 flex flex-col p-1 gap-1">
                                <div className="h-1 w-3/4 rounded bg-slate-200" />
                                <div className="h-1 w-full rounded bg-slate-100" />
                            </div>
                            <div className="h-6 rounded bg-slate-50 border border-slate-100" />
                        </div>
                    </div>
                );
            case 'newsletter':
                return (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="h-10 w-full bg-amber-100 flex items-center justify-center">
                            <Newspaper className="w-5 h-5 text-amber-500/50" />
                        </div>
                        <div className="p-3 space-y-2">
                            <div className="h-2 w-3/4 rounded bg-slate-200" />
                            <div className="flex gap-2">
                                <div className="flex-1 space-y-1">
                                    <div className="h-1 w-full rounded bg-slate-100" />
                                    <div className="h-1 w-full rounded bg-slate-100" />
                                </div>
                                <div className="w-8 h-8 rounded bg-slate-100" />
                            </div>
                        </div>
                    </div>
                );
            case 'essay':
            case 'academic-essay':
                return (
                    <div className="flex-1 p-3 flex flex-col gap-1.5 overflow-hidden">
                        <div className="h-2 w-1/2 rounded bg-emerald-100 self-center mb-2" />
                        <div className="space-y-1">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className={`h-1 rounded bg-slate-100 ${i % 4 === 3 ? 'w-4/5' : 'w-full'}`} />
                            ))}
                        </div>
                    </div>
                );
            case 'research-report':
                return (
                    <div className="flex-1 p-3 flex flex-col gap-1.5 overflow-hidden">
                        <div className="h-2.5 w-5/6 rounded bg-emerald-100 mb-1" />
                        <div className="h-1 w-1/2 rounded bg-slate-200 mb-2" />
                        <div className="h-1.5 w-1/4 rounded bg-slate-200 mb-1" />
                        <div className="p-1.5 rounded bg-slate-50 border border-slate-100 space-y-1">
                            <div className="h-0.5 w-full rounded bg-slate-200" />
                            <div className="h-0.5 w-full rounded bg-slate-200" />
                            <div className="h-0.5 w-4/5 rounded bg-slate-200" />
                        </div>
                        <div className="h-1.5 w-1/3 rounded bg-slate-200 mt-2" />
                        <div className="space-y-1">
                            <div className="h-0.5 w-full rounded bg-slate-100" />
                            <div className="h-0.5 w-full rounded bg-slate-100" />
                        </div>
                    </div>
                );
            case 'press-release':
                return (
                    <div className="flex-1 p-3 flex flex-col gap-2 overflow-hidden">
                        <div className="h-1 w-1/3 rounded bg-orange-200 mb-1" />
                        <div className="h-2.5 w-full rounded bg-orange-100" />
                        <div className="h-2.5 w-4/5 rounded bg-orange-100 mb-2" />
                        <div className="h-1 w-1/4 rounded bg-slate-300" />
                        <div className="space-y-1">
                            <div className="h-1 w-full rounded bg-slate-100" />
                            <div className="h-1 w-full rounded bg-slate-100" />
                            <div className="h-1 w-full rounded bg-slate-100" />
                        </div>
                        <div className="mt-auto self-center flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                        </div>
                    </div>
                );
            case 'blog-post':
                return (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="h-12 w-full bg-pink-100 relative overflow-hidden">
                            <div className="absolute top-2 left-2 w-8 h-1 rounded-full bg-white/50" />
                            <div className="absolute bottom-2 left-2 right-2 space-y-1">
                                <div className="h-1.5 w-3/4 rounded bg-white/80" />
                                <div className="h-1 w-1/2 rounded bg-white/60" />
                            </div>
                        </div>
                        <div className="p-3 space-y-1.5">
                            <div className="h-1 w-full rounded bg-slate-100" />
                            <div className="h-1 w-full rounded bg-slate-100" />
                            <div className="h-1 w-4/5 rounded bg-slate-100" />
                            <div className="h-2 w-1/3 rounded bg-pink-50 mt-1" />
                        </div>
                    </div>
                );
            case 'ai-generated':
                return (
                    <div className="flex-1 p-3 flex flex-col gap-1.5 overflow-hidden relative">
                        <div className="h-2 w-3/4 rounded bg-amber-200/50" />
                        <div className="space-y-1.5">
                            <div className="h-1.5 w-full rounded bg-amber-50" />
                            <div className="h-1.5 w-5/6 rounded bg-amber-50" />
                            <div className="h-1.5 w-full rounded bg-amber-50" />
                        </div>
                        <div className="flex-1" />
                        <div className="flex items-center gap-1 mt-auto">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            <div className="h-1.5 w-10 rounded bg-amber-100" />
                        </div>
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
                    </div>
                );
            default: // Blank or generic
                return (
                    <div className="flex-1 p-3 flex flex-col gap-1.5 overflow-hidden">
                        <div className="h-2 w-3/4 rounded bg-slate-200" />
                        <div className="h-1.5 w-full rounded bg-slate-100" />
                        <div className="h-1.5 w-5/6 rounded bg-slate-100" />
                        <div className="h-1.5 w-2/3 rounded bg-slate-100" />
                        <div className="h-px w-full bg-slate-100 my-1" />
                        <div className="h-1.5 w-full rounded bg-slate-100" />
                        <div className="h-1.5 w-3/4 rounded bg-slate-100" />
                    </div>
                );
        }
    };

    return (
        <div className="aspect-[3/4] rounded-xl overflow-hidden border border-slate-100 bg-white flex flex-col shadow-sm group-hover:shadow-md transition-shadow duration-200">
            {/* Header stripe */}
            <div className={`h-1.5 w-full ${isAI ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} />
            {renderContent()}
        </div>
    );
};

// ── Markdown preview (AI output) ──────────────────────────────────────────────
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
        let i = 0, listItems = [], listType = null, codeLines = [], inCode = false, codeLanguage = '';

        const flushList = () => {
            if (!listItems.length) return;
            const Tag = listType === 'ol' ? 'ol' : 'ul';
            elements.push(
                <Tag key={`list-${elements.length}`} style={{ paddingLeft: '1.5rem', margin: '0.5rem 0 0.75rem', lineHeight: 1.7 }}>
                    {listItems.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '0.25rem', color: '#374151', fontSize: '0.925rem' }}
                            dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
                    ))}
                </Tag>
            );
            listItems = []; listType = null;
        };

        while (i < lines.length) {
            const line = lines[i];

            if (line.startsWith('```')) {
                flushList();
                if (!inCode) { inCode = true; codeLanguage = line.slice(3).trim(); codeLines = []; }
                else {
                    inCode = false;
                    elements.push(
                        <div key={`code-${elements.length}`} style={{ margin: '1rem 0', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                            {codeLanguage && <div style={{ background: '#1e293b', padding: '5px 14px' }}><span style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>{codeLanguage}</span></div>}
                            <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: '1rem', margin: 0, overflowX: 'auto', fontSize: '0.85rem', lineHeight: 1.6, fontFamily: 'monospace' }}><code>{codeLines.join('\n')}</code></pre>
                        </div>
                    );
                    codeLines = [];
                }
                i++; continue;
            }
            if (inCode) { codeLines.push(line); i++; continue; }
            if (/^---+$/.test(line.trim())) { flushList(); elements.push(<hr key={`hr-${elements.length}`} style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1rem 0' }} />); i++; continue; }

            const h1 = line.match(/^# (.+)/);
            const h2 = line.match(/^## (.+)/);
            const h3 = line.match(/^### (.+)/);
            if (h1) { flushList(); elements.push(<h1 key={`h1-${elements.length}`} style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '1.4rem 0 0.4rem', letterSpacing: '-0.02em' }} dangerouslySetInnerHTML={{ __html: inlineFormat(h1[1]) }} />); i++; continue; }
            if (h2) { flushList(); elements.push(<h2 key={`h2-${elements.length}`} style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '1.25rem 0 0.35rem', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.25rem' }} dangerouslySetInnerHTML={{ __html: inlineFormat(h2[1]) }} />); i++; continue; }
            if (h3) { flushList(); elements.push(<h3 key={`h3-${elements.length}`} style={{ fontSize: '0.975rem', fontWeight: 700, color: '#334155', margin: '1rem 0 0.25rem' }} dangerouslySetInnerHTML={{ __html: inlineFormat(h3[1]) }} />); i++; continue; }

            if (line.startsWith('> ')) {
                flushList();
                elements.push(<blockquote key={`bq-${elements.length}`} style={{ borderLeft: '3px solid #f59e0b', paddingLeft: '1rem', margin: '0.75rem 0', color: '#64748b', fontStyle: 'italic', fontSize: '0.925rem', background: 'rgba(245,158,11,0.04)', borderRadius: '0 6px 6px 0', padding: '0.4rem 0 0.4rem 1rem' }} dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(2)) }} />);
                i++; continue;
            }

            const olMatch = line.match(/^(\d+)\.\s(.+)/);
            if (olMatch) { if (listType !== 'ol') { flushList(); listType = 'ol'; } listItems.push(olMatch[2]); i++; continue; }

            const ulMatch = line.match(/^[-*+]\s(.+)/);
            if (ulMatch) { if (listType !== 'ul') { flushList(); listType = 'ul'; } listItems.push(ulMatch[1]); i++; continue; }

            if (line.startsWith('|') && lines[i + 1]?.match(/^\|[-| :]+\|$/)) {
                flushList();
                const headers = line.split('|').slice(1, -1).map(h => h.trim());
                const rows = [];
                i += 2;
                while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i].split('|').slice(1, -1).map(c => c.trim())); i++; }
                elements.push(
                    <div key={`tbl-${elements.length}`} style={{ overflowX: 'auto', margin: '1rem 0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead><tr style={{ background: '#f8fafc' }}>{headers.map((h, hi) => <th key={hi} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '2px solid #e5e7eb' }} dangerouslySetInnerHTML={{ __html: inlineFormat(h) }} />)}</tr></thead>
                            <tbody>{rows.map((row, ri) => <tr key={ri} style={{ borderBottom: '1px solid #f1f5f9', background: ri % 2 === 0 ? '#fff' : '#fafafa' }}>{row.map((cell, ci) => <td key={ci} style={{ padding: '8px 12px', color: '#374151' }} dangerouslySetInnerHTML={{ __html: inlineFormat(cell) }} />)}</tr>)}</tbody>
                        </table>
                    </div>
                );
                continue;
            }

            if (!line.trim()) { flushList(); i++; continue; }
            flushList();
            elements.push(<p key={`p-${elements.length}`} style={{ fontSize: '0.925rem', lineHeight: 1.75, color: '#374151', margin: '0.4rem 0', textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />);
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

// ═════════════════════════════════════════════════════════════════════════════
// EditorIntro
// ═════════════════════════════════════════════════════════════════════════════
const EditorIntro = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [templateSearch, setTemplateSearch] = useState('');
    const [recentFilter, setRecentFilter] = useState('All');
    const [showUploadZone, setShowUploadZone] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [renameId, setRenameId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importedDocId, setImportedDocId] = useState(null);
    const [importError, setImportError] = useState(null);
    const fileInputRef = useRef(null);
    const renameInputRef = useRef(null);

    const queryClient = useQueryClient();
    const { user } = useAuth();

    const currentUserId = React.useMemo(
        () => user?._id || user?.id || user?.user?._id || user?.user?.id,
        [user]
    );

    const { data: documents = [], isLoading, refetch, isError } = useDocuments(currentUserId);
    const deleteDocumentMutation = useDeleteDocument();

    // ── AI Generator state ─────────────────────────────────────────────────
    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiContentType, setAiContentType] = useState('document');
    const [aiLength, setAiLength] = useState('medium');
    const [aiTonality, setAiTonality] = useState('professional');
    const [isGenerating, setIsGenerating] = useState(false);
    const [genStep, setGenStep] = useState('config');
    const [genProgress, setGenProgress] = useState(0);
    const [genPhaseLabel, setGenPhaseLabel] = useState('');
    const [generatedDocId, setGeneratedDocId] = useState(null);
    const [generatedDocTitle, setGeneratedDocTitle] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [wordCount, setWordCount] = useState(0);
    const [aiStep, setAiStep] = useState(1);

    // ── Auto-focus rename input ────────────────────────────────────────────
    useEffect(() => {
        if (renameId && renameInputRef.current) renameInputRef.current.focus();
    }, [renameId]);

    // ── Auto-open upload zone from URL ──────────────────────────────────────
    useEffect(() => {
        if (searchParams.get('action') === 'import') {
            setShowUploadZone(true);
            setSearchParams(new URLSearchParams());
        }
    }, [searchParams, setSearchParams]);

    // ── Dismiss context menu on scroll ────────────────────────────────────
    useEffect(() => {
        if (!contextMenu) return;
        const dismiss = () => setContextMenu(null);
        window.addEventListener('scroll', dismiss, true);
        return () => window.removeEventListener('scroll', dismiss, true);
    }, [contextMenu]);

    // ── Reset AI modal when closed ─────────────────────────────────────────
    const closeAIGenerator = useCallback(() => {
        if (isGenerating) return;
        setShowAIGenerator(false);
        setGenStep('config');
        setAiTopic('');
        setAiContentType('document');
        setAiLength('medium');
        setAiTonality('professional');
        setAiStep(1);
        setGeneratedContent('');
        setGenProgress(0);
    }, [isGenerating]);

    // ── Open editor ────────────────────────────────────────────────────────
    const openEditor = useCallback(async (templateType = 'blank', docId = null) => {
        if (docId) {
            // Opening an existing document from the backend
            const isMongoId = /^[0-9a-fA-F]{24}$/.test(docId);
            if (!isMongoId) {
                toast.error('Invalid document ID');
                return;
            }
            
            // Open the editor directly - let the editor handle document loading
            // The editor will fetch from backend or use cache as needed
            window.open(`/editor/${docId}`, '_blank');
            return;
        }

        // Opening a new document (blank or template)
        // Don't create a temporary ID - let useAutoCreateDocument handle it
        // This ensures the document is created on the backend immediately
        const url = templateType && templateType !== 'blank' ? `/editor?template=${templateType}` : '/editor';
        window.open(url, '_blank');
    }, [navigate, queryClient]);

    // ── File upload ────────────────────────────────────────────────────────
    const handleFileUpload = useCallback(async (files) => {
        const fileArr = Array.from(files || []);
        if (!fileArr.length) return;

        setIsImporting(true);
        setImportError(null);
        setImportedDocId(null);

        const toastId = toast.loading(`Importing ${fileArr.length} file${fileArr.length > 1 ? 's' : ''}…`);

        try {
            let firstId = null;
            for (let i = 0; i < fileArr.length; i++) {
                const file = fileArr[i];
                const result = await DocumentImporter.importFile(file);
                const newDocId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
                const newDoc = {
                    id: newDocId, _id: newDocId,
                    title: sanitizeFilename(result.title),
                    content: result.html, html: result.html,
                    data: { html: result.html, content: result.json || null },
                    createdAt: Date.now(), lastOpened: Date.now(),
                    template: 'upload', pinned: false, slideCount: 0,
                };
                localStorage.setItem(`doc_${newDocId}`, JSON.stringify(newDoc));
                queryClient.setQueryData(['documents'], old => [newDoc, ...(old || [])]);
                if (i === 0) firstId = newDocId;
            }
            setImportedDocId(firstId);
            toast.success(`${fileArr.length === 1 ? `"${fileArr[0].name}"` : `${fileArr.length} files`} imported`);
        } catch (err) {
            setImportError(err.message);
            toast.error(`Import failed: ${err.message}`);
        } finally {
            setIsImporting(false);
            toast.dismiss(toastId);
        }
    }, [queryClient]);

    const handleInputChange = (e) => handleFileUpload(e.target.files);

    // Drag-and-drop on upload modal
    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
    };

    // ── Document actions ───────────────────────────────────────────────────
    const deleteDoc = useCallback(async (id) => {
        if (!window.confirm('Delete this document? This cannot be undone.')) return;
        setContextMenu(null);
        try {
            await deleteDocumentMutation.mutateAsync(id);
            localStorage.setItem('athena_document_refresh', Date.now().toString());
            toast.success('Document deleted');
        } catch (err) {
            toast.error('Failed to delete: ' + (err.message || 'Unknown error'));
        }
    }, [deleteDocumentMutation]);

    const pinDoc = useCallback((id) => {
        queryClient.setQueryData(['documents'], old => old.map(d => d.id === id ? { ...d, pinned: !d.pinned } : d));
        setContextMenu(null);
    }, [queryClient]);

    const duplicateDoc = useCallback((id) => {
        const doc = documents.find(d => d.id === id);
        if (!doc) return;
        const copy = { ...doc, id: `doc_${Date.now()}`, title: `${doc.title} (copy)`, createdAt: Date.now(), lastOpened: Date.now(), pinned: false };
        queryClient.setQueryData(['documents'], old => [copy, ...(old || [])]);
        toast.success('Document duplicated');
        setContextMenu(null);
    }, [documents, queryClient]);

    const startRename = useCallback((doc) => {
        setRenameId(doc.id);
        setRenameValue(doc.title);
        setContextMenu(null);
    }, []);

    const saveRename = useCallback(() => {
        if (!renameValue.trim()) { setRenameId(null); return; }
        queryClient.setQueryData(['documents'], old => old.map(d => d.id === renameId ? { ...d, title: sanitizeFilename(renameValue) } : d));
        setRenameId(null);
    }, [renameId, renameValue, queryClient]);

    // ── AI Generation ──────────────────────────────────────────────────────
    const handleAIGenerate = async () => {
        if (!aiTopic.trim()) { toast.error('Please enter a topic'); return; }

        setIsGenerating(true);
        setGenStep('generating');
        setGenProgress(0);
        setGenPhaseLabel('Preparing your document…');

        try {
            const { generateDocument } = await import('../components/athena-editor/ai/aiUtils.js');

            const lengthConfig = {
                short: { words: 300, pages: 1, detail: 'concise overview' },
                medium: { words: 600, pages: 2, detail: 'moderate detail' },
                long: { words: 1200, pages: 3, detail: 'comprehensive coverage' },
                custom: { words: 800, pages: 2, detail: 'appropriate depth' },
            };

            const contentTypeEnhancements = {
                document: { structure: '# Title\n\n## Executive Summary\n\n## Main Content\n\n## Key Takeaways\n\n## Conclusion', elements: ['Clear headings', 'Bullet points for key information', 'Numbered lists for sequences', 'Bold text for emphasis'], formatting: 'Use H1 for title, H2 for main sections, H3 for subsections' },
                essay: { structure: '# Essay Title\n\n## Introduction\n\n## Body Paragraph 1\n\n## Body Paragraph 2\n\n## Counterargument & Rebuttal\n\n## Conclusion', elements: ['Strong thesis statement', 'Topic sentences', 'Supporting evidence', 'Smooth transitions'], formatting: 'Academic tone, formal language, third-person perspective' },
                report: { structure: '# Report Title\n\n## Executive Summary\n\n## Introduction\n\n## Findings / Analysis\n\n## Recommendations\n\n## Conclusion', elements: ['Executive summary', 'Data-driven insights', 'Actionable recommendations', 'Timeline/milestones'], formatting: 'Professional business format, use tables where applicable' },
                article: { structure: '# Catchy Title\n\n## Introduction\n\n## Main Point 1\n\n## Main Point 2\n\n## Practical Tips\n\n## Conclusion + Call to Action', elements: ['Engaging headline', 'Compelling intro', 'Subheadings every 2-3 paragraphs', 'Examples'], formatting: 'Conversational yet informative' },
                story: { structure: '# Story Title\n\n## Scene 1: Setup\n\n## Scene 2: Conflict\n\n## Scene 3: Resolution\n\n## Epilogue', elements: ['Character development', 'Setting description', 'Dialogue', 'Emotional arc'], formatting: 'Narrative style, show don\'t tell' },
                poem: { structure: '# Poem Title\n\n[Stanza 1]\n\n[Stanza 2]\n\n[Stanza 3]', elements: ['Imagery', 'Metaphors', 'Rhythm', 'Emotional resonance'], formatting: 'Poetic structure with intentional line breaks' },
            };

            const tonalityEnhancements = {
                professional: { voice: 'Formal and authoritative', vocabulary: 'Industry-standard terminology', sentenceStructure: 'Complete sentences, varied length', avoid: 'Slang, contractions, overly casual language' },
                casual: { voice: 'Friendly and approachable', vocabulary: 'Everyday language', sentenceStructure: 'Mix of short and medium sentences', allow: 'Contractions, rhetorical questions, personal pronouns' },
                academic: { voice: 'Scholarly and objective', vocabulary: 'Technical terms with definitions', sentenceStructure: 'Complex sentences', require: 'Evidence-based claims, hedging language' },
                creative: { voice: 'Expressive and imaginative', vocabulary: 'Vivid, descriptive words', sentenceStructure: 'Varied for rhythm', techniques: 'Metaphors, similes, personification' },
                persuasive: { voice: 'Confident and compelling', vocabulary: 'Power words, emotional triggers', sentenceStructure: 'Short punchy + longer explanations', techniques: 'Rule of three, rhetorical questions, CTAs' },
                informative: { voice: 'Clear and educational', vocabulary: 'Accessible but accurate', sentenceStructure: 'Straightforward, logical progression', focus: 'Facts, data, step-by-step explanations' },
            };

            const config = lengthConfig[aiLength];
            const contentType = contentTypeEnhancements[aiContentType] || contentTypeEnhancements.document;
            const tonality = tonalityEnhancements[aiTonality] || tonalityEnhancements.professional;

            const enhancedPrompt = `You are an expert ${aiContentType} writer known for producing high-quality, well-structured content.

## TASK
Write a ${aiContentType} about: "${aiTopic}"

## REQUIRED STRUCTURE
${contentType.structure}

## CONTENT REQUIREMENTS
- Length: Approximately ${config.words} words
- Detail Level: ${config.detail}
- Voice: ${tonality.voice}
- Vocabulary: ${tonality.vocabulary}
- Sentence Structure: ${tonality.sentenceStructure}
${tonality.avoid ? `- Avoid: ${tonality.avoid}` : ''}
${tonality.allow ? `- You May Use: ${tonality.allow}` : ''}
${tonality.require ? `- Required: ${tonality.require}` : ''}
${tonality.techniques ? `- Techniques: ${tonality.techniques}` : ''}

## FORMATTING RULES
Use proper Markdown. ${contentType.formatting}. Include: ${contentType.elements.join(', ')}.
Use bold (**text**) for key terms. Bullet points for lists. Numbered lists for sequences.

## OUTPUT FORMAT
Output ONLY the formatted content. No preamble. Just the ${aiContentType}.`;

            setGenProgress(15); setGenPhaseLabel('Analysing your topic…');
            await new Promise(r => setTimeout(r, 400));
            setGenProgress(35); setGenPhaseLabel('Structuring content…');
            await new Promise(r => setTimeout(r, 300));
            setGenProgress(55); setGenPhaseLabel('Writing your document…');

            const genContent = await generateDocument({
                topic: aiTopic,
                pages: config.pages,
                tone: aiTonality,
                type: aiContentType,
                temperature: aiTonality === 'creative' ? 0.8 : aiTonality === 'academic' ? 0.5 : 0.7,
                audience: aiTonality === 'professional' ? 'Business professionals' : aiTonality === 'academic' ? 'Researchers and academics' : 'Educated readers',
                keyPoints: contentType.elements,
            });

            // 🔥 Validate generated content before proceeding
            if (!genContent || typeof genContent !== 'string') {
                throw new Error('AI generated empty or invalid content');
            }

            const trimmedContent = genContent.trim();
            if (trimmedContent.length < 50) {
                throw new Error(`AI generated insufficient content (${trimmedContent.length} chars). Please try again.`);
            }

            const wc = trimmedContent.replace(/[#*`>\-]/g, '').split(/\s+/).filter(Boolean).length;
            if (wc < 20) {
                throw new Error(`AI generated too few words (${wc}). Please try again with a different topic.`);
            }

            setWordCount(wc);
            setGeneratedContent(trimmedContent);
            setGenProgress(80); setGenPhaseLabel('Saving to your workspace…');
            await new Promise(r => setTimeout(r, 300));

            const docTitle = `${aiContentType.charAt(0).toUpperCase() + aiContentType.slice(1)}: ${aiTopic.substring(0, 40)}${aiTopic.length > 40 ? '…' : ''}`;
            
            // 🔥 Save to backend with hasBeenEdited: true to prevent MongoDB TTL deletion
            const response = await TextEditorService.saveDocument({
                title: docTitle,
                data: { content: trimmedContent, html: trimmedContent },
                hasBeenEdited: true, // 🔥 CRITICAL: Prevents MongoDB from auto-deleting after 24h
            });

            const documentId = String(response.documentId || response.id || response._id || '');
            if (!documentId) { 
                throw new Error('Failed to save document to backend'); 
            }

            // 🔥 Only add to cache after successful backend save
            const newDoc = {
                id: documentId, 
                mongoBackendId: documentId,
                title: sanitizeFilename(docTitle),
                content: trimmedContent,
                createdAt: Date.now(), 
                lastOpened: Date.now(),
                template: 'ai-generated', 
                pinned: false, 
                slideCount: 0,
            };

            queryClient.setQueryData(['documents'], old => [newDoc, ...(old || [])]);
            setGenProgress(100); setGenPhaseLabel('Done!');
            setGeneratedDocId(documentId);
            setGeneratedDocTitle(newDoc.title);
            setGenStep('done');
            toast.success('Document ready!');
        } catch (err) {
            console.error('AI Generation error:', err);
            
            // 🔥 Reset to config state on any error
            setGenStep('config');
            setGenProgress(0);
            setGenPhaseLabel('');
            setGeneratedContent('');
            setGeneratedDocId(null);
            setGeneratedDocTitle('');
            setWordCount(0);
            
            // 🔥 Show specific error messages
            const errorMsg = err.message || '';
            if (errorMsg.includes('empty or invalid')) {
                toast.error('AI generated empty content. Please try again with a different topic.');
            } else if (errorMsg.includes('insufficient content')) {
                toast.error(errorMsg);
            } else if (errorMsg.includes('too few words')) {
                toast.error(errorMsg);
            } else if (errorMsg.includes('Failed to save')) {
                toast.error('Failed to save document. Please check your connection and try again.');
            } else if (errorMsg.includes('API') || errorMsg.includes('openai')) {
                toast.error('AI service unavailable. Please check your API configuration.');
            } else {
                toast.error('Generation failed. Please try again with a different topic.');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    // ── Derived data ───────────────────────────────────────────────────────
    const filteredTemplates = TEMPLATES.filter(t => {
        const tabMatch = activeTab === 'All' ? true : t.tab === activeTab;
        const srchMatch = !templateSearch || t.title.toLowerCase().includes(templateSearch.toLowerCase());
        return tabMatch && srchMatch;
    });

    const searchedDocs = documents.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const pinnedDocs = searchedDocs.filter(d => d.pinned);
    const regularDocs = searchedDocs.filter(d => !d.pinned).sort((a, b) => (b.lastOpened || b.createdAt || 0) - (a.lastOpened || a.createdAt || 0));
    const recentDocs = recentFilter === 'Pinned'
        ? [...pinnedDocs, ...regularDocs].filter(d => d.pinned)
        : [...pinnedDocs, ...regularDocs];

    const contextDoc = contextMenu ? documents.find(d => d.id === contextMenu.docId) : null;

    // ── Stagger variants ───────────────────────────────────────────────────
    const cardVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] } }),
    };

    // ══════════════════════════════════════════════════════════════════════
    return (
        <div
            className="min-h-screen bg-[#e9f4ff] text-slate-800 font-sans overflow-y-auto pl-[60px]"
            onClick={() => setContextMenu(null)}
        >
            {/* Custom scrollbar styles */}
            <style>{`
                .recent-docs-scroll::-webkit-scrollbar {
                    width: 8px;
                }
                .recent-docs-scroll::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                .recent-docs-scroll::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                .recent-docs-scroll::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>

            <main className="max-w-7xl mx-auto px-4 sm:px-8 pb-24 pt-10">

                {/* ── Page header ─────────────────────────────────────────── */}
                <motion.header
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="relative mb-10 py-8 px-8 rounded-2xl overflow-hidden bg-gradient-to-r from-white via-sky-100 to-white border border-sky-200 shadow-sm"
                >
                    {/* Decorative overlays */}
                    <div className="absolute top-0 left-0 w-full h-[100px] bg-gradient-to-b from-white to-transparent blur-xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/65 backdrop-blur-md ring-1 ring-sky-200/60 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 mb-3">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Athena Workspace
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}
                                {user?.name ? (
                                    <span className="ml-2 bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                                        {user.name.split(' ')[0]}
                                    </span>
                                ) : ''}.
                            </h1>
                            <p className="text-slate-600 mt-2 text-sm sm:text-[15px] font-medium max-w-xl leading-6">
                                What would you like to <span className="font-semibold text-slate-700">work on</span> today?
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span className="inline-flex items-center gap-1.5 bg-white border border-sky-200 rounded-full px-3 py-1.5 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {documents.length} document{documents.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </motion.header>

                {/* ── Action cards ────────────────────────────────────────── */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                    {[
                        {
                            label: 'Create with AI',
                            sub: 'Turn any idea into a complete document instantly',
                            icon: Wand2,
                            cta: 'Try Magic Write',
                            gradient: 'from-amber-300 to-orange-400',
                            glow: 'rgba(245,158,11,0.45)',
                            action: () => setShowAIGenerator(true),
                        },
                        {
                            label: 'New Document',
                            sub: 'Start writing from a blank canvas',
                            icon: PenLine,
                            cta: 'Open Editor',
                            gradient: 'from-blue-500 to-cyan-400',
                            glow: 'rgba(37,99,235,0.45)',
                            action: () => openEditor('blank'),
                        },
                        {
                            label: 'Import File',
                            sub: 'Edit any DOCX, PDF, Markdown or HTML file',
                            icon: FileUp,
                            cta: 'Select File',
                            gradient: 'from-emerald-400 to-teal-400',
                            glow: 'rgba(16,185,129,0.45)',
                            action: () => setShowUploadZone(true),
                        },
                    ].map(({ label, sub, icon: Icon, cta, gradient, glow, action }, i) => (
                        <motion.button
                            key={label}
                            custom={i}
                            initial="hidden"
                            animate="visible"
                            variants={cardVariants}
                            whileHover={{ y: -4, boxShadow: `0 20px 40px ${glow}` }}
                            whileTap={{ scale: 0.98 }}
                            onClick={action}
                            className={`group relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-6 flex flex-col gap-3 cursor-pointer text-left transition-all duration-300 border border-white/20`}
                            style={{ boxShadow: `0 8px 24px ${glow}` }}
                        >
                            {/* Noise / shine overlay */}
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shrink-0 shadow-sm">
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-white">
                                <p className="font-bold text-lg leading-snug">{label}</p>
                                <p className="text-white/80 text-sm mt-1 leading-relaxed">{sub}</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-white/90 text-sm font-semibold mt-auto">
                                {cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </motion.button>
                    ))}
                </section>

                {/* ── Recent documents ────────────────────────────────────── */}
                <section className="mb-10 bg-white rounded-2xl border border-sky-200/60 shadow-[0_6px_18px_rgba(37,99,235,0.08)] overflow-hidden">
                    {/* Section header */}
                    <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <h2 className="text-[15px] font-bold text-slate-900">Recent documents</h2>
                            {isLoading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                            {isError && <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Failed to load</span>}
                            {!isLoading && recentDocs.length > 0 && (
                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {recentDocs.length} {recentDocs.length === 1 ? 'document' : 'documents'}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search…"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="h-8 bg-slate-100 rounded-full pl-9 pr-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-200 w-40 transition-all placeholder:text-slate-400"
                                />
                            </div>

                            {/* Filter pills */}
                            <div className="flex gap-1 bg-slate-100 rounded-full p-0.5">
                                {['All', 'Pinned'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setRecentFilter(f)}
                                        className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${recentFilter === f ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>

                            {/* Refresh */}
                            <button
                                onClick={() => { refetch(); toast.success('Refreshed'); }}
                                disabled={isLoading}
                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Document grid with vertical scrollbar */}
                    {recentDocs.length === 0 ? (
                        <div className="py-16 px-6 text-center flex-1 flex items-center justify-center">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                    <FileText className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="font-semibold text-slate-600 text-sm">
                                    {searchQuery ? `No results for "${searchQuery}"` : 'No documents yet'}
                                </p>
                                <p className="text-slate-400 text-xs mt-1">Create a new document or import a file to get started</p>
                            </div>
                        </div>
                    ) : (
                        <div 
                            className="p-6 overflow-y-auto recent-docs-scroll flex-1 relative"
                            style={{ 
                                maxHeight: '500px', 
                                scrollBehavior: 'smooth',
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#cbd5e1 #f1f5f9'
                            }}
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 relative">
                                {recentDocs.map((doc, idx) => (
                                <motion.div
                                    key={doc.id}
                                    custom={idx}
                                    initial="hidden"
                                    animate="visible"
                                    variants={cardVariants}
                                    className="group relative cursor-pointer"
                                    onClick={() => openEditor(null, doc.id)}
                                    onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setContextMenu({ docId: doc.id, x: e.clientX, y: e.clientY }); }}
                                >
                                    {/* Thumbnail */}
                                    <DocThumbnail title={doc.title} template={doc.template} pinned={doc.pinned} />

                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 rounded-xl border-2 border-blue-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ top: 0, left: 0, right: 0, bottom: 32 }} />

                                    {/* Pin badge */}
                                    {doc.pinned && (
                                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
                                            <Pin className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    )}

                                    {/* Three-dot menu (hover only) */}
                                    <button
                                        className="absolute top-1.5 left-1.5 w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50"
                                        onClick={e => { e.stopPropagation(); setContextMenu({ docId: doc.id, x: e.clientX, y: e.clientY }); }}
                                    >
                                        <MoreVertical className="w-3 h-3 text-slate-500" />
                                    </button>

                                    {/* Footer */}
                                    <div className="mt-2.5 px-0.5">
                                        {renameId === doc.id ? (
                                            <input
                                                ref={renameInputRef}
                                                value={renameValue}
                                                onChange={e => setRenameValue(e.target.value)}
                                                onBlur={saveRename}
                                                onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setRenameId(null); }}
                                                onClick={e => e.stopPropagation()}
                                                className="text-[12px] border border-blue-400 rounded-md px-2 py-1 w-full focus:outline-none bg-white shadow-sm"
                                            />
                                        ) : (
                                            <h4 className="text-[12px] font-semibold text-slate-800 truncate leading-tight group-hover:text-blue-600 transition-colors">
                                                {doc.title}
                                            </h4>
                                        )}
                                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                            {timeAgo(doc.lastOpened || doc.createdAt)}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* ── Templates ───────────────────────────────────────────── */}
                <section className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-[15px] font-bold text-slate-900">Templates</h2>

                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Template search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search templates…"
                                    value={templateSearch}
                                    onChange={e => setTemplateSearch(e.target.value)}
                                    className="h-8 bg-slate-100 rounded-full pl-9 pr-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-200 w-44 transition-all placeholder:text-slate-400"
                                />
                            </div>

                            {/* Category tabs */}
                            <div className="flex gap-1 bg-slate-100 rounded-full p-0.5 overflow-x-auto no-scrollbar">
                                {TEMPLATE_TABS.map(({ label, icon: Icon }) => (
                                    <button
                                        key={label}
                                        onClick={() => setActiveTab(label)}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${activeTab === label ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Icon className="w-3 h-3" />
                                        <span className="hidden sm:inline">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {filteredTemplates.length === 0 ? (
                        <div className="py-14 text-center text-sm text-slate-400 flex-1 flex items-center justify-center">
                            No templates match your search.
                        </div>
                    ) : (
                        <div 
                            className="p-6 overflow-y-auto recent-docs-scroll flex-1 relative"
                            style={{ 
                                maxHeight: '500px', 
                                scrollBehavior: 'smooth',
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#cbd5e1 #f1f5f9'
                            }}
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 relative">
                            {filteredTemplates.map((template, idx) => {
                                const Icon = template.icon || FileText;
                                return (
                                    <motion.div
                                        key={`${template.id}-${idx}`}
                                        custom={idx}
                                        initial="hidden"
                                        animate="visible"
                                        variants={cardVariants}
                                        onClick={() => openEditor(template.type)}
                                        className="group cursor-pointer"
                                    >
                                        {/* Template thumbnail */}
                                        <div className="relative group">
                                            <DocThumbnail title={template.title} template={template.id} />
                                            
                                            {/* Hover CTA */}
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center bg-black/5 rounded-xl">
                                                <span className="text-[11px] font-bold text-slate-700 bg-white rounded-full px-3 py-1 shadow-sm border border-slate-200">
                                                    Use template
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-2 px-0.5">
                                            <h3 className="text-[12px] font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{template.title}</h3>
                                            {template.author && (
                                                <p className="text-[11px] text-slate-400 truncate mt-0.5">{template.author}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                            </div>
                        </div>
                    )}
                </section>
            </main>

            {/* ══ Context menu ═══════════════════════════════════════════════ */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="fixed z-[200] bg-white rounded-xl shadow-xl border border-slate-200 py-1 w-44 text-[13px]"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        onClick={e => e.stopPropagation()}
                    >
                        {[
                            { icon: ArrowRight, label: 'Open', action: () => { openEditor(null, contextMenu.docId); setContextMenu(null); } },
                            { icon: Edit3, label: 'Rename', action: () => startRename(documents.find(d => d.id === contextMenu.docId)) },
                            { icon: contextDoc?.pinned ? PinOff : Pin, label: contextDoc?.pinned ? 'Unpin' : 'Pin to top', action: () => pinDoc(contextMenu.docId) },
                            { icon: Copy, label: 'Duplicate', action: () => duplicateDoc(contextMenu.docId) },
                            { type: 'sep' },
                            { icon: Trash2, label: 'Delete', action: () => deleteDoc(contextMenu.docId), danger: true },
                        ].map((item, i) =>
                            item.type === 'sep' ? (
                                <div key={i} className="border-t border-slate-100 my-1" />
                            ) : (
                                <button
                                    key={i}
                                    onClick={item.action}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 transition-colors text-left ${item.danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-700'}`}
                                >
                                    <item.icon className={`w-3.5 h-3.5 ${item.danger ? 'text-red-400' : 'text-slate-400'}`} />
                                    {item.label}
                                </button>
                            )
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ══ Upload modal ═══════════════════════════════════════════════ */}
            <AnimatePresence>
                {showUploadZone && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[150]"
                            onClick={() => setShowUploadZone(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 20 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                            className="fixed inset-0 z-[160] flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                                {/* Header */}
                                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">Import document</h2>
                                        <p className="text-xs text-slate-400 mt-0.5">Supported: DOCX, PDF, Markdown, HTML, TXT, EPUB</p>
                                    </div>
                                    <button
                                        onClick={() => setShowUploadZone(false)}
                                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                 {/* Drop zone / Progress */}
                                 <div className="p-6">
                                     {!isImporting && !importedDocId && (
                                         <div
                                             onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                             onDragLeave={() => setIsDragging(false)}
                                             onDrop={onDrop}
                                             onClick={() => fileInputRef.current?.click()}
                                             className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${isDragging
                                                     ? 'border-blue-400 bg-blue-50'
                                                     : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                 }`}
                                         >
                                             <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-colors ${isDragging ? 'bg-blue-100' : 'bg-slate-100'}`}>
                                                 <Upload className={`w-6 h-6 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
                                             </div>
                                             <p className="font-semibold text-slate-700 text-sm">
                                                 {isDragging ? 'Release to import' : 'Drop your file here'}
                                             </p>
                                             <p className="text-xs text-slate-400 mt-1">or click to browse</p>
                                         </div>
                                     )}

                                     {isImporting && (
                                         <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                                             <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
                                             <div>
                                                 <p className="font-semibold text-slate-800">Processing file...</p>
                                                 <p className="text-xs text-slate-400 mt-1">Extracting text and imagery</p>
                                             </div>
                                         </div>
                                     )}

                                     {importedDocId && (
                                         <div className="py-8 flex flex-col items-center justify-center text-center gap-4">
                                             <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                                                 <Check className="w-8 h-8 text-emerald-600" />
                                             </div>
                                             <div>
                                                 <p className="font-bold text-slate-900 text-base">Import successful!</p>
                                                 <p className="text-xs text-slate-500 mt-1">Your document is ready in the editor.</p>
                                             </div>
                                             <button
                                                 onClick={() => { window.open(`/editor/${importedDocId}`, '_blank'); setShowUploadZone(false); setImportedDocId(null); }}
                                                 className="mt-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
                                             >
                                                 <ExternalLink className="w-4 h-4" />
                                                 Open in Editor
                                             </button>
                                         </div>
                                     )}

                                     {importError && (
                                         <div className="py-8 flex flex-col items-center justify-center text-center gap-4 text-red-600">
                                             <AlertCircle className="w-12 h-12" />
                                             <p className="font-semibold">{importError}</p>
                                             <button
                                                 onClick={() => setImportError(null)}
                                                 className="text-sm font-bold text-slate-600 hover:text-slate-800"
                                             >
                                                 Try again
                                             </button>
                                         </div>
                                     )}

                                     <input
                                         ref={fileInputRef}
                                         type="file"
                                         accept=".docx,.pdf,.md,.markdown,.html,.htm,.txt,.epub,.json"
                                         multiple
                                         className="hidden"
                                         onChange={handleInputChange}
                                     />
                                 </div>

                                 {/* Footer */}
                                 <div className="px-6 pb-5 flex justify-end">
                                     <button
                                         onClick={() => { setShowUploadZone(false); setImportedDocId(null); setImportError(null); }}
                                         className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                                     >
                                         {importedDocId ? 'Close' : 'Cancel'}
                                     </button>
                                 </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ══ AI Generator modal ════════════════════════════════════════ */}
            <AnimatePresence>
                {showAIGenerator && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[200] flex items-end sm:items-start justify-center p-4 sm:pt-24"
                        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
                        onClick={() => !isGenerating && closeAIGenerator()}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 16 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                            className="w-full max-w-md flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white"
                            style={{ maxHeight: '80vh' }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* ── Generating state ─────────────────────── */}
                            {genStep === 'generating' && (
                                <div className="flex flex-col items-center justify-center py-12 px-8 gap-6 text-center flex-1">
                                    <div className="relative w-20 h-20">
                                        <motion.div
                                            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                            className="absolute inset-0 rounded-full"
                                            style={{ background: 'radial-gradient(circle, #f59e0b, #f97316)', filter: 'blur(16px)' }}
                                        />
                                        <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}>
                                            <Wand2 className="w-9 h-9 text-white" />
                                        </div>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                            className="absolute -inset-2 rounded-full"
                                            style={{ border: '1.5px dashed rgba(245,158,11,0.5)' }}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Creating your document</h3>
                                        <p className="text-sm text-amber-500 font-medium mt-1">{genPhaseLabel}</p>
                                    </div>
                                    <div className="w-full space-y-1.5">
                                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{ background: 'linear-gradient(90deg,#f59e0b,#f97316)' }}
                                                animate={{ width: `${genProgress}%` }}
                                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-400 text-right">{genProgress}%</p>
                                    </div>
                                    <div className="flex gap-1.5">
                                        {[0, 1, 2].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{ y: [0, -5, 0], opacity: [0.3, 1, 0.3] }}
                                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                                className="w-1.5 h-1.5 rounded-full bg-amber-400"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Done state ──────────────────────────────── */}
                            {genStep === 'done' && (
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    {/* Success bar */}
                                    <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-slate-100 bg-emerald-50/50">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                                className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"
                                            >
                                                <CheckCircle2 className="w-4 h-4 text-white" />
                                            </motion.div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">Document ready</p>
                                                <p className="text-[11px] text-slate-400 truncate">{generatedDocTitle}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[11px] font-medium text-slate-500 hidden sm:block">
                                                ~{wordCount.toLocaleString()} words
                                            </span>
                                            <button
                                                onClick={() => { window.open(`/editor/${generatedDocId}`, '_blank'); setShowAIGenerator(false); setGenStep('config'); }}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                                                style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                Open
                                            </button>
                                            <button
                                                onClick={closeAIGenerator}
                                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content preview */}
                                    <div className="flex-1 overflow-y-auto px-6 py-5" style={{ maxHeight: '52vh' }}>
                                        <MarkdownPreview content={generatedContent} />
                                    </div>
                                </div>
                            )}

                            {/* ── Config state (step 1 & 2) ─────────────── */}
                            {genStep === 'config' && (
                                <>
                                    {/* Modal header */}
                                    <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-slate-100">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}>
                                                <Sparkles className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-bold text-slate-900">Magic Write</h2>
                                                <p className="text-[11px] text-slate-400">Step {aiStep} of 2</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Step indicator */}
                                            <div className="flex gap-1">
                                                {[1, 2].map(s => (
                                                    <div key={s} className={`h-1 rounded-full transition-all ${aiStep >= s ? 'w-5 bg-amber-400' : 'w-2.5 bg-slate-200'}`} />
                                                ))}
                                            </div>
                                            <button
                                                onClick={closeAIGenerator}
                                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors ml-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Step 1: Topic + content type */}
                                    <AnimatePresence mode="wait">
                                        {aiStep === 1 && (
                                            <motion.div
                                                key="step1"
                                                initial={{ opacity: 0, x: 12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -12 }}
                                                transition={{ duration: 0.18 }}
                                                className="flex-1 overflow-y-auto px-5 py-5 space-y-5"
                                            >
                                                {/* Topic */}
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Topic</label>
                                                    <textarea
                                                        value={aiTopic}
                                                        onChange={e => setAiTopic(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && aiTopic.trim()) { e.preventDefault(); setAiStep(2); } }}
                                                        rows={3}
                                                        placeholder="What should the document be about? Be specific…"
                                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition-all placeholder:text-slate-300 text-slate-700"
                                                    />
                                                </div>

                                                {/* Content type */}
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Document type</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {[
                                                            { id: 'document', label: 'Document', icon: FileText },
                                                            { id: 'essay', label: 'Essay', icon: PenLine },
                                                            { id: 'report', label: 'Report', icon: BarChart2Icon },
                                                            { id: 'article', label: 'Article', icon: Newspaper },
                                                            { id: 'story', label: 'Story', icon: BookOpen },
                                                            { id: 'poem', label: 'Poem', icon: Feather },
                                                        ].map(({ id, label, icon: Icon }) => {
                                                            const active = aiContentType === id;
                                                            return (
                                                                <button
                                                                    key={id}
                                                                    onClick={() => setAiContentType(id)}
                                                                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center transition-all ${active ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                                        }`}
                                                                >
                                                                    <Icon className={`w-4 h-4 ${active ? 'text-amber-500' : 'text-slate-400'}`} />
                                                                    <span className={`text-[11px] font-semibold ${active ? 'text-amber-700' : 'text-slate-500'}`}>{label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Step 2: Length + tone */}
                                        {aiStep === 2 && (
                                            <motion.div
                                                key="step2"
                                                initial={{ opacity: 0, x: 12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -12 }}
                                                transition={{ duration: 0.18 }}
                                                className="flex-1 overflow-y-auto px-5 py-5 space-y-5"
                                            >
                                                {/* Topic preview */}
                                                <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                                                    <p className="text-[11px] text-slate-400 mb-0.5">Writing about</p>
                                                    <p className="text-sm font-semibold text-slate-800 line-clamp-2">{aiTopic}</p>
                                                </div>

                                                {/* Length */}
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Length</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                            { id: 'short', label: 'Short', sub: '~300 words' },
                                                            { id: 'medium', label: 'Medium', sub: '~600 words' },
                                                            { id: 'long', label: 'Long', sub: '~1200 words' },
                                                            { id: 'custom', label: 'Custom', sub: '~800 words' },
                                                        ].map(({ id, label, sub }) => {
                                                            const active = aiLength === id;
                                                            return (
                                                                <button
                                                                    key={id}
                                                                    onClick={() => setAiLength(id)}
                                                                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-all ${active ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                                        }`}
                                                                >
                                                                    <span className={`text-[13px] font-semibold ${active ? 'text-amber-700' : 'text-slate-700'}`}>{label}</span>
                                                                    <span className={`text-[11px] ${active ? 'text-amber-500' : 'text-slate-400'}`}>{sub}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Tone */}
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tone</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                            { id: 'professional', label: 'Professional', icon: Briefcase },
                                                            { id: 'casual', label: 'Casual', icon: MessageSquare },
                                                            { id: 'academic', label: 'Academic', icon: GraduationCap },
                                                            { id: 'creative', label: 'Creative', icon: Feather },
                                                            { id: 'persuasive', label: 'Persuasive', icon: Zap },
                                                            { id: 'informative', label: 'Informative', icon: Lightbulb },
                                                        ].map(({ id, label, icon: Icon }) => {
                                                            const active = aiTonality === id;
                                                            return (
                                                                <button
                                                                    key={id}
                                                                    onClick={() => setAiTonality(id)}
                                                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${active ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                                        }`}
                                                                >
                                                                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-500' : 'text-slate-400'}`} />
                                                                    <span className={`text-[12px] font-semibold ${active ? 'text-amber-700' : 'text-slate-600'}`}>{label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Footer */}
                                    <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            {aiStep === 2 && (
                                                <button
                                                    onClick={() => setAiStep(1)}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                                                >
                                                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                                                </button>
                                            )}
                                            <p className="text-[11px] text-slate-400">AI may require review</p>
                                        </div>

                                        {aiStep === 1 ? (
                                            <button
                                                onClick={() => { if (aiTopic.trim()) setAiStep(2); else toast.error('Please enter a topic first'); }}
                                                className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                                                style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}
                                            >
                                                Continue <ChevronRight className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleAIGenerate}
                                                disabled={isGenerating || !aiTopic.trim()}
                                                className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-40"
                                                style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}
                                            >
                                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                                Generate
                                            </button>
                                        )}
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

// ── Small helper component used in AI config step 1 ──────────────────────────
const BarChart2Icon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={className}>
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
);

export default EditorIntro;