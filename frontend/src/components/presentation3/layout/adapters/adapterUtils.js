// adapters/adapterUtils.js
// Shared pure helpers for legacy ↔ Semantic IR translation.

import { GEOMETRY_KEYS, NARRATIVE_FLOWS } from "../semanticIR/constants.js";

/** @param {unknown} value */
export const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** @param {unknown} obj */
export const stripGeometry = (obj) => {
  if (!isPlainObject(obj)) return obj;
  const copy = { ...obj };
  for (const key of GEOMETRY_KEYS) {
    if (key in copy) delete copy[key];
  }
  return copy;
};

/** @param {unknown} slide */
export const cloneLegacySlide = (slide) => {
  if (!isPlainObject(slide)) return null;

  const elements = Array.isArray(slide.elements)
    ? slide.elements
    : Array.isArray(slide.layers)
      ? slide.layers
      : [];

  return {
    layout: typeof slide.layout === "string" ? slide.layout : "title-content",
    layoutType: slide.layoutType || slide.layout || "",
    intent: slide.intent || "content",
    density: slide.density || "medium",
    background: slide.background || slide.backgroundColor || slide.bg || "#ffffff",
    backgroundImage: slide.backgroundImage || slide.background_image || null,
    elements: elements.map((el) => (isPlainObject(el) ? { ...el } : el)),
    ...(typeof slide.title === "string" ? { title: slide.title } : {}),
    ...(typeof slide.id === "string" ? { id: slide.id } : {}),
  };
};

/** @param {unknown} el */
export const resolveElementRoleKey = (el) => {
  if (!isPlainObject(el)) return "";
  return String(el.role || el.type || "")
    .toLowerCase()
    .trim()
    .replace(/[-_\s]/g, "");
};

/** @param {unknown} el */
export const elementHasListContent = (el) => {
  if (!Array.isArray(el?.content)) return false;
  return el.content.some(
    (node) =>
      node?.type === "bulleted-list" ||
      node?.type === "numbered-list" ||
      node?.type === "list-item"
  );
};

/** @param {string} intent */
export const mapIntentToNarrativeFlow = (intent) => {
  const raw = String(intent || "content").toLowerCase().trim();
  if (NARRATIVE_FLOWS.includes(raw)) return raw;

  const aliases = {
    cover: "intro",
    title: "intro",
    hero: "intro",
    opening: "intro",
    closing: "summary",
    conclusion: "summary",
    compare: "comparison",
    comparing: "comparison",
    analyze: "analysis",
    analytics: "analysis",
  };

  return aliases[raw] || "content";
};

/** @param {string} density */
export const mapDensityToVisualIntent = (density) => {
  const raw = String(density || "medium").toLowerCase();
  if (raw === "low") return "visual-led";
  if (raw === "high") return "text-led";
  return "balanced";
};

/** @param {string|null|undefined} visualIntent */
export const mapVisualIntentToDensity = (visualIntent) => {
  if (visualIntent === "visual-led") return "low";
  if (visualIntent === "text-led") return "high";
  return "medium";
};

/** @param {unknown} slide */
export const ensureLegacySlideShape = (slide) => {
  const base = isPlainObject(slide) ? slide : {};

  const elements = Array.isArray(base.elements)
    ? base.elements
    : Array.isArray(base.layers)
      ? base.layers
      : [];

  return {
    layout:
      typeof base.layout === "string"
        ? base.layout.trim().toLowerCase()
        : "title-content",
    layoutType: base.layoutType || base.layout || "",
    intent: base.intent || "content",
    density: base.density || "medium",
    background: base.background || base.backgroundColor || base.bg || "#ffffff",
    backgroundImage: base.backgroundImage || base.background_image || null,
    elements: elements.filter((el) => el && typeof el === "object"),
    ...(typeof base.title === "string" ? { title: base.title } : {}),
    ...(typeof base.id === "string" ? { id: base.id } : {}),
  };
};
