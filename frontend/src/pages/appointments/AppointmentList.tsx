import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAll, cancel } from '../../api/appointments'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { toast } from '../../components/ui/Toast'
import type { Appointment } from '../../types/appointment'

export default function AppointmentList() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getAll()
      .then(setAppointments)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return
    try {
      await cancel(id)
      toast({ message: 'Appointment cancelled', type: 'success' })
      load()
    } catch {
      toast({ message: 'Failed to cancel', type: 'error' })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="size-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <Button onClick={() => navigate('/appointments/new')}>+ New Appointment</Button>
      </div>
      <Card>
        {appointments.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No appointments</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Patient ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Doctor ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date & Time</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Reason</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{a.patientId.slice(0, 8)}...</td>
                    <td className="px-4 py-3 font-mono text-xs">{a.doctorId.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-gray-900">
                      {new Date(a.appointmentDateTime).toLocaleDateString()}{' '}
                      {new Date(a.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-600">{a.reason}</td>
                    <td className="px-4 py-3"><Badge variant={a.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => navigate(`/appointments/${a.id}`)}>View</Button>
                        {a.status === 'SCHEDULED' && (
                          <Button variant="danger" onClick={() => handleCancel(a.id)}>Cancel</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
