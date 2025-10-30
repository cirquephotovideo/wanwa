import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { Users, Plus, Mail, HardDrive, Code, FileSpreadsheet } from 'lucide-react'

const sourceIcons = {
  email: Mail,
  ftp: HardDrive,
  api: Code,
  csv: FileSpreadsheet,
}

export default function SuppliersPage() {
  const { user } = useAuth()

  const { data: suppliers, isLoading } = useSupabaseQuery('supplier_configurations', {
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
                <Link to="/products" className="text-gray-700 hover:text-primary-600">
                  Produits
                </Link>
                <Link to="/suppliers" className="text-primary-600 font-semibold">
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Fournisseurs</h1>
            <p className="text-gray-600">Gérez vos sources d'import produits</p>
          </div>
          <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ajouter un fournisseur
          </button>
        </div>

        {/* Suppliers List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Chargement des fournisseurs...</p>
          </div>
        ) : suppliers && suppliers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => {
              const Icon = sourceIcons[supplier.source_type] || Users
              return (
                <div
                  key={supplier.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="flex items-center">
                      {supplier.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                          Actif
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          Inactif
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mb-2">{supplier.supplier_name}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Source: {supplier.source_type.toUpperCase()}
                  </p>

                  {supplier.last_sync_at && (
                    <p className="text-xs text-gray-500 mb-4">
                      Dernière synchro:{' '}
                      {new Date(supplier.last_sync_at).toLocaleString('fr-FR')}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                      Configurer
                    </button>
                    <button className="flex-1 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                      Synchroniser
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun fournisseur configuré
            </h3>
            <p className="text-gray-600 mb-6">
              Ajoutez votre premier fournisseur pour commencer à importer des produits
            </p>
            <button className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              <Plus className="h-5 w-5" />
              Ajouter un fournisseur
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
