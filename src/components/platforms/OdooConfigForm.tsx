import React, { useState } from 'react'
import { Database, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { supabase } from '@/integrations/supabase/client'

interface OdooConfigFormProps {
  platformId?: string
  onSave?: (platformId: string) => void
}

export const OdooConfigForm: React.FC<OdooConfigFormProps> = ({ platformId, onSave }) => {
  const [config, setConfig] = useState({
    platform_name: '',
    url: '',
    database: '',
    username: '',
    password: '',
    api_key: '',
    use_api_key: false,
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

      const platformConfig = data.platform_config as any
      setConfig({
        platform_name: data.platform_name,
        url: platformConfig.url || '',
        database: platformConfig.database || '',
        username: platformConfig.username || '',
        password: platformConfig.password || '',
        api_key: platformConfig.api_key || '',
        use_api_key: !!platformConfig.api_key,
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

      // Call Edge Function to test Odoo connection
      const { data, error } = await supabase.functions.invoke('test-odoo-connection', {
        body: {
          url: config.url,
          database: config.database,
          username: config.username,
          password: config.use_api_key ? config.api_key : config.password,
        },
      })

      if (error) throw error

      setTestResult({
        success: data.success,
        message: data.message || 'Connexion réussie',
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
        platform_type: 'odoo',
        platform_config: {
          url: config.url,
          database: config.database,
          username: config.username,
          ...(config.use_api_key
            ? { api_key: config.api_key }
            : { password: config.password }),
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
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
          <Database className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Configuration Odoo</h3>
          <p className="text-sm text-gray-500">
            Connectez votre ERP Odoo pour synchroniser vos produits
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
            placeholder="Mon ERP Odoo"
          />
        </div>

        {/* URL */}
        <div>
          <label className="block text-sm font-medium mb-2">
            URL Odoo <span className="text-red-500">*</span>
          </label>
          <Input
            value={config.url}
            onChange={(e) => setConfig({ ...config, url: e.target.value })}
            placeholder="https://mycompany.odoo.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            URL complète de votre instance Odoo (avec https://)
          </p>
        </div>

        {/* Database */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Base de données <span className="text-red-500">*</span>
          </label>
          <Input
            value={config.database}
            onChange={(e) => setConfig({ ...config, database: e.target.value })}
            placeholder="production"
          />
          <p className="text-xs text-gray-500 mt-1">
            Nom de la base de données Odoo
          </p>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Nom d'utilisateur <span className="text-red-500">*</span>
          </label>
          <Input
            value={config.username}
            onChange={(e) => setConfig({ ...config, username: e.target.value })}
            placeholder="admin@example.com"
          />
        </div>

        {/* Auth Method Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="use-api-key"
            checked={config.use_api_key}
            onChange={(e) => setConfig({ ...config, use_api_key: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="use-api-key" className="text-sm">
            Utiliser une API Key (recommandé)
          </label>
        </div>

        {/* Password or API Key */}
        {config.use_api_key ? (
          <div>
            <label className="block text-sm font-medium mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              value={config.api_key}
              onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
              placeholder="Votre API Key Odoo"
            />
            <p className="text-xs text-gray-500 mt-1">
              Générez une API Key dans Odoo → Préférences → Compte → Clés API
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-2">
              Mot de passe <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              value={config.password}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
              placeholder="Votre mot de passe Odoo"
            />
          </div>
        )}

        {/* Help Box */}
        <Alert variant="info">
          <div>
            <p className="font-medium mb-2">Configuration Odoo :</p>
            <ol className="text-sm space-y-1 ml-4 list-decimal">
              <li>Assurez-vous que l'API XML-RPC est activée</li>
              <li>Créez un utilisateur dédié avec les droits sur les produits</li>
              <li>Pour plus de sécurité, utilisez une API Key au lieu du mot de passe</li>
              <li>Vérifiez que l'URL est accessible depuis Internet</li>
            </ol>
            <a
              href="https://www.odoo.com/documentation/16.0/developer/reference/external_api.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm mt-2 inline-flex items-center"
            >
              Documentation Odoo API
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
            disabled={
              !config.url ||
              !config.database ||
              !config.username ||
              (!config.password && !config.api_key) ||
              isTesting
            }
          >
            {isTesting ? 'Test en cours...' : 'Tester la connexion'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !config.platform_name ||
              !config.url ||
              !config.database ||
              !config.username ||
              (!config.password && !config.api_key) ||
              isLoading
            }
          >
            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
