# Athena Editor — API Reference Guide

## Overview

This document provides complete API reference for the Athena Editor backend, including all endpoints, authentication, request/response formats, and error codes.

**Base URL**: `http://localhost:5000` (development)  
**Authentication**: JWT Bearer Token  
**Content-Type**: `application/json` (unless specified)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Document Management APIs](#2-document-management-apis)
3. [Comment APIs](#3-comment-apis)
4. [AI-Powered APIs](#4-ai-powered-apis)
5. [Analytics APIs](#5-analytics-apis)
6. [WebSocket Events](#6-websocket-events)
7. [Error Codes](#7-error-codes)
8. [Rate Limiting](#8-rate-limiting)
9. [Code Examples](#9-code-examples)

---

## 1. Authentication

### 1.1 Login

**Endpoint**: `POST /api/auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "Test User",
    "role": "user"
  }
}
```

**Error** (400 Bad Request):
```json
{
  "error": "Email and password required"
}
```

---

### 1.2 Get Profile

**Endpoint**: `GET /api/profile`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "Test User",
    "role": "user"
  }
}
```

**Error** (401 Unauthorized):
```json
{
  "error": "Invalid token"
}
```

---

### 1.3 Token Format

**JWT Payload**:
```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "iat": 1698000000,
  "exp": 1698086400
}
```

**Token Storage**:
```javascript
// Client-side
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));
```

---

## 2. Document Management APIs

### 2.1 Save New Document

**Endpoint**: `POST /api/text-editor/save`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request**:
```json
{
  "title": "My Document",
  "data": {
    "content": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            { "type": "text", "text": "Hello World" }
          ]
        }
      ]
    },
    "html": "<p>Hello World</p>"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "69e0c0e5eb7c41cee880f0f8",
  "title": "My Document",
  "message": "Document saved successfully"
}
```

**Error** (400 Bad Request):
```json
{
  "error": "Title is required"
}
```

**Error** (413 Payload Too Large):
```json
{
  "error": "Document is too large. Maximum size is 45MB.",
  "details": {
    "currentSize": "50.25MB",
    "maxSize": "45MB"
  }
}
```

---

### 2.2 Get Document by ID

**Endpoint**: `GET /api/text-editor/document/:id`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "document": {
    "id": "69e0c0e5eb7c41cee880f0f8",
    "title": "My Document",
    "data": {
      "content": {
        "type": "doc",
        "content": [...]
      },
      "html": "<p>Hello World</p>",
      "yjsState": "base64-encoded-yjs-state"
    },
    "createdAt": "2026-04-17T10:00:00.000Z",
    "updatedAt": "2026-04-17T11:30:00.000Z",
    "metadata": {
      "wordCount": 1500,
      "characterCount": 8500,
      "lastEditedBy": "user-123"
    }
  }
}
```

**Error** (404 Not Found):
```json
{
  "error": "Document not found"
}
```

**Error** (400 Bad Request):
```json
{
  "error": "Invalid document ID format"
}
```

---

### 2.3 Update Document

**Endpoint**: `PUT /api/text-editor/document/:id`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request**:
```json
{
  "title": "Updated Title",
  "data": {
    "content": {
      "type": "doc",
      "content": [...]
    },
    "html": "<p>Updated content</p>"
  }
}
```

**Response** (200 OK):
```json
{
  "id": "69e0c0e5eb7c41cee880f0f8",
  "title": "Updated Title",
  "updatedAt": "2026-04-17T12:00:00.000Z",
  "message": "Document updated successfully"
}
```

---

### 2.4 Delete Document

**Endpoint**: `DELETE /api/text-editor/document/:id`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "id": "69e0c0e5eb7c41cee880f0f8",
  "message": "Document deleted successfully"
}
```

---

### 2.5 Get User's Documents

**Endpoint**: `GET /api/text-editor/my-documents`

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
- `folderId` (optional): Filter by folder
- `isPublic` (optional): `true` or `false`
- `lastModified` (optional): ISO date string

**Response** (200 OK):
```json
{
  "documents": [
    {
      "id": "69e0c0e5eb7c41cee880f0f8",
      "title": "My Document",
      "createdAt": "2026-04-17T10:00:00.000Z",
      "updatedAt": "2026-04-17T11:30:00.000Z",
      "metadata": {
        "wordCount": 1500,
        "characterCount": 8500
      }
    }
  ]
}
```

---

### 2.6 Yjs Beacon Sync (Tab Close)

**Endpoint**: `POST /api/text-editor/document/:id/yjs-beacon`

**Content-Type**: `text/plain`

**Body**: Base64-encoded Yjs state update

**Response** (204 No Content):
```
(Empty body)
```

**Purpose**: Save final changes when user closes tab (uses Beacon API)

---

## 3. Comment APIs

### 3.1 Add Comment

**Endpoint**: `POST /api/text-editor/:documentId/comments`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request**:
```json
{
  "text": "This needs revision",
  "selectedText": "The quick brown fox",
  "author": "user-123",
  "resolved": false,
  "isSuggestion": false,
  "from": 42,
  "to": 63
}
```

**Response** (201 Created):
```json
{
  "id": "1698000000000",
  "text": "This needs revision",
  "selectedText": "The quick brown fox",
  "author": "user-123",
  "resolved": false,
  "isSuggestion": false,
  "from": 42,
  "to": 63,
  "timestamp": "2026-04-17T10:00:00.000Z",
  "replies": []
}
```

---

### 3.2 Get Comments

**Endpoint**: `GET /api/text-editor/:documentId/comments`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
[
  {
    "id": "1698000000000",
    "text": "This needs revision",
    "selectedText": "The quick brown fox",
    "author": "user-123",
    "resolved": false,
    "isSuggestion": false,
    "from": 42,
    "to": 63,
    "timestamp": "2026-04-17T10:00:00.000Z",
    "replies": [
      {
        "id": "1698000001000",
        "text": "Agreed, I'll fix it",
        "author": "user-456",
        "timestamp": "2026-04-17T10:05:00.000Z"
      }
    ]
  }
]
```

---

### 3.3 Update Comment

**Endpoint**: `PUT /api/text-editor/:documentId/comments/:commentId`

**Request**:
```json
{
  "text": "Updated comment text",
  "resolved": true
}
```

**Response** (200 OK):
```json
{
  "id": "1698000000000",
  "text": "Updated comment text",
  "resolved": true,
  ...
}
```

---

### 3.4 Delete Comment

**Endpoint**: `DELETE /api/text-editor/:documentId/comments/:commentId`

**Response** (200 OK):
```json
{
  "message": "Comment deleted successfully"
}
```

---

## 4. AI-Powered APIs

### 4.1 Generate Text

**Endpoint**: `POST /api/text-editor/ai/generate`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request**:
```json
{
  "systemPrompt": "You are a professional writer",
  "userPrompt": "Write a paragraph about AI",
  "temperature": 0.7,
  "maxTokens": 4096,
  "stream": false
}
```

**Response** (Non-streaming, 200 OK):
```json
{
  "text": "Artificial Intelligence (AI) represents one of the most...",
  "fromCache": false
}
```

**Response** (Streaming, 200 OK):
```
data: {"content": "Artificial"}

data: {"content": " Intelligence"}

data: {"content": " (AI)"}

data: [DONE]
```

**Error** (400 Bad Request):
```json
{
  "error": "userPrompt is required"
}
```

---

### 4.2 Chat with AI

**Endpoint**: `POST /api/text-editor/ai/chat`

**Request**:
```json
{
  "messages": [
    { "role": "user", "content": "Help me improve this paragraph" }
  ],
  "systemPrompt": "You are a writing assistant",
  "temperature": 0.7,
  "stream": true
}
```

**Response** (Streaming):
```
data: {"content": "Here's"}

data: {"content": " an"}

data: {"content": " improved"}

data: {"content": " version..."}

data: [DONE]
```

---

### 4.3 Transform Text

**Endpoint**: `POST /api/text-editor/ai/transform`

**Request**:
```json
{
  "action": "enhance",
  "text": "The meeting was good",
  "tone": "professional",
  "temperature": 0.7,
  "stream": false
}
```

**Available Actions**:
- `enhance` - Improve clarity and engagement
- `rewrite` - Completely rewrite with fresh phrasing
- `summarize` - Condense to key points
- `expand` - Add detail and context
- `simplify` - Make easier to understand
- `grammar_fix` - Fix grammar and spelling
- `tone:professional` - Professional tone
- `tone:casual` - Casual tone
- `tone:friendly` - Friendly tone
- `tone:formal` - Formal tone
- `tone:academic` - Academic tone

**Response** (200 OK):
```json
{
  "result": "The meeting proved to be highly productive and beneficial...",
  "fromCache": false
}
```

---

### 4.4 Get AI Quota Status

**Endpoint**: `GET /api/text-editor/ai/quota-status`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "userId": "user-123",
  "quota": {
    "dailyLimit": 1000,
    "used": 250,
    "remaining": 750,
    "resetAt": "2026-04-18T00:00:00.000Z"
  },
  "cost": {
    "totalSpent": 2.50,
    "currency": "USD"
  }
}
```

---

### 4.5 AI Health Check

**Endpoint**: `GET /api/text-editor/ai/health`

**Response** (200 OK):
```json
{
  "status": "healthy",
  "openai": {
    "status": "operational",
    "latency": 250
  },
  "cache": {
    "hitRate": 0.45,
    "size": 1250
  },
  "timestamp": "2026-04-17T12:00:00.000Z"
}
```

---

## 5. Analytics APIs

### 5.1 Get Analytics Dashboard

**Endpoint**: `GET /api/text-editor/ai/analytics`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "overview": {
    "totalRequests": 15000,
    "totalTokens": 2500000,
    "totalCost": 25.50,
    "averageLatency": 320,
    "cacheHitRate": 0.45
  },
  "timeSeries": [
    {
      "date": "2026-04-17",
      "requests": 500,
      "tokens": 85000,
      "cost": 0.85
    }
  ],
  "topUsers": [
    {
      "userId": "user-123",
      "requests": 2500,
      "cost": 5.25
    }
  ]
}
```

---

### 5.2 Get User Usage Report

**Endpoint**: `GET /api/text-editor/ai/analytics/user`

**Response** (200 OK):
```json
{
  "userId": "user-123",
  "period": "last_30_days",
  "usage": {
    "totalRequests": 1500,
    "totalTokens": 250000,
    "totalCost": 2.50,
    "byEndpoint": {
      "generate": 500,
      "chat": 800,
      "transform": 200
    },
    "byModel": {
      "gpt-4o-mini": 1500
    }
  }
}
```

---

### 5.3 Get Cost Breakdown

**Endpoint**: `GET /api/text-editor/ai/analytics/costs`

**Response** (200 OK):
```json
{
  "totalCost": 25.50,
  "currency": "USD",
  "breakdown": {
    "byEndpoint": {
      "generate": 10.25,
      "chat": 12.00,
      "transform": 3.25
    },
    "byModel": {
      "gpt-4o-mini": 25.50
    },
    "byUser": {
      "user-123": 5.25,
      "user-456": 3.75
    }
  }
}
```

---

### 5.4 Get Alerts

**Endpoint**: `GET /api/text-editor/ai/analytics/alerts`

**Response** (200 OK):
```json
{
  "alerts": [
    {
      "type": "quota_warning",
      "message": "User user-123 has used 90% of daily quota",
      "severity": "warning",
      "timestamp": "2026-04-17T11:00:00.000Z"
    },
    {
      "type": "high_latency",
      "message": "Average latency exceeded 500ms threshold",
      "severity": "critical",
      "timestamp": "2026-04-17T10:30:00.000Z"
    }
  ]
}
```

---

### 5.5 Cache Management

**Get Cache Stats**: `GET /api/text-editor/ai/cache/stats`

**Response**:
```json
{
  "totalEntries": 1250,
  "totalSize": "15.5MB",
  "hitRate": 0.45,
  "byEndpoint": {
    "generate": { "entries": 500, "hitRate": 0.50 },
    "transform": { "entries": 750, "hitRate": 0.40 }
  }
}
```

**Clear Cache**: `POST /api/text-editor/ai/cache/clear`

**Request**:
```json
{
  "endpoint": "generate"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Cleared generate cache"
}
```

---

## 6. WebSocket Events

**Connection URL**: `ws://localhost:5000`  
**Authentication**: JWT token in handshake auth

### 6.1 Connection

**Client → Server**:
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'your-jwt-token' }
});
```

**Server → Client**:
```javascript
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

---

### 6.2 Join Document Room

**Client → Server**:
```javascript
socket.emit('join-document', {
  documentId: '69e0c0e5eb7c41cee880f0f8'
});
```

**Server → Client** (Full State):
```javascript
socket.on('yjs-state', (base64State) => {
  // Apply full Yjs state
  const update = fromBase64(base64State);
  Y.applyUpdate(ydoc, update);
});
```

---

### 6.3 Yjs Content Updates

**Client → Server**:
```javascript
socket.emit('yjs-update', {
  documentId: '69e0c0e5eb7c41cee880f0f8',
  update: toBase64(updateBytes)
});
```

**Server → Client** (Broadcast):
```javascript
socket.on('yjs-update', ({ update, userId }) => {
  // Apply remote update
  Y.applyUpdate(ydoc, fromBase64(update), userId);
});
```

---

### 6.4 Awareness Updates (Cursor Presence)

**Client → Server**:
```javascript
socket.emit('awareness-update', {
  documentId: '69e0c0e5eb7c41cee880f0f8',
  state: {
    userId: 'user-123',
    name: 'John',
    color: '#ff5733',
    cursor: { from: 42, to: 63 }
  }
});
```

**Server → Client** (Broadcast):
```javascript
socket.on('awareness-update', ({ socketId, state }) => {
  // Update remote cursor
  awareness.setRemoteState(socketId, state);
});
```

**Awareness Snapshot** (On Join):
```javascript
socket.on('awareness-snapshot', (states) => {
  // Initialize all remote cursors
  states.forEach(state => {
    awareness.setRemoteState(state.socketId, state);
  });
});
```

**Awareness Remove** (On Leave):
```javascript
socket.on('awareness-remove', ({ socketId }) => {
  // Remove remote cursor
  awareness.removeRemoteState(socketId);
});
```

---

### 6.5 User Presence Events

**User Joined**:
```javascript
socket.on('user-joined', ({ userId, socketId }) => {
  console.log(`User ${userId} joined`);
});
```

**User Left**:
```javascript
socket.on('user-left', ({ socketId }) => {
  console.log(`User ${socketId} left`);
});
```

---

### 6.6 Error Handling

**Error Event**:
```javascript
socket.on('error', ({ message }) => {
  console.error('Socket error:', message);
  toast.error(message);
});
```

**Disconnect**:
```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  syncManager.status = 'offline';
});

socket.on('reconnect', () => {
  console.log('Reconnected');
  syncManager.status = 'syncing';
});
```

---

## 7. Error Codes

### 7.1 HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Document retrieved |
| 201 | Created | Document saved |
| 204 | No Content | Beacon sync |
| 400 | Bad Request | Missing required field |
| 401 | Unauthorized | Invalid/missing token |
| 404 | Not Found | Document doesn't exist |
| 413 | Payload Too Large | Document > 45MB |
| 500 | Internal Server Error | Database error |

---

### 7.2 Error Response Format

```json
{
  "error": "Error message",
  "details": {
    "field": "title",
    "issue": "Required field missing"
  }
}
```

---

### 7.3 Common Errors

**Authentication Errors**:
```json
{ "error": "No token provided" }
{ "error": "Invalid token" }
{ "error": "Token expired" }
```

**Validation Errors**:
```json
{ "error": "Title is required" }
{ "error": "Document data is required and must be an object" }
{ "error": "Invalid document ID format" }
```

**AI Errors**:
```json
{ "error": "userPrompt is required" }
{ "error": "messages array is required" }
{ "error": "text is required" }
{ "error": "Failed to generate content", "details": "..." }
```

---

## 8. Rate Limiting

### 8.1 API Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Document CRUD | 100 req/min | Per user |
| AI Generate | 50 req/min | Per user |
| AI Chat | 100 req/min | Per user |
| AI Transform | 50 req/min | Per user |
| Comments | 200 req/min | Per user |

---

### 8.2 WebSocket Rate Limits

| Event | Limit | Window |
|-------|-------|--------|
| yjs-update | 50 updates/sec | Per user |
| awareness-update | 10 updates/sec | Per user |
| join-document | 10 joins/min | Per user |

---

### 8.3 Rate Limit Response

**HTTP**:
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 30
}
```

**WebSocket**:
```javascript
socket.emit('error', {
  message: 'Rate limit exceeded',
  retryAfter: 30
});
```

---

## 9. Code Examples

### 9.1 JavaScript (Browser)

```javascript
// Save document
async function saveDocument(title, content) {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:5000/api/text-editor/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title,
      data: {
        content,
        html: '<p>...</p>'
      }
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to save document');
  }
  
  return response.json();
}
```

---

### 9.2 Python (Backend Integration)

```python
import requests

def get_documents(token):
    response = requests.get(
        'http://localhost:5000/api/text-editor/my-documents',
        headers={
            'Authorization': f'Bearer {token}'
        }
    )
    
    if response.status_code == 200:
        return response.json()['documents']
    else:
        raise Exception(f'Error: {response.status_code}')
```

---

### 9.3 cURL (Testing)

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get documents
curl -X GET http://localhost:5000/api/text-editor/my-documents \
  -H "Authorization: Bearer YOUR_TOKEN"

# Save document
curl -X POST http://localhost:5000/api/text-editor/save \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","data":{"content":{},"html":"<p>Test</p>"}}'
```

---

### 9.4 Axios (React App)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Usage
export const textEditorAPI = {
  saveDocument: (data) => api.post('/api/text-editor/save', data),
  getDocument: (id) => api.get(`/api/text-editor/document/${id}`),
  updateDocument: (id, data) => api.put(`/api/text-editor/document/${id}`, data),
  deleteDocument: (id) => api.delete(`/api/text-editor/document/${id}`),
  getDocuments: () => api.get('/api/text-editor/my-documents'),
};
```

---

## Appendix A: Data Models

### Document Schema

```javascript
{
  _id: ObjectId,
  title: String,
  data: {
    content: Object,      // TipTap/ProseMirror JSON
    html: String,         // HTML representation
    yjsState: String      // Base64-encoded Yjs state
  },
  userId: String,         // Owner user ID
  metadata: {
    wordCount: Number,
    characterCount: Number,
    lastEditedBy: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

### Comment Schema (In-Memory)

```javascript
{
  id: String,             // Timestamp-based
  text: String,
  selectedText: String,
  author: String,         // User ID
  resolved: Boolean,
  isSuggestion: Boolean,
  from: Number,           // ProseMirror position
  to: Number,             // ProseMirror position
  timestamp: Date,
  replies: Array<Comment>
}
```

---

## Appendix B: SDK Usage

### Using TextEditorService

```javascript
import { TextEditorService } from '@/services/Text-Editor/text.service';

// Save
const result = await TextEditorService.saveDocument({
  title: 'My Doc',
  data: { content: editor.getJSON(), html: editor.getHTML() }
});

// Load
const doc = await TextEditorService.getDocumentById('69e0c0e5eb7c41cee880f0f8');
editor.commands.setContent(doc.document.data.content);

// Update
await TextEditorService.updateDocument('69e0c0e5eb7c41cee880f0f8', {
  title: 'Updated Title',
  data: { content: editor.getJSON() }
});

// Delete
await TextEditorService.deleteDocument('69e0c0e5eb7c41cee880f0f8');

// Get all
const { documents } = await TextEditorService.getAllDocuments();
```

---

## Appendix C: WebSocket Integration

### Using SyncManager

```javascript
import { SyncManager } from '@/services/SyncManager';

const syncManager = new SyncManager();

// Connect
await syncManager.connect({
  documentId: '69e0c0e5eb7c41cee880f0f8',
  userId: 'user-123',
  userName: 'John',
  userColor: '#ff5733',
  token: 'your-jwt-token'
});

// Get Yjs document
const ydoc = syncManager.ydoc;

// Get awareness
const awareness = syncManager.awareness;

// Disconnect
syncManager.disconnect();
```

---

**API Version**: 1.0.0  
**Last Updated**: April 17, 2026  
**Base URL**: `http://localhost:5000`
