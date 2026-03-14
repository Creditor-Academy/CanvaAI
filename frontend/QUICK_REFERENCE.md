# Canvas Data Communication - Quick Reference Card

## 🎯 At a Glance

| Aspect | Details |
|--------|---------|
| **Data Format** | JSON (application/json) |
| **Base URL** | `http://localhost:5000` |
| **Authentication** | Bearer Token in Authorization header |
| **Main Endpoint** | `/api/user-data/projects` |
| **Main Data** | Canvas design with layers, shapes, text, images |

---

## 📡 Key Endpoints

```
POST   /api/user-data/projects              → Create new project
GET    /api/user-data/projects              → List all projects
GET    /api/user-data/projects/{id}         → Get single project
PUT    /api/user-data/projects/{id}         → Update metadata
PUT    /api/user-data/projects/{id}/design  → Update design
DELETE /api/user-data/projects/{id}         → Delete project
```

---

## 🔐 Authentication Header

```
Authorization: Bearer TOKEN_HERE
Content-Type: application/json
```

---

## 📦 Data Structure Hierarchy

```
Project
├── Metadata
│   ├── title (string)
│   ├── desc (string)
│   ├── category (string)
│   ├── icon (string)
│   └── status (Draft|Active|Archived|Deleted)
└── Design
    ├── layers (array)
    │   ├── Layer 1 (text|shape|image|drawing|group)
    │   │   ├── id (string)
    │   │   ├── type (string)
    │   │   ├── x, y, width, height (numbers)
    │   │   ├── rotation, z, opacity (numbers)
    │   │   ├── visible, locked (booleans)
    │   │   └── Type-specific: content|fill|stroke|src|filters
    │   └── Layer 2, 3, ...
    ├── canvasSize { width, height }
    ├── zoom (number, default 100)
    ├── pan { x, y }
    ├── canvasBgColor (hex)
    └── canvasBgImage (null or url/base64)
```

---

## 💾 Minimal Create Request

```json
{
  "title": "My Design",
  "design": {
    "layers": [
      {
        "id": "l1",
        "type": "text",
        "name": "Title",
        "x": 100, "y": 100,
        "width": 300, "height": 100,
        "rotation": 0, "z": 1,
        "opacity": 100,
        "visible": true, "locked": false,
        "content": {
          "text": "Hello",
          "fontSize": 48,
          "color": "#000000"
        }
      }
    ],
    "canvasSize": {"width": 800, "height": 600},
    "zoom": 100,
    "pan": {"x": 0, "y": 0}
  }
}
```

---

## 🎨 Layer Types & Properties

### Text Layer
```json
{
  "type": "text",
  "content": {
    "text": "string",
    "fontSize": 24,
    "fontFamily": "Arial",
    "color": "#000000",
    "textAlign": "left|center|right"
  }
}
```

### Shape Layer
```json
{
  "type": "shape",
  "shapeType": "rectangle|circle|triangle",
  "fill": {"type": "color", "color": "#FF0000"},
  "stroke": {"color": "#000000", "width": 2},
  "borderRadius": 10
}
```

### Image Layer
```json
{
  "type": "image",
  "src": "data:image/png;base64,...",
  "filters": {
    "brightness": 100,
    "contrast": 100,
    "saturation": 100,
    "blur": 0
  },
  "cornerRadius": 8
}
```

### Drawing Layer
```json
{
  "type": "drawing",
  "pathData": "M10 10 L20 20 L30 10",
  "brushColor": "#000000",
  "brushSize": 3,
  "brushOpacity": 100
}
```

---

## 🔄 Common Data Flow

### 1️⃣ User Creates Project
```
Frontend → POST /api/user-data/projects → Backend creates in DB → Response with _id
```

### 2️⃣ User Edits Canvas
```
Frontend → PUT /api/user-data/projects/{id}/design → Backend updates → Success response
```

### 3️⃣ User Loads Project
```
Frontend → GET /api/user-data/projects/{id} → Backend retrieves → Returns full project
```

### 4️⃣ User Updates Metadata
```
Frontend → PUT /api/user-data/projects/{id} → Backend updates title/category/etc → Success
```

---

## ✅ Validation Checklist

### Required Fields
- [ ] `title` - not empty, max 200 chars
- [ ] `design.layers` - must be array
- [ ] `design.canvasSize` - must have width & height
- [ ] All layers must have `id`, `type`, `x`, `y`, `width`, `height`

### Data Types
- [ ] Numbers: `x`, `y`, `width`, `height`, `rotation`, `z`, `opacity`, `fontSize`
- [ ] Strings: `id`, `type`, `name`, `text`, `color`, `fontFamily`
- [ ] Booleans: `visible`, `locked`
- [ ] Objects: `content`, `fill`, `stroke`, `filters`, `canvasSize`, `pan`
- [ ] Arrays: `layers`

### Security
- [ ] Check user owns project
- [ ] Validate all inputs
- [ ] Check layer count (prevent DoS)
- [ ] Limit base64 image size
- [ ] Verify authorization token

---

## 🚀 Sending Data Examples

### Update Single Layer
```javascript
const design = {
  layers: [...allLayers], // Include all layers
  canvasSize: {...},
  zoom: 100,
  pan: {...}
};

fetch(`/api/user-data/projects/${projectId}/design`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(design)
});
```

### Delete Layer (by not including it)
```javascript
const design = {
  layers: [layer1, layer2], // layer3 is deleted
  ...
};
```

### Add New Layer
```javascript
const newLayer = {
  id: 'layer-' + Date.now(),
  type: 'text',
  ...properties
};

const design = {
  layers: [...existingLayers, newLayer],
  ...
};
```

---

## 📊 Response Examples

### ✅ Success

```json
{
  "success": true,
  "message": "Design updated successfully",
  "design": {
    "layers": [...],
    "canvasSize": {...}
  }
}
```

### ❌ Error

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "layers": "Layers must be an array",
    "canvasSize": "Width is required"
  },
  "statusCode": 400
}
```

---

## 📋 Implementation Checklist

### Backend Setup
- [ ] Install Express.js, MongoDB/Mongoose
- [ ] Create Project model with design schema
- [ ] Implement authentication middleware
- [ ] Create POST endpoint (create project)
- [ ] Create GET endpoint (fetch project)
- [ ] Create PUT endpoint (update design)
- [ ] Create PUT endpoint (update metadata)
- [ ] Create DELETE endpoint (delete project)
- [ ] Add input validation
- [ ] Add error handling
- [ ] Add CORS configuration
- [ ] Test with provided cURL examples

### Requirements
- [ ] Validate all incoming data
- [ ] Check user permissions
- [ ] Store savedAt timestamp
- [ ] Support all layer types
- [ ] Handle large base64 images
- [ ] Return proper HTTP status codes
- [ ] Include detailed error messages

---

## 🎯 Common Mistakes to Avoid

| ❌ Wrong | ✅ Right |
|---------|---------|
| Skip authentication | Always verify authorization token |
| Allow any user to edit others' projects | Check userId ownership |
| Store base64 in DB without limits | Compress or use cloud storage |
| Ignore validation | Validate all fields |
| Send entire DB to client | Send only requested data |
| Don't handle large payloads | Set request size limit (100mb) |
| Hardcode secret keys | Use environment variables |
| No error handling | Return proper error responses |

---

## 🔧 Quick Test Script

```bash
#!/bin/bash

# Set variables
BASE_URL="http://localhost:5000"
TOKEN="your_token_here"

# Test 1: Create Project
echo "Creating project..."
curl -X POST $BASE_URL/api/user-data/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Design",
    "design": {
      "layers": [{
        "id": "l1",
        "type": "text",
        "x": 100, "y": 100,
        "width": 300, "height": 100,
        "rotation": 0, "z": 1,
        "opacity": 100, "visible": true, "locked": false,
        "content": {"text": "Test", "fontSize": 48, "color": "#000000"}
      }],
      "canvasSize": {"width": 800, "height": 600},
      "zoom": 100,
      "pan": {"x": 0, "y": 0}
    }
  }'

# Save PROJECT_ID from response
PROJECT_ID="returned_id_here"

# Test 2: Get Project
echo -e "\n\nGetting project..."
curl -X GET $BASE_URL/api/user-data/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN"

# Test 3: Update Design
echo -e "\n\nUpdating design..."
curl -X PUT $BASE_URL/api/user-data/projects/$PROJECT_ID/design \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "layers": [{...updated layers...}],
    "canvasSize": {"width": 800, "height": 600},
    "zoom": 100,
    "pan": {"x": 0, "y": 0}
  }'
```

---

## 📚 Related Documentation

- **CANVAS_DATA_COMMUNICATION_GUIDE.md** - Detailed guide with all strategies
- **CANVAS_JSON_EXAMPLES.md** - Real-world JSON examples
- **BACKEND_IMPLEMENTATION_GUIDE.md** - Full backend code examples
- **API_JSON_FORMATS.md** - Additional API formats

---

## 🆘 Need Help?

Check these in order:
1. Is token in Authorization header?
2. Is Content-Type set to application/json?
3. Are all required fields included?
4. Do layer IDs exist and are unique?
5. Is userId ownership verified?
6. Are numbers actually numbers (not strings)?
7. Is array valid JSON array?

---

## 💡 Pro Tips

✨ **Tip 1**: Use timestamps (`savedAt`) to track changes
✨ **Tip 2**: Keep layer history for undo functionality
✨ **Tip 3**: Compress base64 images before storing
✨ **Tip 4**: Use indexes for userId and dates
✨ **Tip 5**: Implement soft deletes (mark as deleted, don't remove)
✨ **Tip 6**: Version your designs for rollback capability
✨ **Tip 7**: Implement auto-save (debounce requests)
✨ **Tip 8**: Return minimal data in list endpoints

