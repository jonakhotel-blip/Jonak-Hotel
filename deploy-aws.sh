#!/usr/bin/env bash
# ==============================================================================
# Jonak Hotel & Restaurant - Automated AWS EC2 Deployment Script
# Target OS: Ubuntu 22.04 / 24.04 LTS on AWS EC2
# Domain: https://jonakhotelgroup.in | https://www.jonakhotelgroup.in
# ==============================================================================

set -e

echo "===================================================================="
echo "🏨 JONAK HOTEL & RESTAURANT - AWS EC2 PRODUCTION DEPLOYMENT"
echo "===================================================================="

# 1. Update OS package list
echo "📦 Step 1/6: Updating Ubuntu system packages..."
sudo apt update -y

# 2. Install Node.js 20.x LTS if not installed
if ! command -v node &> /dev/null; then
    echo "🟢 Step 2/6: Installing Node.js 20.x LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs build-essential
else
    echo "✓ Node.js $(node -v) is already installed."
fi

# 3. Install PM2 process manager globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "🚀 Step 3/6: Installing PM2 Process Manager globally..."
    sudo npm install -g pm2
    sudo pm2 startup systemd -u $USER --hp $HOME
else
    echo "✓ PM2 is already installed."
fi

# 4. Install Nginx and Certbot if not installed
echo "🌐 Step 4/6: Checking Nginx and Certbot..."
sudo apt install -y nginx certbot python3-certbot-nginx

# 5. Install project dependencies & build production frontend
echo "🔨 Step 5/6: Installing dependencies and building production bundle..."
mkdir -p logs
npm install
npm run build

# Start or reload backend application via PM2
echo "⚡ Starting Jonak Backend via PM2..."
pm2 startOrReload ecosystem.config.cjs --env production
pm2 save

# 6. Configure Nginx Reverse Proxy
echo "🔧 Step 6/6: Configuring Nginx Reverse Proxy..."
sudo cp nginx-jonakhotelgroup.conf /etc/nginx/sites-available/jonakhotelgroup.conf
sudo ln -sf /etc/nginx/sites-available/jonakhotelgroup.conf /etc/nginx/sites-enabled/jonakhotelgroup.conf

# Remove default nginx site if active
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm -f /etc/nginx/sites-enabled/default
fi

# Test Nginx syntax
sudo nginx -t

# Reload Nginx service
sudo systemctl reload nginx
sudo systemctl enable nginx

# Configure basic firewall rules if ufw is active
if sudo ufw status | grep -q "Status: active"; then
    echo "🛡️ Configuring UFW Firewall for HTTP/HTTPS/SSH..."
    sudo ufw allow 'Nginx Full'
    sudo ufw allow OpenSSH
fi

echo ""
echo "===================================================================="
echo "🎉 DEPLOYMENT COMPLETE & REAL-TIME SERVER IS RUNNING!"
echo "===================================================================="
echo "📡 Local Application Status:"
pm2 status jonak-hotel-app
echo ""
echo "🔐 NEXT STEP: INSTALL FREE LET'S ENCRYPT SSL CERTIFICATE (HTTPS)"
echo "Run the following command on your EC2 terminal:"
echo ""
echo "  sudo certbot --nginx -d jonakhotelgroup.in -d www.jonakhotelgroup.in"
echo ""
echo "Certbot will automatically configure HTTPS SSL and set up auto-renewal."
echo "===================================================================="
