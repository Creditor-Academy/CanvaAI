# Google Docs Pagination - Quick Start Guide

## 🚀 30-Second Setup

### Option 1: Default (Recommended)

```javascript
import { PaginationEngine } from './utils/pagination/paginationEngine';

// Uses Google Docs config automatically (~810px, 48 lines/page)
const engine = new PaginationEngine({
  debugMode: true, // Optional: see pagination details in console
});

const pages = engine.paginate(blocks);
```

### Option 2: With React Provider

```javascript
import { GoogleDocsConfigProvider } from './utils/pagination/MeasurementLayer';

function App() {
  return (
    <GoogleDocsConfigProvider>
      <TextEditor />
    </GoogleDocsConfigProvider>
  );
}
```

That's it! ✓

---

## 📊 What Changed?

### Before (v3.0)
```
❌ Estimation-based height calculation
❌ Fixed 931px usable height
❌ Inaccurate page breaks
❌ No font-aware measurements
```

### After (v4.0)
```
✅ Real DOM measurements (offsetHeight)
✅ Preferred 810px usable height (48 lines)
✅ Pixel-perfect page breaks
✅ Matches Google Docs exactly
```

---

## ⚙️ Configuration (Optional)

### Use Different Height

```javascript
const engine = new PaginationEngine({
  usableHeight: 900, // Custom height in px
  useGoogleDocsConfig: false, // Disable Google Docs mode
});
```

### Enable Debug Mode

```javascript
const engine = new PaginationEngine({
  debugMode: true,
  perfLogEnabled: true,
});

// Console output:
// [PaginationEngine] Page 1 created (normal): 12 blocks, 809px - Google Docs mode: 810px (48 lines)
```

---

## 🎯 Typography Settings

Athena Editor now uses **exact Google Docs configuration**:

| Property | Value | Notes |
|----------|-------|-------|
| Font | Arial | Default |
| Font Size | 11 pt (14.67 px) | At 96 DPI |
| Line Spacing | 1.15 | Multiplier |
| Line Height | 16.87 px | Font × spacing |
| Lines/Page | 48 | Google Docs standard |
| Content Height | ~810 px | 16.87 × 48 |

---

## 🔍 How to Verify

### Test Document

1. Create a document with multiple paragraphs
2. Check page breaks in Athena Editor
3. Compare with same content in Google Docs
4. **Result:** Should match exactly ✓

### Console Check

```javascript
const engine = new PaginationEngine({ debugMode: true });
console.log('Usable height:', engine.usableHeight);
// Expected: 810 (Google Docs mode)
```

---

## 🛠️ Common Issues

### Issue: "domMeasurer is not defined"

**Fix:** Update import in MeasurementLayer.jsx
```javascript
import { domMeasurer, GOOGLE_DOCS_CONFIG } from './layoutCalculator';
```

### Issue: Page breaks still using old height

**Fix:** Clear browser cache and reload
```javascript
// Or programmatically clear cache
engine.clearCache();
```

### Issue: Want to use old 931px height

**Fix:** Disable Google Docs mode
```javascript
const engine = new PaginationEngine({
  useGoogleDocsConfig: false, // Uses USABLE_HEIGHT_PX (931px)
});
```

---

## 📚 Files Modified

```
src/utils/pagination/
├── constants.js              ✅ Added GOOGLE_DOCS_CONFIG
├── layoutCalculator.js       ✅ Added DOMMeasurementLayer class
├── paginationEngine.js       ✅ Updated to use Google Docs height
└── MeasurementLayer.jsx      ✅ New React component
```

---

## 🎓 Key Concepts

### Why DOM Measurement?

**Old Approach (Estimation):**
```javascript
const charWidth = fontSize * 0.52; // Magic ratio ❌
const lines = text.length / charWidth;
const height = lines * lineHeight;
```

**New Approach (DOM):**
```javascript
const height = element.offsetHeight; // Browser truth ✅
```

### Why 810px Instead of 931px?

```
A4 Page Height: 1123px
Minus Margins:  -192px (96px top + 96px bottom)
Max Usable:    =931px

Google Docs reserves space for:
- Paragraph spacing
- Heading variations
- Rendering differences

Preferred:     =810px (48 lines × 16.87px)
```

---

## 📖 Full Documentation

For detailed technical information, see:
- [GOOGLE_DOCS_PAGINATION.md](./GOOGLE_DOCS_PAGINATION.md) - Complete documentation
- [PAGINATION_ENHANCEMENTS.md](./PAGINATION_ENHANCEMENTS.md) - v3.0 improvements
- [constants.js](./constants.js) - All measurements

---

## ✅ Checklist

After setup, verify:

- [ ] Pagination uses ~810px height (not 931px)
- [ ] Page breaks occur at natural boundaries
- [ ] No awkward mid-section breaks
- [ ] Matches Google Docs behavior
- [ ] Debug logs show "Google Docs mode"
- [ ] No console errors

---

## 🆘 Need Help?

Enable debug mode and check console:

```javascript
const engine = new PaginationEngine({
  debugMode: true,
  useGoogleDocsConfig: true,
});

const pages = engine.paginate(blocks);
// Check console for: "Google Docs mode: 810px (48 lines)"
```

---

**Version:** 4.0 (Google Docs Edition)  
**Last Updated:** March 18, 2026
