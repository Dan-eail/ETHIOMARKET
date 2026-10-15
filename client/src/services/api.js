const API_BASE = '/api/v1'

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('ethiomarket_token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const config = {
    ...options,
    headers,
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMsg = data.error || (data.details ? data.details[0]?.message : 'Request failed')
    const error = new Error(errorMsg)
    error.status = response.status
    error.details = data.details
    throw error
  }

  return data
}

export const api = {
  // Auth
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  demoLogin: (role) => apiRequest('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
  getMe: () => apiRequest('/auth/me'),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams()