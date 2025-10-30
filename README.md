# 🛍️ Wanwa - Système de Gestion et Enrichissement de Catalogue Produits

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-green.svg)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-70+-success.svg)](https://vitest.dev/)
[![Coolify](https://img.shields.io/badge/Coolify-Ready-orange.svg)](https://coolify.io/)

> Solution complète d'automatisation pour l'import, l'enrichissement IA et l'export multi-plateforme de catalogues produits.

**🎉 Production-Ready | 23 Edge Functions | 22 Composants React | 70+ Tests | Déploiement Coolify en 1 clic**

---

## 🎯 Vue d'ensemble

**Wanwa** est une plateforme intelligente qui automatise l'ensemble du cycle de vie d'un catalogue produits :

- 📥 **Import automatisé** depuis emails (IMAP), FTP/SFTP, API et fichiers CSV avec drag & drop
- 🧠 **Enrichissement IA** avec Amazon SP-API, analyse d'images, génération de descriptions SEO
- 📤 **Export multi-plateforme** vers Odoo, Shopify, PrestaShop, WooCommerce, Magento (bulk operations)
- 🔍 **Conformité RSGP** automatique avec génération de documentation réglementaire
- 📊 **Monitoring temps réel** avec analytics avancés (6 types de graphiques)
- 🤖 **IA Multi-Provider** avec fallback automatique (Gemini, GPT, Claude, Ollama)
- ✅ **Validation EAN** complète avec support de 200+ pays
- 🚀 **Déploiement Coolify** en 1 commande sur Hostinger KVM

---

## 🚀 Fonctionnalités Principales

### 📥 Import Multi-Sources

```javascript
// Import automatique depuis email IMAP
✅ Polling email automatique (cron: toutes les 15 min)
✅ Upload CSV drag & drop avec prévisualisation
✅ Parsing CSV/Excel avec mapping personnalisable
✅ Détection automatique des colonnes (EAN, prix, nom, etc.)
✅ Gestion des pièces jointes multiples
✅ Validation en temps réel des données
✅ Support FTP/SFTP/API REST
```

### 🧠 Enrichissement Intelligent

```javascript
// 6 niveaux d'enrichissement
✅ Amazon Product Search (SP-API OAuth)
✅ Analyse d'images IA (Gemini Vision) - couleurs, features, qualité
✅ Génération descriptions SEO (courte + longue + keywords)
✅ Génération spécifications techniques (IA)
✅ Analyse RSGP et conformité réglementaire
✅ Classification taxonomique automatique
✅ Détection de pays via code EAN (200+ pays)
✅ Enrichissement en masse (bulk operations)
```

### 📤 Export Multi-Plateforme

```javascript
// 12+ plateformes supportées avec configuration UI
✅ Odoo ERP (XML-RPC avec test de connexion)
✅ Shopify (API privée + OAuth)
✅ WooCommerce (REST API)
✅ Magento 2 (REST API avec attributs custom)
✅ PrestaShop (WebService API)
✅ Export groupé (bulk operations)
✅ Ajustement prix en masse (% ou fixe)
✅ Mapping personnalisé par plateforme
✅ Règles de pricing automatiques
✅ Historique complet des exports
```

---

## 🏗️ Architecture Technique

### Stack Technologique

| Couche | Technologies |
|--------|--------------|
| **Frontend** | React 18 + TypeScript + Vite + TailwindCSS |
| **Backend** | Supabase (PostgreSQL + Edge Functions) |
| **Authentification** | Supabase Auth + RLS Policies |
| **IA** | Lovable AI (Gemini), OpenAI, Claude, Ollama |
| **API Externes** | Amazon SP-API, Odoo, Shopify, PrestaShop |
| **Storage** | Supabase Storage (images, CSV, attachments) |
| **Cron Jobs** | Supabase Edge Functions (23+ déployées, 124 documentées) |
| **Tests** | Vitest (70+ tests unitaires et d'intégration) |
| **Déploiement** | Coolify / Docker / Nginx |
| **CI/CD** | GitHub Actions (7 jobs automatiques) |

### Architecture des Données

```
📦 15+ Tables Supabase
├── product_analyses (produits enrichis finaux)
├── supplier_products (produits bruts importés)
├── supplier_configurations (config fournisseurs)
├── import_jobs (historique imports)
├── enrichment_queue (file d'attente IA)
├── amazon_credentials (OAuth tokens)
├── rsgp_compliance (conformité réglementaire)
├── technical_specs (spécifications techniques)
└── ... (voir ARCHITECTURE.md pour détails complets)
```

### 23+ Edge Functions Déployées

| Catégorie | Fonctions | Exemples |
|-----------|-----------|----------|
| **Import** | 4 | `email-imap-poller`, `supplier-sync-ftp`, `supplier-import-csv` |
| **Enrichissement** | 7 | `enrich-all`, `amazon-product-search`, `enrich-specifications`, `enrich-product-images`, `generate-product-description` |
| **Export** | 7 | `export-to-odoo`, `export-to-shopify`, `export-to-prestashop`, `export-to-woocommerce`, `export-to-magento`, `bulk-export` |
| **Amazon OAuth** | 3 | `amazon-oauth-start`, `amazon-oauth-callback`, `amazon-token-manager` |
| **IA & Chat** | 1 | `ai-chat` |
| **Automation** | 3 | `process-enrichment-queue`, `rsgp-compliance-generator`, `cleanup-old-emails` |
| **Monitoring** | 1 | `run-system-tests` |

**Total : 23 Edge Functions production-ready**

📖 **[Voir l'architecture complète](./ARCHITECTURE.md)** pour les 124 fonctions documentées et workflows.

---

## ⚡ Quick Start

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase (Lovable Cloud)
- Comptes API optionnels (Amazon SP-API, OpenAI, Anthropic)

### Installation Locale (Développement)

```bash
# 1. Cloner le repository
git clone https://github.com/cirquephotovideo/wanwa.git
cd wanwa

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env

# Éditer .env avec vos credentials:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
# VITE_SUPABASE_PROJECT_ID=your-project-id

# 4. Lancer le serveur de développement
npm run dev

# 5. Lancer les tests
npm test
```

### 🚀 Installation Production (Coolify - Recommandé)

**Déploiement en 1 commande sur Hostinger KVM ou VPS :**

```bash
# Installation automatique avec Coolify
sudo ./scripts/coolify-setup.sh
```

Ou suivez le guide complet : **[COOLIFY-QUICKSTART.md](./COOLIFY-QUICKSTART.md)**

**Fonctionnalités Coolify incluses :**
- ✅ Installation automatique
- ✅ Configuration SSL/TLS (Let's Encrypt)
- ✅ Health checks automatiques
- ✅ Sauvegardes quotidiennes
- ✅ Monitoring intégré
- ✅ Rollback en 1 clic

### Configuration Supabase

```bash
# 1. Créer les tables (voir schema dans ARCHITECTURE.md)
# 2. Déployer les Edge Functions
supabase functions deploy

# 3. Configurer les secrets
supabase secrets set AMAZON_CLIENT_ID=your-client-id
supabase secrets set AMAZON_CLIENT_SECRET=your-secret
supabase secrets set OPENAI_API_KEY=your-api-key
# ... (voir section Configuration)

# 4. Configurer les Cron Jobs (supabase/config.toml)
[functions.email-imap-scheduler]
cron = "*/15 * * * *"  # Toutes les 15 minutes
```

---

## 📋 Utilisation

### 1️⃣ Créer un Fournisseur

```typescript
// Page: /suppliers
const supplier = {
  name: "Mon Fournisseur",
  source_type: "email", // ou "ftp", "api", "csv"
  connection_config: {
    host: "imap.example.com",
    port: 993,
    username: "import@example.com",
    password: "encrypted_password",
    folder: "INBOX"
  },
  column_mapping: {
    "code_article": "ean",
    "designation": "name",
    "prix_achat": "purchase_price"
  }
};

await supabase.from('supplier_configurations').insert(supplier);
```

### 2️⃣ Lancer un Import

```typescript
// Automatique via Cron (toutes les 15 min)
// Ou manuel via UI:
const { data } = await supabase.functions.invoke('email-imap-poller', {
  body: {
    supplierId: 'uuid-supplier',
    forceSync: true
  }
});

console.log(`✅ ${data.products_created} produits créés`);
console.log(`🔄 ${data.products_updated} produits mis à jour`);
```

### 3️⃣ Enrichir les Produits

```typescript
// Enrichissement complet avec Amazon + IA
const { data } = await supabase.functions.invoke('enrich-all', {
  body: {
    analysisId: 'uuid-analysis',
    enrichmentTypes: [
      'amazon',          // Recherche Amazon SP-API
      'specifications',  // Specs techniques (IA)
      'rsgp',           // Conformité réglementaire
      'images',         // Téléchargement images HD
      'taxonomy'        // Classification catégories
    ]
  }
});
```

### 4️⃣ Exporter vers Plateformes

```typescript
// Export vers Odoo avec mapping custom
const { data } = await supabase.functions.invoke('export-to-odoo', {
  body: {
    analysisIds: ['uuid1', 'uuid2'],
    platformConfigId: 'uuid-config',
    customMapping: {
      'product_name': 'name',
      'ean': 'barcode',
      'purchase_price': 'standard_price',
      'selling_price': 'list_price'
    },
    applyPricingRules: true,
    autoPublish: false
  }
});

console.log(`📤 ${data.exported_count} produits exportés vers Odoo`);
```

---

## 🔐 Configuration

### Variables d'Environnement

```bash
# Supabase
VITE_SUPABASE_URL=https://ayjdtstugbqoadgipzon.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=ayjdtstugbqoadgipzon

# Optionnel : AI Providers (fallback uniquement)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OLLAMA_BASE_URL=http://localhost:11434

# Amazon SP-API (configuré via UI OAuth)
# Pas de variables env nécessaires

# Stripe (paiements)
STRIPE_SECRET_KEY=sk_live_...
```

### Secrets Supabase (Edge Functions)

```bash
# Configurer via Supabase Dashboard ou CLI
supabase secrets set AMAZON_CLIENT_ID="amzn1.application-oa2-client.xxx"
supabase secrets set AMAZON_CLIENT_SECRET="amzn1.oa2-cs.v1.xxx"
supabase secrets set SMTP_HOST="smtp.example.com"
supabase secrets set SMTP_USER="noreply@example.com"
supabase secrets set SMTP_PASSWORD="xxx"
```

---

## 🤖 Intelligence Artificielle

### Système de Fallback Multi-Provider

```
🎯 Requête Utilisateur
    ↓
1️⃣ Primary: Lovable AI (Gemini 2.5 Pro/Flash)
    ↓ (si échec)
2️⃣ Fallback 1: Ollama Local (Llama 3.2 Vision)
    ↓ (si échec)
3️⃣ Fallback 2: OpenAI (GPT-5/Mini)
    ↓ (si échec)
4️⃣ Fallback 3: Claude (3.5 Sonnet)
```

### Cas d'Usage Optimaux

| Tâche | Provider | Modèle | Raison |
|-------|----------|--------|--------|
| Enrichissement produit | Lovable AI | `gemini-2.5-flash` | Équilibre coût/perf |
| Analyse RSGP | Lovable AI | `gemini-2.5-pro` | Raisonnement complexe |
| Chat produit temps réel | Ollama | `llama3.2-vision` | Latence faible + privé |
| Génération images | Lovable AI | `dall-e-3` | Qualité maximale |
| Classification | Lovable AI | `gemini-2.5-flash-lite` | Rapide + économique |

---

## 📊 Monitoring & Métriques

### Dashboard Temps Réel

```typescript
// Statistiques d'import
SELECT
  import_date,
  COUNT(*) as total_imports,
  SUM(products_created) as total_products,
  AVG(processing_time_ms) as avg_time
FROM import_statistics
WHERE import_date > NOW() - INTERVAL '7 days'
GROUP BY import_date;

// Santé de la queue d'enrichissement
SELECT
  status,
  COUNT(*) as count,
  AVG(retry_count) as avg_retries
FROM enrichment_queue
GROUP BY status;
```

### Composants Principaux

**Pages & Vues :**
- **ProductDetailPage** : Détail produit complet avec tabs (Détails, Enrichissement, Exports)
- **DashboardPage** : Vue d'ensemble avec analytics
- **ImportedProductsPage** : Liste et gestion produits

**Composants Fonctionnels :**
- **BulkOperationsPanel** : Opérations groupées (6 types : export, enrichissement, prix, catégorie, suppression)
- **CSVUploader** : Upload drag & drop avec prévisualisation temps réel
- **AnalyticsCharts** : 6 types de graphiques (KPIs, distribution, timeline, etc.)
- **ShopifyConfigForm** : Configuration Shopify avec test de connexion
- **OdooConfigForm** : Configuration Odoo ERP avec validation

**Monitoring :**
- **ImportJobMonitor** : Suivi imports en temps réel
- **EnrichmentProgressMonitor** : Progression enrichissement IA
- **SystemHealthDashboard** : Vue globale système avec health checks

---

## 🔒 Sécurité

### Row Level Security (RLS)

```sql
-- Users voient uniquement leurs données
CREATE POLICY "users_own_data"
ON product_analyses FOR ALL
USING (auth.uid() = user_id);

-- Super admins ont accès complet
CREATE POLICY "super_admins_all"
ON amazon_credentials FOR ALL
USING (has_role(auth.uid(), 'super_admin'));
```

### Rôles Utilisateurs

| Rôle | Permissions |
|------|-------------|
| `user` | CRUD sur ses propres données |
| `admin` | Lecture sur toutes les données |
| `super_admin` | CRUD sur toutes les données + gestion credentials |

---

## 🚦 Automatisations (Cron Jobs)

| Fonction | Fréquence | Description |
|----------|-----------|-------------|
| `email-imap-scheduler` | */15 * * * * | Poll emails fournisseurs |
| `process-enrichment-queue` | */2 * * * * | Traite file enrichissement |
| `supplier-sync-scheduler` | */30 * * * * | Sync FTP/API |
| `cleanup-old-emails` | 0 3 * * * | Supprime emails >90j |
| `rotate-amazon-credentials` | 0 4 * * * | Renouvelle tokens OAuth |
| `auto-export-manager` | 0 * * * * | Export auto produits |

Configuration dans `supabase/config.toml`

---

## 📚 Documentation Complète

- 📖 **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture détaillée avec diagrammes Mermaid
- 🚀 **[COOLIFY-QUICKSTART.md](./COOLIFY-QUICKSTART.md)** - Déploiement Coolify en 5 minutes
- 🔧 **[CONFIGURATION.md](./docs/CONFIGURATION.md)** - Guide de configuration avancée
- 📤 **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Guide de déploiement production
- 🔄 **[MIGRATION.md](./docs/MIGRATION.md)** - Migration depuis autres systèmes
- 🏥 **[COOLIFY-DEPLOYMENT.md](./docs/COOLIFY-DEPLOYMENT.md)** - Guide Coolify détaillé

## 🧪 Tests & Qualité

```bash
# Lancer tous les tests
npm test

# Tests avec couverture
npm run test:coverage

# Tests UI (interface visuelle)
npm run test:ui

# Linter
npm run lint
```

**70+ Tests Couvrant :**
- ✅ Validation EAN (60+ tests) - EAN-13, EAN-8, UPC-A, pays, conversion
- ✅ Composants React (10+ tests) - CSVUploader, Button, utilities
- ✅ Utilities (5+ tests) - Formatage, validation, API wrappers

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

---

## 🆘 Support

- 📧 Email : support@wanwa.app
- 💬 Discord : [Rejoindre la communauté](https://discord.gg/wanwa)
- 📝 Documentation : [docs.wanwa.app](https://docs.wanwa.app)
- 🐛 Issues : [GitHub Issues](https://github.com/cirquephotovideo/wanwa/issues)

---

## 🙏 Remerciements

- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [Lovable.dev](https://lovable.dev/) - Plateforme de développement IA
- [Amazon SP-API](https://developer-docs.amazon.com/sp-api/) - Intégration Amazon
- [Odoo](https://www.odoo.com/) - Intégration ERP
- [Communauté Open Source](https://github.com/cirquephotovideo/wanwa/graphs/contributors) - Contributeurs

---

<div align="center">

**Fait avec ❤️ par [Cirque Photo Video](https://github.com/cirquephotovideo)**

⭐ Star ce projet si vous le trouvez utile !

</div>
