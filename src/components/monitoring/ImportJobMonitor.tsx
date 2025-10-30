import { useEffect } from 'react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { Card, Badge, Loader } from '@/components/ui'
import { CheckCircle, XCircle, Clock, Activity } from 'lucide-react'
import { formatDateTime, formatRelativeTime } from '@/lib/utils'

interface ImportJobMonitorProps {
  userId: string
  limit?: number
}

export default function ImportJobMonitor({ userId, limit = 10 }: ImportJobMonitorProps) {
  const { data: jobs, isLoading, refetch } = useSupabaseQuery('import_jobs', {
    filters: { user_id: userId },
    limit,
    order: { column: 'created_at', ascending: false },
  })

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 5000)

    return () => clearInterval(interval)
  }, [refetch])

  if (isLoading) {
    return (
      <Card>
        <Loader text="Chargement des imports..." />
      </Card>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'processing':
        return <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
      completed: 'success',
      failed: 'error',
      processing: 'info',
      pending: 'warning',
    }

    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Imports Récents</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity className="h-4 w-4 animate-pulse" />
          <span>Mise à jour automatique</span>
        </div>
      </div>

      {!jobs || jobs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Aucun import en cours</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(job.status)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      Import {job.supplier_id.slice(0, 8)}
                    </span>
                    {getStatusBadge(job.status)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {job.products_created > 0 && (
                      <span className="text-green-600">
                        +{job.products_created} créés
                      </span>
                    )}
                    {job.products_updated > 0 && (
                      <span className="text-blue-600 ml-2">
                        ~{job.products_updated} màj
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatRelativeTime(job.created_at)}
                  </div>
                </div>
              </div>

              {job.status === 'processing' && job.started_at && (
                <div className="text-xs text-gray-500">
                  En cours depuis{' '}
                  {Math.floor(
                    (new Date().getTime() - new Date(job.started_at).getTime()) / 1000
                  )}s
                </div>
              )}

              {job.error_logs && (
                <button
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => console.log(job.error_logs)}
                >
                  Voir erreurs
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
