# Deployment Guide

## Table des Matières

- [Prérequis](#prérequis)
- [Déploiement Initial](#déploiement-initial)
- [Déploiement des Edge Functions](#déploiement-des-edge-functions)
- [Configuration Production](#configuration-production)
- [CI/CD avec GitHub Actions](#cicd-avec-github-actions)
- [Monitoring Production](#monitoring-production)
- [Rollback](#rollback)

---

## Prérequis

### Comptes Nécessaires

- ✅ Compte [Supabase](https://supabase.com/) (Pro plan recommandé)
- ✅ Compte [Lovable.dev](https://lovable.dev/) (pour déploiement IA)
- ✅ Compte [Amazon Seller Central](https://sellercentral.amazon.com/) (optionnel)
- ✅ Compte [Stripe](https://stripe.com/) (pour paiements)

### Outils Requis

```bash
# Node.js 18+
node --version  # v18.0.0 ou supérieur

# Supabase CLI
npm install -g supabase

# Vite (build tool)
npm install -g vite
```

---

## Déploiement Initial

### 1. Configuration Supabase Project

```bash
# 1. Créer un nouveau projet sur Supabase Dashboard
# 2. Noter les credentials (URL, anon key, service_role key)

# 3. Lier le projet local
supabase login
supabase link --project-ref your-project-id

# 4. Initialiser la base de données
supabase db reset  # Applique toutes les migrations
```

### 2. Configuration des Variables d'Environnement

```bash
# Créer .env.production
cat > .env.production << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_APP_URL=https://your-domain.com
NODE_ENV=production
EOF
```

### 3. Configuration des Secrets Supabase

```bash
# Amazon SP-API
supabase secrets set AMAZON_CLIENT_ID="amzn1.application-oa2-client.xxx"
supabase secrets set AMAZON_CLIENT_SECRET="amzn1.oa2-cs.v1.xxx"

# AI Providers (fallback)
supabase secrets set OPENAI_API_KEY="sk-xxx"
supabase secrets set ANTHROPIC_API_KEY="sk-ant-xxx"

# Email
supabase secrets set SMTP_HOST="smtp.gmail.com"
supabase secrets set SMTP_USER="noreply@yourdomain.com"
supabase secrets set SMTP_PASSWORD="your-app-password"

# Stripe
supabase secrets set STRIPE_SECRET_KEY="sk_live_xxx"
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_xxx"

# Vérifier
supabase secrets list
```

---

## Déploiement des Edge Functions

### Déploiement Complet

```bash
# Déployer toutes les fonctions
supabase functions deploy

# Vérifier le déploiement
supabase functions list
```

### Déploiement Sélectif

```bash
# Déployer une fonction spécifique
supabase functions deploy email-imap-poller

# Déployer plusieurs fonctions
supabase functions deploy email-imap-poller \
  process-enrichment-queue \
  amazon-oauth-start
```

### Vérification du Déploiement

```bash
# Test d'une fonction
curl -X POST https://your-project.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# Voir les logs en temps réel
supabase functions logs email-imap-poller --follow
```

---

## Configuration Production

### 1. Sécurité

#### Activer RLS sur Toutes les Tables

```sql
-- Script à exécuter dans Supabase SQL Editor
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    RAISE NOTICE 'RLS enabled on %', tbl;
  END LOOP;
END $$;
```

#### Configurer CORS

```sql
-- Dans Supabase Dashboard → API Settings → CORS
-- Ajouter votre domaine production
https://your-domain.com
```

#### Rate Limiting

```sql
-- Configurer dans Edge Functions
import { RateLimiter } from './utils/rate-limiter.ts';

const limiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests par window
});
```

### 2. Performance

#### Activer le Cache

```typescript
// Dans supabase/functions/_shared/cache.ts
import { Redis } from '@upstash/redis';

export const cache = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_URL'),
  token: Deno.env.get('UPSTASH_REDIS_TOKEN')
});

// Utilisation
const cachedData = await cache.get(`product:${id}`);
if (cachedData) return cachedData;

const data = await fetchData();
await cache.setex(`product:${id}`, 3600, data);
```

#### Optimiser les Indexes

```sql
-- Indexes pour recherche rapide
CREATE INDEX idx_product_analyses_ean ON product_analyses(ean);
CREATE INDEX idx_product_analyses_enrichment_status ON product_analyses USING GIN(enrichment_status);
CREATE INDEX idx_supplier_products_supplier_id ON supplier_products(supplier_id);

-- Index pour exports
CREATE INDEX idx_product_analyses_exported ON product_analyses USING GIN(exported_to_platforms);

-- Index pour queue
CREATE INDEX idx_enrichment_queue_status ON enrichment_queue(status, priority DESC);
```

### 3. Monitoring

#### Configurer Sentry

```typescript
// src/lib/sentry.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### Configurer Logs Aggregation

```bash
# Installer Logtail ou similaire
npm install @logtail/node

# Dans Edge Functions
import { Logtail } from '@logtail/edge';
const logtail = new Logtail(Deno.env.get('LOGTAIL_TOKEN'));

logtail.info('Function executed', { userId, duration });
```

---

## CI/CD avec GitHub Actions

### Workflow Complet

Créer `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run linting
        run: npm run lint

      - name: Type check
        run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy-functions:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Link project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Deploy Edge Functions
        run: supabase functions deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  deploy-frontend:
    needs: deploy-functions
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Configuration des Secrets GitHub

```bash
# Dans GitHub → Settings → Secrets and variables → Actions
# Ajouter :
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_PROJECT_ID
SUPABASE_ACCESS_TOKEN
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

---

## Monitoring Production

### 1. Dashboard Supabase

```sql
-- Vue pour métriques temps réel
CREATE VIEW production_metrics AS
SELECT
  'active_users' as metric,
  COUNT(DISTINCT user_id) as value
FROM auth.users
WHERE last_sign_in_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT
  'total_products',
  COUNT(*)
FROM product_analyses
UNION ALL
SELECT
  'pending_enrichments',
  COUNT(*)
FROM enrichment_queue
WHERE status = 'pending';
```

### 2. Alertes Automatiques

```typescript
// supabase/functions/monitoring-alerts/index.ts
import { sendAlert } from '../_shared/alerts.ts';

// Vérifier queue bloquée
const stuckJobs = await supabase
  .from('enrichment_queue')
  .select('*')
  .eq('status', 'processing')
  .lt('updated_at', new Date(Date.now() - 30 * 60 * 1000));

if (stuckJobs.data.length > 10) {
  await sendAlert({
    severity: 'high',
    message: `${stuckJobs.data.length} enrichment jobs stuck`,
    channel: 'slack'
  });
}
```

### 3. Health Checks

```typescript
// supabase/functions/health-check/index.ts
export async function healthCheck() {
  const checks = {
    database: await checkDatabase(),
    storage: await checkStorage(),
    edge_functions: await checkEdgeFunctions(),
    amazon_api: await checkAmazonAPI(),
    ai_providers: await checkAIProviders()
  };

  const allHealthy = Object.values(checks).every(c => c.status === 'ok');

  return {
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  };
}
```

---

## Rollback

### Rollback Edge Functions

```bash
# Lister les versions
supabase functions list --with-versions email-imap-poller

# Rollback vers version précédente
supabase functions deploy email-imap-poller --version v2

# Ou redéployer depuis git
git checkout <previous-commit>
supabase functions deploy
git checkout main
```

### Rollback Database

```bash
# Lister les migrations
supabase db list

# Rollback dernière migration
supabase db reset --to <previous-migration-timestamp>

# Backup manuel
pg_dump -h db.your-project.supabase.co \
  -U postgres -d postgres > backup.sql

# Restore
psql -h db.your-project.supabase.co \
  -U postgres -d postgres < backup.sql
```

### Rollback Frontend

```bash
# Si déployé sur Vercel
vercel rollback <deployment-url>

# Ou redéployer version précédente
git checkout <previous-commit>
npm run build
vercel --prod
git checkout main
```

---

## Checklist Pré-Déploiement

- [ ] Tests unitaires passent (`npm test`)
- [ ] Tests E2E passent (`npm run test:e2e`)
- [ ] Linting sans erreurs (`npm run lint`)
- [ ] Type checking OK (`npm run type-check`)
- [ ] RLS activé sur toutes les tables
- [ ] Secrets configurés dans Supabase
- [ ] CORS configuré correctement
- [ ] Rate limiting activé
- [ ] Backup automatique configuré
- [ ] Monitoring configuré (Sentry, logs)
- [ ] Alertes configurées (Slack, email)
- [ ] Documentation à jour
- [ ] Changelog mis à jour

---

## Support Production

### Escalation Matrix

| Gravité | Temps de Réponse | Contact |
|---------|------------------|---------|
| 🔴 Critical | 15 minutes | on-call@wanwa.app |
| 🟠 High | 1 heure | support@wanwa.app |
| 🟡 Medium | 4 heures | support@wanwa.app |
| 🟢 Low | 24 heures | support@wanwa.app |

### Runbooks

- [Database Performance Issues](./runbooks/db-performance.md)
- [Edge Function Failures](./runbooks/edge-function-failures.md)
- [Amazon API Rate Limits](./runbooks/amazon-rate-limits.md)
- [AI Provider Outages](./runbooks/ai-provider-outages.md)

---

## Maintenance Windows

Maintenance planifiée tous les **dimanches 02h00-04h00 UTC**

Notifications envoyées 48h à l'avance via :
- Email (tous les utilisateurs)
- Status page (https://status.wanwa.app)
- Discord (#announcements)

---

*Dernière mise à jour : 2025-10-30*
