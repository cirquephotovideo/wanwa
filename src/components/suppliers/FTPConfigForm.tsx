import { Input, Select } from '@/components/ui'

interface FTPConfigFormProps {
  config: Record<string, any>
  onChange: (config: Record<string, any>) => void
}

export default function FTPConfigForm({ config, onChange }: FTPConfigFormProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="space-y-4">
      <Select
        label="Protocole"
        value={config.protocol || 'sftp'}
        onChange={(e) => updateConfig('protocol', e.target.value)}
        options={[
          { value: 'sftp', label: 'SFTP (Recommandé)' },
          { value: 'ftp', label: 'FTP' },
          { value: 'ftps', label: 'FTPS' },
        ]}
      />

      <Input
        label="Serveur"
        placeholder="Ex: ftp.fournisseur.com"
        value={config.host || ''}
        onChange={(e) => updateConfig('host', e.target.value)}
        required
      />

      <Input
        label="Port"
        type="number"
        placeholder="22 pour SFTP, 21 pour FTP"
        value={config.port || (config.protocol === 'sftp' ? '22' : '21')}
        onChange={(e) => updateConfig('port', parseInt(e.target.value))}
        required
      />

      <Input
        label="Nom d'utilisateur"
        placeholder="username"
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
        required
      />

      <Input
        label="Chemin distant"
        placeholder="/catalogues/"
        value={config.remotePath || '/'}
        onChange={(e) => updateConfig('remotePath', e.target.value)}
        helperText="Le dossier contenant les fichiers à importer"
      />

      <Input
        label="Pattern de fichier"
        placeholder="*.csv, catalog_*.xlsx"
        value={config.filePattern || '*.csv'}
        onChange={(e) => updateConfig('filePattern', e.target.value)}
        helperText="Pattern glob pour filtrer les fichiers"
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="deleteAfterImport"
          checked={config.deleteAfterImport || false}
          onChange={(e) => updateConfig('deleteAfterImport', e.target.checked)}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="deleteAfterImport" className="text-sm text-gray-700">
          Supprimer les fichiers après import
        </label>
      </div>
    </div>
  )
}
