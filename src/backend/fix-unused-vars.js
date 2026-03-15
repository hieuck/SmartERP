#!/usr/bin/env node
/**
 * Automatically fix unused variables by prefixing with underscore
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing unused variables...\n');

// Get lint output
let lintOutput;
try {
  execSync('npm run lint 2>&1', { cwd: __dirname, encoding: 'utf8' });
} catch (error) {
  lintOutput = error.stdout || error.message;
}

// Parse lint errors for unused variables
const unusedVarRegex = /'([^']+)' is (defined but never used|assigned a value but never used)/g;
const fileRegex = /([A-Z]:\\[^\n]+\.ts)/g;

const fixes = new Map();
let match;
let currentFile = null;

const lines = lintOutput.split('\n');
for (const line of lines) {
  const fileMatch = line.match(fileRegex);
  if (fileMatch) {
    currentFile = fileMatch[0];
  }
  
  const varMatch = line.match(unusedVarRegex);
  if (varMatch && currentFile) {
    const varName = varMatch[0].match(/'([^']+)'/)[1];
    if (!fixes.has(currentFile)) {
      fixes.set(currentFile, new Set());
    }
    fixes.get(currentFile).add(varName);
  }
}

console.log(`Found ${fixes.size} files with unused variables\n`);

// Fix each file
let fixedCount = 0;
for (const [filePath, varNames] of fixes.entries()) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const varName of varNames) {
      // Skip if already prefixed
      if (varName.startsWith('_')) continue;
      
      // Pattern 1: Function parameters
      const paramPattern = new RegExp(`\\b${varName}\\b(?=\\s*[,:\\)])`, 'g');
      if (content.match(paramPattern)) {
        content = content.replace(paramPattern, `_${varName}`);
        modified = true;
        console.log(`  ✓ ${path.basename(filePath)}: ${varName} → _${varName}`);
      }
      
      // Pattern 2: Variable declarations
      const declPattern = new RegExp(`(const|let|var)\\s+${varName}\\b`, 'g');
      if (content.match(declPattern)) {
        content = content.replace(declPattern, `$1 _${varName}`);
        modified = true;
        console.log(`  ✓ ${path.basename(filePath)}: ${varName} → _${varName}`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      fixedCount++;
    }
  } catch (error) {
    console.error(`  ✗ Error fixing ${filePath}:`, error.message);
  }
}

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log('Run "npm run lint" to verify fixes.');
