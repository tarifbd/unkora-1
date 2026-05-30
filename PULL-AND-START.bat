@echo off
setlocal EnableDelayedExpansion
title UNKORA — Pull Latest + Start
color 0A

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║           UNKORA  —  Pull Latest Code + Start            ║
echo  ║   Git pull  ^|  npm install  ^|  DB migrate  ^|  Launch     ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: ════════════════════════════════════════════════════════════════
::  SETTINGS  — change these if needed
:: ════════════════════════════════════════════════════════════════
set TARGET_BRANCH=claude/read-markdown-file-VlQiI
set GIT_EMAIL=khadimul.bs23@gmail.com
set GIT_NAME=kmkhasan

:: ════════════════════════════════════════════════════════════════
::  STEP 1 — Configure git user
:: ════════════════════════════════════════════════════════════════
echo  [1/8] Configuring git user...
git config user.email "%GIT_EMAIL%"
git config user.name  "%GIT_NAME%"
echo        Email : %GIT_EMAIL%
echo.

:: ════════════════════════════════════════════════════════════════
::  STEP 2 — Switch to correct branch + pull
:: ════════════════════════════════════════════════════════════════
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set CURRENT_BRANCH=%%b

echo  [2/8] Branch: !CURRENT_BRANCH! → !TARGET_BRANCH!

:: Stash local changes if any
for /f %%c in ('git status --porcelain 2^>nul ^| find /c /v ""') do set DIRTY=%%c
if not defined DIRTY set DIRTY=0
if !DIRTY! gtr 0 (
  echo        Local changes detected — stashing...
  git stash push -m "auto-stash %date% %time%" >nul 2>&1
)

:: Fetch all branches
git fetch origin >nul 2>&1

:: Force checkout target branch (handles untracked files too)
git checkout -f !TARGET_BRANCH! >nul 2>&1
if !errorlevel! neq 0 (
  git checkout -b !TARGET_BRANCH! --track origin/!TARGET_BRANCH! >nul 2>&1
  if !errorlevel! neq 0 (
    echo.
    echo  [ERROR] Cannot switch to branch: !TARGET_BRANCH!
    echo         Run this first:
    echo           git fetch origin
    echo           git checkout -f !TARGET_BRANCH!
    pause & exit /b 1
  )
)

:: Pull latest
git pull origin !TARGET_BRANCH!
if !errorlevel! neq 0 (
  echo.
  echo  [ERROR] git pull failed! Check internet connection.
  pause & exit /b 1
)
echo        Latest code downloaded!
echo.

:: ════════════════════════════════════════════════════════════════
::  STEP 3 — Write .env files
:: ════════════════════════════════════════════════════════════════
echo  [3/8] Writing .env files...

(
echo DATABASE_URL=postgresql://unkora:unkora_secret_dev@localhost:15432/unkora
echo REDIS_URL=redis://localhost:6379
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
echo JWT_SECRET=dev-secret-local-unkora-min64chars-do-not-use-in-production-abc123
) > apps\web\.env.local

(
echo DATABASE_URL=postgresql://unkora:unkora_secret_dev@localhost:15432/unkora
) > packages\database\.env

echo        .env files written.
echo.

:: ════════════════════════════════════════════════════════════════
::  STEP 4 — npm install
:: ════════════════════════════════════════════════════════════════
echo  [4/8] Installing npm dependencies...
call npm install
if !errorlevel! neq 0 (
  echo  [ERROR] npm install failed! Check internet connection.
  pause & exit /b 1
)
echo        Done.
echo.

:: ════════════════════════════════════════════════════════════════
::  STEP 5 — Start Docker Postgres
:: ════════════════════════════════════════════════════════════════
echo  [5/8] Starting Docker Postgres...

docker info >nul 2>&1
if !errorlevel! neq 0 (
  echo.
  echo  ╔════════════════════════════════════════════════════╗
  echo  ║  [ERROR]  Docker Desktop is NOT running!            ║
  echo  ║                                                     ║
  echo  ║   1. Open Docker Desktop from Start Menu            ║
  echo  ║   2. Wait until taskbar icon turns green            ║
  echo  ║   3. Run this file again                            ║
  echo  ╚════════════════════════════════════════════════════╝
  echo.
  pause & exit /b 1
)

:: Kill node to release Prisma DLL lock (Windows requirement)
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

docker-compose -f docker-compose.dev.yml up -d --remove-orphans >nul 2>&1
if !errorlevel! neq 0 (
  docker compose -f docker-compose.dev.yml up -d --remove-orphans >nul 2>&1
)

echo        Waiting for Postgres...
set /a pg_tries=0
:WAIT_PG
set /a pg_tries+=1
docker exec unkora_postgres_dev pg_isready -U unkora -d unkora >nul 2>&1
if !errorlevel! neq 0 (
  if !pg_tries! geq 40 (
    echo  [ERROR] Postgres did not start after 80s. Check Docker Desktop.
    pause & exit /b 1
  )
  timeout /t 2 /nobreak >nul
  goto WAIT_PG
)
echo        Postgres ready!
echo.

:: ════════════════════════════════════════════════════════════════
::  STEP 6 — Prisma: generate + db push (local dev)
::  db push syncs schema directly — no migration history needed
:: ════════════════════════════════════════════════════════════════
echo  [6/8] Setting up database schema (Prisma)...
cd packages\database

echo        Generating Prisma client...
call npx prisma generate
if !errorlevel! neq 0 (
  echo  [ERROR] prisma generate failed!
  echo         Fix: close all Node windows, then run this file again.
  cd ..\..
  pause & exit /b 1
)

echo        Syncing database schema (db push)...
call npx prisma db push --accept-data-loss
if !errorlevel! neq 0 (
  echo.
  echo  [ERROR] Database schema sync failed!
  echo.
  echo         Try this fix:
  echo           1. Open PowerShell
  echo           2. Run: docker volume rm unkora-1_postgres_dev_data
  echo           3. Run this file again
  cd ..\..
  pause & exit /b 1
)
echo        Schema ready!
cd ..\..
echo.

:: ════════════════════════════════════════════════════════════════
::  STEP 7 — Seed database
::  Always run seed — all inserts use "upsert" so it's safe
::  to run multiple times without duplicating data
:: ════════════════════════════════════════════════════════════════
echo  [7/8] Seeding database with sample data...
echo        (This creates admin, products, categories etc.)
echo        (Safe to run again — uses upsert, no duplicates)
echo.

cd packages\database

:: Check if products table has data
set PROD_COUNT=0
for /f "usebackq tokens=*" %%n in (`docker exec unkora_postgres_dev psql -U unkora -d unkora -tAc "SELECT COUNT(*) FROM products;" 2^>nul`) do (
  set RAW=%%n
  set RAW=!RAW: =!
  if not "!RAW!"=="" set PROD_COUNT=!RAW!
)

echo        Current products in DB: !PROD_COUNT!

if !PROD_COUNT! lss 5 (
  echo        Seeding now — please wait...
  echo.
  call npx prisma db seed
  if !errorlevel! neq 0 (
    echo.
    echo  ╔════════════════════════════════════════════════════╗
    echo  ║  [SEED ERROR] Seed script had errors!              ║
    echo  ║                                                     ║
    echo  ║  Common fixes:                                      ║
    echo  ║   1. Run FRESH-START.bat (wipes DB, starts fresh)   ║
    echo  ║   2. Check if Docker is running                     ║
    echo  ║   3. Run manually: cd packages\database             ║
    echo  ║                    npx prisma db seed               ║
    echo  ╚════════════════════════════════════════════════════╝
    echo.
    echo  Continuing anyway — app may work with partial data.
    echo.
  ) else (
    echo.
    echo        Seed complete!
  )
) else (
  echo        !PROD_COUNT! products found — seed skipped.
  echo        (Run RESEED.bat to force fresh seed)
)

cd ..\..
echo.

:: ════════════════════════════════════════════════════════════════
::  STEP 8 — Free ports + Launch API + Web
:: ════════════════════════════════════════════════════════════════
echo  [8/8] Launching API and Web servers...

:: Free ports 3000 and 4000
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":4000 " ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 /nobreak >nul

:: API — blue window
start "UNKORA API :4000" cmd /k "color 0B && echo. && echo  ╔══════════════════════════════════════╗ && echo  ║    UNKORA  API  :4000  (BLUE)        ║ && echo  ║  Wait: Application is running on...  ║ && echo  ╚══════════════════════════════════════╝ && echo. && cd /d %~dp0apps\api && npm run dev"

timeout /t 3 /nobreak >nul

:: Web — yellow window
start "UNKORA WEB :3000" cmd /k "color 0E && echo. && echo  ╔══════════════════════════════════════╗ && echo  ║    UNKORA  WEB  :3000  (YELLOW)      ║ && echo  ║    Wait: Ready in...                 ║ && echo  ╚══════════════════════════════════════╝ && echo. && cd /d %~dp0apps\web && npm run dev"

:: Wait for API
echo.
echo  Waiting for API to start (first time ~30-60 seconds)...
set /a api_wait=0
:WAIT_API
set /a api_wait+=1
if !api_wait! geq 60 (
  echo  [WARN] API taking long — check BLUE window for errors.
  goto OPEN_BROWSER
)
timeout /t 3 /nobreak >nul
powershell -Command "try{Invoke-WebRequest -Uri 'http://localhost:4000/api/v1/health' -UseBasicParsing -TimeoutSec 2|Out-Null;exit 0}catch{exit 1}" >nul 2>&1
if !errorlevel! neq 0 goto WAIT_API
echo  API is healthy!

:: Wait for Web
echo  Waiting for Web to compile...
set /a web_wait=0
:WAIT_WEB
set /a web_wait+=1
if !web_wait! geq 30 (
  echo  Web taking long — opening browser anyway...
  goto OPEN_BROWSER
)
timeout /t 3 /nobreak >nul
powershell -Command "try{Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2|Out-Null;exit 0}catch{exit 1}" >nul 2>&1
if !errorlevel! neq 0 goto WAIT_WEB

:OPEN_BROWSER
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                   UNKORA IS LIVE!                        ║
echo  ║                                                          ║
echo  ║   Shop      →   http://localhost:3000                    ║
echo  ║   Admin     →   http://localhost:3000/admin              ║
echo  ║   API       →   http://localhost:4000/api/v1             ║
echo  ║   Seller    →   http://localhost:3000/seller/login       ║
echo  ║                                                          ║
echo  ║   Login: admin@unkora.com  /  Admin@123456               ║
echo  ║                                                          ║
echo  ║   BLUE   window = API server  (port 4000)                ║
echo  ║   YELLOW window = Web server  (port 3000)                ║
echo  ║                                                          ║
echo  ║   To STOP: close the blue and yellow windows             ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

timeout /t 2 /nobreak >nul
start http://localhost:3000/admin

echo  This launcher window can be closed.
echo.
pause
