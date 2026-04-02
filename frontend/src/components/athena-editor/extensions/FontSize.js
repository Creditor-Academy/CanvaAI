/**
 * FontSize Extension for TipTap
 * 
 * Adds font size control to text styling
 * Works in conjunction with TextStyle extension
 */

import { Extension } from '@tiptap/core';
import { TextStyle } from '@tiptap/extension-text-style';

const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      /**
       * Set font size
       * @param {string} fontSize - Font size value (e.g., '12px', '14px')
       */
      setFontSize: (fontSize) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { 
            fontSize: fontSize.includes('px') ? fontSize : `${fontSize}px` 
          })
          .run();
      },

      /**
       * Remove font size
       */
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .run();
      },
    };
  },
});

export default FontSize;
