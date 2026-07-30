import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { bookingApi, authApi } from '../../api'
import { Search, TriangleAlert, ClipboardList, Home, Calendar, Users, Wallet } from 'lucide-react'

// 1. Khai báo STATUS_META đồng bộ với MyBookings
const STATUS_META = {
  HOLDING: { label: 'Đang giữ bàn', bg: '#FEF3C7', color: '#D97706' }, // Vàng
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', bg: '#FEF3C7', color: '#D97706' }, // Vàng
  CONFIRMED: { label: 'Đã xác nhận', bg: '#D1FAE5', color: '#059669' }, // Xanh lá
  CHECKED_IN: { label: 'Đang phục vụ', bg: '#DBEAFE', color: '#2563EB' }, // Xanh dương
  COMPLETED: { label: 'Hoàn tất', bg: '#F3F4F6', color: '#4B5563' }, // Xám
  CANCELLED_BY_CUSTOMER: { label: 'Đã huỷ', bg: '#FEE2E2', color: '#DC2626' }, // Đỏ
  CANCELLED_BY_RESTAURANT: { label: 'Nhà hàng huỷ', bg: '#FEE2E2', color: '#DC2626' }, // Đỏ
  NO_SHOW: { label: 'Không đến', bg: '#FEE2E2', color: '#DC2626' }, // Đỏ
  EXPIRED: { label: 'Hết hạn', bg: '#F3F4F6', color: '#6B7280' }, // Xám
  PENDING_NO_SHOW: { label: 'Chờ xác nhận đến', bg: '#FEF3C7', color: '#D97706' },
}

const STORAGE_KEY_BOOKINGS = 'guest_lookup_bookings'
const STORAGE_KEY_EMAIL = 'guest_lookup_email'

export default function GuestBookingLookup() {
  const navigate = useNavigate()
  
  const [lookupEmail, setLookupEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [bookingList, setBookingList] = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [countdown, setCountdown] = useState(0)

  // 2. Khôi phục danh sách từ LocalStorage khi mount component
  useEffect(() => {
    const savedEmail = localStorage.getItem(STORAGE_KEY_EMAIL)
    const savedBookings = localStorage.getItem(STORAGE_KEY_BOOKINGS)

    if (savedEmail && savedBookings) {
      try {
        setLookupEmail(savedEmail)
        setBookingList(JSON.parse(savedBookings))
        setOtpSent(true) // Bỏ qua bước gửi OTP nếu đã có cache
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY_BOOKINGS)
      }
    }
  }, [])

  // Xử lý đếm ngược OTP
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Hàm gửi OTP
  const handleSendLookupOtp = async (e) => {
    if (e) e.preventDefault()
    if (!lookupEmail) return toast.error('Vui lòng nhập email')
    
    setLookupError('')
    setLookupLoading(true)
    try {
      await authApi.sendOtp({ email: lookupEmail, purpose: 'GUEST_LOOKUP' })
      setOtpSent(true)
      setCountdown(60)
      toast.success('Mã OTP đã được gửi tới email!')
    } catch (err) {
      setLookupError(err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng thử lại!')
    } finally {
      setLookupLoading(false)
    }
  }

  // Hàm xác thực OTP & Lưu Cache
  const handleVerifyAndLookup = async (e) => {
    e.preventDefault()
    if (!otpCode) return toast.error('Vui lòng nhập mã OTP')

    setLookupError('')
    setLookupLoading(true)
    try {
      const res = await bookingApi.guestLookup({ email: lookupEmail, otp: otpCode })
      const data = res.data?.data || []
      
      setBookingList(data)
      
      // Lưu vào localStorage để không phải gửi lại OTP khi reload
      localStorage.setItem(STORAGE_KEY_EMAIL, lookupEmail)
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(data))

      toast.success('Xác thực thành công!')
    } catch (err) {
      setLookupError(err.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn!')
    } finally {
      setLookupLoading(false)
    }
  }

  // Clear cache khi đổi email
  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY_EMAIL)
    localStorage.removeItem(STORAGE_KEY_BOOKINGS)
    setBookingList(null)
    setOtpSent(false)
    setOtpCode('')
    setLookupEmail('')
  }

  // 3. Logic điều hướng khi Click vào Đơn Hàng
  const handleCardClick = (item) => {
    const isLockingActive = ['HOLDING', 'AWAITING_PAYMENT'].includes(item.status)
    if (isLockingActive) {
      navigate(`/my-bookings/${item.id}/lock`)
    } else {
      navigate(`/my-bookings/${item.id}/invoice`)
    }
  }

  // Render Badge màu trạng thái
  const renderStatusBadge = (status) => {
    const meta = STATUS_META[status] || { label: status, bg: '#E5E7EB', color: '#374151' }
    return (
      <span style={{
        backgroundColor: meta.bg,
        color: meta.color,
        padding: '.25rem .65rem',
        borderRadius: 999,
        fontSize: '.75rem',
        fontWeight: 700,
        letterSpacing: '.03em',
        textTransform: 'uppercase',
        display: 'inline-block'
      }}>
        {meta.label}
      </span>
    )
  }

  return (
    <div style={{ marginBottom: '3rem', padding: '1.75rem 2rem', background: '#fdfbf7', border: '1px solid var(--gold, #D4AF37)', borderRadius: 8 }}>
      <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.4rem', fontWeight: 700, color: 'var(--brown, #4A2E19)', marginBottom: '.5rem' }}>
        <Search size={20} style={{ verticalAlign: '-3px' }} /> Tra Cứu Đơn Đặt Bàn Khách Hàng
      </h3>
      <p style={{ fontSize: '.85rem', color: '#6B7280', marginBottom: '1.25rem' }}>
        Nhập Email đặt bàn để nhận mã OTP xác thực trước khi xem lịch sử đơn.
      </p>

      {lookupError && (
        <div style={{ padding: '.75rem 1rem', background: '#FEE2E2', color: '#DC2626', fontSize: '.82rem', borderRadius: 4, marginBottom: '1rem' }}>
          <TriangleAlert size={15} style={{ verticalAlign: '-2px' }} /> {lookupError}
        </div>
      )}

      {/* BƯỚC 1: NHẬP EMAIL */}
      {!otpSent ? (
        <form onSubmit={handleSendLookupOtp} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="email"
            placeholder="Nhập email của bạn (vd: email@gmail.com)"
            value={lookupEmail}
            onChange={e => setLookupEmail(e.target.value)}
            required
            style={{ flex: 1, minWidth: 260, padding: '.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: 4 }}
          />
          <button
            type="submit"
            disabled={lookupLoading}
            style={{ background: '#4A2E19', color: '#FEF3C7', border: 'none', padding: '.75rem 1.75rem', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', borderRadius: 4 }}
          >
            {lookupLoading ? 'Đang gửi OTP...' : 'Gửi Mã OTP Tra Cứu'}
          </button>
        </form>
      ) : (

        /* BƯỚC 2: NHẬP OTP (Nếu chưa có bookingList) */
        <div>
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', padding: '.75rem 1rem', borderRadius: 4, marginBottom: '1.25rem', fontSize: '.82rem', color: '#92400E', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Đang tra cứu cho Email: <b>{lookupEmail}</b></span>
            <button type="button" onClick={handleReset} style={{ background: 'none', border: 'none', color: '#4A2E19', textDecoration: 'underline', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600 }}>
              Đổi email khác
            </button>
          </div>

          {!bookingList && (
            <form onSubmit={handleVerifyAndLookup} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Nhập mã OTP (6 chữ số)"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                required
                maxLength={6}
                style={{ flex: 1, minWidth: 200, padding: '.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: 4, letterSpacing: '3px', fontWeight: 700 }}
              />
              <button
                type="submit"
                disabled={lookupLoading}
                style={{ background: '#D4AF37', color: '#4A2E19', border: 'none', padding: '.75rem 1.75rem', fontSize: '.85rem', fontWeight: 700, cursor: 'pointer', borderRadius: 4 }}
              >
                {lookupLoading ? 'Đang xác thực...' : 'Xác Thực & Xem Đơn'}
              </button>
              <button
                type="button"
                disabled={countdown > 0 || lookupLoading}
                onClick={handleSendLookupOtp}
                style={{ background: 'transparent', border: 'none', color: countdown > 0 ? '#9CA3AF' : '#4A2E19', fontSize: '.82rem', cursor: countdown > 0 ? 'default' : 'pointer' }}
              >
                {countdown > 0 ? `Gửi lại OTP (${countdown}s)` : 'Gửi lại mã'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* HIỂN THỊ DANH SÁCH BÀN TRẢ VỀ */}
      {bookingList !== null && (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem' }}>
          <h4 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: '#4A2E19' }}>
            <ClipboardList size={18} style={{ verticalAlign: '-3px' }} /> Danh Sách Đơn Đặt Bàn của ({lookupEmail})
          </h4>

          {bookingList.length === 0 ? (
            <p style={{ fontSize: '.85rem', color: '#6B7280', fontStyle: 'italic' }}>
              Không tìm thấy lịch sử đặt bàn nào liên kết với email này.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {bookingList.map(item => {
                const isLocking = ['HOLDING', 'AWAITING_PAYMENT'].includes(item.status)

                return (
                  <div
                    key={item.id}
                    onClick={() => handleCardClick(item)}
                    style={{
                      padding: '1.25rem',
                      border: isLocking ? '1px solid #FCD34D' : '1px solid #E5E7EB',
                      borderRadius: 6,
                      background: isLocking ? '#FFFDF5' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
                      <strong style={{ color: '#4A2E19', fontSize: '1rem' }}>Mã đơn: #{item.bookingCode || item.id}</strong>
                      {renderStatusBadge(item.status)}
                    </div>

                    <div style={{ fontSize: '.85rem', color: '#4B5563', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '.6rem' }}>
                      <div><Home size={14} style={{ verticalAlign: '-2px' }} /> Nhà hàng: <b style={{ color: '#111827' }}>{item.branchName || 'Dabana Branch'}</b></div>
                      <div><Calendar size={14} style={{ verticalAlign: '-2px' }} /> Thời gian: <b style={{ color: '#111827' }}>{item.bookingTime ? `${item.bookingTime} - ${item.bookingDate}` : (item.reservationTime ? new Date(item.reservationTime).toLocaleString('vi-VN') : '-')}</b></div>
                      <div><Users size={14} style={{ verticalAlign: '-2px' }} /> Số khách: <b style={{ color: '#111827' }}>{item.guestCount} người</b></div>
                      <div><Wallet size={14} style={{ verticalAlign: '-2px' }} /> Tiền cọc: <b style={{ color: '#4A2E19' }}>{item.depositAmount ? `${Number(item.depositAmount).toLocaleString('vi-VN')} đ` : 'Không cọc'}</b></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}