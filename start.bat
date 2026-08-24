@echo off
chcp 65001 > nul
echo ========================================================
echo   Chess Learning App - Production Server Launcher
echo ========================================================
echo.
echo [1/2] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed! Please check error output above.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Starting Vite preview server (Host: 0.0.0.0, Port: 4173)...
echo Available for local and Tailscale access. Press Ctrl+C to stop.
echo.
call npx vite preview --host 0.0.0.0 --port 4173

pause

