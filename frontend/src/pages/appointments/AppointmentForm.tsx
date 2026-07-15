import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { create, getAvailableSlots } from '../../api/appointments'
import { getAll as getPatients } from '../../api/patients'
import { getAll as getDoctors } from '../../api/doctors'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { toast } from '../../components/ui/Toast'
import { parseError } from '../../lib/errorHandler'
import type { Patient } from '../../types/patient'
import type { Doctor } from '../../types/doctor'

function SearchSelect<T extends { id: string }>({
  label, items, displayLabel, value, onChange, error, required, placeholder,
}: {
  label: string; items: T[]; displayLabel: (item: T) => string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; placeholder?: string;
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selected = items.find((i) => i.id === value)
  const filtered = query ? items.filter((i) => displayLabel(i).toLowerCase().includes(query.toLowerCase())) : items

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="space-y-1" ref={ref}>
      {label && <label className="text-sm font-medium text-gray-700">{label}{required && ' *'}</label>}
      <div className="relative">
        <input
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
          placeholder={selected ? displayLabel(selected) : (placeholder || 'Type to search...')}
          value={open ? query : (selected ? displayLabel(selected) : '')}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange('') }}
          onFocus={() => { setOpen(true); setQuery('') }}
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
        />
        {open && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">No results</li>
            ) : (
              filtered.map((item) => (
                <li
                  key={item.id}
                  className={`cursor-pointer px-3 py-2 text-sm hover:bg-blue-50 ${item.id === value ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-900'}`}
                  onMouseDown={() => { onChange(item.id); setOpen(false); setQuery('') }}
                >
                  {displayLabel(item)}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function AppointmentForm() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)

  useEffect(() => {
    Promise.all([getPatients(), getDoctors()]).then(([p, d]) => {
      setPatients(p)
      setDoctors(d)
    })
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
    setErrors({})
    try {
      await create({
        patientId,
        doctorId,
        appointmentDateTime: selectedSlot,
        reason,
      })
      toast({ message: 'Appointment created', type: 'success' })
      navigate('/appointments')
    } catch (err) {
      const parsed = parseError(err)
      setErrors(parsed.fieldErrors)
      toast({ message: parsed.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">New Appointment</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <SearchSelect<Patient>
            label="Patient"
            items={patients}
            displayLabel={(p) => `${p.name} (${p.email})`}
            value={patientId}
            onChange={(v) => { setPatientId(v); setErrors((prev) => { const next = { ...prev }; delete next.patientId; return next }) }}
            error={errors.patientId}
            required
            placeholder="Search patients..."
          />

          <SearchSelect<Doctor>
            label="Doctor"
            items={doctors}
            displayLabel={(d) => `${d.name} - ${d.specialization}`}
            value={doctorId}
            onChange={(v) => { setDoctorId(v); setErrors((prev) => { const next = { ...prev }; delete next.doctorId; return next }) }}
            error={errors.doctorId}
            required
            placeholder="Search doctors by name or specialization..."
          />

          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setErrors((prev) => { const next = { ...prev }; delete next.appointmentDateTime; return next }) }}
            error={errors.appointmentDateTime}
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
                      onClick={() => { setSelectedSlot(slot); setErrors((prev) => { const next = { ...prev }; delete next.appointmentDateTime; return next }) }}
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
              {errors.appointmentDateTime && <p className="text-xs text-red-600">{errors.appointmentDateTime}</p>}
            </div>
          ) : doctorId && date ? (
            <p className="text-sm text-gray-500">No available slots for this date.</p>
          ) : null}

          <Input
            label="Reason"
            placeholder="Reason for appointment"
            value={reason}
            onChange={(e) => { setReason(e.target.value); setErrors((prev) => { const next = { ...prev }; delete next.reason; return next }) }}
            error={errors.reason}
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
