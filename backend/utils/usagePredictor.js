/**
 * usagePredictor.js - Predict future token usage based on historical patterns
 * Helps users stay within budget and avoid quota overruns
 */

const AIUsage = require('../models/AIUsage');

class UsagePredictor {
  /**
   * Predict month-end usage based on current patterns
   * @param {string} userId - User ID
   * @param {string} tier - User tier (free, pro, enterprise)
   * @returns {object} Prediction with confidence intervals
   */
  async predictMonthEnd(userId, tier = 'free') {
    const tierLimits = {
      free: { monthly: 10000, daily: 500 },
      pro: { monthly: 100000, daily: 5000 },
      enterprise: { monthly: 1000000, daily: 50000 }
    };
    
    const limit = tierLimits[tier]?.monthly || 10000;
    
    // Get current usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usage = await AIUsage.getUserUsageSummary(userId, currentMonth);
    
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const daysRemaining = daysInMonth - daysElapsed;
    
    // Calculate daily average
    const dailyAverage = usage.totalTokens / Math.max(daysElapsed, 1);
    
    // Get historical daily data for variance calculation
    const dailyHistory = await this._getDailyHistory(userId, currentMonth);
    const variance = this._calculateVariance(dailyHistory);
    const stdDev = Math.sqrt(variance);
    
    // Predict with confidence intervals
    const predictedTotal = dailyAverage * daysInMonth;
    const predictedRemaining = dailyAverage * daysRemaining;
    
    // 95% confidence interval
    const marginOfError = 1.96 * stdDev * Math.sqrt(daysRemaining);
    
    return {
      current: {
        used: usage.totalTokens,
        remaining: limit - usage.totalTokens,
        percentage: ((usage.totalTokens / limit) * 100).toFixed(1)
      },
      prediction: {
        monthEnd: Math.round(predictedTotal),
        low: Math.round(predictedTotal - marginOfError),
        high: Math.round(predictedTotal + marginOfError),
        remaining: Math.round(predictedRemaining),
        confidence: this._calculateConfidence(daysElapsed, dailyHistory.length)
      },
      limits: {
        monthly: limit,
        willExceed: predictedTotal > limit,
        exceedAmount: predictedTotal > limit ? Math.round(predictedTotal - limit) : 0,
        daysUntilLimit: this._daysUntilLimit(usage.totalTokens, dailyAverage, limit)
      },
      recommendations: {
        dailyBudget: Math.max(0, (limit - usage.totalTokens) / Math.max(daysRemaining, 1)),
        recommendedDailyUsage: Math.floor((limit - usage.totalTokens) / Math.max(daysRemaining, 1)),
        urgency: this._calculateUrgency(usage.totalTokens, predictedTotal, limit, daysRemaining),
        action: this._getRecommendedAction(usage.totalTokens, predictedTotal, limit, daysRemaining)
      },
      statistics: {
        dailyAverage: Math.round(dailyAverage),
        standardDeviation: Math.round(stdDev),
        peakDay: this._getPeakDay(dailyHistory),
        lowestDay: this._getLowestDay(dailyHistory)
      }
    };
  }

  /**
   * Get daily usage history for current month
   */
  async _getDailyHistory(userId, month) {
    const usage = await AIUsage.getDailyUsage(userId, month);
    return usage.map(u => ({
      day: u._id,
      tokens: u.tokens,
      requests: u.requests,
      cost: u.cost
    }));
  }

  /**
   * Calculate variance of daily usage
   */
  _calculateVariance(dailyHistory) {
    if (dailyHistory.length < 2) return 0;
    
    const mean = dailyHistory.reduce((sum, d) => sum + d.tokens, 0) / dailyHistory.length;
    const squaredDiffs = dailyHistory.map(d => Math.pow(d.tokens - mean, 2));
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / (dailyHistory.length - 1);
  }

  /**
   * Calculate prediction confidence based on data availability
   */
  _calculateConfidence(daysElapsed, dataPoints) {
    // More data = higher confidence
    const baseConfidence = Math.min(dataPoints / 14, 1); // Max confidence at 14 days
    
    // More elapsed time = better prediction
    const timeConfidence = Math.min(daysElapsed / 10, 1); // Max confidence at 10 days
    
    return Math.round(((baseConfidence + timeConfidence) / 2) * 100);
  }

  /**
   * Calculate days until user hits limit
   */
  _daysUntilLimit(currentUsage, dailyAverage, limit) {
    if (dailyAverage === 0) return Infinity;
    const remaining = limit - currentUsage;
    return Math.max(0, Math.floor(remaining / dailyAverage));
  }

  /**
   * Calculate urgency level
   */
  _calculateUrgency(currentUsage, predictedTotal, limit, daysRemaining) {
    const usagePercentage = currentUsage / limit;
    const predictedPercentage = predictedTotal / limit;
    
    if (predictedPercentage > 1.2) return 'critical';
    if (predictedPercentage > 1.0) return 'high';
    if (predictedPercentage > 0.9 || usagePercentage > 0.75) return 'medium';
    if (predictedPercentage > 0.5) return 'low';
    return 'minimal';
  }

  /**
   * Get recommended action
   */
  _getRecommendedAction(currentUsage, predictedTotal, limit, daysRemaining) {
    const urgency = this._calculateUrgency(currentUsage, predictedTotal, limit, daysRemaining);
    
    switch (urgency) {
      case 'critical':
        return 'Upgrade plan immediately or significantly reduce AI usage';
      case 'high':
        return 'Consider upgrading plan or limit usage to essential tasks only';
      case 'medium':
        return 'Monitor usage closely and optimize prompts to reduce token consumption';
      case 'low':
        return 'Usage is on track. Continue normal usage patterns';
      default:
        return 'Excellent! You have plenty of tokens remaining';
    }
  }

  /**
   * Get peak usage day
   */
  _getPeakDay(dailyHistory) {
    if (dailyHistory.length === 0) return null;
    const peak = dailyHistory.reduce((max, d) => d.tokens > max.tokens ? d : max, dailyHistory[0]);
    return {
      day: peak.day,
      tokens: peak.tokens
    };
  }

  /**
   * Get lowest usage day
   */
  _getLowestDay(dailyHistory) {
    if (dailyHistory.length === 0) return null;
    const lowest = dailyHistory.reduce((min, d) => d.tokens < min.tokens ? d : min, dailyHistory[0]);
    return {
      day: lowest.day,
      tokens: lowest.tokens
    };
  }

  /**
   * Get usage trend analysis
   */
  async getTrendAnalysis(userId, months = 3) {
    const now = new Date();
    const trends = [];
    
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const usage = await AIUsage.getUserUsageSummary(userId, month);
      
      trends.unshift({
        month,
        totalTokens: usage.totalTokens,
        totalCost: usage.totalCost,
        totalRequests: usage.totalRequests,
        avgTokensPerRequest: usage.totalRequests > 0 ? 
          Math.round(usage.totalTokens / usage.totalRequests) : 0
      });
    }
    
    // Calculate growth rate
    if (trends.length >= 2) {
      const first = trends[0].totalTokens;
      const last = trends[trends.length - 1].totalTokens;
      const growthRate = first > 0 ? ((last - first) / first) * 100 : 0;
      
      return {
        trends,
        growthRate: growthRate.toFixed(1),
        direction: growthRate > 10 ? 'increasing' : 
                   growthRate < -10 ? 'decreasing' : 'stable'
      };
    }
    
    return { trends, growthRate: 'N/A', direction: 'insufficient data' };
  }

  /**
   * Detect usage anomalies
   */
  async detectAnomalies(userId, currentDailyUsage) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const dailyHistory = await this._getDailyHistory(userId, currentMonth);
    
    if (dailyHistory.length < 7) {
      return { anomalous: false, reason: 'Insufficient data' };
    }
    
    const mean = dailyHistory.reduce((sum, d) => sum + d.tokens, 0) / dailyHistory.length;
    const stdDev = Math.sqrt(this._calculateVariance(dailyHistory));
    
    // Z-score calculation
    const zScore = (currentDailyUsage - mean) / Math.max(stdDev, 1);
    
    return {
      anomalous: Math.abs(zScore) > 3,
      zScore: zScore.toFixed(2),
      expected: Math.round(mean),
      actual: currentDailyUsage,
      deviation: `${((currentDailyUsage - mean) / Math.max(mean, 1) * 100).toFixed(0)}%`,
      confidence: Math.min(Math.abs(zScore) / 3, 1) * 100
    };
  }

  /**
   * Get personalized recommendations
   */
  async getPersonalizedRecommendations(userId, tier = 'free') {
    const prediction = await this.predictMonthEnd(userId, tier);
    const trend = await this.getTrendAnalysis(userId, 3);
    
    const recommendations = [];
    
    // Based on prediction
    if (prediction.limits.willExceed) {
      recommendations.push({
        type: 'urgent',
        title: 'You will exceed your monthly limit',
        message: `Based on current usage, you'll use ${prediction.prediction.monthEnd.toLocaleString()} tokens by month end (${prediction.limits.exceedAmount.toLocaleString()} over limit)`,
        action: 'Upgrade to Pro plan'
      });
    }
    
    // Based on trend
    if (trend.direction === 'increasing' && parseFloat(trend.growthRate) > 50) {
      recommendations.push({
        type: 'warning',
        title: 'Rapidly increasing usage',
        message: `Your token usage has increased by ${trend.growthRate}% over the last 3 months`,
        action: 'Review and optimize AI usage patterns'
      });
    }
    
    // Efficiency tips
    if (prediction.statistics.dailyAverage > 1000) {
      recommendations.push({
        type: 'tip',
        title: 'Optimize your prompts',
        message: 'Use shorter, more specific prompts to reduce token consumption',
        action: 'View prompt optimization guide'
      });
    }
    
    // Budget management
    if (prediction.recommendations.urgency === 'high' || prediction.recommendations.urgency === 'critical') {
      recommendations.push({
        type: 'budget',
        title: 'Manage your daily budget',
        message: `Limit usage to ${prediction.recommendations.recommendedDailyUsage.toLocaleString()} tokens per day to stay within quota`,
        action: 'Set daily usage alerts'
      });
    }
    
    return recommendations;
  }
}

module.exports = new UsagePredictor();
