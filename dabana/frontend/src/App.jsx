import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import HomePage from './pages/customer/HomePage'
import BranchDetail from './pages/customer/BranchDetail'
import BookingFlow from './pages/customer/BookingFlow'
import MyBookings from './pages/customer/MyBookings'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ChangePasswordPage from './pages/auth/ChangePasswordPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

import PartnerDashboard from './pages/partner/PartnerDashboard'
// import TableLayout      from './pages/partner/TableLayout'
import ManageBookings from './pages/partner/ManageBookings'
// import MenuManager      from './pages/partner/MenuManager'

import AdminDashboard from './pages/admin/AdminDashboard'
import ApprovalPanel from './pages/admin/ApprovalPanel'
import UserManagement from './pages/admin/UserManagement'
import ReviewModeration from './pages/admin/ReviewModeration'
import CategoryManagement from './pages/admin/CategoryManagement'
import SubscriptionPlanManagement from './pages/admin/SubscriptionPlanManagement'
import SubscriptionInvoiceApproval from './pages/admin/SubscriptionInvoiceApproval'
import SubscriptionPayosConfigPage from './pages/admin/SubscriptionPayosConfigPage'
import Reports from './pages/admin/Reports'
import PartnerReportsPage from './pages/partner/reports/PartnerReportsPage'
import BookingLockPage from './pages/customer/BookingLockPage'
import BookingInvoicePage from './pages/customer/BookingInvoicePage'

// Bổ sung prop allowGuest: Nếu true thì Guest chưa login vẫn vào được
function ProtectedRoute({ children, role, allowGuest = false }) {
  const { auth, isRole } = useAuth()

  // 1. Nếu cho phép Guest và chưa đăng nhập -> Cho qua luôn!
  if (allowGuest && !auth) {
    return children
  }

  // 2. Nếu không cho phép Guest mà chưa đăng nhập -> Chuyển về login
  if (!auth) return <Navigate to="/login" replace />

  // 3. Nếu đã đăng nhập nhưng không đúng role -> Chuyển về trang chủ
  if (role && !isRole(role)) return <Navigate to="/" replace />

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Routes>
          {/* ===== Public ===== */}
          <Route path="/" element={<HomePage />} />
          <Route path="/branch/:id" element={<BranchDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/change-password"
            element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

          {/* ===== Booking & Payment (Mở cho cả Guest & Logged-in Customer) ===== */}
          <Route
            path="/booking/:id"
            element={
              <ProtectedRoute role="CUSTOMER" allowGuest={true}>
                <BookingFlow />
              </ProtectedRoute>
            }
          />
          <Route path="/my-bookings/:id/invoice" element={<BookingInvoicePage />} />

          {/* ===== Personal Pages (Bắt buộc phải Đăng nhập) ===== */}
          <Route
            path="/my-bookings"
            element={<ProtectedRoute role="CUSTOMER"><MyBookings /></ProtectedRoute>}
          />
          <Route path="/my-bookings/:id/lock" element={<BookingLockPage />} />

          {/* ===== Restaurant Partner ===== */}
          <Route
            path="/partner"
            element={<ProtectedRoute role="RESTAURANT_PARTNER"><PartnerDashboard /></ProtectedRoute>}
          />
          <Route
            path="/partner/reports"
            element={<ProtectedRoute role="RESTAURANT_PARTNER"><PartnerReportsPage /></ProtectedRoute>}
          />

          {/* ===== Admin ===== */}
          <Route
            path="/admin"
            element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>}
          />
          <Route
            path="/admin/approvals"
            element={<ProtectedRoute role="ADMIN"><ApprovalPanel /></ProtectedRoute>}
          />
          <Route
            path="/admin/users"
            element={<ProtectedRoute role="ADMIN"><UserManagement /></ProtectedRoute>}
          />
          <Route
            path="/admin/reviews"
            element={<ProtectedRoute role="ADMIN"><ReviewModeration /></ProtectedRoute>}
          />
          <Route
            path="/admin/categories"
            element={<ProtectedRoute role="ADMIN"><CategoryManagement /></ProtectedRoute>}
          />
          <Route
            path="/admin/subscription-plans"
            element={<ProtectedRoute role="ADMIN"><SubscriptionPlanManagement /></ProtectedRoute>}
          />
          <Route
            path="/admin/subscription-invoices"
            element={<ProtectedRoute role="ADMIN"><SubscriptionInvoiceApproval /></ProtectedRoute>}
          />
          <Route
            path="/admin/subscription-payos-config"
            element={<ProtectedRoute role="ADMIN"><SubscriptionPayosConfigPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/reports"
            element={<ProtectedRoute role="ADMIN"><Reports /></ProtectedRoute>}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}