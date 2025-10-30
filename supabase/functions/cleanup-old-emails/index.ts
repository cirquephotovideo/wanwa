import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Cleanup old processed emails and attachments
 * - Deletes emails older than 30 days
 * - Removes orphaned attachments
 * - Cleans up failed import jobs
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

    const retentionDays = 30
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const cleanupResults = {
      emails_deleted: 0,
      attachments_deleted: 0,
      failed_jobs_deleted: 0,
      storage_freed_mb: 0,
    }

    // 1. Delete old processed emails
    const { data: oldEmails, error: emailError } = await supabase
      .from('supplier_emails')
      .select('id, subject')
      .lt('processed_at', cutoffDate.toISOString())
      .eq('processing_status', 'completed')

    if (emailError) {
      console.error('Error fetching old emails:', emailError)
    } else if (oldEmails) {
      console.log(`Found ${oldEmails.length} old emails to delete`)

      for (const email of oldEmails) {
        const { error: deleteError } = await supabase
          .from('supplier_emails')
          .delete()
          .eq('id', email.id)

        if (!deleteError) {
          cleanupResults.emails_deleted++
          console.log(`✓ Deleted email: ${email.subject}`)
        }
      }
    }

    // 2. Delete old failed import jobs
    const { data: failedJobs, error: jobError } = await supabase
      .from('import_jobs')
      .select('id, file_name, file_size')
      .lt('created_at', cutoffDate.toISOString())
      .eq('status', 'failed')

    if (jobError) {
      console.error('Error fetching failed jobs:', jobError)
    } else if (failedJobs) {
      console.log(`Found ${failedJobs.length} failed import jobs to delete`)

      for (const job of failedJobs) {
        // Delete from storage if file exists
        if (job.file_name) {
          const { error: storageError } = await supabase.storage
            .from('supplier-imports')
            .remove([job.file_name])

          if (!storageError && job.file_size) {
            cleanupResults.storage_freed_mb += job.file_size / (1024 * 1024)
          }
        }

        // Delete job record
        const { error: deleteError } = await supabase
          .from('import_jobs')
          .delete()
          .eq('id', job.id)

        if (!deleteError) {
          cleanupResults.failed_jobs_deleted++
          console.log(`✓ Deleted failed job: ${job.file_name}`)
        }
      }
    }

    // 3. Clean up orphaned attachments in storage
    const { data: storageFiles, error: storageListError } = await supabase.storage
      .from('supplier-imports')
      .list()

    if (storageListError) {
      console.error('Error listing storage files:', storageListError)
    } else if (storageFiles) {
      const orphanedFiles = []

      for (const file of storageFiles) {
        // Check if file is referenced in import_jobs
        const { data: job } = await supabase
          .from('import_jobs')
          .select('id')
          .eq('file_name', file.name)
          .single()

        // If no job found and file is older than retention period
        const fileDate = new Date(file.created_at)
        if (!job && fileDate < cutoffDate) {
          orphanedFiles.push(file.name)
        }
      }

      if (orphanedFiles.length > 0) {
        console.log(`Found ${orphanedFiles.length} orphaned files to delete`)

        const { error: deleteError } = await supabase.storage
          .from('supplier-imports')
          .remove(orphanedFiles)

        if (!deleteError) {
          cleanupResults.attachments_deleted = orphanedFiles.length
          console.log(`✓ Deleted ${orphanedFiles.length} orphaned files`)
        }
      }
    }

    // 4. Vacuum analyze tables for performance (log recommendation)
    console.log('💡 Recommendation: Run VACUUM ANALYZE on the following tables:')
    console.log('   - supplier_emails')
    console.log('   - import_jobs')
    console.log('   - product_analyses')

    return new Response(
      JSON.stringify({
        success: true,
        cleanup_summary: {
          ...cleanupResults,
          storage_freed_mb: cleanupResults.storage_freed_mb.toFixed(2),
          retention_days: retentionDays,
          cutoff_date: cutoffDate.toISOString(),
        },
        message: `Cleanup completed: ${cleanupResults.emails_deleted} emails, ${cleanupResults.failed_jobs_deleted} failed jobs, ${cleanupResults.attachments_deleted} attachments deleted`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Cleanup error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
