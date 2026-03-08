#!/usr/bin/env python3
"""
Fix test expectations to use mockUser instead of mockTenantId
After security refactoring, services now receive User object, not tenantId string
"""

import re
from pathlib import Path
from typing import List

def fix_test_expectations(file_path: Path) -> int:
    """Fix service call expectations in test file"""
    if not file_path.exists():
        return 0
    
    content = file_path.read_text(encoding='utf-8')
    original_content = content
    fixes = 0
    
    # Pattern: service.method.toHaveBeenCalledWith(..., mockTenantId)
    # Replace mockTenantId with mockUser in expectations
    
    # Single parameter: (mockTenantId) -> (mockUser)
    pattern1 = r'toHaveBeenCalledWith\(mockTenantId\)'
    if re.search(pattern1, content):
        content = re.sub(pattern1, 'toHaveBeenCalledWith(mockUser)', content)
        fixes += len(re.findall(pattern1, original_content))
    
    # Two parameters: (param, mockTenantId) -> (mockUser, param)
    pattern2 = r'toHaveBeenCalledWith\((\w+),\s*mockTenantId\)'
    if re.search(pattern2, content):
        content = re.sub(pattern2, r'toHaveBeenCalledWith(mockUser, \1)', content)
        fixes += len(re.findall(pattern2, original_content))
    
    # Three parameters: (param1, param2, mockTenantId) -> (mockUser, param1, param2)
    pattern3 = r'toHaveBeenCalledWith\(([^,]+),\s*([^,]+),\s*mockTenantId\)'
    if re.search(pattern3, content):
        content = re.sub(pattern3, r'toHaveBeenCalledWith(mockUser, \1, \2)', content)
        fixes += len(re.findall(pattern3, original_content))
    
    # Four parameters: (param1, param2, param3, mockTenantId) -> (mockUser, param1, param2, param3)
    pattern4 = r'toHaveBeenCalledWith\(([^,]+),\s*([^,]+),\s*([^,]+),\s*mockTenantId\)'
    if re.search(pattern4, content):
        content = re.sub(pattern4, r'toHaveBeenCalledWith(mockUser, \1, \2, \3)', content)
        fixes += len(re.findall(pattern4, original_content))
    
    # Also fix 'tenant1' string literals
    pattern5 = r"toHaveBeenCalledWith\(['\"]tenant1['\"]\)"
    if re.search(pattern5, content):
        content = re.sub(pattern5, 'toHaveBeenCalledWith(mockUser)', content)
        fixes += len(re.findall(pattern5, original_content))
    
    pattern6 = r"toHaveBeenCalledWith\((\w+),\s*['\"]tenant1['\"]\)"
    if re.search(pattern6, content):
        content = re.sub(pattern6, r'toHaveBeenCalledWith(mockUser, \1)', content)
        fixes += len(re.findall(pattern6, original_content))
    
    if content != original_content:
        file_path.write_text(content, encoding='utf-8')
        return fixes
    
    return 0

def main():
    print("🔧 Fixing Test Expectations")
    print("=" * 60)
    print()
    
    # Find all test files
    test_files = list(Path('.').rglob('*.spec.ts'))
    print(f"Found {len(test_files)} test files")
    print()
    
    total_fixes = 0
    fixed_files = 0
    
    for file_path in test_files:
        fixes = fix_test_expectations(file_path)
        if fixes > 0:
            fixed_files += 1
            total_fixes += fixes
            print(f"  ✅ {file_path.relative_to('.')} ({fixes} fixes)")
    
    print()
    print("=" * 60)
    print(f"✅ Fixed {fixed_files} files ({total_fixes} total fixes)")
    print()
    print("Next: Run npm test to verify")

if __name__ == '__main__':
    main()
