# 🔬 Athena Pagination Calibration System

## Overview

The calibration system provides **production-grade diagnostics** to ensure the pagination engine's measurements match the actual rendered UI with pixel-perfect accuracy.

## Purpose

This system answers critical questions:
- Is the measurement layer getting accurate heights?
- Are there timing issues (fonts loading, CSS transitions)?
- Does browser zoom affect measurements?
- How much variance is acceptable?

## Installation

Already integrated into `TextEditor.jsx` - runs automatically in development mode.

```javascript
// Auto-calibration after pagination
const pages = engine.paginate(blocks);

// Run calibration (development only or small docs)
if (process.env.NODE_ENV === 'development' || blocks.length < 10) {
  runCalibration(engine, blocks);
}
```

## Usage

### Basic Calibration

```javascript
import { runCalibration } from '../../../utils/pagination/calibration.js';

// After pagination completes
const results = await runCalibration(engine, blocks);
console.log('Calibration complete:', results);
```

### Quick Health Check

```javascript
import { checkCalibrationHealth } from '../../../utils/pagination/calibration.js';

// Returns true if avg error ≤ 1px
const isHealthy = await checkCalibrationHealth(engine, blocks);
if (!isHealthy) {
  console.warn('Pagination calibration failed - check for CSS mismatches');
}
```

### Debug Specific Block

```javascript
import { debugBlock } from '../../../utils/pagination/calibration.js';

// Log detailed info for block #5
debugBlock(engine, 5);
```

## Output Example

```
🔬 Athena Pagination Calibration
Font Status: ✅ Ready

┌─────────┬────────────┬──────────────────┬──────────────────────┬────────────┬───────────┐
│ (index) │ blockIndex │      type        │   measuredHeight     │ difference │ fontSize  │
├─────────┼────────────┼──────────────────┼──────────────────────┼────────────┼───────────┤
│    0    │     0      │   'paragraph'    │       24.50          │    0.00    │  '16px'   │
│    1    │     1      │   'heading'      │       38.25          │    1.25    │  '24px'   │
│    2    │     2      │   'paragraph'    │       48.75          │   -0.50    │  '16px'   │
└─────────┴────────────┴──────────────────┴──────────────────────┴────────────┴───────────┘

📊 Average Variance: 0.58px
📈 Max Variance: 1.25px
📉 Total Accumulated Error: 1.75px over 3 blocks
✅ Measurement accuracy is within acceptable limits (±1px).
```

## Interpretation

### Variance Thresholds

| Average Error | Status | Action |
|--------------|--------|--------|
| **≤ 1px** | ✅ Excellent | No action needed |
| **1-2px** | ⚠️ Acceptable | Monitor, may accumulate over many blocks |
| **2-5px** | 🚨 Problematic | Investigate CSS/font timing |
| **> 5px** | ❌ Critical | Check measurement layer setup |

### Common Issues & Solutions

#### Issue 1: High Variance (>2px)

**Symptoms:**
```
⚠️ HIGH VARIANCE DETECTED!
Average Variance: 3.45px
```

**Causes:**
1. **CSS Padding/Margin Mismatch**
   - Editor has `padding: 8px` but measurement layer doesn't account for it
   - Solution: Ensure measurement layer uses same CSS classes

2. **Box-Sizing Differences**
   ```css
   /* Editor */
   .ProseMirror { box-sizing: border-box; }
   
   /* Measurement Layer */
   .measurement-div { box-sizing: content-box; } /* ← Problem! */
   ```
   Solution: Use `box-sizing: border-box` consistently

3. **Font Not Loaded**
   ```javascript
   // Run before fonts ready
   const measuredHeight = 24;  // Wrong - default font
   
   // Run after fonts ready
   await document.fonts.ready;
   const measuredHeight = 26.5;  // Correct - actual font
   ```

#### Issue 2: Timing Problems

**Symptoms:**
- Calibration passes initially but fails after 1-2 seconds
- Different results on re-run

**Solution:**
```javascript
// Wait for fonts before paginating
useEffect(() => {
  const initPagination = async () => {
    await document.fonts.ready;
    const blocks = flattenDocument(doc);
    const pages = engine.paginate(blocks);
    runCalibration(engine, blocks);
  };
  initPagination();
}, [doc]);
```

#### Issue 3: Browser Zoom Effects

**Symptoms:**
- Works at 100% zoom, breaks at 110% or 125%
- Sub-pixel rendering causes accumulation

**Detection:**
```javascript
const zoomFactor = window.devicePixelRatio;
console.log('Zoom Level:', zoomFactor); // 1.0 = 100%, 1.25 = 125%
```

**Impact Example:**
```
At 100% zoom (1.0):
- Block height: 16px exactly
- 48 lines = 768px ✓

At 125% zoom (1.25):
- Block height: 16.4px (sub-pixel)
- 48 lines = 787.2px → rounds to 787px
- Error: 19px accumulated!
```

**Solution:**
- Use `getBoundingClientRect().height` for fractional precision
- Add zoom compensation factor
- Test at common zoom levels (100%, 110%, 125%, 150%)

## API Reference

### `runCalibration(engine, blocks)`

**Returns:** `Promise<Array>` - Array of calibration results

**Each result contains:**
```javascript
{
  blockIndex: 0,
  type: 'paragraph',
  measuredHeight: 24.50,        // Engine's measurement
  actualRenderedHeight: 24.50,  // Real DOM height
  difference: 0.00,             // Error margin
  
  // Style metrics
  fontSize: '16px',
  lineHeight: '24px',
  fontFamily: 'Arial',
  zoomLevel: 1.0,
  
  // Config verification
  targetUsableHeight: 810,
  isGoogleDocsMode: true,
  googleDocsTarget: 810
}
```

### `checkCalibrationHealth(engine, blocks)`

**Returns:** `Promise<boolean>` - `true` if calibration passes

**Usage:**
```javascript
const healthy = await checkCalibrationHealth(engine, blocks);
if (!healthy) {
  toast.warning('Pagination may be inaccurate - recalibrating...');
}
```

### `debugBlock(engine, blockIndex)`

**Returns:** `void` - Logs detailed block info to console

**Output:**
```
🔍 Debugging Block #5
DOM Node: <div class="ProseMirror">...</div>
Computed Styles: CSSStyleDeclaration { ... }
Bounding Rect: DOMRect { x: 0, y: 0, width: 650, height: 24.5 }
Offset Height: 24
Scroll Height: 24
Client Height: 24
```

## Performance Impact

- **Development Mode:** Full calibration runs automatically
- **Production Mode:** Disabled by default (add manual calls if needed)
- **Overhead:** ~5-10ms per 100 blocks (negligible for debugging)

## Best Practices

1. **Run After Font Load**
   ```javascript
   await document.fonts.ready;
   runCalibration(engine, blocks);
   ```

2. **Check at Multiple Zoom Levels**
   - Test at 100%, 110%, 125%, 150%
   - Document any zoom-specific issues

3. **Monitor Accumulated Error**
   - Single block: ±1px acceptable
   - 100 blocks: ±100px accumulated (problematic!)

4. **Use Health Checks in Production**
   ```javascript
   if (!await checkCalibrationHealth(engine, blocks)) {
     analytics.track('pagination_calibration_failed', {
       avgError, maxError, blockCount
     });
   }
   ```

## Related Files

- `/utils/pagination/calibration.js` - Calibration utilities
- `/utils/pagination/paginationEngine.js` - Main pagination engine
- `/utils/pagination/layoutCalculator.js` - Height measurement logic
- `/components/athena-editor/components/TextEditor.jsx` - Integration point

## Troubleshooting

### "Why are my page breaks still uneven?"

1. Run calibration: `runCalibration(engine, blocks)`
2. Check average variance - if >1px:
   - Verify CSS consistency between editor and measurement layer
   - Check font loading timing
   - Test at different zoom levels

### "Calibration passes but pages still overflow"

Likely causes:
1. **Dynamic content** - Images loading after pagination
2. **User scrolling** - Changing viewport during pagination
3. **CSS transitions** - Animations affecting height

Solution: Re-run pagination after content stabilizes

### "Different results on each run"

Check for:
1. **Non-deterministic styles** - Random class names, timestamps
2. **Async font loading** - Some fonts loaded, others not
3. **Cache invalidation** - Clear pagination engine cache between runs

```javascript
engine.clearCache();
const results1 = await runCalibration(engine, blocks);
const results2 = await runCalibration(engine, blocks);
// Should be identical
```

---

**Version:** 1.0  
**Last Updated:** March 2026  
**Maintained By:** Athena Development Team
