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

    console.log('[export-to-shopify] Exporting product', {
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

    // Get Shopify configuration
    const { data: config, error: configError } = await supabase
      .from('platform_configurations')
      .select('*')
      .eq('id', platformConfigId)
      .single()

    if (configError) throw configError
    if (!config || config.platform_type !== 'shopify') {
      throw new Error('Shopify configuration not found')
    }

    const shopifyConfig = config.connection_config as {
      shop_url: string
      access_token: string
      api_version?: string
    }

    // Prepare Shopify product data
    const shopifyProduct = {
      product: {
        title: product.product_name,
        body_html: (product.analysis_result as any)?.description || '',
        vendor: (product.analysis_result as any)?.brand || '',
        product_type: (product.analysis_result as any)?.category || '',
        variants: [
          {
            price: (product.analysis_result as any)?.selling_price || '0',
            sku: product.ean,
            barcode: product.ean,
            inventory_management: 'shopify',
          },
        ],
        images: product.image_urls?.map((url) => ({ src: url })) || [],
      },
    }

    // Call Shopify API
    const apiVersion = shopifyConfig.api_version || '2024-01'
    const shopifyUrl = `https://${shopifyConfig.shop_url}/admin/api/${apiVersion}/products.json`

    const shopifyResponse = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyConfig.access_token,
      },
      body: JSON.stringify(shopifyProduct),
    })

    if (!shopifyResponse.ok) {
      const errorData = await shopifyResponse.text()
      throw new Error(`Shopify API error: ${errorData}`)
    }

    const shopifyResult = await shopifyResponse.json()

    console.log('[export-to-shopify] Product exported successfully', shopifyResult.product.id)

    // Update exported platforms
    const exportedPlatforms = Array.isArray(product.exported_to_platforms)
      ? product.exported_to_platforms
      : []

    if (!exportedPlatforms.includes('shopify')) {
      exportedPlatforms.push('shopify')
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
          shopifyId: shopifyResult.product.id,
          shopifyHandle: shopifyResult.product.handle,
          exportedAt: new Date().toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[export-to-shopify] Error:', error)
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
