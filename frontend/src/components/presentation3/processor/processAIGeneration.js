// processor/processAIGeneration.js
// The single entry point for all AI→slide transformations.
// Called exclusively from AgentPanel.jsx (and any future AI generation triggers).
//
// Full pipeline:
//   AI API response
//     → parseAIPresentationResponse  (validate / sanitize shape)
//     → normalizeAIElement            (canonical element format)
//     → resolveLayout                 (pick template)
//     → layoutTemplates               (assign x, y, width, height)
//     → applyLayoutToSlide            (set layoutProcessed: true)
//     → usePresentationStore          (append / load)
//     → auto-save hook                (persist with layoutProcessed flag)

import { buildLayoutFromAIResponse, buildLayoutFromAISlide } from "../../../services/ai/aiLayoutService";

/**
 * Process a full AI-generated presentation and load it into the store.
 *
 * @param {any}    rawResponse  — raw AI API response
 * @param {Object} storeActions — { setPresentation, setTitle }
 * @returns {boolean}           — true on success
 */
export const processFullAIPresentation = (rawResponse, { setPresentation, setTitle }) => {
  try {
    const { title, slides } = buildLayoutFromAIResponse(rawResponse);

    if (!slides || slides.length === 0) {
      console.warn("[processAIGeneration] No slides produced from AI response.");
      return false;
    }

    if (setTitle)        setTitle(title);
    if (setPresentation) setPresentation({ slides, title });
    return true;
  } catch (err) {
    console.error("[processAIGeneration] processFullAIPresentation failed:", err);
    return false;
  }
};

/**
 * Process and append a single AI-generated slide to the current presentation.
 * The slide passes through the full layout engine before reaching the store.
 *
 * @param {Object}   rawSlide    — one raw AI slide object (e.g. res.data)
 * @param {Function} appendSlide — usePresentationStore.appendSlide
 * @returns {Object|null}        — final slide object, or null on failure
 */
export const processAndAppendAISlide = (rawSlide, appendSlide) => {
  try {
    // If the AI wrapped the slide in a { success, data } envelope, unwrap it
    const slide = rawSlide?.data ?? rawSlide;

    const processedSlide = buildLayoutFromAISlide(slide);
    appendSlide(processedSlide);
    return processedSlide;
  } catch (err) {
    console.error("[processAIGeneration] processAndAppendAISlide failed:", err);
    return null;
  }
};

/**
 * Process and append AI-generated layers to an existing slide.
 * Unlike processAndAppendAISlide, this does NOT create a new slide —
 * it adds layers (e.g. from expand-slide mode) through the store directly.
 *
 * Layout is applied per-layer relative to the currently occupied space
 * on the target slide. For simplicity, this uses the store's
 * appendLayersToSlide which runs normalizeLayer (not the full layout engine),
 * since expand-slide layers typically already carry positions from the AI.
 *
 * @param {Object}   rawData              — AI API result for expand-slide
 * @param {string}   slideId              — target slide id
 * @param {Function} appendLayersToSlide  — usePresentationStore.appendLayersToSlide
 * @returns {boolean}
 */
export const processAndAppendAILayers = (rawData, slideId, appendLayersToSlide) => {
  try {
    appendLayersToSlide(slideId, rawData);
    return true;
  } catch (err) {
    console.error("[processAIGeneration] processAndAppendAILayers failed:", err);
    return false;
  }
};
