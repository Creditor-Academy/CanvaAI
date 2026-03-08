# Pagination Test Utilities

Comprehensive test suite for pagination functionality, covering edge cases and real-world integration scenarios.

## Files

- `paginationEdgeCases.test.js` - Edge case tests (20 tests)
- `paginationIntegration.test.js` - Integration tests (15 tests)

## Quick Start

```javascript
import { runAllEdgeCaseTests, runAllIntegrationTests } from './utils/pagination';

// Run all edge case tests
const edgeResults = runAllEdgeCaseTests();

// Run all integration tests
const integrationResults = await runAllIntegrationTests();
```

## Edge Case Tests (20 tests)

### Basic Tests
1. **Empty Content** - Handles empty node arrays
2. **Single Node** - Paginates single node correctly
3. **Zero Height Nodes** - Handles nodes with zero height
4. **Exact Page Height** - Content that exactly fills a page

### Boundary Tests
5. **Overflow Content** - Content exceeding page limits
6. **Giant Node** - Single node larger than page height
7. **Page Boundary Precision** - Sequential page boundaries
8. **Max Pages Limit** - Respects maximum page count

### Special Content Tests
9. **Widow/Orphan Prevention** - Handles text widows/orphans
10. **Mixed Content Types** - Different node types together
11. **Variable Height Nodes** - Nodes with varying heights

### Performance Tests
12. **Large Node Count** - Performance with many nodes
13. **Negative Height Protection** - Handles invalid negative heights

### Management Tests
14. **Re-entrant Prevention** - Prevents recursive pagination
15. **Cache Management** - Cache statistics and clearing
16. **Options Override** - Dynamic option updates

### Advanced Tests
17. **Incremental Pagination** - Extends existing pagination
18. **Virtual Pagination Manager** - Virtual scrolling support
19. **Page Range Calculation** - Visible page range logic
20. **Pages Comparison** - Equality checking for pages

## Integration Tests (15 tests)

### Real-World Scenarios
1. **Multi-chapter Document** - Book/document structure
2. **Dynamic Content Addition** - Adding content dynamically
3. **Content Deletion** - Removing content
4. **Rapid User Interactions** - Fast successive calls
5. **Virtual Scrolling** - Scroll simulation

### Content Type Tests
6. **Mixed Media Content** - Text, images, code blocks
7. **Long Form Article** - Multi-section articles
8. **Table-Heavy Document** - Tables with data
9. **List-Heavy Content** - Bulleted/numbered lists

### Advanced Features
10. **Incremental Loading** - Load content in chunks
11. **Page Navigation** - Navigate through pages
12. **Concurrent Requests** - Parallel pagination calls
13. **Memory Leak Prevention** - Cache management
14. **Responsive Height Changes** - Different page heights
15. **Edge Case Combinations** - Mixed edge cases

## Usage Examples

### Run Specific Test Category

```javascript
import { runTestCategory } from './utils/pagination/paginationEdgeCases.test';

// Run basic tests
runTestCategory('basic');

// Categories: 'basic', 'boundary', 'special', 'performance', 'management', 'advanced'
```

### Run Individual Test

```javascript
import { testEmptyContent, testGiantNode } from './utils/pagination/paginationEdgeCases.test';

const result1 = testEmptyContent();
const result2 = testGiantNode();

console.log(result1.passed); // true/false
console.log(result2.result); // Detailed results
```

### Run Specific Integration Test

```javascript
import { runIntegrationTest } from './utils/pagination/paginationIntegration.test';

const result = await runIntegrationTest('multiChapter');
console.log(result);

// Available: multiChapter, dynamic, deletion, rapid, virtual, media, 
// article, tables, lists, incremental, navigation, concurrent, 
// memory, responsive, combinations
```

## Test Data Generators

Create custom test data:

```javascript
import { 
  createMockNode,
  createNodesWithTotalHeight,
  createVariableHeightNodes,
  createGiantNode,
  createExactPageFillNodes,
  createWidowOrphanNodes,
  createMixedContentNodes
} from './utils/pagination/paginationEdgeCases.test';

// Create a node with specific height
const node = createMockNode('paragraph', 'Content', {}, 100);

// Create nodes filling exact page height
const nodes = createExactPageFillNodes();

// Create variable height nodes
const nodes = createVariableHeightNodes(50, 20, 200);
```

## Test Result Format

All tests return a standardized result object:

```javascript
{
  name: 'Test Name',
  passed: true/false,
  result: { /* detailed results */ },
  error: Error /* if test threw an exception */
}
```

## Running in Browser Console

You can run these tests directly in the browser console:

```javascript
// Import the test modules
import { runAllEdgeCaseTests } from './utils/pagination/paginationEdgeCases.test.js';

// Execute tests
const results = runAllEdgeCaseTests();
console.log(results);
```

## Performance Testing

Enable performance logging:

```javascript
import { PaginationEngine } from './paginationEngine';

const engine = new PaginationEngine({ 
  perfLogEnabled: true,
  debugMode: false 
});

const nodes = createVariableHeightNodes(500);
const result = engine.paginateContent(nodes);
// Logs: "Pagination took X milliseconds for 500 nodes"
```

## Debug Mode

Enable detailed logging:

```javascript
const engine = new PaginationEngine({ debugMode: true });
const result = engine.paginateContent(nodes);
// Logs timing and page distribution details
```

## Best Practices

1. **Run tests after pagination changes** - Ensure no regressions
2. **Test with realistic data** - Use actual content structures
3. **Monitor performance** - Check execution times in large documents
4. **Clear caches between tests** - Avoid cache contamination
5. **Test edge cases first** - Catch boundary issues early

## Troubleshooting

### Test Fails on Page Boundaries
- Check if node heights are calculated correctly
- Verify MIN_WIDOW_ORPHAN_HEIGHT constant
- Review floating point rounding in height calculations

### Performance Issues
- Enable `perfLogEnabled` to measure execution time
- Check cache size with `getCacheStats()`
- Consider increasing buffer sizes

### Cache Issues
- Clear cache with `clearHeightCache()` between test runs
- Monitor cache size to prevent memory bloat
- Use `CACHE_SIZE_LIMIT` constant as reference

## Constants Reference

```javascript
USABLE_HEIGHT_PX       // Available height per page (998px)
MIN_WIDOW_ORPHAN_HEIGHT // Minimum widow/orphan height (48px)
MAX_PAGES              // Maximum page count (50)
CACHE_SIZE_LIMIT       // Max cache entries (2000)
```

## Contributing

When adding new pagination features:
1. Add corresponding edge case tests
2. Add integration tests for real-world scenarios
3. Update documentation
4. Run full test suite to ensure no regressions
