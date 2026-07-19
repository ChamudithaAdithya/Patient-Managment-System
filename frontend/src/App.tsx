import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PatientList from './pages/patients/PatientList'
import PatientForm from './pages/patients/PatientForm'
import PatientDetail from './pages/patients/PatientDetail'
import AppointmentList from './pages/appointments/AppointmentList'
import AppointmentForm from './pages/appointments/AppointmentForm'
import AppointmentDetail from './pages/appointments/AppointmentDetail'
import DoctorList from './pages/doctors/DoctorList'
import DoctorForm from './pages/doctors/DoctorForm'
import DoctorDetail from './pages/doctors/DoctorDetail'
import DoctorSchedule from './pages/doctors/DoctorSchedule'
import AdminUsers from './pages/admin/AdminUsers'
import StaffList from './pages/admin/StaffList'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/patients" element={<PatientList />} />
              <Route path="/patients/new" element={<PatientForm />} />
              <Route path="/patients/:id" element={<PatientDetail />} />
              <Route path="/patients/:id/edit" element={<PatientForm />} />
              <Route path="/appointments" element={<AppointmentList />} />
              <Route path="/appointments/new" element={<AppointmentForm />} />
              <Route path="/appointments/:id" element={<AppointmentDetail />} />
              <Route path="/doctors" element={<DoctorList />} />
              <Route path="/doctors/new" element={<ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']} />}>
                  <Route index element={<DoctorForm />} />
              </Route>
              <Route path="/doctors/:id" element={<DoctorDetail />} />
              <Route path="/doctors/:id/edit" element={<ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']} />}>
                  <Route index element={<DoctorForm />} />
              </Route>
              <Route path="/doctors/schedule" element={<DoctorSchedule />} />
              <Route path="/admin/users" element={<ProtectedRoute roles={['SUPER_ADMIN']} />}>
                  <Route index element={<AdminUsers />} />
              </Route>
              <Route path="/admin/staff" element={<ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']} />}>
                  <Route index element={<StaffList />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
