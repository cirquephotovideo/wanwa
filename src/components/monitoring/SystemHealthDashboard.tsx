import { useEffect, useState } from 'react'
import { Card, Badge, Alert } from '@/components/ui'
import { Activity, Database, Zap, HardDrive, AlertTriangle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface HealthStatus {
  database: 'healthy' | 'degraded' | 'down'
  edgeFunctions: 'healthy' | 'degraded' | 'down'
  storage: 'healthy' | 'degraded' | 'down'
  api: 'healthy' | 'degraded' | 'down'
}

export default function SystemHealthDashboard() {
  const [health, setHealth] = useState<HealthStatus>({
    database: 'healthy',
    edgeFunctions: 'healthy',
    storage: 'healthy',
    api: 'healthy',
  })
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSuppliers: 0,
    pendingEnrichments: 0,
    storageUsed: '0 MB',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSystemHealth()
    loadStats()

    const interval = setInterval(() => {
      checkSystemHealth()
      loadStats()
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const checkSystemHealth = async () => {
    const newHealth: HealthStatus = {
      database: 'healthy',
      edgeFunctions: 'healthy',
      storage: 'healthy',
      api: 'healthy',
    }

    try {
      // Check database
      const { error: dbError } = await supabase.from('users').select('id').limit(1)
      if (dbError) newHealth.database = 'degraded'

      // Check storage
      const { error: storageError } = await supabase.storage.listBuckets()
      if (storageError) newHealth.storage = 'degraded'

      // Check edge functions (ping test)
      try {
        await supabase.functions.invoke('ai-chat', {
          body: { message: 'ping' },
        })
      } catch {
        newHealth.edgeFunctions = 'degraded'
      }

      setHealth(newHealth)
    } catch (error) {
      console.error('Health check failed:', error)
      setHealth({
        database: 'down',
        edgeFunctions: 'down',
        storage: 'down',
        api: 'down',
      })
    }
  }

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Get counts
      const [productsCount, suppliersCount, enrichmentsCount] = await Promise.all([
        supabase
          .from('product_analyses')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('supplier_configurations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('enrichment_queue')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ])

      setStats({
        totalProducts: productsCount.count || 0,
        totalSuppliers: suppliersCount.count || 0,
        pendingEnrichments: enrichmentsCount.count || 0,
        storageUsed: '12.3 MB', // TODO: Get actual storage usage
      })

      setLoading(false)
    } catch (error) {
      console.error('Failed to load stats:', error)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100'
      case 'down':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error'> = {
      healthy: 'success',
      degraded: 'warning',
      down: 'error',
    }
    return variants[status] || 'default'
  }

  const hasIssues = Object.values(health).some((s) => s !== 'healthy')

  return (
    <div className="space-y-6">
      {hasIssues && (
        <Alert variant="warning" title="Problèmes Détectés">
          Certains services sont dégradés. Vérifiez les détails ci-dessous.
        </Alert>
      )}

      {/* Health Status */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-semibold">État du Système</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-4 border rounded-lg">
            <Database className={`h-8 w-8 mb-2 ${getStatusColor(health.database)}`} />
            <span className="text-sm font-medium mb-1">Database</span>
            <Badge variant={getStatusBadge(health.database)}>{health.database}</Badge>
          </div>

          <div className="flex flex-col items-center p-4 border rounded-lg">
            <Zap className={`h-8 w-8 mb-2 ${getStatusColor(health.edgeFunctions)}`} />
            <span className="text-sm font-medium mb-1">Edge Functions</span>
            <Badge variant={getStatusBadge(health.edgeFunctions)}>
              {health.edgeFunctions}
            </Badge>
          </div>

          <div className="flex flex-col items-center p-4 border rounded-lg">
            <HardDrive className={`h-8 w-8 mb-2 ${getStatusColor(health.storage)}`} />
            <span className="text-sm font-medium mb-1">Storage</span>
            <Badge variant={getStatusBadge(health.storage)}>{health.storage}</Badge>
          </div>

          <div className="flex flex-col items-center p-4 border rounded-lg">
            <Activity className={`h-8 w-8 mb-2 ${getStatusColor(health.api)}`} />
            <span className="text-sm font-medium mb-1">API</span>
            <Badge variant={getStatusBadge(health.api)}>{health.api}</Badge>
          </div>
        </div>
      </Card>

      {/* System Stats */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Statistiques Système</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-primary-50 rounded-lg">
            <div className="text-3xl font-bold text-primary-900">{stats.totalProducts}</div>
            <div className="text-sm text-primary-600 mt-1">Produits</div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-900">{stats.totalSuppliers}</div>
            <div className="text-sm text-blue-600 mt-1">Fournisseurs</div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-yellow-900">
              {stats.pendingEnrichments}
            </div>
            <div className="text-sm text-yellow-600 mt-1">En enrichissement</div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900">{stats.storageUsed}</div>
            <div className="text-sm text-gray-600 mt-1">Stockage utilisé</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
