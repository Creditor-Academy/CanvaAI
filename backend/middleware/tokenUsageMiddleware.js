/**
 * tokenUsageMiddleware.js - Comprehensive error handling and logging for token counter
 */

const { estimateTokens, calculateCost } = require('../utils/tokenCounter');

/**
 * Validate token usage data
 */
const validateTokenUsage = (req, res, next) => {
  const { inputTokens, outputTokens, model } = req.body;
  
  // Validate input tokens
  if (inputTokens !== undefined) {
    if (typeof inputTokens !== 'number' || inputTokens < 0) {
      return res.status(400).json({
        error: 'Invalid input tokens',
        message: 'inputTokens must be a non-negative number'
      });
    }
    
    if (inputTokens > 1000000) {
      console.warn(`[Token Validation] Unusually high input tokens: ${inputTokens}`);
    }
  }
  
  // Validate output tokens
  if (outputTokens !== undefined) {
    if (typeof outputTokens !== 'number' || outputTokens < 0) {
      return res.status(400).json({
        error: 'Invalid output tokens',
        message: 'outputTokens must be a non-negative number'
      });
    }
    
    if (outputTokens > 1000000) {
      console.warn(`[Token Validation] Unusually high output tokens: ${outputTokens}`);
    }
  }
  
  // Validate model
  const validModels = ['gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4o', 'claude-3-haiku', 'claude-3-sonnet'];
  if (model && !validModels.includes(model)) {
    console.warn(`[Token Validation] Unknown model: ${model}`);
  }
  
  next();
};

/**
 * Log token usage for monitoring
 */
const logTokenUsage = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.json to capture response
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const duration = Date.now() - startTime;
    
    // Log token usage if present in response
    if (body.usage || body.tokens) {
      const logData = {
        timestamp: new Date().toISOString(),
        endpoint: req.originalUrl,
        method: req.method,
        userId: req.userId || 'anonymous',
        duration: `${duration}ms`,
        tokens: body.tokens || body.usage?.totalTokens || 'N/A',
        cost: body.cost || body.usage?.cost || 'N/A'
      };
      
      console.log('[Token Usage Log]', JSON.stringify(logData));
    }
    
    return originalJson(body);
  };
  
  next();
};

/**
 * Detect anomalous token usage patterns
 */
const detectAnomalies = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) return next();
    
    const { inputTokens, outputTokens } = req.body;
    const totalTokens = (inputTokens || 0) + (outputTokens || 0);
    
    // Skip if tokens are low
    if (totalTokens < 1000) return next();
    
    // Get user's average usage
    const AIUsage = require('../models/AIUsage');
    const avgUsage = await AIUsage.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          avgTokens: { $avg: '$totalTokens' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    if (avgUsage.length > 0) {
      const avg = avgUsage[0].avgTokens;
      const ratio = totalTokens / Math.max(avg, 1);
      
      // Flag if usage is 5x higher than average
      if (ratio > 5 && avgUsage[0].count > 10) {
        console.warn(`[Anomaly Detection] User ${userId}: ${totalTokens} tokens (${ratio}x average)`);
        
        // Add warning to response headers
        res.setHeader('X-Token-Usage-Warning', 'Anomalous usage detected');
      }
    }
    
    next();
  } catch (error) {
    // Don't block request on analytics error
    console.error('[Anomaly Detection] Error:', error.message);
    next();
  }
};

/**
 * Get token estimation endpoint
 */
const estimateTokensEndpoint = async (req, res) => {
  try {
    const { text, model = 'gpt-4o-mini' } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid text parameter'
      });
    }
    
    const tokens = estimateTokens(text);
    const cost = calculateCost(tokens, 0, model);
    
    res.json({
      success: true,
      tokens,
      textLength: text.length,
      model,
      cost,
      ratio: (text.length / Math.max(tokens, 1)).toFixed(2) + ' chars/token'
    });
  } catch (error) {
    console.error('[Token Estimation] Error:', error);
    res.status(500).json({
      error: 'Failed to estimate tokens',
      details: error.message
    });
  }
};

module.exports = {
  validateTokenUsage,
  logTokenUsage,
  detectAnomalies,
  estimateTokensEndpoint
};
