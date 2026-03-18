/**
 * Athena Precision Calibration Script v1.0
 * 
 * Purpose: Diagnose pagination measurement discrepancies between the engine and rendered UI
 * 
 * Instructions:
 * 1. Import this into your TextEditor component
 * 2. Pass the PaginationEngine instance and blocks array
 * 3. Call runCalibration() after editor has fully rendered
 * 
 * Example usage:
 * ```javascript
 * useEffect(() => {
 *   if (engine && blocks.length > 0) {
 *     runCalibration(engine, blocks);
 *   }
 * }, [engine, blocks]);
 * ```
 */

/**
 * Run comprehensive pagination calibration
 * @param {PaginationEngine} engine - The pagination engine instance
 * @param {Array} blocks - Array of ProseMirror blocks to calibrate
 * @returns {Promise<Array>} Calibration results for analysis
 */
export const runCalibration = async (engine, blocks) => {
  console.group('🔬 Athena Pagination Calibration');
  
  const results = [];
  const zoomFactor = window.devicePixelRatio;
  const isGoogleDocsMode = engine.useGoogleDocsConfig;
  
  // 1. Check for Font Loading
  const fontsReady = await document.fonts.ready;
  console.log(`Font Status: ${fontsReady ? '✅ Ready' : '❌ Loading...'}`);

  blocks.forEach((block, index) => {
    // A. Measured Height (The Engine's Truth)
    // The engine uses measureElementHeight internally which calls offsetHeight
    const measuredHeight = engine.measureElementHeight(
      block.domNode || engine._getNodeDOMNode(block, index)
    );
    
    // B. Actual Rendered Height (The UI's Truth)
    // We find the node actually sitting in the editor's visible pages
    const realDOMNode = engine._getNodeDOMNode(block, index);
    const actualRenderedHeight = realDOMNode ? realDOMNode.getBoundingClientRect().height : 0;
    
    // C. Computed Styles for debugging
    const styles = realDOMNode ? window.getComputedStyle(realDOMNode) : {};
    
    const calibrationData = {
      blockIndex: index,
      type: block.type?.name || 'unknown',
      measuredHeight: parseFloat(measuredHeight.toFixed(2)),
      actualRenderedHeight: parseFloat(actualRenderedHeight.toFixed(2)),
      difference: parseFloat((actualRenderedHeight - measuredHeight).toFixed(2)),
      
      // Metrics
      fontSize: styles.fontSize || 'N/A',
      lineHeight: styles.lineHeight || 'N/A',
      fontFamily: styles.fontFamily?.split(',')[0].replace(/"/g, '') || 'N/A',
      zoomLevel: zoomFactor,
      
      // Configuration Verification
      targetUsableHeight: engine.usableHeight,
      isGoogleDocsMode,
      googleDocsTarget: isGoogleDocsMode ? 810 : 931
    };

    results.push(calibrationData);
  });

  // Summary Analytics
  const totalError = results.reduce((acc, curr) => acc + Math.abs(curr.difference), 0);
  const avgError = totalError / (results.length || 1);
  const maxError = Math.max(...results.map(r => Math.abs(r.difference)), 0);
  
  console.table(results);
  console.log(`📊 Average Variance: ${avgError.toFixed(2)}px`);
  console.log(`📈 Max Variance: ${maxError.toFixed(2)}px`);
  console.log(`📉 Total Accumulated Error: ${totalError.toFixed(2)}px over ${results.length} blocks`);
  
  if (avgError > 1) {
    console.warn('⚠️ HIGH VARIANCE DETECTED!');
    console.warn('Check for:');
    console.warn('  • CSS padding/margin mismatches between Editor and MeasurementLayer');
    console.warn('  • Font loading timing issues (run calibration after fonts loaded)');
    console.warn('  • Browser zoom affecting sub-pixel rendering');
    console.warn('  • Box-sizing differences (border-box vs content-box)');
  } else {
    console.log('✅ Measurement accuracy is within acceptable limits (±1px).');
  }

  // Detailed Analysis
  const problematicBlocks = results.filter(r => Math.abs(r.difference) > 2);
  if (problematicBlocks.length > 0) {
    console.error('🚨 Blocks with >2px variance:');
    console.table(problematicBlocks);
  }

  console.groupEnd();
  return results;
};

/**
 * Quick health check - runs calibration and returns pass/fail
 * @param {PaginationEngine} engine 
 * @param {Array} blocks 
 * @returns {Promise<boolean>} true if calibration passes (<1px avg error)
 */
export const checkCalibrationHealth = async (engine, blocks) => {
  const results = await runCalibration(engine, blocks);
  const avgError = results.reduce((acc, curr) => acc + Math.abs(curr.difference), 0) / (results.length || 1);
  return avgError <= 1;
};

/**
 * Log detailed comparison for a single block
 * Useful for deep debugging specific problematic blocks
 * @param {PaginationEngine} engine 
 * @param {number} blockIndex 
 */
export const debugBlock = (engine, blockIndex) => {
  console.group(`🔍 Debugging Block #${blockIndex}`);
  
  const domNode = engine._getNodeDOMNode(null, blockIndex);
  if (!domNode) {
    console.error('❌ DOM node not found for this block');
    console.groupEnd();
    return;
  }
  
  const computed = window.getComputedStyle(domNode);
  const rect = domNode.getBoundingClientRect();
  
  console.log('DOM Node:', domNode);
  console.log('Computed Styles:', computed);
  console.log('Bounding Rect:', rect);
  console.log('Offset Height:', domNode.offsetHeight);
  console.log('Scroll Height:', domNode.scrollHeight);
  console.log('Client Height:', domNode.clientHeight);
  
  console.groupEnd();
};
