import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Generate AI-powered product descriptions
 * - Short description (50-150 chars) for listings
 * - Long description (500-1500 chars) for product pages
 * - SEO-optimized with keywords
 * - Multiple languages support
 * - Marketing-focused copywriting
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { productId, language = 'fr', tone = 'professional' } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Generating descriptions for product: ${productId}`)

    // Get product
    const { data: product, error: productError } = await supabase
      .from('product_analyses')
      .select('*')
      .single()
      .eq('id', productId)

    if (productError) throw productError

    // Prepare context for AI
    const context = {
      name: product.product_name,
      brand: product.brand,
      category: product.category,
      ean: product.ean,
      price: product.selling_price,
      features: product.enrichment_status?.specifications?.data || {},
      existing_description: product.long_description,
    }

    const prompt = `You are a professional product copywriter specializing in e-commerce.

Product Details:
- Name: ${context.name}
- Brand: ${context.brand || 'Unknown'}
- Category: ${context.category || 'General'}
- EAN: ${context.ean}
- Price: ${context.price}€
${Object.keys(context.features).length > 0 ? `- Features: ${JSON.stringify(context.features, null, 2)}` : ''}

Generate two product descriptions in ${language === 'fr' ? 'French' : 'English'}:

1. SHORT DESCRIPTION (50-150 characters):
   - Catchy and concise
   - Highlight main benefit
   - Include brand if premium
   - Perfect for product listings

2. LONG DESCRIPTION (500-1500 characters):
   - Engaging introduction
   - Key features and benefits (not just specs)
   - Use cases and applications
   - Technical specifications (if applicable)
   - Call to action
   - SEO-friendly keywords
   - Tone: ${tone}

Format your response as JSON:
{
  "short_description": "...",
  "long_description": "...",
  "keywords": ["keyword1", "keyword2", ...],
  "highlights": ["benefit1", "benefit2", ...]
}`

    let shortDesc = ''
    let longDesc = ''
    let keywords: string[] = []
    let highlights: string[] = []

    // Try multiple AI providers with fallback
    const providers = [
      { name: 'gemini', key: Deno.env.get('GEMINI_API_KEY') },
      { name: 'openai', key: Deno.env.get('OPENAI_API_KEY') },
      { name: 'anthropic', key: Deno.env.get('ANTHROPIC_API_KEY') },
    ]

    for (const provider of providers) {
      if (!provider.key) continue

      try {
        console.log(`Trying ${provider.name}...`)

        if (provider.name === 'gemini') {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${provider.key}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            }
          )

          if (response.ok) {
            const data = await response.json()
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text

            if (text) {
              const jsonMatch = text.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0])
                shortDesc = result.short_description
                longDesc = result.long_description
                keywords = result.keywords || []
                highlights = result.highlights || []
                break
              }
            }
          }
        } else if (provider.name === 'openai') {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${provider.key}`,
            },
            body: JSON.stringify({
              model: 'gpt-4',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            const text = data.choices?.[0]?.message?.content

            if (text) {
              const jsonMatch = text.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0])
                shortDesc = result.short_description
                longDesc = result.long_description
                keywords = result.keywords || []
                highlights = result.highlights || []
                break
              }
            }
          }
        } else if (provider.name === 'anthropic') {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': provider.key,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-3-sonnet-20240229',
              max_tokens: 2000,
              messages: [{ role: 'user', content: prompt }],
            }),
          })

          if (response.ok) {
            const data = await response.json()
            const text = data.content?.[0]?.text

            if (text) {
              const jsonMatch = text.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0])
                shortDesc = result.short_description
                longDesc = result.long_description
                keywords = result.keywords || []
                highlights = result.highlights || []
                break
              }
            }
          }
        }
      } catch (error) {
        console.error(`${provider.name} failed:`, error)
        continue
      }
    }

    // Fallback: Generate basic descriptions if AI fails
    if (!shortDesc || !longDesc) {
      shortDesc = `${product.brand ? product.brand + ' ' : ''}${product.product_name} - ${product.category || 'Produit de qualité'}`
      longDesc = `Découvrez ${product.brand ? 'le ' + product.brand + ' ' : ''}${product.product_name}, un produit ${product.category || 'exceptionnel'} qui saura répondre à vos attentes. ${context.existing_description || ''}`

      keywords = [
        product.brand,
        ...(product.category?.split('>').map((c) => c.trim()) || []),
      ].filter(Boolean)

      console.warn('Using fallback descriptions (AI generation failed)')
    }

    // Update product
    const updates = {
      short_description: shortDesc,
      long_description: longDesc,
      seo_keywords: keywords,
      enrichment_status: {
        ...product.enrichment_status,
        description: {
          status: 'completed',
          completed_at: new Date().toISOString(),
          language,
          tone,
        },
      },
    }

    await supabase.from('product_analyses').update(updates).eq('id', productId)

    console.log(`✓ Descriptions generated for product ${productId}`)

    return new Response(
      JSON.stringify({
        success: true,
        product_id: productId,
        short_description: shortDesc,
        long_description: longDesc,
        keywords,
        highlights,
        language,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Description generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
