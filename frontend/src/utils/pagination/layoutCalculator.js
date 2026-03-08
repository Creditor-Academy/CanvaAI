import { USABLE_WIDTH_PX, USABLE_HEIGHT_PX, MIN_WIDOW_ORPHAN_HEIGHT, DEFAULT_FONT_SIZE, DEFAULT_LINE_HEIGHT } from './constants';

// Block type definitions
export const BLOCK_TYPES = {
  PARAGRAPH: 'paragraph',
  HEADING: 'heading',
  IMAGE: 'image',
  TABLE: 'table',
  LIST: 'list',
  CODE_BLOCK: 'codeBlock',
  QUOTE: 'blockquote',
  DIVIDER: 'divider'
};

// Calculate height for different block types
export const calculateBlockHeight = (node, styles = {}) => {
  // Implement height calculation logic without DOM measurement
  // Use font metrics and content length to estimate height
  const { type, content, attrs } = node;
  
  switch (type.name) {
    case BLOCK_TYPES.PARAGRAPH:
      return calculateParagraphHeight(node, styles);
    case BLOCK_TYPES.HEADING:
      return calculateHeadingHeight(node, styles);
    case BLOCK_TYPES.IMAGE:
      return calculateImageHeight(node, styles);
    case BLOCK_TYPES.TABLE:
      return calculateTableHeight(node, styles);
    case BLOCK_TYPES.LIST:
      return calculateListHeight(node, styles);
    case BLOCK_TYPES.CODE_BLOCK:
      return calculateCodeBlockHeight(node, styles);
    case BLOCK_TYPES.QUOTE:
      return calculateQuoteHeight(node, styles);
    case BLOCK_TYPES.DIVIDER:
      return calculateDividerHeight(node, styles);
    default:
      return calculateGenericBlockHeight(node, styles);
  }
};

// Enhanced height calculation with more realistic estimates
export const calculateRealisticBlockHeight = (node) => {
  // For paragraphs, calculate more accurately based on content
  if (node.type.name === BLOCK_TYPES.PARAGRAPH) {
    const textLength = node.textContent.length;
    const approxLineHeight = 24; // Typical line height for readable text
    const approxCharsPerLine = 80; // Approximate characters per line at typical width
    const estimatedLines = Math.ceil(textLength / approxCharsPerLine);
    
    // Add some padding and account for potential line breaks
    let height = estimatedLines * approxLineHeight;
    
    // Count hard breaks which add extra line spacing
    if (node.content) {
      node.content.forEach(child => {
        if (child.type?.name === 'hardBreak') {
          height += approxLineHeight; // Add line height for each hard break
        }
      });
    }
    
    return Math.max(Math.ceil(height), 24); // Minimum height for empty paragraphs
  }
  
  // Use the original calculation for other types
  const h = calculateBlockHeight(node);
  return Math.max(Math.ceil(isFinite(h) ? h : 0), 0);
};

// Implement individual height calculation functions
const calculateParagraphHeight = (node, styles) => {
  // Calculate based on text content length, line height, and font size
  const textLength = node.textContent.length;
  const fontSize = styles.fontSize || DEFAULT_FONT_SIZE;
  const lineHeight = styles.lineHeight || DEFAULT_LINE_HEIGHT;
  const charsPerLine = USABLE_WIDTH_PX / (fontSize * 0.6); // Approximate char width
  const lines = Math.ceil(textLength / charsPerLine);
  
  // Count explicit line breaks (hardBreak nodes) which add additional height
  let additionalLines = 0;
  if (node.content) {
    node.content.forEach(child => {
      if (child.type?.name === 'hardBreak') { // This covers <br> elements in ProseMirror
        additionalLines += 1;
      }
      // Also account for any text containing actual line breaks
      if (child.text) {
        additionalLines += (child.text.match(/\n/g) || []).length;
      }
    });
  }
  
  // Round the result to prevent floating point drift
  const height = Math.ceil(Math.max((lines + additionalLines) * fontSize * lineHeight, 24)); // Minimum height for empty paragraphs
  
  return height;
};

const calculateHeadingHeight = (node, styles) => {
  const level = node.attrs?.level || 1;
  const baseSizes = [32, 28, 24, 20, 18, 16]; // Font sizes for H1-H6
  const fontSize = baseSizes[level - 1] || 16;
  const lineHeight = styles.lineHeight || 1.2;
  const textLength = node.textContent.length;
  const charsPerLine = USABLE_WIDTH_PX / (fontSize * 0.6);
  const lines = Math.ceil(textLength / charsPerLine);
  
  // Round to prevent floating point drift
  const height = Math.ceil(Math.max(lines * fontSize * lineHeight, fontSize * 1.5));
  
  return height;
};

const calculateImageHeight = (node, styles) => {
  // Return the height specified in attributes or a default height
  const heightAttr = node.attrs?.height;
  const widthAttr = node.attrs?.width;
  
  if (heightAttr) {
    return parseInt(heightAttr, 10);
  }
  
  // If only width is specified, calculate proportional height
  if (widthAttr) {
    const aspectRatio = node.attrs?.aspectRatio || 1;
    return parseInt(widthAttr, 10) / aspectRatio;
  }
  
  // Default image height
  return Math.ceil(200);
};

const calculateTableHeight = (node, styles) => {
  // Estimate table height based on number of rows and columns
  const rows = node.content?.content?.length || 1;
  const cols = node.content?.content?.[0]?.content?.length || 1;
  const rowHeight = 30; // Estimated height per row
  
  // Add minimal header/footer padding and horizontal rules if present
  return Math.max(Math.ceil(rows * rowHeight + 20), 30);
};

const calculateListHeight = (node, styles) => {
  // Sum height of each list item based on text wrapping
  const items = node.content?.content || [];
  const fontSize = styles.fontSize || DEFAULT_FONT_SIZE;
  const lineHeight = styles.lineHeight || DEFAULT_LINE_HEIGHT;
  const charsPerLine = USABLE_WIDTH_PX / (fontSize * 0.6);

  let totalHeight = 0;
  if (Array.isArray(items) && items.length > 0) {
    items.forEach(item => {
      const textLength = item?.textContent?.length || 0;
      const lines = Math.ceil(textLength / Math.max(10, charsPerLine));
      totalHeight += lines * fontSize * lineHeight;
    });
  } else {
    // Fallback: at least one line
    totalHeight = fontSize * lineHeight;
  }

  return Math.ceil(totalHeight + 10);
};

const calculateCodeBlockHeight = (node, styles) => {
  // Estimate code block height based on number of lines
  const text = node.textContent || '';
  const lines = text.split('\n').length;
  const fontSize = 14; // Code font size
  const lineHeight = 1.4;
  
  return Math.ceil(lines * fontSize * lineHeight + 20); // Add padding
};

const calculateQuoteHeight = (node, styles) => {
  const textLength = node.textContent.length;
  const fontSize = styles.fontSize || DEFAULT_FONT_SIZE;
  const lineHeight = styles.lineHeight || 1.6;
  const charsPerLine = USABLE_WIDTH_PX / (fontSize * 0.7); // Slightly wider spacing for quotes
  const lines = Math.ceil(textLength / charsPerLine);
  
  return Math.ceil(lines * fontSize * lineHeight + 20); // Add quote-specific padding
};

const calculateDividerHeight = (node, styles) => {
  return 20; // Standard divider height
};

const calculateGenericBlockHeight = (node, styles) => {
  // Generic calculation for unknown block types
  const textLength = node.textContent.length;
  const fontSize = styles.fontSize || DEFAULT_FONT_SIZE;
  const lineHeight = styles.lineHeight || DEFAULT_LINE_HEIGHT;
  const charsPerLine = USABLE_WIDTH_PX / (fontSize * 0.6);
  const lines = Math.ceil(textLength / charsPerLine);
  
  return Math.ceil(Math.max(lines * fontSize * lineHeight, 20));
};

// Function to estimate paragraph split point
export const estimateParagraphSplit = (node, availableSpace, styles = {}) => {
  const textContent = node.textContent;
  if (!textContent || textContent.length === 0) {
    return { part1: null, part2: node };
  }
  
  const fontSize = styles.fontSize || DEFAULT_FONT_SIZE;
  const lineHeight = styles.lineHeight || DEFAULT_LINE_HEIGHT;
  const estimatedCharsPerLine = USABLE_WIDTH_PX / (fontSize * 0.6);
  const estimatedLinesPerPage = availableSpace / (fontSize * lineHeight);
  const estimatedCharsPerPage = estimatedCharsPerLine * estimatedLinesPerPage;
  
  // Find a suitable split point at word boundary
  let splitPoint = Math.min(Math.floor(estimatedCharsPerPage), textContent.length);
  
  // Look for a word boundary near the estimated split point
  while (splitPoint > 0 && splitPoint < textContent.length && textContent[splitPoint] !== ' ') {
    splitPoint--;
  }
  
  // If no space found going backwards, try going forward
  if (splitPoint === 0) {
    splitPoint = Math.min(Math.floor(estimatedCharsPerPage), textContent.length);
    while (splitPoint < textContent.length - 1 && textContent[splitPoint] !== ' ') {
      splitPoint++;
    }
  }
  
  if (splitPoint <= 0 || splitPoint >= textContent.length) {
    // If we can't find a good split point, return as is
    return null;
  }
  
  // Create two new text nodes from the split
  const part1Text = textContent.substring(0, splitPoint).trim();
  const part2Text = textContent.substring(splitPoint).trim();
  
  if (!part1Text || !part2Text) {
    // If one part is empty, don't split
    return null;
  }
  
  // Calculate heights for both parts
  const part1Node = {
    ...node,
    content: [{ type: 'text', text: part1Text }],
    text: part1Text
  };
  
  const part2Node = {
    ...node,
    content: [{ type: 'text', text: part2Text }],
    text: part2Text
  };
  
  const part1Height = calculateParagraphHeight(part1Node, styles);
  const part2Height = calculateParagraphHeight(part2Node, styles);
  
  // Check if both parts meet the minimum height requirement
  if (part1Height < MIN_WIDOW_ORPHAN_HEIGHT || part2Height < MIN_WIDOW_ORPHAN_HEIGHT) {
    return null;
  }
  
  return {
    part1: part1Node,
    part2: part2Node,
    part1Height,
    part2Height
  };
};
