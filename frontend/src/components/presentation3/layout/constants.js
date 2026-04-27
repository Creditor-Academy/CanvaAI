// layout/constants.js
// Single source of truth for all slide geometry and spacing.
// All layout logic must import from here — never hardcode numbers elsewhere.

export const SLIDE = {
  WIDTH:  960,
  HEIGHT: 540,
};

// Outer margins — nothing should be placed outside this box
export const MARGIN = {
  TOP:    40,
  BOTTOM: 40,
  LEFT:   52,
  RIGHT:  52,
};

// Derived safe area (every layout MUST fit inside this)
export const SAFE = {
  X:      MARGIN.LEFT,
  Y:      MARGIN.TOP,
  WIDTH:  SLIDE.WIDTH  - MARGIN.LEFT - MARGIN.RIGHT,  // 856
  HEIGHT: SLIDE.HEIGHT - MARGIN.TOP  - MARGIN.BOTTOM, // 460
};

// Gaps between elements
export const GAP = {
  ELEMENT: 14,  // vertical space between stacked elements
  COLUMN:  32,  // horizontal space between columns
};

// Default reserved height per semantic role
// Layout templates use this when the AI did not provide an explicit height
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

// Font size per semantic role
export const ROLE_FONT_SIZE = {
  eyebrow:    13,
  heading:    44,
  subheading: 28,
  body:       18,
  caption:    13,
  fallback:   16,
};

// Font weight per role
export const ROLE_FONT_WEIGHT = {
  eyebrow:    "normal",
  heading:    "bold",
  subheading: "600",
  body:       "normal",
  caption:    "normal",
  fallback:   "normal",
};

// Text alignment defaults per role
export const ROLE_TEXT_ALIGN = {
  eyebrow:    "center",
  heading:    "center",
  subheading: "left",
  body:       "left",
  caption:    "left",
  fallback:   "left",
};

// Color defaults per role (light slide assumption)
export const ROLE_COLOR = {
  eyebrow:    "#6366f1",
  heading:    "#0f172a",
  subheading: "#1e293b",
  body:       "#334155",
  caption:    "#64748b",
  fallback:   "#334155",
};
