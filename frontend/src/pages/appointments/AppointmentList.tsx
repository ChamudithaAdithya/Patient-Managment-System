import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Tag, Button, Space, Card, Typography, Popconfirm, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { getAll, cancel } from '../../api/appointments'
import { getAll as getDoctors } from '../../api/doctors'
import type { Appointment } from '../../types/appointment'
import type { Doctor } from '../../types/doctor'

const { Title } = Typography

const statusColors: Record<string, string> = {
  SCHEDULED: 'gold',
  COMPLETED: 'green',
  CANCELLED: 'red',
}

export default function AppointmentList() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctorMap, setDoctorMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([getAll(), getDoctors()])
      .then(([a, d]) => {
        setAppointments(a)
        const map: Record<string, string> = {}
        d.forEach((doc: Doctor) => { map[doc.id] = doc.name })
        setDoctorMap(map)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCancel = async (id: string) => {
    try {
      await cancel(id)
      message.success('Appointment cancelled')
      load()
    } catch {
      message.error('Failed to cancel')
    }
  }

  const columns = [
    {
      title: 'Patient',
      key: 'patient',
      render: (_: unknown, a: Appointment) => <code>{a.patientId.slice(0, 8)}...</code>,
    },
    {
      title: 'Doctor',
      key: 'doctor',
      render: (_: unknown, a: Appointment) => doctorMap[a.doctorId] || a.doctorId.slice(0, 8),
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (_: unknown, a: Appointment) => (
        <span>
          {new Date(a.appointmentDateTime).toLocaleDateString()}{' '}
          {new Date(a.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, a: Appointment) => <Tag color={statusColors[a.status]}>{a.status}</Tag>,
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, a: Appointment) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/appointments/${a.id}`)}>View</Button>
          {a.status === 'SCHEDULED' && (
            <Popconfirm title="Cancel this appointment?" onConfirm={() => handleCancel(a.id)}>
              <Button type="link" danger>Cancel</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Appointments</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/appointments/new')}>New Appointment</Button>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={appointments}
          rowKey="id"
          loading={loading}
        />
      </Card>
    </div>
  )
}
