import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getById } from '../../api/patients'
import { getByPatient, getPatientConsultations } from '../../api/appointments'
import { getPatientImages, getImageUrl } from '../../api/images'
import { getAll as getDoctors } from '../../api/doctors'
import { Descriptions, Card, Tag, Button, Typography, Spin, List, Tabs } from 'antd'
import type { Patient } from '../../types/patient'
import type { Appointment } from '../../types/appointment'
import type { Doctor } from '../../types/doctor'
import type { Consultation } from '../../types/consultation'
import type { MedicalImage } from '../../types/image'

const { Title, Text } = Typography

const statusColors: Record<string, string> = {
  SCHEDULED: 'gold',
  COMPLETED: 'green',
  CANCELLED: 'red',
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [images, setImages] = useState<MedicalImage[]>([])
  const [doctorMap, setDoctorMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([getById(id), getByPatient(id), getDoctors(), getPatientConsultations(id).catch(() => []), getPatientImages(id).catch(() => [])])
      .then(([p, a, d, c, i]) => {
        setPatient(p)
        setAppointments(a)
        const map: Record<string, string> = {}
        ;(Array.isArray(d) ? d : []).forEach((doc: Doctor) => { map[doc.id] = doc.name })
        setDoctorMap(map)
        setConsultations(c)
        setImages(i)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  if (!patient) {
    return <Text>Patient not found</Text>
  }

  const tabItems = [
    {
      key: 'appointments',
      label: `Appointments (${appointments.length})`,
      children: (
        <List
          dataSource={appointments}
          locale={{ emptyText: 'No appointments' }}
          renderItem={(a: Appointment) => (
            <List.Item
              actions={[<Button type="link" onClick={() => navigate(`/appointments/${a.id}`)}>View</Button>]}
            >
              <List.Item.Meta
                title={`${new Date(a.appointmentDateTime).toLocaleDateString()} ${new Date(a.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                description={<>Doctor: {doctorMap[a.doctorId] || a.doctorId}<br />{a.reason}</>}
              />
              <Tag color={statusColors[a.status]}>{a.status}</Tag>
            </List.Item>
          )}
        />
      ),
    },
    {
      key: 'consultations',
      label: `Consultations (${consultations.length})`,
      children: (
        <List
          dataSource={consultations}
          locale={{ emptyText: 'No consultations' }}
          renderItem={(c: Consultation) => (
            <List.Item>
              <List.Item.Meta
                title={`${new Date(c.createdDate).toLocaleDateString()} — Doctor: ${doctorMap[c.doctorId] || c.doctorId}`}
                description={
                  <>
                    <div><Text strong>Symptoms:</Text> {c.symptoms}</div>
                    {c.diagnosis && <div><Text strong>Diagnosis:</Text> {c.diagnosis}</div>}
                    {c.notes && <div><Text strong>Notes:</Text> {c.notes}</div>}
                  </>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: 'images',
      label: `Medical Images (${images.length})`,
      children: (
        <List
          dataSource={images}
          locale={{ emptyText: 'No images' }}
          renderItem={(img: MedicalImage) => (
            <List.Item
              actions={[
                <a href={getImageUrl(img.id)} target="_blank" rel="noopener noreferrer">View</a>,
              ]}
            >
              <List.Item.Meta
                title={img.fileName}
                description={`${img.imageType} · ${new Date(img.uploadedDate).toLocaleDateString()}`}
              />
            </List.Item>
          )}
        />
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Title level={4} style={{ margin: 0 }}>{patient.name}</Title>
          <Tag color={patient.status === 'INACTIVE' ? 'red' : 'green'}>{patient.status || 'ACTIVE'}</Tag>
        </div>
        <Button type="primary" onClick={() => navigate(`/patients/${id}/edit`)}>Edit</Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 3 }}>
          <Descriptions.Item label="Email">{patient.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{patient.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Address">{patient.address}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  )
}
