import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '../ui/dialog';
import { Button } from '../ui/button';
import { FileText, Hash, Type, AlignLeft, Clock } from 'lucide-react';

const WordCountDialog = ({ open, onOpenChange, editor }) => {
    const [stats, setStats] = useState({
        words: 0, chars: 0, charsNoSpace: 0, paragraphs: 0,
        sentences: 0, lines: 0, pages: 0, readingTime: 0
    });

    // Fix: Static color mapping to prevent Tailwind PurgeCSS from removing dynamic classes
    const COLOR_MAP = {
      blue:   'bg-blue-50 border-blue-100 text-blue-700 text-blue-500',
      indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700 text-indigo-500',
      purple: 'bg-purple-50 border-purple-100 text-purple-700 text-purple-500',
      green:  'bg-green-50 border-green-100 text-green-700 text-green-500',
      yellow: 'bg-yellow-50 border-yellow-100 text-yellow-700 text-yellow-500',
      orange: 'bg-orange-50 border-orange-100 text-orange-700 text-orange-500',
    };

    useEffect(() => {
        if (!open || !editor) return;
        
        const text = editor.getText();

        // Count paragraphs by traversing the ProseMirror doc — exact, not regex
        let paragraphs = 0;
        editor.state.doc.descendants(node => {
          if (node.type.name === 'paragraph') paragraphs++;
        });

        const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
        const chars = text.length;
        const charsNoSpace = text.replace(/\s/g, '').length;
        
        // Improved sentence counting: match sentence-ending punctuation followed by space or end
        const sentences = (text.match(/[.!?]+(\s|$)/g) || []).length;
        const lines = text.split('\n').length;
        const pages = Math.max(1, Math.ceil(words / 250));
        const readingTime = Math.max(1, Math.ceil(words / 200));
        
        setStats({ words, chars, charsNoSpace, paragraphs, sentences, lines, pages, readingTime });
    }, [open, editor]);

    const StatCard = ({ icon: Icon, label, value, color = 'blue' }) => {
        const colorClasses = COLOR_MAP[color] || COLOR_MAP.blue;
        const textColor = `text-${color}-500`;
        const textBoldColor = `text-${color}-700`;
        
        return (
            <div className={`${colorClasses} rounded-xl p-4 flex flex-col items-center text-center`}>
                <Icon className={`w-5 h-5 ${textColor} mb-2`} />
                <div className={`text-2xl font-bold ${textBoldColor}`}>{value.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white" aria-describedby="word-count-description">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Hash className="w-5 h-5 text-blue-600" />
                        Document Statistics
                    </DialogTitle>
                    <DialogDescription id="word-count-description" className="text-sm text-gray-500">
                        View detailed statistics about your document including word count, character count, and reading time
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 py-2">
                    <StatCard icon={Type} label="Words" value={stats.words} color="blue" />
                    <StatCard icon={AlignLeft} label="Characters" value={stats.chars} color="indigo" />
                    <StatCard icon={Hash} label="Chars (no space)" value={stats.charsNoSpace} color="purple" />
                    <StatCard icon={FileText} label="Paragraphs" value={stats.paragraphs} color="green" />
                    <StatCard icon={AlignLeft} label="Sentences" value={stats.sentences} color="yellow" />
                    <StatCard icon={FileText} label="Est. Pages" value={stats.pages} color="orange" />
                </div>

                <div className="border-t border-gray-100 pt-3 px-1">
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-gray-600">
                            <Clock className="w-4 h-4 text-blue-400" />
                            Estimated reading time
                        </span>
                        <span className="font-semibold text-blue-700">~{stats.readingTime} min</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Based on avg. 200 words/minute</p>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { WordCountDialog };
