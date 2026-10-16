@echo off
title Update the Films and Reels
cd /d "%~dp0"
echo Updating Films and Reels from "Videos - put your videos here"...
echo.
node tools\update-videos.js
echo.
pause
