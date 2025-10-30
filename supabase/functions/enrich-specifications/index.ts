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
    const { analysisId } = await req.json()

    console.log('[enrich-specifications] Enriching specifications', { analysisId })

    // Get product analysis
    const { data: product, error: productError } = await supabase
      .from('product_analyses')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (productError) throw productError
    if (!product) throw new Error('Product not found')

    // TODO: Call AI to generate specifications
    // For now, generate mock specifications
    const specifications = generateMockSpecifications(product)

    // Insert into technical_specs table
    const { data: specs, error: specsError } = await supabase
      .from('technical_specs')
      .insert({
        product_analysis_id: analysisId,
        specifications: specifications.details,
        dimensions: specifications.dimensions,
        weight_kg: specifications.weight_kg,
      })
      .select()
      .single()

    if (specsError) throw specsError

    // Update product analysis
    await supabase
      .from('product_analyses')
      .update({
        analysis_result: {
          ...product.analysis_result,
          specifications: specifications.details,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisId)

    console.log('[enrich-specifications] Specifications enriched successfully')

    return new Response(
      JSON.stringify({
        success: true,
        data: specs,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[enrich-specifications] Error:', error)
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

function generateMockSpecifications(product: any) {
  return {
    details: {
      brand: 'Example Brand',
      model: 'EX-' + Math.random().toString(36).substring(7).toUpperCase(),
      color: 'Noir',
      material: 'Plastique ABS',
      warranty: '2 ans',
      origin: 'Fabriqué en UE',
    },
    dimensions: {
      length: 20,
      width: 15,
      height: 5,
      unit: 'cm',
    },
    weight_kg: 0.5,
  }
}
