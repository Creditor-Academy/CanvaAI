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
        console.log('Indent command called');
        console.log('State:', state);
        console.log('Dispatch:', !!dispatch);
        console.log('Editor:', editor);
        
        const { selection } = state;
        const { from, to } = selection;
        console.log('Selection from:', from, 'to:', to);

        // Create a new transaction
        let tr = state.tr;
        let indentApplied = false;
        
        state.doc.nodesBetween(from, to, (node, pos) => {
          console.log('Processing node:', node.type.name, 'attrs:', node.attrs);
          if (editor.isActive('listItem') || node.type.name === 'paragraph' || node.type.name === 'heading') {
            const currentIndent = node.attrs.indent || 0;
            console.log('Current indent:', currentIndent);
            if (currentIndent < this.options.levels) {
              const newIndent = currentIndent + 1;
              console.log('Setting new indent:', newIndent);
              
              // Update attributes directly on the transaction
              tr = tr.setNodeAttribute(pos, 'indent', newIndent);
              indentApplied = true;
              return false;
            }
          }
          return true;
        });

        if (indentApplied && dispatch) {
          // Dispatch the transaction
          dispatch(tr);
          console.log('Dispatched transaction');
          return true;
        }

        console.log('Indent command returning false');
        return false;
      },

      outdent: () => ({ state, dispatch, editor }) => {
        console.log('Outdent command called');
        console.log('State:', state);
        console.log('Dispatch:', !!dispatch);
        console.log('Editor:', editor);
        
        const { selection } = state;
        const { from, to } = selection;
        console.log('Selection from:', from, 'to:', to);

        // Create a new transaction
        let tr = state.tr;
        let outdentApplied = false;
        
        state.doc.nodesBetween(from, to, (node, pos) => {
          console.log('Processing node:', node.type.name, 'attrs:', node.attrs);
          if (editor.isActive('listItem') || node.type.name === 'paragraph' || node.type.name === 'heading') {
            const currentIndent = node.attrs.indent || 0;
            console.log('Current indent:', currentIndent);
            if (currentIndent > 0) {
              const newIndent = Math.max(0, currentIndent - 1);
              console.log('Setting new indent:', newIndent);
              
              // Update attributes directly on the transaction
              tr = tr.setNodeAttribute(pos, 'indent', newIndent);
              outdentApplied = true;
              return false;
            }
          }
          return true;
        });

        if (outdentApplied && dispatch) {
          // Dispatch the transaction
          dispatch(tr);
          console.log('Dispatched transaction');
          return true;
        }

        console.log('Outdent command returning false');
        return false;
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