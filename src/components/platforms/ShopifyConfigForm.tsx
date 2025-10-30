import React, { useState } from 'react'
import { ShoppingBag, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { supabase } from '@/integrations/supabase/client'

interface ShopifyConfigFormProps {
  platformId?: string
  onSave?: (platformId: string) => void
}

export const ShopifyConfigForm: React.FC<ShopifyConfigFormProps> = ({ platformId, onSave }) => {
  const [config, setConfig] = useState({
    platform_name: '',
    shop_url: '',
    api_key: '',
    api_secret: '',
    access_token: '',
    api_version: '2024-01',
    location_id: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  React.useEffect(() => {
    if (platformId) {
      loadPlatform()
    }
  }, [platformId])

  const loadPlatform = async () => {
    try {
      const { data, error } = await supabase
        .from('export_platform_configurations')
        .select('*')
        .eq('id', platformId)
        .single()

      if (error) throw error

      setConfig({
        platform_name: data.platform_name,
        ...(data.platform_config as any),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    }
  }

  const handleTest = async () => {
    try {
      setIsTesting(true)
      setTestResult(null)
      setError(null)

      const shopifyUrl = `https://${config.shop_url}/admin/api/${config.api_version}/shop.json`

      const response = await fetch(shopifyUrl, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': config.access_token,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      setTestResult({
        success: true,
        message: `Connexion réussie à ${data.shop.name}`,
      })
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Échec de la connexion',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const platformData = {
        platform_name: config.platform_name,
        platform_type: 'shopify',
        platform_config: {
          shop_url: config.shop_url,
          api_key: config.api_key,
          api_secret: config.api_secret,
          access_token: config.access_token,
          api_version: config.api_version,
          location_id: config.location_id,
        },
        is_active: true,
      }

      if (platformId) {
        const { error } = await supabase
          .from('export_platform_configurations')
          .update(platformData)
          .eq('id', platformId)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('export_platform_configurations')
          .insert(platformData)
          .select()
          .single()

        if (error) throw error
        if (data && onSave) onSave(data.id)
      }

      setTestResult({
        success: true,
        message: 'Configuration enregistrée avec succès',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <ShoppingBag className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Configuration Shopify</h3>
          <p className="text-sm text-gray-500">
            Connectez votre boutique Shopify pour exporter vos produits
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Platform Name */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Nom de la configuration <span className="text-red-500">*</span>
          </label>
          <Input
            value={config.platform_name}
            onChange={(e) => setConfig({ ...config, platform_name: e.target.value })}
            placeholder="Ma boutique Shopify"
          />
        </div>

        {/* Shop URL */}
        <div>
          <label className="block text-sm font-medium mb-2">
            URL de la boutique <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">https://</span>
            <Input
              value={config.shop_url}
              onChange={(e) => setConfig({ ...config, shop_url: e.target.value })}
              placeholder="my-store.myshopify.com"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Format: your-store.myshopify.com (sans https://)
          </p>
        </div>

        {/* API Version */}
        <div>
          <label className="block text-sm font-medium mb-2">Version de l'API</label>
          <Input
            value={config.api_version}
            onChange={(e) => setConfig({ ...config, api_version: e.target.value })}
            placeholder="2024-01"
          />
        </div>

        {/* Access Token */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Access Token <span className="text-red-500">*</span>
          </label>
          <Input
            type="password"
            value={config.access_token}
            onChange={(e) => setConfig({ ...config, access_token: e.target.value })}
            placeholder="shpat_xxxxxxxxxxxxxxxxxxxxx"
          />
          <p className="text-xs text-gray-500 mt-1">
            Créez un Private App dans Shopify Admin pour obtenir le token
          </p>
        </div>

        {/* API Key (Optional) */}
        <div>
          <label className="block text-sm font-medium mb-2">API Key (Optionnel)</label>
          <Input
            value={config.api_key}
            onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
            placeholder="API Key de votre app"
          />
        </div>

        {/* API Secret (Optional) */}
        <div>
          <label className="block text-sm font-medium mb-2">API Secret (Optionnel)</label>
          <Input
            type="password"
            value={config.api_secret}
            onChange={(e) => setConfig({ ...config, api_secret: e.target.value })}
            placeholder="API Secret de votre app"
          />
        </div>

        {/* Location ID */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Location ID (Optionnel)
          </label>
          <Input
            value={config.location_id}
            onChange={(e) => setConfig({ ...config, location_id: e.target.value })}
            placeholder="12345678"
          />
          <p className="text-xs text-gray-500 mt-1">
            ID de l'emplacement par défaut pour le stock
          </p>
        </div>

        {/* Help Box */}
        <Alert variant="info">
          <div>
            <p className="font-medium mb-2">Comment obtenir les identifiants Shopify :</p>
            <ol className="text-sm space-y-1 ml-4 list-decimal">
              <li>Allez dans Shopify Admin → Apps</li>
              <li>Cliquez sur "Develop apps" → "Create an app"</li>
              <li>Donnez les permissions: read_products, write_products, read_inventory, write_inventory</li>
              <li>Installez l'app et copiez l'Access Token</li>
            </ol>
            <a
              href="https://help.shopify.com/en/manual/apps/app-types/custom-apps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm mt-2 inline-flex items-center"
            >
              Documentation Shopify
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </Alert>

        {/* Test Result */}
        {testResult && (
          <Alert variant={testResult.success ? 'success' : 'error'}>
            {testResult.success ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{testResult.message}</span>
          </Alert>
        )}

        {/* Error */}
        {error && <Alert variant="error">{error}</Alert>}

        {/* Actions */}
        <div className="flex space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={!config.shop_url || !config.access_token || isTesting}
          >
            {isTesting ? 'Test en cours...' : 'Tester la connexion'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!config.platform_name || !config.shop_url || !config.access_token || isLoading}
          >
            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
