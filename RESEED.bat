@echo off
setlocal EnableDelayedExpansion
title UNKORA — Force Reseed
color 0D

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║          UNKORA  —  FORCE RESEED                 ║
echo  ║   Kills Node, runs Prisma, re-seeds all data     ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  This will RE-INSERT all seed data (books, products,
echo  categories, reviews, site settings).
echo  Existing records are UPSERTED — no data loss.
echo.

:: ════════════════════════════════════════════════════════
::  Check Docker / Postgres is running
:: ════════════════════════════════════════════════════════
echo  [1/4] Checking Postgres connection...
docker exec unkora_postgres_dev pg_isready -U unkora -d unkora >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo  [ERROR] Postgres container not running!
  echo  Please run MAIN.bat first to start Docker, then run RESEED.bat.
  echo.
  pause & exit /b 1
)
echo  Postgres is ready.

:: ════════════════════════════════════════════════════════
::  Kill Node.exe — REQUIRED to free Prisma DLL lock
::  (Without this, prisma generate fails with EPERM)
:: ════════════════════════════════════════════════════════
echo.
echo  [2/4] Stopping Node processes (frees Prisma DLL lock)...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul
echo  Node processes stopped.

:: ════════════════════════════════════════════════════════
::  Prisma generate + migrate deploy
:: ════════════════════════════════════════════════════════
echo.
echo  [3/4] Running Prisma generate + migrate deploy...
cd packages\database

echo   • prisma generate...
call npx prisma generate
if %errorlevel% neq 0 (
  echo.
  echo  [ERROR] prisma generate failed.
  echo  Make sure all node.exe processes were closed and try again.
  cd ..\..
  pause & exit /b 1
)

echo   • prisma db push (sync schema)...
call npx prisma db push --accept-data-loss
if %errorlevel% neq 0 (
  echo  [WARN] db push had issues — continuing with seed anyway...
)

:: ════════════════════════════════════════════════════════
::  Force seed (upsert — safe to run multiple times)
:: ════════════════════════════════════════════════════════
echo.
echo  [4/4] Running seed (upsert — safe, no data loss)...
echo.
call npx prisma db seed
if %errorlevel% neq 0 (
  echo.
  echo  [ERROR] Seed failed! See the output above.
  echo  Common causes:
  echo    - argon2 package not installed (run: npm install)
  echo    - Prisma client not generated (step 3 above)
  echo    - Database constraint violation
  cd ..\..
  pause & exit /b 1
)

cd ..\..

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║              RESEED COMPLETE!                    ║
echo  ║                                                  ║
echo  ║  Seeded:                                         ║
echo  ║    • 28 Books (Fiction, Islamic, Academic...)    ║
echo  ║    • 10 Other products (Organic, Leather...)     ║
echo  ║    • Categories + Sub-categories                 ║
echo  ║    • 18 Product reviews                          ║
echo  ║    • Site settings                               ║
echo  ║                                                  ║
echo  ║  Login:  admin@unkora.com  /  Admin@123456       ║
echo  ║  Shop:   http://localhost:3000                   ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  Now run MAIN.bat to start the app (if not already running).
echo.
pause
