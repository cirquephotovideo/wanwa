import { Link } from 'react-router-dom'
import {
  Package,
  Sparkles,
  Share2,
  Shield,
  Zap,
  ArrowRight
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <div className="text-2xl font-bold text-primary-600">Wanwa</div>
          <div className="space-x-4">
            <Link
              to="/login"
              className="px-4 py-2 text-primary-600 hover:text-primary-700"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <div className="text-center max-w-4xl mx-auto mb-20">
          <h1 className="text-5xl font-bold mb-6 text-gray-900">
            Automatisez Votre Catalogue Produits
            <span className="text-primary-600"> avec l'IA</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Import multi-sources, enrichissement intelligent et export vers 12+ plateformes.
            Gagnez des heures chaque jour avec Wanwa.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/signup"
              className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              Commencer Gratuitement
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="px-8 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
            >
              En Savoir Plus
            </a>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Import Multi-Sources</h3>
            <p className="text-gray-600">
              Importez depuis emails IMAP, FTP/SFTP, APIs ou fichiers CSV.
              Synchronisation automatique toutes les 15 minutes.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Enrichissement IA</h3>
            <p className="text-gray-600">
              Amazon SP-API, recherche web, spécifications techniques,
              conformité RSGP - tout automatisé avec l'IA.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Share2 className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Export Multi-Plateforme</h3>
            <p className="text-gray-600">
              Exportez vers Odoo, Shopify, PrestaShop, WooCommerce, Magento
              et bien plus avec mapping personnalisé.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-sm p-12 mb-20">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">124</div>
              <div className="text-gray-600">Edge Functions</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">12+</div>
              <div className="text-gray-600">Plateformes</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">4</div>
              <div className="text-gray-600">AI Providers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="flex gap-4">
            <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Sécurité Enterprise</h4>
              <p className="text-gray-600">
                RLS policies, encryption at rest, SOC 2 compliant
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Automatisation Totale</h4>
              <p className="text-gray-600">
                Cron jobs, webhooks, alertes temps réel
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary-600 rounded-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à Automatiser Votre Catalogue ?
          </h2>
          <p className="text-primary-100 mb-6 text-lg">
            Rejoignez les centaines d'entreprises qui utilisent Wanwa
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary-600 rounded-lg hover:bg-gray-100 font-semibold"
          >
            Démarrer Maintenant
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 Wanwa by Cirque Photo Video. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
