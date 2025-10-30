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

    console.log('[rsgp-compliance-generator] Generating RSGP compliance', { analysisId })

    // Get product analysis
    const { data: product, error: productError } = await supabase
      .from('product_analyses')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (productError) throw productError
    if (!product) throw new Error('Product not found')

    // Extract product info for AI analysis
    const productInfo = {
      name: product.product_name,
      ean: product.ean,
      category: (product.analysis_result as any)?.category,
      description: (product.analysis_result as any)?.description,
    }

    // TODO: Call AI to analyze RSGP compliance
    // For now, generate mock data based on product category
    const rsgpCompliance = generateMockRSGPCompliance(productInfo)

    // Insert into rsgp_compliance table
    const { data: compliance, error: complianceError } = await supabase
      .from('rsgp_compliance')
      .insert({
        product_analysis_id: analysisId,
        normes_ce: rsgpCompliance.normes_ce,
        evaluation_risque: rsgpCompliance.evaluation_risque,
        indice_reparabilite: rsgpCompliance.indice_reparabilite,
        document_url: rsgpCompliance.document_url,
      })
      .select()
      .single()

    if (complianceError) throw complianceError

    console.log('[rsgp-compliance-generator] RSGP compliance generated successfully')

    return new Response(
      JSON.stringify({
        success: true,
        data: compliance,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[rsgp-compliance-generator] Error:', error)
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

function generateMockRSGPCompliance(productInfo: any) {
  // Mock RSGP compliance based on product category
  const isElectronic = productInfo.category?.toLowerCase().includes('électronique')

  return {
    normes_ce: {
      conforme: true,
      directives: ['2014/30/UE', '2014/35/UE'],
      certificats: ['CE-123456'],
    },
    evaluation_risque: {
      niveau: 'faible',
      categories: ['chimique', 'électrique'],
      mesures_prevention: [
        'Utiliser selon les instructions',
        'Ne pas exposer à l\'humidité',
      ],
    },
    indice_reparabilite: isElectronic ? 7.5 : null,
    document_url: 'https://storage.supabase.co/rsgp/mock-document.pdf',
  }
}
