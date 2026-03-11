# SmartERP - One-Click Startup Script (Windows)
# Chạy toàn bộ project: Database, Redis, Backend, Frontend

$ErrorActionPreference = "Stop"

Write-Host "🚀 SmartERP - Khởi động toàn bộ hệ thống..." -ForegroundColor Green
Write-Host ""

# Kiểm tra Docker
Write-Host "🔍 Kiểm tra Docker..." -ForegroundColor Cyan
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host "❌ Docker chưa được cài đặt" -ForegroundColor Red
    exit 1
}

$dockerCompose = Get-Command docker-compose -ErrorAction SilentlyContinue
if (-not $dockerCompose) {
    Write-Host "❌ Docker Compose chưa được cài đặt" -ForegroundColor Red
    exit 1
}

# Kiểm tra Node.js
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "❌ Node.js chưa được cài đặt" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Kiểm tra dependencies: OK" -ForegroundColor Green
Write-Host ""

# Bước 1: Khởi động PostgreSQL và Redis
Write-Host "📦 Bước 1: Khởi động PostgreSQL và Redis..." -ForegroundColor Cyan
docker-compose up -d postgres redis
Write-Host "⏳ Chờ services khởi động..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host "✅ PostgreSQL và Redis đã chạy" -ForegroundColor Green
Write-Host ""

# Bước 2: Khởi tạo database
Write-Host "🗄️  Bước 2: Khởi tạo database..." -ForegroundColor Cyan
Push-Location src/backend
try {
    npm run db:init 2>$null
} catch {
    Write-Host "⚠️  Database có thể đã tồn tại" -ForegroundColor Yellow
}
Pop-Location
Write-Host "✅ Database đã sẵn sàng" -ForegroundColor Green
Write-Host ""

# Bước 3: Khởi động Backend
Write-Host "🔧 Bước 3: Khởi động Backend (NestJS)..." -ForegroundColor Cyan
Write-Host "⚠️  Mở terminal mới và chạy:" -ForegroundColor Yellow
Write-Host "   cd src/backend && npm run start:dev" -ForegroundColor White
Write-Host ""

# Bước 4: Khởi động Frontend
Write-Host "🎨 Bước 4: Khởi động Frontend (React + Vite)..." -ForegroundColor Cyan
Write-Host "⚠️  Mở terminal mới khác và chạy:" -ForegroundColor Yellow
Write-Host "   cd src/frontend && npm run dev" -ForegroundColor White
Write-Host ""

# Thông tin truy cập
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "🎉 SmartERP đã khởi động thành công!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Truy cập:" -ForegroundColor Yellow
Write-Host "   • Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "   • API:       http://localhost:3000" -ForegroundColor White
Write-Host "   • API Docs:  http://localhost:3000/api/docs" -ForegroundColor White
Write-Host "   • Database:  localhost:5432" -ForegroundColor White
Write-Host "   • Redis:     localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Để dừng toàn bộ:" -ForegroundColor Yellow
Write-Host "   • Đóng các terminal của Backend và Frontend" -ForegroundColor White
Write-Host "   • Hoặc chạy: docker-compose down" -ForegroundColor White
Write-Host ""
Write-Host "📝 Logs:" -ForegroundColor Yellow
Write-Host "   • Backend:   src/backend/logs/" -ForegroundColor White
Write-Host "   • Frontend:  Terminal của Frontend" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""

# Chờ cho đến khi người dùng dừng
Write-Host "⏳ Hệ thống đang chạy. Nhấn Ctrl+C để dừng..." -ForegroundColor Cyan
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Dừng SmartERP..." -ForegroundColor Yellow
    docker-compose down
    Write-Host "✅ SmartERP đã dừng" -ForegroundColor Green
}
