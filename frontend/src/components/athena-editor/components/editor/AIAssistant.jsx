import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import {
  Sparkles, Wand2, Edit3, MessageSquare, CheckCircle, ArrowRight,
  Send, RefreshCw, Copy, Check, User, Zap, Trash2, FileText,
  CheckCircle2, Languages, AlignLeft, Expand, Minimize2,
  RotateCcw, X, AlertCircle,
} from 'lucide-react';
import { AIInlineActions } from './AIInlineActions.tsx';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────

const TONES = ['Professional', 'Casual', 'Friendly', 'Confident', 'Enthusiastic', 'Neutral'];

const DOCUMENT_TYPES = [
  'Technical Document',
  'Blog Post',
  'Research Paper',
  'Business Report',
  'Creative Story',
  'Meeting Minutes',
  'Essay',
  'Product Description',
  'Email Newsletter',
  'User Manual',
];

const QUICK_ACTIONS = [
  {
    id: 'enhance',
    label: 'Enhance Writing',
    icon: Wand2,
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    hoverBorder: 'hover:border-violet-200',
    description: 'Improve clarity, flow & impact',
    // After result: offers Replace Selected text in editor
    editorBehavior: 'replace',
  },
  {
    id: 'grammar_fix',
    label: 'Fix Grammar',
    icon: CheckCircle,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    hoverBorder: 'hover:border-emerald-200',
    description: 'Correct errors & punctuation',
    editorBehavior: 'replace',
  },
  {
    id: 'summarize',
    label: 'Summarize',
    icon: AlignLeft,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    hoverBorder: 'hover:border-blue-200',
    description: 'Condense to key points',
    // Summary appended after the original text, not replacing it
    editorBehavior: 'append',
  },
  {
    id: 'expand',
    label: 'Expand',
    icon: Expand,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    hoverBorder: 'hover:border-orange-200',
    description: 'Elaborate with more detail',
    editorBehavior: 'replace',
  },
  {
    id: 'simplify',
    label: 'Simplify',
    icon: Minimize2,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    hoverBorder: 'hover:border-rose-200',
    description: 'Simpler words & shorter sentences',
    editorBehavior: 'replace',
  },
  {
    id: 'translate',
    label: 'Translate',
    icon: Languages,
    color: 'text-cyan-500',
    bg: 'bg-cyan-50',
    hoverBorder: 'hover:border-cyan-200',
    description: 'Convert to another language',
    editorBehavior: 'replace',
  },
];

const TRANSLATE_LANGUAGES = [
  'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Chinese (Simplified)', 'Japanese', 'Korean', 'Arabic', 'Hindi',
  'Russian', 'Dutch', 'Polish', 'Turkish', 'Swedish',
];

const CHAT_SUGGESTIONS = [
  { icon: '✍️', label: 'Write an introduction paragraph' },
  { icon: '📝', label: 'Create a bullet point summary' },
  { icon: '🎯', label: 'Generate a conclusion' },
  { icon: '📧', label: 'Draft a professional email' },
];

// ─── AI Prompts ───────────────────────────────────────────────────────────────
// Each prompt is precision-tuned: grammar/translate use low temperature (accuracy),
// enhance/expand/chat use higher temperature (creativity).

const PROMPTS = {
  enhance:
    'You are a professional writing editor. Rewrite the given text to be clearer, more engaging, and more impactful while fully preserving the original meaning and the author\'s voice. Improve sentence structure, word choice, and flow. Remove redundancy. Output ONLY the improved text — no preamble, no explanation, no quotes.',

  grammar_fix:
    'You are a precise grammar and style editor. Fix all grammatical errors, spelling mistakes, punctuation issues, and awkward phrasing in the given text. Preserve the original meaning, tone, and structure exactly — do not add, remove, or reorder ideas. Output ONLY the corrected text — no preamble, no explanation.',

  summarize:
    'You are a skilled summarizer. Condense the given text into a clear, concise summary that captures all key points and main ideas. Use the same language as the input. Output ONLY the summary — no preamble like "Here is a summary:", no quotes.',

  expand:
    'You are a skilled writer. Expand the given text by adding relevant detail, context, examples, and elaboration to make it more thorough and informative. Maintain the original tone and style — do not simply repeat the original. Output ONLY the expanded text with no preamble.',

  simplify:
    'You are a clarity specialist. Rewrite the given text using simpler vocabulary, shorter sentences, and a more approachable style that anyone can understand. Remove jargon and technical terms. Preserve all original meaning and information. Output ONLY the simplified text with no preamble.',

  translate: (language) =>
    `You are a professional translator. Translate the given text accurately and naturally into ${language}. Preserve the original meaning, tone, and paragraph structure. Output ONLY the translated text — no preamble, no notes, no quotes.`,

  chat:
    'You are Athena, a helpful AI writing assistant embedded inside a document editor. You help users write, edit, brainstorm, research, and improve their documents. Be knowledgeable, concise, and friendly. When asked to generate content (introductions, conclusions, emails, summaries, outlines), produce polished, publication-ready text. Use markdown formatting (bold, bullet points, headers) when it genuinely improves readability. Keep responses focused and sized appropriately for a document-editor context — thorough but not bloated.',

  generate: (type, tone, pages) =>
    `You are an expert ${type} writer. Generate a complete, polished, well-structured ${type} in a ${tone} tone. The document should be approximately ${pages} page${pages > 1 ? 's' : ''} (roughly ${pages * 380} words). Structure it with appropriate headings, paragraphs, and sections for a ${type}. Output valid HTML using ONLY these tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>. Output ONLY the HTML — no \`\`\`html fences, no preamble, no explanation. Start directly with the first HTML tag.`,
};

// Temperature tuning per action: factual/corrective tasks → low, creative → higher
const ACTION_TEMPERATURE = {
  grammar_fix: 0.1,
  translate: 0.2,
  summarize: 0.4,
  simplify: 0.4,
  enhance: 0.7,
  expand: 0.8,
};

// ─── Anthropic API: streaming single-turn ─────────────────────────────────────

async function callClaude({ systemPrompt, userPrompt, temperature = 0.7, onChunk, signal }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const text = JSON.parse(data)?.delta?.text ?? '';
        if (text) { full += text; onChunk?.(full); }
      } catch { /* malformed SSE chunk — skip */ }
    }
  }
  return full;
}

// ─── Anthropic API: streaming multi-turn chat ─────────────────────────────────

async function callClaudeChat({ messages, systemPrompt, temperature = 0.7, onChunk, signal }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const text = JSON.parse(data)?.delta?.text ?? '';
        if (text) { full += text; onChunk?.(full); }
      } catch { /* skip */ }
    }
  }
  return full;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AIAssistant = ({
  open,
  onOpenChange,
  onGenerateDocument,  // (params: { topic, pages, tone, type, creativity, html }) => void
  onInlineAction,      // (behavior: 'replace' | 'append' | 'insert', content: string) => void
  selectedText = '',
}) => {
  // ── Tab state
  const [mode, setMode] = useState('generate');   // 'generate' | 'inline'
  const [chatMode, setChatMode] = useState(false);

  // ── Document generation
  const [topic, setTopic] = useState('');
  const [pages, setPages] = useState(1);
  const [tone, setTone] = useState('Professional');
  const [docType, setDocType] = useState('Technical Document');
  const [creativity, setCreativity] = useState([0.7]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState('');

  // ── Chat
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatCreativity, setChatCreativity] = useState([0.7]);

  // ── Transform
  const [activeAction, setActiveAction] = useState(null);    // action id currently running
  const [lastAction, setLastAction] = useState(null);        // action id whose result is shown
  const [actionResult, setActionResult] = useState('');
  const [actionError, setActionError] = useState('');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [targetLang, setTargetLang] = useState('Spanish');

  // ── Shared
  const [copied, setCopied] = useState(false);

  const chatEndRef = useRef(null);
  const abortRef = useRef(null);
  const chatInputRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // Auto-switch mode based on selected text when dialog opens
  useEffect(() => {
    if (!open) return;
    if (selectedText?.trim()) {
      setMode('inline');
      setChatMode(false);
    } else {
      setMode('generate');
    }
    setActionResult('');
    setActionError('');
    setShowLangPicker(false);
  }, [open, selectedText]);

  // Focus chat input when chat tab opens
  useEffect(() => {
    if (chatMode && open) setTimeout(() => chatInputRef.current?.focus(), 80);
  }, [chatMode, open]);

  // Cancel in-flight request when dialog closes
  useEffect(() => {
    if (!open) abortRef.current?.abort();
  }, [open]);

  const abort = () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
  };

  // ── Document Generation ────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) { toast.error('Please enter a document topic'); return; }

    setIsGenerating(true);
    setGenProgress('Starting…');
    abortRef.current = new AbortController();

    try {
      let html = '';
      await callClaude({
        systemPrompt: PROMPTS.generate(docType, tone, pages),
        userPrompt: `Write a ${docType} about: ${topic}`,
        temperature: creativity[0],
        signal: abortRef.current.signal,
        onChunk: (text) => {
          html = text;
          const words = text.split(/\s+/).filter(Boolean).length;
          setGenProgress(`Writing… ${words} words`);
        },
      });

      if (!html.trim()) throw new Error('Empty response');

      // Strip any accidental code fences
      const cleaned = html.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

      onGenerateDocument?.({ topic, pages, tone, type: docType, creativity: creativity[0], html: cleaned });
      toast.success(`${docType} generated — ${pages} page${pages > 1 ? 's' : ''}!`);
      setTopic('');
      setGenProgress('');
      onOpenChange(false);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[AIAssistant] generate error:', err);
      toast.error('Generation failed. Please try again.');
      setGenProgress('');
    } finally {
      setIsGenerating(false);
    }
  }, [topic, pages, tone, docType, creativity, onGenerateDocument, onOpenChange]);

  // ── Chat ───────────────────────────────────────────────────────────────────

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
      await callClaudeChat({
        messages: history,
        systemPrompt: PROMPTS.chat,
        temperature: chatCreativity[0],
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
      console.error('[AIAssistant] chat error:', err);
      setChatMessages((prev) => {
        const next = [...prev];
        next[assistantIdx] = { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' };
        return next;
      });
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, isChatLoading, chatMessages, chatCreativity]);

  // ── Transform ──────────────────────────────────────────────────────────────

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
      await callClaude({
        systemPrompt,
        userPrompt: selectedText,
        temperature: ACTION_TEMPERATURE[actionId] ?? 0.6,
        signal: abortRef.current.signal,
        onChunk: (text) => setActionResult(text),
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[AIAssistant] transform error:', err);
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

  const handleTranslatePick = useCallback((lang) => {
    setTargetLang(lang);
    setShowLangPicker(false);
    runTransform('translate', lang);
  }, [runTransform]);

  // Apply result to editor
  const applyResult = useCallback((behavior) => {
    if (!actionResult?.trim()) return;
    onInlineAction?.(behavior, actionResult);
    const label = behavior === 'replace' ? 'Text replaced in document' : 'Content appended to document';
    toast.success(label);
    setActionResult('');
    setLastAction(null);
  }, [actionResult, onInlineAction]);

  const copyText = useCallback((text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[900px] h-[80vh] max-h-[700px] flex flex-col bg-white/95 backdrop-blur-xl border border-blue-200/60 rounded-3xl shadow-2xl overflow-hidden p-0">

        {/* ── Header with tab switcher ─────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#0c496e] to-[#1e40af] px-5 py-4 text-white relative shrink-0">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <DialogHeader>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Sparkles className="w-5 h-5" style={{ color: '#fabf23' }} />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-white">Athena AI</DialogTitle>
              </div>

              {/* Mode tabs */}
              <div className="flex bg-white/20 rounded-xl p-0.5 backdrop-blur-sm">
                {[
                  { id: 'generate', label: 'Generate', Icon: FileText, active: mode === 'generate' && !chatMode, onClick: () => { setMode('generate'); setChatMode(false); } },
                  { id: 'inline', label: 'Transform', Icon: Wand2, active: mode === 'inline' && !chatMode, onClick: () => { setMode('inline'); setChatMode(false); } },
                  { id: 'chat', label: 'Chat', Icon: MessageSquare, active: chatMode, onClick: () => setChatMode(true) },
                ].map(({ id, label, Icon, active, onClick }) => (
                  <button key={id} onClick={onClick}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active ? 'bg-white text-[#0c496e] shadow-md' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <DialogDescription className="text-blue-100/80 font-medium text-[11px] leading-tight">
              {chatMode
                ? 'Chat with Athena to brainstorm, write content, or get writing help.'
                : mode === 'generate'
                ? 'Describe your topic — Athena will write a complete, formatted document.'
                : 'Select text in the document, then apply AI transformations instantly.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* ════════════════════════════════════════════════════════════ */}
          {/* CHAT                                                         */}
          {/* ════════════════════════════════════════════════════════════ */}
          {chatMode && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-base font-bold text-slate-800 mb-1">How can I help?</h3>
                      <p className="text-xs text-slate-500 max-w-xs">Ask me anything, or pick a suggestion</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                      {CHAT_SUGGESTIONS.map((s, i) => (
                        <button key={i} onClick={() => setChatInput(s.label)}
                          className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 text-slate-600 text-xs font-medium transition-all text-left flex items-center gap-2">
                          <span className="text-base">{s.icon}</span>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex gap-3 items-end ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20'}`}>
                          {msg.role === 'user' ? <User className="w-4 h-4" strokeWidth={2.5} /> : <Sparkles className="w-4 h-4" />}
                        </div>
                        <div className={`flex flex-col gap-1.5 max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-3 text-sm rounded-2xl whitespace-pre-wrap leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-br-sm' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'}`}>
                            {msg.content || <span className="text-slate-400 text-xs italic">Thinking…</span>}
                          </div>
                          {/* Action buttons for assistant messages */}
                          {msg.role === 'assistant' && msg.content && (
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => copyText(msg.content)}
                                className="text-slate-500 hover:text-blue-600 p-1 bg-white hover:bg-blue-50 border border-slate-100 rounded-lg shadow-sm text-[10px] font-semibold flex items-center gap-1 transition-colors"
                                title="Copy response">
                                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => { onInlineAction?.('insert', msg.content); toast.success('Inserted at cursor'); }}
                                className="text-blue-600 hover:text-white p-1 px-2 bg-blue-50 hover:bg-blue-600 border border-blue-100 hover:border-blue-600 rounded-lg shadow-sm text-[10px] font-bold flex items-center gap-1 transition-all"
                                title="Insert at cursor position in editor">
                                <CheckCircle2 className="w-3 h-3" /> Insert
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* Loading dots (only when streaming hasn't started yet) */}
                    {isChatLoading && chatMessages[chatMessages.length - 1]?.content === '' && (
                      <div className="flex gap-3 items-end">
                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                        <div className="px-4 py-3 text-sm rounded-2xl bg-white border border-slate-100 rounded-bl-sm shadow-sm flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </>
                )}
              </div>

              {/* Chat input bar */}
              <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 space-y-3 shrink-0">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Zap className="w-3 h-3" style={{ color: '#fabf23' }} /> Creativity
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                      {Math.round(chatCreativity[0] * 100)}%
                    </span>
                  </div>
                  {chatMessages.length > 0 && (
                    <button onClick={() => { abort(); setChatMessages([]); setIsChatLoading(false); }}
                      className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <Slider value={chatCreativity} onValueChange={setChatCreativity} max={1} step={0.1} className="py-1" />
                <div className="relative">
                  <Textarea
                    ref={chatInputRef}
                    placeholder="Ask Athena anything… (Enter to send, Shift+Enter for new line)"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); }
                    }}
                    className="min-h-[80px] max-h-[150px] resize-none text-sm bg-slate-50 border-slate-200 rounded-2xl p-4 pr-12 focus:bg-white focus:ring-2 focus:ring-blue-500/20 shadow-inner"
                  />
                  {/* Send / Stop button */}
                  <button
                    onClick={isChatLoading ? () => abort() : handleChatSend}
                    disabled={!isChatLoading && !chatInput.trim()}
                    className={`absolute right-2 bottom-2 w-9 h-9 flex items-center justify-center rounded-xl text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all ${isChatLoading ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}
                    title={isChatLoading ? 'Stop generation' : 'Send message'}>
                    {isChatLoading ? <X className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* DOCUMENT GENERATION                                          */}
          {/* ════════════════════════════════════════════════════════════ */}
          {!chatMode && mode === 'generate' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {/* Topic textarea */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-[#0c496e] uppercase tracking-wider">
                  Document Topic <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  placeholder="Describe your document topic in detail… e.g., 'The impact of AI on healthcare in 2026, covering diagnostics, patient care, and ethical concerns'"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleGenerate(); }}
                  className="min-h-[90px] max-h-[150px] resize-none bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400 ml-1">Ctrl + Enter to generate</p>
              </div>

              {/* Options grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-[#0c496e] uppercase tracking-wider">Length</Label>
                  <Select value={pages.toString()} onValueChange={(v) => setPages(parseInt(v))}>
                    <SelectTrigger className="h-9 bg-slate-50 border-2 border-slate-200 rounded-lg text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                      {[1, 2, 3, 5, 10].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} page{n > 1 ? 's' : ''} (~{n * 380} words)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-[#0c496e] uppercase tracking-wider">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="h-9 bg-slate-50 border-2 border-slate-200 rounded-lg text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                      {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-[#0c496e] uppercase tracking-wider">Document Type</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger className="h-9 bg-slate-50 border-2 border-slate-200 rounded-lg text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                      {DOCUMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-bold text-[#0c496e] uppercase tracking-wider">Creativity</Label>
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {Math.round(creativity[0] * 100)}%
                    </span>
                  </div>
                  <div className="h-9 flex items-center px-1">
                    <Slider value={creativity} onValueChange={setCreativity} max={1} step={0.1} className="w-full" />
                  </div>
                </div>
              </div>

              {/* Generation progress bar */}
              <AnimatePresence>
                {isGenerating && genProgress && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 overflow-hidden"
                  >
                    <RefreshCw className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                    <span className="text-xs text-blue-700 font-medium">{genProgress}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer buttons */}
              <div className="flex items-center gap-2 pt-1">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}
                  className="flex-1 h-10 rounded-lg border-2 border-slate-200 hover:bg-slate-50 font-bold text-slate-600 text-xs">
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={!topic.trim() || isGenerating}
                  className="flex-[2] h-11 rounded-lg bg-gradient-to-r from-[#0c496e] to-[#1e40af] hover:shadow-lg text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
                  {isGenerating
                    ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating…</>
                    : <><Sparkles className="w-4 h-4 mr-2" />Generate Document</>}
                </Button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* TRANSFORM                                                    */}
          {/* ════════════════════════════════════════════════════════════ */}
          {!chatMode && mode === 'inline' && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {!selectedText?.trim() ? (
                /* No text selected — prompt user to select */
                <div className="text-center py-14">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Edit3 className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-2">No Text Selected</h3>
                  <p className="text-slate-500 text-xs mb-5 max-w-xs mx-auto leading-relaxed">
                    Select some text in your document, then reopen this panel to apply AI transformations.
                  </p>
                  <Button onClick={() => { setMode('generate'); setChatMode(false); }}
                    className="bg-blue-600 text-white hover:bg-blue-700 text-xs h-9 px-4">
                    Switch to Generate <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected text preview */}
                  <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Selected Text</span>
                      <span className="text-[9px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full font-semibold">
                        {selectedText.trim().split(/\s+/).length} words
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed italic border-l-2 border-amber-300 pl-2">
                      "{selectedText.trim()}"
                    </p>
                  </div>

                  {/* Language picker (slides in when Translate is clicked) */}
                  <AnimatePresence>
                    {showLangPicker && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="p-3 bg-cyan-50 rounded-2xl border border-cyan-100">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider flex items-center gap-1.5">
                              <Languages className="w-3.5 h-3.5" /> Choose target language
                            </span>
                            <button onClick={() => setShowLangPicker(false)}>
                              <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {TRANSLATE_LANGUAGES.map((lang) => (
                              <button key={lang} onClick={() => handleTranslatePick(lang)}
                                className={`px-2 py-1.5 text-[11px] rounded-lg border transition-all text-left font-medium ${lang === targetLang ? 'border-cyan-400 bg-cyan-100 text-cyan-800' : 'border-cyan-100 bg-white hover:border-cyan-300 hover:bg-cyan-50 text-slate-700'}`}>
                                {lang}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action grid */}
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_ACTIONS.map((action) => {
                        const isRunning = activeAction === action.id;
                        const isDisabled = !!activeAction && !isRunning;
                        return (
                          <button key={action.id} onClick={() => handleQuickAction(action.id)} disabled={isDisabled}
                            className={`group flex items-center gap-3 p-3 rounded-xl border bg-white transition-all duration-200 ${isRunning ? 'border-blue-300 bg-blue-50 shadow-md' : `border-slate-100 ${action.hoverBorder} hover:shadow-md`} ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
                            <div className={`p-2 rounded-xl ${action.bg} ${action.color} shrink-0 ${isRunning ? '' : 'group-hover:scale-110 transition-transform duration-200'}`}>
                              {isRunning
                                ? <RefreshCw className="w-4 h-4 animate-spin" />
                                : <action.icon className="w-4 h-4" />}
                            </div>
                            <div className="text-left min-w-0">
                              <div className="text-xs font-bold text-slate-700 leading-tight">{action.label}</div>
                              <div className="text-[10px] text-slate-400 truncate">{action.description}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {actionError && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-600">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {actionError}
                        <button className="ml-auto" onClick={() => setActionError('')}><X className="w-3.5 h-3.5" /></button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Streaming / final result */}
                  <AnimatePresence>
                    {actionResult && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3" />
                              Result
                              {/* Spinner while still streaming */}
                              {activeAction && <RefreshCw className="w-3 h-3 animate-spin ml-1 text-blue-400" />}
                            </h3>
                            <div className="flex items-center gap-1">
                              <button onClick={() => copyText(actionResult)} title="Copy result"
                                className="p-1.5 rounded-lg hover:bg-blue-200/50 text-blue-600 transition-colors">
                                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => { setActionResult(''); setLastAction(null); }} title="Dismiss"
                                className="p-1.5 rounded-lg hover:bg-red-100/50 text-red-400 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Result text — scrollable */}
                          <div className="p-3 bg-white/80 rounded-xl border border-white max-h-[180px] overflow-y-auto custom-scrollbar text-sm text-slate-700 leading-relaxed whitespace-pre-wrap shadow-inner">
                            {actionResult}
                          </div>

                          {/* Apply to editor — only shown when streaming is done */}
                          {!activeAction && (
                            <div className="flex gap-2">
                              <Button onClick={() => applyResult('replace')}
                                className="flex-1 h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md"
                                title="Replace the selected text in the editor with this result">
                                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                Replace Selected
                              </Button>
                              <Button onClick={() => applyResult('append')} variant="outline"
                                className="flex-1 h-9 rounded-xl border-2 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold"
                                title="Keep the original text and add this result immediately after it">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                Append After
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Advanced tools from AIInlineActions */}
                  <div className="pt-2 border-t border-slate-100">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-3">Advanced Tools</h3>
                    <AIInlineActions
                      open={true}
                      onOpenChange={(o) => { if (!o) onOpenChange(false); }}
                      onAction={onInlineAction}
                      selectedText={selectedText}
                      compact={true}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};