// src/components/canva/TextStyleService.js
// Service for handling AI text styling API calls

const API_ENDPOINT = '/api/text-style/generate';

/**
 * Generate styled text designs using AI
 * @param {string} text - The text to style
 * @returns {Promise<Object>} - Promise resolving to { images: string[] }
 */
export const generateTextStyles = async (text) => {
  if (!text || !text.trim()) {
    throw new Error('Text is required');
  }

  const response = await fetch(`${API_ENDPOINT}?text=${encodeURIComponent(text)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  // Check content type before parsing
  const contentType = response.headers.get('content-type') || '';
  
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    if (contentType.includes('application/json')) {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } else {
      const errorText = await response.text();
      console.error('Non-JSON error response:', errorText.substring(0, 200));
      if (response.status === 404) {
        errorMessage = `API endpoint not found: ${API_ENDPOINT}`;
      }
    }
    throw new Error(errorMessage);
  }

  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    console.error('Non-JSON response from text-style API:', text.substring(0, 200));
    throw new Error(`Unexpected response format (HTTP ${response.status})`);
  }
  
  if (!data.images || !Array.isArray(data.images)) {
    throw new Error('No images received');
  }

  return data;
};