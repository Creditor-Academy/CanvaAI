// services/ai/aiLayoutService.js
// Single bridge between AI API responses and the layout engine.
// This is the only file that imports both the parser and the engine together.

import { parseAIPresentationResponse } from "./aiPPTParser";
import { applyLayoutToPresentation, applyLayoutToSlide } from "../../components/presentation3/layout/layoutEngine";

/**
 * Transform a raw full-presentation AI response → store-ready slide array.
 *
 * Usage (in AgentPanel or an AI service):
 *   const { title, slides } = buildLayoutFromAIResponse(apiResponse);
 *   setPresentation({ slides, title });
 *
 * @param {any} rawResponse — the direct API response object
 * @returns {{ title: string, slides: Array }}
 */
export const buildLayoutFromAIResponse = (rawResponse) => {
  const parsed = parseAIPresentationResponse(rawResponse);

  if (parsed.slides.length === 0) {
    console.warn("[aiLayoutService] No slides after parsing AI response.");
    return { title: parsed.title, slides: [] };
  }

  const slides = applyLayoutToPresentation(parsed);
  return { title: parsed.title, slides };
};

/**
 * Transform a single raw AI slide → store-ready slide.
 * Use when appending one AI-generated slide (AgentPanel generate-slide mode).
 *
 * @param {Object} rawSlide — one object from the AI slides array
 * @returns {Object}        — store-ready slide with layoutProcessed: true
 */
export const buildLayoutFromAISlide = (rawSlide) => {
  return applyLayoutToSlide(rawSlide, true);
};

// Re-export for convenience so callers don't need to import layoutEngine directly
export { applyLayoutToSlide };
