import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Search,
  Replace,
  ArrowUp,
  ArrowDown,
  X,
  CaseSensitive,
  WholeWord,
  ReplaceAll
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../utils';

const FindReplaceModal = ({
  isOpen,
  onClose,
  editor,
  isReplaceMode = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const searchInputRef = useRef(null);

  // Find all matches in the document
  const findAllMatches = () => {
    if (!editor || !searchTerm) {
      setMatches([]);
      setCurrentMatchIndex(0);
      return [];
    }

    const { doc } = editor.state;
    let textContent = '';
    const positions = [];

    // Map the actual document text precisely to ProseMirror node positions
    doc.descendants((node, pos) => {
      if (node.isText) {
        for (let i = 0; i < node.text.length; i++) {
          textContent += node.text[i];
          positions.push(pos + i);
        }
      } else if (node.isBlock && textContent.length > 0 && textContent[textContent.length - 1] !== '\n') {
        textContent += '\n';
        positions.push(pos);
      }
    });

    let flags = 'g';
    if (!matchCase) flags += 'i'; // If not case sensitive, apply ignore-case flag

    // Escape standard regex characters in search term
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let regexPattern = escapeRegExp(searchTerm);

    if (wholeWord) {
      regexPattern = `\\b${regexPattern}\\b`;
    }

    try {
      const regex = new RegExp(regexPattern, flags);
      const foundMatches = [];
      let match;

      while ((match = regex.exec(textContent)) !== null) {
        if (match[0].length === 0) break; // Prevent infinite loop on empty matches

        const startIndex = match.index;
        const endIndex = match.index + match[0].length - 1;

        // Ensure positions map correctly back to Prosemirror limits
        if (positions[startIndex] !== undefined && positions[endIndex] !== undefined) {
          foundMatches.push({
            from: positions[startIndex],
            to: positions[endIndex] + 1, // +1 because Tiptap selection 'to' is exclusive
            match: match[0]
          });
        }
      }

      setMatches(foundMatches);
      return foundMatches;
    } catch (error) {
      console.error('Invalid search pattern:', error);
      setMatches([]);
      return [];
    }
  };

  // Highlight current match
  const highlightMatch = (matchIndex) => {
    if (!editor || matches.length === 0) return;

    const match = matches[matchIndex];
    if (!match) return;

    // Perform selection exactly at the proseMirror document nodes mapped!
    editor.commands.setTextSelection({
      from: match.from,
      to: match.to
    });

    editor.commands.focus();
    editor.commands.scrollIntoView(); // Scrolls correctly into view
  };

  // Find next match
  const findNext = () => {
    if (matches.length === 0) return;

    const nextIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIndex);
    highlightMatch(nextIndex);
  };

  // Find previous match
  const findPrevious = () => {
    if (matches.length === 0) return;

    const prevIndex = currentMatchIndex === 0 ? matches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    highlightMatch(prevIndex);
  };

  // Replace current match
  const replaceCurrent = () => {
    if (!editor || matches.length === 0) return;

    const match = matches[currentMatchIndex];
    if (!match) return;

    // Set selection directly on the match and insert!
    editor.commands.setTextSelection({
      from: match.from,
      to: match.to
    });
    editor.commands.insertContent(replaceTerm);
    toast.success('Replaced current match');

    // Re-evaluate matches immediately after replacement alters the document flow
    setTimeout(() => {
      const newMatches = findAllMatches();
      if (newMatches.length > 0) {
        // Because the current match was just removed, its index essentially passed down to the next valid match
        const newIndex = Math.min(currentMatchIndex, newMatches.length - 1);
        setCurrentMatchIndex(newIndex);
        highlightMatch(newIndex);
      }
    }, 50);
  };

  // Replace all matches
  const replaceAll = () => {
    if (!editor || !searchTerm || matches.length === 0) return;

    try {
      let tr = editor.state.tr;

      // Iterate exactly in backwards flow so earlier replace modifications don't skew the index limits of matches later down!
      const reversedMatches = [...matches].reverse();

      reversedMatches.forEach(m => {
        tr.insertText(replaceTerm, m.from, m.to);
      });

      editor.view.dispatch(tr);

      toast.success(`Replaced ${matches.length} occurrences`);
      findAllMatches();

      if (!isReplaceMode) {
        onClose();
      }
    } catch (error) {
      console.error(error);
      toast.error('Error replacing text');
    }
  };

  // Update search when options change
  useEffect(() => {
    if (isOpen && searchTerm) {
      const matches = findAllMatches();
      if (matches.length > 0) {
        highlightMatch(0);
        setCurrentMatchIndex(0);
      }
    }
  }, [searchTerm, matchCase, wholeWord, isOpen]);

  // Focus search input when dialog opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Get current match text
  const currentMatchText = matches.length > 0
    ? `${currentMatchIndex + 1} of ${matches.length}`
    : '0 of 0';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 shadow-2xl border-2">
        {/* Google Docs-style header bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 rounded-t-lg">
          <div className="flex items-center gap-3 flex-1">
            <Search className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Find and replace</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Main content area - Google Docs style */}
        <div className="p-4 space-y-3 bg-gray-50">
          {/* Search input with integrated buttons */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Find..."
                className="pl-3 pr-10 h-10 border-2 focus:border-blue-500 focus:ring-0"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setMatches([]);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
            
            {/* Navigation buttons integrated into search bar */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={findPrevious}
                disabled={matches.length === 0}
                className="h-10 w-10 hover:bg-gray-100"
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={findNext}
                disabled={matches.length === 0}
                className="h-10 w-10 hover:bg-gray-100"
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Replace input */}
          <div className="relative">
            <Input
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              placeholder="Replace with..."
              className="pl-3 h-10 border-2 focus:border-blue-500 focus:ring-0"
            />
          </div>

          {/* Options row - compact */}
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer hover:text-gray-700">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex items-center gap-1">
                <CaseSensitive className="w-3.5 h-3.5" />
                Match case
              </span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer hover:text-gray-700">
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={(e) => setWholeWord(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex items-center gap-1">
                <WholeWord className="w-3.5 h-3.5" />
                Match whole word
              </span>
            </label>
          </div>

          {/* Match counter */}
          {searchTerm && (
            <div className={cn(
              "text-sm text-center py-1.5 rounded",
              matches.length > 0 
                ? "bg-blue-50 text-blue-700 font-medium" 
                : "bg-gray-100 text-gray-500"
            )}>
              {currentMatchText}
            </div>
          )}

          {/* Action buttons - Google Docs style */}
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <Button
              variant="default"
              size="sm"
              onClick={replaceCurrent}
              disabled={matches.length === 0 || !replaceTerm}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Replace className="w-4 h-4 mr-1.5" />
              Replace
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={replaceAll}
              disabled={matches.length === 0 || !replaceTerm}
              className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <ReplaceAll className="w-4 h-4 mr-1.5" />
              Replace All
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { FindReplaceModal };