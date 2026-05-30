// adapters/legacyToSemanticIR.js
// Convert one legacy AI slide → SemanticSlideIR (normalized).

import { isSemanticFeatureEnabled } from "../../../../config/semanticFeatureFlags.js";
import { normalizeSemanticIR } from "../semanticIR/normalizeSemanticIR.js";
import { SEMANTIC_IR_SCHEMA_VERSION } from "../semanticIR/constants.js";
import {
  cloneLegacySlide,
  resolveElementRoleKey,
  elementHasListContent,
  mapIntentToNarrativeFlow,
  mapDensityToVisualIntent,
  isPlainObject,
  stripGeometry,
} from "./adapterUtils.js";

const DENSITY_VALUES = new Set(["low", "medium", "high"]);

/** @param {string} layoutName */
const inferGroupsFromLayoutName = (layoutName) => {
  const layout = String(layoutName || "").toLowerCase();
  const types = [];

  if (layout.includes("comparison") || layout.includes("compare")) {
    types.push("ComparisonColumns");
  }
  if (layout.includes("process") || layout.includes("step")) {
    types.push("ProcessSteps");
  }
  if (layout.includes("quote")) {
    types.push("QuoteBlock");
  }
  if (
    layout.includes("metric") ||
    layout.includes("stat") ||
    layout.includes("chart")
  ) {
    types.push("MetricsGrid");
  }
  if (layout.includes("timeline")) {
    types.push("TimelineTrack");
  }

  return types;
};

/** @param {unknown} el */
const inferComponentTypeFromElement = (el) => {
  const key = resolveElementRoleKey(el);

  if (["title", "heading", "h1", "header"].includes(key)) return "TitleBlock";
  if (["subtitle", "subheading", "h2"].includes(key)) return "TitleBlock";
  if (
    ["bullet", "list", "bulleted", "numbered", "body", "text", "content", "paragraph"].includes(
      key
    ) &&
    elementHasListContent(el)
  ) {
    return "BulletCluster";
  }
  if (["image", "picture", "photo", "img", "visual"].includes(key)) {
    return "HeroVisual";
  }
  if (key.includes("quote")) return "QuoteBlock";
  if (key.includes("comparison") || key.includes("compare")) {
    return "ComparisonColumns";
  }
  if (key.includes("process") || key.includes("step")) return "ProcessSteps";
  if (key.includes("metric") || key.includes("stat")) return "MetricsGrid";
  if (key.includes("timeline")) return "TimelineTrack";

  if (elementHasListContent(el)) return "BulletCluster";
  if (key === "table") return "MetricsGrid";

  return null;
};

/** @param {unknown} el @param {string} type */
const elementToGroupContent = (el, type) => {
  const payload = stripGeometry(isPlainObject(el) ? { ...el } : {});
  return [{ role: resolveElementRoleKey(el) || type.toLowerCase(), ...payload }];
};

/**
 * @param {unknown[]} elements
 * @param {boolean} fullComposition
 * @param {string} layoutName
 */
const buildComponentGroups = (elements, fullComposition, layoutName) => {
  /** @type {Map<string, { type: string, priority: number, content: Object[] }>} */
  const groups = new Map();

  const addGroup = (type, el, priority) => {
    if (!type) return;

    const existing = groups.get(type);
    const contentEntry = elementToGroupContent(el, type);

    if (existing) {
      existing.content.push(...contentEntry);
      existing.priority = Math.min(existing.priority, priority);
      return;
    }

    groups.set(type, {
      type,
      priority,
      content: [...contentEntry],
    });
  };

  elements.forEach((el, index) => {
    if (!isPlainObject(el)) return;

    const type = inferComponentTypeFromElement(el);
    if (!type) return;

    if (!fullComposition) {
      if (type !== "TitleBlock" && type !== "BulletCluster" && type !== "HeroVisual") {
        return;
      }
    }

    addGroup(type, el, index);
  });

  if (fullComposition) {
    for (const type of inferGroupsFromLayoutName(layoutName)) {
      if (!groups.has(type)) {
        groups.set(type, { type, priority: 99, content: [] });
      }
    }
  }

  return Array.from(groups.values()).sort((a, b) => a.priority - b.priority);
};

/**
 * Convert one legacy AI slide into a normalized SemanticSlideIR.
 *
 * @param {unknown} slide
 * @param {Object} [meta]
 * @param {number} [slideIndex]
 * @returns {import("../semanticIR/types.js").SemanticSlideIR}
 */
export const legacySlideToSemanticIR = (slide, meta = {}, slideIndex = 0) => {
  const legacySnapshot = cloneLegacySlide(slide);
  const safeSlide = legacySnapshot || {
    layout: "title-content",
    layoutType: "",
    intent: "content",
    density: "medium",
    background: "#ffffff",
    backgroundImage: null,
    elements: [],
  };

  const elements = safeSlide.elements || [];
  const layoutName = safeSlide.layout || safeSlide.layoutType || "";
  const densityRaw = String(safeSlide.density || meta?.textAmount || "medium").toLowerCase();
  const density = DENSITY_VALUES.has(densityRaw) ? densityRaw : "medium";

  const fullComposition = isSemanticFeatureEnabled("ENABLE_COMPONENT_COMPOSITION");

  const slideFamily = slideIndex === 0 ? "Hero" : null;

  const partialSlide = {
    id: typeof safeSlide.id === "string" ? safeSlide.id : null,
    narrativeFlow: mapIntentToNarrativeFlow(safeSlide.intent),
    slideFamily,
    visualIntent: mapDensityToVisualIntent(density),
    importance: null,
    emphasisHierarchy: typeof safeSlide.title === "string" && safeSlide.title.trim()
      ? [safeSlide.title.trim()]
      : [],
    componentGroups: buildComponentGroups(elements, fullComposition, layoutName),
    layoutHints: {
      preferredTemplate: layoutName || null,
      density: density === "high" ? "dense" : density === "low" ? "compact" : "comfortable",
    },
    _legacy: legacySnapshot,
  };

  const deckWrapper = {
    schemaVersion: SEMANTIC_IR_SCHEMA_VERSION,
    deck: {
      topic: typeof meta?.topic === "string" ? meta.topic : "",
      presentationTitle:
        typeof meta?.presentationTitle === "string" ? meta.presentationTitle : "",
      tone: null,
      textAmount: DENSITY_VALUES.has(String(meta?.textAmount || "").toLowerCase())
        ? String(meta.textAmount).toLowerCase()
        : null,
    },
    slides: [partialSlide],
  };

  const normalizedDeck = normalizeSemanticIR(deckWrapper);
  return normalizedDeck.slides[0] || partialSlide;
};
