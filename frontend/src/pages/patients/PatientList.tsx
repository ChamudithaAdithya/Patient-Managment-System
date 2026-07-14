import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAll, remove } from '../../api/patients'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Table, type Column } from '../../components/ui/Table'
import { toast } from '../../components/ui/Toast'
import type { Patient } from '../../types/patient'

export default function PatientList() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getAll()
      .then(setPatients)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this patient?')) return
    try {
      await remove(id)
      toast({ message: 'Patient deleted', type: 'success' })
      load()
    } catch {
      toast({ message: 'Failed to delete patient', type: 'error' })
    }
  }

  const columns: Column<Patient>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'address', header: 'Address' },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <Badge variant={p.status === 'INACTIVE' ? 'CANCELLED' : 'SCHEDULED'}>{p.status || 'ACTIVE'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" onClick={() => navigate(`/patients/${p.id}`)}>Edit</Button>
          <Button variant="danger" onClick={(e) => handleDelete(p.id, e)}>{p.status === 'INACTIVE' ? 'Activate' : 'Delete'}</Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        <Button onClick={() => navigate('/patients/new')}>+ New Patient</Button>
      </div>
      <Card>
        <Table columns={columns} data={patients} loading={loading} onRowClick={(p) => navigate(`/patients/${p.id}`)} />
      </Card>
    </div>
  )
}
