import api from '../lib/axios'
import type { Doctor, DoctorRequest } from '../types/doctor'

export const getAll = () => api.get<Doctor[]>('/doctors').then((r) => r.data)
export const getById = (id: string) => api.get<Doctor>(`/doctors/${id}`).then((r) => r.data)
export const create = (data: DoctorRequest) => api.post<Doctor>('/doctors', data).then((r) => r.data)
export const update = (id: string, data: DoctorRequest) => api.put<Doctor>(`/doctors/${id}`, data).then((r) => r.data)
export const remove = (id: string) => api.delete(`/doctors/${id}`)
