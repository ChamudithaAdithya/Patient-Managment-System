import { useEffect, useState } from 'react'
import { getStaff, createStaff, deleteStaff } from '../../api/auth'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { toast } from '../../components/ui/Toast'

interface Staff {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

export default function StaffList() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    getStaff().then(setStaff).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast({ message: 'All fields required', type: 'error' })
      return
    }
    setSubmitting(true)
    try {
      await createStaff(form)
      toast({ message: 'Staff created', type: 'success' })
      setShowForm(false)
      setForm({ name: '', email: '', password: '' })
      load()
    } catch {
      toast({ message: 'Failed to create staff', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this staff member?')) return
    try {
      await deleteStaff(id)
      toast({ message: 'Staff deactivated', type: 'success' })
      load()
    } catch {
      toast({ message: 'Failed to deactivate', type: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New Staff'}</Button>
      </div>

      {showForm && (
        <Card title="Create New Staff Member">
          <div className="space-y-3">
            <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Button onClick={handleCreate} loading={submitting}>Create Staff</Button>
          </div>
        </Card>
      )}

      <Card title={`Staff (${staff.length})`}>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="size-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : staff.length === 0 ? (
          <p className="text-sm text-gray-500">No staff members</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {staff.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.email}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => handleDelete(s.id)}>Deactivate</Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
