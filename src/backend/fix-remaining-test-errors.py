#!/usr/bin/env python3
"""
Fix remaining test errors after security refactoring
- Add mockUser to routing.service.spec.ts
- Fix addOperation parameter order
- Fix core/permission/permission.service.spec.ts parameters
"""

import re
from pathlib import Path

def fix_routing_service_spec():
    """Fix routing.service.spec.ts"""
    file_path = Path('domains/manufacturing/routing/routing.service.spec.ts')
    
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return
    
    content = file_path.read_text(encoding='utf-8')
    
    # Add mockUser declaration after mockRoutingRepository
    if 'const mockUser' not in content:
        content = content.replace(
            'const mockRoutingRepository = {',
            '''const mockUser = {
    id: 'user1',
    tenantId: 'tenant1',
    roles: ['admin'],
  };

  const mockRoutingRepository = {'''
        )
        print("✅ Added mockUser to routing.service.spec.ts")
    
    # Fix addOperation call - change (tenantId, routingId, dto) to (routingId, dto, tenantId, mockUser)
    content = re.sub(
        r'await service\.addOperation\(tenantId,\s*routingId,\s*dto\)',
        'await service.addOperation(routingId, dto, tenantId, mockUser)',
        content
    )
    print("✅ Fixed addOperation parameter order")
    
    # Fix findOne calls: service.findOne(tenantId, id) -> service.findOne(id, tenantId)
    # Note: This service has NOT been refactored to use User object yet
    content = re.sub(
        r"await service\.findOne\(tenantId,\s*id\)",
        "await service.findOne(id, tenantId)",
        content
    )
    content = re.sub(
        r"service\.findOne\(mockUser,\s*'([^']+)'\)",
        r"service.findOne('\1', 'tenant1')",
        content
    )
    print("✅ Fixed findOne() calls")
    
    file_path.write_text(content, encoding='utf-8')
    print(f"✅ Fixed {file_path}")

def fix_core_permission_service_spec():
    """Fix core/permission/permission.service.spec.ts"""
    file_path = Path('core/permission/permission.service.spec.ts')
    
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return
    
    content = file_path.read_text(encoding='utf-8')
    
    # Add mockUser import and declaration
    if 'const mockUser' not in content:
        # Find the first describe block and add mockUser before it
        content = re.sub(
            r"(describe\('PermissionService')",
            r"""const mockUser = {
    id: 'user1',
    tenantId: 'tenant1',
    roles: ['admin'],
  };

  \1""",
            content,
            count=1
        )
        print("✅ Added mockUser to core/permission/permission.service.spec.ts")
    
    # Fix create calls: service.create(createDto, 'tenant1') -> service.create(mockUser, createDto)
    content = re.sub(
        r"service\.create\(createDto,\s*'tenant1'\)",
        "service.create(mockUser, createDto)",
        content
    )
    print("✅ Fixed create() calls")
    
    # Fix findAll calls: service.findAll('tenant1') -> service.findAll(mockUser)
    content = re.sub(
        r"service\.findAll\('tenant1'\)",
        "service.findAll(mockUser)",
        content
    )
    print("✅ Fixed findAll() calls")
    
    # Fix findOne calls: service.findOne('1', 'tenant1') -> service.findOne(mockUser, '1')
    content = re.sub(
        r"service\.findOne\('(\d+)',\s*'tenant1'\)",
        r"service.findOne(mockUser, '\1')",
        content
    )
    print("✅ Fixed findOne() calls")
    
    # Fix update calls: service.update('1', updateDto, 'tenant1') -> service.update(mockUser, '1', updateDto)
    content = re.sub(
        r"service\.update\('(\d+)',\s*updateDto,\s*'tenant1'\)",
        r"service.update(mockUser, '\1', updateDto)",
        content
    )
    print("✅ Fixed update() calls")
    
    # Fix remove calls: service.remove('1', 'tenant1') -> service.remove(mockUser, '1')
    content = re.sub(
        r"service\.remove\('(\d+)',\s*'tenant1'\)",
        r"service.remove(mockUser, '\1')",
        content
    )
    print("✅ Fixed remove() calls")
    
    # Fix findByResource calls: service.findByResource('products', 'tenant1') -> service.findByResource(mockUser, 'products')
    content = re.sub(
        r"service\.findByResource\('([^']+)',\s*'tenant1'\)",
        r"service.findByResource(mockUser, '\1')",
        content
    )
    print("✅ Fixed findByResource() calls")
    
    # Fix update calls with 3 params where first is string ID
    # service.update('1', dto, 'tenant1') -> service.update(mockUser, '1', dto)
    content = re.sub(
        r"service\.update\('(\d+)',\s*(\w+),\s*'tenant1'\)",
        r"service.update(mockUser, '\1', \2)",
        content
    )
    print("✅ Fixed update() calls with ID")
    
    # Fix count calls: service.count('tenant1') -> service.count(mockUser)
    content = re.sub(
        r"service\.count\('tenant1'\)",
        "service.count(mockUser)",
        content
    )
    print("✅ Fixed count() calls")
    
    file_path.write_text(content, encoding='utf-8')
    print(f"✅ Fixed {file_path}")

def main():
    print("🔧 Fixing remaining test errors...")
    print()
    
    fix_routing_service_spec()
    print()
    fix_core_permission_service_spec()
    print()
    
    print("✅ All fixes applied!")
    print()
    print("Run: npm test -- --testPathPattern=\"permission.service.spec|routing.service.spec\"")

if __name__ == '__main__':
    main()
