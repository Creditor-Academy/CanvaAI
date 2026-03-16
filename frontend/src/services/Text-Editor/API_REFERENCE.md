# Text Editor Service - API Reference

## Overview

The `text.service.js` is the **centralized API service** for all Athena Editor functionality, including:
- ✅ AI Features (Claude, Pollinations)
- ✅ Backend Document Management
- ✅ Authentication & Headers

---

## File Location

```
CanvaAI/frontend/src/services/Text-Editor/text.service.js
```

---

## Quick Start

### Import the Service

```javascript
// Import entire service
import { TextEditorService } from '@/services/Text-Editor/text.service';

// Or import specific functions
import { saveDocument, getDocumentById, generateContent } from '@/services/Text-Editor/text.service';
```

### Configuration

Set your API base URL in `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Or it will default to `http://localhost:5000`

---

## Table of Contents

1. [Document Management APIs](#document-management-apis)
2. [AI Features](#ai-features)
3. [Authentication](#authentication)
4. [Examples](#examples)

---

## Document Management APIs

### 📄 Save Document

Save a new document to the backend.

```javascript
const result = await TextEditorService.saveDocument({
  title: 'My Document',
  data: {
    content: editor.state.doc.toJSON(),
    html: editor.getHTML()
  }
});

console.log(result.id); // Saved document ID
```

**Endpoint:** `POST /api/text-editor/save`  
**Request Body:** `{ title, data }`  
**Response:** `{ id, title, message }`

---

### 📖 Get Document by ID

Retrieve a document from the backend by its MongoDB ID.

```javascript
const doc = await TextEditorService.getDocumentById('65abc1234567890def123456');

console.log(doc.title);
console.log(doc.data.content); // ProseMirror JSON
console.log(doc.data.html);    // HTML representation
```

**Endpoint:** `GET /api/text-editor/document/:id`  
**Response:** 
```json
{
  "id": "...",
  "title": "Document Title",
  "data": {
    "content": { /* ProseMirror JSON */ },
    "html": "<p>HTML</p>"
  },
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### ✏️ Update Document

Update an existing document.

```javascript
await TextEditorService.updateDocument('document-id', {
  title: 'Updated Title',
  data: {
    content: updatedContent,
    html: updatedHTML
  }
});
```

**Endpoint:** `PUT /api/text-editor/document/:id`

---

### 🗑️ Delete Document

Delete a document permanently.

```javascript
await TextEditorService.deleteDocument('document-id');
```

**Endpoint:** `DELETE /api/text-editor/document/:id`

---

## AI Features

### 🤖 Generate Content

Generate text content using Claude AI.

```javascript
const result = await TextEditorService.generateDocument({
  topic: 'Artificial Intelligence',
  docType: 'Blog Post',
  tone: 'Professional',
  pages: 3,
  creativity: 0.7,
  onChunk: (generatedText) => {
    console.log('Streaming:', generatedText);
  }
});
```

---

### 💬 Chat with AI

Have a conversation with Athena AI assistant.

```javascript
const response = await TextEditorService.chatWithAI({
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
  creativity: 0.7,
  onChunk: (text) => {
    console.log('Streaming:', text);
  }
});
```

---

### ✨ Transform Text

Transform/enhance selected text using AI.

```javascript
const enhanced = await TextEditorService.transformText({
  action: 'enhance', // enhance, grammar_fix, summarize, expand, simplify, translate
  text: 'This is my text',
  creativity: 0.7
});
```

**Available Actions:**
- `enhance` - Improve writing quality
- `grammar_fix` - Fix grammar and spelling
- `summarize` - Create a summary
- `expand` - Add more details
- `simplify` - Make easier to understand
- `translate` - Translate to another language
- `paraphrase` - Rewrite using different words
- `custom` - Use custom prompt

---

### 🎨 Generate Image

Generate images using Pollinations AI.

```javascript
const { url, enhancedPrompt } = await TextEditorService.generateImage({
  prompt: 'A beautiful sunset over mountains',
  style: 'photorealistic',
  size: '1024x1024',
  enhancePrompt: true
});

console.log('Image URL:', url);
```

---

## Authentication

### Automatic Token Management

All backend API calls automatically include the JWT token from localStorage:

```javascript
// Token is retrieved from localStorage
const token = localStorage.getItem('token');

// Included in request headers automatically
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Manual Header Access

```javascript
import { getAuthHeaders } from '@/services/Text-Editor/text.service';

const headers = getAuthHeaders();
console.log(headers.Authorization); // Bearer <token>
```

---

## Examples

### Example 1: Auto-Save Document

```javascript
import { TextEditorService } from '@/services/Text-Editor/text.service';

function AutoSaveComponent({ editor, documentId }) {
  const handleSave = async () => {
    try {
      const data = {
        title: 'My Document',
        data: {
          content: editor.state.doc.toJSON(),
          html: editor.getHTML()
        }
      };

      let result;
      if (documentId) {
        result = await TextEditorService.updateDocument(documentId, data);
      } else {
        result = await TextEditorService.saveDocument(data);
      }

      console.log('✅ Saved:', result.id);
      toast.success('Document saved successfully!');
    } catch (error) {
      console.error('❌ Save failed:', error);
      toast.error('Failed to save document');
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

---

### Example 2: Load Document on Mount

```javascript
import { useEffect, useState } from 'react';
import { TextEditorService } from '@/services/Text-Editor/text.service';

function LoadDocument({ documentId, onLoad }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDoc = async () => {
      try {
        const doc = await TextEditorService.getDocumentById(documentId);
        
        console.log('📄 Loaded:', doc.title);
        onLoad?.(doc.data.content);
      } catch (error) {
        console.error('❌ Failed to load:', error);
        toast.error('Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      loadDoc();
    }
  }, [documentId]);

  if (loading) return <div>Loading...</div>;
  return null;
}
```

---

### Example 3: AI Text Enhancement

```javascript
function EnhanceTextButton({ selectedText, onEnhanced }) {
  const [enhancing, setEnhancing] = useState(false);

  const handleEnhance = async () => {
    if (!selectedText) return;

    setEnhancing(true);
    try {
      const result = await TextEditorService.transformText({
        action: 'enhance',
        text: selectedText,
        creativity: 0.7
      });

      onEnhanced?.(result);
      toast.success('Text enhanced successfully!');
    } catch (error) {
      toast.error('Failed to enhance text');
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <button onClick={handleEnhance} disabled={enhancing || !selectedText}>
      {enhancing ? 'Enhancing...' : '✨ Enhance'}
    </button>
  );
}
```

---

### Example 4: Complete Save & Load Flow

```javascript
import { useState, useEffect } from 'react';
import { TextEditorService } from '@/services/Text-Editor/text.service';

function DocumentManager({ editor }) {
  const [documentId, setDocumentId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Save handler
  const saveDocument = async () => {
    if (!editor) return;

    setSaving(true);
    try {
      const data = {
        title: 'My Document',
        data: {
          content: editor.state.doc.toJSON(),
          html: editor.getHTML()
        }
      };

      let result;
      if (documentId) {
        result = await TextEditorService.updateDocument(documentId, data);
      } else {
        result = await TextEditorService.saveDocument(data);
        setDocumentId(result.id);
      }

      toast.success('Document saved!');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Load handler
  const loadDocument = async (id) => {
    try {
      const doc = await TextEditorService.getDocumentById(id);
      editor.commands.setContent(doc.data.content);
      setDocumentId(doc.id);
      toast.success('Document loaded!');
    } catch (error) {
      toast.error('Failed to load document');
    }
  };

  return (
    <div>
      <button onClick={saveDocument} disabled={saving}>
        {saving ? '💾 Saving...' : '💾 Save'}
      </button>
      <button onClick={() => loadDocument(documentId)}>
        📖 Load
      </button>
    </div>
  );
}
```

---

## Error Handling

All API calls include built-in error handling:

```javascript
try {
  const doc = await TextEditorService.getDocumentById('invalid-id');
} catch (error) {
  console.error('API Error:', error.message);
  
  // Handle specific errors
  if (error.message.includes('Not found')) {
    // Document doesn't exist
  }
}
```

---

## Best Practices

1. ✅ **Always use try/catch** - Handle errors gracefully
2. ✅ **Show loading states** - Keep users informed
3. ✅ **Use toast notifications** - Provide feedback
4. ✅ **Validate before calling** - Check required parameters
5. ✅ **Store tokens securely** - Use localStorage for JWT
6. ✅ **Clean up on unmount** - Cancel pending requests

---

## API Endpoints Summary

| Function | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| `saveDocument` | POST | `/api/text-editor/save` | Save new document |
| `getDocumentById` | GET | `/api/text-editor/document/:id` | Get document by ID |
| `updateDocument` | PUT | `/api/text-editor/document/:id` | Update document |
| `deleteDocument` | DELETE | `/api/text-editor/document/:id` | Delete document |

---

## Troubleshooting

### "Failed to save document"
- Check if backend server is running (`http://localhost:5000`)
- Verify token exists in localStorage
- Ensure `data.content` is valid ProseMirror JSON

### "Document not found"
- Verify the document ID is correct
- Check if document was deleted from database
- Ensure MongoDB connection is working

### Authentication errors
- Make sure user is logged in
- Check if token is expired
- Verify token format: `Bearer <token>`

---

## Support

For issues or questions:
1. Check console logs for error details
2. Verify backend endpoints in `server.js`
3. Check network tab in browser DevTools
4. Ensure environment variables are set correctly

---

## License

Part of the Athena Editor project.
