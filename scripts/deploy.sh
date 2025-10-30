#!/bin/bash

# Wanwa Deployment Script for Coolify/Hostinger
# Usage: ./scripts/deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Déploiement Wanwa sur ${ENVIRONMENT}"
echo "======================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
  export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)
  echo -e "${GREEN}✓${NC} Variables d'environnement chargées"
else
  echo -e "${RED}✗${NC} Fichier .env.${ENVIRONMENT} non trouvé"
  exit 1
fi

# Check required variables
required_vars=(
  "VITE_SUPABASE_URL"
  "VITE_SUPABASE_ANON_KEY"
  "SUPABASE_PROJECT_ID"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo -e "${RED}✗${NC} Variable ${var} manquante"
    exit 1
  fi
done

echo -e "${GREEN}✓${NC} Variables d'environnement validées"

# Build application
echo ""
echo "📦 Build de l'application..."
npm run build
echo -e "${GREEN}✓${NC} Build terminé"

# Deploy to Coolify (if webhook URL is set)
if [ -n "$COOLIFY_WEBHOOK_URL" ]; then
  echo ""
  echo "🚢 Déclenchement du déploiement Coolify..."

  response=$(curl -X POST "$COOLIFY_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"branch\": \"$(git branch --show-current)\"}" \
    -w "%{http_code}" \
    -s -o /dev/null)

  if [ "$response" -eq 200 ]; then
    echo -e "${GREEN}✓${NC} Déploiement Coolify déclenché avec succès"
  else
    echo -e "${RED}✗${NC} Échec du déploiement (HTTP ${response})"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠${NC}  COOLIFY_WEBHOOK_URL non défini, déploiement manuel requis"
fi

# Deploy Supabase Edge Functions
echo ""
echo "⚡ Déploiement des Edge Functions..."

if command -v supabase &> /dev/null; then
  supabase functions deploy
  echo -e "${GREEN}✓${NC} Edge Functions déployées"
else
  echo -e "${YELLOW}⚠${NC}  Supabase CLI non installé, Edge Functions non déployées"
  echo "   Installer avec: npm install -g supabase"
fi

# Run database migrations
echo ""
echo "🗄️  Migration de la base de données..."

if command -v supabase &> /dev/null; then
  supabase db push
  echo -e "${GREEN}✓${NC} Migrations appliquées"
else
  echo -e "${YELLOW}⚠${NC}  Supabase CLI non installé, migrations non appliquées"
fi

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}✓${NC} Déploiement ${ENVIRONMENT} terminé avec succès!"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Vérifier l'application: https://your-domain.com"
echo "  2. Tester les Edge Functions"
echo "  3. Vérifier les logs Coolify"
echo ""
