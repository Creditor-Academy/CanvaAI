/**
 * TemplateSidebar — Production-grade template picker
 *
 * Enhancements over the original:
 *  - Search / filter by keyword
 *  - Category tab filter bar
 *  - Hover preview panel with sanitized HTML snippet
 *  - Keyboard navigation (arrow keys, Enter, Escape)
 *  - "Recently used" templates (persisted to localStorage)
 *  - 10 templates across 5 categories (up from 5 across 4)
 *  - "New" badge on recently-added templates
 *  - Accessible focus management & ARIA attributes
 *  - Refined visual design with micro-interactions
 *  - DOMPurify sanitization unchanged + allowlist tightened
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FileText, Briefcase, GraduationCap, Mail,
  Newspaper, Search, Clock, Star, ChevronRight,
  LayoutTemplate, ScrollText, PenLine, BookOpen,
  FileSpreadsheet, Megaphone, Eye, Check,
} from 'lucide-react';
import DOMPurify from 'dompurify';

// ─── DOMPurify config ─────────────────────────────────────────────────────────
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'h1','h2','h3','h4','h5','h6',
    'p','ul','ol','li',
    'strong','em','u','s','a','br',
    'blockquote','code','pre','img',
    'table','thead','tbody','tr','th','td',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'colspan', 'rowspan'],
};

const sanitize = (html) => DOMPurify.sanitize(html, PURIFY_CONFIG);

// ─── Template data ────────────────────────────────────────────────────────────
export const TEMPLATES = [
  // ── General ──────────────────────────────────────────────────────────────
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Clean slate — start from scratch',
    icon: FileText,
    category: 'General',
    color: '#6366f1',
    content: '<h1>Untitled Document</h1><p>Start writing here…</p>',
    previewLines: ['Untitled Document', 'Start writing here…'],
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structured agenda & action items',
    icon: PenLine,
    category: 'General',
    color: '#8b5cf6',
    isNew: true,
    content: `<h1>Meeting Notes</h1>
<p><strong>Date:</strong> [Date] &nbsp;|&nbsp; <strong>Time:</strong> [Time]</p>
<p><strong>Attendees:</strong> [Names]</p>
<h2>Agenda</h2>
<ol><li>Topic 1</li><li>Topic 2</li><li>Topic 3</li></ol>
<h2>Discussion</h2>
<p>Key points discussed during the meeting…</p>
<h2>Decisions Made</h2>
<ul><li>Decision 1</li><li>Decision 2</li></ul>
<h2>Action Items</h2>
<table><thead><tr><th>Task</th><th>Owner</th><th>Due Date</th></tr></thead>
<tbody><tr><td>Action 1</td><td>Name</td><td>Date</td></tr>
<tr><td>Action 2</td><td>Name</td><td>Date</td></tr></tbody></table>
<h2>Next Meeting</h2>
<p><strong>Date:</strong> [Date] &nbsp;|&nbsp; <strong>Agenda:</strong> [Topics]</p>`,
    previewLines: ['Meeting Notes', 'Agenda · Discussion · Action Items'],
  },

  // ── Professional ─────────────────────────────────────────────────────────
  {
    id: 'resume',
    name: 'Resume',
    description: 'Clean, modern professional resume',
    icon: Briefcase,
    category: 'Professional',
    color: '#0ea5e9',
    content: `<h1>Your Name</h1>
<p>Professional Title &nbsp;|&nbsp; email@example.com &nbsp;|&nbsp; (123) 456-7890 &nbsp;|&nbsp; linkedin.com/in/yourname</p>
<h2>Summary</h2>
<p>Results-driven professional with [X] years of experience in [industry/field]. Proven track record of [key achievement]. Passionate about [area of expertise].</p>
<h2>Experience</h2>
<h3>Senior [Job Title] — Company Name</h3>
<p><em>Month Year – Present &nbsp;|&nbsp; City, State</em></p>
<ul><li>Led [initiative] resulting in [measurable outcome]</li><li>Managed a team of [X] to deliver [project]</li><li>Improved [metric] by [%] through [method]</li></ul>
<h3>[Job Title] — Company Name</h3>
<p><em>Month Year – Month Year &nbsp;|&nbsp; City, State</em></p>
<ul><li>Key achievement or responsibility</li><li>Key achievement or responsibility</li></ul>
<h2>Education</h2>
<h3>Bachelor of [Degree] in [Field]</h3>
<p><em>University Name &nbsp;|&nbsp; Graduation Year</em></p>
<h2>Skills</h2>
<p><strong>Technical:</strong> Skill 1, Skill 2, Skill 3</p>
<p><strong>Soft Skills:</strong> Leadership, Communication, Problem-solving</p>`,
    previewLines: ['Your Name', 'Experience · Education · Skills'],
  },
  {
    id: 'cover-letter',
    name: 'Cover Letter',
    description: 'Compelling application cover letter',
    icon: Mail,
    category: 'Professional',
    color: '#06b6d4',
    content: `<p>Your Name<br>Your Address, City, State ZIP<br>email@example.com &nbsp;|&nbsp; (123) 456-7890</p>
<p>[Date]</p>
<p>Hiring Manager's Name<br>[Title]<br>[Company Name]<br>[Company Address]</p>
<p>Dear [Hiring Manager's Name],</p>
<p>I am excited to apply for the <strong>[Position]</strong> role at <strong>[Company Name]</strong>. With [X years] of experience in [relevant field] and a passion for [relevant area], I am confident in my ability to contribute meaningfully to your team.</p>
<p>In my current role at [Current Company], I [specific achievement with measurable outcome]. This experience has equipped me with [relevant skills] that align directly with what you're looking for.</p>
<p>What draws me to [Company Name] is [specific reason — culture, mission, product]. I have long admired [specific aspect] and believe my background in [area] would allow me to [contribution].</p>
<p>I would welcome the opportunity to discuss how my experience and enthusiasm can benefit [Company Name]. Thank you for your consideration.</p>
<p>Sincerely,<br><strong>Your Name</strong></p>`,
    previewLines: ['Cover Letter', 'Dear Hiring Manager…'],
  },
  {
    id: 'project-proposal',
    name: 'Project Proposal',
    description: 'Business project proposal with budget',
    icon: FileSpreadsheet,
    category: 'Professional',
    color: '#3b82f6',
    isNew: true,
    content: `<h1>Project Proposal</h1>
<p><strong>Prepared by:</strong> [Your Name] &nbsp;|&nbsp; <strong>Date:</strong> [Date]</p>
<h2>Executive Summary</h2>
<p>A brief overview of the proposed project, its goals, and expected impact.</p>
<h2>Problem Statement</h2>
<p>Clearly define the problem or opportunity this project addresses.</p>
<h2>Proposed Solution</h2>
<p>Describe your approach and how it solves the identified problem.</p>
<h2>Objectives</h2>
<ul><li>Objective 1 — measurable outcome</li><li>Objective 2 — measurable outcome</li><li>Objective 3 — measurable outcome</li></ul>
<h2>Timeline</h2>
<table><thead><tr><th>Phase</th><th>Description</th><th>Duration</th></tr></thead>
<tbody><tr><td>Phase 1</td><td>Research & Planning</td><td>2 weeks</td></tr>
<tr><td>Phase 2</td><td>Execution</td><td>6 weeks</td></tr>
<tr><td>Phase 3</td><td>Review & Launch</td><td>2 weeks</td></tr></tbody></table>
<h2>Budget Estimate</h2>
<table><thead><tr><th>Item</th><th>Cost</th></tr></thead>
<tbody><tr><td>Resource 1</td><td>$X,XXX</td></tr>
<tr><td>Resource 2</td><td>$X,XXX</td></tr>
<tr><td><strong>Total</strong></td><td><strong>$XX,XXX</strong></td></tr></tbody></table>
<h2>Success Metrics</h2>
<p>How will success be measured? Define KPIs.</p>`,
    previewLines: ['Project Proposal', 'Executive Summary · Timeline · Budget'],
  },

  // ── Academic ──────────────────────────────────────────────────────────────
  {
    id: 'essay',
    name: 'Academic Essay',
    description: 'Structured 5-paragraph essay format',
    icon: GraduationCap,
    category: 'Academic',
    color: '#10b981',
    content: `<h1>Essay Title</h1>
<p><em>Author Name &nbsp;|&nbsp; Course Name &nbsp;|&nbsp; Date</em></p>
<h2>Introduction</h2>
<p>Begin with a compelling hook that draws the reader in. Provide necessary background context. End this paragraph with a clear, arguable <strong>thesis statement</strong> that previews your main points.</p>
<h2>Body — Point One</h2>
<p><strong>Topic sentence</strong> introducing your first argument. Provide supporting evidence or quotation. Analyze how the evidence supports your thesis. Transition to the next point.</p>
<h2>Body — Point Two</h2>
<p><strong>Topic sentence</strong> introducing your second argument. Provide supporting evidence or quotation. Analyze how the evidence supports your thesis. Transition to the next point.</p>
<h2>Body — Point Three</h2>
<p><strong>Topic sentence</strong> introducing your third argument. Provide supporting evidence or quotation. Analyze how the evidence supports your thesis. Transition to the conclusion.</p>
<h2>Conclusion</h2>
<p>Restate the thesis in fresh language. Synthesize (don't just summarize) the key points. End with a broader implication or thought-provoking final statement.</p>
<h2>Works Cited</h2>
<p>Author Last, First. <em>Title of Work</em>. Publisher, Year.</p>`,
    previewLines: ['Academic Essay', 'Introduction · Body · Conclusion · Works Cited'],
  },
  {
    id: 'research-report',
    name: 'Research Report',
    description: 'Full academic research paper structure',
    icon: BookOpen,
    category: 'Academic',
    color: '#059669',
    content: `<h1>Research Title</h1>
<p><em>Author(s) &nbsp;|&nbsp; Institution &nbsp;|&nbsp; Date</em></p>
<h2>Abstract</h2>
<p>A concise 150–250 word summary of the research, including the problem, methodology, key findings, and conclusions.</p>
<h2>1. Introduction</h2>
<p>Background and context of the research topic. Statement of the research problem. Research questions or hypotheses. Significance of the study.</p>
<h2>2. Literature Review</h2>
<p>Summary and synthesis of existing research. Identification of gaps your study addresses. Theoretical framework underpinning the research.</p>
<h2>3. Methodology</h2>
<p><strong>Research Design:</strong> [Qualitative/Quantitative/Mixed]</p>
<p><strong>Data Collection:</strong> Describe methods used.</p>
<p><strong>Analysis:</strong> Describe analytical approach.</p>
<h2>4. Results</h2>
<p>Present findings objectively. Use tables, charts, or evidence to support each finding.</p>
<h2>5. Discussion</h2>
<p>Interpret results in context of research questions. Acknowledge limitations. Compare with existing literature.</p>
<h2>6. Conclusion</h2>
<p>Summary of key findings. Implications for practice or future research.</p>
<h2>References</h2>
<p>Author, A. A. (Year). <em>Title of article</em>. <em>Journal Name</em>, <em>Volume</em>(Issue), pages. https://doi.org/xxxxx</p>`,
    previewLines: ['Research Report', 'Abstract · Literature · Methodology · Results'],
  },

  // ── Marketing ─────────────────────────────────────────────────────────────
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Engaging subscriber newsletter',
    icon: Newspaper,
    category: 'Marketing',
    color: '#f59e0b',
    content: `<h1>Newsletter Name</h1>
<p><em>Issue #1 &nbsp;|&nbsp; Month Year &nbsp;|&nbsp; [X] subscribers</em></p>
<h2>✦ Featured Story</h2>
<p>Your lead story or announcement goes here. Make it engaging and informative — this is the headline that brought readers in.</p>
<h2>What's New</h2>
<h3>Update 1</h3>
<p>Brief, scannable description of the update with a key takeaway.</p>
<h3>Update 2</h3>
<p>Brief, scannable description of the update with a key takeaway.</p>
<h2>Upcoming Events</h2>
<ul><li><strong>Event 1:</strong> [Date] — [Description]</li><li><strong>Event 2:</strong> [Date] — [Description]</li></ul>
<h2>💡 Tip of the Month</h2>
<blockquote>Share a genuinely useful tip or inspiring quote relevant to your audience.</blockquote>
<h2>From the Community</h2>
<p>Spotlight a community member, reader question, or user story.</p>
<p><em>Thanks for reading! Reply to this email — we read every response.</em><br><em>Unsubscribe &nbsp;|&nbsp; Update preferences &nbsp;|&nbsp; contact@example.com</em></p>`,
    previewLines: ['Newsletter', 'Featured Story · Updates · Events'],
  },
  {
    id: 'press-release',
    name: 'Press Release',
    description: 'Official media announcement format',
    icon: Megaphone,
    category: 'Marketing',
    color: '#d97706',
    isNew: true,
    content: `<p><strong>FOR IMMEDIATE RELEASE</strong></p>
<p><strong>Contact:</strong> [PR Contact Name]<br>[Title]<br>[Phone] &nbsp;|&nbsp; [Email]</p>
<h1>[Company Name] Announces [News]</h1>
<p><em>[City, State] — [Date]</em> — [Company Name], a leading [description of company], today announced [key news in one sentence].</p>
<p>[Second paragraph expanding on the announcement — what, why, and its significance. Include context and background.]</p>
<p>[Third paragraph: quote from a key executive or stakeholder.]</p>
<blockquote>"[Quote from CEO/Founder/Key Person]," said [Name], [Title] at [Company]. "[Second sentence of quote expanding on the importance.]"</blockquote>
<p>[Fourth paragraph: supporting details, data, or additional context about the announcement.]</p>
<p>[Fifth paragraph: call to action or next steps for the reader.]</p>
<h2>About [Company Name]</h2>
<p>[Company Name] is [brief company description — 2–3 sentences covering what the company does, who it serves, and a notable achievement or milestone.]</p>
<p><strong>###</strong></p>`,
    previewLines: ['FOR IMMEDIATE RELEASE', '[Company] Announces [News]'],
  },

  // ── Creative ──────────────────────────────────────────────────────────────
  {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'SEO-friendly long-form blog article',
    icon: ScrollText,
    category: 'Creative',
    color: '#ec4899',
    isNew: true,
    content: `<h1>Your Compelling Blog Post Title</h1>
<p><em>By [Author Name] &nbsp;|&nbsp; [Date] &nbsp;|&nbsp; [Category] &nbsp;|&nbsp; [X] min read</em></p>
<p><strong>In this article:</strong> A one-sentence hook that tells the reader exactly what they'll gain. Make it impossible to scroll past.</p>
<h2>The Hook</h2>
<p>Open with a surprising statistic, bold claim, or relatable scenario. The first 100 words determine whether someone reads the rest. Make them count.</p>
<h2>Why This Matters</h2>
<p>Establish the problem or opportunity. Why should the reader care right now? What changes if they act on this information?</p>
<h2>[Main Point 1]</h2>
<p>Deep-dive into your first key insight. Use examples, data, and specifics. Vague advice loses readers — be concrete.</p>
<h2>[Main Point 2]</h2>
<p>Your second major insight or step. Break up dense text with subheadings, short paragraphs, and bullet points for scannability.</p>
<h2>[Main Point 3]</h2>
<p>Third insight or actionable step. Include a real example or case study to add credibility.</p>
<h2>Key Takeaways</h2>
<ul><li>Takeaway 1 — actionable and specific</li><li>Takeaway 2 — actionable and specific</li><li>Takeaway 3 — actionable and specific</li></ul>
<h2>Your Turn</h2>
<p>End with a direct call to action. What should the reader do next? Comment, share, try something, sign up — make it clear.</p>`,
    previewLines: ['Blog Post Title', 'Hook · Key Points · Takeaways'],
  },
];

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  All:          { color: '#6366f1', label: 'All' },
  General:      { color: '#6366f1', label: 'General' },
  Professional: { color: '#0ea5e9', label: 'Professional' },
  Academic:     { color: '#10b981', label: 'Academic' },
  Marketing:    { color: '#f59e0b', label: 'Marketing' },
  Creative:     { color: '#ec4899', label: 'Creative' },
};

const RECENT_KEY = 'athena_recent_templates';
const MAX_RECENT = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const loadRecent = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveRecent = (id) => {
  try {
    const prev = loadRecent().filter((r) => r !== id);
    localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...prev].slice(0, MAX_RECENT)));
  } catch {}
};

// ─── SkeletonCard ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-white animate-pulse">
    <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0" />
    <div className="flex-1 space-y-2 pt-0.5">
      <div className="h-3.5 bg-slate-100 rounded w-3/4" />
      <div className="h-2.5 bg-slate-100 rounded w-1/2" />
    </div>
  </div>
);

// ─── PreviewPane ──────────────────────────────────────────────────────────────
const PreviewPane = ({ template, onConfirm, onDismiss }) => {
  const lines = template.previewLines || [];

  return (
    <motion.div
      key={template.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
      // Fixed positioning to prevent layout shifts
      style={{ 
        position: 'absolute',
        bottom: '70px', // Above footer
        left: '16px',
        right: '16px',
        zIndex: 100
      }}
      className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden"
    >
      {/* Mini document preview */}
      <div
        className="p-3 border-b border-slate-100 min-h-[72px] relative"
        style={{ background: `linear-gradient(135deg, ${template.color}08 0%, #fff 60%)` }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          <span className="ml-1 text-[10px] text-slate-400 font-mono">preview</span>
        </div>
        {lines.map((line, i) => (
          <div
            key={i}
            className="truncate"
            style={{
              fontSize: i === 0 ? 11 : 9,
              fontWeight: i === 0 ? 600 : 400,
              color: i === 0 ? '#1e293b' : '#94a3b8',
              marginBottom: 3,
            }}
          >
            {line}
          </div>
        ))}
        {/* Decorative dot */}
        <div
          className="absolute top-3 right-3 w-6 h-6 rounded-full opacity-20"
          style={{ background: template.color }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50">
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors px-2 py-1 rounded"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex items-center gap-1.5 ml-auto text-xs font-medium text-white px-3 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-95"
          style={{ background: template.color }}
        >
          <Check className="w-3 h-3" />
          Use Template
        </button>
      </div>
    </motion.div>
  );
};

// ─── TemplateCard ─────────────────────────────────────────────────────────────
const TemplateCard = React.forwardRef(({
  template, isActive, isFocused, recentIds, onSelect, onPreview,
}, ref) => {
  const Icon = template.icon;
  const isRecent = recentIds.includes(template.id);

  return (
    <motion.button
      ref={ref}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.14 }}
      type="button"
      onClick={() => onSelect(template)}
      onMouseEnter={() => onPreview(template)}
      onMouseLeave={() => onPreview(null)}
      onFocus={() => onPreview(template)}
      onBlur={() => onPreview(null)}
      aria-selected={isActive}
      role="option"
      className={[
        'group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left',
        'transition-all duration-150 focus:outline-none',
        isFocused
          ? 'ring-2 ring-offset-1 border-transparent shadow-md'
          : 'border-slate-100 hover:border-transparent hover:shadow-sm',
        'bg-white',
      ].join(' ')}
      style={
        isFocused
          ? { ringColor: template.color, boxShadow: `0 0 0 2px ${template.color}55` }
          : {}
      }
    >
      {/* Icon */}
      <div
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
        style={{ background: `${template.color}18` }}
      >
        <Icon className="w-4 h-4" style={{ color: template.color }} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-slate-800 truncate">
            {template.name}
          </span>
          {template.isNew && (
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600">
              New
            </span>
          )}
          {isRecent && !template.isNew && (
            <Clock className="shrink-0 w-3 h-3 text-amber-400" />
          )}
        </div>
        <p className="text-[11px] text-slate-400 truncate mt-0.5">{template.description}</p>
      </div>

      {/* Arrow */}
      <ChevronRight
        className="shrink-0 w-3.5 h-3.5 text-slate-300 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-150"
      />
    </motion.button>
  );
});

TemplateCard.displayName = 'TemplateCard';

// ─── Main component ────────────────────────────────────────────────────────────
export const TemplateSidebar = ({
  isOpen,
  onClose,
  onSelectTemplate,
  isLoading = false,
  customTemplates = [],        // Externally injected templates (e.g. from API)
}) => {
  const [query, setQuery]               = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const [pendingHoverId, setPendingHoverId] = useState(null);
  const [focusedIndex, setFocusedIndex]   = useState(-1);
  const [recentIds, setRecentIds]         = useState(loadRecent);
  const [confirmedId, setConfirmedId]     = useState(null);
  
  const hoverTimeoutRef = useRef(null);

  const searchRef   = useRef(null);
  const listRef     = useRef(null);
  const cardRefs    = useRef([]);

  const allTemplates = useMemo(
    () => [...TEMPLATES, ...customTemplates],
    [customTemplates]
  );

  const categories = useMemo(
    () => ['All', ...new Set(allTemplates.map((t) => t.category))],
    [allTemplates]
  );

  // ── Filtered list ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return allTemplates.filter((t) => {
      const matchCat = activeCategory === 'All' || t.category === activeCategory;
      const matchQ   = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [allTemplates, query, activeCategory]);

  // Recent templates shown at the top when no search query and category = All
  const recentTemplates = useMemo(() => {
    if (query || activeCategory !== 'All') return [];
    return recentIds.map((id) => allTemplates.find((t) => t.id === id)).filter(Boolean);
  }, [recentIds, allTemplates, query, activeCategory]);

  // ── Focus management ────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 120);
    } else {
      setQuery('');
      setActiveCategory('All');
      handleDismissPreview();
      setFocusedIndex(-1);
      setConfirmedId(null);
    }
  }, [isOpen]); // Removed handleDismissPreview - it's stable and causes init order issues

  // ── Handlers ────────────────────────────────────────────────────────────
  // Define these BEFORE the useEffects that depend on them
  const handleDismissPreview = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredTemplate(null);
    setPendingHoverId(null);
  }, []);

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (focusedIndex >= 0 && cardRefs.current[focusedIndex]) {
      cardRefs.current[focusedIndex].focus();
    }
  }, [focusedIndex]);

  const handleSelect = useCallback((template) => {
    const safe = sanitize(template.content);
    saveRecent(template.id);
    setRecentIds(loadRecent());
    setConfirmedId(template.id);
    onSelectTemplate({ ...template, content: safe });
    onClose();
  }, [onSelectTemplate, onClose]);

  // Debounced preview handler - prevents UI instability from rapid hovering
  const handlePreview = useCallback((template) => {
    // Clear any pending hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Only set preview if template changed or after a short delay
    if (pendingHoverId !== template?.id) {
      setPendingHoverId(template?.id || null);
      
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredTemplate(template);
        hoverTimeoutRef.current = null;
      }, 150); // 150ms delay prevents flickering on quick hovers
    }
  }, [pendingHoverId]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, filtered.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && focusedIndex >= 0 && filtered[focusedIndex]) {
      e.preventDefault();
      handleSelect(filtered[focusedIndex]);
    }
    if (e.key === '/' && document.activeElement !== searchRef.current) {
      e.preventDefault();
      searchRef.current?.focus();
    }
  }, [isOpen, filtered, focusedIndex, handleSelect, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Render ───────────────────────────────────────────────────────────────
  const showPreview = hoveredTemplate && !confirmedId;
  const templateCount = filtered.length;

  // Update preview handler for cards - clears hover state when leaving card
  const handleCardPreview = useCallback((template) => {
    if (!template) {
      // Mouse left the card - clear pending hover but don't clear displayed preview yet
      setPendingHoverId(null);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      // Only clear hoveredTemplate if we're not hovering over a different card
      setTimeout(() => {
        setHoveredTemplate((prev) => (pendingHoverId === prev?.id ? null : prev));
      }, 50);
    } else {
      handlePreview(template);
    }
  }, [handlePreview, pendingHoverId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
            style={{ zIndex: 1000 }}
          />

          {/* Sidebar panel */}
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label="Template picker"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260, mass: 0.9 }}
            className="fixed right-0 top-0 bottom-0 flex flex-col bg-slate-50 border-l border-slate-200 shadow-2xl"
            style={{ 
              zIndex: 1001, 
              width: 340,
              maxWidth: '100vw',
              touchAction: 'none'
            }}
          >
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div 
              className="shrink-0 px-4 pt-4 pb-3 border-b border-slate-200 bg-white"
              style={{ contain: 'layout' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <LayoutTemplate className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 leading-none">Templates</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {templateCount} available
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close template picker"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setFocusedIndex(-1); }}
                  placeholder="Search templates… ( / )"
                  aria-label="Search templates"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full pl-8 pr-3 py-2 text-[13px] bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-300 transition-all"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* ── Category tabs ───────────────────────────────────────────── */}
            <div
              className="shrink-0 flex gap-1 px-3 py-2 overflow-x-auto bg-white border-b border-slate-100"
              role="tablist"
              aria-label="Filter by category"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                contain: 'layout'
              }}
            >
              {categories.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat] || { color: '#6366f1' };
                const isActive = cat === activeCategory;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => { setActiveCategory(cat); setFocusedIndex(-1); }}
                    className={[
                      'shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all whitespace-nowrap',
                      isActive
                        ? 'text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
                    ].join(' ')}
                    style={isActive ? { background: cfg.color } : {}}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* ── Template list ────────────────────────────────────────────── */}
            <div
              ref={listRef}
              role="listbox"
              aria-label="Available templates"
              className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
              style={{ 
                scrollbarWidth: 'thin', 
                scrollbarColor: '#cbd5e1 transparent',
                WebkitOverflowScrolling: 'touch',
                contain: 'layout style'
              }}
            >
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Search className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">No templates found</p>
                  <p className="text-xs text-slate-400 mt-1">Try a different keyword or category</p>
                  <button
                    type="button"
                    onClick={() => { setQuery(''); setActiveCategory('All'); }}
                    className="mt-3 text-xs text-indigo-600 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <>
                  {/* Recently used section */}
                  <AnimatePresence>
                    {recentTemplates.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mb-3"
                      >
                        <div className="flex items-center gap-1.5 px-1 mb-1.5">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                            Recent
                          </span>
                        </div>
                        <div className="space-y-1">
                          {recentTemplates.map((t, idx) => (
                            <TemplateCard
                              key={`recent-${t.id}`}
                              ref={(el) => { cardRefs.current[idx] = el; }}
                              template={t}
                              isActive={focusedIndex === idx}
                              isFocused={focusedIndex === idx}
                              recentIds={recentIds}
                              onSelect={handleSelect}
                              onPreview={handleCardPreview}
                            />
                          ))}
                        </div>
                        <div className="mt-2 mb-1 h-px bg-slate-100" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Main template list, grouped by category when "All" is active */}
                  {activeCategory === 'All' && !query
                    ? categories.filter((c) => c !== 'All').map((cat) => {
                        const group = filtered.filter((t) => t.category === cat);
                        if (!group.length) return null;
                        const cfg = CATEGORY_CONFIG[cat] || { color: '#6366f1' };
                        return (
                          <div key={cat} className="mb-3">
                            <div className="flex items-center gap-1.5 px-1 mb-1.5">
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: cfg.color }}
                              />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                {cat}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {group.map((t, localIdx) => {
                                const globalIdx = filtered.indexOf(t);
                                return (
                                  <TemplateCard
                                    key={t.id}
                                    ref={(el) => { cardRefs.current[globalIdx] = el; }}
                                    template={t}
                                    isActive={focusedIndex === globalIdx}
                                    isFocused={focusedIndex === globalIdx}
                                    recentIds={recentIds}
                                    onSelect={handleSelect}
                                    onPreview={handleCardPreview}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    : (
                      <div className="space-y-1">
                        {filtered.map((t, idx) => (
                          <TemplateCard
                            key={t.id}
                            ref={(el) => { cardRefs.current[idx] = el; }}
                            template={t}
                            isActive={focusedIndex === idx}
                            isFocused={focusedIndex === idx}
                            recentIds={recentIds}
                            onSelect={handleSelect}
                            onPreview={handleCardPreview}
                          />
                        ))}
                      </div>
                    )
                  }
                </>
              )}
            </div>

            {/* ── Hover preview ─────────────────────────────────────────────── */}
            <AnimatePresence>
              {showPreview && (
                <PreviewPane
                  key={hoveredTemplate.id}
                  template={hoveredTemplate}
                  onConfirm={() => handleSelect(hoveredTemplate)}
                  onDismiss={handleDismissPreview}
                />
              )}
            </AnimatePresence>

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <div 
              className="shrink-0 px-4 py-2.5 border-t border-slate-100 bg-white flex items-center justify-between"
              style={{ contain: 'layout' }}
            >
              <span className="text-[10px] text-slate-400">
                ↑↓ navigate &nbsp;·&nbsp; Enter select &nbsp;·&nbsp; Esc close
              </span>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Eye className="w-3 h-3" />
                Hover to preview
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default TemplateSidebar; 