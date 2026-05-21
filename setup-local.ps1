# UNKORA Local Dev Setup
# Run this ONCE from the project root: .\setup-local.ps1

Write-Host "Setting up UNKORA local dev environment..." -ForegroundColor Cyan

# ── apps/api/.env ──────────────────────────────────────────────────────────
$apiEnv = @"
DATABASE_URL=postgresql://unkora:unkora_secret_dev@localhost:5432/unkora
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-local-unkora-min64chars-do-not-use-in-production-abc123
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=dev-refresh-local-unkora-min64chars-do-not-use-in-production-xyz789
JWT_REFRESH_EXPIRES_IN=7d
API_PORT=4000
API_PREFIX=api
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000
"@
Set-Content -Path "apps\api\.env" -Value $apiEnv -Encoding UTF8
Write-Host "  [OK] apps/api/.env created" -ForegroundColor Green

# ── apps/web/.env.local ────────────────────────────────────────────────────
$webEnv = @"
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
"@
Set-Content -Path "apps\web\.env.local" -Value $webEnv -Encoding UTF8
Write-Host "  [OK] apps/web/.env.local created" -ForegroundColor Green

# ── packages/database/.env ─────────────────────────────────────────────────
$dbEnv = @"
DATABASE_URL=postgresql://unkora:unkora_secret_dev@localhost:5432/unkora
"@
Set-Content -Path "packages\database\.env" -Value $dbEnv -Encoding UTF8
Write-Host "  [OK] packages/database/.env created" -ForegroundColor Green

Write-Host ""
Write-Host "DONE! Now run these steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Seed the database:" -ForegroundColor White
Write-Host "     cd packages\database" -ForegroundColor Gray
Write-Host "     npx prisma db seed" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Start the API (new PowerShell window):" -ForegroundColor White
Write-Host "     cd apps\api" -ForegroundColor Gray
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Start the frontend (another PowerShell window):" -ForegroundColor White
Write-Host "     cd apps\web" -ForegroundColor Gray
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  Open: http://localhost:3000" -ForegroundColor Cyan
