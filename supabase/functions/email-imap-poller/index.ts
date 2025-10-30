import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSupabaseClient } from '../_shared/supabase-client.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabase = createSupabaseClient(authHeader)
    const { supplierId, forceSync } = await req.json()

    console.log('[email-imap-poller] Starting email polling', {
      supplierId,
      forceSync,
    })

    // Get supplier configuration
    const { data: supplier, error: supplierError } = await supabase
      .from('supplier_configurations')
      .select('*')
      .eq('id', supplierId)
      .single()

    if (supplierError) throw supplierError
    if (!supplier) throw new Error('Supplier not found')
    if (supplier.source_type !== 'email') {
      throw new Error('Supplier is not configured for email import')
    }

    const config = supplier.connection_config as {
      host: string
      port: number
      username: string
      password: string
      folder?: string
    }

    // TODO: Implement actual IMAP connection and email fetching
    // For now, return mock data
    console.log('[email-imap-poller] Mock: Would connect to IMAP server', config.host)

    // Simulate processing
    const mockResult = {
      emailsFound: 5,
      attachmentsProcessed: 3,
      productsImported: 150,
    }

    // Update last sync timestamp
    await supabase
      .from('supplier_configurations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', supplierId)

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
    console.error('[email-imap-poller] Error:', error)
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
