const mongoose = require('mongoose');

/**
 * AIUsage Schema - Track token usage per user
 */
const aiUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Token counts
  inputTokens: {
    type: Number,
    required: true,
    default: 0
  },
  outputTokens: {
    type: Number,
    required: true,
    default: 0
  },
  totalTokens: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Cost tracking
  cost: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Request metadata
  endpoint: {
    type: String,
    required: true,
    enum: ['generate', 'chat', 'transform', 'image-generate']
  },
  
  action: {
    type: String, // e.g., 'summarize', 'rewrite', 'enhance'
    index: true
  },
  
  model: {
    type: String,
    default: 'gpt-4o-mini'
  },
  
  success: {
    type: Boolean,
    default: true
  },
  
  errorMessage: String,
  
  // Time tracking
  responseTime: {
    type: Number, // milliseconds
    default: 0
  },
  
  // Aggregation fields
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  month: {
    type: String, // "2024-01"
    index: true
  },
  day: {
    type: String, // "2024-01-15"
    index: true
  }
}, {
  timestamps: true
});

// Create compound indexes for efficient queries
aiUsageSchema.index({ userId: 1, month: 1 });
aiUsageSchema.index({ userId: 1, day: 1 });
aiUsageSchema.index({ endpoint: 1, date: 1 });
aiUsageSchema.index({ action: 1, date: 1 });

// Pre-save hook to calculate derived fields
aiUsageSchema.pre('save', function(next) {
  this.totalTokens = this.inputTokens + this.outputTokens;
  
  const date = this.date || new Date();
  this.month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  this.day = date.toISOString().split('T')[0];
  
  next();
});

// Static method: Get usage summary for a user
aiUsageSchema.statics.getUserUsageSummary = async function(userId, month = null) {
  const query = { userId };
  
  if (month) {
    query.month = month;
  } else {
    // Current month
    const now = new Date();
    query.month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  
  const usage = await this.aggregate([
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
        successRate: {
          $avg: { $cond: ['$success', 1, 0] }
        },
        endpoints: {
          $push: {
            endpoint: '$endpoint',
            tokens: '$totalTokens',
            cost: '$cost'
          }
        }
      }
    }
  ]);
  
  if (usage.length === 0) {
    return {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      avgResponseTime: 0,
      successRate: 100,
      endpoints: []
    };
  }
  
  const summary = usage[0];
  
  // Group by endpoint
  const endpointStats = {};
  summary.endpoints.forEach(ep => {
    if (!endpointStats[ep.endpoint]) {
      endpointStats[ep.endpoint] = { requests: 0, tokens: 0, cost: 0 };
    }
    endpointStats[ep.endpoint].requests++;
    endpointStats[ep.endpoint].tokens += ep.tokens;
    endpointStats[ep.endpoint].cost += ep.cost;
  });
  
  return {
    totalRequests: summary.totalRequests,
    totalInputTokens: summary.totalInputTokens,
    totalOutputTokens: summary.totalOutputTokens,
    totalTokens: summary.totalTokens,
    totalCost: summary.totalCost,
    avgResponseTime: Math.round(summary.avgResponseTime),
    successRate: (summary.successRate * 100).toFixed(1),
    endpoints: endpointStats
  };
};

// Static method: Get daily usage for a month
aiUsageSchema.statics.getDailyUsage = async function(userId, month) {
  const usage = await this.aggregate([
    {
      $match: {
        userId,
        month
      }
    },
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
  
  return usage;
};

// Static method: Get top users by token usage
aiUsageSchema.statics.getTopUsers = async function(month, limit = 10) {
  const usage = await this.aggregate([
    { $match: { month } },
    {
      $group: {
        _id: '$userId',
        totalTokens: { $sum: '$totalTokens' },
        totalCost: { $sum: '$cost' },
        totalRequests: { $sum: 1 }
      }
    },
    { $sort: { totalTokens: -1 } },
    { $limit: limit }
  ]);
  
  return usage;
};

// Static method: Get usage by endpoint
aiUsageSchema.statics.getEndpointStats = async function(month) {
  const usage = await this.aggregate([
    { $match: { month } },
    {
      $group: {
        _id: '$endpoint',
        requests: { $sum: 1 },
        totalTokens: { $sum: '$totalTokens' },
        totalCost: { $sum: '$cost' },
        avgResponseTime: { $avg: '$responseTime' },
        successRate: {
          $avg: { $cond: ['$success', 1, 0] }
        }
      }
    },
    { $sort: { totalTokens: -1 } }
  ]);
  
  return usage;
};

const AIUsage = mongoose.model('AIUsage', aiUsageSchema);

module.exports = AIUsage;
