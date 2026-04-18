#!/usr/bin/env node

/**
 * Quick Merge Verification Script
 * Run this before merging to ensure critical fixes are in place
 * 
 * Usage: node verify-merge-ready.js
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT_DIR = resolve(process.cwd());
const SRC_DIR = resolve(ROOT_DIR, 'src');

let passed = 0;
let failed = 0;
const issues = [];

function check(description, condition, details = '') {
  if (condition) {
    console.log(`✅ ${description}`);
    passed++;
  } else {
    console.error(`❌ ${description}`);
    if (details) console.error(`   ${details}`);
    failed++;
    issues.push({ description, details });
  }
}

console.log('🔍 Athena Editor Merge Verification\n');
console.log('═'.repeat(50));

// Check 1: Sync wrapper exists
try {
  const tokenCounterPath = resolve(SRC_DIR, 'utils/realtimeTokenCounter.js');
  const content = readFileSync(tokenCounterPath, 'utf-8');
  check(
    'Sync wrapper (estimateTokensSync) exists',
    content.includes('export function estimateTokensSync'),
    'Required for backward compatibility'
  );
} catch (error) {
  check('Sync wrapper exists', false, 'File not found or unreadable');
}

// Check 2: Async estimateTokensFast exists
try {
  const tokenCounterPath = resolve(SRC_DIR, 'utils/realtimeTokenCounter.js');
  const content = readFileSync(tokenCounterPath, 'utf-8');
  check(
    'Async estimateTokensFast exists',
    content.includes('export async function estimateTokensFast'),
    'Required for Worker support'
  );
} catch (error) {
  check('Async estimateTokensFast exists', false, 'File not found');
}

// Check 3: TokenCounter.jsx uses sync version
try {
  const tokenCounterPath = resolve(SRC_DIR, 'components/athena-editor/components/editor/TokenCounter.jsx');
  const content = readFileSync(tokenCounterPath, 'utf-8');
  check(
    'TokenCounter.jsx uses estimateTokensSync',
    content.includes('estimateTokensSync') && !content.includes('estimateTokensFast(content)'),
    'Must use sync version to avoid breaking'
  );
} catch (error) {
  check('TokenCounter.jsx updated', false, 'File not found');
}

// Check 4: EnhancedTokenBadge.jsx uses sync version
try {
  const badgePath = resolve(SRC_DIR, 'components/athena-editor/components/editor/EnhancedTokenBadge.jsx');
  const content = readFileSync(badgePath, 'utf-8');
  check(
    'EnhancedTokenBadge.jsx uses estimateTokensSync',
    content.includes('estimateTokensSync') && !content.includes('estimateTokensFast(content)'),
    'Must use sync version to avoid breaking'
  );
} catch (error) {
  check('EnhancedTokenBadge.jsx updated', false, 'File not found');
}

// Check 5: Web Worker file exists
try {
  const workerPath = resolve(ROOT_DIR, 'public/workers/token-worker.js');
  const exists = existsSync(workerPath);
  check(
    'Web Worker file exists (public/workers/token-worker.js)',
    exists,
    'Required for async token counting'
  );
} catch (error) {
  check('Web Worker file exists', false, 'Check failed');
}

// Check 6: Vite config has worker support
try {
  const vitePath = resolve(ROOT_DIR, 'vite.config.js');
  const content = readFileSync(vitePath, 'utf-8');
  check(
    'Vite config has worker configuration',
    content.includes('worker:') && content.includes("format: 'es'"),
    'Required for Worker bundling'
  );
} catch (error) {
  check('Vite config has worker support', false, 'File not found');
}

// Check 7: Production env file exists
try {
  const envPath = resolve(ROOT_DIR, '.env.production');
  const exists = existsSync(envPath);
  check(
    'Production environment file exists',
    exists,
    'File: .env.production'
  );
  
  if (exists) {
    const envContent = readFileSync(envPath, 'utf-8');
    check(
      'Production env has token counter config',
      envContent.includes('VITE_TOKEN_COUNTER_USE_WORKER'),
      'Missing token counter settings'
    );
  }
} catch (error) {
  check('Production env file exists', false, 'Check failed');
}

// Check 8: No broken imports
try {
  const tokenCounterPath = resolve(SRC_DIR, 'utils/realtimeTokenCounter.js');
  const content = readFileSync(tokenCounterPath, 'utf-8');
  check(
    'realtimeTokenCounter.js exports required functions',
    content.includes('export function estimateTokensSync') &&
    content.includes('export async function estimateTokensFast') &&
    content.includes('export function countTokensStatic'),
    'All three functions must be exported'
  );
} catch (error) {
  check('Required exports exist', false, 'File not found');
}

// Check 9: No duplicate files in athena-editor
try {
  const oldTokenCounterPath = resolve(SRC_DIR, 'components/athena-editor/utils/realtimeTokenCounter.js');
  const oldHookPath = resolve(SRC_DIR, 'components/athena-editor/hooks/useTokenCounter.js');
  
  const hasOldTokenCounter = existsSync(oldTokenCounterPath);
  const hasOldHook = existsSync(oldHookPath);
  
  check(
    'No duplicate realtimeTokenCounter.js in athena-editor/utils',
    !hasOldTokenCounter,
    'Delete: src/components/athena-editor/utils/realtimeTokenCounter.js'
  );
  
  check(
    'No duplicate useTokenCounter.js in athena-editor/hooks',
    !hasOldHook,
    'Delete: src/components/athena-editor/hooks/useTokenCounter.js'
  );
} catch (error) {
  check('No duplicate files', false, 'Check failed');
}

// Check 10: All imports use production versions
try {
  const { execSync } = await import('child_process');
  
  // Check for old import paths using cross-platform method
  const fs = await import('fs');
  const path = await import('path');
  
  const athenaEditorDir = resolve(SRC_DIR, 'components/athena-editor');
  let hasOldImports = false;
  
  function checkDirectoryForOldImports(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.resolve(dir, file.name);
      
      if (file.isDirectory()) {
        checkDirectoryForOldImports(fullPath);
      } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        // Check for old relative imports
        if (content.includes("from '../utils/realtimeTokenCounter'") || 
            content.includes("from '../hooks/useTokenCounter'")) {
          hasOldImports = true;
          console.error(`   Found old import in: ${fullPath}`);
        }
      }
    }
  }
  
  checkDirectoryForOldImports(athenaEditorDir);
  
  check(
    'No imports from old athena-editor/utils/realtimeTokenCounter',
    !hasOldImports,
    'Update imports to use src/utils/realtimeTokenCounter'
  );
} catch (error) {
  check('No old imports', false, 'Check failed');
}

// Summary
console.log('\n' + '═'.repeat(50));
console.log(`\n📊 Verification Results:`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📝 Total:  ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 READY FOR MERGE! All critical checks passed.');
  console.log('\nNext steps:');
  console.log('1. Run: npm run build');
  console.log('2. Test locally: npm run preview');
  console.log('3. Deploy to staging');
  process.exit(0);
} else {
  console.log('\n⚠️  NOT READY FOR MERGE!');
  console.log('\nIssues to fix:');
  issues.forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue.description}`);
    if (issue.details) console.log(`     ${issue.details}`);
  });
  console.log('\nPlease fix these issues before merging.');
  process.exit(1);
}
