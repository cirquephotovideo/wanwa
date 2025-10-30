import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

interface MagentoProduct {
  product: {
    sku: string
    name: string
    attribute_set_id: number
    price: number
    status: number
    visibility: number
    type_id: string
    weight?: number
    extension_attributes?: {
      stock_item?: {
        qty: number
        is_in_stock: boolean
      }
      category_links?: {
        category_id: string
      }[]
    }
    custom_attributes?: {
      attribute_code: string
      value: string | number
    }[]
    media_gallery_entries?: {
      media_type: string
      label: string
      position: number
      disabled: boolean
      types: string[]
      file: string
    }[]
  }
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
      access_token: string
      attribute_set_id: number
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
        // Map product to Magento format
        const magentoProduct: MagentoProduct = {
          product: {
            sku: product.ean || `PRODUCT-${product.id}`,
            name: product.product_name || '',
            attribute_set_id: config.attribute_set_id || 4,
            price: parseFloat(product.selling_price) || 0,
            status: 1, // Enabled
            visibility: 4, // Catalog, Search
            type_id: 'simple',
            weight: product.weight || 0,
            extension_attributes: {
              stock_item: {
                qty: 100, // Default quantity
                is_in_stock: true,
              },
            },
            custom_attributes: [],
            media_gallery_entries: [],
          },
        }

        // Add description
        if (product.long_description) {
          magentoProduct.product.custom_attributes?.push({
            attribute_code: 'description',
            value: product.long_description,
          })
        }

        if (product.short_description) {
          magentoProduct.product.custom_attributes?.push({
            attribute_code: 'short_description',
            value: product.short_description,
          })
        }

        // Add EAN as custom attribute
        if (product.ean) {
          magentoProduct.product.custom_attributes?.push({
            attribute_code: 'ean',
            value: product.ean,
          })
        }

        // Add images
        if (product.image_urls && product.image_urls.length > 0) {
          magentoProduct.product.media_gallery_entries = product.image_urls.map(
            (url: string, index: number) => ({
              media_type: 'image',
              label: product.product_name || '',
              position: index + 1,
              disabled: false,
              types: index === 0 ? ['image', 'small_image', 'thumbnail'] : [],
              file: url,
            })
          )
        }

        // Add specifications as custom attributes
        if (product.enrichment_status?.specifications?.data) {
          const specs = product.enrichment_status.specifications.data
          for (const [key, value] of Object.entries(specs)) {
            magentoProduct.product.custom_attributes?.push({
              attribute_code: key.toLowerCase().replace(/\s+/g, '_'),
              value: String(value),
            })
          }
        }

        // Call Magento API
        const response = await fetch(`${config.url}/rest/V1/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.access_token}`,
          },
          body: JSON.stringify(magentoProduct),
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(`Magento API error: ${error}`)
        }

        const magentoResult = await response.json()

        // Update product export status
        const exportedPlatforms = product.exported_to_platforms || []
        exportedPlatforms.push({
          platform: 'magento',
          platform_id: platformId,
          external_id: magentoResult.id,
          sku: magentoResult.sku,
          exported_at: new Date().toISOString(),
        })

        await supabase
          .from('product_analyses')
          .update({ exported_to_platforms: exportedPlatforms })
          .eq('id', product.id)

        exportResults.push({
          product_id: product.id,
          status: 'success',
          external_id: magentoResult.id,
          sku: magentoResult.sku,
        })

        console.log(`✓ Exported product ${product.id} to Magento (SKU: ${magentoResult.sku})`)
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
    console.error('Export to Magento error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
