import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSupabaseClient } from '../_shared/supabase-client.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabase = createSupabaseClient(authHeader)
    const { analysisId, platformConfigId, customMapping, applyPricingRules } = await req.json()

    console.log('[export-to-odoo] Exporting product', {
      analysisId,
      platformConfigId,
    })

    // Get product
    const { data: product, error: productError } = await supabase
      .from('product_analyses')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (productError) throw productError
    if (!product) throw new Error('Product not found')

    // Get Odoo configuration
    // In production, this would be from a platform_configurations table
    const odooConfig = {
      url: 'https://demo.odoo.com',
      database: 'demo',
      username: 'admin',
      apiKey: 'demo-api-key',
    }

    // Map product fields to Odoo format
    const defaultMapping = {
      name: product.product_name,
      barcode: product.ean,
      list_price: (product.analysis_result as any)?.selling_price || 0,
      standard_price: (product.analysis_result as any)?.purchase_price || 0,
      description: (product.analysis_result as any)?.description || '',
    }

    const mappedProduct = { ...defaultMapping, ...customMapping }

    // TODO: Implement actual Odoo API call using MCP server
    console.log('[export-to-odoo] Mock: Would call Odoo API', mappedProduct)

    // Update exported platforms
    const exportedPlatforms = Array.isArray(product.exported_to_platforms)
      ? product.exported_to_platforms
      : []

    if (!exportedPlatforms.includes('odoo')) {
      exportedPlatforms.push('odoo')
    }

    await supabase
      .from('product_analyses')
      .update({
        exported_to_platforms: exportedPlatforms,
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisId)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          productId: analysisId,
          odooId: 'mock-odoo-123', // Mock Odoo product ID
          exportedAt: new Date().toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[export-to-odoo] Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
