@echo off
setlocal EnableDelayedExpansion
title UNKORA Local Dev
color 0A

echo.
echo  ============================================
echo    UNKORA Local Dev  --  START
echo  ============================================
echo.

:: ─────────────────────────────────────────────
::  1. Write .env files
:: ─────────────────────────────────────────────
echo [1/3] Writing .env files...

(
echo DATABASE_URL=postgresql://unkora:unkora_secret_dev@localhost:5432/unkora
echo REDIS_URL=redis://localhost:6379
echo NODE_ENV=development
echo API_PORT=4000
echo API_PREFIX=api
echo JWT_SECRET=dev-secret-local-unkora-min64chars-do-not-use-in-production-abc123
echo JWT_REFRESH_SECRET=dev-refresh-local-unkora-min64chars-do-not-use-in-production-xyz789
echo JWT_EXPIRES_IN=15m
echo JWT_REFRESH_EXPIRES_IN=7d
echo CORS_ORIGINS=http://localhost:3000
) > apps\api\.env

(
echo NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
echo NEXT_PUBLIC_SITE_URL=http://localhost:3000
) > apps\web\.env.local

(
echo DATABASE_URL=postgresql://unkora:unkora_secret_dev@localhost:5432/unkora
) > packages\database\.env

echo     .env files ready!

:: ─────────────────────────────────────────────
::  2. Kill old processes on port 3000 / 4000
:: ─────────────────────────────────────────────
echo [2/3] Freeing ports 3000 and 4000...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":4000 " ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: ─────────────────────────────────────────────
::  3. Start API + Web in separate windows
:: ─────────────────────────────────────────────
echo [3/3] Starting API and Web servers...
echo.

start "UNKORA — API :4000" cmd /k "cd /d %~dp0apps\api && npm run dev"
timeout /t 3 /nobreak >nul
start "UNKORA — Web :3000" cmd /k "cd /d %~dp0apps\web && npm run dev"

echo.
echo  ============================================
echo    Two windows opened:
echo.
echo    API  -->  http://localhost:4000/api/v1
echo    Web  -->  http://localhost:3000
echo    Admin -> http://localhost:3000/admin
echo  ============================================
echo.
echo  API compile hote ~30s lagbe...
echo  Web compile hote ~15s lagbe...
echo.
pause
