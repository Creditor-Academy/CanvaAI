# JSON Data Formats - For Backend Developer Schema Design

This document contains exact JSON formats being sent from frontend to backend. Use these to create your database schema.

---

## 1. CREATE NEW PROJECT - Complete Request

**Sent when user saves a new design**

```json
{
  "title": "My Awesome Design",
  "desc": "A beautiful canvas design for social media",
  "icon": "🎨",
  "category": "Social Media",
  "status": "Active",
  "tags": ["social", "design", "marketing"],
  "design": {
    "layers": [
      {
        "id": "layer-background-1",
        "type": "shape",
        "name": "Background",
        "x": 0,
        "y": 0,
        "width": 1080,
        "height": 1080,
        "rotation": 0,
        "z": 0,
        "opacity": 100,
        "visible": true,
        "locked": false,
        "shapeType": "rectangle",
        "fill": {
          "type": "color",
          "color": "#ffffff"
        },
        "stroke": {
          "color": "#000000",
          "width": 0,
          "style": "solid"
        },
        "borderRadius": 0
      },
      {
        "id": "layer-text-title-1",
        "type": "text",
        "name": "Main Title",
        "x": 100,
        "y": 300,
        "width": 880,
        "height": 150,
        "rotation": 0,
        "z": 5,
        "opacity": 100,
        "visible": true,
        "locked": false,
        "content": {
          "text": "Summer Collection 2024",
          "fontSize": 72,
          "fontFamily": "Arial",
          "fontWeight": "bold",
          "fontStyle": "normal",
          "textDecoration": "none",
          "color": "#000000",
          "textAlign": "center",
          "lineHeight": 1.2,
          "letterSpacing": 0
        }
      },
      {
        "id": "layer-text-subtitle-2",
        "type": "text",
        "name": "Subtitle",
        "x": 100,
        "y": 480,
        "width": 880,
        "height": 100,
        "rotation": 0,
        "z": 4,
        "opacity": 100,
        "visible": true,
        "locked": false,
        "content": {
          "text": "Exclusive Offers Up to 70% Off",
          "fontSize": 36,
          "fontFamily": "Arial",
          "fontWeight": "normal",
          "fontStyle": "italic",
          "textDecoration": "none",
          "color": "#666666",
          "textAlign": "center",
          "lineHeight": 1.3
        }
      },
      {
        "id": "layer-image-hero-3",
        "type": "image",
        "name": "Hero Image",
        "x": 100,
        "y": 100,
        "width": 880,
        "height": 200,
        "rotation": 0,
        "z": 3,
        "opacity": 100,
        "visible": true,
        "locked": false,
        "src": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCADIAMgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWm5ybnJ2eoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//Z",
        "filters": {
          "brightness": 100,
          "contrast": 100,
          "saturation": 100,
          "blur": 0
        },
        "cornerRadius": 10
      },
      {
        "id": "layer-shape-button-4",
        "type": "shape",
        "name": "CTA Button",
        "x": 300,
        "y": 800,
        "width": 480,
        "height": 80,
        "rotation": 0,
        "z": 2,
        "opacity": 100,
        "visible": true,
        "locked": false,
        "shapeType": "rectangle",
        "fill": {
          "type": "color",
          "color": "#FF6B6B"
        },
        "stroke": {
          "color": "#CC0000",
          "width": 2,
          "style": "solid"
        },
        "borderRadius": 40
      },
      {
        "id": "layer-text-button-5",
        "type": "text",
        "name": "Button Text",
        "x": 300,
        "y": 800,
        "width": 480,
        "height": 80,
        "rotation": 0,
        "z": 3,
        "opacity": 100,
        "visible": true,
        "locked": false,
        "content": {
          "text": "SHOP NOW",
          "fontSize": 40,
          "fontFamily": "Arial",
          "fontWeight": "900",
          "fontStyle": "normal",
          "textDecoration": "none",
          "color": "#FFFFFF",
          "textAlign": "center",
          "lineHeight": 2
        }
      }
    ],
    "canvasSize": {
      "width": 1080,
      "height": 1080
    },
    "zoom": 100,
    "pan": {
      "x": 0,
      "y": 0
    },
    "canvasBgColor": "#ffffff",
    "canvasBgImage": null,
    "savedAt": "2024-02-14T10:30:00.000Z"
  }
}
```

---

## 2. UPDATE DESIGN - Complete Request

**Sent when user edits and saves existing design**

```json
{
  "layers": [
    {
      "id": "layer-background-1",
      "type": "shape",
      "name": "Background",
      "x": 0,
      "y": 0,
      "width": 1080,
      "height": 1080,
      "rotation": 0,
      "z": 0,
      "opacity": 100,
      "visible": true,
      "locked": false,
      "shapeType": "rectangle",
      "fill": {
        "type": "color",
        "color": "#f0f0f0"
      },
      "stroke": {
        "color": "#000000",
        "width": 1,
        "style": "solid"
      },
      "borderRadius": 0
    },
    {
      "id": "layer-text-title-1",
      "type": "text",
      "name": "Main Title",
      "x": 100,
      "y": 350,
      "width": 880,
      "height": 150,
      "rotation": 5,
      "z": 5,
      "opacity": 95,
      "visible": true,
      "locked": false,
      "content": {
        "text": "Updated Summer Collection 2024",
        "fontSize": 72,
        "fontFamily": "Arial",
        "fontWeight": "bold",
        "fontStyle": "normal",
        "textDecoration": "none",
        "color": "#1a1a1a",
        "textAlign": "center",
        "lineHeight": 1.2
      }
    }
  ],
  "canvasSize": {
    "width": 1080,
    "height": 1080
  },
  "zoom": 110,
  "pan": {
    "x": 50,
    "y": -25
  },
  "canvasBgColor": "#f0f0f0",
  "canvasBgImage": null,
  "savedAt": "2024-02-14T10:45:00.000Z"
}
```

---

## 3. ALL LAYER TYPES - Detailed Examples

### 3.1 Text Layer - Complete Properties

```json
{
  "id": "text-layer-001",
  "type": "text",
  "name": "Sample Text",
  "x": 100,
  "y": 100,
  "width": 400,
  "height": 100,
  "rotation": 0,
  "z": 5,
  "opacity": 100,
  "visible": true,
  "locked": false,
  "content": {
    "text": "This is sample text content",
    "fontSize": 24,
    "fontFamily": "Arial",
    "fontWeight": "normal",
    "fontStyle": "normal",
    "textDecoration": "none",
    "color": "#000000",
    "textAlign": "left",
    "lineHeight": 1.5,
    "letterSpacing": 0,
    "shadow": {
      "offsetX": 0,
      "offsetY": 0,
      "blur": 0,
      "color": "rgba(0,0,0,0.5)"
    }
  }
}
```

### 3.2 Shape Layer - Rectangle

```json
{
  "id": "shape-rect-001",
  "type": "shape",
  "name": "Blue Rectangle",
  "x": 50,
  "y": 50,
  "width": 300,
  "height": 200,
  "rotation": 0,
  "z": 2,
  "opacity": 100,
  "visible": true,
  "locked": false,
  "shapeType": "rectangle",
  "fill": {
    "type": "color",
    "color": "#3b82f6"
  },
  "stroke": {
    "color": "#1e40af",
    "width": 3,
    "style": "solid"
  },
  "borderRadius": 10,
  "shadow": {
    "offsetX": 2,
    "offsetY": 2,
    "blur": 4,
    "color": "rgba(0,0,0,0.3)"
  }
}
```

### 3.3 Shape Layer - Circle

```json
{
  "id": "shape-circle-002",
  "type": "shape",
  "name": "Red Circle",
  "x": 400,
  "y": 100,
  "width": 150,
  "height": 150,
  "rotation": 0,
  "z": 3,
  "opacity": 85,
  "visible": true,
  "locked": false,
  "shapeType": "circle",
  "fill": {
    "type": "color",
    "color": "#ef4444"
  },
  "stroke": {
    "color": "#991b1b",
    "width": 2,
    "style": "dashed"
  }
}
```

### 3.4 Shape Layer - Triangle

```json
{
  "id": "shape-triangle-003",
  "type": "shape",
  "name": "Green Triangle",
  "x": 200,
  "y": 350,
  "width": 200,
  "height": 200,
  "rotation": 15,
  "z": 2,
  "opacity": 100,
  "visible": true,
  "locked": false,
  "shapeType": "triangle",
  "fill": {
    "type": "color",
    "color": "#10b981"
  },
  "stroke": {
    "color": "#065f46",
    "width": 2,
    "style": "solid"
  }
}
```

### 3.5 Image Layer

```json
{
  "id": "image-layer-001",
  "type": "image",
  "name": "Product Photo",
  "x": 100,
  "y": 100,
  "width": 500,
  "height": 400,
  "rotation": 0,
  "z": 2,
  "opacity": 100,
  "visible": true,
  "locked": false,
  "src": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABg...",
  "filters": {
    "brightness": 100,
    "contrast": 100,
    "saturation": 100,
    "blur": 0,
    "hueRotate": 0,
    "sepia": 0
  },
  "cornerRadius": 8,
  "stroke": {
    "color": "#000000",
    "width": 2,
    "style": "solid"
  },
  "shadow": {
    "offsetX": 4,
    "offsetY": 4,
    "blur": 8,
    "color": "rgba(0,0,0,0.3)"
  }
}
```

### 3.6 Drawing Layer

```json
{
  "id": "drawing-layer-001",
  "type": "drawing",
  "name": "Hand Drawn",
  "x": 100,
  "y": 100,
  "width": 600,
  "height": 400,
  "z": 1,
  "opacity": 100,
  "visible": true,
  "locked": false,
  "pathData": "M10 10 L20 20 L30 10 Q40 5 50 15 T70 10",
  "brushColor": "#000000",
  "brushSize": 3,
  "brushOpacity": 100,
  "drawingMode": "brush"
}
```

---

## 4. COMPLETE PROJECT OBJECT - In Database After Save

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "title": "My Awesome Design",
  "desc": "A beautiful canvas design for social media",
  "icon": "🎨",
  "category": "Social Media",
  "status": "Active",
  "tags": ["social", "design", "marketing"],
  "thumbnail": null,
  "designColor": "#ffffff",
  "design": {
    "layers": [
      {
        "id": "layer-background-1",
        "type": "shape",
        "name": "Background",
        "x": 0,
        "y": 0,
        "width": 1080,
        "height": 1080,
        "rotation": 0,
        "z": 0,
        "opacity": 100,
        "visible": true,
        "locked": false,
        "shapeType": "rectangle",
        "fill": {
          "type": "color",
          "color": "#ffffff"
        },
        "stroke": {
          "color": "#000000",
          "width": 0,
          "style": "solid"
        },
        "borderRadius": 0
      }
    ],
    "canvasSize": {
      "width": 1080,
      "height": 1080
    },
    "zoom": 100,
    "pan": {
      "x": 0,
      "y": 0
    },
    "canvasBgColor": "#ffffff",
    "canvasBgImage": null,
    "savedAt": "2024-02-14T10:30:00.000Z"
  },
  "collaborators": [
    {
      "userId": "507f1f77bcf86cd799439013",
      "role": "editor"
    }
  ],
  "history": [
    {
      "version": 1,
      "design": {
        "layers": [],
        "canvasSize": {"width": 1080, "height": 1080},
        "zoom": 100,
        "pan": {"x": 0, "y": 0}
      },
      "modifiedBy": "507f1f77bcf86cd799439011",
      "modifiedAt": "2024-02-14T10:00:00.000Z",
      "changes": "Initial creation"
    }
  ],
  "createdAt": "2024-02-14T10:00:00.000Z",
  "updatedAt": "2024-02-14T10:30:00.000Z"
}
```

---

## 5. DATABASE SCHEMA - By Field Type

Use this to understand what data types to store:

### Project Schema Fields

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `_id` | ObjectId | "507f1f77bcf86cd799439011" | Auto-generated unique ID |
| `userId` | ObjectId | "507f1f77bcf86cd799439012" | Reference to User collection |
| `title` | String | "My Design" | Max 200 chars, required |
| `desc` | String | "Description here" | Max 1000 chars |
| `icon` | String | "🎨" | Emoji or text |
| `category` | String | "Social Media" | Enum: Social Media, Presentation, Print, etc |
| `status` | String | "Active" | Enum: Draft, Active, Archived, Deleted |
| `tags` | Array[String] | ["social", "design"] | Array of tags |
| `thumbnail` | String | null or base64 | Small image preview |
| `designColor` | String | "#ffffff" | Hex color code |
| `design` | Object | {} | Nested design object |
| `design.layers` | Array[Object] | [...] | Array of layers |
| `design.canvasSize` | Object | {width: 1080, height: 1080} | Canvas dimensions |
| `design.zoom` | Number | 100 | Percentage, 1-500 |
| `design.pan` | Object | {x: 0, y: 0} | Pan offset |
| `design.canvasBgColor` | String | "#ffffff" | Hex color |
| `design.canvasBgImage` | String | null | URL or base64 |
| `design.savedAt` | Date | "2024-02-14T..." | ISO timestamp |
| `collaborators` | Array[Object] | [...] | Array of collaborators |
| `history` | Array[Object] | [...] | Version history |
| `createdAt` | Date | "2024-02-14T..." | ISO timestamp |
| `updatedAt` | Date | "2024-02-14T..." | ISO timestamp |

### Layer Schema Fields

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `id` | String | "layer-001" | Must be unique within project |
| `type` | String | "text" | Enum: text, shape, image, drawing, group |
| `name` | String | "Title" | Display name |
| `x` | Number | 100 | X coordinate in pixels |
| `y` | Number | 100 | Y coordinate in pixels |
| `width` | Number | 300 | Width in pixels |
| `height` | Number | 200 | Height in pixels |
| `rotation` | Number | 0 | Rotation in degrees (0-360) |
| `z` | Number | 5 | Stacking order (0-1000) |
| `opacity` | Number | 100 | Percentage (0-100) |
| `visible` | Boolean | true | Is layer shown? |
| `locked` | Boolean | false | Can user edit? |
| `content` | Object | {...} | For text layers only |
| `shapeType` | String | "rectangle" | For shape layers only |
| `fill` | Object | {...} | For shape layers only |
| `stroke` | Object | {...} | For shape/image layers |
| `src` | String | "data:image/..." | For image layers only |
| `filters` | Object | {...} | For image layers only |
| `cornerRadius` | Number | 8 | For image layers |
| `borderRadius` | Number | 10 | For shape layers |
| `shadow` | Object | {...} | Optional shadow effect |
| `pathData` | String | "M10 10..." | For drawing layers only |
| `brushColor` | String | "#000000" | For drawing layers only |
| `brushSize` | Number | 3 | For drawing layers only |
| `brushOpacity` | Number | 100 | For drawing layers only |

---

## 6. CONTENT OBJECT (Text Layer)

```json
{
  "text": "Sample text content",
  "fontSize": 24,
  "fontFamily": "Arial",
  "fontWeight": "normal",
  "fontStyle": "normal",
  "textDecoration": "none",
  "color": "#000000",
  "textAlign": "left",
  "lineHeight": 1.5,
  "letterSpacing": 0
}
```

**Content Field Types:**
- `text`: String
- `fontSize`: Number (8-200)
- `fontFamily`: String (Arial, Georgia, Helvetica, etc)
- `fontWeight`: String (normal, bold, 900, 700, etc)
- `fontStyle`: String (normal, italic)
- `textDecoration`: String (none, underline, line-through)
- `color`: String (hex color #000000)
- `textAlign`: String (left, center, right, justify)
- `lineHeight`: Number (1.0-3.0)
- `letterSpacing`: Number in pixels

---

## 7. FILL OBJECT (Shape Layer)

### Type: Color
```json
{
  "type": "color",
  "color": "#FF0000"
}
```

### Type: Gradient
```json
{
  "type": "gradient",
  "gradient": {
    "type": "linear",
    "angle": 45,
    "stops": [
      { "color": "#FF0000", "position": 0 },
      { "color": "#0000FF", "position": 100 }
    ]
  }
}
```

### Type: Image
```json
{
  "type": "image",
  "image": "data:image/png;base64/...",
  "fit": "cover"
}
```

---

## 8. STROKE OBJECT

```json
{
  "color": "#000000",
  "width": 2,
  "style": "solid"
}
```

**Stroke Fields:**
- `color`: String (hex #000000)
- `width`: Number (0-20 pixels)
- `style`: String (solid, dashed, dotted)

---

## 9. FILTERS OBJECT (Image Layer)

```json
{
  "brightness": 100,
  "contrast": 100,
  "saturation": 100,
  "blur": 0,
  "hueRotate": 0,
  "sepia": 0
}
```

**Filter Fields:**
- `brightness`: Number (50-150)
- `contrast`: Number (50-150)
- `saturation`: Number (0-200)
- `blur`: Number (0-50 pixels)
- `hueRotate`: Number (0-360 degrees)
- `sepia`: Number (0-100)

---

## 10. SHADOW OBJECT (Optional)

```json
{
  "offsetX": 2,
  "offsetY": 2,
  "blur": 4,
  "color": "rgba(0,0,0,0.5)"
}
```

**Shadow Fields:**
- `offsetX`: Number (pixels)
- `offsetY`: Number (pixels)
- `blur`: Number (0-20 pixels)
- `color`: String (rgba or hex)

---

## 11. RESPONSE FORMAT - From Backend

### Success Response

```json
{
  "success": true,
  "message": "Project created successfully",
  "project": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "My Design",
    "design": {
      "layers": [...],
      "canvasSize": {"width": 1080, "height": 1080},
      "zoom": 100,
      "pan": {"x": 0, "y": 0}
    },
    "createdAt": "2024-02-14T10:00:00.000Z",
    "updatedAt": "2024-02-14T10:00:00.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "title": "Title is required",
    "design.layers": "Layers must be an array"
  },
  "statusCode": 400
}
```

---

## 12. MINIMAL EXAMPLE - For Quick Testing

```json
{
  "title": "Test Design",
  "desc": "Quick test",
  "category": "General",
  "status": "Active",
  "design": {
    "layers": [
      {
        "id": "l1",
        "type": "shape",
        "name": "BG",
        "x": 0,
        "y": 0,
        "width": 800,
        "height": 600,
        "rotation": 0,
        "z": 0,
        "opacity": 100,
        "visible": true,
        "locked": false,
        "shapeType": "rectangle",
        "fill": {"type": "color", "color": "#ffffff"},
        "stroke": {"color": "#000000", "width": 0, "style": "solid"}
      },
      {
        "id": "l2",
        "type": "text",
        "name": "Title",
        "x": 100,
        "y": 250,
        "width": 600,
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
}
```

---

## SUMMARY - What Backend Developer Needs to Know

**Store these field types:**

| Type | Examples |
|------|----------|
| **ObjectId** | _id, userId |
| **String** | title, text, color, fontFamily, etc |
| **Number** | x, y, width, height, fontSize, opacity, rotation, z |
| **Boolean** | visible, locked |
| **Date** | createdAt, updatedAt |
| **Array** | layers, tags, collaborators, history |
| **Object** | design, content, fill, stroke, filters, canvasSize, pan |

**Structure:** Everything is nested under `design` object, and `layers` is an array of objects.

**Key Constraints:**
- Layer IDs must be unique
- Z-index values control stacking order (higher = on top)
- Opacity is 0-100
- All coordinates are in pixels
- Colors are hex format (#RRGGBB)
- Use ISO date format for timestamps

Copy these JSON examples to your backend developer - they have everything needed to create the MongoDB schema!

