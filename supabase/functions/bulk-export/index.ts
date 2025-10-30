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
    const { analysisIds, platformConfigId, platform } = await req.json()

    console.log('[bulk-export] Starting bulk export', {
      count: analysisIds.length,
      platform,
    })

    if (!analysisIds || analysisIds.length === 0) {
      throw new Error('No products to export')
    }

    if (analysisIds.length > 100) {
      throw new Error('Maximum 100 products per batch')
    }

    // Get platform configuration
    const { data: config, error: configError } = await supabase
      .from('platform_configurations')
      .select('*')
      .eq('id', platformConfigId)
      .single()

    if (configError) throw configError
    if (!config) throw new Error('Platform configuration not found')

    const results = {
      total: analysisIds.length,
      success: 0,
      failed: 0,
      errors: [] as any[],
    }

    // Process exports in batches of 10
    const batchSize = 10
    for (let i = 0; i < analysisIds.length; i += batchSize) {
      const batch = analysisIds.slice(i, i + batchSize)

      await Promise.allSettled(
        batch.map(async (analysisId: string) => {
          try {
            // Call appropriate export function
            const exportFunctionName = `export-to-${platform}`

            const { error: exportError } = await supabase.functions.invoke(
              exportFunctionName,
              {
                body: { analysisId, platformConfigId },
              }
            )

            if (exportError) throw exportError

            results.success++
          } catch (error) {
            results.failed++
            results.errors.push({
              analysisId,
              error: error.message,
            })
          }
        })
      )

      // Wait 1 second between batches to avoid rate limiting
      if (i + batchSize < analysisIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    console.log('[bulk-export] Bulk export completed', results)

    return new Response(
      JSON.stringify({
        success: true,
        data: results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[bulk-export] Error:', error)
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
