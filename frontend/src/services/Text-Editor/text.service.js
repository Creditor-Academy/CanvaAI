/**
 * Text Editor AI Services
 * Centralized API calls for AI features (Claude, Pollinations)
 */
import axios from 'axios';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

/**
 * Call Claude AI API for text generation/streaming
 * @param {Object} params - Request parameters
 * @param {string} params.systemPrompt - System instruction prompt
 * @param {string} params.userPrompt - User message prompt
 * @param {number} [params.temperature=0.7] - Creativity temperature (0-1)
 * @param {number} [params.maxTokens=4096] - Maximum tokens to generate
 * @param {Function} [params.onChunk] - Callback for streaming chunks
 * @param {AbortSignal} [params.signal] - AbortController signal
 * @returns {Promise<string>} Generated text response
 */
async function callClaude({ 
  systemPrompt, 
  userPrompt, 
  temperature = 0.7, 
  maxTokens = 4096, 
  onChunk, 
  signal 
}) {
  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      temperature,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }
  
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    for (const line of decoder.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      
      try {
        const text = JSON.parse(data)?.delta?.text ?? '';
        if (text) { 
          full += text; 
          onChunk?.(full); 
        }
      } catch { /* skip parse errors */ }
    }
  }
  
  return full;
}

/**
 * Call Claude AI API for chat conversations
 * @param {Object} params - Request parameters
 * @param {Array} params.messages - Array of chat messages
 * @param {string} params.systemPrompt - System instruction prompt
 * @param {number} [params.temperature=0.7] - Creativity temperature (0-1)
 * @param {Function} [params.onChunk] - Callback for streaming chunks
 * @param {AbortSignal} [params.signal] - AbortController signal
 * @returns {Promise<string>} Generated chat response
 */
async function callClaudeChat({ 
  messages, 
  systemPrompt, 
  temperature = 0.7, 
  onChunk, 
  signal 
}) {
  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      temperature,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }
  
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    for (const line of decoder.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      
      try {
        const text = JSON.parse(data)?.delta?.text ?? '';
        if (text) { 
          full += text; 
          onChunk?.(full); 
        }
      } catch { /* skip parse errors */ }
    }
  }
  
  return full;
}

/**
 * Build Pollinations AI image generation URL
 * @param {string} prompt - Image description prompt
 * @param {string} size - Image dimensions (e.g., '1024x1024')
 * @returns {string} Pollinations image URL
 */
function buildPollinationsUrl(prompt, size) {
  const [w, h] = size.split('x');
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&nologo=true&enhance=true&model=flux`;
}

/**
 * Generate document content using Claude AI
 * @param {Object} options - Generation options
 * @param {string} options.topic - Document topic
 * @param {string} options.docType - Type of document (Blog Post, Essay, etc.)
 * @param {string} options.tone - Writing tone (Professional, Casual, etc.)
 * @param {number} options.pages - Number of pages
 * @param {number} options.creativity - Creativity level (0-1)
 * @param {Function} options.onChunk - Streaming callback
 * @param {AbortSignal} options.signal - Abort signal
 * @returns {Promise<string>} Generated HTML content
 */
async function generateDocument({
  topic,
  docType,
  tone,
  pages,
  creativity,
  onChunk,
  signal
}) {
  const PROMPTS = {
    generate: (type, tone, pages) => 
      `You are a professional ${type.toLowerCase()} writer. Create a well-structured, engaging ${type.toLowerCase()} with a ${tone} tone. Target length: approximately ${pages * 380} words.`
  };

  return await callClaude({
    systemPrompt: PROMPTS.generate(docType, tone, pages),
    userPrompt: `Write a ${docType} about: ${topic.trim()}`,
    temperature: creativity,
    signal,
    onChunk,
  });
}

/**
 * Generate image using Pollinations AI
 * @param {Object} options - Generation options
 * @param {string} options.prompt - Image description
 * @param {string} options.style - Art style (photorealistic, digital art, etc.)
 * @param {string} options.size - Image dimensions
 * @param {boolean} [options.enhancePrompt=true] - Whether to enhance prompt via Claude
 * @param {AbortSignal} options.signal - Abort signal
 * @returns {Promise<{url: string, enhancedPrompt: string}>} Image URL and enhanced prompt
 */
async function generateImage({
  prompt,
  style,
  size,
  enhancePrompt = true,
  signal
}) {
  let finalPrompt = prompt;
  
  if (enhancePrompt) {
    try {
      const enhanced = await callClaude({
        systemPrompt: 'You are an expert at writing detailed AI image generation prompts. Take the user\'s description and expand it into a rich, detailed prompt with visual specifics, lighting, composition, mood, and style. Return ONLY the prompt text — no quotes, no explanation.',
        userPrompt: `Create an image generation prompt for: "${prompt.trim()}". Style: ${style}. Make it detailed and vivid.`,
        temperature: 0.7,
        maxTokens: 256,
        signal,
      });
      finalPrompt = enhanced.trim() || `${prompt}, ${style}, high quality, detailed`;
    } catch (err) {
      // Fallback to original prompt if enhancement fails
      finalPrompt = `${prompt}, ${style}, high quality, detailed`;
    }
  } else {
    finalPrompt = `${prompt}, ${style}, high quality, detailed`;
  }
  
  const url = buildPollinationsUrl(finalPrompt, size);
  return { url, enhancedPrompt: finalPrompt };
}

/**
 * Transform/enhance text using Claude AI
 * @param {Object} options - Transformation options
 * @param {string} options.text - Original text to transform
 * @param {string} options.action - Action type (rewrite, summarize, expand, etc.)
 * @param {string} [options.customPrompt] - Custom instruction for 'custom' action
 * @param {string} [options.tone] - Target tone for tone changes
 * @param {string} [options.language] - Target language for translation
 * @param {number} options.creativity - Creativity level (0-1)
 * @param {AbortSignal} options.signal - Abort signal
 * @returns {Promise<string>} Transformed text
 */
async function transformText({
  text,
  action,
  customPrompt,
  tone,
  language,
  creativity,
  signal
}) {
  const TRANSFORM_PROMPTS = {
    rewrite: `Rewrite this text to improve clarity, flow, and engagement while maintaining the original meaning:\n\n"${text}"`,
    expand: `Expand this text with more details, examples, and depth:\n\n"${text}"`,
    summarize: `Summarize this text, keeping only the key points:\n\n"${text}"`,
    simplify: `Simplify this text to make it easier to read and understand:\n\n"${text}"`,
    change_tone: `Rewrite this text in a ${tone} tone:\n\n"${text}"`,
    translate: `Translate this text to ${language}:\n\n"${text}"`,
    paraphrase: `Paraphrase this text using different words while keeping the same meaning:\n\n"${text}"`,
    custom: customPrompt ? `${customPrompt}\n\nApply to this text:\n\n"${text}"` : `Transform this text:\n\n"${text}"`,
  };

  return await callClaude({
    systemPrompt: 'You are a professional editor and writing assistant. Help users improve their text with clarity, correctness, and impact.',
    userPrompt: TRANSFORM_PROMPTS[action] || TRANSFORM_PROMPTS.rewrite,
    temperature: creativity,
    signal,
  });
}

/**
 * Chat with Claude AI
 * @param {Object} options - Chat options
 * @param {Array} options.messages - Chat message history
 * @param {number} options.creativity - Creativity level (0-1)
 * @param {AbortSignal} options.signal - Abort signal
 * @param {Function} options.onChunk - Streaming callback
 * @returns {Promise<string>} AI response
 */
async function chatWithAI({
  messages,
  creativity,
  signal,
  onChunk
}) {
  return await callClaudeChat({
    messages,
    systemPrompt: 'You are Athena, a helpful AI assistant integrated into a document editor. Provide clear, accurate, and helpful responses.',
    temperature: creativity,
    signal,
    onChunk,
  });
}

// ============================================================================
// Backend API Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Get authentication headers from localStorage token
 * @returns {Object} Axios config object with headers
 */
const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return { headers };
};

// ============================================================================
// Document Management APIs (Backend)
// ============================================================================

/**
 * Save a new document to the backend
 * @param {Object} documentData - Document data
 * @param {string} documentData.title - Document title
 * @param {Object} documentData.data - Document content data (ProseMirror JSON)
 * @param {string} [documentData.data.html] - HTML representation
 * @param {Object} [documentData.data.content] - ProseMirror content JSON
 * @returns {Promise<{id: string, title: string, message: string}>}
 */
async function saveDocument({ title, data }) {
  const response = await axios.post(
    `${API_BASE_URL}/api/text-editor/save`,
    { title, data },
    getAuthConfig()
  );
  
  return response.data;
}

/**
 * Get document by ID from backend
 * @param {string} documentId - MongoDB document ID
 * @returns {Promise<{id: string, title: string, data: Object, createdAt: string, updatedAt: string}>}
 */
async function getDocumentById(documentId) {
  const response = await axios.get(
    `${API_BASE_URL}/api/text-editor/document/${documentId}`,
    getAuthConfig()
  );
  
  return response.data;
}

/**
 * Update existing document
 * @param {string} documentId - Document ID
 * @param {Object} documentData - Updated document data
 * @returns {Promise<{id: string, message: string}>}
 */
async function updateDocument(documentId, documentData) {
  const response = await axios.put(
    `${API_BASE_URL}/api/text-editor/document/${documentId}`,
    documentData,
    getAuthConfig()
  );
  
  return response.data;
}

/**
 * Delete document
 * @param {string} documentId - Document ID
 * @returns {Promise<{message: string}>}
 */
async function deleteDocument(documentId) {
  const response = await axios.delete(
    `${API_BASE_URL}/api/text-editor/document/${documentId}`,
    getAuthConfig()
  );
  
  return response.data;
}

/**
 * Get all documents from backend (for Recent Documents list)
 * @param {string} [userId] - User ID to filter documents (optional)
 * @returns {Promise<{documents: Array<{id: string, title: string, createdAt: string, updatedAt: string, ownerId: string}>}>}
 */
async function getAllDocuments(userId) {
  const url = userId 
    ? `${API_BASE_URL}/api/text-editor/all/documents/${userId}`
    : `${API_BASE_URL}/api/text-editor/documents`;
  
  const response = await axios.get(url, getAuthConfig());
  
  return response.data;
}

// Export all service functions
export const TextEditorService = {
  // AI Functions
  callClaude,
  callClaudeChat,
  buildPollinationsUrl,
  generateDocument,
  generateImage,
  transformText,
  chatWithAI,
  
  // Backend Document Management
  saveDocument,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getAllDocuments,
};
