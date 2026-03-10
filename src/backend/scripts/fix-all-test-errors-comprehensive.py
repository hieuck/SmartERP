#!/usr/bin/env python3
"""
Comprehensive test error fixer - Final solution for Week 48.5
Analyzes test output and fixes ALL TypeScript compilation errors systematically
"""

import re
import subprocess
from pathlib import Path
from typing import List, Dict
from collections import defaultdict

def run_tests_and_capture_errors() -> str:
    """Run tests and capture all output"""
    print("🔍 Using existing test output...")
    # Use existing test-output.txt file instead of running tests
    output_file = Path('test-output.txt')
    if output_file.exists():
        try:
            # Try UTF-8 first
            output = output_file.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            # Fallback to latin-1 which accepts all bytes
            output = output_file.read_text(encoding='latin-1')
        print(f"✅ Loaded {len(output)} characters from test-output.txt")
        return output
    else:
        print("❌ test-output.txt not found. Please run: npm test > test-output.txt 2>&1")
        return ""

def extract_failing_files(output: str) -> List[str]:
    """Extract list of failing test files"""
    pattern = r'FAIL\s+([\w/\\.-]+\.spec\.ts)'
    matches = re.findall(pattern, output)
    unique_files = list(set(matches))
    print(f"📝 Found {len(unique_files)} failing test files")
    return unique_files

def analyze_error_patterns(output: str) -> Dict[str, int]:
    """Analyze and count error patterns"""
    patterns = {
        'missing_mockUser': r"Cannot find name 'mockUser'",
        'type_mismatch_string_to_user': r"Argument of type 'string' is not assignable to parameter of type 'User'",
        'type_mismatch_user_to_string': r"Argument of type 'User' is not assignable to parameter of type 'string'",
        'missing_roles': r"Property 'roles' is missing",
        'wrong_arg_count': r'Expected \d+ arguments, but got \d+',
        'duplicate_identifier': r'Duplicate identifier',
    }
    
    counts = {}
    for name, pattern in patterns.items():
        count = len(re.findall(pattern, output))
        if count > 0:
            counts[name] = count
    
    print("\n📊 Error Pattern Analysis:")
    for name, count in sorted(counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {name}: {count} occurrences")
    
    return counts

def fix_missing_mockuser(file_path: Path) -> bool:
    """Add mockUser import/declaration if missing"""
    if not file_path.exists():
        return False
    
    content = file_path.read_text(encoding='utf-8')
    
    # Check if mockUser is used but not declared
    if 'mockUser' not in content:
        return False
    
    if 'const mockUser' in content or 'let mockUser' in content:
        return False
    
    # Check if createMockUser is imported
    if 'createMockUser' in content:
        return False
    
    # Add import at top
    if "from '@/common/test/test-helpers'" not in content:
        # Find first import line
        import_match = re.search(r"^import .+ from .+;$", content, re.MULTILINE)
        if import_match:
            insert_pos = import_match.end()
            import_line = "\nimport { createMockUser } from '@/common/test/test-helpers';"
            content = content[:insert_pos] + import_line + content[insert_pos:]
    
    # Add mockUser declaration before first describe
    if 'const mockUser' not in content:
        describe_match = re.search(r"describe\(['\"]", content)
        if describe_match:
            insert_pos = describe_match.start()
            mock_user_code = """const mockUser = createMockUser();

"""
            content = content[:insert_pos] + mock_user_code + content[insert_pos:]
            file_path.write_text(content, encoding='utf-8')
            return True
    
    return False

def fix_service_calls_in_tests(file_path: Path) -> int:
    """Fix service method calls in test files"""
    if not file_path.exists():
        return 0
    
    content = file_path.read_text(encoding='utf-8')
    original = content
    fixes = 0
    
    # Pattern: service.method(param, tenantId) -> service.method(mockUser, param)
    # But need to be careful with different method signatures
    
    # Common patterns to fix:
    patterns = [
        # service.method('id', 'tenant1') -> service.method(mockUser, 'id')
        (r"service\.(\w+)\('([^']+)',\s*'tenant1'\)", r"service.\1(mockUser, '\2')"),
        # service.method(dto, 'tenant1') -> service.method(mockUser, dto)
        (r"service\.(\w+)\((\w+),\s*'tenant1'\)", r"service.\1(mockUser, \2)"),
        # service.method('id', dto, 'tenant1') -> service.method(mockUser, 'id', dto)
        (r"service\.(\w+)\('([^']+)',\s*(\w+),\s*'tenant1'\)", r"service.\1(mockUser, '\2', \3)"),
    ]
    
    for pattern, replacement in patterns:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            fixes += len(re.findall(pattern, content))
            content = new_content
    
    if content != original:
        file_path.write_text(content, encoding='utf-8')
        return fixes
    
    return 0

def fix_controller_calls_in_tests(file_path: Path) -> int:
    """Fix controller method calls in test files"""
    if not file_path.exists() or 'controller.spec.ts' not in str(file_path):
        return 0
    
    content = file_path.read_text(encoding='utf-8')
    original = content
    fixes = 0
    
    # Controller patterns are already mostly fixed, but check for remaining issues
    # Pattern: await controller.method(mockTenantId) -> await controller.method(mockUser)
    pattern = r'await controller\.(\w+)\(mockTenantId\)'
    if re.search(pattern, content):
        content = re.sub(pattern, r'await controller.\1(mockUser)', content)
        fixes += len(re.findall(pattern, original))
    
    if content != original:
        file_path.write_text(content, encoding='utf-8')
        return fixes
    
    return 0

def main():
    print("=" * 70)
    print("🔧 COMPREHENSIVE TEST ERROR FIXER - Final Solution")
    print("=" * 70)
    print()
    
    # Step 1: Run tests and analyze errors
    print("📊 Step 1: Analyzing test errors...")
    output = run_tests_and_capture_errors()
    failing_files = extract_failing_files(output)
    error_patterns = analyze_error_patterns(output)
    print()
    
    # Step 2: Fix each failing file
    print("🔧 Step 2: Fixing failing test files...")
    total_fixes = 0
    fixed_files = 0
    
    for file_path_str in failing_files:
        file_path = Path(file_path_str)
        file_fixes = 0
        
        # Apply all fix functions
        if fix_missing_mockuser(file_path):
            file_fixes += 1
        
        file_fixes += fix_service_calls_in_tests(file_path)
        file_fixes += fix_controller_calls_in_tests(file_path)
        
        if file_fixes > 0:
            fixed_files += 1
            total_fixes += file_fixes
            print(f"  ✅ {file_path.name}: {file_fixes} fixes")
    
    print()
    print("=" * 70)
    print(f"✅ Fixed {fixed_files} files with {total_fixes} total fixes")
    print()
    print("📝 Next steps:")
    print("1. Run: npm test")
    print("2. Check remaining errors")
    print("3. Run this script again if needed")
    print()
    print("=" * 70)

if __name__ == '__main__':
    main()
