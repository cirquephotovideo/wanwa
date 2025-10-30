import { Link } from 'react-router-dom'
import { Settings, Database, Cpu, Key, Activity } from 'lucide-react'

export default function AdminPanelPage() {
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
                <Link to="/admin" className="text-primary-600 font-semibold">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration</h1>
          <p className="text-gray-600">Gérez la configuration avancée et les intégrations</p>
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* AI Providers */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Cpu className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Providers</h3>
            <p className="text-sm text-gray-600 mb-4">
              Gérez vos providers IA (Lovable, Ollama, OpenAI, Claude)
            </p>
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Configurer
            </button>
          </div>

          {/* Amazon Credentials */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Key className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Amazon SP-API</h3>
            <p className="text-sm text-gray-600 mb-4">
              Configurez l'OAuth Amazon pour l'enrichissement
            </p>
            <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
              Connecter Amazon
            </button>
          </div>

          {/* Edge Functions */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Edge Functions</h3>
            <p className="text-sm text-gray-600 mb-4">
              Testez et surveillez les 124 Edge Functions
            </p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Tester
            </button>
          </div>

          {/* Database Management */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Database className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Base de Données</h3>
            <p className="text-sm text-gray-600 mb-4">
              Statistiques et maintenance de la base Supabase
            </p>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Voir Stats
            </button>
          </div>

          {/* General Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Settings className="h-6 w-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Paramètres</h3>
            <p className="text-sm text-gray-600 mb-4">
              Configuration générale de l'application
            </p>
            <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Paramètres
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Statut Système</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <span className="font-semibold text-green-900">Supabase</span>
              </div>
              <p className="text-sm text-green-700">Opérationnel</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <span className="font-semibold text-green-900">Edge Functions</span>
              </div>
              <p className="text-sm text-green-700">124 / 124 actives</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <span className="font-semibold text-green-900">AI Providers</span>
              </div>
              <p className="text-sm text-green-700">4 / 4 disponibles</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <span className="font-semibold text-green-900">Storage</span>
              </div>
              <p className="text-sm text-green-700">12.3 GB / 100 GB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
