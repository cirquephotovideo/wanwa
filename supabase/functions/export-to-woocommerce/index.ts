import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

interface WooCommerceProduct {
  name: string
  type: 'simple' | 'variable'
  regular_price: string
  description: string
  short_description: string
  sku: string
  categories: { id: number }[]
  images: { src: string }[]
  attributes?: {
    name: string
    options: string[]
    visible: boolean
    variation: boolean
  }[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { productIds, platformId } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get platform configuration
    const { data: platform, error: platformError } = await supabase
      .from('export_platform_configurations')
      .select('*')
      .eq('id', platformId)
      .single()

    if (platformError) throw platformError

    const config = platform.platform_config as {
      url: string
      consumer_key: string
      consumer_secret: string
    }

    // Get products to export
    const { data: products, error: productsError } = await supabase
      .from('product_analyses')
      .select('*')
      .in('id', productIds)

    if (productsError) throw productsError

    const exportResults = []

    for (const product of products) {
      try {
        // Map product to WooCommerce format
        const wooProduct: WooCommerceProduct = {
          name: product.product_name || '',
          type: 'simple',
          regular_price: product.selling_price?.toString() || '0',
          description: product.long_description || '',
          short_description: product.short_description || '',
          sku: product.ean || '',
          categories: [], // Would map from product categories
          images: (product.image_urls || []).map((url: string) => ({ src: url })),
        }

        // Add attributes from specifications
        if (product.enrichment_status?.specifications?.data) {
          const specs = product.enrichment_status.specifications.data
          wooProduct.attributes = Object.entries(specs).map(([name, value]) => ({
            name,
            options: [String(value)],
            visible: true,
            variation: false,
          }))
        }

        // Call WooCommerce API
        const auth = btoa(`${config.consumer_key}:${config.consumer_secret}`)
        const response = await fetch(`${config.url}/wp-json/wc/v3/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`,
          },
          body: JSON.stringify(wooProduct),
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(`WooCommerce API error: ${error}`)
        }

        const wooResult = await response.json()

        // Update product export status
        const exportedPlatforms = product.exported_to_platforms || []
        exportedPlatforms.push({
          platform: 'woocommerce',
          platform_id: platformId,
          external_id: wooResult.id,
          exported_at: new Date().toISOString(),
        })

        await supabase
          .from('product_analyses')
          .update({ exported_to_platforms: exportedPlatforms })
          .eq('id', product.id)

        exportResults.push({
          product_id: product.id,
          status: 'success',
          external_id: wooResult.id,
        })

        console.log(`✓ Exported product ${product.id} to WooCommerce (ID: ${wooResult.id})`)
      } catch (error) {
        console.error(`✗ Failed to export product ${product.id}:`, error)
        exportResults.push({
          product_id: product.id,
          status: 'error',
          error: error.message,
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        exported: exportResults.filter((r) => r.status === 'success').length,
        failed: exportResults.filter((r) => r.status === 'error').length,
        results: exportResults,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Export to WooCommerce error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
