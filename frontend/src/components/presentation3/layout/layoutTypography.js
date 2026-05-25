// Canonical font sizes — non-hero body/list are fixed at 20px for readability.

export const HERO_BODY_FONT = 18;
export const CONTENT_BODY_FONT = 20;
export const CONTENT_LIST_FONT = 20;

export const LAYOUT_TYPOGRAPHY = {
  "hero-image-right": {
    heading: { fontSize: 44, fontWeight: "bold" },
    body: { fontSize: HERO_BODY_FONT, fontWeight: "normal" },
    list: { fontSize: HERO_BODY_FONT, fontWeight: "normal" },
  },
  "hero-image-left": {
    heading: { fontSize: 44, fontWeight: "bold" },
    body: { fontSize: HERO_BODY_FONT, fontWeight: "normal" },
    list: { fontSize: HERO_BODY_FONT, fontWeight: "normal" },
  },
  "content-image-right": {
    heading: { fontSize: 28, fontWeight: "bold" },
    body: { fontSize: CONTENT_BODY_FONT, fontWeight: "normal" },
    list: { fontSize: CONTENT_LIST_FONT, fontWeight: "normal" },
  },
  "content-image-left": {
    heading: { fontSize: 28, fontWeight: "bold" },
    body: { fontSize: CONTENT_BODY_FONT, fontWeight: "normal" },
    list: { fontSize: CONTENT_LIST_FONT, fontWeight: "normal" },
  },
  "image-right": {
    heading: { fontSize: 30, fontWeight: "bold" },
    body: { fontSize: CONTENT_BODY_FONT, fontWeight: "normal" },
    list: { fontSize: CONTENT_LIST_FONT, fontWeight: "normal" },
  },
  "image-left": {
    heading: { fontSize: 28, fontWeight: "bold" },
    body: { fontSize: CONTENT_BODY_FONT, fontWeight: "normal" },
    list: { fontSize: CONTENT_LIST_FONT, fontWeight: "normal" },
  },
  "visual-insight": {
    heading: { fontSize: 28, fontWeight: "bold" },
    body: { fontSize: CONTENT_BODY_FONT, fontWeight: "normal" },
    list: { fontSize: CONTENT_LIST_FONT, fontWeight: "normal" },
  },
  "text-focus": {
    heading: { fontSize: 28, fontWeight: "bold" },
    body: { fontSize: CONTENT_BODY_FONT, fontWeight: "normal" },
    list: { fontSize: CONTENT_LIST_FONT, fontWeight: "normal" },
  },
  "text-focus-dense": {
    heading: { fontSize: 28, fontWeight: "bold" },
    body: { fontSize: CONTENT_BODY_FONT, fontWeight: "normal" },
    list: { fontSize: CONTENT_LIST_FONT, fontWeight: "normal" },
  },
  "title-content": {
    heading: { fontSize: 30, fontWeight: "bold" },
    body: { fontSize: CONTENT_BODY_FONT, fontWeight: "normal" },
    list: { fontSize: CONTENT_LIST_FONT, fontWeight: "normal" },
  },
  "two-column": {
    heading: { fontSize: 28, fontWeight: "bold" },
    body: { fontSize: CONTENT_BODY_FONT, fontWeight: "normal" },
    list: { fontSize: CONTENT_LIST_FONT, fontWeight: "normal" },
  },
  default: {
    heading: { fontSize: 28, fontWeight: "bold" },
    body: { fontSize: CONTENT_BODY_FONT, fontWeight: "normal" },
    list: { fontSize: CONTENT_LIST_FONT, fontWeight: "normal" },
  },
};

/** Heading-only scale for high density (body/list stay 20px). */
const HEADING_SCALE_BY_AMOUNT = {
  low: 1,
  medium: 0.96,
  high: 0.92,
};

export const getTypographyForRole = (templateName, role, isHero = false, meta = {}) => {
  if (isHero) {
    const heroKey = (templateName || "").includes("left")
      ? "hero-image-left"
      : "hero-image-right";
    const hero = LAYOUT_TYPOGRAPHY[heroKey] || LAYOUT_TYPOGRAPHY["hero-image-right"];
    if (role === "heading" || role === "title") return hero.heading;
    if (role === "list") return hero.list;
    return hero.body;
  }

  const key = (templateName || "").toLowerCase().trim();
  const sheet = LAYOUT_TYPOGRAPHY[key] || LAYOUT_TYPOGRAPHY.default;

  if (role === "heading" || role === "title") {
    const amount = String(meta?.textAmount || "medium").toLowerCase();
    const factor = HEADING_SCALE_BY_AMOUNT[amount] ?? 1;
    return {
      ...sheet.heading,
      fontSize: Math.max(22, Math.round(sheet.heading.fontSize * factor)),
    };
  }

  if (role === "list") return sheet.list;
  return sheet.body;
};
