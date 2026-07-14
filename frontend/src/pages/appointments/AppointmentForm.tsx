import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { create, getAvailableSlots } from '../../api/appointments'
import { getAll as getPatients } from '../../api/patients'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Card } from '../../components/ui/Card'
import { toast } from '../../components/ui/Toast'
import type { Patient } from '../../types/patient'

export default function AppointmentForm() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)

  useEffect(() => {
    getPatients().then(setPatients)
  }, [])

  useEffect(() => {
    if (doctorId && date) {
      setSlotsLoading(true)
      setSelectedSlot('')
      getAvailableSlots(doctorId, date)
        .then(setSlots)
        .catch(() => setSlots([]))
        .finally(() => setSlotsLoading(false))
    } else {
      setSlots([])
    }
  }, [doctorId, date])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) {
      toast({ message: 'Please select a time slot', type: 'error' })
      return
    }
    setLoading(true)
    try {
      await create({
        patientId,
        doctorId,
        appointmentDateTime: selectedSlot,
        reason,
      })
      toast({ message: 'Appointment created', type: 'success' })
      navigate('/appointments')
    } catch {
      toast({ message: 'Failed to create appointment', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">New Appointment</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Patient"
            placeholder="Select a patient"
            options={patients.map((p) => ({ value: p.id, label: `${p.name} (${p.email})` }))}
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            required
          />

          <Input
            label="Doctor ID"
            placeholder="Enter doctor UUID"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            required
          />

          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          {slotsLoading ? (
            <p className="text-sm text-gray-500">Loading available slots...</p>
          ) : slots.length > 0 ? (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Available Time Slots</label>
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => {
                  const time = new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                        selectedSlot === slot
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {time}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : doctorId && date ? (
            <p className="text-sm text-gray-500">No available slots for this date.</p>
          ) : null}

          <Input
            label="Reason"
            placeholder="Reason for appointment"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />

          <div className="flex gap-3">
            <Button type="submit" loading={loading}>Create</Button>
            <Button variant="secondary" type="button" onClick={() => navigate('/appointments')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
