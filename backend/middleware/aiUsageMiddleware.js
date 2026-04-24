/**
 * aiUsageMiddleware.js - Track and enforce token quotas
 */
const AIUsage = require('../models/AIUsage');
const { 
  estimateTokens, 
  estimateMessageTokens, 
  calculateCost,
  checkQuota,
  QUOTA_LIMITS
} = require('../utils/tokenCounter');

/**
 * Middleware to track AI usage and enforce quotas
 */
const trackAIUsage = async (req, res, next) => {
  const userId = req.userId;
  
  // Skip tracking if no user ID
  if (!userId) {
    return next();
  }
  
  try {
    // Determine endpoint
    const endpoint = req.path.split('/').pop(); // 'generate', 'chat', 'transform'
    
    // Estimate input tokens based on request body
    let inputTokens = 0;
    
    if (endpoint === 'generate' || endpoint === 'chat') {
      // Count message tokens
      const messages = req.body.messages || [];
      if (req.body.prompt) {
        messages.push({ role: 'user', content: req.body.prompt });
      }
      if (req.body.userPrompt) {
        messages.push({ role: 'user', content: req.body.userPrompt });
      }
      if (req.body.systemPrompt) {
        messages.push({ role: 'system', content: req.body.systemPrompt });
      }
      inputTokens = estimateMessageTokens(messages);
    } else if (endpoint === 'transform') {
      // Count text + action prompt
      const text = req.body.text || '';
      const action = req.body.action || '';
      inputTokens = estimateTokens(text) + estimateTokens(action) + 50; // 50 for system prompt
    }
    
    // Check quota limits
    const currentMonth = new Date().toISOString().slice(0, 7); // "2024-01"
    const today = new Date().toISOString().slice(0, 10); // "2024-01-15"
    
    // Get current usage
    const monthUsage = await AIUsage.aggregate([
      { $match: { userId, month: currentMonth } },
      { $group: { _id: null, total: { $sum: '$totalTokens' } } }
    ]);
    
    const dailyUsage = await AIUsage.aggregate([
      { $match: { userId, day: today } },
      { $group: { _id: null, total: { $sum: '$totalTokens' } } }
    ]);
    
    const usage = {
      monthlyUsed: monthUsage[0]?.total || 0,
      dailyUsed: dailyUsage[0]?.total || 0,
      currentRequest: inputTokens,
      hourlyRequests: 0 // TODO: Implement hourly tracking
    };
    
    // For now, use free tier. In production, get from user profile
    const userTier = req.userTier || 'free';
    const quotaCheck = checkQuota(usage, userTier);
    
    if (!quotaCheck.allowed) {
      const violations = Object.entries(quotaCheck.checks)
        .filter(([_, check]) => !check.allowed)
        .map(([key, check]) => `${key}: ${check.used || check.current}/${check.limit}`);
      
      return res.status(429).json({
        error: 'Token quota exceeded',
        violations,
        upgrade: 'Upgrade your plan to continue using AI features'
      });
    }
    
    // Store estimated input tokens in request for later use
    req.estimatedInputTokens = inputTokens;
    req.endpoint = endpoint;
    req.action = req.body.action || req.body.type || null;
    req.requestStartTime = Date.now();
    
    next();
  } catch (error) {
    console.error('[AI Usage Middleware] Error:', error);
    // Don't block request on tracking error
    next();
  }
};

/**
 * Middleware to record actual usage after response
 */
const recordAIUsage = async (req, res, next) => {
  const userId = req.userId;
  
  if (!userId || !req.estimatedInputTokens) {
    return next();
  }
  
  // Store original end function
  const originalEnd = res.end;
  
  res.end = function(chunk, encoding) {
    try {
      // Parse response to get output tokens
      let outputTokens = 0;
      let cost = 0;
      let success = res.statusCode >= 200 && res.statusCode < 300;
      let errorMessage = null;
      
      if (chunk) {
        try {
          const response = JSON.parse(chunk);
          
          if (success && response.result) {
            // Estimate output tokens from response
            outputTokens = estimateTokens(response.result);
            
            // Calculate cost
            const costCalc = calculateCost(
              req.estimatedInputTokens,
              outputTokens,
              req.body.model || 'gpt-4o-mini'
            );
            cost = costCalc.total;
          } else if (!success && response.error) {
            errorMessage = response.error;
          }
        } catch (e) {
          // Not JSON or streaming response
          outputTokens = 0;
        }
      }
      
      // Calculate response time
      const responseTime = Date.now() - (req.requestStartTime || Date.now());
      
      // Record usage (non-blocking)
      AIUsage.create({
        userId,
        inputTokens: req.estimatedInputTokens,
        outputTokens,
        cost,
        endpoint: req.endpoint,
        action: req.action,
        model: req.body.model || 'gpt-4o-mini',
        success,
        errorMessage,
        responseTime,
        // Store actual API token counts if available in response
        actualInputTokens: res.locals.actualTokens?.prompt_tokens || 0,
        actualOutputTokens: res.locals.actualTokens?.completion_tokens || 0,
        cachedTokens: res.locals.actualTokens?.prompt_tokens_details?.cached_tokens || 0
      }).catch(err => {
        console.error('[AI Usage Recording] Error:', err);
      });
      
      // Log for monitoring
      console.log(`[AI Usage] User: ${userId}, Endpoint: ${req.endpoint}, ` +
        `Input: ${req.estimatedInputTokens}, Output: ${outputTokens}, ` +
        `Cost: $${cost.toFixed(4)}, Time: ${responseTime}ms`);
      
    } catch (error) {
      console.error('[AI Usage Recording] Error:', error);
    }
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Middleware to capture actual token usage from API responses
 * Must be used AFTER the AI endpoint handler
 */
const captureActualTokens = (req, res, next) => {
  // Override res.json to capture token usage
  const originalJson = res.json.bind(res);
  
  res.json = (body) => {
    // If response contains usage data from OpenAI, store it
    if (body.usage && typeof body.usage === 'object') {
      res.locals.actualTokens = body.usage;
      
      console.log(`[Token Capture] Actual tokens - Input: ${body.usage.prompt_tokens}, Output: ${body.usage.completion_tokens}, Cached: ${body.usage.prompt_tokens_details?.cached_tokens || 0}`);
    }
    
    return originalJson(body);
  };
  
  next();
};

/**
 * Get user's current quota usage
 */
const getQuotaStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const userTier = req.userTier || 'free';
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const usage = await AIUsage.aggregate([
      { $match: { userId, month: currentMonth } },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$totalTokens' },
          totalCost: { $sum: '$cost' },
          totalRequests: { $sum: 1 }
        }
      }
    ]);
    
    const limits = QUOTA_LIMITS[userTier];
    const monthlyUsed = usage[0]?.totalTokens || 0;
    
    res.json({
      tier: userTier,
      monthly: {
        used: monthlyUsed,
        limit: limits.monthly,
        remaining: limits.monthly - monthlyUsed,
        percentage: ((monthlyUsed / limits.monthly) * 100).toFixed(1)
      },
      cost: usage[0]?.totalCost || 0,
      requests: usage[0]?.totalRequests || 0
    });
  } catch (error) {
    console.error('[Quota Status] Error:', error);
    res.status(500).json({ error: 'Failed to get quota status' });
  }
};

module.exports = {
  trackAIUsage,
  recordAIUsage,
  getQuotaStatus,
  captureActualTokens
};
