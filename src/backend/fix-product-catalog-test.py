#!/usr/bin/env python3
"""Fix product-catalog.service.spec.ts to match service implementation"""

import re

file_path = 'domains/ecommerce/product-catalog/product-catalog.service.spec.ts'

with open(f'src/backend/{file_path}', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Remove mockQueryBuilder reference in search test
content = re.sub(
    r"describe\('search', \(\) => \{[^}]+mockRepository\.createQueryBuilder\.mockReturnValue\(mockQueryBuilder\);[^}]+mockQueryBuilder\.where[^}]+\}\);[^}]+\}\);",
    """describe('search', () => {
    it('should search products with filters', async () => {
      const mockProducts = [mockProduct];
      mockRepository.find.mockResolvedValue(mockProducts);

      const result = await service.search('test', 'tenant-123', {
        status: ProductStatus.ACTIVE
      });

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockProducts);
    });
  });""",
    content,
    flags=re.DOTALL
)

# Fix 2: create method - signature is (data, tenantId, user)
content = re.sub(
    r'const result = await service\.create\(mockUser, dto, mockUser\);',
    r"const result = await service.create(dto, 'tenant-123', mockUser);",
    content
)

# Fix 3: findOne method - signature is (id, tenantId)
content = re.sub(
    r'const result = await service\.findOne\(mockUser, \'prod-123\'\);',
    r"const result = await service.findOne('prod-123', 'tenant-123');",
    content
)
content = re.sub(
    r'service\.findOne\(mockUser, \'prod-999\'\)',
    r"service.findOne('prod-999', 'tenant-123')",
    content
)

# Fix 4: findBySku method - signature is (sku, tenantId)
content = re.sub(
    r'const result = await service\.findBySku\(\'PROD-001\', mockUser\);',
    r"const result = await service.findBySku('PROD-001', 'tenant-123');",
    content
)
content = re.sub(
    r'service\.findBySku\(\'PROD-999\', mockUser\)',
    r"service.findBySku('PROD-999', 'tenant-123')",
    content
)

# Fix 5: findBySlug method - signature is (slug, tenantId)
content = re.sub(
    r'const result = await service\.findBySlug\(\'test-product\', mockUser\);',
    r"const result = await service.findBySlug('test-product', 'tenant-123');",
    content
)
content = re.sub(
    r'service\.findBySlug\(\'invalid-slug\', mockUser\)',
    r"service.findBySlug('invalid-slug', 'tenant-123')",
    content
)

# Fix 6: update method - signature is (id, data, tenantId, user)
content = re.sub(
    r'const result = await service\.update\(mockUser, \'prod-123\', dto\);',
    r"const result = await service.update('prod-123', dto, 'tenant-123', mockUser);",
    content
)
content = re.sub(
    r'service\.update\(\'prod-999\', \{\}, mockUser\)',
    r"service.update('prod-999', {}, 'tenant-123', mockUser)",
    content
)

# Fix 7: remove method - signature is (id, tenantId, user)
content = re.sub(
    r'await service\.remove\(mockUser, \'prod-123\'\);',
    r"await service.remove('prod-123', 'tenant-123', mockUser);",
    content
)
content = re.sub(
    r'service\.remove\(mockUser, \'prod-999\'\)',
    r"service.remove('prod-999', 'tenant-123', mockUser)",
    content
)

# Fix 8: publish method - signature is (id, tenantId, user)
content = re.sub(
    r'const result = await service\.publish\(\'prod-123\', mockUser\);',
    r"const result = await service.publish('prod-123', 'tenant-123', mockUser);",
    content
)

# Fix 9: unpublish method - signature is (id, tenantId, user)
content = re.sub(
    r'const result = await service\.unpublish\(\'prod-123\', mockUser\);',
    r"const result = await service.unpublish('prod-123', 'tenant-123', mockUser);",
    content
)

# Fix 10: updateStock method - signature is (id, quantity, tenantId)
content = re.sub(
    r'const result = await service\.updateStock\(\'prod-123\', 100, mockUser\);',
    r"const result = await service.updateStock('prod-123', 100, 'tenant-123');",
    content
)
content = re.sub(
    r'const result = await service\.updateStock\(\'prod-123\', 0, mockUser\);',
    r"const result = await service.updateStock('prod-123', 0, 'tenant-123');",
    content
)

# Fix 11: findLowStock method - signature is (tenantId)
content = re.sub(
    r'const result = await service\.findLowStock\(mockUser\);',
    r"const result = await service.findLowStock('tenant-123');",
    content
)

# Fix 12: findOutOfStock method - signature is (tenantId)
content = re.sub(
    r'const result = await service\.findOutOfStock\(mockUser\);',
    r"const result = await service.findOutOfStock('tenant-123');",
    content
)

# Write back
with open(f'src/backend/{file_path}', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✅ Fixed {file_path}")
