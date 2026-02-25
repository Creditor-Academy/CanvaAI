const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock user data
const mockUser = {
  id: '1',
  email: 'user@example.com',
  name: 'Test User',
  role: 'user'
};

// Mock JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Routes
app.get('/api/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      user: mockUser
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  // Simple validation - in real app, check against database
  if (email && password) {
    const token = jwt.sign(
      { userId: mockUser.id, email: mockUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: mockUser
    });
  } else {
    res.status(400).json({ error: 'Email and password required' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- AI API Endpoints ---
const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-default-key' // The user will need to supply this
});

// Helper for model selection
const CHAT_MODEL = "gpt-4o-mini";

app.post('/api/ai/generate', async (req, res) => {
  try {
    const { prompt, temperature } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: temperature !== undefined ? temperature : 0.7,
    });

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error("AI Generation Error:", error.message || error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, temperature, stream } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const systemMessage = {
      role: "system",
      content: "You are Athena, a highly capable, premium AI assistant integrated directly into a wealthy document editor. You are polite, extremely helpful, concise, and generate well-formatted Markdown responses. Never refuse to help with writing."
    };

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [systemMessage, ...messages],
        max_tokens: 1500,
        temperature: temperature !== undefined ? temperature : 0.7,
        stream: true,
      });

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [systemMessage, ...messages],
      max_tokens: 1500,
      temperature: temperature !== undefined ? temperature : 0.7,
    });

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error("AI Chat Error:", error.message || error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process chat' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
      res.end();
    }
  }
});

app.post('/api/ai/transform', async (req, res) => {
  try {
    const { action, text, temperature, stream } = req.body;

    if (!text || !action) {
      return res.status(400).json({ error: 'Action and text are required' });
    }

    let systemPrompt = "You are a helpful AI writing assistant.";
    if (action === "enhance") {
      systemPrompt = "You are an expert editor. Enhance the following text to make it more professional, engaging, and clear. Maintain the original meaning but improve the tone and vocabulary. Return ONLY the enhanced text. Do not use quotes or introductory phrases. Use Markdown if appropriate.";
    } else if (action === "grammar_fix") {
      systemPrompt = "You are a grammar and spelling checker. Fix any grammar or spelling mistakes in the following text. Return ONLY the corrected text. Do not use quotes or introductory phrases.";
    } else if (action === "summarize") {
      systemPrompt = "Summarize the following text concisely. Return ONLY the summary. Do not use quotes or introductory phrases. Use Markdown bullets if helpful.";
    } else if (action === "expand") {
      systemPrompt = "Expand upon the following text by providing more detail, context, and elaboration. Return ONLY the expanded text. Use proper formatting.";
    } else if (action === "simplify") {
      systemPrompt = "Simplify the following text so that it is easy to understand for an 8th grader. Return ONLY the simplified text.";
    } else if (action === "translate") {
      systemPrompt = "Identify the language of the following text, and translate it to English. If it is already in English, translate it to Spanish. Return ONLY the translated text.";
    } else {
      systemPrompt = action; // Use action as the system prompt if it's custom
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        max_tokens: 2000,
        temperature: temperature !== undefined ? temperature : 0.7,
        stream: true,
      });

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      max_tokens: 2000,
      temperature: temperature !== undefined ? temperature : 0.7,
    });

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error("AI Transformation Error:", error.message || error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to transform text' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
      res.end();
    }
  }
});

// --- AI Image Generation (DALL-E 3) ---
app.post('/api/ai/image-generate', async (req, res) => {
  try {
    const { prompt, size = "1024x1024", quality = "standard", style = "vivid" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: size,
      quality: quality,
      style: style,
    });

    res.json({ result: response.data[0].url });
  } catch (error) {
    console.error("AI Image Generation Error:", error.message || error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});


// Fallback for other routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});