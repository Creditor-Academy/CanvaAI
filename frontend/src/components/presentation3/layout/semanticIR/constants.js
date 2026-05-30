// semanticIR/constants.js
// Canonical vocabulary for Semantic IR v2.

export const SEMANTIC_IR_SCHEMA_VERSION = "semir.v2";

export const SLIDE_FAMILIES = Object.freeze([
  "Hero",
  "Process",
  "Timeline",
  "Comparison",
  "Statistics",
  "Taxonomy",
  "Quote",
  "FeatureGrid",
  "VisualInsight",
  "Educational",
  "Corporate",
  "Minimal",
]);

export const VISUAL_INTENTS = Object.freeze([
  "text-led",
  "balanced",
  "visual-led",
]);

export const NARRATIVE_FLOWS = Object.freeze([
  "intro",
  "content",
  "analysis",
  "comparison",
  "summary",
]);

export const COMPONENT_GROUP_TYPES = Object.freeze([
  "TitleBlock",
  "BulletCluster",
  "HeroVisual",
  "InsightCard",
  "MetricsGrid",
  "TimelineTrack",
  "ComparisonColumns",
  "QuoteBlock",
  "ProcessSteps",
]);

export const GEOMETRY_KEYS = Object.freeze(["x", "y", "width", "height"]);
