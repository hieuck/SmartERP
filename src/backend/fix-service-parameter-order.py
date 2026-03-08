#!/usr/bin/env python3
"""Fix service method parameter order in tests"""

import re
from pathlib import Path

def fix_service_calls(file_path: Path) -> int:
    content = file_path.read_text(encoding='utf-8')
    original = content
    fixes = 0
    
    methods = ['findOne', 'findAll', 'create', 'update', 'remove', 'delete',
               'findByOrderNumber', 'findByCustomer', 'findByStatus', 'findByDateRange',
               'updateStatus', 'cancel', 'ship', 'refund', 'confirm',
               'activate', 'deactivate', 'updateBalance', 'updateCreditLimit']
    
    for method in methods:
        # Pattern 1: service.method('id', mockUser)
        pattern1 = rf"service\.{method}\((['\"][^'\"]+['\"]|[a-zA-Z_][a-zA-Z0-9_]*),\s*mockUser\)"
        matches = re.findall(pattern1, content)
        if matches:
            content = re.sub(pattern1, rf"service.{method}(mockUser, \1)", content)
            fixes += len(matches)
        
        # Pattern 2: service.method('id', dto, mockUser)
        pattern2 = rf"service\.{method}\((['\"][^'\"]+['\"]|[a-zA-Z_][a-zA-Z0-9_]*),\s*([a-zA-Z_][a-zA-Z0-9_]*),\s*mockUser\)"
        matches = re.findall(pattern2, content)
        if matches:
            content = re.sub(pattern2, rf"service.{method}(mockUser, \1, \2)", content)
            fixes += len(matches)
        
        # Pattern 3: service.method(dto, mockUser)
        pattern3 = rf"service\.{method}\(([a-zA-Z_][a-zA-Z0-9_]+(?:\s+as\s+any)?),\s*mockUser\)"
        matches = re.findall(pattern3, content)
        if matches:
            for match in matches:
                if 'mockUser' not in match:
                    old_call = f"service.{method}({match}, mockUser)"
                    new_call = f"service.{method}(mockUser, {match})"
                    content = content.replace(old_call, new_call)
                    fixes += 1
    
    # Special: findByDateRange(startDate, endDate, mockUser)
    pattern_date = r"service\.findByDateRange\(([^,]+),\s*([^,]+),\s*mockUser\)"
    matches = re.findall(pattern_date, content)
    if matches:
        content = re.sub(pattern_date, r"service.findByDateRange(mockUser, \1, \2)", content)
        fixes += len(matches)
    
    if content != original:
        file_path.write_text(content, encoding='utf-8')
    return fixes

def main():
    print("🔧 FIX SERVICE PARAMETER ORDER")
    test_files = list(Path('.').rglob('*.service.spec.ts'))
    print(f"📝 Found {len(test_files)} files\n")
    
    total = 0
    for f in test_files:
        fixes = fix_service_calls(f)
        if fixes > 0:
            total += fixes
            print(f"  ✅ {f.name}: {fixes} fixes")
    
    print(f"\n📊 Total: {total} fixes")

if __name__ == '__main__':
    main()
