#!/usr/bin/env python3
"""
Fix TypeScript compilation errors systematically
Focuses on common patterns from security refactoring
"""

import os
import re
from pathlib import Path

# Common error patterns and fixes
FIXES = [
    # Fix 1: Missing @CurrentUser() import
    {
        'pattern': r"import.*from '@nestjs/common';",
        'check': lambda content: '@CurrentUser()' in content and 'CurrentUser' not in content.split('import')[0],
        'fix': lambda match: match.group(0).replace(
            "from '@nestjs/common';",
            "from '@nestjs/common';\nimport { CurrentUser } from '@/common/decorators/current-user.decorator';"
        )
    },
    
    # Fix 2: Missing User import
    {
        'pattern': r"import.*from '@nestjs/common';",
        'check': lambda content: ': User' in content and "import { User }" not in content,
        'fix': lambda match: match.group(0).replace(
            "from '@nestjs/common';",
            "from '@nestjs/common';\nimport { User } from '@/common/security/permission.service';"
        )
    },
    
    # Fix 3: Duplicate User imports
    {
        'pattern': r"(import { User } from.*\n)(import { User } from.*\n)",
        'check': lambda content: True,
        'fix': lambda match: match.group(1)  # Keep only first import
    },
    
    # Fix 4: Missing Roles decorator import
    {
        'pattern': r"import.*from '@nestjs/common';",
        'check': lambda content: '@Roles(' in content and 'Roles' not in content.split('@Roles')[0].split('import')[-1],
        'fix': lambda match: match.group(0).replace(
            "from '@nestjs/common';",
            "from '@nestjs/common';\nimport { Roles } from '@/common/decorators/roles.decorator';"
        )
    },
]

def fix_file(filepath):
    """Fix TypeScript errors in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes_made = []
        
        # Apply fixes
        for fix in FIXES:
            if fix['check'](content):
                pattern = fix['pattern']
                matches = list(re.finditer(pattern, content))
                
                if matches:
                    content = re.sub(pattern, fix['fix'], content)
                    if content != original_content:
                        changes_made.append(f"Applied fix: {fix['pattern'][:50]}...")
                        original_content = content
        
        # Write back if changes were made
        if changes_made:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed {filepath}")
            for change in changes_made:
                print(f"   - {change}")
            return True
        
        return False
    
    except Exception as e:
        print(f"❌ Error fixing {filepath}: {e}")
        return False

def main():
    """Main function to fix all TypeScript files"""
    backend_dir = Path(__file__).parent
    
    # Find all .ts files (excluding .spec.ts for now)
    ts_files = []
    for root, dirs, files in os.walk(backend_dir):
        # Skip node_modules and dist
        if 'node_modules' in root or 'dist' in root:
            continue
        
        for file in files:
            if file.endswith('.controller.ts') or file.endswith('.service.ts'):
                if not file.endswith('.spec.ts'):
                    ts_files.append(os.path.join(root, file))
    
    print(f"Found {len(ts_files)} TypeScript files to check")
    print("=" * 60)
    
    fixed_count = 0
    for filepath in sorted(ts_files):
        if fix_file(filepath):
            fixed_count += 1
    
    print("=" * 60)
    print(f"✅ Fixed {fixed_count} files")
    print(f"📊 Total files checked: {len(ts_files)}")

if __name__ == '__main__':
    main()
