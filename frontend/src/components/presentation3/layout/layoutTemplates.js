// layout/layoutTemplates.js
// Pure layout functions — each receives normalized elements + the SAFE rect
// and returns those elements with { x, y, width, height } assigned.
// NO imports from the store. NO side effects.

import { SAFE, GAP, ROLE_HEIGHT, MARGIN, SLIDE } from "./constants";
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
  const TEMPLATE = "image-left";
  const imageEl = elements.find((e) => e.role === "image" || e.type === "image");
  const heading = elements.find((e) => e.role === "heading");
  const bodyEls = elements.filter(
    (e) => e !== imageEl && e !== heading && hasVisibleText(e)
  );
  const { lists, paragraphs } = partitionBodyElements(bodyEls);

  const imgX = 3;
  const imgY = 6;
  const imgW = 419;
  const imgH = 492;
  const textX = 434;
  const textW = 474;

  const headingTypo = getTypographyForRole(TEMPLATE, "heading");
  const bodyTypo = getTypographyForRole(TEMPLATE, "body");
  const listTypo = getTypographyForRole(TEMPLATE, "list");

  const out = [];

  if (imageEl) {
    out.push({
      ...imageEl,
      x: imgX,
      y: imgY,
      width: imgW,
      height: imgH,
      borderRadius: 28,
      borderWidth: 0,
    });
  }

  let cursorY = 28;

  if (heading) {
    const styled = applyTypography(heading, headingTypo);
    const headingH = estimateHeadingHeight(styled, textW, TEMPLATE);
    out.push({
      ...styled,
      x: textX,
      y: cursorY,
      width: textW,
      height: headingH,
    });
    cursorY += headingH + 16;
  }

  [...paragraphs, ...lists].forEach((el) => {
    const typo = isListElement(el) ? listTypo : bodyTypo;
    const styled = applyTypography(el, typo);
    const h = Math.min(estimateTextLayerHeight(styled, textW), 140);
    out.push({
      ...styled,
      x: textX,
      y: cursorY,
      width: textW,
      height: h,
    });
    cursorY += h + 16;
  });

  return out;
};

// ─────────────────────────────────────────────────────────────
// TEMPLATE: image-right
// Mirror of image-left
// ─────────────────────────────────────────────────────────────
export const imageRight = (elements) => {
  const TEMPLATE = "image-right";
  const imageEl = elements.find((e) => e.role === "image" || e.type === "image");
  const heading = elements.find((e) => e.role === "heading");
  const bodyEls = elements.filter(
    (e) => e !== imageEl && e !== heading && hasVisibleText(e)
  );
  const { lists, paragraphs } = partitionBodyElements(bodyEls);

  const imgW = 384;
  const imgH = 299;
  const imgX = 505;
  const imgY = 21;
  const imgBottom = imgY + imgH;
  const leftX = 8;
  const leftW = 470;
  const rightX = 434;
  const rightW = 464;

  const headingTypo = getTypographyForRole(TEMPLATE, "heading");
  const bodyTypo = getTypographyForRole(TEMPLATE, "body");
  const listTypo = getTypographyForRole(TEMPLATE, "list");

  const out = [];
  const headingY = 13;
  let headingH = 0;

  if (heading) {
    const styled = applyTypography(heading, headingTypo);
    headingH = estimateHeadingHeight(styled, leftW, TEMPLATE);
    out.push({
      ...styled,
      x: leftX,
      y: headingY,
      width: leftW,
      height: headingH,
    });
  }

  if (imageEl) {
    out.push({
      ...imageEl,
      x: imgX,
      y: imgY,
      width: imgW,
      height: imgH,
      borderRadius: 28,
      borderWidth: 0,
    });
  }

  const headingBottom = headingY + headingH;
  const listY = Math.max(headingBottom + 24, 230);

  lists.forEach((el) => {
    const styled = applyTypography(el, listTypo);
    const h = estimateTextLayerHeight(styled, leftW);
    out.push({
      ...styled,
      x: 18,
      y: listY,
      width: leftW,
      height: h,
    });
  });

  const paraY = Math.max(350, imgBottom + 20);
  paragraphs.forEach((el) => {
    const styled = applyTypography(el, bodyTypo);
    const h = estimateTextLayerHeight(styled, rightW);
    out.push({
      ...styled,
      x: rightX,
      y: paraY,
      width: rightW,
      height: h,
    });
  });

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
      x: 512,
      y: 0,
      width: 390,
      height: 510,
      borderRadius: 0,
      borderWidth: 0,
    });
  }
  const heroTextW = 380;
  const heroStartY = 72;
  let cursorY = heroStartY;

  if (heading) {
    const heroTypo = getTypographyForRole("hero-image-right", "heading", true);
    const styledHeading = applyTypography(heading, heroTypo);
    const headingH = estimateHeadingHeight(styledHeading, heroTextW, "hero-image-right");
    out.push({
      ...styledHeading,
      x: 60,
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
    const subH = Math.min(90, Math.max(48, estimateTextLayerHeight(styled, heroTextW)));
    out.push({
      ...styled,
      x: 60,
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

  const imgW = 380;
  const imgH = 280;
  const padRight = 52;
  const imgX = SLIDE.WIDTH - padRight - imgW;
  const imgY = SAFE.Y + Math.round((SAFE.HEIGHT - imgH) / 2);
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
      borderRadius: 32,
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
  const innerWidth = SAFE.WIDTH - 120;
  const innerX = SAFE.X + 60;
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
  const startX = 52;
  const fullW = 856;
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
  "hero-image-right":   heroImageRight,
  "hero_layout":        heroImageRight,
  "image_right_content_left": imageRight,
  "image_left_content_right": imageLeft,
  "center-stat":        centerStat,
  "center_stat_layout": centerStat,
  "text-focus":         textFocus,
  "text_focus_layout":  textFocus,
  "visual-insight":     visualInsight,
  "visual_insight_layout": visualInsight,
  "image-focus":        visualInsight,
  "fallback":           fallbackStack,
};
