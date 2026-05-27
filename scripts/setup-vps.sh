#!/bin/bash
# Unkora VPS Setup Script for Ubuntu 22.04 (Hostinger KVM2 or similar)
# Run as root: curl -fsSL https://raw.githubusercontent.com/your-repo/main/scripts/setup-vps.sh | bash

set -e
echo "🚀 Setting up Unkora on Ubuntu 22.04..."

# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Certbot for SSL
apt-get install -y certbot

# Create app directory
mkdir -p /opt/unkora
cd /opt/unkora

# Create .env file placeholder
cat > /opt/unkora/.env << 'EOF'
# Fill these with your actual values
DOCKER_USERNAME=your-dockerhub-username
DATABASE_URL=postgresql://user:pass@neon-host/unkora?sslmode=require
JWT_SECRET=change-me-min-32-characters
JWT_REFRESH_SECRET=change-me-different-min-32-chars
REDIS_URL=redis://default:pass@upstash-host:6379
FRONTEND_URL=https://your-domain.com
SUCCESS_URL=https://your-domain.com/checkout/success
FAIL_URL=https://your-domain.com/checkout/fail
CANCEL_URL=https://your-domain.com/checkout/cancel
IPN_URL=https://api.your-domain.com/api/v1/payments/sslcommerz/ipn
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Unkora <noreply@your-domain.com>
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
SSLCOMMERZ_SANDBOX=false
EOF

echo "✅ VPS setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit /opt/unkora/.env with your real values"
echo "2. Copy docker-compose.prod.yml and nginx.conf to /opt/unkora/"
echo "3. Get SSL cert: certbot certonly --standalone -d api.your-domain.com"
echo "4. Run: docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "Setup Cloudflare:"
echo "  - Add A record: api.your-domain.com → $(curl -s https://api.ipify.org)"
echo "  - Enable Cloudflare proxy (orange cloud)"
echo "  - SSL/TLS → Full (Strict)"
