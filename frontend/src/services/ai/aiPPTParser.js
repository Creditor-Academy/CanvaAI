// services/ai/aiPPTParser.js
// Validates and sanitizes raw AI JSON responses BEFORE they enter the layout engine.
// Acts as a defensive input boundary — all AI inconsistencies must be caught here.

/**
 * Sanitize a single slide object from the AI, filling safe defaults where missing.
 */
const sanitizeSlide = (slide, index) => {
  if (!slide || typeof slide !== "object") {
    console.warn(`[aiPPTParser] Slide at index ${index} is invalid, substituting empty slide.`);
    return { layout: "title-content", elements: [] };
  }

  // Accept "elements" or "layers" — layout engine uses "elements"
  const elements = Array.isArray(slide.elements)
    ? slide.elements
    : Array.isArray(slide.layers)
    ? slide.layers
    : [];

  return {
    layout:          typeof slide.layout === "string" ? slide.layout.trim().toLowerCase() : "title-content",
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
      return { slides: [], title: "Untitled Presentation" };
    }
  }

  // ── Unwrap common API wrappers ──────────────────────────────
  if (data?.data?.slides)   data = data.data;
  if (data?.result?.slides) data = data.result;
  if (data?.payload?.slides) data = data.payload;

  // ── Extract slides array ────────────────────────────────────
  const rawSlides = Array.isArray(data?.slides)
    ? data.slides
    : Array.isArray(data)
    ? data
    : [];

  if (rawSlides.length === 0) {
    console.warn("[aiPPTParser] No slides found in AI response:", data);
  }

  return {
    title:  data?.title || data?.name || data?.presentationTitle || "Untitled Presentation",
    slides: rawSlides.map(sanitizeSlide),
  };
};
