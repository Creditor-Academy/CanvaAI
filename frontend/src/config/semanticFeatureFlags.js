// config/semanticFeatureFlags.js
// Central kill-switch registry for Semantic IR v2 rollout.
// Infrastructure only — no semantic module imports, no pipeline execution.
//
// TODO(PR-5): wire ENABLE_SEMANTIC_IR + ENABLE_SEMANTIC_SHADOW_LOG in aiLayoutService shadow path
// TODO(Phase-2): wire ENABLE_SEMANTIC_PERSIST_META in store save/load
// TODO(Phase-3): wire ENABLE_SLIDE_FAMILIES in legacyToSemanticIR + family resolver
// TODO(Phase-4): wire ENABLE_COMPONENT_COMPOSITION in component composer adapter

const DEFAULTS = Object.freeze({
  ENABLE_SEMANTIC_IR: false,
  ENABLE_SLIDE_FAMILIES: false,
  ENABLE_COMPONENT_COMPOSITION: false,
  ENABLE_SEMANTIC_SHADOW_LOG: false,
  ENABLE_SEMANTIC_PERSIST_META: false,
});

const KNOWN_FLAGS = Object.freeze(Object.keys(DEFAULTS));

/** @param {string | undefined} value */
const parseEnvBoolean = (value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

/** @param {string} flag */
const getSessionOverride = (flag) => {
  if (typeof window === "undefined") return undefined;

  try {
    const overrides = window.__SEMANTIC_FLAGS__;
    if (!overrides || typeof overrides !== "object") return undefined;

    const value = overrides[flag];
    if (typeof value === "boolean") return value;

    return undefined;
  } catch {
    return undefined;
  }
};

/** @param {string} flag */
const getEnvOverride = (flag) => {
  const envKey = `VITE_${flag}`;
  const raw = import.meta.env?.[envKey];
  if (raw === undefined) return undefined;
  return parseEnvBoolean(raw);
};

export const SEMANTIC_FEATURE_DEFAULTS = DEFAULTS;

/**
 * Resolve whether a semantic feature flag is enabled.
 * Priority: session override → VITE_* env → DEFAULTS (fail-closed).
 *
 * @param {string} flag
 * @returns {boolean}
 */
export const isSemanticFeatureEnabled = (flag) => {
  if (!flag || typeof flag !== "string") return false;
  if (!Object.prototype.hasOwnProperty.call(DEFAULTS, flag)) return false;

  const sessionValue = getSessionOverride(flag);
  if (sessionValue !== undefined) return sessionValue;

  const envValue = getEnvOverride(flag);
  if (envValue !== undefined) return envValue;

  return DEFAULTS[flag] ?? false;
};

/**
 * Snapshot of all registered flags at their resolved runtime values.
 *
 * @returns {Readonly<Record<string, boolean>>}
 */
export const getAllSemanticFeatureFlags = () =>
  Object.freeze(
    KNOWN_FLAGS.reduce((acc, flag) => {
      acc[flag] = isSemanticFeatureEnabled(flag);
      return acc;
    }, /** @type {Record<string, boolean>} */ ({}))
  );
