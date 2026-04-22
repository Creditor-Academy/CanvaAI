/**
 * tokenPersistence.js - Save and load token usage data
 * Persists AI token counts across document sessions
 */

// Global token storage (in-memory, synced with backend on save)
const tokenStorage = new Map(); // docId -> { inputTokens, outputTokens, totalTokensUsed }

/**
 * Save token usage for a document
 * Called during auto-save to persist token data
 */
export function saveTokenUsage(docId, tokenData) {
  if (!docId || !tokenData) return;
  
  tokenStorage.set(docId, {
    inputTokens: tokenData.inputTokens || 0,
    outputTokens: tokenData.outputTokens || 0,
    totalTokensUsed: tokenData.totalTokensUsed || 0,
    lastTokenUpdate: new Date()
  });
  
  console.log('[TokenPersistence] 💾 Saved token usage:', {
    docId,
    ...tokenStorage.get(docId)
  });
}

/**
 * Load token usage for a document
 * Called when document is opened to restore token state
 */
export function loadTokenUsage(docId) {
  if (!docId) return null;
  
  // Check in-memory cache first
  const cached = tokenStorage.get(docId);
  if (cached) {
    console.log('[TokenPersistence] 📂 Loaded token usage from cache:', {
      docId,
      ...cached
    });
    return cached;
  }
  
  console.log('[TokenPersistence] 📂 No token usage found for:', docId);
  return null;
}

/**
 * Get token usage metadata for saving to backend
 */
export function getTokenUsageForSave(docId) {
  const usage = tokenStorage.get(docId);
  if (!usage) return null;
  
  return {
    'metadata.tokenUsage.inputTokens': usage.inputTokens,
    'metadata.tokenUsage.outputTokens': usage.outputTokens,
    'metadata.tokenUsage.totalTokensUsed': usage.totalTokensUsed,
    'metadata.tokenUsage.lastTokenUpdate': usage.lastTokenUpdate
  };
}

/**
 * Clear token usage for a document
 */
export function clearTokenUsage(docId) {
  tokenStorage.delete(docId);
}

/**
 * Clear all token usage (logout/cleanup)
 */
export function clearAllTokenUsage() {
  tokenStorage.clear();
}
