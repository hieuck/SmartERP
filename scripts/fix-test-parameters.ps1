# Test Parameter Order Fixer
# Fixes parameter order in SecureRepository method calls

param(
    [string]$Path = "src",
    [switch]$DryRun
)

$patterns = @{
    # find(entity, options) -> find(options)
    'find\s*\(\s*\w+Entity\s*,\s*(\{[^}]+\})\s*\)' = 'find($1)'
    
    # findOne(entity, options) -> findOne(options)
    'findOne\s*\(\s*\w+Entity\s*,\s*(\{[^}]+\})\s*\)' = 'findOne($1)'
    
    # save(entity, data) -> save(data)
    'save\s*\(\s*\w+Entity\s*,\s*(\w+)\s*\)' = 'save($1)'
    
    # remove(entity, data) -> remove(data)
    'remove\s*\(\s*\w+Entity\s*,\s*(\w+)\s*\)' = 'remove($1)'
}

$files = Get-ChildItem -Path $Path -Recurse -Include "*.spec.ts", "*.service.ts"
$fixCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    foreach ($pattern in $patterns.GetEnumerator()) {
        if ($content -match $pattern.Key) {
            $content = $content -replace $pattern.Key, $pattern.Value
            $modified = $true
        }
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
