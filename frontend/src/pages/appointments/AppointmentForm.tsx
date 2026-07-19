import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Select, DatePicker, message, Spin } from 'antd'
import { create, getAvailableSlots } from '../../api/appointments'
import { getAll as getPatients } from '../../api/patients'
import { getAll as getDoctors } from '../../api/doctors'
import { parseError } from '../../lib/errorHandler'
import type { Patient } from '../../types/patient'
import type { Doctor } from '../../types/doctor'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

export default function AppointmentForm() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([getPatients(), getDoctors()]).then(([p, d]) => {
      setPatients(p)
      setDoctors(d)
    })
  }, [])

  const loadSlots = async (doctorId: string, date: string) => {
    if (!doctorId || !date) {
      setSlots([])
      return
    }
    setSlotsLoading(true)
    try {
      const s = await getAvailableSlots(doctorId, date)
      setSlots(s)
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    const selectedSlot = values.appointmentDateTime as string
    if (!selectedSlot) {
      message.error('Please select a time slot')
      return
    }
    setLoading(true)
    try {
      await create({
        patientId: values.patientId as string,
        doctorId: values.doctorId as string,
        appointmentDateTime: selectedSlot,
        reason: values.reason as string,
      })
      message.success('Appointment created')
      navigate('/appointments')
    } catch (err) {
      const parsed = parseError(err)
      if (parsed.fieldErrors) {
        const fields = Object.entries(parsed.fieldErrors).map(([name, msg]) => ({
          name,
          errors: [msg as string],
        }))
        form.setFields(fields)
      }
      message.error(parsed.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <Title level={4} style={{ marginBottom: 16 }}>New Appointment</Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="patientId" label="Patient" rules={[{ required: true }]}>
            <Select showSearch placeholder="Search patients..." filterOption={(input, option) =>
              (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
            }>
              {patients.map((p) => (
                <Option key={p.id} value={p.id} label={`${p.name} (${p.email})`}>
                  {p.name} ({p.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="doctorId" label="Doctor" rules={[{ required: true }]}>
            <Select showSearch placeholder="Search doctors..." filterOption={(input, option) =>
              (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
            } onChange={() => {
              setSlots([])
              form.setFieldValue('appointmentDateTime', undefined)
            }}>
              {doctors.map((d) => (
                <Option key={d.id} value={d.id} label={`${d.name} - ${d.specialization}`}>
                  {d.name} - {d.specialization}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker
              style={{ width: '100%' }}
              onChange={(date) => {
                const doctorId = form.getFieldValue('doctorId')
                form.setFieldValue('appointmentDateTime', undefined)
                if (doctorId && date) {
                  loadSlots(doctorId, date.format('YYYY-MM-DD'))
                } else {
                  setSlots([])
                }
              }}
            />
          </Form.Item>

          {slotsLoading && <Spin style={{ display: 'block', margin: '8px 0' }} />}

          {slots.length > 0 && (
            <Form.Item name="appointmentDateTime" label="Available Time Slots" rules={[{ required: true, message: 'Please select a time slot' }]}>
              <Select placeholder="Select a time slot">
                {slots.map((slot) => (
                  <Option key={slot} value={slot}>
                    {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {!slotsLoading && slots.length === 0 && form.getFieldValue('date') && form.getFieldValue('doctorId') && (
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>No available slots for this date.</Text>
          )}

          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <Input placeholder="Reason for appointment" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading}>Create</Button>
            <Button onClick={() => navigate('/appointments')}>Cancel</Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}
