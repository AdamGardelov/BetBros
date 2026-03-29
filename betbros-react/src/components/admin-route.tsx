import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'

export function AdminRoute() {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center">Laddar...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
