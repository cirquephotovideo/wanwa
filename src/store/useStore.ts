import { create } from 'zustand'
import { User } from '@supabase/supabase-js'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
}

interface ImportJob {
  id: string
  supplier_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
}

interface AppState {
  // User
  user: User | null
  setUser: (user: User | null) => void

  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void

  // Import jobs tracking
  activeImportJobs: ImportJob[]
  addImportJob: (job: ImportJob) => void
  updateImportJob: (id: string, updates: Partial<ImportJob>) => void
  removeImportJob: (id: string) => void

  // UI State
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Selected items (for bulk operations)
  selectedProductIds: string[]
  setSelectedProductIds: (ids: string[]) => void
  toggleProductSelection: (id: string) => void
  clearProductSelection: () => void

  // Filters
  productFilters: {
    search: string
    status: string[]
    supplier: string[]
  }
  setProductFilters: (filters: Partial<AppState['productFilters']>) => void
  clearProductFilters: () => void
}

export const useStore = create<AppState>((set) => ({
  // User
  user: null,
  setUser: (user) => set({ user }),

  // Notifications
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: crypto.randomUUID() },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  // Import jobs
  activeImportJobs: [],
  addImportJob: (job) =>
    set((state) => ({
      activeImportJobs: [...state.activeImportJobs, job],
    })),
  updateImportJob: (id, updates) =>
    set((state) => ({
      activeImportJobs: state.activeImportJobs.map((job) =>
        job.id === id ? { ...job, ...updates } : job
      ),
    })),
  removeImportJob: (id) =>
    set((state) => ({
      activeImportJobs: state.activeImportJobs.filter((job) => job.id !== id),
    })),

  // UI State
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Selected items
  selectedProductIds: [],
  setSelectedProductIds: (ids) => set({ selectedProductIds: ids }),
  toggleProductSelection: (id) =>
    set((state) => ({
      selectedProductIds: state.selectedProductIds.includes(id)
        ? state.selectedProductIds.filter((i) => i !== id)
        : [...state.selectedProductIds, id],
    })),
  clearProductSelection: () => set({ selectedProductIds: [] }),

  // Filters
  productFilters: {
    search: '',
    status: [],
    supplier: [],
  },
  setProductFilters: (filters) =>
    set((state) => ({
      productFilters: { ...state.productFilters, ...filters },
    })),
  clearProductFilters: () =>
    set({
      productFilters: {
        search: '',
        status: [],
        supplier: [],
      },
    }),
}))
