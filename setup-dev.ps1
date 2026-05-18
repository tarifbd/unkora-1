# ============================================================
#  Unkora Dev Environment Setup Script
#  Run from project root: .\setup-dev.ps1
# ============================================================

param(
  [string]$DbUrl = ""
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

function Write-Step($msg) { Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "   OK: $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "   WARN: $msg" -ForegroundColor Yellow }

Write-Host "`n============================================" -ForegroundColor Magenta
Write-Host "  UNKORA Dev Setup" -ForegroundColor Magenta
Write-Host "============================================`n" -ForegroundColor Magenta

# ── Step 1: Root .env ────────────────────────────────────
Write-Step "Setting up root .env"
$rootEnvPath = Join-Path $Root ".env"
if (-not (Test-Path $rootEnvPath)) {
    Copy-Item (Join-Path $Root ".env.example") $rootEnvPath
    Write-Ok "Created .env from .env.example"
    Write-Warn "Open .env and set your DATABASE_URL and other secrets before continuing."
    Write-Host "`n   Press Enter after editing .env to continue, or Ctrl+C to abort..." -ForegroundColor Yellow
    Read-Host
} else {
    Write-Ok ".env already exists"
}

# ── Step 2: Read DATABASE_URL ────────────────────────────
if ($DbUrl -eq "") {
    $envLine = Get-Content $rootEnvPath | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
    if ($envLine) {
        $DbUrl = $envLine -replace '^DATABASE_URL=', '' -replace '"', ''
    }
}

if ($DbUrl -eq "") {
    Write-Host "`n   ERROR: DATABASE_URL not found in .env" -ForegroundColor Red
    Write-Host "   Add this line to your .env file:" -ForegroundColor Yellow
    Write-Host '   DATABASE_URL="postgresql://unkora:unkora_pass@localhost:5432/unkora_db"' -ForegroundColor White
    exit 1
}
Write-Ok "DATABASE_URL found"

# ── Step 3: packages/database/.env ─────────────────────
Write-Step "Setting up packages/database/.env"
$dbEnvPath = Join-Path $Root "packages\database\.env"
Set-Content $dbEnvPath "DATABASE_URL=`"$DbUrl`""
Write-Ok "Created packages/database/.env"

# ── Step 4: apps/api/.env ───────────────────────────────
Write-Step "Setting up apps/api/.env"
$apiEnvPath = Join-Path $Root "apps\api\.env"
if (-not (Test-Path $apiEnvPath)) {
    Copy-Item $rootEnvPath $apiEnvPath
    Write-Ok "Created apps/api/.env"
} else {
    Write-Ok "apps/api/.env already exists"
}

# ── Step 5: apps/web/.env.local ─────────────────────────
Write-Step "Setting up apps/web/.env.local"
$webEnvPath = Join-Path $Root "apps\web\.env.local"
if (-not (Test-Path $webEnvPath)) {
    $webEnv = @"
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
"@
    Set-Content $webEnvPath $webEnv
    Write-Ok "Created apps/web/.env.local"
} else {
    Write-Ok "apps/web/.env.local already exists"
}

# ── Step 6: Prisma migrate + generate ───────────────────
Write-Step "Running Prisma migrations"
Push-Location (Join-Path $Root "packages\database")
try {
    npx prisma migrate deploy 2>&1 | ForEach-Object { Write-Host "   $_" }
    Write-Ok "Migrations applied"

    npx prisma generate 2>&1 | ForEach-Object { Write-Host "   $_" }
    Write-Ok "Prisma client generated"

    # ── Step 7: Seed ──────────────────────────────────────
    Write-Step "Seeding database"
    npx prisma db seed 2>&1 | ForEach-Object { Write-Host "   $_" }
    Write-Ok "Database seeded"
} finally {
    Pop-Location
}

# ── Done ─────────────────────────────────────────────────
Write-Host "`n============================================" -ForegroundColor Green
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host @"

  Admin login:
    Email   : admin@unkora.com
    Password: Admin@123456

  Start the dev server:
    npm run dev   (from project root)

"@ -ForegroundColor White
