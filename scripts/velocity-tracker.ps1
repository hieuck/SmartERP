# Velocity Tracker
# Tracks story points completed per day

param(
    [string]$Action = "log", # log, report, reset
    [int]$Points = 0,
    [string]$Task = ""
)

$dataFile = ".velocity-data.json"

function Initialize-Data {
    if (-not (Test-Path $dataFile)) {
        @{
            startDate = (Get-Date).ToString("yyyy-MM-dd")
            days = @()
        } | ConvertTo-Json | Set-Content $dataFile
    }
}

function Get-VelocityData {
    Initialize-Data
    Get-Content $dataFile | ConvertFrom-Json
}

function Save-VelocityData($data) {
    $data | ConvertTo-Json -Depth 10 | Set-Content $dataFile
}

function Log-Points {
    param($Points, $Task)
    
    $data = Get-VelocityData
    $today = (Get-Date).ToString("yyyy-MM-dd")
    
    $dayEntry = $data.days | Where-Object { $_.date -eq $today }
    if (-not $dayEntry) {
        $dayEntry = @{
            date = $today
            points = 0
            tasks = @()
        }
        $data.days += $dayEntry
    }
    
    $dayEntry.points += $Points
    $dayEntry.tasks += @{
        task = $Task
        points = $Points
        time = (Get-Date).ToString("HH:mm")
    }
    
    Save-VelocityData $data
    Write-Host "✅ Logged: $Points points for '$Task'" -ForegroundColor Green
}

function Show-Report {
    $data = Get-VelocityData
    
    Write-Host "`n📊 VELOCITY REPORT" -ForegroundColor Cyan
    Write-Host "==================`n" -ForegroundColor Cyan
    
    $totalPoints = 0
    $totalDays = $data.days.Count
    
    foreach ($day in $data.days) {
        Write-Host "📅 $($day.date): $($day.points) points" -ForegroundColor Yellow
        foreach ($task in $day.tasks) {
            Write-Host "   [$($task.time)] $($task.task) (+$($task.points))" -ForegroundColor Gray
        }
        $totalPoints += $day.points
    }
    
    $avgVelocity = if ($totalDays -gt 0) { [math]::Round($totalPoints / $totalDays, 1) } else { 0 }
    
    Write-Host "`n📈 METRICS:" -ForegroundColor Cyan
    Write-Host "   Total Points: $totalPoints" -ForegroundColor White
    Write-Host "   Total Days: $totalDays" -ForegroundColor White
    Write-Host "   Avg Velocity: $avgVelocity points/day" -ForegroundColor White
    
    # Velocity rating
    $rating = switch ($avgVelocity) {
        { $_ -ge 10 } { "🔥 EXCELLENT (10/10)" }
        { $_ -ge 8 } { "✅ GREAT (8-9/10)" }
        { $_ -ge 6 } { "⚠️ GOOD (6-7/10)" }
        default { "❌ NEEDS IMPROVEMENT (<6/10)" }
    }
    Write-Host "   Rating: $rating`n" -ForegroundColor $(if ($avgVelocity -ge 8) { "Green" } else { "Yellow" })
}

function Reset-Data {
    Remove-Item $dataFile -ErrorAction SilentlyContinue
    Write-Host "🔄 Velocity data reset" -ForegroundColor Yellow
}

# Main
switch ($Action) {
    "log" {
        if ($Points -eq 0 -or $Task -eq "") {
            Write-Host "❌ Usage: .\velocity-tracker.ps1 -Action log -Points 3 -Task 'Fixed security imports'" -ForegroundColor Red
            exit 1
        }
        Log-Points -Points $Points -Task $Task
    }
    "report" {
        Show-Report
    }
    "reset" {
        Reset-Data
    }
    default {
        Write-Host "❌ Invalid action. Use: log, report, reset" -ForegroundColor Red
    }
}
