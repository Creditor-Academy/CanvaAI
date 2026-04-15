/**
 * transformMarkdownToEditor.js
 * 
 * Utility to convert raw Markdown strings into TipTap-compatible JSON structure.
 * This ensures pagination engine can properly calculate heights and outline scanner
 * can find heading nodes.
 */

import { marked } from 'marked';

/**
 * Transform Markdown string to HTML and set in editor
 * @param {Object} editor - TipTap editor instance
 * @param {string} markdownString - Raw markdown content
 */
export const transformMarkdownToEditor = (editor, markdownString) => {
  if (!editor || !markdownString || editor.isDestroyed) {
    return;
  }

  try {
    // 1. Convert Markdown string to HTML using marked
    const htmlContent = marked.parse(markdownString);
    
    // 2. Set content as HTML
    editor.commands.setContent(htmlContent);
    
    // 3. Immediately trigger pagination engine
    setTimeout(() => {
      import('../utils/paginationEngine.js').then(({ forceRepaginate }) => {
        if (!editor.isDestroyed) {
          forceRepaginate(editor);
        }
      });
    }, 100);
    
  } catch (error) {
    console.error('❌ Error transforming Markdown:', error);
    // Fallback: treat as plain text
    editor.commands.setContent(`<p>${markdownString}</p>`);
  }
};

/**
 * Check if content looks like Markdown
 * @param {any} content - Content to check
 * @returns {boolean} True if content appears to be Markdown
 */
export const isMarkdown = (content) => {
  if (typeof content !== 'string') return false;
  
  // Check for common Markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s/m,           // Headers
    /^\*\*|__/,             // Bold
    /^\*|_/,                // Italic
    /^-\s|^\*\s|^\+\s/,     // Unordered lists
    /^\d+\.\s/,             // Ordered lists
    /^>\s/,                 // Blockquotes
    /^```/,                 // Code blocks
    /^\[.*\]\(.*\)/,        // Links
    /^!\[.*\]\(.*\)/,       // Images
    /^---+$/,               // Horizontal rules
  ];
  
  return markdownPatterns.some(pattern => pattern.test(content));
};
