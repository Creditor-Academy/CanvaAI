// A4 dimensions at 96 DPI
export const DPI = 96;
export const A4_WIDTH_PX = 794;           // A4 width in pixels
export const A4_HEIGHT_PX = 1123;         // A4 height in pixels

// Margins and padding
export const TOP_MARGIN_PX = 80;
export const BOTTOM_MARGIN_PX = 80;
export const LEFT_MARGIN_PX = 70;
export const RIGHT_MARGIN_PX = 70;

// Footer
export const FOOTER_HEIGHT_PX = 45;

// Layout spacing
export const PAGE_GAP_PX = 40;

// Typography defaults
export const DEFAULT_FONT_SIZE = 16;
export const DEFAULT_LINE_HEIGHT = 1.5;

// Calculated usable space
export const USABLE_WIDTH_PX = A4_WIDTH_PX - LEFT_MARGIN_PX - RIGHT_MARGIN_PX;
export const USABLE_HEIGHT_PX = A4_HEIGHT_PX - TOP_MARGIN_PX - BOTTOM_MARGIN_PX - FOOTER_HEIGHT_PX;

// Page break constants
export const MIN_WIDOW_ORPHAN_HEIGHT = 48; // Minimum height for widow/orphan prevention

// Performance constants
export const MAX_PAGES = 500;
export const CACHE_SIZE_LIMIT = 2000;
