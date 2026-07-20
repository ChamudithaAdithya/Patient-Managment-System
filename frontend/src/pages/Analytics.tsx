import { useEffect, useState, useMemo } from 'react'
import { Row, Col, Card, Statistic, Table, Typography, Spin, Empty, Flex } from 'antd'
import {
  UserOutlined, CalendarOutlined, MedicineBoxOutlined, TeamOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ScheduleOutlined, MinusCircleOutlined,
  ArrowUpOutlined, ArrowDownOutlined,
} from '@ant-design/icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { getAll as getPatients } from '../api/patients'
import { getAll as getAppointments } from '../api/appointments'
import { getAll as getDoctors } from '../api/doctors'
import type { Patient } from '../types/patient'
import type { Appointment } from '../types/appointment'
import type { Doctor } from '../types/doctor'

const { Title, Text } = Typography

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: '#faad14',
  COMPLETED: '#52c41a',
  CANCELLED: '#ff4d4f',
  NO_SHOW: '#722ed1',
}

const PIE_COLORS = ['#faad14', '#52c41a', '#ff4d4f', '#722ed1']

function groupByMonth<T>(items: T[], dateKey: keyof T): Record<string, number> {
  const map: Record<string, number> = {}
  for (const item of items) {
    const d = new Date(item[dateKey] as unknown as string)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    map[key] = (map[key] || 0) + 1
  }
  return map
}

export default function Analytics() {
  const { hasRole } = useAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const promises: Promise<unknown>[] = [getPatients(), getAppointments(), getDoctors()]
    Promise.allSettled(promises).then((results) => {
      for (const r of results) {
        if (r.status !== 'fulfilled') continue
        const val = r.value as unknown[]
        if (!Array.isArray(val) || val.length === 0) continue
        if ('specialization' in val[0]) setDoctors(val as Doctor[])
        else if ('dateOfBirth' in val[0]) setPatients(val as Patient[])
        else if ('appointmentDateTime' in val[0]) setAppointments(val as Appointment[])
      }
    }).finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`

  const stats = useMemo(() => {
    const scheduled = appointments.filter(a => a.status === 'SCHEDULED').length
    const completed = appointments.filter(a => a.status === 'COMPLETED').length
    const cancelled = appointments.filter(a => a.status === 'CANCELLED').length
    const noShow = appointments.filter(a => a.status === 'NO_SHOW').length

    const thisMonthPatients = patients.filter(p => {
      const key = `${new Date(p.registeredDate).getFullYear()}-${String(new Date(p.registeredDate).getMonth() + 1).padStart(2, '0')}`
      return key === thisMonth
    }).length
    const lastMonthPatients = patients.filter(p => {
      const key = `${new Date(p.registeredDate).getFullYear()}-${String(new Date(p.registeredDate).getMonth() + 1).padStart(2, '0')}`
      return key === lastMonth
    }).length
    const patientGrowth = lastMonthPatients > 0 ? Math.round((thisMonthPatients - lastMonthPatients) / lastMonthPatients * 100) : 0

    const thisMonthAppts = appointments.filter(a => {
      const key = `${new Date(a.appointmentDateTime).getFullYear()}-${String(new Date(a.appointmentDateTime).getMonth() + 1).padStart(2, '0')}`
      return key === thisMonth
    }).length
    const lastMonthAppts = appointments.filter(a => {
      const key = `${new Date(a.appointmentDateTime).getFullYear()}-${String(new Date(a.appointmentDateTime).getMonth() + 1).padStart(2, '0')}`
      return key === lastMonth
    }).length
    const apptGrowth = lastMonthAppts > 0 ? Math.round((thisMonthAppts - lastMonthAppts) / lastMonthAppts * 100) : 0

    return { scheduled, completed, cancelled, noShow, patientGrowth, apptGrowth, thisMonthPatients, thisMonthAppts }
  }, [patients, appointments, thisMonth, lastMonth])

  const statusData = useMemo(() => [
    { name: 'SCHEDULED', value: stats.scheduled },
    { name: 'COMPLETED', value: stats.completed },
    { name: 'CANCELLED', value: stats.cancelled },
    { name: 'NO_SHOW', value: stats.noShow },
  ].filter(d => d.value > 0), [stats])

  const appointmentTrend = useMemo(() => {
    const byMonth = groupByMonth(appointments, 'appointmentDateTime')
    return Object.entries(byMonth).sort().map(([month, count]) => ({ month, appointments: count }))
  }, [appointments])

  const patientRegistrations = useMemo(() => {
    const byMonth = groupByMonth(patients, 'registeredDate')
    return Object.entries(byMonth).sort().map(([month, count]) => ({ month, patients: count }))
  }, [patients])

  const doctorBySpecialization = useMemo(() => {
    const map: Record<string, number> = {}
    for (const d of doctors) {
      map[d.specialization] = (map[d.specialization] || 0) + 1
    }
    return Object.entries(map).map(([name, count]) => ({ name, count }))
  }, [doctors])

  const recentAppointments = useMemo(() =>
    [...appointments].sort((a, b) => new Date(b.appointmentDateTime).getTime() - new Date(a.appointmentDateTime).getTime()).slice(0, 10),
  [appointments])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Analytics Dashboard</Title>
        <Text type="secondary">Platform-wide metrics and trends</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} lg={6}>
          <Card><Statistic title="Total Patients" value={patients.length} prefix={<UserOutlined />} valueStyle={{ color: '#1677ff' }} suffix={<Text style={{ fontSize: 14, color: stats.patientGrowth >= 0 ? '#52c41a' : '#ff4d4f' }}>{stats.patientGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(stats.patientGrowth)}%</Text>} /></Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card><Statistic title="Total Doctors" value={doctors.length} prefix={<MedicineBoxOutlined />} valueStyle={{ color: '#722ed1' }} /></Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card><Statistic title="Total Appointments" value={appointments.length} prefix={<CalendarOutlined />} valueStyle={{ color: '#13c2c2' }} suffix={<Text style={{ fontSize: 14, color: stats.apptGrowth >= 0 ? '#52c41a' : '#ff4d4f' }}>{stats.apptGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(stats.apptGrowth)}%</Text>} /></Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card><Statistic title="Completion Rate" value={appointments.length ? Math.round(stats.completed / appointments.length * 100) : 0} suffix="%" prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} lg={6}>
          <Card size="small"><Statistic title="Scheduled" value={stats.scheduled} prefix={<ScheduleOutlined />} valueStyle={{ color: '#faad14', fontSize: 20 }} /></Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card size="small"><Statistic title="Completed" value={stats.completed} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a', fontSize: 20 }} /></Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card size="small"><Statistic title="Cancelled" value={stats.cancelled} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#ff4d4f', fontSize: 20 }} /></Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card size="small"><Statistic title="No Show" value={stats.noShow} prefix={<MinusCircleOutlined />} valueStyle={{ color: '#722ed1', fontSize: 20 }} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Appointments by Status">
            {statusData.length === 0 ? <Empty description="No appointment data" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Doctors by Specialization">
            {doctorBySpecialization.length === 0 ? <Empty description="No doctor data" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={doctorBySpecialization}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1677ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Appointments Over Time">
            {appointmentTrend.length === 0 ? <Empty description="No appointment data" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={appointmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="appointments" stroke="#1677ff" strokeWidth={2} dot={{ fill: '#1677ff' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Patient Registrations Over Time">
            {patientRegistrations.length === 0 ? <Empty description="No patient data" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={patientRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="patients" stroke="#52c41a" strokeWidth={2} dot={{ fill: '#52c41a' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      <Card title={<><CalendarOutlined /> Recent Appointments</>}>
        {recentAppointments.length === 0 ? <Empty description="No appointments" /> : (
          <Table
            dataSource={recentAppointments}
            rowKey="id"
            pagination={false}
            size="small"
            columns={[
              { title: 'Date', dataIndex: 'appointmentDateTime', key: 'date', render: (v: string) => new Date(v).toLocaleDateString() },
              { title: 'Patient ID', dataIndex: 'patientId', key: 'patientId', render: (v: string) => v.slice(0, 8) },
              { title: 'Doctor ID', dataIndex: 'doctorId', key: 'doctorId', render: (v: string) => v.slice(0, 8) },
              { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => <span style={{ color: STATUS_COLORS[v], fontWeight: 600 }}>{v}</span> },
              { title: 'Reason', dataIndex: 'reason', key: 'reason', ellipsis: true },
            ]}
          />
        )}
      </Card>
    </div>
  )
}
