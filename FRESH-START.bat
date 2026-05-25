@echo off
setlocal EnableDelayedExpansion
title UNKORA Fresh Start (WIPES DATABASE)
color 0C

echo.
echo =====================================================
echo   UNKORA FRESH START  --  THIS WIPES ALL DATA!
echo   Use when: migrations broken / DB out of sync
echo =====================================================
echo.
echo  This will DELETE the Postgres volume and re-seed.
echo  All orders, users, products added manually LOST.
echo.
set /p confirm="  Type YES to continue: "
if /i not "!confirm!"=="YES" (
  echo Cancelled.
  pause
  exit /b 0
)

echo.
echo Removing old containers and volume...
docker rm -f unkora_postgres_dev >nul 2>&1
docker volume rm unkora-1_postgres_dev_data >nul 2>&1
echo Done. Running START.bat...
echo.

call "%~dp0START.bat"
