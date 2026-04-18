/**
 * token-worker.js - Web Worker for asynchronous token counting
 * Handles heavy token estimation without blocking the main thread
 * 
 * Features:
 * - Full document token estimation
 * - Block-level incremental updates
 * - Performance monitoring
 * - Message queue for concurrent requests
 */

// Import the token estimation function (will be inlined via blob URL in production)
// For standalone worker file, we include the algorithm directly

// ─────────────────────────────────────────────────────────────
// Token Estimation Algorithm (inlined for worker compatibility)
// ─────────────────────────────────────────────────────────────

const CJK_RE = /[\u4E00-\u9FFF\u3400-\u4DBF\u{20000}-\u{2A6DF}\u{2A700}-\u{2CEAF}\uF900-\uFAFF]/gu;
const NUMBER_RE = /\d+/g;
const WORD_RE = /[a-zA-Z''\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF]+/g;
const WORDS_PER_TOKEN = 0.75;
const DIGITS_PER_TOKEN = 3;

/**
 * Estimate tokens in text using word/CJK/number segmentation
 * @param {string} text 
 * @returns {number}
 */
function estimateTokensFast(text) {
  if (!text || typeof text !== 'string') return 0;

  let tokens = 0;

  // 1. CJK — each character is roughly one token
  const cjkMatches = text.matchAll(CJK_RE);
  for (const _ of cjkMatches) tokens += 1;

  // Strip CJK from a working copy
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
// Worker State
// ─────────────────────────────────────────────────────────────

// Block-level token cache: { nodeId: tokenCount }
const blockTokenCache = new Map();

// Performance metrics
let totalCalculations = 0;
let totalCalculationTime = 0;

// ─────────────────────────────────────────────────────────────
// Message Handler
// ─────────────────────────────────────────────────────────────

self.onmessage = function(e) {
  const { type, id, payload } = e.data;
  const startTime = performance.now();

  try {
    switch (type) {
      case 'FULL_DOCUMENT':
        handleFullDocument(payload.text, id);
        break;

      case 'BLOCK_UPDATE':
        handleBlockUpdate(payload);
        break;

      case 'BLOCK_DELETE':
        handleBlockDelete(payload.nodeId, id);
        break;

      case 'RESET':
        handleReset(id);
        break;

      case 'GET_METRICS':
        self.postMessage({
          type: 'METRICS_RESPONSE',
          id,
          metrics: {
            totalCalculations,
            averageTime: totalCalculations > 0 ? totalCalculationTime / totalCalculations : 0,
            cachedBlocks: blockTokenCache.size
          }
        });
        break;

      default:
        self.postMessage({
          type: 'ERROR',
          id,
          error: `Unknown message type: ${type}`
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      id,
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// Handler Functions
// ─────────────────────────────────────────────────────────────

/**
 * Handle full document token calculation
 */
function handleFullDocument(text, id) {
  const tokens = estimateTokensFast(text);
  const calculationTime = performance.now();

  totalCalculations++;
  totalCalculationTime += calculationTime;

  self.postMessage({
    type: 'FULL_DOCUMENT_RESPONSE',
    id,
    tokens,
    calculationTime,
    textLength: text.length
  });
}

/**
 * Handle incremental block-level update
 * Only recalculates the changed block, not the entire document
 */
function handleBlockUpdate({ nodeId, oldText, newText, currentTotal }) {
  const startTime = performance.now();

  // Calculate new token count for this block
  const oldTokens = blockTokenCache.get(nodeId) || 0;
  const newTokens = estimateTokensFast(newText);

  // Update cache
  blockTokenCache.set(nodeId, newTokens);

  // Calculate delta
  const delta = newTokens - oldTokens;
  const newTotal = currentTotal + delta;

  const calculationTime = performance.now() - startTime;
  totalCalculations++;
  totalCalculationTime += calculationTime;

  self.postMessage({
    type: 'BLOCK_UPDATE_RESPONSE',
    nodeId,
    oldTokens,
    newTokens,
    delta,
    newTotal,
    calculationTime
  });
}

/**
 * Handle block deletion
 */
function handleBlockDelete(nodeId, id) {
  const removedTokens = blockTokenCache.get(nodeId) || 0;
  blockTokenCache.delete(nodeId);

  self.postMessage({
    type: 'BLOCK_DELETE_RESPONSE',
    id,
    nodeId,
    removedTokens
  });
}

/**
 * Reset all state
 */
function handleReset(id) {
  blockTokenCache.clear();
  totalCalculations = 0;
  totalCalculationTime = 0;

  self.postMessage({
    type: 'RESET_RESPONSE',
    id
  });
}
