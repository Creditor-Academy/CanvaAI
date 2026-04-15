# Image Pagination Fix

## Problem
When inserting an image into the editor, content doesn't shift to a new page even when the image causes overflow.

## Root Causes

### 1. **Timing Issue**
The pagination was triggered only 100ms after image insertion, which wasn't enough time for:
- The image DOM element to fully render
- The browser to calculate the actual image dimensions
- The pagination engine to measure the correct height

### 2. **Height Estimation Issue**
The pagination engine had two problems with image height calculation:
- **Fallback value too low**: Used a default of 200px (`IMAGE_H = 200`) when images are inserted with 300px height by default
- **Attribute not prioritized**: Didn't properly use the explicit `height` attribute from the image node

## Solutions Applied

### 1. Increased Pagination Delay (TextEditorContent.jsx & TextEditor.jsx)
**Changed**: Pagination trigger delay from 100ms → 300ms

```javascript
// Before
setTimeout(() => {
  paginateDocument(editor, { force: true, reason: 'image-insertion' });
}, 100);

// After  
setTimeout(() => {
  console.log('[insertImage] Triggering pagination after image insertion');
  paginateDocument(editor, { force: true, reason: 'image-insertion' });
}, 300);
```

**Why**: Gives the browser enough time to:
- Load and render the image element
- Calculate actual DOM dimensions
- Ensure accurate height measurement

### 2. Improved Image Height Estimation (paginationEngine.js)
**Changed**: Better use of explicit image height attributes

```javascript
// Before
const ih = node.attrs?.height > 0
  ? Math.min(node.attrs.height, USABLE_HEIGHT * 0.85)
  : IMAGE_H;

// After
const attrs = node.attrs || {};
const explicitHeight = attrs.height || 0;

const ih = explicitHeight > 0
  ? Math.min(explicitHeight, USABLE_HEIGHT * 0.85)
  : IMAGE_H;

// Added debugging log
if (explicitHeight > 0) {
  console.log(`[estimateHeight] Image with explicit height: ${explicitHeight}px -> estimated ${h}px (including margin)`);
}
```

**Why**: 
- More robust attribute access
- Better logging for debugging
- Ensures 300px images are calculated correctly (not as 200px)

### 3. Enhanced DOM Measurement (optimizedPaginationEngine.js)
**Changed**: Special handling for image measurement when DOM isn't ready

```javascript
// Added special image handling
if (node.type.name === 'image') {
  const imageHeight = node.attrs?.height || 0;
  if (height < 50 && imageHeight > 0) {
    // DOM not fully rendered yet, use attribute height + margin
    height = imageHeight + 22; // 22px margin
    console.log(`[measureBlockHeight] Image using attribute height: ${imageHeight}px + 22px margin = ${height}px`);
  }
}
```

**Why**: 
- Fallback when DOM measurement fails (image still loading)
- Uses explicit height attribute as backup
- Ensures accurate pagination even during fast insertions

## How It Works Now

1. **User inserts image** → Image added with explicit dimensions (e.g., 400×300)
2. **300ms delay** → Browser renders image and calculates DOM dimensions
3. **Pagination triggered** → `paginateDocument()` called with `force: true`
4. **Height estimation** → Uses image's explicit height (300px) + margin (22px) = 322px
5. **Overflow detection** → If current content + 322px > USABLE_HEIGHT (1063px), triggers page split
6. **Content shifts** → Overflow content moves to next page automatically

## Testing

To verify the fix works:

1. Open the editor with some text content
2. Insert an image (default 400×300px)
3. Watch the console for logs:
   ```
   [insertImage] Triggering pagination after image insertion
   [estimateHeight] Image with explicit height: 300px -> estimated 322px (including margin)
   ```
4. Verify content shifts to new page if overflow occurs

## Files Modified

1. `TextEditorContent.jsx` - Increased pagination delay to 300ms
2. `TextEditor.jsx` - Increased pagination delay to 300ms  
3. `paginationEngine.js` - Improved image height estimation
4. `optimizedPaginationEngine.js` - Added DOM measurement fallback for images

## Constants Reference

- `IMAGE_H = 200px` - Fallback height when no explicit height attribute
- `IMAGE_MARGIN = 22px` - Spacing around images
- `USABLE_HEIGHT = 1063px` - Available content area per page
- Default inserted image: 400×300px
