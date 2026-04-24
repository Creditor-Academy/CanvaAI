const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const AIUsage = require('../models/AIUsage');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');
const { trackAIUsage, recordAIUsage, getQuotaStatus } = require('../middleware/aiUsageMiddleware');
const { getCache, setCache, getCacheStats, clearCache } = require('../middleware/aiCache');
const {
  getAnalyticsDashboard,
  getUserUsageReport,
  getCostBreakdown,
  getAlerts
} = require('../controllers/aiAnalytics');
const { monitorAIRequest, getHealthStatus } = require('../middleware/aiMonitoring');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-default-key'
});

const CHAT_MODEL = "gpt-4o-mini";

// In-memory comment storage (replace with MongoDB collection in production)
const commentsStore = new Map();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token (optional - can be made optional for public docs)
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // For now, allow requests without token but don't associate with user
    req.userId = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    req.userId = null;
    next(); // Continue without user ID for now
  }
};

/**
 * GET /api/text-editor/my-documents
 * Get all documents for the authenticated user
 * 
 * Security: User ID is extracted from JWT token in authenticateToken middleware
 * No userId parameter needed - prevents users from accessing other users' documents
 */
router.get('/my-documents', authenticateToken, async (req, res) => {
  try {
    // Always filter by authenticated user's ID for security
    // Never trust client-provided userId for filtering
    const query = { userId: req.userId };
    
    // Optional: Support additional filters via query params
    // Example: ?folderId=abc&isPublic=true
    const { folderId, isPublic, lastModified } = req.query;
    
    if (folderId) {
      query.folderId = folderId;
    }
    
    if (isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    }
    
    if (lastModified) {
      const date = new Date(lastModified);
      if (!isNaN(date.getTime())) {
        query.updatedAt = { $gte: date };
      }
    }

    const documents = await Document.find(query)
      .sort({ updatedAt: -1 })
      .select('_id title createdAt updatedAt metadata');

    console.log(`✅ Retrieved ${documents.length} documents for user ${req.userId}`);

    res.json({
      documents: documents.map(doc => ({
        id: doc._id,
        title: doc.title,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        metadata: doc.metadata
      }))
    });

  } catch (error) {
    console.error('❌ Get my documents error:', error);
    
    res.status(500).json({ 
      error: 'Failed to retrieve documents',
      details: error.message 
    });
  }
});

/**
 * POST /api/text-editor/save
 * Save a new document
 */
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { title, data } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ 
        error: 'Title is required' 
      });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ 
        error: 'Document data is required and must be an object' 
      });
    }

    // Check payload size (safety check - Express middleware handles the main limit)
    const payloadSize = JSON.stringify(req.body).length;
    if (payloadSize > 45 * 1024 * 1024) { // 45MB safety buffer
      return res.status(413).json({ 
        error: 'Document is too large. Maximum size is 45MB.',
        details: {
          currentSize: `${(payloadSize / (1024 * 1024)).toFixed(2)}MB`,
          maxSize: '45MB'
        }
      });
    }

    // Create new document
    const document = new Document({
      title,
      data,
      userId: req.userId,
      hasBeenEdited: req.body.hasBeenEdited || false, // Track if document has been edited
      metadata: {
        lastEditedBy: req.userId || 'anonymous'
      }
    });

    await document.save();

    console.log(`✅ Document saved: ${document._id} (${title})`);

    res.status(201).json({
      id: document._id,
      documentId: document._id, // Include documentId for frontend compatibility
      title: document.title,
      message: 'Document saved successfully'
    });

  } catch (error) {
    console.error('❌ Save document error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Invalid document data',
        details: error.message 
      });
    }

    res.status(500).json({ 
      error: 'Failed to save document',
      details: error.message 
    });
  }
});

/**
 * GET /api/text-editor/document/:id
 * Get document by ID
 */
router.get('/document/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        error: 'Invalid document ID format' 
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found' 
      });
    }

    res.json({
      document: {
        id: document._id,
        title: document.title,
        data: document.data,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        metadata: document.metadata
      }
    });

  } catch (error) {
    console.error('❌ Get document error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid document ID format' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to retrieve document',
      details: error.message 
    });
  }
});

/**
 * PUT /api/text-editor/document/:id
 * Update existing document
 */
router.put('/document/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, data } = req.body;

    // Validate MongoDB ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        error: 'Invalid document ID format' 
      });
    }

    // Validate payload size
    const payloadSize = JSON.stringify(req.body).length;
    if (payloadSize > 45 * 1024 * 1024) { // 45MB safety buffer
      return res.status(413).json({ 
        error: 'Document is too large. Maximum size is 45MB.',
        details: {
          currentSize: `${(payloadSize / (1024 * 1024)).toFixed(2)}MB`,
          maxSize: '45MB'
        }
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found' 
      });
    }

    // Update fields
    if (title !== undefined) {
      document.title = title;
    }
    
    if (data !== undefined) {
      document.data = data;
      
      // Mark document as edited if it has actual content
      // Check if content has more than just an empty paragraph
      const hasRealContent = data.content?.content?.some(page => 
        page.content?.some(block => 
          block.type !== 'paragraph' || 
          (block.text && block.text.trim().length > 0)
        )
      );
      
      if (hasRealContent || data.html?.trim().length > 10) {
        document.hasBeenEdited = true;
      }
    }
    
    if (req.userId) {
      document.metadata.lastEditedBy = req.userId;
    }

    await document.save();

    console.log(`✅ Document updated: ${document._id}`);

    res.json({
      id: document._id,
      title: document.title,
      updatedAt: document.updatedAt,
      message: 'Document updated successfully'
    });

  } catch (error) {
    console.error('❌ Update document error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Invalid document data',
        details: error.message 
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid document ID format' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to update document',
      details: error.message 
    });
  }
});

/**
 * DELETE /api/text-editor/document/:id
 * Delete document
 */
router.delete('/document/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        error: 'Invalid document ID format' 
      });
    }

    const document = await Document.findByIdAndDelete(id);

    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found' 
      });
    }

    console.log(`✅ Document deleted: ${id}`);

    res.json({
      id,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete document error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid document ID format' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to delete document',
      details: error.message 
    });
  }
});

/**
 * GET /api/text-editor/all/documents (DEPRECATED - kept for backward compatibility)
 * Use /api/text-editor/my-documents instead
 * 
 * @deprecated Use authenticated endpoint instead
 */
router.get('/all/documents', authenticateToken, async (req, res) => {
  try {
    // For backward compatibility, but strongly recommend using /my-documents
    console.warn('⚠️  DEPRECATED: /all/documents endpoint used. Please migrate to /my-documents');
    
    const query = {};
    
    // Only use authenticated user's ID for security
    if (req.userId) {
      query.userId = req.userId;
    } else {
      // If no auth, return empty array instead of exposing all documents
      return res.json({ documents: [] });
    }

    const documents = await Document.find(query)
      .sort({ updatedAt: -1 })
      .select('_id title createdAt updatedAt metadata');

    res.json({
      documents: documents.map(doc => ({
        id: doc._id,
        title: doc.title,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        metadata: doc.metadata
      }))
    });

  } catch (error) {
    console.error('❌ Get all documents error:', error);
    
    res.status(500).json({ 
      error: 'Failed to retrieve documents',
      details: error.message 
    });
  }
});

/**
 * POST /api/text-editor/:documentId/comments
 * Add a comment to a document
 */
router.post('/:documentId/comments', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { text, selectedText, author, resolved, isSuggestion, from, to } = req.body;

    // Validate required fields
    if (!text || !author) {
      return res.status(400).json({ error: 'Comment text and author are required' });
    }

    // Get or initialize comments array for this document
    if (!commentsStore.has(documentId)) {
      commentsStore.set(documentId, []);
    }
    const documentComments = commentsStore.get(documentId);

    // Create new comment with position data
    const newComment = {
      id: Date.now().toString(),
      text,
      selectedText: selectedText || '',
      author,
      resolved: resolved || false,
      isSuggestion: isSuggestion || false,
      from: from != null ? from : null,  // Store ProseMirror position
      to: to != null ? to : null,        // Store ProseMirror position
      timestamp: new Date(),
      replies: [],
    };

    // Add to storage
    documentComments.push(newComment);

    console.log(`✅ Comment added to document ${documentId}: ${newComment.id}`);

    res.status(201).json(newComment);
  } catch (error) {
    console.error('❌ Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment', details: error.message });
  }
});

/**
 * GET /api/text-editor/:documentId/comments
 * Get all comments for a document
 */
router.get('/:documentId/comments', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    // Get comments for this document
    const documentComments = commentsStore.get(documentId) || [];

    console.log(`✅ Retrieved ${documentComments.length} comments for document ${documentId}`);

    res.json(documentComments);
  } catch (error) {
    console.error('❌ Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments', details: error.message });
  }
});

/**
 * PUT /api/text-editor/:documentId/comments/:commentId
 * Update a comment
 */
router.put('/:documentId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { documentId, commentId } = req.params;
    const { text, resolved } = req.body;

    // Get comments for this document
    const documentComments = commentsStore.get(documentId);
    
    if (!documentComments) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Find and update the comment
    const commentIndex = documentComments.findIndex(c => c.id === commentId);
    
    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const comment = documentComments[commentIndex];
    
    if (text !== undefined) {
      comment.text = text;
    }
    
    if (resolved !== undefined) {
      comment.resolved = resolved;
    }

    // Update in storage
    documentComments[commentIndex] = comment;

    console.log(`✅ Comment updated: ${commentId}`);

    res.json(comment);
  } catch (error) {
    console.error('❌ Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment', details: error.message });
  }
});

/**
 * DELETE /api/text-editor/:documentId/comments/:commentId
 * Delete a comment
 */
router.delete('/:documentId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { documentId, commentId } = req.params;

    // Get comments for this document
    const documentComments = commentsStore.get(documentId);
    
    if (!documentComments) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Remove the comment
    const filteredComments = documentComments.filter(c => c.id !== commentId);
    
    if (filteredComments.length === documentComments.length) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Update storage
    commentsStore.set(documentId, filteredComments);

    console.log(`✅ Comment deleted: ${commentId}`);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('❌ Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment', details: error.message });
  }
});

// ─── AI Endpoints for Text Editor ─────────────────────────────────────────────

/**
 * POST /api/text-editor/ai/generate
 * Generate text using AI with system prompt and user prompt
 */
router.post('/ai/generate', authenticateToken, monitorAIRequest, trackAIUsage, recordAIUsage, async (req, res) => {
  try {
    const { systemPrompt, userPrompt, temperature = 0.7, maxTokens = 4096, stream = false } = req.body;

    if (!userPrompt) {
      return res.status(400).json({ error: 'userPrompt is required' });
    }

    // Check cache first (only for non-streaming)
    if (!stream) {
      const cached = getCache('generate', { prompt: userPrompt, temperature });
      if (cached) {
        return res.json({ result: cached.result, fromCache: true });
      }
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    // Streaming response
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
      });

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // Non-streaming response
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature,
    });

    const text = response.choices[0]?.message?.content || '';
    
    // Cache the result
    setCache('generate', { prompt: userPrompt, temperature }, text);
    
    // Return actual token usage from API
    res.json({ 
      text, 
      fromCache: false,
      usage: response.usage // Actual token counts from OpenAI
    });
  } catch (error) {
    console.error('❌ AI Generate error:', error.message || error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate content', details: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
      res.end();
    }
  }
});

/**
 * POST /api/text-editor/ai/chat
 * Chat with AI assistant
 */
router.post('/ai/chat', authenticateToken, monitorAIRequest, trackAIUsage, recordAIUsage, async (req, res) => {
  try {
    const { messages, systemPrompt, temperature = 0.7, stream = false } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const formattedMessages = [];
    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }
    formattedMessages.push(...messages);

    // Streaming response
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: formattedMessages,
        temperature,
        stream: true,
      });

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // Non-streaming response
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: formattedMessages,
      temperature,
    });

    const text = response.choices[0]?.message?.content || '';
    
    // Return actual token usage
    res.json({ 
      text,
      usage: response.usage // Actual token counts from OpenAI
    });
  } catch (error) {
    console.error('❌ AI Chat error:', error.message || error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate response', details: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
      res.end();
    }
  }
});

/**
 * POST /api/text-editor/ai/transform
 * Transform text (rewrite, summarize, expand, etc.)
 */
router.post('/ai/transform', authenticateToken, monitorAIRequest, trackAIUsage, recordAIUsage, async (req, res) => {
  try {
    const { action, text, tone, temperature = 0.7, stream = false } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    let systemPrompt = 'You are a professional writing assistant.';
    
    // Build system prompt based on action
    switch (action) {
      case 'enhance':
        systemPrompt = 'You are a professional writing editor. Rewrite the given text to be clearer, more engaging, and more impactful while fully preserving the original meaning. Output ONLY the improved text.';
        break;
      case 'rewrite':
        systemPrompt = 'You are a professional writer. Completely rewrite the given text with fresh phrasing while preserving all original meaning. Output ONLY the rewritten text.';
        break;
      case 'summarize':
        systemPrompt = 'You are a skilled summarizer. Condense the given text into a clear, concise summary that captures all key points. Output ONLY the summary.';
        break;
      case 'expand':
        systemPrompt = 'You are a skilled writer. Expand the given text by adding relevant detail, context, and examples. Output ONLY the expanded text.';
        break;
      case 'simplify':
        systemPrompt = 'You are a clarity specialist. Rewrite using simpler vocabulary and shorter sentences. Preserve all meaning. Output ONLY the simplified text.';
        break;
      case 'grammar_fix':
        systemPrompt = 'You are a grammar expert. Fix all grammar, spelling, and punctuation errors in the given text. Output ONLY the corrected text.';
        break;
      default:
        if (action && action.includes('tone')) {
          systemPrompt = `You are a writing style expert. Rewrite the given text in a ${tone || 'professional'} tone. Output ONLY the rewritten text.`;
        }
    }

    // Streaming response
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        max_tokens: 2000,
        temperature,
        stream: true,
      });

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // Non-streaming response
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      max_tokens: 2000,
      temperature,
    });

    const result = response.choices[0]?.message?.content || '';
    
    // Cache the transformation
    setCache('transform', { action, text, temperature }, result);
    
    // Return actual token usage
    res.json({ 
      result, 
      fromCache: false,
      usage: response.usage // Actual token counts from OpenAI
    });
  } catch (error) {
    console.error('❌ AI Transform error:', error.message || error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to transform text', details: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
      res.end();
    }
  }
});

// Get quota status
router.get('/ai/quota-status', authenticateToken, getQuotaStatus);

// Health check
router.get('/ai/health', getHealthStatus);

// Analytics endpoints
router.get('/ai/analytics', authenticateToken, getAnalyticsDashboard);
router.get('/ai/analytics/user', authenticateToken, getUserUsageReport);
router.get('/ai/analytics/user/:userId', authenticateToken, getUserUsageReport);
router.get('/ai/analytics/costs', authenticateToken, getCostBreakdown);
router.get('/ai/analytics/alerts', authenticateToken, getAlerts);

// Cache management (admin only - add authentication in production)
router.get('/ai/cache/stats', authenticateToken, (req, res) => {
  const stats = getCacheStats();
  res.json(stats);
});

router.post('/ai/cache/clear', authenticateToken, (req, res) => {
  const { endpoint } = req.body;
  clearCache(endpoint);
  res.json({ success: true, message: endpoint ? `Cleared ${endpoint} cache` : 'Cleared all cache' });
});

/**
 * DELETE /api/text-editor/cleanup-empty
 * Manually trigger cleanup of empty documents (admin endpoint)
 * This is a fallback - TTL index should handle most cleanup automatically
 */
router.delete('/cleanup-empty', authenticateToken, async (req, res) => {
  try {
    // Only allow admin users to trigger cleanup
    // Add your admin check here
    // if (!req.user || !req.user.isAdmin) {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find and delete documents that:
    // 1. Were created more than 24 hours ago
    // 2. Have never been edited
    // 3. Have empty or minimal content
    const result = await Document.deleteMany({
      hasBeenEdited: false,
      createdAt: { $lt: twentyFourHoursAgo },
      $or: [
        { 'metadata.wordCount': { $lte: 0 } },
        { 'data.content.content.0.content.0.text': { $exists: false } }
      ]
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} empty documents`);

    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Cleaned up ${result.deletedCount} empty documents`
    });
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({ 
      error: 'Failed to cleanup empty documents',
      details: error.message 
    });
  }
});

/**
 * GET /api/text-editor/stats
 * Get document statistics (admin endpoint)
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalDocuments,
      emptyDocuments,
      editedDocuments,
      recentDocuments
    ] = await Promise.all([
      Document.countDocuments(),
      Document.countDocuments({ hasBeenEdited: false }),
      Document.countDocuments({ hasBeenEdited: true }),
      Document.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } })
    ]);

    res.json({
      totalDocuments,
      emptyDocuments,
      editedDocuments,
      recentDocuments,
      storageEfficiency: editedDocuments > 0 ? ((editedDocuments / totalDocuments) * 100).toFixed(2) + '%' : '0%'
    });
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get document stats',
      details: error.message 
    });
  }
});

/**
 * GET /api/text-editor/ai-usage
 * Get actual AI token usage for the current user from backend
 * Used for reconciling frontend token counter with actual usage
 */
router.get('/ai-usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // "2024-01"
    
    // Get AI usage from database
    const usage = await AIUsage.aggregate([
      { $match: { userId, month: currentMonth } },
      {
        $group: {
          _id: null,
          totalInputTokens: { $sum: '$inputTokens' },
          totalOutputTokens: { $sum: '$outputTokens' },
          totalTokens: { $sum: '$totalTokens' },
          totalCost: { $sum: '$cost' },
          totalRequests: { $sum: 1 }
        }
      }
    ]);

    const usageData = usage[0] || {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      totalRequests: 0
    };

    res.json({
      success: true,
      usage: usageData,
      period: currentMonth
    });
  } catch (error) {
    console.error('❌ AI Usage retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI usage',
      details: error.message 
    });
  }
});

/**
 * GET /api/text-editor/ai-usage/predict
 * Get usage predictions and forecasting
 */
router.get('/ai-usage/predict', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userTier = req.userTier || 'free';
    
    const usagePredictor = require('../utils/usagePredictor');
    const prediction = await usagePredictor.predictMonthEnd(userId, userTier);
    
    res.json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('❌ Usage prediction error:', error);
    res.status(500).json({ 
      error: 'Failed to get usage prediction',
      details: error.message 
    });
  }
});

/**
 * GET /api/text-editor/ai-usage/recommendations
 * Get personalized usage recommendations
 */
router.get('/ai-usage/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userTier = req.userTier || 'free';
    
    const usagePredictor = require('../utils/usagePredictor');
    const recommendations = await usagePredictor.getPersonalizedRecommendations(userId, userTier);
    
    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('❌ Recommendations error:', error);
    res.status(500).json({ 
      error: 'Failed to get recommendations',
      details: error.message 
    });
  }
});

/**
 * GET /api/text-editor/ai-usage/trends
 * Get usage trend analysis
 */
router.get('/ai-usage/trends', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { months = 3 } = req.query;
    
    const usagePredictor = require('../utils/usagePredictor');
    const trends = await usagePredictor.getTrendAnalysis(userId, parseInt(months));
    
    res.json({
      success: true,
      trends
    });
  } catch (error) {
    console.error('❌ Trends error:', error);
    res.status(500).json({ 
      error: 'Failed to get trends',
      details: error.message 
    });
  }
});

module.exports = router;
