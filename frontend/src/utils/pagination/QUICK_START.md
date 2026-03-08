# Pagination Test Quick Start Guide

## 🚀 30-Second Setup

### Option 1: Run All Tests (Recommended for First Time)
```javascript
import { runAllTests } from './utils/pagination/testRunner.js';

const results = await runAllTests();
console.log(results.summary);
```

### Option 2: Quick Sanity Check
```javascript
import { runSanityCheck } from './utils/pagination/testRunner.js';

runSanityCheck(); // Runs critical subset of tests
```

### Option 3: Individual Test Files
```javascript
// Edge cases only
import { runAllEdgeCaseTests } from './utils/pagination/paginationEdgeCases.test.js';
const edgeResults = runAllEdgeCaseTests();

// Integration tests only  
import { runAllIntegrationTests } from './utils/pagination/paginationIntegration.test.js';
const integrationResults = await runAllIntegrationTests();
```

## 📊 What You'll See

Example output:
```
========================================
PAGINATION EDGE CASE TEST SUITE
========================================

Test 1: Empty Content
  Result: PASS ✓ - Empty array returned

Test 2: Single Node
  Result: PASS ✓ - Single page created

...

========================================
SUMMARY: 20/20 tests passed
========================================
```

## 🎯 Common Use Cases

### After Making Code Changes
```javascript
// Run quick validation
import { runSanityCheck } from './testRunner';
runSanityCheck();
```

### Before Deployment
```javascript
// Run complete suite
import { runAllTests } from './testRunner';
await runAllTests();
```

### Performance Testing
```javascript
// Benchmark performance
import { runPerformanceBenchmark } from './testRunner';
const benchmarks = runPerformanceBenchmark();
```

### Debugging Specific Issue
```javascript
// Run specific category
import { runTestCategory } from './paginationEdgeCases.test';

runTestCategory('boundary'); // Test boundary conditions
runTestCategory('performance'); // Test performance scenarios
```

## 🔧 Creating Test Data

### Simple Mock Nodes
```javascript
import { createMockNode } from './paginationEdgeCases.test';

const node = createMockNode('paragraph', 'Content', {}, 100);
```

### Realistic Documents
```javascript
import { generateArticle, generateBusinessReport } from './testDataGenerator';

const article = generateArticle({
  title: 'My Document',
  sectionCount: 5,
  paragraphsPerSection: 8
});

const report = generateBusinessReport({
  chapters: 3,
  sectionsPerChapter: 4
});
```

### Custom Data
```javascript
import { 
  createVariableHeightNodes,
  generateNodesForPages 
} from './testDataGenerator';

// 50 nodes with random heights
const nodes = createVariableHeightNodes(50, 20, 200);

// Fill exactly 5 pages
const nodes = generateNodesForPages(5);
```

## 📖 Understanding Results

### Test Result Object
```javascript
{
  name: 'Empty Content',
  passed: true,
  result: [/* detailed results */]
}
```

### Summary Object
```javascript
{
  total: 35,
  passed: 35,
  failed: 0,
  successRate: '100.00%',
  results: [/* all test results */]
}
```

## ⚡ Advanced Usage

### Custom Test Suite
```javascript
import { 
  testEmptyContent,
  testGiantNode,
  testOverflowContent 
} from './paginationEdgeCases.test';

const results = [
  testEmptyContent(),
  testGiantNode(),
  testOverflowContent()
];

results.forEach(r => {
  console.log(`${r.name}: ${r.passed ? 'PASS' : 'FAIL'}`);
});
```

### With Custom Options
```javascript
import { PaginationEngine } from './paginationEngine';

const engine = new PaginationEngine({
  usableHeight: 800,
  maxPages: 30,
  debugMode: false,
  perfLogEnabled: true
});

const nodes = generateArticle({ sectionCount: 10 });
const result = engine.paginateContent(nodes);
```

### Testing Incremental Updates
```javascript
import { paginationEngine } from './paginationEngine';

// Initial content
let nodes = generateArticle({ sectionCount: 3 });
let pages = paginationEngine.paginateContent(nodes);

// Add content
nodes.push(...generateParagraphNodes(10));

// Update incrementally
const updatedPages = paginationEngine.extendPagination(pages, nodes, 15);
```

## 🐛 Troubleshooting

### Test Fails
1. Check console for error details
2. Review the specific test's validation logic
3. Verify test data generation
4. Check pagination constants

### Performance Issues
```javascript
// Enable performance logging
const engine = new PaginationEngine({ perfLogEnabled: true });

// Run test and check timing
testLargeNodeCount(); // Shows execution time
```

### Cache Problems
```javascript
// Clear all caches
engine.clearHeightCache();
engine.clearCache();

// Re-run tests
runAllEdgeCaseTests();
```

## 📚 File Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `paginationEdgeCases.test.js` | 20 edge case tests | Testing algorithm correctness |
| `paginationIntegration.test.js` | 15 integration tests | Testing real-world scenarios |
| `testRunner.js` | Test execution | Running tests |
| `testDataGenerator.js` | Data generation | Creating test data |
| `PAGINATION_TESTS.md` | Full documentation | Detailed reference |
| `README_TEST_SUMMARY.md` | Overview | Quick understanding |

## ✅ Best Practices

1. **Run tests frequently** - After any pagination changes
2. **Start with sanity check** - Quick validation before full suite
3. **Review failures carefully** - Understand what each test validates
4. **Use realistic data** - Generate documents similar to production
5. **Monitor performance** - Check execution times in benchmarks
6. **Clear caches between runs** - Avoid contamination

## 🎓 Learning Path

### Beginner
1. Run `runSanityCheck()` to see tests in action
2. Review test output to understand what's being tested
3. Try `runAllEdgeCaseTests()` for complete coverage

### Intermediate
1. Run individual tests to understand specific scenarios
2. Generate custom test data with `testDataGenerator`
3. Create custom test suites for your use cases

### Advanced
1. Add new test cases to the test files
2. Extend test data generators
3. Integrate into CI/CD pipeline
4. Create performance regression tests

## 🌟 Next Steps

1. **Try it now**: Run your first test suite
   ```javascript
   import { runAllTests } from './utils/pagination/testRunner.js';
   await runAllTests();
   ```

2. **Explore the tests**: Look at individual test functions to understand what they validate

3. **Create custom tests**: Add tests for your specific edge cases

4. **Integrate**: Add test runs to your development workflow

Happy Testing! 🎉
