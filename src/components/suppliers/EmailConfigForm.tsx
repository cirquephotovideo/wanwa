import { Input, Select } from '@/components/ui'

interface EmailConfigFormProps {
  config: Record<string, any>
  onChange: (config: Record<string, any>) => void
}

export default function EmailConfigForm({ config, onChange }: EmailConfigFormProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="space-y-4">
      <Input
        label="Serveur IMAP"
        placeholder="Ex: imap.gmail.com"
        value={config.host || ''}
        onChange={(e) => updateConfig('host', e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Port"
          type="number"
          placeholder="993"
          value={config.port || '993'}
          onChange={(e) => updateConfig('port', parseInt(e.target.value))}
          required
        />

        <Select
          label="Sécurité"
          value={config.tls || 'true'}
          onChange={(e) => updateConfig('tls', e.target.value === 'true')}
          options={[
            { value: 'true', label: 'TLS/SSL' },
            { value: 'false', label: 'Aucune' },
          ]}
        />
      </div>

      <Input
        label="Nom d'utilisateur / Email"
        type="email"
        placeholder="votre-email@example.com"
        value={config.username || ''}
        onChange={(e) => updateConfig('username', e.target.value)}
        required
      />

      <Input
        label="Mot de passe"
        type="password"
        placeholder="••••••••"
        value={config.password || ''}
        onChange={(e) => updateConfig('password', e.target.value)}
        helperText="Utiliser un mot de passe d'application si disponible"
        required
      />

      <Input
        label="Dossier"
        placeholder="INBOX"
        value={config.folder || 'INBOX'}
        onChange={(e) => updateConfig('folder', e.target.value)}
        helperText="Le dossier IMAP à surveiller pour les emails"
      />

      <Input
        label="Filtre expéditeur (optionnel)"
        placeholder="fournisseur@example.com"
        value={config.senderFilter || ''}
        onChange={(e) => updateConfig('senderFilter', e.target.value)}
        helperText="Ne traiter que les emails de cet expéditeur"
      />
    </div>
  )
}
