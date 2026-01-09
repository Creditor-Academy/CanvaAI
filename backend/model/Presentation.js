const mongoose = require('mongoose');

// Sub-schema for image details
const ImageSchema = new mongoose.Schema({
  prompt: { type: String, default: '' },
  url: { type: String, default: '' }
});

const SlideSchema = new mongoose.Schema({
  slideNo: { type: Number, required: true },
  title: { type: String, required: true },
  layout: { type: String, default: 'content' }, // e.g., 'title', 'two-column'
  contentType: {
    type: String,
    required: true,
    enum: ['paragraph', 'bullets', 'comparison']
  },
  // Mixed allows String (paragraph), Array (bullets), or Object (comparison)
  content: { type: mongoose.Schema.Types.Mixed, required: true },

  // Nested Image Object
  image: { type: ImageSchema, default: () => ({}) }
});

const PresentationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  meta: {
    topic: { type: String, required: true },
    tone: { type: String, default: 'professional' },
    slideCount: { type: Number, default: 6 },
    stage: {
      type: String,
      enum: ['draft', 'generating', 'final', 'failed'],
      default: 'draft'
    }
  },
  slides: [SlideSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Presentation', PresentationSchema);