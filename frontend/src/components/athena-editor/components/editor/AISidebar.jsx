import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { fixGrammar } from '../../ai/aiUtils';

const quickActions = [
  { id: 'enhance', label: 'Enhance writing', icon: Wand2 },
  { id: 'grammar_fix', label: 'Fix Grammar', icon: SpellCheck },
  { id: 'summarize', label: 'Summarize', icon: FileText },
  { id: 'expand', label: 'Expand', icon: Zap },
  { id: 'simplify', label: 'Simplify', icon: MessageSquare },
  { id: 'translate', label: 'Translate', icon: Languages },
  { id: 'bullets_to_text', label: 'Bullets to Text', icon: List }, // Add this
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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);

    // Simulate AI generation with placeholder
    setTimeout(() => {
      onGenerate(`API:${prompt}`);
      setPrompt('');
      setIsLoading(false);
    }, 1000);
  };

  const handleQuickAction = async (action) => {
    // For bullets_to_text, we don't strictly need text selection as we can use cursor position
    if (!selectedText && action !== 'bullets_to_text') return;
    setIsLoading(true);

    // Simulate transformation
    try {
      let transformedText = `[${action}] ${selectedText}`;

      if (action === 'grammar_fix') {
        transformedText = await fixGrammar(selectedText);
      } else if (action === 'bullets_to_text') {
        transformedText = null; // Signal to editor to handle via commands
      } else if (action === 'enhance') {
        transformedText = selectedText + " [Enhanced by AI]";
      } else if (action === 'summarize') {
        transformedText = "Summary: " + selectedText.substring(0, Math.min(selectedText.length, 50)) + "...";
      }

      onTransformText(action, transformedText);
    } catch (error) {
      console.error("AI Action failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-80 border-l border-blue-200 bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col h-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-blue-200">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-sm text-blue-800">AI Assistant</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-blue-200 text-blue-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Quick Actions */}
            {selectedText && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                  Quick Actions
                </h3>
                <p className="text-xs text-blue-600 mb-2">
                  Selected: "{selectedText.slice(0, 50)}{selectedText.length > 50 ? '...' : ''}"
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.id)}
                      disabled={isLoading}
                      className={`flex items-center gap-2 p-2 rounded-lg text-sm border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <action.icon className="w-4 h-4 text-blue-600" />
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Content */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                Generate Content
              </h3>
              <Textarea
                placeholder="Describe what you want to create..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px] resize-none text-sm"
              />
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>

            {/* Suggestions */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                Suggestions
              </h3>
              <div className="space-y-2">
                {[
                  'Write an introduction paragraph',
                  'Create a bullet point summary',
                  'Generate a conclusion',
                  'Write a professional email',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setPrompt(suggestion)}
                    className="w-full text-left p-2 rounded-lg border border-blue-200 hover:bg-blue-100 text-sm text-blue-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};