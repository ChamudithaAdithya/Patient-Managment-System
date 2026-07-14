export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN'
}

export interface LoginResponse {
  token: string
}
