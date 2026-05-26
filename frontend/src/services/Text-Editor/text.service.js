import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

/**
 * Call Backend AI API for text generation (OpenAI)
 */
async function callAI({
  systemPrompt,
  userPrompt,
  temperature = 0.7,
  maxTokens = 4096,
  onChunk,
  signal
}) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/text-editor/generate-text`,
      {
        systemPrompt,
        userPrompt,
        temperature,
        maxTokens
      },
      { ...getAuthConfig(), signal }
    );

    const result = response.data.text;
    onChunk?.(result);

    return result;
  } catch (error) {
    console.error("AI Generation Error:", error);

    throw new Error(
      error.response?.data?.message ||
      "AI failed to generate content"
    );
  }
}

/**
 * Call Backend AI API for chat (OpenAI)
 */
async function callAIChat({
  messages,
  systemPrompt,
  temperature = 0.7,
  onChunk,
  signal
}) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/text-editor/chat`, {
      messages,
      systemPrompt,
      temperature
    }, { ...getAuthConfig(), signal });

    const result = response.data.text;
    onChunk?.(result);
    return result;
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw new Error(error.response?.data?.message || "AI failed to generate response");
  }
}

// callClaude and callClaudeChat have been replaced by callAI and callAIChat

/**
 * Build Pollinations AI image generation URL
 * @param {string} prompt - Image description prompt
 * @param {string} size - Image dimensions (e.g., '1024x1024')
 * @returns {string} Pollinations image URL
 */
function buildPollinationsUrl(prompt, size) {
  const [w, h] = size.split('x');
  const encoded = encodeURIComponent(prompt);
  // Using a more reliable default model and ensuring parameters are clean
  return `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&nologo=true&enhance=true`;
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

  return await callAI({
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
  size = '1024x1024',
  enhancePrompt = true,
  signal
}) {
  let finalPrompt = prompt;

  if (enhancePrompt) {
    try {
      const enhanced = await callAI({
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
  signal,
  systemPrompt: systemPromptOverride, // Allow caller to override system prompt
}) {
  const TRANSFORM_PROMPTS = {
    rewrite: `Rewrite this text to improve clarity, flow, and engagement while maintaining the original meaning:\n\n"${text}"`,
    enhance: `Enhance this text to be more professional, engaging, and impactful while preserving the original meaning:\n\n"${text}"`,
    expand: `Expand this text with more details, examples, and depth:\n\n"${text}"`,
    summarize: `Summarize this text concisely, keeping only the key points:\n\n"${text}"`,
    simplify: `Simplify this text to make it easier to read and understand:\n\n"${text}"`,
    change_tone: `Rewrite this text in a ${tone} tone:\n\n"${text}"`,
    translate: `Translate this text to ${language}:\n\n"${text}"`,
    paraphrase: `Paraphrase this text using completely different words while keeping the same meaning:\n\n"${text}"`,
    make_professional: `Rewrite this text in a polished, professional tone suitable for business communication. Remove informal language:\n\n"${text}"`,
    make_concise: `Remove all unnecessary words and redundancy from this text. Keep every essential idea but cut aggressively:\n\n"${text}"`,
    add_examples: `Enhance this text by inserting relevant, concrete examples and illustrations to support each key claim:\n\n"${text}"`,
    custom: customPrompt ? `${customPrompt}\n\nApply to this text:\n\n"${text}"` : `Transform this text:\n\n"${text}"`,
  };

  const resolvedSystemPrompt = systemPromptOverride ||
    'You are a professional editor and writing assistant. Help users improve their text with clarity, correctness, and impact. Return ONLY the transformed text — no preamble, no explanation.';

  return await callAI({
    systemPrompt: resolvedSystemPrompt,
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
  return await callAIChat({
    messages,
    systemPrompt: 'You are Athena, a helpful AI assistant integrated into a document editor. Provide clear, accurate, and helpful responses.',
    temperature: creativity,
    signal,
    onChunk,
  });
}

// Backend API Configuration is now at the top

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
 * Update existing document with keepalive (for tab-close saves)
 * Uses native fetch as axios doesn't support keepalive well
 * @param {string} documentId - Document ID
 * @param {Object} documentData - Updated document data
 */
async function updateDocumentKeepAlive(documentId, documentData) {
  const token = localStorage.getItem('token');
  const url = `${API_BASE_URL}/api/text-editor/update/${documentId}`;

  try {
    await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(documentData),
      keepalive: true
    });

    return { success: true };
  } catch (error) {
    console.error("Keep-alive save failed:", error);
    return { success: false, error };
  }
}
/**
 * Update existing document (Partial Update via PATCH)
 * @param {string} documentId - Document ID
 * @param {Object} documentData - Updated document data (only changed fields)
 * @returns {Promise<{id: string, message: string}>}
 */
async function updateDocument(documentId, documentData) {
  const response = await axios.patch(
    `${API_BASE_URL}/api/text-editor/update/${documentId}`,
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
    `${API_BASE_URL}/api/text-editor/delete/${documentId}`,
    getAuthConfig()
  );

  return response.data;
}

/**
 * Get all documents for the authenticated user
 * @returns {Promise<{documents: Array<{id: string, title: string, createdAt: string, updatedAt: string}>}>}
 */
async function getAllDocuments() {
  const url = `${API_BASE_URL}/api/text-editor/all/documents`;

  const response = await axios.get(url, getAuthConfig());

  return response.data;
}

/**
 * Upload an image to the backend and return the URL
 * @param {FormData} formData - FormData containing the image file
 * @returns {Promise<{url: string}>} - The uploaded image URL
 */
async function uploadImage(formData) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/text-editor/upload-image`,
      formData,
      {
        ...getAuthConfig(),
        headers: {
          ...getAuthConfig().headers,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error("Image upload error:", error);
    throw new Error(error.response?.data?.message || "Image upload failed");
  }
}

/**
 * Create a new version of a document on the backend
 * @param {string} documentId - The document ID
 * @param {Object} versionData - Version metadata (title, author, etc.)
 * @returns {Promise<{versionId: string, title: string, timestamp: string}>} - Version info
 */
async function createVersion(documentId, versionData) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/text-editor/${documentId}/versions`,
      versionData,
      getAuthConfig()
    );

    return response.data;
  } catch (error) {
    console.error("Create version error:", error);
    throw new Error(error.response?.data?.message || "Failed to create version");
  }
}

/**
 * Get a specific version's content from the backend
 * @param {string} documentId - The document ID
 * @param {string} versionId - The version ID
 * @returns {Promise<{content: Object, title: string, timestamp: string}>} - Version content and metadata
 */
async function getVersionById(documentId, versionId) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/text-editor/${documentId}/versions/${versionId}`,
      getAuthConfig()
    );

    return response.data;
  } catch (error) {
    console.error("Get version error:", error);
    throw new Error(error.response?.data?.message || "Failed to get version");
  }
}

/**
 * Clone/duplicate a document on the backend
 * @param {string} documentId - The source document ID to clone
 * @returns {Promise<{newId: string, title: string}>} - The new cloned document info
 */
async function cloneDocument(documentId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/text-editor/${documentId}/clone`,
      {},
      getAuthConfig()
    );

    return response.data; // { newId, title, ... }
  } catch (error) {
    console.error("Clone document error:", error);
    throw new Error(error.response?.data?.message || "Failed to duplicate document");
  }
}

/**
 * Add a comment to a document
 * @param {string} documentId - The document ID
 * @param {Object} commentData - Comment data { text, selectedText, author, resolved }
 * @returns {Promise<Object>} - The saved comment with metadata
 */
async function addComment(documentId, commentData) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/text-editor/${documentId}/comments`,
      commentData,
      getAuthConfig()
    );

    return response.data;
  } catch (error) {
    console.error("Add comment error:", error);
    throw new Error(error.response?.data?.message || "Failed to add comment");
  }
}

/**
 * Get all comments for a document
 * @param {string} documentId - The document ID
 * @returns {Promise<Array>} - Array of comments with metadata
 */
async function getComments(documentId) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/text-editor/${documentId}/comments`,
      getAuthConfig()
    );

    return response.data || [];
  } catch (error) {
    console.error("Get comments error:", error);
    throw new Error(error.response?.data?.message || "Failed to get comments");
  }
}

/**
 * Update a comment
 * @param {string} documentId - The document ID
 * @param {string} commentId - The comment ID
 * @param {Object} updateData - Updated comment data
 * @returns {Promise<Object>} - The updated comment
 */
async function updateComment(documentId, commentId, updateData) {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/text-editor/${documentId}/comments/${commentId}`,
      updateData,
      getAuthConfig()
    );

    return response.data;
  } catch (error) {
    console.error("Update comment error:", error);
    throw new Error(error.response?.data?.message || "Failed to update comment");
  }
}

/**
 * Delete a comment
 * @param {string} documentId - The document ID
 * @param {string} commentId - The comment ID
 * @returns {Promise<void>}
 */
async function deleteComment(documentId, commentId) {
  try {
    await axios.delete(
      `${API_BASE_URL}/api/text-editor/${documentId}/comments/${commentId}`,
      getAuthConfig()
    );
  } catch (error) {
    console.error("Delete comment error:", error);
    throw new Error(error.response?.data?.message || "Failed to delete comment");
  }
}

// Export all service functions
export const TextEditorService = {
  // AI Functions
  callAI,
  callAIChat,
  buildPollinationsUrl,
  generateDocument,
  generateImage,
  transformText,
  chatWithAI,

  // Backend Document Management
  saveDocument,
  getDocumentById,
  updateDocument,
  updateDocumentKeepAlive,
  deleteDocument,
  getAllDocuments,

  // Image Upload
  uploadImage,

  // Version Management
  createVersion,
  getVersionById,

  // Document Cloning
  cloneDocument,

  // Comments Management
  addComment,
  getComments,
  updateComment,
  deleteComment,
};
