/**
 * useTokenCounter.js - Advanced React hook for real-time token counting
 * PRODUCTION-OPTIMIZED with all edge case handling
 * 
 * Features:
 * - Content fingerprinting to skip unchanged calculations
 * - Async token estimation with graceful fallback
 * - Stale response guard (monotonic request counter)
 * - IME composition guards (CJK, Arabic, etc.)
 * - Large paste detection with chunked processing
 * - Cross-browser idle scheduling (Safari support)
 * - Tab visibility pause/resume
 * - Component unmount protection
 * - Performance monitoring with P99 tracking
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  createTokenCounter, 
  formatTokenCount, 
  getTokenTier,
  getTokenEfficiency,
  estimateTokensFast,
  estimateTokensChunked,
  buildFingerprint,
  perf
} from '../utils/realtimeTokenCounter';
import { scheduleIdle } from '../utils/scheduleIdle';

/**
 * React hook for real-time token counting (PRODUCTION-OPTIMIZED)
 * 
 * @param {Editor} editor - TipTap editor instance
 * @param {Object} options - Configuration options
 * @returns {Object} Token counter state and utilities
 * 
 * @example
 * const { tokens, tier, cost } = useTokenCounter(editor, {
 *   debounceMs: 300,
 *   thresholds: [1000, 2000, 3000]
 * });
 */
export function useTokenCounter(editor, options = {}) {
  const [state, setState] = useState({
    tokens: 0,
    delta: 0,
    deltaFormatted: '0',
    tier: { level: 'low', color: 'green', label: 'Low Usage' },
    cost: { input: 0, output: 0, total: 0 },
    formattedTokens: '0',
    thresholdsTriggered: [],
    isReady: false,
    // Enhanced features
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    totalTokensUsed: 0,
    efficiency: 100,
    performance: {
      calculationTime: 0,
      cacheHit: false,
      averageCalculationTime: 0
    }
  });
  
  const counterRef = useRef(null);
  const performanceRef = useRef(null);
  
  // ── Optimization: Content fingerprinting ──
  const fingerRef = useRef('');
  
  // ── Optimization: Stale response guard ──
  const reqCounter = useRef(0);
  
  // ── Optimization: Debounce control ──
  const debounceRef = useRef(null);
  
  // ── Optimization: Component unmount guard ──
  const isMounted = useRef(true);
  
  // ── Optimization: IME composition guard ──
  const isComposing = useRef(false);
  
  // ── Optimization: Large paste detection ──
  const isLargePaste = useRef(false);
  
  // Initialize counter
  useEffect(() => {
    if (!editor) return;
    
    // Create counter instance
    const counter = createTokenCounter({
      debounceMs: options.debounceMs || 300,
      minDebounceMs: options.minDebounceMs || 50,
      maxDebounceMs: options.maxDebounceMs || 500,
      thresholds: options.thresholds || [1000, 2000, 3000, 4000],
      useBlockLevel: options.useBlockLevel || false,
      onTokenUpdate: (data) => {
        const tier = getTokenTier(data.tokens);
        
        setState(prev => ({
          ...prev,
          tokens: data.tokens,
          delta: data.delta,
          deltaFormatted: data.deltaFormatted,
          tier,
          cost: data.estimatedCost,
          formattedTokens: formatTokenCount(data.tokens),
          thresholdsTriggered: data.thresholdsTriggered,
          isReady: true,
          // Enhanced data
          inputTokens: data.inputTokens || data.tokens,
          outputTokens: data.outputTokens || 0,
          totalTokens: data.totalTokens || data.tokens,
          totalTokensUsed: data.totalTokensUsed || 0,
          efficiency: data.efficiency || 100,
          performance: data.performance || prev.performance
        }));
      },
      onThresholdWarning: (warning) => {
        if (options.onThresholdWarning) {
          options.onThresholdWarning(warning);
        }
      },
      onPerformanceUpdate: (metrics) => {
        performanceRef.current = metrics;
        if (options.onPerformanceUpdate) {
          options.onPerformanceUpdate(metrics);
        }
      }
    });
    
    counterRef.current = counter;
    
    // ── Optimized: Async token calculation with all guards ──
    const calculate = async (text) => {
      const thisReq = ++reqCounter.current;
      const t0 = performance.now();
      
      // Choose estimator based on text size
      const estimator = (isLargePaste.current || text.length > 20_000)
        ? estimateTokensChunked
        : estimateTokensFast;
      
      isLargePaste.current = false;
      
      const result = await estimator(text);
      const ms = performance.now() - t0;
      
      // Record performance metrics
      perf.record({ time: ms, ...result });
      
      // ── Stale response guard ──
      if (thisReq !== reqCounter.current) return; // Discard stale response
      
      // ── Unmount guard ──
      if (!isMounted.current) return;
      
      // Update counter with result
      counter.updateImmediate(text);
    };
    
    // ── Optimized: handleUpdate with fingerprinting ──
    const handleUpdate = () => {
      // Skip mid-IME composition
      if (isComposing.current) return;
      
      // Skip background tab
      if (document.hidden) return;
      
      const text = editor.getText();
      const fp = buildFingerprint(text);
      
      // Skip if content hasn't actually changed
      if (fp === fingerRef.current) return;
      fingerRef.current = fp;
      
      // Adaptive debounce — larger docs need more breathing room
      const delay = text.length > 20_000 ? 800
                   : text.length > 5_000  ? 400
                   : 180;
      
      // Cancel any in-flight debounce
      clearTimeout(debounceRef.current);
      
      debounceRef.current = setTimeout(() => {
        // Use idle scheduling for non-critical updates
        scheduleIdle(() => calculate(text), { timeout: 1500 });
      }, delay);
    };
    
    // ── IME composition guards ──
    const el = editor.view.dom;
    const onCompositionStart = () => { isComposing.current = true; };
    const onCompositionEnd = () => { isComposing.current = false; handleUpdate(); };
    
    // ── Large paste detection ──
    const onPaste = (e) => {
      if ((e.clipboardData?.getData('text/plain')?.length ?? 0) > 10_000) {
        isLargePaste.current = true;
      }
    };
    
    // Wire up listeners
    el.addEventListener('compositionstart', onCompositionStart);
    el.addEventListener('compositionend', onCompositionEnd);
    el.addEventListener('paste', onPaste);
    editor.on('update', handleUpdate);
    editor.on('transaction', handleUpdate);
    
    // Initial count
    handleUpdate();
    
    // ── Cleanup ──
    return () => {
      isMounted.current = false;
      clearTimeout(debounceRef.current);
      editor.off('update', handleUpdate);
      editor.off('transaction', handleUpdate);
      el.removeEventListener('compositionstart', onCompositionStart);
      el.removeEventListener('compositionend', onCompositionEnd);
      el.removeEventListener('paste', onPaste);
      counter.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, options.debounceMs, options.thresholds?.join(','), options.useBlockLevel, options.onThresholdWarning, calculate]);
  
  // Update output tokens (for AI response tracking)
  const setOutputTokens = useCallback((tokens) => {
    counterRef.current?.recordOutputTokens(tokens);
  }, []);

  // Global listener for AI generation across the app
  useEffect(() => {
    const handleAIOutput = (e) => {
      if (e.detail?.tokens) {
        setOutputTokens(e.detail.tokens);
      }
    };
    window.addEventListener('athena:ai-tokens', handleAIOutput);
    return () => window.removeEventListener('athena:ai-tokens', handleAIOutput);
  }, [setOutputTokens]);
  
  // ── Server Reconciliation: Sync with backend actual usage ──
  useEffect(() => {
    if (!editor) return;
    
    const reconcileWithServer = async () => {
      try {
        // Get frontend local usage
        const localUsage = getTokenUsageSummary();
        
        // Fetch actual usage from backend
        const response = await fetch('/api/text-editor/ai-usage', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          console.warn('[TokenCounter] Failed to fetch server usage for reconciliation');
          return;
        }
        
        const data = await response.json();
        const serverUsage = data.usage;
        
        // Check for significant discrepancy (>10% or >500 tokens)
        const discrepancy = Math.abs(localUsage.totalTokensUsed - serverUsage.totalTokens);
        const threshold = Math.max(500, localUsage.totalTokensUsed * 0.1);
        
        if (discrepancy > threshold && serverUsage.totalTokens > 0) {
          console.log(`[TokenCounter] Reconciling: local=${localUsage.totalTokensUsed}, server=${serverUsage.totalTokens}, diff=${discrepancy}`);
          
          // Reconcile by adjusting local counter to match server
          if (counterRef.current) {
            counterRef.current.reconcileUsage(serverUsage.totalTokens);
          }
          
          // Dispatch event for UI components to update
          window.dispatchEvent(new CustomEvent('athena:token-reconciled', {
            detail: {
              local: localUsage.totalTokensUsed,
              server: serverUsage.totalTokens,
              discrepancy
            }
          }));
        }
      } catch (error) {
        console.warn('[TokenCounter] Reconciliation error:', error.message);
      }
    };
    
    // Reconcile every 2 minutes
    const interval = setInterval(reconcileWithServer, 2 * 60 * 1000);
    
    // Initial reconciliation after 30 seconds
    const initialTimeout = setTimeout(reconcileWithServer, 30 * 1000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [editor, getTokenUsageSummary]);
  
  // Get current token count immediately
  const getCurrentTokens = useCallback(() => {
    return counterRef.current?.getTokenCount() || 0;
  }, []);
  
  // Reset counter
  const resetCounter = useCallback(() => {
    counterRef.current?.reset();
  }, []);
  
  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => {
    return counterRef.current?.getPerformanceMetrics() || {};
  }, []);
  
  // Get token usage summary
  const getTokenUsageSummary = useCallback(() => {
    return counterRef.current?.getTokenUsageSummary() || {
      input: 0,
      output: 0,
      total: 0,
      sessionTotal: 0,
      efficiency: 100,
      estimatedCost: { input: 0, output: 0, total: 0 }
    };
  }, []);
  
  return {
    ...state,
    setOutputTokens,
    getCurrentTokens,
    resetCounter,
    getPerformanceMetrics,
    getTokenUsageSummary,
    counter: counterRef.current,
    // Legacy compatibility
    // Legacy compatibility - ensure cost is always an object or number
    cost: state.cost?.total ?? state.cost ?? 0,
    // Expose performance monitoring
    perf
  };
}

/**
 * Lightweight version - just token count, no extras
 * Better performance for simple use cases
 */
export function useTokenCountSimple(editor, debounceMs = 500) {
  const [tokenCount, setTokenCount] = useState(0);
  const counterRef = useRef(null);
  
  useEffect(() => {
    if (!editor) return;
    
    const counter = createTokenCounter({
      debounceMs,
      onTokenUpdate: (data) => {
        setTokenCount(data.tokens);
      }
    });
    
    counterRef.current = counter;
    
    const handleUpdate = () => {
      const text = editor.getText();
      counter.update(text);
    };
    
    editor.on('update', handleUpdate);
    
    // Initial count
    handleUpdate();
    
    return () => {
      editor.off('update', handleUpdate);
      counter.destroy();
    };
  }, [editor, debounceMs]);
  
  return tokenCount;
}

export default useTokenCounter;
