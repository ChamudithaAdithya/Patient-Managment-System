import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAll, getById } from '../../api/doctors'
import { getByDoctor } from '../../api/appointments'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { toast } from '../../components/ui/Toast'
import type { Doctor } from '../../types/doctor'

export default function DoctorList() {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [apptCounts, setApptCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAll()
      .then(async (d) => {
        setDoctors(d)
        const counts: Record<string, number> = {}
        await Promise.allSettled(d.map(async (doc) => {
          try {
            const apps = await getByDoctor(doc.id)
            counts[doc.id] = apps.length
          } catch { counts[doc.id] = 0 }
        }))
        setApptCounts(counts)
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
        <Button onClick={() => navigate('/doctors/new')}>+ New Doctor</Button>
      </div>
      <Card>
        {doctors.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No doctors registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Specialization</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Department</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Appts</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {doctors.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                    <td className="px-4 py-3 text-gray-600">{d.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">{d.specialization || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{d.department || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{d.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{apptCounts[d.id] ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => navigate(`/doctors/${d.id}`)}>View</Button>
                        <Button variant="ghost" onClick={() => navigate(`/doctors/${d.id}/edit`)}>Edit</Button>
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
