import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, provider = 'lovable', model = 'gemini-2.5-flash' } = await req.json()

    console.log('[ai-chat] Processing message', { provider, model })

    // Multi-provider AI fallback system
    let response: string

    try {
      // Try primary provider: Lovable AI (built-in, no API key needed)
      if (provider === 'lovable') {
        // TODO: Implement Lovable AI call
        response = `[Mock Lovable AI Response] You said: "${message}". This is a simulated response from Gemini ${model}.`
      } else if (provider === 'ollama') {
        // Fallback 1: Ollama (local)
        const ollamaUrl = Deno.env.get('OLLAMA_BASE_URL') || 'http://localhost:11434'
        const ollamaRes = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.2-vision',
            prompt: message,
          }),
        })
        const ollamaData = await ollamaRes.json()
        response = ollamaData.response
      } else if (provider === 'openai') {
        // Fallback 2: OpenAI
        const openaiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openaiKey) throw new Error('OpenAI API key not configured')

        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: message }],
          }),
        })
        const openaiData = await openaiRes.json()
        response = openaiData.choices[0].message.content
      } else if (provider === 'claude') {
        // Fallback 3: Claude
        const claudeKey = Deno.env.get('ANTHROPIC_API_KEY')
        if (!claudeKey) throw new Error('Anthropic API key not configured')

        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [{ role: 'user', content: message }],
          }),
        })
        const claudeData = await claudeRes.json()
        response = claudeData.content[0].text
      } else {
        throw new Error('Unknown provider')
      }
    } catch (primaryError) {
      console.error('[ai-chat] Primary provider failed, falling back', primaryError)
      // In production, implement fallback chain here
      response = `[Mock Response] Primary provider failed. Fallback: Your message was "${message}"`
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: response,
          provider,
          model,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[ai-chat] Error:', error)
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
