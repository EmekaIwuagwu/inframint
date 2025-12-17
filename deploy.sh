#!/bin/bash

# InfraMint Deployment Script for Linux (DigitalOcean)

echo "🚀 Starting InfraMint Deployment..."

# 1. Update System
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# 2. Install Docker & Docker Compose (if not present)
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
fi

if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    apt-get install -y docker-compose-plugin
fi

# 3. Setup Environment Variables
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    PUBLIC_IP=$(curl -s ifconfig.me)
    echo "🌍 Detected Public IP: $PUBLIC_IP"
    
    cat <<EOT >> .env
POSTGRES_USER=inframint_user
POSTGRES_PASSWORD=$(openssl rand -hex 12)
POSTGRES_DB=inframint_db
JWT_SECRET=$(openssl rand -hex 32)
DOMAIN_NAME=$PUBLIC_IP
VITE_API_URL=http://$PUBLIC_IP:8000
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
CONTRACT_ADDRESS=0x_mock_address
EOT
    echo "✅ Generated secure credentials in .env"
fi

# Ensure VITE_API_URL is available for variable substitution
source .env

# 4. Build and Run containers
echo "🏗️ Building and Starting Containers..."
echo "Using VITE_API_URL: $VITE_API_URL"
docker compose up -d --build

echo "✨ Deployment Complete!"
echo "🌍 Frontend: http://$DOMAIN_NAME"
echo "⚙️ Backend: http://$DOMAIN_NAME:8000"
