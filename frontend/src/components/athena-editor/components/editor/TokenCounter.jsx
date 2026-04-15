/**
 * TokenCounter.jsx - AI Token counter for editor status bar
 * ONLY counts AI-generated content, NOT user-typed content
 * Shows real-time AI token usage with color-coded levels
 */

import React, { useMemo, useState, useEffect } from 'react';
import { estimateTokensFast } from '../../../../utils/realtimeTokenCounter';

const TokenCounter = ({ editor, compact = true }) => {
  const [aiTokens, setAiTokens] = useState(0);
  const [aiContentLength, setAiContentLength] = useState(0);
  const [lastAiUpdate, setLastAiUpdate] = useState(0);

  // Track AI-generated content
  useEffect(() => {
    if (!editor) return;

    // Listen for AI content insertion events
    const handleAiContent = (event) => {
      const { content, type } = event.detail;
      
      // Calculate tokens for AI-generated content
      if (content && typeof content === 'string') {
        const tokenResult = estimateTokensFast(content);
        const newTokens = tokenResult.tokens || 0;
        
        setAiTokens(prev => prev + newTokens);
        setAiContentLength(prev => prev + content.length);
        setLastAiUpdate(Date.now());
        
        console.log(`🤖 AI Token Count: +${newTokens} tokens (${type})`);
      }
    };

    // Listen for custom AI content events
    window.addEventListener('ai-content-inserted', handleAiContent);
    
    // Also listen for AI generation completion
    const handleAiComplete = (event) => {
      const { content, action } = event.detail;
      
      if (content) {
        const tokenResult = estimateTokensFast(content);
        const tokens = tokenResult.tokens || 0;
        
        setAiTokens(tokens);
        setAiContentLength(content.length);
        setLastAiUpdate(Date.now());
        
        console.log(`🤖 AI ${action}: ${tokens} tokens generated`);
      }
    };
    
    window.addEventListener('ai-generation-complete', handleAiComplete);

    // 🔥 NEW: Listen for AI quick actions (expand, rewrite, summarize, etc.)
    const handleAiTokens = (event) => {
      const { tokens } = event.detail;
      
      if (tokens && typeof tokens === 'number') {
        setAiTokens(prev => prev + tokens);
        setLastAiUpdate(Date.now());
        
        console.log(`🤖 AI Quick Action: +${tokens} tokens`);
      }
    };
    
    window.addEventListener('athena:ai-tokens', handleAiTokens);

    return () => {
      window.removeEventListener('ai-content-inserted', handleAiContent);
      window.removeEventListener('ai-generation-complete', handleAiComplete);
      window.removeEventListener('athena:ai-tokens', handleAiTokens);
    };
  }, [editor]);

  // Color mapping for different tiers
  const tierColors = useMemo(() => ({
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    orange: 'text-orange-600',
    red: 'text-red-600'
  }), []);

  // Determine tier based on AI tokens
  const getTier = useMemo(() => {
    if (aiTokens < 1000) return { level: 'low', color: 'green', label: 'Low AI Usage' };
    if (aiTokens < 2000) return { level: 'medium', color: 'yellow', label: 'Medium AI Usage' };
    if (aiTokens < 3000) return { level: 'high', color: 'orange', label: 'High AI Usage' };
    return { level: 'very-high', color: 'red', label: 'Very High AI Usage' };
  }, [aiTokens]);

  // Format token count
  const formattedTokens = useMemo(() => {
    if (aiTokens < 1000) return aiTokens.toString();
    if (aiTokens < 1000000) return `${(aiTokens / 1000).toFixed(1)}K`;
    return `${(aiTokens / 1000000).toFixed(1)}M`;
  }, [aiTokens]);

  if (!editor) {
    return null;
  }

  // Compact mode for status bar
  if (compact) {
    return (
      <div 
        className="flex items-center gap-1.5 cursor-pointer" 
        title={`AI Generated: ${aiTokens.toLocaleString()} tokens (${aiContentLength.toLocaleString()} chars)`}
        onClick={() => {
          // Show AI content summary on click
          const summary = {
            aiTokens,
            aiContentLength,
            lastAiUpdate: lastAiUpdate ? new Date(lastAiUpdate).toLocaleTimeString() : 'Never',
            estimatedCost: `$${(aiTokens * 0.00001).toFixed(4)}`
          };
          console.log('🤖 AI Content Summary:', summary);
          alert(`🤖 AI Content Summary:\n\nTokens: ${aiTokens.toLocaleString()}\nCharacters: ${aiContentLength.toLocaleString()}\nLast Update: ${summary.lastAiUpdate}\nEstimated Cost: ${summary.estimatedCost}`);
        }}
      >
        <div className={`w-2 h-2 rounded-full bg-${getTier.color}-500`}></div>
        <span className={`font-medium ${tierColors[getTier.color]}`}>
          {formattedTokens} AI tokens
        </span>
      </div>
    );
  }

  // Extended mode with more details
  return (
    <div className="flex items-center gap-3" title={`AI Generated Content - ${getTier.label}`}>
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full bg-${getTier.color}-500`}></div>
        <span className={`font-semibold ${tierColors[getTier.color]}`}>
          {formattedTokens}
        </span>
        <span className="text-gray-500">AI tokens</span>
      </div>
      <div className="text-xs text-gray-400">
        {getTier.label}
      </div>
    </div>
  );
};

export default TokenCounter;
