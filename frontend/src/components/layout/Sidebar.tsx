import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Typography } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  ScheduleOutlined,
  SafetyOutlined,
  TeamOutlined,
  BarChartOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'

const { Sider } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'STAFF', 'PATIENT'] },
  { key: '/patients', icon: <UserOutlined />, label: 'Patients', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'STAFF'] },
  { key: '/appointments', icon: <CalendarOutlined />, label: 'Appointments', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'STAFF', 'PATIENT'] },
  { key: '/doctors', icon: <MedicineBoxOutlined />, label: 'Doctors', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'] },
  { key: '/doctors/schedule', icon: <ScheduleOutlined />, label: 'Schedule', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'STAFF'] },
  { key: '/admin/users', icon: <SafetyOutlined />, label: 'Admin Mgmt', roles: ['SUPER_ADMIN'] },
  { key: '/admin/staff', icon: <TeamOutlined />, label: 'Staff', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { key: '/analytics', icon: <BarChartOutlined />, label: 'Analytics', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'STAFF'] },
]

function getSelectedKey(pathname: string) {
  if (pathname.startsWith('/doctors/schedule')) return '/doctors/schedule'
  if (pathname.startsWith('/doctors')) return '/doctors'
  if (pathname.startsWith('/appointments')) return '/appointments'
  if (pathname.startsWith('/patients')) return '/patients'
  if (pathname.startsWith('/admin/users')) return '/admin/users'
  if (pathname.startsWith('/admin/staff')) return '/admin/staff'
  if (pathname.startsWith('/analytics')) return '/analytics'
  return '/dashboard'
}

export function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { logout, user, hasRole } = useAuth()

  const visibleItems = menuItems.filter((item) => hasRole(...item.roles))

  return (
    <Sider breakpoint="lg" collapsedWidth={0} trigger={null} width={240}>
      <div className="logo-container">
        <h2>PM System</h2>
      </div>

      {user && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, display: 'block' }}>{user.role}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }} ellipsis>{user.sub}</Text>
        </div>
      )}

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey(pathname)]}
        items={visibleItems}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 0 }}
      />

      <div style={{ position: 'absolute', bottom: 0, width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Menu
          theme="dark"
          mode="inline"
          selectable={false}
          items={[
            { key: 'logout', icon: <LogoutOutlined />, label: 'Logout' },
          ]}
          onClick={logout}
        />
      </div>
    </Sider>
  )
}
