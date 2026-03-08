import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

// Simple dictionary of common English words (you can expand this or use an external API)
const commonWords = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'did', 'having',
  'may', 'should', 'am', 'being', 'such', 'very', 'here', 'where', 'why', 'how',
  'writing', 'document', 'text', 'editor', 'grammar', 'spelling', 'check', 'error'
]);

// Function to check if a word is misspelled
const isMisspelled = (word) => {
  // Skip numbers, URLs, and very short words
  if (/^\d+$/.test(word) || word.length < 2 || /^[A-Z]+$/.test(word)) {
    return false;
  }
  
  // Clean the word (remove punctuation)
  const cleanWord = word.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '');
  
  // Check against dictionary
  return cleanWord && !commonWords.has(cleanWord);
};

// Create spell check plugin
export const createSpellCheckPlugin = () => {
  let debounceTimer = null;
  const DEBOUNCE_DELAY = 1000; // Wait 1 second after typing stops
  
  return new Plugin({
    key: new PluginKey('spellCheck'),
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, set) {
        return tr.getMeta('spellCheck') || set.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
    view(editorView) {
      return {
        update(view, prevState) {
          // Only check if document changed
          if (!view.state.doc.eq(prevState.doc)) {
            // Debounce the spell check to avoid running on every keystroke
            if (debounceTimer) {
              clearTimeout(debounceTimer);
            }
            
            debounceTimer = setTimeout(() => {
              if (view.isDestroyed) return;
              
              const decorations = [];
              const text = view.state.doc.textContent;
              
              // Simple word boundary regex
              const wordRegex = /\b([a-zA-Z]+)\b/g;
              let match;
              
              while ((match = wordRegex.exec(text)) !== null) {
                const word = match[0];
                const pos = match.index;
                
                if (isMisspelled(word)) {
                  // Find the actual position in the ProseMirror document
                  let currentPos = 0;
                  view.state.doc.descendants((node, nodePos) => {
                    if (node.isText) {
                      const textContent = node.text;
                      let textPos = 0;
                      
                      while ((textPos = textContent.indexOf(word, textPos)) !== -1) {
                        if (currentPos + textPos === pos) {
                          // Found the word, add decoration
                          decorations.push(
                            Decoration.inline(
                              nodePos + textPos,
                              nodePos + textPos + word.length,
                              {
                                class: 'spell-error',
                                style: 'text-decoration: underline wavy #ff0000; text-underline-offset: 2px;',
                              }
                            )
                          );
                        }
                        textPos += 1;
                      }
                      currentPos += textContent.length;
                    }
                    return true;
                  });
                }
              }
              
              // Apply decorations
              const newDecorations = DecorationSet.create(view.state.doc, decorations);
              view.dispatch(view.state.tr.setMeta('spellCheck', newDecorations));
              
            }, DEBOUNCE_DELAY);
          }
        },
        destroy() {
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
        },
      };
    },
  });
};
