// src/components/canva/TextEnhanceService.js
// Service for handling AI text enhancement API calls

const API_ENDPOINT = 'http://localhost:5000/api/text-enhance/enhance';

/**
 * Enhance text using AI
 * @param {string} text - The text to enhance
 * @param {boolean} isHeading - Whether the text is a heading
 * @returns {Promise<Object>} - Promise resolving to { enhancedText: string }
 */
export const enhanceText = async (text, isHeading = false) => {
  if (!text || !text.trim()) {
    throw new Error('Text is required');
  }

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: text,
      isHeading: isHeading
    }),
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
    console.error('Non-JSON response from text-enhance API:', text.substring(0, 200));
    throw new Error(`Unexpected response format (HTTP ${response.status})`);
  }
  
  if (!data.enhancedText) {
    throw new Error('No enhanced text received');
  }

  return data;
};

