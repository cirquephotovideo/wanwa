#!/bin/bash

# Wanwa - Supabase Initialization Script
# Complete setup for new Supabase projects

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Wanwa - Supabase Initialization Script  ${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo -e "${RED}✗${NC} Supabase CLI is not installed"
  echo -e "${YELLOW}➜${NC} Install with: npm install -g supabase"
  exit 1
fi

echo -e "${GREEN}✓${NC} Supabase CLI detected"

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}⚠${NC}  .env file not found"
  if [ -f ".env.example" ]; then
    echo -e "${BLUE}➜${NC} Copying .env.example to .env"
    cp .env.example .env
    echo -e "${GREEN}✓${NC} Created .env file"
    echo -e "${YELLOW}⚠${NC}  Please edit .env with your Supabase credentials"
    echo ""
  else
    echo -e "${RED}✗${NC} .env.example not found"
    exit 1
  fi
fi

# Load environment variables
source .env

# Check required environment variables
required_vars=(
  "VITE_SUPABASE_URL"
  "VITE_SUPABASE_ANON_KEY"
  "SUPABASE_PROJECT_ID"
)

echo -e "${BLUE}➜${NC} Checking environment variables..."
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo -e "${RED}✗${NC} Missing required variable: ${var}"
    echo -e "${YELLOW}➜${NC} Please set ${var} in .env file"
    exit 1
  fi
done
echo -e "${GREEN}✓${NC} All required environment variables are set"
echo ""

# Ask user what to set up
echo -e "${BLUE}What would you like to set up?${NC}"
echo "  1) Link to existing Supabase project"
echo "  2) Initialize local Supabase (Docker required)"
echo "  3) Run migrations on remote project"
echo "  4) Deploy Edge Functions"
echo "  5) Set Edge Function secrets"
echo "  6) Full setup (all of the above)"
echo ""
read -p "Enter your choice (1-6): " choice

link_project() {
  echo ""
  echo -e "${BLUE}➜${NC} Linking to Supabase project..."

  if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
    export SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN
    supabase link --project-ref "$SUPABASE_PROJECT_ID"
  else
    echo -e "${YELLOW}⚠${NC}  No SUPABASE_ACCESS_TOKEN found in .env"
    echo -e "${BLUE}➜${NC} You will be prompted to login"
    supabase login
    supabase link --project-ref "$SUPABASE_PROJECT_ID"
  fi

  echo -e "${GREEN}✓${NC} Successfully linked to project $SUPABASE_PROJECT_ID"
}

init_local() {
  echo ""
  echo -e "${BLUE}➜${NC} Initializing local Supabase..."

  # Check if Docker is running
  if ! docker info &> /dev/null; then
    echo -e "${RED}✗${NC} Docker is not running"
    echo -e "${YELLOW}➜${NC} Please start Docker and try again"
    exit 1
  fi

  supabase start
  echo -e "${GREEN}✓${NC} Local Supabase is running"
  echo ""
  echo -e "${BLUE}➜${NC} Local Supabase URLs:"
  supabase status
}

run_migrations() {
  echo ""
  echo -e "${BLUE}➜${NC} Running database migrations..."

  # Count migration files
  migration_count=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
  echo -e "${BLUE}➜${NC} Found $migration_count migration files"

  if [ $migration_count -eq 0 ]; then
    echo -e "${YELLOW}⚠${NC}  No migration files found in supabase/migrations/"
    return
  fi

  supabase db push
  echo -e "${GREEN}✓${NC} Migrations applied successfully"
}

deploy_functions() {
  echo ""
  echo -e "${BLUE}➜${NC} Deploying Edge Functions..."

  # Count Edge Functions
  function_count=$(ls -1d supabase/functions/*/ 2>/dev/null | wc -l)
  echo -e "${BLUE}➜${NC} Found $function_count Edge Functions"

  if [ $function_count -eq 0 ]; then
    echo -e "${YELLOW}⚠${NC}  No Edge Functions found in supabase/functions/"
    return
  fi

  # Deploy all functions
  supabase functions deploy
  echo -e "${GREEN}✓${NC} Edge Functions deployed successfully"
}

set_secrets() {
  echo ""
  echo -e "${BLUE}➜${NC} Setting Edge Function secrets..."

  # Set secrets if they exist in .env
  if [ -n "$AMAZON_CLIENT_ID" ]; then
    supabase secrets set AMAZON_CLIENT_ID="$AMAZON_CLIENT_ID"
    echo -e "${GREEN}✓${NC} Set AMAZON_CLIENT_ID"
  fi

  if [ -n "$AMAZON_CLIENT_SECRET" ]; then
    supabase secrets set AMAZON_CLIENT_SECRET="$AMAZON_CLIENT_SECRET"
    echo -e "${GREEN}✓${NC} Set AMAZON_CLIENT_SECRET"
  fi

  if [ -n "$FRONTEND_URL" ]; then
    supabase secrets set FRONTEND_URL="$FRONTEND_URL"
    echo -e "${GREEN}✓${NC} Set FRONTEND_URL"
  fi

  if [ -n "$OPENAI_API_KEY" ]; then
    supabase secrets set OPENAI_API_KEY="$OPENAI_API_KEY"
    echo -e "${GREEN}✓${NC} Set OPENAI_API_KEY"
  fi

  if [ -n "$ANTHROPIC_API_KEY" ]; then
    supabase secrets set ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
    echo -e "${GREEN}✓${NC} Set ANTHROPIC_API_KEY"
  fi

  echo -e "${GREEN}✓${NC} Secrets configured"
}

# Execute based on user choice
case $choice in
  1)
    link_project
    ;;
  2)
    init_local
    ;;
  3)
    link_project
    run_migrations
    ;;
  4)
    link_project
    deploy_functions
    ;;
  5)
    link_project
    set_secrets
    ;;
  6)
    link_project
    run_migrations
    deploy_functions
    set_secrets
    echo ""
    echo -e "${BLUE}➜${NC} Do you want to initialize local Supabase too? (y/n)"
    read -p "> " init_local_choice
    if [ "$init_local_choice" = "y" ]; then
      init_local
    fi
    ;;
  *)
    echo -e "${RED}✗${NC} Invalid choice"
    exit 1
    ;;
esac

echo ""
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓${NC} Supabase setup completed!"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Verify migrations: supabase db diff"
echo "  2. Check functions: supabase functions list"
echo "  3. View logs: supabase functions logs"
echo "  4. Test locally: npm run dev"
echo ""
