#!/usr/bin/env node

/**
 * Scan Entity Issues - Detect duplicate column definitions
 */

const fs = require('fs');
const path = require('path');

const ENTITIES_DIR = path.join(__dirname, '../src/modules');
const issues = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.relative(ENTITIES_DIR, filePath);
  
  // Find @Column with name property
  const columnRegex = /@Column\(\{[^}]*name:\s*['"]([^'"]+)['"]/g;
  const matches = [...content.matchAll(columnRegex)];
  
  if (matches.length === 0) return;
  
  matches.forEach(match => {
    const columnName = match[1];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    if (columnName.includes('_')) {
      const afterColumn = content.substring(match.index);
      const propertyMatch = afterColumn.match(/@Column[^;]+\n\s*(\w+):/);
      
      if (propertyMatch) {
        const propertyName = propertyMatch[1];
        const expectedCamelCase = columnName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        
        if (propertyName === expectedCamelCase) {
          issues.push({
            file: fileName,
            line: lineNumber,
            columnName,
            propertyName
          });
        }
      }
    }
  });
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.name.endsWith('.entity.ts')) {
      scanFile(fullPath);
    }
  }
}

console.log('🔍 Scanning entities...\n');
scanDirectory(ENTITIES_DIR);

if (issues.length === 0) {
  console.log('✅ No issues found!\n');
  process.exit(0);
}

console.log(`❌ Found ${issues.length} duplicate column issues:\n`);

issues.forEach((issue, index) => {
  console.log(`${index + 1}. ${issue.file}:${issue.line}`);
  console.log(`   ${issue.columnName} → ${issue.propertyName}\n`);
});

process.exit(1);
