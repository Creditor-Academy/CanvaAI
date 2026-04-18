/**
 * EnhancedTokenBadge.jsx - Advanced AI token usage display with analytics
 * ONLY tracks AI-generated content, NOT user-typed content
 * Shows real-time AI token count, cost, and efficiency metrics
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Info,
  Activity,
  BarChart3,
  Clock,
  Target,
  Database
} from 'lucide-react';
import { estimateTokensSync } from '../../../../utils/realtimeTokenCounter';

export const EnhancedTokenBadge = ({ editor, className = '' }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [aiTokens, setAiTokens] = useState(0);
  const [aiContentLength, setAiContentLength] = useState(0);
  const [lastAiUpdate, setLastAiUpdate] = useState(0);
  const [recentDelta, setRecentDelta] = useState(null);
  const [thresholdsTriggered, setThresholdsTriggered] = useState([]);
  
  // Track AI-generated content via events
  useEffect(() => {
    if (!editor) return;

    const handleAiContent = (event) => {
      const { content, type } = event.detail;
      
      if (content && typeof content === 'string') {
        const newTokens = estimateTokensSync(content);
        
        setAiTokens(prev => {
          const updated = prev + newTokens;
          
          // Check thresholds
          const thresholds = [1000, 2000, 3000, 4000];
          const triggered = thresholds.filter(t => prev < t && updated >= t);
          if (triggered.length > 0) {
            setThresholdsTriggered(prev => [...prev, ...triggered]);
          }
          
          return updated;
        });
        
        setAiContentLength(prev => prev + content.length);
        setLastAiUpdate(Date.now());
        
        // Show delta animation
        setRecentDelta(newTokens);
        setTimeout(() => setRecentDelta(null), 1000);
        
        console.log(`🤖 EnhancedTokenBadge: +${newTokens} AI tokens (${type})`);
      }
    };

    const handleAiComplete = (event) => {
      const { content, action } = event.detail;
      
      if (content) {
        const tokens = estimateTokensSync(content);
        
        setAiTokens(tokens);
        setAiContentLength(content.length);
        setLastAiUpdate(Date.now());
        
        setRecentDelta(tokens);
        setTimeout(() => setRecentDelta(null), 1000);
        
        console.log(`🤖 EnhancedTokenBadge: ${action} - ${tokens} AI tokens`);
      }
    };
    
    window.addEventListener('ai-content-inserted', handleAiContent);
    window.addEventListener('ai-generation-complete', handleAiComplete);

    // 🔥 NEW: Listen for AI quick actions (expand, rewrite, summarize, image gen, etc.)
    const handleAiTokens = (event) => {
      const { tokens } = event.detail;
      
      if (tokens && typeof tokens === 'number') {
        setAiTokens(prev => {
          const updated = prev + tokens;
          
          // Check thresholds
          const thresholds = [1000, 2000, 3000, 4000];
          const triggered = thresholds.filter(t => prev < t && updated >= t);
          if (triggered.length > 0) {
            setThresholdsTriggered(prev => [...prev, ...triggered]);
          }
          
          return updated;
        });
        
        setLastAiUpdate(Date.now());
        
        // Show delta animation
        setRecentDelta(tokens);
        setTimeout(() => setRecentDelta(null), 1000);
        
        console.log(`🤖 EnhancedTokenBadge: AI Quick Action +${tokens} tokens`);
      }
    };
    
    window.addEventListener('athena:ai-tokens', handleAiTokens);

    return () => {
      window.removeEventListener('ai-content-inserted', handleAiContent);
      window.removeEventListener('ai-generation-complete', handleAiComplete);
      window.removeEventListener('athena:ai-tokens', handleAiTokens);
    };
  }, [editor]);
  
  // Calculate derived values
  const tier = useMemo(() => {
    if (aiTokens < 1000) return { level: 'low', color: 'green', label: 'Low AI Usage' };
    if (aiTokens < 2000) return { level: 'medium', color: 'yellow', label: 'Medium AI Usage' };
    if (aiTokens < 3000) return { level: 'high', color: 'orange', label: 'High AI Usage' };
    return { level: 'very-high', color: 'red', label: 'Very High AI Usage' };
  }, [aiTokens]);
  
  const formattedTokens = useMemo(() => {
    if (aiTokens < 1000) return aiTokens.toString();
    if (aiTokens < 1000000) return `${(aiTokens / 1000).toFixed(1)}K`;
    return `${(aiTokens / 1000000).toFixed(1)}M`;
  }, [aiTokens]);
  
  const cost = useMemo(() => ({
    total: aiTokens * 0.00001, // gpt-4o-mini rate
    input: aiTokens * 0.000005,
    output: aiTokens * 0.000015
  }), [aiTokens]);
  
  const efficiency = useMemo(() => {
    // AI efficiency based on token usage vs content length
    if (aiContentLength === 0) return 100;
    const tokensPerChar = aiTokens / aiContentLength;
    // Lower is better (more efficient)
    return Math.max(0, Math.min(100, 100 - (tokensPerChar * 100)));
  }, [aiTokens, aiContentLength]);
  
  if (!editor) {
    return null;
  }
  
  const totalCost = cost.total;
  
  const getBadgeColor = () => {
    switch (tier.color) {
      case 'green':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'yellow':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'orange':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'red':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };
  
  const getIcon = () => {
    if (tier.level === 'critical') {
      return <AlertTriangle className="w-3.5 h-3.5" />;
    }
    return <Zap className="w-3.5 h-3.5" />;
  };
  
  const getEfficiencyColor = (eff) => {
    if (eff >= 80) return 'text-emerald-600';
    if (eff >= 60) return 'text-yellow-600';
    if (eff >= 40) return 'text-orange-600';
    return 'text-red-600';
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Main Badge */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${getBadgeColor()}`}
        title={`AI Token Usage: ${formattedTokens} (${tier.label})`}
      >
        {getIcon()}
        <span className="tabular-nums">{formattedTokens}</span>
        
        {/* Delta indicator */}
        <AnimatePresence>
          {recentDelta !== null && recentDelta !== 0 && (
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`text-[10px] ${recentDelta > 0 ? 'text-emerald-500' : 'text-red-500'}`}
            >
              {recentDelta > 0 ? '↑' : '↓'}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      
      {/* Enhanced Details Dropdown */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-[350] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                AI Token Usage Analytics
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-2.5 max-h-[420px] overflow-y-auto">
              {/* Main Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* AI Input Tokens */}
                <div className="p-2.5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    AI Input Tokens
                  </div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">
                    {aiTokens.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    AI-generated content
                  </div>
                </div>
                
                {/* AI Output Tokens */}
                <div className="p-2.5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                  <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    AI Output
                  </div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">
                    {aiTokens.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    Generated by AI
                  </div>
                </div>
                
                {/* Total AI Tokens */}
                <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
                  <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Total AI Used
                  </div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">
                    {aiTokens.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    AI session total
                  </div>
                </div>
                
                {/* Estimated Cost */}
                <div className="p-2.5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                  <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Est. Cost
                  </div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">
                    ${totalCost.toFixed(4)}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    gpt-4o-mini rate
                  </div>
                </div>
              </div>
              
              {/* Efficiency Score */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Efficiency Score
                  </span>
                  <span className={`text-xs font-bold ${getEfficiencyColor(efficiency)}`}>
                    {efficiency}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${efficiency}%` }}
                    transition={{ duration: 0.3 }}
                    className={`h-full rounded-full ${
                      efficiency >= 80 ? 'bg-emerald-500' :
                      efficiency >= 60 ? 'bg-yellow-500' :
                      efficiency >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                  />
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                  {efficiency >= 80 ? '✅ Excellent token utilization' :
                   efficiency >= 60 ? '⚠️ Good, but can be optimized' :
                   '🔴 Consider optimizing prompts'}
                </div>
              </div>
              
              {/* Usage Level */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-600">Current Usage Level</span>
                  <span className={`text-xs font-semibold capitalize text-${tier.color}-600`}>
                    {tier.label}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((aiTokens / 4000) * 100, 100)}%` }}
                    transition={{ duration: 0.3 }}
                    className={`h-full bg-${tier.color}-500 rounded-full`}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-slate-400">0</span>
                  <span className="text-[9px] text-slate-400">4,000</span>
                </div>
              </div>
              
              {/* Performance Metrics Toggle */}
              <button
                onClick={() => setShowPerformance(!showPerformance)}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center justify-between"
              >
                <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  Performance Metrics
                </span>
                <motion.span
                  animate={{ rotate: showPerformance ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-slate-400"
                >
                  ▼
                </motion.span>
              </button>
              
              {/* Performance Metrics Panel */}
              <AnimatePresence>
                {showPerformance && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Avg. Calculation Time
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-900">
                          {performance.averageCalculationTime?.toFixed(2) || '0.00'}ms
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-600">Cache Hit Rate</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-600">
                          {getPerformanceMetrics()?.cacheHitRate || '0%'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-600">Total Calculations</span>
                        <span className="text-[10px] font-mono font-bold text-slate-900">
                          {getPerformanceMetrics()?.totalCalculations?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Threshold Warnings */}
              {thresholdsTriggered.length > 0 && (
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-amber-900 mb-1">
                        Thresholds Exceeded
                      </div>
                      <div className="text-[10px] text-amber-700">
                        {thresholdsTriggered.map(t => `${t.toLocaleString()} tokens`).join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tips */}
              <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-[10px] text-blue-800 space-y-1">
                    <p className="font-medium">💡 Token Optimization Tips:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                      <li>Keep documents under 4,000 tokens for best performance</li>
                      <li>Use concise prompts to reduce input tokens</li>
                      <li>Split large documents into sections</li>
                      <li>Monitor efficiency score for AI interactions</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Live Delta */}
              {recentDelta !== null && recentDelta !== 0 && (
                <div className="text-center text-xs text-slate-600 py-1">
                  <span className="font-medium">Last AI change:</span>{' '}
                  <span className={recentDelta > 0 ? 'text-emerald-600' : 'text-red-600'}>
                    +{recentDelta.toLocaleString()} AI tokens
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Click outside to close */}
      {showDetails && (
        <div
          className="fixed inset-0 z-[340]"
          onClick={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};

export default EnhancedTokenBadge;
