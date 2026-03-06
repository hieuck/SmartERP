@echo off
REM SmartERP Status Check Script

echo ========================================
echo SmartERP - Status Check
echo ========================================
echo.

REM Check Backend
echo Checking Backend (http://localhost:3000)...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Backend is running
) else (
    echo [X] Backend is not running
)
echo.

REM Check Frontend
echo Checking Frontend (http://localhost:5173)...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Frontend is running
) else (
    echo [X] Frontend is not running
)
echo.

REM Check PostgreSQL
echo Checking PostgreSQL (port 5432)...
netstat -an | findstr ":5432" >nul 2>&1
if %errorlevel%==0 (
    echo [OK] PostgreSQL is listening on port 5432
) else (
    echo [X] PostgreSQL is not running
)
echo.

echo ========================================
echo Status check completed
echo ========================================
pause
