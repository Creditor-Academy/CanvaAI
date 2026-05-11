/**
 * constants.js — Single source of truth for all page dimensions.
 *
 * ── STANDARD ──────────────────────────────────────────────────────────────────
 * Google Docs / Production Editor Standard (1 inch = 96px at 96 DPI)
 *
 * A4 Page:   794 × 1123 px  (210mm × 297mm at 96 DPI)
 * Margins:   96px all sides (1 inch = 25.4mm = 96px at 96 DPI)
 *
 * Content Area:
 *   Usable Height = 1123 − 96 − 96 = 931 px
 *   Usable Width  = 794  − 96 − 96 = 602 px
 *
 * Typography:
 *   Font size:   14.667px (11pt at 96 DPI)
 *   Line height: 1.4 × 14.667 = 20.5px
 *   Para margin: 0px
 *
 * ── RULE ──────────────────────────────────────────────────────────────────────
 * Change one value → change ALL of:
 *   1. constants.js (this file)
 *   2. real-pagination.css (:root variables)
 *   3. 01-variables.css (--editor-margin-*)
 */

// ── A4 page dimensions (standard at 96 DPI) ──────────────────────────────────
export const A4_HEIGHT_PX = 1123;
export const A4_WIDTH_PX  = 794;
export const SAFETY_BUFFER_PX = 8; // Refined for 50-line target

// ── Margins — Thinner top/bottom (96 - 10 = 86px) ─────────────────────────
export const PAGE_MARGIN_TOP_PX    = 86; 
export const PAGE_MARGIN_BOTTOM_PX = 100; 
export const PAGE_MARGIN_LEFT_PX   = 96; // 1 inch
export const PAGE_MARGIN_RIGHT_PX  = 96; // 1 inch

// ── Derived usable area ────────────────────────────────────────────────────
export const USABLE_HEIGHT_PX = A4_HEIGHT_PX - PAGE_MARGIN_TOP_PX - PAGE_MARGIN_BOTTOM_PX - SAFETY_BUFFER_PX;
// = 1123 - 86 - 86 - 12 = 939 px (Safe area for text)

export const USABLE_WIDTH_PX = A4_WIDTH_PX - PAGE_MARGIN_LEFT_PX - PAGE_MARGIN_RIGHT_PX;
// = 794 - 96 - 96 = 602 px

// ── Typography ──────────────────────────────────────────────────────────────
export const FONT_SIZE_PX    = 14.667; // 11pt at 96 DPI
export const LINE_HEIGHT_PX  = 19;     // 14.667 × 1.3 ≈ 19px (Target: 50 lines/page)
export const PARA_MARGIN_PX  = 8;
export const CHARS_PER_LINE  = 72;     // Recalibrated: 602px usable / ~8.3px per char ≈ 72

// ── Line Capacity Verification ───────────────────────────────────────────────────
// Usable Height = 1027px, Line = 22px → floor(1027/22) ≈ 46 lines/page

// ── Responsive Breakpoints ────────────────────────────────────────────────────
export const RESPONSIVE_BREAKPOINTS = {
  TABLET_LANDSCAPE: 1024,
  TABLET_PORTRAIT: 880,
  LARGE_MOBILE: 640,
  MEDIUM_MOBILE: 480,
  SMALL_MOBILE: 360,
};

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

export function isMobileViewport() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= RESPONSIVE_BREAKPOINTS.LARGE_MOBILE;
}

export function getFontSizeMultiplier() {
  const tier = getResponsiveTier();
  switch (tier) {
    case 'small-mobile': return 0.78;
    case 'medium-mobile': return 0.85;
    case 'large-mobile': return 0.92;
    default: return 1.0;
  }
}
