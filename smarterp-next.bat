@echo off
setlocal ENABLEEXTENSIONS

set "ROOT=%~dp0"
cd /d "%ROOT%"

if "%~1"=="" goto :oneclick

set "COMMAND=%~1"

if /I "%COMMAND%"=="start" goto :start
if /I "%COMMAND%"=="stop" goto :stop
if /I "%COMMAND%"=="restart" goto :restart
if /I "%COMMAND%"=="status" goto :status
if /I "%COMMAND%"=="typecheck" goto :typecheck
if /I "%COMMAND%"=="build" goto :build
if /I "%COMMAND%"=="smoke" goto :smoke
if /I "%COMMAND%"=="gate" goto :gate
if /I "%COMMAND%"=="logs" goto :logs
if /I "%COMMAND%"=="open" goto :open
if /I "%COMMAND%"=="help" goto :help

echo [SmartERP Next] Unknown command: %COMMAND%
echo.
goto :help

:start
echo [SmartERP Next] Starting API and web runtime...
call npm.cmd run runtime:next:start
if errorlevel 1 exit /b 1
echo [SmartERP Next] Runtime started.
goto :end

:oneclick
call :start
if errorlevel 1 exit /b 1
call :open
if errorlevel 1 exit /b 1
goto :end

:stop
echo [SmartERP Next] Stopping API and web runtime...
call npm.cmd run runtime:next:stop
if errorlevel 1 exit /b 1
echo [SmartERP Next] Runtime stopped.
goto :end

:restart
call :stop
if errorlevel 1 exit /b 1
call :start
if errorlevel 1 exit /b 1
goto :end

:status
echo [SmartERP Next] Checking runtime status...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$targets = @(@{ Name = 'Web'; Url = 'http://127.0.0.1:3000' }, @{ Name = 'API'; Url = 'http://127.0.0.1:4000/api/health' });" ^
  "foreach ($target in $targets) {" ^
  "  try {" ^
  "    $response = Invoke-WebRequest -Uri $target.Url -UseBasicParsing -TimeoutSec 5;" ^
  "    Write-Host ('  {0}: UP ({1})' -f $target.Name, $response.StatusCode);" ^
  "  } catch {" ^
  "    Write-Host ('  {0}: DOWN' -f $target.Name);" ^
  "  }" ^
  "}"
goto :end

:typecheck
echo [SmartERP Next] Running type-check...
call npm.cmd run type-check:next
if errorlevel 1 exit /b 1
goto :end

:build
echo [SmartERP Next] Running build...
call npm.cmd run build:next
if errorlevel 1 exit /b 1
goto :end

:smoke
echo [SmartERP Next] Running Playwright smoke...
call npm.cmd run runtime:next:smoke
if errorlevel 1 exit /b 1
goto :end

:gate
call :typecheck
if errorlevel 1 exit /b 1
call :build
if errorlevel 1 exit /b 1
call :smoke
if errorlevel 1 exit /b 1
echo [SmartERP Next] Gate passed.
goto :end

:logs
echo [SmartERP Next] Opening runtime log folder...
start "" explorer "%ROOT%output\playwright"
goto :end

:open
echo [SmartERP Next] Opening web app...
start "" "http://127.0.0.1:3000"
goto :end

:help
echo SmartERP Next Batch Runner
echo.
echo Usage:
echo   smarterp-next.bat
echo   smarterp-next.bat start
echo   smarterp-next.bat stop
echo   smarterp-next.bat restart
echo   smarterp-next.bat status
echo   smarterp-next.bat typecheck
echo   smarterp-next.bat build
echo   smarterp-next.bat smoke
echo   smarterp-next.bat gate
echo   smarterp-next.bat logs
echo   smarterp-next.bat open
echo   smarterp-next.bat help
echo.
echo Notes:
echo   no argument: start runtime and open the web app
echo   start    : boots API ^+ web in background
echo   smoke    : runs Playwright runtime smoke and stops services after the run
echo   gate     : type-check ^+ build ^+ Playwright smoke
goto :end

:end
endlocal
