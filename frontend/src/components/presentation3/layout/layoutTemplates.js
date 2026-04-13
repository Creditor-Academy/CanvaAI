// layout/layoutTemplates.js
// Pure layout functions — each receives normalized elements + the SAFE rect
// and returns those elements with { x, y, width, height } assigned.
// NO imports from the store. NO side effects.

import { SAFE, GAP, ROLE_HEIGHT, MARGIN } from "./constants";

// ─────────────────────────────────────────────────────────────
// Internal helper: stack elements vertically, top to bottom
// ─────────────────────────────────────────────────────────────
const stackVertically = (elements, startX, startY, width) => {
  let cursor = startY;
  return elements.map((el) => {
    const h = el._reservedHeight ?? ROLE_HEIGHT[el.role] ?? ROLE_HEIGHT.fallback;
    const positioned = { ...el, x: startX, y: cursor, width, height: h };
    cursor += h + GAP.ELEMENT;
    return positioned;
  });
};

// ─────────────────────────────────────────────────────────────
// Internal helper: distribute remaining vertical space to body elements
// ─────────────────────────────────────────────────────────────
const distributeHeight = (elements, totalHeight) => {
  const fixedTotal = elements
    .filter((e) => e.role !== "body")
    .reduce((sum, e) => sum + (ROLE_HEIGHT[e.role] ?? ROLE_HEIGHT.fallback) + GAP.ELEMENT, 0);

  const bodyCount = elements.filter((e) => e.role === "body").length;
  const bodyHeight = bodyCount > 0
    ? Math.max(40, Math.floor((totalHeight - fixedTotal) / bodyCount))
    : ROLE_HEIGHT.body;

  return elements.map((el) => ({
    ...el,
    _reservedHeight: el.role === "body" ? bodyHeight : (ROLE_HEIGHT[el.role] ?? ROLE_HEIGHT.fallback),
  }));
};

// ─────────────────────────────────────────────────────────────
// TEMPLATE: title-only
// Single large heading centered vertically on the slide
// ─────────────────────────────────────────────────────────────
export const titleOnly = (elements) => {
  const heading = elements.find((e) => e.role === "heading") ?? elements[0];
  const sub     = elements.find((e) => e.role === "subheading" || e.role === "body");

  const out = [];
  if (!heading) return out;

  const headingH = ROLE_HEIGHT.heading;
  const subH     = sub ? ROLE_HEIGHT.subheading + GAP.ELEMENT : 0;
  const totalH   = headingH + subH;
  const startY   = SAFE.Y + Math.round((SAFE.HEIGHT - totalH) / 2);

  out.push({ ...heading, x: SAFE.X, y: startY, width: SAFE.WIDTH, height: headingH });

  if (sub) {
    out.push({
      ...sub,
      x: SAFE.X,
      y: startY + headingH + GAP.ELEMENT,
      width: SAFE.WIDTH,
      height: ROLE_HEIGHT.subheading,
    });
  }

  return out;
};

// ─────────────────────────────────────────────────────────────
// TEMPLATE: title-content
// Heading at top, remaining elements fill downward
// ─────────────────────────────────────────────────────────────
export const titleContent = (elements) => {
  const ROLE_ORDER = ["eyebrow", "heading", "subheading", "body", "caption", "shape", "table"];
  const sorted = [...elements].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
  );

  const withHeights = distributeHeight(sorted, SAFE.HEIGHT);
  return stackVertically(withHeights, SAFE.X, SAFE.Y, SAFE.WIDTH);
};

// ─────────────────────────────────────────────────────────────
// TEMPLATE: two-column
// Left column: heading + subheading   Right column: body + other
// ─────────────────────────────────────────────────────────────
export const twoColumn = (elements) => {
  const colWidth = Math.floor((SAFE.WIDTH - GAP.COLUMN) / 2);
  const leftX    = SAFE.X;
  const rightX   = SAFE.X + colWidth + GAP.COLUMN;

  const leftRoles  = ["eyebrow", "heading", "subheading"];
  let left  = elements.filter((e) => leftRoles.includes(e.role));
  let right = elements.filter((e) => !leftRoles.includes(e.role));

  // Degenerate: if one side is empty, split the list evenly
  if (left.length === 0 || right.length === 0) {
    const mid = Math.ceil(elements.length / 2);
    left  = elements.slice(0, mid);
    right = elements.slice(mid);
  }

  return [
    ...stackVertically(left,  leftX,  SAFE.Y, colWidth),
    ...stackVertically(right, rightX, SAFE.Y, colWidth),
  ];
};

// ─────────────────────────────────────────────────────────────
// TEMPLATE: image-left
// Image occupies left ~45 %, text fills right ~55 %
// ─────────────────────────────────────────────────────────────
export const imageLeft = (elements) => {
  const imageEl = elements.find((e) => e.role === "image" || e.type === "image");
  const textEls = elements.filter((e) => e !== imageEl);

  const imgW   = Math.round(SAFE.WIDTH * 0.44);
  const textW  = SAFE.WIDTH - imgW - GAP.COLUMN;
  const textX  = SAFE.X + imgW + GAP.COLUMN;

  const out = [];
  if (imageEl) {
    out.push({ ...imageEl, x: SAFE.X, y: SAFE.Y, width: imgW, height: SAFE.HEIGHT });
  }
  out.push(...stackVertically(textEls, textX, SAFE.Y, textW));
  return out;
};

// ─────────────────────────────────────────────────────────────
// TEMPLATE: image-right
// Mirror of image-left
// ─────────────────────────────────────────────────────────────
export const imageRight = (elements) => {
  const imageEl = elements.find((e) => e.role === "image" || e.type === "image");
  const textEls = elements.filter((e) => e !== imageEl);

  const imgW  = Math.round(SAFE.WIDTH * 0.44);
  const textW = SAFE.WIDTH - imgW - GAP.COLUMN;

  const out = [];
  out.push(...stackVertically(textEls, SAFE.X, SAFE.Y, textW));
  if (imageEl) {
    out.push({
      ...imageEl,
      x: SAFE.X + textW + GAP.COLUMN,
      y: SAFE.Y,
      width: imgW,
      height: SAFE.HEIGHT,
    });
  }
  return out;
};

// ─────────────────────────────────────────────────────────────
// TEMPLATE: image-full
// Full-bleed background image + centered text overlay
// ─────────────────────────────────────────────────────────────
export const imageFull = (elements) => {
  const imageEl = elements.find((e) => e.role === "image" || e.type === "image");
  const textEls = elements.filter((e) => e !== imageEl);

  const overlayStartY = SAFE.Y + Math.round(SAFE.HEIGHT * 0.25);
  const overlayWidth  = Math.round(SAFE.WIDTH * 0.8);
  const overlayX      = SAFE.X + Math.round((SAFE.WIDTH - overlayWidth) / 2);

  const out = [];
  if (imageEl) {
    // Full bleed — ignores SAFE margins intentionally
    out.push({ ...imageEl, x: 0, y: 0, width: 960, height: 540 });
  }
  out.push(...stackVertically(textEls, overlayX, overlayStartY, overlayWidth));
  return out;
};

// ─────────────────────────────────────────────────────────────
// TEMPLATE: quote
// Large centered quote + caption attribution
// ─────────────────────────────────────────────────────────────
export const quote = (elements) => {
  const quoteEl   = elements.find((e) => e.role === "body") ?? elements[0];
  const captionEl = elements.find((e) => e.role === "caption");

  const out = [];
  const quoteW  = Math.round(SAFE.WIDTH * 0.82);
  const quoteX  = SAFE.X + Math.round((SAFE.WIDTH - quoteW) / 2);
  const quoteH  = 200;
  const startY  = SAFE.Y + Math.round((SAFE.HEIGHT - quoteH) / 2) - 30;

  if (quoteEl) {
    out.push({ ...quoteEl, x: quoteX, y: startY, width: quoteW, height: quoteH });
  }
  if (captionEl) {
    out.push({
      ...captionEl,
      x: quoteX,
      y: startY + quoteH + GAP.ELEMENT,
      width: quoteW,
      height: ROLE_HEIGHT.caption,
    });
  }
  return out;
};

// ─────────────────────────────────────────────────────────────
// TEMPLATE: three-column-icons
// Three equal columns — icon/title/body per column
// ─────────────────────────────────────────────────────────────
export const threeColumnIcons = (elements) => {
  const colWidth = Math.floor((SAFE.WIDTH - GAP.COLUMN * 2) / 3);
  const third    = Math.ceil(elements.length / 3);

  const chunks = [
    elements.slice(0, third),
    elements.slice(third, third * 2),
    elements.slice(third * 2),
  ];

  return chunks.flatMap((chunk, i) =>
    stackVertically(chunk, SAFE.X + i * (colWidth + GAP.COLUMN), SAFE.Y, colWidth)
  );
};

// ─────────────────────────────────────────────────────────────
// TEMPLATE: comparison (heading + two-column body)
// ─────────────────────────────────────────────────────────────
export const comparison = (elements) => {
  const heading = elements.find((e) => e.role === "heading");
  const rest    = elements.filter((e) => e !== heading);

  const out = [];
  const headingY = SAFE.Y;

  if (heading) {
    out.push({ ...heading, x: SAFE.X, y: headingY, width: SAFE.WIDTH, height: ROLE_HEIGHT.heading });
  }

  const bodyStartY = headingY + ROLE_HEIGHT.heading + GAP.ELEMENT;
  const colWidth   = Math.floor((SAFE.WIDTH - GAP.COLUMN) / 2);
  const mid        = Math.ceil(rest.length / 2);

  out.push(...stackVertically(rest.slice(0, mid), SAFE.X, bodyStartY, colWidth));
  out.push(...stackVertically(rest.slice(mid), SAFE.X + colWidth + GAP.COLUMN, bodyStartY, colWidth));
  return out;
};

// ─────────────────────────────────────────────────────────────
// TEMPLATE: fallback — plain vertical stack, always safe
// ─────────────────────────────────────────────────────────────
export const fallbackStack = (elements) =>
  stackVertically(elements, SAFE.X, SAFE.Y, SAFE.WIDTH);

// ─────────────────────────────────────────────────────────────
// Registry — keyed by the string the AI returns in slide.layout
// ─────────────────────────────────────────────────────────────
export const TEMPLATE_MAP = {
  "title-only":         titleOnly,
  "title-content":      titleContent,
  "two-column":         twoColumn,
  "image-left":         imageLeft,
  "image-right":        imageRight,
  "image-full":         imageFull,
  "quote":              quote,
  "three-column-icons": threeColumnIcons,
  "comparison":         comparison,
  "fallback":           fallbackStack,
};
