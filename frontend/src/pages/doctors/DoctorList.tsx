import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Tag, Button, Space, Card, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { getAll } from '../../api/doctors'
import { getByDoctor } from '../../api/appointments'
import type { Doctor } from '../../types/doctor'

const { Title } = Typography

export default function DoctorList() {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [apptCounts, setApptCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/doctors/new')}>New Doctor</Button>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={doctors}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: 'No doctors registered yet.' }}
        />
      </Card>
    </div>
  )
}
