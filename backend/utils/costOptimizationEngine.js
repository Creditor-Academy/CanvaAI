/**
 * costOptimizationEngine.js - Pre-flight cost estimation and optimization
 * Helps users understand costs before making AI requests
 */

const { estimateTokens, calculateCost } = require('./tokenCounter');

class CostOptimizationEngine {
  constructor() {
    this.modelPricing = {
      'gpt-4o-mini': { input: 0.15, output: 0.60, cachedInput: 0.075 },
      'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
      'gpt-4o': { input: 2.50, output: 10.00 },
      'claude-3-haiku': { input: 0.25, output: 1.25 },
      'claude-3-sonnet': { input: 3.00, output: 15.00 }
    };
  }

  /**
   * Estimate cost before making API call
   * @param {string} prompt - User prompt
   * @param {string} model - AI model to use
   * @param {object} options - Additional options
   * @returns {object} Cost estimation and recommendations
   */
  estimateBeforeGeneration(prompt, model = 'gpt-4o-mini', options = {}) {
    const inputTokens = estimateTokens(prompt);
    
    // Estimate output tokens based on prompt type
    const estimatedOutputTokens = this._estimateOutputTokens(prompt, options);
    
    // Calculate costs for requested model
    const cost = calculateCost(inputTokens, estimatedOutputTokens, model);
    
    // Get alternative model costs
    const alternatives = this._getAlternativeCosts(inputTokens, estimatedOutputTokens, model);
    
    // Generate recommendations
    const recommendations = this._generateRecommendations({
      prompt,
      inputTokens,
      estimatedOutputTokens,
      cost,
      alternatives
    });
    
    return {
      estimatedCost: cost.total,
      estimatedTokens: inputTokens + estimatedOutputTokens,
      breakdown: {
        input: {
          tokens: inputTokens,
          cost: cost.freshInput + cost.cachedInput
        },
        output: {
          tokens: estimatedOutputTokens,
          cost: cost.output
        },
        cached: {
          tokens: Math.floor(inputTokens * 0.3),
          savings: cost.savings
        }
      },
      alternatives,
      recommendations,
      efficiency: this._calculateEfficiency(inputTokens, estimatedOutputTokens)
    };
  }

  /**
   * Estimate output tokens based on prompt characteristics
   */
  _estimateOutputTokens(prompt, options) {
    const promptLower = prompt.toLowerCase();
    
    // If max_tokens specified, use it
    if (options.maxTokens) {
      return Math.min(options.maxTokens, 4000);
    }
    
    // Heuristic based on prompt type
    if (promptLower.includes('summarize') || promptLower.includes('summary')) {
      return 300; // Summaries are typically short
    }
    
    if (promptLower.includes('translate')) {
      return estimateTokens(prompt) * 0.9; // Translation similar length
    }
    
    if (promptLower.includes('rewrite') || promptLower.includes('rephrase')) {
      return estimateTokens(prompt) * 1.1; // Slightly longer
    }
    
    if (promptLower.includes('generate') || promptLower.includes('create')) {
      return 1000; // Generation can be longer
    }
    
    if (promptLower.includes('list') || promptLower.includes('bullet')) {
      return 500; // Lists are moderate
    }
    
    // Default: 2x input tokens
    return estimateTokens(prompt) * 2;
  }

  /**
   * Get costs for alternative models
   */
  _getAlternativeCosts(inputTokens, outputTokens, currentModel) {
    const alternatives = [];
    
    for (const [model, pricing] of Object.entries(this.modelPricing)) {
      if (model === currentModel) continue;
      
      const cost = calculateCost(inputTokens, outputTokens, model);
      alternatives.push({
        model,
        cost: cost.total,
        inputCost: cost.freshInput + cost.cachedInput,
        outputCost: cost.output,
        savings: this.modelPricing[currentModel].input - pricing.input
      });
    }
    
    // Sort by cost
    return alternatives.sort((a, b) => a.cost - b.cost).slice(0, 3);
  }

  /**
   * Generate cost optimization recommendations
   */
  _generateRecommendations({ prompt, inputTokens, estimatedOutputTokens, cost, alternatives }) {
    const recommendations = [];
    
    // Check if prompt is too long
    if (inputTokens > 2000) {
      recommendations.push({
        type: 'warning',
        message: 'Long prompt detected. Consider shortening to reduce costs.',
        potentialSavings: '20-40%',
        action: 'Simplify prompt'
      });
    }
    
    // Check if cheaper alternatives exist
    const cheapestAlternative = alternatives[0];
    if (cheapestAlternative && cheapestAlternative.cost < cost.total * 0.7) {
      recommendations.push({
        type: 'info',
        message: `Switch to ${cheapestAlternative.model} to save ${((1 - cheapestAlternative.cost / cost.total) * 100).toFixed(0)}%`,
        potentialSavings: `${((1 - cheapestAlternative.cost / cost.total) * 100).toFixed(0)}%`,
        action: `Use ${cheapestAlternative.model}`
      });
    }
    
    // Check for redundant phrases
    if (this._hasRedundantPhrases(prompt)) {
      recommendations.push({
        type: 'tip',
        message: 'Remove repetitive instructions to save tokens',
        potentialSavings: '10-15%',
        action: 'Optimize prompt'
      });
    }
    
    // Cost threshold warnings
    if (cost.total > 0.05) {
      recommendations.push({
        type: 'warning',
        message: `This request will cost approximately $${cost.total.toFixed(4)}`,
        potentialSavings: null,
        action: 'Proceed with caution'
      });
    }
    
    // Efficiency tips
    if (cost.total < 0.001) {
      recommendations.push({
        type: 'success',
        message: 'Very cost-efficient request!',
        potentialSavings: null,
        action: null
      });
    }
    
    return recommendations;
  }

  /**
   * Detect redundant phrases in prompt
   */
  _hasRedundantPhrases(prompt) {
    const redundantPatterns = [
      /(please|kindly).{0,50}(please|kindly)/i,
      /(make sure|ensure).{0,50}(make sure|ensure)/i,
      /(very|extremely|really).{0,30}(very|extremely|really)/i
    ];
    
    return redundantPatterns.some(pattern => pattern.test(prompt));
  }

  /**
   * Calculate efficiency score
   */
  _calculateEfficiency(inputTokens, outputTokens) {
    const ratio = outputTokens / Math.max(inputTokens, 1);
    
    // Optimal ratio: 1-3 (good balance)
    if (ratio >= 1 && ratio <= 3) {
      return { score: 100, label: 'Excellent' };
    }
    
    if (ratio < 1) {
      return { 
        score: Math.round((ratio / 1) * 80), 
        label: 'Good',
        note: 'Output is shorter than input'
      };
    }
    
    return {
      score: Math.round((3 / ratio) * 80),
      label: 'Fair',
      note: 'Consider being more specific to reduce output length'
    };
  }

  /**
   * Compress prompt while maintaining meaning
   */
  compressPrompt(prompt) {
    let compressed = prompt;
    
    // Remove excessive whitespace
    compressed = compressed.replace(/\s+/g, ' ').trim();
    
    // Remove redundant adjectives
    compressed = compressed.replace(/very\s+/gi, '');
    compressed = compressed.replace(/extremely\s+/gi, '');
    
    // Shorten common phrases
    compressed = compressed.replace(/in order to/gi, 'to');
    compressed = compressed.replace(/due to the fact that/gi, 'because');
    compressed = compressed.replace(/at this point in time/gi, 'now');
    
    return compressed;
  }

  /**
   * Batch estimate costs for multiple prompts
   */
  batchEstimate(prompts, model = 'gpt-4o-mini') {
    return prompts.map((prompt, index) => ({
      index,
      prompt: prompt.slice(0, 50) + '...',
      ...this.estimateBeforeGeneration(prompt, model)
    }));
  }

  /**
   * Get budget allocation recommendations
   */
  getBudgetRecommendations(monthlyBudget, currentUsage) {
    const remaining = monthlyBudget - currentUsage;
    const daysInMonth = 30;
    const daysPassed = new Date().getDate();
    const daysRemaining = daysInMonth - daysPassed;
    
    const dailyBudget = remaining / Math.max(daysRemaining, 1);
    const requestsPerDay = Math.floor(dailyBudget / 0.01); // Assuming avg $0.01 per request
    
    return {
      remaining,
      dailyBudget,
      recommendedDailyRequests: requestsPerDay,
      willExceedBudget: currentUsage > (monthlyBudget / daysInMonth) * daysPassed,
      urgency: remaining < monthlyBudget * 0.1 ? 'high' : 
               remaining < monthlyBudget * 0.25 ? 'medium' : 'low'
    };
  }
}

module.exports = new CostOptimizationEngine();
