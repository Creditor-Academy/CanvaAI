import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  BookOpen,
  RefreshCw,
  MessageSquare,
  Play,
  Bug,
  FileCode2,
  Sparkles,
  Check,
  Copy,
  Terminal,
  Cpu,
  Zap,
  RotateCcw
} from 'lucide-react';
import { generateCode, explainCode, refactorCode, addComments } from '../../ai/aiUtils';

export const CodeAssistant = ({
  open,
  onOpenChange,
  onAction,
  selectedCode = ""
}) => {
  const [actionType, setActionType] = useState('generate');
  const [prompt, setPrompt] = useState(selectedCode);
  const [language, setLanguage] = useState('javascript');
  const [resultCode, setResultCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const actions = [
    { value: 'generate', label: 'Generate', icon: Code2, description: 'Create new code' },
    { value: 'explain', label: 'Explain', icon: BookOpen, description: 'Understand logic' },
    { value: 'refactor', label: 'Refactor', icon: RefreshCw, description: 'Optimize & clean' },
    { value: 'add_comments', label: 'Document', icon: MessageSquare, description: 'Add docblocks' },
  ];

  const languages = [
    "javascript", "python", "java", "cpp", "csharp", "php", "ruby",
    "go", "swift", "kotlin", "typescript", "html", "css", "sql", "rust"
  ];

  const handleForge = async () => {
    if (!actionType) {
      toast.error('Please select an action');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please provide code or a description');
      return;
    }

    setLoading(true);
    setResultCode('');

    const options = {
      temperature: 0.2,
      onChunk: (full) => setResultCode(full)
    };

    try {
      switch (actionType) {
        case 'generate': await generateCode(prompt, language, options); break;
        case 'explain': await explainCode(prompt, language, options); break;
        case 'refactor': await refactorCode(prompt, language, options); break;
        case 'add_comments': await addComments(prompt, language, options); break;
        default: break;
      }
      toast.success('Code forked successfully');
    } catch (error) {
      toast.error('Forge failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (mode = 'replace') => {
    if (!resultCode) return;
    if (onAction) {
      onAction(mode, resultCode, language);
    }
    onOpenChange(false);
    setResultCode('');
  };

  const handleCopy = async () => {
    if (!resultCode) return;
    
    try {
      // Primary method: Clipboard API (requires HTTPS or user gesture)
      await navigator.clipboard.writeText(resultCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Code copied');
    } catch (error) {
      console.warn('Clipboard API failed, using fallback:', error?.message || error);
      
      // Fallback: execCommand for non-HTTPS contexts or permission denied
      try {
        const ta = document.createElement('textarea');
        ta.value = resultCode;
        ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
        ta.setAttribute('readonly', '');
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, ta.value.length); // For mobile
        
        const success = document.execCommand('copy');
        document.body.removeChild(ta);
        
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.success('Code copied (fallback)');
        } else {
          toast.error('Failed to copy code');
        }
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        toast.error('Failed to copy code');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col bg-[#0b0e14] border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden p-0 gap-0 text-slate-200">
        <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-8 py-7 border-b border-slate-800/50 relative flex-shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-inner">
                <Cpu className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                  Code Forge <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">v3.0</span>
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-sm mt-0.5">
                  Architectural intelligence for modern developers.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main workspace */}
          <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar bg-[#0b0e14]">

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Operation Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  {actions.map(action => (
                    <button
                      key={action.value}
                      onClick={() => setActionType(action.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${actionType === action.value
                        ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                    >
                      <action.icon className="w-4 h-4" />
                      <span className="text-xs font-bold">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Stack / Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-11 bg-slate-900/50 border-slate-800 rounded-xl text-slate-200 focus:ring-blue-500/20 transition-all border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161b22] border-slate-800 text-slate-300">
                    {languages.map(lang => (
                      <SelectItem key={lang} value={lang} className="uppercase text-[10px] font-black">{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Input Context</Label>
                <button
                  onClick={() => setPrompt('')}
                  className="text-[10px] font-bold text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              </div>
              <div className="relative group">
                <div className="absolute top-4 left-4 z-10">
                  <Terminal className="w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="// Enter code or describe what to generate..."
                  className="min-h-[160px] pl-12 pt-4 bg-slate-950/50 border-slate-800 rounded-2xl text-blue-100 font-mono text-xs focus:bg-slate-950 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all shadow-inner"
                />
              </div>
            </div>

            <Button
              onClick={handleForge}
              disabled={loading || !prompt.trim()}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-900/20"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-3" /> : <Zap className="w-4 h-4 mr-3 text-yellow-400 fill-yellow-400" />}
              {loading ? 'Initializing Core...' : 'Execute Forge Pipeline'}
            </Button>

            {/* Forge Output Preview */}
            <AnimatePresence>
              {(resultCode || loading) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-4 border-t border-slate-800/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <Label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Compiler Output</Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-all">
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute top-0 right-0 p-3 flex gap-1.5 opacity-30">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    </div>
                    <pre className="min-h-[200px] max-h-[400px] overflow-auto p-6 bg-[#010409] border border-slate-800 rounded-2xl text-blue-50/90 font-mono text-xs leading-relaxed custom-scrollbar shadow-2xl">
                      {resultCode || (
                        <span className="text-slate-600 italic">// Awaiting stream cycles...</span>
                      )}
                      {loading && <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse vertical-middle font-sans"></span>}
                    </pre>
                  </div>

                  {!loading && resultCode && (
                    <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                      <Button
                        onClick={() => handleApply('replace')}
                        className="flex-1 h-12 rounded-xl bg-white text-[#0b0e14] hover:bg-slate-200 font-black text-xs uppercase tracking-widest transition-all"
                      >
                        Commit Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleApply('insert')}
                        className="flex-1 h-12 rounded-xl border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 font-bold text-xs"
                      >
                        Insert Below
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Console info */}
        <div className="px-8 py-3 bg-[#0d1117] border-t border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Status: Ready
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              Token: {resultCode.length}
            </div>
          </div>
          <div className="text-[9px] text-slate-600 font-mono">
            SECURE_ENCLAVE_ATHENA_FORGE_04
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


export default CodeAssistant;