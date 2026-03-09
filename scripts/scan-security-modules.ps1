# Scan all modules for SecurityModule import and PermissionService injection
# Senior Dev #2 - Security Architecture Review

$results = @()

# Get all module files (exclude node_modules)
$moduleFiles = Get-ChildItem -Path "src/backend" -Filter "*.module.ts" -Recurse | 
    Where-Object { $_.FullName -notmatch "node_modules" }

foreach ($file in $moduleFiles) {
    $content = Get-Content $file.FullName -Raw
    $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
    
    # Check if imports SecurityModule
    $hasSecurityModule = $content -match "SecurityModule"
    
    # Find corresponding service file
    $serviceFile = $file.FullName -replace "\.module\.ts$", ".service.ts"
    $hasPermissionService = $false
    
    if (Test-Path $serviceFile) {
        $serviceContent = Get-Content $serviceFile -Raw
        $hasPermissionService = $serviceContent -match "private readonly permissionService: PermissionService"
    }
    
    # Determine status
    $status = "✅ OK"
    if ($hasPermissionService -and -not $hasSecurityModule) {
        $status = "❌ MISSING SecurityModule"
    } elseif (-not $hasPermissionService -and $hasSecurityModule) {
        $status = "⚠️ Unnecessary import"
    } elseif ($hasPermissionService -and $hasSecurityModule) {
        $status = "✅ CORRECT"
    }
    
    $results += [PSCustomObject]@{
        Module = $file.Name
        Path = $relativePath
        HasSecurityModule = $hasSecurityModule
        HasPermissionService = $hasPermissionService
        Status = $status
    }
}

# Output results
Write-Host "`n=== Security Module Scan Results ===" -ForegroundColor Cyan
Write-Host "Total modules scanned: $($results.Count)`n" -ForegroundColor Yellow

# Critical issues
$critical = $results | Where-Object { $_.Status -eq "❌ MISSING SecurityModule" }
Write-Host "❌ CRITICAL: $($critical.Count) modules MISSING SecurityModule" -ForegroundColor Red
$critical | Format-Table Module, Path -AutoSize

# Correct implementations
$correct = $results | Where-Object { $_.Status -eq "✅ CORRECT" }
Write-Host "`n✅ CORRECT: $($correct.Count) modules properly configured" -ForegroundColor Green

# Unnecessary imports
$unnecessary = $results | Where-Object { $_.Status -eq "⚠️ Unnecessary import" }
if ($unnecessary.Count -gt 0) {
    Write-Host "`n⚠️ WARNING: $($unnecessary.Count) modules have unnecessary SecurityModule import" -ForegroundColor Yellow
    $unnecessary | Format-Table Module, Path -AutoSize
}

# Export to CSV for detailed analysis
$results | Export-Csv -Path "security-module-scan-results.csv" -NoTypeInformation
Write-Host "`nDetailed results exported to: security-module-scan-results.csv" -ForegroundColor Cyan
