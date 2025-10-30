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
    const { analysisId, enrichmentTypes } = await req.json()

    console.log('[enrich-all] Starting enrichment', {
      analysisId,
      enrichmentTypes,
    })

    // Get product analysis
    const { data: product, error: productError } = await supabase
      .from('product_analyses')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (productError) throw productError
    if (!product) throw new Error('Product not found')

    const enrichmentStatus: Record<string, string> = {
      ...(product.enrichment_status as Record<string, string> || {}),
    }

    // Queue enrichment tasks
    const tasks = enrichmentTypes || ['amazon', 'specifications', 'rsgp', 'images']

    for (const type of tasks) {
      // Add to enrichment queue
      await supabase.from('enrichment_queue').insert({
        analysis_id: analysisId,
        enrichment_type: type,
        status: 'pending',
        priority: type === 'amazon' ? 10 : 5,
      })

      enrichmentStatus[type] = 'queued'
    }

    // Update enrichment status
    await supabase
      .from('product_analyses')
      .update({
        enrichment_status: enrichmentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisId)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          analysisId,
          queuedTasks: tasks.length,
          enrichmentStatus,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[enrich-all] Error:', error)
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
