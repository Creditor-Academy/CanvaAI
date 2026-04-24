const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  data: {
    content: {
      type: Object,
      default: {}
    },
    html: {
      type: String,
      default: ''
    }
  },
  userId: {
    type: String,
    index: true
  },
  metadata: {
    wordCount: {
      type: Number,
      default: 0
    },
    characterCount: {
      type: Number,
      default: 0
    },
    lastEditedBy: {
      type: String
    },
    // Token usage tracking for AI features
    tokenUsage: {
      inputTokens: {
        type: Number,
        default: 0
      },
      outputTokens: {
        type: Number,
        default: 0
      },
      totalTokensUsed: {
        type: Number,
        default: 0
      },
      lastTokenUpdate: {
        type: Date
      }
    }
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for faster queries
documentSchema.index({ createdAt: -1 });
documentSchema.index({ updatedAt: -1 });

// TTL index to auto-delete empty documents after 24 hours
// Only applies to documents that have never been edited (content is empty/untouched)
documentSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 86400, // 24 hours (24 * 60 * 60)
    partialFilterExpression: {
      // Document is considered "empty" if it has the default structure with no real content
      'data.content.content.0.content.0.text': { $exists: false },
      'metadata.wordCount': { $lte: 0 }
    }
  }
);

// Add a field to track if document has been edited by user
documentSchema.add({
  hasBeenEdited: {
    type: Boolean,
    default: false,
    index: true
  }
});

// Update the TTL index to use hasBeenEdited flag
// Remove the previous partialFilterExpression index and use this simpler approach
documentSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 86400, // 24 hours
    partialFilterExpression: { hasBeenEdited: false }
  }
);

// Pre-save middleware to calculate content metrics
documentSchema.pre('save', function(next) {
  if (this.data && this.data.content) {
    try {
      // Calculate word count from content
      const textContent = JSON.stringify(this.data.content);
      const words = textContent.split(/\s+/).filter(word => word.length > 0);
      this.metadata.wordCount = words.length;
      this.metadata.characterCount = textContent.length;
    } catch (error) {
      console.error('Error calculating document metrics:', error);
    }
  }
  next();
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
