import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getById } from '../../api/doctors'
import { getByDoctor } from '../../api/appointments'
import { Descriptions, Card, Tag, Button, Typography, Spin, Row, Col, Statistic, List, Space } from 'antd'
import type { Doctor } from '../../types/doctor'
import type { Appointment } from '../../types/appointment'

const { Title, Text } = Typography

const statusColors: Record<string, string> = {
  SCHEDULED: 'gold',
  COMPLETED: 'green',
  CANCELLED: 'red',
}

export default function DoctorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([getById(id), getByDoctor(id)])
      .then(([d, a]) => {
        setDoctor(d)
        setAppointments(a)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  if (!doctor) {
    return <Text>Doctor not found</Text>
  }

  const scheduled = appointments.filter((a) => a.status === 'SCHEDULED').length
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{doctor.name}</Title>
        <Space>
          <Button type="primary" onClick={() => navigate(`/doctors/${id}/edit`)}>Edit</Button>
          <Button onClick={() => navigate(`/doctors/schedule?doctorId=${doctor.id}`)}>View Schedule</Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, lg: 4 }}>
          <Descriptions.Item label="Email">{doctor.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{doctor.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Specialization">{doctor.specialization || '-'}</Descriptions.Item>
          <Descriptions.Item label="Department">{doctor.department || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12}>
          <Card><Statistic title="Scheduled Appointments" value={scheduled} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col xs={12}>
          <Card><Statistic title="Completed Appointments" value={completed} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
      </Row>

      <Card title="Appointments">
        <List
          dataSource={appointments}
          locale={{ emptyText: 'No appointments' }}
          renderItem={(a: Appointment) => (
            <List.Item
              actions={[<Button type="link" onClick={() => navigate(`/appointments/${a.id}`)}>View</Button>]}
            >
              <List.Item.Meta
                title={`${new Date(a.appointmentDateTime).toLocaleDateString()} ${new Date(a.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                description={a.reason}
              />
              <Tag color={statusColors[a.status]}>{a.status}</Tag>
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}
