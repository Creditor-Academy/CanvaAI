import { Extension } from '@tiptap/core';

/**
 * LineHeight extension for Tiptap editor
 */
const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      HTMLAttributes: {},
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) {
                return {};
              }

              return {
                style: `line-height: ${attributes.lineHeight};`,
              };
            },
            parseHTML: (element) => {
              return element.style.lineHeight || null;
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight: (lineHeight) => ({ commands }) => {
        if (typeof lineHeight !== 'string' && typeof lineHeight !== 'number') {
          return false;
        }

        return this.options.types.every(type =>
          commands.updateAttributes(type, { lineHeight: String(lineHeight) })
        );
      },

      unsetLineHeight: () => ({ commands }) => {
        return this.options.types.every(type =>
          commands.removeAttributes(type, 'lineHeight')
        );
      },
    };
  },
});

export default LineHeight;