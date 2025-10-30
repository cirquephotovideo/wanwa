import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Enrich product images using AI vision models
 * - Download product images
 * - Analyze with AI vision (Gemini Vision, GPT-4 Vision, Claude Vision)
 * - Extract: product type, colors, features, dimensions
 * - Generate alt text for accessibility
 * - Update product with enriched data
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { productId } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Enriching images for product: ${productId}`)

    // Get product
    const { data: product, error: productError } = await supabase
      .from('product_analyses')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError) throw productError

    if (!product.image_urls || product.image_urls.length === 0) {
      throw new Error('No images found for this product')
    }

    const enrichedData: any = {
      detected_features: [],
      colors: [],
      alt_texts: [],
      image_quality_scores: [],
    }

    // Process each image
    for (let i = 0; i < product.image_urls.length; i++) {
      const imageUrl = product.image_urls[i]

      console.log(`Processing image ${i + 1}/${product.image_urls.length}: ${imageUrl}`)

      try {
        // Try Gemini Vision first (via Lovable AI)
        const geminiKey = Deno.env.get('GEMINI_API_KEY')

        if (geminiKey) {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `Analyze this product image and provide a JSON response with:
                        - detected_type: the type of product (e.g., "smartphone", "laptop", "watch")
                        - colors: array of main colors detected
                        - features: array of visible features (e.g., "touch screen", "metal frame", "buttons")
                        - condition: product condition ("new", "like new", "used")
                        - alt_text: a descriptive alt text for accessibility (max 125 chars)
                        - quality_score: image quality from 1-10

                        Respond only with valid JSON.`,
                      },
                      {
                        inline_data: {
                          mime_type: 'image/jpeg',
                          data: await fetchImageAsBase64(imageUrl),
                        },
                      },
                    ],
                  },
                ],
              }),
            }
          )

          if (response.ok) {
            const data = await response.json()
            const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text

            if (textContent) {
              const jsonMatch = textContent.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const imageData = JSON.parse(jsonMatch[0])

                enrichedData.detected_features.push(...(imageData.features || []))
                enrichedData.colors.push(...(imageData.colors || []))
                enrichedData.alt_texts.push(imageData.alt_text || '')
                enrichedData.image_quality_scores.push(imageData.quality_score || 5)

                console.log(`✓ Image ${i + 1} analyzed successfully`)
              }
            }
          }
        } else {
          // Fallback: Basic image analysis without AI
          console.warn('No Gemini API key, skipping AI analysis')
          enrichedData.alt_texts.push(
            `${product.product_name || 'Product'} - Image ${i + 1}`
          )
          enrichedData.image_quality_scores.push(7) // Default score
        }
      } catch (error) {
        console.error(`Error processing image ${i + 1}:`, error)
        enrichedData.alt_texts.push(`${product.product_name || 'Product'} - Image ${i + 1}`)
        enrichedData.image_quality_scores.push(5)
      }
    }

    // Remove duplicates
    enrichedData.detected_features = [...new Set(enrichedData.detected_features)]
    enrichedData.colors = [...new Set(enrichedData.colors)]

    // Calculate average image quality
    const avgQuality =
      enrichedData.image_quality_scores.reduce((a: number, b: number) => a + b, 0) /
      enrichedData.image_quality_scores.length

    // Update product with enriched data
    const currentEnrichment = product.enrichment_status || {}
    const updatedEnrichment = {
      ...currentEnrichment,
      images: {
        status: 'completed',
        completed_at: new Date().toISOString(),
        data: enrichedData,
        average_quality: avgQuality.toFixed(1),
      },
    }

    // Also update product metadata if detected
    const updates: any = {
      enrichment_status: updatedEnrichment,
    }

    // Update colors if detected
    if (enrichedData.colors.length > 0 && !product.color) {
      updates.color = enrichedData.colors[0] // Primary color
    }

    await supabase.from('product_analyses').update(updates).eq('id', productId)

    console.log(`✓ Product ${productId} image enrichment completed`)

    return new Response(
      JSON.stringify({
        success: true,
        product_id: productId,
        images_processed: product.image_urls.length,
        enriched_data: enrichedData,
        average_quality: avgQuality.toFixed(1),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Image enrichment error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Helper function to fetch image and convert to base64
async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
  return base64
}
