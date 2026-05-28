@echo off
setlocal EnableDelayedExpansion
title UNKORA — Main Launcher
color 0A

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║             UNKORA  —  MAIN LAUNCHER             ║
echo  ║     API  :4000   +   Web  :3000  (2 windows)    ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: ════════════════════════════════════════════════════════
::  STEP 1 — Write .env files (safe to run every time)
:: ════════════════════════════════════════════════════════
echo  [1/5] Writing .env files...

(
echo DATABASE_URL=postgresql://unkora:unkora_secret_dev@localhost:15432/unkora
echo JWT_SECRET=dev-secret-local-unkora-min64chars-do-not-use-in-production-abc123
echo JWT_EXPIRES_IN=15m
echo JWT_REFRESH_SECRET=dev-refresh-local-unkora-min64chars-do-not-use-in-production-xyz789
echo JWT_REFRESH_EXPIRES_IN=7d
echo API_PORT=4000
echo API_PREFIX=api
echo NODE_ENV=development
echo CORS_ORIGINS=http://localhost:3000
) > apps\api\.env

(
echo NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
echo NEXT_PUBLIC_SITE_URL=http://localhost:3000
) > apps\web\.env.local

(
echo DATABASE_URL=postgresql://unkora:unkora_secret_dev@localhost:15432/unkora
) > packages\database\.env

echo  .env files written.

:: ════════════════════════════════════════════════════════
::  STEP 2 — Docker: start Postgres
:: ════════════════════════════════════════════════════════
echo.
echo  [2/5] Starting Docker Postgres...

docker info >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo  ╔════════════════════════════════════════════╗
  echo  ║  [ERROR]  Docker Desktop is NOT running!   ║
  echo  ║  Please start Docker Desktop and retry.    ║
  echo  ╚════════════════════════════════════════════╝
  echo.
  pause & exit /b 1
)

docker rm -f unkora_postgres_dev >nul 2>&1
docker-compose -f docker-compose.dev.yml up -d --remove-orphans
if %errorlevel% neq 0 (
  echo  [ERROR] docker-compose failed. See output above.
  pause & exit /b 1
)

echo  Waiting for Postgres to be ready...
set /a tries=0
:WAIT_PG
set /a tries+=1
docker exec unkora_postgres_dev pg_isready -U unkora -d unkora >nul 2>&1
if %errorlevel% neq 0 (
  if !tries! geq 30 (
    echo  [ERROR] Postgres not ready after 60s. Check Docker logs.
    pause & exit /b 1
  )
  timeout /t 2 /nobreak >nul
  goto WAIT_PG
)
echo  Postgres ready  (after !tries! checks^)

:: ════════════════════════════════════════════════════════
::  STEP 3 — Free ports 3000 / 4000
:: ════════════════════════════════════════════════════════
echo.
echo  [3/5] Freeing ports 3000 and 4000...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":4000 " ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo  Ports cleared.

:: ════════════════════════════════════════════════════════
::  STEP 4 — Prisma migrate + seed (quick check)
:: ════════════════════════════════════════════════════════
echo.
echo  [4/5] Applying Prisma migrations...
cd packages\database

call npx prisma migrate deploy >nul 2>&1
call npx prisma generate >nul 2>&1

:: Seed only if admin user doesn't exist
docker exec unkora_postgres_dev psql -U unkora -d unkora -c ^
  "SELECT 1 FROM users WHERE email='admin@unkora.com' LIMIT 1;" 2>nul | findstr "(1 row)" >nul
if %errorlevel% neq 0 (
  echo  First run — seeding database...
  call npx prisma db seed
) else (
  echo  Database already seeded — skipping.
)

cd ..\..
echo  Database ready.

:: ════════════════════════════════════════════════════════
::  STEP 5 — Launch API and Web in SEPARATE windows
:: ════════════════════════════════════════════════════════
echo.
echo  [5/5] Launching API and Web in separate windows...
echo.

:: ── API window ──────────────────────────────────────────
start "╔═ UNKORA API  :4000 ══════════════════╗" cmd /k ^
  "color 0B && echo. && echo  ╔══════════════════════════════════╗ && echo  ║   UNKORA  API  Server  :4000    ║ && echo  ╚══════════════════════════════════╝ && echo. && cd /d %~dp0apps\api && npm run dev"

timeout /t 2 /nobreak >nul

:: ── Web window ──────────────────────────────────────────
start "╔═ UNKORA WEB  :3000 ══════════════════╗" cmd /k ^
  "color 0E && echo. && echo  ╔══════════════════════════════════╗ && echo  ║   UNKORA  WEB  Server  :3000    ║ && echo  ╚══════════════════════════════════╝ && echo. && cd /d %~dp0apps\web && npm run dev"

:: ════════════════════════════════════════════════════════
::  Wait for API health, then open browser
:: ════════════════════════════════════════════════════════
echo  Waiting for API to compile (first run ~30-60s)...
set /a api_tries=0
:WAIT_API
set /a api_tries+=1
if !api_tries! geq 50 (
  echo  [WARN] API taking longer than usual — opening browser anyway.
  goto OPEN_BROWSER
)
timeout /t 3 /nobreak >nul
powershell -Command ^
  "try{Invoke-WebRequest -Uri 'http://localhost:4000/api/v1/health' -UseBasicParsing -TimeoutSec 2|Out-Null;exit 0}catch{exit 1}" >nul 2>&1
if %errorlevel% neq 0 goto WAIT_API
echo  API is healthy!

echo  Waiting for Web to compile...
set /a web_tries=0
:WAIT_WEB
set /a web_tries+=1
if !web_tries! geq 30 (
  echo  [INFO] Web taking long — opening browser anyway...
  goto OPEN_BROWSER
)
timeout /t 3 /nobreak >nul
powershell -Command ^
  "try{Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2|Out-Null;exit 0}catch{exit 1}" >nul 2>&1
if %errorlevel% neq 0 goto WAIT_WEB

:OPEN_BROWSER
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║                 UNKORA IS LIVE!                      ║
echo  ║                                                      ║
echo  ║   Shop    →   http://localhost:3000                  ║
echo  ║   Admin   →   http://localhost:3000/admin            ║
echo  ║   API     →   http://localhost:4000/api/v1           ║
echo  ║   Seller  →   http://localhost:3000/seller/login     ║
echo  ║                                                      ║
echo  ║   Login:  admin@unkora.com  /  Admin@123456          ║
echo  ║                                                      ║
echo  ║   Two windows running:                               ║
echo  ║     • UNKORA API  :4000  (blue window)               ║
echo  ║     • UNKORA WEB  :3000  (yellow window)             ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

timeout /t 2 /nobreak >nul
start http://localhost:3000/admin

echo  Press any key to close this launcher window...
echo  (API and Web windows will keep running)
echo.
pause
