import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Tag, Button, Space, Card, Typography, Popconfirm, message, Input } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { getAll, remove } from '../../api/patients'
import type { Patient } from '../../types/patient'

const { Title } = Typography

export default function PatientList() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    getAll()
      .then(setPatients)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    try {
      await remove(id)
      message.success('Patient deleted')
      load()
    } catch {
      message.error('Failed to delete patient')
    }
  }

  const filtered = patients.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.phone || '').includes(q)
    )
  })

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, p: Patient) => (
        <Tag color={p.status === 'INACTIVE' ? 'red' : 'green'}>{p.status || 'ACTIVE'}</Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, p: Patient) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Button type="link" onClick={() => navigate(`/patients/${p.id}`)}>Edit</Button>
          <Popconfirm
            title="Delete this patient?"
            onConfirm={() => handleDelete(p.id)}
          >
            <Button type="link" danger>{p.status === 'INACTIVE' ? 'Activate' : 'Delete'}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Patients</Title>
        <Space>
          <Input
            placeholder="Search patients..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/patients/new')}>New Patient</Button>
        </Space>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: 'No patients found.' }}
        />
      </Card>
    </div>
  )
}
