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
      indent: () => ({ state, dispatch }) => {
        const { selection } = state;
        const { from, to } = selection;

        if (dispatch) {
          state.tr.setSelection(new TextSelection(state.doc.resolve(from), state.doc.resolve(to)));
          
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.editor.isActive('listItem') || node.type.name === 'paragraph' || node.type.name === 'heading') {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent < this.options.levels) {
                const newIndent = currentIndent + 1;
                
                this.editor.commands.updateAttributes(node.type.name, { indent: newIndent });
                return false;
              }
            }
            return true;
          });

          dispatch(state.tr);
        }

        return true;
      },

      outdent: () => ({ state, dispatch }) => {
        const { selection } = state;
        const { from, to } = selection;

        if (dispatch) {
          state.tr.setSelection(new TextSelection(state.doc.resolve(from), state.doc.resolve(to)));
          
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.editor.isActive('listItem') || node.type.name === 'paragraph' || node.type.name === 'heading') {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent > 0) {
                const newIndent = Math.max(0, currentIndent - 1);
                
                this.editor.commands.updateAttributes(node.type.name, { indent: newIndent });
                return false;
              }
            }
            return true;
          });

          dispatch(state.tr);
        }

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
      'Shift-Tab': () => this.editor.commands.outdent(),
    };
  },
});

export default Indent;