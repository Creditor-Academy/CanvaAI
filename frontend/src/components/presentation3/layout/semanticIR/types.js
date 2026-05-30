// semanticIR/types.js
// JSDoc contract for Semantic IR v2 — documentation only, no runtime logic.
// Semantic fields describe intent and structure; they must never carry positioned geometry.

/**
 * @typedef {Object} LayoutHintsIR
 * @property {string} [preferredTemplate] - Soft template hint (e.g. "title-only", "hero-image-left")
 * @property {"left"|"right"|"center"} [imagePlacement] - Non-absolute media placement hint
 * @property {"compact"|"comfortable"|"dense"} [density] - Content density preference
 */

/**
 * @typedef {Object} ComponentGroupIR
 * @property {string} type - Semantic component id (TitleBlock, BulletCluster, etc.)
 * @property {number} [priority] - Emphasis / render ordering hint (not geometry)
 * @property {Object[]} [content] - Semantic content nodes — never positioned layers
 * @property {Object} [_legacy] - Optional preserved legacy element snapshot
 */

/**
 * @typedef {Object} SemanticSlideIR
 * @property {string} [id] - Stable slide identifier when available
 * @property {"intro"|"content"|"analysis"|"comparison"|"summary"} [narrativeFlow]
 * @property {string} [slideFamily] - High-level slide family (Hero, Minimal, etc.)
 * @property {"text-led"|"balanced"|"visual-led"} [visualIntent]
 * @property {number} [importance] - Priority hint in range 0–1
 * @property {string[]} [emphasisHierarchy] - Ordered emphasis targets
 * @property {ComponentGroupIR[]} [componentGroups] - Semantic blocks before template geometry
 * @property {LayoutHintsIR} [layoutHints] - Soft layout hints only — no x/y/width/height
 * @property {Object} [_legacy] - Preserved legacy slide for fallback adapters
 */

/**
 * @typedef {Object} SemanticDeckIR
 * @property {string} schemaVersion - Must equal "semir.v2" for native v2 payloads
 * @property {Object} deck - Deck-level semantic metadata
 * @property {string} [deck.topic] - Immutable topic lock
 * @property {string} [deck.presentationTitle] - Display title
 * @property {"professional"|"creative"|"minimal"|"corporate"} [deck.tone]
 * @property {"low"|"medium"|"high"} [deck.textAmount]
 * @property {SemanticSlideIR[]} slides - Ordered semantic slide definitions
 */

export {};
