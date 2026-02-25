import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:5000/api/ai';

// Helper for streaming API calls
export const callAIStreamAPI = async (endpoint, body, onChunk) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, stream: true })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Connection failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullText += parsed.content;
              if (onChunk) onChunk(fullText, parsed.content);
            }
            if (parsed.error) throw new Error(parsed.error);
          } catch (e) {
            console.error("Error parsing stream chunk", e);
          }
        }
      }
    }
    return fullText;
  } catch (error) {
    console.error("AI Stream Error:", error);
    toast.error(error.message || "Streaming failed");
    throw error;
  }
};

// Helper to make API calls to your newly integrated OpenAI Backend
const callAIGenerateAPI = async (prompt, temperature = 0.7) => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, temperature })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Server Error');
    return data.result;
  } catch (error) {
    console.error("AI Generation Error:", error);
    toast.error("AI Generation Failed.");
    return null;
  }
};

const callAITransformAPI = async (action, text, temperature = 0.7, onChunk) => {
  if (onChunk) {
    return await callAIStreamAPI('transform', { action, text, temperature }, onChunk);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/transform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, text, temperature })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Server Error');
    return data.result;
  } catch (error) {
    console.error("AI Transformation Error:", error);
    return text;
  }
};

export const generateAIImage = async (prompt, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/image-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, ...options })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Image Generation Failed');
    return data.result;
  } catch (error) {
    console.error("AI Image Error:", error);
    toast.error("Failed to generate image.");
    return null;
  }
};

export const generateDocument = async (params, onChunk) => {
  const { topic, pages, tone, type, temperature = 0.7 } = params;
  const prompt = `Write a comprehensive ${tone} ${type} about "${topic}". Provide enough content to fill approximately ${pages} page(s). Use proper Markdown formatting including headings, bullet points, and paragraphs. Make sure there is an Introduction, Main Content, and Conclusion.`;

  if (onChunk) {
    return await callAIStreamAPI('chat', { messages: [{ role: 'user', content: prompt }], temperature }, onChunk);
  }

  const result = await callAIGenerateAPI(prompt, temperature);
  return result || `# Failed to generate document\nPlease check your API key configuration.`;
};

export const rewriteText = async (text, options = {}) => {
  const { temperature = 0.7, onChunk } = options;
  return await callAITransformAPI('enhance', text, temperature, onChunk);
};

export const expandText = async (text, options = {}) => {
  const { temperature = 0.7, onChunk } = options;
  return await callAITransformAPI('expand', text, temperature, onChunk);
};

export const summarizeText = async (text, options = {}) => {
  const { temperature = 0.7, onChunk } = options;
  return await callAITransformAPI('summarize', text, temperature, onChunk);
};

export const changeTone = async (text, tone = 'professional', options = {}) => {
  const { temperature = 0.7, onChunk } = options;
  const customAction = `Rewrite the following text with a ${tone} tone.`;
  return await callAITransformAPI(customAction, text, temperature, onChunk);
};

export const fixGrammar = async (text, options = {}) => {
  const { temperature = 0.7, onChunk } = options;
  return await callAITransformAPI('grammar_fix', text, temperature, onChunk);
};

export const bulletToParagraph = async (text, options = {}) => {
  const { temperature = 0.7, onChunk } = options;
  const customAction = `Convert these bullet points into a cohesive, flowing paragraph. Add transitional phrasing where appropriate.`;
  return await callAITransformAPI(customAction, text, temperature, onChunk);
};

export const generateCode = async (description, language = 'javascript', options = {}) => {
  const { temperature = 0.7, onChunk } = options;
  const prompt = `Write ${language} code for the following requirement: "${description}". Only output the code, enclosed in markdown code blocks.`;

  let result;
  if (onChunk) {
    result = await callAIStreamAPI('generate', { prompt, temperature }, onChunk);
  } else {
    result = await callAIGenerateAPI(prompt, temperature);
  }

  if (!result) return `// Error generating code for ${description}`;

  // Clean markdown blocks if present
  let cleanResult = result.replace(/^```[a-zA-Z]*\n/, '').replace(/```$/, '');
  return cleanResult;
};

export const explainCode = async (code, language = 'javascript', options = {}) => {
  const { temperature = 0.7, onChunk } = options;
  const prompt = `Explain the following ${language} code clearly and concisely:\n\n${code}`;
  if (onChunk) {
    return await callAIStreamAPI('generate', { prompt, temperature }, onChunk);
  }
  const result = await callAIGenerateAPI(prompt, temperature);
  return result || `Explanation could not be generated.`;
};

export const refactorCode = async (code, language = 'javascript', options = {}) => {
  const { temperature = 0.7, onChunk } = options;
  const prompt = `Refactor the following ${language} code to be cleaner, more efficient, and follow best practices. Only output the code, enclosed in markdown code blocks.\n\n${code}`;
  let result;
  if (onChunk) {
    result = await callAIStreamAPI('generate', { prompt, temperature }, onChunk);
  } else {
    result = await callAIGenerateAPI(prompt, temperature);
  }
  if (!result) return code;
  return result.replace(/^```[a-zA-Z]*\n/, '').replace(/```$/, '');
};

export const addComments = async (code, language = 'javascript', options = {}) => {
  const { temperature = 0.7, onChunk } = options;
  const prompt = `Add helpful, inline explanations and docblocks to the following ${language} code. Do not change the logic. Only output the code, enclosed in markdown code blocks.\n\n${code}`;
  let result;
  if (onChunk) {
    result = await callAIStreamAPI('generate', { prompt, temperature }, onChunk);
  } else {
    result = await callAIGenerateAPI(prompt, temperature);
  }
  if (!result) return code;
  return result.replace(/^```[a-zA-Z]*\n/, '').replace(/```$/, '');
};

