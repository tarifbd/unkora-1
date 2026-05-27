# Unkora Deployment Guide

## Free Trial (Start Here — Zero Cost)

### Step 1: Database — Neon (Free PostgreSQL)
1. Go to [neon.tech](https://neon.tech) → Sign up free
2. Create project "unkora"
3. Copy connection string → `DATABASE_URL` in `.env`

### Step 2: Redis — Upstash (Free)
1. Go to [upstash.com](https://upstash.com) → Create database
2. Select Redis, region: Singapore (closest to BD)
3. Copy Redis URL → `REDIS_URL` in `.env`

### Step 3: Frontend — Vercel (Free)
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repo
3. Framework: Next.js, Root: `apps/web`
4. Add env vars:
   - `NEXT_PUBLIC_API_URL` = your Railway API URL + `/api/v1`
5. Deploy!

### Step 4: Backend — Railway (Free $5 credit)
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo, root: `apps/api`
3. Add env vars from `apps/api/.env.example`
4. Add `DATABASE_URL` from Neon

### Step 5: Run Database Migration
```bash
# From your local machine, point to Neon:
DATABASE_URL=your-neon-url pnpm --filter @unkora/database exec prisma migrate deploy
```

---

## Production: Hostinger + Cloudflare

### Recommended Hostinger Plan
- **KVM 2** (€5.99/mo) — 2 vCPU, 8GB RAM, 100GB NVMe
- Or **KVM 1** (€3.99/mo) — 1 vCPU, 4GB RAM (sufficient for MVP)

### VPS Setup
```bash
# SSH into your VPS
ssh root@your-vps-ip

# Run setup script
curl -fsSL https://raw.githubusercontent.com/your-org/unkora/main/scripts/setup-vps.sh | bash

# Edit .env
nano /opt/unkora/.env

# Copy deployment files
scp docker-compose.prod.yml nginx.conf root@your-vps-ip:/opt/unkora/

# Get SSL certificate
certbot certonly --standalone -d api.your-domain.com

# Start services
cd /opt/unkora
docker-compose -f docker-compose.prod.yml up -d
```

### Cloudflare Setup
1. Add your domain to Cloudflare (free plan)
2. Update nameservers at your registrar
3. Add DNS records:
   ```
   Type  Name   Value              Proxy
   A     @      your-vercel-ip     yes (or use CNAME for Vercel)
   A     api    your-vps-ip        yes
   ```
4. SSL/TLS → **Full (Strict)**
5. Speed → Optimization → Enable Rocket Loader
6. Caching → Configuration → Caching Level: Standard

### GitHub Secrets Required
Go to your repo → Settings → Secrets → Actions:
```
DATABASE_URL          = your Neon connection string
DOCKER_USERNAME       = your Docker Hub username
DOCKER_PASSWORD       = your Docker Hub password/token
VPS_HOST              = your VPS IP address
VPS_USER              = root
VPS_SSH_KEY           = your SSH private key (cat ~/.ssh/id_rsa)
VERCEL_TOKEN          = from vercel.com/account/tokens
VERCEL_ORG_ID         = from vercel project settings
VERCEL_PROJECT_ID     = from vercel project settings
```

### CI/CD Flow (GitHub Actions)
```
Push to main branch
    |
Lint + Type Check
    |
Build Docker image → Push to Docker Hub
    |
SSH into VPS → Pull new image → Restart container
    |
Deploy frontend to Vercel (automatic)
```

### Monitoring (Free)
- **UptimeRobot**: Monitor API health endpoint every 5 mins → alert on Telegram
- **Vercel Analytics**: Built-in for frontend
- **Docker logs**: `docker logs unkora-api --tail=100 -f`

---

## Environment Variables Checklist

### Must-have for launch:
- [ ] `DATABASE_URL` (Neon/PostgreSQL)
- [ ] `JWT_SECRET` (random 64-char string)
- [ ] `JWT_REFRESH_SECRET` (different random 64-char string)
- [ ] `REDIS_URL` (Upstash)
- [ ] `SMTP_*` (Gmail App Password or SendGrid)
- [ ] `FRONTEND_URL`
- [ ] `NEXT_PUBLIC_API_URL`

### For payments:
- [ ] `SSLCOMMERZ_STORE_ID` + `SSLCOMMERZ_STORE_PASSWORD` (from sslcommerz.com)
- [ ] Set `SSLCOMMERZ_SANDBOX=false` for production

### For file uploads:
- [ ] `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` + `AWS_BUCKET`
- [ ] Or use Cloudinary (update upload service)

### For AI features:
- [ ] `OPENAI_API_KEY` or `GEMINI_API_KEY`

### For SMS:
- [ ] `SSL_WIRELESS_API_KEY` + `SSL_WIRELESS_SID` (ssl.com.bd)
