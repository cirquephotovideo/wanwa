#!/bin/bash

# Wanwa - Seed Demo Data Script
# Populate database with sample data for testing

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}     Wanwa - Database Seeding Script       ${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo -e "${RED}✗${NC} Supabase CLI is not installed"
  exit 1
fi

echo -e "${YELLOW}⚠${NC}  This script will add demo data to your database"
echo -e "${YELLOW}⚠${NC}  Only use this on development/staging environments"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}✗${NC} Seeding cancelled"
  exit 1
fi

# Create seed SQL file
SEED_FILE="supabase/seed.sql"
echo -e "${BLUE}➜${NC} Creating seed data SQL..."

cat > "$SEED_FILE" << 'EOF'
-- Wanwa Demo Data Seed
-- This file populates the database with sample data for testing

-- Create demo user (if not exists)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'demo@wanwa.test',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Insert demo user profile
INSERT INTO public.users (id, email, full_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'demo@wanwa.test',
  'Demo User',
  'admin'
)
ON CONFLICT (id) DO NOTHING;

-- Insert supplier configurations
INSERT INTO public.supplier_configurations (id, user_id, supplier_name, source_type, connection_config, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000101'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Fournisseur Email Demo',
    'email',
    '{
      "host": "imap.example.com",
      "port": 993,
      "username": "supplier@example.com",
      "use_tls": true
    }'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000102'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Fournisseur FTP Demo',
    'ftp',
    '{
      "host": "ftp.example.com",
      "port": 21,
      "username": "ftpuser",
      "remote_path": "/catalog"
    }'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000103'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Fournisseur API Demo',
    'api',
    '{
      "url": "https://api.supplier.com/products",
      "auth_type": "bearer",
      "headers": {
        "Content-Type": "application/json"
      }
    }'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Insert export platform configurations
INSERT INTO public.export_platform_configurations (id, user_id, platform_name, platform_type, platform_config, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000201'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Boutique Shopify',
    'shopify',
    '{
      "shop_url": "demo-store.myshopify.com",
      "api_version": "2024-01"
    }'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000202'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'ERP Odoo',
    'odoo',
    '{
      "url": "https://odoo.example.com",
      "database": "production"
    }'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000203'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'WooCommerce Store',
    'woocommerce',
    '{
      "url": "https://woocommerce.example.com"
    }'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO public.product_analyses (
  id, user_id, ean, product_name, brand, category,
  selling_price, cost_price, stock_quantity,
  short_description, long_description,
  source_supplier_id, enrichment_status, image_urls
)
VALUES
  (
    '00000000-0000-0000-0000-000000000301'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '5901234123457',
    'Smartphone XYZ Pro 128GB',
    'TechBrand',
    'Électronique > Smartphones',
    699.99,
    450.00,
    25,
    'Smartphone haut de gamme avec écran AMOLED',
    'Smartphone dernière génération avec processeur octa-core, 8GB RAM, caméra 48MP, batterie 5000mAh. Écran AMOLED 6.7 pouces, charge rapide 65W.',
    '00000000-0000-0000-0000-000000000101'::uuid,
    '{
      "amazon": {"status": "completed", "data": {"asin": "B08XYZ123"}},
      "specifications": {"status": "completed"},
      "rsgp": {"status": "pending"}
    }'::jsonb,
    ARRAY['https://via.placeholder.com/800x600?text=Smartphone+Front', 'https://via.placeholder.com/800x600?text=Smartphone+Back']
  ),
  (
    '00000000-0000-0000-0000-000000000302'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '5901234123464',
    'Écouteurs Sans Fil Premium',
    'AudioTech',
    'Électronique > Audio',
    149.99,
    80.00,
    50,
    'Écouteurs Bluetooth avec réduction de bruit',
    'Écouteurs sans fil avec réduction active du bruit, autonomie 30h, étui de charge, son Hi-Fi, résistance à l''eau IPX5.',
    '00000000-0000-0000-0000-000000000102'::uuid,
    '{
      "amazon": {"status": "completed", "data": {"asin": "B08ABC456"}},
      "specifications": {"status": "completed"},
      "rsgp": {"status": "completed"}
    }'::jsonb,
    ARRAY['https://via.placeholder.com/800x600?text=Earbuds']
  ),
  (
    '00000000-0000-0000-0000-000000000303'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '5901234123471',
    'Montre Connectée Sport',
    'FitTech',
    'Électronique > Wearables',
    249.99,
    150.00,
    15,
    'Montre connectée GPS avec suivi santé',
    'Montre connectée avec GPS intégré, capteur cardiaque, oxymètre, suivi sommeil, 50+ modes sportifs, étanche 5ATM, autonomie 14 jours.',
    '00000000-0000-0000-0000-000000000103'::uuid,
    '{
      "amazon": {"status": "processing"},
      "specifications": {"status": "pending"},
      "rsgp": {"status": "pending"}
    }'::jsonb,
    ARRAY['https://via.placeholder.com/800x600?text=Smartwatch']
  ),
  (
    '00000000-0000-0000-0000-000000000304'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '5901234123488',
    'Clavier Mécanique RGB',
    'GamerGear',
    'Informatique > Périphériques',
    129.99,
    70.00,
    30,
    'Clavier gaming mécanique avec rétroéclairage',
    'Clavier mécanique switches Cherry MX Red, rétroéclairage RGB personnalisable, touches programmables, repose-poignet magnétique.',
    '00000000-0000-0000-0000-000000000101'::uuid,
    '{
      "amazon": {"status": "failed", "error": "ASIN not found"},
      "specifications": {"status": "completed"},
      "rsgp": {"status": "pending"}
    }'::jsonb,
    ARRAY['https://via.placeholder.com/800x600?text=Keyboard']
  ),
  (
    '00000000-0000-0000-0000-000000000305'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '5901234123495',
    'Webcam HD 1080p',
    'VisionTech',
    'Informatique > Périphériques',
    89.99,
    45.00,
    40,
    'Webcam Full HD avec micro intégré',
    'Webcam 1080p 60fps, autofocus, correction lumière automatique, micro stéréo avec réduction de bruit, compatible Windows/Mac/Linux.',
    '00000000-0000-0000-0000-000000000102'::uuid,
    '{
      "amazon": {"status": "pending"},
      "specifications": {"status": "pending"},
      "rsgp": {"status": "pending"}
    }'::jsonb,
    ARRAY['https://via.placeholder.com/800x600?text=Webcam']
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample import jobs
INSERT INTO public.import_jobs (
  id, user_id, supplier_id, file_name, file_size,
  import_type, status, total_rows_processed,
  successful_imports, failed_imports, started_at, completed_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000401'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000101'::uuid,
    'supplier_catalog_2024.csv',
    524288,
    'csv',
    'completed',
    100,
    98,
    2,
    now() - interval '2 days',
    now() - interval '2 days' + interval '5 minutes'
  ),
  (
    '00000000-0000-0000-0000-000000000402'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000102'::uuid,
    'ftp_products.xml',
    1048576,
    'xml',
    'completed',
    50,
    50,
    0,
    now() - interval '1 day',
    now() - interval '1 day' + interval '3 minutes'
  ),
  (
    '00000000-0000-0000-0000-000000000403'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000103'::uuid,
    'api_import.json',
    262144,
    'api',
    'failed',
    25,
    0,
    25,
    now() - interval '6 hours',
    now() - interval '6 hours' + interval '1 minute'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert enrichment queue tasks
INSERT INTO public.enrichment_queue (
  id, product_id, enrichment_type, status, priority
)
VALUES
  (
    '00000000-0000-0000-0000-000000000501'::uuid,
    '00000000-0000-0000-0000-000000000303'::uuid,
    'amazon',
    'processing',
    'high'
  ),
  (
    '00000000-0000-0000-0000-000000000502'::uuid,
    '00000000-0000-0000-0000-000000000305'::uuid,
    'specifications',
    'pending',
    'medium'
  ),
  (
    '00000000-0000-0000-0000-000000000503'::uuid,
    '00000000-0000-0000-0000-000000000305'::uuid,
    'rsgp',
    'pending',
    'low'
  )
ON CONFLICT (id) DO NOTHING;

-- Display summary
DO $$
BEGIN
  RAISE NOTICE '✓ Seed data inserted successfully!';
  RAISE NOTICE '  - 1 demo user';
  RAISE NOTICE '  - 3 supplier configurations';
  RAISE NOTICE '  - 3 export platforms';
  RAISE NOTICE '  - 5 sample products';
  RAISE NOTICE '  - 3 import jobs';
  RAISE NOTICE '  - 3 enrichment tasks';
  RAISE NOTICE '';
  RAISE NOTICE 'Demo credentials:';
  RAISE NOTICE '  Email: demo@wanwa.test';
  RAISE NOTICE '  Password: demo123';
END $$;
EOF

echo -e "${GREEN}✓${NC} Seed SQL file created: $SEED_FILE"
echo ""

# Execute seed file
echo -e "${BLUE}➜${NC} Executing seed data..."
supabase db push --include-seed

echo ""
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓${NC} Database seeded successfully!"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Demo credentials:${NC}"
echo "  Email: demo@wanwa.test"
echo "  Password: demo123"
echo ""
echo -e "${BLUE}Sample data:${NC}"
echo "  - 3 Supplier configurations"
echo "  - 3 Export platforms"
echo "  - 5 Products (various enrichment statuses)"
echo "  - 3 Import jobs (completed/failed)"
echo "  - 3 Enrichment queue tasks"
echo ""
