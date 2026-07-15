import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getById, create, update } from '../../api/doctors'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { toast } from '../../components/ui/Toast'
import { parseError } from '../../lib/errorHandler'
import type { DoctorRequest } from '../../types/doctor'

export default function DoctorForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState<DoctorRequest>({ name: '', email: '', phone: '', specialization: '', department: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  useEffect(() => {
    if (id) {
      getById(id)
        .then((d) => setForm({ name: d.name, email: d.email, phone: d.phone || '', specialization: d.specialization || '', department: d.department || '' }))
        .finally(() => setFetching(false))
    }
  }, [id])

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      if (isEdit) {
        await update(id!, form)
        toast({ message: 'Doctor updated', type: 'success' })
      } else {
        await create(form)
        toast({ message: 'Doctor created', type: 'success' })
      }
      navigate('/doctors')
    } catch (err) {
      const parsed = parseError(err)
      setErrors(parsed.fieldErrors)
      toast({ message: parsed.message, type: 'error' })
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
      <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Doctor' : 'New Doctor'}</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={form.name} onChange={(e) => updateField('name', e.target.value)} error={errors.name} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} error={errors.email} required />
          <Input label="Phone" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} error={errors.phone} />
          <Input label="Specialization" value={form.specialization} onChange={(e) => updateField('specialization', e.target.value)} error={errors.specialization} placeholder="e.g. Cardiology" />
          <Input label="Department" value={form.department} onChange={(e) => updateField('department', e.target.value)} error={errors.department} placeholder="e.g. Cardiology Dept" />
          <div className="flex gap-3">
            <Button type="submit" loading={loading}>{isEdit ? 'Update' : 'Create'}</Button>
            <Button variant="secondary" type="button" onClick={() => navigate('/doctors')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
