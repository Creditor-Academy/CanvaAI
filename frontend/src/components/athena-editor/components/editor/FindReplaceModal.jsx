import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import {
  Search, X, ChevronUp, ChevronDown, CaseSensitive,
  WholeWord, Regex, Replace, ReplaceAll, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

// ─── ProseMirror Plugin ──────────────────────────────────────────────────────
/**
 * Build a ProseMirror plugin that decorates all match ranges in the document.
 * Each editor instance gets its own unique plugin key to avoid HMR and multi-instance conflicts.
 */
function buildFindReplacePlugin(pluginKey) {
  return new Plugin({
    key: pluginKey,
    state: {
      // Plugin state: { matches, currentIndex }
      init() { return { matches: [], currentIndex: -1 }; },
      apply(tr, old) {
        // Plugin state is updated via setMeta
        const meta = tr.getMeta(pluginKey);
        if (meta !== undefined) return meta;
        // Remap positions when doc changes
        if (tr.docChanged && old.matches.length > 0) {
          const remapped = old.matches
            .map(m => ({
              from: tr.mapping.map(m.from),
              to:   tr.mapping.map(m.to),
            }))
            .filter(m => m.from < m.to);
          return { ...old, matches: remapped };
        }
        return old;
      },
    },
    props: {
      decorations(state) {
        const { matches, currentIndex } = pluginKey.getState(state);
        if (!matches.length) return DecorationSet.empty;

        const decorations = matches.map((m, i) =>
          Decoration.inline(m.from, m.to, {
            class: i === currentIndex
              ? 'find-replace-current'
              : 'find-replace-match',
          })
        );
        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
}

// ─── Match Finder ────────────────────────────────────────────────────────────

/**
 * Walk the ProseMirror doc and return all { from, to } ranges matching the
 * search options. Works across block boundaries by accumulating a flat char map.
 */
function findMatchesInDoc(doc, searchTerm, { matchCase, wholeWord, useRegex }) {
  if (!doc || !searchTerm) return [];

  // Build flat text + position map
  const chars = []; // chars[i] = { char, pos }
  doc.descendants((node, pos) => {
    if (node.isText) {
      for (let i = 0; i < node.text.length; i++) {
        chars.push({ char: node.text[i], pos: pos + i });
      }
    } else if (node.isBlock && chars.length > 0) {
      chars.push({ char: '\n', pos: pos });
    }
  });

  const text = chars.map(c => c.char).join('');

  let flags = 'g';
  if (!matchCase) flags += 'i';

  let pattern;
  try {
    if (useRegex) {
      pattern = new RegExp(searchTerm, flags);
    } else {
      const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pattern = new RegExp(wholeWord ? `\\b${escaped}\\b` : escaped, flags);
    }
  } catch {
    return []; // invalid regex
  }

  const matches = [];
  let m;
  while ((m = pattern.exec(text)) !== null) {
    if (m[0].length === 0) { pattern.lastIndex++; continue; }
    const start = m.index;
    const end   = m.index + m[0].length - 1;
    if (chars[start] && chars[end]) {
      matches.push({
        from:  chars[start].pos,
        to:    chars[end].pos + 1,
        match: m[0],
        groups: m, // for regex capture group replace
      });
    }
  }
  return matches;
}

// ─── Helper: compute replacement string with capture group substitution ──────
function computeReplacement(replaceTerm, groups) {
  if (!groups) return replaceTerm;
  return replaceTerm.replace(/\$(\d+)/g, (_, n) => groups[parseInt(n)] ?? '');
}

// ─── Component ───────────────────────────────────────────────────────────────

const FindReplaceModal = ({ isOpen, onClose, editor, isReplaceMode = false }) => {
  const [searchTerm,    setSearchTerm]    = useState('');
  const [replaceTerm,   setReplaceTerm]   = useState('');
  const [matchCase,     setMatchCase]     = useState(false);
  const [wholeWord,     setWholeWord]     = useState(false);
  const [useRegex,      setUseRegex]      = useState(false);
  const [showReplace,   setShowReplace]   = useState(isReplaceMode);
  const [regexError,    setRegexError]    = useState('');
  const [matches,       setMatches]       = useState([]);
  const [currentIndex,  setCurrentIndex]  = useState(-1);

  const searchInputRef  = useRef(null);
  const replaceInputRef = useRef(null);
  
  // ✅ CRITICAL FIX: Plugin instance per editor mount (not module singleton)
  // This prevents HMR issues and multi-tab state conflicts
  const pluginKeyRef = useRef(null);
  const pluginInstanceRef = useRef(null);
  
  // Create fresh plugin key and instance on first render for this editor instance
  if (!pluginKeyRef.current && editor) {
    pluginKeyRef.current = new PluginKey(`athena-find-replace-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
    pluginInstanceRef.current = buildFindReplacePlugin(pluginKeyRef.current);
  }

  // ── Register plugin with editor on mount, cleanup on unmount ─────────────
  useEffect(() => {
    if (!editor || !pluginInstanceRef.current) return;
    
    // Register plugin with this specific editor instance
    editor.registerPlugin(pluginInstanceRef.current);
    
    // Cleanup: unregister plugin when editor unmounts or component unmounts
    return () => {
      if (pluginKeyRef.current) {
        editor.unregisterPlugin(pluginKeyRef.current);
      }
      pluginKeyRef.current = null;
      pluginInstanceRef.current = null;
    };
  }, [editor]);

  // ── Sync replace panel with prop ─────────────────────────────────────────
  useEffect(() => {
    setShowReplace(isReplaceMode);
  }, [isReplaceMode]);

  // ── Focus on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    } else {
      // Clear decorations when closed
      clearDecorations();
    }
  }, [isOpen]);

  // ── Core: update decorations whenever search params change ───────────────
  const updateDecorations = useCallback((term, idx, opts) => {
    if (!editor || !pluginKeyRef.current) return [];
    setRegexError('');

    if (!term) {
      clearDecorations();
      setMatches([]);
      setCurrentIndex(-1);
      return [];
    }

    // Validate regex
    if (opts.useRegex) {
      try { new RegExp(term); }
      catch (e) {
        setRegexError(e.message);
        clearDecorations();
        setMatches([]);
        return [];
      }
    }

    const found = findMatchesInDoc(editor.state.doc, term, opts);
    const safeIdx = found.length === 0 ? -1 : Math.min(idx, found.length - 1);

    // Push into ProseMirror plugin via a meta transaction
    const tr = editor.state.tr;
    tr.setMeta(pluginKeyRef.current, { matches: found, currentIndex: safeIdx });
    editor.view.dispatch(tr);

    setMatches(found);
    setCurrentIndex(safeIdx);

    // Scroll current match into view
    if (found.length > 0 && safeIdx >= 0) {
      scrollToMatch(found[safeIdx]);
    }

    return found;
  }, [editor]);

  const clearDecorations = useCallback(() => {
    if (!editor || !pluginKeyRef.current) return;
    try {
      const tr = editor.state.tr;
      tr.setMeta(pluginKeyRef.current, { matches: [], currentIndex: -1 });
      editor.view.dispatch(tr);
    } catch {}
  }, [editor]);

  // Re-run search whenever any option changes
  useEffect(() => {
    if (!isOpen) return;
    updateDecorations(searchTerm, currentIndex < 0 ? 0 : currentIndex, { matchCase, wholeWord, useRegex });
  }, [searchTerm, matchCase, wholeWord, useRegex, isOpen]);

  // ── Scroll helper ─────────────────────────────────────────────────────────
  const scrollToMatch = (match) => {
    if (!editor || !match) return;
    try {
      editor.commands.setTextSelection({ from: match.from, to: match.to });
      editor.commands.scrollIntoView();
    } catch {}
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const goToIndex = useCallback((idx) => {
    if (!matches.length || !pluginKeyRef.current) return;
    const safeIdx = ((idx % matches.length) + matches.length) % matches.length;
    setCurrentIndex(safeIdx);
    scrollToMatch(matches[safeIdx]);

    const tr = editor.state.tr;
    tr.setMeta(pluginKeyRef.current, { matches, currentIndex: safeIdx });
    editor.view.dispatch(tr);
  }, [matches, editor]);

  const findNext     = () => goToIndex(currentIndex + 1);
  const findPrevious = () => goToIndex(currentIndex - 1);

  // ── Replace ───────────────────────────────────────────────────────────────
  const replaceCurrent = useCallback(() => {
    if (!editor || !matches.length || currentIndex < 0) return;
    const match = matches[currentIndex];
    const replacement = computeReplacement(replaceTerm, match.groups);

    editor
      .chain()
      .focus()
      .setTextSelection({ from: match.from, to: match.to })
      .insertContent(replacement)
      .run();

    // Re-scan after a tick (doc has changed)
    setTimeout(() => {
      const found = updateDecorations(searchTerm, currentIndex, { matchCase, wholeWord, useRegex });
      if (found.length > 0) goToIndex(Math.min(currentIndex, found.length - 1));
    }, 30);
  }, [editor, matches, currentIndex, replaceTerm, searchTerm, matchCase, wholeWord, useRegex, updateDecorations, goToIndex]);

  const replaceAll = useCallback(() => {
    if (!editor || !matches.length) return;
    try {
      // Batch all replacements into a SINGLE transaction = SINGLE undo step
      let tr = editor.state.tr;
      
      // Iterate backwards so earlier positions stay valid during replacement
      [...matches].reverse().forEach(m => {
        const replacement = computeReplacement(replaceTerm, m.groups);
        tr = tr.replaceWith(m.from, m.to, editor.state.schema.text(replacement));
      });
      
      // CRITICAL: Mark as single history step for clean Ctrl+Z behavior
      tr.setMeta('addToHistory', true);
      
      const count = matches.length;
      editor.view.dispatch(tr);
      toast.success(`Replaced ${count} occurrence${count !== 1 ? 's' : ''}`);

      // Re-scan after document change
      setTimeout(() => {
        updateDecorations(searchTerm, 0, { matchCase, wholeWord, useRegex });
      }, 30);
    } catch (e) {
      console.error('Replace all failed:', e);
      toast.error('Replace failed: ' + e.message);
    }
  }, [editor, matches, replaceTerm, searchTerm, matchCase, wholeWord, useRegex, updateDecorations]);

  // ── Keyboard handling ────────────────────────────────────────────────────
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.shiftKey ? findPrevious() : findNext();
    }
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    if (e.key === 'Tab' && showReplace) {
      e.preventDefault();
      replaceInputRef.current?.focus();
    }
  };

  const handleReplaceKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); replaceCurrent(); }
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    if (e.key === 'Tab') { e.preventDefault(); searchInputRef.current?.focus(); }
  };

  // ── Derived UI state ──────────────────────────────────────────────────────
  const matchLabel = searchTerm
    ? matches.length === 0
      ? 'No results'
      : `${currentIndex + 1} / ${matches.length}`
    : '';

  const hasMatches     = matches.length > 0;
  const canReplace     = hasMatches && currentIndex >= 0;
  const canReplaceAll  = hasMatches;

  if (!isOpen) return null;

  return (
    <>
      {/* Inject decoration CSS once */}
      <style>{`
        .find-replace-match {
          background-color: rgba(255, 165, 0, 0.35);
          border-radius: 2px;
        }
        .find-replace-current {
          background-color: rgba(255, 200, 0, 0.8);
          border-radius: 2px;
          outline: 2px solid #f59e0b;
          outline-offset: -1px;
        }
      `}</style>

      {/* Floating panel — top-right, non-blocking */}
      <div
        className="fixed top-16 right-4 z-[9999] w-[420px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700 tracking-tight">
              Find & Replace
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Toggle Replace Panel */}
            <button
              onClick={() => setShowReplace(v => !v)}
              className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                showReplace
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="Toggle replace"
            >
              Replace
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded-lg transition-colors ml-1"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* ── Search Row ── */}
        <div className="px-4 pt-3 pb-0">
          <div className="flex items-center gap-2">
            {/* Search field */}
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Find…"
                className={`w-full h-9 pl-3 pr-16 text-sm border rounded-lg outline-none transition-all
                  ${regexError
                    ? 'border-red-400 bg-red-50 focus:ring-1 focus:ring-red-400'
                    : 'border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-200'
                  }`}
                spellCheck={false}
                autoComplete="off"
              />
              {/* Match count badge */}
              {matchLabel && (
                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-mono px-1.5 py-0.5 rounded-md font-medium
                  ${matches.length === 0 ? 'text-red-500 bg-red-50' : 'text-gray-500 bg-gray-100'}`}>
                  {matchLabel}
                </span>
              )}
            </div>

            {/* Prev / Next */}
            <button
              onClick={findPrevious}
              disabled={!hasMatches}
              title="Previous match (Shift+Enter)"
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronUp className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={findNext}
              disabled={!hasMatches}
              title="Next match (Enter)"
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Regex error */}
          {regexError && (
            <p className="text-[11px] text-red-500 mt-1 pl-1 truncate">{regexError}</p>
          )}
        </div>

        {/* ── Replace Row (collapsible) ── */}
        {showReplace && (
          <div className="px-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={replaceInputRef}
                  value={replaceTerm}
                  onChange={e => setReplaceTerm(e.target.value)}
                  onKeyDown={handleReplaceKeyDown}
                  placeholder={useRegex ? 'Replace… ($1 for groups)' : 'Replace with…'}
                  className="w-full h-9 pl-3 pr-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition-all"
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>

              {/* Replace current */}
              <button
                onClick={replaceCurrent}
                disabled={!canReplace}
                title="Replace current (Enter)"
                className="flex items-center gap-1 px-3 h-9 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                Replace
              </button>

              {/* Replace all */}
              <button
                onClick={replaceAll}
                disabled={!canReplaceAll}
                title="Replace all occurrences"
                className="flex items-center gap-1 px-3 h-9 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                <ReplaceAll className="w-3.5 h-3.5" />
                All
              </button>
            </div>
          </div>
        )}

        {/* ── Options Row ── */}
        <div className="flex items-center gap-1 px-4 py-2.5">
          <OptionToggle
            active={matchCase}
            onClick={() => setMatchCase(v => !v)}
            Icon={CaseSensitive}
            label="Match case"
            shortcut="Alt+C"
          />
          <OptionToggle
            active={wholeWord}
            onClick={() => setWholeWord(v => !v)}
            disabled={useRegex}
            Icon={WholeWord}
            label="Whole word"
            shortcut="Alt+W"
          />
          <OptionToggle
            active={useRegex}
            onClick={() => setUseRegex(v => !v)}
            Icon={Regex}
            label="Regular expression"
            shortcut="Alt+R"
          />
          {useRegex && (
            <span className="ml-auto text-[10px] text-gray-400 font-mono">
              Use $1, $2… for groups in replace
            </span>
          )}
        </div>

        {/* ── Results Summary Bar ── */}
        {searchTerm && (
          <div className={`px-4 py-2 border-t border-gray-100 flex items-center justify-between
            ${matches.length === 0 ? 'bg-red-50' : 'bg-blue-50'}`}>
            <span className={`text-xs font-medium ${matches.length === 0 ? 'text-red-600' : 'text-blue-700'}`}>
              {matches.length === 0
                ? 'No matches found'
                : `${matches.length} match${matches.length !== 1 ? 'es' : ''} in document`}
            </span>
            {matches.length > 0 && (
              <div className="flex gap-1">
                {/* Mini dots — show up to 10 match indicators */}
                {matches.slice(0, 10).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentIndex
                        ? 'bg-blue-600 scale-125'
                        : 'bg-blue-300 hover:bg-blue-500'
                    }`}
                  />
                ))}
                {matches.length > 10 && (
                  <span className="text-[10px] text-blue-500 ml-1">+{matches.length - 10}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// ── Small toggle button component ────────────────────────────────────────────
const OptionToggle = ({ active, onClick, disabled, Icon, label, shortcut }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={`${label} (${shortcut})`}
    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all
      ${active
        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
      }
      ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <Icon className="w-3.5 h-3.5" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export { FindReplaceModal };