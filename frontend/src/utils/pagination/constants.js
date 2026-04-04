/**
 * constants.js — Single source of truth for all page dimensions.
 *
 * ── RULE ──────────────────────────────────────────────────────────────────────
 * Every value here has an exact CSS counterpart in real-pagination.css.
 * Change one → change both. Drift = empty space or content overflow.
 *
 * ── PAGE GEOMETRY ─────────────────────────────────────────────────────────────
 * Custom large page: 794 × 1208 px (with comfortable top margin)
 * Margins:           30 px top, 0 bottom, 72 px left/right
 * Usable area:       650 × 1178 px
 *
 *   USABLE_HEIGHT = 1208 − 30 − 0 = 1178 px
 *
 * ── TYPOGRAPHY ────────────────────────────────────────────────────────────────
 * CSS:  font-size: 11pt  →  11 × (96/72) = 14.667 px at 96 DPI
 *       line-height: 1.6 →  14.667 × 1.6 = 23.47 px  → ceil = 24 px
 *       paragraph margin-bottom: 1em = 14.667 px → ceil = 15 px
 *       usable width: 650 px, avg Inter char @11pt ≈ 7.07 px → 92 chars/line
 *
 * ── LINE CAPACITY VERIFICATION ────────────────────────────────────────────────
 * lines/page = floor((1178 − 15) / 24) = floor(1163 / 24) = 48 lines
 * height used = 48 × 24 + 15 = 1167 px
 * natural buffer = 1178 − 1167 = 11 px  ← enough, no artificial reduction needed
 *
 * ── RESPONSIVE DESIGN ─────────────────────────────────────────────────────────
 * On mobile devices, CSS media queries adjust:
 *   • Font sizes scale down (14.667px → 13.5px → 12.5px → 11.5px)
 *   • Line heights adjust proportionally
 *   • Side margins reduce for better space utilization
 *   • Page widths become fluid (100% with max-width constraint)
 * The JS pagination engine uses these base constants; CSS handles visual scaling.
 */

// ── A4-custom page dimensions ─────────────────────────────────────────────────
// Standard A4 dimensions at 96 DPI
export const A4_HEIGHT_PX = 1123;
export const A4_WIDTH_PX  = 794;

// ── Margins — MUST match .page padding in real-pagination.css ─────────────────
export const PAGE_MARGIN_TOP_PX    = 96;
export const PAGE_MARGIN_BOTTOM_PX = 96;
export const PAGE_MARGIN_LEFT_PX   = 96;
export const PAGE_MARGIN_RIGHT_PX  = 96;

// ── Derived usable area ───────────────────────────────────────────────────────
export const USABLE_HEIGHT_PX = A4_HEIGHT_PX - PAGE_MARGIN_TOP_PX - PAGE_MARGIN_BOTTOM_PX;
// = 1123 − 96 − 96 = 931 px

export const USABLE_WIDTH_PX = A4_WIDTH_PX - PAGE_MARGIN_LEFT_PX - PAGE_MARGIN_RIGHT_PX;
// = 794 − 96 − 96 = 602 px

// ── Typography — MUST match CSS font-size / line-height ───────────────────────
export const LINE_HEIGHT_PX  = 19;   // ceil(14.667 × 1.3) = ceil(19.06) = 19 px
export const PARA_MARGIN_PX  = 15;   // ceil(1em) = ceil(14.667) = 15 px
export const CHARS_PER_LINE  = 85;   // 602 ÷ 7.07 ≈ 85 chars

// ── Responsive Breakpoints ────────────────────────────────────────────────────
// These match the CSS media query breakpoints in real-pagination.css
export const RESPONSIVE_BREAKPOINTS = {
  TABLET_LANDSCAPE: 1024,  // ≤ 1024px
  TABLET_PORTRAIT: 880,    // ≤ 880px
  LARGE_MOBILE: 640,       // ≤ 640px
  MEDIUM_MOBILE: 480,      // ≤ 480px
  SMALL_MOBILE: 360,       // ≤ 360px
};

/**
 * Get current responsive tier based on viewport width
 * @returns {string} Current breakpoint tier name
 */
export function getResponsiveTier() {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width <= RESPONSIVE_BREAKPOINTS.SMALL_MOBILE) return 'small-mobile';
  if (width <= RESPONSIVE_BREAKPOINTS.MEDIUM_MOBILE) return 'medium-mobile';
  if (width <= RESPONSIVE_BREAKPOINTS.LARGE_MOBILE) return 'large-mobile';
  if (width <= RESPONSIVE_BREAKPOINTS.TABLET_PORTRAIT) return 'tablet-portrait';
  if (width <= RESPONSIVE_BREAKPOINTS.TABLET_LANDSCAPE) return 'tablet-landscape';
  return 'desktop';
}

/**
 * Check if current viewport is mobile (≤ 640px)
 * @returns {boolean} True if on mobile device
 */
export function isMobileViewport() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= RESPONSIVE_BREAKPOINTS.LARGE_MOBILE;
}

/**
 * Get responsive font size multiplier based on viewport
 * Desktop: 1.0, Large Mobile: 0.92, Medium Mobile: 0.85, Small Mobile: 0.78
 * @returns {number} Font size multiplier
 */
export function getFontSizeMultiplier() {
  const tier = getResponsiveTier();
  switch (tier) {
    case 'small-mobile': return 0.78;
    case 'medium-mobile': return 0.85;
    case 'large-mobile': return 0.92;
    default: return 1.0;
  }
}
