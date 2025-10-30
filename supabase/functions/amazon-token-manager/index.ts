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

    console.log('[amazon-token-manager] Starting token refresh')

    // Get all credentials that need refresh (expires within next hour)
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000)

    const { data: credentials, error: credError } = await supabase
      .from('amazon_credentials')
      .select('*')
      .eq('is_active', true)
      .lt('token_expires_at', oneHourFromNow.toISOString())

    if (credError) throw credError

    if (!credentials || credentials.length === 0) {
      console.log('[amazon-token-manager] No credentials need refresh')
      return new Response(
        JSON.stringify({ success: true, refreshed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[amazon-token-manager] Refreshing ${credentials.length} credentials`)

    const clientId = Deno.env.get('AMAZON_CLIENT_ID')
    const clientSecret = Deno.env.get('AMAZON_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      throw new Error('Amazon credentials not configured')
    }

    let refreshed = 0
    let failed = 0

    for (const cred of credentials) {
      try {
        // Call Amazon token endpoint
        const tokenResponse = await fetch('https://api.amazon.com/auth/o2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: cred.refresh_token_encrypted,
            client_id: clientId,
            client_secret: clientSecret,
          }),
        })

        if (!tokenResponse.ok) {
          const error = await tokenResponse.text()
          throw new Error(`Token refresh failed: ${error}`)
        }

        const tokens = await tokenResponse.json()

        // Update credentials
        const tokenExpiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000)

        await supabase
          .from('amazon_credentials')
          .update({
            access_token_encrypted: tokens.access_token,
            token_expires_at: tokenExpiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', cred.id)

        refreshed++
        console.log(`[amazon-token-manager] Refreshed token for credential ${cred.id}`)
      } catch (error) {
        console.error(`[amazon-token-manager] Failed to refresh ${cred.id}:`, error)
        failed++

        // Log error
        await supabase.from('amazon_edge_logs').insert({
          user_id: cred.user_id,
          function_name: 'amazon-token-manager',
          event_type: 'token_refresh_failed',
          error_message: error.message,
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        refreshed,
        failed,
        total: credentials.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[amazon-token-manager] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
