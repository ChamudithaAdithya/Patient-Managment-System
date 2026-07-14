import axios from 'axios'
import type { LoginRequest, LoginResponse, RegisterRequest } from '../types/auth'

const BASE = 'http://localhost:4005'

export const login = (data: LoginRequest) =>
  axios.post<LoginResponse>(`${BASE}/login`, data).then((r) => r.data)

export const register = (data: RegisterRequest) =>
  axios.post<LoginResponse>(`${BASE}/register`, data).then((r) => r.data)

export const getUsers = () =>
  axios.get(`${BASE}/admin/users`).then((r) => r.data)

export const createAdmin = (data: { name: string; email: string; password: string }) =>
  axios.post(`${BASE}/admin/create`, data).then((r) => r.data)

export const deleteAdmin = (id: string) =>
  axios.delete(`${BASE}/admin/${id}`)

export const getStaff = () =>
  axios.get(`${BASE}/admin/staff`).then((r) => r.data)

export const createStaff = (data: { name: string; email: string; password: string }) =>
  axios.post(`${BASE}/admin/staff`, data).then((r) => r.data)

export const deleteStaff = (id: string) =>
  axios.delete(`${BASE}/admin/staff/${id}`)
