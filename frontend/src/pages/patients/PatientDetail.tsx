import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getById } from '../../api/patients'
import { getByPatient } from '../../api/appointments'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import type { Patient } from '../../types/patient'
import type { Appointment } from '../../types/appointment'

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([getById(id), getByPatient(id)])
      .then(([p, a]) => {
        setPatient(p)
        setAppointments(a)
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
        <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
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
                  <p className="text-xs text-gray-500">Doctor: {a.doctorId}</p>
                  <p className="text-xs text-gray-500">{a.reason}</p>
                </div>
                <Badge variant={a.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
