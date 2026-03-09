# SecurityModule Import Fixer
# Automatically fixes SecurityModule import issues across the codebase

param(
    [string]$Path = "src",
    [switch]$DryRun
)

$files = Get-ChildItem -Path $Path -Recurse -Include "*.spec.ts"
$fixCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    # Fix 1: Add SecurityModule to imports if missing
    if ($content -match "TestingModule\.createTestingModule" -and 
        $content -notmatch "SecurityModule") {
        $content = $content -replace "(imports:\s*\[)", "`$1`n      SecurityModule,"
        $modified = $true
    }
    
    # Fix 2: Fix PermissionService mock
    if ($content -match "PermissionService" -and 
        $content -notmatch "canRead.*jest\.fn") {
        $mockTemplate = @"
      {
        provide: PermissionService,
        useValue: {
          canRead: jest.fn().mockResolvedValue(true),
          canWrite: jest.fn().mockResolvedValue(true),
          canDelete: jest.fn().mockResolvedValue(true),
        },
      },
"@
        $content = $content -replace "PermissionService,", $mockTemplate
        $modified = $true
    }
    
    if ($modified) {
        if (-not $DryRun) {
            Set-Content $file.FullName $content -NoNewline
            Write-Host "✅ Fixed: $($file.Name)" -ForegroundColor Green
        } else {
            Write-Host "🔍 Would fix: $($file.Name)" -ForegroundColor Yellow
        }
        $fixCount++
    }
}

Write-Host "`n📊 Summary: $fixCount files " -NoNewline
Write-Host $(if ($DryRun) { "would be fixed" } else { "fixed" }) -ForegroundColor Cyan
