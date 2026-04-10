/**
 * aiMonitoring.js - Real-time monitoring and alerting for AI services
 */

const AIUsage = require('../models/AIUsage');

// Alert thresholds
const ALERT_THRESHOLDS = {
  errorRate: {
    warning: 5,    // 5% error rate
    critical: 10   // 10% error rate
  },
  responseTime: {
    warning: 5000,   // 5 seconds
    critical: 10000  // 10 seconds
  },
  costPerHour: {
    warning: 0.50,   // $0.50/hour
    critical: 1.00   // $1.00/hour
  },
  tokensPerMinute: {
    warning: 10000,
    critical: 50000
  }
};

// In-memory alert store (use Redis in production)
const activeAlerts = new Map();

/**
 * Monitor AI request and trigger alerts if needed
 */
const monitorAIRequest = async (req, res, next) => {
  const startTime = Date.now();
  
  // Store original end
  const originalEnd = res.end;
  
  res.end = async function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    const success = statusCode >= 200 && statusCode < 300;
    
    // Check for alerts (async, non-blocking)
    setImmediate(async () => {
      try {
        await checkAlerts({
          endpoint: req.endpoint || req.path,
          responseTime,
          success,
          statusCode
        });
      } catch (error) {
        console.error('[AI Monitoring] Error checking alerts:', error);
      }
    });
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Check various alert conditions
 */
async function checkAlerts({ endpoint, responseTime, success, statusCode }) {
  const now = Date.now();
  const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  
  // 1. Check error rate (last 5 minutes)
  const recentRequests = await AIUsage.aggregate([
    { $match: { date: { $gte: fiveMinutesAgo } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        errors: { $sum: { $cond: ['$success', 0, 1] } }
      }
    }
  ]);
  
  if (recentRequests.length > 0 && recentRequests[0].total > 10) {
    const errorRate = (recentRequests[0].errors / recentRequests[0].total) * 100;
    
    if (errorRate >= ALERT_THRESHOLDS.errorRate.critical) {
      await triggerAlert({
        type: 'ERROR_RATE_CRITICAL',
        severity: 'critical',
        message: `Critical error rate: ${errorRate.toFixed(1)}% in last 5 minutes`,
        value: errorRate,
        threshold: ALERT_THRESHOLDS.errorRate.critical,
        endpoint
      });
    } else if (errorRate >= ALERT_THRESHOLDS.errorRate.warning) {
      await triggerAlert({
        type: 'ERROR_RATE_WARNING',
        severity: 'warning',
        message: `High error rate: ${errorRate.toFixed(1)}% in last 5 minutes`,
        value: errorRate,
        threshold: ALERT_THRESHOLDS.errorRate.warning,
        endpoint
      });
    }
  }
  
  // 2. Check response time
  if (responseTime >= ALERT_THRESHOLDS.responseTime.critical) {
    await triggerAlert({
      type: 'SLOW_RESPONSE_CRITICAL',
      severity: 'critical',
      message: `Very slow response: ${responseTime}ms`,
      value: responseTime,
      threshold: ALERT_THRESHOLDS.responseTime.critical,
      endpoint
    });
  } else if (responseTime >= ALERT_THRESHOLDS.responseTime.warning) {
    await triggerAlert({
      type: 'SLOW_RESPONSE_WARNING',
      severity: 'warning',
      message: `Slow response: ${responseTime}ms`,
      value: responseTime,
      threshold: ALERT_THRESHOLDS.responseTime.warning,
      endpoint
    });
  }
  
  // 3. Check cost per hour
  const hourlyCost = await AIUsage.aggregate([
    { $match: { date: { $gte: oneHourAgo } } },
    {
      $group: {
        _id: null,
        totalCost: { $sum: '$cost' }
      }
    }
  ]);
  
  if (hourlyCost.length > 0) {
    const costPerHour = hourlyCost[0].totalCost;
    
    if (costPerHour >= ALERT_THRESHOLDS.costPerHour.critical) {
      await triggerAlert({
        type: 'HIGH_COST_CRITICAL',
        severity: 'critical',
        message: `High AI cost: $${costPerHour.toFixed(2)} in last hour`,
        value: costPerHour,
        threshold: ALERT_THRESHOLDS.costPerHour.critical
      });
    } else if (costPerHour >= ALERT_THRESHOLDS.costPerHour.warning) {
      await triggerAlert({
        type: 'HIGH_COST_WARNING',
        severity: 'warning',
        message: `Elevated AI cost: $${costPerHour.toFixed(2)} in last hour`,
        value: costPerHour,
        threshold: ALERT_THRESHOLDS.costPerHour.warning
      });
    }
  }
  
  // 4. Check for API errors (5xx)
  if (statusCode >= 500) {
    await triggerAlert({
      type: 'SERVER_ERROR',
      severity: 'critical',
      message: `Server error: HTTP ${statusCode}`,
      value: statusCode,
      threshold: 500,
      endpoint
    });
  }
  
  // 5. Check for rate limiting (429)
  if (statusCode === 429) {
    await triggerAlert({
      type: 'RATE_LIMITED',
      severity: 'warning',
      message: 'Request rate limited by OpenAI',
      value: 429,
      threshold: 429,
      endpoint
    });
  }
}

/**
 * Trigger an alert (with deduplication)
 */
async function triggerAlert(alert) {
  const alertKey = `${alert.type}:${new Date().toISOString().slice(0, 13)}`; // Hourly dedup
  
  // Check if alert already triggered in last hour
  if (activeAlerts.has(alertKey)) {
    const lastTriggered = activeAlerts.get(alertKey);
    if (Date.now() - lastTriggered < 60 * 60 * 1000) {
      return; // Already alerted
    }
  }
  
  // Store alert
  activeAlerts.set(alertKey, Date.now());
  
  // Log alert
  const logEntry = {
    ...alert,
    timestamp: new Date().toISOString(),
    action: 'LOGGED'
  };
  
  console.log(`🚨 [AI ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
  
  // In production, send to:
  // - Slack webhook
  // - Email notification
  // - PagerDuty
  // - Custom webhook
  
  // Example: Send to Slack
  // await sendSlackAlert(alert);
  
  return logEntry;
}

/**
 * Get active alerts
 */
function getActiveAlerts() {
  const alerts = [];
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  
  for (const [key, timestamp] of activeAlerts.entries()) {
    if (timestamp > oneHourAgo) {
      alerts.push({
        key,
        timestamp: new Date(timestamp).toISOString(),
        age: Math.round((Date.now() - timestamp) / 1000 / 60) + ' minutes ago'
      });
    }
  }
  
  return alerts;
}

/**
 * Clear old alerts
 */
function clearOldAlerts() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  let cleared = 0;
  
  for (const [key, timestamp] of activeAlerts.entries()) {
    if (timestamp <= oneHourAgo) {
      activeAlerts.delete(key);
      cleared++;
    }
  }
  
  if (cleared > 0) {
    console.log(`[AI Monitoring] Cleared ${cleared} old alerts`);
  }
  
  return cleared;
}

// Auto-cleanup every 30 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(clearOldAlerts, 30 * 60 * 1000);
}

/**
 * Get system health status
 */
const getHealthStatus = async (req, res) => {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    // Get recent stats
    const recentStats = await AIUsage.aggregate([
      { $match: { date: { $gte: fiveMinutesAgo } } },
      {
        $group: {
          _id: null,
          requests: { $sum: 1 },
          errors: { $sum: { $cond: ['$success', 0, 1] } },
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);
    
    const stats = recentStats[0] || { requests: 0, errors: 0, avgResponseTime: 0 };
    const errorRate = stats.requests > 0 ? (stats.errors / stats.requests) * 100 : 0;
    
    // Determine health status
    let status = 'healthy';
    let issues = [];
    
    if (errorRate >= ALERT_THRESHOLDS.errorRate.critical) {
      status = 'critical';
      issues.push(`High error rate: ${errorRate.toFixed(1)}%`);
    } else if (errorRate >= ALERT_THRESHOLDS.errorRate.warning) {
      status = 'degraded';
      issues.push(`Elevated error rate: ${errorRate.toFixed(1)}%`);
    }
    
    if (stats.avgResponseTime >= ALERT_THRESHOLDS.responseTime.critical) {
      status = 'critical';
      issues.push(`Very slow responses: ${Math.round(stats.avgResponseTime)}ms`);
    } else if (stats.avgResponseTime >= ALERT_THRESHOLDS.responseTime.warning) {
      if (status === 'healthy') status = 'degraded';
      issues.push(`Slow responses: ${Math.round(stats.avgResponseTime)}ms`);
    }
    
    res.json({
      status,
      issues,
      metrics: {
        requestsLast5Min: stats.requests,
        errorRate: errorRate.toFixed(1) + '%',
        avgResponseTime: Math.round(stats.avgResponseTime) + 'ms',
        activeAlerts: getActiveAlerts().length
      },
      timestamp: now.toISOString()
    });
    
  } catch (error) {
    console.error('[Health Check] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get health status'
    });
  }
};

module.exports = {
  monitorAIRequest,
  getActiveAlerts,
  clearOldAlerts,
  getHealthStatus,
  ALERT_THRESHOLDS
};
