/**
 * aiCache.js - Intelligent caching layer for AI responses
 * Reduces token costs by caching common requests
 */

const crypto = require('crypto');

// In-memory cache (use Redis in production)
const cache = new Map();

// Cache configuration
const CACHE_CONFIG = {
  // TTL (Time To Live) in milliseconds
  ttl: {
    'transform': 7 * 24 * 60 * 60 * 1000,     // 7 days for transformations
    'generate': 24 * 60 * 60 * 1000,           // 24 hours for generation
    'chat': 0,                                  // Don't cache chat (contextual)
    'image-generate': 30 * 24 * 60 * 60 * 1000 // 30 days for images
  },
  
  // Maximum cache size (entries)
  maxSize: 10000,
  
  // Cache enabled endpoints
  enabled: ['transform', 'generate', 'image-generate']
};

/**
 * Generate cache key from request
 */
function generateCacheKey(endpoint, body) {
  // Normalize body for consistent hashing
  const normalized = {
    endpoint,
    action: body.action || null,
    text: body.text || null,
    prompt: body.prompt || body.userPrompt || null,
    temperature: body.temperature || 0.7,
    model: body.model || 'gpt-4o-mini'
  };
  
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(normalized))
    .digest('hex');
  
  return `ai:${endpoint}:${hash}`;
}

/**
 * Check if request should be cached
 */
function shouldCache(endpoint, body) {
  // Check if endpoint is cacheable
  if (!CACHE_CONFIG.enabled.includes(endpoint)) {
    return false;
  }
  
  // Don't cache if temperature is too high (too random)
  if (body.temperature > 0.8) {
    return false;
  }
  
  // Don't cache streaming requests
  if (body.stream === true) {
    return false;
  }
  
  // Don't cache empty requests
  if (!body.text && !body.prompt && !body.userPrompt) {
    return false;
  }
  
  return true;
}

/**
 * Get cached response
 */
function getCache(endpoint, body) {
  if (!shouldCache(endpoint, body)) {
    return null;
  }
  
  const key = generateCacheKey(endpoint, body);
  const cached = cache.get(key);
  
  if (!cached) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > cached.expiry) {
    cache.delete(key);
    return null;
  }
  
  console.log(`[AI Cache] HIT: ${key.substring(0, 20)}...`);
  
  return {
    result: cached.result,
    fromCache: true,
    cachedAt: cached.timestamp
  };
}

/**
 * Store response in cache
 */
function setCache(endpoint, body, result) {
  if (!shouldCache(endpoint, body)) {
    return;
  }
  
  // Enforce cache size limit
  if (cache.size >= CACHE_CONFIG.maxSize) {
    // Remove oldest entries (simple LRU)
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  
  const key = generateCacheKey(endpoint, body);
  const ttl = CACHE_CONFIG.ttl[endpoint] || 24 * 60 * 60 * 1000;
  
  cache.set(key, {
    result,
    timestamp: Date.now(),
    expiry: Date.now() + ttl
  });
  
  console.log(`[AI Cache] SET: ${key.substring(0, 20)}...`);
}

/**
 * Clear cache (for maintenance or testing)
 */
function clearCache(endpoint = null) {
  if (endpoint) {
    // Clear specific endpoint
    for (const key of cache.keys()) {
      if (key.startsWith(`ai:${endpoint}:`)) {
        cache.delete(key);
      }
    }
    console.log(`[AI Cache] Cleared cache for: ${endpoint}`);
  } else {
    // Clear all
    cache.clear();
    console.log('[AI Cache] Cleared all cache');
  }
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  const now = Date.now();
  let totalEntries = 0;
  let expiredEntries = 0;
  let totalSize = 0;
  
  const endpointStats = {};
  
  for (const [key, value] of cache.entries()) {
    totalEntries++;
    
    // Check if expired
    if (now > value.expiry) {
      expiredEntries++;
    }
    
    // Estimate size (rough)
    totalSize += JSON.stringify(value).length;
    
    // Extract endpoint from key
    const endpoint = key.split(':')[1];
    if (!endpointStats[endpoint]) {
      endpointStats[endpoint] = 0;
    }
    endpointStats[endpoint]++;
  }
  
  return {
    totalEntries,
    expiredEntries,
    activeEntries: totalEntries - expiredEntries,
    estimatedSizeBytes: totalSize,
    estimatedSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    maxEntries: CACHE_CONFIG.maxSize,
    utilization: ((totalEntries / CACHE_CONFIG.maxSize) * 100).toFixed(1) + '%',
    endpoints: endpointStats
  };
}

/**
 * Cleanup expired entries (run periodically)
 */
function cleanupExpired() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, value] of cache.entries()) {
    if (now > value.expiry) {
      cache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[AI Cache] Cleaned ${cleaned} expired entries`);
  }
  
  return cleaned;
}

// Auto-cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpired, 60 * 60 * 1000);
}

module.exports = {
  getCache,
  setCache,
  clearCache,
  getCacheStats,
  cleanupExpired,
  CACHE_CONFIG
};
