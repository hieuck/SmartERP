#!/usr/bin/env python3
"""
Fix duplicate User imports in TypeScript files.
Renames User entity import to UserEntity and updates all references.
"""

import os
import re
from pathlib import Path

def fix_file(filepath):
    """Fix duplicate User imports in a single file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if file has duplicate User imports
    user_entity_import = re.search(r"import \{ User \} from ['\"].*user\.entity['\"];?", content)
    permission_import = re.search(r"import \{ User \} from ['\"]@/common/security/permission\.service['\"];?", content)
    
    if not (user_entity_import and permission_import):
        return False  # No duplicate imports
    
    # Replace User entity import with UserEntity
    content = re.sub(
        r"import \{ User \} from (['\"].*user\.entity['\"];?)",
        r"import { User as UserEntity } from \1",
        content
    )
    
    # Replace all references to User entity with UserEntity
    # But keep User type from permission.service
    
    # Replace in Repository<User>
    content = re.sub(r'Repository<User>', 'Repository<UserEntity>', content)
    
    # Replace in @InjectRepository(User)
    content = re.sub(r'@InjectRepository\(User\)', '@InjectRepository(UserEntity)', content)
    
    # Replace in TypeOrmModule.forFeature([User])
    content = re.sub(r'TypeOrmModule\.forFeature\(\[User\]', 'TypeOrmModule.forFeature([UserEntity]', content)
    
    # Replace variable declarations: user: User (entity)
    # This is tricky - we need to identify entity vs type usage
    # For now, replace in common patterns
    
    # Save the file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True

def main():
    """Find and fix all TypeScript files with duplicate User imports."""
    backend_dir = Path('src/backend')
    
    if not backend_dir.exists():
        print("Error: src/backend directory not found")
        return
    
    fixed_count = 0
    
    for ts_file in backend_dir.rglob('*.ts'):
        # Skip node_modules and dist
        if 'node_modules' in str(ts_file) or 'dist' in str(ts_file):
            continue
        
        try:
            if fix_file(ts_file):
                print(f"Fixed: {ts_file}")
                fixed_count += 1
        except Exception as e:
            print(f"Error fixing {ts_file}: {e}")
    
    print(f"\nFixed {fixed_count} files")

if __name__ == '__main__':
    main()
