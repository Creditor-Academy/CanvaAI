/**
 * TokenCounterDemo.jsx - Demo component showing all token counter features
 * Use this to test and understand the enhanced token counting system
 */

import React from 'react';
import { useTokenCounter } from '../../../../hooks/useTokenCounter';
import { EnhancedTokenBadge } from './EnhancedTokenBadge';

export const TokenCounterDemo = ({ editor }) => {
  const {
    // Basic metrics
    tokens,
    delta,
    deltaFormatted,
    tier,
    cost,
    formattedTokens,
    isReady,
    
    // Enhanced metrics
    inputTokens,
    outputTokens,
    totalTokens,
    totalTokensUsed,
    efficiency,
    performance,
    
    // Utility functions
    setOutputTokens,
    getCurrentTokens,
    resetCounter,
    getPerformanceMetrics,
    getTokenUsageSummary,
    
    counter
  } = useTokenCounter(editor, {
    debounceMs: 300,
    minDebounceMs: 50,
    maxDebounceMs: 500,
    thresholds: [500, 1000, 2000, 3000, 4000],
    onThresholdWarning: (warning) => {
      console.warn('⚠️ Threshold Warning:', warning.message);
    },
    onPerformanceUpdate: (metrics) => {
      console.log('📊 Performance Update:', metrics);
    }
  });

  // Demo: Simulate AI output tokens
  const simulateAIGeneration = () => {
    // Simulate AI generating 500 tokens of output
    const aiOutputTokens = 500;
    setOutputTokens(aiOutputTokens);
    console.log(`✅ Recorded ${aiOutputTokens} AI output tokens`);
  };

  // Demo: Get current usage summary
  const logUsageSummary = () => {
    const summary = getTokenUsageSummary();
    console.log('📈 Usage Summary:', summary);
    alert(`Usage Summary:\n${JSON.stringify(summary, null, 2)}`);
  };

  // Demo: Get performance metrics
  const logPerformanceMetrics = () => {
    const metrics = getPerformanceMetrics();
    console.log('⚡ Performance Metrics:', metrics);
    alert(`Performance Metrics:\n${JSON.stringify(metrics, null, 2)}`);
  };

  // Demo: Reset counter
  const handleReset = () => {
    resetCounter();
    console.log('🔄 Counter reset');
  };

  if (!isReady || !editor) {
    return <div className="p-4 text-slate-500">Editor not ready...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          🎯 Enhanced Token Counter Demo
        </h1>

        {/* Enhanced Token Badge */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">
            Interactive Token Badge (Click to see full dashboard)
          </h2>
          <EnhancedTokenBadge editor={editor} />
        </div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs text-blue-600 mb-1">Input Tokens</div>
            <div className="text-2xl font-bold text-blue-900">{inputTokens.toLocaleString()}</div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-xs text-purple-600 mb-1">AI Output</div>
            <div className="text-2xl font-bold text-purple-900">{outputTokens.toLocaleString()}</div>
          </div>
          
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="text-xs text-emerald-600 mb-1">Efficiency</div>
            <div className="text-2xl font-bold text-emerald-900">{efficiency}%</div>
          </div>
          
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-xs text-amber-600 mb-1">Est. Cost</div>
            <div className="text-2xl font-bold text-amber-900">${cost.total?.toFixed(4) || '0.0000'}</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">⚡ Performance Metrics</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-500">Calculation Time</div>
              <div className="text-lg font-mono font-bold text-slate-900">
                {performance.calculationTime?.toFixed(2) || '0.00'}ms
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Avg Time</div>
              <div className="text-lg font-mono font-bold text-slate-900">
                {performance.averageCalculationTime?.toFixed(2) || '0.00'}ms
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Cache Hit</div>
              <div className="text-lg font-mono font-bold text-emerald-600">
                {performance.cacheHit ? '✅ Yes' : '❌ No'}
              </div>
            </div>
          </div>
        </div>

        {/* Usage Tier */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">📊 Usage Level</h2>
          <div className="flex items-center gap-4">
            <span className={`text-lg font-bold capitalize text-${tier.color}-600`}>
              {tier.label}
            </span>
            <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-${tier.color}-500 rounded-full transition-all duration-300`}
                style={{ width: `${Math.min((tokens / 4000) * 100, 100)}%` }}
              />
            </div>
            <span className="text-sm font-mono text-slate-600">{formattedTokens} / 4K</span>
          </div>
        </div>

        {/* Delta Display */}
        {delta !== 0 && (
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <h2 className="text-sm font-semibold text-indigo-700 mb-2">📈 Last Change</h2>
            <div className={`text-3xl font-bold ${delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {deltaFormatted} tokens
            </div>
          </div>
        )}

        {/* Demo Controls */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <h2 className="text-sm font-semibold text-purple-700 mb-3">🎮 Demo Controls</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={simulateAIGeneration}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              🤖 Simulate AI Generation (500 tokens)
            </button>
            
            <button
              onClick={logUsageSummary}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              📊 Log Usage Summary
            </button>
            
            <button
              onClick={logPerformanceMetrics}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              ⚡ Log Performance Metrics
            </button>
            
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              🔄 Reset Counter
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-sm font-semibold text-blue-700 mb-2">💡 How to Test</h2>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Type in the editor to see real-time token updates</li>
            <li>Paste large text to test adaptive debounce</li>
            <li>Click "Simulate AI Generation" to test output token tracking</li>
            <li>Watch the efficiency score change based on input/output ratio</li>
            <li>Check console for detailed performance metrics</li>
            <li>Click the token badge to see the full analytics dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TokenCounterDemo;
