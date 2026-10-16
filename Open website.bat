@echo off
title Nazih Talbi portfolio
cd /d "%~dp0"
start "" http://localhost:5173/
node tools\serve.js 5173
pause
