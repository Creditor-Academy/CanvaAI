// adapters/semanticIRToLegacy.js
// Convert SemanticSlideIR → legacy-compatible slide input (no geometry).

import {
  ensureLegacySlideShape,
  isPlainObject,
  mapVisualIntentToDensity,
} from "./adapterUtils.js";

/** @param {import("../semanticIR/types.js").SemanticSlideIR} irSlide */
const elementsFromComponentGroups = (irSlide) => {
  if (!Array.isArray(irSlide?.componentGroups)) return [];

  const elements = [];

  for (const group of irSlide.componentGroups) {
    if (!isPlainObject(group) || !Array.isArray(group.content)) continue;

    for (const item of group.content) {
      if (!isPlainObject(item)) continue;
      const { role: _role, ...rest } = item;
      elements.push(rest);
    }
  }

  return elements;
};

/**
 * Convert Semantic IR slide back into legacy-compatible slide shape.
 *
 * @param {unknown} irSlide
 * @returns {Object}
 */
export const semanticIRToLegacySlide = (irSlide) => {
  if (!isPlainObject(irSlide)) {
    return ensureLegacySlideShape({});
  }

  if (isPlainObject(irSlide._legacy)) {
    const restored = ensureLegacySlideShape({ ...irSlide._legacy });

    if (irSlide.narrativeFlow) {
      restored.intent = irSlide.narrativeFlow;
    }

    const preferredTemplate = irSlide.layoutHints?.preferredTemplate;
    if (typeof preferredTemplate === "string" && preferredTemplate.trim()) {
      restored.layout = preferredTemplate.trim().toLowerCase();
      restored.layoutType = preferredTemplate;
    }

    if (irSlide.visualIntent) {
      restored.density = mapVisualIntentToDensity(irSlide.visualIntent);
    }

    if (
      Array.isArray(irSlide.emphasisHierarchy) &&
      irSlide.emphasisHierarchy[0] &&
      !restored.title
    ) {
      restored.title = irSlide.emphasisHierarchy[0];
    }

    return restored;
  }

  const preferredTemplate = irSlide.layoutHints?.preferredTemplate;
  const elements = elementsFromComponentGroups(irSlide);

  return ensureLegacySlideShape({
    layout:
      typeof preferredTemplate === "string" && preferredTemplate.trim()
        ? preferredTemplate
        : "title-content",
    layoutType: preferredTemplate || "",
    intent: irSlide.narrativeFlow || "content",
    density: mapVisualIntentToDensity(irSlide.visualIntent),
    background: "#ffffff",
    backgroundImage: null,
    elements,
    title: Array.isArray(irSlide.emphasisHierarchy) ? irSlide.emphasisHierarchy[0] : undefined,
    id: typeof irSlide.id === "string" ? irSlide.id : undefined,
  });
};
