import { createContext, useState, useEffect, type ReactNode } from 'react'
import { login as loginApi, register as registerApi } from '../api/auth'
import { decodeJwt } from '../types/auth'
import type { LoginRequest, RegisterRequest, JwtPayload } from '../types/auth'

interface AuthContextType {
  token: string | null
  user: JwtPayload | null
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  hasRole: (...roles: string[]) => boolean
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isAuthenticated: false,
  hasRole: () => false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<JwtPayload | null>(() => token ? decodeJwt(token) : null)

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      setUser(decodeJwt(token))
    } else {
      localStorage.removeItem('token')
      setUser(null)
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

  const hasRole = (...roles: string[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, isAuthenticated: !!token, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}
