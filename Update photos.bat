@echo off
title Update the Photography section
cd /d "%~dp0"
echo Updating the Photography section from "Photography - put your photos here"...
echo.
node tools\update-photos.js
echo.
pause
