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
 *   USABLE_HEIGHT = 1123 − 48 − 48 = 1027 px
 *
 * ── TYPOGRAPHY ────────────────────────────────────────────────────────────────
 * CSS:    --editor-font-size: 14.667px;
 *         --editor-line-height: 1.27;
 *         --editor-line-height-px: 18.6px;
 *         --editor-para-margin: 0px;
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
export const PAGE_MARGIN_TOP_PX    = 48; /* Professional 0.5-inch margin */
export const PAGE_MARGIN_BOTTOM_PX = 48; /* Professional 0.5-inch margin */
export const PAGE_MARGIN_LEFT_PX   = 48; /* Professional 0.5-inch margin */
export const PAGE_MARGIN_RIGHT_PX  = 48; /* Professional 0.5-inch margin */

// ── Derived usable area ───────────────────────────────────────────────────────
export const USABLE_HEIGHT_PX = A4_HEIGHT_PX - PAGE_MARGIN_TOP_PX - PAGE_MARGIN_BOTTOM_PX;
// USABLE_HEIGHT = 1027px

export const USABLE_WIDTH_PX = A4_WIDTH_PX - PAGE_MARGIN_LEFT_PX - PAGE_MARGIN_RIGHT_PX;
// = 794 − 48 − 48 = 698 px

// ── Typography — MUST match CSS font-size / line-height ───────────────────────
export const LINE_HEIGHT_PX  = 20;   // 11pt font @ 1.36 multiplier ≈ 20px
export const PARA_MARGIN_PX  = 0;    
export const CHARS_PER_LINE  = 98;   
export const SAFETY_BUFFER_PX = 31;

// ── Line Capacity Verification ────────────────────────────────────────────────
// Usable Height = 1123 - 48 - 48 = 1027px
// Effective Height = 996px (with 31px safety buffer)
// Lines per page = floor(996 / 20) = Exactly 49-50 lines per page

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
