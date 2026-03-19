@echo off
node "%~dp0run-playwright.cjs" test --ui --ui-host 127.0.0.1 --ui-port 9323 %*
