import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('[process-enrichment-queue] Starting queue processing')

    // Get pending enrichment tasks (highest priority first)
    const { data: tasks, error: tasksError } = await supabase
      .from('enrichment_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10)

    if (tasksError) throw tasksError

    if (!tasks || tasks.length === 0) {
      console.log('[process-enrichment-queue] No pending tasks')
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[process-enrichment-queue] Processing ${tasks.length} tasks`)

    let processed = 0
    let failed = 0

    for (const task of tasks) {
      try {
        // Mark as processing
        await supabase
          .from('enrichment_queue')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', task.id)

        // Get product analysis
        const { data: product } = await supabase
          .from('product_analyses')
          .select('*')
          .eq('id', task.analysis_id)
          .single()

        if (!product) {
          throw new Error('Product not found')
        }

        // Process based on enrichment type
        let result = null
        switch (task.enrichment_type) {
          case 'amazon':
            // Call amazon-product-search function
            result = await processAmazonEnrichment(product, supabase)
            break
          case 'specifications':
            result = await processSpecificationsEnrichment(product)
            break
          case 'rsgp':
            result = await processRSGPEnrichment(product)
            break
          case 'images':
            result = await processImagesEnrichment(product)
            break
          default:
            throw new Error(`Unknown enrichment type: ${task.enrichment_type}`)
        }

        // Update product with enrichment result
        const enrichmentStatus = product.enrichment_status as Record<string, string> || {}
        enrichmentStatus[task.enrichment_type] = 'completed'

        await supabase
          .from('product_analyses')
          .update({
            enrichment_status: enrichmentStatus,
            analysis_result: { ...product.analysis_result, ...result },
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id)

        // Mark task as completed
        await supabase
          .from('enrichment_queue')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id)

        processed++
      } catch (error) {
        console.error(`[process-enrichment-queue] Task ${task.id} failed:`, error)

        const retryCount = task.retry_count + 1
        const shouldRetry = retryCount < task.max_retries

        await supabase
          .from('enrichment_queue')
          .update({
            status: shouldRetry ? 'pending' : 'failed',
            retry_count: retryCount,
            error_message: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id)

        failed++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        failed,
        total: tasks.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[process-enrichment-queue] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function processAmazonEnrichment(product: any, supabase: any) {
  // Mock Amazon enrichment
  console.log('[enrichment] Processing Amazon for:', product.product_name)
  return {
    amazon_data: {
      asin: 'B08N5WRWNW',
      title: product.product_name,
      price: 29.99,
      images: ['https://m.media-amazon.com/images/I/71abc123.jpg'],
    },
  }
}

async function processSpecificationsEnrichment(product: any) {
  // Mock specifications enrichment using AI
  console.log('[enrichment] Processing specifications for:', product.product_name)
  return {
    specifications: {
      brand: 'Example Brand',
      model: 'EX-123',
      weight: '500g',
      dimensions: '10x20x5cm',
    },
  }
}

async function processRSGPEnrichment(product: any) {
  // Mock RSGP compliance enrichment
  console.log('[enrichment] Processing RSGP for:', product.product_name)
  return {
    rsgp: {
      normes_ce: true,
      evaluation_risque: 'low',
      indice_reparabilite: 7.5,
    },
  }
}

async function processImagesEnrichment(product: any) {
  // Mock image download/processing
  console.log('[enrichment] Processing images for:', product.product_name)
  return {
    processed_images: [
      'https://storage.supabase.co/products/image1.jpg',
      'https://storage.supabase.co/products/image2.jpg',
    ],
  }
}
