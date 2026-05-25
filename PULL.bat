@echo off
setlocal EnableDelayedExpansion
title UNKORA — Pull Latest Code
color 0B

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     UNKORA Pull Latest from GitHub       ║
echo  ╚══════════════════════════════════════════╝
echo.

:: ─── 1. Show current branch ────────────────────────────────────
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set BRANCH=%%b
echo  Current branch: %BRANCH%

:: ─── 2. Stash any local uncommitted changes ────────────────────
git status --short >nul 2>&1
for /f %%c in ('git status --porcelain 2^>nul ^| find /c /v ""') do set DIRTY=%%c
if !DIRTY! gtr 0 (
  echo.
  echo  [!] You have uncommitted local changes — stashing them...
  git stash push -m "auto-stash before PULL %date% %time%"
  set STASHED=1
) else (
  set STASHED=0
)

:: ─── 3. Pull latest ────────────────────────────────────────────
echo.
echo  Pulling from origin/%BRANCH%...
git pull origin %BRANCH%
if %errorlevel% neq 0 (
  echo.
  echo  [ERROR] git pull failed. Possible reasons:
  echo    - No internet connection
  echo    - Branch doesn't exist on remote
  echo    - Merge conflict
  echo.
  if !STASHED!==1 (
    echo  Restoring your stashed changes...
    git stash pop
  )
  pause
  exit /b 1
)

:: ─── 4. Restore stash if we stashed ───────────────────────────
if !STASHED!==1 (
  echo.
  echo  Restoring your stashed local changes...
  git stash pop
)

:: ─── 5. npm install (if package-lock.json changed) ─────────────
echo.
echo  Syncing npm dependencies...
call npm install
if %errorlevel% neq 0 (
  echo  [ERROR] npm install failed.
  pause
  exit /b 1
)

:: ─── 6. Prisma generate (in case schema changed) ───────────────
echo.
echo  Regenerating Prisma client...
cd packages\database
call npx prisma generate
cd ..\..

:: ─── 7. Done ───────────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║  Pull complete! Latest code is ready.    ║
echo  ║                                          ║
echo  ║  Now run START.bat to launch the app.    ║
echo  ╚══════════════════════════════════════════╝
echo.
pause
