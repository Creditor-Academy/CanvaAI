/**
 * Re-run layout templates on store-ready slides (fixes stale x/y from saves or backend hints).
 */
import { applyLayoutToSlide } from "./layoutEngine";

export const reapplyPresentationLayout = (presentation, meta = {}) => {
  const slides = presentation?.slides || [];
  if (!slides.length) return slides;

  let previousTemplate = null;
  return slides.map((slide, index) => {
    const aiSlide = {
      id: slide.id,
      layout: slide.layoutTemplate || slide.layout,
      layoutType: slide.layoutTemplate || slide.layoutType,
      intent: slide.intent,
      background: slide.background,
      backgroundImage: slide.backgroundImage,
      elements: slide.layers || slide.elements || [],
    };

    const packed = applyLayoutToSlide(
      aiSlide,
      meta || presentation.meta || {},
      false,
      index,
      previousTemplate
    );
    previousTemplate = packed.layoutTemplate;
    return {
      ...slide,
      ...packed,
      meta: { ...(slide.meta || {}), isAIGenerated: slide.meta?.isAIGenerated },
    };
  });
};
