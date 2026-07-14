import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { getAll as getPatients } from '../api/patients'
import { getAll as getAppointments } from '../api/appointments'
import type { Patient } from '../types/patient'
import type { Appointment } from '../types/appointment'

export default function Dashboard() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getPatients(), getAppointments()])
      .then(([p, a]) => {
        setPatients(Array.isArray(p) ? p : [])
        setAppointments(Array.isArray(a) ? a : [])
      })
      .catch(() => {
        setPatients([])
        setAppointments([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="size-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  const scheduled = appointments.filter((a) => a.status === 'SCHEDULED').length
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length
  const cancelled = appointments.filter((a) => a.status === 'CANCELLED').length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-gray-500">Total Patients</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{patients.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Scheduled</p>
          <p className="mt-1 text-3xl font-bold text-yellow-600">{scheduled}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Completed</p>
          <p className="mt-1 text-3xl font-bold text-green-600">{completed}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Cancelled</p>
          <p className="mt-1 text-3xl font-bold text-red-600">{cancelled}</p>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => navigate('/patients/new')}>+ New Patient</Button>
        <Button variant="secondary" onClick={() => navigate('/appointments/new')}>+ New Appointment</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Recent Patients">
          {patients.length === 0 ? (
            <p className="text-sm text-gray-500">No patients yet</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {patients.slice(-5).reverse().map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.email}</p>
                  </div>
                  <button onClick={() => navigate(`/patients/${p.id}`)} className="text-xs text-blue-600 hover:underline cursor-pointer">View</button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent Appointments">
          {appointments.length === 0 ? (
            <p className="text-sm text-gray-500">No appointments yet</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {appointments.slice(-5).reverse().map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm text-gray-900">{new Date(a.appointmentDateTime).toLocaleDateString()} {new Date(a.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-xs text-gray-500">Doctor: {a.doctorId.slice(0, 8)}...</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    a.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-800' :
                    a.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
