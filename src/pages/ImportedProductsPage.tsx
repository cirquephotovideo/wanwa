import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { Package, Search, Filter } from 'lucide-react'

export default function ImportedProductsPage() {
  const { user } = useAuth()

  const { data: products, isLoading } = useSupabaseQuery('product_analyses', {
    filters: { user_id: user?.id },
    order: { column: 'created_at', ascending: false },
  })

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
                <Link to="/products" className="text-primary-600 font-semibold">
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
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Produits Importés</h1>
          <p className="text-gray-600">Gérez vos produits enrichis et exportez-les vers vos plateformes</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, EAN, ASIN..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Chargement des produits...</p>
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  {product.image_urls && product.image_urls.length > 0 ? (
                    <img
                      src={product.image_urls[0]}
                      alt={product.product_name || 'Product'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {product.product_name || 'Sans nom'}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    {product.ean && <p>EAN: {product.ean}</p>}
                    {product.amazon_asin && <p>ASIN: {product.amazon_asin}</p>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {(product.enrichment_status as any)?.amazon === 'completed' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                          Amazon
                        </span>
                      )}
                      {(product.enrichment_status as any)?.specifications === 'completed' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          Specs
                        </span>
                      )}
                    </div>
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun produit</h3>
            <p className="text-gray-600 mb-6">Commencez par importer des produits depuis vos fournisseurs</p>
            <Link
              to="/suppliers"
              className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Configurer un fournisseur
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
