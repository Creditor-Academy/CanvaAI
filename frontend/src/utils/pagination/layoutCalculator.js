/**
 * layoutCalculator.js — ATHENA PAGINATION ENGINE v3.0
 *
 * Accurate, DOM-free height estimation for every ProseMirror block type.
 *
 * Key improvements over v2:
 *  • Per-font-family character-width ratios instead of a single magic 0.52
 *  • Bold / italic inline width multipliers
 *  • Proper margin-bottom accounting for every block type
 *  • Heading line-height uses tighter 1.2 ratio (matches browser defaults)
 *  • List indentation correctly reduces charsPerLine
 *  • Table: per-cell text wrapping instead of flat row × rowHeight
 *  • estimateParagraphSplit: line-by-line simulation instead of ratio heuristic
 *  • Rich-text (marks) awareness in paragraph splitting
 */

import {
  USABLE_WIDTH_PX,
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT,
  FONT_WIDTH_RATIO,
  BOLD_WIDTH_MULTIPLIER,
  ITALIC_WIDTH_MULTIPLIER,
  HEADING_FONT_SIZES,
  BLOCK_MARGIN_BOTTOM,
} from './constants';

// ─────────────────────────────────────────────────────────────────────────────
// Block type constants (mirrors ProseMirror node type names)
// ─────────────────────────────────────────────────────────────────────────────
export const BLOCK_TYPES = {
  PARAGRAPH:    'paragraph',
  HEADING:      'heading',
  IMAGE:        'image',
  TABLE:        'table',
  BULLET_LIST:  'bulletList',
  ORDERED_LIST: 'orderedList',
  LIST_ITEM:    'listItem',
  CODE_BLOCK:   'codeBlock',
  QUOTE:        'blockquote',
  DIVIDER:      'horizontalRule',
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the string name from a ProseMirror node type (object or string).
 */
const typeName = (node) =>
  (typeof node.type === 'string' ? node.type : node.type?.name) || 'unknown';

/**
 * Calculate the effective average character width in px for a run of text,
 * taking font family, size, bold, and italic into account.
 *
 * @param {number} fontSize  - font size in px
 * @param {string} fontFamily - 'serif' | 'sansSerif' | 'monospace' | 'default'
 * @param {boolean} bold
 * @param {boolean} italic
 * @returns {number} average character width in px
 */
const avgCharWidth = (
  fontSize  = DEFAULT_FONT_SIZE,
  fontFamily = 'default',
  bold       = false,
  italic     = false,
) => {
  const baseRatio = FONT_WIDTH_RATIO[fontFamily] ?? FONT_WIDTH_RATIO.default;
  let ratio = baseRatio;
  if (bold)   ratio *= BOLD_WIDTH_MULTIPLIER;
  if (italic) ratio *= ITALIC_WIDTH_MULTIPLIER;
  return fontSize * ratio;
};

/**
 * Given a usable width and font metrics, return how many characters fit per line.
 * Minimum of 1 to avoid division-by-zero.
 */
const charsPerLine = (usableWidth, fontSize, fontFamily, bold, italic) =>
  Math.max(1, Math.floor(usableWidth / avgCharWidth(fontSize, fontFamily, bold, italic)));

/**
 * Estimate line count for a plain-text string at a given width.
 */
const estimateLines = (text, usableWidth, fontSize, fontFamily = 'default', bold = false, italic = false) => {
  if (!text) return 0;
  const cpl = charsPerLine(usableWidth, fontSize, fontFamily, bold, italic);
  // Count hard newlines in text as well
  const hardBreaks = (text.match(/\n/g) || []).length;
  const softLines  = Math.ceil(text.length / cpl);
  return Math.max(1, softLines + hardBreaks);
};

/**
 * Walk a ProseMirror node's inline content and return the total estimated
 * pixel width of all text, respecting bold/italic marks.
 *
 * Returns { totalPxWidth, hardBreaks }
 */
const measureInlineContent = (node, fontSize, fontFamily) => {
  let totalPxWidth = 0;
  let hardBreaks   = 0;

  const walk = (child) => {
    const name = typeName(child);
    if (name === 'hardBreak' || name === 'hard_break') {
      hardBreaks += 1;
      return;
    }
    if (child.text) {
      const hasBold   = child.marks?.some((m) => m.type?.name === 'bold'   || m.type === 'bold');
      const hasItalic = child.marks?.some((m) => m.type?.name === 'italic' || m.type === 'italic');
      totalPxWidth += child.text.length * avgCharWidth(fontSize, fontFamily, hasBold, hasItalic);
    }
    if (child.content?.forEach) child.content.forEach(walk);
  };

  if (node.content?.forEach) node.content.forEach(walk);
  return { totalPxWidth, hardBreaks };
};

/**
 * Return the margin-bottom for a node (in px), so pagination can account for
 * the spacing that appears beneath each block in the rendered document.
 */
export const blockMarginBottom = (node) => {
  const name = typeName(node);
  if (name === 'heading') {
    const level = node.attrs?.level ?? 1;
    return BLOCK_MARGIN_BOTTOM[`heading${level}`] ?? BLOCK_MARGIN_BOTTOM.default;
  }
  return BLOCK_MARGIN_BOTTOM[name] ?? BLOCK_MARGIN_BOTTOM.default;
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-type height calculators (content height only, excl. margin-bottom)
// ─────────────────────────────────────────────────────────────────────────────

const calcParagraph = (node, styles = {}, usableWidth = USABLE_WIDTH_PX) => {
  const fontSize   = styles.fontSize   ?? DEFAULT_FONT_SIZE;
  const lineHeight = styles.lineHeight ?? DEFAULT_LINE_HEIGHT;
  const fontFamily = styles.fontFamily ?? 'default';
  const lineH      = fontSize * lineHeight;

  const { totalPxWidth, hardBreaks } = measureInlineContent(node, fontSize, fontFamily);
  const softLines = Math.max(1, Math.ceil(totalPxWidth / usableWidth));
  const totalLines = softLines + hardBreaks;

  // +4px rendering buffer (descenders, sub-pixel rounding)
  return Math.ceil(totalLines * lineH) + 4;
};

const calcHeading = (node, styles = {}, usableWidth = USABLE_WIDTH_PX) => {
  const level      = node.attrs?.level ?? 1;
  const fontSize   = HEADING_FONT_SIZES[(level - 1)] ?? DEFAULT_FONT_SIZE;
  const lineHeight = 1.2; // Headings use tighter line-height
  const fontFamily = styles.fontFamily ?? 'default';
  const lineH      = fontSize * lineHeight;

  const { totalPxWidth, hardBreaks } = measureInlineContent(node, fontSize, fontFamily);
  const softLines  = Math.max(1, Math.ceil(totalPxWidth / usableWidth));
  const totalLines = softLines + hardBreaks;

  return Math.ceil(Math.max(totalLines * lineH, fontSize * 1.5));
};

const calcImage = (node) => {
  const h = node.attrs?.height;
  const w = node.attrs?.width;
  if (h) return parseInt(h, 10);
  if (w) {
    const aspect = node.attrs?.aspectRatio ?? 1;
    return Math.ceil(parseInt(w, 10) / aspect);
  }
  return 200; // Default image placeholder height
};

const calcTable = (node, styles = {}, usableWidth = USABLE_WIDTH_PX) => {
  const rows = node.content?.content ?? [];
  if (rows.length === 0) return 30;

  const cols         = rows[0]?.content?.content?.length ?? 1;
  const cellWidth    = Math.floor(usableWidth / Math.max(cols, 1));
  const fontSize     = styles.fontSize   ?? DEFAULT_FONT_SIZE;
  const lineHeight   = styles.lineHeight ?? DEFAULT_LINE_HEIGHT;
  const fontFamily   = styles.fontFamily ?? 'default';
  const lineH        = fontSize * lineHeight;
  const CELL_PADDING = 12; // top+bottom cell padding

  let totalHeight = 0;
  rows.forEach((row) => {
    const cells     = row?.content?.content ?? [];
    let rowMaxHeight = lineH + CELL_PADDING; // minimum row height
    cells.forEach((cell) => {
      const { totalPxWidth } = measureInlineContent(cell, fontSize, fontFamily);
      const lines      = Math.max(1, Math.ceil(totalPxWidth / cellWidth));
      const cellHeight = Math.ceil(lines * lineH) + CELL_PADDING;
      rowMaxHeight     = Math.max(rowMaxHeight, cellHeight);
    });
    totalHeight += rowMaxHeight;
  });

  return Math.ceil(totalHeight + 4); // +4 border rounding
};

const calcList = (node, styles = {}, usableWidth = USABLE_WIDTH_PX) => {
  const items      = node.content?.content ?? [];
  const fontSize   = styles.fontSize   ?? DEFAULT_FONT_SIZE;
  const lineHeight = styles.lineHeight ?? DEFAULT_LINE_HEIGHT;
  const fontFamily = styles.fontFamily ?? 'default';
  const lineH      = fontSize * lineHeight;
  // Lists are indented (bullet + gap ≈ 24px)
  const listWidth  = usableWidth - 24;

  let total = 0;
  items.forEach((item) => {
    const { totalPxWidth, hardBreaks } = measureInlineContent(item, fontSize, fontFamily);
    const softLines  = Math.max(1, Math.ceil(totalPxWidth / listWidth));
    const lines      = softLines + hardBreaks;
    total += Math.ceil(lines * lineH) + (BLOCK_MARGIN_BOTTOM.listItem ?? 6);
  });

  return Math.max(total, lineH);
};

const calcCodeBlock = (node) => {
  const text     = node.textContent ?? '';
  const lines    = text ? text.split('\n').length : 1;
  const fontSize = 14;
  const lineH    = fontSize * 1.4;
  // +24 for code block padding (top+bottom)
  return Math.ceil(lines * lineH + 24);
};

const calcQuote = (node, styles = {}, usableWidth = USABLE_WIDTH_PX) => {
  const fontSize   = styles.fontSize   ?? DEFAULT_FONT_SIZE;
  const lineHeight = styles.lineHeight ?? 1.6;
  const fontFamily = styles.fontFamily ?? 'default';
  const lineH      = fontSize * lineHeight;
  // Blockquote has left border + padding, reduces width by ~32px
  const quoteWidth = usableWidth - 32;

  const { totalPxWidth, hardBreaks } = measureInlineContent(node, fontSize, fontFamily);
  const softLines  = Math.max(1, Math.ceil(totalPxWidth / quoteWidth));
  const totalLines = softLines + hardBreaks;

  return Math.ceil(totalLines * lineH + 20); // +20 top+bottom padding
};

const calcDivider = () => 20;

// ─────────────────────────────────────────────────────────────────────────────
// Word and Character Counting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Count words and characters in a ProseMirror node.
 * Recursively walks through all inline content.
 *
 * @param {object} node - ProseMirror node
 * @returns {{ words: number, chars: number }} Word and character counts
 */
export const countWordsAndChars = (node) => {
  let wordCount = 0;
  let charCount = 0;

  const walk = (child) => {
    const name = typeName(child);
    
    // Skip non-text nodes like images, tables, etc.
    if (name === 'image' || name === 'table') return;
    
    if (child.text) {
      // Count characters (excluding whitespace for char limit)
      const text = child.text;
      charCount += text.length;
      
      // Count words (split by whitespace, filter empty strings)
      const words = text.trim().split(/\s+/).filter(w => w.length > 0);
      wordCount += words.length;
    }
    
    if (child.content?.forEach) {
      child.content.forEach(walk);
    }
  };

  if (node.content?.forEach) {
    node.content.forEach(walk);
  } else if (node.text) {
    // Handle plain text nodes
    const text = node.text;
    charCount += text.length;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    wordCount += words.length;
  }

  return { words: wordCount, chars: charCount };
};

/**
 * Count cumulative words and characters across an array of blocks.
 *
 * @param {object[]} blocks - Array of ProseMirror nodes
 * @param {number} startIndex - Start index (inclusive)
 * @param {number} endIndex - End index (exclusive)
 * @returns {{ words: number, chars: number }} Cumulative counts
 */
export const countWordsAndCharsInRange = (blocks, startIndex = 0, endIndex = blocks.length) => {
  let totalWords = 0;
  let totalChars = 0;

  for (let i = startIndex; i < endIndex; i++) {
    const counts = countWordsAndChars(blocks[i]);
    totalWords += counts.words;
    totalChars += counts.chars;
  }

  return { words: totalWords, chars: totalChars };
};

const calcGeneric = (node, styles = {}, usableWidth = USABLE_WIDTH_PX) => {
  const fontSize   = styles.fontSize   ?? DEFAULT_FONT_SIZE;
  const lineHeight = styles.lineHeight ?? DEFAULT_LINE_HEIGHT;
  const fontFamily = styles.fontFamily ?? 'default';
  const lineH      = fontSize * lineHeight;
  const text       = node.textContent ?? '';
  const lines      = estimateLines(text, usableWidth, fontSize, fontFamily);
  return Math.ceil(Math.max(lines * lineH, 20));
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the content height of a block node (excludes margin-bottom).
 * Add blockMarginBottom(node) to get the full layout height.
 *
 * @param {object} node     - ProseMirror node (or plain block object)
 * @param {object} styles   - Optional style overrides { fontSize, lineHeight, fontFamily }
 * @param {number} usableWidth - Override for usable content width
 * @returns {number} Content height in px (always a finite positive integer)
 */
export const calculateBlockHeight = (node, styles = {}, usableWidth = USABLE_WIDTH_PX) => {
  const name = typeName(node);
  let h;
  switch (name) {
    case BLOCK_TYPES.PARAGRAPH:    h = calcParagraph(node, styles, usableWidth); break;
    case BLOCK_TYPES.HEADING:      h = calcHeading(node, styles, usableWidth);   break;
    case BLOCK_TYPES.IMAGE:        h = calcImage(node);                          break;
    case BLOCK_TYPES.TABLE:        h = calcTable(node, styles, usableWidth);     break;
    case BLOCK_TYPES.BULLET_LIST:
    case BLOCK_TYPES.ORDERED_LIST: h = calcList(node, styles, usableWidth);      break;
    case BLOCK_TYPES.CODE_BLOCK:   h = calcCodeBlock(node);                      break;
    case BLOCK_TYPES.QUOTE:        h = calcQuote(node, styles, usableWidth);     break;
    case BLOCK_TYPES.DIVIDER:      h = calcDivider();                            break;
    default:                       h = calcGeneric(node, styles, usableWidth);   break;
  }
  return Math.max(Math.ceil(isFinite(h) ? h : 0), 1);
};

/**
 * Full layout height = content height + margin-bottom.
 * Use this value when placing blocks on pages.
 */
export const calculateFullBlockHeight = (node, styles = {}, usableWidth = USABLE_WIDTH_PX) =>
  calculateBlockHeight(node, styles, usableWidth) + blockMarginBottom(node);

/**
 * Legacy alias kept for backward compatibility with paginationEngine v2.
 * Delegates to calculateBlockHeight (which is now the "realistic" version).
 */
export const calculateRealisticBlockHeight = calculateBlockHeight;

// ─────────────────────────────────────────────────────────────────────────────
// Paragraph Splitting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Split a paragraph node so that `part1` fits within `availableHeight` and
 * `part2` carries the remainder to the next page.
 *
 * Strategy: line-by-line simulation (much more accurate than ratio heuristic).
 *
 * Handles:
 *  - Plain-text paragraphs
 *  - Rich-text with bold/italic inline marks (width differs per run)
 *  - Hard breaks
 *
 * @param {object} node           - ProseMirror paragraph node
 * @param {number} availableHeight - Remaining vertical space on current page (px)
 * @param {object} styles         - { fontSize, lineHeight, fontFamily }
 * @param {number} usableWidth    - Horizontal content width (px)
 * @returns {{ part1, part2, part1Height, part2Height } | null}
 */
export const estimateParagraphSplit = (
  node,
  availableHeight,
  styles     = {},
  usableWidth = USABLE_WIDTH_PX,
) => {
  const fontSize   = styles.fontSize   ?? DEFAULT_FONT_SIZE;
  const lineHeight = styles.lineHeight ?? DEFAULT_LINE_HEIGHT;
  const fontFamily = styles.fontFamily ?? 'default';
  const lineH      = fontSize * lineHeight;

  // How many complete lines fit?
  const linesAvailable = Math.floor(availableHeight / lineH);
  if (linesAvailable < 1) return null;

  // ── Build a flat list of { text, bold, italic } runs from inline content ──
  const runs = [];
  const walkInline = (child) => {
    const name = typeName(child);
    if (name === 'hardBreak' || name === 'hard_break') {
      runs.push({ text: '\n', bold: false, italic: false });
      return;
    }
    if (child.text) {
      const bold   = child.marks?.some((m) => m.type?.name === 'bold'   || m.type === 'bold')   ?? false;
      const italic = child.marks?.some((m) => m.type?.name === 'italic' || m.type === 'italic') ?? false;
      runs.push({ text: child.text, bold, italic });
    }
    if (child.content?.forEach) child.content.forEach(walkInline);
  };
  if (node.content?.forEach) node.content.forEach(walkInline);

  // Flatten runs into an array of { char, charWidthPx } for simulation
  const chars = [];
  for (const run of runs) {
    const cw = avgCharWidth(fontSize, fontFamily, run.bold, run.italic);
    for (const ch of run.text) {
      chars.push({ ch, cw });
    }
  }

  if (chars.length === 0) return null;

  // ── Simulate line wrapping to find the split index ──
  let lineCount  = 1;
  let lineWidthPx = 0;
  let splitCharIndex = -1;

  for (let i = 0; i < chars.length; i++) {
    const { ch, cw } = chars[i];
    if (ch === '\n') {
      // Hard break → new line
      lineCount  += 1;
      lineWidthPx = 0;
    } else {
      lineWidthPx += cw;
      if (lineWidthPx > usableWidth) {
        // Soft wrap — find last space before this position
        lineCount  += 1;
        lineWidthPx = cw;
      }
    }
    if (lineCount > linesAvailable) {
      // We've exceeded available lines — split just before this char
      splitCharIndex = i;
      break;
    }
  }

  if (splitCharIndex <= 0) return null; // Nothing to split

  // ── Find the nearest word boundary before splitCharIndex ──
  let breakAt = splitCharIndex;
  while (breakAt > 0 && chars[breakAt].ch !== ' ') breakAt--;

  if (breakAt <= 0) {
    // No space found before split — look forward
    breakAt = splitCharIndex;
    while (breakAt < chars.length && chars[breakAt].ch !== ' ') breakAt++;
    if (breakAt >= chars.length - 1) return null;
  }

  // ── Reconstruct split text ──
  const part1Text = chars.slice(0, breakAt).map((c) => c.ch).join('').trimEnd();
  const part2Text = chars.slice(breakAt).map((c) => c.ch).join('').trimStart();

  if (!part1Text || !part2Text) return null;

  // Build lightweight split nodes (preserves attrs, resets content to plain text)
  const makeSplitNode = (text) => ({
    ...node,
    text,
    textContent: text,
    content: { forEach: (fn) => fn({ text, type: { name: 'text' }, marks: [] }) },
  });

  const part1     = makeSplitNode(part1Text);
  const part2     = makeSplitNode(part2Text);
  const part1Height = calculateBlockHeight(part1, styles, usableWidth);
  const part2Height = calculateBlockHeight(part2, styles, usableWidth);

  return { part1, part2, part1Height, part2Height };
};

/**
 * Width-aware split — same as estimateParagraphSplit but accepts an explicit
 * usable width (e.g. for sidebar or column layouts).
 */
export const estimateParagraphSplitWithWidth = (node, availableHeight, availableWidth, styles = {}) =>
  estimateParagraphSplit(node, availableHeight, styles, availableWidth);