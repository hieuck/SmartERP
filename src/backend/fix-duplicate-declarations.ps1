# Fix duplicate variable declarations in test files
# This script removes duplicate declarations that were created by previous fix

$specFiles = Get-ChildItem -Path "src" -Filter "*.spec.ts" -Recurse
$fixedCount = 0

Write-Host "Scanning for duplicate declarations..."
Write-Host ""

foreach ($file in $specFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $modified = $false

    # Pattern 1: Remove duplicate permissionService declarations
    # Match: let permissionService: ... (appears twice)
    $lines = $content -split "`n"
    $permissionServiceCount = 0
    $newLines = @()
    $skipNext = $false

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        
        # Check for permissionService declaration
        if ($line -match '^\s*let permissionService:\s*jest\.Mocked<PermissionService>') {
            $permissionServiceCount++
            if ($permissionServiceCount -gt 1) {
                # Skip duplicate declaration
                $modified = $true
                continue
            }
        }
        
        # Check for duplicate accountRepository
        if ($line -match '^\s*let accountRepository:\s*jest\.Mocked<Repository<Account>>') {
            # Check if we already have this
            $alreadyHas = $newLines | Where-Object { $_ -match '^\s*let accountRepository:\s*jest\.Mocked<Repository<Account>>' }
            if ($alreadyHas) {
                $modified = $true
                continue
            }
        }
        
        # Check for _orderRepository and fix to orderRepository
        if ($line -match '^\s*let _orderRepository:') {
            $line = $line -replace 'let _orderRepository:', 'let orderRepository:'
            $modified = $true
        }
        
        # Check for _productRepository and fix to productRepository
        if ($line -match '^\s*let _productRepository:') {
            $line = $line -replace 'let _productRepository:', 'let productRepository:'
            $modified = $true
        }
        
        # Check for _customerRepository and fix to customerRepository
        if ($line -match '^\s*let _customerRepository:') {
            $line = $line -replace 'let _customerRepository:', 'let customerRepository:'
            $modified = $true
        }
        
        $newLines += $line
    }

    if ($modified) {
        $newContent = $newLines -join "`n"
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        $fixedCount++
        Write-Host "✅ Fixed: $($file.Name)"
    }
}

Write-Host ""
Write-Host "========================================="
Write-Host "✅ Fixed $fixedCount files"
Write-Host "========================================="
