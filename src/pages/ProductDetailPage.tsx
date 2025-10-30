import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Edit2,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Package,
  Tag,
  DollarSign,
  Image as ImageIcon,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { supabase } from '@/integrations/supabase/client'

interface Product {
  id: string
  ean: string
  product_name: string
  brand: string
  category: string
  selling_price: number
  cost_price: number
  stock_quantity: number
  short_description: string
  long_description: string
  image_urls: string[]
  enrichment_status: {
    amazon?: { status: string; data?: any }
    specifications?: { status: string; data?: any }
    rsgp?: { status: string; data?: any }
  }
  exported_to_platforms?: Array<{
    platform: string
    external_id: string
    exported_at: string
  }>
  created_at: string
  updated_at: string
}

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()

  const [product, setProduct] = useState<Product | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'enrichment' | 'exports'>('details')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (productId) {
      loadProduct()
    }
  }, [productId])

  const loadProduct = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('product_analyses')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error
      setProduct(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!product) return

    try {
      setIsSaving(true)
      const { error } = await supabase
        .from('product_analyses')
        .update({
          product_name: product.product_name,
          brand: product.brand,
          category: product.category,
          selling_price: product.selling_price,
          cost_price: product.cost_price,
          stock_quantity: product.stock_quantity,
          short_description: product.short_description,
          long_description: product.long_description,
        })
        .eq('id', product.id)

      if (error) throw error

      setIsEditing(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!product) return

    try {
      const { error } = await supabase
        .from('product_analyses')
        .delete()
        .eq('id', product.id)

      if (error) throw error

      navigate('/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de suppression')
    }
  }

  const triggerEnrichment = async (type: 'amazon' | 'specifications' | 'rsgp') => {
    if (!product) return

    try {
      const { error } = await supabase
        .from('enrichment_queue')
        .insert({
          product_id: product.id,
          enrichment_type: type,
          status: 'pending',
          priority: 'high',
        })

      if (error) throw error

      setError(null)
      setTimeout(loadProduct, 2000) // Refresh after 2s
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'enrichissement')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'success' as const,
      failed: 'error' as const,
      processing: 'warning' as const,
      pending: 'default' as const,
    }
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="p-6">
        <Alert variant="error">Produit non trouvé</Alert>
      </div>
    )
  }

  const margin = product.selling_price && product.cost_price
    ? ((product.selling_price - product.cost_price) / product.selling_price * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{product.product_name}</h1>
                <p className="text-sm text-gray-500">EAN: {product.ean}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'details', label: 'Détails', icon: Package },
              { id: 'enrichment', label: 'Enrichissement', icon: RefreshCw },
              { id: 'exports', label: 'Exports', icon: Upload },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'details' && (
              <>
                {/* Basic Info */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Informations Générales</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du produit
                      </label>
                      <Input
                        value={product.product_name}
                        onChange={(e) => setProduct({ ...product, product_name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">EAN</label>
                      <Input value={product.ean} disabled />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
                      <Input
                        value={product.brand || ''}
                        onChange={(e) => setProduct({ ...product, brand: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catégorie
                      </label>
                      <Input
                        value={product.category || ''}
                        onChange={(e) => setProduct({ ...product, category: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </Card>

                {/* Pricing */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Prix et Stock</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix de vente
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={product.selling_price || ''}
                        onChange={(e) =>
                          setProduct({ ...product, selling_price: parseFloat(e.target.value) })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix d'achat
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={product.cost_price || ''}
                        onChange={(e) =>
                          setProduct({ ...product, cost_price: parseFloat(e.target.value) })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                      <Input
                        type="number"
                        value={product.stock_quantity || ''}
                        onChange={(e) =>
                          setProduct({ ...product, stock_quantity: parseInt(e.target.value) })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <p className="text-sm text-blue-800">
                      Marge: <span className="font-semibold">{margin.toFixed(1)}%</span> (
                      {(product.selling_price - product.cost_price).toFixed(2)}€)
                    </p>
                  </div>
                </Card>

                {/* Descriptions */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Descriptions</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description courte
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={2}
                        value={product.short_description || ''}
                        onChange={(e) =>
                          setProduct({ ...product, short_description: e.target.value })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description longue
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={6}
                        value={product.long_description || ''}
                        onChange={(e) =>
                          setProduct({ ...product, long_description: e.target.value })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </Card>
              </>
            )}

            {activeTab === 'enrichment' && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Statut d'Enrichissement</h2>
                <div className="space-y-4">
                  {['amazon', 'specifications', 'rsgp'].map((type) => {
                    const status = product.enrichment_status?.[type as keyof typeof product.enrichment_status]
                    return (
                      <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(status?.status || 'pending')}
                          <div>
                            <p className="font-medium capitalize">{type}</p>
                            {getStatusBadge(status?.status || 'pending')}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => triggerEnrichment(type as any)}
                          disabled={status?.status === 'processing'}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Relancer
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {activeTab === 'exports' && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Historique des Exports</h2>
                {product.exported_to_platforms && product.exported_to_platforms.length > 0 ? (
                  <div className="space-y-3">
                    {product.exported_to_platforms.map((exp, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium capitalize">{exp.platform}</p>
                          <p className="text-sm text-gray-500">ID: {exp.external_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(exp.exported_at).toLocaleDateString('fr-FR')}
                          </p>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert variant="info">Ce produit n'a pas encore été exporté</Alert>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Images */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" />
                Images
              </h3>
              {product.image_urls && product.image_urls.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {product.image_urls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Product ${idx + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucune image</p>
              )}
            </Card>

            {/* Quick Stats */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Statistiques</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Statut enrichissement</span>
                  <Badge variant="success">
                    {
                      Object.values(product.enrichment_status || {}).filter(
                        (s: any) => s.status === 'completed'
                      ).length
                    }
                    /3
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Plateformes</span>
                  <Badge>{product.exported_to_platforms?.length || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Créé le</span>
                  <span className="text-sm">
                    {new Date(product.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer le produit"
      >
        <div className="space-y-4">
          <p>Êtes-vous sûr de vouloir supprimer ce produit ?</p>
          <p className="text-sm text-red-600">Cette action est irréversible.</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
