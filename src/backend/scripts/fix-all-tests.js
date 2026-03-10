const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing all test files to use User type...\n');

// Get list of failing test files using PowerShell
const failingTests = execSync('npm test 2>&1 | Select-String "FAIL.*spec.ts"', { 
  encoding: 'utf8',
  shell: 'powershell.exe'
})
  .split('\n')
  .filter(line => line.includes('FAIL'))
  .map(line => {
    const match = line.match(/FAIL\s+(.+\.spec\.ts)/);
    return match ? match[1].trim() : null;
  })
  .filter(Boolean);

console.log(`Found ${failingTests.length} failing test files\n`);

let fixed = 0;
let skipped = 0;

failingTests.forEach((testFile, index) => {
  const filePath = path.join(__dirname, testFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skip: ${testFile} (not found)`);
    skipped++;
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Add User import if not exists
  if (!content.includes("import { User }") && !content.includes("import type { User }")) {
    // Find first import statement
    const importMatch = content.match(/^import .+ from .+;$/m);
    if (importMatch) {
      const insertPos = content.indexOf(importMatch[0]) + importMatch[0].length;
      content = content.slice(0, insertPos) + 
                "\nimport { createMockUser } from '../../../common/test/test-helpers';" +
                content.slice(insertPos);
      modified = true;
    }
  }

  // Replace tenantId: string with user: User in service calls
  if (content.match(/\w+Service\.\w+\(['"]tenant-\d+['"]/)) {
    content = content.replace(
      /(\w+Service\.\w+)\(['"]tenant-\d+['"],/g,
      '$1(createMockUser(),'
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${testFile}`);
    fixed++;
  } else {
    console.log(`⏭️  Skip: ${testFile} (no changes needed)`);
    skipped++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`✅ Fixed: ${fixed} files`);
console.log(`⏭️  Skipped: ${skipped} files`);
console.log(`\n🎯 Run: npm test`);
