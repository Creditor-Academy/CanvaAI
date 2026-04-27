// layout/layoutResolver.js
// Picks the correct template for a given layout name and applies it.
// If the layout name is unknown or the template throws, falls back gracefully.

import { TEMPLATE_MAP } from "./layoutTemplates";

// ─────────────────────────────────────────────────────────────
// Auto-detect best layout when AI gave no layout or unknown name
// ─────────────────────────────────────────────────────────────
const autoDetectLayout = (elements) => {
  const hasImage   = elements.some((e) => e.role === "image" || e.type === "image");
  const count      = elements.length;
  const hasHeading = elements.some((e) => e.role === "heading");

  if (count === 1)                   return "title-only";
  if (count === 2 && hasHeading)     return "title-only";  // heading + subtitle
  if (hasImage && count <= 4)        return "image-left";
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
export const resolveLayout = (layoutName, elements) => {
  if (!elements || elements.length === 0) return [];

  const name       = (layoutName || "").toLowerCase().trim();
  const templateFn = TEMPLATE_MAP[name] ?? TEMPLATE_MAP[autoDetectLayout(elements)];

  try {
    const positioned = templateFn(elements);
    return positioned.map(clampElement);
  } catch (err) {
    console.warn("[layoutResolver] Template threw, applying fallback.", err);
    try {
      return TEMPLATE_MAP.fallback(elements).map(clampElement);
    } catch {
      // Last resort: return elements unchanged so render never crashes
      return elements.map((el, i) => clampElement({ ...el, x: 52, y: 40 + i * 80, width: 856, height: 60 }));
    }
  }
};
