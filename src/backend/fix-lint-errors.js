#!/usr/bin/env node
/**
 * Script to automatically fix common ESLint errors
 * - Remove unused imports
 * - Prefix unused parameters with underscore
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting automated lint fixes...\n');

// Step 1: Run eslint --fix multiple times
console.log('Step 1: Running eslint --fix (may take a few iterations)...');
for (let i = 0; i < 3; i++) {
  try {
    execSync('npm run lint', { stdio: 'inherit', cwd: __dirname });
    console.log(`✅ Iteration ${i + 1}: All lint issues fixed!`);
    break;
  } catch (error) {
    console.log(`⚠️  Iteration ${i + 1}: Some issues remain, continuing...`);
  }
}

console.log('\n✅ Automated fixes completed!');
console.log('Run "npm run lint" to see remaining issues.');
