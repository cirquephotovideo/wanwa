# Guide de Migration vers Wanwa

Ce guide vous aidera à migrer vos données existantes vers Wanwa depuis d'autres systèmes de gestion de catalogue produits.

## Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Prérequis](#prérequis)
- [Migration depuis un fichier CSV/Excel](#migration-depuis-un-fichier-csvexcel)
- [Migration depuis une plateforme e-commerce](#migration-depuis-une-plateforme-e-commerce)
- [Migration depuis un ERP](#migration-depuis-un-erp)
- [Migration de base de données existante](#migration-de-base-de-données-existante)
- [Validation post-migration](#validation-post-migration)
- [Résolution des problèmes](#résolution-des-problèmes)

## Vue d'ensemble

Wanwa supporte plusieurs méthodes de migration :

1. **Import CSV/Excel** - Pour les catalogues au format tableur
2. **API REST** - Pour les migrations automatisées depuis des systèmes existants
3. **Import FTP/SFTP** - Pour les catalogues fournis par FTP
4. **Migration directe** - Depuis une base de données SQL existante

## Prérequis

Avant de commencer la migration :

- [ ] Compte Wanwa configuré et vérifié
- [ ] Projet Supabase créé et lié
- [ ] Variables d'environnement configurées dans `.env`
- [ ] Dépendances installées : `npm install`
- [ ] Migrations de base de données appliquées : `./scripts/migrate.sh`

## Migration depuis un fichier CSV/Excel

### Format CSV attendu

Wanwa accepte les fichiers CSV avec les colonnes suivantes (nom flexible) :

| Colonne Requise | Variantes Acceptées | Description |
|----------------|---------------------|-------------|
| EAN | `ean`, `ean13`, `barcode`, `code ean` | Code-barres EAN-13 |
| Nom | `name`, `nom`, `product`, `produit` | Nom du produit |
| Prix | `price`, `prix`, `prix de vente` | Prix de vente TTC |
| Coût | `cost`, `prix d'achat` | Prix d'achat HT |
| Catégorie | `category`, `catégorie` | Catégorie produit |
| Marque | `brand`, `marque` | Marque du produit |
| Description | `description` | Description longue |
| Stock | `stock`, `quantity`, `quantité` | Quantité en stock |

### Exemple de fichier CSV

```csv
EAN,Nom,Marque,Catégorie,Prix,Coût,Stock,Description
5901234123457,Smartphone XYZ,TechBrand,Électronique,699.99,450.00,25,Smartphone haut de gamme
5901234123464,Écouteurs Premium,AudioTech,Audio,149.99,80.00,50,Écouteurs sans fil
```

### Étapes de migration CSV

1. **Préparation du fichier**
   ```bash
   # Vérifier l'encodage (doit être UTF-8)
   file -i votre_catalogue.csv

   # Convertir si nécessaire
   iconv -f ISO-8859-1 -t UTF-8 votre_catalogue.csv > catalogue_utf8.csv
   ```

2. **Import via l'interface web**
   - Connectez-vous à Wanwa
   - Allez dans **Imports > Upload CSV**
   - Glissez-déposez votre fichier CSV
   - Vérifiez l'aperçu des colonnes détectées
   - Cliquez sur **Importer**

3. **Import via API**
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/supplier-import-csv \
     -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "jobId": "uuid-here",
       "fileName": "catalog.csv",
       "supplierId": "supplier-uuid"
     }'
   ```

4. **Vérification de l'import**
   - Consultez le statut dans **Imports > Historique**
   - Vérifiez les erreurs dans les logs
   - Consultez les produits importés dans **Produits**

### Traitement des erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Invalid EAN` | Code EAN invalide | Vérifiez que l'EAN est bien un EAN-13 valide |
| `Duplicate product` | Produit déjà existant | Utilisez l'option "Mettre à jour si existe" |
| `Invalid price format` | Format de prix incorrect | Utilisez un point comme séparateur décimal |
| `Missing required field` | Champ obligatoire manquant | Assurez-vous que EAN ou Nom est présent |

## Migration depuis une plateforme e-commerce

### Shopify

1. **Export depuis Shopify**
   ```bash
   # Via Shopify Admin
   Produits > Exporter > Tous les produits > Format CSV
   ```

2. **Mapping des colonnes Shopify**
   - `Handle` → Non utilisé
   - `Title` → `product_name`
   - `Variant SKU` → `ean` (si EAN)
   - `Variant Price` → `selling_price`
   - `Variant Compare At Price` → Prix de référence
   - `Type` → `category`
   - `Vendor` → `brand`

3. **Script de conversion**
   ```bash
   # Convertir le format Shopify vers Wanwa
   node scripts/converters/shopify-to-wanwa.js shopify_export.csv wanwa_import.csv
   ```

### WooCommerce

1. **Export depuis WooCommerce**
   - Installer le plugin **WooCommerce Export**
   - Produits > Exporter
   - Sélectionner les champs : SKU, Nom, Prix, Stock, Catégories

2. **Import dans Wanwa**
   ```bash
   # Utiliser le convertisseur WooCommerce
   node scripts/converters/woocommerce-to-wanwa.js woo_export.csv wanwa_import.csv
   ```

### PrestaShop

1. **Export depuis PrestaShop**
   - Catalogue > Produits > Exporter
   - Format : CSV avec séparateur point-virgule

2. **Mapping PrestaShop**
   - `Reference` → `ean`
   - `Name` → `product_name`
   - `Price tax incl` → `selling_price`
   - `Wholesale price` → `cost_price`
   - `Categories` → `category`
   - `Manufacturer` → `brand`

## Migration depuis un ERP

### Odoo

1. **Export depuis Odoo**
   ```python
   # Script Python pour export Odoo
   from odoo import models, fields, api

   products = self.env['product.product'].search([])

   data = []
   for product in products:
       data.append({
           'ean': product.barcode,
           'product_name': product.name,
           'selling_price': product.list_price,
           'cost_price': product.standard_price,
           'category': product.categ_id.name,
           'brand': product.product_brand_id.name if product.product_brand_id else '',
           'stock_quantity': product.qty_available,
       })
   ```

2. **Import dans Wanwa**
   - Exporter les données en CSV
   - Utiliser l'import CSV standard de Wanwa

### SAP Business One

1. **Export depuis SAP**
   ```sql
   -- Requête SQL pour export SAP B1
   SELECT
     ItemCode AS ean,
     ItemName AS product_name,
     U_Brand AS brand,
     ItmsGrpNam AS category,
     Price AS selling_price,
     AvgPrice AS cost_price,
     OnHand AS stock_quantity
   FROM OITM
   WHERE validFor = 'Y'
   ```

2. **Conversion et import**
   ```bash
   # Exporter le résultat en CSV
   # Puis importer dans Wanwa via CSV upload
   ```

## Migration de base de données existante

### Migration SQL directe

Si vous avez une base de données existante, vous pouvez migrer directement :

1. **Créer un script de migration SQL**

```sql
-- scripts/migrations/custom_import.sql

-- Importer les produits depuis votre ancienne base
INSERT INTO product_analyses (
  user_id,
  ean,
  product_name,
  brand,
  category,
  selling_price,
  cost_price,
  stock_quantity,
  long_description,
  enrichment_status
)
SELECT
  'YOUR_USER_UUID'::uuid,
  your_ean_column,
  your_name_column,
  your_brand_column,
  your_category_column,
  your_price_column::decimal,
  your_cost_column::decimal,
  your_stock_column::integer,
  your_description_column,
  '{
    "amazon": {"status": "pending"},
    "specifications": {"status": "pending"},
    "rsgp": {"status": "pending"}
  }'::jsonb
FROM your_old_products_table
WHERE your_active_flag = true;
```

2. **Exécuter la migration**
   ```bash
   # Via Supabase CLI
   supabase db execute --file scripts/migrations/custom_import.sql
   ```

### Migration PostgreSQL directe

Si votre ancienne base est PostgreSQL :

```bash
# Dump de l'ancienne base
pg_dump -t products old_database > old_products.sql

# Créer un script de transformation
sed 's/old_table_name/product_analyses/g' old_products.sql > transformed.sql

# Appliquer à Supabase
psql "postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres" -f transformed.sql
```

## Validation post-migration

### Checklist de validation

- [ ] **Nombre de produits**
  ```sql
  SELECT COUNT(*) FROM product_analyses WHERE user_id = 'YOUR_UUID';
  ```

- [ ] **Produits avec EAN**
  ```sql
  SELECT
    COUNT(*) as total,
    COUNT(ean) as with_ean,
    ROUND(COUNT(ean)::decimal / COUNT(*)::decimal * 100, 2) as percentage
  FROM product_analyses
  WHERE user_id = 'YOUR_UUID';
  ```

- [ ] **Prix valides**
  ```sql
  SELECT COUNT(*)
  FROM product_analyses
  WHERE user_id = 'YOUR_UUID'
    AND (selling_price IS NULL OR selling_price <= 0);
  ```

- [ ] **Catégories**
  ```sql
  SELECT category, COUNT(*) as count
  FROM product_analyses
  WHERE user_id = 'YOUR_UUID'
  GROUP BY category
  ORDER BY count DESC;
  ```

### Script de validation automatique

```bash
# Exécuter le script de validation
./scripts/validate-migration.sh

# Affiche :
# ✓ 1000 produits migrés
# ✓ 95% avec code EAN
# ✓ 100% avec prix valide
# ⚠ 5 produits sans catégorie
```

## Résolution des problèmes

### Produits en double

```sql
-- Identifier les doublons
SELECT ean, COUNT(*) as count
FROM product_analyses
WHERE user_id = 'YOUR_UUID' AND ean IS NOT NULL
GROUP BY ean
HAVING COUNT(*) > 1;

-- Supprimer les doublons (garder le plus récent)
DELETE FROM product_analyses
WHERE id IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY ean ORDER BY created_at DESC) as rn
    FROM product_analyses
    WHERE user_id = 'YOUR_UUID'
  ) t
  WHERE t.rn > 1
);
```

### Problèmes d'encodage

```bash
# Détecter l'encodage actuel
chardet your_file.csv

# Convertir en UTF-8
iconv -f ISO-8859-1 -t UTF-8 your_file.csv > fixed_file.csv

# Nettoyer les caractères spéciaux
sed 's/€/EUR/g' fixed_file.csv > clean_file.csv
```

### Rollback de migration

```sql
-- Annuler une migration récente
DELETE FROM product_analyses
WHERE user_id = 'YOUR_UUID'
  AND created_at > '2024-01-01 10:00:00'
  AND source_supplier_id = 'IMPORT_SUPPLIER_UUID';
```

## Migration par étapes

Pour les gros volumes (>10 000 produits), procédez par lots :

```bash
# Diviser le fichier en lots de 1000 lignes
split -l 1000 huge_catalog.csv batch_

# Importer chaque lot
for file in batch_*; do
  echo "Importing $file..."
  # Uploader via l'interface ou API
  sleep 5  # Pause entre les imports
done
```

## Optimisation post-migration

Après la migration, optimisez vos données :

1. **Lancer l'enrichissement automatique**
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/enrich-all \
     -H "Authorization: Bearer YOUR_KEY" \
     -d '{"userId": "YOUR_UUID"}'
   ```

2. **Générer les spécifications techniques**
   ```bash
   # Via l'interface : Produits > Actions groupées > Enrichir les spécifications
   ```

3. **Vérifier la conformité RSGP**
   ```bash
   # Produits > Actions groupées > Générer fiches RSGP
   ```

## Support

En cas de problème lors de la migration :

1. Consultez les logs : **Imports > Historique > Détails**
2. Vérifiez la documentation : [CONFIGURATION.md](./CONFIGURATION.md)
3. Contactez le support : support@wanwa.com
4. GitHub Issues : https://github.com/cirquephotovideo/wanwa/issues

## Scripts utiles

### Validation des EAN

```bash
# Vérifier la validité des codes EAN
node scripts/validators/validate-ean.js your_file.csv
```

### Nettoyage des prix

```bash
# Corriger les formats de prix
node scripts/cleaners/clean-prices.js your_file.csv
```

### Mapping automatique des catégories

```bash
# Mapper vos catégories vers une taxonomie standard
node scripts/mappers/map-categories.js your_file.csv category_mapping.json
```

## Prochaines étapes

Après une migration réussie :

1. ✅ Vérifier les données importées
2. ✅ Lancer l'enrichissement AI
3. ✅ Configurer les connexions Amazon SP-API
4. ✅ Configurer les plateformes d'export
5. ✅ Tester un export vers votre plateforme principale
6. ✅ Mettre en place les imports automatiques futurs

---

**Besoin d'aide ?** Consultez notre [guide de déploiement](./DEPLOYMENT.md) ou contactez-nous.
