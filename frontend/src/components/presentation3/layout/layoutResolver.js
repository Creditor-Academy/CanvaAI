// layout/layoutResolver.js
// Picks the correct template for a given layout name and applies it.
// If the layout name is unknown or the template throws, falls back gracefully.

import { TEMPLATE_MAP } from "./layoutTemplates";
import { slideShouldHaveImage } from "./layoutStrategyEngine";
import { pickHeroTemplate, pickContentImageTemplate } from "./layoutMirror";

// ─────────────────────────────────────────────────────────────
// Auto-detect best layout when AI gave no layout or unknown name
// ─────────────────────────────────────────────────────────────
const autoDetectLayout = (elements) => {
  const hasImage   = elements.some((e) => e.role === "image" || e.type === "image");
  const count      = elements.length;
  const hasHeading = elements.some((e) => e.role === "heading");

  if (count === 1)                   return "title-only";
  if (count === 2 && hasHeading)     return "title-only";  // heading + subtitle
  if (hasImage && count <= 5)        return "content-image-right";
  if (count >= 6)                    return "two-column";
  return "title-content";
};

// Safety clamp on a single positioned element
const clampElement = (el) => ({
  ...el,
  x:      Math.max(0,  Math.round(el.x      ?? 0)),
  y:      Math.max(0,  Math.round(el.y      ?? 0)),
  width:  Math.max(40, Math.round(el.width  ?? 200)),
  height: Math.max(20, Math.round(el.height ?? 60)),
});

/**
 * Apply a layout template to a set of normalized elements.
 *
 * @param {string|undefined} layoutName  — slide.layout from AI JSON
 * @param {Array}            elements    — normalized elements (no x/y yet)
 * @returns {Array}                      — elements with x, y, width, height set
 */
export const resolveLayout = (layoutName, elements, meta = {}, slideIndex = -1) => {
  if (!elements || elements.length === 0) return [];

  // Minimal meta-aware routing
  const textAmount = meta?.textAmount || "medium";
  const mediaEnabled = meta?.media?.enabled ?? true;
  const hasImage = elements.some((e) => e.role === "image" || e.type === "image");
  const wantsHero =
    slideIndex === 0 && mediaEnabled && (hasImage || slideShouldHaveImage(meta, 0));

  let resolvedName = layoutName;
  if (slideIndex === 0) {
    resolvedName = wantsHero ? pickHeroTemplate(meta) : "title-only";
  } else {
    const slideCount = Number(meta?.slideCount) || 0;
    const wantsImageCadence =
      slideIndex > 0 && slideShouldHaveImage(meta, slideIndex, slideCount);

    if ((textAmount === "medium" || textAmount === "high") && !wantsImageCadence) {
      resolvedName = "text-focus-dense";
    } else if (textAmount === "low" && hasImage && mediaEnabled) {
      resolvedName = pickContentImageTemplate(slideIndex, meta);
    } else if (!resolvedName) {
      if (!mediaEnabled) {
        resolvedName = "title-content";
      } else if (textAmount === "low") {
        resolvedName = "content-image-right";
      } else if (textAmount === "high") {
        resolvedName = "two-column";
      } else {
        resolvedName = "content-image-right";
      }
    } else if (
      wantsImageCadence &&
      mediaEnabled &&
      (resolvedName === "title-content" || resolvedName === "visual-insight")
    ) {
      resolvedName = pickContentImageTemplate(slideIndex, meta);
    } else if (wantsImageCadence && mediaEnabled && hasImage) {
      resolvedName = pickContentImageTemplate(slideIndex, meta);
    }
  }

  const name = (resolvedName || "").toLowerCase().trim();
  const templateFn = TEMPLATE_MAP[name] ?? TEMPLATE_MAP[autoDetectLayout(elements)];

  try {
    const positioned = templateFn(elements, { meta, slideIndex });
    return positioned.map(clampElement);
  } catch (err) {
    console.warn("[layoutResolver] Template threw, applying fallback.", err);
    try {
      return TEMPLATE_MAP.fallback(elements, { meta, slideIndex }).map(clampElement);
    } catch {
      // Last resort: return elements unchanged so render never crashes
      return elements.map((el, i) =>
        clampElement({ ...el, x: 20, y: 28 + i * 80, width: 1015, height: 60 })
      );
    }
  }
};
