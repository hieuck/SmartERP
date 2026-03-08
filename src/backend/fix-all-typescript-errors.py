#!/usr/bin/env python3
"""
Comprehensive TypeScript error fixer for security refactoring
Fixes all 495 TypeScript compilation errors in test files
"""

import re
from pathlib import Path
from typing import List, Tuple

def fix_user_entity():
    """Add missing 'roles' property to User entity"""
    file_path = Path('domains/hr/user/entities/user.entity.ts')
    
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    content = file_path.read_text(encoding='utf-8')
    
    # Check if roles already exists
    if '@Column' in content and "'simple-array'" in content and 'roles' in content:
        print("✅ User entity already has roles property")
        return True
    
    # Add roles property after email
    if 'roles: string[];' not in content:
        # Find the email column and add roles after it
        content = re.sub(
            r"(@Column\(\{ unique: true \}\)\s+email: string;)",
            r"\1\n\n  @Column('simple-array')\n  roles: string[];",
            content
        )
        file_path.write_text(content, encoding='utf-8')
        print("✅ Added roles property to User entity")
        return True
    
    return True

def find_all_test_files() -> List[Path]:
    """Find all .spec.ts files"""
    return list(Path('.').rglob('*.spec.ts'))

def fix_controller_test_file(file_path: Path) -> Tuple[bool, int]:
    """
    Fix controller test files with parameter order issues
    Returns: (success, num_fixes)
    """
    if not file_path.exists():
        return False, 0
    
    content = file_path.read_text(encoding='utf-8')
    original_content = content
    fixes = 0
    
    # Pattern 1: controller.method(param1, mockTenantId) -> controller.method(mockUser, param1)
    # For methods like: findAll, count, search, findByStatus, etc.
    patterns = [
        # findAll(mockTenantId) -> findAll(mockUser)
        (r'controller\.findAll\(mockTenantId\)', 'controller.findAll(mockUser)', 'findAll'),
        (r'controller\.findAll\(["\']tenant1["\']\)', 'controller.findAll(mockUser)', 'findAll'),
        
        # count(mockTenantId) -> count(mockUser)
        (r'controller\.count\(mockTenantId\)', 'controller.count(mockUser)', 'count'),
        (r'controller\.count\(["\']tenant1["\']\)', 'controller.count(mockUser)', 'count'),
        
        # search(query, mockTenantId) -> search(mockUser, query)
        (r'controller\.search\((\w+),\s*mockTenantId\)', r'controller.search(mockUser, \1)', 'search'),
        (r'controller\.search\((\w+),\s*["\']tenant1["\']\)', r'controller.search(mockUser, \1)', 'search'),
        
        # findByStatus(status, mockTenantId) -> findByStatus(mockUser, status)
        (r'controller\.findByStatus\((\w+),\s*mockTenantId\)', r'controller.findByStatus(mockUser, \1)', 'findByStatus'),
        
        # getTopCustomers(limit, mockTenantId) -> getTopCustomers(mockUser, limit)
        (r'controller\.getTopCustomers\((\w+),\s*mockTenantId\)', r'controller.getTopCustomers(mockUser, \1)', 'getTopCustomers'),
        
        # findOne(id, mockTenantId) -> findOne(mockUser, id)
        (r'controller\.findOne\(([^,]+),\s*mockTenantId\)', r'controller.findOne(mockUser, \1)', 'findOne'),
        (r'controller\.findOne\(([^,]+),\s*["\']tenant1["\']\)', r'controller.findOne(mockUser, \1)', 'findOne'),
        
        # create(dto, mockTenantId) -> create(mockUser, dto)
        (r'controller\.create\((\w+),\s*mockTenantId\)', r'controller.create(mockUser, \1)', 'create'),
        (r'controller\.create\((\w+),\s*["\']tenant1["\']\)', r'controller.create(mockUser, \1)', 'create'),
        
        # update(id, dto, mockTenantId) -> update(id, mockUser, dto)
        # Note: @Param('id') comes BEFORE @CurrentUser() in controller
        (r'controller\.update\(([^,]+),\s*(\w+),\s*mockTenantId\)', r'controller.update(\1, mockUser, \2)', 'update'),
        (r'controller\.update\(([^,]+),\s*(\w+),\s*["\']tenant1["\']\)', r'controller.update(\1, mockUser, \2)', 'update'),
        
        # updateBalance(id, amount, mockTenantId) -> updateBalance(id, mockUser, amount)
        (r'controller\.updateBalance\(([^,]+),\s*(\w+),\s*mockTenantId\)', r'controller.updateBalance(\1, mockUser, \2)', 'updateBalance'),
        
        # updateCreditLimit(id, limit, mockTenantId) -> updateCreditLimit(id, mockUser, limit)
        (r'controller\.updateCreditLimit\(([^,]+),\s*(\w+),\s*mockTenantId\)', r'controller.updateCreditLimit(\1, mockUser, \2)', 'updateCreditLimit'),
        
        # activate(id, mockTenantId) -> activate(mockUser, id)
        (r'controller\.activate\(([^,]+),\s*mockTenantId\)', r'controller.activate(mockUser, \1)', 'activate'),
        
        # deactivate(id, mockTenantId) -> deactivate(mockUser, id)
        (r'controller\.deactivate\(([^,]+),\s*mockTenantId\)', r'controller.deactivate(mockUser, \1)', 'deactivate'),
        
        # remove(id, mockTenantId) -> remove(mockUser, id)
        (r'controller\.remove\(([^,]+),\s*mockTenantId\)', r'controller.remove(mockUser, \1)', 'remove'),
        (r'controller\.remove\(([^,]+),\s*["\']tenant1["\']\)', r'controller.remove(mockUser, \1)', 'remove'),
    ]
    
    for pattern, replacement, method_name in patterns:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            fixes += 1
            content = new_content
    
    if content != original_content:
        file_path.write_text(content, encoding='utf-8')
        return True, fixes
    
    return False, 0

def ensure_mock_user_import(file_path: Path) -> bool:
    """Ensure test file has mockUser import and declaration"""
    content = file_path.read_text(encoding='utf-8')
    
    # Check if mockUser already exists
    if 'const mockUser' in content or 'let mockUser' in content:
        return False
    
    # Check if file uses mockUser
    if 'mockUser' not in content:
        return False
    
    # Add mockUser declaration at the top of first describe block
    if "describe('" in content:
        # Find first describe block
        match = re.search(r"(describe\(['\"])", content)
        if match:
            insert_pos = match.start()
            mock_user_code = """const mockUser = {
    id: 'user1',
    tenantId: 'tenant1',
    roles: ['admin'],
  };

  """
            content = content[:insert_pos] + mock_user_code + content[insert_pos:]
            file_path.write_text(content, encoding='utf-8')
            return True
    
    return False

def main():
    print("🔧 Comprehensive TypeScript Error Fixer")
    print("=" * 60)
    print()
    
    # Step 1: Fix User entity
    print("📝 Step 1: Fixing User entity...")
    if fix_user_entity():
        print("✅ User entity fixed")
    else:
        print("❌ Failed to fix User entity")
        return
    print()
    
    # Step 2: Find all test files
    print("📝 Step 2: Finding all test files...")
    test_files = find_all_test_files()
    print(f"✅ Found {len(test_files)} test files")
    print()
    
    # Step 3: Fix controller test files
    print("📝 Step 3: Fixing controller test files...")
    controller_files = [f for f in test_files if 'controller.spec.ts' in str(f)]
    print(f"Found {len(controller_files)} controller test files")
    
    total_fixes = 0
    fixed_files = 0
    
    for file_path in controller_files:
        success, num_fixes = fix_controller_test_file(file_path)
        if success:
            fixed_files += 1
            total_fixes += num_fixes
            print(f"  ✅ {file_path.relative_to('.')} ({num_fixes} fixes)")
    
    print(f"✅ Fixed {fixed_files} controller test files ({total_fixes} total fixes)")
    print()
    
    # Step 4: Ensure mockUser imports
    print("📝 Step 4: Ensuring mockUser declarations...")
    added_imports = 0
    
    for file_path in test_files:
        if ensure_mock_user_import(file_path):
            added_imports += 1
            print(f"  ✅ {file_path.relative_to('.')}")
    
    print(f"✅ Added mockUser to {added_imports} files")
    print()
    
    print("=" * 60)
    print("✅ All fixes applied!")
    print()
    print("Next steps:")
    print("1. Run: npm test 2>&1 | Select-Object -First 100")
    print("2. Check for remaining errors")
    print("3. Run this script again if needed")

if __name__ == '__main__':
    main()
