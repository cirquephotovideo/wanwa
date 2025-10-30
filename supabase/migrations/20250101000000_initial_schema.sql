-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier Configurations
CREATE TABLE IF NOT EXISTS public.supplier_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('email', 'ftp', 'api', 'csv')),
  connection_config JSONB NOT NULL DEFAULT '{}',
  column_mapping JSONB,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier Products (raw imported data)
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES public.supplier_configurations(id) ON DELETE CASCADE,
  ean TEXT,
  name TEXT NOT NULL,
  purchase_price DECIMAL(10, 2),
  raw_data JSONB NOT NULL DEFAULT '{}',
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supplier_id, ean)
);

-- Product Analyses (enriched products)
CREATE TABLE IF NOT EXISTS public.product_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supplier_product_id UUID REFERENCES public.supplier_products(id) ON DELETE SET NULL,
  ean TEXT,
  product_name TEXT,
  analysis_result JSONB DEFAULT '{}',
  enrichment_status JSONB DEFAULT '{}',
  image_urls TEXT[],
  exported_to_platforms JSONB DEFAULT '[]',
  amazon_asin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import Jobs
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.supplier_configurations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  products_created INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  error_logs JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrichment Queue
CREATE TABLE IF NOT EXISTS public.enrichment_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES public.product_analyses(id) ON DELETE CASCADE,
  enrichment_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 5,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Amazon Credentials
CREATE TABLE IF NOT EXISTS public.amazon_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  marketplace_id TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  access_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  secret_expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RSGP Compliance
CREATE TABLE IF NOT EXISTS public.rsgp_compliance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_analysis_id UUID NOT NULL REFERENCES public.product_analyses(id) ON DELETE CASCADE,
  normes_ce JSONB,
  evaluation_risque JSONB,
  indice_reparabilite DECIMAL(3, 1),
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technical Specifications
CREATE TABLE IF NOT EXISTS public.technical_specs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_analysis_id UUID NOT NULL REFERENCES public.product_analyses(id) ON DELETE CASCADE,
  specifications JSONB NOT NULL DEFAULT '{}',
  dimensions JSONB,
  weight_kg DECIMAL(8, 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Inbox (for import tracking)
CREATE TABLE IF NOT EXISTS public.email_inbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES public.supplier_configurations(id) ON DELETE CASCADE,
  subject TEXT,
  sender TEXT,
  received_at TIMESTAMPTZ,
  processed BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Configurations
CREATE TABLE IF NOT EXISTS public.platform_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform_type TEXT NOT NULL CHECK (platform_type IN ('odoo', 'shopify', 'prestashop', 'woocommerce', 'magento', 'bigcommerce')),
  platform_name TEXT NOT NULL,
  connection_config JSONB NOT NULL DEFAULT '{}',
  field_mapping JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Amazon Edge Logs
CREATE TABLE IF NOT EXISTS public.amazon_edge_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  function_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import Statistics
CREATE TABLE IF NOT EXISTS public.import_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  import_date DATE NOT NULL,
  supplier_id UUID REFERENCES public.supplier_configurations(id) ON DELETE SET NULL,
  products_created INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price_monthly DECIMAL(10, 2) NOT NULL,
  max_products INTEGER,
  max_suppliers INTEGER,
  features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_supplier_products_supplier_id ON public.supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_ean ON public.supplier_products(ean) WHERE ean IS NOT NULL;
CREATE INDEX idx_product_analyses_user_id ON public.product_analyses(user_id);
CREATE INDEX idx_product_analyses_ean ON public.product_analyses(ean) WHERE ean IS NOT NULL;
CREATE INDEX idx_product_analyses_amazon_asin ON public.product_analyses(amazon_asin) WHERE amazon_asin IS NOT NULL;
CREATE INDEX idx_enrichment_queue_status ON public.enrichment_queue(status, priority DESC);
CREATE INDEX idx_enrichment_queue_analysis_id ON public.enrichment_queue(analysis_id);
CREATE INDEX idx_import_jobs_user_id ON public.import_jobs(user_id);
CREATE INDEX idx_import_jobs_supplier_id ON public.import_jobs(supplier_id);
CREATE INDEX idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX idx_amazon_credentials_user_id ON public.amazon_credentials(user_id);
CREATE INDEX idx_email_inbox_supplier_id ON public.email_inbox(supplier_id);
CREATE INDEX idx_email_inbox_processed ON public.email_inbox(processed) WHERE NOT processed;
CREATE INDEX idx_import_statistics_user_date ON public.import_statistics(user_id, import_date DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_configurations_updated_at BEFORE UPDATE ON public.supplier_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_products_updated_at BEFORE UPDATE ON public.supplier_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_analyses_updated_at BEFORE UPDATE ON public.product_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_jobs_updated_at BEFORE UPDATE ON public.import_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrichment_queue_updated_at BEFORE UPDATE ON public.enrichment_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amazon_credentials_updated_at BEFORE UPDATE ON public.amazon_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check if user has role
CREATE OR REPLACE FUNCTION has_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND (
      role = required_role
      OR (required_role = 'admin' AND role = 'super_admin')
      OR (required_role = 'user' AND role IN ('admin', 'super_admin'))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed default subscription plans
INSERT INTO public.subscription_plans (name, price_monthly, max_products, max_suppliers, features)
VALUES
  ('Free', 0, 100, 1, '["Basic import", "1 supplier", "Email support"]'),
  ('Starter', 29, 1000, 5, '["Multiple suppliers", "AI enrichment", "Amazon integration", "Priority support"]'),
  ('Professional', 99, 10000, 20, '["Unlimited suppliers", "Advanced AI", "All integrations", "Custom mapping", "24/7 support"]'),
  ('Enterprise', 299, -1, -1, '["Unlimited everything", "Dedicated support", "Custom features", "SLA guarantee"]')
ON CONFLICT DO NOTHING;
