import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { appId, region = 'EU' } = await req.json()

    console.log('[amazon-oauth-start] Initiating OAuth flow', { appId, region })

    if (!appId) {
      throw new Error('App ID is required')
    }

    // Amazon SP-API OAuth endpoints by region
    const endpoints: Record<string, string> = {
      NA: 'https://sellercentral.amazon.com/apps/authorize/consent',
      EU: 'https://sellercentral-europe.amazon.com/apps/authorize/consent',
      FE: 'https://sellercentral.amazon.co.jp/apps/authorize/consent',
    }

    const authEndpoint = endpoints[region] || endpoints.EU

    // Build callback URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const callbackUrl = `${supabaseUrl}/functions/v1/amazon-oauth-callback`

    // Generate state for CSRF protection
    const state = crypto.randomUUID()

    // Store state in a temporary cache (in production, use Redis or DB)
    // For now, we'll pass it through

    // Build authorization URL
    const authUrl = new URL(authEndpoint)
    authUrl.searchParams.append('application_id', appId)
    authUrl.searchParams.append('redirect_uri', callbackUrl)
    authUrl.searchParams.append('state', state)
    authUrl.searchParams.append('version', 'beta')

    console.log('[amazon-oauth-start] Authorization URL generated', authUrl.toString())

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          authUrl: authUrl.toString(),
          state,
          region,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[amazon-oauth-start] Error:', error)
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
