import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Inject auth token
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('fg_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Handle 401
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fg_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
