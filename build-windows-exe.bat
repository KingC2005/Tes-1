@echo off
chcp 65001 > nul
echo ========================================================
echo       ساخت فایل نصبی EXE حسابداری ناهار با Electron
echo ========================================================
echo.

echo 1. در حال بیلد پروژه فرانت‌اند (Vite)...
call npm run build
if %errorlevel% neq 0 (
    echo [خطا] مرحله بیلد ناموفق بود!
    pause
    exit /b %errorlevel%
)

echo.
echo 2. در حال نصب بسته‌های Electron و Builder...
call npm install --save-dev electron electron-builder
if %errorlevel% neq 0 (
    echo [خطا] نصب الکترون ناموفق بود!
    pause
    exit /b %errorlevel%
)

echo.
echo 3. در حال تولید فایل Setup EXE برای ویندوز...
call npx electron-builder --win nsis --config.directories.output=release
if %errorlevel% neq 0 (
    echo [خطا] تولید فایل EXE ناموفق بود!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo [تبریک!] فایل نصبی EXE در پوشه release با موفقیت ساخته شد.
echo ========================================================
if exist release explorer release
pause
