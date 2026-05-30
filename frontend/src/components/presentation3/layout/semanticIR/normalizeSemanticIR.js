// semanticIR/normalizeSemanticIR.js
// Pure normalization — never mutates input, never throws, no validation side effects.

import {
  SLIDE_FAMILIES,
  VISUAL_INTENTS,
  NARRATIVE_FLOWS,
  COMPONENT_GROUP_TYPES,
  GEOMETRY_KEYS,
  SEMANTIC_IR_SCHEMA_VERSION,
} from "./constants.js";
import { createEmptySemanticDeck, createEmptySemanticSlide } from "./schema.js";

/** @param {unknown} value */
const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** @param {unknown} value @param {readonly string[]} allowed */
const coerceEnum = (value, allowed) => {
  if (typeof value !== "string") return null;
  return allowed.includes(value) ? value : null;
};

/** @param {unknown} value @returns {number|null} */
const clampImportance = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

/** @param {unknown} group */
const normalizeComponentGroup = (group) => {
  if (!isPlainObject(group)) {
    return {
      type: null,
      priority: null,
      content: [],
    };
  }

  const normalized = {
    type: coerceEnum(group.type, COMPONENT_GROUP_TYPES),
    priority:
      typeof group.priority === "number" && !Number.isNaN(group.priority)
        ? group.priority
        : null,
    content: Array.isArray(group.content)
      ? group.content.filter((item) => item !== null && item !== undefined)
      : [],
  };

  if (isPlainObject(group._legacy)) {
    normalized._legacy = { ...group._legacy };
  }

  for (const key of GEOMETRY_KEYS) {
    if (key in normalized) delete normalized[key];
  }

  return normalized;
};

/** @param {unknown} slide */
const normalizeSlide = (slide) => {
  const base = createEmptySemanticSlide();

  if (!isPlainObject(slide)) return base;

  return {
    ...base,
    id: typeof slide.id === "string" ? slide.id : null,
    narrativeFlow: coerceEnum(slide.narrativeFlow, NARRATIVE_FLOWS),
    slideFamily: coerceEnum(slide.slideFamily, SLIDE_FAMILIES),
    visualIntent: coerceEnum(slide.visualIntent, VISUAL_INTENTS),
    importance: clampImportance(slide.importance),
    emphasisHierarchy: Array.isArray(slide.emphasisHierarchy)
      ? slide.emphasisHierarchy.filter((item) => typeof item === "string")
      : [],
    componentGroups: Array.isArray(slide.componentGroups)
      ? slide.componentGroups.map(normalizeComponentGroup)
      : [],
    layoutHints: isPlainObject(slide.layoutHints) ? { ...slide.layoutHints } : {},
    _legacy: isPlainObject(slide._legacy) ? { ...slide._legacy } : null,
  };
};

/** @param {unknown} deckMeta */
const normalizeDeckMeta = (deckMeta) => {
  const base = createEmptySemanticDeck().deck;

  if (!isPlainObject(deckMeta)) return base;

  const tone =
    typeof deckMeta.tone === "string" &&
    ["professional", "creative", "minimal", "corporate"].includes(deckMeta.tone)
      ? deckMeta.tone
      : null;

  const textAmount =
    typeof deckMeta.textAmount === "string" &&
    ["low", "medium", "high"].includes(deckMeta.textAmount)
      ? deckMeta.textAmount
      : null;

  return {
    topic: typeof deckMeta.topic === "string" ? deckMeta.topic : "",
    presentationTitle:
      typeof deckMeta.presentationTitle === "string"
        ? deckMeta.presentationTitle
        : "",
    tone,
    textAmount,
  };
};

/**
 * Normalize unsafe or partial Semantic IR into a stable Phase-1-safe structure.
 *
 * @param {unknown} ir
 * @returns {import("./types.js").SemanticDeckIR}
 */
export const normalizeSemanticIR = (ir) => {
  const empty = createEmptySemanticDeck();

  if (!isPlainObject(ir)) return empty;

  const schemaVersion =
    typeof ir.schemaVersion === "string"
      ? ir.schemaVersion
      : SEMANTIC_IR_SCHEMA_VERSION;

  return {
    schemaVersion,
    deck: normalizeDeckMeta(ir.deck),
    slides: Array.isArray(ir.slides) ? ir.slides.map(normalizeSlide) : [],
  };
};
