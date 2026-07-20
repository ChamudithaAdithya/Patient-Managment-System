import api from '../lib/axios'
import type { LoginRequest, LoginResponse, RegisterRequest } from '../types/auth'

const GATEWAY = import.meta.env.VITE_API_GATEWAY || (import.meta.env.DEV ? 'http://127.0.0.1:8083' : '')
const BASE = `${GATEWAY}/api/auth`

export const login = (data: LoginRequest) =>
  api.post<LoginResponse>(`${BASE}/login`, data).then((r) => r.data)

export const register = (data: RegisterRequest) =>
  api.post<LoginResponse>(`${BASE}/register`, data).then((r) => r.data)

export const getUsers = () =>
  api.get(`${BASE}/admin/users`).then((r) => r.data)

export const createAdmin = (data: { name: string; email: string; password: string }) =>
  api.post(`${BASE}/admin/create`, data).then((r) => r.data)

export const deleteAdmin = (id: string) =>
  api.delete(`${BASE}/admin/${id}`)

export const getStaff = () =>
  api.get(`${BASE}/admin/staff`).then((r) => r.data)

export const createStaff = (data: { name: string; email: string; password: string }) =>
  api.post(`${BASE}/admin/staff`, data).then((r) => r.data)

export const deleteStaff = (id: string) =>
  api.delete(`${BASE}/admin/staff/${id}`)
