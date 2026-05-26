// layout/layoutStrategyEngine.js — Gamma-style dynamic layout selection

/**
 * Canonical layout families returned by this module match keys in layoutTemplates.TEMPLATE_MAP
 * (resolver lowercases AI layout strings).
 */

import { pickHeroTemplate, pickContentImageTemplate } from "./layoutMirror";
import { slideShouldHaveImage } from "./layoutCadence";

export const LAYOUT_TYPES = {
  HERO_LAYOUT: "hero-image-right",
  HERO_LAYOUT_LEFT: "hero-image-left",
  IMAGE_RIGHT_CONTENT_LEFT: "content-image-right",
  IMAGE_LEFT_CONTENT_RIGHT: "content-image-left",
  CENTER_STAT_LAYOUT: "center-stat",
  TWO_COLUMN_LAYOUT: "two-column",
  TEXT_FOCUS_LAYOUT: "text-focus",
  VISUAL_INSIGHT_LAYOUT: "visual-insight",
};

const CANONICAL_MAP = {
  HERO_LAYOUT: "hero-image-right",
  HERO_LAYOUT_LEFT: "hero-image-left",
  IMAGE_RIGHT_CONTENT_LEFT: "content-image-right",
  IMAGE_LEFT_CONTENT_RIGHT: "content-image-left",
  IMAGE_RIGHT: "content-image-right",
  IMAGE_LEFT: "content-image-left",
  CENTER_STAT_LAYOUT: "center-stat",
  TWO_COLUMN_LAYOUT: "two-column",
  TEXT_FOCUS_LAYOUT: "text-focus",
  VISUAL_INSIGHT_LAYOUT: "visual-insight",
};

function normTextAmount(v) {
  const s = String(v || "medium").toLowerCase();
  return s === "low" || s === "high" ? s : "medium";
}

function resolveSlideCount(meta) {
  const n = Number(meta?.slideCount);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export { slideShouldHaveImage } from "./layoutCadence";

function mapAiLayoutToTemplate(layoutHint) {
  if (!layoutHint) return null;
  const key = String(layoutHint).trim().toUpperCase().replace(/-/g, "_");
  return CANONICAL_MAP[key] || null;
}

function rotateAway(previousTemplate, candidates) {
  if (!previousTemplate) return candidates[0];
  const alt = candidates.find((c) => c !== previousTemplate);
  return alt || candidates[0];
}

function inferIntent(aiSlide, normalizedElements) {
  const declared = String(aiSlide.intent || "").toLowerCase().trim();
  if (
    ["intro", "content", "analysis", "comparison", "summary"].includes(declared)
  ) {
    return declared;
  }

  const hasImage = normalizedElements.some(
    (e) => e.role === "image" || e.type === "image"
  );
  const bullets = normalizedElements.filter((e) => {
    const c = e.content?.[0];
    return (
      c?.type === "bulleted-list" || c?.type === "numbered-list"
    );
  });

  if (hasImage && bullets.length <= 1) return "analysis";
  if (bullets.length >= 2) return "comparison";
  return "content";
}

function calculateConfidence(intent, density, imageCount) {
  let score = 0.55;
  if (intent === "intro") score += 0.25;
  if (imageCount > 0) score += 0.15;
  if (density === "high") score += 0.1;
  return Math.min(score, 1);
}

/**
 * Decide layout template with slide-type awareness + non-consecutive diversity.
 *
 * @param {object} aiSlide raw slide from parser (still includes layoutType / intent)
 * @param {Array} normalizedElements output of normalizeAISlide
 * @param {object} meta presentation meta
 * @param {number} slideIndex zero-based
 * @param {string|null} previousTemplate template key chosen for prior slide
 */
export const selectLayoutStrategy = (
  aiSlide,
  normalizedElements = [],
  meta = {},
  slideIndex = -1,
  previousTemplate = null
) => {
  try {
    const density = normTextAmount(meta?.textAmount);
    const mediaEnabled = meta?.media?.enabled ?? true;
    const hasImageLayer = normalizedElements.some(
      (e) => e.role === "image" || e.type === "image"
    );
    const intent = inferIntent(aiSlide, normalizedElements);

    const cadenceWantsImage =
      mediaEnabled && slideShouldHaveImage(meta, slideIndex);
    const hasMedia = cadenceWantsImage && hasImageLayer;

    // ── Hero cover ─────────────────────────────────────────────
    if (slideIndex === 0) {
      const showHero = mediaEnabled && (hasImageLayer || cadenceWantsImage);
      return {
        template: showHero ? pickHeroTemplate(meta) : "title-only",
        density,
        intent: "intro",
        hasMedia: showHero,
        confidence: 1,
      };
    }

    const aiMapped = mapAiLayoutToTemplate(
      aiSlide.layoutType || aiSlide.layout || aiSlide.layoutHint
    );

    let template = aiMapped;
    const imageLayoutPool =
      density === "low"
        ? [
            LAYOUT_TYPES.IMAGE_RIGHT_CONTENT_LEFT,
            LAYOUT_TYPES.IMAGE_LEFT_CONTENT_RIGHT,
          ]
        : [
            LAYOUT_TYPES.IMAGE_RIGHT_CONTENT_LEFT,
            LAYOUT_TYPES.IMAGE_LEFT_CONTENT_RIGHT,
            LAYOUT_TYPES.VISUAL_INSIGHT_LAYOUT,
          ];

    // Low-density decks must stay visual — never route to text-only layouts.
    if (cadenceWantsImage) {
      const mirroredContent = pickContentImageTemplate(slideIndex, meta);
      if (
        !template ||
        template === LAYOUT_TYPES.HERO_LAYOUT ||
        template === LAYOUT_TYPES.HERO_LAYOUT_LEFT ||
        template === LAYOUT_TYPES.TEXT_FOCUS_LAYOUT ||
        template === LAYOUT_TYPES.CENTER_STAT_LAYOUT ||
        template === "title-content" ||
        template === "image-right" ||
        template === "image-left"
      ) {
        template = rotateAway(previousTemplate, imageLayoutPool);
      }
      if (
        template === LAYOUT_TYPES.IMAGE_RIGHT_CONTENT_LEFT ||
        template === LAYOUT_TYPES.IMAGE_LEFT_CONTENT_RIGHT ||
        template === "content-image-right" ||
        template === "content-image-left"
      ) {
        template = mirroredContent;
      }
    } else if (!cadenceWantsImage) {
      if (density === "high" || density === "medium") {
        template = "text-focus-dense";
      } else {
        const textCandidates = [
          LAYOUT_TYPES.TEXT_FOCUS_LAYOUT,
          LAYOUT_TYPES.CENTER_STAT_LAYOUT,
          LAYOUT_TYPES.TWO_COLUMN_LAYOUT,
        ];
        template = rotateAway(previousTemplate, textCandidates);
      }
    }

    // Intent-aware nudging (still respects cadence)
    if (cadenceWantsImage) {
      if (intent === "comparison") {
        template = rotateAway(previousTemplate, [
          LAYOUT_TYPES.TWO_COLUMN_LAYOUT,
          LAYOUT_TYPES.IMAGE_LEFT_CONTENT_RIGHT,
          LAYOUT_TYPES.IMAGE_RIGHT_CONTENT_LEFT,
        ]);
      } else if (intent === "summary") {
        template = rotateAway(previousTemplate, [
          LAYOUT_TYPES.IMAGE_RIGHT_CONTENT_LEFT,
          LAYOUT_TYPES.VISUAL_INSIGHT_LAYOUT,
          LAYOUT_TYPES.IMAGE_LEFT_CONTENT_RIGHT,
        ]);
      } else if (intent === "analysis") {
        template = rotateAway(previousTemplate, [
          LAYOUT_TYPES.VISUAL_INSIGHT_LAYOUT,
          LAYOUT_TYPES.IMAGE_RIGHT_CONTENT_LEFT,
          LAYOUT_TYPES.CENTER_STAT_LAYOUT,
        ]);
      } else {
        template = rotateAway(previousTemplate, [
          LAYOUT_TYPES.IMAGE_RIGHT_CONTENT_LEFT,
          LAYOUT_TYPES.IMAGE_LEFT_CONTENT_RIGHT,
          LAYOUT_TYPES.VISUAL_INSIGHT_LAYOUT,
        ]);
      }
    }

    if (template === previousTemplate) {
      const pool = cadenceWantsImage
        ? imageLayoutPool
        : density === "medium" || density === "high"
          ? ["text-focus-dense"]
          : [
              LAYOUT_TYPES.TEXT_FOCUS_LAYOUT,
              LAYOUT_TYPES.CENTER_STAT_LAYOUT,
              LAYOUT_TYPES.TWO_COLUMN_LAYOUT,
            ];
      template = rotateAway(previousTemplate, pool);
    }

    // Cadence mirror wins over intent rotation (slide_2 right, slide_4 left, …).
    if (cadenceWantsImage && hasMedia) {
      template = pickContentImageTemplate(slideIndex, meta);
    }

    return {
      template,
      density,
      intent,
      hasMedia,
      confidence: calculateConfidence(intent, density, hasImageLayer ? 1 : 0),
    };
  } catch (err) {
    console.error("[layoutStrategyEngine] Failed:", err);

    return {
      template: "title-content",
      density: "medium",
      intent: "fallback",
      hasMedia: false,
      confidence: 0.3,
    };
  }
};
