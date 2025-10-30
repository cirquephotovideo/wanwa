/**
 * API utilities for calling Edge Functions
 */

import { supabase } from '@/integrations/supabase/client'

export async function callEdgeFunction<T = any>(
  functionName: string,
  body?: any
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
    })

    if (error) {
      console.error(`[${functionName}] Error:`, error)
      return { data: null, error }
    }

    return { data: data as T, error: null }
  } catch (error) {
    console.error(`[${functionName}] Exception:`, error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    }
  }
}

/**
 * Import functions
 */
export async function triggerEmailImport(supplierId: string, forceSync = false) {
  return callEdgeFunction('email-imap-poller', {
    supplierId,
    forceSync,
  })
}

export async function triggerFTPSync(
  supplierId: string,
  config?: Record<string, any>
) {
  return callEdgeFunction('supplier-sync-ftp', {
    supplierId,
    config,
  })
}

/**
 * Enrichment functions
 */
export async function enrichProduct(
  analysisId: string,
  enrichmentTypes?: string[]
) {
  return callEdgeFunction('enrich-all', {
    analysisId,
    enrichmentTypes,
  })
}

export async function searchAmazonProduct(
  query: string,
  marketplace = 'A13V1IB3VIYZZH'
) {
  return callEdgeFunction('amazon-product-search', {
    query,
    marketplace,
  })
}

/**
 * Export functions
 */
export async function exportToOdoo(
  analysisId: string,
  platformConfigId: string,
  options?: {
    customMapping?: Record<string, any>
    applyPricingRules?: boolean
  }
) {
  return callEdgeFunction('export-to-odoo', {
    analysisId,
    platformConfigId,
    ...options,
  })
}

export async function exportToShopify(
  analysisId: string,
  platformConfigId: string
) {
  return callEdgeFunction('export-to-shopify', {
    analysisId,
    platformConfigId,
  })
}

/**
 * AI functions
 */
export async function chatWithAI(
  message: string,
  provider: 'lovable' | 'ollama' | 'openai' | 'claude' = 'lovable',
  model?: string
) {
  return callEdgeFunction('ai-chat', {
    message,
    provider,
    model,
  })
}

/**
 * Amazon OAuth
 */
export async function startAmazonOAuth(appId: string, region = 'EU') {
  return callEdgeFunction('amazon-oauth-start', {
    appId,
    region,
  })
}

/**
 * Batch operations
 */
export async function bulkEnrichProducts(analysisIds: string[]) {
  const results = await Promise.allSettled(
    analysisIds.map((id) => enrichProduct(id))
  )

  return {
    total: results.length,
    success: results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
    results,
  }
}

export async function bulkExportProducts(
  analysisIds: string[],
  platformConfigId: string,
  platform: 'odoo' | 'shopify'
) {
  const exportFn = platform === 'odoo' ? exportToOdoo : exportToShopify

  const results = await Promise.allSettled(
    analysisIds.map((id) => exportFn(id, platformConfigId))
  )

  return {
    total: results.length,
    success: results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
    results,
  }
}
