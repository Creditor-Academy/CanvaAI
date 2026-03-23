/**
 * aiUtils.js — Athena Editor AI utilities (Simplified)
 */

import { toast } from 'sonner';

// ─── Configuration ─────────────────────────────────────────────────────────

const API_BASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_API_URL) ||
  (typeof process   !== 'undefined' && process.env?.REACT_APP_AI_API_URL)  ||
  'http://localhost:5000/api/text-editor/ai'
).replace(/\/$/, '');

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

// ─── In-flight deduplication ───────────────────────────────────────────────
const _inflight = new Map();

// ─── Internal helpers ──────────────────────────────────────────────────────

async function _parseResponse(response, endpoint) {
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const preview = (await response.text()).slice(0, 200);
    console.error(`[aiUtils] Non-JSON response from /${endpoint}:`, preview);
    const label =
      response.status === 404 ? `API endpoint not found: /api/text-editor/ai/${endpoint}` :
      response.status === 401 ? 'Unauthorized — check your API key'                   :
      response.status === 403 ? 'Forbidden — insufficient permissions'                 :
      `Unexpected response format (HTTP ${response.status})`;
    throw new AiApiError(label, response.status, false);
  }
  return response.json();
}

class AiApiError extends Error {
  constructor(message, status = 0, retryable = false) {
    super(message);
    this.name      = 'AiApiError';
    this.status    = status;
    this.retryable = retryable;
  }
}

function _validate(value, label = 'input') {
  if (!value || typeof value !== 'string' || !value.trim()) {
    throw new AiApiError(`${label} must be a non-empty string`, 400, false);
  }
}

async function _request(endpoint, body, opts = {}) {
  const { signal: externalSignal, dedupe = true } = opts;

  if (dedupe) {
    const key = `${endpoint}:${JSON.stringify(body)}`;
    if (_inflight.has(key)) return _inflight.get(key);
    const promise = _request(endpoint, body, { ...opts, dedupe: false });
    _inflight.set(key, promise);
    promise.finally(() => _inflight.delete(key));
    return promise;
  }

  let attempt = 0;
  while (true) {
    const timeoutCtrl = new AbortController();
    const timeoutId   = setTimeout(() => timeoutCtrl.abort(), REQUEST_TIMEOUT_MS);
    const signal      = externalSignal
      ? _combineSignals(externalSignal, timeoutCtrl.signal)
      : timeoutCtrl.signal;

    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method:  'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body:    JSON.stringify(body),
        signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const isRetryable = RETRYABLE_STATUSES.has(response.status);
        if (isRetryable && attempt < MAX_RETRIES) {
          attempt++;
          await _sleep(300 * 2 ** (attempt - 1));
          continue;
        }
        const data = await _parseResponse(response, endpoint);
        throw new AiApiError(data.error || `HTTP ${response.status}`, response.status, isRetryable);
      }

      const data = await _parseResponse(response, endpoint);
      // Support both data.result and data.text (legacy/new formats)
      return data.result || data.text || data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (_isAbort(err)) throw err;
      if (err instanceof AiApiError) throw err;
      if (attempt < MAX_RETRIES) {
        attempt++;
        await _sleep(300 * 2 ** (attempt - 1));
        continue;
      }
      throw new AiApiError(err.message || 'Network error', 0, false);
    }
  }
}

async function _stream(endpoint, body, onChunk, signal) {
  const timeoutCtrl = new AbortController();
  const timeoutId   = setTimeout(() => timeoutCtrl.abort(), REQUEST_TIMEOUT_MS);
  const merged      = signal
    ? _combineSignals(signal, timeoutCtrl.signal)
    : timeoutCtrl.signal;

  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method:  'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body:    JSON.stringify({ ...body, stream: true }),
      signal:  merged,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const data = await _parseResponse(response, endpoint);
      throw new AiApiError(data.error || `HTTP ${response.status}`, response.status,
                            RETRYABLE_STATUSES.has(response.status));
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let   fullText = '';
    let   buffer   = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r\n|\r|\n/);
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') continue;

        let parsed;
        try { parsed = JSON.parse(payload); } catch { continue; }

        if (parsed.error) throw new AiApiError(parsed.error, 0, false);
        if (parsed.content) {
          fullText += parsed.content;
          onChunk?.(fullText, parsed.content);
        }
      }
    }

    const tail = decoder.decode();
    if (tail) {
      buffer += tail;
      for (const line of buffer.split(/\r\n|\r|\n/)) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]' || !payload) continue;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.content) {
            fullText += parsed.content;
            onChunk?.(fullText, parsed.content);
          }
        } catch { /* ignore */ }
      }
    }

    return fullText;
  } catch (err) {
    clearTimeout(timeoutId);
    if (_isAbort(err)) throw err;
    if (err instanceof AiApiError) throw err;
    throw new AiApiError(err.message || 'Stream failed', 0, false);
  }
}

function _combineSignals(...signals) {
  const ctrl = new AbortController();
  for (const s of signals) {
    if (s?.aborted) { ctrl.abort(s.reason); break; }
    s?.addEventListener('abort', () => ctrl.abort(s.reason), { once: true });
  }
  return ctrl.signal;
}

function _isAbort(err) {
  return err?.name === 'AbortError' || err?.code === 20;
}

const _sleep = (ms) => new Promise(r => setTimeout(r, ms));

function _stripCodeFences(text) {
  return text
    .replace(/^```[a-zA-Z]*\r?\n/gm, '')
    .replace(/^```\s*$/gm, '')
    .trim();
}

async function _call(endpoint, body, opts = {}) {
  const { onChunk, signal, silent = false, fallback = null } = opts;
  try {
    if (onChunk) {
      return await _stream(endpoint, body, onChunk, signal);
    }
    return await _request(endpoint, body, { signal });
  } catch (err) {
    if (_isAbort(err)) return fallback;
    console.error(`[aiUtils] /${endpoint} error:`, err);
    if (!silent) {
      const msg =
        err.status === 401 ? 'AI service: authentication failed. Check your API key.' :
        err.status === 429 ? 'AI service: rate limit reached. Please wait a moment.'  :
        err.message || 'AI request failed';
      toast.error(msg);
    }
    return fallback;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

export const callAIStreamAPI = (endpoint, body, onChunk, signal) =>
  _stream(endpoint, body, onChunk, signal);

/** Generate a full document. */
export const generateDocument = async (params, onChunk, options = {}) => {
  const {
    topic,
    pages        = 1,
    tone         = 'professional',
    type         = 'article',
    audience     = '',
    keyPoints    = [],
  } = params;

  _validate(topic, 'topic');

  const audienceLine  = audience   ? `\nTarget audience: ${audience}.`        : '';
  const keyPointsLine = keyPoints.length
    ? `\nYou MUST cover these points:\n${keyPoints.map(p => `- ${p}`).join('\n')}`
    : '';

  const prompt =
    `You are an expert ${type} writer. Write a complete, well-structured ${tone} ${type} about: "${topic}".` +
    `${audienceLine}${keyPointsLine}` +
    `\nLength: approximately ${pages} page${pages > 1 ? 's' : ''} (~${pages * 380} words).` +
    `\nUse proper Markdown: headings (##, ###), paragraphs, bullet lists where appropriate.` +
    `\nStructure: Introduction → Main Content → Conclusion.` +
    `\nOutput ONLY the document content — no preamble, no "Here is your document:" prefix.`;

  return await _call(
    onChunk ? 'chat' : 'generate',
    onChunk
      ? { messages: [{ role: 'user', content: prompt }] }
      : { prompt },
    { onChunk, signal: options.signal, fallback: '# Generation failed\nPlease try again.' },
  );
};

/** Generate an image. */
export const generateAIImage = async (prompt, options = {}) => {
  _validate(prompt, 'image prompt');
  const { signal, ...rest } = options;
  return _call('image-generate', { prompt, ...rest }, { signal, fallback: null });
};

// ─── Text transformation helpers ──────────────────────────────────────────

const _transform = async (action, text, options = {}) => {
  _validate(text, 'text');
  const { onChunk, signal } = options;
  const result = await _call(
    'transform',
    { action, text },
    { onChunk, signal, fallback: text },
  );
  return result ?? text;
};

export const rewriteText = (text, options = {}) => _transform('enhance', text, options);
export const expandText = (text, options = {}) => _transform('expand', text, options);
export const summarizeText = (text, options = {}) => _transform('summarize', text, options);
export const changeTone = (text, tone = 'professional', options = {}) =>
  _transform(
    `Rewrite the following text with a ${tone} tone. Preserve all meaning and information. Output ONLY the rewritten text:`,
    text,
    options,
  );
export const fixGrammar = (text, options = {}) => _transform('grammar_fix', text, options);
export const bulletToParagraph = (text, options = {}) =>
  _transform(
    'Convert these bullet points into a cohesive, flowing paragraph. Add transitional phrasing where appropriate. Output ONLY the paragraph:',
    text,
    options,
  );
export const translateText = (text, language = 'Spanish', options = {}) =>
  _transform(
    `Translate the following text to ${language}. Preserve the original meaning, tone, and format. Output ONLY the translated text:`,
    text,
    options,
  );
export const paraphraseText = (text, options = {}) =>
  _transform(
    'Paraphrase the following text using completely different words and sentence structures while perfectly preserving the original meaning. Output ONLY the paraphrased text:',
    text,
    options,
  );
export const improveReadability = (text, options = {}) =>
  _transform(
    'Improve the readability of the following text. Make it clearer, easier to understand, and better organized. Fix awkward phrasing and improve flow. Output ONLY the improved text:',
    text,
    options,
  );
export const makeConcise = (text, options = {}) =>
  _transform(
    'Make the following text more concise. Remove all redundancy and filler words while preserving every key idea. Output ONLY the concise version:',
    text,
    options,
  );
export const makeProfessional = (text, options = {}) =>
  _transform(
    'Rewrite the following text in a polished, professional tone suitable for business communication. Remove informal language. Output ONLY the professional version:',
    text,
    options,
  );
export const simplifyText = (text, options = {}) =>
  _transform(
    'Rewrite the following text using simpler vocabulary, shorter sentences, and a more approachable style. Remove jargon. Preserve all meaning. Output ONLY the simplified text:',
    text,
    options,
  );

// ─── Code utilities ────────────────────────────────────────────────────────

const _codeCall = async (prompt, options = {}) => {
  _validate(prompt, 'code prompt');
  const { onChunk, signal } = options;
  const result = await _call(
    'generate',
    { prompt },
    { onChunk, signal, fallback: null },
  );
  return result ? _stripCodeFences(result) : null;
};

export const generateCode = async (description, language = 'javascript', options = {}) => {
  _validate(description, 'description');
  const prompt =
    `Write ${language} code for the following requirement: "${description}".` +
    `\nOutput ONLY the code enclosed in a single markdown code block. No explanation.`;
  const result = await _codeCall(prompt, options);
  return result ?? `// Error generating code for: ${description}`;
};

export const explainCode = async (code, language = 'javascript', options = {}) => {
  _validate(code, 'code');
  const { onChunk, signal } = options;
  const prompt = `Explain the following ${language} code clearly and concisely:\n\n${code}`;
  const result = await _call(
    'generate',
    { prompt },
    { onChunk, signal, fallback: 'Explanation could not be generated.' },
  );
  return result ?? 'Explanation could not be generated.';
};

export const refactorCode = async (code, language = 'javascript', options = {}) => {
  _validate(code, 'code');
  const prompt =
    `Refactor the following ${language} code to be cleaner, more efficient, and follow best practices.` +
    `\nOutput ONLY the refactored code in a single markdown code block. No explanation.\n\n${code}`;
  const result = await _codeCall(prompt, options);
  return result ?? code;
};

export const addComments = async (code, language = 'javascript', options = {}) => {
  _validate(code, 'code');
  const prompt =
    `Add clear, helpful inline comments and docblocks to the following ${language} code.` +
    `\nDo NOT change the logic in any way.` +
    `\nOutput ONLY the commented code in a single markdown code block.\n\n${code}`;
  const result = await _codeCall(prompt, options);
  return result ?? code;
};

export const reviewCode = async (code, language = 'javascript', options = {}) => {
  _validate(code, 'code');
  const { onChunk, signal } = options;
  const prompt =
    `Review the following ${language} code for bugs, security issues, and performance problems.` +
    `\nFor each issue found: describe it, explain why it is a problem, and suggest a fix.` +
    `\nIf the code is correct, say so.\n\n${code}`;
  const result = await _call(
    'generate',
    { prompt },
    { onChunk, signal, fallback: 'Code review could not be completed.' },
  );
  return result ?? 'Code review could not be completed.';
};

// ─── Chat ──────────────────────────────────────────────────────────────────

export const chatWithAI = async (messages, options = {}) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new AiApiError('messages must be a non-empty array', 400, false);
  }
  const { systemPrompt, onChunk, signal } = options;

  const body = {
    messages: systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages,
  };

  return _call('chat', body, { onChunk, signal, fallback: null });
};

export { AiApiError };