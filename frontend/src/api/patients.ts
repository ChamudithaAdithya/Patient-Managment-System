import api from '../lib/axios'
import type { Patient, PatientRequest } from '../types/patient'

export const getAll = () => api.get<Patient[]>('/patients').then((r) => r.data)
export const getById = (id: string) => api.get<Patient>(`/patients/${id}`).then((r) => r.data)
export const create = (data: PatientRequest) => api.post<Patient>('/patients', data).then((r) => r.data)
export const update = (id: string, data: PatientRequest) => api.put<Patient>(`/patients/${id}`, data).then((r) => r.data)
export const remove = (id: string) => api.delete(`/patients/${id}`)
