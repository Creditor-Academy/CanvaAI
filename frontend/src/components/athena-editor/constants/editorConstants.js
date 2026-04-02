/**
 * Athena Editor Constants
 * 
 * Centralized configuration values and static data arrays
 * Used throughout the editor for consistent styling and behavior
 */

// ─── Typography ──────────────────────────────────────────────────────────────

export const FONTS = [
  { label: "Arial", value: "Arial" },
  { label: "Georgia", value: "Georgia" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Courier New", value: "Courier New" },
  { label: "Verdana", value: "Verdana" },
  { label: "Trebuchet MS", value: "Trebuchet MS" },
  { label: "Comic Sans MS", value: "Comic Sans MS" },
  { label: "Impact", value: "Impact" },
  { label: "Helvetica", value: "Helvetica" },
  { label: "Tahoma", value: "Tahoma" },
  { label: "Palatino", value: "Palatino Linotype" },
  { label: "Garamond", value: "Garamond" }
];

export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

// ─── Colors ──────────────────────────────────────────────────────────────────

export const TEXT_COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9",
  "#efefef", "#f3f3f3", "#ffffff", "#980000", "#ff0000", "#ff9900", "#ffff00",
  "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff",
  "#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3",
  "#cfe2f3", "#d9d2e9", "#ead1dc", "#ea9999", "#f9cb9c", "#ffe599",
  "#b6d7a8", "#a2c4c9", "#9fc5e8", "#b4a7d6", "#d5a6bd", "#cc4125",
  "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3d85c6", "#674ea7",
  "#a64d79"
];

export const HIGHLIGHT_COLORS = [
  "#ffff00", "#00ff00", "#00ffff", "#ff00ff", "#ff0000", "#0000ff",
  "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#cfe2f3", "#d9d2e9",
  "#ead1dc", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9",
  "#9fc5e8", "#b4a7d6", "#d5a6bd", "#e6b8af", "#f4cccc", "#fce5cd",
  "#fff2cc", "#d9ead3", "#d0e0e3", "#cfe2f3", "#d9d2e9", "#ead1dc"
];

// ─── AI & Content ────────────────────────────────────────────────────────────

export const TONES = [
  "Professional", "Casual", "Academic", "Creative", "Technical",
  "Formal", "Friendly", "Persuasive", "Informative", "Narrative"
];

export const CODE_LANGUAGES = [
  "javascript", "python", "java", "c", "cpp", "csharp", "php", "ruby",
  "go", "swift", "kotlin", "typescript", "html", "css", "sql", "bash",
  "rust", "scala", "r", "dart", "lua", "perl", "haskell", "elixir"
];

// ─── Export & Import ─────────────────────────────────────────────────────────

export const EXPORT_FORMATS = [
  { label: "PDF", value: "pdf", icon: null }, // Icon references removed - import in component
  { label: "DOCX", value: "docx", icon: null },
  { label: "Markdown", value: "md", icon: null },
  { label: "HTML", value: "html", icon: null },
  { label: "Plain Text", value: "txt", icon: null },
  { label: "JSON", value: "json", icon: null },
  // Hidden until implemented:
  // { label: "EPUB", value: "epub", icon: null },
  // { label: "XML", value: "xml", icon: null },
  // { label: "CSV", value: "csv", icon: null },
  // { label: "RTF", value: "rtf", icon: null }
];

// ─── Page Layout ─────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_MARGINS = {
  top: 48,      // px (default: 48px = ~12.7mm)
  right: 72,    // px (default: 72px = ~19mm)
  bottom: 48,   // px (default: 48px = ~12.7mm)
  left: 72      // px (default: 72px = ~19mm)
};

// ─── Timing & Delays ─────────────────────────────────────────────────────────

/**
 * Delay before updating UI stats (word count, page count)
 * Prevents cursor jump during typing by debouncing DOM updates
 */
export const STATS_DELAY = 500; // ms

/**
 * Auto-save debounce delay
 * Saves document after user stops typing for this duration
 */
export const AUTO_SAVE_DELAY = 2000; // ms

/**
 * Pagination fingerprint check delay
 * Waits for content to stabilize before recalculating page breaks
 */
export const PAGINATION_DEBOUNCE = 300; // ms

// ─── Performance Constants ───────────────────────────────────────────────────

/**
 * Maximum page breaks to insert in a single batch
 * Prevents blocking the main thread during large pastes
 */
export const MAX_BREAKS_PER_RUN = 100;

/**
 * Character threshold for considering a document "large"
 * Triggers progressive pagination for better performance
 */
export const LARGE_DOCUMENT_THRESHOLD = 20000; // chars

/**
 * Minimum characters before pagination is needed
 * Documents shorter than this don't need page breaks
 */
export const MIN_CHARS_FOR_PAGINATION = 500;

// ─── UI Configuration ────────────────────────────────────────────────────────

export const TOOLBAR_CONFIG = {
  buttonSize: 'icon', // 'icon' | 'default' | 'large'
  tooltipDelay: 300,  // ms before showing tooltip
  menuAnimation: 'slide', // 'slide' | 'fade' | 'none'
};

export const MODAL_CONFIG = {
  defaultWidth: 500,  // px
  maxWidth: '90vw',   // responsive max
  animation: 'scale', // 'scale' | 'slide' | 'fade'
};

// ─── Editor Behavior ─────────────────────────────────────────────────────────

export const EDITOR_CONFIG = {
  enableCollaboration: false, // Real-time collaboration flag
  enableVersionHistory: true, // Track document revisions
  enableComments: true,       // Allow comments on selections
  enableAIAssistant: true,    // Show AI writing helper
  enableSpellCheck: true,     // Browser spell check integration
  enableVoiceTyping: false,    // Voice input support (DISABLED)
};

// ─── Export Defaults ─────────────────────────────────────────────────────────

export const EXPORT_DEFAULTS = {
  pdf: {
    scale: 2,           // Render quality (higher = better)
    filename: 'document.pdf',
    includeMetadata: true,
  },
  docx: {
    filename: 'document.docx',
    includeMetadata: true,
    compress: true,
  },
  epub: {
    filename: 'document.epub',
    language: 'en',
    includeTOC: true,
  }
};
