/**
 * Athena Editor Logger
 * 
 * Conditional logging helper that removes all debug logs in production
 * while preserving error logs for critical issue debugging.
 * 
 * PROBLEM: Over 60 console.log/warn statements exist inside hot paths 
 * (onUpdate, onSelectionUpdate, pagination checks, paste handlers). 
 * In production each call serializes arguments and writes to the DevTools 
 * buffer — measurable as 2–5 ms overhead per event on mid-range hardware, 
 * causing typing latency.
 * 
 * SOLUTION: Replace all debug logs with conditional helpers that are no-ops in production
 * 
 * @example
 * import { log, warn, error } from '@/utils/logger';
 * 
 * log('Debug info:', data);        // Only in development
 * warn('Warning message');          // Only in development
 * error('Critical error:', err);    // Always enabled
 */

// Development mode detection
const isDev = process.env.NODE_ENV === 'development';

/**
 * Log debug information
 * Disabled in production to prevent performance overhead
 * 
 * @param  {...any} args - Arguments to log
 */
export const log = isDev
  ? (...args) => console.log(...args)
  : () => { };

/**
 * Log warnings
 * Disabled in production to prevent performance overhead
 * 
 * @param  {...any} args - Arguments to warn
 */
export const warn = isDev
  ? (...args) => console.warn(...args)
  : () => { };

/**
 * Log errors
 * ALWAYS enabled in both development and production for debugging critical issues
 * 
 * @param  {...any} args - Arguments to error
 */
export const error = (...args) => console.error(...args);

/**
 * Performance logging utility
 * Measures execution time of code blocks
 * 
 * @param {string} label - Label for the timing measurement
 * @returns {Function} Stop function
 * 
 * @example
 * const stop = perfStart('pagination');
 * // ... do work
 * stop(); // Logs: "pagination: 12.34ms"
 */
export const perfStart = isDev
  ? (label) => {
      const start = performance.now();
      return () => {
        const duration = performance.now() - start;
        console.log(`⏱️ [${label}]: ${duration.toFixed(2)}ms`);
      };
    }
  : () => () => { };

/**
 * Group related logs together
 * Creates a collapsible group in browser console
 * 
 * @param {string} label - Group label
 * @param {Function} callback - Function to execute within the group
 */
export const logGroup = isDev
  ? (label, callback) => {
      console.group(label);
      try {
        callback();
      } finally {
        console.groupEnd();
      }
    }
  : (_, callback) => callback();

/**
 * Table logging for structured data
 * Displays data in table format in console
 * 
 * @param {Array|Object} data - Data to display as table
 * @param {Array} [columns] - Optional column filter
 */
export const logTable = isDev
  ? (data, columns) => console.table(data, columns)
  : () => { };

/**
 * Count how many times a line is hit
 * Useful for tracking execution frequency
 * 
 * @param {string} label - Counter label
 */
export const count = isDev
  ? (label) => {
      if (!count.counters) count.counters = {};
      count.counters[label] = (count.counters[label] || 0) + 1;
      console.log(`🔢 [${label}]: ${count.counters[label]}`);
    }
  : () => { };

/**
 * Reset counter for a specific label
 * 
 * @param {string} label - Counter label
 */
export const countReset = (label) => {
  if (count.counters) {
    count.counters[label] = 0;
  }
};

// Export default logger object for convenience
export default {
  log,
  warn,
  error,
  perfStart,
  logGroup,
  logTable,
  count,
  countReset,
};
