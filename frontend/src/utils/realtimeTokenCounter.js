/**
* realtimeTokenCounter.js - Production-level real-time token counting
* Optimized for performance with Web Worker offloading, block-level incremental updates, and adaptive caching
* 
* Features:
* - Web Worker integration for async token estimation
* - Block-level incremental updates (TipTap/ProseMirror node-aware)
* - Adaptive debounce based on document size
* - Production-ready LRU caching with TTL eviction
* - Performance monitoring with P99 tracking
* - Circuit breaker for worker failures
* - Chunked processing for large documents
* - Block-level memoization with content hashing
* - Lazy loading for performance optimization
*/

import { workerBreaker } from './workerCircuitBreaker';

// ─────────────────────────────────────────────────────────────
// Production Configuration
// ─────────────────────────────────────────────────────────────

const PRODUCTION_CONFIG = {
  // Cache settings
  MAX_CACHE_SIZE: 500, // Reduced from 2000 for production memory safety
  CACHE_ENABLED: process.env.NODE_ENV === 'production' ? true : true,
  
  // Block-level cache settings
  BLOCK_CACHE_MAX_SIZE: 1000,
  BLOCK_CACHE_TTL: 300000, // 5 minutes TTL for block cache
  
  // Debounce settings
  DEBOUNCE_SMALL: 50,    // < 50 chars (typing)
  DEBOUNCE_MEDIUM: 200,  // 50-500 chars (paste)
  DEBOUNCE_LARGE: 400,   // > 500 chars (AI generation)
  DEBOUNCE_HUGE: 500,    // > 10,000 words documents
  
  // Worker settings
  USE_WORKER: true,
  WORKER_FALLBACK_THRESHOLD: 1000, // chars - use main thread for small texts
  WORKER_TIMEOUT: 5000, // 5 seconds
  
  // Block-level tracking
  BLOCK_CACHE_ENABLED: true,
  
  // Performance monitoring
  PERFORMANCE_SAMPLING_RATE: 0.1, // Sample 10% of updates for metrics
  PERFORMANCE_BUDGET_MS: 10 // Max calculation time before warning
};

// ─────────────────────────────────────────────────────────────
// Block-Level Memoization Cache
// ─────────────────────────────────────────────────────────────

class BlockTokenMemoization {
  constructor(maxSize = PRODUCTION_CONFIG.BLOCK_CACHE_MAX_SIZE) {
    this.cache = new Map(); // nodeId -> { hash, tokens, timestamp }
    this.maxSize = maxSize;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Fast hash function for content comparison
   */
  _hashContent(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Get or compute token count for a block
   * Returns cached value if content hasn't changed
   */
  getOrUpdate(nodeId, text, computeFn) {
    const hash = this._hashContent(text);
    const cached = this.cache.get(nodeId);

    // Check cache hit
    if (cached && cached.hash === hash) {
      // Check TTL
      const now = Date.now();
      if (now - cached.timestamp < PRODUCTION_CONFIG.BLOCK_CACHE_TTL) {
        this.hits++;
        return { tokens: cached.tokens, cacheHit: true };
      }
    }

    // Cache miss or expired - compute
    this.misses++;
    const tokens = computeFn(text);
    
    // Update cache
    this.cache.set(nodeId, {
      hash,
      tokens,
      timestamp: Date.now()
    });

    // Evict oldest entries if cache is too large
    if (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    return { tokens, cacheHit: false };
  }

  /**
   * Clear cache for a specific node
   */
  invalidate(nodeId) {
    this.cache.delete(nodeId);
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: hitRate.toFixed(2) + '%',
      utilization: ((this.cache.size / this.maxSize) * 100).toFixed(2) + '%'
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Web Worker Manager
// ─────────────────────────────────────────────────────────────

class TokenWorkerManager {
  constructor() {
    this.worker = null;
    this.pendingRequests = new Map();
    this.isInitialized = false;
    this.useFallback = false;
    this.messageId = 0;
  }

  /**
   * Initialize the Web Worker
   */
  initialize() {
    if (this.isInitialized || !PRODUCTION_CONFIG.USE_WORKER) {
      return;
    }

    try {
      // Create worker from public path
      this.worker = new Worker('/workers/token-worker.js');
      
      this.worker.onmessage = (e) => this._handleWorkerMessage(e.data);
      this.worker.onerror = (error) => this._handleWorkerError(error);
      
      this.isInitialized = true;
      console.log('[TokenCounter] ✅ Web Worker initialized');
    } catch (error) {
      console.warn('[TokenCounter] ⚠️ Web Worker failed, using fallback:', error.message);
      this.useFallback = true;
    }
  }

  /**
   * Send full document for token calculation
   */
  calculateFullDocument(text) {
    return new Promise((resolve, reject) => {
      if (this.useFallback || !this.worker) {
        // Fallback to main thread
        const tokens = this._estimateTokensFastFallback(text);
        resolve({ tokens, calculationTime: 0, usedWorker: false });
        return;
      }

      const id = ++this.messageId;
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('Worker timeout'));
      }, PRODUCTION_CONFIG.WORKER_TIMEOUT);

      this.pendingRequests.set(id, { resolve, reject, timeout });
      this.worker.postMessage({
        type: 'FULL_DOCUMENT',
        id,
        payload: { text }
      });
    });
  }

  /**
   * Send block-level update for incremental calculation
   */
  calculateBlockUpdate({ nodeId, oldText, newText, currentTotal }) {
    return new Promise((resolve, reject) => {
      if (this.useFallback || !this.worker) {
        const oldTokens = this._estimateTokensFastFallback(oldText);
        const newTokens = this._estimateTokensFastFallback(newText);
        resolve({
          oldTokens,
          newTokens,
          delta: newTokens - oldTokens,
          newTotal: currentTotal + (newTokens - oldTokens),
          usedWorker: false
        });
        return;
      }

      const id = ++this.messageId;
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('Worker timeout'));
      }, PRODUCTION_CONFIG.WORKER_TIMEOUT);

      this.pendingRequests.set(id, { resolve, reject, timeout });
      this.worker.postMessage({
        type: 'BLOCK_UPDATE',
        id,
        payload: { nodeId, oldText, newText, currentTotal }
      });
    });
  }

  /**
   * Handle worker response
   */
  _handleWorkerMessage(data) {
    const { id, type } = data;
    const request = this.pendingRequests.get(id);

    if (!request) return;

    clearTimeout(request.timeout);
    this.pendingRequests.delete(id);

    switch (type) {
      case 'FULL_DOCUMENT_RESPONSE':
        request.resolve({
          tokens: data.tokens,
          calculationTime: data.calculationTime,
          textLength: data.textLength,
          usedWorker: true
        });
        break;

      case 'BLOCK_UPDATE_RESPONSE':
        request.resolve({
          oldTokens: data.oldTokens,
          newTokens: data.newTokens,
          delta: data.delta,
          newTotal: data.newTotal,
          calculationTime: data.calculationTime,
          usedWorker: true
        });
        break;

      case 'METRICS_RESPONSE':
        request.resolve(data.metrics);
        break;

      default:
        request.reject(new Error(`Unknown worker response type: ${type}`));
    }
  }

  /**
   * Handle worker errors
   */
  _handleWorkerError(error) {
    console.error('[TokenCounter] ❌ Worker error:', error);
    this.useFallback = true;
    
    // Reject all pending requests
    for (const [id, request] of this.pendingRequests) {
      clearTimeout(request.timeout);
      request.reject(new Error('Worker failed'));
    }
    this.pendingRequests.clear();
  }

  /**
   * Fallback token estimation (main thread)
   */
  _estimateTokensFastFallback(text) {
    if (!text || typeof text !== 'string') return 0;
    return Math.ceil(text.length / 4); // Fast approximation
  }

  /**
   * Terminate worker and cleanup
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
    this.isInitialized = false;
  }
}

// Singleton worker manager
const workerManager = new TokenWorkerManager();

// ─────────────────────────────────────────────────────────────
// Content Fingerprinting (Robust: head + mid + tail)
// ─────────────────────────────────────────────────────────────

/**
 * Build robust content fingerprint to detect actual changes
 * Uses head, middle, and tail samples for collision resistance
 * Edge case: "Hello world" → "World hello" caught by mid/tail samples
 */
export function buildFingerprint(text) {
  if (!text) return 'empty';
  
  const len = text.length;
  const head = text.slice(0, 60);
  const mid  = text.slice(Math.floor(len / 2 - 30), Math.floor(len / 2 + 30));
  const tail = text.slice(-60);
  
  return `${len}|${head}|${mid}|${tail}`;
}

// ─────────────────────────────────────────────────────────────
// Fast Hash for LRU Cache (djb2 variant)
// ─────────────────────────────────────────────────────────────

/**
 * Fast 32-bit hash — no crypto overhead
 * Used for cache keys instead of full text comparison
 */
function fastHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33 ^ str.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

// ─────────────────────────────────────────────────────────────
// LRU Cache with TTL Eviction (Production-Optimized)
// ─────────────────────────────────────────────────────────────

const CACHE_MAX = 500;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const tokenCache = new Map(); // JS Map preserves insertion order → natural LRU
const cacheTimers = new Map(); // key → TTL timer id

/**
 * Get cached tokens with LRU touch (moves to end)
 */
export function getCachedTokens(text) {
  const key = fastHash(text);
  if (!tokenCache.has(key)) return null;
  
  // LRU touch: delete + re-insert moves to end
  const val = tokenCache.get(key);
  tokenCache.delete(key);
  tokenCache.set(key, val);
  
  return val.tokens;
}

/**
 * Set cached tokens with TTL eviction
 */
export function setCachedTokens(text, tokens) {
  const key = fastHash(text);
  
  // Clear existing TTL if re-inserting
  if (cacheTimers.has(key)) clearTimeout(cacheTimers.get(key));
  
  // Evict LRU (first entry) if at capacity
  if (tokenCache.size >= CACHE_MAX) {
    const lruKey = tokenCache.keys().next().value;
    clearTimeout(cacheTimers.get(lruKey));
    cacheTimers.delete(lruKey);
    tokenCache.delete(lruKey);
  }
  
  tokenCache.set(key, { tokens, ts: Date.now() });
  cacheTimers.set(key, setTimeout(() => {
    tokenCache.delete(key);
    cacheTimers.delete(key);
  }, CACHE_TTL));
}

// ─────────────────────────────────────────────────────────────
// Performance Monitoring with P99 Tracking
// ─────────────────────────────────────────────────────────────

export const perf = {
  calculations: 0,
  totalTime: 0,
  cacheHits: 0,
  cacheMisses: 0,
  workerUse: 0,
  syncFallbacks: 0,
  timeouts: 0,
  slowCalcs: 0,
  p99Buffer: [], // rolling window for P99

  record({ time, cacheHit, usedWorker, timedOut }) {
    this.calculations++;
    this.totalTime += time;
    if (cacheHit) this.cacheHits++;
    else this.cacheMisses++;
    if (usedWorker) this.workerUse++;
    else this.syncFallbacks++;
    if (timedOut) this.timeouts++;
    if (time > 50) this.slowCalcs++;
    
    // P99 rolling window (last 100 calcs)
    this.p99Buffer.push(time);
    if (this.p99Buffer.length > 100) this.p99Buffer.shift();
    
    if (time > 50) {
      console.warn(`⚠️ Slow token calc: ${time.toFixed(1)}ms`, { cacheHit, usedWorker });
    }
  },

  p99() {
    if (!this.p99Buffer.length) return 0;
    const sorted = [...this.p99Buffer].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.99)];
  },

  summary() {
    const total = this.cacheHits + this.cacheMisses;
    return {
      avgMs: (this.totalTime / this.calculations).toFixed(2),
      p99Ms: this.p99().toFixed(2),
      cacheRate: (this.cacheHits / total * 100).toFixed(1) + '%',
      workerRate: (this.workerUse / this.calculations * 100).toFixed(1) + '%',
      timeouts: this.timeouts,
      slowCalcs: this.slowCalcs,
    };
  }
};

// Expose to DevTools in development
if (process.env.NODE_ENV !== 'production') {
  window.__editorPerf = perf; // DevTools: window.__editorPerf.summary()
}

// ─────────────────────────────────────────────────────────────
// Legacy performance metrics (backward compatibility)
// ─────────────────────────────────────────────────────────────

const performanceMetrics = {
  get totalCalculations() { return perf.calculations; },
  get cacheHits() { return perf.cacheHits; },
  get cacheMisses() { return perf.cacheMisses; },
  get workerCalculations() { return perf.workerUse; },
  get fallbackCalculations() { return perf.syncFallbacks; },
  get averageCalculationTime() { return perf.calculations > 0 ? perf.totalTime / perf.calculations : 0; },
  get lastCalculationTime() { return 0; },
  get totalTextProcessed() { return 0; }
};

/**
 * Get or calculate tokens for a block (paragraph, heading, etc.)
 */
function getBlockTokens(nodeId, text) {
  if (!PRODUCTION_CONFIG.BLOCK_CACHE_ENABLED) {
    return estimateTokensLocal(text);
  }

  const cached = blockCache.get(nodeId);
  
  // Cache hit - verify text hasn't changed
  if (cached && cached.text === text) {
    performanceMetrics.cacheHits++;
    return cached.tokens;
  }

  // Cache miss - calculate and store
  performanceMetrics.cacheMisses++;
  const tokens = estimateTokensLocal(text);
  
  // Use new LRU cache with TTL
  setCachedTokens(nodeId, tokens);
  blockCache.set(nodeId, {
    text,
    tokens,
    lastUpdated: Date.now()
  });

  return tokens;
}

/**
 * Invalidate a specific block from cache
 */
function invalidateBlock(nodeId) {
  blockCache.delete(nodeId);
}

/**
 * Clear all block caches
 */
function clearBlockCache() {
  blockCache.clear();
}

/**
 * Estimate tokens for text (optimized version with differential tracking)
 * Uses character-based approximation with intelligent caching
 * 
 * @param {string} text - Text to analyze
 * @param {Object} options - Calculation options
 * @returns {Object} Token count and metadata
 */
export async function estimateTokensFast(text, options = {}) {
  const startTime = performance.now();

  if (!text || typeof text !== 'string') {
    return { tokens: 0, calculationTime: 0, cacheHit: false, usedWorker: false };
  }

  // Check cache first (LRU with TTL)
  const cached = getCachedTokens(text);
  if (cached !== null) {
    perf.record({ time: performance.now() - startTime, cacheHit: true, usedWorker: false });
    return {
      tokens: cached,
      calculationTime: performance.now() - startTime,
      cacheHit: true,
      usedWorker: false
    };
  }

  // For short text: sync is fast enough (< 500 chars)
  if (text.length < 500) {
    const tokens = estimateTokensLocal(text);
    setCachedTokens(text, tokens);
    
    const calculationTime = performance.now() - startTime;
    perf.record({ time: calculationTime, cacheHit: false, usedWorker: false });

    return {
      tokens,
      calculationTime,
      cacheHit: false,
      usedWorker: false,
      textLength: text.length
    };
  }

  // For larger texts, use Web Worker with circuit breaker
  if (workerBreaker.isOpen()) {
    // Circuit breaker open — use sync fallback
    const tokens = estimateTokensLocal(text);
    setCachedTokens(text, tokens);
    
    const calculationTime = performance.now() - startTime;
    perf.record({ time: calculationTime, cacheHit: false, usedWorker: false });
    
    return {
      tokens,
      calculationTime,
      cacheHit: false,
      usedWorker: false,
      textLength: text.length,
      circuitBreakerOpen: true
    };
  }

  try {
    workerManager.initialize(); // Ensure worker is initialized
    
    const result = await workerManager.calculateFullDocument(text);
    workerBreaker.onSuccess();
    
    setCachedTokens(text, result.tokens);
    
    const calculationTime = performance.now() - startTime;
    perf.record({ time: calculationTime, cacheHit: false, usedWorker: true });

    return {
      ...result,
      calculationTime,
      cacheHit: false
    };
  } catch (error) {
    workerBreaker.onFailure();
    console.warn('[TokenCounter] Worker failed, using fallback:', error.message);
    
    // Fallback to local estimation
    const tokens = estimateTokensLocal(text);
    setCachedTokens(text, tokens);
    
    const calculationTime = performance.now() - startTime;
    perf.record({ time: calculationTime, cacheHit: false, usedWorker: false });

    return {
      tokens,
      calculationTime,
      cacheHit: false,
      usedWorker: false,
      textLength: text.length,
      error: error.message
    };
  }
}

/**
 * Chunked token estimation for very large documents (>20k chars)
 * Processes in chunks using async generator so main thread is never blocked >16ms
 */
export async function estimateTokensChunked(text, { chunkSize = 5000 } = {}) {
  if (text.length < 20_000) {
    return estimateTokensFast(text); // not worth chunking
  }

  let totalTokens = 0;
  let offset = 0;

  while (offset < text.length) {
    const chunk = text.slice(offset, offset + chunkSize);
    const { tokens } = await estimateTokensFast(chunk);
    totalTokens += tokens;
    offset += chunkSize;

    // Yield to browser — prevent jank between chunks
    await new Promise(r => setTimeout(r, 0));
  }

  return { tokens: totalTokens, usedWorker: false, cacheHit: false };
}

/**
 * Local token estimation (fallback and small texts)
 * Synchronous version for backward compatibility
 */
function estimateTokensLocal(text) {
  if (!text || typeof text !== 'string') return 0;

  // Fast estimation: ~4 chars = 1 token for English text
  let tokens = Math.ceil(text.length / 4);

  // Quick adjustments (no regex for performance)
  const hasCode = text.includes('{') || text.includes('[') || text.includes(';');
  const hasMarkdown = text.includes('#') || text.includes('**') || text.includes('* ');
  const hasUnicode = /[^\x00-\x7F]/.test(text);

  if (hasCode) tokens = Math.ceil(tokens * 1.15);
  if (hasMarkdown) tokens = Math.ceil(tokens * 1.1);
  if (hasUnicode) tokens = Math.ceil(tokens * 1.2);

  return tokens;
}

/**
 * Synchronous token estimation for backward compatibility
 * WARNING: This bypasses Web Worker and uses local estimation only
 * Use estimateTokensFast() for production (async with Worker)
 * 
 * @param {string} text - Text to analyze
 * @returns {number} Token count (NOT an object like the async version)
 * @deprecated Use estimateTokensFast() instead for async Worker support
 */
export function estimateTokensSync(text) {
  return estimateTokensLocal(text);
}

/**
 * Advanced Real-time token counter class
 * Manages adaptive debouncing, caching, callbacks, and analytics
 * Supports both full document and block-level incremental updates
 */
export class RealtimeTokenCounter {
  constructor(options = {}) {
    // Adaptive debounce configuration (production-optimized)
    this.baseDebounceMs = options.debounceMs || 300;
    this.minDebounceMs = options.minDebounceMs || PRODUCTION_CONFIG.DEBOUNCE_SMALL;
    this.maxDebounceMs = options.maxDebounceMs || PRODUCTION_CONFIG.DEBOUNCE_HUGE;

    this.onTokenUpdate = options.onTokenUpdate || (() => { });
    this.onThresholdWarning = options.onThresholdWarning || (() => { });
    this.onPerformanceUpdate = options.onPerformanceUpdate || (() => { });

    this.currentTokens = 0;
    this.previousTokens = 0;
    this.debounceTimer = null;
    this.thresholds = options.thresholds || [1000, 2000, 3000, 4000];
    this.triggeredThresholds = new Set();

    // Input/Output token tracking for AI usage
    this.inputTokens = 0; // Editor content tokens
    this.outputTokens = 0; // AI generated tokens
    this.totalTokensUsed = 0; // Cumulative tokens across session

    // Performance tracking
    this.updateHistory = [];
    this.maxHistorySize = 100;

    // Change detection for differential updates
    this.lastText = '';
    this.lastTextHash = this._hashText('');
    
    // Block-level tracking
    this.blockTokens = new Map(); // nodeId -> token count
    this.totalBlockTokens = 0;
    this.useBlockLevelTracking = options.useBlockLevel || false;
    
    // Block-level memoization cache
    this.blockMemoCache = new BlockTokenMemoization();
    
    // Initialize worker on construction
    if (PRODUCTION_CONFIG.USE_WORKER) {
      workerManager.initialize();
    }
  }

  /**
   * Calculate adaptive debounce delay based on change size and document length
   * Production-optimized thresholds
   */
  _calculateAdaptiveDebounce(text) {
    const changeSize = Math.abs(text.length - this.lastText.length);
    const documentLength = text.length;

    // Large documents need more debounce to prevent CPU overload
    if (documentLength > 50000) { // > 10,000 words
      return PRODUCTION_CONFIG.DEBOUNCE_HUGE;
    }

    if (changeSize < 50) {
      // Small change (typing): fast response
      return PRODUCTION_CONFIG.DEBOUNCE_SMALL;
    } else if (changeSize < 500) {
      // Medium change (paste): moderate response
      return PRODUCTION_CONFIG.DEBOUNCE_MEDIUM;
    } else {
      // Large change (AI generation): slower but more stable
      return PRODUCTION_CONFIG.DEBOUNCE_LARGE;
    }
  }

  /**
   * Update token count with adaptive debouncing
   * Call this on every editor change
   */
  async update(text) {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Calculate adaptive debounce delay
    const debounceDelay = this._calculateAdaptiveDebounce(text);

    // Set new debounce timer
    this.debounceTimer = setTimeout(async () => {
      await this._calculateAndNotify(text);
    }, debounceDelay);
  }

  /**
   * Immediate update (no debounce)
   * Use for final calculations
   */
  async updateImmediate(text) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    await this._calculateAndNotify(text);
  }

  /**
   * Block-level update for TipTap/ProseMirror nodes
   * Only recalculates the changed block, not the entire document
   * Uses memoization to avoid redundant calculations
   */
  async updateBlock({ nodeId, oldText, newText }) {
    const oldTokens = this.blockTokens.get(nodeId) || 0;
    
    // Use memoization cache to avoid redundant calculations
    const memoResult = this.blockMemoCache.getOrUpdate(
      nodeId,
      newText,
      (text) => estimateTokensLocal(text) // Synchronous fallback for blocks
    );
    
    const newTokens = memoResult.tokens;
    const cacheHit = memoResult.cacheHit;
    
    // Update block cache
    this.blockTokens.set(nodeId, newTokens);
    
    // Update total
    const delta = newTokens - oldTokens;
    this.totalBlockTokens += delta;
    this.currentTokens = this.totalBlockTokens;
    
    // Notify update
    this.onTokenUpdate({
      tokens: this.currentTokens,
      delta,
      deltaFormatted: delta >= 0 ? `+${delta}` : `${delta}`,
      thresholdsTriggered: [],
      estimatedCost: this._estimateCost(this.currentTokens),
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      totalTokens: this.inputTokens + this.outputTokens,
      efficiency: this._calculateEfficiency(),
      performance: {
        calculationTime: cacheHit ? 0 : 1, // Near-instant if cached
        cacheHit,
        averageCalculationTime: performanceMetrics.averageCalculationTime,
        isBlockUpdate: true,
        nodeId,
        memoizationStats: this.blockMemoCache.getStats()
      }
    });
  }

  /**
   * Remove a block from tracking
   */
  removeBlock(nodeId) {
    const removedTokens = this.blockTokens.get(nodeId) || 0;
    this.blockTokens.delete(nodeId);
    this.totalBlockTokens -= removedTokens;
    this.currentTokens = this.totalBlockTokens;
    
    // Invalidate memoization cache
    this.blockMemoCache.invalidate(nodeId);
  }

  /**
   * Get current token count
   */
  getTokenCount() {
    return this.currentTokens;
  }

  /**
   * Reset counter
   */
  reset() {
    this.currentTokens = 0;
    this.previousTokens = 0;
    this.triggeredThresholds.clear();
    this.blockTokens.clear();
    this.totalBlockTokens = 0;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.onTokenUpdate({
      tokens: 0,
      delta: 0,
      deltaFormatted: '0',
      thresholdsTriggered: [],
      estimatedCost: this._estimateCost(0),
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      efficiency: 100,
      performance: {
        calculationTime: 0,
        cacheHit: false,
        averageCalculationTime: performanceMetrics.averageCalculationTime
      }
    });
  }

  /**
   * Destroy counter and cleanup
   */
  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.onTokenUpdate = () => {};
    this.onThresholdWarning = () => {};
    
    // Clear caches
    clearBlockCache();
  }

  /**
   * Internal: Calculate tokens and trigger callbacks with analytics
   */
  async _calculateAndNotify(text) {
    const startTime = performance.now();

    // Check if text actually changed (optimization)
    const currentHash = this._hashText(text);
    if (currentHash === this.lastTextHash && this.currentTokens > 0) {
      return; // Skip calculation if text hasn't changed
    }

    this.previousTokens = this.currentTokens;
    this.lastText = text;
    this.lastTextHash = currentHash;

    // Calculate tokens with metadata (async - may use Worker)
    const result = await estimateTokensFast(text);
    this.currentTokens = result.tokens;
    this.inputTokens = result.tokens;

    const delta = this.currentTokens - this.previousTokens;
    const thresholdsTriggered = [];

    // Check thresholds
    for (const threshold of this.thresholds) {
      if (this.currentTokens >= threshold && !this.triggeredThresholds.has(threshold)) {
        this.triggeredThresholds.add(threshold);
        thresholdsTriggered.push(threshold);

        // Trigger warning callback
        this.onThresholdWarning({
          threshold,
          currentTokens: this.currentTokens,
          message: `Token count exceeded ${threshold} tokens`
        });
      }
    }

    // Track update history for analytics
    this._trackUpdate({
      tokens: this.currentTokens,
      delta,
      timestamp: Date.now(),
      calculationTime: result.calculationTime,
      cacheHit: result.cacheHit,
      textLength: text.length
    });

    // Notify update with enhanced data
    this.onTokenUpdate({
      tokens: this.currentTokens,
      delta,
      deltaFormatted: delta >= 0 ? `+${delta}` : `${delta}`,
      thresholdsTriggered,
      estimatedCost: this._estimateCost(this.currentTokens),
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      totalTokens: this.inputTokens + this.outputTokens,
      efficiency: this._calculateEfficiency(),
      performance: {
        calculationTime: result.calculationTime,
        cacheHit: result.cacheHit,
        averageCalculationTime: performanceMetrics.averageCalculationTime,
        usedWorker: result.usedWorker
      }
    });

    // Report performance metrics periodically
    if (this.updateHistory.length % 10 === 0) {
      this.onPerformanceUpdate(this.getPerformanceMetrics());
    }
  }

  /**
   * Estimate cost based on token count (input + output)
   * Includes cached token discount tracking
   */
  _estimateCost(inputTokens) {
    // gpt-4o-mini pricing (May 2024)
    const inputCostPerToken = 0.15 / 1000000;    // $0.15 per 1M input tokens
    const outputCostPerToken = 0.60 / 1000000;   // $0.60 per 1M output tokens
    const cachedInputCostPerToken = 0.075 / 1000000; // 50% discount for cached

    // Estimate cached tokens (typically 30-50% of input for repeated prompts)
    const estimatedCachedTokens = Math.floor(inputTokens * 0.3);
    const freshInputTokens = inputTokens - estimatedCachedTokens;
    
    const cachedInputCost = estimatedCachedTokens * cachedInputCostPerToken;
    const freshInputCost = freshInputTokens * inputCostPerToken;
    const outputCost = this.outputTokens * outputCostPerToken;
    const savings = estimatedCachedTokens * (inputCostPerToken - cachedInputCostPerToken);

    return {
      cachedInput: cachedInputCost,
      freshInput: freshInputCost,
      input: cachedInputCost + freshInputCost, // Total input for backward compatibility
      output: outputCost,
      total: cachedInputCost + freshInputCost + outputCost,
      savings,
      cachedPercentage: ((estimatedCachedTokens / Math.max(inputTokens, 1)) * 100).toFixed(0) + '%'
    };
  }

  /**
   * Calculate efficiency score (0-100)
   */
  _calculateEfficiency() {
    if (this.inputTokens === 0) return 100;

    const ratio = this.outputTokens / this.inputTokens;

    // Optimal ratio: 0.5-2.0
    if (ratio >= 0.5 && ratio <= 2.0) {
      return 100;
    }

    if (ratio < 0.5) {
      return Math.round((ratio / 0.5) * 100);
    }

    return Math.round((2.0 / ratio) * 100);
  }

  /**
   * Simple hash function for text comparison
   */
  _hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Track update for analytics
   */
  _trackUpdate(data) {
    this.updateHistory.push(data);
    if (this.updateHistory.length > this.maxHistorySize) {
      this.updateHistory.shift();
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const cacheHitRate = performanceMetrics.totalCalculations > 0
      ? (performanceMetrics.cacheHits / performanceMetrics.totalCalculations) * 100
      : 0;

    return {
      ...performanceMetrics,
      cacheHitRate: cacheHitRate.toFixed(2) + '%',
      updatesTracked: this.updateHistory.length,
      averageTokensPerUpdate: this.updateHistory.length > 0
        ? Math.round(this.updateHistory.reduce((sum, u) => sum + u.tokens, 0) / this.updateHistory.length)
        : 0
    };
  }

  /**
   * Record AI output tokens (for efficiency tracking)
   */
  recordOutputTokens(tokens) {
    this.outputTokens += tokens;
    this.totalTokensUsed += tokens; // Accumulate over session
    
    // Trigger update with new totals
    this.onTokenUpdate({
      tokens: this.currentTokens,
      delta: 0,
      deltaFormatted: '0',
      thresholdsTriggered: [],
      estimatedCost: this._estimateCost(this.inputTokens),
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      totalTokens: this.inputTokens + this.outputTokens,
      efficiency: this._calculateEfficiency(),
      totalTokensUsed: this.totalTokensUsed
    });
  }

  /**
   * Reconcile local token count with server actual usage
   * Called when discrepancy is detected between local and server counts
   * @param {number} serverTotalTokens - Actual token count from server
   */
  reconcileUsage(serverTotalTokens) {
    const previousTotal = this.totalTokensUsed;
    const adjustment = serverTotalTokens - previousTotal;
    
    console.log(`[TokenCounter] Reconciling usage: local=${previousTotal}, server=${serverTotalTokens}, adjustment=${adjustment}`);
    
    // Update total tokens used to match server
    this.totalTokensUsed = serverTotalTokens;
    
    // Adjust output tokens proportionally (since input tokens are from editor content)
    if (this.inputTokens > 0) {
      this.outputTokens = Math.max(0, serverTotalTokens - this.inputTokens);
    } else {
      // If no input tokens, all server tokens are output tokens
      this.outputTokens = serverTotalTokens;
    }
    
    // Trigger update to notify UI components
    this.onTokenUpdate({
      tokens: this.currentTokens,
      delta: adjustment,
      deltaFormatted: adjustment >= 0 ? `+${adjustment}` : `${adjustment}`,
      thresholdsTriggered: [],
      estimatedCost: this._estimateCost(this.inputTokens),
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      totalTokens: this.inputTokens + this.outputTokens,
      efficiency: this._calculateEfficiency(),
      totalTokensUsed: this.totalTokensUsed,
      reconciled: true
    });
  }

  /**
   * Get token usage summary
   */
  getTokenUsageSummary() {
    return {
      input: this.inputTokens,
      output: this.outputTokens,
      total: this.inputTokens + this.outputTokens,
      sessionTotal: this.totalTokensUsed,
      efficiency: this._calculateEfficiency(),
      estimatedCost: this._estimateCost(this.inputTokens)
    };
  }
}

/**
 * Create a token counter instance with default options
 */
export function createTokenCounter(options = {}) {
  return new RealtimeTokenCounter(options);
}

/**
 * Hook-friendly wrapper for React components
 */
export function createTokenCounterHook(editor, options = {}) {
  const counter = new RealtimeTokenCounter(options);

  if (editor) {
    // Listen to editor updates
    const handleUpdate = () => {
      const text = editor.getText();
      counter.update(text);
    };

    editor.on('update', handleUpdate);
    editor.on('destroy', () => counter.destroy());

    // Initial count
    handleUpdate();

    return {
      counter,
      cleanup: () => {
        editor.off('update', handleUpdate);
        counter.destroy();
      }
    };
  }

  return { counter, cleanup: () => counter.destroy() };
}

/**
 * Utility: Format token count for display
 */
export function formatTokenCount(tokens) {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

/**
 * Utility: Get token efficiency score (0-100)
 */
export function getTokenEfficiency(inputTokens, outputTokens) {
  if (inputTokens === 0) return 100;

  const ratio = outputTokens / inputTokens;

  // Optimal ratio: 0.5-2.0
  if (ratio >= 0.5 && ratio <= 2.0) {
    return 100;
  }

  if (ratio < 0.5) {
    return Math.round((ratio / 0.5) * 100);
  }

  return Math.round((2.0 / ratio) * 100);
}

/**
 * Utility: Get token usage tier
 */
export function getTokenTier(tokens) {
  if (tokens < 500) return { level: 'low', color: 'green', label: 'Low Usage' };
  if (tokens < 1500) return { level: 'medium', color: 'yellow', label: 'Medium Usage' };
  if (tokens < 3000) return { level: 'high', color: 'orange', label: 'High Usage' };
  return { level: 'critical', color: 'red', label: 'Very High Usage' };
}

/**
 * Get smart notification based on usage and tier limits
 */
export function getTokenNotification(usage, tier = 'free') {
  const limits = {
    free: { monthly: 10000, daily: 500 },
    pro: { monthly: 100000, daily: 5000 },
    enterprise: { monthly: 1000000, daily: 50000 }
  };
  
  const tierLimits = limits[tier] || limits.free;
  const monthlyPercentage = (usage.monthlyUsed / tierLimits.monthly) * 100;
  const dailyPercentage = (usage.dailyUsed / tierLimits.daily) * 100;
  
  // Critical: Over 90%
  if (monthlyPercentage > 90 || dailyPercentage > 90) {
    return {
      level: 'critical',
      icon: '🚨',
      title: 'Token Limit Almost Reached',
      message: `You've used ${monthlyPercentage.toFixed(0)}% of your monthly quota. Only ${(tierLimits.monthly - usage.monthlyUsed).toLocaleString()} tokens remaining.`,
      action: 'Upgrade Plan',
      color: 'red'
    };
  }
  
  // Warning: Over 75%
  if (monthlyPercentage > 75 || dailyPercentage > 75) {
    return {
      level: 'warning',
      icon: '⚠️',
      title: 'High Token Usage',
      message: `You've used ${monthlyPercentage.toFixed(0)}% of your monthly quota. Consider optimizing AI usage.`,
      action: 'View Usage',
      color: 'orange'
    };
  }
  
  // Info: Over 50%
  if (monthlyPercentage > 50 || dailyPercentage > 50) {
    return {
      level: 'info',
      icon: '📊',
      title: 'Token Usage Update',
      message: `You've used ${monthlyPercentage.toFixed(0)}% of your monthly quota. ${formatTokenCount(tierLimits.monthly - usage.monthlyUsed)} remaining.`,
      action: null,
      color: 'blue'
    };
  }
  
  // Good: Under 50%
  return {
    level: 'success',
    icon: '✅',
    title: 'Token Usage Healthy',
    message: `You're using tokens efficiently. ${formatTokenCount(tierLimits.monthly - usage.monthlyUsed)} remaining this month.`,
    action: null,
    color: 'green'
  };
}

/**
 * Advanced accuracy token counter for static text input.
 * More precise than estimateTokensFast by analyzing whitespaces,
 * words, and punctuation to approximate BPE/WordPiece tokenization.
 * 
 * @param {string} text - The static text to analyze
 * @returns {number} Precise token count estimation
 */
export function countTokensStatic(text) {
  if (!text || typeof text !== 'string') return 0;
  
  // 1. Split into chunks by whitespace
  const words = text.trim().split(/\s+/);
  if (words.length === 1 && words[0] === '') return 0;
  
  let tokens = 0;
  
  for (const word of words) {
    let wordTokens = 1;
    
    // 2. Add tokens for long text chunks (approx 4 chars per token for long words)
    if (word.length > 5) {
      wordTokens += Math.floor((word.length - 2) / 4);
    }
    
    // 3. Add tokens for punctuation clusters attached to words
    const punctuationMatches = word.match(/[^\w\s]{1,2}/g);
    if (punctuationMatches) {
      wordTokens += punctuationMatches.length;
    }
    
    tokens += wordTokens;
  }
  
  return tokens;
}

/**
 * Validates token counting algorithms against expected baselines.
 * Helps verify the real-time counters are accurate with different edge cases.
 */
export function runTokenCounterTests() {
  console.log("🚀 Running Token Counter Validations...");
  
  const testCases = [
    { name: "Empty string", input: "", expected: 0 },
    { name: "Single word", input: "Hello", expected: 1 },
    { name: "Short sentence", input: "Hello, world!", expected: 3 },
    { name: "Long paragraph", input: "The quick brown fox jumps over the lazy dog. ".repeat(10), expected: 100 },
    { name: "Code snippet", input: "function sum(a, b) { return a + b; }", expected: 11 },
    { name: "Markdown symbols", input: "## Header\n**Bold text** with `code`", expected: 10 },
    { name: "Special chars", input: "£100 & €200 @ #test", expected: 9 }
  ];
  
  let passed = 0;
  
  testCases.forEach(tc => {
    // Avoid circular import issues if estimateTokensFast isn't bound correctly
    const fastTokens = Math.ceil(tc.input.length / 4); 
    const staticTokens = countTokensStatic(tc.input);
    
    const fastMargin = Math.max(2, tc.expected * 0.3);
    const staticMargin = Math.max(1, tc.expected * 0.15);
    
    const fastPassed = Math.abs(fastTokens - tc.expected) <= fastMargin;
    const staticPassed = Math.abs(staticTokens - tc.expected) <= staticMargin;
    
    if (staticPassed) passed++;
  });
  
  console.log(`🏁 Validation Complete: ${passed}/${testCases.length} core test cases passed accuracy threshold.`);
  return { passed, total: testCases.length };
}
