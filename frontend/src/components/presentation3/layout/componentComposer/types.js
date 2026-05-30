// componentComposer/types.js
// JSDoc contract placeholders — no runtime code.

/**
 * @typedef {Object} ComponentGroup
 * @property {string} type - Semantic component id (e.g. "TitleBlock", "BulletCluster")
 * @property {number} [priority] - Render/emphasis ordering hint
 * @property {Object[]} [content] - Semantic content nodes — not positioned layers
 */

/**
 * @typedef {Object} ComposedSlide
 * @property {ComponentGroup[]} componentGroups - Ordered semantic blocks before template geometry
 * @property {Object} [_legacy] - Preserved legacy slide for fallback
 */

export {};
