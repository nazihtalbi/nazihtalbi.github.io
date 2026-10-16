@echo off
title Update the website
cd /d "%~dp0"
echo 1/3  Photos...
node tools\update-photos.js
echo.
echo 2/3  Videos...
node tools\update-videos.js
echo.
echo 3/3  Language pages for Google...
node tools\build-pages.js
echo.
echo Done. Open the website with "Open website.bat" to check.
pause
