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
    console.warn('⚠️ Cannot transform markdown - editor not ready');
    return;
  }

  try {
    console.log('🔄 Transforming Markdown to TipTap JSON...');
    console.log('📝 Markdown length:', markdownString.length);
    
    // 1. Convert Markdown string to HTML using marked
    const htmlContent = marked.parse(markdownString);
    console.log('✅ Markdown converted to HTML, length:', htmlContent.length);
    
    // 2. Set content as HTML
    // TipTap will automatically parse <h1>, <h2>, etc. into heading nodes
    editor.commands.setContent(htmlContent);
    console.log('✅ Content set in editor');
    
    // 3. Immediately trigger pagination engine
    // Using forceRepaginate to bypass "giant paragraph" guards
    setTimeout(() => {
      import('../utils/paginationEngine.js').then(({ forceRepaginate }) => {
        forceRepaginate(editor);
        console.log('✅ Pagination triggered after Markdown transformation');
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
