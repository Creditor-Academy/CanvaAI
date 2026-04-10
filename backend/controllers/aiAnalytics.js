/**
 * aiAnalytics.js - AI usage analytics and monitoring
 */
const AIUsage = require('../models/AIUsage');
const { getCacheStats } = require('../middleware/aiCache');
const { formatTokenCount, formatCost } = require('../utils/tokenCounter');

/**
 * Get comprehensive analytics dashboard data
 */
const getAnalyticsDashboard = async (req, res) => {
  try {
    const { period = 'month', userId } = req.query;
    
    // Determine date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Build query
    const query = { date: { $gte: startDate } };
    if (userId) {
      query.userId = userId;
    }
    
    // Overall stats
    const overallStats = await AIUsage.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          totalInputTokens: { $sum: '$inputTokens' },
          totalOutputTokens: { $sum: '$outputTokens' },
          totalTokens: { $sum: '$totalTokens' },
          totalCost: { $sum: '$cost' },
          avgResponseTime: { $avg: '$responseTime' },
          successCount: { $sum: { $cond: ['$success', 1, 0] } },
          errorCount: { $sum: { $cond: ['$success', 0, 1] } }
        }
      }
    ]);
    
    // Endpoint breakdown
    const endpointStats = await AIUsage.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$endpoint',
          requests: { $sum: 1 },
          totalTokens: { $sum: '$totalTokens' },
          totalCost: { $sum: '$cost' },
          avgResponseTime: { $avg: '$responseTime' },
          successRate: { $avg: { $cond: ['$success', 1, 0] } }
        }
      },
      { $sort: { totalTokens: -1 } }
    ]);
    
    // Action breakdown (for transform endpoint)
    const actionStats = await AIUsage.aggregate([
      { $match: { ...query, endpoint: 'transform' } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          totalTokens: { $sum: '$totalTokens' },
          avgTokens: { $avg: '$totalTokens' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Daily trend (last 30 days)
    const dailyTrend = await AIUsage.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$day',
          requests: { $sum: 1 },
          tokens: { $sum: '$totalTokens' },
          cost: { $sum: '$cost' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Top users (if no specific userId requested)
    let topUsers = [];
    if (!userId) {
      topUsers = await AIUsage.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$userId',
            totalTokens: { $sum: '$totalTokens' },
            totalCost: { $sum: '$cost' },
            totalRequests: { $sum: 1 }
          }
        },
        { $sort: { totalTokens: -1 } },
        { $limit: 10 }
      ]);
    }
    
    // Cache statistics
    const cacheStats = getCacheStats();
    
    // Calculate metrics
    const stats = overallStats[0] || {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      avgResponseTime: 0,
      successCount: 0,
      errorCount: 0
    };
    
    const successRate = stats.totalRequests > 0 
      ? ((stats.successCount / stats.totalRequests) * 100).toFixed(1)
      : 100;
    
    const efficiency = stats.totalInputTokens > 0
      ? ((stats.totalOutputTokens / stats.totalInputTokens) * 100).toFixed(1)
      : 0;
    
    res.json({
      period,
      summary: {
        totalRequests: stats.totalRequests,
        totalTokens: stats.totalTokens,
        totalTokensFormatted: formatTokenCount(stats.totalTokens),
        totalCost: stats.totalCost,
        totalCostFormatted: formatCost(stats.totalCost),
        avgResponseTime: Math.round(stats.avgResponseTime),
        successRate: successRate + '%',
        efficiency: efficiency + '%',
        inputTokens: stats.totalInputTokens,
        outputTokens: stats.totalOutputTokens
      },
      endpoints: endpointStats.map(ep => ({
        endpoint: ep._id,
        requests: ep.requests,
        totalTokens: ep.totalTokens,
        totalCost: ep.totalCost,
        avgResponseTime: Math.round(ep.avgResponseTime),
        successRate: (ep.successRate * 100).toFixed(1) + '%'
      })),
      actions: actionStats.map(a => ({
        action: a._id || 'unknown',
        count: a.count,
        totalTokens: a.totalTokens,
        avgTokens: Math.round(a.avgTokens)
      })),
      dailyTrend: dailyTrend.map(d => ({
        date: d._id,
        requests: d.requests,
        tokens: d.tokens,
        cost: d.cost
      })),
      topUsers: topUsers.map(u => ({
        userId: u._id,
        totalTokens: u.totalTokens,
        totalCost: u.totalCost,
        totalRequests: u.totalRequests
      })),
      cache: {
        hitRate: cacheStats.utilization,
        totalEntries: cacheStats.activeEntries,
        estimatedSize: cacheStats.estimatedSizeMB + ' MB'
      }
    });
    
  } catch (error) {
    console.error('[AI Analytics] Error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
};

/**
 * Get user-specific usage report
 */
const getUserUsageReport = async (req, res) => {
  try {
    const userId = req.userId || req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 7);
    
    // Current month usage
    const currentUsage = await AIUsage.getUserUsageSummary(userId, currentMonth);
    
    // Last month usage for comparison
    const lastUsage = await AIUsage.getUserUsageSummary(userId, lastMonth);
    
    // Daily usage for current month
    const dailyUsage = await AIUsage.getDailyUsage(userId, currentMonth);
    
    // Calculate trends
    const tokenTrend = lastUsage.totalTokens > 0
      ? (((currentUsage.totalTokens - lastUsage.totalTokens) / lastUsage.totalTokens) * 100).toFixed(1)
      : 0;
    
    const costTrend = lastUsage.totalCost > 0
      ? (((currentUsage.totalCost - lastUsage.totalCost) / lastUsage.totalCost) * 100).toFixed(1)
      : 0;
    
    res.json({
      userId,
      period: currentMonth,
      current: currentUsage,
      previous: lastUsage,
      trends: {
        tokens: tokenTrend + '%',
        cost: costTrend + '%'
      },
      daily: dailyUsage
    });
    
  } catch (error) {
    console.error('[User Usage Report] Error:', error);
    res.status(500).json({ error: 'Failed to get usage report' });
  }
};

/**
 * Get cost breakdown by model
 */
const getCostBreakdown = async (req, res) => {
  try {
    const { month } = req.query;
    const currentMonth = month || new Date().toISOString().slice(0, 7);
    
    const breakdown = await AIUsage.aggregate([
      { $match: { month: currentMonth } },
      {
        $group: {
          _id: '$model',
          requests: { $sum: 1 },
          totalTokens: { $sum: '$totalTokens' },
          totalCost: { $sum: '$cost' },
          avgTokensPerRequest: { $avg: '$totalTokens' }
        }
      },
      { $sort: { totalCost: -1 } }
    ]);
    
    const totalCost = breakdown.reduce((sum, m) => sum + m.totalCost, 0);
    
    res.json({
      month: currentMonth,
      totalCost,
      totalCostFormatted: formatCost(totalCost),
      models: breakdown.map(m => ({
        model: m._id,
        requests: m.requests,
        totalTokens: m.totalTokens,
        totalCost: m.totalCost,
        costFormatted: formatCost(m.totalCost),
        percentage: totalCost > 0 ? ((m.totalCost / totalCost) * 100).toFixed(1) + '%' : '0%',
        avgTokensPerRequest: Math.round(m.avgTokensPerRequest)
      }))
    });
    
  } catch (error) {
    console.error('[Cost Breakdown] Error:', error);
    res.status(500).json({ error: 'Failed to get cost breakdown' });
  }
};

/**
 * Get alert triggers (high usage, errors, etc.)
 */
const getAlerts = async (req, res) => {
  try {
    const alerts = [];
    
    // Check for high error rates
    const today = new Date().toISOString().slice(0, 10);
    const todayStats = await AIUsage.aggregate([
      { $match: { day: today } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          errors: { $sum: { $cond: ['$success', 0, 1] } }
        }
      }
    ]);
    
    if (todayStats.length > 0) {
      const errorRate = (todayStats[0].errors / todayStats[0].total) * 100;
      
      if (errorRate > 10) {
        alerts.push({
          type: 'HIGH_ERROR_RATE',
          severity: 'critical',
          message: `Error rate is ${errorRate.toFixed(1)}% today (threshold: 10%)`,
          value: errorRate,
          threshold: 10
        });
      }
    }
    
    // Check for high token usage users
    const currentMonth = new Date().toISOString().slice(0, 7);
    const highUsageUsers = await AIUsage.aggregate([
      { $match: { month: currentMonth } },
      {
        $group: {
          _id: '$userId',
          totalTokens: { $sum: '$totalTokens' },
          totalCost: { $sum: '$cost' }
        }
      },
      { $match: { totalCost: { $gt: 1.0 } } } // Users spending > $1
    ]);
    
    if (highUsageUsers.length > 0) {
      alerts.push({
        type: 'HIGH_USAGE_USERS',
        severity: 'warning',
        message: `${highUsageUsers.length} users exceeded $1 in AI costs this month`,
        count: highUsageUsers.length,
        users: highUsageUsers.slice(0, 5)
      });
    }
    
    // Check for slow response times
    const slowRequests = await AIUsage.aggregate([
      { $match: { day: today, responseTime: { $gt: 10000 } } },
      { $count: 'count' }
    ]);
    
    if (slowRequests.length > 0 && slowRequests[0].count > 10) {
      alerts.push({
        type: 'SLOW_RESPONSES',
        severity: 'warning',
        message: `${slowRequests[0].count} requests took >10s today`,
        count: slowRequests[0].count
      });
    }
    
    res.json({
      alerts,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Alerts] Error:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
};

module.exports = {
  getAnalyticsDashboard,
  getUserUsageReport,
  getCostBreakdown,
  getAlerts
};
