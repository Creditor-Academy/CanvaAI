// semanticIR/schema.js
// Version guards and empty factories — pure, defensive, never throws.

import { SEMANTIC_IR_SCHEMA_VERSION } from "./constants.js";

/** @param {unknown} value */
const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export const isSemanticIRv2 = (value) => {
  if (!isPlainObject(value)) return false;
  return value.schemaVersion === SEMANTIC_IR_SCHEMA_VERSION;
};

/**
 * @param {unknown} value
 * @returns {string|null}
 */
export const getSchemaVersion = (value) => {
  if (!isPlainObject(value)) return null;
  const version = value.schemaVersion;
  return typeof version === "string" ? version : null;
};

/**
 * @returns {import("./types.js").SemanticDeckIR}
 */
export const createEmptySemanticDeck = () => ({
  schemaVersion: SEMANTIC_IR_SCHEMA_VERSION,
  deck: {
    topic: "",
    presentationTitle: "",
    tone: null,
    textAmount: null,
  },
  slides: [],
});

/**
 * @returns {import("./types.js").SemanticSlideIR}
 */
export const createEmptySemanticSlide = () => ({
  id: null,
  narrativeFlow: null,
  slideFamily: null,
  visualIntent: null,
  importance: null,
  emphasisHierarchy: [],
  componentGroups: [],
  layoutHints: {},
  _legacy: null,
});
