import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/patients', label: 'Patients', icon: '👤' },
  { to: '/appointments', label: 'Appointments', icon: '📅' },
]

export function Sidebar() {
  const { pathname } = useLocation()
  const { logout } = useAuth()

  return (
    <aside className="flex h-full w-60 flex-col bg-gray-900 text-white">
      <div className="flex items-center gap-2 border-b border-gray-700 px-5 py-4">
        <span className="text-xl">🏥</span>
        <span className="text-lg font-bold">PM System</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map((l) => (
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
