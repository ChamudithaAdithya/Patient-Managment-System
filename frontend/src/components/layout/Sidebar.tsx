import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function Sidebar() {
  const { pathname } = useLocation()
  const { logout, user, hasRole } = useAuth()

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'STAFF', 'PATIENT'] },
    { to: '/patients', label: 'Patients', icon: '👤', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'STAFF'] },
    { to: '/appointments', label: 'Appointments', icon: '📅', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'STAFF', 'PATIENT'] },
    { to: '/doctors', label: 'Doctors', icon: '👨‍⚕️', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'] },
    { to: '/doctors/schedule', label: 'Schedule', icon: '⏰', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'STAFF'] },
    { to: '/admin/users', label: 'Admin Mgmt', icon: '🔐', roles: ['SUPER_ADMIN'] },
    { to: '/admin/staff', label: 'Staff', icon: '👥', roles: ['SUPER_ADMIN', 'ADMIN'] },
  ]

  const visible = links.filter((l) => hasRole(...l.roles))

  return (
    <aside className="flex h-full w-60 flex-col bg-gray-900 text-white">
      <div className="flex items-center gap-2 border-b border-gray-700 px-5 py-4">
        <span className="text-xl">🏥</span>
        <span className="text-lg font-bold">PM System</span>
      </div>

      {user && (
        <div className="border-b border-gray-700 px-5 py-3">
          <p className="text-xs text-gray-400">{user.role}</p>
          <p className="truncate text-sm font-medium text-gray-200">{user.sub}</p>
        </div>
      )}

      <nav className="flex-1 space-y-1 p-3">
        {visible.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith(l.to) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-700 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
        >
          <span>🚪</span>
          Logout
        </button>
      </div>
    </aside>
  )
}
