@echo off
title Update the website
cd /d "%~dp0"
echo 1/2  Photos...
node tools\update-photos.js
echo.
echo 2/2  Videos...
node tools\update-videos.js
echo.
echo Done. Open the website with "Open website.bat" to check.
pause
