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
    })
    return apiRequest(`/market-prices?${query.toString()}`)
  },

  // Favorites
  getFavorites: () => apiRequest('/favorites'),
  toggleFavorite: (productId) => apiRequest(`/favorites/${productId}`, { method: 'POST' }),

  // Quotes
  createQuote: (payload) => apiRequest('/quotes', { method: 'POST', body: JSON.stringify(payload) }),
  getQuotes: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/quotes${query ? `?${query}` : ''}`)
  },
  getQuoteById: (id) => apiRequest(`/quotes/${id}`),
  counterQuote: (id, payload) => apiRequest(`/quotes/${id}/counter`, { method: 'POST', body: JSON.stringify(payload) }),
  acceptQuote: (id) => apiRequest(`/quotes/${id}/accept`, { method: 'POST' }),

  // Orders
  createDirectOrder: (payload) => apiRequest('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/orders${query ? `?${query}` : ''}`)
  },
  getOrderById: (id) => apiRequest(`/orders/${id}`),
  getOrderInvoice: (id) => apiRequest(`/orders/${id}/invoice`),
  repeatOrder: (id) => apiRequest(`/orders/${id}/repeat`, { method: 'POST' }),
  updateOrderStatus: (id, status) => apiRequest(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Deliveries
  getAvailableDeliveries: () => apiRequest('/deliveries/available'),
  getMyDeliveries: () => apiRequest('/deliveries/my-jobs'),
  claimDelivery: (id, payload = {}) => apiRequest(`/deliveries/${id}/claim`, { method: 'POST', body: JSON.stringify(payload) }),
  verifyPickup: (id, payload) => apiRequest(`/deliveries/${id}/verify-pickup`, { method: 'POST', body: JSON.stringify(payload) }),
  verifyDelivery: (id, payload) => apiRequest(`/deliveries/${id}/verify-delivery`, { method: 'POST', body: JSON.stringify(payload) }),
  reportDelay: (id, payload) => apiRequest(`/deliveries/${id}/report-delay`, { method: 'POST', body: JSON.stringify(payload) }),
  addDeliveryEvent: (id, payload) => apiRequest(`/deliveries/${id}/events`, { method: 'POST', body: JSON.stringify(payload) }),
  registerVehicle: (payload) => apiRequest('/deliveries/vehicles', { method: 'POST', body: JSON.stringify(payload) }),

  // Admin
  getAdminStats: () => apiRequest('/admin/stats'),
  getAllUsers: () => apiRequest('/admin/users'),
  verifyUser: (id, isVerified) => apiRequest(`/admin/users/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ isVerified }) }),
  updateUserStatus: (id, status) => apiRequest(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getAuditLogs: () => apiRequest('/admin/audit-logs'),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'POST' }),

  // Conversations
  getConversations: () => apiRequest('/conversations'),
  getMessages: (id) => apiRequest(`/conversations/${id}`),
  sendMessage: (id, text) => apiRequest(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),