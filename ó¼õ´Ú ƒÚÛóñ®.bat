@echo off
title متجر ريشة فن 🚀
echo ====================================
echo   متجر ريشة فن - تشغيل 🚀
echo ====================================
echo.
cd /d "%~dp0"
echo جاري تشغيل الخادم...
start "" http://localhost:5000
cd backend
node server.js
pause
