#!/bin/bash

# Wanwa Setup Script - Initial project setup
# Usage: ./scripts/setup.sh

set -e

echo "🛠️  Configuration initiale de Wanwa"
echo "===================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Node.js version
echo "Vérification de Node.js..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${YELLOW}⚠${NC}  Node.js 18+ requis. Version actuelle: $(node -v)"
  exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node -v)"

# Install dependencies
echo ""
echo "📦 Installation des dépendances..."
npm install
echo -e "${GREEN}✓${NC} Dépendances installées"

# Setup environment variables
echo ""
echo "🔧 Configuration des variables d'environnement..."
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "${GREEN}✓${NC} Fichier .env créé"
  echo -e "${YELLOW}⚠${NC}  IMPORTANT: Éditer .env avec vos credentials Supabase"
else
  echo -e "${YELLOW}⚠${NC}  .env existe déjà, non modifié"
fi

# Install Supabase CLI
echo ""
read -p "Installer Supabase CLI? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✓${NC} Supabase CLI déjà installé"
  else
    npm install -g supabase
    echo -e "${GREEN}✓${NC} Supabase CLI installé"
  fi
fi

# Supabase setup
echo ""
read -p "Configurer Supabase maintenant? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Login Supabase..."
  supabase login

  echo ""
  read -p "Project ID Supabase: " PROJECT_ID
  supabase link --project-ref "$PROJECT_ID"

  echo -e "${GREEN}✓${NC} Supabase configuré"
fi

# Summary
echo ""
echo "===================================="
echo -e "${GREEN}✓${NC} Configuration terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Éditer .env avec vos credentials"
echo "  2. Déployer les migrations: npm run supabase:deploy"
echo "  3. Lancer le dev server: npm run dev"
echo ""
