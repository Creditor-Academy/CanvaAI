// layout/layoutEngine.js
// Public API of the entire layout system.
//
// ┌──────────────────────────────────────────────────────────┐
// │  IMPORTANT — call these functions ONLY from:             │
// │    processor/processAIGeneration.js                      │
// │                                                          │
// │  NEVER call from:                                        │
// │    • Rendering components                                │
// │    • Store setPresentation / normalizeSlide              │
// │    • useEffect / event handlers inside the canvas        │
// └──────────────────────────────────────────────────────────┘
//
// Every slide produced here carries `layoutProcessed: true`.
// The store checks that flag in normalizeSlide and skips all
// further normalization, so saved positions are never overwritten.

import { nanoid } from "nanoid";
import { normalizeAISlide } from "./layoutNormalizer";
import { resolveLayout } from "./layoutResolver";

/**
 * Convert one AI slide JSON object → a store-ready slide.
 *
 * @param {Object}  aiSlide     — one slide from the AI response
 * @param {boolean} forceNewId  — generate a fresh id (always true for AI slides)
 * @returns {Object}            — slide ready for usePresentationStore.appendSlide()
 */
export const applyLayoutToSlide = (aiSlide, forceNewId = true) => {
  if (!aiSlide || typeof aiSlide !== "object") {
    throw new Error("[layoutEngine] applyLayoutToSlide received invalid input.");
  }

  // Step 1: normalize all elements to canonical format
  const normalizedElements = normalizeAISlide(aiSlide);

  // Step 2: resolve layout template → assign x, y, width, height
  const positionedElements = resolveLayout(aiSlide.layout, normalizedElements);

  // Step 3: strip internal-only helpers and assign real layer ids
  const layers = positionedElements.map(({ _id, _reservedHeight, role, ...layer }) => ({
    ...layer,
    id: nanoid(),          // store always uses `id`
    // keep `role` stripped — it is a layout concept, not a render concept
  }));

  return {
    id:              forceNewId ? nanoid() : (aiSlide.id || nanoid()),
    background:      aiSlide.background || aiSlide.backgroundColor || "#ffffff",
    backgroundImage: aiSlide.backgroundImage || null,
    layers,
    layoutProcessed: true,  // ← guard flag — store normalizeSlide must respect this
  };
};

/**
 * Convert a full AI presentation response → array of store-ready slides.
 *
 * @param {Object} aiResponse  — full AI response (must have .slides array)
 * @returns {Array}            — slides ready for the store
 */
export const applyLayoutToPresentation = (aiResponse) => {
  const rawSlides =
    aiResponse.slides        ||
    aiResponse.data?.slides  ||
    [];

  return rawSlides.map((slide) => applyLayoutToSlide(slide, true));
};
