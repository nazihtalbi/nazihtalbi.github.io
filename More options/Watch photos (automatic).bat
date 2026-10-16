@echo off
title Photography - automatic updates
cd /d "%~dp0.."
echo Builds the Photography section now, then keeps watching "Photography - put your photos here".
echo Every photo you add, replace or delete there is edited, signed and added to the site automatically.
echo Close this window to stop watching.
echo.
node tools\update-photos.js --watch
pause
