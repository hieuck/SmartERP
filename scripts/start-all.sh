#!/bin/bash

# SmartERP - One-Click Startup Script
# Chạy toàn bộ project: Database, Redis, Backend, Frontend

set -e

echo "🚀 SmartERP - Khởi động toàn bộ hệ thống..."
echo ""

# Kiểm tra Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker chưa được cài đặt"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose chưa được cài đặt"
    exit 1
fi

# Kiểm tra Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js chưa được cài đặt"
    exit 1
fi

echo "✅ Kiểm tra dependencies: OK"
echo ""

# Bước 1: Khởi động PostgreSQL và Redis
echo "📦 Bước 1: Khởi động PostgreSQL và Redis..."
docker-compose up -d postgres redis
echo "⏳ Chờ services khởi động..."
sleep 10
echo "✅ PostgreSQL và Redis đã chạy"
echo ""

# Bước 2: Khởi tạo database
echo "🗄️  Bước 2: Khởi tạo database..."
cd src/backend
npm run db:init 2>/dev/null || echo "⚠️  Database có thể đã tồn tại"
cd ../..
echo "✅ Database đã sẵn sàng"
echo ""

# Bước 3: Khởi động Backend
echo "🔧 Bước 3: Khởi động Backend (NestJS)..."
cd src/backend
npm run start:dev &
BACKEND_PID=$!
cd ../..
echo "✅ Backend đang chạy (PID: $BACKEND_PID)"
sleep 5
echo ""

# Bước 4: Khởi động Frontend
echo "🎨 Bước 4: Khởi động Frontend (React + Vite)..."
cd src/frontend
npm run dev &
FRONTEND_PID=$!
cd ../..
echo "✅ Frontend đang chạy (PID: $FRONTEND_PID)"
echo ""

# Thông tin truy cập
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 SmartERP đã khởi động thành công!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Truy cập:"
echo "   • Frontend:  http://localhost:5173"
echo "   • API:       http://localhost:3000"
echo "   • API Docs:  http://localhost:3000/api/docs"
echo "   • Database:  localhost:5432"
echo "   • Redis:     localhost:6379"
echo ""
echo "🛑 Để dừng toàn bộ:"
echo "   • Nhấn Ctrl+C trong terminal này"
echo "   • Hoặc chạy: docker-compose down"
echo ""
echo "📝 Logs:"
echo "   • Backend:   src/backend/logs/"
echo "   • Frontend:  Terminal này"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Chờ cho đến khi người dùng dừng
trap "echo ''; echo '🛑 Dừng SmartERP...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker-compose down; exit 0" SIGINT

wait
