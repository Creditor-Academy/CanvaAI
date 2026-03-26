# Nested Pages Bug - Final Debug Session

## Problem Statement

When copying content from one page to another **within the same editor**, the pasted content creates nested pages that overlay/overlap instead of being properly distributed.

**User Action**: 
1. Copy text from Page 1
2. Paste it into Page 2 (on a new line)
3. **Result**: Page wrapper is copied, creating nested structure → visual overlap

## Current Implementation Status

### ✅ Layer 1: transformPasted (Active)
**Location**: TextEditor.jsx editorProps
**Purpose**: Strip page wrappers from ALL pasted content
**Status**: Enhanced with detailed logging

```javascript
transformPasted(slice) {
  // Checks if paste contains page nodes
  const hasPageNodes = slice.content.some(node => node.type.name === 'page');
  
  if (hasPageNodes) {
    // Extract children from page nodes
    // Return flattened content without page wrappers
  }
}
```

### ✅ Layer 2: handlePaste HTML Stripping (Active)
**Location**: TextEditor.jsx custom paste handler
**Purpose**: Strip page wrappers from HTML clipboard data
**Status**: Active for large content

### ✅ Layer 3: Schema Validation (Active)
**Location**: Page.js extension
**Purpose**: Prevent pages from containing other pages
**Status**: `content: 'block+'` prevents self-nesting

### ✅ Layer 4: CSS Clear Property (Active)
**Location**: AthenaEditor.css
**Purpose**: Force vertical stacking
**Status**: `clear: both` applied

### ✅ Layer 5: Nested Page Detection (Active)
**Location**: TextEditor.jsx onUpdate
**Purpose**: Detect and log nested pages
**Status**: Monitors document structure

---

## Debug Instructions

### Step 1: Refresh Editor
```
Press Ctrl+Shift+R to hard refresh
```

### Step 2: Open Console
```
Press F12 → Console tab
```

### Step 3: Test Copy-Paste
1. Select some text on Page 1
2. Copy it (Ctrl+C)
3. Click on Page 2 at a new line
4. Paste it (Ctrl+V)

### Step 4: Check Console Logs

You should see logs like:

```
🔵 [transformPasted] === START ===
🔵 [transformPasted] slice.content.size: 3
🔵 [transformPasted] Nodes in paste:
  0. type: paragraph, attrs: {...}
  1. type: page, attrs: {pageNumber: 1}  ← If you see this...
  2. type: paragraph, attrs: {...}
🔵 [transformPasted] Node types: paragraph, page, paragraph
🔵 [transformPasted] Has page nodes? true
🔴 [transformPasted] 🚨 PAGE NODES DETECTED - Stripping page wrappers!
🔴 [transformPasted] Extracting content from page node
  → Keeping child: paragraph
🟢 [transformPasted] Keeping non-page node: paragraph
🟢 [transformPasted] ✅ Transformed 3 nodes → 4 nodes
🟢 [transformPasted] === END ===
```

### Step 5: Verify Visual Result

**Expected**: Content appears as regular paragraphs on Page 2
**Bug Still Present**: You see a page box within a page box

---

## Critical Questions

### Q1: Do you see `[transformPasted]` logs at all?

**If NO** → The function isn't being called
- This means ProseMirror isn't using editorProps.transformPasted
- We need to investigate why

**If YES** → Continue to Q2

### Q2: Does it detect page nodes?

Look for: `Has page nodes? true`

**If NO** → The paste doesn't contain page nodes as TipTap structures
- The issue might be HTML-based page wrappers instead
- Check for: `[handlePaste] Found X page wrappers to strip`

**If YES** → Continue to Q3

### Q3: Does it strip them successfully?

Look for: `Transformed X nodes → Y nodes`

The numbers should be different (Y < X if pages were stripped)

**If numbers are same** → No pages were found to strip
**If Y < X** → Pages were successfully stripped

### Q4: After paste, do pages still overlap visually?

**If YES** → The structure is correct but CSS is wrong
- Check DevTools → Elements tab
- Look for nested `.page` divs in DOM

**If NO** → Issue is fixed!

---

## Expected Behavior

### When Working Correctly:

```
Copy from Page 1:
  Selected: "Hello World"
  Internal: [paragraph("Hello World")]

Paste into Page 2:
  Before: [transformPasted] detects no pages
  After: Paragraph inserted directly into Page 2
  Visual: Text appears normally
  
DOM Structure:
<div class="page" data-page-number="2">
  <div class="page-content">
    <p>Existing content</p>
    <p>Hello World</p>  ← Pasted content (no wrapper)
  </div>
</div>
```

### When Bug Occurs:

```
Copy from Page 1:
  Selected: "Hello World"
  Internal: [page[paragraph("Hello World")]]  ← Includes page wrapper!

Paste into Page 2:
  Before: [transformPasted] detects page node
  After transform: [paragraph("Hello World")]  ← Should strip page
  If transform fails: [page[paragraph("Hello World")]] inserts nested
  
Broken DOM Structure:
<div class="page" data-page-number="2">
  <div class="page-content">
    <p>Existing content</p>
    <div class="page" data-page-number="1">  ← NESTED PAGE!
      <div class="page-content">
        <p>Hello World</p>
      </div>
    </div>
  </div>
</div>
```

---

## Possible Root Causes

### Cause 1: transformPasted Not Called
**Why**: Editor configuration issue or conflict with handlePaste
**Solution**: May need to move logic INTO handlePaste entirely

### Cause 2: Page Nodes Not Detected
**Why**: Clipboard serializes differently than expected
**Solution**: Check HTML string for page class/data attributes

### Cause 3: Transform Returns But Still Nesting
**Why**: Transaction applies original slice instead of transformed
**Solution**: Check if ProseMirror is respecting transformPasted return value

### Cause 4: CSS Stacking Issue
**Why**: Even with correct structure, CSS causes overlap
**Solution**: Inspect DOM, check for position:absolute or z-index issues

---

## Next Steps Based on Your Logs

Please share the complete console output after pasting. I need to see:

1. **Does transformPasted run?** (look for 🔵 logs)
2. **Does it detect pages?** (look for "Has page nodes?")
3. **Does it strip them?** (look for "Transformed X nodes → Y nodes")
4. **What does the DOM look like?** (DevTools screenshot)

With this information, I can pinpoint exactly which layer is failing and fix it.

---

**Implementation Date**: March 26, 2026  
**Status**: Debugging in Progress  
**Priority**: CRITICAL
