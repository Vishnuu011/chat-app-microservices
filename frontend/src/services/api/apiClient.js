import axios from 'axios'

const USER_BASE  = import.meta.env.VITE_USER_SERVICE_URL  || 'http://localhost:8000/api/v1'
const CHAT_BASE  = import.meta.env.VITE_CHAT_SERVICE_URL  || 'http://localhost:8002/api/v1'
const CALL_BASE  = import.meta.env.VITE_CALL_SERVICE_URL  || 'http://localhost:8003/api/v1'

function createClient(baseURL) {
  const client = axios.create({ baseURL })

  client.interceptors.request.use(cfg => {
    const token = localStorage.getItem('cc_token')
    if (token) cfg.headers.Authorization = `Bearer ${token}`
    return cfg
  })

  client.interceptors.response.use(
    r => r,
    err => {
      if (err.response?.status === 401) {
        localStorage.removeItem('cc_token')
        localStorage.removeItem('cc_user')
        window.location.href = '/login'
      }
      return Promise.reject(err)
    }
  )

  return client
}

export const userClient = createClient(USER_BASE)
export const chatClient = createClient(CHAT_BASE)
export const callClient = createClient(CALL_BASE)
