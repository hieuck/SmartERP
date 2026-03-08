@echo off
REM SmartERP Development Environment - Start Script
REM This script starts Docker services and the development server

echo ========================================
echo SmartERP Development Environment
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/4] Starting Docker services (PostgreSQL + Redis)...
cd config\docker
docker-compose -f docker-compose.dev.yml up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker services!
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo.
echo [2/4] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo [3/4] Installing dependencies (if needed)...
cd src\backend
if not exist "node_modules\" (
    echo Installing backend dependencies...
    call npm install
)
cd ..\..

echo.
echo [4/4] Starting development server...
echo.
echo ========================================
echo Development server starting...
echo Backend: http://localhost:3000
echo API Docs: http://localhost:3000/api/docs
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

cd src\backend
call npm run start:dev

REM If server stops, ask user if they want to stop Docker
cd ..\..
echo.
echo Development server stopped.
choice /C YN /M "Do you want to stop Docker services"
if %errorlevel% equ 1 (
    call stop-dev.bat
)
