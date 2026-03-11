# Page Margins & Visual Boundaries - Implementation Guide

## 📐 Overview

The Athena Editor now includes **visual page margins** and **pagination preview** to help users understand exactly how content will be distributed across pages when exported or printed.

## ✨ Features Implemented

### 1. **Visual Margin Guides** (CSS)
- ✅ Dashed border showing margin boundaries
- ✅ Hover overlays highlighting margin areas
- ✅ Real-time margin size labels
- ✅ Responsive A4 page proportions

### 2. **Page Container** (Component)
- ✅ Fixed A4 dimensions (793.7px × 1122.5px at 96 DPI)
- ✅ Shadow and border for clear page edges
- ✅ Page number indicators
- ✅ Multiple page support

### 3. **Pagination Calculator** (JavaScript)
- ✅ Estimates content height per page
- ✅ Predicts page breaks
- ✅ Handles all content types (text, images, tables, etc.)
- ✅ Returns structured page data

---

## 🎨 CSS Classes Added

### Page Container
```css
.page-container {
  width: 793.7px;   /* A4 width at 96 DPI */
  min-height: 1122.5px; /* A4 height at 96 DPI */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}
```

### Margin Overlay (on hover)
```css
.margin-overlay {
  /* Shows colored overlay on hover */
  background: rgba(59, 130, 246, 0.05);
  border: 1px dashed rgba(59, 130, 246, 0.3);
}
```

### Page Break Indicator
```css
.page-break-indicator {
  /* Visual marker for page breaks */
  border-top: 2px dashed #3b82f6;
  border-bottom: 2px dashed #3b82f6;
}
```

---

## 💻 How to Use in Components

### Method 1: Wrap Editor with Page Container

```jsx
import React from 'react';

const EditorWithMargins = () => {
  return (
    <div className="page-container">
      {/* Visual margin guides */}
      <div className="margin-overlay">
        <div className="margin-top"></div>
        <div className="margin-bottom"></div>
        <div className="margin-left"></div>
        <div className="margin-right"></div>
      </div>
      
      {/* Page number */}
      <div className="page-number-indicator">Page 1</div>
      
      {/* Your TipTap editor */}
      <EditorContent editor={editor} />
    </div>
  );
};
```

### Method 2: Enable Page Preview Mode

```jsx
// Add class to enable visual page lines
<div className="page-preview-mode">
  <EditorContent editor={editor} />
</div>
```

### Method 3: Dynamic Margins with CSS Variables

```jsx
// Set custom margins
const margins = {
  top: 96,    // 1 inch
  right: 96,
  bottom: 96,
  left: 96
};

<div 
  className="page-container"
  style={{
    '--page-margin-top': `${margins.top}px`,
    '--page-margin-right': `${margins.right}px`,
    '--page-margin-bottom': `${margins.bottom}px`,
    '--page-margin-left': `${margins.left}px`
  }}
>
  <EditorContent editor={editor} />
</div>
```

---

## 📊 Using Pagination Calculator

### Basic Usage

```javascript
import { DocumentExporter } from '../utils/documentExporter';

// Calculate pagination
const pagination = DocumentExporter.calculatePagination(editor, {
  pageHeight: 1122.5,
  pageWidth: 793.7,
  marginTop: 96,
  marginBottom: 96,
  marginLeft: 96,
  marginRight: 96
});

console.log(`Total pages: ${pagination.totalPages}`);
console.log(pagination.pages);
/*
Output:
{
  pages: [
    {
      pageNumber: 1,
      content: [...],
      usedHeight: 850,
      availableHeight: 930.5
    },
    {
      pageNumber: 2,
      content: [...],
      usedHeight: 420,
      availableHeight: 930.5
    }
  ],
  totalPages: 2
}
*/
```

### Show Page Count to User

```jsx
const [pageCount, setPageCount] = useState(1);

useEffect(() => {
  if (editor) {
    const pagination = DocumentExporter.calculatePagination(editor);
    setPageCount(pagination.totalPages);
  }
}, [editor, editor.state]);

return (
  <div>
    <p>Total Pages: {pageCount}</p>
    <EditorContent editor={editor} />
  </div>
);
```

### Insert Page Break at Specific Position

```javascript
const insertPageBreak = () => {
  editor.chain().focus().insertContent({
    type: 'pageBreak',
    attrs: { cssHeight: '20px' }
  }).run();
};
```

---

## 🎯 Content Height Estimation

The `estimateNodeHeight` function calculates approximate heights:

| Content Type | Height Calculation |
|-------------|-------------------|
| Heading H1 | 48px (32px × 1.5) |
| Heading H2 | 42px (28px × 1.5) |
| Paragraph | ~20px per line |
| Image | Actual height or 300px |
| Table | 40px per row |
| Blockquote | ~20px per line + 10px |
| Code Block | 18px per line + 20px |
| List Item | 24px per item |

---

## 🔧 Integration with Existing Editor

### Update TextEditor.jsx

```jsx
// Add state for pagination
const [totalPages, setTotalPages] = useState(1);
const [currentPage, setCurrentPage] = useState(1);

// Update on content change
useEffect(() => {
  if (editor) {
    const pagination = DocumentExporter.calculatePagination(editor, {
      marginTop: pageMargins.top,
      marginBottom: pageMargins.bottom,
      marginLeft: pageMargins.left,
      marginRight: pageMargins.right
    });
    setTotalPages(pagination.totalPages);
  }
}, [editor, editor.state, pageMargins]);

// Render with page container
return (
  <div className="editor-wrapper">
    <div className="page-info">
      Page {currentPage} of {totalPages}
    </div>
    
    <div className="page-container">
      <div className="margin-overlay">
        <div className="margin-top"></div>
        <div className="margin-bottom"></div>
        <div className="margin-left"></div>
        <div className="margin-right"></div>
      </div>
      
      <EditorContent editor={editor} />
    </div>
  </div>
);
```

---

## 📱 Responsive Behavior

On smaller screens (< 850px):
- Page container scales down
- Maintains aspect ratio
- Margins adjust proportionally

```css
@media (max-width: 850px) {
  .page-container {
    width: 100%;
    max-width: 600px;
  }
}
```

---

## 🎨 Customization Examples

### Change Margin Colors

```css
.margin-overlay .margin-top {
  background: rgba(16, 185, 129, 0.05); /* Green tint */
  border-color: rgba(16, 185, 129, 0.3);
}
```

### Different Page Size (Letter instead of A4)

```javascript
const letterSize = {
  width: 816,    // 8.5" × 96 DPI
  height: 1056   // 11" × 96 DPI
};
```

### Hide Margins by Default

```css
.margin-overlay {
  opacity: 0; /* Hidden unless hovering */
}
```

---

## 🚀 Benefits

1. **WYSIWYG Editing** - See exactly how pages will look
2. **Better Planning** - Know where page breaks occur
3. **Professional Output** - Consistent margins throughout
4. **User Confidence** - No surprises when exporting
5. **Print Ready** - What you see is what you get

---

## 📋 Next Steps

Consider implementing:
- [ ] Drag-to-adjust margins
- [ ] Page thumbnail navigation
- [ ] Multi-page view mode
- [ ] Export preview modal
- [ ] Margin presets (Narrow, Moderate, Wide)
- [ ] Different paper sizes (A4, Letter, Legal)

---

**Implementation Date:** March 8, 2026  
**Version:** 1.0.0  
**Author:** Athena Editor Team
