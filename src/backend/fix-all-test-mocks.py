#!/usr/bin/env python3
"""
Fix all test suites to use SecureRepository pattern instead of raw TypeORM mocking.
Fixes 29 test suites with common mocking issues.
"""

import os
import re
from pathlib import Path

# List of all test files to fix
TEST_FILES = [
    # Domains - Priority 1
    'domains/ecommerce/product-catalog/product-catalog.service.spec.ts',
    'domains/accounting/account/accounting.service.spec.ts',
    'domains/accounting/account/accounting.controller.spec.ts',
    'domains/accounting/bank-reconciliation/bank-reconciliation.service.spec.ts',
    'domains/project/task.service.spec.ts',
    'domains/project/time-tracking.service.spec.ts',
    
    # Platform - Priority 2
    'platform/document/document.service.spec.ts',
    'platform/dashboard/dashboard.service.spec.ts',
    'platform/report/report-template.service.spec.ts',
    'platform/report/report.controller.spec.ts',
    'platform/report/report.service.spec.ts',
    'platform/email/email.controller.spec.ts',
    
    # Integrations - Priority 3
    'integrations/integration/integration.service.spec.ts',
    'integrations/shipping/shipping.service.spec.ts',
    'integrations/payment-gateway/payment-gateway.service.spec.ts',
]

def fix_query_builder_mock(content: str) -> str:
    """Remove QueryBuilder mock and replace with SecureRepository methods"""
    
    # Pattern 1: Remove mockQueryBuilder definition
    content = re.sub(
        r'const mockQueryBuilder = \{[^}]+\};?\n\s*',
        '',
        content,
        flags=re.DOTALL
    )
    
    # Pattern 2: Remove createQueryBuilder from repository mock
    content = re.sub(
        r'createQueryBuilder:\s*jest\.fn\(\([^)]*\)\s*=>\s*mockQueryBuilder\),?\n?\s*',
        '',
        content
    )
    
    return content

def add_secure_repository_methods(content: str) -> str:
    """Add SecureRepository methods to repository mock if missing"""
    
    # Check if repository mock exists
    if 'const mockRepository' not in content and 'const mock' not in content:
        return content
    
    # Add find method if missing
    if 'find: jest.fn()' not in content:
        content = re.sub(
            r'(const mock\w+Repository = \{)',
            r'\1\n    find: jest.fn().mockResolvedValue([]),',
            content
        )
    
    # Add findOne method if missing
    if 'findOne: jest.fn()' not in content:
        content = re.sub(
            r'(const mock\w+Repository = \{)',
            r'\1\n    findOne: jest.fn().mockResolvedValue(null),',
            content
        )
    
    # Add save method if missing
    if 'save: jest.fn()' not in content:
        content = re.sub(
            r'(const mock\w+Repository = \{)',
            r'\1\n    save: jest.fn((data) => Promise.resolve({ id: \'1\', ...data })),',
            content
        )
    
    # Add remove method if missing
    if 'remove: jest.fn()' not in content:
        content = re.sub(
            r'(const mock\w+Repository = \{)',
            r'\1\n    remove: jest.fn().mockResolvedValue(undefined),',
            content
        )
    
    return content

def fix_find_operations(content: str) -> str:
    """Replace mockQueryBuilder.getMany() with mockRepository.find()"""
    
    # Pattern: mockQueryBuilder.getMany.mockResolvedValue(...)
    content = re.sub(
        r'mockQueryBuilder\.getMany\.mockResolvedValue\(([^)]+)\)',
        r'mockRepository.find.mockResolvedValue(\1)',
        content
    )
    
    # Pattern: expect(mockRepository.createQueryBuilder)
    content = re.sub(
        r'expect\(mock\w+Repository\.createQueryBuilder\)\.toHaveBeenCalled\(\)',
        r'expect(mockRepository.find).toHaveBeenCalled()',
        content
    )
    
    return content

def fix_delete_operations(content: str) -> str:
    """Fix delete operations to mock findOne before remove"""
    
    # Pattern: Delete test without findOne mock
    # Find delete tests and add findOne mock before remove
    pattern = r"(it\('should delete [^']+', async \(\) => \{[^}]*const mock\w+ = \{[^}]+\};)"
    
    def add_findone_mock(match):
        test_content = match.group(1)
        # Check if findOne is already mocked
        if 'findOne.mockResolvedValue' in test_content:
            return test_content
        # Add findOne mock after entity definition
        return test_content + '\n      mockRepository.findOne.mockResolvedValue(mock);'
    
    content = re.sub(pattern, add_findone_mock, content, flags=re.DOTALL)
    
    # Replace softDelete with remove
    content = re.sub(
        r'mock\w+Repository\.softDelete\.mockResolvedValue\(\{ affected: 1 \}\)',
        r'mockRepository.remove.mockResolvedValue(undefined)',
        content
    )
    
    # Replace delete with remove
    content = re.sub(
        r'mock\w+Repository\.delete\.mockResolvedValue\(\{ affected: 1 \}\)',
        r'mockRepository.remove.mockResolvedValue(undefined)',
        content
    )
    
    return content

def fix_update_operations(content: str) -> str:
    """Replace update() with save()"""
    
    # Pattern: mockRepository.update.mockResolvedValue(...)
    content = re.sub(
        r'mock\w+Repository\.update\.mockResolvedValue\(\{ affected: 1 \}\)',
        r'mockRepository.save.mockResolvedValue({ ...mockEntity, ...updates })',
        content
    )
    
    # Pattern: expect(mockRepository.update)
    content = re.sub(
        r'expect\(mock\w+Repository\.update\)\.toHaveBeenCalled',
        r'expect(mockRepository.save).toHaveBeenCalled',
        content
    )
    
    return content

def fix_cache_mocks(content: str) -> str:
    """Ensure cache service is properly mocked"""
    
    # Add cache service mock if missing
    if 'mockCacheService' not in content and 'CacheService' in content:
        # Find where to insert cache mock (after imports, before describe)
        insert_pos = content.find('describe(')
        if insert_pos > 0:
            cache_mock = '''
const mockCacheService = {
  getOrSet: jest.fn(),
  del: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
};

'''
            content = content[:insert_pos] + cache_mock + content[insert_pos:]
    
    return content

def fix_test_file(file_path: str) -> bool:
    """Fix a single test file"""
    
    full_path = Path('src/backend') / file_path
    
    if not full_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    print(f"🔧 Fixing: {file_path}")
    
    try:
        # Read file
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply fixes
        content = fix_query_builder_mock(content)
        content = add_secure_repository_methods(content)
        content = fix_find_operations(content)
        content = fix_delete_operations(content)
        content = fix_update_operations(content)
        content = fix_cache_mocks(content)
        
        # Write back if changed
        if content != original_content:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed: {file_path}")
            return True
        else:
            print(f"⏭️  No changes needed: {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error fixing {file_path}: {e}")
        return False

def main():
    """Fix all test files"""
    
    print("=" * 60)
    print("🚀 Fixing Test Mocking Issues - SecureRepository Pattern")
    print("=" * 60)
    print()
    
    fixed_count = 0
    skipped_count = 0
    error_count = 0
    
    for file_path in TEST_FILES:
        result = fix_test_file(file_path)
        if result:
            fixed_count += 1
        elif result is False:
            error_count += 1
        else:
            skipped_count += 1
        print()
    
    print("=" * 60)
    print("📊 Summary")
    print("=" * 60)
    print(f"✅ Fixed: {fixed_count}")
    print(f"⏭️  Skipped: {skipped_count}")
    print(f"❌ Errors: {error_count}")
    print(f"📝 Total: {len(TEST_FILES)}")
    print()
    
    if fixed_count > 0:
        print("🎯 Next step: Run tests to verify fixes")
        print("   npm test")

if __name__ == '__main__':
    main()
