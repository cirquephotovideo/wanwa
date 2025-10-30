# Configuration Guide

## Table des Matières

- [Variables d'Environnement](#variables-denvironnement)
- [Supabase Setup](#supabase-setup)
- [Edge Functions Configuration](#edge-functions-configuration)
- [Amazon SP-API OAuth](#amazon-sp-api-oauth)
- [AI Providers](#ai-providers)
- [Cron Jobs](#cron-jobs)
- [Platform Integrations](#platform-integrations)

---

## Variables d'Environnement

### Configuration de Base

Copier `.env.example` vers `.env` et configurer les valeurs :

```bash
cp .env.example .env
```

### Supabase (Obligatoire)

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=your-project-id
```

**Comment obtenir ces valeurs :**
1. Aller sur [Supabase Dashboard](https://app.supabase.com/)
2. Sélectionner votre projet
3. Settings → API → Project URL & anon/public key

---

## Supabase Setup

### 1. Créer les Tables

Exécuter les migrations SQL dans l'ordre :

```sql
-- 1. Tables de base
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Configurations fournisseurs
CREATE TABLE supplier_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  supplier_name TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('email', 'ftp', 'api', 'csv')),
  connection_config JSONB,
  column_mapping JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ... (voir ARCHITECTURE.md pour le schéma complet)
```

### 2. Activer Row Level Security (RLS)

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE product_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_configurations ENABLE ROW LEVEL SECURITY;

-- Policies pour users
CREATE POLICY "Users can view their own data"
ON product_analyses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data"
ON product_analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 3. Créer les Storage Buckets

```sql
-- Bucket pour images produits
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Bucket pour CSV imports
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-imports', 'supplier-imports', false);

-- Policies storage
CREATE POLICY "Users can upload their files"
ON storage.objects FOR INSERT
WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Edge Functions Configuration

### Déployer les Edge Functions

```bash
# 1. Installer Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Lier le projet
supabase link --project-ref your-project-id

# 4. Déployer toutes les fonctions
supabase functions deploy

# Ou déployer une fonction spécifique
supabase functions deploy email-imap-poller
```

### Configuration des Secrets

```bash
# Amazon SP-API
supabase secrets set AMAZON_CLIENT_ID="amzn1.application-oa2-client.xxx"
supabase secrets set AMAZON_CLIENT_SECRET="amzn1.oa2-cs.v1.xxx"

# AI Providers (optionnel, fallback uniquement)
supabase secrets set OPENAI_API_KEY="sk-xxx"
supabase secrets set ANTHROPIC_API_KEY="sk-ant-xxx"
supabase secrets set OLLAMA_BASE_URL="http://localhost:11434"

# Email (notifications)
supabase secrets set SMTP_HOST="smtp.gmail.com"
supabase secrets set SMTP_PORT="587"
supabase secrets set SMTP_USER="your-email@gmail.com"
supabase secrets set SMTP_PASSWORD="your-app-password"

# Stripe (paiements)
supabase secrets set STRIPE_SECRET_KEY="sk_live_xxx"
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_xxx"
```

### Vérifier les Secrets

```bash
supabase secrets list
```

---

## Amazon SP-API OAuth

### 1. Créer une Application Amazon

1. Aller sur [Amazon Seller Central Developer Console](https://developer-docs.amazon.com/sp-api/)
2. Créer une nouvelle application SP-API
3. Configurer les OAuth Redirect URIs :
   ```
   https://your-project.supabase.co/functions/v1/amazon-oauth-callback
   ```
4. Noter le **App ID** et **Client Secret**

### 2. Configurer dans l'Application

1. Aller sur `/admin/amazon-credentials`
2. Cliquer "Add Amazon Account"
3. Entrer :
   - **Application ID** : `amzn1.application-oa2-client.xxx`
   - **Region** : EU, NA, FE
4. Cliquer "Connect" → Redirection vers Amazon
5. Approuver l'accès
6. Tokens stockés automatiquement dans `amazon_credentials`

### 3. Rotation Automatique des Tokens

Le cron job `amazon-token-manager` s'exécute quotidiennement :

```toml
# supabase/config.toml
[functions.amazon-token-manager]
cron = "0 4 * * *"  # Tous les jours à 4h
```

---

## AI Providers

### Configuration Lovable AI (Primary)

**Aucune configuration nécessaire** - Lovable AI est intégré par défaut.

Modèles disponibles :
- `gemini-2.5-pro` (raisonnement complexe)
- `gemini-2.5-flash` (équilibré)
- `gemini-2.5-flash-lite` (rapide)
- `dall-e-3` (génération images)

### Fallback 1 : Ollama (Local)

```bash
# Installation Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Télécharger modèles
ollama pull llama3.2-vision
ollama pull mistral
ollama pull codellama

# Démarrer serveur
ollama serve

# Configurer URL
OLLAMA_BASE_URL=http://localhost:11434
```

### Fallback 2 : OpenAI

```bash
# Obtenir API key sur https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-xxx

# Configurer dans Supabase
supabase secrets set OPENAI_API_KEY="sk-xxx"
```

### Fallback 3 : Claude (Anthropic)

```bash
# Obtenir API key sur https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-xxx

# Configurer dans Supabase
supabase secrets set ANTHROPIC_API_KEY="sk-ant-xxx"
```

---

## Cron Jobs

### Configuration dans `supabase/config.toml`

```toml
# Import automatique emails
[functions.email-imap-scheduler]
cron = "*/15 * * * *"  # Toutes les 15 minutes

# Traitement queue enrichissement
[functions.process-enrichment-queue]
cron = "*/2 * * * *"  # Toutes les 2 minutes

# Synchronisation FTP
[functions.supplier-sync-scheduler]
cron = "*/30 * * * *"  # Toutes les 30 minutes

# Nettoyage emails anciens
[functions.cleanup-old-emails]
cron = "0 3 * * *"  # Tous les jours à 3h

# Rotation credentials Amazon
[functions.rotate-amazon-credentials]
cron = "0 4 * * *"  # Tous les jours à 4h

# Vérification expiration
[functions.check-amazon-credentials-expiry]
cron = "0 */6 * * *"  # Toutes les 6 heures

# Export automatique
[functions.auto-export-manager]
cron = "0 * * * *"  # Toutes les heures
```

### Monitoring des Cron Jobs

```sql
-- Vérifier dernière exécution
SELECT
  function_name,
  last_execution,
  status,
  error_message
FROM cron_job_logs
WHERE last_execution > NOW() - INTERVAL '1 day'
ORDER BY last_execution DESC;
```

---

## Platform Integrations

### Odoo

```bash
# Installation MCP Server
npm install -g odoo-mcp-server

# Configuration dans supplier_configurations
{
  "platform_type": "odoo",
  "connection_config": {
    "url": "https://your-odoo.com",
    "database": "your-db",
    "username": "admin",
    "api_key": "your-api-key"
  },
  "mapping": {
    "product_name": "name",
    "ean": "barcode",
    "purchase_price": "standard_price"
  }
}
```

### Shopify

```bash
# Configuration dans platform_configurations
{
  "platform_type": "shopify",
  "connection_config": {
    "shop_url": "your-shop.myshopify.com",
    "access_token": "shpat_xxx",
    "api_version": "2024-01"
  }
}
```

### PrestaShop

```bash
# Configuration dans platform_configurations
{
  "platform_type": "prestashop",
  "connection_config": {
    "shop_url": "https://your-shop.com",
    "api_key": "your-webservice-key"
  }
}
```

### WooCommerce

```bash
# Configuration dans platform_configurations
{
  "platform_type": "woocommerce",
  "connection_config": {
    "shop_url": "https://your-shop.com",
    "consumer_key": "ck_xxx",
    "consumer_secret": "cs_xxx"
  }
}
```

---

## Troubleshooting

### Problème : Edge Functions ne se déploient pas

```bash
# Vérifier la config
supabase functions list

# Re-linker le projet
supabase unlink
supabase link --project-ref your-project-id

# Redéployer
supabase functions deploy
```

### Problème : Amazon OAuth échoue

```bash
# Vérifier les secrets
supabase secrets list | grep AMAZON

# Vérifier les redirect URIs dans Amazon Console
# Doit être exactement :
https://your-project.supabase.co/functions/v1/amazon-oauth-callback

# Logs détaillés
supabase functions logs amazon-oauth-callback
```

### Problème : IA ne répond pas

```bash
# Vérifier l'ordre de fallback
1. Lovable AI (toujours disponible)
2. Ollama (vérifier : curl http://localhost:11434)
3. OpenAI (vérifier API key)
4. Claude (vérifier API key)

# Tester manuellement
curl -X POST https://your-project.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{"message": "test"}'
```

---

## Sécurité

### Checklist Production

- [ ] Activer RLS sur toutes les tables
- [ ] Utiliser secrets pour tous les API keys
- [ ] Activer SSL/TLS pour connexions IMAP/FTP
- [ ] Configurer CORS correctement
- [ ] Limiter taux d'appels API
- [ ] Activer audit logs
- [ ] Configurer backup automatique DB
- [ ] Rotation régulière des credentials

---

## Support

- 📖 [Documentation complète](../ARCHITECTURE.md)
- 🐛 [Signaler un bug](https://github.com/cirquephotovideo/wanwa/issues)
- 💬 [Discord Community](https://discord.gg/wanwa)
