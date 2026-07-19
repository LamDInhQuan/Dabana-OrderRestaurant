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

        // Gọi API refresh token
        const res = await axios.post('/api/auth/refresh', { refreshToken })

        if (res.data && res.data.code === 'SUCCESS') {
          const backendData = res.data.data;
          const newAccessToken = backendData.accessToken;

          const updated = { ...JSON.parse(stored), accessToken: newAccessToken }
          localStorage.setItem('dabana_auth', JSON.stringify(updated))

          original.headers.Authorization = `Bearer ${newAccessToken}`
          return api(original)
        }

      } catch (refreshError) {
        localStorage.removeItem('dabana_auth')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

// ===== Auth API =====
export const authApi = {
  register: (data) => api.post('/auth/register/customer', data),
  login: (data) => api.post('/auth/login', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  refresh: (data) => api.post('/auth/refresh', data),
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
// Zones already come back with their `tables` nested (ZoneResponse.tables),
// so a single call is enough to render the floor plan for booking.
export const zoneApi = {
  getByBranch: (branchId) => api.get(`/zones/branches/${branchId}`),
  create: (data) => api.post('/zones/create', data),
  update: (zoneId, data) => api.put(`/zones/update/${zoneId}`, data),
  delete: (zoneId) => api.delete(`/zones/delete/${zoneId}`),
  getFloorPlan: (zoneId) => api.get(`/zones/${zoneId}/floor-plan`),
  saveFloorPlan: (data) => api.post('/zones/floor-plan', data),
}

export const tableApi = {
  getByBranch: (bid, zoneId) => api.get('/dining-tables', { params: { branchId: bid, zoneId } }),
  create: (data) => api.post('/dining-tables/create', data),
  update: (id, data) => api.put(`/dining-tables/update/${id}`, data),
  updateLayout: (payload) => api.put('/dining-tables/positions', payload),
  delete: (id) => api.delete(`/dining-tables/delete/${id}`),
  getAvailable: (branchId, reservationTime, zoneId) =>
    api.get('/dining-tables/available-tables', {
      params: {
        branchId: branchId,
        reservationTime: reservationTime, // Axios sẽ tự động mã hóa khoảng trắng thành %20 cho bạn
        zoneId: zoneId
      }
    })
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
// Returns categories with items nested: [{ id, categoryName, items:[{ id, itemName, price, imageUrl, status }] }]
export const menuApi = {
  getByBranch: (bid) => api.get(`/menu/branches/${bid}`),
  getCategories: (bid) => api.get(`/menu/branches/${bid}/categories`),
  createItem: (data) => api.post('/menu/items', data),
  updateItem: (id, d) => api.put(`/menu/items/${id}`, d),
  updateItemStatus: (id, s) => api.patch(`/menu/items/${id}/status`, { status: s }),
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

// ===== Restaurant brand API (B03) =====
export const restaurantApi = {
  getMine: () => api.get('/restaurants'),
  register: (data) => api.post('/restaurants', data),
  update: (data) => api.put('/restaurants', data),
  cancelPendingUpdate: () => api.post('/restaurants/cancel-pending-update'),
}

// ===== BỔ SUNG: Operating Hour API =====
// ===== Operating hours API (B04) =====
// NOTE: backend (OperatingHourController) hiện chỉ có POST .../save, chưa có GET.
// Cần bổ sung 1 endpoint GET /api/branchs/operating-hours/branch/{branchId} ở BE
// để khung giờ đặt bàn lấy đúng giờ mở/đóng cửa thật; UI đã có fallback an toàn
// nếu call này 404/lỗi (xem BookingFlow.jsx).
export const operatingHourApi = {
  getByBranch: (branchId) => api.get(`/branchs/operating-hours/branch/${branchId}`),
  save: (branchId, arr) => api.post(`/branchs/operating-hours/branch/${branchId}/save`, arr),
}

// ===== Available slot API (B01) =====
// Trả về danh sách khung giờ 60' đã tính sẵn cho 1 ngày cụ thể của 1 chi nhánh,
// đã áp dụng exception (đóng cửa/thêm ca theo ngày do nhà hàng cấu hình).
// date phải theo định dạng dd-MM-yyyy (khớp @DateTimeFormat ở BE).
export const availableSlotApi = {
  getShifts: (branchId, date) =>
    api.get('/branches/available-slot/get-shifts', { params: { branchId, date } }),
}
// ===== BỔ SUNG: Deposit Policy API (Chính sách đặt cọc) =====
// ===== Deposit/cancellation policy API (B05) =====
export const branchPolicyApi = {
  // --- CORE POLICIES ---
  getAll: (branchId) =>
    api.get(`/branches/${branchId}/policies`),

  getDetail: (branchId, policyId) =>
    api.get(`/branches/${branchId}/policies/${policyId}`),

  create: (branchId, data) =>
    api.post(`/branches/${branchId}/policies`, data),

  update: (branchId, policyId, data) =>
    api.put(`/branches/${branchId}/policies/${policyId}`, data),

  delete: (branchId, policyId) =>
    api.delete(`/branches/${branchId}/policies/${policyId}`),

  // --- DEPOSIT RULES (Quy tắc cọc) ---
  createDepositRule: (branchId, policyId, data) =>
    api.post(`/branches/${branchId}/policies/${policyId}/deposit-rules`, data),

  updateDepositRule: (branchId, policyId, ruleId, data) =>
    api.put(`/branches/${branchId}/policies/${policyId}/deposit-rules/${ruleId}`, data),

  deleteDepositRule: (branchId, policyId, ruleId) =>
    api.delete(`/branches/${branchId}/policies/${policyId}/deposit-rules/${ruleId}`),

  // --- SCHEDULES (Lịch trình áp dụng) ---
  createSchedule: (branchId, policyId, data) =>
    api.post(`/branches/${branchId}/policies/${policyId}/schedules`, data),

  updateSchedule: (branchId, policyId, scheduleId, data) =>
    api.put(`/branches/${branchId}/policies/${policyId}/schedules/${scheduleId}`, data),

  deleteSchedule: (branchId, policyId, scheduleId) =>
    api.delete(`/branches/${branchId}/policies/${policyId}/schedules/${scheduleId}`),

  getActivePolicy: (branchId, reservationTime) =>
    api.get(`/branches/${branchId}/policies/active-policy`, {
      params: {
        reservationTime: reservationTime
      }
    })
};

export const reservationPolicyApi = {
  // --- CORE POLICIES ---
  getAll: (restaurantId) =>
    api.get(`/restaurants/${restaurantId}/reservation-policies`),

  getDetail: (restaurantId, policyId) =>
    api.get(`/restaurants/${restaurantId}/reservation-policies/${policyId}`),

  create: (restaurantId, data) =>
    api.post(`/restaurants/${restaurantId}/reservation-policies`, data),

  update: (restaurantId, policyId, data) =>
    api.put(`/restaurants/${restaurantId}/reservation-policies/${policyId}`, data),

  delete: (restaurantId, policyId) =>
    api.delete(`/restaurants/${restaurantId}/reservation-policies/${policyId}`),

  // --- DEPOSIT RULES (Quy tắc cọc) ---
  getAllDepositRules: (restaurantId, policyId) =>
    api.get(`/restaurants/${restaurantId}/reservation-policies/${policyId}/deposit-rules`),

  createDepositRule: (restaurantId, policyId, data) =>
    api.post(`/restaurants/${restaurantId}/reservation-policies/${policyId}/deposit-rules`, data),

  updateDepositRule: (restaurantId, policyId, ruleId, data) =>
    api.put(`/restaurants/${restaurantId}/reservation-policies/${policyId}/deposit-rules/${ruleId}`, data),

  deleteDepositRule: (restaurantId, policyId, ruleId) =>
    api.delete(`/restaurants/${restaurantId}/reservation-policies/${policyId}/deposit-rules/${ruleId}`),

  // --- SCHEDULES (Lịch trình áp dụng) ---
  getAllSchedules: (restaurantId, policyId) =>
    api.get(`/restaurants/${restaurantId}/reservation-policies/${policyId}/schedules`),

  createSchedule: (restaurantId, policyId, data) =>
    api.post(`/restaurants/${restaurantId}/reservation-policies/${policyId}/schedules`, data),

  updateSchedule: (restaurantId, policyId, scheduleId, data) =>
    api.put(`/restaurants/${restaurantId}/reservation-policies/${policyId}/schedules/${scheduleId}`, data),

  deleteSchedule: (restaurantId, policyId, scheduleId) =>
    api.delete(`/restaurants/${restaurantId}/reservation-policies/${policyId}/schedules/${scheduleId}`),
};
// ===== Admin API =====
export const adminApi = {
  // F43/B02-B04: phê duyệt
  pendingUsers: () => api.get('/admin/users/pending'),
  approveUser: (id, d) => api.post(`/admin/users/${id}/approve`, d),
  pendingRestaurants: () => api.get('/admin/restaurants/pending'),
  approveRestaurant: (id, d) => api.post(`/admin/restaurants/${id}/approve`, d),
  pendingBranches: () => api.get('/admin/branches/pending'),
  approveBranch: (id, d) => api.post(`/admin/branches/${id}/approve`, d),

  // F44: quản lý tài khoản người dùng toàn hệ thống
  searchUsers: (params) => api.get('/admin/users', { params }),
  getUserDetail: (id) => api.get(`/admin/users/${id}`),
  lockUser: (id, d) => api.post(`/admin/users/${id}/lock`, d),

  // F43 mở rộng: xem toàn bộ nhà hàng / chi nhánh
  searchRestaurants: (params) => api.get('/admin/restaurants', { params }),
  searchBranches: (params) => api.get('/admin/branches', { params }),

  // F41: kiểm duyệt đánh giá
  listReviews: (params) => api.get('/admin/reviews', { params }),
  hideReview: (id, d) => api.post(`/admin/reviews/${id}/hide`, d),
  unhideReview: (id) => api.post(`/admin/reviews/${id}/unhide`),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),

  // F45: danh mục hệ thống
  listCategories: (type) => api.get('/admin/categories', { params: { type } }),
  createCategory: (d) => api.post('/admin/categories', d),
  updateCategory: (id, d) => api.put(`/admin/categories/${id}`, d),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  // F46: giám sát hoạt động
  recentActivity: (limit) => api.get('/admin/activity/recent', { params: { limit } }),

  // F47-F49: thống kê & báo cáo
  platformSummary: () => api.get('/admin/statistics/platform/summary'),
  revenueByRestaurant: () => api.get('/admin/statistics/revenue-by-restaurant'),
  bookingsDaily: (days) => api.get('/admin/statistics/bookings-daily', { params: { days } }),

  // F50: xuất báo cáo
  exportReportUrl: (type) => `/api/admin/reports/export?type=${type}`,
}

export default api
