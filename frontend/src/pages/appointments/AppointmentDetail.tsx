import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getById, cancel, getConsultationByAppointment, createConsultation } from '../../api/appointments'
import { getById as getDoctorById } from '../../api/doctors'
import { uploadImage, getPatientImages, getImageUrl } from '../../api/images'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { toast } from '../../components/ui/Toast'
import type { Appointment } from '../../types/appointment'
import type { Doctor } from '../../types/doctor'
import type { Consultation } from '../../types/consultation'
import type { MedicalImage, ImageType } from '../../types/image'
import { useAuth } from '../../hooks/useAuth'

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [doctorName, setDoctorName] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ symptoms: '', diagnosis: '', notes: '' })
  const [images, setImages] = useState<MedicalImage[]>([])
  const [showImageUpload, setShowImageUpload] = useState(false)
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
    if (!confirm('Cancel this appointment?')) return
    setActionLoading(true)
    try {
      await cancel(id!)
      toast({ message: 'Appointment cancelled', type: 'success' })
      load()
    } catch {
      toast({ message: 'Failed to cancel', type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleUploadImage = async () => {
    if (!imageFile || !appointment) {
      toast({ message: 'Select a file', type: 'error' })
      return
    }
    setImageUploading(true)
    try {
      await uploadImage(appointment.patientId, imageFile, imageType)
      toast({ message: 'Image uploaded successfully', type: 'success' })
      setShowImageUpload(false)
      setImageFile(null)
      getPatientImages(appointment.patientId).then(setImages).catch(() => {})
    } catch {
      toast({ message: 'Failed to upload image', type: 'error' })
    } finally {
      setImageUploading(false)
    }
  }

  const handleCreateConsultation = async () => {
    if (!formData.symptoms.trim()) {
      toast({ message: 'Symptoms are required', type: 'error' })
      return
    }
    setActionLoading(true)
    try {
      await createConsultation({
        appointmentId: id!,
        patientId: appointment!.patientId,
        symptoms: formData.symptoms,
        diagnosis: formData.diagnosis,
        notes: formData.notes,
      })
      toast({ message: 'Consultation saved — Appointment completed', type: 'success' })
      setShowForm(false)
      load()
    } catch {
      toast({ message: 'Failed to create consultation', type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="size-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!appointment) {
    return <p className="text-gray-500">Appointment not found</p>
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Appointment</h1>
        <Badge variant={appointment.status} />
      </div>

      <Card>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-gray-500">Patient ID</dt>
            <dd className="font-mono text-sm">{appointment.patientId}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Doctor</dt>
            <dd className="text-sm font-medium">{doctorName || appointment.doctorId}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Date & Time</dt>
            <dd className="text-sm font-medium">
              {new Date(appointment.appointmentDateTime).toLocaleDateString(undefined, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
              {' at '}
              {new Date(appointment.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Reason</dt>
            <dd className="text-sm">{appointment.reason}</dd>
          </div>
        </dl>
      </Card>

      {consultation && (
        <Card title="Consultation">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Symptoms</p>
              <p className="text-sm">{consultation.symptoms}</p>
            </div>
            {consultation.diagnosis && (
              <div>
                <p className="text-sm text-gray-500">Diagnosis</p>
                <p className="text-sm">{consultation.diagnosis}</p>
              </div>
            )}
            {consultation.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-sm">{consultation.notes}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {showForm && (
        <Card title="New Consultation">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Symptoms *</label>
              <textarea
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                rows={3}
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
              <textarea
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                rows={2}
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateConsultation} loading={actionLoading}>Save Consultation</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <Card title={`Medical Images (${images.length})`}>
        <div className="space-y-3">
          {images.length === 0 ? (
            <p className="text-sm text-gray-500">No images</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {images.map((img) => (
                <div key={img.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{img.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {img.imageType} &middot; {new Date(img.uploadedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <a href={getImageUrl(img.id)} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">View</a>
                </div>
              ))}
            </div>
          )}
          {hasRole('DOCTOR', 'ADMIN', 'SUPER_ADMIN') && (
            <Button onClick={() => setShowImageUpload(!showImageUpload)} variant="secondary" size="sm">
              {showImageUpload ? 'Cancel' : 'Upload Medical Image'}
            </Button>
          )}
        </div>

        {showImageUpload && (
          <div className="mt-3 space-y-3 border-t pt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Image Type</label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                value={imageType}
                onChange={(e) => setImageType(e.target.value as ImageType)}
              >
                <option value="XRAY">X-Ray</option>
                <option value="MRI">MRI</option>
                <option value="CT">CT Scan</option>
                <option value="ULTRASOUND">Ultrasound</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">File</label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button onClick={handleUploadImage} loading={imageUploading} size="sm">Upload</Button>
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        {appointment.status === 'SCHEDULED' && (
          <>
            <Button onClick={() => setShowForm(true)}>Create Consultation</Button>
            <Button variant="danger" onClick={handleCancel} loading={actionLoading}>Cancel Appointment</Button>
          </>
        )}
        <Button variant="secondary" onClick={() => navigate('/appointments')}>Back</Button>
      </div>
    </div>
  )
}
