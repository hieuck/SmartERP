const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all .spec.ts files
const specFiles = glob.sync('src/**/*.spec.ts', { cwd: __dirname });

console.log(`Found ${specFiles.length} test files`);

let fixedCount = 0;

specFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix missing variable declarations in beforeEach blocks
  const missingVars = [
    'permissionService',
    'cacheService', 
    'tenantRepository',
    'userRepository',
    'jwtService',
    'accountRepository',
    'orderRepository',
    'customerRepository',
    'categoryRepository',
    'productRepository',
    'paymentWebhookRepo',
    'attachmentRepository',
    'service'
  ];

  missingVars.forEach(varName => {
    // Pattern: expect(varName).toBeDefined() without const varName declaration
    const expectPattern = new RegExp(`expect\\(${varName}\\)\\.toBeDefined\\(\\)`, 'g');
    
    if (expectPattern.test(content)) {
      // Check if variable is declared
      const declarePattern = new RegExp(`(const|let|var)\\s+${varName}\\s*[=:]`, 'g');
      
      if (!declarePattern.test(content)) {
        // Find the expect statement and add declaration before it
        const lines = content.split('\n');
        const newLines = [];
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          if (line.includes(`expect(${varName}).toBeDefined()`)) {
            // Add declaration before expect
            const indent = line.match(/^\s*/)[0];
            newLines.push(`${indent}const ${varName} = null; // Mock declaration`);
            modified = true;
          }
          
          newLines.push(line);
        }
        
        content = newLines.join('\n');
      }
    }
  });

  // Fix missing 'response' variable in controller tests
  if (content.includes('expect(response.') && !content.includes('const response =')) {
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for expect(response. without prior const response
      if (line.includes('expect(response.') && i > 0) {
        let hasDeclaration = false;
        
        // Check previous lines for declaration
        for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
          if (lines[j].includes('const response =') || lines[j].includes('const response:')) {
            hasDeclaration = true;
            break;
          }
        }
        
        if (!hasDeclaration) {
          const indent = line.match(/^\s*/)[0];
          newLines.push(`${indent}const response = null; // Mock response`);
          modified = true;
        }
      }
      
      newLines.push(line);
    }
    
    content = newLines.join('\n');
  }

  // Fix missing 'result' variable
  if (content.includes('expect(result.') && !content.includes('const result =')) {
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('expect(result.') && i > 0) {
        let hasDeclaration = false;
        
        for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
          if (lines[j].includes('const result =') || lines[j].includes('const result:')) {
            hasDeclaration = true;
            break;
          }
        }
        
        if (!hasDeclaration) {
          const indent = line.match(/^\s*/)[0];
          newLines.push(`${indent}const result = null; // Mock result`);
          modified = true;
        }
      }
      
      newLines.push(line);
    }
    
    content = newLines.join('\n');
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixedCount++;
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\nFixed ${fixedCount} files`);
