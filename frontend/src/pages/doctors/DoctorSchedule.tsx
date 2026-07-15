import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getByDoctor, getAvailableSlots } from '../../api/appointments'
import { getById as getDoctorById } from '../../api/doctors'
import { getAll as getDoctors } from '../../api/doctors'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import type { Appointment } from '../../types/appointment'
import type { Doctor } from '../../types/doctor'

export default function DoctorSchedule() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [doctorId, setDoctorId] = useState(searchParams.get('doctorId') || '')
  const [doctorName, setDoctorName] = useState('')
  const [date, setDate] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    getDoctors().then(setDoctors)
  }, [])

  useEffect(() => {
    if (doctorId) {
      getDoctorById(doctorId).then((d) => setDoctorName(d.name)).catch(() => setDoctorName(''))
    } else {
      setDoctorName('')
    }
  }, [doctorId])

  const handleSearch = async () => {
    if (!doctorId) return
    setLoading(true)
    setSearched(true)
    try {
      const [apps, slts] = await Promise.all([
        getByDoctor(doctorId),
        date ? getAvailableSlots(doctorId, date) : Promise.resolve([]),
      ])
      setAppointments(apps)
      setSlots(slts)
    } catch {
      setAppointments([])
      setSlots([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Doctor Schedule</h1>

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-60 flex-1">
            <Select
              label="Doctor"
              placeholder="Select a doctor"
              options={doctors.map((d) => ({ value: d.id, label: `${d.name} (${d.specialization || 'General'})` }))}
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button onClick={handleSearch} loading={loading}>Search</Button>
        </div>
      </Card>

      {doctorName && <p className="text-sm text-gray-500">Showing schedule for <span className="font-medium text-gray-900">{doctorName}</span></p>}

      {searched && !loading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title={`Appointments (${appointments.length})`}>
            {appointments.length === 0 ? (
              <p className="text-sm text-gray-500">No appointments found</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {appointments.map((a) => (
                  <div
                    key={a.id}
                    className="flex cursor-pointer items-center justify-between py-3 hover:bg-gray-50"
                    onClick={() => navigate(`/appointments/${a.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(a.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-gray-500">Patient: {a.patientId.slice(0, 8)}...</p>
                      <p className="text-xs text-gray-500">{a.reason}</p>
                    </div>
                    <Badge variant={a.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={`Available Slots (${slots.length})`}>
            {slots.length === 0 ? (
              <p className="text-sm text-gray-500">No available slots for this date</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <div
                    key={slot}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-center text-sm text-gray-700"
                  >
                    {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
