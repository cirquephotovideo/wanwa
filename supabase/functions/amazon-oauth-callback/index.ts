import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('spapi_oauth_code')
    const state = url.searchParams.get('state')
    const sellingPartnerId = url.searchParams.get('selling_partner_id')

    console.log('[amazon-oauth-callback] Received OAuth callback', {
      hasCode: !!code,
      state,
      sellingPartnerId,
    })

    if (!code) {
      throw new Error('No authorization code received')
    }

    // Get client credentials from environment
    const clientId = Deno.env.get('AMAZON_CLIENT_ID')
    const clientSecret = Deno.env.get('AMAZON_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      throw new Error('Amazon credentials not configured')
    }

    // Exchange code for tokens
    // Amazon SP-API token endpoint
    const tokenEndpoint = 'https://api.amazon.com/auth/o2/token'

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const redirectUri = `${supabaseUrl}/functions/v1/amazon-oauth-callback`

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      throw new Error(`Token exchange failed: ${errorData}`)
    }

    const tokens = await tokenResponse.json()

    console.log('[amazon-oauth-callback] Tokens received successfully')

    // Store credentials in database
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user ID from auth header (if available)
    const authHeader = req.headers.get('Authorization')
    let userId = null

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      )
      userId = user?.id
    }

    if (userId) {
      // Calculate token expiry (typically 1 hour)
      const tokenExpiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000)
      // Amazon refresh tokens expire after 1 year
      const secretExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

      await supabase.from('amazon_credentials').insert({
        user_id: userId,
        marketplace_id: sellingPartnerId || 'UNKNOWN',
        refresh_token_encrypted: tokens.refresh_token,
        access_token_encrypted: tokens.access_token,
        token_expires_at: tokenExpiresAt.toISOString(),
        secret_expires_at: secretExpiresAt.toISOString(),
        is_active: true,
      })

      console.log('[amazon-oauth-callback] Credentials stored successfully')
    }

    // Redirect to success page
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'
    const successUrl = `${frontendUrl}/admin?amazon_connected=true`

    return new Response(null, {
      status: 302,
      headers: {
        Location: successUrl,
        ...corsHeaders,
      },
    })
  } catch (error) {
    console.error('[amazon-oauth-callback] Error:', error)

    // Redirect to error page
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'
    const errorUrl = `${frontendUrl}/admin?amazon_error=${encodeURIComponent(error.message)}`

    return new Response(null, {
      status: 302,
      headers: {
        Location: errorUrl,
        ...corsHeaders,
      },
    })
  }
})
