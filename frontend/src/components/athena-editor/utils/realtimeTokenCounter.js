/**
 * realtimeTokenCounter.js - Real-time token counting for editor content
 * Optimized for performance with debouncing and efficient estimation
 */

// Token estimation cache for performance
const tokenCache = new Map();
const MAX_CACHE_SIZE = 1000;

/**
 * Estimate tokens for text (optimized version)
 * Uses character-based approximation with caching
 */
export function estimateTokensFast(text) {
  if (!text || typeof text !== 'string') return 0;
  
  // Check cache first
  if (tokenCache.has(text)) {
    return tokenCache.get(text);
  }
  
  // Fast estimation: ~4 chars = 1 token for English text
  let tokens = Math.ceil(text.length / 4);
  
  // Quick adjustments (no regex for performance)
  const hasCode = text.includes('{') || text.includes('[') || text.includes(';');
  const hasMarkdown = text.includes('#') || text.includes('**') || text.includes('* ');
  const hasUnicode = /[^\x00-\x7F]/.test(text);
  
  if (hasCode) tokens = Math.ceil(tokens * 1.15);
  if (hasMarkdown) tokens = Math.ceil(tokens * 1.1);
  if (hasUnicode) tokens = Math.ceil(tokens * 1.2);
  
  // Cache result
  if (tokenCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry
    const firstKey = tokenCache.keys().next().value;
    tokenCache.delete(firstKey);
  }
  tokenCache.set(text, tokens);
  
  return tokens;
}

/**
 * Real-time token counter class
 * Manages debouncing, caching, and callbacks
 */
export class RealtimeTokenCounter {
  constructor(options = {}) {
    this.debounceMs = options.debounceMs || 300; // Default: 300ms
    this.onTokenUpdate = options.onTokenUpdate || (() => {});
    this.onThresholdWarning = options.onThresholdWarning || (() => {});
    
    this.currentTokens = 0;
    this.previousTokens = 0;
    this.debounceTimer = null;
    this.thresholds = options.thresholds || [1000, 2000, 3000, 4000];
    this.triggeredThresholds = new Set();
  }
  
  /**
   * Update token count with debouncing
   * Call this on every editor change
   */
  update(text) {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Set new debounce timer
    this.debounceTimer = setTimeout(() => {
      this._calculateAndNotify(text);
    }, this.debounceMs);
  }
  
  /**
   * Immediate update (no debounce)
   * Use for final calculations
   */
  updateImmediate(text) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this._calculateAndNotify(text);
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
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    this.onTokenUpdate({
      tokens: 0,
      delta: 0,
      thresholdsTriggered: []
    });
  }
  
  /**
   * Destroy counter and cleanup
   */
  destroy() {
    this.reset();
    this.onTokenUpdate = null;
    this.onThresholdWarning = null;
  }
  
  /**
   * Internal: Calculate tokens and trigger callbacks
   */
  _calculateAndNotify(text) {
    this.previousTokens = this.currentTokens;
    this.currentTokens = estimateTokensFast(text);
    
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
    
    // Notify update
    this.onTokenUpdate({
      tokens: this.currentTokens,
      delta,
      deltaFormatted: delta >= 0 ? `+${delta}` : `${delta}`,
      thresholdsTriggered,
      estimatedCost: this._estimateCost(this.currentTokens)
    });
  }
  
  /**
   * Estimate cost based on token count
   */
  _estimateCost(tokens) {
    // gpt-4o-mini: $0.15 per 1M input tokens
    const costPerToken = 0.15 / 1000000;
    return tokens * costPerToken;
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
