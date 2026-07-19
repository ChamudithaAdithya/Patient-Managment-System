import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Statistic, Button, List, Tag, Typography, Spin, Space, Empty } from 'antd'
import {
  UserOutlined, CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined,
  PlusOutlined, MedicineBoxOutlined, ScheduleOutlined, TeamOutlined,
} from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import { getAll as getPatients } from '../api/patients'
import { getAll as getAppointments } from '../api/appointments'
import { getAll as getDoctors } from '../api/doctors'
import type { Patient } from '../types/patient'
import type { Appointment } from '../types/appointment'
import type { Doctor } from '../types/doctor'

const { Text, Title } = Typography

const statusColors: Record<string, string> = {
  SCHEDULED: 'gold',
  COMPLETED: 'green',
  CANCELLED: 'red',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, hasRole } = useAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [doctorMap, setDoctorMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const promises: Promise<unknown>[] = [getDoctors()]

    if (hasRole('ADMIN', 'DOCTOR')) {
      promises.push(getPatients(), getAppointments())
    }

    Promise.allSettled(promises)
      .then((results) => {
        const map: Record<string, string> = {}
        let tempPatients: Patient[] = []
        let tempAppointments: Appointment[] = []
        let tempDoctors: Doctor[] = []

        results.forEach((r) => {
          if (r.status !== 'fulfilled') return
          const val = r.value
          if (!Array.isArray(val) || val.length === 0) return

          if ('specialization' in val[0]) {
            tempDoctors = val as Doctor[]
            tempDoctors.forEach((d: Doctor) => { map[d.id] = d.name })
          } else if ('dateOfBirth' in val[0]) {
            tempPatients = val as Patient[]
          } else if ('appointmentDateTime' in val[0]) {
            tempAppointments = val as Appointment[]
          }
        })

        setDoctors(tempDoctors)
        setDoctorMap(map)
        setPatients(tempPatients)
        setAppointments(tempAppointments)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  const scheduled = appointments.filter((a) => a.status === 'SCHEDULED').length
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length
  const cancelled = appointments.filter((a) => a.status === 'CANCELLED').length

  const isAdminOrDoctor = hasRole('ADMIN', 'DOCTOR')

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Dashboard</Title>
        <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
          Welcome, {user?.sub} ({user?.role})
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {isAdminOrDoctor ? (
          <>
            <Col xs={12} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Total Patients"
                  value={patients.length}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Scheduled"
                  value={scheduled}
                  prefix={<ScheduleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Completed"
                  value={completed}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Cancelled"
                  value={cancelled}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </>
        ) : (
          <>
            <Col xs={12} sm={12} lg={8}>
              <Card hoverable>
                <Statistic
                  title="Available Doctors"
                  value={doctors.length}
                  prefix={<MedicineBoxOutlined />}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={8}>
              <Card hoverable>
                <Statistic
                  title="Total Appointments"
                  value={appointments.length}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={8}>
              <Card hoverable>
                <Statistic
                  title="Doctors Available"
                  value={doctors.length}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#13c2c2' }}
                />
              </Card>
            </Col>
          </>
        )}
      </Row>

      <Space style={{ marginBottom: 24 }} size="middle" wrap>
        {isAdminOrDoctor && (
          <>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/patients/new')}>
              New Patient
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => navigate('/appointments/new')}>
              New Appointment
            </Button>
          </>
        )}
        {hasRole('PATIENT') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/appointments/new')}>
            Book Appointment
          </Button>
        )}
        {hasRole('STAFF') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/appointments/new')}>
            New Appointment
          </Button>
        )}
      </Space>

      <Row gutter={[16, 16]}>
        {isAdminOrDoctor && (
          <Col xs={24} lg={12}>
            <Card title={<><UserOutlined /> Recent Patients</>}>
              {patients.length === 0 ? (
                <Empty description="No patients yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <List
                  dataSource={patients.slice(-5).reverse()}
                  renderItem={(p: Patient) => (
                    <List.Item
                      actions={[<Button type="link" onClick={() => navigate(`/patients/${p.id}`)}>View</Button>]}
                    >
                      <List.Item.Meta
                        title={p.name}
                        description={p.email}
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>
        )}
        <Col xs={24} lg={isAdminOrDoctor ? 12 : 24}>
          <Card title={<><CalendarOutlined /> Recent Appointments</>}>
            {appointments.length === 0 ? (
              <Empty description="No appointments yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={appointments.slice(-5).reverse()}
                renderItem={(a: Appointment) => (
                  <List.Item
                    actions={[
                      <Button type="link" onClick={() => navigate(`/appointments/${a.id}`)}>View</Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={`${new Date(a.appointmentDateTime).toLocaleDateString()} ${new Date(a.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      description={`Doctor: ${doctorMap[a.doctorId] || a.doctorId.slice(0, 8)}`}
                    />
                    <Tag color={statusColors[a.status]}>{a.status}</Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
