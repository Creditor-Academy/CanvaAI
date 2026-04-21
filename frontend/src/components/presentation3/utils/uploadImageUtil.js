import api from '../../../services/api';

/**
 * Reads a File object as a base64 data URL.
 * @param {File} file
 * @returns {Promise<string>}
 */
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a file to S3 via the backend API.
 *
 * Handles both flat  { url, key }  and enveloped  { data: { url, key } }
 * response shapes so both the PropertiesPanel and TopBar flows stay consistent.
 *
 * @param {File}   file
 * @param {string} userId
 * @param {string} pptId
 * @returns {Promise<{ url: string, key: string }>}
 */
export async function uploadImageFile(file, userId, pptId) {
  const base64Image = await readFileAsBase64(file);

  const response = await api.uploadTemporaryImage({
    userId,
    serviceId: pptId,
    base64Image,
  });

  // Normalise: support both  { url, key }  and  { data: { url, key } }
  const url = response?.url ?? response?.data?.url;
  const key = response?.key ?? response?.data?.key;

  if (!url || !key) {
    throw new Error('Invalid response from upload API');
  }

  return { url, key };
}
