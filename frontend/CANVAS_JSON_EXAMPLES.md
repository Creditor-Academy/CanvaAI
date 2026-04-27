# Canvas Data - JSON Examples & Quick Reference

This document contains ready-to-use JSON examples for all canvas data scenarios.

---

## Quick Reference: senddata to Backend

### Minimal Example - Simple Text Design

```json
{
  "title": "Welcome Card",
  "desc": "A simple welcome card",
  "icon": "👋",
  "category": "Greeting",
  "status": "Active",
  "design": {
    "layers": [
      {
        "id": "bg-1",
        "type": "shape",
        "name": "Background",
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
        "fill": {
          "type": "color",
          "color": "#ffffff"
        },
        "stroke": {
          "color": "#cccccc",
          "width": 1,
          "style": "solid"
        }
      },
      {
        "id": "text-1",
        "type": "text",
        "name": "Title Text",
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
          "text": "Welcome!",
          "fontSize": 72,
          "fontFamily": "Arial",
          "fontWeight": "bold",
          "fontStyle": "normal",
          "textDecoration": "none",
          "color": "#000000",
          "textAlign": "center",
          "lineHeight": 1.2
        }
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
    "canvasBgImage": null
  }
}
```

---

## Scenario 1: Multiple Text Layers

**When**: User creates design with multiple text elements

```json
{
  "layers": [
    {
      "id": "text-heading",
      "type": "text",
      "name": "Heading",
      "x": 50,
      "y": 50,
      "width": 700,
      "height": 80,
      "rotation": 0,
      "z": 10,
      "opacity": 100,
      "visible": true,
      "locked": false,
      "content": {
        "text": "Main Headline",
        "fontSize": 64,
        "fontFamily": "Arial Black",
        "fontWeight": "900",
        "fontStyle": "normal",
        "textDecoration": "none",
        "color": "#1a1a1a",
        "textAlign": "center",
        "lineHeight": 1.1
      }
    },
    {
      "id": "text-subheading",
      "type": "text",
      "name": "Subheading",
      "x": 50,
      "y": 140,
      "width": 700,
      "height": 40,
      "rotation": 0,
      "z": 9,
      "opacity": 100,
      "visible": true,
      "locked": false,
      "content": {
        "text": "This is the subheading text",
        "fontSize": 24,
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
      "id": "text-body",
      "type": "text",
      "name": "Body Text",
      "x": 100,
      "y": 250,
      "width": 600,
      "height": 250,
      "rotation": 0,
      "z": 8,
      "opacity": 100,
      "visible": true,
      "locked": false,
      "content": {
        "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        "fontSize": 14,
        "fontFamily": "Georgia",
        "fontWeight": "normal",
        "fontStyle": "normal",
        "textDecoration": "none",
        "color": "#333333",
        "textAlign": "left",
        "lineHeight": 1.5
      }
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
  }
}
```

---

## Scenario 2: Shapes with Styling

**When**: User adds rectangles, circles, triangles with colors and strokes

```json
{
  "layers": [
    {
      "id": "shape-rect-1",
      "type": "shape",
      "name": "Blue Rectangle",
      "x": 50,
      "y": 50,
      "width": 300,
      "height": 200,
      "rotation": 0,
      "z": 5,
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
      "borderRadius": 10
    },
    {
      "id": "shape-circle-1",
      "type": "shape",
      "name": "Red Circle",
      "x": 450,
      "y": 100,
      "width": 150,
      "height": 150,
      "rotation": 0,
      "z": 4,
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
    },
    {
      "id": "shape-triangle-1",
      "type": "shape",
      "name": "Green Triangle",
      "x": 200,
      "y": 350,
      "width": 200,
      "height": 200,
      "rotation": 15,
      "z": 3,
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
  ],
  "canvasSize": {
    "width": 800,
    "height": 600
  },
  "zoom": 100,
  "pan": {
    "x": 0,
    "y": 0
  }
}
```

---

## Scenario 3: Multiple Images

**When**: User adds multiple images to canvas

```json
{
  "layers": [
    {
      "id": "img-hero",
      "type": "image",
      "name": "Hero Image",
      "x": 0,
      "y": 0,
      "width": 800,
      "height": 400,
      "rotation": 0,
      "z": 2,
      "opacity": 100,
      "visible": true,
      "locked": false,
      "src": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWm5ybnJ2eoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/9k=",
      "filters": {
        "brightness": 100,
        "contrast": 100,
        "saturation": 100,
        "blur": 0
      },
      "cornerRadius": 0
    },
    {
      "id": "img-profile",
      "type": "image",
      "name": "Profile Picture",
      "x": 600,
      "y": 420,
      "width": 120,
      "height": 120,
      "rotation": 0,
      "z": 3,
      "opacity": 100,
      "visible": true,
      "locked": false,
      "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "filters": {
        "brightness": 110,
        "contrast": 105,
        "saturation": 100,
        "blur": 0
      },
      "cornerRadius": 60
    },
    {
      "id": "img-icon",
      "type": "image",
      "name": "Icon",
      "x": 100,
      "y": 480,
      "width": 64,
      "height": 64,
      "rotation": 45,
      "z": 3,
      "opacity": 80,
      "visible": true,
      "locked": false,
      "src": "data:image/svg+xml;base64,...",
      "filters": {
        "brightness": 100,
        "contrast": 100,
        "saturation": 100,
        "blur": 0
      },
      "cornerRadius": 0
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
  }
}
```

---

## Scenario 4: Complex Design with Mixed Elements

**When**: User creates professional design with text, shapes, and images

```json
{
  "title": "Marketing Poster",
  "desc": "Summer Sales Marketing Poster",
  "icon": "📢",
  "category": "Marketing",
  "status": "Active",
  "design": {
    "layers": [
      {
        "id": "bg-gradient",
        "type": "shape",
        "name": "Background Gradient",
        "x": 0,
        "y": 0,
        "width": 1080,
        "height": 1350,
        "rotation": 0,
        "z": 0,
        "opacity": 100,
        "visible": true,
        "locked": true,
        "shapeType": "rectangle",
        "fill": {
          "type": "gradient",
          "gradient": {
            "type": "linear",
            "angle": 45,
            "stops": [
              { "color": "#FF6B6B", "position": 0 },
              { "color": "#FFE66D", "position": 100 }
            ]
          }
        },
        "stroke": null
      },
      {
        "id": "img-product",
        "type": "image",
        "name": "Product Image",
        "x": 150,
        "y": 100,
        "width": 780,
        "height": 600,
        "rotation": 0,
        "z": 1,
        "opacity": 100,
        "visible": true,
        "locked": false,
        "src": "data:image/jpeg;base64,...",
        "filters": {
          "brightness": 105,
          "contrast": 110,
          "saturation": 120,
          "blur": 0
        },
        "cornerRadius": 20
      },
      {
        "id": "shape-badge",
        "type": "shape",
        "name": "Sale Badge",
        "x": 700,
        "y": 150,
        "width": 150,
        "height": 150,
        "rotation": 0,
        "z": 2,
        "opacity": 100,
        "visible": true,
        "locked": false,
        "shapeType": "circle",
        "fill": {
          "type": "color",
          "color": "#FF0000"
        },
        "stroke": {
          "color": "#FFFFFF",
          "width": 5,
          "style": "solid"
        }
      },
      {
        "id": "text-discount",
        "type": "text",
        "name": "50% OFF",
        "x": 700,
        "y": 150,
        "width": 150,
        "height": 150,
        "rotation": 0,
        "z": 3,
        "opacity": 100,
        "visible": true,
        "locked": false,
        "content": {
          "text": "50%\nOFF",
          "fontSize": 48,
          "fontFamily": "Arial",
          "fontWeight": "900",
          "fontStyle": "normal",
          "textDecoration": "none",
          "color": "#FFFFFF",
          "textAlign": "center",
          "lineHeight": 1.0
        }
      },
      {
        "id": "text-headline",
        "type": "text",
        "name": "Summer Sale",
        "x": 100,
        "y": 750,
        "width": 880,
        "height": 150,
        "rotation": 0,
        "z": 2,
        "opacity": 100,
        "visible": true,
        "locked": false,
        "content": {
          "text": "SUMMER SALE COLLECTION",
          "fontSize": 84,
          "fontFamily": "Arial Black",
          "fontWeight": "900",
          "fontStyle": "normal",
          "textDecoration": "none",
          "color": "#FFFFFF",
          "textAlign": "center",
          "lineHeight": 1.0,
          "shadow": {
            "offsetX": 2,
            "offsetY": 2,
            "blur": 4,
            "color": "rgba(0,0,0,0.5)"
          }
        }
      },
      {
        "id": "text-subheadline",
        "type": "text",
        "name": "Limited Time",
        "x": 100,
        "y": 920,
        "width": 880,
        "height": 80,
        "rotation": 0,
        "z": 2,
        "opacity": 100,
        "visible": true,
        "locked": false,
        "content": {
          "text": "Limited Time Offer - Up to 70% Off on Selected Items",
          "fontSize": 32,
          "fontFamily": "Arial",
          "fontWeight": "bold",
          "fontStyle": "normal",
          "textDecoration": "none",
          "color": "#FFFFFF",
          "textAlign": "center",
          "lineHeight": 1.3
        }
      },
      {
        "id": "shape-cta-btn",
        "type": "shape",
        "name": "CTA Button",
        "x": 300,
        "y": 1100,
        "width": 480,
        "height": 80,
        "rotation": 0,
        "z": 1,
        "opacity": 100,
        "visible": true,
        "locked": false,
        "shapeType": "rectangle",
        "fill": {
          "type": "color",
          "color": "#FFFFFF"
        },
        "stroke": null,
        "borderRadius": 40
      },
      {
        "id": "text-cta",
        "type": "text",
        "name": "Shop Now",
        "x": 300,
        "y": 1100,
        "width": 480,
        "height": 80,
        "rotation": 0,
        "z": 2,
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
          "color": "#FF6B6B",
          "textAlign": "center",
          "lineHeight": 2.0
        }
      }
    ],
    "canvasSize": {
      "width": 1080,
      "height": 1350
    },
    "zoom": 75,
    "pan": {
      "x": 0,
      "y": 0
    },
    "canvasBgColor": "#ffffff",
    "canvasBgImage": null
  }
}
```

---

## Scenario 5: Design Update (Partial Data)

**When**: User moves or edits existing layer

```json
{
  "layers": [
    {
      "id": "text-1",
      "type": "text",
      "name": "Title Text",
      "x": 150,
      "y": 200,
      "width": 600,
      "height": 100,
      "rotation": 5,
      "z": 1,
      "opacity": 95,
      "visible": true,
      "locked": false,
      "content": {
        "text": "Updated Title",
        "fontSize": 64,
        "fontFamily": "Arial",
        "fontWeight": "bold",
        "color": "#1a5490",
        "textAlign": "center"
      }
    }
  ],
  "canvasSize": {
    "width": 800,
    "height": 600
  },
  "zoom": 110,
  "pan": {
    "x": 50,
    "y": -25
  }
}
```

---

## Scenario 6: Multi-Page Design

**When**: User creates presentation or multi-page document

```json
{
  "title": "Product Presentation",
  "desc": "Complete product presentation deck",
  "icon": "📊",
  "category": "Presentation",
  "status": "Active",
  "pages": [
    {
      "id": "page-1",
      "name": "Title Slide",
      "design": {
        "layers": [
          {
            "id": "bg-1",
            "type": "shape",
            "name": "Background",
            "x": 0,
            "y": 0,
            "width": 1920,
            "height": 1080,
            "z": 0,
            "fill": { "type": "color", "color": "#003366" },
            "stroke": null
          },
          {
            "id": "text-title",
            "type": "text",
            "name": "Title",
            "x": 200,
            "y": 400,
            "width": 1520,
            "height": 150,
            "z": 1,
            "content": {
              "text": "Product Launch 2024",
              "fontSize": 96,
              "fontFamily": "Arial Black",
              "fontWeight": "900",
              "color": "#FFFFFF",
              "textAlign": "center"
            }
          }
        ],
        "canvasSize": { "width": 1920, "height": 1080 },
        "zoom": 100,
        "pan": { "x": 0, "y": 0 }
      }
    },
    {
      "id": "page-2",
      "name": "Features",
      "design": {
        "layers": [
          {
            "id": "bg-2",
            "type": "shape",
            "name": "Background",
            "x": 0,
            "y": 0,
            "width": 1920,
            "height": 1080,
            "z": 0,
            "fill": { "type": "color", "color": "#FFFFFF" },
            "stroke": null
          },
          {
            "id": "text-features-title",
            "type": "text",
            "name": "Title",
            "x": 200,
            "y": 100,
            "width": 1520,
            "height": 100,
            "z": 1,
            "content": {
              "text": "Key Features",
              "fontSize": 72,
              "fontFamily": "Arial Black",
              "fontWeight": "900",
              "color": "#003366",
              "textAlign": "left"
            }
          }
        ],
        "canvasSize": { "width": 1920, "height": 1080 },
        "zoom": 100,
        "pan": { "x": 0, "y": 0 }
      }
    }
  ]
}
```

---

## Layer Property Reference

### Text Layer Complete Properties

```json
{
  "id": "unique-id",
  "type": "text",
  "name": "Layer Name",
  "x": 100,
  "y": 100,
  "width": 300,
  "height": 100,
  "rotation": 0,
  "z": 5,
  "opacity": 100,
  "visible": true,
  "locked": false,
  "content": {
    "text": "Text content",
    "fontSize": 24,
    "fontFamily": "Arial",
    "fontWeight": "normal|bold|900",
    "fontStyle": "normal|italic",
    "textDecoration": "none|underline|line-through",
    "color": "#000000",
    "textAlign": "left|center|right|justify",
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

### Shape Layer Complete Properties

```json
{
  "id": "unique-id",
  "type": "shape",
  "name": "Layer Name",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 200,
  "rotation": 0,
  "z": 5,
  "opacity": 100,
  "visible": true,
  "locked": false,
  "shapeType": "rectangle|circle|triangle|polygon",
  "fill": {
    "type": "color|image|gradient",
    "color": "#FF0000",
    "image": "url-or-base64",
    "gradient": {
      "type": "linear|radial",
      "angle": 45,
      "stops": [
        { "color": "#FF0000", "position": 0 },
        { "color": "#0000FF", "position": 100 }
      ]
    }
  },
  "stroke": {
    "color": "#000000",
    "width": 2,
    "style": "solid|dashed|dotted"
  },
  "borderRadius": 10,
  "shadow": {
    "offsetX": 0,
    "offsetY": 0,
    "blur": 10,
    "color": "rgba(0,0,0,0.3)"
  }
}
```

### Image Layer Complete Properties

```json
{
  "id": "unique-id",
  "type": "image",
  "name": "Layer Name",
  "x": 100,
  "y": 100,
  "width": 300,
  "height": 300,
  "rotation": 0,
  "z": 5,
  "opacity": 100,
  "visible": true,
  "locked": false,
  "src": "data:image/... or URL",
  "filters": {
    "brightness": 100,
    "contrast": 100,
    "saturation": 100,
    "blur": 0,
    "hueRotate": 0,
    "sepia": 0
  },
  "cornerRadius": 0,
  "stroke": {
    "color": "#000000",
    "width": 0,
    "style": "solid"
  },
  "shadow": {
    "offsetX": 0,
    "offsetY": 0,
    "blur": 0,
    "color": "rgba(0,0,0,0.3)"
  }
}
```

---

## Common Save/Update Patterns

### Pattern 1: User Saves After Editing Text

```javascript
// Frontend sends
{
  "layers": [
    {
      "id": "text-001",
      "type": "text",
      "content": {
        "text": "Updated text content",
        "fontSize": 32,
        "color": "#FF5500"
      },
      // ... other properties
    }
  ],
  "canvasSize": { "width": 800, "height": 600 },
  "zoom": 100,
  "pan": { "x": 0, "y": 0 }
}

// Backend receives and updates project.design
// Backend responds with
{
  "success": true,
  "message": "Design updated successfully",
  "updatedAt": "2024-02-14T10:30:00Z"
}
```

### Pattern 2: User Deletes Layer

```javascript
// Frontend sends layers array WITHOUT the deleted layer
{
  "layers": [
    { "id": "layer-001", ... },
    { "id": "layer-002", ... }
    // layer-003 is deleted (not in array)
  ],
  "canvasSize": { "width": 800, "height": 600 },
  "zoom": 100,
  "pan": { "x": 0, "y": 0 }
}
```

### Pattern 3: User Adds New Layer

```javascript
// Frontend sends with new layer
{
  "layers": [
    { "id": "layer-001", ... },
    { "id": "layer-002", ... },
    {
      "id": "layer-new-003",  // New ID
      "type": "text",
      "name": "New Layer",
      "x": 100,
      "y": 100,
      // ... all properties
    }
  ],
  "canvasSize": { "width": 800, "height": 600 },
  "zoom": 100,
  "pan": { "x": 0, "y": 0 }
}
```

---

## Error Response Examples

### Example 1: Validation Error

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "layers": "Layers must be an array",
    "canvasSize.width": "Width must be a positive number"
  },
  "statusCode": 400
}
```

### Example 2: Authentication Error

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "statusCode": 401
}
```

### Example 3: Server Error

```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Failed to save design",
  "statusCode": 500
}
```

---

## Tips for Backend Developer

1. **Always validate layer structure**
   - Check `id` is unique
   - Check `type` is valid (text|shape|image|drawing)
   - Check required properties exist

2. **Handle base64 images**
   - Images are sent as base64 strings
   - Consider storing them separately or compressing

3. **Store timestamp**
   - Always add `savedAt` or `lastModified` timestamp
   - Useful for version history

4. **Index layers by z-order**
   - The `z` property determines stacking order
   - Store in correct order for rendering

5. **Validate coordinates**
   - Ensure x, y, width, height are valid numbers
   - Check they're within reasonable bounds

6. **Use middleware for auth**
   - All endpoints should require `Authorization` header
   - Validate token and check user ownership

7. **Consider pagination for large designs**
   - If design has 100+ layers, consider pagination
   - Return layer count in response

8. **Implement soft delete**
   - Don't permanently delete designs
   - Mark as "deleted" with timestamp
   - Allow recovery within 30 days

9. **Add design versioning**
   - Keep history of changes
   - Allow undo/restore functionality

10. **Optimize storage**
    - Compress base64 images
    - Store image references instead of full data
    - Consider cloud storage (S3, Firebase, etc.)

