import { Plugin, PluginKey } from 'prosemirror-state';

// 🔥 CRITICAL FIX: Disabled naive hardcoded dictionary spellchecker.
// PROBLEM: A hardcoded list of ~100 common English words means ANY specific noun 
// or technical term was flagged with a red wavy underline, destroying the UX.
// Production editors rely on native browser spellcheck via `spellcheck="true"` 
// on the contenteditable div, which hooks into the OS spellchecker (100k+ words).
// SOLUTION: Return an empty plugin stub to satisfy imports but stop decorating.
export const createSpellCheckPlugin = () => {
  return new Plugin({
    key: new PluginKey('spellCheckDisabled_production'),
  });
};

