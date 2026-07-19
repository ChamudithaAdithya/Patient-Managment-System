import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getById, cancel, getConsultationByAppointment, createConsultation } from '../../api/appointments'
import { getById as getDoctorById } from '../../api/doctors'
import { uploadImage, getPatientImages, getImageUrl } from '../../api/images'
import { Descriptions, Card, Tag, Button, Typography, Spin, message, Modal, Select, Upload, Tabs, Input, Form } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { Appointment } from '../../types/appointment'
import type { Doctor } from '../../types/doctor'
import type { Consultation } from '../../types/consultation'
import type { MedicalImage, ImageType } from '../../types/image'
import { useAuth } from '../../hooks/useAuth'

const { Text, Title } = Typography
const { TextArea } = Input

const statusColors: Record<string, string> = {
  SCHEDULED: 'gold',
  COMPLETED: 'green',
  CANCELLED: 'red',
}

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [doctorName, setDoctorName] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showConsultForm, setShowConsultForm] = useState(false)
  const [consultForm] = Form.useForm()
  const [images, setImages] = useState<MedicalImage[]>([])
  const [showImageModal, setShowImageModal] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageType, setImageType] = useState<ImageType>('XRAY')
  const [imageUploading, setImageUploading] = useState(false)

  const load = () => {
    if (!id) return
    setLoading(true)
    getById(id)
      .then((a) => {
        setAppointment(a)
        getDoctorById(a.doctorId).then((d: Doctor) => setDoctorName(d.name)).catch(() => {})
        if (a.status === 'COMPLETED') {
          getConsultationByAppointment(id).then(setConsultation).catch(() => {})
        }
        getPatientImages(a.patientId).then(setImages).catch(() => {})
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleCancel = async () => {
    setActionLoading(true)
    try {
      await cancel(id!)
      message.success('Appointment cancelled')
      load()
    } catch {
      message.error('Failed to cancel')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUploadImage = async () => {
    if (!imageFile || !appointment) {
      message.error('Select a file')
      return
    }
    setImageUploading(true)
    try {
      await uploadImage(appointment.patientId, imageFile, imageType)
      message.success('Image uploaded successfully')
      setShowImageModal(false)
      setImageFile(null)
      getPatientImages(appointment.patientId).then(setImages).catch(() => {})
    } catch {
      message.error('Failed to upload image')
    } finally {
      setImageUploading(false)
    }
  }

  const handleCreateConsultation = async (values: { symptoms: string; diagnosis?: string; notes?: string }) => {
    if (!values.symptoms.trim()) {
      message.error('Symptoms are required')
      return
    }
    setActionLoading(true)
    try {
      await createConsultation({
        appointmentId: id!,
        patientId: appointment!.patientId,
        symptoms: values.symptoms,
        diagnosis: values.diagnosis,
        notes: values.notes,
      })
      message.success('Consultation saved — Appointment completed')
      setShowConsultForm(false)
      load()
    } catch {
      message.error('Failed to create consultation')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  if (!appointment) {
    return <Text>Appointment not found</Text>
  }

  const tabItems = [
    {
      key: 'images',
      label: `Medical Images (${images.length})`,
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            {images.length === 0 ? (
              <Text type="secondary">No images</Text>
            ) : (
              <Tabs
                items={images.map((img) => ({
                  key: img.id,
                  label: img.fileName,
                  children: (
                    <div>
                      <img src={getImageUrl(img.id)} alt={img.fileName} style={{ maxWidth: '100%', maxHeight: 400 }} />
                      <p style={{ marginTop: 8 }}>
                        <Text type="secondary">{img.imageType} · {new Date(img.uploadedDate).toLocaleDateString()}</Text>
                      </p>
                    </div>
                  ),
                }))}
              />
            )}
          </div>
          {hasRole('DOCTOR', 'ADMIN', 'SUPER_ADMIN') && (
            <Button icon={<UploadOutlined />} onClick={() => setShowImageModal(true)}>Upload Medical Image</Button>
          )}
        </>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Appointment</Title>
        <Tag color={statusColors[appointment.status]}>{appointment.status}</Tag>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={1}>
          <Descriptions.Item label="Patient ID"><code>{appointment.patientId}</code></Descriptions.Item>
          <Descriptions.Item label="Doctor">{doctorName || appointment.doctorId}</Descriptions.Item>
          <Descriptions.Item label="Date & Time">
            {new Date(appointment.appointmentDateTime).toLocaleDateString(undefined, {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
            {' at '}
            {new Date(appointment.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Descriptions.Item>
          <Descriptions.Item label="Reason">{appointment.reason}</Descriptions.Item>
        </Descriptions>
      </Card>

      {consultation && (
        <Card title="Consultation" style={{ marginBottom: 16 }}>
          <Descriptions column={1}>
            <Descriptions.Item label="Symptoms">{consultation.symptoms}</Descriptions.Item>
            {consultation.diagnosis && <Descriptions.Item label="Diagnosis">{consultation.diagnosis}</Descriptions.Item>}
            {consultation.notes && <Descriptions.Item label="Notes">{consultation.notes}</Descriptions.Item>}
          </Descriptions>
        </Card>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Tabs items={tabItems} />
      </Card>

      <div style={{ display: 'flex', gap: 8 }}>
        {appointment.status === 'SCHEDULED' && (
          <>
            <Button type="primary" onClick={() => setShowConsultForm(true)}>Create Consultation</Button>
            <Button danger onClick={handleCancel} loading={actionLoading}>Cancel Appointment</Button>
          </>
        )}
        <Button onClick={() => navigate('/appointments')}>Back</Button>
      </div>

      <Modal
        title="Create Consultation"
        open={showConsultForm}
        onCancel={() => setShowConsultForm(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleCreateConsultation} form={consultForm}>
          <Form.Item name="symptoms" label="Symptoms" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="diagnosis" label="Diagnosis">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={actionLoading}>Save Consultation</Button>
        </Form>
      </Modal>

      <Modal
        title="Upload Medical Image"
        open={showImageModal}
        onCancel={() => setShowImageModal(false)}
        onOk={handleUploadImage}
        confirmLoading={imageUploading}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>Image Type</Text>
          <Select
            style={{ width: '100%', marginTop: 4 }}
            value={imageType}
            onChange={(v) => setImageType(v)}
            options={[
              { value: 'XRAY', label: 'X-Ray' },
              { value: 'MRI', label: 'MRI' },
              { value: 'CT', label: 'CT Scan' },
              { value: 'ULTRASOUND', label: 'Ultrasound' },
              { value: 'OTHER', label: 'Other' },
            ]}
          />
        </div>
        <Upload
          beforeUpload={(file) => {
            setImageFile(file)
            return false
          }}
          onRemove={() => setImageFile(null)}
          maxCount={1}
          accept="image/*,.pdf"
        >
          <Button icon={<UploadOutlined />}>Select File</Button>
        </Upload>
      </Modal>
    </div>
  )
}
