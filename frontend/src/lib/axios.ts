import axios from 'axios'

const GATEWAY = import.meta.env.VITE_API_GATEWAY || (import.meta.env.DEV ? 'http://127.0.0.1:8083' : '')

const api = axios.create({
  baseURL: `${GATEWAY}/api`,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
