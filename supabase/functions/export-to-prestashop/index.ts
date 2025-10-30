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
    const { analysisId, platformConfigId } = await req.json()

    console.log('[export-to-prestashop] Exporting product', {
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

    // Get PrestaShop configuration
    const { data: config, error: configError } = await supabase
      .from('platform_configurations')
      .select('*')
      .eq('id', platformConfigId)
      .single()

    if (configError) throw configError
    if (!config || config.platform_type !== 'prestashop') {
      throw new Error('PrestaShop configuration not found')
    }

    const prestashopConfig = config.connection_config as {
      shop_url: string
      api_key: string
    }

    // Prepare PrestaShop product data (XML format)
    const prestashopProduct = {
      product: {
        name: {
          language: {
            _attributes: { id: '1' },
            _text: product.product_name,
          },
        },
        description: {
          language: {
            _attributes: { id: '1' },
            _text: (product.analysis_result as any)?.description || '',
          },
        },
        price: (product.analysis_result as any)?.selling_price || '0',
        ean13: product.ean,
        active: '1',
        id_category_default: '2',
      },
    }

    // Call PrestaShop Web Service API
    const prestashopUrl = `${prestashopConfig.shop_url}/api/products`

    // TODO: Implement actual PrestaShop API call with XML
    console.log('[export-to-prestashop] Mock: Would call PrestaShop API', prestashopUrl)

    const mockPrestaShopId = Math.floor(Math.random() * 10000)

    // Update exported platforms
    const exportedPlatforms = Array.isArray(product.exported_to_platforms)
      ? product.exported_to_platforms
      : []

    if (!exportedPlatforms.includes('prestashop')) {
      exportedPlatforms.push('prestashop')
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
          prestashopId: mockPrestaShopId,
          exportedAt: new Date().toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[export-to-prestashop] Error:', error)
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
