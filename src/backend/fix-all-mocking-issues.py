#!/usr/bin/env python3
"""
Comprehensive fix for all test mocking issues.
Converts raw TypeORM mocks to SecureRepository pattern.
"""

import os
import re
from pathlib import Path
from typing import List, Tuple

# All test files with createQueryBuilder issues
TEST_FILES = [
    'platform/search/search.service.spec.ts',
    'platform/workflow/workflow.service.spec.ts',
    'platform/support/support.service.spec.ts',
    'platform/system-admin/system-admin.service.spec.ts',
    'platform/report/report.service.spec.ts',
    'platform/notification/notification.service.spec.ts',
    'platform/issue-tracking/issue-tracking.service.spec.ts',
    'integrations/payment-gateway/payment-gateway.service.spec.ts',
    'domains/sales/order/order.service.spec.ts',
    'domains/sales/customer/customer.service.spec.ts',
    'domains/project/task.service.spec.ts',
    'domains/project/project.service.spec.ts',
    'domains/project/time-tracking.service.spec.ts',
    'domains/manufacturing/bom/bom.service.spec.ts',
    'domains/inventory/valuation/valuation.service.spec.ts',
    'domains/inventory/stock/inventory.service.spec.ts',
    'domains/inventory/product/product.service.spec.ts',
    'domains/hr/role/role.service.spec.ts',
    'domains/hr/hr/hr.service.spec.ts',
    'domains/ecommerce/shopping-cart/shopping-cart.service.spec.ts',
    'domains/ecommerce/order/order.service.spec.ts',
    'domains/ecommerce/product-catalog/product-catalog.service.spec.ts',
    'domains/accounting/payment/payment.service.spec.ts',
    'core/permission/permission.service.spec.ts',
    'core/tenant/tenant.service.spec.ts',
    'core/tenant/subscription.service.spec.ts',
]

def remove_query_builder_definition(content: str) -> str:
    """Remove mockQueryBuilder object definition"""
    
    # Pattern 1: const mockQueryBuilder = { ... };
    pattern1 = r'const mockQueryBuilder\s*=\s*\{[^}]*\};?\n?'
    content = re.sub(pattern1, '', content)
    
    # Pattern 2: Multi-line mockQueryBuilder
    pattern2 = r'const mockQueryBuilder\s*=\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\};?\n?'
    content = re.sub(pattern2, '', content, flags=re.DOTALL)
    
    return content

def remove_createQueryBuilder_from_mocks(content: str) -> str:
    """Remove createQueryBuilder from repository mocks"""
    
    # Pattern 1: createQueryBuilder: jest.fn(() => mockQueryBuilder),
    content = re.sub(
        r'createQueryBuilder:\s*jest\.fn\([^)]*\),?\n?\s*',
        '',
        content
    )
    
    # Pattern 2: createQueryBuilder: jest.fn(),
    content = re.sub(
        r'createQueryBuilder:\s*jest\.fn\(\),?\n?\s*',
        '',
        content
    )
    
    # Pattern 3: Inline createQueryBuilder definitions
    content = re.sub(
        r'createQueryBuilder:\s*jest\.fn\(\(\)\s*=>\s*\(\{[^}]+\}\)\),?\n?\s*',
        '',
        content,
        flags=re.DOTALL
    )
    
    return content

def ensure_secure_repository_methods(content: str) -> str:
    """Ensure all repository mocks have SecureRepository methods"""
    
    # Find all repository mock definitions
    repo_pattern = r'(const mock\w+(?:Repo|Repository)\s*=\s*\{)'
    
    def add_methods(match):
        mock_def = match.group(1)
        
        # Check what methods are already present
        # Look ahead to see the mock content
        start_pos = match.end()
        brace_count = 1
        end_pos = start_pos
        
        while brace_count > 0 and end_pos < len(content):
            if content[end_pos] == '{':
                brace_count += 1
            elif content[end_pos] == '}':
                brace_count -= 1
            end_pos += 1
        
        mock_content = content[start_pos:end_pos-1]
        
        methods_to_add = []
        
        if 'find:' not in mock_content:
            methods_to_add.append('    find: jest.fn().mockResolvedValue([])')
        if 'findOne:' not in mock_content:
            methods_to_add.append('    findOne: jest.fn().mockResolvedValue(null)')
        if 'save:' not in mock_content:
            methods_to_add.append('    save: jest.fn((data) => Promise.resolve({ id: \'1\', ...data }))')
        if 'remove:' not in mock_content:
            methods_to_add.append('    remove: jest.fn().mockResolvedValue(undefined)')
        if 'count:' not in mock_content:
            methods_to_add.append('    count: jest.fn().mockResolvedValue(0)')
        
        if methods_to_add:
            return mock_def + '\n' + ',\n'.join(methods_to_add) + ','
        
        return mock_def
    
    content = re.sub(repo_pattern, add_methods, content)
    
    return content

def fix_test_expectations(content: str) -> str:
    """Fix test expectations to use SecureRepository methods"""
    
    # Replace mockQueryBuilder.getMany expectations
    content = re.sub(
        r'mockQueryBuilder\.getMany\.mockResolvedValue\(([^)]+)\)',
        r'mockRepository.find.mockResolvedValue(\1)',
        content
    )
    
    # Replace mockQueryBuilder.getOne expectations
    content = re.sub(
        r'mockQueryBuilder\.getOne\.mockResolvedValue\(([^)]+)\)',
        r'mockRepository.findOne.mockResolvedValue(\1)',
        content
    )
    
    # Replace createQueryBuilder expectations
    content = re.sub(
        r'expect\(mock\w+(?:Repo|Repository)\.createQueryBuilder\)\.toHaveBeenCalled\(\)',
        r'expect(mockRepository.find).toHaveBeenCalled()',
        content
    )
    
    # Replace update expectations
    content = re.sub(
        r'expect\(mock\w+(?:Repo|Repository)\.update\)\.toHaveBeenCalled',
        r'expect(mockRepository.save).toHaveBeenCalled',
        content
    )
    
    # Replace softDelete/delete expectations
    content = re.sub(
        r'expect\(mock\w+(?:Repo|Repository)\.(?:softDelete|delete)\)\.toHaveBeenCalled',
        r'expect(mockRepository.remove).toHaveBeenCalled',
        content
    )
    
    return content

def fix_delete_operations(content: str) -> str:
    """Add findOne mock before delete operations"""
    
    # Pattern: Delete test that needs findOne
    pattern = r"(it\('should (?:delete|remove)[^']*',\s*async\s*\(\)\s*=>\s*\{)"
    
    def check_and_add_findone(match):
        test_start = match.group(1)
        # Find the test body
        start_pos = match.end()
        brace_count = 1
        end_pos = start_pos
        
        while brace_count > 0 and end_pos < len(content):
            if content[end_pos] == '{':
                brace_count += 1
            elif content[end_pos] == '}':
                brace_count -= 1
            end_pos += 1
        
        test_body = content[start_pos:end_pos-1]
        
        # Check if findOne is already mocked
        if 'findOne.mockResolvedValue' in test_body:
            return match.group(0)
        
        # Check if there's a mock entity defined
        if 'const mock' in test_body and '= {' in test_body:
            # Add findOne mock after entity definition
            entity_pattern = r'(const mock\w+\s*=\s*\{[^}]+\};)'
            if re.search(entity_pattern, test_body):
                return match.group(0)  # Will be handled by another pattern
        
        return match.group(0)
    
    content = re.sub(pattern, check_and_add_findone, content, flags=re.DOTALL)
    
    return content

def fix_update_mocks(content: str) -> str:
    """Replace update() mocks with save()"""
    
    # Pattern: mockRepository.update.mockResolvedValue
    content = re.sub(
        r'mock\w+(?:Repo|Repository)\.update\.mockResolvedValue\([^)]*\)',
        r'mockRepository.save.mockResolvedValue({ ...mockEntity, ...updates })',
        content
    )
    
    return content

def fix_delete_mocks(content: str) -> str:
    """Replace softDelete/delete mocks with remove()"""
    
    # Pattern: mockRepository.softDelete.mockResolvedValue
    content = re.sub(
        r'mock\w+(?:Repo|Repository)\.softDelete\.mockResolvedValue\([^)]*\)',
        r'mockRepository.remove.mockResolvedValue(undefined)',
        content
    )
    
    # Pattern: mockRepository.delete.mockResolvedValue
    content = re.sub(
        r'mock\w+(?:Repo|Repository)\.delete\.mockResolvedValue\([^)]*\)',
        r'mockRepository.remove.mockResolvedValue(undefined)',
        content
    )
    
    return content

def clean_up_formatting(content: str) -> str:
    """Clean up extra blank lines and formatting"""
    
    # Remove multiple consecutive blank lines
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
    
    # Fix trailing commas in objects
    content = re.sub(r',\s*\n\s*\}', '\n  }', content)
    
    return content

def fix_file(file_path: str) -> Tuple[bool, str]:
    """Fix a single test file"""
    
    full_path = Path('src/backend') / file_path
    
    if not full_path.exists():
        return False, f"File not found: {file_path}"
    
    try:
        # Read file
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all fixes
        content = remove_query_builder_definition(content)
        content = remove_createQueryBuilder_from_mocks(content)
        content = ensure_secure_repository_methods(content)
        content = fix_test_expectations(content)
        content = fix_delete_operations(content)
        content = fix_update_mocks(content)
        content = fix_delete_mocks(content)
        content = clean_up_formatting(content)
        
        # Write back if changed
        if content != original_content:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, f"✅ Fixed: {file_path}"
        else:
            return False, f"⏭️  No changes: {file_path}"
            
    except Exception as e:
        return False, f"❌ Error: {file_path} - {str(e)}"

def main():
    """Main execution"""
    
    print("=" * 70)
    print("🚀 Fixing All Test Mocking Issues - SecureRepository Pattern")
    print("=" * 70)
    print()
    
    results = {
        'fixed': [],
        'skipped': [],
        'errors': []
    }
    
    for i, file_path in enumerate(TEST_FILES, 1):
        print(f"[{i}/{len(TEST_FILES)}] Processing: {file_path}")
        success, message = fix_file(file_path)
        
        print(f"    {message}")
        
        if success:
            results['fixed'].append(file_path)
        elif 'Error' in message:
            results['errors'].append(file_path)
        else:
            results['skipped'].append(file_path)
    
    print()
    print("=" * 70)
    print("📊 Summary")
    print("=" * 70)
    print(f"✅ Fixed:   {len(results['fixed'])} files")
    print(f"⏭️  Skipped: {len(results['skipped'])} files")
    print(f"❌ Errors:  {len(results['errors'])} files")
    print(f"📝 Total:   {len(TEST_FILES)} files")
    print()
    
    if results['fixed']:
        print("🎯 Fixed files:")
        for f in results['fixed'][:10]:  # Show first 10
            print(f"   - {f}")
        if len(results['fixed']) > 10:
            print(f"   ... and {len(results['fixed']) - 10} more")
        print()
    
    if results['errors']:
        print("⚠️  Files with errors:")
        for f in results['errors']:
            print(f"   - {f}")
        print()
    
    print("🧪 Next step: Run tests to verify")
    print("   cd src/backend && npm test")

if __name__ == '__main__':
    main()
