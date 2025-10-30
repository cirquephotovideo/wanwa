#!/bin/bash

# Wanwa - Coolify Setup Script
# Automated installation and configuration for Coolify on Hostinger KVM

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Wanwa - Coolify Installation Script      ${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}✗${NC} Please run as root or with sudo"
  exit 1
fi

# Check system requirements
echo -e "${BLUE}➜${NC} Checking system requirements..."

# Check CPU cores
CPU_CORES=$(nproc)
if [ "$CPU_CORES" -lt 2 ]; then
  echo -e "${YELLOW}⚠${NC}  Warning: Less than 2 CPU cores detected. Recommended: 2+"
fi

# Check RAM
TOTAL_RAM=$(free -g | awk '/^Mem:/{print $2}')
if [ "$TOTAL_RAM" -lt 4 ]; then
  echo -e "${YELLOW}⚠${NC}  Warning: Less than 4GB RAM detected. Recommended: 4GB+"
fi

# Check disk space
DISK_SPACE=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$DISK_SPACE" -lt 20 ]; then
  echo -e "${YELLOW}⚠${NC}  Warning: Less than 20GB free disk space. Recommended: 20GB+"
fi

echo -e "${GREEN}✓${NC} System requirements checked"
echo ""

# Ask for installation type
echo -e "${BLUE}Select installation type:${NC}"
echo "  1) Fresh Coolify installation (recommended for new servers)"
echo "  2) Deploy to existing Coolify"
echo "  3) Local development setup"
echo ""
read -p "Enter your choice (1-3): " INSTALL_TYPE

case $INSTALL_TYPE in
  1)
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Installing Coolify                        ${NC}"
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
    echo ""

    # Install Coolify
    echo -e "${BLUE}➜${NC} Installing Coolify..."
    curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

    echo -e "${GREEN}✓${NC} Coolify installed successfully"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Access Coolify at: http://$(hostname -I | awk '{print $1}'):8000"
    echo "  2. Complete the initial setup"
    echo "  3. Create a new application"
    echo "  4. Connect your Git repository"
    echo "  5. Re-run this script with option 2"
    echo ""
    ;;

  2)
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Configuring Wanwa for Coolify             ${NC}"
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
    echo ""

    # Check if Coolify is installed
    if ! command -v coolify &> /dev/null; then
      echo -e "${RED}✗${NC} Coolify is not installed. Please run option 1 first."
      exit 1
    fi

    # Collect configuration
    echo -e "${BLUE}➜${NC} Please provide the following information:"
    echo ""

    read -p "Domain name (e.g., wanwa.example.com): " DOMAIN
    read -p "Admin email: " ADMIN_EMAIL
    read -p "Supabase Project URL: " SUPABASE_URL
    read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
    read -sp "Supabase Service Role Key: " SUPABASE_SERVICE_KEY
    echo ""
    read -p "Supabase Project ID: " SUPABASE_PROJECT_ID

    echo ""
    echo -e "${BLUE}➜${NC} Optional configurations (press Enter to skip):"
    echo ""

    read -p "Amazon Client ID (optional): " AMAZON_CLIENT_ID
    read -sp "Amazon Client Secret (optional): " AMAZON_CLIENT_SECRET
    echo ""
    read -sp "Gemini API Key (optional): " GEMINI_API_KEY
    echo ""
    read -sp "OpenAI API Key (optional): " OPENAI_API_KEY
    echo ""
    read -sp "Anthropic API Key (optional): " ANTHROPIC_API_KEY
    echo ""

    # Create .env file
    echo -e "${BLUE}➜${NC} Creating .env file..."
    cat > .env <<EOF
# Wanwa Environment Configuration for Coolify
# Generated on $(date)

# Application
NODE_ENV=production
FRONTEND_URL=https://${DOMAIN}
DOMAIN=${DOMAIN}
ADMIN_EMAIL=${ADMIN_EMAIL}

# Supabase
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY}
SUPABASE_PROJECT_ID=${SUPABASE_PROJECT_ID}

# Amazon SP-API (Optional)
${AMAZON_CLIENT_ID:+AMAZON_CLIENT_ID=${AMAZON_CLIENT_ID}}
${AMAZON_CLIENT_SECRET:+AMAZON_CLIENT_SECRET=${AMAZON_CLIENT_SECRET}}

# AI Providers (Optional)
${GEMINI_API_KEY:+GEMINI_API_KEY=${GEMINI_API_KEY}}
${OPENAI_API_KEY:+OPENAI_API_KEY=${OPENAI_API_KEY}}
${ANTHROPIC_API_KEY:+ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}}

# Redis
REDIS_PASSWORD=$(openssl rand -base64 32)

# Version
VERSION=latest
ENVIRONMENT=production
EOF

    echo -e "${GREEN}✓${NC} .env file created"

    # Create Coolify environment variables script
    echo -e "${BLUE}➜${NC} Generating Coolify environment variables..."
    cat > coolify-env.txt <<EOF
# Copy these environment variables to your Coolify application settings:
# Application → Environment Variables

NODE_ENV=production
FRONTEND_URL=https://${DOMAIN}
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY}
SUPABASE_PROJECT_ID=${SUPABASE_PROJECT_ID}
${AMAZON_CLIENT_ID:+AMAZON_CLIENT_ID=${AMAZON_CLIENT_ID}}
${AMAZON_CLIENT_SECRET:+AMAZON_CLIENT_SECRET=${AMAZON_CLIENT_SECRET}}
${GEMINI_API_KEY:+GEMINI_API_KEY=${GEMINI_API_KEY}}
${OPENAI_API_KEY:+OPENAI_API_KEY=${OPENAI_API_KEY}}
${ANTHROPIC_API_KEY:+ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}}
EOF

    echo -e "${GREEN}✓${NC} Environment variables saved to coolify-env.txt"

    # Setup firewall
    echo -e "${BLUE}➜${NC} Configuring firewall..."
    if command -v ufw &> /dev/null; then
      ufw allow 80/tcp
      ufw allow 443/tcp
      ufw allow 8000/tcp # Coolify dashboard
      ufw --force enable
      echo -e "${GREEN}✓${NC} Firewall configured"
    else
      echo -e "${YELLOW}⚠${NC}  UFW not found, skipping firewall setup"
    fi

    # Setup SSL
    echo -e "${BLUE}➜${NC} Do you want to setup SSL with Let's Encrypt? (y/n)"
    read -p "> " SETUP_SSL

    if [ "$SETUP_SSL" = "y" ]; then
      if ! command -v certbot &> /dev/null; then
        echo -e "${BLUE}➜${NC} Installing Certbot..."
        apt-get update
        apt-get install -y certbot
      fi

      echo -e "${BLUE}➜${NC} Certbot installed. Configure SSL in Coolify dashboard."
    fi

    echo ""
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓${NC} Configuration completed!"
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Go to Coolify dashboard: http://$(hostname -I | awk '{print $1}'):8000"
    echo "  2. Create a new application or select existing"
    echo "  3. Set the repository: https://github.com/cirquephotovideo/wanwa"
    echo "  4. Copy environment variables from: coolify-env.txt"
    echo "  5. Set domain: ${DOMAIN}"
    echo "  6. Enable SSL/TLS"
    echo "  7. Deploy the application"
    echo ""
    echo -e "${BLUE}Post-deployment:${NC}"
    echo "  - Run Supabase setup: ./scripts/supabase-init.sh"
    echo "  - Deploy Edge Functions: supabase functions deploy"
    echo "  - Run migrations: ./scripts/migrate.sh"
    echo "  - Seed demo data (optional): ./scripts/seed-data.sh"
    echo ""
    ;;

  3)
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Local Development Setup                   ${NC}"
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
    echo ""

    # Check Node.js
    if ! command -v node &> /dev/null; then
      echo -e "${YELLOW}⚠${NC}  Node.js not found. Installing..."
      curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
      apt-get install -y nodejs
    fi

    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js ${NODE_VERSION} detected"

    # Check Docker
    if ! command -v docker &> /dev/null; then
      echo -e "${YELLOW}⚠${NC}  Docker not found. Installing..."
      curl -fsSL https://get.docker.com | bash
      systemctl start docker
      systemctl enable docker
    fi

    DOCKER_VERSION=$(docker -v)
    echo -e "${GREEN}✓${NC} ${DOCKER_VERSION} detected"

    # Install dependencies
    echo -e "${BLUE}➜${NC} Installing dependencies..."
    npm install

    # Copy .env.example
    if [ ! -f .env ]; then
      cp .env.example .env
      echo -e "${GREEN}✓${NC} .env file created from template"
      echo -e "${YELLOW}⚠${NC}  Please edit .env with your configuration"
    fi

    # Start local Supabase
    echo -e "${BLUE}➜${NC} Do you want to start local Supabase? (y/n)"
    read -p "> " START_SUPABASE

    if [ "$START_SUPABASE" = "y" ]; then
      if ! command -v supabase &> /dev/null; then
        echo -e "${BLUE}➜${NC} Installing Supabase CLI..."
        npm install -g supabase
      fi

      supabase start
      echo -e "${GREEN}✓${NC} Local Supabase started"
    fi

    echo ""
    echo -e "${GREEN}✓${NC} Development environment ready!"
    echo ""
    echo -e "${BLUE}Start development server:${NC}"
    echo "  npm run dev"
    echo ""
    echo -e "${BLUE}Run tests:${NC}"
    echo "  npm test"
    echo ""
    ;;

  *)
    echo -e "${RED}✗${NC} Invalid choice"
    exit 1
    ;;
esac

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓${NC} Setup completed!"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""
