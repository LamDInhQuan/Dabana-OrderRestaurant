import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import HomePage       from './pages/customer/HomePage'
import BranchDetail   from './pages/customer/BranchDetail'
import BookingFlow    from './pages/customer/BookingFlow'
import MyBookings     from './pages/customer/MyBookings'
import LoginPage      from './pages/auth/LoginPage'
import RegisterPage   from './pages/auth/RegisterPage'

import PartnerDashboard from './pages/partner/PartnerDashboard'
import TableLayout      from './pages/partner/TableLayout'
import ManageBookings   from './pages/partner/ManageBookings'
import MenuManager      from './pages/partner/MenuManager'

import AdminDashboard   from './pages/admin/AdminDashboard'
import ApprovalPanel    from './pages/admin/ApprovalPanel'

function ProtectedRoute({ children, role }) {
  const { auth, isRole } = useAuth()
  if (!auth) return <Navigate to="/login" replace />
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
          <Route path="/"            element={<HomePage />} />
          <Route path="/branch/:id"  element={<BranchDetail />} />
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/register"    element={<RegisterPage />} />

          {/* ===== Customer (B01 / B10 / B13 / B14) ===== */}
            {/*
            /branch/:id  → trang chi tiết nhà hàng
            Bấm "Đặt bàn ngay" → step chuyển nội bộ trong BranchDetail
            (step 0 = chi tiết | 1 = chọn bàn | 2 = thông tin | 3 = đặt món | 4 = thanh toán)
            Không cần route /booking/:id riêng nữa
          */}
          <Route path="/branch/:id" element={<BranchDetail />} />
          <Route path="/my-bookings"
            element={<ProtectedRoute role="CUSTOMER"><MyBookings /></ProtectedRoute>} />

          {/* ===== Restaurant Partner (B03-B08 / B12 / B15) ===== */}
        <Route path="/partner"
            element={<ProtectedRoute role="RESTAURANT_PARTNER"><PartnerDashboard /></ProtectedRoute>} />

          {/* ===== Admin (B02 B03 B04 B15) ===== */}
          <Route path="/admin"
            element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/approvals"
            element={<ProtectedRoute role="ADMIN"><ApprovalPanel /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
