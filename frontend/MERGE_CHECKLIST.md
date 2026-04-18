# Athena Editor Production Merge Checklist

## 🔴 CRITICAL (Must Fix Before Merge)

### 1. Fix Duplicate Token Counter Files
- [ ] **Consolidate**: Merge `src/components/athena-editor/utils/realtimeTokenCounter.js` into `src/utils/realtimeTokenCounter.js`
- [ ] **Update Imports**: Change all imports to use single source `src/utils/realtimeTokenCounter.js`
- [ ] **Delete Old File**: Remove `src/components/athena-editor/utils/realtimeTokenCounter.js`

**Files to Update:**
- [ ] `src/components/athena-editor/components/editor/TokenCounter.jsx`
- [ ] `src/components/athena-editor/components/editor/EnhancedTokenBadge.jsx`
- [ ] `src/components/athena-editor/hooks/useTokenCounter.js`
- [ ] `src/components/athena-editor/components/editor/AIAssistant.jsx`

### 2. Fix Async Breaking Changes
- [ ] Update all synchronous `estimateTokensFast()` calls to async/await
- [ ] Add backward-compatible sync wrapper if needed
- [ ] Test all components that use token counting

**Affected Components:**
```javascript
// BEFORE (will break)
const tokenResult = estimateTokensFast(content);

// AFTER (correct)
const tokenResult = await estimateTokensFast(content);
```

### 3. Configure Vite for Web Workers
- [ ] Add Worker plugin or configuration to `vite.config.js`
- [ ] Test Worker loading in production build
- [ ] Add fallback for environments without Worker support

**Required Vite Config:**
```javascript
// Add to vite.config.js
export default defineConfig({
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      output: {
        // Ensure workers are bundled correctly
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.worker.js')) {
            return 'workers/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
});
```

---

## 🟡 MEDIUM PRIORITY

### 4. Environment Configuration
- [ ] Create `.env.production` with token counter settings
- [ ] Add feature flags for gradual rollout
- [ ] Configure different settings for dev/staging/production

**Example `.env.production`:**
```env
VITE_TOKEN_COUNTER_USE_WORKER=true
VITE_TOKEN_COUNTER_CACHE_SIZE=500
VITE_TOKEN_COUNTER_FALLBACK_THRESHOLD=1000
VITE_TOKEN_COUNTER_ENABLE_PERFORMANCE_LOGGING=false
```

### 5. Remove Debug Code
- [ ] Remove or conditionalize all `console.log()` statements
- [ ] Remove `console.warn()` except for critical errors
- [ ] Add production logging utility

**Files to Clean:**
- [ ] `src/utils/realtimeTokenCounter.js` (~10 console statements)
- [ ] `public/workers/token-worker.js` (~5 console statements)
- [ ] `src/components/athena-editor/components/editor/*.jsx`

### 6. Performance Testing
- [ ] Test with 1K, 5K, 10K, 50K word documents
- [ ] Measure memory usage over 1-hour editing session
- [ ] Verify Worker doesn't crash on mobile devices
- [ ] Test undo/redo with block-level tracking
- [ ] Test copy-paste large content

### 7. Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari 14+ (Worker support)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🟢 LOW PRIORITY

### 8. Code Organization
- [ ] Move documentation files to `/docs` folder
  - [ ] `TOKEN_COUNTER_PRODUCTION.md` → `docs/TOKEN_COUNTER_PRODUCTION.md`
  - [ ] `DOCUMENTATION.md` → `docs/ATHENA_EDITOR_DOCUMENTATION.md`
- [ ] Create `src/utils/tokenCounter/` directory structure:
  ```
  src/utils/tokenCounter/
  ├── index.js              # Main exports
  ├── worker.js             # Worker manager
  ├── cache.js              # Caching logic
  ├── blockTracker.js       # Block-level tracking
  └── performance.js        # Metrics
  ```

### 9. TypeScript Types (Optional)
- [ ] Add TypeScript definitions if project uses TS
- [ ] Create `.d.ts` files for public APIs
- [ ] Type-check Worker messages

### 10. Monitoring & Analytics
- [ ] Add Sentry error tracking for Worker failures
- [ ] Set up performance monitoring dashboard
- [ ] Add token usage analytics (optional)

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] All existing tests pass
- [ ] New Worker tests pass
- [ ] Block-level tracking tests pass
- [ ] Cache functionality tests pass

### Integration Tests
- [ ] Token counter integrates with TipTap editor
- [ ] Worker communicates correctly with main thread
- [ ] Performance metrics are accurate
- [ ] Fallback works when Worker fails

### E2E Tests
- [ ] Create new document → tokens update correctly
- [ ] Edit large document → UI remains responsive
- [ ] AI generation → tokens counted accurately
- [ ] Save/load document → tokens persist
- [ ] Undo/redo → tokens recalculate correctly

### Load Tests
- [ ] 100 users editing simultaneously (if applicable)
- [ ] 50K+ word document performance
- [ ] Memory usage after 30 min editing
- [ ] Worker thread pool management

---

## 🚀 Deployment Strategy

### Phase 1: Staging (Days 1-2)
- [ ] Deploy to staging environment
- [ ] Enable feature flag for internal team only
- [ ] Monitor error rates and performance
- [ ] Collect feedback from beta testers

### Phase 2: Canary Release (Days 3-4)
- [ ] Enable for 5% of production users
- [ ] Monitor metrics closely
- [ ] Roll back immediately if issues detected
- [ ] Gradually increase to 25%

### Phase 3: Full Rollout (Days 5-7)
- [ ] Enable for 100% of users
- [ ] Keep feature flag for quick rollback
- [ ] Continue monitoring for 1 week
- [ ] Remove feature flag after stability confirmed

---

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Main Thread Blocking** | 0ms | Chrome DevTools Performance tab |
| **Large Doc Edit Time** | <10ms | Custom performance logging |
| **Cache Hit Rate** | >75% | `performanceMetrics.cacheHitRate` |
| **Worker Success Rate** | >95% | Error tracking (Sentry) |
| **Memory Usage (1hr)** | <5MB | Chrome Task Manager |
| **Error Rate** | <0.1% | Production error logs |

---

## 🚨 Rollback Plan

If critical issues are detected post-merge:

1. **Immediate Rollback** (< 5 minutes):
   ```bash
   git revert <merge-commit>
   npm run build
   npm run deploy
   ```

2. **Feature Flag Disable** (if implemented):
   ```javascript
   // Set in production config
   VITE_TOKEN_COUNTER_USE_WORKER=false
   VITE_TOKEN_COUNTER_USE_BLOCK_LEVEL=false
   ```

3. **Hotfix Deployment** (< 1 hour):
   - Fix critical bug in isolation branch
   - Test thoroughly
   - Deploy hotfix

---

## 👥 Team Communication

### Before Merge
- [ ] Notify team of upcoming merge
- [ ] Share this checklist
- [ ] Assign reviewers for critical files
- [ ] Schedule merge during low-traffic period

### After Merge
- [ ] Announce successful merge
- [ ] Share performance improvements
- [ ] Document any known issues
- [ ] Schedule post-mortem if issues occurred

---

## 📝 Notes

- **Merge Date**: _______________
- **Merge Time**: _______________ (recommend: low-traffic period)
- **Responsible Engineer**: _______________
- **Backup Contact**: _______________
- **Expected Downtime**: 0 (should be seamless)

---

## ✅ Final Sign-Off

Before pressing merge button:

- [ ] All CRITICAL items completed
- [ ] All tests passing
- [ ] Code review approved by 2+ engineers
- [ ] Staging deployment successful
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Monitoring tools ready

**Approved by**: _______________ **Date**: _______________
