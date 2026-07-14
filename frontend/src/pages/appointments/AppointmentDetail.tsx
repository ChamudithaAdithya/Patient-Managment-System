import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getById, cancel, complete } from '../../api/appointments'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { toast } from '../../components/ui/Toast'
import type { Appointment } from '../../types/appointment'

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const load = () => {
    if (!id) return
    setLoading(true)
    getById(id).then(setAppointment).finally(() => setLoading(false))
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

  const handleComplete = async () => {
    setActionLoading(true)
    try {
      await complete(id!)
      toast({ message: 'Appointment completed', type: 'success' })
      load()
    } catch {
      toast({ message: 'Failed to complete', type: 'error' })
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
            <dt className="text-sm text-gray-500">Doctor ID</dt>
            <dd className="font-mono text-sm">{appointment.doctorId}</dd>
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

      <div className="flex gap-3">
        {appointment.status === 'SCHEDULED' && (
          <>
            <Button onClick={handleComplete} loading={actionLoading}>Mark Completed</Button>
            <Button variant="danger" onClick={handleCancel} loading={actionLoading}>Cancel Appointment</Button>
          </>
        )}
        <Button variant="secondary" onClick={() => navigate('/appointments')}>Back</Button>
      </div>
    </div>
  )
}
