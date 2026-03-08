/**
 * Pagination Test Runner
 * 
 * Standalone script to run all pagination tests
 * Can be imported and executed in browser console or test framework
 */

import { 
  runAllEdgeCaseTests, 
  runTestCategory,
  createMockNode,
  createVariableHeightNodes 
} from './paginationEdgeCases.test.js';

import { 
  runAllIntegrationTests,
  runIntegrationTest 
} from './paginationIntegration.test.js';

// ============================================================================
// CONSOLE REPORT FORMATTER
// ============================================================================

const formatReport = (results) => {
  const { total, passed, failed, successRate, results: testResults } = results;
  
  console.log('\n' + '='.repeat(60));
  console.log('PAGINATION TEST REPORT');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} ✓`);
  console.log(`Failed: ${failed} ✗`);
  console.log(`Success Rate: ${successRate}`);
  console.log('='.repeat(60));
  
  if (failed > 0) {
    console.log('\nFAILED TESTS:');
    testResults
      .filter(r => !r.passed)
      .forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.name}`);
        if (r.error) {
          console.log(`     Error: ${r.error.message}`);
        }
      });
  }
  
  console.log('\n');
};

// ============================================================================
// QUICK TEST FUNCTIONS
// ============================================================================

/**
 * Run all tests with formatted report
 */
export const runAllTests = async () => {
  console.clear();
  console.log('Starting complete pagination test suite...\n');
  
  // Edge cases
  console.log('Running Edge Case Tests...\n');
  const edgeResults = runAllEdgeCaseTests();
  formatReport(edgeResults);
  
  // Integration tests
  console.log('Running Integration Tests...\n');
  const integrationResults = await runAllIntegrationTests();
  formatReport(integrationResults);
  
  // Summary
  const totalTests = edgeResults.total + integrationResults.total;
  const totalPassed = edgeResults.passed + integrationResults.passed;
  const totalFailed = edgeResults.failed + integrationResults.failed;
  
  console.log('\n' + '📊 FINAL SUMMARY '.padEnd(60, '='));
  console.log(`Total Tests Run: ${totalTests}`);
  console.log(`Total Passed: ${totalPassed} ✓`);
  console.log(`Total Failed: ${totalFailed} ✗`);
  console.log(`Overall Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);
  console.log('='.repeat(60) + '\n');
  
  return {
    edge: edgeResults,
    integration: integrationResults,
    summary: {
      total: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      successRate: ((totalPassed / totalTests) * 100).toFixed(2) + '%'
    }
  };
};

/**
 * Run quick sanity check (subset of critical tests)
 */
export const runSanityCheck = () => {
  console.log('Running Quick Sanity Check...\n');
  
  const criticalTests = [
    'basic',
    'boundary',
    'management'
  ];
  
  const results = [];
  
  criticalTests.forEach(category => {
    console.log(`\nTesting ${category}...\n`);
    const result = runTestCategory(category);
    results.push(result);
    formatReport(result);
  });
  
  return results;
};

/**
 * Run performance benchmarks
 */
export const runPerformanceBenchmark = () => {
  console.log('Running Performance Benchmarks...\n');
  
  const { PaginationEngine } = require('./paginationEngine');
  const engine = new PaginationEngine({ perfLogEnabled: true });
  
  const sizes = [50, 100, 200, 500];
  const benchmarks = [];
  
  sizes.forEach(size => {
    const nodes = createVariableHeightNodes(size, 20, 50);
    const startTime = performance.now();
    const result = engine.paginateContent(nodes);
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    benchmarks.push({
      nodeCount: size,
      pageCount: result.length,
      duration: duration.toFixed(2) + 'ms',
      perNode: (duration / size).toFixed(3) + 'ms'
    });
    
    console.log(`Nodes: ${size.toString().padStart(4)} | Pages: ${result.length.toString().padStart(3)} | Time: ${duration.toFixed(2).padStart(8)}ms | Per Node: ${(duration/size).toFixed(3).padStart(6)}ms`);
  });
  
  return benchmarks;
};

/**
 * Interactive test selector
 */
export const runInteractiveTest = async () => {
  console.log('\nSelect test type:');
  console.log('1. All Edge Cases');
  console.log('2. All Integration Tests');
  console.log('3. All Tests (Complete Suite)');
  console.log('4. Quick Sanity Check');
  console.log('5. Performance Benchmark');
  console.log('6. Custom Test');
  
  const choice = prompt('Enter choice (1-6): ');
  
  switch (choice) {
    case '1':
      return runAllEdgeCaseTests();
    case '2':
      return runAllIntegrationTests();
    case '3':
      return runAllTests();
    case '4':
      return runSanityCheck();
    case '5':
      return runPerformanceBenchmark();
    case '6':
      const testName = prompt('Enter test name (e.g., "testEmptyContent"): ');
      const module = await import('./paginationEdgeCases.test.js');
      const testFn = module[testName];
      if (testFn) {
        return testFn();
      } else {
        console.error(`Test "${testName}" not found`);
        return null;
      }
    default:
      console.log('Invalid choice');
      return null;
  }
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  runAllTests,
  runSanityCheck,
  runPerformanceBenchmark,
  runInteractiveTest,
  runAllEdgeCaseTests,
  runAllIntegrationTests,
  runTestCategory,
  runIntegrationTest,
};

// Auto-run if executed directly
if (typeof window !== 'undefined') {
  window.PaginationTests = {
    runAll: runAllTests,
    sanity: runSanityCheck,
    performance: runPerformanceBenchmark,
    interactive: runInteractiveTest,
  };
  
  console.log('\n✅ Pagination tests loaded successfully!');
  console.log('Use window.PaginationTests.runAll() to run all tests');
  console.log('Or import specific test functions from the modules\n');
}
