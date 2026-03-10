#!/usr/bin/env python3
"""
Fix all remaining compilation errors - comprehensive fix
"""
from pathlib import Path

def fix_file(filepath, replacements):
    """Apply replacements to a file"""
    try:
        content = Path(filepath).read_text(encoding='utf-8')
        original = content
        
        for old, new in replacements:
            content = content.replace(old, new)
        
        if content != original:
            Path(filepath).write_text(content, encoding='utf-8')
            print(f"✅ Fixed: {filepath}")
            return True
        return False
    except Exception as e:
        print(f"❌ Error fixing {filepath}: {e}")
        return False

# Fix product-catalog.controller.ts - Remove extra tenantId parameters
product_catalog_controller_fixes = [
    # create method
    (
        "return this.productCatalogService.create(dto, req.user.tenantId, req.user);",
        "return this.productCatalogService.create(dto, req.user);"
    ),
    # search method - change tenantId to user
    (
        "return this.productCatalogService.search(req.user.tenantId, dto.search || '');",
        "return this.productCatalogService.search(dto.search || '', req.user);"
    ),
    # findOne method
    (
        "return this.productCatalogService.findOne(id, req.user.tenantId);",
        "return this.productCatalogService.findOne(id, req.user);"
    ),
    # findBySku method
    (
        "return this.productCatalogService.findBySku(sku, req.user.tenantId);",
        "return this.productCatalogService.findBySku(sku, req.user);"
    ),
    # findBySlug method
    (
        "return this.productCatalogService.findBySlug(slug, req.user.tenantId);",
        "return this.productCatalogService.findBySlug(slug, req.user);"
    ),
    # update method
    (
        "return this.productCatalogService.update(id, dto, req.user.tenantId, req.user);",
        "return this.productCatalogService.update(id, dto, req.user);"
    ),
    # remove method
    (
        "return this.productCatalogService.remove(id, req.user.tenantId, req.user);",
        "return this.productCatalogService.remove(id, req.user);"
    ),
    # updateStock method
    (
        "return this.productCatalogService.updateStock(id, quantity, req.user.tenantId);",
        "return this.productCatalogService.updateStock(id, quantity, req.user);"
    ),
    # findLowStock method
    (
        "return this.productCatalogService.findLowStock(req.user.tenantId);",
        "return this.productCatalogService.findLowStock(req.user);"
    ),
    # findOutOfStock method
    (
        "return this.productCatalogService.findOutOfStock(req.user.tenantId);",
        "return this.productCatalogService.findOutOfStock(req.user);"
    ),
]

# Fix order.service.ts - Change tenantId to user parameter
order_service_fixes = [
    (
        "const order = await this.findOne(id, tenantId);",
        "const order = await this.findOne(id, user);"
    ),
]

# Apply fixes
files_to_fix = [
    ("domains/ecommerce/product-catalog/product-catalog.controller.ts", product_catalog_controller_fixes),
    ("domains/ecommerce/order/order.service.ts", order_service_fixes),
]

fixed_count = 0
for filepath, fixes in files_to_fix:
    if fix_file(filepath, fixes):
        fixed_count += 1

print(f"\n✅ Fixed {fixed_count}/{len(files_to_fix)} files")
print("\nNote: system-admin.service.ts error might need manual check")
