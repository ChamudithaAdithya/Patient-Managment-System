import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getById, create, update } from '../../api/patients'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { toast } from '../../components/ui/Toast'
import type { PatientRequest } from '../../types/patient'

export default function PatientForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState<PatientRequest>({ name: '', email: '', address: '', dateOfBirth: '', registeredDate: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  useEffect(() => {
    if (id) {
      getById(id)
        .then((p) => setForm({ name: p.name, email: p.email, address: p.address, dateOfBirth: p.dateOfBirth, registeredDate: p.registeredDate, phone: p.phone || '' }))
        .finally(() => setFetching(false))
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await update(id!, form)
        toast({ message: 'Patient updated', type: 'success' })
      } else {
        await create(form)
        toast({ message: 'Patient created', type: 'success' })
      }
      navigate('/patients')
    } catch {
      toast({ message: 'Failed to save patient', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex justify-center py-20">
        <div className="size-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Patient' : 'New Patient'}</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Phone" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required />
          <Input label="Registered Date" type="date" value={form.registeredDate} onChange={(e) => setForm({ ...form, registeredDate: e.target.value })} required />
          <div className="flex gap-3">
            <Button type="submit" loading={loading}>{isEdit ? 'Update' : 'Create'}</Button>
            <Button variant="secondary" type="button" onClick={() => navigate('/patients')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
