import { useEffect, useState } from 'react'
import { getStaff, createStaff, deleteStaff } from '../../api/auth'
import { Card, Button, Input, Typography, Table, Modal, Form, message, Popconfirm } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

const { Title } = Typography

interface Staff {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

export default function StaffList() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    getStaff().then(setStaff).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (values: { name: string; email: string; password: string }) => {
    setSubmitting(true)
    try {
      await createStaff(values)
      message.success('Staff created')
      setModalOpen(false)
      form.resetFields()
      load()
    } catch {
      message.error('Failed to create staff')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteStaff(id)
      message.success('Staff deactivated')
      load()
    } catch {
      message.error('Failed to deactivate')
    }
  }

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, r: Staff) => (
        <Popconfirm title="Deactivate this staff member?" onConfirm={() => handleDelete(r.id)}>
          <Button danger size="small">Deactivate</Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Staff Management</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>New Staff</Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={staff}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: 'No staff members' }}
        />
      </Card>

      <Modal
        title="Create New Staff Member"
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
          <Button type="primary" htmlType="submit" loading={submitting}>Create Staff</Button>
        </Form>
      </Modal>
    </div>
  )
}
