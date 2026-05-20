@echo off
echo Setting up .env files...

(
echo DATABASE_URL="postgresql://unkora:unkora_secret_dev@localhost:5432/unkora"
echo REDIS_URL="redis://localhost:6379"
echo NODE_ENV="development"
echo API_PORT=3001
echo JWT_SECRET="super-secret-jwt-key-dev"
echo JWT_REFRESH_SECRET="super-secret-refresh-key-dev"
) > apps\api\.env

(
echo DATABASE_URL="postgresql://unkora:unkora_secret_dev@localhost:5432/unkora"
) > packages\database\.env

echo .env files created successfully!
echo.
echo Starting API server...
cd apps\api
npm run dev
