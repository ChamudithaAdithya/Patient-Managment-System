import { useEffect, useState } from 'react'
import { getUsers, createAdmin, deleteAdmin } from '../../api/auth'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { toast } from '../../components/ui/Toast'

interface User {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  createdBy: string | null
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    getUsers().then(setUsers).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast({ message: 'All fields required', type: 'error' })
      return
    }
    setSubmitting(true)
    try {
      await createAdmin(form)
      toast({ message: 'Admin created', type: 'success' })
      setShowForm(false)
      setForm({ name: '', email: '', password: '' })
      load()
    } catch {
      toast({ message: 'Failed to create admin', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this admin?')) return
    try {
      await deleteAdmin(id)
      toast({ message: 'Admin deactivated', type: 'success' })
      load()
    } catch {
      toast({ message: 'Failed to deactivate', type: 'error' })
    }
  }

  const admins = users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New Admin'}</Button>
      </div>

      {showForm && (
        <Card title="Create New Admin">
          <div className="space-y-3">
            <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Button onClick={handleCreate} loading={submitting}>Create Admin</Button>
          </div>
        </Card>
      )}

      <Card title={`Users (${users.length})`}>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="size-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {admins.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email} &middot; {u.role}</p>
                </div>
                {u.role !== 'SUPER_ADMIN' && (
                  <Button variant="danger" size="sm" onClick={() => handleDelete(u.id)}>Deactivate</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
