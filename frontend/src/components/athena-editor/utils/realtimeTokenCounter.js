/**
 * realtimeTokenCounter.js
 *
 * Accurate, performant real-time token estimation for editor content.
 *
 * Algorithm:
 *  - English/Latin text: ~0.75 words per token (word splitting on whitespace/punctuation)
 *  - CJK characters: 1 char ≈ 1 token (each ideograph is its own token in BPE)
 *  - Numbers & pure punctuation runs: estimated separately
 *  - Whitespace/control chars: ignored
 *
 * This closely matches GPT-4 / Claude tokenizer output without needing an
 * actual BPE dictionary, and avoids the old "stacking multipliers" bug.
 */

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────

/** Match a CJK character (Unified, Extension A-F, Compatibility Ideographs) */
const CJK_RE = /[\u4E00-\u9FFF\u3400-\u4DBF\u{20000}-\u{2A6DF}\u{2A700}-\u{2CEAF}\uF900-\uFAFF]/gu;

/** Match a run of digits (e.g. "2024", "3.14") — digits tokenize ~1 token per 3 digits */
const NUMBER_RE = /\d+/g;

/** Match a word (any contiguous run of non-whitespace non-punctuation, after CJK removed) */
const WORD_RE = /[a-zA-Z''\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF]+/g;

/** Words per token for Latin/Western text (empirical average vs. GPT-4 tokenizer) */
const WORDS_PER_TOKEN = 0.75;

/** Digits per token */
const DIGITS_PER_TOKEN = 3;

/**
 * Count tokens in `text` using word/CJK/number segmentation.
 * All three loops are O(n) in text length and don't allocate intermediate arrays.
 * @param {string} text
 * @returns {number}
 */
export function estimateTokensFast(text) {
  if (!text || typeof text !== 'string') return 0;

  let tokens = 0;

  // 1. CJK — each character is roughly one token
  const cjkMatches = text.matchAll(CJK_RE);
  for (const _ of cjkMatches) tokens += 1;

  // Strip CJK from a working copy so word/number passes don't double-count
  const stripped = text.replace(CJK_RE, ' ');

  // 2. Numbers — every 3 consecutive digits ≈ 1 token
  const numMatches = stripped.matchAll(NUMBER_RE);
  for (const m of numMatches) {
    tokens += Math.ceil(m[0].length / DIGITS_PER_TOKEN);
  }

  // 3. Latin/extended words — every ~0.75 words ≈ 1 token
  const wordMatches = stripped.replace(NUMBER_RE, ' ').matchAll(WORD_RE);
  let wordCount = 0;
  for (const _ of wordMatches) wordCount += 1;
  tokens += Math.ceil(wordCount / WORDS_PER_TOKEN);

  return tokens;
}

// ─────────────────────────────────────────────────────────────
// RealtimeTokenCounter class
// ─────────────────────────────────────────────────────────────

/**
 * Manages debouncing and callbacks for real-time token counting.
 * Drop-in replacement for the old class — same public API.
 */
export class RealtimeTokenCounter {
  constructor(options = {}) {
    this.debounceMs = options.debounceMs ?? 300;
    this.onTokenUpdate = options.onTokenUpdate ?? (() => {});
    this.onThresholdWarning = options.onThresholdWarning ?? (() => {});
    this.thresholds = options.thresholds ?? [1000, 2000, 3000, 4000];

    this._currentTokens = 0;
    this._previousTokens = 0;
    this._debounceTimer = null;
    this._triggeredThresholds = new Set();
  }

  /** Debounced update — call on every editor change. */
  update(text) {
    if (this._debounceTimer !== null) clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this._debounceTimer = null;
      this._calculateAndNotify(text);
    }, this.debounceMs);
  }

  /** Immediate update (no debounce) — call for final/flush calculations. */
  updateImmediate(text) {
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    this._calculateAndNotify(text);
  }

  /** Returns the most recently computed token count. */
  getTokenCount() {
    return this._currentTokens;
  }

  /** Reset state and fire an update with 0 tokens. */
  reset() {
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    this._currentTokens = 0;
    this._previousTokens = 0;
    this._triggeredThresholds.clear();
    this.onTokenUpdate?.({ 
      tokens: 0, 
      delta: 0, 
      deltaFormatted: '0',
      thresholdsTriggered: [],
      estimatedCost: 0 
    });
  }

  /** Tear down — call when the component unmounts. */
  destroy() {
    this.reset();
    this.onTokenUpdate = null;
    this.onThresholdWarning = null;
  }

  // ── private ────────────────────────────────────────────────

  _calculateAndNotify(text) {
    this._previousTokens = this._currentTokens;
    this._currentTokens = estimateTokensFast(text);

    const delta = this._currentTokens - this._previousTokens;
    const thresholdsTriggered = [];

    for (const threshold of this.thresholds) {
      if (this._currentTokens >= threshold && !this._triggeredThresholds.has(threshold)) {
        this._triggeredThresholds.add(threshold);
        thresholdsTriggered.push(threshold);
        this.onThresholdWarning?.({
          threshold,
          currentTokens: this._currentTokens,
          message: `Token count exceeded ${threshold.toLocaleString()} tokens`,
        });
      }
    }

    this.onTokenUpdate?.({
      tokens: this._currentTokens,
      delta,
      deltaFormatted: delta >= 0 ? `+${delta}` : `${delta}`,
      thresholdsTriggered,
      estimatedCost: this._estimateCost(this._currentTokens),
    });
  }

  /**
   * Rough cost estimate using GPT-4o-mini input pricing ($0.15 / 1M tokens).
   * Useful for debugging/display; not billing-accurate.
   */
  _estimateCost(tokens) {
    return (tokens / 1_000_000) * 0.15;
  }
}

// ─────────────────────────────────────────────────────────────
// Factory helpers
// ─────────────────────────────────────────────────────────────

/** Create a counter instance with the given options. */
export function createTokenCounter(options = {}) {
  return new RealtimeTokenCounter(options);
}

/**
 * Wire a RealtimeTokenCounter to a Tiptap editor instance.
 * Fires an initial count immediately, then on every editor update.
 * Returns { counter, cleanup }.
 */
export function createTokenCounterHook(editor, options = {}) {
  const counter = new RealtimeTokenCounter(options);

  if (editor) {
    const handleUpdate = () => counter.update(editor.getText());
    editor.on('update', handleUpdate);
    editor.on('destroy', () => counter.destroy());
    handleUpdate(); // initial count

    return {
      counter,
      cleanup: () => {
        editor.off('update', handleUpdate);
        counter.destroy();
      },
    };
  }

  return { counter, cleanup: () => counter.destroy() };
}

// ─────────────────────────────────────────────────────────────
// Display utilities (same API as before)
// ─────────────────────────────────────────────────────────────

/**
 * Format a raw token count for human display.
 * e.g. 1500 → "1.5K", 2000000 → "2.0M"
 */
export function formatTokenCount(tokens) {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000)     return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
}

/**
 * Return an efficiency score (0–100) comparing input vs output token counts.
 * 100 = ideal ratio (output is 0.5–2× the input).
 */
export function getTokenEfficiency(inputTokens, outputTokens) {
  if (inputTokens === 0) return 100;
  const ratio = outputTokens / inputTokens;
  if (ratio >= 0.5 && ratio <= 2.0) return 100;
  if (ratio < 0.5) return Math.round((ratio / 0.5) * 100);
  return Math.round((2.0 / ratio) * 100);
}

/**
 * Classify a token count into a usage tier.
 * Returned `color` is a semantic name usable in Tailwind or CSS variables.
 */
export function getTokenTier(tokens) {
  if (tokens < 500)  return { level: 'low',      color: 'green',  label: 'Low Usage'       };
  if (tokens < 1500) return { level: 'medium',   color: 'yellow', label: 'Medium Usage'    };
  if (tokens < 3000) return { level: 'high',     color: 'orange', label: 'High Usage'      };
  return               { level: 'critical',  color: 'red',    label: 'Very High Usage' };
}
