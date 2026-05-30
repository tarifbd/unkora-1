@echo off
setlocal EnableDelayedExpansion
title UNKORA Dev Startup
color 0A

echo.
echo  ============================================
echo    UNKORA Local Dev  --  START
echo  ============================================
echo.

:: ═══════════════════════════════════════════════════════════════
::  1.  WRITE .env FILES  (safe to run every time)
:: ═══════════════════════════════════════════════════════════════

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

echo [1/6] .env files written

:: ═══════════════════════════════════════════════════════════════
::  2.  DOCKER  —  start Postgres (keep existing data)
:: ═══════════════════════════════════════════════════════════════

echo.
echo [2/6] Starting Docker Postgres...

docker info >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo  [ERROR] Docker Desktop is not running!
  echo  Please start Docker Desktop and try again.
  echo.
  pause
  exit /b 1
)

:: Remove only stale *stopped* containers — volume stays intact (data preserved)
docker rm -f unkora_postgres_dev >nul 2>&1

docker-compose -f docker-compose.dev.yml up -d --remove-orphans
if %errorlevel% neq 0 (
  echo  [ERROR] docker-compose failed. Check output above.
  pause
  exit /b 1
)

:: Wait for Postgres health check
set /a tries=0
:WAIT_PG
set /a tries+=1
docker exec unkora_postgres_dev pg_isready -U unkora -d unkora >nul 2>&1
if %errorlevel% neq 0 (
  if !tries! geq 30 (
    echo  [ERROR] Postgres did not become ready after 60s. Check Docker logs.
    pause
    exit /b 1
  )
  timeout /t 2 /nobreak >nul
  goto WAIT_PG
)
echo [2/6] Postgres ready  (after !tries! checks^)

:: ═══════════════════════════════════════════════════════════════
::  3.  KILL old Node processes FIRST (frees DLL lock for prisma generate)
:: ═══════════════════════════════════════════════════════════════

echo.
echo [3/6] Stopping old API/Web processes (frees file locks)...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":4000 " ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)
:: Also kill any node processes holding the Prisma DLL
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: ═══════════════════════════════════════════════════════════════
::  4.  npm install  (only when node_modules is missing)
:: ═══════════════════════════════════════════════════════════════

echo.
if not exist node_modules (
  echo [4a] node_modules missing — installing dependencies...
  call npm install
  if %errorlevel% neq 0 (
    echo  [ERROR] npm install failed.
    pause
    exit /b 1
  )
) else (
  echo [4a] node_modules present — skipping npm install
)

:: ═══════════════════════════════════════════════════════════════
::  5.  PRISMA  — migrate + generate + seed
:: ═══════════════════════════════════════════════════════════════

echo.
echo [5/6] Running Prisma migrate + generate + seed...
cd packages\database
call npx prisma generate
call npx prisma db push --accept-data-loss
if %errorlevel% neq 0 (
  echo  [ERROR] DB schema sync failed — try FRESH-START.bat to wipe and rebuild.
  cd ..\..
  pause
  exit /b 1
)
if %errorlevel% neq 0 (
  echo  [ERROR] Prisma generate failed.
  cd ..\..
  pause
  exit /b 1
)

:: Seed only if admin user doesn't exist yet
docker exec unkora_postgres_dev psql -U unkora -d unkora -c "SELECT 1 FROM users WHERE email='admin@unkora.com' LIMIT 1;" 2>nul | findstr "(1 row)" >nul
if %errorlevel% neq 0 (
  echo Seeding database for the first time...
  call npx prisma db seed
) else (
  echo  (seed skipped — admin user already exists^)
)

cd ..\..
echo [5/6] Database ready

:: ═══════════════════════════════════════════════════════════════
::  6.  START API + WEB
:: ═══════════════════════════════════════════════════════════════

echo.
echo [6/6] Starting API server...
start "UNKORA — API :4000" cmd /k "cd /d %~dp0apps\api && npm run dev"

echo  Waiting for API health check (first compile can take ~30-60s)...
set /a api_tries=0
:WAIT_API
set /a api_tries+=1
if !api_tries! geq 40 (
  echo  [ERROR] API didn't respond after 120s. Check the API window for errors.
  pause
  exit /b 1
)
timeout /t 3 /nobreak >nul
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:4000/api/v1/health' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 goto WAIT_API
echo  API is healthy!

echo.
echo [6/6] Starting Web server...
start "UNKORA — Web :3000" cmd /k "cd /d %~dp0apps\web && npm run dev"

echo  Waiting for Web to compile...
set /a web_tries=0
:WAIT_WEB
set /a web_tries+=1
if !web_tries! geq 30 (
  echo  [WARN] Web is taking long — opening browser anyway...
  goto OPEN
)
timeout /t 3 /nobreak >nul
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 goto WAIT_WEB

:OPEN
echo.
echo  ============================================
echo    UNKORA is LIVE!
echo.
echo    Shop   --  http://localhost:3000
echo    Admin  --  http://localhost:3000/admin
echo    API    --  http://localhost:4000/api/v1
echo.
echo    admin@unkora.com  /  Admin@123456
echo  ============================================
echo.

timeout /t 3 /nobreak >nul
start http://localhost:3000/admin
