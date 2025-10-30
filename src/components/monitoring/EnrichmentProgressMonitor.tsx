import { useEffect } from 'react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { Card, Badge, Loader } from '@/components/ui'
import { Sparkles, CheckCircle, XCircle, Clock } from 'lucide-react'

interface EnrichmentProgressMonitorProps {
  analysisId?: string
  showAll?: boolean
}

export default function EnrichmentProgressMonitor({
  analysisId,
  showAll = false,
}: EnrichmentProgressMonitorProps) {
  const { data: queueItems, isLoading, refetch } = useSupabaseQuery('enrichment_queue', {
    filters: analysisId ? { analysis_id: analysisId } : undefined,
    limit: showAll ? 100 : 10,
    order: { column: 'created_at', ascending: false },
  })

  // Auto-refresh every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 3000)

    return () => clearInterval(interval)
  }, [refetch])

  if (isLoading) {
    return (
      <Card>
        <Loader text="Chargement enrichissements..." />
      </Card>
    )
  }

  const stats = {
    pending: queueItems?.filter((q) => q.status === 'pending').length || 0,
    processing: queueItems?.filter((q) => q.status === 'processing').length || 0,
    completed: queueItems?.filter((q) => q.status === 'completed').length || 0,
    failed: queueItems?.filter((q) => q.status === 'failed').length || 0,
  }

  const total = stats.pending + stats.processing + stats.completed + stats.failed
  const progress = total > 0 ? ((stats.completed / total) * 100).toFixed(0) : 0

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Enrichissement IA</h3>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progression globale
          </span>
          <span className="text-sm font-medium text-gray-900">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Clock className="h-4 w-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
          <div className="text-xs text-yellow-600">En attente</div>
        </div>

        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.processing}</div>
          <div className="text-xs text-blue-600">En cours</div>
        </div>

        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
          <div className="text-xs text-green-600">Complétés</div>
        </div>

        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <XCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-900">{stats.failed}</div>
          <div className="text-xs text-red-600">Échoués</div>
        </div>
      </div>

      {/* Queue Items */}
      {queueItems && queueItems.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">File d'attente</h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {queueItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      item.status === 'completed'
                        ? 'success'
                        : item.status === 'failed'
                        ? 'error'
                        : item.status === 'processing'
                        ? 'info'
                        : 'warning'
                    }
                  >
                    {item.enrichment_type}
                  </Badge>
                  {item.retry_count > 0 && (
                    <span className="text-xs text-gray-500">
                      Retry {item.retry_count}/{item.max_retries}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  Priorité: {item.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
