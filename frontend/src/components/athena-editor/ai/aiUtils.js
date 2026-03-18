/**
 * aiUtils.js — Athena Editor AI utilities
 *
 * Architecture
 * ────────────
 * All public functions funnel through two internal primitives:
 *
 *   _request(endpoint, body, opts)      – non-streaming POST, with retry
 *   _stream(endpoint, body, onChunk, signal) – SSE streaming POST
 *
 * Both share:
 *   • Environment-aware base URL        (CFG-2)
 *   • Per-request AbortController timeout (ARCH-2)
 *   • Retry on retryable status codes   (ARCH-5)
 *   • AbortError awareness              (ERR-4)
 *   • Uniform JSON / non-JSON response parsing (ARCH-3)
 *   • Correct SSE event framing         (SSE-1, SSE-2, SSE-4)
 *   • In-flight deduplication cache     (ARCH-6)
 */

import { toast } from 'sonner';

// ─── Configuration ─────────────────────────────────────────────────────────

/**
 * Resolve the API base URL from the build environment.
 * Vite:  set VITE_AI_API_URL in .env.*
 * CRA:   set REACT_APP_AI_API_URL in .env.*
 * Falls back to localhost for local development.
 */
const API_BASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_API_URL) ||
  (typeof process   !== 'undefined' && process.env?.REACT_APP_AI_API_URL)  ||
  'http://localhost:5000/api/ai'
).replace(/\/$/, ''); // strip trailing slash

/** Default temperatures per operation type — single source of truth */
const TEMPERATURE = {
  creative:   0.9,   // brainstorming, tone shifts
  default:    0.7,   // rewrite, expand, paraphrase, code
  balanced:   0.5,   // readability, summarise
  precise:    0.2,   // translate, grammar fix
};

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 30_000;

/** Maximum retry attempts for retryable errors */
const MAX_RETRIES = 2;

/** HTTP status codes that are safe to retry */
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

// ─── In-flight deduplication ───────────────────────────────────────────────
// Prevents identical non-streaming requests from being fired in parallel.
// Subsequent callers sharing the same cache key await the first promise.
const _inflight = new Map();

// ─── Internal helpers ──────────────────────────────────────────────────────

/**
 * Parse a response body safely regardless of Content-Type.
 * Returns the parsed JSON object, or throws a descriptive error.
 */
async function _parseResponse(response, endpoint) {
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const preview = (await response.text()).slice(0, 200);
    console.error(`[aiUtils] Non-JSON response from /${endpoint}:`, preview);
    const label =
      response.status === 404 ? `API endpoint not found: /api/ai/${endpoint}` :
      response.status === 401 ? 'Unauthorized — check your API key'           :
      response.status === 403 ? 'Forbidden — insufficient permissions'         :
      `Unexpected response format (HTTP ${response.status})`;
    throw new AiApiError(label, response.status, false);
  }
  return response.json();
}

/**
 * Typed error so callers can distinguish AI errors from generic JS errors.
 */
class AiApiError extends Error {
  /**
   * @param {string}  message
   * @param {number}  status     HTTP status code
   * @param {boolean} retryable  Whether the request may be retried
   */
  constructor(message, status = 0, retryable = false) {
    super(message);
    this.name      = 'AiApiError';
    this.status    = status;
    this.retryable = retryable;
  }
}

/**
 * Validate that a text/prompt argument is usable before hitting the network.
 * @param {string} value
 * @param {string} label  shown in error messages
 */
function _validate(value, label = 'input') {
  if (!value || typeof value !== 'string' || !value.trim()) {
    throw new AiApiError(`${label} must be a non-empty string`, 400, false);
  }
}

/**
 * Core non-streaming POST with retry, timeout, and deduplication.
 *
 * @param {string}  endpoint  Path segment after /api/ai/
 * @param {object}  body      JSON-serialisable request body
 * @param {object}  [opts]
 * @param {AbortSignal} [opts.signal]   External cancellation signal
 * @param {boolean}     [opts.dedupe]  Enable in-flight dedup (default true)
 * @returns {Promise<any>}  Parsed `data.result` from the server
 */
async function _request(endpoint, body, opts = {}) {
  const { signal: externalSignal, dedupe = true } = opts;

  // Deduplicate concurrent identical requests
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
    // Per-request timeout + optional external signal
    const timeoutCtrl = new AbortController();
    const timeoutId   = setTimeout(() => timeoutCtrl.abort(), REQUEST_TIMEOUT_MS);
    const signal      = externalSignal
      ? _combineSignals(externalSignal, timeoutCtrl.signal)
      : timeoutCtrl.signal;

    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
        signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const isRetryable = RETRYABLE_STATUSES.has(response.status);
        if (isRetryable && attempt < MAX_RETRIES) {
          attempt++;
          const delay = 300 * 2 ** (attempt - 1); // 300 ms, 600 ms
          await _sleep(delay);
          continue;
        }
        const data = await _parseResponse(response, endpoint);
        throw new AiApiError(data.error || `HTTP ${response.status}`, response.status, isRetryable);
      }

      const data = await _parseResponse(response, endpoint);
      return data.result;
    } catch (err) {
      clearTimeout(timeoutId);
      if (_isAbort(err)) throw err; // let AbortError propagate clean
      if (err instanceof AiApiError) throw err;
      // Network error (no response) — retry if attempts remain
      if (attempt < MAX_RETRIES) {
        attempt++;
        await _sleep(300 * 2 ** (attempt - 1));
        continue;
      }
      throw new AiApiError(err.message || 'Network error', 0, false);
    }
  }
}

/**
 * Core SSE streaming POST.
 * Correctly handles multi-byte characters, partial SSE frames, and [DONE].
 *
 * @param {string}    endpoint
 * @param {object}    body
 * @param {function}  onChunk   Called with (accumulatedText, latestChunk)
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>}  Full accumulated text
 */
async function _stream(endpoint, body, onChunk, signal) {
  const timeoutCtrl = new AbortController();
  const timeoutId   = setTimeout(() => timeoutCtrl.abort(), REQUEST_TIMEOUT_MS);
  const merged      = signal
    ? _combineSignals(signal, timeoutCtrl.signal)
    : timeoutCtrl.signal;

  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
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
    // Pass { stream: true } so the decoder holds incomplete multi-byte sequences
    // across chunk boundaries — fixes corrupt UTF-8 for CJK / emoji (SSE-4)
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let   fullText = '';
    let   buffer   = '';      // holds partial SSE frames across network chunks (SSE-1)

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode with stream:true to preserve incomplete multi-byte sequences
      buffer += decoder.decode(value, { stream: true });

      // Split on SSE line endings: \r\n, \r, or \n
      const lines = buffer.split(/\r\n|\r|\n/);
      // Last element may be incomplete — keep it in the buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') continue; // don't break — flush remaining lines (SSE-2)

        let parsed;
        try {
          parsed = JSON.parse(payload);
        } catch {
          // Skip malformed events — log once in debug but don't throw (SSE-3)
          console.debug('[aiUtils] Skipping unparseable SSE event:', payload.slice(0, 80));
          continue;
        }

        if (parsed.error) throw new AiApiError(parsed.error, 0, false);
        if (parsed.content) {
          fullText += parsed.content;
          onChunk?.(fullText, parsed.content);
        }
      }
    }

    // Flush any remaining bytes from the decoder
    const tail = decoder.decode();
    if (tail) {
      buffer += tail;
      // Process any trailing events
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

/** Merge two AbortSignals — aborts when either fires. */
function _combineSignals(...signals) {
  const ctrl = new AbortController();
  for (const s of signals) {
    if (s?.aborted) { ctrl.abort(s.reason); break; }
    s?.addEventListener('abort', () => ctrl.abort(s.reason), { once: true });
  }
  return ctrl.signal;
}

/** Return true if an error represents a user-initiated or timeout abort. */
function _isAbort(err) {
  return err?.name === 'AbortError' || err?.code === 20;
}

/** Promise-based sleep. */
const _sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Strip fenced code-block markers from AI-generated code.
 * Handles multiple blocks and trailing backticks (CODE-1).
 */
function _stripCodeFences(text) {
  return text
    .replace(/^```[a-zA-Z]*\r?\n/gm, '')
    .replace(/^```\s*$/gm, '')
    .trim();
}

/**
 * Unified public API call entry-point.
 * Routes to _stream or _request depending on whether onChunk is provided.
 * Handles AbortError silently and surfaces other errors via toast.
 *
 * @param {string}   endpoint
 * @param {object}   body
 * @param {object}   opts
 * @param {function} [opts.onChunk]
 * @param {AbortSignal} [opts.signal]
 * @param {boolean}  [opts.silent]   Suppress toast on error
 * @param {any}      [opts.fallback] Return value on error (default null)
 * @returns {Promise<string|null>}
 */
async function _call(endpoint, body, opts = {}) {
  const { onChunk, signal, silent = false, fallback = null } = opts;
  try {
    if (onChunk) {
      return await _stream(endpoint, body, onChunk, signal);
    }
    return await _request(endpoint, body, { signal });
  } catch (err) {
    if (_isAbort(err)) return fallback; // user cancelled — no toast
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

// ─── Public streaming helper (for direct use where full control is needed) ──

/**
 * Low-level streaming call — exported for consumers that manage their own
 * error handling (e.g. AIAssistant.jsx).
 *
 * @param {string}    endpoint
 * @param {object}    body
 * @param {function}  onChunk  (accumulatedText: string, delta: string) => void
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>}
 * @throws {AiApiError | AbortError}
 */
export const callAIStreamAPI = (endpoint, body, onChunk, signal) =>
  _stream(endpoint, body, onChunk, signal);

// ─── Document generation ───────────────────────────────────────────────────

/**
 * Generate a full document.
 *
 * @param {object}   params
 * @param {string}   params.topic
 * @param {number}   [params.pages=1]
 * @param {string}   [params.tone='professional']
 * @param {string}   [params.type='article']
 * @param {number}   [params.temperature]
 * @param {string}   [params.audience]        Optional target audience hint
 * @param {string[]} [params.keyPoints]        Optional must-cover bullet points
 * @param {function} [onChunk]
 * @param {object}   [options]
 */
export const generateDocument = async (params, onChunk, options = {}) => {
  const {
    topic,
    pages        = 1,
    tone         = 'professional',
    type         = 'article',
    temperature  = TEMPERATURE.default,
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

  const result = await _call(
    onChunk ? 'chat' : 'generate',
    onChunk
      ? { messages: [{ role: 'user', content: prompt }], temperature }
      : { prompt, temperature },
    { onChunk, signal: options.signal, fallback: '# Generation failed\nPlease try again.' },
  );
  return result;
};

// ─── Image generation ──────────────────────────────────────────────────────

/**
 * Generate an image via the AI backend.
 *
 * @param {string} prompt
 * @param {object} [options]  Extra options forwarded to the backend (size, style, etc.)
 * @returns {Promise<string|null>}  URL or base64 data URL, or null on failure
 */
export const generateAIImage = async (prompt, options = {}) => {
  _validate(prompt, 'image prompt');
  const { signal, ...rest } = options;
  return _call('image-generate', { prompt, ...rest }, { signal, fallback: null });
};

// ─── Text transformation helpers ──────────────────────────────────────────
// All share the same signature:  (text, options?) → Promise<string>
// options: { temperature?, onChunk?, signal? }
// On error the original text is returned so the editor content is never lost.

/**
 * Internal wrapper — transforms text via the /transform endpoint.
 * Returns the original text on failure so the editor is never left empty.
 */
const _transform = async (action, text, temperature, options = {}) => {
  _validate(text, 'text');
  const { onChunk, signal } = options;
  const result = await _call(
    'transform',
    { action, text, temperature },
    { onChunk, signal, fallback: text }, // return original on error
  );
  return result ?? text;
};

/** Enhance / rewrite text for clarity and impact. */
export const rewriteText = (text, options = {}) =>
  _transform('enhance', text, options.temperature ?? TEMPERATURE.default, options);

/** Expand text with more detail and depth. */
export const expandText = (text, options = {}) =>
  _transform('expand', text, options.temperature ?? TEMPERATURE.default, options);

/** Condense text to its essential points. */
export const summarizeText = (text, options = {}) =>
  _transform('summarize', text, options.temperature ?? TEMPERATURE.balanced, options);

/**
 * Rewrite text in a different tone.
 * @param {string} text
 * @param {string} [tone='professional']
 * @param {object} [options]
 */
export const changeTone = (text, tone = 'professional', options = {}) =>
  _transform(
    `Rewrite the following text with a ${tone} tone. Preserve all meaning and information. Output ONLY the rewritten text:`,
    text,
    options.temperature ?? TEMPERATURE.creative,
    options,
  );

/** Fix grammar, spelling, and punctuation. */
export const fixGrammar = (text, options = {}) =>
  _transform('grammar_fix', text, options.temperature ?? TEMPERATURE.precise, options);

/** Convert bullet points into a cohesive paragraph. */
export const bulletToParagraph = (text, options = {}) =>
  _transform(
    'Convert these bullet points into a cohesive, flowing paragraph. Add transitional phrasing where appropriate. Output ONLY the paragraph:',
    text,
    options.temperature ?? TEMPERATURE.default,
    options,
  );

/**
 * Translate text to another language.
 * @param {string} text
 * @param {string} [language='Spanish']
 * @param {object} [options]
 */
export const translateText = (text, language = 'Spanish', options = {}) =>
  _transform(
    `Translate the following text to ${language}. Preserve the original meaning, tone, and format. Output ONLY the translated text:`,
    text,
    options.temperature ?? TEMPERATURE.precise,
    options,
  );

/** Paraphrase text using different words and sentence structure. */
export const paraphraseText = (text, options = {}) =>
  _transform(
    'Paraphrase the following text using completely different words and sentence structures while perfectly preserving the original meaning. Output ONLY the paraphrased text:',
    text,
    options.temperature ?? TEMPERATURE.default,
    options,
  );

/** Improve clarity, flow, and readability. */
export const improveReadability = (text, options = {}) =>
  _transform(
    'Improve the readability of the following text. Make it clearer, easier to understand, and better organized. Fix awkward phrasing and improve flow. Output ONLY the improved text:',
    text,
    options.temperature ?? TEMPERATURE.balanced,
    options,
  );

/** Make text more concise without losing meaning. */
export const makeConcise = (text, options = {}) =>
  _transform(
    'Make the following text more concise. Remove all redundancy and filler words while preserving every key idea. Output ONLY the concise version:',
    text,
    options.temperature ?? TEMPERATURE.balanced,
    options,
  );

/** Make text more professional and business-appropriate. */
export const makeProfessional = (text, options = {}) =>
  _transform(
    'Rewrite the following text in a polished, professional tone suitable for business communication. Remove informal language. Output ONLY the professional version:',
    text,
    options.temperature ?? TEMPERATURE.balanced,
    options,
  );

/** Simplify text for a broader audience. */
export const simplifyText = (text, options = {}) =>
  _transform(
    'Rewrite the following text using simpler vocabulary, shorter sentences, and a more approachable style. Remove jargon. Preserve all meaning. Output ONLY the simplified text:',
    text,
    options.temperature ?? TEMPERATURE.balanced,
    options,
  );

// ─── Code utilities ────────────────────────────────────────────────────────

/**
 * Internal helper for all code-related calls.
 * Strips fenced code blocks from the response.
 */
const _codeCall = async (prompt, temperature, options = {}) => {
  _validate(prompt, 'code prompt');
  const { onChunk, signal } = options;
  const result = await _call(
    onChunk ? 'generate' : 'generate',
    { prompt, temperature },
    { onChunk, signal, fallback: null },
  );
  return result ? _stripCodeFences(result) : null;
};

/**
 * Generate code from a natural-language description.
 * @param {string} description
 * @param {string} [language='javascript']
 * @param {object} [options]
 */
export const generateCode = async (description, language = 'javascript', options = {}) => {
  _validate(description, 'description');
  const prompt =
    `Write ${language} code for the following requirement: "${description}".` +
    `\nOutput ONLY the code enclosed in a single markdown code block. No explanation.`;
  const result = await _codeCall(prompt, options.temperature ?? TEMPERATURE.default, options);
  return result ?? `// Error generating code for: ${description}`;
};

/**
 * Explain what a piece of code does.
 * @param {string} code
 * @param {string} [language='javascript']
 * @param {object} [options]
 */
export const explainCode = async (code, language = 'javascript', options = {}) => {
  _validate(code, 'code');
  const { onChunk, signal } = options;
  const prompt = `Explain the following ${language} code clearly and concisely:\n\n${code}`;
  const result = await _call(
    'generate',
    { prompt, temperature: options.temperature ?? TEMPERATURE.default },
    { onChunk, signal, fallback: 'Explanation could not be generated.' },
  );
  return result ?? 'Explanation could not be generated.';
};

/**
 * Refactor code to be cleaner and follow best practices.
 * @param {string} code
 * @param {string} [language='javascript']
 * @param {object} [options]
 */
export const refactorCode = async (code, language = 'javascript', options = {}) => {
  _validate(code, 'code');
  const prompt =
    `Refactor the following ${language} code to be cleaner, more efficient, and follow best practices.` +
    `\nOutput ONLY the refactored code in a single markdown code block. No explanation.\n\n${code}`;
  const result = await _codeCall(prompt, options.temperature ?? TEMPERATURE.default, options);
  return result ?? code;
};

/**
 * Add inline comments and docblocks to code.
 * @param {string} code
 * @param {string} [language='javascript']
 * @param {object} [options]
 */
export const addComments = async (code, language = 'javascript', options = {}) => {
  _validate(code, 'code');
  const prompt =
    `Add clear, helpful inline comments and docblocks to the following ${language} code.` +
    `\nDo NOT change the logic in any way.` +
    `\nOutput ONLY the commented code in a single markdown code block.\n\n${code}`;
  const result = await _codeCall(prompt, options.temperature ?? TEMPERATURE.default, options);
  return result ?? code;
};

/**
 * Find and explain potential bugs in code.
 * @param {string} code
 * @param {string} [language='javascript']
 * @param {object} [options]
 */
export const reviewCode = async (code, language = 'javascript', options = {}) => {
  _validate(code, 'code');
  const { onChunk, signal } = options;
  const prompt =
    `Review the following ${language} code for bugs, security issues, and performance problems.` +
    `\nFor each issue found: describe it, explain why it is a problem, and suggest a fix.` +
    `\nIf the code is correct, say so.\n\n${code}`;
  const result = await _call(
    'generate',
    { prompt, temperature: TEMPERATURE.precise },
    { onChunk, signal, fallback: 'Code review could not be completed.' },
  );
  return result ?? 'Code review could not be completed.';
};

// ─── Chat ──────────────────────────────────────────────────────────────────

/**
 * Send a multi-turn chat message to the AI.
 *
 * @param {Array<{role:'user'|'assistant', content:string}>} messages
 * @param {object} [options]
 * @param {string} [options.systemPrompt]
 * @param {number} [options.temperature]
 * @param {function} [options.onChunk]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<string|null>}
 */
export const chatWithAI = async (messages, options = {}) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new AiApiError('messages must be a non-empty array', 400, false);
  }
  const {
    systemPrompt,
    temperature = TEMPERATURE.default,
    onChunk,
    signal,
  } = options;

  const body = {
    messages: systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages,
    temperature,
  };

  return _call('chat', body, { onChunk, signal, fallback: null });
};

// ─── Exports for testing / advanced consumers ──────────────────────────────
export { AiApiError, TEMPERATURE };