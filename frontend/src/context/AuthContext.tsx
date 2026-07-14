import { createContext, useState, useEffect, type ReactNode } from 'react'
import { login as loginApi, register as registerApi } from '../api/auth'
import type { LoginRequest, RegisterRequest } from '../types/auth'

interface AuthContextType {
  token: string | null
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isAuthenticated: false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  const login = async (data: LoginRequest) => {
    const res = await loginApi(data)
    setToken(res.token)
  }

  const register = async (data: RegisterRequest) => {
    const res = await registerApi(data)
    setToken(res.token)
  }

  const logout = () => setToken(null)

  return (
    <AuthContext.Provider value={{ token, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}
