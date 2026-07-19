import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Tag, Button, Space, Card, Typography, Input } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { getAll } from '../../api/doctors'
import { getByDoctor } from '../../api/appointments'
import type { Doctor } from '../../types/doctor'

const { Title } = Typography

export default function DoctorList() {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [apptCounts, setApptCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getAll()
      .then(async (d) => {
        setDoctors(d)
        const counts: Record<string, number> = {}
        await Promise.allSettled(d.map(async (doc) => {
          try {
            const apps = await getByDoctor(doc.id)
            counts[doc.id] = apps.length
          } catch { counts[doc.id] = 0 }
        }))
        setApptCounts(counts)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = doctors.filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      d.name.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q) ||
      (d.specialization || '').toLowerCase().includes(q) ||
      (d.department || '').toLowerCase().includes(q)
    )
  })

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Specialization',
      key: 'specialization',
      render: (_: unknown, d: Doctor) => d.specialization
        ? <Tag color="blue">{d.specialization}</Tag>
        : '-',
    },
    { title: 'Department', key: 'department', render: (_: unknown, d: Doctor) => d.department || '-' },
    { title: 'Phone', key: 'phone', render: (_: unknown, d: Doctor) => d.phone || '-' },
    { title: 'Appts', key: 'appts', render: (_: unknown, d: Doctor) => apptCounts[d.id] ?? 0 },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, d: Doctor) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/doctors/${d.id}`)}>View</Button>
          <Button type="link" onClick={() => navigate(`/doctors/${d.id}/edit`)}>Edit</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Doctors</Title>
        <Space>
          <Input
            placeholder="Search doctors..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/doctors/new')}>New Doctor</Button>
        </Space>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: 'No doctors registered yet.' }}
        />
      </Card>
    </div>
  )
}
