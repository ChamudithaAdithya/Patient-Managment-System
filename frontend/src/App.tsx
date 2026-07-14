import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { ToastContainer } from './components/ui/Toast'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PatientList from './pages/patients/PatientList'
import PatientForm from './pages/patients/PatientForm'
import PatientDetail from './pages/patients/PatientDetail'
import AppointmentList from './pages/appointments/AppointmentList'
import AppointmentForm from './pages/appointments/AppointmentForm'
import AppointmentDetail from './pages/appointments/AppointmentDetail'
import DoctorSchedule from './pages/doctors/DoctorSchedule'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer />
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
              <Route path="/doctors" element={<DoctorSchedule />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
