import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { TextEditorService } from '../../../../services/Text-Editor/text.service.js';
import { countTokensStatic } from '../../../../utils/realtimeTokenCounter.js';
import {
  Sparkles, Wand2, Edit3, MessageSquare, CheckCircle, ArrowRight,
  Send, RefreshCw, Copy, Check, User, Zap, Trash2, FileText,
  CheckCircle2, Languages, AlignLeft, Expand, Minimize2,
  RotateCcw, X, AlertCircle, List, BookOpen, Globe,
  Plus, History, Download,
  GripVertical, Loader2, ArrowLeft, RotateCw,
  ImageIcon, Briefcase, Package, ScrollText,
  PenLine, Newspaper, GraduationCap, BookMarked,
  FileEdit, Mail, Cpu, LayoutTemplate,
  BookOpen as BookOpenIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────

const TONES = [
  { value: 'Professional', emoji: '💼' },
  { value: 'Casual', emoji: '😊' },
  { value: 'Formal', emoji: '🎩' },
  { value: 'Informal', emoji: '🤝' },
  { value: 'Friendly', emoji: '🌟' },
  { value: 'Confident', emoji: '🔥' },
  { value: 'Academic', emoji: '🎓' },
  { value: 'Persuasive', emoji: '📢' },
  { value: 'Neutral', emoji: '⚖️' },
];

const DOCUMENT_TYPES = [
  { value: 'Blog Post', label: 'Blog', icon: PenLine },
  { value: 'Research Paper', label: 'Research', icon: GraduationCap },
  { value: 'Business Report', label: 'Report', icon: Briefcase },
  { value: 'Technical Document', label: 'Technical', icon: Cpu },
  { value: 'Essay', label: 'Essay', icon: FileEdit },
  { value: 'Email Newsletter', label: 'Newsletter', icon: Mail },
  { value: 'Product Description', label: 'Product', icon: Package },
  { value: 'Meeting Minutes', label: 'Minutes', icon: ScrollText },
  { value: 'Creative Story', label: 'Story', icon: BookOpenIcon },
  { value: 'User Manual', label: 'Manual', icon: BookMarked },
  { value: 'Press Release', label: 'Press', icon: Newspaper },
  { value: 'Proposal', label: 'Proposal', icon: LayoutTemplate },
];

const LENGTH_OPTIONS = [
  { value: 1, label: 'Brief', desc: '~380w' },
  { value: 2, label: 'Standard', desc: '~760w' },
  { value: 3, label: 'Detailed', desc: '~1,140w' },
  { value: 5, label: 'Comprehensive', desc: '~1,900w' },
  { value: 10, label: 'In-depth', desc: '~3,800w' },
];

const IMAGE_STYLES = [
  { value: 'photorealistic', label: 'Photo', emoji: '📷' },
  { value: 'digital art', label: 'Digital', emoji: '🎨' },
  { value: 'oil painting', label: 'Oil', emoji: '🖼️' },
  { value: 'watercolor', label: 'Watercolor', emoji: '💧' },
  { value: 'pencil sketch', label: 'Sketch', emoji: '✏️' },
  { value: 'cinematic', label: 'Cinematic', emoji: '🎬' },
  { value: 'minimalist', label: 'Minimal', emoji: '◻️' },
  { value: 'concept art', label: 'Concept', emoji: '🚀' },
];

const QUICK_ACTIONS = [
  { id: 'enhance', label: 'Enhance', icon: Wand2, color: 'text-violet-500', bg: 'bg-violet-50 hover:bg-violet-100', border: 'border-violet-200', editorBehavior: 'replace' },
  { id: 'rewrite', label: 'Rewrite', icon: Edit3, color: 'text-emerald-500', bg: 'bg-emerald-50 hover:bg-emerald-100', border: 'border-emerald-200', editorBehavior: 'replace' },
  { id: 'summarize', label: 'Summarize', icon: AlignLeft, color: 'text-blue-500', bg: 'bg-blue-50 hover:bg-blue-100', border: 'border-blue-200', editorBehavior: 'append' },
  { id: 'expand', label: 'Expand', icon: Expand, color: 'text-orange-500', bg: 'bg-orange-50 hover:bg-orange-100', border: 'border-orange-200', editorBehavior: 'replace' },
  { id: 'simplify', label: 'Simplify', icon: Minimize2, color: 'text-rose-500', bg: 'bg-rose-50 hover:bg-rose-100', border: 'border-rose-200', editorBehavior: 'replace' },
];

const INLINE_ACTIONS = [
  { value: 'rewrite', label: 'Rewrite', icon: Edit3, category: 'basic' },
  { value: 'expand', label: 'Expand', icon: Plus, category: 'basic' },
  { value: 'summarize', label: 'Summarize', icon: FileText, category: 'basic' },
  { value: 'simplify', label: 'Simplify', icon: Minimize2, category: 'basic' },
  { value: 'change_tone', label: 'Change Tone', icon: Wand2, category: 'styling' },
  { value: 'make_professional', label: 'Professional', icon: Briefcase, category: 'styling' },
  { value: 'make_concise', label: 'Concise', icon: Minimize2, category: 'polish' },
  { value: 'add_examples', label: 'Examples', icon: List, category: 'polish' },
  { value: 'paraphrase', label: 'Paraphrase', icon: RefreshCw, category: 'advanced' },
  { value: 'custom', label: 'Custom', icon: Wand2, category: 'advanced' },
];

const INLINE_TONES = [
  'Professional', 'Casual', 'Academic', 'Creative', 'Technical',
  'Formal', 'Informal', 'Friendly', 'Persuasive', 'Authoritative',
  'Empathetic', 'Humorous', 'Serious', 'Inspirational', 'Concise',
];

const INLINE_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Dutch', 'Russian', 'Japanese', 'Korean', 'Chinese (Simplified)',
  'Arabic', 'Hindi', 'Turkish', 'Polish', 'Swedish',
];



const INLINE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'basic', label: 'Basic' },
  { id: 'styling', label: 'Styling' },
  { id: 'polish', label: 'Polish' },
  { id: 'advanced', label: 'Advanced' },
];

const TABS = [
  { id: 'image', label: 'Image', icon: ImageIcon, color: 'from-purple-500 to-pink-500' },
  { id: 'document', label: 'Document', icon: FileText, color: 'from-blue-500 to-indigo-500' },
  { id: 'transform', label: 'Transform', icon: Wand2, color: 'from-emerald-500 to-teal-500' },
];

const CHAT_SUGGESTIONS = [
  { icon: '✍️', label: 'Write an intro' },
  { icon: '📝', label: 'Bullet summary' },
  { icon: '🎯', label: 'Write conclusion' },
  { icon: '📧', label: 'Draft an email' },
];

// ─── AI Prompts ────────────────────────────────────────────────────────────────

const PROMPTS = {
  enhance: 'You are a professional writing editor. Rewrite the given text to be clearer, more engaging, and more impactful while fully preserving the original meaning and the author\'s voice. Improve sentence structure, word choice, and flow. Remove redundancy. Output ONLY the improved text — no preamble, no explanation, no quotes.',
  rewrite: 'You are a professional writer. Completely rewrite the given text with fresh phrasing and structure while preserving all original meaning. Make it engaging and well-structured. Output ONLY the rewritten text — no preamble.',
  summarize: 'You are a skilled summarizer. Condense the given text into a clear, concise summary that captures all key points. Use the same language as the input. Output ONLY the summary — no preamble.',
  expand: 'You are a skilled writer. Expand the given text by adding relevant detail, context, examples, and elaboration. Maintain the original tone. Output ONLY the expanded text with no preamble.',
  simplify: 'You are a clarity specialist. Rewrite using simpler vocabulary, shorter sentences, and an approachable style. Remove jargon. Preserve all meaning. Output ONLY the simplified text.',
  make_professional: 'You are a business writing expert. Rewrite the given text in a polished, professional tone suitable for business communication. Remove informal language. Output ONLY the professional version.',
  make_concise: 'You are an editor specializing in brevity. Remove all unnecessary words, redundancy, and filler from the given text. Keep every essential idea but cut aggressively. Output ONLY the concise version.',
  add_examples: 'You are a writing coach. Enhance the given text by inserting relevant, concrete examples and illustrations to support each key claim. Integrate them naturally. Output ONLY the enhanced text with examples.',
  paraphrase: 'You are a writing expert. Paraphrase the given text using completely different wording and sentence structures while perfectly preserving the original meaning. Output ONLY the paraphrased version.',
  change_tone: (tone) => `You are a writing style expert. Rewrite the given text in a ${tone} tone. Preserve all original content and meaning but completely adjust the voice, word choice, and sentence rhythm to match the ${tone} style. Output ONLY the rewritten text.`,
  custom: (instruction) => `You are an expert writing assistant. Follow this instruction precisely: "${instruction}". Apply it to the given text. Output ONLY the result — no explanation, no preamble.`,
  chat: 'You are Athena, a helpful AI writing assistant embedded inside a document editor. Help users write, edit, brainstorm, and improve documents. Be knowledgeable, concise, and friendly. Produce polished, publication-ready content when asked. Use markdown when it improves readability. Keep responses focused and appropriately sized.',
  generate: (type, tone, pages) =>
    `You are an expert ${type} writer. Generate a complete, polished, well-structured ${type} in a ${tone} tone. The document should be approximately ${pages} page${pages > 1 ? 's' : ''} long (roughly ${pages * 380} words). Use appropriate headings, paragraphs, and sections for a ${type}. Output valid HTML using ONLY these tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>. Output ONLY the HTML — no \`\`\`html fences, no preamble. Start directly with the first HTML tag.`,
  generateImage: (prompt, style) =>
    `Create a detailed, vivid image generation prompt for an AI image generator. The subject is: "${prompt}". Style: ${style}. Return ONLY a single optimized prompt string (no explanation, no quotes, no formatting) — dense with visual descriptors, lighting, composition, mood, and technical details that will produce a stunning, high-quality image.`,
};

const ACTION_TEMPERATURE = {
  summarize: 0.3, make_concise: 0.3, make_professional: 0.4,
  simplify: 0.4, rewrite: 0.6, enhance: 0.7, expand: 0.75,
  add_examples: 0.75, paraphrase: 0.8, change_tone: 0.6, custom: 0.7,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Compact section label */
const SectionLabel = ({ children, className = '' }) => (
  <span className={`text-[9px] font-bold text-[#0c496e] uppercase tracking-wider ${className}`}>{children}</span>
);

/** Compact badge */
const Badge = ({ children, className = '' }) => (
  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${className}`}>{children}</span>
);

/** Icon button */
const IconBtn = ({ onClick, title, children, className = '', disabled = false }) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-40 ${className}`}
  >
    {children}
  </button>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const AIAssistant = ({
  open,
  onOpenChange,
  onGenerateDocument,
  onInlineAction,
  onImageInsert,
  selectedText = '',
  onGetSelectedText, // New callback to fetch current selection from editor
}) => {
  // ── Tab state ─────────────────────────────────────────────────────────────
  const [mode, setMode] = useState('image');

  // ── Document generation ───────────────────────────────────────────────────
  const [topic, setTopic] = useState('');
  const [pages, setPages] = useState(2);
  const [tone, setTone] = useState('Professional');
  const [docType, setDocType] = useState('Blog Post');
  const [creativity, setCreativity] = useState([0.7]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState('');
  const [genWordCount, setGenWordCount] = useState(0);

  // ── Image generation ──────────────────────────────────────────────────────
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('photorealistic');
  const [imageLoading, setImageLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [imageInserted, setImageInserted] = useState(false);

  // ── Chat ──────────────────────────────────────────────────────────────────
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatCreativity, setChatCreativity] = useState([0.7]);

  // ── Transform (quick actions) ─────────────────────────────────────────────
  const [activeAction, setActiveAction] = useState(null);
  const [actionResult, setActionResult] = useState('');
  const [actionError, setActionError] = useState('');
  

  // ── Inline Actions (Advanced) ─────────────────────────────────────────────
  const [inlineActionType, setInlineActionType] = useState('rewrite');
  const [inlineCustomPrompt, setInlineCustomPrompt] = useState('');
  const [inlineResult, setInlineResult] = useState('');
  const [inlineError, setInlineError] = useState('');
  const [inlineCreativity, setInlineCreativity] = useState([0.6]);
  const [inlineSelectedTone, setInlineSelectedTone] = useState('Professional');
  const [inlineTargetLang, setInlineTargetLang] = useState('Spanish');
  const [inlineLoading, setInlineLoading] = useState(false);
  const [inlineCopied, setInlineCopied] = useState(false);
  const [inlineHistory, setInlineHistory] = useState([]);
  const [inlineSelectedCategory, setInlineSelectedCategory] = useState('all');
  const [showHistory, setShowHistory] = useState(false);
  const [inlineWordCount, setInlineWordCount] = useState({ original: 0, result: 0 });

  // ── Shared ────────────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const [currentSelectedText, setCurrentSelectedText] = useState(selectedText);
  const [selectionUpdated, setSelectionUpdated] = useState(false);

  // Update currentSelectedText when selectedText prop changes
  useEffect(() => {
    console.log('📝 [AIAssistant] selectedText prop changed:', selectedText.substring(0, 50));
    setCurrentSelectedText(selectedText);
  }, [selectedText]);

  // Listen for selection changes in the editor when AI Assistant is open
  useEffect(() => {
    if (!open || !onGetSelectedText) return;

    // Set up a polling mechanism to check for selection changes
    const checkSelection = () => {
      const freshText = onGetSelectedText();
      if (freshText !== currentSelectedText) {
        console.log('👁️ [AIAssistant] Detected selection change:', freshText.substring(0, 50));
        setCurrentSelectedText(freshText);
        // Show visual indicator
        setSelectionUpdated(true);
        setTimeout(() => setSelectionUpdated(false), 1000);
      }
    };

    // Check every 500ms when panel is open
    const intervalId = setInterval(checkSelection, 500);

    return () => {
      clearInterval(intervalId);
    };
  }, [open, onGetSelectedText, currentSelectedText]);

  // Function to refresh selected text from editor
  const refreshSelectedText = useCallback(() => {
    console.log('🔄 [AIAssistant] refreshSelectedText called');
    if (onGetSelectedText) {
      const freshText = onGetSelectedText();
      console.log('✅ [AIAssistant] Got fresh text:', freshText.substring(0, 50));
      setCurrentSelectedText(freshText);
      console.log('🔄 [AIAssistant] Refreshed selection:', freshText.substring(0, 50));
      return freshText;
    }
    console.log('⚠️ [AIAssistant] No onGetSelectedText callback, using current:', currentSelectedText.substring(0, 50));
    return currentSelectedText;
  }, [onGetSelectedText, currentSelectedText]);

  // ── Panel position & drag ──────────────────────────────────────────────────
  const [panelPosition, setPanelPosition] = useState(() => {
    if (typeof window === 'undefined') return { x: 24, y: 80 };
    // Default: top-right corner with safe margins
    return {
      x: Math.max(24, window.innerWidth - 384),
      y: Math.max(80, 80),
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const panelRef = useRef(null);
  const chatEndRef = useRef(null);
  const abortRef = useRef(null);
  const chatInputRef = useRef(null);
  const topicRef = useRef(null);
  const imagePromptRef = useRef(null);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  useEffect(() => {
    if (open) {
      setMode('image');
      setTimeout(() => imagePromptRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    if (!open) abortRef.current?.abort();
  }, [open]);

  useEffect(() => {
    const count = (t) => t.trim().split(/\s+/).filter(Boolean).length;
    setInlineWordCount({ original: count(selectedText), result: count(inlineResult) });
  }, [selectedText, inlineResult]);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const cancelPendingRequest = () => abortRef.current?.abort();

  const handleDragStart = useCallback((e) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const newX = e.clientX - dragOffsetRef.current.x;
    const newY = e.clientY - dragOffsetRef.current.y;
    const w = panelRef.current?.offsetWidth || 360;
    const h = panelRef.current?.offsetHeight || 560;
    setPanelPosition({
      x: Math.max(10, Math.min(newX, window.innerWidth - w - 10)),
      y: Math.max(10, Math.min(newY, window.innerHeight - h - 10)),
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // ── Abort ─────────────────────────────────────────────────────────────────
  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
    setImageLoading(false);
    setIsChatLoading(false);
    setInlineLoading(false);
    setActiveAction(null);
  }, []);

  // ─── Document Generation ──────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) { toast.error('Please enter a document topic'); return; }
    setIsGenerating(true);
    setGenProgress('Preparing…');
    setGenWordCount(0);
    cancelPendingRequest();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    try {
      let html = '';
      await TextEditorService.generateDocument({
        topic: topic.trim(), docType, tone, pages, creativity: creativity[0], signal,
        onChunk: (text) => {
          html = text;
          const words = text.split(/\s+/).filter(Boolean).length;
          setGenWordCount(words);
          setGenProgress(`Writing… ${words.toLocaleString()} words`);
        },
      });
      if (!html.trim()) throw new Error('Empty response');
      const cleaned = html.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      onGenerateDocument?.({ topic, pages, tone, type: docType, creativity: creativity[0], html: cleaned });
      
      // 🔥 Emit AI generation event for token counter
      window.dispatchEvent(new CustomEvent('ai-generation-complete', {
        detail: {
          content: cleaned,
          action: 'document-generation',
          tokens: countTokensStatic(cleaned),
          timestamp: Date.now()
        }
      }));
      
      toast.success(`${docType} generated!`);
      setTopic('');
      setGenProgress('');
      onOpenChange(false);
    } catch (err) {
      if (err.name === 'AbortError') return;
      toast.error('Generation failed. Please try again.');
      setGenProgress('');
    } finally {
      setIsGenerating(false);
    }
  }, [topic, pages, tone, docType, creativity, onGenerateDocument, onOpenChange]);

  // ─── Image Generation ──────────────────────────────────────────────────────

  const handleGenerateImage = useCallback(async () => {
    const words = imagePrompt.trim().split(/\s+/).filter(Boolean);
    if (words.length < 2) { toast.error('Please enter at least 2–3 words'); return; }
    setImageLoading(true);
    setGeneratedImageUrl('');
    setEnhancedPrompt('');
    setImageInserted(false);
    cancelPendingRequest();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    try {
      const { url, enhancedPrompt } = await TextEditorService.generateImage({
        prompt: imagePrompt.trim(), style: imageStyle, enhancePrompt: true, signal,
      });
      setGeneratedImageUrl(url);
      setEnhancedPrompt(enhancedPrompt);
      
      // 🔥 Count tokens for image generation (prompt + enhanced prompt)
      const promptTokens = countTokensStatic(imagePrompt.trim());
      const enhancedTokens = enhancedPrompt ? countTokensStatic(enhancedPrompt) : 0;
      const totalImageTokens = promptTokens + enhancedTokens;
      
      window.dispatchEvent(new CustomEvent('athena:ai-tokens', { 
        detail: { tokens: totalImageTokens } 
      }));
      
      toast.success('Image generated!');
    } catch (err) {
      if (err.name === 'AbortError') return;
      const fallbackUrl = TextEditorService.buildPollinationsUrl(`${imagePrompt}, ${imageStyle}`, '1024x1024');
      setGeneratedImageUrl(fallbackUrl);
      
      // 🔥 Count tokens even for fallback
      const promptTokens = countTokensStatic(imagePrompt.trim());
      window.dispatchEvent(new CustomEvent('athena:ai-tokens', { 
        detail: { tokens: promptTokens } 
      }));
      
      toast.info('Image ready');
    } finally {
      setImageLoading(false);
    }
  }, [imagePrompt, imageStyle]);

  const handleInsertImage = useCallback(() => {
    if (!generatedImageUrl) return;
    onImageInsert?.(generatedImageUrl, imagePrompt.trim() || 'AI Generated Image');
    setImageInserted(true);
    toast.success('Image inserted!');
  }, [generatedImageUrl, imagePrompt, onImageInsert]);

  const handleRegenerateImage = useCallback(() => {
    setGeneratedImageUrl('');
    setEnhancedPrompt('');
    setImageInserted(false);
    handleGenerateImage();
  }, [handleGenerateImage]);

  // ─── Chat ──────────────────────────────────────────────────────────────────

  const handleChatSend = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || isChatLoading) return;
    const userMsg = { role: 'user', content: text };
    const history = [...chatMessages, userMsg];
    const assistantIdx = history.length;
    setChatMessages([...history, { role: 'assistant', content: '' }]);
    setChatInput('');
    setIsChatLoading(true);
    cancelPendingRequest();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    try {
      await TextEditorService.chatWithAI({
        messages: history, creativity: chatCreativity[0], signal,
        onChunk: (full) => {
          setChatMessages((prev) => {
            const next = [...prev];
            next[assistantIdx] = { role: 'assistant', content: full };
            return next;
          });
        },
      });
      // Fire global dispatch event after streaming completes
      setChatMessages((prev) => {
        const generated = prev[assistantIdx]?.content || '';
        if (generated) {
           window.dispatchEvent(new CustomEvent('athena:ai-tokens', { detail: { tokens: countTokensStatic(generated) } }));
        }
        return prev;
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setChatMessages((prev) => {
        const next = [...prev];
        next[assistantIdx] = { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' };
        return next;
      });
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, isChatLoading, chatMessages, chatCreativity]);

  // ─── Quick Transform ───────────────────────────────────────────────────────

  const runTransform = useCallback(async (actionId) => {
    // Refresh selection before running action to get latest text
    const textToTransform = refreshSelectedText();
    if (!textToTransform?.trim()) { toast.error('Select text first'); return; }
    const systemPrompt = PROMPTS[actionId];
    if (!systemPrompt) return;
    setActiveAction(actionId);
    setActionResult('');
    setActionError('');
    cancelPendingRequest();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    try {
      await TextEditorService.callAI({
        systemPrompt, userPrompt: textToTransform, temperature: ACTION_TEMPERATURE[actionId] ?? 0.6, signal,
      }).then((result) => {
        setActionResult(result);
        window.dispatchEvent(new CustomEvent('athena:ai-tokens', { detail: { tokens: countTokensStatic(result) } }));
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setActionError('Action failed. Please try again.');
    } finally {
      setActiveAction(null);
    }
  }, [refreshSelectedText]);

  const handleQuickAction = useCallback((id) => {
    runTransform(id);
  }, [runTransform]);

  const applyResult = useCallback((behavior) => {
    if (!actionResult?.trim()) return;
    onInlineAction?.(behavior, actionResult);
    toast.success(behavior === 'replace' ? 'Text replaced' : 'Content appended');
    setActionResult('');
  }, [actionResult, onInlineAction]);

  // ─── Inline Transform (Advanced) ──────────────────────────────────────────

  const buildSystemPrompt = useCallback(() => {
    switch (inlineActionType) {
      case 'change_tone': return PROMPTS.change_tone(inlineSelectedTone);
      case 'custom': return inlineCustomPrompt.trim() ? PROMPTS.custom(inlineCustomPrompt.trim()) : null;
      default: return PROMPTS[inlineActionType] ?? null;
    }
  }, [inlineActionType, inlineSelectedTone, inlineCustomPrompt]);

  const handleInlineTransform = useCallback(async () => {
    // Refresh selection before running action to get latest text
    const textToTransform = refreshSelectedText();
    if (!textToTransform?.trim()) { toast.error('No text selected'); return; }
    if (inlineActionType === 'custom' && !inlineCustomPrompt.trim()) { toast.error('Enter your instruction'); return; }
    const systemPrompt = buildSystemPrompt();
    if (!systemPrompt) { toast.error('Please configure the action'); return; }
    setInlineLoading(true);
    setInlineResult('');
    setInlineError('');
    cancelPendingRequest();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    try {
      let result = '';
      await TextEditorService.transformText({
        text: textToTransform, action: inlineActionType, customPrompt: inlineCustomPrompt.trim(),
        tone: inlineSelectedTone, language: inlineTargetLang,
        creativity: ACTION_TEMPERATURE[inlineActionType] ?? inlineCreativity[0], signal,
        systemPrompt: systemPrompt, // Pass the component's rich per-action prompt
      }).then((transformed) => { 
        result = transformed; 
        setInlineResult(transformed);
        window.dispatchEvent(new CustomEvent('athena:ai-tokens', { detail: { tokens: countTokensStatic(transformed) } }));
      });
      if (!result.trim()) throw new Error('Empty response');
      setInlineHistory(prev => [{
        id: Date.now().toString(), timestamp: new Date(), action: inlineActionType,
        label: INLINE_ACTIONS.find(a => a.value === inlineActionType)?.label ?? inlineActionType,
        originalText: textToTransform.slice(0, 120), result: result.trim(),
        creativity: inlineCreativity[0], tone: inlineSelectedTone, language: inlineTargetLang,
      }, ...prev].slice(0, 30));
      toast.success('Transformation complete');
    } catch (err) {
      if (err.name === 'AbortError') return;
      const msg = err.message || 'Transformation failed';
      setInlineError(msg);
      toast.error(msg);
    } finally {
      setInlineLoading(false);
    }
  }, [refreshSelectedText, inlineActionType, inlineCustomPrompt, inlineCreativity, inlineSelectedTone, inlineTargetLang, buildSystemPrompt]);

  const handleInlineApply = useCallback((behavior) => {
    if (!inlineResult) return;
    onInlineAction?.(behavior, inlineResult);
    toast.success({ replace: 'Text replaced', append: 'Content appended', insert: 'Content inserted' }[behavior] || 'Applied');
  }, [inlineResult, onInlineAction]);

  // ─── Clipboard helper ──────────────────────────────────────────────────────

  const copyToClipboard = useCallback(async (text, setter) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
      toast.success('Copied');
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
        ta.setAttribute('readonly', '');
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) { setter(true); setTimeout(() => setter(false), 2000); toast.success('Copied'); }
        else toast.error('Failed to copy');
      } catch { toast.error('Failed to copy'); }
    }
  }, []);

  const handleInlineCopy = useCallback(() => copyToClipboard(inlineResult, setInlineCopied), [inlineResult, copyToClipboard]);
  const copyText = useCallback((text) => copyToClipboard(text, setCopied), [copyToClipboard]);

  const handleInlineDownload = useCallback(() => {
    if (!inlineResult) return;
    const blob = new Blob([inlineResult], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `athena-${inlineActionType}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded');
  }, [inlineResult, inlineActionType]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const wordDelta = inlineWordCount.result - inlineWordCount.original;
  const wordDeltaLabel = wordDelta === 0 ? '±0' : wordDelta > 0 ? `+${wordDelta}` : `${wordDelta}`;
  const wordDeltaColor = wordDelta > 0 ? 'text-orange-500' : wordDelta < 0 ? 'text-blue-500' : 'text-slate-400';

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            left: panelPosition.x,
            top: panelPosition.y,
            width: 360,
            maxHeight: '85vh',
            zIndex: 600, // Layer 6: Special Floating Panels
            cursor: isDragging ? 'grabbing' : 'default',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 24px 64px -12px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
          }}
        >
        {/* ── Header / Drag Handle ─────────────────────────────────────── */}
        <div
          className="shrink-0 select-none cursor-grab active:cursor-grabbing backdrop-blur-md"
          onMouseDown={handleDragStart}
          style={{ background: 'rgba(255, 255, 255, 0.8)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}
        >
          {/* Title row */}
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2">
              <GripVertical className="w-3 h-3 text-slate-300" />
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-sm shadow-purple-200">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-800 tracking-tight leading-none">Athena Assistant</span>
                <span className="text-[8px] font-medium text-slate-400 mt-0.5">Powered by AI Intelligence</span>
              </div>
              <span className="text-[8px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-full tracking-wider ml-1">PRO</span>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab bar - Modern Pill Design */}
          <div className="px-2 mb-2">
            <div className="flex gap-0.5 bg-slate-100/80 rounded-xl p-1 relative">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={`relative z-10 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-bold transition-all flex-1
                    ${mode === id ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {mode === id && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute inset-0 rounded-lg bg-gradient-to-r ${TABS.find(t => t.id === mode)?.color || 'from-purple-500 to-pink-500'} shadow-sm`}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <Icon className={`w-2.5 h-2.5 relative z-20 ${mode === id ? 'text-white' : 'text-slate-400'}`} />
                  <span className="relative z-20 hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-white/50 backdrop-blur-sm" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >



          {/* ══ IMAGE GENERATOR ══════════════════════════════════════════ */}
          {mode === 'image' && (
            <div className="p-3 space-y-2.5">
              {/* Prompt */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <SectionLabel>Describe your image</SectionLabel>
                  <span className="text-[9px] text-slate-400">{imagePrompt.trim().split(/\s+/).filter(Boolean).length} words</span>
                </div>
                <Textarea
                  ref={imagePromptRef}
                  placeholder="A serene mountain lake at golden hour, reflections of pine trees…"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleGenerateImage(); }}
                  className="min-h-[52px] max-h-[90px] resize-none bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:border-blue-400 focus:bg-white transition-all"
                />
              </div>

              {/* Style */}
              <div className="space-y-1">
                <SectionLabel>Style</SectionLabel>
                <div className="grid grid-cols-4 gap-1">
                  {IMAGE_STYLES.map(({ value, label, emoji }) => (
                    <button
                      key={value}
                      onClick={() => setImageStyle(value)}
                      className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-center transition-all
                        ${imageStyle === value
                          ? 'border-blue-400 bg-blue-50 shadow-sm'
                          : 'border-slate-150 bg-white hover:border-blue-200 hover:bg-slate-50'}`}
                    >
                      <span className="text-sm leading-none">{emoji}</span>
                      <span className={`text-[8px] font-semibold leading-tight ${imageStyle === value ? 'text-blue-700' : 'text-slate-500'}`}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <Button
                onClick={handleGenerateImage}
                disabled={imageLoading || imagePrompt.trim().split(/\s+/).filter(Boolean).length < 2}
                className="w-full h-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-semibold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {imageLoading
                  ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Generating…</>
                  : <><ImageIcon className="w-3 h-3 mr-1.5" />Generate Image</>}
              </Button>

              {/* Loading */}
              <AnimatePresence>
                {imageLoading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 p-2.5 bg-purple-50 rounded-lg border border-purple-100"
                  >
                    <Loader2 className="w-4 h-4 text-purple-500 animate-spin shrink-0" />
                    <span className="text-[10px] text-purple-700 font-medium">AI is painting your vision…</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result */}
              <AnimatePresence>
                {generatedImageUrl && !imageLoading && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={generatedImageUrl}
                        alt={imagePrompt}
                        className="w-full object-cover rounded-lg"
                        style={{ maxHeight: 180 }}
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    {enhancedPrompt && (
                      <p className="text-[9px] text-slate-400 italic line-clamp-2 px-0.5">{enhancedPrompt}</p>
                    )}
                    <div className="flex gap-1.5">
                      <Button
                        onClick={handleInsertImage}
                        disabled={imageInserted}
                        className={`flex-1 h-7 font-semibold text-[10px] rounded-md transition-all
                          ${imageInserted ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-[#0c496e] to-[#1a3fa3] text-white hover:opacity-90'}`}
                      >
                        {imageInserted
                          ? <><CheckCircle2 className="w-3 h-3 mr-1" />Inserted!</>
                          : <><CheckCircle2 className="w-3 h-3 mr-1" />Insert</>}
                      </Button>
                      <IconBtn onClick={handleRegenerateImage} title="Regenerate" className="border border-slate-200 rounded-md w-7 h-7 flex items-center justify-center">
                        <RotateCw className="w-3 h-3" />
                      </IconBtn>
                      <a
                        href={generatedImageUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 text-slate-500 hover:bg-blue-50 hover:border-blue-200 transition-all"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ══ DOCUMENT GENERATOR ═══════════════════════════════════════ */}
          {mode === 'document' && (
            <div className="p-3 space-y-3">
              {/* Topic */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <SectionLabel>Topic <span className="text-red-400 normal-case font-normal">*</span></SectionLabel>
                  <span className="text-[9px] text-slate-400">{topic.length} chars · Ctrl+Enter</span>
                </div>
                <Textarea
                  ref={topicRef}
                  placeholder="Describe your document topic…"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleGenerate(); }}
                  className="min-h-[52px] max-h-[90px] resize-none bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:border-blue-400 focus:bg-white transition-all"
                />
              </div>

              {/* Doc type */}
              <div className="space-y-1">
                <SectionLabel>Type</SectionLabel>
                <div className="grid grid-cols-4 gap-1">
                  {DOCUMENT_TYPES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setDocType(value)}
                      className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-center transition-all
                        ${docType === value ? 'border-blue-400 bg-blue-50' : 'border-slate-150 bg-white hover:border-blue-200 hover:bg-slate-50'}`}
                    >
                      <Icon className={`w-3 h-3 ${docType === value ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className={`text-[8px] font-semibold leading-tight ${docType === value ? 'text-blue-700' : 'text-slate-500'}`}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone + Length */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <SectionLabel>Tone</SectionLabel>
                  <div className="grid grid-cols-3 gap-0.5">
                    {TONES.map(({ value, emoji }) => (
                      <button
                        key={value}
                        onClick={() => setTone(value)}
                        title={value}
                        className={`flex flex-col items-center gap-0.5 p-1 rounded-md border text-center transition-all
                          ${tone === value ? 'border-blue-400 bg-blue-50' : 'border-slate-150 bg-white hover:border-blue-200'}`}
                      >
                        <span className="text-xs">{emoji}</span>
                        <span className={`text-[7px] font-semibold truncate w-full text-center ${tone === value ? 'text-blue-700' : 'text-slate-500'}`}>{value}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <SectionLabel>Length</SectionLabel>
                  <div className="space-y-0.5">
                    {LENGTH_OPTIONS.map(({ value, label, desc }) => (
                      <button
                        key={value}
                        onClick={() => setPages(value)}
                        className={`w-full flex items-center justify-between px-2 py-1 rounded-md border transition-all
                          ${pages === value ? 'border-blue-400 bg-blue-50' : 'border-slate-150 bg-white hover:border-blue-200'}`}
                      >
                        <span className={`text-[9px] font-semibold ${pages === value ? 'text-blue-700' : 'text-slate-600'}`}>{label}</span>
                        <span className="text-[8px] text-slate-400 font-mono">{desc}</span>
                      </button>
                    ))}
                  </div>
                  <div className="pt-1">
                    <div className="flex justify-between mb-0.5">
                      <SectionLabel>Creativity</SectionLabel>
                      <Badge className="bg-blue-50 text-blue-600">{Math.round(creativity[0] * 100)}%</Badge>
                    </div>
                    <Slider value={creativity} onValueChange={setCreativity} max={1} step={0.1} />
                  </div>
                </div>
              </div>

              {/* Progress */}
              <AnimatePresence>
                {isGenerating && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                    <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-blue-700 truncate">{genProgress}</p>
                      {genWordCount > 0 && (
                        <div className="w-full bg-blue-100 rounded-full h-0.5 mt-1">
                          <div className="bg-blue-500 h-0.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (genWordCount / (pages * 380)) * 100)}%` }} />
                        </div>
                      )}
                    </div>
                    <button onClick={abort} className="text-[9px] text-red-500 hover:text-red-700 font-semibold shrink-0">Stop</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}
                  className="h-8 px-3 border border-slate-200 text-slate-500 font-medium text-xs">Cancel</Button>
                <Button onClick={handleGenerate} disabled={!topic.trim() || isGenerating}
                  className="flex-1 h-8 bg-gradient-to-r from-[#0c496e] to-[#1a3fa3] hover:opacity-90 text-white font-semibold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50">
                  {isGenerating
                    ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Generating…</>
                    : <><Sparkles className="w-3 h-3 mr-1.5" />Generate {docType}</>}
                </Button>
              </div>
            </div>
          )}

          {/* ══ QUICK TRANSFORM ══════════════════════════════════════════ */}
          {mode === 'transform' && (
            <div className="p-3 space-y-2.5">
              {/* Selected text preview */}
              {currentSelectedText?.trim() ? (
                <div className={`p-2 rounded-lg border transition-all ${
                  selectionUpdated 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-amber-50 border-amber-100'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <SectionLabel className={selectionUpdated ? 'text-green-700' : 'text-amber-700'}>
                        {selectionUpdated ? '✓ Updated' : 'Selected'}
                      </SectionLabel>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge className={selectionUpdated ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                        {currentSelectedText.trim().split(/\s+/).filter(Boolean).length} words
                      </Badge>
                      {onGetSelectedText && (
                        <button
                          onClick={refreshSelectedText}
                          className="p-1 hover:bg-amber-100 rounded transition-colors"
                          title="Refresh selection"
                        >
                          <RefreshCw className="w-3 h-3 text-amber-600" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 line-clamp-2 italic border-l-2 border-amber-300 pl-2">{currentSelectedText.trim()}</p>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center">
                  <p className="text-[10px] text-slate-400">Select text in the document to begin</p>
                </div>
              )}

              {/* Action grid */}
              <div className="grid grid-cols-3 gap-1.5">
                {QUICK_ACTIONS.map(({ id, label, icon: Icon, color, bg, border }) => (
                  <button
                    key={id}
                    onClick={() => handleQuickAction(id)}
                    disabled={!!activeAction || !currentSelectedText?.trim()}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all disabled:opacity-40
                      ${activeAction === id ? `${bg} ${border} scale-95` : `bg-white border-slate-150 hover:${border} ${bg} transition-all`}`}
                  >
                    {activeAction === id
                      ? <Loader2 className={`w-4 h-4 animate-spin ${color}`} />
                      : <Icon className={`w-4 h-4 ${color}`} />}
                    <span className="text-[9px] font-semibold text-slate-600">{label}</span>
                  </button>
                ))}
              </div>

              

              {/* Error */}
              <AnimatePresence>
                {actionError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-100 text-[10px] text-red-600">
                    <AlertCircle className="w-3 h-3 shrink-0" />{actionError}
                    <button className="ml-auto" onClick={() => setActionError('')}><X className="w-3 h-3" /></button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result */}
              <AnimatePresence>
                {actionResult && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        <SectionLabel className="text-blue-700">Result</SectionLabel>
                      </div>
                      <IconBtn onClick={() => copyText(actionResult)} title="Copy">
                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </IconBtn>
                    </div>
                    <div className="max-h-36 overflow-y-auto rounded-lg p-2.5 bg-blue-50/60 border border-blue-100 text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap"
                      style={{ scrollbarWidth: 'thin' }}>
                      {actionResult}
                    </div>
                    <div className="flex gap-1.5">
                      <Button onClick={() => applyResult('replace')}
                        className="flex-1 h-7 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-[10px] rounded-md hover:opacity-90">
                        <Check className="w-3 h-3 mr-1" />Replace
                      </Button>
                      <Button variant="outline" onClick={() => applyResult('append')}
                        className="flex-1 h-7 border border-slate-200 text-slate-600 font-semibold text-[10px] rounded-md hover:bg-slate-50">
                        <Plus className="w-3 h-3 mr-1" />Append
                      </Button>
                      <IconBtn onClick={() => setActionResult('')} title="Dismiss" className="border border-slate-200 rounded-md w-7 h-7 flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </IconBtn>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}




            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    )}
    </AnimatePresence>,
    document.body
  );
};