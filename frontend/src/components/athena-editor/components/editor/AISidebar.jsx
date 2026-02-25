import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Wand2,
  FileText,
  Languages,
  Zap,
  MessageSquare,
  SpellCheck,
  List,
  ChevronRight,
  RefreshCw,
  Send,
  MoreHorizontal,
  Check,
  CheckCircle2,
  Copy,
  Trash2,
  User,
  Bot
} from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Slider } from '../ui/slider';

const quickActions = [
  { id: 'enhance', label: 'Enhance writing', icon: Wand2, color: 'text-violet-500', bg: 'bg-violet-50' },
  { id: 'grammar_fix', label: 'Fix grammar', icon: SpellCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'summarize', label: 'Summarize', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'expand', label: 'Expand', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'simplify', label: 'Simplify', icon: MessageSquare, color: 'text-rose-500', bg: 'bg-rose-50' },
  { id: 'translate', label: 'Translate', icon: Languages, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { id: 'bullets_to_text', label: 'Bullets to Text', icon: List, color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

const suggestions = [
  '✍️ Write an introduction paragraph',
  '📝 Create a bullet point summary',
  '🎯 Generate a conclusion',
  '📧 Draft a professional email'
];

export const AISidebar = ({
  isOpen,
  onClose,
  onGenerate,
  selectedText,
  onTransformText,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [messages, setMessages] = useState([]);
  const [copied, setCopied] = useState(false);
  const [creativity, setCreativity] = useState([0.7]);

  // Auto-scroll chat to bottom
  const chatEndRef = React.useRef(null);
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setGeneratedContent('');

    const userMsg = { role: 'user', content: prompt.trim() };
    const chatHistory = [...messages, userMsg];

    // Add temporary assistant message for streaming
    const assistantMsgIndex = chatHistory.length;
    setMessages([...chatHistory, { role: 'assistant', content: '' }]);
    setPrompt('');

    try {
      let fullContent = '';
      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          temperature: creativity[0],
          stream: true
        })
      });

      if (!response.ok) throw new Error('Failed to connect to AI');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                // Update the messages array with the new content
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[assistantMsgIndex] = { role: 'assistant', content: fullContent };
                  return newMsgs;
                });
              }
            } catch (e) { }
          }
        }
      }
    } catch (error) {
      console.error('AI Request Error:', error);
      setMessages([...chatHistory, { role: 'assistant', content: 'Connection to AI server failed.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (actionId) => {
    if (!selectedText && actionId !== 'bullets_to_text') return;
    setIsLoading(true);
    setActiveAction(actionId);
    setGeneratedContent(''); // Clear previous generation

    try {
      if (actionId === 'bullets_to_text') {
        if (onTransformText) onTransformText(actionId, null);
      } else {
        let fullContent = '';
        const response = await fetch('http://localhost:5000/api/ai/transform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: actionId,
            text: selectedText,
            stream: true
          })
        });

        if (!response.ok) throw new Error('Transformation failed');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setGeneratedContent(fullContent);
                }
              } catch (e) { }
            }
          }
        }
      }
    } catch (error) {
      console.error("AI Action Request Error:", error);
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ x: '100%', opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: '100%', opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-[340px] border-l border-slate-200/60 bg-white/80 backdrop-blur-xl flex flex-col h-full shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] z-50 relative overflow-hidden"
          >
            {/* Soft background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -z-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-400/10 rounded-full blur-3xl -z-10 pointer-events-none transform -translate-x-1/2 translate-y-1/2" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white/50">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-sm shadow-blue-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                  <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-slate-800 tracking-tight">Athena AI</h2>
                  <p className="text-[10px] text-slate-500 font-medium">✨ Intelligent Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    className="px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-500 hover:text-red-500 bg-white hover:bg-red-50 border border-slate-100 hover:border-red-100 rounded-md shadow-sm transition-all"
                  >
                    CLEAR
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">

              {/* Contextual Action Area depending on Selected Text */}
              <AnimatePresence mode="wait">
                {messages.length > 0 ? (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-4 flex flex-col pb-4"
                  >
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`flex gap-3 items-end ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20'}`}>
                          {msg.role === 'user' ? <User className="w-4 h-4" strokeWidth={2.5} /> : <Sparkles className="w-4 h-4" />}
                        </div>
                        {/* Bubble */}
                        <div className={`flex flex-col gap-1.5 max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-3 text-sm rounded-2xl whitespace-pre-wrap leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-br-sm' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'}`}>
                            {msg.content}
                          </div>
                          {/* Utility actions for Assistant Messages */}
                          {msg.role === 'assistant' && (
                            <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.content);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                                className="text-slate-500 hover:text-blue-600 p-1 bg-white hover:bg-blue-50 border border-slate-100 rounded-lg shadow-sm text-[10px] font-semibold flex items-center gap-1 transition-colors"
                              >
                                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => {
                                  if (onGenerate) onGenerate(msg.content);
                                }}
                                className="text-blue-600 hover:text-white p-1 bg-blue-50 hover:bg-blue-600 border border-blue-100 hover:border-blue-600 rounded-lg shadow-sm text-[10px] font-bold flex items-center gap-1 transition-all"
                              >
                                <CheckCircle2 className="w-3 h-3" /> INSERT
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3 items-end flex-row">
                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20">
                          <Sparkles className="w-4 h-4 animate-pulse duration-1000" />
                        </div>
                        <div className="px-4 py-3 text-sm rounded-2xl bg-white border border-slate-100 text-slate-500 rounded-bl-sm shadow-sm flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </motion.div>
                ) : generatedContent ? (
                  <motion.div
                    key="generated"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-4"
                  >
                    <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Generated Result</h3>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(generatedContent);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="p-1.5 rounded-lg hover:bg-blue-200/50 text-blue-600 transition-colors"
                          >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => setGeneratedContent('')}
                            className="p-1.5 rounded-lg hover:bg-red-100/50 text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-white/70 rounded-2xl border border-white max-h-[250px] overflow-y-auto custom-scrollbar text-sm text-slate-700 leading-relaxed whitespace-pre-wrap shadow-inner">
                        {generatedContent}
                      </div>

                      <Button
                        onClick={() => {
                          if (onGenerate) onGenerate(generatedContent);
                          setGeneratedContent('');
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md h-10 group transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        Insert into Document
                      </Button>
                    </div>
                  </motion.div>
                ) : selectedText ? (
                  <motion.div
                    key="selected"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Target Context</h3>
                        <div className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[9px] font-bold tracking-widest uppercase">Selected</div>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed italic border-l-2 border-blue-300 pl-2">
                        "{selectedText}"
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {quickActions.map((action) => (
                          <button
                            key={action.id}
                            onClick={() => handleQuickAction(action.id)}
                            disabled={isLoading}
                            className={`group relative flex flex-col items-start gap-2 p-3 rounded-2xl border border-slate-100 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-300 ${isLoading && activeAction !== action.id ? 'opacity-40 grayscale' : ''}`}
                          >
                            <div className={`p-2 rounded-xl ${action.bg} ${action.color} group-hover:scale-110 transition-transform duration-300`}>
                              {activeAction === action.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <action.icon className="w-4 h-4" />
                              )}
                            </div>
                            <span className="text-xs font-semibold text-slate-700">{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Welcome/Empty State */}
                    <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-indigo-100/50 text-center space-y-3">
                      <div className="w-12 h-12 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center border border-indigo-50">
                        <Wand2 className="w-6 h-6 text-indigo-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 mb-1">How can I help?</h3>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                          Select text in your document to see specific formatting options, or ask me to generate something new below.
                        </p>
                      </div>
                    </div>

                    {/* Suggestions Box */}
                    <div className="space-y-3">
                      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Starter Ideas</h3>
                      <div className="space-y-2">
                        {suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => setPrompt(suggestion.replace(/^.*\s/, ''))}
                            className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-white hover:border-violet-200 hover:bg-violet-50/30 text-slate-600 transition-all duration-300 group shadow-sm hover:shadow-md"
                          >
                            <span className="text-xs font-medium">{suggestion}</span>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors transform group-hover:translate-x-1" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Footer Area */}
            <div className="px-4 pb-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-10 space-y-3">
              {/* Creativity Slider */}
              <div className="pt-3 px-1 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Zap className="w-3 h-3 text-gold" style={{ color: '#fabf23' }} /> Creativity
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                    {Math.round(creativity[0] * 100)}%
                  </span>
                </div>
                <Slider
                  value={creativity}
                  onValueChange={setCreativity}
                  max={1}
                  step={0.1}
                  className="py-1"
                />
              </div>

              <div className="relative transform transition-all focus-within:-translate-y-1">
                <Textarea
                  placeholder="Ask Athena to write or edit..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  className="min-h-[80px] max-h-[200px] resize-none text-sm bg-slate-50/50 border-slate-200 rounded-2xl p-4 pr-12 focus:bg-white focus:ring-2 focus:ring-blue-500/20 shadow-inner custom-scrollbar"
                />

                {/* Embedded Send Button */}
                <div className="absolute right-2 bottom-2 flex flex-col gap-1">
                  <AnimatePresence>
                    {prompt.trim() && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 translate-x-px translate-y-px" />
                        )}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex justify-between items-center px-1 text-[10px] text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Athena Online
                </div>
                <span>Press Enter to send</span>
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};