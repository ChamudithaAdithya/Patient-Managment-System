import axios from 'axios'
import type { LoginRequest, LoginResponse, RegisterRequest } from '../types/auth'

export const login = (data: LoginRequest) =>
  axios.post<LoginResponse>('http://localhost:4005/login', data).then((r) => r.data)

export const register = (data: RegisterRequest) =>
  axios.post<LoginResponse>('http://localhost:4005/register', data).then((r) => r.data)
