import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

// Pages
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import DashboardPage from '@/pages/DashboardPage'
import ImportedProductsPage from '@/pages/ImportedProductsPage'
import SuppliersPage from '@/pages/SuppliersPage'
import AdminPanelPage from '@/pages/AdminPanelPage'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignupPage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={user ? <DashboardPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/products"
        element={user ? <ImportedProductsPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/suppliers"
        element={user ? <SuppliersPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/admin"
        element={user ? <AdminPanelPage /> : <Navigate to="/login" />}
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
