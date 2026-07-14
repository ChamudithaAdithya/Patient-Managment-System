export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: 'PATIENT' | 'DOCTOR'
}

export interface LoginResponse {
  token: string
}

export interface JwtPayload {
  sub: string
  role: string
  iat: number
  exp: number
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}
