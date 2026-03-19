@echo off
node "%~dp0run-playwright.cjs" test --headed --project=chromium %*
