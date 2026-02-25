import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Search,
  Replace,
  ArrowUp,
  ArrowDown,
  X,
  CaseSensitive,
  WholeWord
} from 'lucide-react';
import { toast } from 'sonner';

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

    const content = editor.getText();
    let flags = 'g';
    if (matchCase) flags += 'i';
    
    let regexPattern = searchTerm;
    if (wholeWord) {
      regexPattern = `\\b${searchTerm}\\b`;
    }
    
    try {
      const regex = new RegExp(regexPattern, flags);
      const foundMatches = [];
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        foundMatches.push({
          index: match.index,
          match: match[0],
          length: match[0].length
        });
      }
      
      setMatches(foundMatches);
      return foundMatches;
    } catch (error) {
      console.error('Invalid regex pattern:', error);
      setMatches([]);
      return [];
    }
  };

  // Highlight current match
  const highlightMatch = (matchIndex) => {
    if (!editor || matches.length === 0) return;
    
    const match = matches[matchIndex];
    if (!match) return;
    
    // Convert text position to editor position
    const { state } = editor;
    const pos = editor.view.posAtCoords({ left: 0, top: match.index });
    
    if (pos) {
      editor.commands.setTextSelection({
        from: match.index,
        to: match.index + match.length
      });
      editor.commands.focus();
    }
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
    
    editor.commands.insertContent(replaceTerm);
    toast.success('Replaced current match');
    
    // Find next match after replacement
    setTimeout(() => {
      findAllMatches();
      if (matches.length > 0) {
        const newIndex = currentMatchIndex % matches.length;
        setCurrentMatchIndex(newIndex);
        highlightMatch(newIndex);
      }
    }, 100);
  };

  // Replace all matches
  const replaceAll = () => {
    if (!editor || !searchTerm || matches.length === 0) return;
    
    try {
      let flags = 'g';
      if (matchCase) flags += 'i';
      
      let regexPattern = searchTerm;
      if (wholeWord) {
        regexPattern = `\\b${searchTerm}\\b`;
      }
      
      const regex = new RegExp(regexPattern, flags);
      const newContent = editor.getText().replace(regex, replaceTerm);
      
      editor.commands.setContent(newContent);
      toast.success(`Replaced ${matches.length} occurrences`);
      onClose();
    } catch (error) {
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            {isReplaceMode ? 'Find and Replace' : 'Find'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search-term">Find</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                id="search-term"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter text to find..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Replace Input (only in replace mode) */}
          {isReplaceMode && (
            <div className="space-y-2">
              <Label htmlFor="replace-term">Replace with</Label>
              <div className="relative">
                <Replace className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="replace-term"
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                  placeholder="Enter replacement text..."
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="match-case"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="match-case" className="text-sm flex items-center gap-1">
                <CaseSensitive className="w-4 h-4" />
                Match case
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="whole-word"
                checked={wholeWord}
                onChange={(e) => setWholeWord(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="whole-word" className="text-sm flex items-center gap-1">
                <WholeWord className="w-4 h-4" />
                Whole word
              </Label>
            </div>
          </div>

          {/* Match Counter */}
          <div className="text-sm text-gray-500 text-center">
            {currentMatchText}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={findPrevious}
                disabled={matches.length === 0}
                className="flex-1"
              >
                <ArrowUp className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={findNext}
                disabled={matches.length === 0}
                className="flex-1"
              >
                <ArrowDown className="w-4 h-4 mr-1" />
                Next
              </Button>
            </div>

            {isReplaceMode && (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={replaceCurrent}
                  disabled={matches.length === 0 || !replaceTerm}
                  className="flex-1"
                >
                  <Replace className="w-4 h-4 mr-1" />
                  Replace
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={replaceAll}
                  disabled={matches.length === 0 || !replaceTerm}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Replace className="w-4 h-4 mr-1" />
                  Replace All
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-1" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { FindReplaceModal };