#!/usr/bin/env python3
"""
Comprehensive test error fixer v2 - Fix all remaining 77 test suites
Focuses on:
1. Missing PermissionService mocks
2. Test expectations (mockTenantId → mockUser)
3. Missing mockUser imports
"""

import re
from pathlib import Path
from typing import List

def find_all_test_files() -> List[Path]:
    """Find all .spec.ts files"""
    backend_dir = Path('.')
    return list(backend_dir.rglob('*.spec.ts'))

def needs_permission_service_mock(file_path: Path) -> bool:
    """Check if file needs PermissionService mock"""
    content = file_path.read_text(encoding='utf-8')
    
    # Check if service uses PermissionService but test doesn't mock it
    if '.service.spec.ts' in str(file_path):
        # Check if corresponding service file exists and uses PermissionService
        service_file = file_path.parent / file_path.name.replace('.spec.ts', '.ts')
        if service_file.exists():
            service_content = service_file.read_text(encoding='utf-8')
            if 'PermissionService' in service_content and 'private readonly permissionService' in service_content:
                # Check if test already has mock
                if "provide: PermissionService" not in content and "provide: 'PermissionService'" not in content:
                    return True
    return False

def add_permission_service_mock(file_path: Path) -> bool:
    """Add PermissionService mock to test file"""
    content = file_path.read_text(encoding='utf-8')
    
    # Add import if missing
    if 'PermissionService' not in content:
        # Find first import line
        import_match = re.search(r'^import .+ from .+;$', content, re.MULTILINE)
        if import_match:
            insert_pos = import_match.end()
            import_line = "\nimport { PermissionService } from '@/common/security/permission.service';"
            content = content[:insert_pos] + import_line + content[insert_pos:]
    
    # Add mock provider before ].compile()
    compile_match = re.search(r'(\s+)\],\s*\)\.compile\(\);', content)
    if compile_match:
        indent = compile_match.group(1)
        mock_provider = f"""{indent}{{
{indent}  provide: PermissionService,
{indent}  useValue: {{
{indent}    canRead: jest.fn().mockReturnValue(true),
{indent}    canWrite: jest.fn().mockReturnValue(true),
{indent}    canDelete: jest.fn().mockReturnValue(true),
{indent}    buildSecureQuery: jest.fn((user, baseWhere) => ({{ ...baseWhere, tenantId: user.tenantId }})),
{indent}  }},
{indent}}},
{indent}"""
        content = content[:compile_match.start()] + mock_provider + '],\n    }).compile();' + content[compile_match.end():]
        
        file_path.write_text(content, encoding='utf-8')
        return True
    
    return False

def fix_test_expectations(file_path: Path) -> int:
    """Fix test expectations from mockTenantId to mockUser"""
    content = file_path.read_text(encoding='utf-8')
    original = content
    fixes = 0
    
    # Pattern 1: toHaveBeenCalledWith(id, mockTenantId) → toHaveBeenCalledWith(mockUser, id)
    pattern1 = r'toHaveBeenCalledWith\(([^,]+),\s*mockTenantId\)'
    matches = re.findall(pattern1, content)
    if matches:
        content = re.sub(pattern1, r'toHaveBeenCalledWith(mockUser, \1)', content)
        fixes += len(matches)
    
    # Pattern 2: toHaveBeenCalledWith(id, dto, mockTenantId) → toHaveBeenCalledWith(mockUser, id, dto)
    pattern2 = r'toHaveBeenCalledWith\(([^,]+),\s*([^,]+),\s*mockTenantId\)'
    matches = re.findall(pattern2, content)
    if matches:
        content = re.sub(pattern2, r'toHaveBeenCalledWith(mockUser, \1, \2)', content)
        fixes += len(matches)
    
    # Pattern 3: toHaveBeenCalledWith(mockTenantId) → toHaveBeenCalledWith(mockUser)
    pattern3 = r'toHaveBeenCalledWith\(mockTenantId\)'
    matches = re.findall(pattern3, content)
    if matches:
        content = re.sub(pattern3, r'toHaveBeenCalledWith(mockUser)', content)
        fixes += len(matches)
    
    if content != original:
        file_path.write_text(content, encoding='utf-8')
        return fixes
    
    return 0

def ensure_mockuser_import(file_path: Path) -> bool:
    """Ensure mockUser is properly imported or declared"""
    content = file_path.read_text(encoding='utf-8')
    
    # Check if mockUser is used
    if 'mockUser' not in content:
        return False
    
    # Check if already has import or declaration
    if 'createMockUser' in content or 'const mockUser' in content or 'let mockUser' in content:
        return False
    
    # Add import
    import_match = re.search(r'^import .+ from .+;$', content, re.MULTILINE)
    if import_match:
        insert_pos = import_match.end()
        import_line = "\nimport { createMockUser } from '@/common/test/test-helpers';"
        content = content[:insert_pos] + import_line + content[insert_pos:]
        
        # Add mockUser declaration before first describe
        describe_match = re.search(r"describe\(['\"]", content)
        if describe_match:
            insert_pos = describe_match.start()
            mock_user_code = """const mockUser = createMockUser();

"""
            content = content[:insert_pos] + mock_user_code + content[insert_pos:]
            
            file_path.write_text(content, encoding='utf-8')
            return True
    
    return False

def main():
    print("=" * 70)
    print("🔧 COMPREHENSIVE TEST ERROR FIXER V2")
    print("=" * 70)
    print()
    
    test_files = find_all_test_files()
    print(f"📝 Found {len(test_files)} test files")
    print()
    
    stats = {
        'permission_mocks_added': 0,
        'expectations_fixed': 0,
        'mockuser_imports_added': 0,
    }
    
    for file_path in test_files:
        file_fixes = []
        
        # Fix 1: Add PermissionService mock if needed
        if needs_permission_service_mock(file_path):
            if add_permission_service_mock(file_path):
                stats['permission_mocks_added'] += 1
                file_fixes.append('PermissionService mock')
        
        # Fix 2: Fix test expectations
        expectations_fixed = fix_test_expectations(file_path)
        if expectations_fixed > 0:
            stats['expectations_fixed'] += expectations_fixed
            file_fixes.append(f'{expectations_fixed} expectations')
        
        # Fix 3: Ensure mockUser import
        if ensure_mockuser_import(file_path):
            stats['mockuser_imports_added'] += 1
            file_fixes.append('mockUser import')
        
        if file_fixes:
            print(f"  ✅ {file_path.name}: {', '.join(file_fixes)}")
    
    print()
    print("=" * 70)
    print("📊 SUMMARY:")
    print(f"  PermissionService mocks added: {stats['permission_mocks_added']}")
    print(f"  Test expectations fixed: {stats['expectations_fixed']}")
    print(f"  mockUser imports added: {stats['mockuser_imports_added']}")
    print()
    print("📝 Next steps:")
    print("1. Run: npm test")
    print("2. Check remaining errors")
    print("3. Run this script again if needed")
    print("=" * 70)

if __name__ == '__main__':
    main()
