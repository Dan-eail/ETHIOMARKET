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
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, val)
    })
    return apiRequest(`/products?${query.toString()}`)
  },
  getProductById: (id) => apiRequest(`/products/${id}`),
  createProduct: (payload) => apiRequest('/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id, payload) => apiRequest(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  updateStock: (id, payload) => apiRequest(`/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify(payload) }),
  matchSuppliers: (payload) => apiRequest('/products/match-suppliers', { method: 'POST', body: JSON.stringify(payload) }),
  getFarmerListings: () => apiRequest('/products/farmer/my-listings'),

  // Categories
  getCategories: () => apiRequest('/categories'),

  // Market Prices Intelligence
  getMarketPrices: (params = {}) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, val)