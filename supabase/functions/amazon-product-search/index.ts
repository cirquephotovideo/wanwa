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
    const { query, marketplace, ean } = await req.json()

    console.log('[amazon-product-search] Searching Amazon', {
      query,
      marketplace,
      ean,
    })

    // Get Amazon credentials
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: credentials, error: credError } = await supabase
      .from('amazon_credentials')
      .select('*')
      .eq('user_id', user?.id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (credError || !credentials) {
      throw new Error('Amazon credentials not found. Please connect your Amazon account.')
    }

    // TODO: Implement actual Amazon SP-API call
    // For now, return mock data
    const mockResult = {
      asin: 'B08N5WRWNW',
      title: query || 'Product Name',
      price: 29.99,
      images: [
        'https://m.media-amazon.com/images/I/71abc123.jpg',
      ],
      description: 'Mock product description from Amazon',
      specifications: {
        brand: 'Example Brand',
        model: 'EX-123',
        weight: '500g',
      },
    }

    console.log('[amazon-product-search] Mock result', mockResult)

    return new Response(
      JSON.stringify({
        success: true,
        data: mockResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[amazon-product-search] Error:', error)
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
