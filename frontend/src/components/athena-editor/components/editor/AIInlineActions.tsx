import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit3,
  Plus,
  FileText,
  Type,
  SpellCheck,
  List,
  BookOpen,
  Zap,
  Sparkles,
  RefreshCw,
  Check,
  Copy,
  ArrowRight,
  MessageSquare,
  Wand2,
  History,
  Bookmark,
  Share2,
  Download,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Star,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  Globe,
  Hash,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Link,
  Image,
  Table,
  Mic,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  Save,
  Trash2,
  Settings,
  HelpCircle
} from 'lucide-react';
import {
  rewriteText,
  expandText,
  summarizeText,
  changeTone,
  fixGrammar,
  bulletToParagraph,
  callAIStreamAPI
} from '../../ai/aiUtils';

/**
 * @typedef {Object} HistoryItem
 * @property {string} id
 * @property {Date} timestamp
 * @property {string} action
 * @property {string} originalText
 * @property {string} transformedText
 * @property {number} creativity
 * @property {string} [tone]
 */

/**
 * @typedef {Object} Preset
 * @property {string} id
 * @property {string} name
 * @property {string} action
 * @property {string} [tone]
 * @property {number} creativity
 * @property {string} description
 */

export const AIInlineActions = ({
  open,
  onOpenChange,
  onAction,
  selectedText = "",
  onSaveToLibrary,
  onShare,
  maxTokens = 1000,
  showAdvanced = true
}) => {
  const [actionType, setActionType] = useState('rewrite');
  const [customPrompt, setCustomPrompt] = useState('');
  const [resultText, setResultText] = useState('');
  const [creativity, setCreativity] = useState([0.7]);
  const [selectedTone, setSelectedTone] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [history, setHistory] = useState([]);
  const [presets, setPresets] = useState([
    {
      id: '1',
      name: 'Professional Polish',
      action: 'rewrite',
      creativity: 0.5,
      description: 'Clean, professional rewrite'
    },
    {
      id: '2',
      name: 'Creative Story',
      action: 'expand',
      creativity: 0.9,
      description: 'Expand creatively'
    },
    {
      id: '3',
      name: 'Academic Paper',
      action: 'change_tone',
      tone: 'academic',
      creativity: 0.4,
      description: 'Academic tone'
    }
  ]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('english');
  const [wordCount, setWordCount] = useState({ original: 0, transformed: 0 });
  const [readingTime, setReadingTime] = useState({ original: 0, transformed: 0 });
  const [showPreview, setShowPreview] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [feedback, setFeedback] = useState({ helpful: null, comment: '' });
  const [savedItems, setSavedItems] = useState([]);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const previewRef = useRef(null);
  const textareaRef = useRef(null);

  const actions = [
    { value: 'rewrite', label: 'Rewrite', icon: Edit3, description: 'Improve clarity and flow', category: 'basic' },
    { value: 'expand', label: 'Expand', icon: Plus, description: 'Add more details', category: 'basic' },
    { value: 'summarize', label: 'Summarize', icon: FileText, description: 'Make it concise', category: 'basic' },
    { value: 'change_tone', label: 'Change Tone', icon: Type, description: 'Adjust the voice', category: 'styling' },
    { value: 'fix_grammar', label: 'Fix Grammar', icon: SpellCheck, description: 'Correct all errors', category: 'polish' },
    { value: 'bullet_to_paragraph', label: 'Bullets to Paragraph', icon: List, description: 'Convert lists to prose', category: 'format' },
    { value: 'translate', label: 'Translate', icon: Globe, description: 'Translate to another language', category: 'advanced' },
    { value: 'paraphrase', label: 'Paraphrase', icon: RefreshCw, description: 'Say it differently', category: 'advanced' },
    { value: 'summarize_bullets', label: 'Summarize as Bullets', icon: ListChecks, description: 'Extract key points', category: 'format' },
    { value: 'improve_readability', label: 'Improve Readability', icon: BookOpen, description: 'Make it easier to read', category: 'polish' },
    { value: 'custom', label: 'Custom', icon: Wand2, description: 'Ask anything', category: 'advanced' },
  ];

  const tones = [
    "Professional", "Casual", "Academic", "Creative", "Technical",
    "Formal", "Friendly", "Persuasive", "Informative", "Narrative",
    "Humorous", "Serious", "Inspirational", "Critical", "Empathetic"
  ];

  const languages = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese",
    "Dutch", "Russian", "Japanese", "Korean", "Chinese", "Arabic",
    "Hindi", "Bengali", "Turkish", "Polish", "Swedish", "Danish",
    "Finnish", "Norwegian", "Greek", "Hebrew"
  ];

  const categories = [
    { id: 'all', label: 'All Actions' },
    { id: 'basic', label: 'Basic' },
    { id: 'styling', label: 'Styling' },
    { id: 'polish', label: 'Polish' },
    { id: 'format', label: 'Format' },
    { id: 'advanced', label: 'Advanced' }
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');

  // Check for voice synthesis support
  useEffect(() => {
    setVoiceSupported('speechSynthesis' in window);
  }, []);

  // Calculate word count and reading time
  useEffect(() => {
    const countWords = (text) => text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const calculateReadingTime = (wordCount) => Math.ceil(wordCount / 200); // 200 words per minute

    setWordCount({
      original: countWords(selectedText),
      transformed: countWords(resultText)
    });

    setReadingTime({
      original: calculateReadingTime(countWords(selectedText)),
      transformed: calculateReadingTime(countWords(resultText))
    });
  }, [selectedText, resultText]);

  const filteredActions = actions.filter(action => 
    selectedCategory === 'all' || action.category === selectedCategory
  );

  const handleTransform = async () => {
    if (!actionType && !customPrompt.trim()) {
      toast.error('Please select an action or enter a prompt');
      return;
    }

    setLoading(true);
    setResultText('');

    const options = {
      temperature: creativity[0],
      maxTokens,
      onChunk: (chunk, full) => setResultText(full)
    };

    try {
      let result = '';
      if (actionType === 'custom') {
        const fullPrompt = `${customPrompt}\n\nTarget text:\n"${selectedText}"`;
        await callAIStreamAPI('generate', { 
          prompt: fullPrompt, 
          temperature: creativity[0],
          maxTokens 
        }, (full) => {
          setResultText(full);
          result = full;
        });
      } else if (actionType === 'translate') {
        await callAIStreamAPI('translate', {
          text: selectedText,
          targetLanguage,
          temperature: creativity[0]
        }, (full) => {
          setResultText(full);
          result = full;
        });
      } else {
        switch (actionType) {
          case 'rewrite': 
            await rewriteText(selectedText, options); 
            break;
          case 'expand': 
            await expandText(selectedText, options); 
            break;
          case 'summarize': 
            await summarizeText(selectedText, options); 
            break;
          case 'change_tone': 
            await changeTone(selectedText, selectedTone, options); 
            break;
          case 'fix_grammar': 
            await fixGrammar(selectedText, options); 
            break;
          case 'bullet_to_paragraph': 
            await bulletToParagraph(selectedText, options); 
            break;
          case 'paraphrase':
            await callAIStreamAPI('paraphrase', {
              text: selectedText,
              temperature: creativity[0]
            }, (full) => setResultText(full));
            break;
          case 'summarize_bullets':
            await callAIStreamAPI('summarize_bullets', {
              text: selectedText,
              temperature: creativity[0]
            }, (full) => setResultText(full));
            break;
          case 'improve_readability':
            await callAIStreamAPI('improve_readability', {
              text: selectedText,
              temperature: creativity[0]
            }, (full) => setResultText(full));
            break;
          default: break;
        }
      }

      // Add to history
      const historyItem = {
        id: Date.now().toString(),
        timestamp: new Date(),
        action: actionType,
        originalText: selectedText,
        transformedText: result || resultText,
        creativity: creativity[0],
        tone: selectedTone
      };
      setHistory(prev => [historyItem, ...prev].slice(0, 50)); // Keep last 50 items

      toast.success('Transformation ready');
    } catch (error) {
      toast.error(`Failed to process request: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (mode = 'replace') => {
    if (!resultText) return;
    if (onAction) {
      onAction(mode, resultText);
    }
    onOpenChange(false);
    setResultText('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const handleSaveToLibrary = () => {
    if (!resultText) return;
    if (onSaveToLibrary) {
      onSaveToLibrary({
        original: selectedText,
        transformed: resultText,
        action: actionType,
        timestamp: new Date()
      });
    }
    toast.success('Saved to library');
  };

  const handleShare = () => {
    if (onShare) {
      onShare(resultText);
    } else {
      // Fallback share
      if (navigator.share) {
        navigator.share({
          title: 'Athena AI Transformation',
          text: resultText
        });
      } else {
        handleCopy();
      }
    }
  };

  const handleDownload = () => {
    const blob = new Blob([resultText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `athena-transformation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded successfully');
  };

  const handleTextToSpeech = () => {
    if (!voiceSupported) {
      toast.error('Text-to-speech not supported in your browser');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(resultText || selectedText);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleFeedback = (helpful) => {
    setFeedback({ ...feedback, helpful });
    toast.success('Thank you for your feedback!');
  };

  const toggleSaveItem = (id) => {
    setSavedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const applyPreset = (preset) => {
    setActionType(preset.action);
    if (preset.tone) setSelectedTone(preset.tone);
    setCreativity([preset.creativity]);
    setSelectedPreset(preset.id);
    toast.success(`Applied preset: ${preset.name}`);
  };

  const clearHistory = () => {
    setHistory([]);
    toast.success('History cleared');
  };

  const compareVersions = (original, transformed) => {
    // Simple diff visualization (you can enhance this)
    return (
      <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
        <div>
          <h4 className="text-xs font-bold text-slate-500 mb-2">Original</h4>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{original}</p>
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-500 mb-2">Transformed</h4>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{transformed}</p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isFullscreen ? 'max-w-[95vw] w-[95vw] h-[95vh]' : 'max-w-4xl max-h-[70vh]'} flex flex-col bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] shadow-2xl overflow-hidden p-0 gap-0 transition-all duration-300`}>
        {/* Header with enhanced gradient */}
        <div className="bg-gradient-to-br from-[#0c4a6e] via-[#075985] to-[#0369a1] px-6 py-4 text-white relative flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/15 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
                  <Sparkles className="w-5 h-5 text-[#fabf23]" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight text-white">Athena Magic Edit</DialogTitle>
                  <DialogDescription className="text-sky-100/70 text-xs font-medium mt-0.5">
                    Enhance your content with AI-driven intelligence.
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                  title="Advanced options"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                  title="Help"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </DialogHeader>

          {/* Advanced options bar */}
          <AnimatePresence>
            {showAdvancedOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-white/10"
              >
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="rounded border-white/20" />
                    <span>Enable streaming</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="rounded border-white/20" />
                    <span>Auto-apply</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="rounded border-white/20" />
                    <span>Show suggestions</span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main content area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Tabs navigation */}
          <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100">
            <button
              onClick={() => setShowHistory(false)}
              className={`px-3 py-1.5 text-sm font-medium rounded-t-lg transition-all ${!showHistory ? 'bg-white text-sky-600 border-b-2 border-sky-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Transform
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`px-3 py-1.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 ${showHistory ? 'bg-white text-sky-600 border-b-2 border-sky-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <History className="w-4 h-4" />
              History ({history.length})
            </button>
            <button
              onClick={() => setShowPresets(!showPresets)}
              className={`px-3 py-1.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 ${showPresets ? 'bg-white text-sky-600 border-b-2 border-sky-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Bookmark className="w-4 h-4" />
              Presets
            </button>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {showHistory ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700">Transformation History</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="text-xs text-slate-500 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Clear All
                  </Button>
                </div>
                {history.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No history yet. Try transforming some text!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-sky-200 transition-all"
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400">
                              {item.timestamp.toLocaleString()}
                            </span>
                            <h4 className="text-sm font-bold text-slate-700 mt-0.5">
                              {actions.find(a => a.value === item.action)?.label || item.action}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleSaveItem(item.id)}
                              className="p-1 hover:bg-white rounded-md"
                            >
                              <Star className={`w-3 h-3 ${savedItems.includes(item.id) ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} />
                            </button>
                            <button
                              onClick={() => {
                                setResultText(item.transformedText);
                                setShowHistory(false);
                              }}
                              className="p-1 hover:bg-white rounded-md"
                              title="Load this version"
                            >
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-2">
                          {item.transformedText.substring(0, 100)}...
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ) : showPresets ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700">Quick Presets</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" /> New Preset
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <motion.button
                      key={preset.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => applyPreset(preset)}
                      className={`p-3 rounded-xl border text-left transition-all ${selectedPreset === preset.id
                        ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-500/10'
                        : 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-sm'
                      }`}
                    >
                      <h4 className="font-bold text-xs text-slate-700">{preset.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{preset.description}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-slate-400">
                        <span>✨ {preset.action}</span>
                        <span>🎯 {Math.round(preset.creativity * 100)}%</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {/* Context Preview with stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Selected Content</Label>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {wordCount.original} words
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {readingTime.original} min read
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600 line-clamp-3 italic leading-relaxed shadow-inner">
                    "{selectedText}"
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat.id
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Action Grid with categories */}
                <div className="space-y-3">
                  <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Tools & Actions</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {filteredActions.map((action) => {
                      const Icon = action.icon;
                      const isActive = actionType === action.value;
                      return (
                        <motion.button
                          key={action.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setActionType(action.value)}
                          className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-300 group relative overflow-hidden ${isActive
                            ? 'bg-sky-50 border-sky-500 shadow-md ring-2 ring-sky-500/10'
                            : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
                          }`}
                        >
                          <div className={`p-2 rounded-lg mb-2 transition-all duration-300 ${isActive ? 'bg-sky-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-sky-700' : 'text-slate-600'}`}>{action.label}</span>
                          {isActive && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Conditional Options */}
                <AnimatePresence mode="wait">
                  {actionType === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3 pt-1"
                    >
                      <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">What should Athena do?</Label>
                      <div className="relative group">
                        <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                        <Textarea
                          ref={textareaRef}
                          placeholder="e.g. Translate to French, change named entities to placeholders, etc..."
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          className="min-h-[100px] pl-11 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-sm shadow-inner"
                        />
                      </div>
                    </motion.div>
                  )}

                  {actionType === 'change_tone' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3 pt-1"
                    >
                      <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Tone selection</Label>
                      <div className="flex flex-wrap gap-2">
                        {tones.map(tone => (
                          <button
                            key={tone}
                            onClick={() => setSelectedTone(tone.toLowerCase())}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${selectedTone === tone.toLowerCase()
                              ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'}`}
                          >
                            {tone}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {actionType === 'translate' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3 pt-1"
                    >
                      <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Target Language</Label>
                      <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-xl">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map(lang => (
                            <SelectItem key={lang} value={lang.toLowerCase()}>{lang}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Controls */}
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Creativity</Label>
                      <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-md">
                        {Math.round(creativity[0] * 100)}%
                      </span>
                    </div>
                    <Slider value={creativity} onValueChange={setCreativity} max={1} step={0.1} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] px-1">Max Tokens</Label>
                    <div className="text-sm font-medium text-slate-700 px-2">{maxTokens}</div>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleTransform}
                      disabled={loading || (!actionType && !customPrompt.trim())}
                      className="w-full h-11 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-slate-200"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2 text-[#fabf23]" />}
                      {loading ? 'Processing...' : 'Transform'}
                    </Button>
                  </div>
                </div>

                {/* Preview Area */}
                {(resultText || loading) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-4 border-t border-slate-100"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-sky-600" />
                        <Label className="text-[11px] font-extrabold text-[#0c4a6e] uppercase tracking-[0.2em]">Preview</Label>
                        {resultText && (
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-[10px] text-slate-400">{wordCount.transformed} words</span>
                            <span className="text-[10px] text-slate-400">{readingTime.transformed} min read</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setShowPreview(!showPreview)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-sky-600 transition-all"
                        >
                          {showPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={handleCopy}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-sky-600 transition-all"
                          title="Copy to clipboard"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={handleTransform}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-sky-600 transition-all"
                          title="Regenerate"
                        >
                          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        {voiceSupported && (
                          <button
                            onClick={handleTextToSpeech}
                            className={`p-1.5 rounded-lg transition-all ${isSpeaking ? 'bg-sky-100 text-sky-600' : 'hover:bg-slate-100 text-slate-400 hover:text-sky-600'}`}
                            title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                          >
                            {isSpeaking ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={handleDownload}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-sky-600 transition-all"
                          title="Download as text file"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleShare}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-sky-600 transition-all"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleSaveToLibrary}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-sky-600 transition-all"
                          title="Save to library"
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {showPreview && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          ref={previewRef}
                          className="min-h-[150px] max-h-[400px] overflow-y-auto p-5 bg-gradient-to-br from-sky-50/50 to-white border border-sky-100 rounded-3xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed shadow-sm relative group"
                        >
                          {resultText || (
                            <div className="flex flex-col items-center justify-center h-full py-8 text-slate-400 italic">
                              <Sparkles className="w-8 h-8 mb-3 text-sky-300" />
                              Athena is dreaming up something special...
                            </div>
                          )}
                          {loading && (
                            <div className="absolute bottom-4 right-4 flex space-x-1">
                              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"></div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!loading && resultText && (
                      <>
                        {/* Action buttons */}
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                          <Button
                            onClick={() => handleApply('replace')}
                            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-sky-200 hover:shadow-sky-300 transition-all"
                          >
                            <Check className="w-4 h-4 mr-2" /> Replace Selection
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleApply('insert')}
                            className="flex-1 h-12 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm bg-white hover:bg-slate-50"
                          >
                            <Plus className="w-4 h-4 mr-2" /> Insert After
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleApply('insert_before')}
                            className="flex-1 h-12 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm bg-white hover:bg-slate-50"
                          >
                            <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Insert Before
                          </Button>
                        </div>

                        {/* Feedback */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Was this helpful?</span>
                            <button
                              onClick={() => handleFeedback(true)}
                              className={`p-1.5 rounded-lg transition-all ${feedback.helpful === true ? 'bg-green-100 text-green-600' : 'hover:bg-slate-100 text-slate-400'}`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleFeedback(false)}
                              className={`p-1.5 rounded-lg transition-all ${feedback.helpful === false ? 'bg-red-100 text-red-600' : 'hover:bg-slate-100 text-slate-400'}`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => setResultText('')}
                            className="text-xs text-slate-400 hover:text-red-500 transition-all"
                          >
                            Clear
                          </button>
                        </div>

                        {/* Version comparison */}
                        {selectedText && resultText && (
                          <div className="mt-4">
                            <button
                              onClick={() => compareVersions(selectedText, resultText)}
                              className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
                            >
                              <Filter className="w-3 h-3" /> Compare versions
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer with stats */}
        <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              ENGINE: ATHENA CORE v2.5
            </div>
            {resultText && (
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <Clock className="w-3 h-3" />
                {readingTime.transformed} min read
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#fabf23]" /> Powered by Premium Intelligence
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIInlineActions;