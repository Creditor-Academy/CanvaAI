const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// Middleware & Models
const authMiddleware = require('../middlewares/auth');
const validateOpenAIApiKey = require('../middlewares/validateOpenAIApiKey');
const Presentation = require('../model/Presentation');
const s3 = require('../utils/s3');

// Config
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- HELPER: Upload to S3 (Stream Optimized) ---
const uploadToS3 = async (url, userId, presentationId, slideId) => {
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    });

    const folder = "presentationImages";
    const fileName = `${userId}/${folder}/${presentationId}/${slideId}.png`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: response.data,
      ContentType: 'image/png',
      // ACL: 'public-read' // Uncomment if your bucket requires it
    };

    const data = await s3.upload(params).promise();
    return data.Location;
  } catch (err) {
    console.error('S3 Upload Error:', err.message);
    return null;
  }
};


// --- ROUTE 1: Get Presentation Outline (Draft) ---
router.post('/get-presentation-outline', validateOpenAIApiKey, authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { topic, tone, length, mediaStyle, outlineText } = req.body;

    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const slideCount = parseInt(length) || 10;
    const validTone = tone || 'professional';

    const openaiPrompt = `
      Create a presentation OUTLINE.
      Topic: ${topic}
      Tone: ${validTone}
      Slides: ${slideCount}
      Extra Context: ${outlineText || 'None'}

      Rules:
      - Return valid JSON matching the format below.
      - If MediaStyle is 'AI Graphics', generate a detailed 'imagePrompt' for DALL-E.
      - If MediaStyle is 'None', leave 'imagePrompt' empty.
      - imagePrompt should always be there and should be a valid prompt for DALL-E.
      - Only give 'paragraph' contentType.

      Format:
      {
        "meta": { "topic": "${topic}", "tone": "${validTone}", "slideCount": ${slideCount}, "stage": "draft" },
        "slides": [
          {
            "slideNo": 1,
            "title": "Title",
            "layout": "title",
            "contentType": "paragraph",
            "content": "Text here",
            "imagePrompt": "Visual description for DAll-e"
          }
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a presentation architect. Output JSON only.' },
        { role: 'user', content: openaiPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const presentationData = JSON.parse(completion.choices[0].message.content);

    res.status(200).json({
      success: true,
      data: presentationData
    });

  } catch (error) {
    console.error('Outline Error:', error);
    res.status(500).json({ error: 'Failed to generate outline', details: error.message });
  }
});


// --- ROUTE 2: Finalize Presentation (Generate Images + Save) ---
router.post('/finalize-ppt', validateOpenAIApiKey, authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { meta, slides } = req.body;

  if (!slides || !Array.isArray(slides)) {
    return res.status(400).json({ error: "Invalid slides data" });
  }

  try {
    console.log(`Finalizing Presentation for User: ${userId}`);

    const presentationId = new mongoose.Types.ObjectId();

    const systemPrompt = `
      You are an expert designer. Expand this outline into a final presentation.
      Topic: ${meta.topic}
      Tone: ${meta.tone}

      Requirements:
      1. Expand 'content' into professional text.
      2. Ensure every slide has a detailed 'imagePrompt' (no text/letters in prompt).
      3. Output strictly valid JSON.

      Input Slides: ${JSON.stringify(slides)}
    `;

    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "system", content: systemPrompt }],
      response_format: { type: "json_object" }
    });

    const parsedData = JSON.parse(gptResponse.choices[0].message.content);
    const expandedSlides = parsedData.slides || [];

    // 3. Parallel Image Generation & Upload
    const finalSlides = await Promise.all(expandedSlides.map(async (slide) => {

      // Pre-generate Slide ID for consistency between S3 and DB
      const slideId = new mongoose.Types.ObjectId();

      let s3Url = "";
      const prompt = slide.imagePrompt;

      // Only generate if prompt exists
      if (prompt && prompt.length > 5) {
        try {
          // A. DALL-E 3 Generation
          const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Presentation style, minimal, no text, ${meta.tone}: ${prompt}`,
            n: 1,
            size: "1024x1024",
            quality: "standard"
          });

          // B. Stream Upload to S3
          // We pass the pre-generated presentationId and slideId
          const tempUrl = imageResponse.data[0].url;
          s3Url = await uploadToS3(tempUrl, userId, presentationId.toString(), slideId.toString());

        } catch (imgErr) {
          console.error(`Image Gen Failed (Slide ${slide.slideNo}):`, imgErr.message);
        }
      }

      // Return final structure
      return {
        _id: slideId,
        slideNo: slide.slideNo,
        title: slide.title,
        layout: slide.layout || 'content',
        contentType: slide.contentType,
        content: slide.content,
        image: {
          prompt: prompt || "",
          url: s3Url || ""
        }
      };
    }));

    // 4. Create & Save New Presentation Document
    const newPresentation = new Presentation({
      _id: presentationId, // <--- CRITICAL: Force MongoDB to use our pre-generated ID
      userId: userId,
      meta: { ...meta, stage: 'final' },
      slides: finalSlides
    });

    await newPresentation.save();

    res.status(200).json({
      success: true,
      message: "Presentation finalized",
      presentationId: newPresentation._id,
      data: newPresentation
    });

  } catch (error) {
    console.error("Finalization Critical Error:", error);
    res.status(500).json({
      error: "Failed to generate presentation",
      details: error.message
    });
  }
});

/**
 * Get presentation details by ID
 */
router.get('/:id', validateOpenAIApiKey, async (req, res) => {
  try {
    const { id } = req.params;

    // For now, we'll return a placeholder since we're not storing presentations
    // In a real implementation, you would fetch from a database
    return res.json({
      id: id,
      title: `Presentation ${id}`,
      slides: [],
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching presentation:', error.response?.data || error.message);

    const errorMessage = error.response?.data || error.message || 'Unknown error occurred';
    const errorStatus = error.response?.status || 500;
    return res.status(errorStatus).json({
      error: errorMessage,
      status: errorStatus,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Update presentation content
 */
router.put('/:id', validateOpenAIApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // For now, return the updates as received
    // In a real implementation, you would update in a database
    return res.json({
      id: id,
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating presentation:', error.response?.data || error.message);
    const errorMessage = error.response?.data || error.message || 'Unknown error occurred';
    const errorStatus = error.response?.status || 500;
    return res.status(errorStatus).json({
      error: errorMessage,
      status: errorStatus,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Delete a presentation
 */
router.delete('/:id', validateOpenAIApiKey, async (req, res) => {
  try {
    const { id } = req.params;

    // For now, return success
    // In a real implementation, you would delete from a database
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting presentation:', error.response?.data || error.message);
    const errorMessage = error.response?.data || error.message || 'Unknown error occurred';
    const errorStatus = error.response?.status || 500;
    return res.status(errorStatus).json({
      error: errorMessage,
      status: errorStatus,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * List user's presentations
 */
router.get('/', validateOpenAIApiKey, async (req, res) => {
  try {
    // For now, return an empty list
    // In a real implementation, you would fetch from a database
    return res.json({
      presentations: []
    });
  } catch (error) {
    console.error('Error listing presentations:', error.response?.data || error.message);

    const errorMessage = error.response?.data || error.message || 'Unknown error occurred';
    const errorStatus = error.response?.status || 500;
    return res.status(errorStatus).json({
      error: errorMessage,
      status: errorStatus,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Export presentation to various formats
 */
router.post('/:id/export', validateOpenAIApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.body;

    // For now, we'll create a simple PowerPoint file using pptxgenjs
    // In a real implementation, you would fetch the presentation data from a database
    const pptx = new pptxgen();

    // Add some sample slides (in a real implementation, you would use actual presentation data)
    for (let i = 1; i <= 3; i++) {
      const slide = pptx.addSlide();
      slide.addText(`Slide ${i} Title`, { x: 1, y: 0.5, w: 8, h: 1, fontSize: 24, bold: true });
      slide.addText(`Content for slide ${i}\nThis is where the content would go.`, { x: 1, y: 1.5, w: 8, h: 4, fontSize: 16 });
    }

    // Generate the presentation as a buffer
    const buffer = await pptx.write('buffer');

    // For now, we'll return the buffer as a base64 string
    // In a real implementation, you might save to S3 and return a download URL
    const base64Data = buffer.toString('base64');

    return res.json({
      downloadUrl: `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${base64Data}`,
      format: format,
      size: buffer.length
    });
  } catch (error) {
    console.error('Error exporting presentation:', error.response?.data || error.message);
    // Provide more detailed error information
    const errorMessage = error.response?.data || error.message || 'Unknown error occurred';
    const errorStatus = error.response?.status || 500;
    return res.status(errorStatus).json({
      error: errorMessage,
      status: errorStatus,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Save presentation
 */
router.post('/save', async (req, res) => {
  try {
    const { slides } = req.body;

    // For now, we'll just return a mock ID
    // In a real implementation, this would save to a database
    const presentationId = `pres_${Date.now()}`;

    return res.json({
      id: presentationId,
      message: 'Presentation saved successfully'
    });
  } catch (error) {
    console.error('Error saving presentation:', error.message);
    const errorMessage = error.message || 'Unknown error occurred';
    const errorStatus = 500;
    return res.status(errorStatus).json({
      error: errorMessage,
      status: errorStatus,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Share presentation
 */
router.post('/share', async (req, res) => {
  try {
    const { slides } = req.body;

    // For now, we'll just return a mock URL
    // In a real implementation, this would create a shareable link
    const shareUrl = `https://athena-ai.presentation/${Date.now()}`;

    return res.json({
      shareUrl: shareUrl
    });
  } catch (error) {
    console.error('Error sharing presentation:', error.message);
    const errorMessage = error.message || 'Unknown error occurred';
    const errorStatus = 500;
    return res.status(errorStatus).json({
      error: errorMessage,
      status: errorStatus,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;