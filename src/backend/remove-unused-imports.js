#!/usr/bin/env node
/**
 * Remove unused imports from TypeScript files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Removing unused imports...\n');

// Get lint output
let lintOutput;
try {
  execSync('npm run lint 2>&1', { cwd: __dirname, encoding: 'utf8' });
} catch (error) {
  lintOutput = error.stdout || error.message;
}

// Parse for unused imports
const unusedImportRegex = /'([^']+)' is defined but never used/g;
const filePathRegex = /([A-Z]:\\[^\n]+\.ts)/g;

const filesToFix = new Map();
let currentFile = null;

const lines = lintOutput.split('\n');
for (const line of lines) {
  const fileMatch = line.match(filePathRegex);
  if (fileMatch) {
    currentFile = fileMatch[0];
  }
  
  const importMatch = line.match(unusedImportRegex);
  if (importMatch && currentFile && line.includes('is defined but never used')) {
    const importName = importMatch[0].match(/'([^']+)'/)[1];
    if (!filesToFix.has(currentFile)) {
      filesToFix.set(currentFile, new Set());
    }
    filesToFix.get(currentFile).add(importName);
  }
}

console.log(`Found ${filesToFix.size} files with unused imports\n`);

let fixedCount = 0;
for (const [filePath, importNames] of filesToFix.entries()) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const importName of importNames) {
      // Pattern 1: Remove from named imports { A, B, C }
      const namedImportPattern = new RegExp(`\\{([^}]*\\b${importName}\\b[^}]*)\\}`, 'g');
      content = content.replace(namedImportPattern, (match, imports) => {
        const importList = imports.split(',').map(i => i.trim()).filter(i => i && i !== importName);
        if (importList.length === 0) {
          // Remove entire import line if no imports left
          return '__REMOVE_LINE__';
        }
        return `{ ${importList.join(', ')} }`;
      });
      
      // Pattern 2: Remove entire import line if marked
      if (content.includes('__REMOVE_LINE__')) {
        const lines = content.split('\n');
        content = lines.filter(line => !line.includes('__REMOVE_LINE__')).join('\n');
        modified = true;
      }
      
      // Pattern 3: Single import: import X from 'y'
      const singleImportPattern = new RegExp(`import\\s+${importName}\\s+from\\s+['"'][^'"]+['"];?\\n?`, 'g');
      if (content.match(singleImportPattern)) {
        content = content.replace(singleImportPattern, '');
        modified = true;
      }
    }
    
    if (modified) {
      // Clean up multiple blank lines
      content = content.replace(/\n{3,}/g, '\n\n');
      fs.writeFileSync(filePath, content, 'utf8');
      fixedCount++;
      console.log(`  ✓ ${path.basename(filePath)}: Removed ${importNames.size} unused imports`);
    }
  } catch (error) {
    console.error(`  ✗ Error fixing ${filePath}:`, error.message);
  }
}

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log('Run "npm run lint" to verify.');
