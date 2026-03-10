const fs = require('fs');
const path = require('path');

// Patterns to fix
const fixes = [
  // platform/ and utilities/ and integrations/: ../auth/guards -> ../../core/auth/guards
  {
    pattern: /from ['"]\.\.\/auth\/guards\/jwt-auth\.guard['"]/g,
    replacement: `from '../../core/auth/guards/jwt-auth.guard'`,
    paths: ['platform', 'utilities', 'integrations']
  },
  // domains/: ../auth/guards -> ../../../core/auth/guards
  {
    pattern: /from ['"]\.\.\/auth\/guards\/jwt-auth\.guard['"]/g,
    replacement: `from '../../../core/auth/guards/jwt-auth.guard'`,
    paths: ['domains']
  },
  // core/ (except core/auth): ../auth/guards -> ../auth/guards (already correct)
  {
    pattern: /from ['"]\.\.\/auth\/guards\/jwt-auth\.guard['"]/g,
    replacement: `from '../auth/guards/jwt-auth.guard'`,
    paths: ['core']
  }
];

function fixImportsInFile(filePath, pattern, replacement) {
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(pattern, replacement);
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  return false;
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist') {
      walkDir(filePath, callback);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      callback(filePath);
    }
  });
}

let totalFixed = 0;

fixes.forEach(fix => {
  fix.paths.forEach(basePath => {
    const fullPath = path.join(__dirname, basePath);
    if (fs.existsSync(fullPath)) {
      console.log(`\nProcessing ${basePath}/...`);
      walkDir(fullPath, (filePath) => {
        if (fixImportsInFile(filePath, fix.pattern, fix.replacement)) {
          totalFixed++;
        }
      });
    }
  });
});

console.log(`\n✅ Total files fixed: ${totalFixed}`);
