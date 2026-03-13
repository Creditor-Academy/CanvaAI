# Backend Implementation Guide - Canvas API Setup

Quick reference for backend developer to implement canvas endpoints.

---

## 1. Database Schema

### MongoDB (Example with Mongoose)

```javascript
// Project Schema
const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  desc: {
    type: String,
    maxlength: 1000
  },
  icon: String,
  category: {
    type: String,
    enum: ['General', 'Social Media', 'Presentation', 'Print', 'Web', 'Business', 'Marketing', 'Other'],
    default: 'General'
  },
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Archived', 'Deleted'],
    default: 'Draft'
  },
  tags: [String],
  thumbnail: String, // base64 or URL
  designColor: String,
  
  // Main design data
  design: {
    layers: [{
      id: String,
      type: { type: String, enum: ['text', 'shape', 'image', 'drawing', 'group'] },
      name: String,
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      rotation: Number,
      z: Number,
      opacity: Number,
      visible: Boolean,
      locked: Boolean,
      // Type-specific properties stored as flexible objects
      content: mongoose.Schema.Types.Mixed, // For text
      shapeType: String, // For shapes
      fill: mongoose.Schema.Types.Mixed,
      stroke: mongoose.Schema.Types.Mixed,
      src: String, // For images
      filters: mongoose.Schema.Types.Mixed,
      cornerRadius: Number,
      borderRadius: Number,
      shadow: mongoose.Schema.Types.Mixed
    }],
    canvasSize: {
      width: Number,
      height: Number
    },
    zoom: { type: Number, default: 100 },
    pan: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 }
    },
    canvasBgColor: { type: String, default: '#ffffff' },
    canvasBgImage: String,
    savedAt: { type: Date, default: Date.now }
  },
  
  // Metadata
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true },
  
  // Collaboration
  collaborators: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['viewer', 'editor', 'owner'] }
  }],
  
  // Version history (optional)
  history: [{
    version: Number,
    design: mongoose.Schema.Types.Mixed,
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedAt: Date,
    changes: String
  }]
});

// Add indexes for better performance
projectSchema.index({ userId: 1, createdAt: -1 });
projectSchema.index({ category: 1 });
projectSchema.index({ status: 1 });

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
```

---

## 2. Express Routes

### File: `routes/projects.js`

```javascript
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const Project = require('../models/Project');
const { validationResult, body } = require('express-validator');

// Validation rules
const projectValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('design').isObject().withMessage('Design must be an object'),
  body('design.layers').isArray().withMessage('Layers must be an array'),
  body('design.canvasSize').isObject().withMessage('Canvas size is required'),
];

// ============= CREATE PROJECT =============
router.post('/', authenticate, projectValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { title, desc, icon, category, status, design, tags, thumbnail } = req.body;

    // Create new project
    const project = new Project({
      userId: req.user._id,
      title,
      desc: desc || '',
      icon: icon || '🎨',
      category: category || 'General',
      status: status || 'Draft',
      tags: tags || [],
      thumbnail: thumbnail || null,
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
      project: {
        _id: project._id,
        title: project.title,
        design: project.design,
        createdAt: project.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project',
      message: error.message
    });
  }
});

// ============= GET PROJECT =============
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID
    if (!isValidMongoId(id)) {
      return res.status(400).json({ 
        error: 'Invalid project ID' 
      });
    }

    const project = await Project.findOne({
      _id: id,
      // Allow if user is owner or collaborator with editor/viewer role
      $or: [
        { userId: req.user._id },
        { 'collaborators.userId': req.user._id }
      ]
    });

    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found....' 
      });
    }

    res.json({
      success: true,
      project: {
        _id: project._id,
        title: project.title,
        desc: project.desc,
        icon: project.icon,
        category: project.category,
        status: project.status,
        tags: project.tags,
        design: project.design,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      error: 'Failed to fetch project',
      message: error.message
    });
  }
});

// ============= UPDATE DESIGN =============
router.put('/:id/design', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { layers, canvasSize, zoom, pan, canvasBgColor, canvasBgImage } = req.body;

    if (!isValidMongoId(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Validate design data
    if (!Array.isArray(layers)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: { layers: 'Layers must be an array' }
      });
    }

    if (!canvasSize || typeof canvasSize.width !== 'number' || typeof canvasSize.height !== 'number') {
      return res.status(400).json({
        error: 'Validation failed',
        details: { canvasSize: 'Canvas size must have valid width and height' }
      });
    }

    // Check ownership
    const project = await Project.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found...' });
    }

    // Store previous design in history (optional)
    if (project.history && project.history.length < 50) {
      project.history.push({
        version: (project.history.length || 0) + 1,
        design: JSON.parse(JSON.stringify(project.design)),
        modifiedBy: req.user._id,
        modifiedAt: new Date()
      });
    }

    // Update design
    project.design = {
      layers: layers.map(layer => ({
        ...layer,
        id: layer.id || generateId()
      })),
      canvasSize,
      zoom: zoom || 100,
      pan: pan || { x: 0, y: 0 },
      canvasBgColor: canvasBgColor || '#ffffff',
      canvasBgImage: canvasBgImage || null,
      savedAt: new Date()
    };

    project.updatedAt = new Date();
    await project.save();

    res.json({
      success: true,
      message: 'Design updated successfully',
      design: project.design
    });
  } catch (error) {
    console.error('Error updating design:', error);
    res.status(500).json({
      error: 'Failed to update design',
      message: error.message
    });
  }
});

// ============= UPDATE PROJECT METADATA =============
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, desc, icon, category, status, tags, thumbnail } = req.body;

    if (!isValidMongoId(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await Project.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found...' });
    }

    // Update fields if provided
    if (title) project.title = title.trim();
    if (desc !== undefined) project.desc = desc;
    if (icon) project.icon = icon;
    if (category) project.category = category;
    if (status) project.status = status;
    if (tags) project.tags = tags;
    if (thumbnail) project.thumbnail = thumbnail;

    project.updatedAt = new Date();
    await project.save();

    res.json({
      success: true,
      message: 'Project updated successfully',
      project: {
        _id: project._id,
        title: project.title,
        desc: project.desc,
        category: project.category,
        status: project.status
      }
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      error: 'Failed to update project',
      message: error.message
    });
  }
});

// ============= DELETE PROJECT =============
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidMongoId(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await Project.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found....' });
    }

    // Soft delete
    project.status = 'Deleted';
    project.updatedAt = new Date();
    await project.save();

    // Or hard delete (uncomment if preferred)
    // await Project.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      error: 'Failed to delete project',
      message: error.message
    });
  }
});

// ============= GET ALL PROJECTS =============
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, status, skip = 0, limit = 20 } = req.query;

    const query = {
      userId: req.user._id,
      status: { $ne: 'Deleted' }
    };

    if (category) query.category = category;
    if (status) query.status = status;

    const projects = await Project.find(query)
      .select('-design.layers') // Exclude large layers data for list view
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      projects,
      pagination: {
        total,
        count: projects.length,
        skip: parseInt(skip),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      error: 'Failed to fetch projects',
      message: error.message
    });
  }
});

// Utility function
function isValidMongoId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

function generateId() {
  return 'layer-' + Math.random().toString(36).substr(2, 9);
}

module.exports = router;
```

---

## 3. Middleware for Authentication

### File: `middleware/authenticate.js`

```javascript
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      _id: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
};

module.exports = authenticate;
```

---

## 4. Main App Setup

### File: `app.js`

```javascript
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' })); // Allow large base64 images
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/athena', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/user-data/projects', require('./routes/projects'));

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 5. Environment Variables

### File: `.env`

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/athena
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

---

## 6. Testing with cURL

### Create Project

```bash
curl -X POST http://localhost:5000/api/user-data/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Design",
    "desc": "Test design",
    "icon": "🎨",
    "category": "General",
    "status": "Active",
    "design": {
      "layers": [
        {
          "id": "layer-1",
          "type": "text",
          "name": "Title",
          "x": 100,
          "y": 100,
          "width": 300,
          "height": 100,
          "rotation": 0,
          "z": 1,
          "opacity": 100,
          "visible": true,
          "locked": false,
          "content": {
            "text": "Hello World",
            "fontSize": 48,
            "fontFamily": "Arial",
            "fontWeight": "bold",
            "color": "#000000",
            "textAlign": "center"
          }
        }
      ],
      "canvasSize": {"width": 800, "height": 600},
      "zoom": 100,
      "pan": {"x": 0, "y": 0}
    }
  }'
```

### Update Design

```bash
curl -X PUT http://localhost:5000/api/user-data/projects/PROJECT_ID/design \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "layers": [...],
    "canvasSize": {"width": 800, "height": 600},
    "zoom": 100,
    "pan": {"x": 0, "y": 0}
  }'
```

### Get Project

```bash
curl -X GET http://localhost:5000/api/user-data/projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 7. Key Implementation Notes

### ✅ DO:
- Validate all input data
- Check user ownership/permissions
- Use indexes for better query performance
- Implement error handling
- Log errors for debugging
- Use transactions for multiple operations
- Compress large base64 images
- Implement rate limiting

### ❌ DON'T:
- Skip authentication checks
- Allow users to access other users' projects
- Store unvalidated data
- Store very large base64 images (use cloud storage)
- Return sensitive information to client
- Use `eval()` or other unsafe operations
- Hardcode credentials

---

## 8. Performance Optimization Tips

```javascript
// 1. Use lean() for read-only queries
const projects = await Project.find(query).lean();

// 2. Select only needed fields
const projects = await Project.find(query).select('title category status -design.layers');

// 3. Paginate large results
const skip = (page - 1) * limit;
const projects = await Project.find(query).skip(skip).limit(limit);

// 4. Index frequently searched fields
projectSchema.index({ userId: 1, createdAt: -1 });
projectSchema.index({ category: 1, status: 1 });

// 5. Cache frequently accessed data
const redis = require('redis');
const client = redis.createClient();

// 6. Compress images before storing
const sharp = require('sharp');
// const compressed = await sharp(imageBuffer).resize(1920, 1080).toBuffer();

// 7. Use bulk operations
await Project.bulkWrite([...]);
```

---

## 9. API Response Standards

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "project": {...}
  },
  "timestamp": "2024-02-14T10:30:00Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "statusCode": 400
}
```

---

This guide provides a complete backend implementation reference for handling canvas data from the frontend.

