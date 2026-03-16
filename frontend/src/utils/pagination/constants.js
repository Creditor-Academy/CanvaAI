// ============================================================================
// constants.js — Athena Editor layout constants
//
// Two coordinate systems live here:
//   PX  — used by the in-browser pagination engine (96 dpi screen)
//   MM  — used by the PDF exporter (jsPDF works in millimetres)
//
// All mm values are derived from the px values so the two systems stay
// in perfect sync: 1 px = 0.264583 mm at 96 dpi.
// ============================================================================

// ── DPI & A4 page dimensions ─────────────────────────────────────────────────

export const DPI = 96;

// A4: 210 × 297 mm exactly = 794.0 × 1122.5 px at 96 dpi
// jsPDF uses 210 × 297 mm natively; we snap the px size to whole numbers.
export const A4_WIDTH_PX  = 794;    // 210 mm × 96 / 25.4
export const A4_HEIGHT_PX = 1123;   // 297 mm × 96 / 25.4  (rounded up)

export const A4_WIDTH_MM  = 210;
export const A4_HEIGHT_MM = 297;

// ── Page margins ──────────────────────────────────────────────────────────────
//
// Professional standard: 1-inch (25.4 mm) top/bottom, 0.75-inch (19.05 mm) sides.
// The footer sits INSIDE the bottom margin — it is not an extra reserve on top of it.
// This matches Microsoft Word's "Normal" margin preset and gives the most usable space.

export const PAGE_MARGIN_TOP_PX    = 96;   // 1.00 inch = 25.4 mm
export const PAGE_MARGIN_BOTTOM_PX = 96;   // 1.00 inch = 25.4 mm
export const PAGE_MARGIN_LEFT_PX   = 72;   // 0.75 inch = 19.05 mm
export const PAGE_MARGIN_RIGHT_PX  = 72;   // 0.75 inch = 19.05 mm

export const PAGE_MARGIN_TOP_MM    = 25.4;
export const PAGE_MARGIN_BOTTOM_MM = 25.4;
export const PAGE_MARGIN_LEFT_MM   = 19.05;
export const PAGE_MARGIN_RIGHT_MM  = 19.05;

// ── Footer / header bands ─────────────────────────────────────────────────────
//
// The footer lives inside the bottom margin (last 48 px / 12.7 mm).
// The header lives inside the top margin (last 48 px / 12.7 mm).
// Content never enters these bands; USABLE_HEIGHT already excludes them via
// the margin constants above — no additional subtraction is needed.
//
// When the PDF exporter draws header/footer it uses:
//   header rule at  margin.top + 9 mm  (= 34.4 mm from top edge)
//   content starts  margin.top + 12 mm (= 37.4 mm from top edge)
//   footer rule at  pageH - margin.bottom - 12 mm
//   footer text at  pageH - margin.bottom - 7 mm

export const FOOTER_HEIGHT_PX  = 48;   // 0.5 inch — sits inside PAGE_MARGIN_BOTTOM_PX
export const FOOTER_HEIGHT_MM  = 12.7;

export const HEADER_HEIGHT_PX  = 48;   // 0.5 inch — sits inside PAGE_MARGIN_TOP_PX
export const HEADER_HEIGHT_MM  = 12.7;

// ── Usable content box ────────────────────────────────────────────────────────
//
// This is the rectangle the layout engine fills with content.
// Footer/header are overlaid on the margins — they do NOT reduce usable height.
//
//   USABLE_WIDTH_PX  = 794 − 72 − 72  = 650 px  (171.9 mm)
//   USABLE_HEIGHT_PX = 1123 − 96 − 96 = 931 px  (246.2 mm)
//
// The old value was 886 px because FOOTER_HEIGHT_PX (45 px) was subtracted
// a second time from USABLE_HEIGHT_PX. Wrong — the footer lives inside the
// bottom margin so it was being double-counted. Fixed: 931 px.

export const USABLE_WIDTH_PX  = A4_WIDTH_PX  - PAGE_MARGIN_LEFT_PX  - PAGE_MARGIN_RIGHT_PX;   // 650 px
export const USABLE_HEIGHT_PX = A4_HEIGHT_PX - PAGE_MARGIN_TOP_PX   - PAGE_MARGIN_BOTTOM_PX;  // 931 px

export const USABLE_WIDTH_MM  = A4_WIDTH_MM  - PAGE_MARGIN_LEFT_MM  - PAGE_MARGIN_RIGHT_MM;   // 171.9 mm
export const USABLE_HEIGHT_MM = A4_HEIGHT_MM - PAGE_MARGIN_TOP_MM   - PAGE_MARGIN_BOTTOM_MM;  // 246.2 mm

// ── Typography defaults ────────────────────────────────────────────────────────

export const DEFAULT_FONT_SIZE     = 16;    // px  (12 pt at 96 dpi)
export const DEFAULT_LINE_HEIGHT   = 1.5;   // multiplier → 24 px total line height
export const DEFAULT_FONT_SIZE_PT  = 12;    // pt  (used in PDF renderer)
export const DEFAULT_LINE_HEIGHT_MM = DEFAULT_FONT_SIZE_PT * 0.352778 * DEFAULT_LINE_HEIGHT; // ≈ 6.35 mm

// ── Layout engine constants ───────────────────────────────────────────────────

export const PAGE_GAP_PX             = 20;   // Visual gap between page canvases in the editor
export const MIN_WIDOW_ORPHAN_HEIGHT = 48;   // 2 lines minimum before a page break (px)

// ── Performance caps ──────────────────────────────────────────────────────────

export const MAX_PAGES        = 500;
export const CACHE_SIZE_LIMIT = 2000;

// ── Unit conversion helpers ────────────────────────────────────────────────────

export const PX_TO_MM = 0.264583;   // 1 px → mm at 96 dpi
export const MM_TO_PX = 3.779528;   // 1 mm → px at 96 dpi
export const PT_TO_MM = 0.352778;   // 1 pt → mm
export const MM_TO_PT = 2.834646;   // 1 mm → pt
export const PX_TO_PT = 0.75;       // 1 px → pt  (96 dpi: 1 pt = 1.333 px)
export const PT_TO_PX = 1.333333;   // 1 pt → px

// Convenience: convert px dimensions to mm for the PDF renderer
export const pxToMm = (px) => px * PX_TO_MM;
export const mmToPx = (mm) => mm * MM_TO_PX;