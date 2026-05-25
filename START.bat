@echo off
setlocal
echo ========================================
echo   UNKORA Local Dev - Starting up...
echo ========================================

:: ── 1. Write .env files ───────────────────────────────────────────────────────

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
) > apps\web\.env.local

(
echo DATABASE_URL=postgresql://unkora:unkora_secret_dev@localhost:15432/unkora
) > packages\database\.env

echo [OK] .env files created

:: ── 2. Start Docker infra (Postgres + Redis) ──────────────────────────────────

echo.
echo Cleaning up old containers...
docker rm -f unkora_postgres_dev 2>nul
docker rm -f unkora_redis_dev 2>nul
docker rm -f unkora_typesense 2>nul

echo Starting Docker containers (Postgres)...
docker-compose -f docker-compose.dev.yml up -d --remove-orphans
if %errorlevel% neq 0 (
  echo [ERROR] Docker failed. Make sure Docker Desktop is running!
  pause
  exit /b 1
)
echo [OK] Docker containers started

:: ── 3. Wait for Postgres to be ready ─────────────────────────────────────────

echo.
echo Waiting for Postgres to be ready...
:WAIT_LOOP
docker exec unkora_postgres_dev pg_isready -U unkora -d unkora >nul 2>&1
if %errorlevel% neq 0 (
  timeout /t 2 /nobreak >nul
  goto WAIT_LOOP
)
echo [OK] Postgres is ready

:: ── 4. Run migrations + seed ──────────────────────────────────────────────────

echo.
echo Running database migrations...
cd packages\database
call npx prisma migrate deploy
if %errorlevel% neq 0 (
  echo [ERROR] Migrations failed!
  cd ..\..
  pause
  exit /b 1
)
echo [OK] Migrations done

echo.
echo Seeding database...
call npx prisma db seed
if %errorlevel% neq 0 (
  echo [WARN] Seed had errors - check above output
)
echo [OK] Seed done

cd ..\..

:: ── 5. Start API and Web servers ──────────────────────────────────────────────

echo.
echo Starting API server...
start "UNKORA API" cmd /k "cd /d %~dp0apps\api && npm run dev"

echo Waiting 6 seconds for API to start...
timeout /t 6 /nobreak >nul

echo Starting Web server...
start "UNKORA Web" cmd /k "cd /d %~dp0apps\web && npm run dev"

echo.
echo ========================================
echo   UNKORA is starting up!
echo.
echo   Web:   http://localhost:3000
echo   API:   http://localhost:4000/api/v1
echo.
echo   Admin: http://localhost:3000/admin
echo   Login: admin@unkora.com
echo   Pass:  Admin@123456
echo ========================================
timeout /t 10 /nobreak >nul
start http://localhost:3000
