// layout/layoutUtils.js — shared helpers for templates and normalization

import { ROLE_HEIGHT, SLIDE, MARGIN } from "./constants";

export const SLIDE_CONTENT_BOTTOM = SLIDE.HEIGHT - MARGIN.BOTTOM;

export const extractPlainTextFromContent = (content) => {
  if (!Array.isArray(content)) return "";

  const walk = (nodes) => {
    let text = "";
    for (const node of nodes) {
      if (!node) continue;
      if (node.text !== undefined) text += node.text;
      if (Array.isArray(node.children)) text += walk(node.children);
    }
    return text;
  };

  return walk(content).trim();
};

/** Skip empty placeholder body layers the AI often emits */
export const hasVisibleText = (el) => {
  if (!el || el.type !== "text") return false;
  return extractPlainTextFromContent(el.content).length > 0;
};

export const countListItems = (content) => {
  if (!Array.isArray(content)) return 0;
  let count = 0;
  for (const node of content) {
    if (node?.type === "bulleted-list" || node?.type === "numbered-list") {
      const children = node.children || [];
      count += children.filter(
        (c) =>
          c?.type === "list-item" ||
          (c?.text !== undefined && String(c.text).trim() !== "")
      ).length;
    }
  }
  return count;
};

/** Paragraph / list body height from actual content — no 140px floor */
export const estimateTextLayerHeight = (el, widthOverride) => {
  const fontSize = el?.fontSize || 16;
  const lineHeight = fontSize * 1.55;
  const width = widthOverride ?? el?.width ?? 700;
  const listItems = countListItems(el?.content);

  if (listItems > 0) {
    return Math.ceil(listItems * lineHeight + 20);
  }

  const text = extractPlainTextFromContent(el?.content);
  if (!text) return 0;

  const charsPerLine = Math.max(16, Math.floor(width / (fontSize * 0.48)));
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return Math.max(36, Math.ceil(lines * lineHeight + 12));
};

/** Matches TextLayer lineHeight + uppercase rendering */
export const HEADING_LINE_HEIGHT = 1.4;

/** Hand-tuned heading box heights (uppercase titles need fixed room) */
export const HEADING_BOX_HEIGHT = {
  "hero-image-right": 140,
  "image-right": 114,
  "image-left": 72,
  "text-focus": 100,
};

/** Multi-line title height — accounts for uppercase in the canvas renderer */
export const estimateHeadingHeight = (el, widthOverride, templateKey) => {
  const fontSize = el?.fontSize || 38;
  const lineHeight = fontSize * HEADING_LINE_HEIGHT;
  const width = widthOverride ?? el?.width ?? 856;
  const text = extractPlainTextFromContent(el?.content);
  if (!text) {
    return HEADING_BOX_HEIGHT[templateKey] ?? ROLE_HEIGHT.heading;
  }

  const charsPerLine = Math.max(10, Math.floor(width / (fontSize * 0.55)));
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  const estimated = Math.ceil(lines * lineHeight + 16);
  const tuned = HEADING_BOX_HEIGHT[templateKey];

  if (tuned) return Math.max(tuned, estimated);
  return Math.max(ROLE_HEIGHT.heading, estimated);
};

export const isListElement = (el) => countListItems(el?.content) > 0;

export const partitionBodyElements = (elements) => {
  const lists = [];
  const paragraphs = [];
  for (const el of elements) {
    if (isListElement(el)) lists.push(el);
    else paragraphs.push(el);
  }
  return { lists, paragraphs };
};

export const applyTypography = (el, typo) => ({
  ...el,
  fontSize: typo.fontSize,
  fontWeight: typo.fontWeight ?? el.fontWeight,
});

/** Paragraph layers before list layers (vertical stack templates) */
export const sortBodyElements = (elements) =>
  [...elements].sort((a, b) => {
    const aList = isListElement(a) ? 1 : 0;
    const bList = isListElement(b) ? 1 : 0;
    return aList - bList;
  });
