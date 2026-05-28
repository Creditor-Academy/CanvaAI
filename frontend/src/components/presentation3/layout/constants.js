// layout/constants.js
// Single source of truth for slide geometry (design canvas: 1055 × 594).

export const SLIDE = {
  WIDTH:  1055,
  HEIGHT: 594,
};

/** Tight editorial margins — content uses ~95% of slide width */
export const MARGIN = {
  TOP:    28,
  BOTTOM: 28,
  LEFT:   20,
  RIGHT:  20,
};

export const SAFE = {
  X:      MARGIN.LEFT,
  Y:      MARGIN.TOP,
  WIDTH:  SLIDE.WIDTH - MARGIN.LEFT - MARGIN.RIGHT,
  HEIGHT: SLIDE.HEIGHT - MARGIN.TOP - MARGIN.BOTTOM,
};

export const GAP = {
  ELEMENT: 12,
  COLUMN:  24,
};

/** Hero: full-height image flush on the right edge */
export const HERO_IMAGE = {
  WIDTH:  Math.round(SLIDE.WIDTH * 0.38),
  HEIGHT: SLIDE.HEIGHT,
  X:      SLIDE.WIDTH - Math.round(SLIDE.WIDTH * 0.38),
  Y:      0,
};

export const HERO_TEXT = {
  X:      MARGIN.LEFT,
  Y:      40,
  WIDTH:  HERO_IMAGE.X - MARGIN.LEFT - GAP.COLUMN,
};

/** Mirrored hero — image flush left, text on the right */
export const HERO_IMAGE_LEFT = {
  WIDTH:  HERO_IMAGE.WIDTH,
  X:      MARGIN.LEFT,
  Y:      0,
  HEIGHT: SLIDE.HEIGHT,
};

export const HERO_TEXT_RIGHT = {
  X:      HERO_IMAGE_LEFT.WIDTH + MARGIN.LEFT + GAP.COLUMN,
  Y:      40,
  WIDTH:
    SLIDE.WIDTH -
    HERO_IMAGE_LEFT.WIDTH -
    MARGIN.LEFT -
    GAP.COLUMN -
    MARGIN.RIGHT,
};

/** Content slides — hero-style full-height image on the edge (matches HERO_IMAGE) */
export const CONTENT_IMAGE = {
  RIGHT: {
    WIDTH:  HERO_IMAGE.WIDTH,
    X:      HERO_IMAGE.X,
    Y:      0,
    HEIGHT: SLIDE.HEIGHT,
    RADIUS: 0,
  },
  LEFT: {
    X:      MARGIN.LEFT,
    WIDTH:  HERO_IMAGE.WIDTH,
    Y:      0,
    HEIGHT: SLIDE.HEIGHT,
    RADIUS: 0,
  },
};

/** Text column when image is hero-style on the right */
export const CONTENT_TEXT = {
  X: HERO_TEXT.X,
  WIDTH: HERO_TEXT.WIDTH,
};

export const ROLE_HEIGHT = {
  eyebrow:    28,
  heading:    72,
  subheading: 48,
  body:       140,
  caption:    30,
  image:      260,
  table:      180,
  shape:      80,
  fallback:   60,
};

export const ROLE_FONT_SIZE = {
  eyebrow:    12,
  heading:    28,
  subheading: 22,
  body:       17,
  caption:    12,
  fallback:   17,
};

export const ROLE_FONT_WEIGHT = {
  eyebrow:    "normal",
  heading:    "bold",
  subheading: "600",
  body:       "normal",
  caption:    "normal",
  fallback:   "normal",
};

export const ROLE_TEXT_ALIGN = {
  eyebrow:    "center",
  heading:    "center",
  subheading: "left",
  body:       "left",
  caption:    "left",
  fallback:   "left",
};

export const ROLE_COLOR = {
  eyebrow:    "#6366f1",
  heading:    "#0f172a",
  subheading: "#1e293b",
  body:       "#334155",
  caption:    "#64748b",
  fallback:   "#334155",
};

export const DEFAULT_THEME = {
  titleColor: "#0f172a",
  bodyColor:  "#334155",
};
