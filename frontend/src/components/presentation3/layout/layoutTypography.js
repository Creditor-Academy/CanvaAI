// Canonical font sizes derived from hand-tuned AI presentations

export const LAYOUT_TYPOGRAPHY = {
  "hero-image-right": {
    heading: { fontSize: 44, fontWeight: "bold" },
    body: { fontSize: 18, fontWeight: "normal" },
    list: { fontSize: 18, fontWeight: "normal" },
  },
  "image-right": {
    heading: { fontSize: 30, fontWeight: "bold" },
    body: { fontSize: 18, fontWeight: "normal" },
    list: { fontSize: 18, fontWeight: "normal" },
  },
  "image-left": {
    heading: { fontSize: 28, fontWeight: "bold" },
    body: { fontSize: 17, fontWeight: "normal" },
    list: { fontSize: 17, fontWeight: "normal" },
  },
  "visual-insight": {
    heading: { fontSize: 28, fontWeight: "bold" },
    body: { fontSize: 17, fontWeight: "normal" },
    list: { fontSize: 17, fontWeight: "normal" },
  },
  "text-focus": {
    heading: { fontSize: 28, fontWeight: "bold" },
    body: { fontSize: 17, fontWeight: "normal" },
    list: { fontSize: 17, fontWeight: "normal" },
  },
  "title-content": {
    heading: { fontSize: 30, fontWeight: "bold" },
    body: { fontSize: 18, fontWeight: "normal" },
    list: { fontSize: 18, fontWeight: "normal" },
  },
  "two-column": {
    heading: { fontSize: 28, fontWeight: "bold" },
    body: { fontSize: 17, fontWeight: "normal" },
    list: { fontSize: 17, fontWeight: "normal" },
  },
  default: {
    heading: { fontSize: 28, fontWeight: "bold" },
    body: { fontSize: 18, fontWeight: "normal" },
    list: { fontSize: 18, fontWeight: "normal" },
  },
};

export const getTypographyForRole = (templateName, role, isHero = false) => {
  if (isHero) {
    const hero = LAYOUT_TYPOGRAPHY["hero-image-right"];
    if (role === "heading" || role === "title") return hero.heading;
    if (role === "list") return hero.list;
    return hero.body;
  }
  const key = (templateName || "").toLowerCase().trim();
  const sheet = LAYOUT_TYPOGRAPHY[key] || LAYOUT_TYPOGRAPHY.default;
  if (role === "heading" || role === "title") return sheet.heading;
  if (role === "list") return sheet.list;
  return sheet.body;
};
