import api from '../lib/axios'
import type { Appointment, AppointmentRequest } from '../types/appointment'

export const getAll = () => api.get<Appointment[]>('/appointments').then((r) => r.data)
export const getById = (id: string) => api.get<Appointment>(`/appointments/${id}`).then((r) => r.data)
export const getByPatient = (patientId: string) => api.get<Appointment[]>(`/appointments/patient/${patientId}`).then((r) => r.data)
export const getByDoctor = (doctorId: string) => api.get<Appointment[]>(`/appointments/doctor/${doctorId}`).then((r) => r.data)
export const create = (data: AppointmentRequest) => api.post<Appointment>('/appointments', data).then((r) => r.data)
export const cancel = (id: string) => api.put<Appointment>(`/appointments/${id}/cancel`).then((r) => r.data)
export const complete = (id: string) => api.put<Appointment>(`/appointments/${id}/complete`).then((r) => r.data)
export const getAvailableSlots = (doctorId: string, date: string) =>
  api.get<string[]>(`/appointments/doctor/${doctorId}/available`, { params: { date } }).then((r) => r.data)
