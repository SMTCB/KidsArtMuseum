@echo off
cd /d "%~dp0"
if not exist node_modules call npm install
node scripts/intake-server.js
pause
