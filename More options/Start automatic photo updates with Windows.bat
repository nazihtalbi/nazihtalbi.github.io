@echo off
cd /d "%~dp0.."
powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Startup')+'\Portfolio photo watcher.lnk'); $s.TargetPath='%~dp0Watch photos (automatic).bat'; $s.WorkingDirectory='%~dp0'; $s.WindowStyle=7; $s.Save()"
echo Done. The photo watcher now starts (minimised) every time you sign in to Windows.
echo To undo this, run "Stop automatic photo updates with Windows.bat".
pause
