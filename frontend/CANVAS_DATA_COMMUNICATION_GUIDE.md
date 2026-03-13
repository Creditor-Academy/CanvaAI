# Canvas Editor - Data Communication Guide for Backend

This document provides a comprehensive guide on how to send and receive data between the frontend canvas editor and the backend API.

---

## Table of Contents

1. [Overview](#overview)
2. [Current Architecture](#current-architecture)
3. [Data Structures](#data-structures)
4. [API Endpoints](#api-endpoints)
5. [Communication Flow](#communication-flow)
6. [Multiple Data Sending Strategies](#multiple-data-sending-strategies)
7. [Code Examples](#code-examples)
8. [Best Practices](#best-practices)

---

## Overview

The canvas editor generates multiple types of data that need to be sent to the backend:

1. **Canvas Design Data** - Layers, shapes, text, images, and their properties
2. **Project Metadata** - Title, description, category, status
3. **Canvas Settings** - Size, zoom, pan, background color/image
4. **Individual Layer Properties** - Position, size, rotation, styling, effects

All communication uses **JSON format** with proper HTTP headers.

---

## Current Architecture

### API Base URL
```
FRONTEND: http://localhost:5000 (configurable via VITE_API_BASE_URL)
```

### Authentication
All requests include:
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

### Request/Response Pattern
- **Method**: POST (create), PUT (update), DELETE (remove), GET (fetch)
- **Format**: JSON
- **Error Handling**: Includes error message in response body

---

## Data Structures

### 1. Design Data (Main Canvas Data)

The core design object sent to the backend:

```json
{
  "layers": [
    {
      "id": "layer-001",
      "type": "text",
      "name": "Main Title",
      "x": 100,
      "y": 50,
      "width": 500,
      "height": 100,
      "rotation": 0,
      "z": 10,
      "opacity": 100,
      "locked": false,
      "visible": true,
      "content": {
        "text": "Hello World",
        "fontSize": 48,
        "fontFamily": "Arial",
        "fontWeight": "bold",
        "fontStyle": "normal",
        "textDecoration": "none",
        "color": "#000000",
        "textAlign": "center",
        "lineHeight": 1.2
      }
    },
    {
      "id": "layer-002",
      "type": "shape",
      "name": "Background Rectangle",
      "x": 0,
      "y": 0,
      "width": 800,
      "height": 600,
      "rotation": 0,
      "z": 0,
      "opacity": 100,
      "locked": false,
      "visible": true,
      "shapeType": "rectangle",
      "fill": {
        "type": "color",
        "color": "#7CD090"
      },
      "stroke": {
        "color": "#000000",
        "width": 2,
        "style": "solid"
      },
      "borderRadius": 10
    },
    {
      "id": "layer-003",
      "type": "image",
      "name": "Header Image",
      "x": 150,
      "y": 200,
      "width": 500,
      "height": 300,
      "rotation": 15,
      "z": 5,
      "opacity": 100,
      "locked": false,
      "visible": true,
      "src": "data:image/png;base64,...",
      "filters": {
        "brightness": 100,
        "contrast": 100,
        "saturation": 100,
        "blur": 0
      },
      "cornerRadius": 8
    },
    {
      "id": "layer-004",
      "type": "drawing",
      "name": "Hand Drawn Elements",
      "x": 100,
      "y": 100,
      "width": 600,
      "height": 400,
      "z": 3,
      "opacity": 100,
      "visible": true,
      "pathData": "M10 10 L20 20 L30 10",
      "brushColor": "#000000",
      "brushSize": 3,
      "brushOpacity": 100
    }
  ],
  "canvasSize": {
    "width": 800,
    "height": 600
  },
  "zoom": 100,
  "pan": {
    "x": 0,
    "y": 0
  },
  "canvasBgColor": "#ffffff",
  "canvasBgImage": null,
  "savedAt": 1676543200000
}
```

### 2. Project Metadata

When creating or updating a project:

```json
{
  "title": "My Design Project",
  "desc": "A beautiful design for social media",
  "icon": "🎨",
  "category": "Social Media",
  "status": "Active",
  "tags": ["social", "design", "marketing"],
  "thumbnail": "data:image/png;base64,...",
  "designColor": "#7CD090",
  "design": {
    "layers": [...],
    "canvasSize": {...},
    "zoom": 100,
    "pan": {...}
  }
}
```

### 3. Individual Layer Structure

Common properties for all layer types:

```json
{
  "id": "unique-layer-id",
  "type": "text|shape|image|drawing|group",
  "name": "Layer Name",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 200,
  "rotation": 0,
  "z": 5,
  "opacity": 100,
  "locked": false,
  "visible": true,
  "typeSpecificProps": {
    "depends on layer type"
  }
}
```

---

## API Endpoints

### 1. Create Project with Design

**Endpoint**: `POST /api/user-data/projects`

**Request**:
```json
{
  "title": "New Canvas Design",
  "desc": "Description of the design",
  "icon": "🎨",
  "category": "General",
  "status": "Active",
  "design": {
    "layers": [...],
    "canvasSize": {"width": 800, "height": 600},
    "zoom": 100,
    "pan": {"x": 0, "y": 0}
  }
}
```

**Response**:
```json
{
  "_id": "project-id-123",
  "title": "New Canvas Design",
  "desc": "Description of the design",
  "design": {...},
  "createdAt": "2024-02-14T10:00:00Z",
  "updatedAt": "2024-02-14T10:00:00Z"
}
```

### 2. Update Design for Existing Project

**Endpoint**: `PUT /api/user-data/projects/{id}/design`

**Request**:
```json
{
  "layers": [...],
  "canvasSize": {"width": 800, "height": 600},
  "zoom": 100,
  "pan": {"x": 100, "y": 50},
  "canvasBgColor": "#7CD090",
  "canvasBgImage": null
}
```

**Response**:
```json
{
  "success": true,
  "message": "Design updated successfully",
  "design": {...}
}
```

### 3. Update Project Metadata

**Endpoint**: `PUT /api/user-data/projects/{id}`

**Request**:
```json
{
  "title": "Updated Title",
  "desc": "Updated description",
  "category": "Updated Category",
  "status": "Draft"
}
```

**Response**:
```json
{
  "_id": "project-id-123",
  "title": "Updated Title",
  "desc": "Updated description",
  "category": "Updated Category",
  "status": "Draft"
}
```

### 4. Get Project with Design

**Endpoint**: `GET /api/user-data/projects/{id}`

**Response**:
```json
{
  "_id": "project-id-123",
  "title": "Canvas Design",
  "desc": "Description",
  "design": {
    "layers": [...],
    "canvasSize": {...},
    "zoom": 100,
    "pan": {...}
  },
  "createdAt": "2024-02-14T10:00:00Z",
  "updatedAt": "2024-02-14T10:00:00Z"
}
```

---

## Communication Flow

### Saving Design (Update Existing Project)

```
Frontend CanvaEditor.jsx
  ↓
  User clicks "Save" button
  ↓
  handleSave() function executes
  ↓
  Collects: { layers, canvasSize, zoom, pan }
  ↓
  api.updateProjectDesign(projectId, design)
  ↓
  PUT /api/user-data/projects/{id}/design
  ↓
  Backend validates and saves to database
  ↓
  Returns success response
  ↓
  Frontend shows "Design saved successfully!"
```

### Creating New Project

```
Frontend CanvaEditor.jsx
  ↓
  User clicks "Save" without projectId
  ↓
  api.createProject(newProjectData)
  ↓
  POST /api/user-data/projects
  ↓
  Backend creates new project with design
  ↓
  Returns new project with _id
  ↓
  Frontend navigates to /canva-clone/{newProjectId}
```

### Loading Project

```
Frontend CanvaEditor.jsx (useProjectLoader hook)
  ↓
  Component mounts with projectId from URL
  ↓
  api.getProject(projectId)
  ↓
  GET /api/user-data/projects/{id}
  ↓
  Backend retrieves project from database
  ↓
  Returns full project with design
  ↓
  Frontend sets layers state with received design
```

---

## Multiple Data Sending Strategies

### Strategy 1: Send Everything at Once (Current Implementation)

**Best for**: Complete saves and updates

```javascript
const designData = {
  layers: allLayers,
  canvasSize: { width: 800, height: 600 },
  zoom: 100,
  pan: { x: 0, y: 0 },
  canvasBgColor: '#7CD090'
};

await api.updateProjectDesign(projectId, designData);
```

**Advantages**:
- Simple and straightforward
- No data consistency issues
- Complete snapshot of state

**Disadvantages**:
- Large payload if many layers
- Unnecessary data if only one layer changed

---

### Strategy 2: Send Individual Layer Updates (For Optimization)

**Best for**: Real-time updates, auto-save, single layer changes

**Endpoint**: `PUT /api/user-data/projects/{projectId}/layers/{layerId}`

**Request**:
```json
{
  "name": "Updated Layer Name",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 150,
  "rotation": 45,
  "opacity": 85,
  "z": 5,
  "visible": true,
  "locked": false,
  "content": {
    "text": "Updated text",
    "fontSize": 24,
    "color": "#FF0000"
  }
}
```

**Response**:
```json
{
  "success": true,
  "layerId": "layer-001",
  "layer": {...}
}
```

---

### Strategy 3: Batch Updates (For Multiple Changes)

**Best for**: Undo/Redo operations, bulk changes

**Endpoint**: `PUT /api/user-data/projects/{projectId}/batch-update`

**Request**:
```json
{
  "operations": [
    {
      "operation": "update",
      "layerId": "layer-001",
      "changes": {
        "x": 150,
        "y": 200,
        "rotation": 45
      }
    },
    {
      "operation": "delete",
      "layerId": "layer-003"
    },
    {
      "operation": "create",
      "layer": {
        "type": "text",
        "name": "New Text",
        "x": 100,
        "y": 100,
        "content": {...}
      }
    },
    {
      "operation": "update",
      "canvasSize": {
        "width": 1000,
        "height": 800
      }
    }
  ],
  "timestamp": 1676543200000
}
```

**Response**:
```json
{
  "success": true,
  "updatedLayers": [...],
  "deletedLayerIds": [...],
  "newLayers": [...],
  "canvasSize": {...}
}
```

---

### Strategy 4: Auto-Save with Debounce (For User Experience)

**Best for**: Periodic auto-saves during editing

```javascript
// Frontend - Debounced save
const handleLayerChange = useCallback(
  debounce((layers) => {
    api.updateProjectDesign(projectId, { 
      layers, 
      canvasSize, 
      zoom, 
      pan 
    });
  }, 5000), // Save after 5 seconds of inactivity
  [projectId, canvasSize, zoom, pan]
);
```

---

## Code Examples

### Frontend - Current Implementation (CanvaEditor.jsx)

```javascript
// Save design data
const handleSave = async () => {
  const design = { layers, canvasSize, zoom, pan };

  try {
    if (projectId) {
      // Update existing project
      await api.updateProjectDesign(projectId, design);
      alert('Design saved successfully!');
    } else {
      // Create new project
      const newProjectData = {
        title: "Untitled Design",
        desc: "Created in Canva Clone",
        icon: "🎨",
        category: "General",
        status: "Active",
        design: design,
      };

      const newProject = await api.createProject(newProjectData);

      if (newProject && newProject._id) {
        alert('Project created successfully!');
        navigate(`/canva-clone/${newProject._id}`, { replace: true });
      }
    }
  } catch (error) {
    console.error('Failed to save design:', error);
    alert('Error saving design. Please try again.');
  }
};
```

### Frontend - API Service (services/api.js)

```javascript
class ApiService {
  // Create new project
  async createProject(projectData) {
    return this.request('/api/user-data/projects', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData),
    });
  }

  // Update design
  async updateProjectDesign(id, designData) {
    return this.request(`/api/user-data/projects/${id}/design`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(designData),
    });
  }

  // Update project metadata
  async updateProject(id, projectData) {
    return this.request(`/api/user-data/projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData),
    });
  }

  // Get project
  async getProject(id) {
    return this.request(`/api/user-data/projects/${id}`, {
      headers: getAuthHeaders(),
    });
  }
}
```

### Frontend - Custom Hook for Sending Data

```javascript
import { useCallback } from 'react';
import api from '../services/api';

export const useSaveDesign = (projectId) => {
  const saveDesign = useCallback(async (designData) => {
    try {
      if (projectId) {
        const response = await api.updateProjectDesign(projectId, designData);
        console.log('Design saved:', response);
        return response;
      } else {
        const projectData = {
          title: designData.title || "Untitled Design",
          desc: designData.desc || "",
          icon: "🎨",
          category: designData.category || "General",
          status: "Active",
          design: designData,
        };
        const response = await api.createProject(projectData);
        console.log('Project created:', response);
        return response;
      }
    } catch (error) {
      console.error('Error saving design:', error);
      throw error;
    }
  }, [projectId]);

  return { saveDesign };
};
```

### Backend - Expected Implementation (Example)

```javascript
// POST /api/user-data/projects
router.post('/projects', authenticate, async (req, res) => {
  try {
    const { title, desc, icon, category, status, design } = req.body;

    // Validate required fields
    if (!title || !design) {
      return res.status(400).json({ error: 'Title and design are required' });
    }

    // Create new project
    const project = new Project({
      userId: req.user._id,
      title,
      desc,
      icon,
      category,
      status,
      design: {
        layers: design.layers || [],
        canvasSize: design.canvasSize || { width: 800, height: 600 },
        zoom: design.zoom || 100,
        pan: design.pan || { x: 0, y: 0 },
        canvasBgColor: design.canvasBgColor || '#ffffff',
        canvasBgImage: design.canvasBgImage || null,
        savedAt: new Date()
      }
    });

    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Error creating project' });
  }
});

// PUT /api/user-data/projects/:id/design
router.put('/projects/:id/design', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { layers, canvasSize, zoom, pan, canvasBgColor, canvasBgImage } = req.body;

    // Validate project exists and belongs to user
    const project = await Project.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found....' });
    }

    // Update design
    project.design = {
      layers: layers || [],
      canvasSize: canvasSize || { width: 800, height: 600 },
      zoom: zoom || 100,
      pan: pan || { x: 0, y: 0 },
      canvasBgColor: canvasBgColor || '#ffffff',
      canvasBgImage: canvasBgImage || null,
      savedAt: new Date()
    };

    await project.save();

    res.json({
      success: true,
      message: 'Design updated successfully',
      data: project
    });
  } catch (error) {
    console.error('Error updating design:', error);
    res.status(500).json({ error: 'Error updating design' });
  }
});
```

---

## Best Practices

### 1. **Always Include Authentication**
```javascript
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};
```

### 2. **Validate Data on Both Sides**
```javascript
// Frontend validation before sending
if (!layers || layers.length === 0) {
  throw new Error('Design must have at least one layer');
}

// Backend validation
if (!Array.isArray(layers)) {
  return res.status(400).json({ error: 'Layers must be an array' });
}
```

### 3. **Handle Errors Gracefully**
```javascript
try {
  const response = await api.updateProjectDesign(projectId, design);
  console.log('Success:', response);
} catch (error) {
  console.error('Error:', error.message);
  // Show user-friendly error message
  alert('Failed to save design. Please try again.');
}
```

### 4. **Use Proper HTTP Methods**
- `POST` - Create new resource
- `PUT` - Update entire resource
- `PATCH` - Update partial resource (optimal for single changes)
- `DELETE` - Delete resource

### 5. **Include Timestamps**
```json
{
  "design": {...},
  "savedAt": 1676543200000,
  "lastModifiedBy": "user-id"
}
```

### 6. **Optimize Payload Size**
```javascript
// Send only changed properties
const changedFields = {
  x: 150,
  y: 200,
  opacity: 85
};

// Instead of entire layer object
await api.updateLayer(layerId, changedFields);
```

### 7. **Implement Auto-Save**
```javascript
// Debounce rapid changes
const debouncedSave = useCallback(
  debounce((design) => {
    api.updateProjectDesign(projectId, design);
  }, 5000),
  [projectId]
);

// Call on every state change
useEffect(() => {
  debouncedSave({ layers, canvasSize, zoom, pan });
}, [layers, canvasSize, zoom, pan, debouncedSave]);
```

### 8. **Version Control**
```json
{
  "design": {
    "version": 1,
    "layers": [...],
    "canvasSize": {...}
  },
  "history": [
    {
      "version": 1,
      "timestamp": 1676543200000,
      "changes": [...]
    }
  ]
}
```

---

## Summary

Your canvas editor has a flexible data communication system that:

✅ Uses JSON format for all data
✅ Supports both creating and updating designs
✅ Includes multiple optimization strategies
✅ Follows REST API conventions
✅ Provides proper error handling
✅ Supports authentication

**For the backend**, implement these endpoints:
1. `POST /api/user-data/projects` - Create project
2. `PUT /api/user-data/projects/{id}/design` - Update design
3. `PUT /api/user-data/projects/{id}` - Update metadata
4. `GET /api/user-data/projects/{id}` - Get project
5. `DELETE /api/user-data/projects/{id}` - Delete project

All data transmission uses JSON in the request/response body with proper `Content-Type: application/json` headers.

