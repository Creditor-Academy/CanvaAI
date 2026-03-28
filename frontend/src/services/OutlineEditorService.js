//import { title } from "node:process";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = `${BASE_URL}/api/pp`;

// const API_BASE_URL = '/api/pp';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Finalize presentation from outline
 * @param {Object} outlineData - The outline data to finalize
 * @returns {Promise<Object>} - Finalized presentation data
 */
export const finalizePresentation = async (outlineData) => {
  // Use the exact meta object that was sent to get-presentation-outline (preserved in originalMeta).
  // Note: `topic` is a top-level payload field (not inside meta), so we inject it separately.
  // Fall back to reconstructing meta only if originalMeta is unavailable.
  const meta = outlineData.originalMeta
    ? {
      ...outlineData.originalMeta,
      topic: outlineData.meta?.topic || outlineData.topic || '',
      slideCount: outlineData.slides ? outlineData.slides.length : (outlineData.originalMeta.slideCount || 0)
    }
    : {
      topic: outlineData.meta?.topic || outlineData.topic || '',
      tone: outlineData.meta?.tone || outlineData.tone || 'professional',
      slideCount: outlineData.slides ? outlineData.slides.length : 0,
      mediaStyle: outlineData.meta?.mediaStyle || outlineData.mediaStyle || 'no-media',
      theme: outlineData.meta?.theme || {
        name: 'Default',
        slideBackground: '#ffffff',
        titleColor: '#000000',
        bodyColor: '#333333',
        accentColor: '#3b82f6'
      }
    };


  // Transform slides to backend format
  // Backend expects content as: string (paragraph), array (bullets), or object (comparison)
  const slides = outlineData.slides.map(slide => {
    let content = slide.content;

    // Normalize contentType to match backend enum: 'paragraph', 'bullets', 'comparison'
    let contentType = slide.contentType || 'paragraph';

    // Map invalid values to valid enum values
    if (contentType === 'list') {
      contentType = 'bullets';
    } else if (!['paragraph', 'bullets', 'comparison'].includes(contentType)) {
      // If contentType is invalid, try to infer from content structure
      if (Array.isArray(slide.content) || (slide.bullets && slide.content.mode === 'bullets')) {
        contentType = 'bullets';
      } else if (slide.content && slide.content.mode === 'comparison') {
        contentType = 'comparison';
      } else {
        contentType = 'paragraph'; // Default fallback
      }
    }

    // Convert content from frontend format to backend format
    if (slide.content && typeof slide.content === 'object' && slide.content !== null) {
      if (slide.content.mode === 'raw') {
        const rawText = slide.content.rawText || '';
        // Parse based on contentType
        if (contentType === 'bullets') {
          // Parse bullet points from raw text (lines starting with • or -)
          content = rawText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => line.replace(/^[•\-\*]\s*/, '')) // Remove bullet markers
            .filter(line => line.length > 0);
          // If no bullets found, treat as single item
          if (content.length === 0 && rawText.trim()) {
            content = [rawText.trim()];
          }
        } else if (contentType === 'comparison') {
          // Try to parse comparison format (Left: ... Right: ...)
          const leftMatch = rawText.match(/Left:\s*([\s\S]*?)(?:\n\s*Right:|$)/i);
          const rightMatch = rawText.match(/Right:\s*([\s\S]*?)$/i);
          const leftText = leftMatch ? leftMatch[1].trim() : '';
          const rightText = rightMatch ? rightMatch[1].trim() : '';

          content = {
            left: leftText ? leftText.split('\n').map(l => l.replace(/^[•\-\*]\s*/, '').trim()).filter(l => l) : [],
            right: rightText ? rightText.split('\n').map(l => l.replace(/^[•\-\*]\s*/, '').trim()).filter(l => l) : []
          };
        } else {
          // For paragraph, use raw text as string
          content = rawText;
        }
      } else if (slide.content.mode === 'bullets' && Array.isArray(slide.content.bullets)) {
        content = slide.content.bullets;
      } else if (slide.content.mode === 'comparison') {
        content = {
          left: Array.isArray(slide.content.left) ? slide.content.left : [],
          right: Array.isArray(slide.content.right) ? slide.content.right : []
        };
      } else if (Array.isArray(slide.content)) {
        content = slide.content;
      } else {
        // Fallback: convert to string
        content = String(slide.content);
      }
    } else if (typeof slide.content === 'string') {
      // If content is already a string, use it as-is for paragraph
      // For bullets/comparison, backend GPT will handle expansion
      content = slide.content;
    } else if (Array.isArray(slide.content)) {
      content = slide.content;
    } else {
      content = String(slide.content || '');
    }

    return {
      slideNo: slide.slideNo || 1,
      title: slide.title || '',
      layout: slide.layout || 'content',
      contentType: contentType,
      content: content
    };
  });

  // Validate required fields
  if (!meta.topic || meta.topic.trim() === '') {
    throw new Error('Topic is required to finalize presentation');
  }

  if (slides.length === 0) {
    throw new Error('At least one slide is required to finalize presentation');
  }

  const requestBody = {
    meta: meta,
    slides: slides
  };

  console.log('Finalizing presentation with:', {
    meta: meta,
    slideCount: slides.length,
    firstSlide: slides[0]
  });

  const response = await fetch(`${API_BASE_URL}/finalize-ppt`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) { 
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const errorMessage = errorData.details || errorData.error || `Failed to finalize presentation: ${response.status}`;
    console.error('Finalize presentation error:', {
      status: response.status,
      statusText: response.statusText,
      errorData: errorData
    });

    throw new Error(errorMessage);
  }

  const responseData = await response.json();
  console.log('Received response from finalize-ppt:', responseData);
  // Transform backend response to frontend format
  // Backend returns: { success: true, presentationId, data: { meta, slides, ... } }
  // Frontend expects: { success: true, presentationId, meta, slides }
  if (responseData.success && responseData.data) {
    return {
      success: true,
      presentationId: responseData.presentationId,
      meta: responseData.data.meta,
      // title: responseData.data.title || responseData.data.meta?.topic || '',
      slides: responseData.data.data.slides
    };
  }

  return responseData;
};

