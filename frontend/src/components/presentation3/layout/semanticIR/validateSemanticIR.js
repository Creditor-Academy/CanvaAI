// semanticIR/validateSemanticIR.js
// Non-throwing validation — warnings preferred over errors in Phase 1.

import {
  SEMANTIC_IR_SCHEMA_VERSION,
  SLIDE_FAMILIES,
  VISUAL_INTENTS,
  NARRATIVE_FLOWS,
  COMPONENT_GROUP_TYPES,
  GEOMETRY_KEYS,
} from "./constants.js";

/** @param {unknown} value */
const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** @param {unknown} value @param {readonly string[]} allowed */
const isAllowedEnum = (value, allowed) =>
  typeof value === "string" && allowed.includes(value);

/** @param {unknown} group @param {string[]} warnings @param {number} slideIndex @param {number} groupIndex */
const validateComponentGroup = (group, warnings, slideIndex, groupIndex) => {
  if (!isPlainObject(group)) {
    warnings.push(
      `slides[${slideIndex}].componentGroups[${groupIndex}] is not an object`
    );
    return;
  }

  if (group.type != null && !isAllowedEnum(group.type, COMPONENT_GROUP_TYPES)) {
    warnings.push(
      `slides[${slideIndex}].componentGroups[${groupIndex}].type is invalid: ${String(group.type)}`
    );
  }

  for (const key of GEOMETRY_KEYS) {
    if (group[key] !== undefined && group[key] !== null) {
      warnings.push(
        `slides[${slideIndex}].componentGroups[${groupIndex}] contains geometry field "${key}"`
      );
    }
  }
};

/** @param {unknown} slide @param {number} slideIndex @param {string[]} warnings */
const validateSlide = (slide, slideIndex, warnings) => {
  if (!isPlainObject(slide)) {
    warnings.push(`slides[${slideIndex}] is not an object`);
    return;
  }

  if (
    slide.narrativeFlow != null &&
    !isAllowedEnum(slide.narrativeFlow, NARRATIVE_FLOWS)
  ) {
    warnings.push(
      `slides[${slideIndex}].narrativeFlow is invalid: ${String(slide.narrativeFlow)}`
    );
  }

  if (
    slide.slideFamily != null &&
    !isAllowedEnum(slide.slideFamily, SLIDE_FAMILIES)
  ) {
    warnings.push(
      `slides[${slideIndex}].slideFamily is invalid: ${String(slide.slideFamily)}`
    );
  }

  if (
    slide.visualIntent != null &&
    !isAllowedEnum(slide.visualIntent, VISUAL_INTENTS)
  ) {
    warnings.push(
      `slides[${slideIndex}].visualIntent is invalid: ${String(slide.visualIntent)}`
    );
  }

  if (slide.importance != null) {
    if (
      typeof slide.importance !== "number" ||
      Number.isNaN(slide.importance) ||
      slide.importance < 0 ||
      slide.importance > 1
    ) {
      warnings.push(
        `slides[${slideIndex}].importance must be a number between 0 and 1`
      );
    }
  }

  const hasComponentGroups =
    Array.isArray(slide.componentGroups) && slide.componentGroups.length > 0;
  const legacyElements = slide._legacy?.elements;
  const hasLegacyElements =
    Array.isArray(legacyElements) && legacyElements.length > 0;

  if (!hasComponentGroups && !hasLegacyElements) {
    warnings.push(
      `slides[${slideIndex}] has no componentGroups and no _legacy.elements`
    );
  }

  if (Array.isArray(slide.componentGroups)) {
    slide.componentGroups.forEach((group, groupIndex) => {
      validateComponentGroup(group, warnings, slideIndex, groupIndex);
    });
  }
};

/**
 * Validate Semantic IR without mutating input. Never throws.
 *
 * @param {unknown} ir
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export const validateSemanticIR = (ir) => {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(ir)) {
    return {
      valid: false,
      errors: ["Semantic IR must be a plain object"],
      warnings,
    };
  }

  if (!Array.isArray(ir.slides)) {
    return {
      valid: false,
      errors: ["Semantic IR slides must be an array"],
      warnings,
    };
  }

  if (
    ir.schemaVersion != null &&
    ir.schemaVersion !== SEMANTIC_IR_SCHEMA_VERSION
  ) {
    warnings.push(
      `schemaVersion mismatch: expected ${SEMANTIC_IR_SCHEMA_VERSION}, received ${String(ir.schemaVersion)}`
    );
  }

  ir.slides.forEach((slide, slideIndex) => {
    validateSlide(slide, slideIndex, warnings);
  });

  return {
    valid: true,
    errors,
    warnings,
  };
};
