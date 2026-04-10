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
    }
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for faster queries
documentSchema.index({ createdAt: -1 });
documentSchema.index({ updatedAt: -1 });

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
