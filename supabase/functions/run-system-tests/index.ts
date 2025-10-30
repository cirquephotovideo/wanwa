import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

interface TestResult {
  test_name: string
  status: 'passed' | 'failed'
  duration_ms: number
  error?: string
  details?: Record<string, unknown>
}

/**
 * Run system health and integration tests
 * - Database connectivity
 * - Edge Functions availability
 * - External API connectivity (Amazon, AI providers)
 * - Storage accessibility
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const results: TestResult[] = []

    // Test 1: Database connectivity
    const dbTest = await runTest('Database Connectivity', async () => {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      if (error) throw error
      return { user_count_query: 'success' }
    })
    results.push(dbTest)

    // Test 2: Storage accessibility
    const storageTest = await runTest('Storage Accessibility', async () => {
      const { data, error } = await supabase.storage
        .from('supplier-imports')
        .list('', { limit: 1 })

      if (error) throw error
      return { storage_accessible: true, files_found: data.length }
    })
    results.push(storageTest)

    // Test 3: Enrichment queue health
    const queueTest = await runTest('Enrichment Queue Health', async () => {
      const { data: pending, error: pendingError } = await supabase
        .from('enrichment_queue')
        .select('count')
        .eq('status', 'pending')
        .single()

      if (pendingError) throw pendingError

      const { data: stuck, error: stuckError } = await supabase
        .from('enrichment_queue')
        .select('count')
        .eq('status', 'processing')
        .lt('updated_at', new Date(Date.now() - 3600000).toISOString()) // 1 hour ago
        .single()

      if (stuckError) throw stuckError

      return {
        pending_tasks: pending,
        potentially_stuck_tasks: stuck,
        queue_healthy: (stuck?.count || 0) < 10,
      }
    })
    results.push(queueTest)

    // Test 4: Import jobs health
    const importTest = await runTest('Import Jobs Health', async () => {
      const { data: recent, error } = await supabase
        .from('import_jobs')
        .select('status')
        .gte('created_at', new Date(Date.now() - 86400000).toISOString()) // Last 24h

      if (error) throw error

      const statusCounts = recent.reduce((acc: Record<string, number>, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1
        return acc
      }, {})

      const successRate =
        recent.length > 0
          ? ((statusCounts.completed || 0) / recent.length) * 100
          : 100

      return {
        last_24h_jobs: recent.length,
        status_breakdown: statusCounts,
        success_rate: `${successRate.toFixed(1)}%`,
        health_status: successRate >= 80 ? 'healthy' : 'degraded',
      }
    })
    results.push(importTest)

    // Test 5: Amazon credentials validity
    const amazonTest = await runTest('Amazon Credentials Status', async () => {
      const { data: creds, error } = await supabase
        .from('amazon_credentials')
        .select('id, access_token_expires_at, refresh_token_expires_at')
        .limit(5)

      if (error) throw error

      const now = new Date()
      const expiringSoon = creds.filter((c) => {
        const expiresAt = new Date(c.access_token_expires_at)
        const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / 3600000
        return hoursUntilExpiry < 24 && hoursUntilExpiry > 0
      })

      const expired = creds.filter((c) => {
        const expiresAt = new Date(c.access_token_expires_at)
        return expiresAt < now
      })

      return {
        total_credentials: creds.length,
        expiring_within_24h: expiringSoon.length,
        expired: expired.length,
        credentials_healthy: expired.length === 0,
      }
    })
    results.push(amazonTest)

    // Test 6: AI provider connectivity
    const aiTest = await runTest('AI Provider Connectivity', async () => {
      const providers: Record<string, boolean> = {}

      // Test Lovable AI (Gemini)
      try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1/models', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        providers.lovable = response.ok
      } catch {
        providers.lovable = false
      }

      // Test OpenAI (if configured)
      const openaiKey = Deno.env.get('OPENAI_API_KEY')
      if (openaiKey) {
        try {
          const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
            },
          })
          providers.openai = response.ok
        } catch {
          providers.openai = false
        }
      }

      return {
        providers_tested: Object.keys(providers),
        providers_available: Object.values(providers).filter(Boolean).length,
        provider_status: providers,
      }
    })
    results.push(aiTest)

    // Test 7: Edge Functions invocation
    const edgeFunctionsTest = await runTest('Edge Functions Health', async () => {
      // Try to invoke a simple Edge Function to test infrastructure
      try {
        const { data, error } = await supabase.functions.invoke('enrich-all', {
          body: { test: true },
        })

        return {
          edge_functions_accessible: !error,
          test_invocation: error ? 'failed' : 'success',
        }
      } catch (e) {
        return {
          edge_functions_accessible: false,
          error: e.message,
        }
      }
    })
    results.push(edgeFunctionsTest)

    // Calculate overall health
    const passedTests = results.filter((r) => r.status === 'passed').length
    const totalTests = results.length
    const healthScore = (passedTests / totalTests) * 100

    const overallStatus =
      healthScore === 100 ? 'healthy' : healthScore >= 80 ? 'degraded' : 'critical'

    return new Response(
      JSON.stringify({
        success: true,
        overall_status: overallStatus,
        health_score: `${healthScore.toFixed(1)}%`,
        tests_passed: passedTests,
        tests_failed: totalTests - passedTests,
        total_tests: totalTests,
        test_results: results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('System tests error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Helper function to run individual tests
async function runTest(
  testName: string,
  testFn: () => Promise<Record<string, unknown>>
): Promise<TestResult> {
  const startTime = Date.now()
  try {
    const details = await testFn()
    return {
      test_name: testName,
      status: 'passed',
      duration_ms: Date.now() - startTime,
      details,
    }
  } catch (error) {
    return {
      test_name: testName,
      status: 'failed',
      duration_ms: Date.now() - startTime,
      error: error.message,
    }
  }
}
