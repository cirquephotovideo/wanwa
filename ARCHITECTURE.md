# Architecture Complète de l'Application - Documentation Claude Dev

## 🎯 Vue d'ensemble de l'application

**Nom** : Système de Gestion et Enrichissement de Catalogue Produits
**Stack** : React + Vite + TypeScript + Supabase (Lovable Cloud) + Amazon SP-API
**Fonctionnalités clés** : Import multi-sources, enrichissement IA, export multi-plateformes, gestion fournisseurs

---

## 📑 1. Architecture des Pages

```mermaid
graph TB
    subgraph "🌐 Pages Publiques"
        Landing[Landing Page]
        Login[Login]
        Signup[Sign Up]
    end

    subgraph "📊 Dashboard Principal"
        Dashboard[Dashboard]
        History[History]
        Analytics[Analytics]
        ImportExport[Import/Export Dashboard]
    end

    subgraph "📦 Gestion Produits & Fournisseurs"
        ImportedProducts[Imported Products]
        Suppliers[Suppliers]
        Wizard[Universal Wizard]
        ProductDetail[Product Detail]
    end

    subgraph "⚙️ Administration"
        AdminPanel[Admin Panel]
        AIProviders[AI Provider Management]
        AmazonCreds[Amazon Credentials]
        EdgeTester[Edge Function Tester]
    end

    Landing --> Login
    Login --> Dashboard
    Dashboard --> ImportedProducts
    Dashboard --> Suppliers
    Dashboard --> Wizard
    Dashboard --> Analytics
    ImportedProducts --> ProductDetail
    Suppliers --> Wizard
    AdminPanel --> AIProviders
    AdminPanel --> AmazonCreds
    AdminPanel --> EdgeTester
```

---

## 🏗️ 2. Schéma de Base de Données Supabase

```mermaid
erDiagram
    users ||--o{ product_analyses : "crée"
    users ||--o{ supplier_configurations : "gère"
    users ||--o{ import_jobs : "lance"
    users ||--o{ enrichment_queue : "demande"

    supplier_configurations ||--o{ supplier_products : "contient"
    supplier_configurations ||--o{ import_jobs : "source"
    supplier_configurations ||--o{ supplier_email_credentials : "possède"

    supplier_products ||--o{ product_analyses : "enrichit"
    supplier_products ||--o{ enrichment_queue : "file d'attente"

    product_analyses ||--o{ rsgp_compliance : "conforme"
    product_analyses ||--o{ technical_specs : "spécifications"
    product_analyses ||--o{ risk_assessments : "risques"
    product_analyses ||--o{ product_videos : "vidéos"
    product_analyses ||--o{ product_taxonomy_mappings : "catégorisé"

    import_jobs ||--o{ email_inbox : "emails"

    users ||--o{ amazon_credentials : "OAuth"
    users ||--o{ price_monitoring : "surveille"

    subscription_plans ||--o{ user_subscriptions : "abonnements"
    users ||--o{ user_subscriptions : "souscrit"
```

### 📋 Tables Principales

| Table | Rôle | Champs Clés |
|-------|------|-------------|
| `product_analyses` | Produits enrichis finaux | `analysis_result`, `image_urls`, `enrichment_status`, `supplier_product_id` |
| `supplier_products` | Produits bruts importés | `ean`, `name`, `purchase_price`, `supplier_id`, `raw_data` |
| `supplier_configurations` | Config fournisseurs | `source_type` (email/ftp/api), `connection_config`, `mapping_profiles` |
| `import_jobs` | Historique imports | `status`, `products_created`, `products_updated`, `error_logs` |
| `enrichment_queue` | File d'attente enrichissement | `enrichment_type`, `priority`, `retry_count`, `status` |
| `amazon_credentials` | OAuth Amazon SP-API | `refresh_token_encrypted`, `marketplace_id`, `secret_expires_at` |
| `rsgp_compliance` | Conformité réglementaire | `normes_ce`, `evaluation_risque`, `indice_reparabilite` |

---

## ⚡ 3. Edge Functions (124 fonctions)

```mermaid
graph LR
    subgraph "📥 Import Functions"
        EmailPoller[email-imap-poller]
        FTPSync[supplier-sync-ftp]
        ProcessEmail[process-email-attachment]
        ImportChunk[email-import-chunk]
    end

    subgraph "🧠 Enrichment Functions"
        EnrichAll[enrich-all]
        AmazonSearch[amazon-product-search]
        EnrichWeb[enrich-supplier-product-web]
        RSGPGen[rsgp-compliance-generator]
        TechSpecs[enrich-specifications]
    end

    subgraph "📤 Export Functions"
        ExportOdoo[export-to-odoo]
        ExportShopify[export-to-shopify]
        ExportPrestashop[export-to-prestashop]
        ExportWoo[export-to-woocommerce]
    end

    subgraph "🔐 Amazon OAuth"
        OAuthStart[amazon-oauth-start]
        OAuthCallback[amazon-oauth-callback]
        TokenManager[amazon-token-manager]
        RotateCreds[rotate-amazon-credentials]
    end

    subgraph "🤖 AI & Chat"
        ProductChat[product-chat]
        BuildContext[build-product-chat-context]
        AIChat[ai-chat]
        OllamaProxy[ollama-proxy]
    end

    EmailPoller --> ProcessEmail
    ProcessEmail --> ImportChunk
    ImportChunk --> EnrichAll
    EnrichAll --> AmazonSearch
    EnrichAll --> EnrichWeb
    EnrichAll --> RSGPGen
    AmazonSearch --> ExportOdoo
    OAuthStart --> OAuthCallback
    OAuthCallback --> TokenManager
```

### 📊 Répartition des Edge Functions

| Catégorie | Nombre | Exemples |
|-----------|--------|----------|
| Import | 28 | `email-imap-poller`, `supplier-sync-ftp`, `import-from-platform` |
| Enrichissement | 18 | `enrich-all`, `amazon-product-search`, `enrich-specifications` |
| Export | 15 | `export-to-odoo`, `export-to-shopify`, `export-single-product` |
| Amazon OAuth | 8 | `amazon-oauth-start`, `amazon-token-manager`, `rotate-amazon-credentials` |
| AI & Chat | 12 | `product-chat`, `ai-chat`, `ollama-proxy`, `claude-proxy` |
| Automation | 22 | `process-enrichment-queue`, `auto-supplier-sync`, `cleanup-old-emails` |
| Monitoring | 9 | `check-enrichment-queue-stuck`, `run-system-tests` |
| Autres | 12 | `stripe-webhook-handler`, `send-notification`, `market-intelligence` |

---

## 🔄 4. Workflow Complet d'Import

```mermaid
sequenceDiagram
    participant User
    participant SupplierConfig
    participant EmailPoller as email-imap-poller
    participant ProcessEmail as process-email-attachment
    participant ImportChunk as email-import-chunk
    participant SupplierProducts
    participant EnrichQueue

    User->>SupplierConfig: Configure IMAP credentials
    Note over SupplierConfig: source_type: 'email'<br/>connection_config: {...}

    loop Every 15 minutes (Cron)
        EmailPoller->>SupplierConfig: Fetch active configs
        EmailPoller->>EmailPoller: Connect to IMAP server
        EmailPoller->>EmailPoller: Download attachments (CSV/Excel)
        EmailPoller->>ProcessEmail: POST {attachment_path, supplier_id}
    end

    ProcessEmail->>ProcessEmail: Parse CSV/Excel
    ProcessEmail->>ProcessEmail: Apply column mapping
    ProcessEmail->>ImportChunk: POST {products: [...], supplier_id}

    ImportChunk->>SupplierProducts: Bulk upsert products
    Note over SupplierProducts: Update if EAN exists<br/>Insert if new

    ImportChunk->>EnrichQueue: Queue for enrichment
    ImportChunk-->>User: Return {products_created, products_updated}
```

---

## 📤 5. Workflow d'Export Multi-Plateforme

```mermaid
graph TB
    A[User selects products] --> B{Choose platform}
    B -->|Odoo| C[export-to-odoo]
    B -->|Shopify| D[export-to-shopify]
    B -->|PrestaShop| E[export-to-prestashop]
    B -->|WooCommerce| F[export-to-woocommerce]

    C --> G[Load platform config]
    D --> G
    E --> G
    F --> G

    G --> H[Apply custom mapping]
    H --> I[Apply pricing rules]
    I --> J{Check existing product}

    J -->|Exists| K[Update via API]
    J -->|New| L[Create via API]

    K --> M[Update product_analyses.exported_to_platforms]
    L --> M

    M --> N[Return success/error logs]
```

---

## 🔐 6. Flux OAuth Amazon SP-API

```mermaid
sequenceDiagram
    participant User
    participant AdminUI
    participant OAuthStart as amazon-oauth-start
    participant Amazon as Amazon Seller Central
    participant OAuthCallback as amazon-oauth-callback
    participant TokenManager as amazon-token-manager
    participant DB as amazon_credentials

    User->>AdminUI: Enter App ID + Region
    AdminUI->>OAuthStart: POST {appId, region}
    OAuthStart->>OAuthStart: Build consent URL
    OAuthStart-->>AdminUI: {authUrl}
    AdminUI->>Amazon: Redirect to consent page

    Note over Amazon: User approves app
    Amazon->>OAuthCallback: Callback with code + state
    OAuthCallback->>Amazon: Exchange code for tokens
    Amazon-->>OAuthCallback: {access_token, refresh_token}
    OAuthCallback->>DB: Insert encrypted refresh_token
    OAuthCallback-->>AdminUI: Redirect to success page

    Note over TokenManager: Cron job daily
    TokenManager->>DB: Check secret_expires_at
    TokenManager->>Amazon: Exchange refresh_token
    Amazon-->>TokenManager: New access_token
    TokenManager->>DB: Update tokens + expiry
```

---

## 🧠 7. Intelligence Artificielle Multi-Provider

```mermaid
graph TB
    subgraph "🎯 Requête Utilisateur"
        UserRequest[User Request]
    end

    subgraph "🔄 AI Fallback System"
        Primary[Primary: Lovable AI]
        Fallback1[Fallback 1: Ollama Local]
        Fallback2[Fallback 2: OpenAI]
        Fallback3[Fallback 3: Claude]
    end

    subgraph "📊 Modèles Disponibles"
        Gemini[Gemini 2.5 Pro/Flash]
        GPT[GPT-5/Mini/Nano]
        Claude[Claude 3.5 Sonnet]
        Llama[Llama 3.2 Vision]
    end

    UserRequest --> Primary
    Primary -->|Success| Result[Return Result]
    Primary -->|Fail| Fallback1
    Fallback1 -->|Success| Result
    Fallback1 -->|Fail| Fallback2
    Fallback2 -->|Success| Result
    Fallback2 -->|Fail| Fallback3
    Fallback3 --> Result

    Primary -.-> Gemini
    Primary -.-> GPT
    Fallback2 -.-> GPT
    Fallback3 -.-> Claude
    Fallback1 -.-> Llama
```

### 🎨 Cas d'Usage IA

| Fonction | Provider Recommandé | Modèle | Raison |
|----------|---------------------|--------|--------|
| Enrichissement produit | Lovable AI | `gemini-2.5-flash` | Bon équilibre coût/performance |
| Analyse RSGP | Lovable AI | `gemini-2.5-pro` | Raisonnement complexe requis |
| Chat produit | Ollama (local) | `llama3.2-vision` | Latence faible + privé |
| Génération images | Lovable AI | `dall-e-3` | Qualité visuelle maximale |
| Classification | Lovable AI | `gemini-2.5-flash-lite` | Tâche simple + rapide |

---

## 📊 8. Composants Frontend Clés

```mermaid
graph LR
    subgraph "🎯 Pages Principales"
        Dashboard[Dashboard]
        ImportedProducts[Imported Products]
        Suppliers[Suppliers]
        Wizard[Universal Wizard]
    end

    subgraph "🧩 Composants Réutilisables"
        AIProvider[AI Provider Management]
        EmailMonitor[Email Processing Monitor]
        EnrichMonitor[Enrichment Progress Monitor]
        ImportMonitor[Import Job Monitor]
        ProductExport[Product Export Menu]
    end

    subgraph "⚙️ Hooks Personnalisés"
        useAI[useAIProviderFallback]
        useFloat[useFloatingChat]
        useTour[useProductTour]
        useAlerts[useRealtimeAlerts]
    end

    Dashboard --> ImportMonitor
    Dashboard --> EnrichMonitor
    ImportedProducts --> ProductExport
    Suppliers --> EmailMonitor
    Wizard --> AIProvider

    ImportMonitor --> useAlerts
    ProductExport --> useAI
    EmailMonitor --> useFloat
```

### 📦 Composants par Catégorie

| Catégorie | Composants | Description |
|-----------|------------|-------------|
| **Monitoring** | ImportJobMonitor, EmailProcessingMonitor, EnrichmentProgressMonitor | Suivi temps réel des opérations |
| **Configuration** | AIProviderManagement, AmazonCredentialsManager, SupplierConfigForm | Gestion des intégrations |
| **Visualisation** | ImportStatsDashboard, AnalyticsCharts, PriceHistoryChart | Graphiques et KPIs |
| **Interaction** | ProductExportMenu, BulkProductLinksManager, AutomationRulesManager | Actions utilisateur |
| **Admin** | EdgeFunctionTester, MCPLibraryMarketplace, AmazonLogs | Outils debug |

---

## 🔧 9. Configuration et Secrets

### 🔐 Secrets Supabase

```javascript
// Secrets configurés dans Lovable Cloud
AMAZON_CLIENT_ID              // OAuth Amazon
AMAZON_CLIENT_SECRET          // OAuth Amazon
OPENAI_API_KEY               // Fallback OpenAI
ANTHROPIC_API_KEY            // Fallback Claude
OLLAMA_BASE_URL              // Ollama local
STRIPE_SECRET_KEY            // Paiements
SMTP_HOST                    // Notifications email
SMTP_USER
SMTP_PASSWORD
```

### ⚙️ Variables d'Environnement

```bash
VITE_SUPABASE_URL=https://ayjdtstugbqoadgipzon.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=ayjdtstugbqoadgipzon
```

---

## 🚀 10. Automatisations & Cron Jobs

```mermaid
gantt
    title Planification des Tâches Automatiques
    dateFormat HH:mm
    axisFormat %H:%M

    section Import
    Email Polling          :00:00, 15m
    FTP Sync              :00:00, 30m
    Process Pending       :00:00, 10m

    section Enrichissement
    Process Queue         :00:00, 2m
    Retry Failed          :00:00, 60m
    Check Stuck           :00:00, 30m

    section Maintenance
    Cleanup Old Emails    :03:00, 1440m
    Rotate Amazon Creds   :04:00, 1440m
    Check Expiry          :00:00, 360m

    section Export
    Auto Export           :00:00, 60m
    Sync Orders           :00:00, 15m
```

### ⏱️ Configuration Cron

| Fonction | Fréquence | Cron Expression | Rôle |
|----------|-----------|-----------------|------|
| `email-imap-scheduler` | Toutes les 15 min | `*/15 * * * *` | Poll emails fournisseurs |
| `process-enrichment-queue` | Toutes les 2 min | `*/2 * * * *` | Traite file enrichissement |
| `supplier-sync-scheduler` | Toutes les 30 min | `*/30 * * * *` | Sync FTP/API |
| `cleanup-old-emails` | Quotidien 3h | `0 3 * * *` | Supprime emails >90j |
| `rotate-amazon-credentials` | Quotidien 4h | `0 4 * * *` | Renouvelle tokens Amazon |
| `check-amazon-credentials-expiry` | Toutes les 6h | `0 */6 * * *` | Alerte expiration |
| `auto-export-manager` | Toutes les heures | `0 * * * *` | Export auto produits |

---

## 📈 11. Métriques et Monitoring

### 📊 Tables de Suivi

```sql
-- Statistiques d'import agrégées
SELECT
  import_date,
  COUNT(*) as total_imports,
  SUM(products_created) as total_products,
  AVG(processing_time_ms) as avg_processing_time
FROM import_statistics
GROUP BY import_date
ORDER BY import_date DESC;

-- Santé de la queue d'enrichissement
SELECT
  status,
  COUNT(*) as count,
  AVG(retry_count) as avg_retries
FROM enrichment_queue
GROUP BY status;

-- Logs Amazon SP-API
SELECT
  function_name,
  event_type,
  COUNT(*) as occurrences
FROM amazon_edge_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY function_name, event_type;
```

---

## 🎯 12. Use Cases Principaux

### 📥 Import Multi-Sources

```javascript
// Email IMAP automatique
await supabase.functions.invoke('email-imap-poller', {
  body: { supplierId: 'uuid', forceSync: false }
});

// FTP/SFTP programmé
await supabase.functions.invoke('supplier-sync-ftp', {
  body: {
    supplierId: 'uuid',
    config: { host, port, username, remotePath }
  }
});

// Upload CSV manuel
await supabase.functions.invoke('supplier-import-csv', {
  body: {
    filePath: 'supplier-catalog.csv',
    delimiter: ';',
    columnMapping: { /* ... */ }
  }
});
```

### 🧠 Enrichissement Intelligent

```javascript
// Enrichissement complet (Amazon + IA)
await supabase.functions.invoke('enrich-all', {
  body: {
    analysisId: 'uuid',
    enrichmentTypes: ['amazon', 'specifications', 'rsgp', 'images']
  }
});

// Recherche Amazon SP-API
await supabase.functions.invoke('amazon-product-search', {
  body: {
    query: 'iPhone 15 Pro',
    marketplace: 'A13V1IB3VIYZZH' // EU
  }
});
```

### 📤 Export Multi-Plateforme

```javascript
// Export vers Odoo avec mapping custom
await supabase.functions.invoke('export-to-odoo', {
  body: {
    analysisId: 'uuid',
    platformConfigId: 'uuid',
    customMapping: {
      'product_name': 'name',
      'ean': 'barcode',
      'purchase_price': 'standard_price'
    },
    applyPricingRules: true
  }
});
```

---

## 🔍 13. Recherche et Filtrage Avancé

```mermaid
graph TB
    A[User Search Input] --> B{Search Type}
    B -->|Product Name| C[Full-text Search]
    B -->|EAN| D[Exact Match]
    B -->|Category| E[Taxonomy Filter]
    B -->|Supplier| F[Supplier Join]

    C --> G[product_analyses.analysis_result]
    D --> G
    E --> H[product_taxonomy_mappings]
    F --> I[supplier_products JOIN]

    G --> J{Apply Filters}
    H --> J
    I --> J

    J --> K[Price Range]
    J --> L[Enrichment Status]
    J --> M[Export Status]
    J --> N[Date Range]

    K --> O[Final Results]
    L --> O
    M --> O
    N --> O
```

### 🔎 Exemples de Requêtes

```sql
-- Produits enrichis mais non exportés
SELECT pa.*
FROM product_analyses pa
WHERE pa.enrichment_status->>'amazon' = 'completed'
  AND pa.exported_to_platforms = '[]'::jsonb
ORDER BY pa.created_at DESC;

-- Top fournisseurs par volume import
SELECT
  sc.supplier_name,
  COUNT(sp.id) as total_products,
  AVG(sp.purchase_price) as avg_price
FROM supplier_configurations sc
JOIN supplier_products sp ON sp.supplier_id = sc.id
GROUP BY sc.id, sc.supplier_name
ORDER BY total_products DESC
LIMIT 10;

-- Produits avec erreurs enrichissement
SELECT pa.*, eq.error_message
FROM product_analyses pa
JOIN enrichment_queue eq ON eq.analysis_id = pa.id
WHERE eq.status = 'failed'
  AND eq.retry_count >= eq.max_retries;
```

---

## 🛡️ 14. Sécurité et RLS Policies

### 🔐 Principales Politiques RLS

```sql
-- Users can only see their own data
CREATE POLICY "Users can view their own analyses"
ON product_analyses FOR SELECT
USING (auth.uid() = user_id);

-- Super admins have full access
CREATE POLICY "Super admins can manage all"
ON amazon_credentials FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- System functions can insert logs
CREATE POLICY "System can insert logs"
ON amazon_edge_logs FOR INSERT
WITH CHECK (true);
```

### 🔑 Gestion des Rôles

| Rôle | Permissions | Tables Accessibles |
|------|-------------|-------------------|
| `user` | CRUD sur ses données | `product_analyses`, `supplier_configurations`, `import_jobs` |
| `admin` | Lecture sur toutes données | + `audit_logs`, `user_subscriptions` |
| `super_admin` | CRUD sur toutes données | ALL tables + `amazon_credentials`, `ai_prompts` |

---

## 📚 15. Ressources et Documentation

### 📖 Fichiers de Référence

| Fichier | Description |
|---------|-------------|
| `src/lib/mcpLibraries.ts` | Définitions des MCP servers (Odoo, PrestaShop, etc.) |
| `src/lib/odooMCPData.ts` | Tools et use cases Odoo MCP |
| `src/lib/prestashopMCPData.ts` | Tools et use cases PrestaShop MCP |
| `supabase/config.toml` | Configuration edge functions + auth |
| `src/integrations/supabase/types.ts` | Types TypeScript auto-générés |

### 🔗 Intégrations Externes

- **Amazon SP-API** : Authentification OAuth 2.0 + endpoints Catalog/Inventory
- **Odoo MCP Server** : `npm install odoo-mcp-server` (déjà installé)
- **PrestaShop MCP** : Disponible via MCP marketplace
- **Ollama** : Modèles IA locaux (Llama 3.2, Mistral, etc.)
- **Stripe** : Gestion abonnements et paiements

---

## 🎓 Résumé pour Claude Dev

### 🚀 Quick Start

```bash
# 1. Créer un fournisseur
POST /suppliers → {name, source_type: 'email', config: {...}}

# 2. Lancer import email
INVOKE email-imap-poller → Parse attachments → Insert supplier_products

# 3. Enrichir produits
INVOKE enrich-all → Amazon API + IA → Update product_analyses

# 4. Exporter vers plateforme
INVOKE export-to-odoo → Transform data → POST to Odoo API
```

### 🔥 Points d'Attention

- **Secrets** : Toujours utiliser Lovable Cloud secrets (jamais hardcoder)
- **RLS** : Vérifier policies avant requêtes DB
- **AI Fallback** : Prioriser Lovable AI (no API key needed)
- **Amazon OAuth** : `verify_jwt = false` sur `amazon-oauth-start`
- **Cron Jobs** : Configurés dans `config.toml` (section `[functions.{name}]`)

### 📊 Métriques Clés

- **124** Edge Functions déployées
- **15+** Tables Supabase avec RLS activé
- **12+** Plateformes d'export supportées
- **4** Providers IA avec fallback automatique
- **~40** Composants React réutilisables

---

## 🎯 Objectif Final

**Automatiser à 100% le flux Import → Enrichissement → Export avec monitoring temps réel et multi-tenancy sécurisé.**

---

*Documentation générée le 2025-10-30*
