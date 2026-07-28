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

// Response interceptor: tự động refresh token nếu 401.
// refreshPromise: nhieu request 401 cung luc (vd bulk-add mon, Promise.all
// tai dashboard) phai DUNG CHUNG 1 lan goi /auth/refresh duy nhat, khong de
// moi request tu goi refresh rieng - vi refreshToken thuong chi dung duoc
// 1 lan (rotation): goi song song se khien chi request "thang" thanh cong,
// cac request con lai dung refreshToken da bi vo hieu hoa -> that bai het.
let refreshPromise = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const stored = localStorage.getItem('dabana_auth')
        if (!stored) return Promise.reject(error)

        if (!refreshPromise) {
          const { refreshToken } = JSON.parse(stored)
          refreshPromise = axios.post('/api/auth/refresh', { refreshToken })
            .finally(() => { refreshPromise = null })
        }

        // Gọi API refresh token (dung chung ket qua neu da co request khac kich hoat truoc)
        const res = await refreshPromise

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
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  sendOtp: (data) => api.post('/auth/send-otp', data),
  changePassword: (data) => api.post('/auth/change-password', data),
}

// ===== Branch/Restaurant API =====
export const branchApi = {
  getAll: () => api.get('/branchs/all'),
  search: (params) => api.get('/branchs', { params }),
  getById: (id) => api.get(`/branchs/${id}`),
  getMyList: () => api.get('/branchs/me'),
  create: (data) => api.post('/branchs', data),
  update: (id, d) => api.put(`/branchs/me/${id}`, d),
  getByRestaurant: (restaurantId) => api.get(`/branchs/by-restaurant/${restaurantId}`)
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
  getByBranchAndZone: (bid, zoneId) => api.get('/dining-tables', { params: { branchId: bid, zoneId } }),
  create: (data) => api.post('/dining-tables/create', data),
  update: (id, data) => api.put(`/dining-tables/update/${id}`, data),
  updateLayout: (payload) => api.put('/dining-tables/positions', payload),
  // Doi trang thai ban THU CONG (chi EMPTY=1 / CLEANING=4 / MAINTENANCE=5) - dung
  // o Tab Goi Mon, khong duoc dung de set RESERVED/OCCUPIED (BE se tu choi).
  updateStatus: (id, status) => api.patch(`/dining-tables/${id}/status`, { status }),
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
  myBookings: () => api.get('/bookings/my-bookings'),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id, d) => api.post(`/bookings/${id}/cancel`, d),
  checkIn: (id) => api.post(`/bookings/${id}/check-in`),
  checkOut: (id) => api.post(`/bookings/${id}/check-out`),
  createWalkIn: (payload) => api.post('/bookings/walk-in', payload),
  guestLookup: (data) => api.post('/bookings/guest-lookup', data),
}

// ===== Menu API (B06) =====
// Returns categories with items nested: [{ id, categoryName, items:[{ id, itemName, price, imageUrl, status }] }]
export const menuApi = {
  // --- Chi nhanh / danh muc ---
  getByBranch: (bid) => api.get(`/menu/branches/${bid}`),
  getCategories: (bid) => api.get(`/menu/branches/${bid}/categories`),
  createCategory: (data) => api.post('/menu/categories', data),
  updateCategory: (categoryId, data) => api.put(`/menu/categories/${categoryId}`, data),
  deleteCategory: (categoryId) => api.delete(`/menu/categories/${categoryId}`),

  // --- Mon an ---
  getItemsByCategory: (categoryId) => api.get(`/menu/categories/${categoryId}/items`),
  // params: { branchId, categoryId, status, keyword, page, size } - tat ca deu optional
  searchItems: (params) => api.get('/menu/items/search', { params }),
  createItem: (data) => api.post('/menu/items', data),
  updateItem: (id, d) => api.put(`/menu/items/${id}`, d),
  deleteItem: (id) => api.delete(`/menu/items/${id}`),
  updateItemStatus: (id, status) => api.patch(`/menu/items/${id}/status`, { status }),
  bulkUpdateItemStatus: (itemIds, status) => api.patch('/menu/items/bulk-status', { itemIds, status }),

  // --- Thong ke (4 the: tong so, dang ban, tam an, danh muc) ---
  // 1 endpoint gop, BE tra ve bang 1 query GROUP BY duy nhat,
  // thay the cho viec goi searchItems 3 lan (size=1) nhu truoc.
  getItemStats: (bid) => api.get(`/menu/branches/${bid}/items/stats`),

  // --- Anh phu cua mon (ngoai imageUrl chinh tren item) ---
  getImagesByItem: (itemId) => api.get(`/menu/items/${itemId}/images`),
  addImage: (data) => api.post('/menu/images', data),
  updateImage: (imageId, data) => api.put(`/menu/images/${imageId}`, data),
  deleteImage: (imageId) => api.delete(`/menu/images/${imageId}`),
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

// ===== Subscription API (thu phí nền tảng theo gói) =====
// restaurantId của các endpoint /me/** LUÔN suy ra từ JWT ở backend, không cần
// truyền lên - khớp đúng convention /me sẵn có (giống restaurantApi.getMine()).
export const subscriptionApi = {
  // Công khai - trang "Bảng giá"
  listPlans: () => api.get('/subscription-plans'),

  // Tự quản lý gói của nhà hàng đang đăng nhập
  getCurrent: () => api.get('/subscriptions/me/current'),
  subscribeInitial: (planId) => api.post('/subscriptions/me', { planId }),
  upgrade: (newPlanId) => api.post('/subscriptions/me/upgrade', { newPlanId }),
  scheduleDowngrade: (newPlanId) => api.post('/subscriptions/me/schedule-downgrade', { newPlanId }),
  cancelScheduledDowngrade: () => api.delete('/subscriptions/me/schedule-downgrade'),
  checkBranchLimit: () => api.get('/subscriptions/me/branch-limit-check'),
  listInvoices: () => api.get('/subscriptions/me/invoices'),
  createInvoicePaymentLink: (invoiceId) => api.post(`/subscriptions/me/invoices/${invoiceId}/payment-link`),
  getInvoicePaymentInfo: (invoiceId) => api.get(`/subscriptions/me/invoices/${invoiceId}/payment`),

  // Admin - CRUD gói
  adminListAllPlans: () => api.get('/admin/subscription-plans'),
  adminCreatePlan: (data) => api.post('/admin/subscription-plans', data),
  adminUpdatePlan: (id, data) => api.put(`/admin/subscription-plans/${id}`, data),

  // Admin - xác nhận thanh toán thủ công (TẠM THỜI, chưa tích hợp payOS)
  adminListInvoices: (statuses) => api.get('/admin/subscriptions/invoices', {
    params: statuses?.length ? { status: statuses.join(',') } : undefined
  }),
  adminMarkInvoicePaid: (invoiceId) => api.post(`/admin/subscriptions/invoices/${invoiceId}/mark-paid`),

  // Admin - cấu hình payOS cấp nền tảng cho thu phí subscription
  adminGetPayosConfig: () => api.get('/admin/subscriptions/payos-config'),
  adminSavePayosConfig: (data) => api.put('/admin/subscriptions/payos-config', data),
}

// ===== Restaurant brand API (B03) =====
export const restaurantApi = {
  getMine: () => api.get('/restaurants/me'),
  register: (data) => api.post('/restaurants/me', data),
  update: (data) => api.put('/restaurants/me', data),
  // cancelPendingUpdate: () => api.post('/restaurants/cancel-pending-update'),
  PerDayReports: (branchId) => api.get(`/restaurants/me/perDayReportForBranch/${branchId}`),
  Dashboard: () => api.get('/restaurants/me/dashboard'),
  GetTablesByBranch: (branchid) => api.get(`/restaurants/me/tables/${branchid}`),
  UpcomingBooking: (branchid) => api.get(`/restaurants/me/bookings/${branchid}`),
  getAll: () => api.get('/restaurants/all')
}

// ===== BỔ SUNG: Operating Hour API =====
// ===== Operating hours API (B04) =====
// NOTE: backend (OperatingHourController) hiện chỉ có POST .../save, chưa có GET.
// Cần bổ sung 1 endpoint GET /api/branchs/operating-hours/branch/{branchId} ở BE
// để khung giờ đặt bàn lấy đúng giờ mở/đóng cửa thật; UI đã có fallback an toàn
// nếu call này 404/lỗi (xem BookingFlow.jsx).
export const operatingHourApi = {
  getByBranch: (branchId) => api.get(`/branchs/operating-hours/${branchId}`),
  save: (branchId, arr) => api.post(`/branchs/operating-hours/branch/${branchId}/save`, arr),
}

export const branchScheduleExceptionApi = {
  getByBranch: (branchId) => api.get(`/branchs/${branchId}/schedule-exceptions`),
  getById: (branchId, id) => api.get(`/branchs/${branchId}/schedule-exceptions/${id}`),
  create: (branchId, data) => api.post(`/branchs/${branchId}/schedule-exceptions`, data),
  update: (branchId, id, data) => api.put(`/branchs/${branchId}/schedule-exceptions/${id}`, data),
  delete: (branchId, id) => api.delete(`/branchs/${branchId}/schedule-exceptions/${id}`),
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

// ===== Preorder Item API (Tab Gọi Món - món đặt trước, rs_preorder_items) =====
// Khop dung backend PreorderItemController (/api/preorder-items).
export const preorderItemApi = {
  getByBooking: (bookingId) => api.get(`/preorder-items/booking/${bookingId}`),
  updateQuantity: (id, quantity) => api.patch(`/preorder-items/${id}/quantity`, { quantity }),
  deleteItem: (id) => api.delete(`/preorder-items/${id}`),
}

// ===== Extra Order API (Tab Gọi Món - món gọi thêm, rs_extra_orders) =====
// Khop dung backend ExtraOrderController (/api/extra-orders).
export const extraOrderApi = {
  getByBooking: (bookingId) => api.get(`/extra-orders/booking/${bookingId}`),
  addItem: (data) => api.post('/extra-orders', data), // { bookingId, menuItemId, quantity }
  updateQuantity: (id, quantity) => api.patch(`/extra-orders/${id}/quantity`, { quantity }),
  deleteItem: (id) => api.delete(`/extra-orders/${id}`),
}

// ===== Order Board API (Tab Gọi Món - realtime bàn/đơn hàng) =====
// Khop dung backend: GET /api/order-board/branch/{branchId}?zoneId=
// tra ve { branchId, zones: [{ zoneId, zoneName, description, tables: [...] }] }
export const orderBoardApi = {
  getBoard: (branchId, zoneId) =>
    api.get(`/order-board/branch/${branchId}`, zoneId ? { params: { zoneId } } : undefined),
}

export const paymentApi = {
  createPaymentLink: (bookingId) => api.post('/payment/create-link', {
    bookingId: Number(bookingId)
  }),
  // API lấy thông tin thanh toán chi tiết (QR, ngân hàng, số tiền)
  getDetail: (bookingId) => api.get(`/payment/info/${bookingId}`),

  // API Polling kiểm tra trạng thái thanh toán hiện tại
  getStatus: (bookingId) => api.get(`/api/v1/payment/${bookingId}/status`),

  // 🌟 ĐƯỜNG TRUYỀN GIẢ LẬP ĐỂ TEST
  mockSuccess: (bookingId) => api.post(`/payment/${bookingId}/mock-success`)
};

export default api