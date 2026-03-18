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

// ── Font width ratios for estimation-based calculation ────────────────────────
// Average character width as ratio of font size (varies by font family)
export const FONT_WIDTH_RATIO = {
  default:   0.52,  // Average proportion for mixed content
  serif:     0.50,  // Slightly narrower (e.g., Times New Roman)
  sansSerif: 0.54,  // Slightly wider (e.g., Arial)
  monospace: 0.60,  // Fixed-width (e.g., Courier)
};

// Inline style multipliers (bold/italic affect character width)
export const BOLD_WIDTH_MULTIPLIER   = 1.15;  // Bold text ≈ +15% wider
export const ITALIC_WIDTH_MULTIPLIER = 1.05;  // Italic text ≈ +5% wider

// Heading font sizes (px) relative to base 16px
export const HEADING_FONT_SIZES = [
  32,  // h1: 2× base
  24,  // h2: 1.5× base
  20,  // h3: 1.25× base
  18,  // h4: 1.125× base
  16,  // h5: 1× base
  14,  // h6: 0.875× base
];

// Block margin-bottom values (px) for spacing between elements
export const BLOCK_MARGIN_BOTTOM = {
  paragraph:    16,    // Standard paragraph spacing
  heading1:     24,    // H1 has more bottom space
  heading2:     20,    // H2 slightly less
  heading3:     18,    // H3 standard
  heading4:     16,    // H4 same as paragraph
  heading5:     16,    // H5 same as paragraph
  heading6:     16,    // H6 same as paragraph
  listItem:     8,     // List items tighter
  bulletList:   16,    // List container
  orderedList:  16,    // Ordered list container
  blockquote:   16,    // Quote spacing
  codeBlock:    16,    // Code block spacing
  table:        16,    // Table spacing
  image:        16,    // Image spacing
  horizontalRule: 20,  // Divider spacing
  default:      16,    // Fallback
};

// ── Google Docs exact configuration ───────────────────────────────────────────
// Production-grade pagination matching Google Docs precisely
// Based on real typographic calculations AND实测 measurements

export const GOOGLE_DOCS_CONFIG = {
  FONT_SIZE_PT: 11,                    // Arial 11pt
  FONT_SIZE_PX: 11 * 1.333,           // 14.663 px ≈ 14.67 px (1 pt = 1.333 px at 96 DPI)
  LINE_SPACING: 1.15,                  // Line spacing multiplier
  LINE_HEIGHT_PX: 14.67 * 1.15,       // 16.87 px (font-size × line-spacing)
  LINES_PER_PAGE: 48,                  // Exact lines per page
  CONTENT_HEIGHT_BY_LINES: 16.87 * 48, // 809.76 px ≈ 810 px (line-height × lines)
  PREFERRED_USABLE_HEIGHT_PX: 810,     // Preferred usable height (48 lines)
  MAX_USABLE_HEIGHT_PX: 931,           // Maximum usable height (for overflow)
  FONT_FAMILY: 'Arial',                // Default font
};

// ── Layout engine constants ───────────────────────────────────────────────────

export const PAGE_GAP_PX             = 20;   // Visual gap between page canvases in the editor
export const MIN_WIDOW_ORPHAN_HEIGHT = 52;   // 3 lines minimum before a page break (px) - increased from 48 to prevent stragglers

// ── Performance caps ──────────────────────────────────────────────────────────

export const MAX_PAGES        = 500;
export const CACHE_SIZE_LIMIT = 2000;

// Content limits per page (safeguards for edge cases)
// Used as secondary checks alongside DOM-based height measurement
export const MAX_WORDS_PER_PAGE = 400;  // Approximate word limit per page
export const MAX_CHARS_PER_PAGE = 2500; // Approximate character limit per page

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