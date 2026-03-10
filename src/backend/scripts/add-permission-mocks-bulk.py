#!/usr/bin/env python3
"""Bulk add PermissionService mocks to service test files"""
import re
from pathlib import Path

def add_permission_mock(file_path: Path) -> bool:
    try:
        content = file_path.read_text(encoding='utf-8')
        if 'PermissionService' in content or '.service.spec.ts' not in str(file_path):
            return False
        
        original = content
        
        # Add import
        import_pattern = r"(import.*from '@/common/cache/cache\.service';)"
        if re.search(import_pattern, content):
            content = re.sub(import_pattern, r"\1\nimport { PermissionService } from '@/common/security/permission.service';", content)
        
        # Add mock
        compile_pattern = r'(\s+)\],\s*\)\.compile\(\);'
        match = re.search(compile_pattern, content)
        if match:
            indent = match.group(1)
            mock = f"""{indent}{{
{indent}  provide: PermissionService,
{indent}  useValue: {{
{indent}    canRead: jest.fn().mockReturnValue(true),
{indent}    canWrite: jest.fn().mockReturnValue(true),
{indent}    canDelete: jest.fn().mockReturnValue(true),
{indent}    buildSecureQuery: jest.fn((user, baseWhere) => ({{ ...baseWhere, tenantId: user.tenantId }})),
{indent}  }},
{indent}}},
{indent}"""
            content = content[:match.start()] + mock + '],\n    }).compile();' + content[match.end():]
        
        if content != original:
            file_path.write_text(content, encoding='utf-8')
            return True
        return False
    except:
        return False

def main():
    print("🔧 BULK ADD PERMISSIONSERVICE MOCKS")
    files = list(Path('.').rglob('*.service.spec.ts'))
    print(f"📝 {len(files)} files\n")
    
    fixed = 0
    for f in files:
        if add_permission_mock(f):
            fixed += 1
            print(f"  ✅ {f.name}")
    
    print(f"\n📊 Fixed {fixed} files")

if __name__ == '__main__':
    main()
