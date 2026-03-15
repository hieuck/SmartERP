#!/usr/bin/env node

/**
 * Auto-fix missing variable declarations in test files
 * 
 * Finds patterns like:
 *   permissionService = module.get(PermissionService);
 * 
 * And adds declaration:
 *   let permissionService: jest.Mocked<PermissionService>;
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all .spec.ts files
const getAllSpecFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllSpecFiles(filePath));
    } else if (file.endsWith('.spec.ts')) {
      results.push(filePath);
    }
  });
  
  return results;
};

// Extract missing declarations from a file
const findMissingDeclarations = (content) => {
  const missing = new Set();
  
  // Pattern: variableName = module.get(ClassName)
  const assignmentRegex = /(\w+)\s*=\s*module\.get(?:<[^>]+>)?\((\w+)\)/g;
  
  let match;
  while ((match = assignmentRegex.exec(content)) !== null) {
    const varName = match[1];
    const className = match[2];
    
    // Check if declaration exists
    const declarationRegex = new RegExp(`let\\s+${varName}\\s*:`);
    if (!declarationRegex.test(content)) {
      missing.add({ varName, className });
    }
  }
  
  return Array.from(missing);
};

// Add declarations to file
const addDeclarations = (filePath, declarations) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the describe block
  const describeMatch = content.match(/describe\([^{]+\{/);
  if (!describeMatch) {
    console.log(`⚠️  No describe block found in ${filePath}`);
    return false;
  }
  
  const insertPos = describeMatch.index + describeMatch[0].length;
  
  // Build declaration lines
  const declarationLines = declarations.map(({ varName, className }) => {
    return `  let ${varName}: jest.Mocked<${className}>;`;
  }).join('\n');
  
  // Insert declarations
  const before = content.substring(0, insertPos);
  const after = content.substring(insertPos);
  
  const newContent = before + '\n' + declarationLines + after;
  
  fs.writeFileSync(filePath, newContent, 'utf8');
  return true;
};

// Main
const main = () => {
  console.log('🔍 Scanning for test files with missing declarations...\n');
  
  const srcDir = path.join(__dirname, 'src');
  const specFiles = getAllSpecFiles(srcDir);
  
  console.log(`Found ${specFiles.length} test files\n`);
  
  let fixedCount = 0;
  let totalDeclarations = 0;
  
  specFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const missing = findMissingDeclarations(content);
    
    if (missing.length > 0) {
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`📝 ${relativePath}`);
      console.log(`   Adding ${missing.length} declarations:`);
      missing.forEach(({ varName, className }) => {
        console.log(`   - let ${varName}: jest.Mocked<${className}>`);
      });
      
      if (addDeclarations(filePath, missing)) {
        fixedCount++;
        totalDeclarations += missing.length;
      }
      console.log('');
    }
  });
  
  console.log('✅ Done!');
  console.log(`   Fixed ${fixedCount} files`);
  console.log(`   Added ${totalDeclarations} declarations\n`);
  
  // Run type-check to verify
  console.log('🔍 Running type-check to verify...\n');
  try {
    execSync('npm run type-check', { stdio: 'inherit' });
    console.log('\n✅ Type-check passed!');
  } catch (error) {
    console.log('\n⚠️  Type-check still has errors. Manual review needed.');
  }
};

main();
