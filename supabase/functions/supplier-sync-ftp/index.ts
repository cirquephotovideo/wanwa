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
    const { supplierId, config } = await req.json()

    console.log('[supplier-sync-ftp] Starting FTP sync', { supplierId })

    // Get supplier configuration
    const { data: supplier, error: supplierError } = await supabase
      .from('supplier_configurations')
      .select('*')
      .eq('id', supplierId)
      .single()

    if (supplierError) throw supplierError
    if (!supplier) throw new Error('Supplier not found')
    if (supplier.source_type !== 'ftp') {
      throw new Error('Supplier is not configured for FTP sync')
    }

    const ftpConfig = config || (supplier.connection_config as {
      host: string
      port: number
      username: string
      password: string
      remotePath: string
      protocol: 'ftp' | 'sftp'
    })

    // TODO: Implement actual FTP/SFTP connection
    // For now, return mock data
    console.log('[supplier-sync-ftp] Mock: Would connect to FTP server', ftpConfig.host)

    // Simulate FTP sync process
    const mockFiles = [
      { name: 'catalog_2025_01.csv', size: 1024000, modified: new Date() },
      { name: 'products.xlsx', size: 512000, modified: new Date() },
    ]

    console.log(`[supplier-sync-ftp] Found ${mockFiles.length} files`)

    // Create import job
    const { data: importJob } = await supabase
      .from('import_jobs')
      .insert({
        user_id: supplier.user_id,
        supplier_id: supplierId,
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Simulate processing files and creating products
    const mockResult = {
      filesProcessed: mockFiles.length,
      productsCreated: 250,
      productsUpdated: 50,
    }

    // Update import job
    if (importJob) {
      await supabase
        .from('import_jobs')
        .update({
          status: 'completed',
          products_created: mockResult.productsCreated,
          products_updated: mockResult.productsUpdated,
          completed_at: new Date().toISOString(),
        })
        .eq('id', importJob.id)
    }

    // Update last sync timestamp
    await supabase
      .from('supplier_configurations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', supplierId)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...mockResult,
          importJobId: importJob?.id,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[supplier-sync-ftp] Error:', error)
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
