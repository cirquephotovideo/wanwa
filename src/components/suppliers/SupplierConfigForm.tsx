import { useState } from 'react'
import { useSupabaseMutation } from '@/hooks/useSupabaseQuery'
import { Input, Select, Button, Card, Alert } from '@/components/ui'
import { Mail, HardDrive, Code, FileSpreadsheet } from 'lucide-react'
import EmailConfigForm from './EmailConfigForm'
import FTPConfigForm from './FTPConfigForm'
import APIConfigForm from './APIConfigForm'

interface SupplierConfigFormProps {
  userId: string
  onSuccess?: () => void
  onCancel?: () => void
}

const sourceTypes = [
  { value: 'email', label: 'Email IMAP', icon: Mail },
  { value: 'ftp', label: 'FTP/SFTP', icon: HardDrive },
  { value: 'api', label: 'API REST', icon: Code },
  { value: 'csv', label: 'Upload CSV', icon: FileSpreadsheet },
]

export default function SupplierConfigForm({
  userId,
  onSuccess,
  onCancel,
}: SupplierConfigFormProps) {
  const [supplierName, setSupplierName] = useState('')
  const [sourceType, setSourceType] = useState<'email' | 'ftp' | 'api' | 'csv'>('email')
  const [connectionConfig, setConnectionConfig] = useState<Record<string, any>>({})
  const [columnMapping, setColumnMapping] = useState<Record<string, any>>({})
  const [error, setError] = useState('')

  const { insert } = useSupabaseMutation('supplier_configurations')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!supplierName.trim()) {
      setError('Le nom du fournisseur est requis')
      return
    }

    if (Object.keys(connectionConfig).length === 0) {
      setError('La configuration de connexion est requise')
      return
    }

    try {
      await insert.mutateAsync({
        user_id: userId,
        supplier_name: supplierName,
        source_type: sourceType,
        connection_config: connectionConfig,
        column_mapping: columnMapping,
        is_active: true,
      })

      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du fournisseur')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Basic Info */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Informations Générales</h3>

        <div className="space-y-4">
          <Input
            label="Nom du fournisseur"
            placeholder="Ex: Fournisseur ABC"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de source <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {sourceTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSourceType(type.value as any)}
                    className={`
                      flex items-center gap-3 p-4 border rounded-lg transition-colors
                      ${
                        sourceType === type.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 ${
                      sourceType === type.value ? 'text-primary-600' : 'text-gray-500'
                    }`} />
                    <span className={`font-medium ${
                      sourceType === type.value ? 'text-primary-900' : 'text-gray-700'
                    }`}>
                      {type.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Source-specific Configuration */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Configuration de Connexion</h3>

        {sourceType === 'email' && (
          <EmailConfigForm
            config={connectionConfig}
            onChange={setConnectionConfig}
          />
        )}

        {sourceType === 'ftp' && (
          <FTPConfigForm
            config={connectionConfig}
            onChange={setConnectionConfig}
          />
        )}

        {sourceType === 'api' && (
          <APIConfigForm
            config={connectionConfig}
            onChange={setConnectionConfig}
          />
        )}

        {sourceType === 'csv' && (
          <Alert variant="info">
            Pour l'import CSV, vous pourrez uploader des fichiers manuellement depuis la page fournisseur.
          </Alert>
        )}
      </Card>

      {/* Column Mapping */}
      {sourceType !== 'csv' && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Mapping des Colonnes (Optionnel)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Mappez les colonnes de votre fichier aux champs de la base de données
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Colonne EAN"
              placeholder="Ex: code_ean, barcode"
              value={columnMapping.ean || ''}
              onChange={(e) => setColumnMapping({ ...columnMapping, ean: e.target.value })}
            />
            <Input
              label="Colonne Nom"
              placeholder="Ex: designation, name"
              value={columnMapping.name || ''}
              onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
            />
            <Input
              label="Colonne Prix d'achat"
              placeholder="Ex: prix_achat, cost"
              value={columnMapping.purchase_price || ''}
              onChange={(e) => setColumnMapping({ ...columnMapping, purchase_price: e.target.value })}
            />
            <Input
              label="Colonne Prix de vente"
              placeholder="Ex: prix_vente, price"
              value={columnMapping.selling_price || ''}
              onChange={(e) => setColumnMapping({ ...columnMapping, selling_price: e.target.value })}
            />
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" isLoading={insert.isPending}>
          Créer le fournisseur
        </Button>
      </div>
    </form>
  )
}
