import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getById } from '../../api/doctors'
import { getByDoctor } from '../../api/appointments'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import type { Doctor } from '../../types/doctor'
import type { Appointment } from '../../types/appointment'

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
    return (
      <div className="flex justify-center py-20">
        <div className="size-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!doctor) {
    return <p className="text-gray-500">Doctor not found</p>
  }

  const scheduled = appointments.filter((a) => a.status === 'SCHEDULED').length
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{doctor.name}</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/doctors/${id}/edit`)}>Edit</Button>
          <Button variant="secondary" onClick={() => navigate(`/doctors/schedule?doctorId=${doctor.id}`)}>View Schedule</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-gray-500">Email</p>
          <p className="mt-1 font-medium">{doctor.email}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Phone</p>
          <p className="mt-1 font-medium">{doctor.phone || '-'}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Specialization</p>
          <p className="mt-1 font-medium">{doctor.specialization || '-'}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Department</p>
          <p className="mt-1 font-medium">{doctor.department || '-'}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-gray-500">Scheduled Appointments</p>
          <p className="mt-1 text-3xl font-bold text-yellow-600">{scheduled}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Completed Appointments</p>
          <p className="mt-1 text-3xl font-bold text-green-600">{completed}</p>
        </Card>
      </div>

      <Card title="Appointments">
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
                  <p className="text-xs text-gray-500">{a.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={a.status} />
                  <Button variant="ghost" onClick={() => navigate(`/appointments/${a.id}`)}>View</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
