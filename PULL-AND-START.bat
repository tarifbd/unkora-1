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
echo        Name  : %GIT_NAME%
echo.

:: ════════════════════════════════════════════════════════════════
::  STEP 2 — Switch to correct branch
:: ════════════════════════════════════════════════════════════════
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set CURRENT_BRANCH=%%b

if "!CURRENT_BRANCH!"=="!TARGET_BRANCH!" (
  echo  [2/8] Already on branch: !TARGET_BRANCH!
) else (
  echo  [2/8] Switching from !CURRENT_BRANCH! to !TARGET_BRANCH!...

  :: Stash any local changes before switching
  for /f %%c in ('git status --porcelain 2^>nul ^| find /c /v ""') do set DIRTY=%%c
  if !DIRTY! gtr 0 (
    echo        Stashing local changes...
    git stash push -m "auto-stash before branch switch %date% %time%"
    set STASHED=1
  ) else (
    set STASHED=0
  )

  git checkout !TARGET_BRANCH! 2>nul
  if !errorlevel! neq 0 (
    git checkout -b !TARGET_BRANCH! --track origin/!TARGET_BRANCH!
    if !errorlevel! neq 0 (
      echo.
      echo  [ERROR] Cannot switch to branch: !TARGET_BRANCH!
      echo         Make sure the branch exists on GitHub.
      pause & exit /b 1
    )
  )
  echo        Switched to !TARGET_BRANCH!
)
echo.

:: ════════════════════════════════════════════════════════════════
::  STEP 3 — Pull latest code from GitHub
:: ════════════════════════════════════════════════════════════════
echo  [3/8] Pulling latest code from GitHub...
git fetch origin !TARGET_BRANCH! 2>nul
git pull origin !TARGET_BRANCH!
if !errorlevel! neq 0 (
  echo.
  echo  [ERROR] git pull failed!
  echo         Possible causes:
  echo           - No internet connection
  echo           - GitHub credentials issue
  echo           - Merge conflict
  echo.
  echo         If there are conflicts, run FRESH-START.bat to reset completely.
  pause & exit /b 1
)
echo        Code is up to date!
echo.

:: ════════════════════════════════════════════════════════════════
::  STEP 4 — Write .env files (required by API + Web)
:: ════════════════════════════════════════════════════════════════
echo  [4/8] Writing .env files...

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
::  STEP 5 — npm install (always run to catch new packages)
:: ════════════════════════════════════════════════════════════════
echo  [5/8] Installing npm dependencies...
call npm install
if !errorlevel! neq 0 (
  echo.
  echo  [ERROR] npm install failed!
  echo         Check your internet connection and try again.
  pause & exit /b 1
)
echo        Dependencies installed.
echo.

:: ════════════════════════════════════════════════════════════════
::  STEP 6 — Start Docker Postgres
:: ════════════════════════════════════════════════════════════════
echo  [6/8] Starting Docker Postgres...

docker info >nul 2>&1
if !errorlevel! neq 0 (
  echo.
  echo  ╔═══════════════════════════════════════════════════╗
  echo  ║  [ERROR]  Docker Desktop is NOT running!           ║
  echo  ║                                                    ║
  echo  ║  Please:                                           ║
  echo  ║    1. Open Docker Desktop from Start Menu          ║
  echo  ║    2. Wait until Docker icon in taskbar is green   ║
  echo  ║    3. Run this file again                          ║
  echo  ╚═══════════════════════════════════════════════════╝
  echo.
  pause & exit /b 1
)

:: Kill any stale node processes (frees Prisma DLL lock on Windows)
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

docker-compose -f docker-compose.dev.yml up -d --remove-orphans >nul 2>&1
if !errorlevel! neq 0 (
  docker compose -f docker-compose.dev.yml up -d --remove-orphans
  if !errorlevel! neq 0 (
    echo  [ERROR] Could not start Docker Postgres. Check Docker Desktop.
    pause & exit /b 1
  )
)

echo        Waiting for Postgres to be ready...
set /a pg_tries=0
:WAIT_PG
set /a pg_tries+=1
docker exec unkora_postgres_dev pg_isready -U unkora -d unkora >nul 2>&1
if !errorlevel! neq 0 (
  if !pg_tries! geq 30 (
    echo  [ERROR] Postgres did not start after 60 seconds. Check Docker Desktop.
    pause & exit /b 1
  )
  timeout /t 2 /nobreak >nul
  goto WAIT_PG
)
echo        Postgres ready after !pg_tries! checks.
echo.

:: ════════════════════════════════════════════════════════════════
::  STEP 7 — Prisma: generate + migrate + seed
:: ════════════════════════════════════════════════════════════════
echo  [7/8] Setting up database (Prisma)...
cd packages\database

echo        Generating Prisma client...
call npx prisma generate
if !errorlevel! neq 0 (
  echo  [ERROR] prisma generate failed!
  cd ..\..
  pause & exit /b 1
)

echo        Applying migrations...
call npx prisma migrate deploy
if !errorlevel! neq 0 (
  echo  [WARN] prisma migrate deploy had issues.
  echo         If the database is badly out of sync, run FRESH-START.bat
  cd ..\..
  pause & exit /b 1
)

:: Seed only if no products exist yet
for /f %%n in ('docker exec unkora_postgres_dev psql -U unkora -d unkora -tAc "SELECT COUNT(*) FROM products;" 2^>nul') do set PROD_COUNT=%%n
if "!PROD_COUNT!"=="" set PROD_COUNT=0

if !PROD_COUNT! lss 5 (
  echo        Only !PROD_COUNT! products found — seeding database...
  call npx prisma db seed
  if !errorlevel! neq 0 (
    echo  [WARN] Seed had errors. App may still work — check manually.
  ) else (
    echo        Seed complete!
  )
) else (
  echo        !PROD_COUNT! products in database — seed skipped.
)

cd ..\..
echo        Database ready!
echo.

:: ════════════════════════════════════════════════════════════════
::  STEP 8 — Free ports then launch API + Web in separate windows
:: ════════════════════════════════════════════════════════════════
echo  [8/8] Freeing ports and launching servers...

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":4000 " ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

:: API — blue window
start "UNKORA API :4000" cmd /k "color 0B && echo. && echo  API Server starting on port 4000... && echo  Wait until you see: Application is running on: http://localhost:4000 && echo. && cd /d %~dp0apps\api && npm run dev"

timeout /t 3 /nobreak >nul

:: Web — yellow window
start "UNKORA WEB :3000" cmd /k "color 0E && echo. && echo  Web Server starting on port 3000... && echo  Wait until you see: Ready in... && echo. && cd /d %~dp0apps\web && npm run dev"

:: ════════════════════════════════════════════════════════════════
::  Wait for API then Web, then open browser
:: ════════════════════════════════════════════════════════════════
echo.
echo  Waiting for API to start (first time can take 30-60 seconds)...
set /a api_wait=0
:WAIT_API
set /a api_wait+=1
if !api_wait! geq 60 (
  echo  [WARN] API is taking long — check the BLUE window for errors.
  goto OPEN_BROWSER
)
timeout /t 3 /nobreak >nul
powershell -Command "try{Invoke-WebRequest -Uri 'http://localhost:4000/api/v1/health' -UseBasicParsing -TimeoutSec 2|Out-Null;exit 0}catch{exit 1}" >nul 2>&1
if !errorlevel! neq 0 goto WAIT_API
echo  API is healthy!

echo  Waiting for Web to start...
set /a web_wait=0
:WAIT_WEB
set /a web_wait+=1
if !web_wait! geq 30 (
  echo  [WARN] Web taking long — opening browser now anyway...
  goto OPEN_BROWSER
)
timeout /t 3 /nobreak >nul
powershell -Command "try{Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2|Out-Null;exit 0}catch{exit 1}" >nul 2>&1
if !errorlevel! neq 0 goto WAIT_WEB

:OPEN_BROWSER
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                  UNKORA IS LIVE!                         ║
echo  ║                                                          ║
echo  ║   Shop      →   http://localhost:3000                    ║
echo  ║   Admin     →   http://localhost:3000/admin              ║
echo  ║   API       →   http://localhost:4000/api/v1             ║
echo  ║   Seller    →   http://localhost:3000/seller/login       ║
echo  ║                                                          ║
echo  ║   Login: admin@unkora.com  /  Admin@123456               ║
echo  ║                                                          ║
echo  ║   BLUE window  = API server  (port 4000)                 ║
echo  ║   YELLOW window = Web server (port 3000)                 ║
echo  ║                                                          ║
echo  ║   To STOP: close both blue and yellow windows            ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

timeout /t 2 /nobreak >nul
start http://localhost:3000/admin

echo  This window can be closed now. Servers are running.
echo.
pause
