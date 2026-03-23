import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { TextEditorService } from '../../../../services/Text-Editor/text.service.js';
import {
  Sparkles, Wand2, Edit3, MessageSquare, CheckCircle, ArrowRight,
  Send, RefreshCw, Copy, Check, User, Zap, Trash2, FileText,
  CheckCircle2, Languages, AlignLeft, Expand, Minimize2,
  RotateCcw, X, AlertCircle, List, BookOpen, Globe,
  Plus, History, Bookmark, Download, Share2,
  Eye, EyeOff, Star, Clock, Filter, ChevronDown as ChevronDownIcon, ChevronUp as ChevronUpIcon, Bold,
  Italic, Underline, AlignLeft as AlignLeftIcon, AlignCenter, AlignRight,
  ListOrdered, ListChecks, Quote, Code, Link, Image, Table, Mic,
  Volume2, ThumbsUp, ThumbsDown, Save, Settings, HelpCircle,
  ImageIcon, Layers, Type, Hash, Maximize2, SlidersHorizontal, GripVertical,
  PenLine, Newspaper, GraduationCap, Briefcase, BookMarked,
  FileEdit, Mail, Package, ScrollText, BookOpen as BookOpenIcon,
  Palette, Mountain, Camera, Aperture, Cpu, Leaf, Building2, Users,
  CheckSquare, LayoutTemplate, Loader2, ArrowLeft, RotateCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────

const TONES = [
  { value: 'Professional', label: 'Professional', emoji: '💼' },
  { value: 'Casual', label: 'Casual', emoji: '😊' },
  { value: 'Formal', label: 'Formal', emoji: '🎩' },
  { value: 'Informal', label: 'Informal', emoji: '🤝' },
  { value: 'Friendly', label: 'Friendly', emoji: '🌟' },
  { value: 'Confident', label: 'Confident', emoji: '🔥' },
  { value: 'Academic', label: 'Academic', emoji: '🎓' },
  { value: 'Persuasive', label: 'Persuasive', emoji: '📢' },
  { value: 'Neutral', label: 'Neutral', emoji: '⚖️' },
];

const DOCUMENT_TYPES = [
  { value: 'Blog Post', label: 'Blog Post', icon: PenLine, desc: 'Engaging web content' },
  { value: 'Research Paper', label: 'Research Paper', icon: GraduationCap, desc: 'Academic study' },
  { value: 'Business Report', label: 'Business Report', icon: Briefcase, desc: 'Corporate analysis' },
  { value: 'Technical Document', label: 'Technical Doc', icon: Cpu, desc: 'Technical spec/guide' },
  { value: 'Essay', label: 'Essay', icon: FileEdit, desc: 'Structured argument' },
  { value: 'Email Newsletter', label: 'Newsletter', icon: Mail, desc: 'Email broadcast' },
  { value: 'Product Description', label: 'Product Desc', icon: Package, desc: 'Marketing copy' },
  { value: 'Meeting Minutes', label: 'Meeting Minutes', icon: ScrollText, desc: 'Meeting record' },
  { value: 'Creative Story', label: 'Story', icon: BookOpenIcon, desc: 'Narrative fiction' },
  { value: 'User Manual', label: 'User Manual', icon: BookMarked, desc: 'How-to guide' },
  { value: 'Press Release', label: 'Press Release', icon: Newspaper, desc: 'News announcement' },
  { value: 'Proposal', label: 'Proposal', icon: LayoutTemplate, desc: 'Project proposal' },
];

const LENGTH_OPTIONS = [
  { value: 1, label: 'Brief', desc: '~380 words', pages: 1 },
  { value: 2, label: 'Standard', desc: '~760 words', pages: 2 },
  { value: 3, label: 'Detailed', desc: '~1,140 words', pages: 3 },
  { value: 5, label: 'Comprehensive', desc: '~1,900 words', pages: 5 },
  { value: 10, label: 'In-depth', desc: '~3,800 words', pages: 10 },
];

const IMAGE_STYLES = [
  { value: 'photorealistic', label: 'Photorealistic', emoji: '📷' },
  { value: 'digital art', label: 'Digital Art', emoji: '🎨' },
  { value: 'oil painting', label: 'Oil Painting', emoji: '🖼️' },
  { value: 'watercolor', label: 'Watercolor', emoji: '💧' },
  { value: 'pencil sketch', label: 'Sketch', emoji: '✏️' },
  { value: 'cinematic', label: 'Cinematic', emoji: '🎬' },
  { value: 'minimalist', label: 'Minimalist', emoji: '◻️' },
  { value: 'concept art', label: 'Concept Art', emoji: '🚀' },
];

const QUICK_ACTIONS = [
  { id: 'enhance', label: 'Enhance Writing', icon: Wand2, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-100', hoverBorder: 'hover:border-violet-300', description: 'Improve clarity, flow & impact', editorBehavior: 'replace' },
  { id: 'rewrite', label: 'Rewrite', icon: Edit3, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100', hoverBorder: 'hover:border-green-300', description: 'Fresh take, same meaning', editorBehavior: 'replace' },
  { id: 'summarize', label: 'Summarize', icon: AlignLeft, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', hoverBorder: 'hover:border-blue-300', description: 'Condense to key points', editorBehavior: 'append' },
  { id: 'expand', label: 'Expand', icon: Expand, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', hoverBorder: 'hover:border-orange-300', description: 'Add depth and detail', editorBehavior: 'replace' },
  { id: 'simplify', label: 'Simplify', icon: Minimize2, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', hoverBorder: 'hover:border-rose-300', description: 'Simpler words, clearer ideas', editorBehavior: 'replace' },
  { id: 'translate', label: 'Translate', icon: Languages, color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-100', hoverBorder: 'hover:border-cyan-300', description: 'Convert to another language', editorBehavior: 'replace' },
];

const INLINE_ACTIONS = [
  { value: 'rewrite', label: 'Rewrite', icon: Edit3, description: 'Improve clarity and flow', category: 'basic', color: 'emerald' },
  { value: 'expand', label: 'Expand', icon: Plus, description: 'Add more details', category: 'basic', color: 'orange' },
  { value: 'summarize', label: 'Summarize', icon: FileText, description: 'Make it concise', category: 'basic', color: 'blue' },
  { value: 'simplify', label: 'Simplify', icon: Minimize2, description: 'Easier to read', category: 'basic', color: 'violet' },
  { value: 'change_tone', label: 'Change Tone', icon: Wand2, description: 'Adjust the voice', category: 'styling', color: 'pink' },
  { value: 'make_professional', label: 'Professional', icon: Briefcase, description: 'Business-ready tone', category: 'styling', color: 'indigo' },
  { value: 'make_concise', label: 'Make Concise', icon: Minimize2, description: 'Remove fluff', category: 'polish', color: 'red' },
  { value: 'add_examples', label: 'Add Examples', icon: List, description: 'Illustrate with examples', category: 'polish', color: 'amber' },
  { value: 'translate', label: 'Translate', icon: Globe, description: 'Convert language', category: 'advanced', color: 'cyan' },
  { value: 'paraphrase', label: 'Paraphrase', icon: RefreshCw, description: 'Say it differently', category: 'advanced', color: 'teal' },
  { value: 'custom', label: 'Custom Prompt', icon: Wand2, description: 'Your own instruction', category: 'advanced', color: 'slate' },
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

const TRANSLATE_LANGUAGES = [
  'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Chinese (Simplified)', 'Japanese', 'Korean', 'Arabic', 'Hindi',
  'Russian', 'Dutch', 'Polish', 'Turkish', 'Swedish',
];

const INLINE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'basic', label: 'Basic' },
  { id: 'styling', label: 'Styling' },
  { id: 'polish', label: 'Polish' },
  { id: 'advanced', label: 'Advanced' },
];

const CHAT_SUGGESTIONS = [
  { icon: '✍️', label: 'Write an introduction paragraph' },
  { icon: '📝', label: 'Create a bullet point summary' },
  { icon: '🎯', label: 'Generate a conclusion' },
  { icon: '📧', label: 'Draft a professional email' },
];

// ─── AI Prompts ───────────────────────────────────────────────────────────────

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
  translate: (lang) => `You are a professional translator. Translate the given text accurately and naturally into ${lang}. Preserve the original meaning, tone, and structure. Output ONLY the translated text.`,
  change_tone: (tone) => `You are a writing style expert. Rewrite the given text in a ${tone} tone. Preserve all original content and meaning but completely adjust the voice, word choice, and sentence rhythm to match the ${tone} style. Output ONLY the rewritten text.`,
  custom: (instruction) => `You are an expert writing assistant. Follow this instruction precisely: "${instruction}". Apply it to the given text. Output ONLY the result — no explanation, no preamble.`,
  chat: 'You are Athena, a helpful AI writing assistant embedded inside a document editor. Help users write, edit, brainstorm, and improve documents. Be knowledgeable, concise, and friendly. Produce polished, publication-ready content when asked. Use markdown when it improves readability. Keep responses focused and appropriately sized.',
  generate: (type, tone, pages) =>
    `You are an expert ${type} writer. Generate a complete, polished, well-structured ${type} in a ${tone} tone. The document should be approximately ${pages} page${pages > 1 ? 's' : ''} long (roughly ${pages * 380} words). Use appropriate headings, paragraphs, and sections for a ${type}. Output valid HTML using ONLY these tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>. Output ONLY the HTML — no \`\`\`html fences, no preamble. Start directly with the first HTML tag.`,
  generateImage: (prompt, style) =>
    `Create a detailed, vivid image generation prompt for an AI image generator. The subject is: "${prompt}". Style: ${style}. Return ONLY a single optimized prompt string (no explanation, no quotes, no formatting) — dense with visual descriptors, lighting, composition, mood, and technical details that will produce a stunning, high-quality image.`,
};

const ACTION_TEMPERATURE = {
  translate: 0.2,
  summarize: 0.3,
  make_concise: 0.3,
  make_professional: 0.4,
  simplify: 0.4,
  rewrite: 0.6,
  enhance: 0.7,
  expand: 0.75,
  add_examples: 0.75,
  paraphrase: 0.8,
  change_tone: 0.6,
  custom: 0.7,
};

// ─── Streaming API call ───────────────────────────────────────────────────────

// Local Claude implementations removed. Now using TextEditorService.

// ─── Image generation via Pollinations (free, no key needed) ─────────────────
function buildPollinationsUrl(prompt, size) {
  const [w, h] = size.split('x');
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&nologo=true&enhance=true&model=flux`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AIAssistant = ({
  open,
  onOpenChange,
  onGenerateDocument,
  onInlineAction,
  onImageInsert,        // (imageUrl: string, altText: string) => void
  selectedText = '',
}) => {
  // ── Tab state ─────────────────────────────────────────────────────────────
  const [mode, setMode] = useState('image'); // 'image' | 'inline' | 'advanced' | 'chat'

  // ── Document generation ───────────────────────────────────────────────────
  const [topic, setTopic]           = useState('');
  const [pages, setPages]           = useState(2);
  const [tone, setTone]             = useState('Professional');
  const [docType, setDocType]       = useState('Blog Post');
  const [creativity, setCreativity] = useState([0.7]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress]   = useState('');
  const [genWordCount, setGenWordCount] = useState(0);

  // ── Image generation ──────────────────────────────────────────────────────
  const [imagePrompt, setImagePrompt]       = useState('');
  const [imageStyle, setImageStyle]         = useState('photorealistic');
  const [imageLoading, setImageLoading]     = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [imageInserted, setImageInserted]   = useState(false);

  // ── Chat ──────────────────────────────────────────────────────────────────
  const [chatInput, setChatInput]     = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatCreativity, setChatCreativity] = useState([0.7]);

  // ── Transform (quick actions) ─────────────────────────────────────────────
  const [activeAction, setActiveAction] = useState(null);
  const [lastAction, setLastAction]     = useState(null);
  const [actionResult, setActionResult] = useState('');
  const [actionError, setActionError]   = useState('');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [targetLang, setTargetLang]     = useState('Spanish');

  // ── Inline Actions (Advanced) ─────────────────────────────────────────────
  const [inlineActionType, setInlineActionType]       = useState('rewrite');
  const [inlineCustomPrompt, setInlineCustomPrompt]   = useState('');
  const [inlineResult, setInlineResult]               = useState('');
  const [inlineError, setInlineError]                 = useState('');
  const [inlineCreativity, setInlineCreativity]       = useState([0.6]);
  const [inlineSelectedTone, setInlineSelectedTone]   = useState('Professional');
  const [inlineTargetLang, setInlineTargetLang]       = useState('Spanish');
  const [inlineLoading, setInlineLoading]             = useState(false);
  const [inlineCopied, setInlineCopied]               = useState(false);
  const [inlineHistory, setInlineHistory]             = useState([]);
  const [inlineSelectedCategory, setInlineSelectedCategory] = useState('all');
  const [showHistory, setShowHistory]                 = useState(false);
  const [inlineWordCount, setInlineWordCount]         = useState({ original: 0, result: 0 });

  // ── Shared ────────────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);

  // ── Floating panel position & size ──────────────────────────────────────────────
  const [panelPosition, setPanelPosition] = useState(() => ({ 
    x: Math.max(50, window.innerWidth - 380), 
    y: Math.max(60, (window.innerHeight - 550) / 2) 
  }));
  const [panelSize, setPanelSize] = useState({ width: 350, height: 550 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);

  const chatEndRef   = useRef(null);
  const abortRef     = useRef(null);
  const chatInputRef = useRef(null);
  const topicRef     = useRef(null);
  const imagePromptRef = useRef(null);
  const contentRef   = useRef(null);

  // ── Auto-scroll chat ──────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // ── Mode selection on open ─────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setMode('image');
      setTimeout(() => imagePromptRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    if (!open) abortRef.current?.abort();
  }, [open]);

  // ── Word count tracking ────────────────────────────────────────────────────
  useEffect(() => {
    const count = (t) => t.trim().split(/\s+/).filter(Boolean).length;
    setInlineWordCount({
      original: count(selectedText),
      result: count(inlineResult),
    });
  }, [selectedText, inlineResult]);

  const abort = () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
  };

  // ── Floating panel drag handlers ─────────────────────────────────────────
  const handleDragStart = useCallback((e) => {
    setIsDragging(true);
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep panel within viewport with better boundaries
    const currentWidth = panelRef.current?.offsetWidth || 350;
    const currentHeight = panelRef.current?.offsetHeight || 550;
    const maxX = window.innerWidth - currentWidth - 50;
    const maxY = window.innerHeight - currentHeight - 50;
    
    setPanelPosition({
      x: Math.max(10, Math.min(newX, maxX)),
      y: Math.max(60, Math.min(newY, maxY))
    });
  }, [isDragging, dragOffset]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // ─────────────────────────────────────────────────────────────────────────
  // DOCUMENT GENERATION
  // ─────────────────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) { toast.error('Please enter a document topic'); return; }
    setIsGenerating(true);
    setGenProgress('Preparing…');
    setGenWordCount(0);
    abortRef.current = new AbortController();

    try {
      let html = '';
      await TextEditorService.generateDocument({
        topic: topic.trim(),
        docType,
        tone,
        pages,
        creativity: creativity[0],
        signal: abortRef.current.signal,
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
      toast.success(`${docType} generated — ${pages} page${pages > 1 ? 's' : ''}!`);
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

  // ─────────────────────────────────────────────────────────────────────────
  // IMAGE GENERATION
  // ─────────────────────────────────────────────────────────────────────────

  const handleGenerateImage = useCallback(async () => {
    const words = imagePrompt.trim().split(/\s+/).filter(Boolean);
    if (words.length < 2) {
      toast.error('Please enter at least 2–3 words describing your image');
      return;
    }

    setImageLoading(true);
    setGeneratedImageUrl('');
    setEnhancedPrompt('');
    setImageInserted(false);
    abortRef.current = new AbortController();

    try {
      // Use the service to generate image with prompt enhancement
      const { url, enhancedPrompt } = await TextEditorService.generateImage({
        prompt: imagePrompt.trim(),
        style: imageStyle,
        enhancePrompt: true,
        signal: abortRef.current.signal,
      });

      setGeneratedImageUrl(url);
      setEnhancedPrompt(enhancedPrompt);
      toast.success('Image generated! Click "Insert into Document" to add it.');
    } catch (err) {
      if (err.name === 'AbortError') return;
      // Fallback: use prompt directly if generation fails
      const fallbackUrl = TextEditorService.buildPollinationsUrl(`${imagePrompt}, ${imageStyle}`, '1024x1024');
      setGeneratedImageUrl(fallbackUrl);
      toast.info('Image ready (using direct prompt)');
    } finally {
      setImageLoading(false);
    }
  }, [imagePrompt, imageStyle]);

  const handleInsertImage = useCallback(() => {
    if (!generatedImageUrl) return;
    const altText = imagePrompt.trim() || 'AI Generated Image';
    onImageInsert?.(generatedImageUrl, altText);
    setImageInserted(true);
    toast.success('Image inserted into document!');
  }, [generatedImageUrl, imagePrompt, onImageInsert]);

  const handleRegenerateImage = useCallback(() => {
    setGeneratedImageUrl('');
    setEnhancedPrompt('');
    setImageInserted(false);
    handleGenerateImage();
  }, [handleGenerateImage]);

  // ─────────────────────────────────────────────────────────────────────────
  // CHAT
  // ─────────────────────────────────────────────────────────────────────────

  const handleChatSend = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || isChatLoading) return;
    const userMsg = { role: 'user', content: text };
    const history = [...chatMessages, userMsg];
    const assistantIdx = history.length;
    setChatMessages([...history, { role: 'assistant', content: '' }]);
    setChatInput('');
    setIsChatLoading(true);
    abortRef.current = new AbortController();
    try {
      await TextEditorService.chatWithAI({
        messages: history,
        creativity: chatCreativity[0],
        signal: abortRef.current.signal,
        onChunk: (full) => {
          setChatMessages((prev) => {
            const next = [...prev];
            next[assistantIdx] = { role: 'assistant', content: full };
            return next;
          });
        },
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

  // ─────────────────────────────────────────────────────────────────────────
  // QUICK TRANSFORM (Transform tab)
  // ─────────────────────────────────────────────────────────────────────────

  const runTransform = useCallback(async (actionId, language) => {
    if (!selectedText?.trim()) { toast.error('Select text in the document first'); return; }
    const lang = language ?? targetLang;
    const systemPrompt = actionId === 'translate' ? PROMPTS.translate(lang) : PROMPTS[actionId];
    if (!systemPrompt) return;
    setActiveAction(actionId);
    setLastAction(actionId);
    setActionResult('');
    setActionError('');
    abortRef.current = new AbortController();
    try {
      await TextEditorService.callAI({
        systemPrompt,
        userPrompt: selectedText,
        temperature: ACTION_TEMPERATURE[actionId] ?? 0.6,
        signal: abortRef.current.signal,
      }).then(setActionResult);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setActionError('Action failed. Please try again.');
    } finally {
      setActiveAction(null);
    }
  }, [selectedText, targetLang]);

  const handleQuickAction = useCallback((id) => {
    if (id === 'translate') { setShowLangPicker(true); return; }
    setShowLangPicker(false);
    runTransform(id);
  }, [runTransform]);

  const applyResult = useCallback((behavior) => {
    if (!actionResult?.trim()) return;
    onInlineAction?.(behavior, actionResult);
    toast.success(behavior === 'replace' ? 'Text replaced' : 'Content appended');
    setActionResult('');
    setLastAction(null);
  }, [actionResult, onInlineAction]);

  // ─────────────────────────────────────────────────────────────────────────
  // INLINE ACTIONS (Advanced tab) — fully wired
  // ─────────────────────────────────────────────────────────────────────────

  const buildSystemPrompt = useCallback(() => {
    switch (inlineActionType) {
      case 'translate':     return PROMPTS.translate(inlineTargetLang);
      case 'change_tone':   return PROMPTS.change_tone(inlineSelectedTone);
      case 'custom':        return inlineCustomPrompt.trim() ? PROMPTS.custom(inlineCustomPrompt.trim()) : null;
      default:              return PROMPTS[inlineActionType] ?? null;
    }
  }, [inlineActionType, inlineTargetLang, inlineSelectedTone, inlineCustomPrompt]);

  const handleInlineTransform = useCallback(async () => {
    if (!selectedText?.trim()) { toast.error('No text selected in document'); return; }
    if (inlineActionType === 'custom' && !inlineCustomPrompt.trim()) {
      toast.error('Please enter your custom instruction');
      return;
    }
    const systemPrompt = buildSystemPrompt();
    if (!systemPrompt) { toast.error('Please configure the action'); return; }

    setInlineLoading(true);
    setInlineResult('');
    setInlineError('');
    abortRef.current = new AbortController();

    try {
      let result = '';
      const transformOptions = {
        text: selectedText,
        action: inlineActionType,
        customPrompt: inlineCustomPrompt.trim(),
        tone: inlineSelectedTone,
        language: inlineTargetLang,
        creativity: ACTION_TEMPERATURE[inlineActionType] ?? inlineCreativity[0],
        signal: abortRef.current.signal,
      };
      
      await TextEditorService.transformText(transformOptions).then((transformed) => {
        result = transformed;
        setInlineResult(transformed);
      });

      if (!result.trim()) throw new Error('Empty response');

      // Save to history
      setInlineHistory(prev => [{
        id: Date.now().toString(),
        timestamp: new Date(),
        action: inlineActionType,
        label: INLINE_ACTIONS.find(a => a.value === inlineActionType)?.label ?? inlineActionType,
        originalText: selectedText.slice(0, 120),
        result: result.trim(),
        creativity: inlineCreativity[0],
        tone: inlineSelectedTone,
        language: inlineTargetLang,
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
  }, [selectedText, inlineActionType, inlineCustomPrompt, inlineCreativity, inlineSelectedTone, inlineTargetLang, buildSystemPrompt]);

  const handleInlineApply = useCallback((behavior) => {
    if (!inlineResult) return;
    onInlineAction?.(behavior, inlineResult);
    const labels = { replace: 'Text replaced', append: 'Content appended', insert: 'Content inserted' };
    toast.success(labels[behavior] || 'Applied to document');
  }, [inlineResult, onInlineAction]);

  const handleInlineCopy = useCallback(() => {
    if (!inlineResult) return;
    navigator.clipboard.writeText(inlineResult).then(() => {
      setInlineCopied(true);
      setTimeout(() => setInlineCopied(false), 2000);
      toast.success('Copied to clipboard');
    });
  }, [inlineResult]);

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

  const copyText = useCallback((text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  const wordDelta = inlineWordCount.result - inlineWordCount.original;
  const wordDeltaLabel = wordDelta === 0 ? '±0' : wordDelta > 0 ? `+${wordDelta}` : `${wordDelta}`;
  const wordDeltaColor = wordDelta > 0 ? 'text-orange-500' : wordDelta < 0 ? 'text-blue-500' : 'text-gray-400';

  const TABS = [
    { id: 'image', label: 'Image Generator', icon: ImageIcon },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.2 }}
        className="fixed overflow-hidden bg-white border-2 border-blue-300/60 rounded-2xl shadow-2xl z-50"
        style={{
          left: panelPosition.x,
          top: panelPosition.y,
          width: panelSize.width,
          minHeight: 500,
          maxHeight: '85vh',
          cursor: isDragging ? 'grabbing' : 'default',
          resize: 'both',
          overflow: 'auto'
        }}
      >
        {/* ── Drag Handle / Header ─────────────────────────────────────── */}
        <div 
          className="bg-gradient-to-r from-[#0a3d5c] via-[#0c496e] to-[#1a3fa3] px-4 py-3 text-white shrink-0 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleDragStart}
          title="Drag to move • Corner to resize"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-white/15 rounded-lg">
                <GripVertical className="w-4 h-4 text-white/60" />
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white/15 rounded-lg">
                  <Sparkles className="w-4 h-4" style={{ color: '#fbbf24' }} />
                </div>
                <span className="text-sm font-bold tracking-tight">Athena AI</span>
                <span className="text-[9px] font-semibold text-white/50 bg-white/10 px-1.5 py-0.5 rounded-full uppercase">Pro</span>
              </div>
            </div>
            <button 
              onClick={() => onOpenChange(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 bg-black/20 rounded-xl p-1 mt-3">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setMode(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all flex-1 justify-center
                  ${mode === id
                    ? 'bg-white text-[#0c496e] shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar">
          {mode === 'document' && (
            <div className="p-5 space-y-5">

              {/* Topic */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-[#0c496e] uppercase tracking-wider flex items-center gap-1">
                  Document Topic <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  ref={topicRef}
                  placeholder="Describe your document topic… e.g., 'The impact of AI on modern healthcare — covering diagnostics, patient care, and ethical concerns'"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleGenerate(); }}
                  className="min-h-[80px] resize-none bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 focus:bg-white transition-all"
                />
                <div className="flex justify-between items-center px-0.5">
                  <p className="text-[10px] text-slate-400">Ctrl+Enter to generate quickly</p>
                  <p className="text-[10px] text-slate-400">{topic.length} chars</p>
                </div>
              </div>

              {/* Document Type grid */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-[#0c496e] uppercase tracking-wider">Document Type</Label>
                <div className="grid grid-cols-4 gap-2">
                  {DOCUMENT_TYPES.map(({ value, label, icon: Icon, desc }) => (
                    <button key={value} onClick={() => setDocType(value)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-center transition-all
                        ${docType === value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50 text-slate-600'}`}>
                      <Icon className={`w-4 h-4 ${docType === value ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-bold leading-tight">{label}</span>
                      <span className="text-[9px] text-slate-400 leading-tight hidden sm:block">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone + Length row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Tone selector */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-[#0c496e] uppercase tracking-wider">Tone</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TONES.map(({ value, label, emoji }) => (
                      <button key={value} onClick={() => setTone(value)}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[10px] font-semibold transition-all
                          ${tone === value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-slate-50 hover:border-blue-200 text-slate-600'}`}>
                        <span>{emoji}</span>
                        <span className="truncate">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Length selector */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-[#0c496e] uppercase tracking-wider">Length</Label>
                  <div className="space-y-1.5">
                    {LENGTH_OPTIONS.map(({ value, label, desc }) => (
                      <button key={value} onClick={() => setPages(value)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border-2 transition-all
                          ${pages === value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-100 bg-white hover:border-blue-200'}`}>
                        <span className={`text-xs font-bold ${pages === value ? 'text-blue-700' : 'text-slate-700'}`}>{label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Creativity */}
                  <div className="pt-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-[#0c496e] uppercase tracking-wider">Creativity</span>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{Math.round(creativity[0] * 100)}%</span>
                    </div>
                    <Slider value={creativity} onValueChange={setCreativity} max={1} step={0.1} className="w-full" />
                  </div>
                </div>
              </div>

              {/* Progress */}
              <AnimatePresence>
                {isGenerating && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-blue-700">{genProgress}</div>
                      {genWordCount > 0 && (
                        <div className="w-full bg-blue-100 rounded-full h-1 mt-1.5">
                          <div className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (genWordCount / (pages * 380)) * 100)}%` }} />
                        </div>
                      )}
                    </div>
                    <button onClick={abort} className="text-[10px] text-red-500 hover:text-red-700 font-semibold">Stop</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generate button */}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}
                  className="h-10 px-5 border-2 border-slate-200 text-slate-600 font-semibold text-xs">Cancel</Button>
                <Button onClick={handleGenerate} disabled={!topic.trim() || isGenerating}
                  className="flex-1 h-11 bg-gradient-to-r from-[#0c496e] to-[#1a3fa3] hover:opacity-90 text-white font-bold text-sm rounded-xl shadow-lg transition-all hover:scale-[1.01] disabled:opacity-50">
                  {isGenerating
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
                    : <><Sparkles className="w-4 h-4 mr-2" />Generate {docType}</>}
                </Button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
               IMAGE GENERATOR
          ══════════════════════════════════════════════════════════════ */}
          {mode === 'image' && (
            <div className="p-2.5 space-y-2.5 pb-8">

              {/* Prompt input - Compact */}
              <div className="space-y-1">
                <Label className="text-[8px] font-bold text-[#0c496e] uppercase tracking-wider flex items-center gap-1">
                  <ImageIcon className="w-2.5 h-2.5" /> Image Description <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Textarea
                    ref={imagePromptRef}
                    placeholder="Describe the image you want…"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleGenerateImage(); }}
                    className="min-h-[50px] resize-none bg-slate-50 border-2 border-slate-200 rounded-md p-1.5 text-[11px] pr-12 focus:border-blue-400 focus:bg-white transition-all"
                  />
                  <div className="absolute bottom-1 right-1 text-[8px] text-slate-400 bg-white px-1 py-0.5 rounded border">
                    {imagePrompt.trim().split(/\s+/).filter(Boolean).length}w
                  </div>
                </div>
                {imagePrompt.trim().split(/\s+/).filter(Boolean).length < 2 && imagePrompt.length > 0 && (
                  <p className="text-[9px] text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-2 h-2" /> Min 2-3 words
                  </p>
                )}
              </div>

              {/* Style Selection - More Compact */}
              <div className="space-y-1.5">
                <Label className="text-[8px] font-bold text-[#0c496e] uppercase tracking-wider">Style</Label>
                <div className="grid grid-cols-4 gap-1">
                  {IMAGE_STYLES.map(({ value, label, emoji }) => (
                    <button key={value} onClick={() => setImageStyle(value)}
                      className={`flex flex-col items-center gap-0.5 p-1 rounded-md border-2 text-[8px] font-semibold transition-all
                        ${imageStyle === value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-100 bg-white hover:border-blue-200 text-slate-600'}`}>
                      <span className="text-base">{emoji}</span>
                      <span className="truncate w-full text-center leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <Button onClick={handleGenerateImage}
                disabled={imageLoading || imagePrompt.trim().split(/\s+/).filter(Boolean).length < 2}
                className="w-full h-9 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-bold text-xs rounded-lg shadow-lg transition-all hover:scale-[1.01] disabled:opacity-50">
                {imageLoading
                  ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generating…</>
                  : <><ImageIcon className="w-3.5 h-3.5 mr-1.5" />Generate Image</>}
              </Button>

              {/* Loading state - Compact */}
              <AnimatePresence>
                {imageLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-1.5 p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-md border border-purple-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-700">Generating…</p>
                      <p className="text-[8px] text-slate-500 mt-0.5">Please wait</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generated image result - Compact */}
              <AnimatePresence>
                {generatedImageUrl && !imageLoading && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="space-y-2">

                    {/* Image preview */}
                    <div className="relative rounded-md overflow-hidden border-2 border-slate-200 bg-slate-100">
                      <img
                        src={generatedImageUrl}
                        alt={imagePrompt}
                        className="w-full object-cover rounded-md"
                        style={{ maxHeight: 200 }}
                        onLoad={(e) => e.target.style.opacity = 1}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                        }}
                        loading="lazy"
                      />
                      {/* Fallback */}
                      <div className="hidden items-center justify-center h-28 text-slate-400 flex-col gap-1">
                        <ImageIcon className="w-5 h-5 opacity-40" />
                        <p className="text-[9px]">Loading…</p>
                        <a href={generatedImageUrl} target="_blank" rel="noreferrer"
                          className="text-[9px] text-blue-600 underline">Open</a>
                      </div>
                    </div>

                    {/* Action buttons - Compact */}
                    <div className="flex gap-1">
                      <Button onClick={handleInsertImage} disabled={imageInserted}
                        className={`flex-1 h-7 font-bold text-[10px] rounded-md transition-all
                          ${imageInserted
                            ? 'bg-green-600 text-white'
                            : 'bg-gradient-to-r from-[#0c496e] to-[#1a3fa3] hover:opacity-90 text-white shadow-sm'}`}>
                        {imageInserted
                          ? <><CheckCircle2 className="w-3 h-3 mr-1" />Done!</>
                          : <><CheckCircle2 className="w-3 h-3 mr-1" />Insert</>}
                      </Button>
                      <button onClick={handleRegenerateImage}
                        className="flex items-center justify-center px-2 h-7 rounded-md border-2 border-slate-200 text-slate-600 hover:border-purple-300 hover:bg-purple-50 font-semibold text-[10px] transition-all">
                        <RotateCw className="w-2.5 h-2.5" />
                      </button>
                      <a href={generatedImageUrl} download target="_blank" rel="noreferrer"
                        className="flex items-center justify-center p-0 h-7 w-7 rounded-md border-2 border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50 transition-all">
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
               ADVANCED INLINE ACTIONS
          ══════════════════════════════════════════════════════════════ */}
          {mode === 'advanced' && (
            <div className="p-4 space-y-4">

              {/* Header tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <button onClick={() => setShowHistory(false)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${!showHistory ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                  Transform
                </button>
                <button onClick={() => setShowHistory(true)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${showHistory ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                  <History className="w-3.5 h-3.5" /> History ({inlineHistory.length})
                </button>
              </div>

              {showHistory ? (
                /* ── History panel ─────────────────────────────────── */
                <div className="space-y-3">
                  {inlineHistory.length === 0 ? (
                    <div className="text-center py-10">
                      <History className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                      <p className="text-sm text-slate-400">No history yet. Transform some text to see it here.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">{inlineHistory.length} transformations</span>
                        <button onClick={() => setInlineHistory([])} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Clear
                        </button>
                      </div>
                      <div className="space-y-2">
                        {inlineHistory.map((item) => (
                          <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-all">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{item.label}</span>
                                <p className="text-[10px] text-slate-500 font-mono">{item.timestamp.toLocaleTimeString()}</p>
                              </div>
                              <button onClick={() => { setInlineResult(item.result); setShowHistory(false); }}
                                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5">
                                Load <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-500 italic line-clamp-1">"{item.originalText}…"</p>
                            <p className="text-xs text-slate-700 line-clamp-2 mt-1">{item.result.slice(0, 100)}…</p>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* ── Transform panel ──────────────────────────────── */
                <>
                  {/* Selected text preview */}
                  {selectedText?.trim() ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Selected Text</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-bold">{inlineWordCount.original} words</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 italic border-l-2 border-amber-300 pl-2">"{selectedText.trim()}"</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-center">
                      <p className="text-xs text-slate-400">Select text in the document to transform it</p>
                    </div>
                  )}

                  {/* Category filter */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {INLINE_CATEGORIES.map(cat => (
                      <button key={cat.id} onClick={() => setInlineSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border
                          ${inlineSelectedCategory === cat.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200'}`}>
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Action grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {INLINE_ACTIONS.filter(a => inlineSelectedCategory === 'all' || a.category === inlineSelectedCategory).map((action) => {
                      const Icon = action.icon;
                      const isActive = inlineActionType === action.value;
                      return (
                        <button key={action.value} onClick={() => setInlineActionType(action.value)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all
                            ${isActive ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50'}`}>
                          <div className={`p-2 rounded-lg transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className={`text-[10px] font-bold text-center leading-tight ${isActive ? 'text-blue-700' : 'text-slate-600'}`}>{action.label}</span>
                          {isActive && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Conditional sub-options */}
                  <AnimatePresence mode="wait">
                    {inlineActionType === 'custom' && (
                      <motion.div key="custom" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Your Instruction</Label>
                        <Textarea
                          placeholder="e.g., 'Rewrite in the style of Ernest Hemingway', 'Add scientific citations', 'Convert to bullet points'…"
                          value={inlineCustomPrompt}
                          onChange={(e) => setInlineCustomPrompt(e.target.value)}
                          className="min-h-[80px] resize-none bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-sm focus:border-blue-400 focus:bg-white transition-all"
                        />
                      </motion.div>
                    )}

                    {inlineActionType === 'change_tone' && (
                      <motion.div key="tone" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Tone</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {INLINE_TONES.map(t => (
                            <button key={t} onClick={() => setInlineSelectedTone(t)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all
                                ${inlineSelectedTone === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-200'}`}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {inlineActionType === 'translate' && (
                      <motion.div key="translate" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Language</Label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {INLINE_LANGUAGES.map(lang => (
                            <button key={lang} onClick={() => setInlineTargetLang(lang)}
                              className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all
                                ${inlineTargetLang === lang ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-200'}`}>
                              {lang}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Controls row */}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Creativity</Label>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{Math.round(inlineCreativity[0] * 100)}%</span>
                      </div>
                      <Slider value={inlineCreativity} onValueChange={setInlineCreativity} max={1} step={0.1} />
                    </div>
                    <Button onClick={handleInlineTransform}
                      disabled={inlineLoading || !selectedText?.trim() || (inlineActionType === 'custom' && !inlineCustomPrompt.trim())}
                      className="h-11 px-6 bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all disabled:opacity-40">
                      {inlineLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</> : <><Zap className="w-4 h-4 mr-2 text-yellow-400" />Transform</>}
                    </Button>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {inlineError && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-600">
                        <AlertCircle className="w-4 h-4 shrink-0" />{inlineError}
                        <button className="ml-auto" onClick={() => setInlineError('')}><X className="w-3.5 h-3.5" /></button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Result preview */}
                  <AnimatePresence>
                    {(inlineResult || inlineLoading) && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-500" />
                            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Result</span>
                            {inlineResult && (
                              <div className="flex items-center gap-2 ml-2">
                                <span className="text-[10px] text-slate-400">{inlineWordCount.result} words</span>
                                <span className={`text-[10px] font-bold ${wordDeltaColor}`}>{wordDeltaLabel}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={handleInlineCopy} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-all">
                              {inlineCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button onClick={handleInlineTransform} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-all" title="Regenerate">
                              <RotateCw className={`w-4 h-4 ${inlineLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <button onClick={handleInlineDownload} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-all">
                              <Download className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setInlineResult(''); setInlineError(''); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="min-h-[100px] max-h-[280px] overflow-y-auto custom-scrollbar p-4 bg-gradient-to-br from-blue-50/60 to-white border border-blue-100 rounded-2xl text-sm text-slate-700 leading-relaxed whitespace-pre-wrap relative">
                          {inlineResult || (
                            <div className="flex items-center justify-center h-20 text-slate-400 italic text-xs gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" /> Generating…
                            </div>
                          )}
                          {inlineLoading && inlineResult && (
                            <div className="absolute bottom-3 right-3 flex gap-1">
                              {[0, 1, 2].map(i => (
                                <div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                              ))}
                            </div>
                          )}
                        </div>

                        {!inlineLoading && inlineResult && (
                          <div className="flex gap-2">
                            <Button onClick={() => handleInlineApply('replace')}
                              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg hover:opacity-90">
                              <Check className="w-4 h-4 mr-2" /> Replace Selection
                            </Button>
                            <Button variant="outline" onClick={() => handleInlineApply('append')}
                              className="flex-1 h-11 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">
                              <Plus className="w-4 h-4 mr-2" /> Append After
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
               CHAT
          ══════════════════════════════════════════════════════════════ */}
          {mode === 'chat' && (
            <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-base font-bold text-slate-800 mb-1">How can I help?</h3>
                      <p className="text-xs text-slate-500">Ask anything, or pick a suggestion</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                      {CHAT_SUGGESTIONS.map((s, i) => (
                        <button key={i} onClick={() => setChatInput(s.label)}
                          className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 text-slate-600 text-xs font-medium transition-all text-left flex items-center gap-2">
                          <span className="text-base">{s.icon}</span>{s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex gap-3 items-end ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'}`}>
                          {msg.role === 'user' ? <User className="w-4 h-4" strokeWidth={2.5} /> : <Sparkles className="w-4 h-4" />}
                        </div>
                        <div className={`flex flex-col gap-1.5 max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-3 text-sm rounded-2xl whitespace-pre-wrap leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-br-sm' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'}`}>
                            {msg.content || <span className="text-slate-400 text-xs italic">Thinking…</span>}
                          </div>
                          {msg.role === 'assistant' && msg.content && (
                            <div className="flex items-center gap-1">
                              <button onClick={() => copyText(msg.content)}
                                className="p-1 bg-white hover:bg-blue-50 border border-slate-100 rounded-lg shadow-sm text-[10px] font-semibold flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-all">
                                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                              <button onClick={() => { onInlineAction?.('insert', msg.content); toast.success('Inserted at cursor'); }}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-600 border border-blue-100 hover:border-blue-600 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 text-blue-600 transition-all">
                                <CheckCircle2 className="w-3 h-3" /> Insert
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isChatLoading && chatMessages[chatMessages.length - 1]?.content === '' && (
                      <div className="flex gap-3 items-end">
                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                        <div className="px-4 py-3 text-sm rounded-2xl bg-white border border-slate-100 rounded-bl-sm shadow-sm flex items-center gap-1.5">
                          {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </>
                )}
              </div>

              {/* Chat input */}
              <div className="p-4 bg-white/90 border-t border-slate-100 space-y-2 shrink-0">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Creativity</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{Math.round(chatCreativity[0] * 100)}%</span>
                  </div>
                  {chatMessages.length > 0 && (
                    <button onClick={() => { abort(); setChatMessages([]); setIsChatLoading(false); }}
                      className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <Slider value={chatCreativity} onValueChange={setChatCreativity} max={1} step={0.1} />
                <div className="relative">
                  <Textarea
                    ref={chatInputRef}
                    placeholder="Ask Athena anything… (Enter to send, Shift+Enter for new line)"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                    className="min-h-[72px] max-h-[140px] resize-none text-sm bg-slate-50 border-slate-200 rounded-2xl p-4 pr-12 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    onClick={isChatLoading ? abort : handleChatSend}
                    disabled={!isChatLoading && !chatInput.trim()}
                    className={`absolute right-2 bottom-2 w-9 h-9 flex items-center justify-center rounded-xl text-white shadow-md disabled:opacity-50 transition-all ${isChatLoading ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:opacity-90'}`}>
                    {isChatLoading ? <X className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Resize handle indicator */}
          <div className="absolute bottom-1 right-1 w-4 h-4 pointer-events-none opacity-30">
            <svg viewBox="0 0 10 10" className="w-full h-full fill-slate-400">
              <path d="M10 0 L10 10 L0 10 Z" />
            </svg>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};