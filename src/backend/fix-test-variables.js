#!/usr/bin/env node

/**
 * Fix missing variable declarations in test files
 * Patterns:
 * 1. response.body / response.status → let response: any;
 * 2. result.xxx → let result: any;
 * 3. service = module.get<Service>(Service) with type mismatch → use as any
 */

const fs = require('fs');
const path = require('path');

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

const fixFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix 1: Add response declaration if used but not declared
  if (/\bresponse\.(body|status|headers)/.test(content) && !/let\s+response\s*:/.test(content)) {
    // Find describe block
    const describeMatch = content.match(/describe\([^{]+\{/);
    if (describeMatch) {
      const insertPos = describeMatch.index + describeMatch[0].length;
      const before = content.substring(0, insertPos);
      const after = content.substring(insertPos);
      content = before + '\n  let response: any;' + after;
      modified = true;
      console.log(`   + let response: any;`);
    }
  }
  
  // Fix 2: Add result declaration if used but not declared
  if (/\bresult\.\w+/.test(content) && !/let\s+result\s*:/.test(content)) {
    const describeMatch = content.match(/describe\([^{]+\{/);
    if (describeMatch) {
      const insertPos = describeMatch.index + describeMatch[0].length;
      const before = content.substring(0, insertPos);
      const after = content.substring(insertPos);
      content = before + '\n  let result: any;' + after;
      modified = true;
      console.log(`   + let result: any;`);
    }
  }
  
  // Fix 3: Fix service type mismatch by casting to any
  const serviceTypeErrors = [
    'SystemAdminService',
    'ApprovalService', 
    'WorkflowService',
    'ImportExportService'
  ];
  
  serviceTypeErrors.forEach(serviceName => {
    const pattern = new RegExp(`(\\w+)\\s*=\\s*module\\.get<${serviceName}>\\(${serviceName}\\)`, 'g');
    if (pattern.test(content)) {
      content = content.replace(pattern, `$1 = module.get<${serviceName}>(${serviceName}) as any`);
      modified = true;
      console.log(`   + Cast ${serviceName} to any`);
    }
  });
  
  // Fix 4: Add repository declarations
  const repositoryPatterns = [
    { varName: 'accountRepository', className: 'Account' },
    { varName: 'orderRepository', className: 'Order' },
    { varName: 'customerRepository', className: 'Customer' },
    { varName: 'categoryRepository', className: 'Category' },
    { varName: 'productRepository', className: 'Product' },
    { varName: 'paymentWebhookRepo', className: 'PaymentWebhook' },
    { varName: 'attachmentRepository', className: 'IssueAttachment' }
  ];
  
  repositoryPatterns.forEach(({ varName, className }) => {
    const usageRegex = new RegExp(`\\b${varName}\\s*=\\s*module\\.get`);
    const declarationRegex = new RegExp(`let\\s+${varName}\\s*:`);
    
    if (usageRegex.test(content) && !declarationRegex.test(content)) {
      const describeMatch = content.match(/describe\([^{]+\{/);
      if (describeMatch) {
        const insertPos = describeMatch.index + describeMatch[0].length;
        const before = content.substring(0, insertPos);
        const after = content.substring(insertPos);
        content = before + `\n  let ${varName}: jest.Mocked<Repository<${className}>>;` + after;
        modified = true;
        console.log(`   + let ${varName}: jest.Mocked<Repository<${className}>>;`);
      }
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
};

const main = () => {
  console.log('🔍 Fixing remaining test variable issues...\n');
  
  const srcDir = path.join(__dirname, 'src');
  const specFiles = getAllSpecFiles(srcDir);
  
  let fixedCount = 0;
  
  specFiles.forEach(filePath => {
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Only process files with known errors
    const errorFiles = [
      'order.controller.spec.ts',
      'audit.controller.spec.ts',
      'document.controller.spec.ts',
      'email.controller.spec.ts',
      'production.service.spec.ts',
      'task.service.spec.ts',
      'system-admin.controller.spec.ts',
      'approval.controller.spec.ts',
      'workflow.controller.spec.ts',
      'import-export.controller.spec.ts',
      'reports.service.spec.ts',
      'customer.service.spec.ts',
      'category.service.spec.ts',
      'product.service.spec.ts',
      'payment-gateway.service.spec.ts',
      'issue-tracking.service.spec.ts'
    ];
    
    const shouldFix = errorFiles.some(f => filePath.includes(f));
    
    if (shouldFix) {
      console.log(`📝 ${relativePath}`);
      if (fixFile(filePath)) {
        fixedCount++;
      }
      console.log('');
    }
  });
  
  console.log(`✅ Fixed ${fixedCount} files\n`);
};

main();
