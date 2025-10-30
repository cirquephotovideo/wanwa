import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart, AlertTriangle } from 'lucide-react'

interface AnalyticsData {
  products: Array<{
    id: string
    product_name: string
    selling_price: number
    cost_price: number
    category: string
    enrichment_status: {
      amazon?: { status: string }
      specifications?: { status: string }
      rsgp?: { status: string }
    }
    exported_to_platforms?: Array<{ platform: string }>
    created_at: string
  }>
  importJobs: Array<{
    id: string
    status: string
    created_at: string
    total_rows_processed: number
    successful_imports: number
    failed_imports: number
  }>
}

interface AnalyticsChartsProps {
  data: AnalyticsData
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  teal: '#14b8a6',
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ data }) => {
  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalProducts = data.products.length
    const totalValue = data.products.reduce((sum, p) => sum + (p.selling_price || 0), 0)
    const avgPrice = totalProducts > 0 ? totalValue / totalProducts : 0
    const totalCost = data.products.reduce((sum, p) => sum + (p.cost_price || 0), 0)
    const totalMargin = totalValue - totalCost
    const marginPercent = totalValue > 0 ? (totalMargin / totalValue) * 100 : 0

    const enrichedProducts = data.products.filter((p) => {
      const status = p.enrichment_status
      return (
        status?.amazon?.status === 'completed' ||
        status?.specifications?.status === 'completed' ||
        status?.rsgp?.status === 'completed'
      )
    }).length

    const exportedProducts = data.products.filter(
      (p) => p.exported_to_platforms && p.exported_to_platforms.length > 0
    ).length

    return {
      totalProducts,
      totalValue,
      avgPrice,
      totalMargin,
      marginPercent,
      enrichedProducts,
      enrichedPercent: totalProducts > 0 ? (enrichedProducts / totalProducts) * 100 : 0,
      exportedProducts,
      exportedPercent: totalProducts > 0 ? (exportedProducts / totalProducts) * 100 : 0,
    }
  }, [data.products])

  // Products by category
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {}
    data.products.forEach((p) => {
      const cat = p.category || 'Non catégorisé'
      categories[cat] = (categories[cat] || 0) + 1
    })
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [data.products])

  // Products added over time (last 30 days)
  const timelineData = useMemo(() => {
    const days: Record<string, number> = {}
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    data.products.forEach((p) => {
      const date = new Date(p.created_at)
      if (date >= thirtyDaysAgo) {
        const dateKey = date.toISOString().split('T')[0]
        days[dateKey] = (days[dateKey] || 0) + 1
      }
    })

    return Object.entries(days)
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('fr-FR', {
          month: 'short',
          day: 'numeric',
        }),
        count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data.products])

  // Enrichment status breakdown
  const enrichmentData = useMemo(() => {
    const statuses = {
      completed: 0,
      processing: 0,
      pending: 0,
      failed: 0,
    }

    data.products.forEach((p) => {
      const status = p.enrichment_status
      const allStatuses = [
        status?.amazon?.status,
        status?.specifications?.status,
        status?.rsgp?.status,
      ].filter(Boolean)

      if (allStatuses.includes('completed')) {
        statuses.completed++
      } else if (allStatuses.includes('processing')) {
        statuses.processing++
      } else if (allStatuses.includes('failed')) {
        statuses.failed++
      } else {
        statuses.pending++
      }
    })

    return [
      { name: 'Enrichis', value: statuses.completed, color: COLORS.success },
      { name: 'En cours', value: statuses.processing, color: COLORS.primary },
      { name: 'En attente', value: statuses.pending, color: COLORS.warning },
      { name: 'Échec', value: statuses.failed, color: COLORS.danger },
    ].filter((item) => item.value > 0)
  }, [data.products])

  // Import jobs success rate
  const importJobsData = useMemo(() => {
    const last10Jobs = data.importJobs.slice(0, 10).reverse()
    return last10Jobs.map((job) => ({
      name: new Date(job.created_at).toLocaleDateString('fr-FR', {
        month: 'short',
        day: 'numeric',
      }),
      succès: job.successful_imports || 0,
      échec: job.failed_imports || 0,
    }))
  }, [data.importJobs])

  // Price distribution
  const priceDistribution = useMemo(() => {
    const ranges = [
      { name: '0-10€', min: 0, max: 10, count: 0 },
      { name: '10-50€', min: 10, max: 50, count: 0 },
      { name: '50-100€', min: 50, max: 100, count: 0 },
      { name: '100-500€', min: 100, max: 500, count: 0 },
      { name: '500€+', min: 500, max: Infinity, count: 0 },
    ]

    data.products.forEach((p) => {
      const price = p.selling_price || 0
      const range = ranges.find((r) => price >= r.min && price < r.max)
      if (range) range.count++
    })

    return ranges.filter((r) => r.count > 0)
  }, [data.products])

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Produits</p>
              <p className="text-2xl font-bold">{kpis.totalProducts}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-600 font-medium">
              {kpis.enrichedPercent.toFixed(0)}% enrichis
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Valeur Totale</p>
              <p className="text-2xl font-bold">{kpis.totalValue.toFixed(0)}€</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-600">Prix moyen: {kpis.avgPrice.toFixed(2)}€</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Marge Totale</p>
              <p className="text-2xl font-bold">{kpis.totalMargin.toFixed(0)}€</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className={kpis.marginPercent > 30 ? 'text-green-600' : 'text-orange-600'}>
              {kpis.marginPercent.toFixed(1)}% de marge
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Produits Exportés</p>
              <p className="text-2xl font-bold">{kpis.exportedProducts}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-teal-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-600">
              {kpis.exportedPercent.toFixed(0)}% du catalogue
            </span>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products by Category */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Produits par Catégorie</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Enrichment Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Statut d'Enrichissement</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={enrichmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {enrichmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Products Added Over Time */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Produits Ajoutés (30j)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke={COLORS.primary}
                strokeWidth={2}
                name="Produits"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Import Jobs Success */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Imports Récents</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={importJobsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="succès" stackId="a" fill={COLORS.success} />
              <Bar dataKey="échec" stackId="a" fill={COLORS.danger} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Price Distribution */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Distribution des Prix</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priceDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.purple} name="Nombre de produits" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
