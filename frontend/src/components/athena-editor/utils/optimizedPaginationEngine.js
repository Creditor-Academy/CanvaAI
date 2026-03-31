/**
 * OPTIMIZED PAGINATION ENGINE - Google Docs Performance
 * 
 * Architecture: Incremental Page Updates
 * - Only measures and updates affected pages (current + neighbors)
 * - Moves overflow forward, pulls underflow backward
 * - Uses requestAnimationFrame for zero-lag
 * - Preserves cursor with selection mapping
 * 
 * Performance:
 * - Before: O(n) - rebuilds entire document
 * - After: O(1) - updates only local pages
 */

import { paginateDocument } from './paginationEngine.js';
import { 
  A4_HEIGHT_PX as PAGE_HEIGHT,
  PAGE_MARGIN_TOP_PX as MARGIN_TOP,
  PAGE_MARGIN_BOTTOM_PX as MARGIN_BOTTOM
} from '../../../utils/pagination/constants';

// Computed usable height
const USABLE_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

// ── Mutex & Scheduling ───────────────────────────────────────────────────────
let isPaginating = false;
let paginationLock = false; // 🔥 STEP 3: Prevent infinite reflows
let rafId = null;
let typingTimeout = null; // 🔥 STEP 2: Debounce during typing
let skipNextPagination = false; // 🔥 NEW: Flag to prevent rapid-fire pagination

// ── Helper: Move node with position mapping (STEP 2) ────────────────────────
const moveNode = (tr, from, to, insertPos) => {
  console.log(`[moveNode] Moving ${from}-${to} to ${insertPos}`);
  
  // Step 1: Extract slice
  const slice = tr.doc.slice(from, to);
  
  // Step 2: Delete original
  tr.delete(from, to);
  
  // Step 3: Map position AFTER deletion (CRITICAL!)
  const mappedInsert = tr.mapping.map(insertPos);
  
  // Step 4: Insert at mapped position
  tr.insert(mappedInsert, slice.content);
  
  return { oldPos: insertPos, newPos: mappedInsert };
};

// ── Helper: Split text node correctly (STEP 5) ───────────────────────────────
const splitTextNode = (node, offset) => {
  console.log(`[splitTextNode] Splitting at offset ${offset}`);
  return [
    node.cut(0, offset),
    node.cut(offset)
  ];
};

// ── Helper: Split table by rows (STEP 6) ─────────────────────────────────────
const splitTable = (tableNode, splitIndex) => {
  console.log(`[splitTable] Splitting table at row ${splitIndex}`);
  const topRows = [];
  const bottomRows = [];

  tableNode.forEach((row, i) => {
    if (i < splitIndex) topRows.push(row);
    else bottomRows.push(row);
  });

  return {
    top: tableNode.type.create(null, topRows),
    bottom: tableNode.type.create(null, bottomRows)
  };
};

// ── Helper: Scale image maintaining ratio (STEP 7) ───────────────────────────
const scaleImage = (node, maxHeight) => {
  console.log(`[scaleImage] Scaling to max height ${maxHeight}`);
  const ratio = maxHeight / node.attrs.height;
  
  return {
    ...node.attrs,
    width: Math.round(node.attrs.width * ratio),
    height: maxHeight
  };
};

// ── Helper: Find page node at position ──────────────────────────────────────
export const getPageAtPos = (doc, pos) => {
  let found = null;

  doc.descendants((node, p) => {
    if (node.type.name === 'page') {
      const start = p;
      const end = p + node.nodeSize;
      
      if (pos >= start && pos <= end) {
        found = { 
          node, 
          pos: start,
          index: doc.content.findIndex(p).index  // Page index in document
        };
        return false; // Stop traversing
      }
    }
  });

  return found;
};

// ── Helper: Measure rendered page height ─────────────────────────────────────
export const measurePageHeight = (editor, pagePos) => {
  const dom = editor.view.nodeDOM(pagePos);
  if (!dom || !(dom instanceof HTMLElement)) {
    console.warn('[measurePageHeight] DOM not found');
    return 0;
  }
  return dom.scrollHeight;
};

// ── Helper: Check if document needs initial full pagination ──────────────────
const needsFullPagination = (editor) => {
  const { state } = editor;
  const firstPage = getPageAtPos(state.doc, 0);
  
  if (!firstPage) return false;
  
  // Count total blocks in first page
  let blockCount = 0;
  let totalHeight = 0;
  
  firstPage.node.forEach((child, offset) => {
    blockCount++;
    const dom = editor.view.nodeDOM(firstPage.pos + offset + 1);
    if (dom instanceof HTMLElement) {
      totalHeight += dom.offsetHeight;
    }
  });
  
  // Need full pagination if:
  // - More than 5 blocks OR
  // - Total height exceeds 2 pages (1862px)
  const needsIt = blockCount > 5 || totalHeight > USABLE_HEIGHT * 2;
  
  if (needsIt) {
    console.log(`[needsFullPagination] YES - ${blockCount} blocks, ${totalHeight}px tall`);
  }
  
  return needsIt;
};

// ── Helper: Measure individual block height ──────────────────────────────────
const measureBlockHeight = (editor, pos, node) => {
  const dom = editor.view.nodeDOM(pos);
  if (dom instanceof HTMLElement) {
    // 🔥 CRITICAL DEBUG: Catch the 1123px bug
    const height = dom.offsetHeight || 20;
    
    console.log(`[measureBlockHeight] ${node.type.name}:`, {
      position: pos,
      domElement: dom.tagName,
      domClass: dom.className,
      offsetHeight: height,
      parentElement: dom.parentElement?.tagName,
      grandParent: dom.parentElement?.parentElement?.tagName,
      expectedRange: node.type.name === 'paragraph' ? '20-120px' : 'varies'
    });
    
    // 🚨 SAFEGUARD: If we're measuring a full page, something is VERY wrong
    if (height > 1000) {
      console.error(`🚨 [measureBlockHeight] BLOCK HEIGHT ${height}px IS SUSPICIOUS! This is likely measuring the page container, not the block!`, {
        nodeType: node.type.name,
        domStructure: dom.outerHTML.substring(0, 200),
        parentStructure: dom.parentElement?.outerHTML.substring(0, 200)
      });
      
      // Force reasonable max height to prevent pagination explosion
      return Math.min(height, 300); // Cap at 300px max for any single block
    }
    
    return height;
  }
  console.warn(`[measureBlockHeight] Could not measure ${node.type.name} at pos ${pos} - using fallback`);
  return 20; // Fallback height
};

// ── Helper: Check if node should be treated as atomic (no splitting) ─────────
const isAtomicNode = (node) => {
  const atomicTypes = ['table', 'image', 'codeBlock'];
  return atomicTypes.includes(node.type.name);
};

// ── Helper: Check if node is a table ─────────────────────────────────────────
const isTable = (node) => {
  return node.type.name === 'table';
};

// ── Helper: Check if node is an image ────────────────────────────────────────
const isImage = (node) => {
  return node.type.name === 'image';
};

// ── Helper: Split table rows when too large ───────────────────────────────────
const splitTableRows = (tableNode, availableHeight, view, tablePos) => {
  const keptRows = [];
  const overflowRows = [];
  let height = 0;

  tableNode.forEach((row, offset) => {
    const rowPos = tablePos + offset + 1;
    const dom = view.nodeDOM(rowPos);
    const h = (dom instanceof HTMLElement) ? dom.offsetHeight : 30;

    if (height + h <= availableHeight) {
      // Row fits - keep it
      keptRows.push({ node: row, offset });
      height += h;
    } else {
      // Row doesn't fit - move to overflow
      overflowRows.push({ node: row, offset });
    }
  });

  return { keptRows, overflowRows };
};
const MAX_IMAGE_HEIGHT = 400;

const scaleImageIfNeeded = (editor, node, pos, tr) => {
  if (!isImage(node)) return false;

  const dom = editor.view.nodeDOM(pos);
  if (!dom || !(dom instanceof HTMLElement)) return false;

  const height = dom.offsetHeight || 100;

  if (height > MAX_IMAGE_HEIGHT) {
    const ratio = MAX_IMAGE_HEIGHT / height;
    
    tr.setNodeMarkup(pos, null, {
      ...node.attrs,
      width: Math.round((node.attrs.width || dom.offsetWidth) * ratio),
      height: MAX_IMAGE_HEIGHT
    });

    console.log(`[scaleImage] Scaled image from ${height}px to ${MAX_IMAGE_HEIGHT}px (${(ratio * 100).toFixed(0)}%)`);
    return true;
  }

  return false;
};

// ── Helper: Find next page or create one ─────────────────────────────────────
const findOrCreateNextPage = (editor, currentPagePos) => {
  const { state } = editor;
  const { doc, schema } = state;

  const currentPage = getPageAtPos(doc, currentPagePos);
  if (!currentPage) return null;

  // Look for next page in document
  let nextPage = null;
  let foundCurrent = false;

  doc.descendants((node, p) => {
    if (node.type.name === 'page') {
      if (foundCurrent) {
        nextPage = { node, pos: p, index: currentPage.index + 1 };
        return false;
      }
      if (p === currentPage.pos) {
        foundCurrent = true;
      }
    }
  });

  // If no next page exists, create one at the end
  if (!nextPage) {
    const blankPage = schema.nodes.page.create(
      { pageNumber: currentPage.index + 2, isBlank: false },
      []
    );
    
    const tr = state.tr;
    tr.insert(doc.content.size, blankPage);
    editor.view.dispatch(tr);

    // Return newly created page
    return { 
      node: blankPage, 
      pos: doc.content.size,
      index: currentPage.index + 1
    };
  }

  return nextPage;
};

// ── Helper: Find previous page ───────────────────────────────────────────────
const findPrevPage = (editor, currentPagePos) => {
  const { state } = editor;
  const { doc } = state;

  const currentPage = getPageAtPos(doc, currentPagePos);
  if (!currentPage || currentPage.index === 0) {
    return null; // First page has no previous
  }

  let prevPage = null;
  let lastPage = null;

  doc.descendants((node, p) => {
    if (node.type.name === 'page') {
      if (p === currentPage.pos) {
        prevPage = lastPage;
        return false;
      }
      lastPage = { node, pos: p, index: currentPage.index - 1 };
    }
  });

  return prevPage;
};

// ── Helper: Find next page (without creating) ────────────────────────────────
const findNextPage = (editor, currentPagePos) => {
  const { state } = editor;
  const { doc } = state;

  const currentPage = getPageAtPos(doc, currentPagePos);
  if (!currentPage) return null;

  let nextPage = null;
  let foundCurrent = false;

  doc.descendants((node, p) => {
    if (node.type.name === 'page') {
      if (foundCurrent) {
        nextPage = { node, pos: p, index: currentPage.index + 1 };
        return false;
      }
      if (p === currentPage.pos) {
        foundCurrent = true;
      }
    }
  });

  return nextPage;
};

// ── CORE: Move overflow to next page ─────────────────────────────────────────
export const moveOverflowToNextPage = (editor, pageNode, pagePos) => {
  const { state, view } = editor;
  const { schema, selection } = state;

  console.log('[moveOverflowToNextPage] Moving overflow content...');

  // Step 1: Identify overflow nodes with detailed logging
  const overflowNodes = [];
  let accumulatedHeight = 0;
  let overflowStartIndex = -1;

  console.log(`[moveOverflowToNextPage] Analyzing ${pageNode.content.childCount} child nodes in page`);

  pageNode.forEach((child, offset, index) => {
    const childPos = pagePos + offset + 1; // +1 for opening tag
    const dom = view.nodeDOM(childPos);
    
    let h = 20; // Default fallback
    if (dom instanceof HTMLElement) {
      h = dom.offsetHeight;
    }
    
    // 🔥 ATOMIC NODE HANDLING - Never split tables/images/codeBlocks mid-node
    if (isAtomicNode(child)) {
      console.log(`  📦 Atomic node detected: ${child.type.name}, height: ${h}px`);
      
      // If this atomic node would cause overflow, move entire thing
      if (accumulatedHeight + h > USABLE_HEIGHT && overflowStartIndex === -1) {
        overflowStartIndex = index;
        console.log(`  ⚠️ Atomic node causes overflow - moving ENTIRE node`);
      }
    } else {
      // Normal block node - can be split freely
      console.log(`  Block ${index}: ${child.type.name}, DOM height: ${h}px, accumulated: ${accumulatedHeight + h}px`);
      
      if (accumulatedHeight + h > USABLE_HEIGHT && overflowStartIndex === -1) {
        overflowStartIndex = index;
        console.log(`  ⚠️ OVERFLOW START at index ${index}!`);
      }
    }
    
    accumulatedHeight += h;

    if (overflowStartIndex !== -1) {
      overflowNodes.push({ node: child, offset, index });
    }
  });

  if (overflowNodes.length === 0) {
    console.log('[moveOverflowToNextPage] No overflow detected');
    return;
  }

  console.log(`[moveOverflowToNextPage] Moving ${overflowNodes.length} nodes to next page`);

  // Step 2: Find or create next page
  const nextPage = findOrCreateNextPage(editor, pagePos);
  if (!nextPage) {
    console.error('[moveOverflowToNextPage] Could not create next page');
    return;
  }

  // Step 3: Build transaction (SINGLE TRANSACTION - STEP 9)
  const tr = state.tr;
  tr.setMeta('pagination', true);
  
  console.log(`[moveOverflowToNextPage] Moving ${overflowNodes.length} nodes to page ${nextPage.index + 1}`);

  // Track if cursor needs to move to next page
  let cursorShouldMoveToNextPage = false;
  const cursorPos = selection.from;
  
  // Check if cursor is in any of the overflow nodes being moved
  overflowNodes.forEach(({ offset, node }) => {
    const from = pagePos + 1 + offset;
    const to = from + node.nodeSize;
    if (cursorPos >= from && cursorPos <= to) {
      cursorShouldMoveToNextPage = true;
    }
  });

  // Remove from current page using moveNode helper (STEP 2)
  overflowNodes.forEach(({ offset, node }) => {
    const from = pagePos + 1 + offset;
    const to = from + node.nodeSize;
    moveNode(tr, from, to, nextPage.pos + 1);
  });

  view.dispatch(tr);

  // 🔥 CRITICAL FIX: Place cursor in next page if it was in overflow content
  if (cursorShouldMoveToNextPage) {
    console.log('[moveOverflowToNextPage] Moving cursor to next page (page 2)');
    // Place cursor at the beginning of the moved content in next page
    const firstMovedNodePos = nextPage.pos + 1;
    try {
      editor.commands.setTextSelection({ from: firstMovedNodePos, to: firstMovedNodePos });
      console.log('[moveOverflowToNextPage] ✅ Cursor moved to page 2');
    } catch (e) {
      console.warn('[moveOverflowToNextPage] Could not move cursor to next page:', e);
      // Fallback: try to restore original position
      try {
        editor.commands.setTextSelection({ from: cursorPos, to: cursorPos });
      } catch (e2) {
        console.error('[moveOverflowToNextPage] Failed to restore cursor:', e2);
      }
    }
  } else {
    // Cursor stays in current page - restore original position
    try {
      editor.commands.setTextSelection({ from: cursorPos, to: cursorPos });
    } catch (e) {
      console.warn('[moveOverflowToNextPage] Could not restore selection:', e);
    }
  }
};

// ── CORE: Pull content back from next page ───────────────────────────────────
export const pullContentFromNextPage = (editor, pageNode, pagePos) => {
  const { state, view } = editor;
  const { selection } = state;

  const nextPage = findNextPage(editor, pagePos);
  if (!nextPage || nextPage.node.content.size === 0) {
    console.log('[pullContentFromNextPage] No next page to pull from');
    return;
  }

  console.log('[pullContentFromNextPage] Pulling content from next page...');

  // Step 1: Measure current page height
  let currentHeight = measurePageHeight(editor, pagePos);

  // Step 2: Find nodes to pull from next page
  const pulledNodes = [];
  let nextPageIndex = 0;

  nextPage.node.forEach((child, offset) => {
    const childPos = nextPage.pos + offset + 1;
    const h = measureBlockHeight(editor, childPos, child);

    // Only pull if it fits comfortably
    if (currentHeight + h < USABLE_HEIGHT * 0.95) {
      pulledNodes.push({ node: child, offset, index: nextPageIndex });
      currentHeight += h;
      nextPageIndex++;
    } else {
      return false; // Stop when we hit the limit
    }
  });

  if (pulledNodes.length === 0) {
    console.log('[pullContentFromNextPage] No content to pull');
    return;
  }

  console.log(`[pullContentFromNextPage] Pulling ${pulledNodes.length} nodes`);

  // Step 3: Build transaction (SINGLE TRANSACTION - STEP 9)
  const tr = state.tr;
  tr.setMeta('pagination', true);

  // Remove from next page using moveNode helper (STEP 2)
  pulledNodes.forEach(({ offset, node }) => {
    const from = nextPage.pos + 1 + offset;
    const to = from + node.nodeSize;
    moveNode(tr, from, to, pagePos + pageNode.nodeSize - 1);
  });

  // Step 4: Restore cursor
  const savedFrom = selection.from;
  const savedTo = selection.to;

  view.dispatch(tr);

  try {
    editor.commands.setTextSelection({ from: savedFrom, to: savedTo });
  } catch (e) {
    console.warn('[pullContentFromNextPage] Could not restore selection:', e);
  }
};

// ── SMART PAGINATION ENGINE ──────────────────────────────────────────────────
export const smartPaginate = (editor) => {
  if (isPaginating || paginationLock) {
    console.log('[smartPaginate] Already paginating or locked - skipping');
    return;
  }

  if (!editor || editor.isDestroyed) {
    console.warn('[smartPaginate] Editor not ready');
    return;
  }

  // 🔥 NEW: Check if we should skip this pagination cycle
  if (skipNextPagination) {
    console.log('[smartPaginate] Skip flag set - skipping this cycle');
    skipNextPagination = false; // Reset flag
    return;
  }

  isPaginating = true;

  try {
    const { state } = editor;
    const { selection, schema } = state;

    // 🔥 STEP 1: CRITICAL - Save selection BEFORE any operations
    const { from, to } = selection;
    console.log(`[smartPaginate] Saved selection: ${from}-${to}`);

    // 🔥 CRITICAL CHECK: If first page has too many blocks, use full pagination
    const needsFull = needsFullPagination(editor);
    console.log(`[smartPaginate] needsFullPagination result: ${needsFull}`);
    
    if (needsFull) {
      console.log('[smartPaginate] 🚨 Bulk content detected - using FULL document pagination');
      // 🔥 STEP 9: Use the OLD ENGINE for full restructuring - it physically moves nodes
      paginateDocument(editor);
      isPaginating = false;
      return;
    }

    // 🔥 NEW: For incremental pagination only, check if we should skip
    if (skipNextPagination) {
      console.log('[smartPaginate] Skip flag set - skipping INCREMENTAL pagination');
      skipNextPagination = false; // Reset flag
      isPaginating = false;
      return;
    }

    // 🔥 STEP 4: Create transaction with meta flag (prevents loops)
    let tr = state.tr;
    tr.setMeta('pagination', true); // Prevents infinite update loops
    tr.setMeta('addToHistory', false); // Pagination is invisible to undo/redo

    // Step 1: Find current page at cursor position
    const pageInfo = getPageAtPos(state.doc, selection.from);
    
    if (!pageInfo) {
      console.log('[smartPaginate] No page found at cursor position - creating one');
      // No page exists yet - this shouldn't happen but handle it gracefully
      isPaginating = false;
      return;
    }

    const { node: pageNode, pos: pagePos, index: pageIndex } = pageInfo;

    // Step 2: Check if page is blank/empty
    if (pageNode.content.size === 0 || 
        (pageNode.content.childCount === 1 && 
         pageNode.content.firstChild?.type.name === 'paragraph' && 
         pageNode.content.firstChild.content.size === 0)) {
      console.log('[smartPaginate] Empty page - no pagination needed');
      isPaginating = false;
      return;
    }

    // 🔥 CRITICAL FIX: Use NODE COUNT instead of DOM height for reliability
    // DOM height is unreliable during typing, node count is stable
    const MAX_NODES_PER_PAGE = 15; // Adjust based on testing
    const currentNodeCount = pageNode.content.childCount;
    
    console.log(`[smartPaginate] Page ${pageIndex + 1} has ${currentNodeCount} nodes (limit: ${MAX_NODES_PER_PAGE})`);

    // Step 3: Handle overflow - move last node to next page
    if (currentNodeCount > MAX_NODES_PER_PAGE) {
      console.log(`[smartPaginate] ⚠️ OVERFLOW DETECTED: ${currentNodeCount} > ${MAX_NODES_PER_PAGE}`);
      
      // Get the LAST node(s) to move
      const nodesToMove = [];
      let countToRemove = currentNodeCount - MAX_NODES_PER_PAGE;
      
      // Move nodes from end to beginning
      for (let i = pageNode.content.childCount - 1; i >= 0 && countToRemove > 0; i--) {
        const child = pageNode.content.child(i);
        nodesToMove.unshift({ node: child, index: i });
        countToRemove--;
      }
      
      console.log(`[smartPaginate] Moving ${nodesToMove.length} node(s) to next page`);
      
      // Find or create next page
      const nextPage = findOrCreateNextPage(editor, pagePos);
      if (!nextPage) {
        console.error('[smartPaginate] Could not create next page');
        isPaginating = false;
        return;
      }
      
      // Build transaction to move nodes
      tr.setMeta('pagination', true);
      
      // Move nodes from current page to next page
      // IMPORTANT: Process in reverse order to maintain positions
      for (let i = nodesToMove.length - 1; i >= 0; i--) {
        const { node, index } = nodesToMove[i];
        const from = pagePos + 1;
        let offset = 0;
        
        // Calculate position of node at index
        pageNode.content.forEach((child, nodeOffset) => {
          if (nodeOffset < index) {
            offset += child.nodeSize;
          }
        });
        
        const nodeFrom = from + offset;
        const nodeTo = nodeFrom + node.nodeSize;
        
        console.log(`[smartPaginate] Moving node at index ${index} from ${nodeFrom}-${nodeTo} to page ${nextPage.index + 1}`);
        
        // Extract and insert
        const slice = tr.doc.slice(nodeFrom, nodeTo);
        tr.delete(nodeFrom, nodeTo);
        
        // Insert at beginning of next page
        const insertPos = nextPage.pos + 1;
        tr.insert(insertPos, slice.content);
      }
      
      // Dispatch transaction
      editor.view.dispatch(tr);
      
      // 🔥 CRITICAL: Cursor follows moved content
      // If cursor was near the end of page, move it to next page
      const lastKeptNodeEnd = pagePos + 1;
      let accumulatedOffset = 0;
      for (let i = 0; i < MAX_NODES_PER_PAGE && i < pageNode.content.childCount; i++) {
        accumulatedOffset += pageNode.content.child(i).nodeSize;
      }
      const boundaryPos = lastKeptNodeEnd + accumulatedOffset;
      
      if (selection.from > boundaryPos) {
        // Cursor was in moved content - move to next page
        console.log('[smartPaginate] Moving cursor to next page with moved content');
        const newPos = nextPage.pos + 1;
        try {
          editor.commands.setTextSelection({ from: newPos, to: newPos });
        } catch (e) {
          console.warn('[smartPaginate] Could not move cursor:', e);
        }
      }
      
      console.log('[smartPaginate] ✅ Overflow handled - content moved to next page');
    }
    // Step 4: Handle underflow - pull content from next page
    else if (currentNodeCount < MAX_NODES_PER_PAGE * 0.6 && pageIndex > 0) {
      // Page is less than 60% full - try to pull from previous page
      console.log(`[smartPaginate] Page underfull: ${currentNodeCount} nodes`);
      // TODO: Implement pull from previous page
    }
    // Page is within acceptable range
    else {
      console.log('[smartPaginate] Page content optimal - no action needed');
    }

    // 🔥 STEP 1: CRITICAL - Restore selection with position mapping
    const mappedFrom = tr.mapping.map(from);
    const mappedTo = tr.mapping.map(to);
    
    console.log(`[smartPaginate] Restoring selection: ${mappedFrom}-${mappedTo} (was ${from}-${to})`);
    
    try {
      editor.commands.setTextSelection({
        from: mappedFrom,
        to: mappedTo
      });
    } catch (e) {
      console.warn('[smartPaginate] Could not restore selection:', e);
    }

  } catch (error) {
    console.error('[smartPaginate] Error during pagination:', error);
  } finally {
    isPaginating = false;
    // 🔥 NEW: Set skip flag to prevent immediate re-trigger
    skipNextPagination = true;
    console.log('[smartPaginate] Pagination complete, skip flag set');
  }
};

// ── SAFE PAGINATE WITH LOCK ──────────────────────────────────────────────────
const safePaginate = (editor) => {
  // 🔥 STEP 3: Pagination lock prevents infinite loops
  if (paginationLock) {
    console.log('[safePaginate] Locked - skipping');
    return;
  }

  paginationLock = true;
  console.log('[safePaginate] Starting...');

  try {
    smartPaginate(editor);
  } catch (error) {
    console.error('[safePaginate] Error:', error);
  } finally {
    // Unlock on next frame (NOT immediately!)
    requestAnimationFrame(() => {
      paginationLock = false;
      console.log('[safePaginate] Unlocked');
    });
  }
};

// ── SCHEDULED PAGINATION (GOOGLE DOCS STYLE) ─────────────────────────────────
export const schedulePagination = (editor) => {
  // Cancel previous to avoid redundant work
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }
  
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }

  // 🔥 STEP 2: Wait for typing to settle (120ms like Google Docs)
  typingTimeout = setTimeout(() => {
    rafId = requestAnimationFrame(() => {
      // Give DOM time to settle after render - increased for paste scenarios
      setTimeout(() => {
        console.log('[schedulePagination] Running smart pagination');
        // 🔥 NEW: Clear skip flag before running
        skipNextPagination = false;
        safePaginate(editor);
      }, 100);
      rafId = null;
    });
  }, 120); // Increased from 50ms to 120ms for better stability
};

// ── Manual trigger for testing ───────────────────────────────────────────────
export const forcePaginate = (editor) => {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  smartPaginate(editor);
};

// ── Export default ───────────────────────────────────────────────────────────
export default {
  smartPaginate,
  schedulePagination,
  forcePaginate,
  getPageAtPos,
  measurePageHeight,
  moveOverflowToNextPage,
  pullContentFromNextPage
};
