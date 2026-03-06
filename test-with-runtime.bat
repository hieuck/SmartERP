@echo off
REM Quick test script using portable runtime
REM Run backend tests with portable Node.js

echo ========================================
echo SmartERP - Running Tests with Runtime
echo ========================================
echo.

REM Set paths
set RUNTIME_NODE=%~dp0runtime\nodejs
set BACKEND_DIR=%~dp0backend\monolith-app

REM Check runtime exists
if not exist "%RUNTIME_NODE%\node.exe" (
    echo ERROR: Runtime Node.js not found at: %RUNTIME_NODE%
    echo Please ensure runtime/nodejs folder exists
    pause
    exit /b 1
)

echo [OK] Using runtime Node.js: %RUNTIME_NODE%
echo.

REM Show version
echo Node.js version:
"%RUNTIME_NODE%\node.exe" --version
echo.

REM Run tests
echo Running backend tests...
echo.
cd "%BACKEND_DIR%"
"%RUNTIME_NODE%\npm.cmd" run test:cov

echo.
echo ========================================
echo Tests Complete!
echo ========================================
pause
