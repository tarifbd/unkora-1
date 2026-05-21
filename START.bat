@echo off
echo ========================================
echo   UNKORA Local Dev - Starting up...
echo ========================================

:: Create apps/api/.env
echo DATABASE_URL=postgresql://unkora:unkora_secret_dev@localhost:5432/unkora > apps\api\.env
echo REDIS_URL=redis://localhost:6379 >> apps\api\.env
echo JWT_SECRET=dev-secret-local-unkora-min64chars-do-not-use-in-production-abc123 >> apps\api\.env
echo JWT_EXPIRES_IN=15m >> apps\api\.env
echo JWT_REFRESH_SECRET=dev-refresh-local-unkora-min64chars-do-not-use-in-production-xyz789 >> apps\api\.env
echo JWT_REFRESH_EXPIRES_IN=7d >> apps\api\.env
echo API_PORT=4000 >> apps\api\.env
echo API_PREFIX=api >> apps\api\.env
echo NODE_ENV=development >> apps\api\.env
echo CORS_ORIGINS=http://localhost:3000 >> apps\api\.env

:: Create apps/web/.env.local
echo NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1 > apps\web\.env.local
echo NEXT_PUBLIC_SITE_URL=http://localhost:3000 >> apps\web\.env.local

:: Create packages/database/.env
echo DATABASE_URL=postgresql://unkora:unkora_secret_dev@localhost:5432/unkora > packages\database\.env

echo [OK] .env files created

:: Run seed
echo.
echo Running database seed...
cd packages\database
call npx prisma db seed
cd ..\..

echo.
echo Starting API server...
start "UNKORA API" cmd /k "cd /d %~dp0apps\api && npm run dev"

echo Waiting 5 seconds for API to start...
timeout /t 5 /nobreak > nul

echo Starting Web server...
start "UNKORA Web" cmd /k "cd /d %~dp0apps\web && npm run dev"

echo.
echo ========================================
echo   Done! Opening browser in 8 seconds...
echo ========================================
timeout /t 8 /nobreak > nul
start http://localhost:3000
