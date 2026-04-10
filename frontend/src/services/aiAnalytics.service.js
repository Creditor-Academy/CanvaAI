/**
 * aiAnalytics.service.js - Frontend service for AI analytics
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Get comprehensive analytics dashboard
 */
export const getAnalytics = async (period = 'month') => {
  const response = await fetch(
    `${API_BASE_URL}/text-editor/ai/analytics?period=${period}`,
    {
      headers: getAuthHeaders()
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }
  
  return response.json();
};

/**
 * Get user-specific usage report
 */
export const getUserUsage = async (userId = null) => {
  const endpoint = userId 
    ? `/text-editor/ai/analytics/user/${userId}`
    : '/text-editor/ai/analytics/user';
    
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user usage');
  }
  
  return response.json();
};

/**
 * Get quota status
 */
export const getQuotaStatus = async () => {
  const response = await fetch(
    `${API_BASE_URL}/text-editor/ai/quota-status`,
    {
      headers: getAuthHeaders()
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch quota status');
  }
  
  return response.json();
};

/**
 * Get cost breakdown
 */
export const getCostBreakdown = async (month = null) => {
  const url = month
    ? `${API_BASE_URL}/text-editor/ai/analytics/costs?month=${month}`
    : `${API_BASE_URL}/text-editor/ai/analytics/costs`;
    
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch cost breakdown');
  }
  
  return response.json();
};

/**
 * Get alerts
 */
export const getAlerts = async () => {
  const response = await fetch(
    `${API_BASE_URL}/text-editor/ai/analytics/alerts`,
    {
      headers: getAuthHeaders()
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch alerts');
  }
  
  return response.json();
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  const response = await fetch(
    `${API_BASE_URL}/text-editor/ai/cache/stats`,
    {
      headers: getAuthHeaders()
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch cache stats');
  }
  
  return response.json();
};

/**
 * Clear cache
 */
export const clearCache = async (endpoint = null) => {
  const response = await fetch(
    `${API_BASE_URL}/text-editor/ai/cache/clear`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ endpoint })
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to clear cache');
  }
  
  return response.json();
};

/**
 * Check if user has quota remaining
 */
export const hasQuotaRemaining = async () => {
  try {
    const quota = await getQuotaStatus();
    return quota.monthly.remaining > 0;
  } catch (error) {
    console.error('Failed to check quota:', error);
    return true; // Allow request on error
  }
};

export default {
  getAnalytics,
  getUserUsage,
  getQuotaStatus,
  getCostBreakdown,
  getAlerts,
  getCacheStats,
  clearCache,
  hasQuotaRemaining
};
