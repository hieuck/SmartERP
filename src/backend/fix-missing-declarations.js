const fs = require('fs');
const path = require('path');

// List of files and their missing variable fixes
const fixes = [
  // Fix permissionService declarations
  { file: 'src/domains/accounting/bank-reconciliation/bank-reconciliation.service.spec.ts', find: /let mockPermissionService;/g, replace: 'let mockPermissionService;\n  let permissionService;' },
  { file: 'src/domains/accounting/payment/payment.service.spec.ts', find: /let mockPermissionService;/g, replace: 'let mockPermissionService;\n  let permissionService;' },
  { file: 'src/domains/accounting/reports/reports.service.spec.ts', find: /let mockAccountRepository;/g, replace: 'let mockAccountRepository;\n  let accountRepository;\n  let permissionService;' },
  { file: 'src/domains/ecommerce/order/checkout.service.spec.ts', find: /let _permissionService;/g, replace: 'let permissionService;' },
  { file: 'src/domains/ecommerce/order/order.service.spec.ts', find: /let mockPermissionService;/g, replace: 'let mockPermissionService;\n  let permissionService;' },
  { file: 'src/domains/ecommerce/order/payment.service.spec.ts', find: /let mockPermissionService;/g, replace: 'let mockPermissionService;\n  let permissionService;' },
  { file: 'src/domains/ecommerce/product-catalog/product-catalog.service.spec.ts', find: /let mockPermissionService;/g, replace: 'let mockPermissionService;\n  let permissionService;' },
  { file: 'src/domains/ecommerce/shopping-cart/shopping-cart.service.spec.ts', find: /let mockPermissionService;/g, replace: 'let mockPermissionService;\n  let permissionService;' },
  { file: 'src/domains/hr/management/management.service.spec.ts', find: /let mockPermissionService;/g, replace: 'let mockPermissionService;\n  let permissionService;' },
  { file: 'src/domains/inventory/category/category.service.spec.ts', find: /let mockCategoryRepository;/g, replace: 'let mockCategoryRepository;\n  let categoryRepository;\n  let cacheService;\n  let permissionService;' },
  { file: 'src/domains/inventory/product/product.service.spec.ts', find: /let mockProductRepository;/g, replace: 'let mockProductRepository;\n  let productRepository;\n  let cacheService;\n  let permissionService;' },
  { file: 'src/domains/manufacturing/mrp/production.service.spec.ts', find: /let mockPermissionService;/g, replace: 'let mockPermissionService;\n  let permissionService;' },
  { file: 'src/domains/project/project.service.spec.ts', find: /let mockPermissionService;/g, replace: 'let mockPermissionService;\n  let permissionService;' },
  { file: 'src/domains/purchasing/supplier/supplier.service.spec.ts', find: /let mockPermissionService;/g, replace: 'let mockPermissionService;\n  let permissionService;' },
  { file: 'src/domains/sales/customer/customer.service.spec.ts', find: /let mockCustomerRepository;/g, replace: 'let mockCustomerRepository;\n  let customerRepository;\n  let permissionService;' },
  { file: 'src/domains/sales/order/order.service.spec.ts', find: /let mockOrderRepository;/g, replace: 'let mockOrderRepository;\n  let orderRepository;\n  let permissionService;' },
  { file: 'src/integrations/payment-gateway/payment-gateway.service.spec.ts', find: /let mockPaymentWebhookRepo;/g, replace: 'let mockPaymentWebhookRepo;\n  let paymentWebhookRepo;\n  let permissionService;' },
  { file: 'src/integrations/shipping/shipping.service.spec.ts', find: /let mockPermissionService;/g, replace: 'let mockPermissionService;\n  let permissionService;' },
  { file: 'src/platform/audit/audit.service.spec.ts', find: /let mockPermissionService;/g, replace: 'let mockPermissionService;\n  let permissionService;' },
  { file: 'src/platform/document/document.service.spec.ts', find: /let mockPermissionService;/g, replace: 'let mockPermissionService;\n  let permissionService;' },
  { file: 'src/platform/email/email.service.spec.ts', find: /let mockPermissionService;/g, replace: 'let mockPermissionService;\n  let permissionService;' },
  { file: 'src/platform/issue-tracking/issue-tracking.service.spec.ts', find: /let mockAttachmentRepository;/g, replace: 'let mockAttachmentRepository;\n  let attachmentRepository;' },
  { file: 'src/platform/system-admin/system-admin.controller.spec.ts', find: /let _service;/g, replace: 'let service;' },
  { file: 'src/platform/system-admin/system-admin.service.spec.ts', find: /let mockPermissionService;/g, replace: 'let mockPermissionService;\n  let permissionService;' },
  { file: 'src/platform/workflow/approval.controller.spec.ts', find: /let _service;/g, replace: 'let service;' },
  { file: 'src/platform/workflow/workflow.controller.spec.ts', find: /let _service;/g, replace: 'let service;' },
  { file: 'src/platform/workflow/workflow.service.spec.ts', find: /let mockPermissionService;/g, replace: 'let mockPermissionService;\n  let permissionService;' },
  { file: 'src/utilities/import-export/import-export.controller.spec.ts', find: /let _service;/g, replace: 'let service;' },
];

let fixedCount = 0;

fixes.forEach(fix => {
  const filePath = path.join(__dirname, fix.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${fix.file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  content = content.replace(fix.find, fix.replace);
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${fix.file}`);
    fixedCount++;
  } else {
    console.log(`⚠️  No changes: ${fix.file}`);
  }
});

console.log(`\n✨ Fixed ${fixedCount}/${fixes.length} files`);
