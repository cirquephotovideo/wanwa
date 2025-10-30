-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrichment_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amazon_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsgp_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amazon_edge_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- SUPPLIER_CONFIGURATIONS POLICIES
-- ============================================

CREATE POLICY "Users can view their own suppliers"
  ON public.supplier_configurations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own suppliers"
  ON public.supplier_configurations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suppliers"
  ON public.supplier_configurations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suppliers"
  ON public.supplier_configurations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SUPPLIER_PRODUCTS POLICIES
-- ============================================

CREATE POLICY "Users can view their supplier products"
  ON public.supplier_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.supplier_configurations
      WHERE id = supplier_products.supplier_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert supplier products"
  ON public.supplier_products FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update supplier products"
  ON public.supplier_products FOR UPDATE
  USING (true);

-- ============================================
-- PRODUCT_ANALYSES POLICIES
-- ============================================

CREATE POLICY "Users can view their own analyses"
  ON public.product_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
  ON public.product_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
  ON public.product_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
  ON public.product_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- IMPORT_JOBS POLICIES
-- ============================================

CREATE POLICY "Users can view their own import jobs"
  ON public.import_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own import jobs"
  ON public.import_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update import jobs"
  ON public.import_jobs FOR UPDATE
  USING (true);

-- ============================================
-- ENRICHMENT_QUEUE POLICIES
-- ============================================

CREATE POLICY "Users can view enrichment queue for their products"
  ON public.enrichment_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_analyses
      WHERE id = enrichment_queue.analysis_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage enrichment queue"
  ON public.enrichment_queue FOR ALL
  USING (true);

-- ============================================
-- AMAZON_CREDENTIALS POLICIES
-- ============================================

CREATE POLICY "Users can view their own Amazon credentials"
  ON public.amazon_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Amazon credentials"
  ON public.amazon_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Amazon credentials"
  ON public.amazon_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all Amazon credentials"
  ON public.amazon_credentials FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

-- ============================================
-- RSGP_COMPLIANCE POLICIES
-- ============================================

CREATE POLICY "Users can view RSGP for their products"
  ON public.rsgp_compliance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_analyses
      WHERE id = rsgp_compliance.product_analysis_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage RSGP compliance"
  ON public.rsgp_compliance FOR ALL
  USING (true);

-- ============================================
-- TECHNICAL_SPECS POLICIES
-- ============================================

CREATE POLICY "Users can view specs for their products"
  ON public.technical_specs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_analyses
      WHERE id = technical_specs.product_analysis_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage technical specs"
  ON public.technical_specs FOR ALL
  USING (true);

-- ============================================
-- EMAIL_INBOX POLICIES
-- ============================================

CREATE POLICY "Users can view emails for their suppliers"
  ON public.email_inbox FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.supplier_configurations
      WHERE id = email_inbox.supplier_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage email inbox"
  ON public.email_inbox FOR ALL
  USING (true);

-- ============================================
-- PLATFORM_CONFIGURATIONS POLICIES
-- ============================================

CREATE POLICY "Users can view their own platform configs"
  ON public.platform_configurations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own platform configs"
  ON public.platform_configurations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own platform configs"
  ON public.platform_configurations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own platform configs"
  ON public.platform_configurations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- AMAZON_EDGE_LOGS POLICIES
-- ============================================

CREATE POLICY "Users can view their own Amazon logs"
  ON public.amazon_edge_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert Amazon logs"
  ON public.amazon_edge_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all Amazon logs"
  ON public.amazon_edge_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- IMPORT_STATISTICS POLICIES
-- ============================================

CREATE POLICY "Users can view their own statistics"
  ON public.import_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert statistics"
  ON public.import_statistics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all statistics"
  ON public.import_statistics FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- SUBSCRIPTION_PLANS POLICIES
-- ============================================

CREATE POLICY "Anyone can view subscription plans"
  ON public.subscription_plans FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage subscription plans"
  ON public.subscription_plans FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- ============================================
-- USER_SUBSCRIPTIONS POLICIES
-- ============================================

CREATE POLICY "Users can view their own subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (true);

CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
