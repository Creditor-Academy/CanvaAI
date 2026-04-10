/**
 * useTokenCounter.js - React hook for real-time token counting
 * Integrates with TipTap editor for live token tracking
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
    cost: 0,
    formattedTokens: '0',
    thresholdsTriggered: [],
    isReady: false
  });
  
  const counterRef = useRef(null);
  const outputTokensRef = useRef(0);
  
  // Initialize counter
  useEffect(() => {
    if (!editor) return;
    
    // Create counter instance
    const counter = createTokenCounter({
      debounceMs: options.debounceMs || 300,
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
          isReady: true
        }));
      },
      onThresholdWarning: (warning) => {
        console.warn(`⚠️ Token threshold exceeded: ${warning.message}`);
        
        // Can integrate with toast notifications here
        if (options.onThresholdWarning) {
          options.onThresholdWarning(warning);
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
  }, [editor, options.debounceMs, options.thresholds, options.onThresholdWarning]);
  
  // Update output tokens (for efficiency calculation)
  const setOutputTokens = useCallback((tokens) => {
    outputTokensRef.current = tokens;
    
    setState(prev => ({
      ...prev,
      efficiency: getTokenEfficiency(prev.tokens, tokens)
    }));
  }, []);
  
  // Get current token count immediately
  const getCurrentTokens = useCallback(() => {
    return counterRef.current?.getTokenCount() || 0;
  }, []);
  
  // Reset counter
  const resetCounter = useCallback(() => {
    counterRef.current?.reset();
    outputTokensRef.current = 0;
  }, []);
  
  return {
    ...state,
    setOutputTokens,
    getCurrentTokens,
    resetCounter,
    counter: counterRef.current
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
