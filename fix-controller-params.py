#!/usr/bin/env python3
"""
Fix controller parameter order - User should be first parameter.
Pattern: method(@Param() id, @Body() dto, @CurrentUser() user) 
     ->  method(@CurrentUser() user, @Param() id, @Body() dto)
"""

import os
import re
from pathlib import Path

def fix_controller_file(filepath):
    """Fix parameter order in a controller file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern 1: @Param first, @CurrentUser last -> swap
    # Example: method(@Param('id') id: string, @CurrentUser() user: User)
    content = re.sub(
        r'(@\w+\([^)]*\)\s+\w+:\s*\w+),\s*(@CurrentUser\(\)\s+\w+:\s*User)',
        r'\2, \1',
        content
    )
    
    # Pattern 2: @Body first, @CurrentUser last -> swap
    # Example: method(@Body() dto: CreateDto, @CurrentUser() user: User)
    content = re.sub(
        r'(@Body\(\)\s+\w+:\s*\w+),\s*(@CurrentUser\(\)\s+\w+:\s*User)',
        r'\2, \1',
        content
    )
    
    # Pattern 3: @Param, @Body, @CurrentUser -> @CurrentUser, @Param, @Body
    # Example: method(@Param('id') id: string, @Body() dto: UpdateDto, @CurrentUser() user: User)
    content = re.sub(
        r'(@\w+\([^)]*\)\s+\w+:\s*\w+),\s*(@Body\(\)\s+\w+:\s*\w+),\s*(@CurrentUser\(\)\s+\w+:\s*User)',
        r'\3, \1, \2',
        content
    )
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    
    return False

def main():
    """Find and fix all controller files."""
    backend_dir = Path('src/backend')
    
    if not backend_dir.exists():
        print("Error: src/backend directory not found")
        return
    
    fixed_count = 0
    
    for controller_file in backend_dir.rglob('*.controller.ts'):
        # Skip node_modules and dist
        if 'node_modules' in str(controller_file) or 'dist' in str(controller_file):
            continue
        
        try:
            if fix_controller_file(controller_file):
                print(f"Fixed: {controller_file}")
                fixed_count += 1
        except Exception as e:
            print(f"Error fixing {controller_file}: {e}")
    
    print(f"\nFixed {fixed_count} controller files")

if __name__ == '__main__':
    main()
