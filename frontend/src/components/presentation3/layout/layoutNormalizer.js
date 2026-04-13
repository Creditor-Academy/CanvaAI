// layout/layoutNormalizer.js
// Converts raw AI element objects → canonical internal element format.
// This is the ONLY place where AI naming inconsistencies are handled.
// x / y / width / height are intentionally NOT set here — that is the layout engine's job.

import { nanoid } from "nanoid";
import { ROLE_FONT_SIZE, ROLE_FONT_WEIGHT, ROLE_TEXT_ALIGN, ROLE_COLOR } from "./constants";
import { createInitialValue, convertTextToSlate } from "../editors/slate/slateHelpers";

// ─────────────────────────────────────────────────────────────
// Role alias table — maps every variant the AI might return
// to one of the six canonical roles
// ─────────────────────────────────────────────────────────────
const ROLE_ALIASES = {
  // heading variants
  title:        "heading",
  heading:      "heading",
  h1:           "heading",
  header:       "heading",
  // subheading variants
  subtitle:     "subheading",
  subheading:   "subheading",
  h2:           "subheading",
  subTitle:     "subheading",
  // eyebrow variants
  eyebrow:      "eyebrow",
  label:        "eyebrow",
  tag:          "eyebrow",
  category:     "eyebrow",
  // body variants
  text:         "body",
  body:         "body",
  content:      "body",
  paragraph:    "body",
  description:  "body",
  bulleted:     "body",
  numbered:     "body",
  list:         "body",
  bullet:       "body",
  // caption variants
  caption:      "caption",
  footer:       "caption",
  note:         "caption",
  // media
  image:        "image",
  picture:      "image",
  photo:        "image",
  img:          "image",
  // structural
  shape:        "shape",
  divider:      "shape",
  line:         "shape",
  rectangle:    "shape",
  table:        "table",
};

export const resolveRole = (el) => {
  const raw = (el.role || el.type || "").toLowerCase().trim().replace(/[-_\s]/g, "");
  return ROLE_ALIASES[raw] ?? "body";
};

// ─────────────────────────────────────────────────────────────
// Convert whatever the AI sent as "content" → valid Slate JSON
// ─────────────────────────────────────────────────────────────
const toSlateContent = (raw) => {
  if (!raw) return createInitialValue();
  if (typeof raw === "string") return convertTextToSlate(raw);
  if (Array.isArray(raw) && raw.length > 0) return raw; // already Slate
  if (typeof raw === "object" && (raw.text || raw.value)) {
    return convertTextToSlate(raw.text || raw.value);
  }
  return createInitialValue();
};

// ─────────────────────────────────────────────────────────────
// Normalize a single AI element → canonical element
// ─────────────────────────────────────────────────────────────
export const normalizeAIElement = (el) => {
  if (!el || typeof el !== "object") return null;

  const role = resolveRole(el);

  // ── IMAGE ─────────────────────────────────────────────────
  if (role === "image") {
    // src may arrive as a plain string OR as { url, key } object from the AI
    const rawSrc = el.src || el.url || el.imageUrl || el.image_url || null;
    const resolvedUrl =
      rawSrc && typeof rawSrc === "object" ? (rawSrc.url ?? null) : rawSrc;
    const resolvedKey =
      el.imageKey ||
      el.image_key ||
      (rawSrc && typeof rawSrc === "object" ? (rawSrc.key ?? null) : null);

    return {
      _id: nanoid(),
      role,
      type:         "image",
      src:          resolvedUrl,
      imageUrl:     el.imageUrl || resolvedUrl,
      imageKey:     resolvedKey,
      alt:          el.alt || "",
      rotation:     0,
      borderRadius: el.borderRadius ?? 0,
      borderWidth:  el.borderWidth  ?? 0,
      borderColor:  el.borderColor  ?? "#000000",
    };
  }

  // ── TABLE ─────────────────────────────────────────────────
  if (role === "table") {
    return {
      _id: nanoid(),
      role,
      type:        "table",
      rows:        el.rows    ?? 3,
      cols:        el.cols    ?? 3,
      cells:       el.cells   ?? null,    // normalizeTableLayer in store handles this
      borderColor: el.borderColor  ?? "#e5e7eb",
      borderWidth: el.borderWidth  ?? 1,
      tableBgColor: el.tableBgColor ?? "transparent",
      rotation: 0,
    };
  }

  // ── SHAPE ─────────────────────────────────────────────────
  if (role === "shape") {
    return {
      _id: nanoid(),
      role,
      type:        "shape",
      shapeType:   el.shapeType ?? el.shape_type ?? "rect",
      fillColor:   el.fillColor ?? el.fill   ?? "#e2e8f0",
      strokeColor: el.strokeColor ?? el.stroke ?? "#94a3b8",
      strokeWidth: el.strokeWidth ?? 1,
      rotation:    0,
    };
  }

  // ── TEXT (heading, subheading, eyebrow, body, caption) ────
  // Detect when the element IS itself a list node (type = numbered-list / bulleted-list)
  // and carries children directly — the AI sometimes sends the list as a top-level element
  // instead of wrapping it inside a { type: "text", content: [...] } layer.
  // In that case we must wrap the node itself into a Slate content array.
  const rawType = (el.type || "").toLowerCase().trim();
  const isDirectList =
    (rawType === "numbered-list" || rawType === "bulleted-list") &&
    Array.isArray(el.children);

  const resolvedContent = isDirectList
    ? [{ type: rawType, children: el.children }]
    : toSlateContent(el.content || el.text || el.value || "");

  return {
    _id:            nanoid(),
    role,
    type:           "text",
    content:        resolvedContent,
    fontSize:       el.fontSize   ?? ROLE_FONT_SIZE[role]   ?? ROLE_FONT_SIZE.fallback,
    fontFamily:     el.fontFamily ?? "Arial",
    fontWeight:     el.fontWeight ?? ROLE_FONT_WEIGHT[role] ?? "normal",
    fontStyle:      el.fontStyle  ?? "normal",
    textDecoration: el.textDecoration ?? "none",
    textAlign:      el.textAlign  ?? ROLE_TEXT_ALIGN[role]  ?? "left",
    color:          el.color      ?? ROLE_COLOR[role]       ?? "#334155",
    link:           el.link       ?? "",
    rotation:       0,
    hasBeenEdited:  true, // prevents placeholder text from showing
  };
};

// ─────────────────────────────────────────────────────────────
// Normalize all elements in one AI slide
// ─────────────────────────────────────────────────────────────
export const normalizeAISlide = (aiSlide) => {
  const rawElements = aiSlide.elements || aiSlide.layers || [];
  return rawElements
    .map(normalizeAIElement)
    .filter(Boolean); // drop any null results from bad elements
};
