/**
 * useTokenCounter.js - Advanced React hook for real-time token counting
 * Integrates with TipTap editor for live token tracking with analytics
 * 
 * Features:
 * - Real-time input token tracking while typing
 * - Input/Output token separation for AI usage
 * - Performance metrics and cache statistics
 * - Token usage history and analytics
 * - Adaptive debounce for optimal performance
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  createTokenCounter, 
  formatTokenCount, 
  getTokenTier,
  getTokenEfficiency 
} from '../utils/realtimeTokenCounter';

/**
 * React hook for real-time token counting
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
  
  // Initialize counter
  useEffect(() => {
    if (!editor) return;
    
    // Create counter instance
    const counter = createTokenCounter({
      debounceMs: options.debounceMs || 300,
      minDebounceMs: options.minDebounceMs || 50,
      maxDebounceMs: options.maxDebounceMs || 500,
      thresholds: options.thresholds || [1000, 2000, 3000, 4000],
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
    
    // Listen to editor updates
    const handleUpdate = () => {
      const text = editor.getText();
      counter.update(text);
    };
    
    editor.on('update', handleUpdate);
    editor.on('transaction', handleUpdate);
    
    // Initial count
    handleUpdate();
    
    // Cleanup
    return () => {
      editor.off('update', handleUpdate);
      editor.off('transaction', handleUpdate);
      counter.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, options.debounceMs, options.thresholds?.join(','), options.onThresholdWarning]);
  
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
    cost: state.cost?.total ?? state.cost ?? 0
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
