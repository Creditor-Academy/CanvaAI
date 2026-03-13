# Athena Editor API Integration Documentation

## Overview

The Athena Editor integrates AI-powered features through a centralized service layer that communicates with external AI APIs. This document provides complete information about all API calls, their parameters, responses, and usage within the editor.

---

## Service Architecture

### Service Layer
**File**: `src/services/Text-Editor/text.service.js`

The service layer abstracts all API communications, providing clean interfaces for:
- Claude AI (Anthropic) - Text generation and transformations
- Pollinations AI - Image generation

### Import in Components
```javascript
import { TextEditorService } from '../../../../services/Text-Editor/text.service.js';
```

---

## API Endpoints

### 1. Claude AI API (Anthropic)

**Base URL**: `https://api.anthropic.com/v1/messages`  
**Model**: `claude-sonnet-4-20250514`  
**Authentication**: API Key (configured in backend)

#### Request Format
```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 4096,
  "temperature": 0.7,
  "stream": true,
  "system": "System instruction here",
  "messages": [
    {
      "role": "user",
      "content": "User prompt here"
    }
  ]
}
```

#### Response Format (Streaming)
```
data: {"delta": {"text": "Generated text chunk"}}
data: [DONE]
```

---

### 2. Pollinations AI API

**Base URL**: `https://image.pollinations.ai/prompt/`  
**Model**: Flux  
**Type**: RESTful GET request (URL-based)

#### Request Format
```
https://image.pollinations.ai/prompt/{encoded_prompt}?width={w}&height={h}&nologo=true&enhance=true&model=flux
```

#### Response
Direct image URL (binary image data)

---

## Service Functions

### 1. `generateDocument()`

Generates complete documents using Claude AI.

**Usage Location**: `AIAssistant.jsx` line 420

#### Parameters
```javascript
{
  topic: string,           // Document topic
  docType: string,         // Type: 'Blog Post', 'Essay', 'Research Paper', etc.
  tone: string,            // Writing tone: 'Professional', 'Casual', etc.
  pages: number,           // Number of pages (1-10)
  creativity: number,      // Creativity level (0-1)
  onChunk: Function,       // Streaming callback
  signal: AbortSignal      // Cancellation signal
}
```

#### Internal Flow
1. Builds system prompt based on docType and tone
2. Calculates target word count: `pages × 380 words`
3. Calls Claude API with streaming
4. Returns HTML-formatted content

#### Example Call
```javascript
await TextEditorService.generateDocument({
  topic: 'The impact of AI on healthcare',
  docType: 'Blog Post',
  tone: 'Professional',
  pages: 3,
  creativity: 0.7,
  onChunk: (fullText) => setGenProgress(fullText),
  signal: abortController.signal
});
```

#### System Prompt Template
```javascript
`You are a professional ${type.toLowerCase()} writer. 
Create a well-structured, engaging ${type.toLowerCase()} with a ${tone} tone. 
Target length: approximately ${pages * 380} words.`
```

#### User Prompt Template
```javascript
`Write a ${docType} about: ${topic.trim()}`
```

---

### 2. `generateImage()`

Generates images using Pollinations AI with optional prompt enhancement via Claude.

**Usage Location**: `AIAssistant.jsx` line 469

#### Parameters
```javascript
{
  prompt: string,          // Image description
  style: string,           // Art style: 'photorealistic', 'digital art', etc.
  size: string,            // Dimensions: '1024x1024', '1792x1024', etc.
  enhancePrompt: boolean,  // Whether to enhance via Claude (default: true)
  signal: AbortSignal      // Cancellation signal
}
```

#### Internal Flow
1. **If enhancePrompt=true**:
   - Calls Claude to enhance the prompt with visual details
   - Uses enhanced prompt for image generation
2. **If enhancePrompt=false**:
   - Uses original prompt with style modifiers
3. Builds Pollinations URL with enhanced prompt
4. Returns image URL and enhanced prompt

#### Example Call
```javascript
const { url, enhancedPrompt } = await TextEditorService.generateImage({
  prompt: 'A serene mountain landscape',
  style: 'photorealistic',
  size: '1024x1024',
  enhancePrompt: true,
  signal: abortController.signal
});
```

#### Prompt Enhancement (Claude)
**System Prompt**:
```
You are an expert at writing detailed AI image generation prompts. 
Take the user's description and expand it into a rich, detailed prompt 
with visual specifics, lighting, composition, mood, and style. 
Return ONLY the prompt text — no quotes, no explanation.
```

**User Prompt**:
```javascript
`Create an image generation prompt for: "${prompt.trim()}". Style: ${style}. Make it detailed and vivid.`
```

#### Fallback Behavior
If enhancement fails:
```javascript
finalPrompt = `${prompt}, ${style}, high quality, detailed`;
```

#### URL Construction
```javascript
const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&nologo=true&enhance=true&model=flux`;
```

#### Return Value
```javascript
{
  url: string,           // Complete image URL
  enhancedPrompt: string // Enhanced/detailed prompt used
}
```

---

### 3. `transformText()`

Transforms existing text using various AI-powered operations.

**Usage Location**: `AIAssistant.jsx` lines 559, 627

#### Parameters
```javascript
{
  text: string,          // Original text to transform
  action: string,        // Transformation type (see below)
  customPrompt: string,  // Custom instruction (for 'custom' action)
  tone: string,          // Target tone (for 'change_tone' action)
  language: string,      // Target language (for 'translate' action)
  creativity: number,    // Creativity level (0-1)
  signal: AbortSignal    // Cancellation signal
}
```

#### Available Actions

| Action | Description | System Prompt |
|--------|-------------|---------------|
| `rewrite` | Improve clarity and flow | "Rewrite this text to improve clarity, flow, and engagement while maintaining the original meaning" |
| `expand` | Add more details | "Expand this text with more details, examples, and depth" |
| `summarize` | Condense to key points | "Summarize this text, keeping only the key points" |
| `simplify` | Make easier to read | "Simplify this text to make it easier to read and understand" |
| `change_tone` | Adjust voice/style | `Rewrite this text in a ${tone} tone` |
| `translate` | Convert language | `Translate this text to ${language}` |
| `paraphrase` | Say differently | "Paraphrase this text using different words while keeping the same meaning" |
| `custom` | Custom instruction | `${customPrompt}\n\nApply to this text` |

#### Example Calls

**Rewrite**:
```javascript
await TextEditorService.transformText({
  text: selectedText,
  action: 'rewrite',
  creativity: 0.7,
  signal: abortController.signal
});
```

**Change Tone**:
```javascript
await TextEditorService.transformText({
  text: selectedText,
  action: 'change_tone',
  tone: 'Professional',
  creativity: 0.5,
  signal: abortController.signal
});
```

**Translate**:
```javascript
await TextEditorService.transformText({
  text: selectedText,
  action: 'translate',
  language: 'Spanish',
  creativity: 0.3,
  signal: abortController.signal
});
```

**Custom Instruction**:
```javascript
await TextEditorService.transformText({
  text: selectedText,
  action: 'custom',
  customPrompt: 'Rewrite in the style of Ernest Hemingway',
  creativity: 0.8,
  signal: abortController.signal
});
```

#### System Prompt
```
You are a professional editor and writing assistant. 
Help users improve their text with clarity, correctness, and impact.
```

---

### 4. `chatWithAI()`

Enables conversational chat with Athena AI assistant.

**Usage Location**: `AIAssistant.jsx` line 520

#### Parameters
```javascript
{
  messages: Array,       // Chat message history [{role, content}]
  creativity: number,    // Creativity level (0-1)
  signal: AbortSignal,   // Cancellation signal
  onChunk: Function      // Streaming callback
}
```

#### Message Format
```javascript
[
  { role: 'user', content: 'Hello!' },
  { role: 'assistant', content: 'Hi there!' },
  { role: 'user', content: 'Can you help me write...' }
]
```

#### Example Call
```javascript
await TextEditorService.chatWithAI({
  messages: chatHistory,
  creativity: 0.7,
  signal: abortController.signal,
  onChunk: (fullResponse) => {
    setChatMessages(prev => {
      const updated = [...prev];
      updated[assistantIdx] = { role: 'assistant', content: fullResponse };
      return updated;
    });
  }
});
```

#### System Prompt
```
You are Athena, a helpful AI assistant integrated into a document editor. 
Provide clear, accurate, and helpful responses.
```

---

### 5. `buildPollinationsUrl()`

Utility function to construct Pollinations AI image generation URLs.

**Usage**: Internal use by `generateImage()`

#### Parameters
```javascript
{
  prompt: string,  // Image description
  size: string     // Dimensions: '1024x1024'
}
```

#### Example
```javascript
const url = TextEditorService.buildPollinationsUrl(
  'A beautiful sunset over mountains',
  '1024x1024'
);
// Returns: https://image.pollinations.ai/prompt/A%20beautiful...?width=1024&height=1024&...
```

---

### 6. `callClaude()` & `callClaudeChat()`

Low-level Claude API wrappers. Used internally by higher-level functions.

**Note**: These are internal utilities. Prefer using the specialized functions above.

---

## Error Handling

### API Errors
All service functions throw errors with descriptive messages:

```javascript
try {
  await TextEditorService.generateImage({...});
} catch (error) {
  // error.message contains API error details
  toast.error(`Failed to generate image: ${error.message}`);
}
```

### AbortController Support
All async operations support cancellation:

```javascript
const abortController = new AbortController();

// Start operation
TextEditorService.generateDocument({
  ...options,
  signal: abortController.signal
});

// Cancel if needed
abortController.abort();
```

### Fallback Behavior
- **Image Generation**: Falls back to direct prompt if enhancement fails
- **Text Operations**: No fallback - throws error
- **Chat**: No fallback - throws error

---

## Rate Limits & Constraints

### Claude AI (Anthropic)
- **Max Tokens**: 4096 per request
- **Temperature**: 0.0 - 1.0
- **Streaming**: Enabled for all requests
- **Rate Limit**: Managed by API key tier

### Pollinations AI
- **Image Size**: Configurable width/height
- **Enhancement**: Automatic prompt enhancement enabled
- **Logo Removal**: Enabled (`nologo=true`)
- **Model**: Flux (latest)

---

## Performance Optimizations

### 1. Streaming Responses
All text generation uses streaming for better UX:
```javascript
onChunk: (fullText) => {
  // Update UI incrementally
  setContent(fullText);
}
```

### 2. Prompt Enhancement Caching
Consider caching enhanced prompts for common image styles.

### 3. Abort on Unmount
Always abort pending requests when component unmounts:
```javascript
useEffect(() => {
  return () => abortRef.current?.abort();
}, []);
```

---

## Security Considerations

### API Key Management
- API keys are stored server-side (not in frontend)
- Frontend makes requests through backend proxy
- Never expose API keys in client code

### Input Validation
- Sanitize user prompts before sending to API
- Validate text content for malicious input
- Implement request size limits

### CORS Configuration
Backend must handle CORS for API requests from frontend domain.

---

## Testing Guidelines

### Unit Tests
```javascript
describe('TextEditorService', () => {
  test('generateImage creates valid URL', () => {
    const result = await TextEditorService.generateImage({
      prompt: 'test',
      style: 'realistic',
      size: '1024x1024'
    });
    expect(result.url).toContain('pollinations.ai');
  });
});
```

### Integration Tests
Test full workflows:
1. Document generation end-to-end
2. Image generation with enhancement
3. Text transformation operations
4. Chat conversation flow

---

## Troubleshooting

### Common Issues

#### 1. "API error 401"
**Cause**: Invalid/missing API key  
**Solution**: Check backend API key configuration

#### 2. "Failed to fetch"
**Cause**: Network issue or CORS error  
**Solution**: Verify backend is running and CORS is configured

#### 3. Image not loading
**Cause**: Invalid prompt or Pollinations service issue  
**Solution**: Check generated URL in browser, verify prompt encoding

#### 4. Streaming not working
**Cause**: Missing `onChunk` callback or response parsing error  
**Solution**: Ensure `onChunk` is provided and response format matches expected structure

---

## Version History

- **v1.0**: Initial implementation with Claude 3.5 Sonnet
- **v1.1**: Added Pollinations AI integration
- **v1.2**: Implemented streaming for all text operations
- **v2.0**: Migrated to Claude Sonnet 4 (20250514)
- **Current**: v2.0 with compact UI optimizations

---

## Contact & Support

For API-related issues:
- Anthropic (Claude): https://docs.anthropic.com/
- Pollinations AI: https://pollinations.ai/docs

For Athena Editor integration questions, refer to internal documentation.
