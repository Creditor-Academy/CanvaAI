import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL = `${BASE_URL}/api/pp`;

// Helper to get auth headers in Axios format
const getAxiosConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };
};

/**
 * Generate outline for presentation from backend
 * @param {Object} params - Parameters for outline generation
 * @returns {Promise<Object>} - Generated outline with slides
 */
export const generateOutline = async (params) => {
  const response = await axios.post(`${API_BASE_URL}/get-presentation-outline`, params, getAxiosConfig());
  return response.data;
};

/**
 * Generate presentation data from backend
 * @param {Object} params - Parameters for presentation generation
 * @returns {Promise<Object>} - Generated slides and theme
 */
export const generatePresentation = async (params) => {
  const response = await axios.post(`${API_BASE_URL}/get-presentation-outline`, params, getAxiosConfig());
  return response.data;
};

/**
 * Export presentation as different formats
 * @param {Array} slides - Edited slides array
 * @param {Object} theme - Presentation theme
 * @param {string} format - Format, e.g., 'pptx', 'pdf'
 * @returns {Promise<Blob>} - Blob data for download
 */
export const exportPresentation = async (slides, theme, format) => {
  const response = await axios.post(`${API_BASE_URL}/generate-ppt`, 
    { topic: 'presentation', editedData: { slides, theme } }, 
    { 
      ...getAxiosConfig(),
      responseType: 'blob'
    }
  );
  return response.data;
};

/**
 * Generate AI image for a slide
 * @param {string} prompt - Prompt for image generation
 * @returns {Promise<Object>} - { imageUrl: string }
 */
export const generateImage = async (prompt) => {
  const response = await axios.post(`${API_BASE_URL}/generate-slide-image`, { prompt }, getAxiosConfig());
  return response.data;
};
