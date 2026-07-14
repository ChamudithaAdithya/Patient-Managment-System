import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getById } from '../../api/patients'
import { getByPatient, getPatientConsultations } from '../../api/appointments'
import { getPatientImages, getImageUrl } from '../../api/images'
import { getAll as getDoctors } from '../../api/doctors'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import type { Patient } from '../../types/patient'
import type { Appointment } from '../../types/appointment'
import type { Doctor } from '../../types/doctor'
import type { Consultation } from '../../types/consultation'
import type { MedicalImage } from '../../types/image'

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
    return (
      <div className="flex justify-center py-20">
        <div className="size-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!patient) {
    return <p className="text-gray-500">Patient not found</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
          <Badge variant={patient.status === 'INACTIVE' ? 'CANCELLED' : 'SCHEDULED'}>{patient.status || 'ACTIVE'}</Badge>
        </div>
        <Button onClick={() => navigate(`/patients/${id}/edit`)}>Edit</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500">Email</p>
          <p className="mt-1 font-medium">{patient.email}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Phone</p>
          <p className="mt-1 font-medium">{patient.phone || '-'}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Address</p>
          <p className="mt-1 font-medium">{patient.address}</p>
        </Card>
      </div>

      <Card title={`Appointments (${appointments.length})`}>
        {appointments.length === 0 ? (
          <p className="text-sm text-gray-500">No appointments</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {appointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(a.appointmentDateTime).toLocaleDateString()} {new Date(a.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-gray-500">Doctor: {doctorMap[a.doctorId] || a.doctorId}</p>
                  <p className="text-xs text-gray-500">{a.reason}</p>
                </div>
                <Badge variant={a.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={`Consultation History (${consultations.length})`}>
        {consultations.length === 0 ? (
          <p className="text-sm text-gray-500">No consultations</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {consultations.map((c) => (
              <div key={c.id} className="py-3">
                <p className="text-xs text-gray-500">{new Date(c.createdDate).toLocaleDateString()} &middot; Doctor: {doctorMap[c.doctorId] || c.doctorId}</p>
                <p className="mt-1 text-sm font-medium">Symptoms: {c.symptoms}</p>
                {c.diagnosis && <p className="text-sm text-gray-700">Diagnosis: {c.diagnosis}</p>}
                {c.notes && <p className="text-sm text-gray-500">Notes: {c.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={`Medical Images (${images.length})`}>
        {images.length === 0 ? (
          <p className="text-sm text-gray-500">No images</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {images.map((img) => (
              <div key={img.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{img.fileName}</p>
                  <p className="text-xs text-gray-500">
                    {img.imageType} &middot; {new Date(img.uploadedDate).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={getImageUrl(img.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
