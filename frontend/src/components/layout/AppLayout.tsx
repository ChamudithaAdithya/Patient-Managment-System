import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import { Sidebar } from './Sidebar'

const { Content } = Layout

export function AppLayout() {
  return (
    <Layout className="site-layout">
      <Sidebar />
      <Layout>
        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
