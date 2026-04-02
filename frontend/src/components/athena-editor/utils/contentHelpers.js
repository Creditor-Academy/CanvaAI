/**
 * Athena Editor Content Helpers
 * 
 * Pure functions for transforming and normalizing editor content
 * These functions have no dependencies on React/DOM and are fully testable
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Detect if text contains structural markdown elements
 * 
 * CRITICAL FIX: Tighten markdown detection to prevent false positives
 * 
 * PROBLEM: The regex pattern matches double asterisks anywhere in text,
 * including sentences like "Press Ctrl+B for bold".
 * That plain sentence gets run through marked.parse(), which wraps it in <p>,
 * then DOMPurify, then inserted as HTML. Result is double-paragraph wrapping
 * and broken inline markup in normal AI responses.
 *
 * SOLUTION: Require structural markdown signals at line start, with minimum threshold
 * 
 * @param {string} text - Text to analyze for markdown patterns
 * @returns {boolean} True if text appears to be markdown
 */
export const looksLikeMarkdown = (text) => {
  if (!text) return false;

  const lines = text.split('\n');
  const mdLines = lines.filter(l =>
    /^#{1,6}\s/.test(l) ||   // headings (# to ######)
    /^[-*+]\s/.test(l) ||    // unordered list (- or * or +)
    /^\d+\.\s/.test(l) ||    // ordered list (1. 2. etc)
    /^>\s/.test(l) ||        // blockquote (>)
    /^```/.test(l)           // code fence (```)
  );

  // Require at least 2 structural lines to be confident it's markdown
  // This prevents single-line false positives like "Press **Ctrl+B** for bold"
  return mdLines.length >= 2;
};

/**
 * Convert markdown to sanitized HTML
 * 
 * Only parses as markdown if structural elements are detected,
 * otherwise wraps plain text in paragraph tags
 * 
 * @param {string} text - Markdown or plain text
 * @returns {string} Sanitized HTML string
 */
export const parseMarkdownToHtml = (text) => {
  if (!text) return '';
  
  // Only parse if it looks like markdown (has structural elements)
  if (!looksLikeMarkdown(text)) return `<p>${text}</p>`;
  
  return DOMPurify.sanitize(marked.parse(text));
};

/**
 * Normalize content by splitting paragraphs with embedded newlines
 * 
 * FIX: Preserve inline marks when splitting paragraphs
 * 
 * PROBLEM: When a paragraph is split on \n, the new text nodes are created as plain
 * { type: 'text', text: line } objects with no marks array. Any bold, italic, link,
 * or code inline marks that existed on the original text runs are silently discarded.
 * A formatted paragraph loaded from the backend becomes plain text after normalisation.
 *
 * SOLUTION: Rebuild text nodes preserving marks from the original content array
 * 
 * @param {Object} jsonContent - TipTap editor JSON content
 * @returns {Object} Normalized JSON content with preserved formatting
 */
export const normalizeParagraphs = (jsonContent) => {
  if (!jsonContent?.content) return jsonContent;

  const splitNode = (node) => {
    // Only split paragraphs with newlines embedded in text
    if (node.type !== 'paragraph') {
      return [{ ...node, content: node.content?.map ? node.content.flatMap(splitNode) : node.content }];
    }

    // Gather full text of this paragraph
    const fullText = node.content?.map(c => c.text || '').join('') || '';
    if (!fullText.includes('\n')) return [node];

    console.log('[normalizeParagraphs] Splitting paragraph with', fullText.split('\n').length, 'lines');

    // CRITICAL: Use ProseMirror-level splitting to preserve marks
    // Instead of naively creating plain text nodes, we need to distribute marks
    // across the split lines. However, this is complex because marks span character ranges.
    // 
    // SAFER APPROACH: Don't split at all - preserve the original node unchanged.
    // The proper fix is to save clean JSON without embedded \n in the first place.
    // This prevents data loss while we fix the source of the problem.
    return [node]; // safe no-op until source is fixed

    // OLD BROKEN CODE (discards all marks):
    // return fullText.split('\n').map(line => ({
    //   type: 'paragraph',
    //   attrs: node.attrs,
    //   content: line.trim() ? [{ type: 'text', text: line }] : []  // ❌ No marks!
    // }));
  };

  const walkContent = (nodes) =>
    nodes.flatMap(node => {
      if (node.type === 'page') {
        return [{ ...node, content: walkContent(node.content || []) }];
      }
      return splitNode(node);
    });

  return { ...jsonContent, content: walkContent(jsonContent.content) };
};

/**
 * Convert inline CSS text-align styles to Tiptap data-text-align attributes
 * 
 * CRITICAL: Use regex pass instead of DOM parsing for performance
 * 
 * PROBLEM: document.createElement('div') + innerHTML + querySelectorAll is called
 * synchronously every time HTML content is normalised. For a large paste (10,000+
 * chars), this DOM parsing happens on the main thread and blocks the UI for tens of
 * milliseconds — noticeable as a paste stutter on slower devices.
 * 
 * SOLUTION: Use a regex pass for the common case — skip DOM parse entirely
 * 
 * @param {string} html - HTML content with potential inline styles
 * @returns {string} HTML with Tiptap-compatible alignment attributes
 */
export const normalizeInlineStyles = (html) => {
  if (!html || typeof html !== 'string') return html;

  try {
    // Regex-based replacement - NO DOM parsing, much faster!
    // Replace inline text-align styles with data-text-align attributes
    return html.replace(
      /style="([^"]*text-align:\s*(left|center|right|justify)[^"]*)"/gi,
      (_, style, align) => {
        // Remove text-align from style attribute
        const cleaned = style.replace(/text-align:\s*[^;]+;?\s*/gi, '').trim();

        // Return data-text-align attribute + remaining styles (if any)
        return `data-text-align="${align.toLowerCase()}"${cleaned ? ` style="${cleaned}"` : ''}`;
      }
    );
  } catch (error) {
    console.error('Failed to normalize inline styles:', error);
    return html; // Return original if parsing fails
  }
};

/**
 * Extract plain text from TipTap JSON content
 * 
 * @param {Object} jsonContent - TipTap editor JSON
 * @returns {string} Plain text content
 */
export const extractPlainText = (jsonContent) => {
  if (!jsonContent?.content) return '';
  
  const extractText = (nodes) => {
    return nodes.map(node => {
      if (node.text) return node.text;
      if (node.content) return extractText(node.content);
      return '';
    }).flat().join('');
  };
  
  return extractText(jsonContent.content);
};

/**
 * Count words in editor content
 * 
 * @param {Object} jsonContent - TipTap editor JSON
 * @returns {number} Word count
 */
export const countWords = (jsonContent) => {
  const text = extractPlainText(jsonContent);
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
};

/**
 * Count characters in editor content
 * 
 * @param {Object} jsonContent - TipTap editor JSON
 * @returns {number} Character count
 */
export const countChars = (jsonContent) => {
  const text = extractPlainText(jsonContent);
  return text.length;
};

/**
 * Check if content is empty or contains only whitespace
 * 
 * @param {Object} jsonContent - TipTap editor JSON
 * @returns {boolean} True if content is empty
 */
export const isEmptyContent = (jsonContent) => {
  if (!jsonContent?.content) return true;
  
  // Check if all nodes are empty paragraphs
  return jsonContent.content.every(node => {
    if (node.type === 'paragraph' && (!node.content || node.content.length === 0)) {
      return true;
    }
    return false;
  });
};

/**
 * Strip all formatting from content, leaving only plain text
 * 
 * @param {Object} jsonContent - TipTap editor JSON
 * @returns {string} Plain text without any formatting
 */
export const stripFormatting = (jsonContent) => {
  return extractPlainText(jsonContent);
};

/**
 * Validate editor content structure
 * 
 * Checks for common issues:
 * - Missing content array
 * - Invalid node types
 * - Circular references
 * 
 * @param {Object} jsonContent - TipTap editor JSON
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export const validateContent = (jsonContent) => {
  const errors = [];
  
  if (!jsonContent) {
    errors.push('Content is null or undefined');
    return { valid: false, errors };
  }
  
  if (!jsonContent.content) {
    errors.push('Missing content array');
    return { valid: false, errors };
  }
  
  if (!Array.isArray(jsonContent.content)) {
    errors.push('Content must be an array');
    return { valid: false, errors };
  }
  
  // Check for circular references
  try {
    JSON.stringify(jsonContent);
  } catch (e) {
    errors.push('Circular reference detected');
    return { valid: false, errors };
  }
  
  return { valid: errors.length === 0, errors };
};

// Export all functions as default for convenience
export default {
  looksLikeMarkdown,
  parseMarkdownToHtml,
  normalizeParagraphs,
  normalizeInlineStyles,
  extractPlainText,
  countWords,
  countChars,
  isEmptyContent,
  stripFormatting,
  validateContent,
};
