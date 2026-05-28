@echo off
setlocal EnableDelayedExpansion
title UNKORA — Pull + Update
color 0B

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║         UNKORA  —  Pull Latest + Update          ║
echo  ║  Git pull · npm install · Prisma · Seed data     ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: ════════════════════════════════════════════════════════
::  CLEANUP — Remove known ghost files from repo root
:: ════════════════════════════════════════════════════════
if exist "FETCH_HEAD" del /f /q "FETCH_HEAD" >nul 2>&1
if exist "npx"        del /f /q "npx"        >nul 2>&1
if exist "("          del /f /q "("          >nul 2>&1

:: ════════════════════════════════════════════════════════
::  STEP 1 — Show current branch
:: ════════════════════════════════════════════════════════
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set BRANCH=%%b
if "!BRANCH!"=="" (
  echo  [ERROR] Not a git repository or git not installed.
  pause & exit /b 1
)
echo  [1/6] Current branch: !BRANCH!
echo.

:: ════════════════════════════════════════════════════════
::  STEP 2 — Stash any local uncommitted changes
:: ════════════════════════════════════════════════════════
set STASHED=0
for /f %%c in ('git status --porcelain 2^>nul ^| find /c /v ""') do set DIRTY=%%c
if !DIRTY! gtr 0 (
  echo  [2/6] Local changes detected — stashing them first...
  git stash push -m "auto-stash before PULL %date% %time%"
  set STASHED=1
) else (
  echo  [2/6] Working tree clean — no stash needed.
)

:: ════════════════════════════════════════════════════════
::  STEP 3 — Git pull
:: ════════════════════════════════════════════════════════
echo.
echo  [3/6] Pulling from origin/!BRANCH!...
git pull origin !BRANCH!
if %errorlevel% neq 0 (
  echo.
  echo  [ERROR] git pull failed. Possible causes:
  echo    - No internet connection
  echo    - Branch does not exist on remote
  echo    - Merge conflict
  echo.
  if !STASHED!==1 (
    echo  Restoring stashed changes...
    git stash pop
  )
  pause & exit /b 1
)
echo  Pull successful!

:: Restore stash after successful pull
if !STASHED!==1 (
  echo.
  echo  Restoring your local stashed changes...
  git stash pop
  if %errorlevel% neq 0 (
    echo  [WARN] Stash pop had a conflict — check manually with: git stash show
  )
)

:: ════════════════════════════════════════════════════════
::  STEP 4 — npm install (always run to pick up new packages)
:: ════════════════════════════════════════════════════════
echo.
echo  [4/6] Installing / updating npm dependencies...
call npm install
if %errorlevel% neq 0 (
  echo  [ERROR] npm install failed. Check the output above.
  pause & exit /b 1
)
echo  Dependencies up to date.

:: ════════════════════════════════════════════════════════
::  STEP 5 — Kill node.exe, then Prisma generate + migrate
:: ════════════════════════════════════════════════════════
echo.
echo  [5/6] Running Prisma generate + migrate deploy...

:: Must kill node.exe FIRST — otherwise it holds the Prisma
:: query_engine-windows.dll.node file and prisma generate
:: gets EPERM (operation not permitted) on Windows.
echo   • Stopping any running Node processes (frees DLL lock)...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

cd packages\database

echo   • Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
  echo  [ERROR] prisma generate failed.
  cd ..\..
  pause & exit /b 1
)

echo   • Applying pending migrations (prisma migrate deploy)...
call npx prisma migrate deploy
if %errorlevel% neq 0 (
  echo.
  echo  [WARN] prisma migrate deploy had issues.
  echo  If the database is out of sync, run FRESH-START.bat to wipe and rebuild.
  echo.
  cd ..\..
  pause & exit /b 1
)
echo  Prisma ready.

:: ════════════════════════════════════════════════════════
::  STEP 6 — Seed data (check product count, not just admin)
:: ════════════════════════════════════════════════════════
echo.
echo  [6/6] Checking seed data...

:: Check if Docker / Postgres is running before trying to seed
docker exec unkora_postgres_dev pg_isready -U unkora -d unkora >nul 2>&1
if %errorlevel% neq 0 (
  echo  [SKIP] Postgres container not running — skipping seed check.
  echo         Run MAIN.bat first, then RESEED.bat if products are missing.
  cd ..\..
  goto DONE
)

:: Check product count — seed if less than 5 products exist
for /f %%n in ('docker exec unkora_postgres_dev psql -U unkora -d unkora -tAc "SELECT COUNT(*) FROM products;" 2^>nul') do set PROD_COUNT=%%n
if "!PROD_COUNT!"=="" set PROD_COUNT=0

if !PROD_COUNT! lss 5 (
  echo   Only !PROD_COUNT! products found — running seed...
  call npx prisma db seed
  if %errorlevel% neq 0 (
    echo  [ERROR] Seed failed. Run RESEED.bat manually after starting the app.
    cd ..\..
    pause & exit /b 1
  )
  echo  Seed complete!
) else (
  echo  !PROD_COUNT! products already in database — seed skipped.
  echo  ^(Run RESEED.bat to force re-seed without data loss^)
)

cd ..\..

:DONE
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║            Pull + Update  COMPLETE!              ║
echo  ║                                                  ║
echo  ║  Everything is up to date:                       ║
echo  ║    ✓ Latest code from GitHub                     ║
echo  ║    ✓ npm dependencies installed                  ║
echo  ║    ✓ Prisma client generated                     ║
echo  ║    ✓ Database migrations applied                 ║
echo  ║    ✓ Seed data checked                           ║
echo  ║                                                  ║
echo  ║  Now run  MAIN.bat  to start the app.            ║
echo  ╚══════════════════════════════════════════════════╝
echo.
pause
