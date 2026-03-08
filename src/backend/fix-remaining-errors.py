#!/usr/bin/env python3
"""
Fix remaining TypeScript compilation errors after security refactoring
"""

import os
import re
from pathlib import Path

def fix_controller_service_calls(file_path):
    """Fix service method calls in controllers - ensure user is first parameter"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Pattern 1: service.method(id, dto, user) -> service.method(user, id, dto)
    content = re.sub(
        r'this\.(\w+Service)\.(\w+)\(([^,]+),\s*([^,]+),\s*user\)',
        r'this.\1.\2(user, \3, \4)',
        content
    )
    
    # Pattern 2: service.method(id, user) -> service.method(user, id)
    content = re.sub(
        r'this\.(\w+Service)\.(\w+)\(([^,]+),\s*user\)',
        r'this.\1.\2(user, \3)',
        content
    )
    
    # Pattern 3: service.method(query, user) -> service.method(user, query)
    content = re.sub(
        r'this\.(\w+Service)\.(search|findByStatus|findByCustomer)\(([^,]+),\s*user\)',
        r'this.\1.\2(user, \3)',
        content
    )
    
    # Pattern 4: service.method(limit, user) -> service.method(user, limit)
    content = re.sub(
        r'this\.(\w+Service)\.(getTopCustomers|getTopSuppliers|getRecentOrders)\(([^,]+),\s*user\)',
        r'this.\1.\2(user, \3)',
        content
    )
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def fix_import_paths(file_path):
    """Fix wrong import paths for guards and decorators"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix JwtAuthGuard import
    content = re.sub(
        r"from '@/common/guards/jwt-auth\.guard'",
        r"from '../../../core/auth/guards/jwt-auth.guard'",
        content
    )
    
    # Fix TenantGuard import in accounting/payment
    if 'accounting/payment' in file_path:
        content = re.sub(
            r"from '../../common/guards/tenant\.guard'",
            r"from '../../../common/guards/tenant.guard'",
            content
        )
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def fix_journal_entry_imports(file_path):
    """Fix JournalEntry entity import paths"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix relative path for journal-entry entity
    if 'bank-reconciliation' in file_path:
        content = re.sub(
            r"from '\.\./journal-entry/entities/journal-entry\.entity'",
            r"from '../account/entities/journal-entry.entity'",
            content
        )
        content = re.sub(
            r"from '\.\./\.\./journal-entry/entities/journal-entry\.entity'",
            r"from '../../account/entities/journal-entry.entity'",
            content
        )
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    backend_dir = Path(__file__).parent
    
    # Find all controller files
    controller_files = list(backend_dir.rglob('*.controller.ts'))
    
    fixed_count = 0
    
    print("Fixing controller service calls...")
    for file_path in controller_files:
        if fix_controller_service_calls(str(file_path)):
            print(f"  ✓ Fixed: {file_path.relative_to(backend_dir)}")
            fixed_count += 1
    
    print("\nFixing import paths...")
    all_ts_files = list(backend_dir.rglob('*.ts'))
    for file_path in all_ts_files:
        if fix_import_paths(str(file_path)):
            print(f"  ✓ Fixed imports: {file_path.relative_to(backend_dir)}")
            fixed_count += 1
        
        if fix_journal_entry_imports(str(file_path)):
            print(f"  ✓ Fixed JournalEntry imports: {file_path.relative_to(backend_dir)}")
            fixed_count += 1
    
    print(f"\n✅ Fixed {fixed_count} files")

if __name__ == '__main__':
    main()
