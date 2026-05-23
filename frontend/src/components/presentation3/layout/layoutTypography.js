// Canonical font sizes derived from hand-tuned AI presentations

export const LAYOUT_TYPOGRAPHY = {
  "hero-image-right": {
    heading: { fontSize: 44, fontWeight: "bold" },
    body: { fontSize: 18, fontWeight: "normal" },
    list: { fontSize: 18, fontWeight: "normal" },
  },
  "content-image-right": {
    heading: { fontSize: 28, fontWeight: "bold" },
    body: { fontSize: 17, fontWeight: "normal" },
    list: { fontSize: 17, fontWeight: "normal" },
  },
  "content-image-left": {
    heading: { fontSize: 28, fontWeight: "bold" },
    body: { fontSize: 17, fontWeight: "normal" },
    list: { fontSize: 17, fontWeight: "normal" },
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

const TEXT_AMOUNT_FONT_SCALE = {
  low: { heading: 1, body: 1, list: 1 },
  medium: { heading: 0.96, body: 0.94, list: 0.94 },
  high: { heading: 0.84, body: 0.72, list: 0.66 },
};

const scaleTypo = (typo, factor) => ({
  ...typo,
  fontSize: Math.max(10, Math.round(typo.fontSize * factor)),
});

export const getTypographyForRole = (templateName, role, isHero = false, meta = {}) => {
  if (isHero) {
    const hero = LAYOUT_TYPOGRAPHY["hero-image-right"];
    if (role === "heading" || role === "title") return hero.heading;
    if (role === "list") return hero.list;
    return hero.body;
  }
  const key = (templateName || "").toLowerCase().trim();
  const sheet = LAYOUT_TYPOGRAPHY[key] || LAYOUT_TYPOGRAPHY.default;
  let base;
  if (role === "heading" || role === "title") base = sheet.heading;
  else if (role === "list") base = sheet.list;
  else base = sheet.body;

  const amount = String(meta?.textAmount || "medium").toLowerCase();
  const factors = TEXT_AMOUNT_FONT_SCALE[amount] || TEXT_AMOUNT_FONT_SCALE.medium;
  const factor =
    role === "heading" || role === "title"
      ? factors.heading
      : role === "list"
        ? factors.list
        : factors.body;

  return scaleTypo(base, factor);
};
