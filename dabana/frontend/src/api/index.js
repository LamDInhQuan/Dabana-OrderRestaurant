import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 10000 })

// Request interceptor: tự động đính kèm JWT vào header
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('dabana_auth')
  if (stored) {
    const { accessToken } = JSON.parse(stored)
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Response interceptor: tự động refresh token nếu 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const stored = localStorage.getItem('dabana_auth')
        if (!stored) return Promise.reject(error)

        const { refreshToken } = JSON.parse(stored)
        const { data } = await axios.post('/api/auth/refresh', { refreshToken })
        const updated = { ...JSON.parse(stored), accessToken: data.accessToken }
        localStorage.setItem('dabana_auth', JSON.stringify(updated))
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        localStorage.removeItem('dabana_auth')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ===== Auth API =====
export const authApi = {
   register:  (data) => api.post('/auth/register/customer', data),
  login:     (data) => api.post('/auth/login', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  refresh:   (data) => api.post('/auth/refresh', data),
}

// ===== Branch/Restaurant API =====
export const branchApi = {
  getAll: () => api.get('/branchs/all'),
  search: (params) => api.get('/branchs', { params }),
  getById: (id) => api.get(`/branchs/${id}`),
  getMyList: () => api.get('/branchs/me'),
  create: (data) => api.post('/branchs/me', data),
  update: (id, d) => api.put(`/branchs/me/${id}`, d),
}

// ===== Table Layout API (B07/B08) =====
export const zoneApi = {
  getByBranch: (branchId) => api.get(`/zones/branch/${branchId}`),
  create: (data) => api.post('/zones', data),
}

export const tableApi = {
  getByZone: (zoneId) => api.get(`/tables/zone/${zoneId}`),
  getByBranch: (bid) => api.get(`/tables/branch/${bid}`),
  create: (data) => api.post('/tables/manage', data),
  updateStatus: (id, s) => api.patch(`/tables/${id}/status`, { status: s }),
  updateLayout: (id, pos) => api.patch(`/tables/manage/${id}/layout`, pos),
}

// ===== Booking API (B01) =====
export const bookingApi = {
  createHold: (data) => api.post('/bookings/hold', data),
  updateContactInfo: (id, d) => api.patch(`/bookings/${id}/contact-info`, d),
  addPreOrder: (id, d) => api.post(`/bookings/${id}/pre-order`, d),
  confirmWithoutDeposit: (id) => api.post(`/bookings/${id}/confirm-without-deposit`),
  myBookings: () => api.get('/customers/me/bookings'),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id, d) => api.post(`/bookings/${id}/cancel`, d),
  checkIn: (id) => api.post(`/bookings/${id}/check-in`),
  checkOut: (id) => api.post(`/bookings/${id}/check-out`),
}

// ===== Menu API (B06) =====
export const menuApi = {
  getByBranch: (bid) => api.get(`/menu-items/branch/${bid}`),
  create: (data) => api.post('/menu-items/manage', data),
  update: (id, d) => api.put(`/menu-items/manage/${id}`, d),
  updateStatus: (id, s) => api.patch(`/menu-items/manage/${id}/status`, { status: s }),
}

// ===== Waitlist API (B10) =====
export const waitlistApi = {
  join: (data) => api.post('/waitlists/join', data),
  acceptInvite: (id) => api.post(`/waitlists/${id}/accept`),
  cancel: (id) => api.delete(`/waitlists/${id}`),
}

// ===== Review API (B13) =====
export const reviewApi = {
  create: (data) => api.post('/reviews', data),
  getByBranch: (bid, p) => api.get(`/reviews/branch/${bid}`, { params: p }),
}

// ===== Notification API (B09) =====
export const notificationApi = {
  getUnread: () => api.get('/notifications/unread'),
}

// ===== Admin API =====
export const adminApi = {
  // F43/B02-B04: phê duyệt
  pendingUsers:       ()        => api.get('/admin/users/pending'),
  approveUser:        (id, d)   => api.post(`/admin/users/${id}/approve`, d),
  pendingRestaurants: ()        => api.get('/admin/restaurants/pending'),
  approveRestaurant:  (id, d)   => api.post(`/admin/restaurants/${id}/approve`, d),
  pendingBranches:    ()        => api.get('/admin/branches/pending'),
  approveBranch:      (id, d)   => api.post(`/admin/branches/${id}/approve`, d),

  // F44: quản lý tài khoản người dùng toàn hệ thống
  searchUsers:        (params)  => api.get('/admin/users', { params }),
  getUserDetail:      (id)      => api.get(`/admin/users/${id}`),
  lockUser:           (id, d)   => api.post(`/admin/users/${id}/lock`, d),

  // F43 mở rộng: xem toàn bộ nhà hàng / chi nhánh
  searchRestaurants:  (params)  => api.get('/admin/restaurants', { params }),
  searchBranches:     (params)  => api.get('/admin/branches', { params }),

  // F41: kiểm duyệt đánh giá
  listReviews:        (params)  => api.get('/admin/reviews', { params }),
  hideReview:         (id, d)   => api.post(`/admin/reviews/${id}/hide`, d),
  unhideReview:       (id)      => api.post(`/admin/reviews/${id}/unhide`),
  deleteReview:       (id)      => api.delete(`/admin/reviews/${id}`),

  // F45: danh mục hệ thống
  listCategories:     (type)    => api.get('/admin/categories', { params: { type } }),
  createCategory:     (d)       => api.post('/admin/categories', d),
  updateCategory:     (id, d)   => api.put(`/admin/categories/${id}`, d),
  deleteCategory:     (id)      => api.delete(`/admin/categories/${id}`),

  // F46: giám sát hoạt động
  recentActivity:     (limit)   => api.get('/admin/activity/recent', { params: { limit } }),

  // F47-F49: thống kê & báo cáo
  platformSummary:    ()        => api.get('/admin/statistics/platform/summary'),
  revenueByRestaurant:()        => api.get('/admin/statistics/revenue-by-restaurant'),
  bookingsDaily:      (days)    => api.get('/admin/statistics/bookings-daily', { params: { days } }),

  // F50: xuất báo cáo
  exportReportUrl:    (type)    => `/api/admin/reports/export?type=${type}`,
}

export default api
