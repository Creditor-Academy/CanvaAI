/**
 * AIQuotaBadge.jsx - Display user's AI token quota status
 * Shows remaining quota with visual indicator
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { getQuotaStatus } from '../../services/aiAnalytics.service';
import { toast } from 'sonner';

export const AIQuotaBadge = ({ className = '' }) => {
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchQuotaStatus();
  }, []);

  const fetchQuotaStatus = async () => {
    try {
      const data = await getQuotaStatus();
      setQuota(data);
    } catch (error) {
      console.error('Failed to fetch quota:', error);
      // Silently fail - don't block UI
    } finally {
      setLoading(false);
    }
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600 bg-red-50 border-red-200';
    if (percentage >= 75) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getIcon = (percentage) => {
    if (percentage >= 90) return <AlertTriangle className="w-3.5 h-3.5" />;
    if (percentage >= 75) return <AlertTriangle className="w-3.5 h-3.5" />;
    return <Zap className="w-3.5 h-3.5" />;
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 text-xs text-slate-400 ${className}`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!quota) {
    return null; // Don't show if quota info unavailable
  }

  const percentage = parseFloat(quota.monthly.percentage);
  const colorClass = getUsageColor(percentage);
  const progressColor = getProgressColor(percentage);

  return (
    <div className={`relative ${className}`}>
      {/* Badge */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${colorClass}`}
        title="AI Quota Status"
      >
        {getIcon(percentage)}
        <span>{percentage}% used</span>
      </motion.button>

      {/* Details Dropdown */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50"
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">AI Token Usage</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Monthly Quota</span>
                <span>{percentage}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full ${progressColor} rounded-full`}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-[10px] text-slate-500 mb-0.5">Used</div>
                <div className="text-sm font-semibold text-slate-900">
                  {(quota.monthly.used / 1000).toFixed(1)}K
                </div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-[10px] text-slate-500 mb-0.5">Remaining</div>
                <div className="text-sm font-semibold text-slate-900">
                  {(quota.monthly.remaining / 1000).toFixed(1)}K
                </div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-[10px] text-slate-500 mb-0.5">Requests</div>
                <div className="text-sm font-semibold text-slate-900">
                  {quota.requests}
                </div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-[10px] text-slate-500 mb-0.5">Cost</div>
                <div className="text-sm font-semibold text-slate-900">
                  ${quota.cost.toFixed(3)}
                </div>
              </div>
            </div>

            {/* Tier Info */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Plan</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {quota.tier}
                </span>
              </div>
              {percentage >= 90 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-xs text-red-700 font-medium">
                    ⚠️ You're approaching your monthly limit
                  </p>
                  <button
                    onClick={() => {
                      toast.info('Upgrade feature coming soon!');
                    }}
                    className="mt-1 text-xs text-red-600 hover:text-red-700 underline font-medium"
                  >
                    Upgrade your plan →
                  </button>
                </motion.div>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchQuotaStatus}
              className="w-full py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Refresh
            </button>
          </div>
        </motion.div>
      )}

      {/* Click outside to close */}
      {showDetails && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};

export default AIQuotaBadge;
