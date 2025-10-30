import React, { useState } from 'react'
import {
  CheckSquare,
  Square,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Tag,
  DollarSign,
  Package,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { supabase } from '@/integrations/supabase/client'

interface BulkOperationsPanelProps {
  selectedProductIds: string[]
  onSelectionClear: () => void
  onOperationComplete: () => void
}

export const BulkOperationsPanel: React.FC<BulkOperationsPanelProps> = ({
  selectedProductIds,
  onSelectionClear,
  onOperationComplete,
}) => {
  const [showExportModal, setShowExportModal] = useState(false)
  const [showEnrichModal, setShowEnrichModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [enrichmentType, setEnrichmentType] = useState<'amazon' | 'specifications' | 'rsgp'>(
    'amazon'
  )
  const [priceAdjustment, setPriceAdjustment] = useState({ type: 'percent', value: 0 })
  const [newCategory, setNewCategory] = useState('')

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [platforms, setPlatforms] = useState<any[]>([])

  React.useEffect(() => {
    loadPlatforms()
  }, [])

  const loadPlatforms = async () => {
    const { data } = await supabase
      .from('export_platform_configurations')
      .select('id, platform_name, platform_type')
      .eq('is_active', true)

    if (data) setPlatforms(data)
  }

  const handleBulkExport = async () => {
    if (!selectedPlatform) {
      setError('Veuillez sélectionner une plateforme')
      return
    }

    try {
      setIsProcessing(true)
      setError(null)

      const { data, error } = await supabase.functions.invoke('bulk-export', {
        body: {
          productIds: selectedProductIds,
          platformId: selectedPlatform,
        },
      })

      if (error) throw error

      setSuccess(`${data.exported} produits exportés avec succès`)
      setShowExportModal(false)
      onOperationComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'export')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkEnrich = async () => {
    try {
      setIsProcessing(true)
      setError(null)

      // Add all products to enrichment queue
      const tasks = selectedProductIds.map((productId) => ({
        product_id: productId,
        enrichment_type: enrichmentType,
        status: 'pending',
        priority: 'medium',
      }))

      const { error } = await supabase.from('enrichment_queue').insert(tasks)

      if (error) throw error

      setSuccess(`${selectedProductIds.length} produits ajoutés à la file d'enrichissement`)
      setShowEnrichModal(false)
      onOperationComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'enrichissement')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkDelete = async () => {
    try {
      setIsProcessing(true)
      setError(null)

      const { error } = await supabase
        .from('product_analyses')
        .delete()
        .in('id', selectedProductIds)

      if (error) throw error

      setSuccess(`${selectedProductIds.length} produits supprimés`)
      setShowDeleteModal(false)
      onSelectionClear()
      onOperationComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de suppression')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkPriceAdjustment = async () => {
    try {
      setIsProcessing(true)
      setError(null)

      // Get current products
      const { data: products, error: fetchError } = await supabase
        .from('product_analyses')
        .select('id, selling_price')
        .in('id', selectedProductIds)

      if (fetchError) throw fetchError

      // Calculate new prices
      const updates = products.map((product) => {
        let newPrice = product.selling_price
        if (priceAdjustment.type === 'percent') {
          newPrice = product.selling_price * (1 + priceAdjustment.value / 100)
        } else {
          newPrice = product.selling_price + priceAdjustment.value
        }

        return {
          id: product.id,
          selling_price: Math.round(newPrice * 100) / 100,
        }
      })

      // Update prices
      for (const update of updates) {
        await supabase
          .from('product_analyses')
          .update({ selling_price: update.selling_price })
          .eq('id', update.id)
      }

      setSuccess(`Prix de ${selectedProductIds.length} produits mis à jour`)
      setShowPriceModal(false)
      onOperationComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de mise à jour des prix')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkCategoryChange = async () => {
    if (!newCategory) {
      setError('Veuillez entrer une catégorie')
      return
    }

    try {
      setIsProcessing(true)
      setError(null)

      const { error } = await supabase
        .from('product_analyses')
        .update({ category: newCategory })
        .in('id', selectedProductIds)

      if (error) throw error

      setSuccess(`Catégorie de ${selectedProductIds.length} produits mise à jour`)
      setShowCategoryModal(false)
      onOperationComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de mise à jour')
    } finally {
      setIsProcessing(false)
    }
  }

  if (selectedProductIds.length === 0) {
    return null
  }

  return (
    <>
      {/* Floating Panel */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">
                  {selectedProductIds.length} produit{selectedProductIds.length > 1 ? 's' : ''}{' '}
                  sélectionné{selectedProductIds.length > 1 ? 's' : ''}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={onSelectionClear}>
                <X className="w-4 h-4 mr-2" />
                Désélectionner
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setShowEnrichModal(true)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Enrichir
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPriceModal(true)}>
                <DollarSign className="w-4 h-4 mr-2" />
                Ajuster prix
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowCategoryModal(true)}>
                <Tag className="w-4 h-4 mr-2" />
                Catégorie
              </Button>
              <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <Alert variant="success" className="mt-4">
              {success}
            </Alert>
          )}
          {error && (
            <Alert variant="error" className="mt-4">
              {error}
            </Alert>
          )}
        </div>
      </div>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export groupé"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Exporter {selectedProductIds.length} produit(s) vers une plateforme
          </p>

          <div>
            <label className="block text-sm font-medium mb-2">Plateforme de destination</label>
            <Select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
            >
              <option value="">-- Sélectionner une plateforme --</option>
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.platform_name} ({platform.platform_type})
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowExportModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleBulkExport} disabled={isProcessing || !selectedPlatform}>
              {isProcessing ? 'Export en cours...' : 'Exporter'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Enrich Modal */}
      <Modal
        isOpen={showEnrichModal}
        onClose={() => setShowEnrichModal(false)}
        title="Enrichissement groupé"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enrichir {selectedProductIds.length} produit(s) avec l'IA
          </p>

          <div>
            <label className="block text-sm font-medium mb-2">Type d'enrichissement</label>
            <Select
              value={enrichmentType}
              onChange={(e) => setEnrichmentType(e.target.value as any)}
            >
              <option value="amazon">Amazon Product Data</option>
              <option value="specifications">Spécifications Techniques</option>
              <option value="rsgp">Conformité RSGP</option>
            </Select>
          </div>

          <Alert variant="info">
            Les produits seront ajoutés à la file d'enrichissement et traités automatiquement.
          </Alert>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEnrichModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleBulkEnrich} disabled={isProcessing}>
              {isProcessing ? 'Ajout en cours...' : 'Ajouter à la file'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Suppression groupée"
      >
        <div className="space-y-4">
          <Alert variant="error">
            Vous êtes sur le point de supprimer {selectedProductIds.length} produit(s).
            <br />
            Cette action est <strong>irréversible</strong>.
          </Alert>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleBulkDelete} disabled={isProcessing}>
              {isProcessing ? 'Suppression...' : 'Confirmer la suppression'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Price Adjustment Modal */}
      <Modal
        isOpen={showPriceModal}
        onClose={() => setShowPriceModal(false)}
        title="Ajustement des prix"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Ajuster les prix de {selectedProductIds.length} produit(s)
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type d'ajustement</label>
              <Select
                value={priceAdjustment.type}
                onChange={(e) =>
                  setPriceAdjustment({ ...priceAdjustment, type: e.target.value as any })
                }
              >
                <option value="percent">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (€)</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Valeur</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border rounded"
                value={priceAdjustment.value}
                onChange={(e) =>
                  setPriceAdjustment({
                    ...priceAdjustment,
                    value: parseFloat(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <Alert variant="info">
            {priceAdjustment.type === 'percent'
              ? `Les prix seront ${priceAdjustment.value >= 0 ? 'augmentés' : 'diminués'} de ${Math.abs(priceAdjustment.value)}%`
              : `${priceAdjustment.value >= 0 ? '+' : ''}${priceAdjustment.value}€ sera ${priceAdjustment.value >= 0 ? 'ajouté' : 'retiré'} à chaque prix`}
          </Alert>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowPriceModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleBulkPriceAdjustment} disabled={isProcessing}>
              {isProcessing ? 'Mise à jour...' : 'Appliquer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Changer la catégorie"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Changer la catégorie de {selectedProductIds.length} produit(s)
          </p>

          <div>
            <label className="block text-sm font-medium mb-2">Nouvelle catégorie</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Ex: Électronique > Smartphones"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleBulkCategoryChange} disabled={isProcessing || !newCategory}>
              {isProcessing ? 'Mise à jour...' : 'Appliquer'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
