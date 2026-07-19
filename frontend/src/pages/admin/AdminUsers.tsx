import { useEffect, useState } from 'react'
import { getUsers, createAdmin, deleteAdmin } from '../../api/auth'
import { Card, Button, Input, Typography, Table, Modal, Form, Space, Tag, message, Popconfirm } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

const { Title } = Typography

interface User {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  createdBy: string | null
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    getUsers().then(setUsers).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (values: { name: string; email: string; password: string }) => {
    setSubmitting(true)
    try {
      await createAdmin(values)
      message.success('Admin created')
      setModalOpen(false)
      form.resetFields()
      load()
    } catch {
      message.error('Failed to create admin')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAdmin(id)
      message.success('Admin deactivated')
      load()
    } catch {
      message.error('Failed to deactivate')
    }
  }

  const admins = users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', key: 'role', render: (_: unknown, r: User) => <Tag color={r.role === 'SUPER_ADMIN' ? 'red' : 'blue'}>{r.role}</Tag> },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, r: User) => (
        r.role !== 'SUPER_ADMIN' && (
          <Popconfirm title="Deactivate this admin?" onConfirm={() => handleDelete(r.id)}>
            <Button danger size="small">Deactivate</Button>
          </Popconfirm>
        )
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>User Management</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>New Admin</Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={admins}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="Create New Admin"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>Create Admin</Button>
        </Form>
      </Modal>
    </div>
  )
}
