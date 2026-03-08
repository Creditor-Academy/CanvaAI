import { Extension } from '@tiptap/core';
import { TextSelection, AllSelection } from '@tiptap/pm/state';

/**
 * Indent extension for Tiptap editor
 */
const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      levels: 10,
      unit: 'ch',
      HTMLAttributes: {},
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'listItem'],
        attributes: {
          indent: {
            default: 0,
            renderHTML: (attributes) => {
              if (!attributes.indent) {
                return {};
              }

              return {
                style: `margin-left: ${attributes.indent * 2}${this.options.unit};`,
              };
            },
            parseHTML: (element) => {
              const indent = parseInt(element.style.marginLeft, 10);
              if (!indent) {
                return 0;
              }

              return Math.round(indent / 2);
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent: () => ({ state, dispatch, editor }) => {
        let tr = state.tr;
        let changed = false;
        
        const { selection } = state;
        const { from, to } = selection;

        state.doc.nodesBetween(from, to, (node, pos) => {
          // Skip non-editable nodes like pages
          if (node.type.name === 'page') return true;
          
          // Only process textblock nodes that can be indented
          if (node.isTextblock && (node.type.name === 'paragraph' || node.type.name === 'heading' || node.type.name === 'listItem')) {
            const currentIndent = node.attrs.indent || 0;
            const newIndent = Math.min(currentIndent + 1, this.options.levels);
            
            if (newIndent !== currentIndent) {
              tr = tr.setNodeAttribute(pos, 'indent', newIndent);
              changed = true;
            }
          }
          return true; // Continue traversing
        });

        if (!changed) return false;

        if (dispatch) dispatch(tr);
        return true;
      },

      outdent: () => ({ state, dispatch, editor }) => {
        let tr = state.tr;
        let changed = false;
        
        const { selection } = state;
        const { from, to } = selection;

        state.doc.nodesBetween(from, to, (node, pos) => {
          // Skip non-editable nodes like pages
          if (node.type.name === 'page') return true;
          
          // Only process textblock nodes that can be indented
          if (node.isTextblock && (node.type.name === 'paragraph' || node.type.name === 'heading' || node.type.name === 'listItem')) {
            const currentIndent = node.attrs.indent || 0;
            const newIndent = Math.max(currentIndent - 1, 0);
            
            if (newIndent !== currentIndent) {
              tr = tr.setNodeAttribute(pos, 'indent', newIndent);
              changed = true;
            }
          }
          return true; // Continue traversing
        });

        if (!changed) return false;

        if (dispatch) dispatch(tr);
        return true;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.isActive('listItem')) {
          return false;
        }
        return this.editor.commands.indent();
      },
      'Shift-Tab': () => {
        if (this.editor.isActive('listItem')) {
          return false;
        }
        return this.editor.commands.outdent();
      },
    };
  },
});

export default Indent;