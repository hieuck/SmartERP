const fs = require('fs');
const path = require('path');

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

const srcDir = path.join(__dirname, '..', 'src');
const entityFiles = findEntityFiles(srcDir);

console.log(`Checking ${entityFiles.length} entity files for encoding issues...\n`);

let issueCount = 0;

for (const file of entityFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(srcDir, file);
    let hasIssue = false;
    
    // Check for null bytes
    if (content.includes('\u0000')) {
      console.log(`❌ ${relativePath}`);
      console.log('   Contains null bytes (\\u0000)');
      hasIssue = true;
    }
    
    // Check for replacement characters
    if (content.includes('\ufffd')) {
      console.log(`❌ ${relativePath}`);
      console.log('   Contains replacement characters (\\ufffd) - encoding issue');
      hasIssue = true;
    }
    
    // Check for unmatched brackets
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      console.log(`❌ ${relativePath}`);
      console.log(`   Unmatched braces: ${openBraces} open, ${closeBraces} close`);
      hasIssue = true;
    }
    
    // Check for unmatched parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      console.log(`❌ ${relativePath}`);
      console.log(`   Unmatched parentheses: ${openParens} open, ${closeParens} close`);
      hasIssue = true;
    }
    
    // Check for unmatched brackets
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      console.log(`❌ ${relativePath}`);
      console.log(`   Unmatched brackets: ${openBrackets} open, ${closeBrackets} close`);
      hasIssue = true;
    }
    
    // Check for invalid characters in strings
    const invalidChars = content.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g);
    if (invalidChars) {
      console.log(`❌ ${relativePath}`);
      console.log(`   Contains ${invalidChars.length} invalid control characters`);
      hasIssue = true;
    }
    
    if (hasIssue) {
      issueCount++;
      console.log('');
    }
    
  } catch (error) {
    console.log(`❌ ${path.relative(srcDir, file)}`);
    console.log(`   Cannot read file: ${error.message}\n`);
    issueCount++;
  }
}

if (issueCount === 0) {
  console.log('✅ All entity files are OK (no encoding issues)');
} else {
  console.log(`❌ Found ${issueCount} files with issues`);
}

process.exit(issueCount > 0 ? 1 : 0);
