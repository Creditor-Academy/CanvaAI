// services/ai/aiPPTParser.js
// Validates and sanitizes raw AI JSON responses BEFORE they enter the layout engine.
// Acts as a defensive input boundary — all AI inconsistencies must be caught here.

/**
 * Sanitize a single slide object from the AI, filling safe defaults where missing.
 */
const sanitizeSlide = (slide, index) => {
  if (!slide || typeof slide !== "object") {
    console.warn(`[aiPPTParser] Slide at index ${index} is invalid, substituting empty slide.`);
    return {
      layout: "title-content",
      layoutType: "",
      intent: "content",
      density: "medium",
      background: "#ffffff",
      backgroundImage: null,
      elements: [],
    };
  }

  // Accept "elements" or "layers" — layout engine uses "elements"
  const elements = Array.isArray(slide.elements)
    ? slide.elements
    : Array.isArray(slide.layers)
    ? slide.layers
    : [];

  return {
    layout:          typeof slide.layout === "string" ? slide.layout.trim().toLowerCase() : "title-content",
    layoutType:      slide.layoutType || slide.layout || "",
    intent:          slide.intent || "content",
    density:         slide.density || "medium",
    background:      slide.background || slide.backgroundColor || slide.bg || "#ffffff",
    backgroundImage: slide.backgroundImage || slide.background_image || null,
    elements:        elements.filter((el) => el && typeof el === "object"),
  };
};

/**
 * Parse and sanitize a full AI presentation response.
 *
 * Handles:
 *   • JSON strings (some AI endpoints return raw JSON text)
 *   • Nested wrappers: { success, data: { slides } }
 *   • Top-level arrays
 *   • Missing title fields
 *
 * @param {any} raw — whatever the AI API returned
 * @returns {{ title: string, slides: Array }} — clean, safe structure
 */
export const parseAIPresentationResponse = (raw) => {
  // ── Unwrap string ───────────────────────────────────────────
  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("[aiPPTParser] Could not parse AI response string.");
      return { slides: [], title: "Untitled Presentation", meta: {} };
    }
  }

  // Preserve meta if it exists at top level or inside nested data wrapper
  let meta = data?.meta || {};

  // ── Unwrap common API wrappers ──────────────────────────────
  if (data?.data?.slides) {
    if (data.meta) meta = data.meta;
    else if (data.data?.meta) meta = data.data.meta;
    data = data.data;
  }
  if (data?.result?.slides) {
    if (data.meta) meta = data.meta;
    else if (data.result?.meta) meta = data.result.meta;
    data = data.result;
  }
  if (data?.payload?.slides) {
    if (data.meta) meta = data.meta;
    else if (data.payload?.meta) meta = data.payload.meta;
    data = data.payload;
  }

  // ── Extract slides array ────────────────────────────────────
  const rawSlides = Array.isArray(data?.slides)
    ? data.slides
    : Array.isArray(data)
    ? data
    : [];

  if (rawSlides.length === 0) {
    console.warn("[aiPPTParser] No slides found in AI response:", data);
  }

  const topic =
    data?.topic ||
    meta?.topic ||
    data?.meta?.topic;

  const title =
    (typeof meta?.presentationTitle === "string" && meta.presentationTitle.trim()) ||
    (typeof data?.presentationTitle === "string" && data.presentationTitle.trim()) ||
    (typeof data?.title === "string" && data.title.trim()) ||
    (typeof data?.name === "string" && data.name.trim()) ||
    (typeof topic === "string" && topic.trim()) ||
    "Untitled Presentation";

  return {
    title: typeof title === "string" ? title.trim() : "Untitled Presentation",
    slides: rawSlides.map(sanitizeSlide),
    meta:   data?.meta || meta,
  };
};
