import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface Props {
  roles?: string[]
}

export function ProtectedRoute({ roles }: Props) {
  const { isAuthenticated, hasRole } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (roles && !hasRole(...roles)) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
