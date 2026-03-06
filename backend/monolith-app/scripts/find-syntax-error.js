const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all entity files
function findEntityFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.includes('node_modules')) {
      files.push(...findEntityFiles(fullPath));
    } else if (item.name.endsWith('.entity.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Test compile each entity
const srcDir = path.join(__dirname, '..', 'src');
const entityFiles = findEntityFiles(srcDir);

console.log(`Found ${entityFiles.length} entity files\n`);

let errorCount = 0;

for (const file of entityFiles) {
  try {
    // Try to compile with tsc
    execSync(`npx tsc --noEmit "${file}"`, { 
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    });
    console.log(`✅ ${path.relative(srcDir, file)}`);
  } catch (error) {
    errorCount++;
    console.log(`❌ ${path.relative(srcDir, file)}`);
    console.log(`   Error: ${error.message.split('\n')[0]}`);
    
    // Try to read file and check for obvious issues
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for common issues
      if (content.includes('\u0000')) {
        console.log('   ⚠️  Contains null bytes');
      }
      if (content.includes('\ufffd')) {
        console.log('   ⚠️  Contains replacement characters (encoding issue)');
      }
      
      // Check for unmatched brackets
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        console.log(`   ⚠️  Unmatched braces: ${openBraces} open, ${closeBraces} close`);
      }
      
    } catch (readError) {
      console.log(`   ⚠️  Cannot read file: ${readError.message}`);
    }
    console.log('');
  }
}

console.log(`\n${errorCount > 0 ? '❌' : '✅'} Total: ${errorCount} files with errors`);
process.exit(errorCount > 0 ? 1 : 0);
