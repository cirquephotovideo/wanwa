import { Input, Select } from '@/components/ui'

interface APIConfigFormProps {
  config: Record<string, any>
  onChange: (config: Record<string, any>) => void
}

export default function APIConfigForm({ config, onChange }: APIConfigFormProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="space-y-4">
      <Input
        label="URL de l'API"
        placeholder="https://api.fournisseur.com/products"
        value={config.apiUrl || ''}
        onChange={(e) => updateConfig('apiUrl', e.target.value)}
        required
      />

      <Select
        label="Méthode HTTP"
        value={config.method || 'GET'}
        onChange={(e) => updateConfig('method', e.target.value)}
        options={[
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
        ]}
      />

      <Select
        label="Type d'authentification"
        value={config.authType || 'none'}
        onChange={(e) => updateConfig('authType', e.target.value)}
        options={[
          { value: 'none', label: 'Aucune' },
          { value: 'bearer', label: 'Bearer Token' },
          { value: 'apikey', label: 'API Key' },
          { value: 'basic', label: 'Basic Auth' },
        ]}
      />

      {config.authType === 'bearer' && (
        <Input
          label="Bearer Token"
          type="password"
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
          value={config.bearerToken || ''}
          onChange={(e) => updateConfig('bearerToken', e.target.value)}
          required
        />
      )}

      {config.authType === 'apikey' && (
        <>
          <Input
            label="Nom du header"
            placeholder="X-API-Key"
            value={config.apiKeyHeader || 'X-API-Key'}
            onChange={(e) => updateConfig('apiKeyHeader', e.target.value)}
            required
          />
          <Input
            label="API Key"
            type="password"
            placeholder="your-api-key"
            value={config.apiKey || ''}
            onChange={(e) => updateConfig('apiKey', e.target.value)}
            required
          />
        </>
      )}

      {config.authType === 'basic' && (
        <>
          <Input
            label="Nom d'utilisateur"
            placeholder="username"
            value={config.basicUsername || ''}
            onChange={(e) => updateConfig('basicUsername', e.target.value)}
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            value={config.basicPassword || ''}
            onChange={(e) => updateConfig('basicPassword', e.target.value)}
            required
          />
        </>
      )}

      <Input
        label="Headers personnalisés (JSON)"
        placeholder='{"Content-Type": "application/json"}'
        value={config.customHeaders || ''}
        onChange={(e) => updateConfig('customHeaders', e.target.value)}
        helperText="Format JSON pour headers additionnels"
      />

      <Input
        label="Chemin des données (JSON Path)"
        placeholder="data.products"
        value={config.dataPath || ''}
        onChange={(e) => updateConfig('dataPath', e.target.value)}
        helperText="Chemin vers le tableau de produits dans la réponse"
      />

      <Input
        label="Intervalle de synchronisation (minutes)"
        type="number"
        placeholder="60"
        value={config.syncInterval || '60'}
        onChange={(e) => updateConfig('syncInterval', parseInt(e.target.value))}
        helperText="Fréquence de synchronisation automatique"
      />
    </div>
  )
}
