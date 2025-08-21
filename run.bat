@echo off
REM change to the script's directory
cd /d "%~dp0"

REM install dependencies
npm i
IF ERRORLEVEL 1 (
  echo npm install failed
  pause
  exit /b 1
)

REM run the app
node index.js
