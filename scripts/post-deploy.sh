#!/bin/bash

# Wanwa - Post-Deployment Script
# Runs after successful deployment on Coolify

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Wanwa - Post-Deployment Tasks             ${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

# 1. Health Check
echo -e "${BLUE}[1/7]${NC} Running health check..."
HEALTH_URL="${FRONTEND_URL:-http://localhost}/health"

for i in {1..30}; do
  if curl -f -s "$HEALTH_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Application is healthy"
    break
  fi

  if [ $i -eq 30 ]; then
    echo -e "${RED}✗${NC} Health check failed after 30 attempts"
    exit 1
  fi

  echo -e "${YELLOW}⏳${NC} Waiting for application to start... ($i/30)"
  sleep 2
done

# 2. Check Supabase Connection
echo ""
echo -e "${BLUE}[2/7]${NC} Verifying Supabase connection..."

if [ -n "$VITE_SUPABASE_URL" ] && [ -n "$VITE_SUPABASE_ANON_KEY" ]; then
  SUPABASE_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${VITE_SUPABASE_URL}/rest/v1/" \
    -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}")

  if [ "$SUPABASE_HEALTH" = "200" ]; then
    echo -e "${GREEN}✓${NC} Supabase connection verified"
  else
    echo -e "${YELLOW}⚠${NC}  Supabase connection warning (HTTP $SUPABASE_HEALTH)"
  fi
else
  echo -e "${YELLOW}⚠${NC}  Supabase credentials not configured"
fi

# 3. Database Migrations Status
echo ""
echo -e "${BLUE}[3/7]${NC} Checking database migrations..."

if command -v supabase &> /dev/null; then
  if [ -n "$SUPABASE_PROJECT_ID" ]; then
    echo -e "${BLUE}➜${NC} Database migrations should be run manually:"
    echo "   supabase db push"
  else
    echo -e "${YELLOW}⚠${NC}  SUPABASE_PROJECT_ID not set"
  fi
else
  echo -e "${YELLOW}⚠${NC}  Supabase CLI not available in container"
fi

# 4. Edge Functions Status
echo ""
echo -e "${BLUE}[4/7]${NC} Checking Edge Functions deployment..."

if command -v supabase &> /dev/null; then
  if [ -n "$SUPABASE_PROJECT_ID" ]; then
    echo -e "${BLUE}➜${NC} Edge Functions should be deployed manually:"
    echo "   supabase functions deploy"
  fi
else
  echo -e "${YELLOW}⚠${NC}  Supabase CLI not available"
fi

# 5. Clear Cache
echo ""
echo -e "${BLUE}[5/7]${NC} Clearing cache..."

if [ -d "/var/cache/nginx" ]; then
  rm -rf /var/cache/nginx/*
  echo -e "${GREEN}✓${NC} Nginx cache cleared"
fi

if command -v redis-cli &> /dev/null; then
  if [ -n "$REDIS_PASSWORD" ]; then
    redis-cli -a "$REDIS_PASSWORD" FLUSHALL > /dev/null 2>&1 && \
      echo -e "${GREEN}✓${NC} Redis cache cleared"
  else
    redis-cli FLUSHALL > /dev/null 2>&1 && \
      echo -e "${GREEN}✓${NC} Redis cache cleared"
  fi
fi

# 6. Log Rotation
echo ""
echo -e "${BLUE}[6/7]${NC} Setting up log rotation..."

LOG_DIR="/var/log/nginx"
if [ -d "$LOG_DIR" ]; then
  # Keep only last 7 days of logs
  find "$LOG_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true
  echo -e "${GREEN}✓${NC} Old logs cleaned (keeping 7 days)"
fi

# 7. Send Deployment Notification
echo ""
echo -e "${BLUE}[7/7]${NC} Sending deployment notification..."

DEPLOYMENT_INFO=$(cat <<EOF
{
  "deployment": {
    "status": "success",
    "timestamp": "$(date -Iseconds)",
    "environment": "${ENVIRONMENT:-production}",
    "version": "${VERSION:-latest}",
    "url": "${FRONTEND_URL}",
    "commit": "${GIT_COMMIT:-unknown}",
    "branch": "${GIT_BRANCH:-main}"
  }
}
EOF
)

# Send to Slack if configured
if [ -n "$SLACK_WEBHOOK_URL" ]; then
  SLACK_MESSAGE=$(cat <<EOF
{
  "text": "🚀 Wanwa Deployment Successful",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚀 Wanwa Deployed Successfully"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Environment:*\n${ENVIRONMENT:-production}"
        },
        {
          "type": "mrkdwn",
          "text": "*Version:*\n${VERSION:-latest}"
        },
        {
          "type": "mrkdwn",
          "text": "*Time:*\n$(date '+%Y-%m-%d %H:%M:%S')"
        },
        {
          "type": "mrkdwn",
          "text": "*URL:*\n<${FRONTEND_URL}|Open App>"
        }
      ]
    }
  ]
}
EOF
  )

  curl -X POST "$SLACK_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$SLACK_MESSAGE" > /dev/null 2>&1 && \
    echo -e "${GREEN}✓${NC} Slack notification sent"
fi

# Send email if configured
if [ -n "$NOTIFICATION_EMAIL" ] && [ -n "$SENDGRID_API_KEY" ]; then
  curl -X POST "https://api.sendgrid.com/v3/mail/send" \
    -H "Authorization: Bearer $SENDGRID_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"personalizations\": [{\"to\": [{\"email\": \"$NOTIFICATION_EMAIL\"}]}],
      \"from\": {\"email\": \"deploy@wanwa.app\"},
      \"subject\": \"Wanwa Deployment Successful - ${ENVIRONMENT}\",
      \"content\": [{
        \"type\": \"text/html\",
        \"value\": \"<h2>Deployment Successful</h2><p>Version: ${VERSION}<br>Environment: ${ENVIRONMENT}<br>Time: $(date)</p><p><a href='${FRONTEND_URL}'>Open Application</a></p>\"
      }]
    }" > /dev/null 2>&1 && \
    echo -e "${GREEN}✓${NC} Email notification sent"
fi

# 8. Final Status Report
echo ""
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓${NC} Post-deployment tasks completed!"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

echo -e "${BLUE}Deployment Summary:${NC}"
echo "  - Status: ${GREEN}SUCCESS${NC}"
echo "  - Environment: ${ENVIRONMENT:-production}"
echo "  - Version: ${VERSION:-latest}"
echo "  - URL: ${FRONTEND_URL}"
echo "  - Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Access the application: ${FRONTEND_URL}"
echo "  2. Verify all features are working"
echo "  3. Check logs: docker logs wanwa-app"
echo "  4. Monitor health: ${FRONTEND_URL}/health"
echo ""

echo -e "${BLUE}Manual Tasks (if not done):${NC}"
echo "  - Deploy Edge Functions: supabase functions deploy"
echo "  - Run migrations: supabase db push"
echo "  - Seed data (if needed): ./scripts/seed-data.sh"
echo ""

# Exit successfully
exit 0
