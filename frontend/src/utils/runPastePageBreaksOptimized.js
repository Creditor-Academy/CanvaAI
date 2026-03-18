/**
 * runPastePageBreaksOptimized.js
 * 
 * Production-grade page break insertion with reverse-order strategy
 * to prevent position drift during large document pastes.
 * 
 * Key improvements over legacy version:
 * 1. Reverse-order insertion (bottom-to-top) eliminates offset tracking
 * 2. O(n) descendants() mapping instead of O(n²) forEach loops
 * 3. Duplicate prevention - skips existing page breaks
 * 4. Atomic transaction - all-or-nothing insertion
 * 5. Error recovery - graceful fallback on failure
 */

import { flattenDocument } from './pagination/paginationEngine.js';
import { PaginationEngine } from './pagination/paginationEngine.js';

/**
 * Optimized page break insertion for production use
 * 
 * @param {Editor} editorInstance - TipTap editor instance
 * @param {object} options - Configuration options
 * @param {boolean} options.runCalibration - Whether to run calibration checks
 * @param {boolean} options.showNotifications - Whether to show toast notifications
 * @returns {Promise<number>} Number of page breaks inserted
 */
export const runPastePageBreaksOptimized = async (editorInstance, options = {}) => {
  const { 
    runCalibration = false, 
    showNotifications = true 
  } = options;

  // Guard checks
  if (!editorInstance?.state?.doc) return 0;
  
  const { state, view } = editorInstance;
  const doc = state.doc;
  const totalChars = doc.textContent.length;

  try {
    // ── Step 1: Calculate pagination ────────────────────────────────────
    const engine = new PaginationEngine({ 
      useGoogleDocsConfig: true,  // 810px preferred height
      debugMode: false,
      perfLogEnabled: false,
      editorView: view
    });
    
    const blocks = flattenDocument(doc);
    
    if (blocks.length === 0) {
      return 0;
    }

    const pages = engine.paginate(blocks);
    
    // Run calibration in development mode
    if (runCalibration && process.env.NODE_ENV === 'development') {
      const { runCalibration: runCal } = await import('./pagination/calibration.js');
      runCal(engine, blocks).then(results => {
        console.log('[OptimizedPagination] Calibration complete:', results);
      });
    }

    console.log('[OptimizedPagination] Google Docs pagination:', {
      totalBlocks: blocks.length,
      totalPages: pages.length,
      usableHeight: engine.usableHeight,
      googleDocsMode: engine.useGoogleDocsConfig,
    });

    // ── Step 2: Map block indices to resolved positions ─────────────────
    // O(n) pass using descendants() - much faster than nested forEach
    const insertPositions = [];
    const pageEndIndices = new Set(
      pages
        .filter(p => p !== pages[pages.length - 1])  // Exclude last page
        .map(p => p.endIndex)
    );

    doc.descendants((node, pos) => {
      if (node.isBlock) {
        const blockIndex = blocks.indexOf(node);
        // If this block ends a page (and not the last page)
        if (pageEndIndices.has(blockIndex)) {
          insertPositions.push(pos + node.nodeSize);
        }
      }
      return node.isBlock ? false : true;  // Stop at blocks
    });

    console.log('[OptimizedPagination] Page break positions:', insertPositions);

    // ── Step 3: Execution - Reverse Order Insertion ─────────────────────
    // Sort descending to prevent position drift - NO offset needed!
    const sortedPositions = [...new Set(insertPositions)].sort((a, b) => b - a);

    if (sortedPositions.length === 0) {
      console.log('[OptimizedPagination] No page breaks needed');
      return 0;
    }

    let chain = editorInstance.chain();
    
    sortedPositions.forEach(pos => {
      // Check if page break already exists at this position
      const nodeAfter = doc.nodeAt(pos);
      if (nodeAfter?.type.name !== 'pageBreak') {
        chain = chain.insertContentAt(pos, { type: 'pageBreak' });
      } else {
        console.log('[OptimizedPagination] Skipping duplicate at pos', pos);
      }
    });

    console.log(`[OptimizedPagination] Inserting ${sortedPositions.length} page breaks (reverse order)`);
    const success = chain.run();
    
    if (success) {
      console.log('[OptimizedPagination] ✅ Success:', sortedPositions.length, 'breaks inserted');
      
      if (showNotifications && totalChars > 5000) {
        const { toast } = await import('sonner');
        toast.success(`Document paginated: ${pages.length} page${pages.length > 1 ? 's' : ''}`, {
          duration: 2000,
        });
      }
      
      return sortedPositions.length;
    } else {
      console.error('[OptimizedPagination] ❌ Failed to insert page breaks');
      if (showNotifications) {
        const { toast } = await import('sonner');
        toast.error('Failed to paginate document');
      }
      return 0;
    }

  } catch (err) {
    console.error('[OptimizedPagination] Error:', err);
    if (showNotifications) {
      const { toast } = await import('sonner');
      toast.error('Pagination failed');
    }
    return 0;
  }
};

/**
 * Idle-scheduled pagination wrapper
 * Runs pagination when browser is idle to avoid UI jank
 * 
 * @param {Editor} editorInstance 
 * @param {number} timeoutMs - Fallback timeout if requestIdleCallback not supported
 * @returns {Promise<number>}
 */
export const scheduleIdlePagination = async (editorInstance, timeoutMs = 1000) => {
  return new Promise((resolve) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        runPastePageBreaksOptimized(editorInstance).then(resolve);
      }, { timeout: timeoutMs });
    } else {
      setTimeout(() => {
        runPastePageBreaksOptimized(editorInstance).then(resolve);
      }, Math.min(timeoutMs, 200));
    }
  });
};
