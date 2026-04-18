/**
 * RealtimeTokenBadge.jsx - Display real-time token usage in editor
 * Shows live token count with color-coded tiers and estimated cost
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, DollarSign, AlertTriangle, Info } from 'lucide-react';
import { useTokenCounter } from '../../../../hooks/useTokenCounter';

export const RealtimeTokenBadge = ({ editor, className = '' }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [recentDelta, setRecentDelta] = useState(null);
  
  const {
    tokens,
    delta,
    deltaFormatted,
    tier,
    cost,
    formattedTokens,
    thresholdsTriggered,
    isReady
  } = useTokenCounter(editor, {
    debounceMs: 300,
    thresholds: [1000, 2000, 3000, 4000],
  });
  
  // Show delta animation
  useEffect(() => {
    if (delta !== 0) {
      setRecentDelta(delta);
      const timer = setTimeout(() => setRecentDelta(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [delta]);
  
  if (!isReady || !editor) {
    return null;
  }
  
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
  
  return (
    <div className={`relative ${className}`}>
      {/* Main Badge */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${getBadgeColor()}`}
        title={`Token Usage: ${formattedTokens} (${tier.label})`}
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
      
      {/* Details Dropdown */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 p-3 z-[350]"
          >
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  Token Usage
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              </div>
              
              {/* Main Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md border border-blue-100">
                  <div className="text-[9px] text-slate-500 mb-0.5 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" />
                    Input Tokens
                  </div>
                  <div className="text-base font-bold text-slate-900 tabular-nums">
                    {formattedTokens}
                  </div>
                  <div className="text-[8px] text-slate-500 mt-0.5">
                    {tokens.toLocaleString()} total
                  </div>
                </div>
                
                <div className="p-2 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-md border border-emerald-100">
                  <div className="text-[9px] text-slate-500 mb-0.5 flex items-center gap-1">
                    <DollarSign className="w-2.5 h-2.5" />
                    Est. Cost
                  </div>
                  <div className="text-base font-bold text-slate-900 tabular-nums">
                    ${cost.toFixed(4)}
                  </div>
                  <div className="text-[8px] text-slate-500 mt-0.5">
                    gpt-4o-mini rate
                  </div>
                </div>
              </div>
              
              {/* Tier Indicator */}
              <div className="p-2 bg-slate-50 rounded-md border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-600">Usage Level</span>
                  <span className={`text-[10px] font-semibold capitalize text-${tier.color}-600`}>
                    {tier.label}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((tokens / 4000) * 100, 100)}%` }}
                    transition={{ duration: 0.3 }}
                    className={`h-full bg-${tier.color}-500 rounded-full`}
                  />
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[8px] text-slate-400">0</span>
                  <span className="text-[8px] text-slate-400">4,000</span>
                </div>
              </div>
              
              {/* Threshold Warnings */}
              {thresholdsTriggered.length > 0 && (
                <div className="p-2 bg-amber-50 rounded-md border border-amber-200">
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-medium text-amber-900 mb-0.5">
                        Thresholds Exceeded
                      </div>
                      <div className="text-[9px] text-amber-700">
                        {thresholdsTriggered.map(t => `${t.toLocaleString()} tokens`).join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tips */}
              <div className="p-2 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-[9px] text-blue-800 space-y-0.5">
                    <p className="font-medium">💡 Tips:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                      <li>Keep under 4,000 tokens</li>
                      <li>Use summaries for long docs</li>
                      <li>Split large documents</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Live Delta */}
              {delta !== 0 && (
                <div className="text-center text-[10px] text-slate-600 py-0.5">
                  <span className="font-medium">Last change:</span>{' '}
                  <span className={delta > 0 ? 'text-emerald-600' : 'text-red-600'}>
                    {deltaFormatted} tokens
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

export default RealtimeTokenBadge;
