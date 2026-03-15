# Fix common test file variable naming issues
# This script fixes:
# 1. _permissionService -> permissionService
# 2. __permissionService -> permissionService
# 3. _accountRepository -> accountRepository
# 4. __accountRepository -> accountRepository
# 5. _result -> result
# 6. __result -> result
# 7. Remove unused 'let result: unknown;' declarations

$specFiles = Get-ChildItem -Path "src" -Filter "*.spec.ts" -Recurse
$fixedCount = 0
$totalFiles = $specFiles.Count

Write-Host "Found $totalFiles test files"
Write-Host "Scanning for variable naming issues..."
Write-Host ""

foreach ($file in $specFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $modified = $false

    # Fix 1: _permissionService -> permissionService
    if ($content -match 'let _permissionService:') {
        $content = $content -replace 'let _permissionService:', 'let permissionService:'
        $modified = $true
    }

    # Fix 2: __permissionService -> permissionService
    if ($content -match 'let __permissionService:') {
        $content = $content -replace 'let __permissionService:', 'let permissionService:'
        $modified = $true
    }

    # Fix 3: _accountRepository -> accountRepository
    if ($content -match 'let _accountRepository:') {
        $content = $content -replace 'let _accountRepository:', 'let accountRepository:'
        $modified = $true
    }

    # Fix 4: __accountRepository -> accountRepository
    if ($content -match 'let __accountRepository:') {
        $content = $content -replace 'let __accountRepository:', 'let accountRepository:'
        $modified = $true
    }

    # Fix 5: _service -> service (only if service is also declared)
    if ($content -match 'let _service:' -and $content -match 'service = module\.get') {
        $content = $content -replace 'let _service:', 'let service:'
        $modified = $true
    }

    # Fix 6: Remove 'let result: unknown;' at top level
    if ($content -match 'let result: unknown;') {
        $content = $content -replace '\s*let result: unknown;\s*\n', "`n"
        $modified = $true
    }

    # Fix 7: Remove 'let _result: unknown;' at top level
    if ($content -match 'let _result: unknown;') {
        $content = $content -replace '\s*let _result: unknown;\s*\n', "`n"
        $modified = $true
    }

    # Fix 8: const _result = await -> const result = await
    if ($content -match 'const _result = await') {
        $content = $content -replace 'const _result = await', 'const result = await'
        $modified = $true
    }

    # Fix 9: const __result = await -> const result = await
    if ($content -match 'const __result = await') {
        $content = $content -replace 'const __result = await', 'const result = await'
        $modified = $true
    }

    # Fix 10: expect(result. -> expect(result. (fix references after renaming)
    # This is already correct, no change needed

    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $fixedCount++
        Write-Host "✅ Fixed: $($file.Name)"
    }
}

Write-Host ""
Write-Host "========================================="
Write-Host "✅ Fixed $fixedCount files"
Write-Host "⏭️  Skipped $($totalFiles - $fixedCount) files (no changes needed)"
Write-Host "========================================="
