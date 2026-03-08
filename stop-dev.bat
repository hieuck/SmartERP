@echo off
REM SmartERP Development Environment - Stop Script
REM This script stops Docker services

echo ========================================
echo Stopping SmartERP Development Environment
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Docker is not running.
    echo Services may already be stopped.
    pause
    exit /b 0
)

echo [1/2] Stopping Docker services...
cd config\docker
docker-compose -f docker-compose.dev.yml down
if %errorlevel% neq 0 (
    echo [ERROR] Failed to stop Docker services!
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo.
echo [2/2] Cleanup complete.
echo.
echo ========================================
echo All services stopped successfully!
echo ========================================
echo.
pause
