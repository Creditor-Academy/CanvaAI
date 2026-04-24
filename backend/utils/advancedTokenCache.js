/**
 * advancedTokenCache.js - Multi-tier caching system for token counting
 * Implements exact match, semantic similarity, and pattern-based caching
 */

const crypto = require('crypto');

class AdvancedTokenCache {
  constructor(options = {}) {
    // Tier 1: Exact match cache (fastest)
    this.exactCache = new Map();
    this.exactCacheMaxSize = options.exactCacheSize || 2000;
    this.exactCacheTTL = options.exactCacheTTL || 300000; // 5 minutes
    
    // Tier 2: Hash-based similar content cache
    this.similarCache = new Map();
    this.similarCacheMaxSize = options.similarCacheSize || 1000;
    this.similarityThreshold = options.similarityThreshold || 0.85;
    
    // Tier 3: Pattern/structure cache
    this.patternCache = new Map();
    this.patternCacheMaxSize = options.patternCacheSize || 500;
    
    // Statistics
    this.stats = {
      exactHits: 0,
      similarHits: 0,
      patternHits: 0,
      misses: 0,
      totalRequests: 0
    };
  }

  /**
   * Get token count with multi-tier caching
   * @param {string} text - Input text
   * @param {Function} computeFn - Function to compute tokens if cache miss
   * @returns {object} { tokens, cacheHit, hitType }
   */
  async get(text, computeFn) {
    this.stats.totalRequests++;
    
    // Tier 1: Exact match
    const exactResult = this._getExact(text);
    if (exactResult !== null) {
      this.stats.exactHits++;
      return { tokens: exactResult, cacheHit: true, hitType: 'exact' };
    }
    
    // Tier 2: Similar content
    const similarResult = await this._getSimilar(text);
    if (similarResult !== null) {
      this.stats.similarHits++;
      return { tokens: similarResult, cacheHit: true, hitType: 'similar' };
    }
    
    // Tier 3: Pattern match
    const patternResult = this._getPattern(text);
    if (patternResult !== null) {
      this.stats.patternHits++;
      return { tokens: patternResult, cacheHit: true, hitType: 'pattern' };
    }
    
    // Cache miss - compute
    this.stats.misses++;
    const tokens = await computeFn(text);
    
    // Store in all applicable caches
    this._storeExact(text, tokens);
    this._storeSimilar(text, tokens);
    this._storePattern(text, tokens);
    
    return { tokens, cacheHit: false, hitType: null };
  }

  /**
   * Tier 1: Exact match cache
   */
  _getExact(text) {
    const cached = this.exactCache.get(text);
    if (!cached) return null;
    
    // Check TTL
    if (Date.now() - cached.timestamp > this.exactCacheTTL) {
      this.exactCache.delete(text);
      return null;
    }
    
    return cached.tokens;
  }

  _storeExact(text, tokens) {
    // Evict oldest if cache is full
    if (this.exactCache.size >= this.exactCacheMaxSize) {
      const oldestKey = this.exactCache.keys().next().value;
      this.exactCache.delete(oldestKey);
    }
    
    this.exactCache.set(text, {
      tokens,
      timestamp: Date.now()
    });
  }

  /**
   * Tier 2: Similar content using MinHash
   */
  async _getSimilar(text) {
    const textHash = this._minHash(text);
    
    for (const [hash, data] of this.similarCache) {
      const similarity = this._calculateSimilarity(textHash, hash);
      if (similarity >= this.similarityThreshold) {
        // Scale tokens based on length difference
        const lengthRatio = text.length / data.textLength;
        return Math.round(data.tokens * lengthRatio);
      }
    }
    
    return null;
  }

  _storeSimilar(text, tokens) {
    if (this.similarCache.size >= this.similarCacheMaxSize) {
      const oldestKey = this.similarCache.keys().next().value;
      this.similarCache.delete(oldestKey);
    }
    
    const hash = this._minHash(text);
    this.similarCache.set(hash, {
      tokens,
      textLength: text.length,
      timestamp: Date.now()
    });
  }

  /**
   * Tier 3: Pattern/structure cache
   */
  _getPattern(text) {
    const pattern = this._extractPattern(text);
    const cached = this.patternCache.get(pattern);
    
    if (!cached) return null;
    
    // Check if pattern is still valid (5 min TTL)
    if (Date.now() - cached.timestamp > 300000) {
      this.patternCache.delete(pattern);
      return null;
    }
    
    // Scale based on content length
    const lengthRatio = text.length / cached.avgLength;
    return Math.round(cached.tokens * lengthRatio);
  }

  _storePattern(text, tokens) {
    if (this.patternCache.size >= this.patternCacheMaxSize) {
      const oldestKey = this.patternCache.keys().next().value;
      this.patternCache.delete(oldestKey);
    }
    
    const pattern = this._extractPattern(text);
    const existing = this.patternCache.get(pattern);
    
    if (existing) {
      // Update average
      existing.count++;
      existing.avgLength = (existing.avgLength * (existing.count - 1) + text.length) / existing.count;
      existing.tokens = (existing.tokens * (existing.count - 1) + tokens) / existing.count;
      existing.timestamp = Date.now();
    } else {
      this.patternCache.set(pattern, {
        tokens,
        avgLength: text.length,
        count: 1,
        timestamp: Date.now()
      });
    }
  }

  /**
   * MinHash for similarity detection
   */
  _minHash(text) {
    // Simple shingle-based hash
    const shingles = this._getShingles(text, 3);
    const hashes = shingles.map(s => 
      parseInt(crypto.createHash('md5').update(s).digest('hex').slice(0, 8), 16)
    );
    return hashes.sort((a, b) => a - b).slice(0, 10).join(',');
  }

  _getShingles(text, k) {
    const shingles = [];
    const words = text.toLowerCase().split(/\s+/);
    
    for (let i = 0; i <= words.length - k; i++) {
      shingles.push(words.slice(i, i + k).join(' '));
    }
    
    return shingles;
  }

  _calculateSimilarity(hash1, hash2) {
    const arr1 = hash1.split(',').map(Number);
    const arr2 = hash2.split(',').map(Number);
    
    let matches = 0;
    for (const val of arr1) {
      if (arr2.includes(val)) matches++;
    }
    
    return matches / Math.max(arr1.length, arr2.length);
  }

  /**
   * Extract structural pattern from text
   */
  _extractPattern(text) {
    return text
      .replace(/[a-zA-Z]+/g, 'WORD')
      .replace(/\d+/g, 'NUM')
      .replace(/[^\w\s]/g, 'PUNCT')
      .slice(0, 100); // Limit pattern length
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.exactHits + this.stats.similarHits + 
                  this.stats.patternHits + this.stats.misses;
    
    return {
      ...this.stats,
      hitRate: total > 0 ? ((total - this.stats.misses) / total * 100).toFixed(2) + '%' : '0%',
      exactHitRate: total > 0 ? (this.stats.exactHits / total * 100).toFixed(2) + '%' : '0%',
      similarHitRate: total > 0 ? (this.stats.similarHits / total * 100).toFixed(2) + '%' : '0%',
      patternHitRate: total > 0 ? (this.stats.patternHits / total * 100).toFixed(2) + '%' : '0%',
      cacheSizes: {
        exact: this.exactCache.size,
        similar: this.similarCache.size,
        pattern: this.patternCache.size
      }
    };
  }

  /**
   * Clear all caches
   */
  clear() {
    this.exactCache.clear();
    this.similarCache.clear();
    this.patternCache.clear();
    this.stats = {
      exactHits: 0,
      similarHits: 0,
      patternHits: 0,
      misses: 0,
      totalRequests: 0
    };
  }
}

module.exports = AdvancedTokenCache;
