/**
 * JSON Format Data - Canvas Editor
 * Complete JSON examples for all canvas data scenarios
 * Use these as reference for backend developer schema design
 */

// ============================================================================
//  1. CREATE PROJECT - Complete Request with All Elements
// ============================================================================
export const CREATE_PROJECT_FULL = {
    title: "My Awesome Design",
    desc: "A beautiful canvas design for social media",
    icon: "🎨",
    category: "Social Media",
    status: "Active",
    tags: ["social", "design", "marketing"],
    design: {
        layers: [
            {
                id: "layer-background-1",
                type: "shape",
                name: "Background",
                x: 0,
                y: 0,
                width: 1080,
                height: 1080,
                rotation: 0,
                z: 0,
                opacity: 100,
                visible: true,
                locked: false,
                shapeType: "rectangle",
                fill: {
                    type: "color",
                    color: "#ffffff"
                },
                stroke: {
                    color: "#000000",
                    width: 0,
                    style: "solid"
                },
                borderRadius: 0
            },
            {
                id: "layer-text-title-1",
                type: "text",
                name: "Main Title",
                x: 100,
                y: 300,
                width: 880,
                height: 150,
                rotation: 0,
                z: 5,
                opacity: 100,
                visible: true,
                locked: false,
                content: {
                    text: "Summer Collection 2024",
                    fontSize: 72,
                    fontFamily: "Arial",
                    fontWeight: "bold",
                    fontStyle: "normal",
                    textDecoration: "none",
                    color: "#000000",
                    textAlign: "center",
                    lineHeight: 1.2,
                    letterSpacing: 0
                }
            },
            {
                id: "layer-text-subtitle-2",
                type: "text",
                name: "Subtitle",
                x: 100,
                y: 480,
                width: 880,
                height: 100,
                rotation: 0,
                z: 4,
                opacity: 100,
                visible: true,
                locked: false,
                content: {
                    text: "Exclusive Offers Up to 70% Off",
                    fontSize: 36,
                    fontFamily: "Arial",
                    fontWeight: "normal",
                    fontStyle: "italic",
                    textDecoration: "none",
                    color: "#666666",
                    textAlign: "center",
                    lineHeight: 1.3
                }
            },
            {
                id: "layer-image-hero-3",
                type: "image",
                name: "Hero Image",
                x: 100,
                y: 100,
                width: 880,
                height: 200,
                rotation: 0,
                z: 3,
                opacity: 100,
                visible: true,
                locked: false,
                src: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCADIAMgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL",
                filters: {
                    brightness: 100,
                    contrast: 100,
                    saturation: 100,
                    blur: 0
                },
                cornerRadius: 10
            },
            {
                id: "layer-shape-button-4",
                type: "shape",
                name: "CTA Button",
                x: 300,
                y: 800,
                width: 480,
                height: 80,
                rotation: 0,
                z: 2,
                opacity: 100,
                visible: true,
                locked: false,
                shapeType: "rectangle",
                fill: {
                    type: "color",
                    color: "#FF6B6B"
                },
                stroke: {
                    color: "#CC0000",
                    width: 2,
                    style: "solid"
                },
                borderRadius: 40
            },
            {
                id: "layer-text-button-5",
                type: "text",
                name: "Button Text",
                x: 300,
                y: 800,
                width: 480,
                height: 80,
                rotation: 0,
                z: 3,
                opacity: 100,
                visible: true,
                locked: false,
                content: {
                    text: "SHOP NOW",
                    fontSize: 40,
                    fontFamily: "Arial",
                    fontWeight: "900",
                    fontStyle: "normal",
                    textDecoration: "none",
                    color: "#FFFFFF",
                    textAlign: "center",
                    lineHeight: 2
                }
            }
        ],
        canvasSize: {
            width: 1080,
            height: 1080
        },
        zoom: 100,
        pan: {
            x: 0,
            y: 0
        },
        canvasBgColor: "#ffffff",
        canvasBgImage: null,
        savedAt: "2024-02-14T10:30:00.000Z"
    }
};

// ============================================================================
//  2. UPDATE DESIGN - Request When Editing Existing Design
// ============================================================================
export const UPDATE_DESIGN = {
    layers: [
        {
            id: "layer-background-1",
            type: "shape",
            name: "Background",
            x: 0,
            y: 0,
            width: 1080,
            height: 1080,
            rotation: 0,
            z: 0,
            opacity: 100,
            visible: true,
            locked: false,
            shapeType: "rectangle",
            fill: {
                type: "color",
                color: "#f0f0f0"
            },
            stroke: {
                color: "#000000",
                width: 1,
                style: "solid"
            },
            borderRadius: 0
        },
        {
            id: "layer-text-title-1",
            type: "text",
            name: "Main Title",
            x: 100,
            y: 350,
            width: 880,
            height: 150,
            rotation: 5,
            z: 5,
            opacity: 95,
            visible: true,
            locked: false,
            content: {
                text: "Updated Summer Collection 2024",
                fontSize: 72,
                fontFamily: "Arial",
                fontWeight: "bold",
                fontStyle: "normal",
                textDecoration: "none",
                color: "#1a1a1a",
                textAlign: "center",
                lineHeight: 1.2
            }
        }
    ],
    canvasSize: {
        width: 1080,
        height: 1080
    },
    zoom: 110,
    pan: {
        x: 50,
        y: -25
    },
    canvasBgColor: "#f0f0f0",
    canvasBgImage: null,
    savedAt: "2024-02-14T10:45:00.000Z"
};

// ============================================================================
//  3. TEXT LAYER - Complete
// ============================================================================
export const TEXT_LAYER = {
    id: "text-layer-001",
    type: "text",
    name: "Sample Text",
    x: 100,
    y: 100,
    width: 400,
    height: 100,
    rotation: 0,
    z: 5,
    opacity: 100,
    visible: true,
    locked: false,
    content: {
        text: "This is sample text content",
        fontSize: 24,
        fontFamily: "Arial",
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none",
        color: "#000000",
        textAlign: "left",
        lineHeight: 1.5,
        letterSpacing: 0,
        shadow: {
            offsetX: 0,
            offsetY: 0,
            blur: 0,
            color: "rgba(0,0,0,0.5)"
        }
    }
};

// ============================================================================
//  4. SHAPE LAYER - Rectangle
// ============================================================================
export const SHAPE_RECTANGLE = {
    id: "shape-rect-001",
    type: "shape",
    name: "Blue Rectangle",
    x: 50,
    y: 50,
    width: 300,
    height: 200,
    rotation: 0,
    z: 2,
    opacity: 100,
    visible: true,
    locked: false,
    shapeType: "rectangle",
    fill: {
        type: "color",
        color: "#3b82f6"
    },
    stroke: {
        color: "#1e40af",
        width: 3,
        style: "solid"
    },
    borderRadius: 10,
    shadow: {
        offsetX: 2,
        offsetY: 2,
        blur: 4,
        color: "rgba(0,0,0,0.3)"
    }
};

// ============================================================================
//  5. SHAPE LAYER - Circle
// ============================================================================
export const SHAPE_CIRCLE = {
    id: "shape-circle-002",
    type: "shape",
    name: "Red Circle",
    x: 400,
    y: 100,
    width: 150,
    height: 150,
    rotation: 0,
    z: 3,
    opacity: 85,
    visible: true,
    locked: false,
    shapeType: "circle",
    fill: {
        type: "color",
        color: "#ef4444"
    },
    stroke: {
        color: "#991b1b",
        width: 2,
        style: "dashed"
    }
};

// ============================================================================
//  6. SHAPE LAYER - Triangle
// ============================================================================
export const SHAPE_TRIANGLE = {
    id: "shape-triangle-003",
    type: "shape",
    name: "Green Triangle",
    x: 200,
    y: 350,
    width: 200,
    height: 200,
    rotation: 15,
    z: 2,
    opacity: 100,
    visible: true,
    locked: false,
    shapeType: "triangle",
    fill: {
        type: "color",
        color: "#10b981"
    },
    stroke: {
        color: "#065f46",
        width: 2,
        style: "solid"
    }
};

// ============================================================================
//  7. IMAGE LAYER
// ============================================================================
export const IMAGE_LAYER = {
    id: "image-layer-001",
    type: "image",
    name: "Product Photo",
    x: 100,
    y: 100,
    width: 500,
    height: 400,
    rotation: 0,
    z: 2,
    opacity: 100,
    visible: true,
    locked: false,
    src: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABg...",
    filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        hueRotate: 0,
        sepia: 0
    },
    cornerRadius: 8,
    stroke: {
        color: "#000000",
        width: 2,
        style: "solid"
    },
    shadow: {
        offsetX: 4,
        offsetY: 4,
        blur: 8,
        color: "rgba(0,0,0,0.3)"
    }
};

// ============================================================================
//  8. DRAWING LAYER
// ============================================================================
export const DRAWING_LAYER = {
    id: "drawing-layer-001",
    type: "drawing",
    name: "Hand Drawn",
    x: 100,
    y: 100,
    width: 600,
    height: 400,
    z: 1,
    opacity: 100,
    visible: true,
    locked: false,
    pathData: "M10 10 L20 20 L30 10 Q40 5 50 15 T70 10",
    brushColor: "#000000",
    brushSize: 3,
    brushOpacity: 100,
    drawingMode: "brush"
};

// ============================================================================
//  9. COMPLETE PROJECT OBJECT - In Database
// ============================================================================
export const COMPLETE_PROJECT_IN_DB = {
    _id: "507f1f77bcf86cd799439011",
    userId: "507f1f77bcf86cd799439012",
    title: "My Awesome Design",
    desc: "A beautiful canvas design for social media",
    icon: "🎨",
    category: "Social Media",
    status: "Active",
    tags: ["social", "design", "marketing"],
    thumbnail: null,
    designColor: "#ffffff",
    design: {
        layers: [
            {
                id: "layer-background-1",
                type: "shape",
                name: "Background",
                x: 0,
                y: 0,
                width: 1080,
                height: 1080,
                rotation: 0,
                z: 0,
                opacity: 100,
                visible: true,
                locked: false,
                shapeType: "rectangle",
                fill: {
                    type: "color",
                    color: "#ffffff"
                },
                stroke: {
                    color: "#000000",
                    width: 0,
                    style: "solid"
                },
                borderRadius: 0
            }
        ],
        canvasSize: {
            width: 1080,
            height: 1080
        },
        zoom: 100,
        pan: {
            x: 0,
            y: 0
        },
        canvasBgColor: "#ffffff",
        canvasBgImage: null,
        savedAt: "2024-02-14T10:30:00.000Z"
    },
    collaborators: [
        {
            userId: "507f1f77bcf86cd799439013",
            role: "editor"
        }
    ],
    history: [
        {
            version: 1,
            design: {
                layers: [],
                canvasSize: {
                    width: 1080,
                    height: 1080
                },
                zoom: 100,
                pan: {
                    x: 0,
                    y: 0
                }
            },
            modifiedBy: "507f1f77bcf86cd799439011",
            modifiedAt: "2024-02-14T10:00:00.000Z",
            changes: "Initial creation"
        }
    ],
    createdAt: "2024-02-14T10:00:00.000Z",
    updatedAt: "2024-02-14T10:30:00.000Z"
};

// ============================================================================
//  10. FILL OBJECT VARIATIONS
// ============================================================================
export const FILL_TYPES = {
    color: {
        type: "color",
        color: "#FF0000"
    },
    gradient: {
        type: "gradient",
        gradient: {
            type: "linear",
            angle: 45,
            stops: [
                { color: "#FF0000", position: 0 },
                { color: "#0000FF", position: 100 }
            ]
        }
    },
    image: {
        type: "image",
        image: "data:image/png;base64/...",
        fit: "cover"
    }
};

// ============================================================================
//  11. STROKE OBJECT
// ============================================================================
export const STROKE = {
    color: "#000000",
    width: 2,
    style: "solid"
};

// ============================================================================
//  12. FILTERS OBJECT
// ============================================================================
export const FILTERS = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    hueRotate: 0,
    sepia: 0
};

// ============================================================================
//  13. SHADOW OBJECT
// ============================================================================
export const SHADOW = {
    offsetX: 2,
    offsetY: 2,
    blur: 4,
    color: "rgba(0,0,0,0.3)"
};

// ============================================================================
//  14. CANVAS SIZE - Different Templates
// ============================================================================
export const CANVAS_SIZES = {
    // Social Media
    square: { width: 1080, height: 1080 }, // Instagram Post
    story: { width: 1080, height: 1920 }, // Instagram Story
    reel: { width: 1080, height: 1920 }, // Reel/TikTok
    facebook: { width: 1200, height: 630 }, // Facebook Cover

    // Video
    youtube_thumbnail: { width: 1280, height: 720 },
    youtube_banner: { width: 2560, height: 1440 },

    // Business
    business_card: { width: 1050, height: 600 },
    presentation: { width: 1920, height: 1080 },

    // Print
    poster: { width: 1080, height: 1350 },
    flyer: { width: 850, height: 1100 },
    banner: { width: 1200, height: 300 },

    // Web
    web_hero: { width: 1920, height: 600 },
    web_sidebar: { width: 300, height: 600 }
};

// ============================================================================
//  15. TEXT CONTENT OBJECT
// ============================================================================
export const TEXT_CONTENT = {
    text: "Sample text content",
    fontSize: 24,
    fontFamily: "Arial",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    color: "#000000",
    textAlign: "left",
    lineHeight: 1.5,
    letterSpacing: 0
};

// ============================================================================
//  16. MINIMAL EXAMPLE - Quick Test
// ============================================================================
export const MINIMAL_DESIGN = {
    title: "Test Design",
    desc: "Quick test",
    category: "General",
    status: "Active",
    design: {
        layers: [
            {
                id: "l1",
                type: "shape",
                name: "BG",
                x: 0,
                y: 0,
                width: 800,
                height: 600,
                rotation: 0,
                z: 0,
                opacity: 100,
                visible: true,
                locked: false,
                shapeType: "rectangle",
                fill: { type: "color", color: "#ffffff" },
                stroke: { color: "#000000", width: 0, style: "solid" }
            },
            {
                id: "l2",
                type: "text",
                name: "Title",
                x: 100,
                y: 250,
                width: 600,
                height: 100,
                rotation: 0,
                z: 1,
                opacity: 100,
                visible: true,
                locked: false,
                content: {
                    text: "Hello World",
                    fontSize: 48,
                    fontFamily: "Arial",
                    fontWeight: "bold",
                    color: "#000000",
                    textAlign: "center"
                }
            }
        ],
        canvasSize: { width: 800, height: 600 },
        zoom: 100,
        pan: { x: 0, y: 0 }
    }
};

// ============================================================================
//  17. SUCCESS RESPONSE - From Backend
// ============================================================================
export const SUCCESS_RESPONSE = {
    success: true,
    message: "Project created successfully",
    project: {
        _id: "507f1f77bcf86cd799439011",
        title: "My Design",
        design: {
            layers: [],
            canvasSize: { width: 1080, height: 1080 },
            zoom: 100,
            pan: { x: 0, y: 0 }
        },
        createdAt: "2024-02-14T10:00:00.000Z",
        updatedAt: "2024-02-14T10:00:00.000Z"
    }
};

// ============================================================================
//  18. ERROR RESPONSE - From Backend
// ============================================================================
export const ERROR_RESPONSE = {
    success: false,
    error: "Validation failed",
    details: {
        title: "Title is required",
        "design.layers": "Layers must be an array"
    },
    statusCode: 400
};

// ============================================================================
//  19. CONTENT OBJECT - Text Layer Properties
// ============================================================================
export const CONTENT_OBJECT = {
    text: "Sample text content",
    fontSize: 24,
    fontFamily: "Arial",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    color: "#000000",
    textAlign: "left",
    lineHeight: 1.5,
    letterSpacing: 0
};

// ============================================================================
//  20. LAYER PROPERTY TYPES - Reference
// ============================================================================
export const LAYER_PROPERTY_TYPES = {
    // Position & Size
    x: "Number - X coordinate in pixels",
    y: "Number - Y coordinate in pixels",
    width: "Number - Width in pixels",
    height: "Number - Height in pixels",

    // Transform
    rotation: "Number - Rotation in degrees (0-360)",
    z: "Number - Stacking order (0-1000, higher = on top)",
    opacity: "Number - Opacity percentage (0-100)",

    // State
    visible: "Boolean - Is layer shown?",
    locked: "Boolean - Can user edit?",

    // Identification
    id: "String - Unique ID within project",
    type: "String - Layer type (text|shape|image|drawing|group)",
    name: "String - Display name"
};

// ============================================================================
//  21. FONT FAMILY OPTIONS
// ============================================================================
export const FONT_FAMILIES = [
    "Arial",
    "Arial Black",
    "Arial Narrow",
    "Georgia",
    "Helvetica",
    "Impact",
    "Tahoma",
    "Times New Roman",
    "Trebuchet MS",
    "Verdana",
    "Courier New",
    "Comic Sans MS"
];

// ============================================================================
//  22. FONT WEIGHT OPTIONS
// ============================================================================
export const FONT_WEIGHTS = [
    "normal",
    "bold",
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
];

// ============================================================================
//  23. SHAPE TYPES
// ============================================================================
export const SHAPE_TYPES = [
    "rectangle",
    "circle",
    "triangle",
    "square",
    "line",
    "polygon"
];

// ============================================================================
//  24. STROKE STYLES
// ============================================================================
export const STROKE_STYLES = ["solid", "dashed", "dotted"];

// ============================================================================
//  25. TEXT ALIGN OPTIONS
// ============================================================================
export const TEXT_ALIGN_OPTIONS = ["left", "center", "right", "justify"];

// ============================================================================
//  26. PROJECT CATEGORIES
// ============================================================================
export const PROJECT_CATEGORIES = [
    "General",
    "Social Media",
    "Presentation",
    "Print",
    "Web",
    "Business",
    "Marketing",
    "Education",
    "Other"
];

// ============================================================================
//  27. PROJECT STATUS
// ============================================================================
export const PROJECT_STATUS = ["Draft", "Active", "Archived", "Deleted"];

// ============================================================================
//  28. COMPLETE DATA SCHEMA REFERENCE
// ============================================================================
export const SCHEMA_REFERENCE = {
    fields: {
        _id: { type: "ObjectId", example: "507f1f77bcf86cd799439011" },
        userId: { type: "ObjectId", example: "507f1f77bcf86cd799439012" },
        title: { type: "String", example: "My Design", maxLength: 200 },
        desc: { type: "String", example: "Description", maxLength: 1000 },
        icon: { type: "String", example: "🎨" },
        category: { type: "String (Enum)", example: "Social Media" },
        status: { type: "String (Enum)", example: "Active" },
        tags: { type: "Array[String]", example: ["social", "design"] },
        thumbnail: { type: "String (base64)", example: null },
        designColor: { type: "String (hex)", example: "#ffffff" },
        design: {
            type: "Object",
            nested: {
                layers: { type: "Array[Object]", description: "Array of layer objects" },
                canvasSize: { type: "Object", example: { width: 1080, height: 1080 } },
                zoom: { type: "Number", example: 100, min: 1, max: 500 },
                pan: { type: "Object", example: { x: 0, y: 0 } },
                canvasBgColor: { type: "String (hex)", example: "#ffffff" },
                canvasBgImage: { type: "String (base64 or URL)", example: null },
                savedAt: { type: "Date", example: "2024-02-14T10:30:00.000Z" }
            }
        },
        collaborators: { type: "Array[Object]", description: "Array of collaborators" },
        history: { type: "Array[Object]", description: "Version history" },
        createdAt: { type: "Date", example: "2024-02-14T10:00:00.000Z" },
        updatedAt: { type: "Date", example: "2024-02-14T10:30:00.000Z" }
    }
};

// ============================================================================
//  29. COMPLEX DESIGN WITH ALL ELEMENTS
// ============================================================================
export const COMPLEX_DESIGN = {
    title: "Marketing Poster",
    desc: "Summer Sales Marketing Poster",
    icon: "📢",
    category: "Marketing",
    status: "Active",
    design: {
        layers: [
            {
                id: "bg-gradient",
                type: "shape",
                name: "Background Gradient",
                x: 0,
                y: 0,
                width: 1080,
                height: 1350,
                rotation: 0,
                z: 0,
                opacity: 100,
                visible: true,
                locked: true,
                shapeType: "rectangle",
                fill: {
                    type: "gradient",
                    gradient: {
                        type: "linear",
                        angle: 45,
                        stops: [
                            { color: "#FF6B6B", position: 0 },
                            { color: "#FFE66D", position: 100 }
                        ]
                    }
                },
                stroke: null
            },
            {
                id: "img-product",
                type: "image",
                name: "Product Image",
                x: 150,
                y: 100,
                width: 780,
                height: 600,
                rotation: 0,
                z: 1,
                opacity: 100,
                visible: true,
                locked: false,
                src: "data:image/jpeg;base64,...",
                filters: {
                    brightness: 105,
                    contrast: 110,
                    saturation: 120,
                    blur: 0
                },
                cornerRadius: 20
            },
            {
                id: "shape-badge",
                type: "shape",
                name: "Sale Badge",
                x: 700,
                y: 150,
                width: 150,
                height: 150,
                rotation: 0,
                z: 2,
                opacity: 100,
                visible: true,
                locked: false,
                shapeType: "circle",
                fill: { type: "color", color: "#FF0000" },
                stroke: { color: "#FFFFFF", width: 5, style: "solid" }
            },
            {
                id: "text-discount",
                type: "text",
                name: "50% OFF",
                x: 700,
                y: 150,
                width: 150,
                height: 150,
                rotation: 0,
                z: 3,
                opacity: 100,
                visible: true,
                locked: false,
                content: {
                    text: "50%\nOFF",
                    fontSize: 48,
                    fontFamily: "Arial",
                    fontWeight: "900",
                    color: "#FFFFFF",
                    textAlign: "center",
                    lineHeight: 1.0
                }
            },
            {
                id: "text-headline",
                type: "text",
                name: "Summer Sale",
                x: 100,
                y: 750,
                width: 880,
                height: 150,
                rotation: 0,
                z: 2,
                opacity: 100,
                visible: true,
                locked: false,
                content: {
                    text: "SUMMER SALE COLLECTION",
                    fontSize: 84,
                    fontFamily: "Arial Black",
                    fontWeight: "900",
                    color: "#FFFFFF",
                    textAlign: "center",
                    lineHeight: 1.0,
                    shadow: {
                        offsetX: 2,
                        offsetY: 2,
                        blur: 4,
                        color: "rgba(0,0,0,0.5)"
                    }
                }
            }
        ],
        canvasSize: { width: 1080, height: 1350 },
        zoom: 75,
        pan: { x: 0, y: 0 },
        canvasBgColor: "#ffffff",
        canvasBgImage: null
    }
};

// ============================================================================
//  30. DATABASE FIELD TYPES MAPPING
// ============================================================================
export const DATABASE_FIELD_TYPES = {
    // Basic Types
    String: ["title", "desc", "icon", "category", "status", "text", "color"],
    Number: ["x", "y", "width", "height", "fontSize", "opacity", "rotation", "z", "zoom"],
    Boolean: ["visible", "locked"],
    Date: ["createdAt", "updatedAt", "savedAt"],
    ObjectId: ["_id", "userId"],

    // Complex Types
    Object: ["design", "content", "fill", "stroke", "filters", "canvasSize", "pan", "shadow"],
    Array: ["layers", "tags", "collaborators", "history"],
    "Array[Object]": ["layers", "collaborators", "history"]
};

console.log("✅ JSON Format Data Loaded Successfully");
console.log("Use exports like: CREATE_PROJECT_FULL, UPDATE_DESIGN, TEXT_LAYER, etc.");
