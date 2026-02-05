import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import CustomTable from './CustomTable';

const TableExtension = Node.create({
  name: 'customTable',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  atom: true,

  addAttributes() {
    return {
      rows: {
        default: 3,
        parseHTML: element => {
          const rows = element.getAttribute('data-rows');
          return rows ? parseInt(rows, 10) : 3;
        },
        renderHTML: attributes => ({
          'data-rows': attributes.rows,
        }),
      },
      cols: {
        default: 3,
        parseHTML: element => {
          const cols = element.getAttribute('data-cols');
          return cols ? parseInt(cols, 10) : 3;
        },
        renderHTML: attributes => ({
          'data-cols': attributes.cols,
        }),
      },
      cells: {
        default: [],
        parseHTML: element => {
          try {
            const cellsData = element.getAttribute('data-cells');
            return cellsData ? JSON.parse(cellsData) : [];
          } catch {
            return [];
          }
        },
        renderHTML: attributes => ({
          'data-cells': JSON.stringify(attributes.cells),
        }),
      },
      borderColor: {
        default: '#d1d5db',
        parseHTML: element => element.getAttribute('data-border-color') || '#d1d5db',
        renderHTML: attributes => ({
          'data-border-color': attributes.borderColor,
        }),
      },
      backgroundColor: {
        default: '#ffffff',
        parseHTML: element => element.getAttribute('data-background-color') || '#ffffff',
        renderHTML: attributes => ({
          'data-background-color': attributes.backgroundColor,
        }),
      },
      fontSize: {
        default: 14,
        parseHTML: element => {
          const fontSize = element.getAttribute('data-font-size');
          return fontSize ? parseInt(fontSize, 10) : 14;
        },
        renderHTML: attributes => ({
          'data-font-size': attributes.fontSize,
        }),
      },
      color: {
        default: '#000000',
        parseHTML: element => element.getAttribute('data-color') || '#000000',
        renderHTML: attributes => ({
          'data-color': attributes.color,
        }),
      },
      fontWeight: {
        default: 'normal',
        parseHTML: element => element.getAttribute('data-font-weight') || 'normal',
        renderHTML: attributes => ({
          'data-font-weight': attributes.fontWeight,
        }),
      },
      fontStyle: {
        default: 'normal',
        parseHTML: element => element.getAttribute('data-font-style') || 'normal',
        renderHTML: attributes => ({
          'data-font-style': attributes.fontStyle,
        }),
      },
      textDecoration: {
        default: 'none',
        parseHTML: element => element.getAttribute('data-text-decoration') || 'none',
        renderHTML: attributes => ({
          'data-text-decoration': attributes.textDecoration,
        }),
      },
      textAlign: {
        default: 'left',
        parseHTML: element => element.getAttribute('data-text-align') || 'left',
        renderHTML: attributes => ({
          'data-text-align': attributes.textAlign,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-custom-table]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-custom-table': '',
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomTable);
  },

  addCommands() {
    return {
      insertCustomTable: attributes => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        });
      },
    };
  },
});

export default TableExtension;