@echo off
REM SmartERP Local Development Startup Script

echo ========================================
echo SmartERP - Local Development Startup
echo ========================================
echo.

REM Set paths
set RUNTIME_NODE=%~dp0runtime\nodejs
set BACKEND_DIR=%~dp0backend\monolith-app
set FRONTEND_DIR=%~dp0frontend

REM Check runtime Node.js
if not exist "%RUNTIME_NODE%\node.exe" (
    echo [ERROR] Runtime Node.js not found
    echo Please ensure runtime/nodejs folder exists
    pause
    exit /b 1
)

echo [OK] Runtime Node.js found
echo.

REM Display menu
echo Select startup mode:
echo 1. Start Backend only
echo 2. Start Frontend only
echo 3. Start Both (Backend + Frontend)
echo 4. Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto start_backend
if "%choice%"=="2" goto start_frontend
if "%choice%"=="3" goto start_both
if "%choice%"=="4" goto end

:start_backend
echo.
echo ========================================
echo Starting Backend...
echo ========================================
cd "%BACKEND_DIR%"

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing backend dependencies...
    "%RUNTIME_NODE%\npm.cmd" install
)

echo Starting backend server...
echo Backend will run at: http://localhost:3000
echo API Docs: http://localhost:3000/api/docs
echo.
start "SmartERP Backend" "%RUNTIME_NODE%\npm.cmd" run start:dev
echo [OK] Backend started in new window
pause
goto end

:start_frontend
echo.
echo ========================================
echo Starting Frontend...
echo ========================================
cd "%FRONTEND_DIR%"

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    "%RUNTIME_NODE%\npm.cmd" install
)

echo Starting frontend server...
echo Frontend will run at: http://localhost:5173
echo.
start "SmartERP Frontend" "%RUNTIME_NODE%\npm.cmd" run dev
echo [OK] Frontend started in new window
pause
goto end

:start_both
echo.
echo ========================================
echo Starting Backend + Frontend...
echo ========================================

REM Start Backend
cd "%BACKEND_DIR%"
if not exist "node_modules" (
    echo [INFO] Installing backend dependencies...
    "%RUNTIME_NODE%\npm.cmd" install
)
echo Starting backend server...
start "SmartERP Backend" "%RUNTIME_NODE%\npm.cmd" run start:dev
timeout /t 3 /nobreak >nul

REM Start Frontend
cd "%FRONTEND_DIR%"
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    "%RUNTIME_NODE%\npm.cmd" install
)
echo Starting frontend server...
start "SmartERP Frontend" "%RUNTIME_NODE%\npm.cmd" run dev

echo.
echo [OK] Both services started
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:3000/api/docs
pause
goto end

:end
echo.
echo ========================================
echo Startup script completed
echo ========================================
