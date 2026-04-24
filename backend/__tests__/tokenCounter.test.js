/**
 * tokenCounter.test.js - Unit tests for token counter accuracy
 * Tests tiktoken integration, cost calculation, and edge cases
 */

const { 
  estimateTokens, 
  calculateCost, 
  checkQuota,
  formatTokenCount,
  formatCost
} = require('./utils/tokenCounter');

describe('Token Counter Accuracy', () => {
  
  describe('estimateTokens()', () => {
    test('should handle empty input', () => {
      expect(estimateTokens('')).toBe(0);
      expect(estimateTokens(null)).toBe(0);
      expect(estimateTokens(undefined)).toBe(0);
    });

    test('should count simple English text accurately', () => {
      const text = 'Hello world, this is a test sentence.';
      const tokens = estimateTokens(text);
      
      // With tiktoken, should be very accurate (±2 tokens)
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(20); // Should be around 8-10 tokens
    });

    test('should handle code blocks correctly', () => {
      const code = 'function test() { return true; }';
      const tokens = estimateTokens(code);
      
      // Code should use more tokens per character
      expect(tokens).toBeGreaterThan(0);
      console.log(`Code tokens: ${tokens}`);
    });

    test('should handle markdown formatting', () => {
      const markdown = '# Heading\n**bold** and *italic*\n- list item';
      const tokens = estimateTokens(markdown);
      
      expect(tokens).toBeGreaterThan(0);
      console.log(`Markdown tokens: ${tokens}`);
    });

    test('should handle CJK characters', () => {
      const cjk = '你好世界'; // Chinese
      const tokens = estimateTokens(cjk);
      
      // CJK characters typically use 1-2 tokens each
      expect(tokens).toBeGreaterThanOrEqual(4);
      expect(tokens).toBeLessThanOrEqual(8);
    });

    test('should handle Unicode emojis', () => {
      const emoji = '🎉🚀💡';
      const tokens = estimateTokens(emoji);
      
      // Emojis typically use 1-2 tokens each
      expect(tokens).toBeGreaterThanOrEqual(3);
      expect(tokens).toBeLessThanOrEqual(6);
    });

    test('should handle mixed content', () => {
      const mixed = `
# Title
Hello world! 你好

\`\`\`javascript
function test() { return true; }
\`\`\`

- Item 1
- Item 2 🎉
      `;
      const tokens = estimateTokens(mixed);
      
      expect(tokens).toBeGreaterThan(0);
      console.log(`Mixed content tokens: ${tokens}`);
    });

    test('should handle very long text', () => {
      const longText = 'a'.repeat(10000);
      const tokens = estimateTokens(longText);
      
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(5000); // Should be reasonable
    });
  });

  describe('calculateCost()', () => {
    test('should calculate cost for gpt-4o-mini', () => {
      const cost = calculateCost(1000, 500, 'gpt-4o-mini');
      
      expect(cost.total).toBeGreaterThan(0);
      expect(cost.currency).toBe('USD');
      expect(cost).toHaveProperty('cachedInput');
      expect(cost).toHaveProperty('freshInput');
      expect(cost).toHaveProperty('output');
      expect(cost).toHaveProperty('savings');
    });

    test('should account for cached input discount', () => {
      const inputTokens = 1000;
      const cachedTokens = 300;
      
      const costWithoutCache = calculateCost(inputTokens, 500, 'gpt-4o-mini', 0);
      const costWithCache = calculateCost(inputTokens, 500, 'gpt-4o-mini', cachedTokens);
      
      // Cached should be cheaper
      expect(costWithCache.total).toBeLessThan(costWithoutCache.total);
      expect(costWithCache.savings).toBeGreaterThan(0);
    });

    test('should handle unknown model gracefully', () => {
      const cost = calculateCost(1000, 500, 'unknown-model');
      
      expect(cost.total).toBeGreaterThan(0);
      expect(cost.currency).toBe('USD');
    });

    test('should calculate zero cost for zero tokens', () => {
      const cost = calculateCost(0, 0, 'gpt-4o-mini');
      
      expect(cost.total).toBe(0);
    });
  });

  describe('checkQuota()', () => {
    test('should allow usage within limits', () => {
      const usage = {
        monthlyUsed: 1000,
        dailyUsed: 100,
        currentRequest: 500,
        hourlyRequests: 5
      };
      
      const result = checkQuota(usage, 'free');
      
      expect(result.allowed).toBe(true);
    });

    test('should block usage exceeding monthly limit', () => {
      const usage = {
        monthlyUsed: 9500,
        dailyUsed: 100,
        currentRequest: 1000,
        hourlyRequests: 5
      };
      
      const result = checkQuota(usage, 'free');
      
      expect(result.allowed).toBe(false);
      expect(result.checks.monthly.allowed).toBe(false);
    });

    test('should block usage exceeding per-request limit', () => {
      const usage = {
        monthlyUsed: 1000,
        dailyUsed: 100,
        currentRequest: 5000, // Exceeds 4096 limit
        hourlyRequests: 5
      };
      
      const result = checkQuota(usage, 'free');
      
      expect(result.allowed).toBe(false);
      expect(result.checks.perRequest.allowed).toBe(false);
    });

    test('should handle different tiers', () => {
      const usage = {
        monthlyUsed: 50000,
        dailyUsed: 1000,
        currentRequest: 1000,
        hourlyRequests: 10
      };
      
      const freeResult = checkQuota(usage, 'free');
      const proResult = checkQuota(usage, 'pro');
      
      expect(freeResult.allowed).toBe(false);
      expect(proResult.allowed).toBe(true);
    });

    test('should throw error for unknown tier', () => {
      const usage = {
        monthlyUsed: 0,
        dailyUsed: 0,
        currentRequest: 100,
        hourlyRequests: 0
      };
      
      expect(() => checkQuota(usage, 'unknown-tier')).toThrow();
    });
  });

  describe('formatTokenCount()', () => {
    test('should format small numbers', () => {
      expect(formatTokenCount(100)).toBe('100 tokens');
      expect(formatTokenCount(999)).toBe('999 tokens');
    });

    test('should format thousands', () => {
      expect(formatTokenCount(1000)).toBe('1.0K tokens');
      expect(formatTokenCount(5500)).toBe('5.5K tokens');
    });

    test('should format millions', () => {
      expect(formatTokenCount(1000000)).toBe('1.0M tokens');
      expect(formatTokenCount(1500000)).toBe('1.5M tokens');
    });
  });

  describe('formatCost()', () => {
    test('should format large costs', () => {
      expect(formatCost(1.5)).toBe('$1.50');
      expect(formatCost(10.0)).toBe('$10.00');
    });

    test('should format small costs', () => {
      expect(formatCost(0.01)).toBe('$0.010');
      expect(formatCost(0.001)).toBe('$0.0010');
    });

    test('should format very small costs', () => {
      expect(formatCost(0.0001)).toBe('$0.0001');
    });
  });

  describe('Integration Tests', () => {
    test('should estimate and calculate cost together', () => {
      const text = 'Hello world, this is a test for token estimation.';
      const tokens = estimateTokens(text);
      const cost = calculateCost(tokens, tokens * 2); // Assume output is 2x input
      
      expect(tokens).toBeGreaterThan(0);
      expect(cost.total).toBeGreaterThan(0);
      expect(cost.output).toBeGreaterThan(cost.freshInput); // Output costs more
    });

    test('should handle realistic document', () => {
      const document = `
# Project Report

## Introduction
This is a comprehensive report about our project progress.

## Key Findings
1. Performance improved by 50%
2. User satisfaction increased to 95%
3. Revenue grew by $1M

## Code Example
\`\`\`javascript
function calculateMetrics(data) {
  return data.reduce((sum, item) => sum + item.value, 0);
}
\`\`\`

## Conclusion
The project has been successful. 🎉

Thank you! 谢谢！
      `;
      
      const tokens = estimateTokens(document);
      const cost = calculateCost(tokens, tokens * 1.5);
      
      expect(tokens).toBeGreaterThan(50);
      expect(tokens).toBeLessThan(200);
      expect(cost.total).toBeGreaterThan(0);
      
      console.log(`Realistic document: ${tokens} tokens, $${cost.total.toFixed(6)}`);
    });
  });
});
