import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import {
  Package,
  Users,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react'

export default function DashboardPage() {
  const { user, signOut } = useAuth()

  // Fetch dashboard stats
  const { data: products, isLoading: productsLoading } = useSupabaseQuery(
    'product_analyses',
    {
      filters: { user_id: user?.id },
      limit: 5,
      order: { column: 'created_at', ascending: false },
    }
  )

  const { data: suppliers } = useSupabaseQuery('supplier_configurations', {
    filters: { user_id: user?.id },
  })

  const { data: importJobs } = useSupabaseQuery('import_jobs', {
    filters: { user_id: user?.id },
    limit: 10,
    order: { column: 'created_at', ascending: false },
  })

  const { data: enrichmentQueue } = useSupabaseQuery('enrichment_queue')

  // Calculate stats
  const stats = {
    totalProducts: products?.length || 0,
    totalSuppliers: suppliers?.length || 0,
    pendingEnrichments: enrichmentQueue?.filter((e) => e.status === 'pending').length || 0,
    completedToday:
      importJobs?.filter((j) => {
        const today = new Date().toDateString()
        return new Date(j.created_at).toDateString() === today
      }).length || 0,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="text-2xl font-bold text-primary-600">
                Wanwa
              </Link>
              <div className="flex gap-4">
                <Link to="/dashboard" className="text-gray-700 hover:text-primary-600">
                  Dashboard
                </Link>
                <Link to="/products" className="text-gray-700 hover:text-primary-600">
                  Produits
                </Link>
                <Link to="/suppliers" className="text-gray-700 hover:text-primary-600">
                  Fournisseurs
                </Link>
                <Link to="/admin" className="text-gray-700 hover:text-primary-600">
                  Admin
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Produits</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
              </div>
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fournisseurs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalSuppliers}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Enrichissement</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.pendingEnrichments}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Imports Aujourd'hui</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedToday}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Products */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Produits Récents</h2>
              <Link to="/products" className="text-sm text-primary-600 hover:text-primary-700">
                Voir tout
              </Link>
            </div>
            {productsLoading ? (
              <div className="text-center py-8 text-gray-500">Chargement...</div>
            ) : products && products.length > 0 ? (
              <div className="space-y-3">
                {products.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-sm">{product.product_name || 'Sans nom'}</p>
                      <p className="text-xs text-gray-500">{product.ean || 'Pas d\'EAN'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(product.enrichment_status as any)?.amazon === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucun produit. Importez votre premier catalogue !
              </div>
            )}
          </div>

          {/* Recent Import Jobs */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Imports Récents</h2>
              <Link to="/suppliers" className="text-sm text-primary-600 hover:text-primary-700">
                Voir tout
              </Link>
            </div>
            {importJobs && importJobs.length > 0 ? (
              <div className="space-y-3">
                {importJobs.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {job.products_created} créés, {job.products_updated} mis à jour
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(job.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      {job.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : job.status === 'failed' ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucun import. Configurez votre premier fournisseur !
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-primary-600 rounded-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Actions Rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/suppliers"
              className="bg-white/10 hover:bg-white/20 rounded-lg p-4 text-center transition-colors"
            >
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p className="font-semibold">Ajouter Fournisseur</p>
            </Link>
            <Link
              to="/products"
              className="bg-white/10 hover:bg-white/20 rounded-lg p-4 text-center transition-colors"
            >
              <Package className="h-8 w-8 mx-auto mb-2" />
              <p className="font-semibold">Importer Produits</p>
            </Link>
            <Link
              to="/admin"
              className="bg-white/10 hover:bg-white/20 rounded-lg p-4 text-center transition-colors"
            >
              <Activity className="h-8 w-8 mx-auto mb-2" />
              <p className="font-semibold">Configuration</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
