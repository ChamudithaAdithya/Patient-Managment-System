import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getByDoctor, getAvailableSlots } from '../../api/appointments'
import { getById as getDoctorById } from '../../api/doctors'
import { getAll as getDoctors } from '../../api/doctors'
import { Card, Tag, Typography, Row, Col, Select, DatePicker, Button, Spin, List } from 'antd'
import type { Appointment } from '../../types/appointment'
import type { Doctor } from '../../types/doctor'

const { Title, Text } = Typography
const { Option } = Select

const statusColors: Record<string, string> = {
  SCHEDULED: 'gold',
  COMPLETED: 'green',
  CANCELLED: 'red',
}

export default function DoctorSchedule() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [doctorId, setDoctorId] = useState(searchParams.get('doctorId') || '')
  const [doctorName, setDoctorName] = useState('')
  const [date, setDate] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    getDoctors().then(setDoctors)
  }, [])

  useEffect(() => {
    if (doctorId) {
      getDoctorById(doctorId).then((d) => setDoctorName(d.name)).catch(() => setDoctorName(''))
    } else {
      setDoctorName('')
    }
  }, [doctorId])

  const handleSearch = async () => {
    if (!doctorId) return
    setLoading(true)
    setSearched(true)
    try {
      const [apps, slts] = await Promise.all([
        getByDoctor(doctorId),
        date ? getAvailableSlots(doctorId, date) : Promise.resolve([]),
      ])
      setAppointments(apps)
      setSlots(slts)
    } catch {
      setAppointments([])
      setSlots([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>Doctor Schedule</Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={12} md={8}>
            <div>
              <Text style={{ display: 'block', marginBottom: 4 }}>Doctor</Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Select a doctor"
                value={doctorId || undefined}
                onChange={(v) => setDoctorId(v)}
              >
                {doctors.map((d) => (
                  <Option key={d.id} value={d.id}>{d.name} ({d.specialization || 'General'})</Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text style={{ display: 'block', marginBottom: 4 }}>Date</Text>
              <DatePicker
                style={{ width: '100%' }}
                onChange={(d) => setDate(d ? d.format('YYYY-MM-DD') : '')}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button type="primary" onClick={handleSearch} loading={loading}>Search</Button>
          </Col>
        </Row>
      </Card>

      {doctorName && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Showing schedule for <Text strong>{doctorName}</Text>
        </Text>
      )}

      {searched && !loading && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title={`Appointments (${appointments.length})`}>
              <List
                dataSource={appointments}
                locale={{ emptyText: 'No appointments found' }}
                renderItem={(a: Appointment) => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/appointments/${a.id}`)}
                    actions={[<Tag color={statusColors[a.status]}>{a.status}</Tag>]}
                  >
                    <List.Item.Meta
                      title={new Date(a.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      description={<>{a.reason}<br /><Text type="secondary">Patient: {a.patientId.slice(0, 8)}...</Text></>}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={`Available Slots (${slots.length})`}>
              {slots.length === 0 ? (
                <Text type="secondary">No available slots for this date</Text>
              ) : (
                <Row gutter={[8, 8]}>
                  {slots.map((slot) => (
                    <Col key={slot}>
                      <Tag style={{ padding: '4px 12px', fontSize: 14 }}>
                        {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Tag>
                    </Col>
                  ))}
                </Row>
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}
