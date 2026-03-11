// ============================================================================
// A4 PAGE DIMENSIONS (AT 96 DPI)
// Standard A4: 210mm × 297mm = 8.27" × 11.69" = 794px × 1123px at 96 DPI
// ============================================================================
export const DPI = 96;
export const A4_WIDTH_PX = 794;           // 8.27 inches × 96 = 794px
export const A4_HEIGHT_PX = 1123;         // 11.69 inches × 96 = 1123px

// ============================================================================
// PAGE MARGINS (Professional Standard -1 inch)
// These define the "usable box" for content calculation
// ============================================================================
export const PAGE_MARGIN_TOP_PX = 96;     // 1 inch top margin
export const PAGE_MARGIN_BOTTOM_PX = 96;  // 1 inch bottom margin
export const PAGE_MARGIN_LEFT_PX = 72;    // 0.75 inch left margin
export const PAGE_MARGIN_RIGHT_PX = 72;   // 0.75 inch right margin

// Footer area for page numbers
export const FOOTER_HEIGHT_PX = 45;

// ============================================================================
// LAYOUT SPACING
// ============================================================================
export const PAGE_GAP_PX = 20;            // Space between pages

// ============================================================================
// TYPOGRAPHY DEFAULTS
// ============================================================================
export const DEFAULT_FONT_SIZE = 16;
export const DEFAULT_LINE_HEIGHT = 1.5;   // 24px total line height

// ============================================================================
// CALCULATED USABLE SPACE (The "Content Box")
// Width: 794px - 72px - 72px = 650px
// Height: 1123px - 96px - 96px - 45px = 886px
// This is the ONLY space the Layout Calculator fills with content
// ============================================================================
export const USABLE_WIDTH_PX = A4_WIDTH_PX - PAGE_MARGIN_LEFT_PX - PAGE_MARGIN_RIGHT_PX;
export const USABLE_HEIGHT_PX = A4_HEIGHT_PX - PAGE_MARGIN_TOP_PX - PAGE_MARGIN_BOTTOM_PX - FOOTER_HEIGHT_PX;

// Page break constants
export const MIN_WIDOW_ORPHAN_HEIGHT = 48; // Minimum height for widow/orphan prevention(2 lines)

// Performance constants
export const MAX_PAGES = 500;
export const CACHE_SIZE_LIMIT = 2000;
