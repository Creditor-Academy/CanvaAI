// layout/layoutTemplates.js
// Pure layout functions — each receives normalized elements + the SAFE rect
// and returns those elements with { x, y, width, height } assigned.
// NO imports from the store. NO side effects.

import {
  SAFE,
  GAP,
  ROLE_HEIGHT,
  MARGIN,
  SLIDE,
  HERO_IMAGE,
  HERO_TEXT,
  HERO_IMAGE_LEFT,
  HERO_TEXT_RIGHT,
  CONTENT_IMAGE,
  CONTENT_TEXT,
} from "./constants";
import {
  hasVisibleText,
  estimateTextLayerHeight,
  estimateHeadingHeight,
  partitionBodyElements,
  applyTypography,
  isListElement,
  HEADING_BOX_HEIGHT,
  SLIDE_CONTENT_BOTTOM,
} from "./layoutUtils";
import { getTypographyForRole } from "./layoutTypography";

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
const distributeHeight = (elements, totalHeight, contentWidth = SAFE.WIDTH) => {
  const fixedTotal = elements
    .filter((e) => e.role !== "body")
    .reduce((sum, e) => {
      const h =
        e.role === "heading"
          ? estimateHeadingHeight(e, contentWidth)
          : ROLE_HEIGHT[e.role] ?? ROLE_HEIGHT.fallback;
      return sum + h + GAP.ELEMENT;
    }, 0);

  const bodyCount = elements.filter((e) => e.role === "body").length;
  const fallbackBodyHeight =
    bodyCount > 0
      ? Math.max(40, Math.floor((totalHeight - fixedTotal) / bodyCount))
      : ROLE_HEIGHT.body;

  return elements.map((el) => {
    if (el.role === "heading") {
      return {
        ...el,
        _reservedHeight: estimateHeadingHeight(el, contentWidth),
      };
    }
    if (el.role === "body") {
      const measured = estimateTextLayerHeight(el, contentWidth);
      return {
        ...el,
        _reservedHeight: measured > 0 ? measured : fallbackBodyHeight,
      };
    }
    return {
      ...el,
      _reservedHeight: ROLE_HEIGHT[el.role] ?? ROLE_HEIGHT.fallback,
    };
  });
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
  const imageEl = elements.find((e) => e.role === "image" || e.type === "image");
  const textEls = elements.filter((e) => e !== imageEl);
  const ROLE_ORDER = ["eyebrow", "heading", "subheading", "body", "caption", "shape", "table"];
  const sorted = [...textEls].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
  );

  const withHeights = distributeHeight(sorted, SAFE.HEIGHT);
  const stacked = stackVertically(withHeights, SAFE.X, SAFE.Y, SAFE.WIDTH);
  if (imageEl) {
    stacked.push({
      ...imageEl,
      x: CONTENT_IMAGE.RIGHT.X,
      y: CONTENT_IMAGE.RIGHT.Y,
      width: CONTENT_IMAGE.RIGHT.WIDTH,
      height: CONTENT_IMAGE.RIGHT.HEIGHT,
      borderRadius: CONTENT_IMAGE.RIGHT.RADIUS,
      borderWidth: 0,
    });
  }
  return stacked;
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
/**
 * Content slide: centered title + intro on top, image left, list right.
 */
export const contentImageLeft = (elements) => {
  const TEMPLATE = "content-image-left";
  const imageEl = elements.find((e) => e.role === "image" || e.type === "image");
  const heading = elements.find((e) => e.role === "heading");
  const bodyEls = elements.filter(
    (e) => e !== imageEl && e !== heading && hasVisibleText(e)
  );
  const { lists, paragraphs } = partitionBodyElements(bodyEls);

  const headingTypo = getTypographyForRole(TEMPLATE, "heading");
  const bodyTypo = getTypographyForRole(TEMPLATE, "body");
  const listTypo = getTypographyForRole(TEMPLATE, "list");

  const out = [];
  const listX = CONTENT_IMAGE.LEFT.X + CONTENT_IMAGE.LEFT.WIDTH + GAP.COLUMN;
  const listW = CONTENT_TEXT.WIDTH;
  let cursorY = SAFE.Y;

  if (heading) {
    const styled = applyTypography(heading, headingTypo);
    const headingH = estimateHeadingHeight(styled, listW, TEMPLATE);
    out.push({
      ...styled,
      x: listX,
      y: cursorY,
      width: listW,
      height: headingH,
      textAlign: "left",
    });
    cursorY += headingH + GAP.ELEMENT;
  }

  paragraphs.forEach((el) => {
    const styled = applyTypography(el, bodyTypo);
    const needed = estimateTextLayerHeight(styled, listW);
    const maxParaH =
      SLIDE_CONTENT_BOTTOM - cursorY - GAP.ELEMENT - 140;
    const h = Math.min(needed, Math.max(56, maxParaH));
    out.push({
      ...styled,
      x: listX,
      y: cursorY,
      width: listW,
      height: h,
    });
    cursorY += h + GAP.ELEMENT;
  });

  if (imageEl) {
    out.push({
      ...imageEl,
      x: CONTENT_IMAGE.LEFT.X,
      y: CONTENT_IMAGE.LEFT.Y,
      width: CONTENT_IMAGE.LEFT.WIDTH,
      height: CONTENT_IMAGE.LEFT.HEIGHT,
      borderRadius: CONTENT_IMAGE.LEFT.RADIUS,
      borderWidth: 0,
    });
  }

  lists.forEach((el) => {
    const styled = applyTypography(el, listTypo);
    const needed = estimateTextLayerHeight(styled, listW);
    const remaining = SLIDE_CONTENT_BOTTOM - cursorY - 4;
    const h = Math.min(needed, remaining);
    if (h < 28) return;
    out.push({
      ...styled,
      x: listX,
      y: cursorY,
      width: listW,
      height: h,
    });
    cursorY += h + GAP.ELEMENT;
  });

  return out;
};

export const imageLeft = contentImageLeft;

// ─────────────────────────────────────────────────────────────
// TEMPLATE: image-right
// Mirror of image-left
// ─────────────────────────────────────────────────────────────
/**
 * Low/medium content slide: centered title + intro on top, list left, image right.
 */
export const contentImageRight = (elements, ctx = {}) => {
  const TEMPLATE = "content-image-right";
  const meta = ctx.meta || {};
  const imageEl = elements.find((e) => e.role === "image" || e.type === "image");
  const heading = elements.find((e) => e.role === "heading");
  const bodyEls = elements.filter(
    (e) => e !== imageEl && e !== heading && hasVisibleText(e)
  );
  const { lists, paragraphs } = partitionBodyElements(bodyEls);

  const headingTypo = getTypographyForRole(TEMPLATE, "heading", false, meta);
  const bodyTypo = getTypographyForRole(TEMPLATE, "body", false, meta);
  const listTypo = getTypographyForRole(TEMPLATE, "list", false, meta);

  const out = [];
  const contentX = CONTENT_TEXT.X;
  const contentW = CONTENT_TEXT.WIDTH;
  let cursorY = SAFE.Y;

  if (heading) {
    const styled = applyTypography(heading, headingTypo);
    const headingH = estimateHeadingHeight(styled, contentW, TEMPLATE);
    out.push({
      ...styled,
      x: contentX,
      y: cursorY,
      width: contentW,
      height: headingH,
      textAlign: "left",
    });
    cursorY += headingH + GAP.ELEMENT;
  }

  paragraphs.slice(0, 2).forEach((el) => {
    const styled = applyTypography(el, bodyTypo);
    const needed = estimateTextLayerHeight(styled, contentW);
    const maxParaH =
      SLIDE_CONTENT_BOTTOM - cursorY - GAP.ELEMENT - 140;
    const h = Math.min(needed, Math.max(56, maxParaH));
    out.push({
      ...styled,
      x: contentX,
      y: cursorY,
      width: contentW,
      height: h,
      textAlign: "left",
    });
    cursorY += h + GAP.ELEMENT;
  });

  const listW = contentW;

  lists.forEach((el) => {
    const styled = applyTypography(el, listTypo);
    const needed = estimateTextLayerHeight(styled, listW);
    const remaining = SLIDE_CONTENT_BOTTOM - cursorY - 4;
    const h = Math.min(needed, remaining);
    if (h < 36) return;
    out.push({
      ...styled,
      x: contentX,
      y: cursorY,
      width: listW,
      height: h,
    });
    cursorY += h + GAP.ELEMENT;
  });

  if (imageEl) {
    out.push({
      ...imageEl,
      x: CONTENT_IMAGE.RIGHT.X,
      y: CONTENT_IMAGE.RIGHT.Y,
      width: CONTENT_IMAGE.RIGHT.WIDTH,
      height: CONTENT_IMAGE.RIGHT.HEIGHT,
      borderRadius: CONTENT_IMAGE.RIGHT.RADIUS,
      borderWidth: 0,
    });
  }

  return out;
};

export const imageRight = contentImageRight;

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
    out.push({ ...imageEl, x: 0, y: 0, width: SLIDE.WIDTH, height: SLIDE.HEIGHT });
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

  const headingH = heading
    ? estimateHeadingHeight(heading, SAFE.WIDTH)
    : 0;

  if (heading) {
    out.push({ ...heading, x: SAFE.X, y: headingY, width: SAFE.WIDTH, height: headingH });
  }

  const bodyStartY = headingY + headingH + GAP.ELEMENT;
  const colWidth   = Math.floor((SAFE.WIDTH - GAP.COLUMN) / 2);
  const mid        = Math.ceil(rest.length / 2);

  out.push(...stackVertically(rest.slice(0, mid), SAFE.X, bodyStartY, colWidth));
  out.push(...stackVertically(rest.slice(mid), SAFE.X + colWidth + GAP.COLUMN, bodyStartY, colWidth));
  return out;
};

export const heroImageRight = (elements) => {
  const imageEl = elements.find((e) => e.role === "image" || e.type === "image");
  const textEls = elements.filter((e) => e !== imageEl);
  const heading =
    textEls.find((e) => e.role === "heading") || textEls[0];
  const subbody = textEls.find(
    (e) => e.role === "subheading" || (e.role === "body" && e !== heading)
  );

  const out = [];
  if (imageEl) {
    out.push({
      ...imageEl,
      x: HERO_IMAGE.X,
      y: HERO_IMAGE.Y,
      width: HERO_IMAGE.WIDTH,
      height: HERO_IMAGE.HEIGHT,
      borderRadius: 0,
      borderWidth: 0,
    });
  }

  const heroTextW = HERO_TEXT.WIDTH;
  const textBlockH =
    (heading ? estimateHeadingHeight(heading, heroTextW, "hero-image-right") : 0) +
    (subbody ? 80 : 0) +
    24;
  let cursorY = Math.max(
    HERO_TEXT.Y,
    Math.round((SLIDE.HEIGHT - textBlockH) / 2)
  );

  if (heading) {
    const heroTypo = getTypographyForRole("hero-image-right", "heading", true);
    const styledHeading = applyTypography(heading, heroTypo);
    const headingH = estimateHeadingHeight(styledHeading, heroTextW, "hero-image-right");
    out.push({
      ...styledHeading,
      x: HERO_TEXT.X,
      y: cursorY,
      width: heroTextW,
      height: headingH,
      fontWeight: "bold",
      textAlign: "left",
      fontFamily: "Oswald",
    });
    cursorY += headingH + 20;
  }
  if (subbody) {
    const bodyTypo = getTypographyForRole("hero-image-right", "body", true);
    const styled = applyTypography(subbody, bodyTypo);
    const subH = Math.min(120, Math.max(48, estimateTextLayerHeight(styled, heroTextW)));
    out.push({
      ...styled,
      x: HERO_TEXT.X,
      y: cursorY,
      width: heroTextW,
      height: subH,
      fontWeight: "normal",
      textAlign: "left",
    });
  }
  return out;
};

/** Mirror of hero-image-right — full-height image left, title + subheading right */
export const heroImageLeft = (elements, ctx = {}) => {
  const imageEl = elements.find((e) => e.role === "image" || e.type === "image");
  const textEls = elements.filter((e) => e !== imageEl);
  const heading =
    textEls.find((e) => e.role === "heading") || textEls[0];
  const subbody = textEls.find(
    (e) => e.role === "subheading" || (e.role === "body" && e !== heading)
  );

  const out = [];
  if (imageEl) {
    out.push({
      ...imageEl,
      x: HERO_IMAGE_LEFT.X,
      y: HERO_IMAGE_LEFT.Y,
      width: HERO_IMAGE_LEFT.WIDTH,
      height: HERO_IMAGE_LEFT.HEIGHT,
      borderRadius: 0,
      borderWidth: 0,
    });
  }

  const heroTextW = HERO_TEXT_RIGHT.WIDTH;
  const textBlockH =
    (heading ? estimateHeadingHeight(heading, heroTextW, "hero-image-left") : 0) +
    (subbody ? 96 : 0) +
    24;
  let cursorY = Math.max(
    HERO_TEXT_RIGHT.Y,
    Math.round((SLIDE.HEIGHT - textBlockH) / 2)
  );

  if (heading) {
    const heroTypo = getTypographyForRole("hero-image-left", "heading", true);
    const styledHeading = applyTypography(heading, heroTypo);
    const headingH = estimateHeadingHeight(styledHeading, heroTextW, "hero-image-left");
    out.push({
      ...styledHeading,
      x: HERO_TEXT_RIGHT.X,
      y: cursorY,
      width: heroTextW,
      height: headingH,
      fontWeight: "bold",
      textAlign: "left",
      fontFamily: "Oswald",
    });
    cursorY += headingH + 20;
  }
  if (subbody) {
    const bodyTypo = getTypographyForRole("hero-image-left", "body", true);
    const styled = applyTypography(subbody, bodyTypo);
    const subH = Math.min(140, Math.max(56, estimateTextLayerHeight(styled, heroTextW)));
    out.push({
      ...styled,
      x: HERO_TEXT_RIGHT.X,
      y: cursorY,
      width: heroTextW,
      height: subH,
      fontWeight: "normal",
      textAlign: "left",
    });
  }
  return out;
};

export const visualInsight = (elements) => {
  const imageEl = elements.find((e) => e.role === "image" || e.type === "image");
  const textEls = elements.filter((e) => e !== imageEl);

  const imgW = CONTENT_IMAGE.RIGHT.WIDTH;
  const imgH = CONTENT_IMAGE.RIGHT.HEIGHT;
  const imgX = CONTENT_IMAGE.RIGHT.X;
  const imgY = CONTENT_IMAGE.RIGHT.Y;
  const textW = imgX - SAFE.X - GAP.COLUMN;

  const out = [];
  out.push(...stackVertically(textEls, SAFE.X, SAFE.Y, textW));
  if (imageEl) {
    out.push({
      ...imageEl,
      x: imgX,
      y: imgY,
      width: imgW,
      height: imgH,
      borderRadius: CONTENT_IMAGE.RIGHT.RADIUS,
      borderWidth: 0,
    });
  }
  return out;
};

export const centerStat = (elements) => {
  const ROLE_ORDER = ["eyebrow", "heading", "subheading", "body", "caption", "shape", "table"];
  const sorted = [...elements].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
  );
  const innerWidth = SAFE.WIDTH;
  const innerX = SAFE.X;
  const withHeights = distributeHeight(sorted, SAFE.HEIGHT);
  const stacked = stackVertically(withHeights, innerX, SAFE.Y, innerWidth);
  return stacked.map((el) =>
    ["heading", "body", "subheading", "eyebrow"].includes(el.role)
      ? { ...el, textAlign: "center", x: innerX, width: innerWidth }
      : el
  );
};

export const textFocus = (elements) => {
  const TEMPLATE = "text-focus";
  const heading = elements.find((e) => e.role === "heading");
  const bodyEls = elements.filter((e) => e !== heading && hasVisibleText(e));

  const headingTypo = getTypographyForRole(TEMPLATE, "heading");
  const bodyTypo = getTypographyForRole(TEMPLATE, "body");
  const listTypo = getTypographyForRole(TEMPLATE, "list");

  const out = [];
  const startX = SAFE.X;
  const fullW = SAFE.WIDTH;
  let cursorY = 40;

  if (heading) {
    const styled = applyTypography(heading, headingTypo);
    const headingH = estimateHeadingHeight(styled, fullW, TEMPLATE);
    out.push({
      ...styled,
      x: startX,
      y: cursorY,
      width: fullW,
      height: headingH,
    });
    cursorY += headingH + GAP.ELEMENT;
  }

  const colW = Math.floor((fullW - GAP.COLUMN) / 2);
  const maxY = SLIDE_CONTENT_BOTTOM;

  if (bodyEls.length >= 2) {
    const [left, right] = bodyEls;
    const leftTypo = isListElement(left) ? listTypo : bodyTypo;
    const rightTypo = isListElement(right) ? listTypo : bodyTypo;
    const leftStyled = applyTypography(left, leftTypo);
    const rightStyled = applyTypography(right, rightTypo);
    const rowRemaining = maxY - cursorY;
    const leftH = Math.min(estimateTextLayerHeight(leftStyled, colW), rowRemaining);
    const rightH = Math.min(estimateTextLayerHeight(rightStyled, colW), rowRemaining);

    out.push({
      ...leftStyled,
      x: startX,
      y: cursorY,
      width: colW,
      height: leftH,
    });
    out.push({
      ...rightStyled,
      x: startX + colW + GAP.COLUMN,
      y: cursorY,
      width: colW,
      height: rightH,
    });
  } else {
    bodyEls.forEach((el) => {
      const typo = isListElement(el) ? listTypo : bodyTypo;
      const styled = applyTypography(el, typo);
      const remaining = maxY - cursorY;
      if (remaining <= 32) return;
      const h = Math.min(estimateTextLayerHeight(styled, fullW), remaining);
      out.push({
        ...styled,
        x: startX,
        y: cursorY,
        width: fullW,
        height: h,
      });
      cursorY += h + GAP.ELEMENT;
    });
  }

  return out;
};

/**
 * Text-only slides (medium/high): full-width heading + paragraphs, then 5+5 list columns.
 */
export const textFocusDense = (elements, ctx = {}) => {
  const TEMPLATE = "text-focus-dense";
  const meta = ctx.meta || {};
  const heading = elements.find((e) => e.role === "heading");
  const bodyEls = elements.filter((e) => e !== heading && hasVisibleText(e));
  const { lists, paragraphs } = partitionBodyElements(bodyEls);

  const headingTypo = getTypographyForRole(TEMPLATE, "heading", false, meta);
  const bodyTypo = getTypographyForRole(TEMPLATE, "body", false, meta);
  const listTypo = getTypographyForRole(TEMPLATE, "list", false, meta);

  const out = [];
  const startX = SAFE.X;
  const fullW = SAFE.WIDTH;
  let cursorY = SAFE.Y;

  if (heading) {
    const styled = applyTypography(heading, headingTypo);
    const headingH = estimateHeadingHeight(styled, fullW, TEMPLATE);
    out.push({
      ...styled,
      x: startX,
      y: cursorY,
      width: fullW,
      height: headingH,
      textAlign: "center",
    });
    cursorY += headingH + GAP.ELEMENT;
  }

  const maxParas = paragraphs.length > 1 ? 2 : 1;
  paragraphs.slice(0, maxParas).forEach((el) => {
    const styled = applyTypography(el, bodyTypo);
    const remaining = SLIDE_CONTENT_BOTTOM - cursorY;
    if (remaining < 48) return;
    const h = Math.min(estimateTextLayerHeight(styled, fullW), Math.max(56, remaining * 0.22));
    out.push({
      ...styled,
      x: startX,
      y: cursorY,
      width: fullW,
      height: h,
    });
    cursorY += h + GAP.ELEMENT;
  });

  const colW = Math.floor((fullW - GAP.COLUMN) / 2);
  const listAreaTop = cursorY;
  const listAreaH = SLIDE_CONTENT_BOTTOM - listAreaTop;
  const leftColX = startX;
  const rightColX = startX + colW + GAP.COLUMN;

  const distributeLists = () => {
    if (lists.length >= 2) {
      return {
        left: lists.filter((_, i) => i % 2 === 0),
        right: lists.filter((_, i) => i % 2 === 1),
      };
    }
    if (lists.length === 1) {
      return { left: [lists[0]], right: [] };
    }
    return { left: [], right: [] };
  };

  const { left: leftLists, right: rightLists } = distributeLists();
  const totalStacks = Math.max(leftLists.length, rightLists.length, 1);
  const slotGap = 12;
  const slotH = Math.max(
    100,
    Math.floor((listAreaH - slotGap * Math.max(0, totalStacks - 1)) / totalStacks)
  );

  const placeColumn = (columnLists, colX) => {
    let y = listAreaTop;
    columnLists.forEach((el) => {
      const styled = applyTypography(el, listTypo);
      const needed = estimateTextLayerHeight(styled, colW);
      const h = Math.min(
        Math.max(needed, slotH * 0.85),
        slotH,
        SLIDE_CONTENT_BOTTOM - y - 4
      );
      if (h < 40) return;
      out.push({
        ...styled,
        x: colX,
        y,
        width: colW,
        height: h,
      });
      y += h + slotGap;
    });
  };

  placeColumn(leftLists, leftColX);
  placeColumn(rightLists, rightColX);

  return out;
};

// ─────────────────────────────────────────────────────────────
// TEMPLATE: fallback — plain vertical stack, always safe
// ─────────────────────────────────────────────────────────────
export const fallbackStack = (elements, _ctx = {}) =>
  stackVertically(elements, SAFE.X, SAFE.Y, SAFE.WIDTH);

// ─────────────────────────────────────────────────────────────
// Registry — keyed by the string the AI returns in slide.layout
// ─────────────────────────────────────────────────────────────
export const TEMPLATE_MAP = {
  "title-only":         titleOnly,
  "title-content":      titleContent,
  "content-image-right": contentImageRight,
  "content-image-left": contentImageLeft,
  "two-column":         twoColumn,
  "image-left":         imageLeft,
  "image-right":        imageRight,
  "image-full":         imageFull,
  "quote":              quote,
  "three-column-icons": threeColumnIcons,
  "comparison":         comparison,
  "hero-image-right":   heroImageRight,
  "hero-image-left":    heroImageLeft,
  "hero_layout":        heroImageRight,
  "hero_layout_left":   heroImageLeft,
  "image_right_content_left": imageRight,
  "image_left_content_right": imageLeft,
  "center-stat":        centerStat,
  "center_stat_layout": centerStat,
  "text-focus":         textFocus,
  "text_focus_layout":  textFocus,
  "text-focus-dense":   textFocusDense,
  "text_focus_dense":   textFocusDense,
  "visual-insight":     visualInsight,
  "visual_insight_layout": visualInsight,
  "image-focus":        visualInsight,
  "fallback":           fallbackStack,
};
