# 🛍️ Wanwa - Système de Gestion et Enrichissement de Catalogue Produits

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-green.svg)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg)](https://vitejs.dev/)

> Solution complète d'automatisation pour l'import, l'enrichissement IA et l'export multi-plateforme de catalogues produits.

---

## 🎯 Vue d'ensemble

**Wanwa** est une plateforme intelligente qui automatise l'ensemble du cycle de vie d'un catalogue produits :

- 📥 **Import automatisé** depuis emails (IMAP), FTP/SFTP, API et fichiers CSV
- 🧠 **Enrichissement IA** avec Amazon SP-API, recherche web et analyse avancée
- 📤 **Export multi-plateforme** vers Odoo, Shopify, PrestaShop, WooCommerce, Magento
- 🔍 **Conformité RSGP** automatique avec génération de documentation réglementaire
- 📊 **Monitoring temps réel** de tous les processus d'import/enrichissement/export
- 🤖 **IA Multi-Provider** avec fallback automatique (Gemini, GPT, Claude, Llama)

---

## 🚀 Fonctionnalités Principales

### 📥 Import Multi-Sources

```javascript
// Import automatique depuis email IMAP
✅ Polling email automatique (cron: toutes les 15 min)
✅ Parsing CSV/Excel avec mapping personnalisable
✅ Détection automatique des colonnes (EAN, prix, nom, etc.)
✅ Gestion des pièces jointes multiples
```

### 🧠 Enrichissement Intelligent

```javascript
// 4 niveaux d'enrichissement
✅ Amazon Product Search (SP-API OAuth)
✅ Recherche web et scraping intelligent
✅ Génération spécifications techniques (IA)
✅ Analyse RSGP et conformité réglementaire
✅ Génération images et vidéos produits
✅ Classification taxonomique automatique
```

### 📤 Export Multi-Plateforme

```javascript
// 12+ plateformes supportées
✅ Odoo (via MCP Server)
✅ Shopify, PrestaShop, WooCommerce
✅ Magento, BigCommerce
✅ Amazon Seller Central
✅ Mapping personnalisé par plateforme
✅ Règles de pricing automatiques
✅ Synchronisation bidirectionnelle
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
| **Cron Jobs** | Supabase Edge Functions (124 fonctions) |

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

### 124 Edge Functions

| Catégorie | Fonctions | Exemples |
|-----------|-----------|----------|
| **Import** | 28 | `email-imap-poller`, `supplier-sync-ftp`, `import-from-platform` |
| **Enrichissement** | 18 | `enrich-all`, `amazon-product-search`, `enrich-specifications` |
| **Export** | 15 | `export-to-odoo`, `export-to-shopify`, `export-single-product` |
| **Amazon OAuth** | 8 | `amazon-oauth-start`, `amazon-token-manager`, `rotate-credentials` |
| **IA & Chat** | 12 | `product-chat`, `ai-chat`, `ollama-proxy`, `claude-proxy` |
| **Automation** | 22 | `process-enrichment-queue`, `auto-supplier-sync`, `cleanup-emails` |
| **Monitoring** | 9 | `check-enrichment-queue-stuck`, `run-system-tests` |
| **Autres** | 12 | `stripe-webhook-handler`, `send-notification`, `market-intelligence` |

📖 **[Voir l'architecture complète](./ARCHITECTURE.md)** pour diagrammes détaillés et workflows.

---

## ⚡ Quick Start

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase (Lovable Cloud)
- Comptes API optionnels (Amazon SP-API, OpenAI, Anthropic)

### Installation

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
```

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

### Composants Monitoring

- **ImportJobMonitor** : Suivi imports en temps réel
- **EnrichmentProgressMonitor** : Progression enrichissement IA
- **EmailProcessingMonitor** : Status emails IMAP
- **AmazonLogs** : Logs détaillés Amazon SP-API
- **SystemHealthDashboard** : Vue globale système

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

- 📖 **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture détaillée avec diagrammes
- 🔧 **[CONFIGURATION.md](./docs/CONFIGURATION.md)** - Guide de configuration avancée
- 🚀 **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Guide de déploiement production
- 🧪 **[TESTING.md](./docs/TESTING.md)** - Guide de tests automatisés
- 🔌 **[API.md](./docs/API.md)** - Référence complète API Edge Functions

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
