// src/components/canva/TextEnhanceService.js
// Service for handling AI text enhancement API calls

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_ENDPOINT = `${API_BASE_URL}/api/text-enhance/enhance`;

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

  const token = localStorage.getItem('token');

  const response = await axios.post(
    API_ENDPOINT,
    { text, isHeading },
    {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  const data = response.data;

  if (!data.enhancedText) {
    throw new Error('No enhanced text received');
  }

  return data;
};

