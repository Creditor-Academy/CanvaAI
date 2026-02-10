import React from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

// React component for page break
const PageBreakComponent = ({ node, updateAttributes }) => {
  return (
    <div 
      className="relative my-10"
      contentEditable={false}
    >
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-dashed border-gray-300"></div>
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 py-1 text-xs text-gray-400 rounded-lg border border-gray-200">
          Page Break
        </span>
      </div>
    </div>
  );
};

// Custom Page Break Extension
export const PageBreak = Node.create({
  name: 'pageBreak',
  
  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  content: 'inline*',

  marks: '',

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-type': 'page-break',
      style: 'page-break-after: always; border-top: 1px dashed #e5e7eb; margin: 40px 0; text-align: center; height: 1px;',
    }), [
      'span',
      { style: 'background: white; padding: 0 12px; color: #9ca3af; font-size: 12px; position: relative; top: -12px;' },
      'Page Break'
    ]];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PageBreakComponent);
  },
});

export default PageBreak;
