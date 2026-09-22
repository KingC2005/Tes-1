@echo off
chcp 65001 > nul
echo ========================================================
echo       ساخت فایل نصبی EXE حسابداری ناهار با Electron
echo ========================================================
echo.

echo 1. در حال نصب بسته‌ها (npm install)...
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo [خطا] نصب بسته‌ها ناموفق بود!
    pause
    exit /b %errorlevel%
)

echo.
echo 2. در حال بیلد پروژه فرانت‌اند (Vite - حالت دسکتاپ)...
call npm run build:desktop
if %errorlevel% neq 0 (
    echo [خطا] مرحله بیلد ناموفق بود!
    pause
    exit /b %errorlevel%
)

echo.
echo 3. در حال تولید فایل Setup و Portable EXE برای ویندوز...
call npx electron-builder --win --publish never
if %errorlevel% neq 0 (
    echo [خطا] تولید فایل EXE ناموفق بود!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo [تبریک!] فایل نصبی و نسخه پرتابل EXE در پوشه release ساخته شد.
echo ========================================================
if exist release explorer release
pause
