#!/bin/bash

# Wanwa - Database Migration Script
# Run and manage Supabase migrations

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Wanwa - Database Migration Manager      ${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo -e "${RED}✗${NC} Supabase CLI is not installed"
  exit 1
fi

# Menu
echo "What would you like to do?"
echo "  1) View migration status"
echo "  2) Run pending migrations"
echo "  3) Create new migration"
echo "  4) Diff database schema"
echo "  5) Reset database (DESTRUCTIVE)"
echo "  6) Rollback last migration"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
  1)
    echo ""
    echo -e "${BLUE}➜${NC} Checking migration status..."
    echo ""

    # List all migrations
    echo -e "${BLUE}Available migrations:${NC}"
    ls -1 supabase/migrations/*.sql 2>/dev/null | while read migration; do
      filename=$(basename "$migration")
      echo "  - $filename"
    done

    echo ""
    echo -e "${BLUE}Applied migrations (remote):${NC}"
    supabase migration list
    ;;

  2)
    echo ""
    echo -e "${BLUE}➜${NC} Running pending migrations..."

    # Show what will be applied
    echo -e "${YELLOW}⚠${NC}  This will apply all pending migrations to the remote database"
    read -p "Continue? (y/n) " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${RED}✗${NC} Migration cancelled"
      exit 1
    fi

    # Apply migrations
    supabase db push
    echo ""
    echo -e "${GREEN}✓${NC} Migrations applied successfully"
    ;;

  3)
    echo ""
    read -p "Enter migration name (snake_case): " migration_name

    if [ -z "$migration_name" ]; then
      echo -e "${RED}✗${NC} Migration name cannot be empty"
      exit 1
    fi

    # Create new migration
    echo -e "${BLUE}➜${NC} Creating new migration: $migration_name"
    supabase migration new "$migration_name"

    # Get the created file
    latest_migration=$(ls -1t supabase/migrations/*.sql | head -1)
    echo -e "${GREEN}✓${NC} Migration created: $latest_migration"
    echo ""
    echo -e "${BLUE}➜${NC} Edit the migration file and add your SQL statements"
    ;;

  4)
    echo ""
    echo -e "${BLUE}➜${NC} Comparing local and remote schemas..."
    echo ""

    supabase db diff

    echo ""
    echo -e "${BLUE}➜${NC} Generate migration from diff?"
    read -p "Migration name (or press Enter to skip): " migration_name

    if [ -n "$migration_name" ]; then
      supabase db diff --use-migra --file "supabase/migrations/$(date +%Y%m%d%H%M%S)_${migration_name}.sql"
      echo -e "${GREEN}✓${NC} Migration file created"
    fi
    ;;

  5)
    echo ""
    echo -e "${RED}⚠  WARNING: This will DELETE ALL DATA in your local database!${NC}"
    echo -e "${RED}⚠  This operation is IRREVERSIBLE!${NC}"
    echo ""
    read -p "Type 'RESET' to confirm: " confirm

    if [ "$confirm" != "RESET" ]; then
      echo -e "${RED}✗${NC} Reset cancelled"
      exit 1
    fi

    echo ""
    echo -e "${BLUE}➜${NC} Resetting local database..."
    supabase db reset
    echo -e "${GREEN}✓${NC} Database reset complete"
    ;;

  6)
    echo ""
    echo -e "${BLUE}➜${NC} Rolling back last migration..."
    echo ""

    # Get last migration
    last_migration=$(ls -1t supabase/migrations/*.sql | head -1)

    if [ -z "$last_migration" ]; then
      echo -e "${RED}✗${NC} No migrations found"
      exit 1
    fi

    echo "Last migration: $(basename "$last_migration")"
    echo ""
    echo -e "${YELLOW}⚠${NC}  This will remove the migration file and reset local database"
    read -p "Continue? (y/n) " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${RED}✗${NC} Rollback cancelled"
      exit 1
    fi

    # Backup migration file
    backup_dir="supabase/migrations/backup"
    mkdir -p "$backup_dir"
    cp "$last_migration" "$backup_dir/"
    echo -e "${GREEN}✓${NC} Migration backed up to $backup_dir"

    # Remove migration
    rm "$last_migration"
    echo -e "${GREEN}✓${NC} Migration file removed"

    # Reset local database
    echo -e "${BLUE}➜${NC} Resetting local database..."
    supabase db reset
    echo -e "${GREEN}✓${NC} Rollback complete"
    ;;

  *)
    echo -e "${RED}✗${NC} Invalid choice"
    exit 1
    ;;
esac

echo ""
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓${NC} Operation completed"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""
