import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../../components/Navbar'
import { bookingApi, reviewApi } from '../../api'

const STATUS_META = {
  HOLDING: { label: 'Đang giữ bàn', badge: 'badge-yellow' },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', badge: 'badge-yellow' },
  CONFIRMED: { label: 'Đã xác nhận', badge: 'badge-green' },
  CHECKED_IN: { label: 'Đang phục vụ', badge: 'badge-blue' },
  COMPLETED: { label: 'Hoàn tất', badge: 'badge-gray' },
  CANCELLED_BY_CUSTOMER: { label: 'Đã huỷ (Đã hoàn cọc)', badge: 'badge-red' },
  CANCELLED_BY_RESTAURANT: { label: 'Nhà hàng huỷ', badge: 'badge-red' },
  NO_SHOW: { label: 'Không đến', badge: 'badge-red' },
  EXPIRED: { label: 'Hết hạn', badge: 'badge-gray' },
  PENDING_NO_SHOW: { label: 'Chờ xác nhận đến', badge: 'badge-yellow' },
}

// ----------------------------------------------------------------------
// 1. MODAL ĐÁNH GIÁ (ReviewModal)
// ----------------------------------------------------------------------
function ReviewModal({ booking, onClose, onSubmit }) {
  const [form, setForm] = useState({ spaceRating: 5, serviceRating: 5, foodRating: 5, comment: '' })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  const ratingCategories = [
    { key: 'spaceRating', label: '🏠 Không gian' },
    { key: 'serviceRating', label: '👨‍🍳 Phục vụ' },
    { key: 'foodRating', label: '🍴 Đồ ăn' }
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, margin: '1rem', background: '#fff', borderRadius: 12 }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Đánh giá {booking.branchName}</h2>
        {ratingCategories.map(({ key, label }) => (
          <div key={key} style={{ marginBottom: '.875rem' }}>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.4rem' }}>{label}</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(v => (
                <button key={v} onClick={() => setForm(p => ({ ...p, [key]: v }))}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', fontWeight: 700, fontSize: '.9rem',
                    background: form[key] >= v ? '#FBBF24' : 'var(--border)', color: form[key] >= v ? '#fff' : 'var(--text-muted)',
                    border: 'none', cursor: 'pointer'
                  }}>
                  ★
                </button>
              ))}
            </div>
          </div>
        ))}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Nhận xét</label>
          <textarea rows={3} value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
            placeholder="Chia sẻ trải nghiệm của bạn..." style={{ width: '100%', padding: '.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
        </div>
        <div className="flex gap-3">
          <button className="btn-outline" style={{ flex: 1, padding: '.5rem' }} onClick={onClose}>Huỷ</button>
          <button className="btn-primary" style={{ flex: 2, padding: '.5rem' }} onClick={() => onSubmit({ ...form, bookingId: booking.id })}>
            Gửi đánh giá
          </button>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// 2. MODAL HỦY ĐẶT BÀN & TÍNH HOÀN TIỀN PAYOS (CancelBookingModal)
// ----------------------------------------------------------------------
function CancelBookingModal({ booking, onClose, onConfirm }) {
  const [submitting, setSubmitting] = useState(false)
  const [cancelReason, setCancelReason] = useState('Thay đổi kế hoạch cá nhân')
  const [agreed, setAgreed] = useState(false) // 🟢 State kiểm soát checkbox đồng ý

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  const now = new Date()
  const reservationTime = new Date(booking.reservationTime)
  const createdAt = booking.createdAt ? new Date(booking.createdAt) : null
  const policy = booking.policySnapshotDto || {}

  const hoursDiff = (reservationTime.getTime() - now.getTime()) / (1000 * 60 * 60)
  const freeCancelLimitHours = policy.freeCancellationHours ?? 24

  let refundPercent = 0
  let conditionText = ''
  let badgeColor = '#EF4444'

  if (hoursDiff <= 0) {
    refundPercent = policy.noShowRefundPercent ?? 0
    conditionText = 'Đã quá giờ hẹn check-in'
  } else if (hoursDiff >= freeCancelLimitHours) {
    refundPercent = policy.freeRefundPercent ?? 100
    conditionText = `Hủy sớm (Trước >= ${freeCancelLimitHours}h check-in)`
    badgeColor = '#10B981'
  } else {
    refundPercent = policy.lateRefundPercent ?? 50
    const roundedHours = Math.max(0, Math.floor(hoursDiff))
    conditionText = `Hủy cận giờ (Còn ~${roundedHours}h tới giờ check-in)`
    badgeColor = '#F59E0B'
  }

  const depositAmount = Number(booking.depositAmount || booking.totalPreOrderAmount || 0)
  const refundAmount = (depositAmount * refundPercent) / 100
  const penaltyAmount = depositAmount - refundAmount

  const handleConfirmClick = async () => {
    if (!agreed) return
    setSubmitting(true)
    try {
      await onConfirm(booking.id, cancelReason)
    } catch (err) {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 460, padding: '1.5rem', background: '#fff', borderRadius: 12, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.2rem', color: '#111827', margin: 0 }}>Xác nhận hủy đặt bàn</h2>
          <span style={{ fontSize: '.75rem', padding: '4px 10px', borderRadius: 12, background: badgeColor, color: '#fff', fontWeight: 600 }}>
            {conditionText}
          </span>
        </div>

        <div style={{ background: '#F9FAFB', padding: '.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '.875rem', lineHeight: '1.6' }}>
          <div><strong>Nhà hàng:</strong> {booking.branchName}</div>
          {createdAt && (
            <div><strong>Thời gian tạo đơn:</strong> {createdAt.toLocaleString('vi-VN')}</div>
          )}
          <div style={{ color: '#D97706' }}><strong>⏰ Giờ check-in (Hẹn):</strong> {reservationTime.toLocaleString('vi-VN')}</div>
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '.75rem 1rem', marginBottom: '1rem', fontSize: '.83rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '.4rem', color: '#374151' }}>
            📜 Chính sách hủy bàn: {policy.policyDepositName || 'Chuẩn'}
          </div>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-muted)' }}>
            <li>Hủy trước từ {freeCancelLimitHours}h trở lên: Hoàn {policy.freeRefundPercent ?? 100}% cọc.</li>
            <li>Hủy dưới {freeCancelLimitHours}h trước giờ hẹn: Hoàn {policy.lateRefundPercent ?? 50}% cọc.</li>
            <li>Sau giờ hẹn: Hoàn {policy.noShowRefundPercent ?? 0}% cọc.</li>
          </ul>
        </div>

        <div style={{ background: '#FFFDF5', border: '1px solid #FCD34D', padding: '.875rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '.9rem' }}>
          <div className="flex justify-between" style={{ marginBottom: '.3rem' }}>
            <span>Số tiền cọc đã trả:</span>
            <span style={{ fontWeight: 600 }}>{depositAmount.toLocaleString('vi-VN')}₫</span>
          </div>
          <div className="flex justify-between" style={{ marginBottom: '.3rem', color: '#DC2626' }}>
            <span>Phí hủy giữ lại ({100 - refundPercent}%):</span>
            <span>-{penaltyAmount.toLocaleString('vi-VN')}₫</span>
          </div>
          <div className="flex justify-between" style={{ borderTop: '1px solid #FDE68A', paddingTop: '.4rem', fontWeight: 700, color: '#059669', fontSize: '1rem' }}>
            <span>Dự kiến hoàn lại qua PayOS ({refundPercent}%):</span>
            <span>{refundAmount.toLocaleString('vi-VN')}₫</span>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Lý do hủy đơn:</label>
          <input
            type="text"
            className="input"
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Nhập lý do hủy..."
            style={{ width: '100%', padding: '.5rem .75rem', borderRadius: 6, border: '1px solid var(--border)' }}
          />
        </div>

        {/* 🟢 Checkbox xác nhận điều khoản trước khi hủy */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', marginBottom: '1.25rem', fontSize: '.83rem' }}>
          <input 
            type="checkbox" 
            id="agreeCancel" 
            checked={agreed} 
            onChange={e => setAgreed(e.target.checked)} 
            style={{ marginTop: '2px', cursor: 'pointer' }}
          />
          <label htmlFor="agreeCancel" style={{ cursor: 'pointer', color: '#374151', lineHeight: '1.4' }}>
            Tôi đồng ý với chính sách khấu trừ phí hủy bàn và hiểu rằng tiền hoàn sẽ được PayOS xử lý tự động về nguồn thanh toán.
          </label>
        </div>

        <div className="flex gap-3">
          <button className="btn-outline" style={{ flex: 1, padding: '.5rem' }} onClick={onClose} disabled={submitting}>
            Đóng
          </button>
          <button
            className="btn-danger"
            style={{ 
              flex: 1.5, 
              background: !agreed || submitting ? '#9CA3AF' : '#DC2626', 
              color: '#fff', fontWeight: 600, padding: '.5rem', border: 'none', borderRadius: 6, 
              cursor: !agreed || submitting ? 'not-allowed' : 'pointer' 
            }}
            onClick={handleConfirmClick}
            disabled={!agreed || submitting}
          >
            {submitting ? 'Đang gọi PayOS hoàn tiền...' : 'Xác nhận hủy & Hoàn cọc'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// 3. MAIN COMPONENT (MyBookings)
// ----------------------------------------------------------------------
export default function MyBookings() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState(null)
  const [cancelingBooking, setCancelingBooking] = useState(null)
  const [filter, setFilter] = useState('ALL')

  const load = () => {
    bookingApi.myBookings().then(r => {
      setBookings(r.data?.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleOpenCancelModal = (booking, e) => {
    e.stopPropagation()
    setCancelingBooking(booking)
  }

  const handleConfirmCancel = async (id, reason) => {
    try {
      // Backend của bạn ở đây sẽ gọi API Hủy đơn kèm trigger PayOS Refund
      await bookingApi.cancel(id, { reason })
      toast.success('Hủy đặt bàn thành công! Hệ thống đã gửi yêu cầu hoàn tiền qua PayOS.')
      setCancelingBooking(null)
      setFilter('CANCELLED_BY_CUSTOMER')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể huỷ đặt bàn')
      throw err
    }
  }

  const handleReview = async (data) => {
    try {
      await reviewApi.create(data)
      toast.success('Cảm ơn đánh giá của bạn!')
      setReviewing(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi gửi đánh giá')
    }
  }

  const handleCardClick = (booking) => {
    const isLockingActive = ['HOLDING', 'AWAITING_PAYMENT'].includes(booking.status)
    if (isLockingActive) {
      navigate(`/my-bookings/${booking.id}/lock`)
    } else {
      navigate(`/my-bookings/${booking.id}/invoice`)
    }
  }

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main, #f9fafb)' }}>
      <Navbar solid={true} />

      <div className="page-container" style={{ padding: '5rem 1rem 2rem 1rem', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '1.5rem' }}>Lịch sử đặt bàn</h1>

        {/* Filter tabs */}
        <div className="flex gap-2" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            ['ALL', 'Tất cả'],
            ['CONFIRMED', 'Đã xác nhận'],
            ['COMPLETED', 'Hoàn tất'],
            ['CANCELLED_BY_CUSTOMER', 'Đã huỷ']
          ].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{
                padding: '.4rem .875rem', borderRadius: 99, fontSize: '.83rem', fontWeight: 600,
                background: filter === k ? 'var(--brand, #0284c7)' : 'var(--white, #fff)',
                color: filter === k ? '#fff' : 'var(--text-muted, #6b7280)',
                border: '1.5px solid', borderColor: filter === k ? 'var(--brand, #0284c7)' : 'var(--border, #e5e7eb)',
                cursor: 'pointer'
              }}>
              {l}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p>}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <p>Chưa có đặt bàn nào trong mục này.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(b => {
            const meta = STATUS_META[b.status] || { label: b.status, badge: 'badge-gray' }
            const isLockingState = ['HOLDING', 'AWAITING_PAYMENT'].includes(b.status)
            const canCancel = ['HOLDING', 'CONFIRMED'].includes(b.status)
            const canReview = b.status === 'COMPLETED' && !b.reviewed

            const tableDisplay = b.tables && b.tables.length > 0
              ? b.tables.map(t => t.tableName || t.name).join(', ')
              : 'Chưa xếp bàn'

            return (
              <div
                key={b.id}
                className={`card booking-card ${isLockingState ? 'locking-active' : ''}`}
                onClick={() => handleCardClick(b)}
                style={{
                  border: isLockingState ? '1px solid #FCD34D' : '1px solid var(--border, #e5e7eb)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: isLockingState ? '#FFFDF5' : 'var(--white, #fff)',
                  padding: '1.25rem',
                  borderRadius: 8
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '.25rem' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{b.branchName}</h3>
                  <span className={`badge ${meta.badge}`}>{meta.label}</span>
                </div>
                <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.75rem' }}>
                  {b.restaurantName}
                </p>

                <div className="grid-2" style={{ marginBottom: '.875rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                  {[
                    ['🪑 Vị trí bàn', tableDisplay],
                    ['👥 Số khách', `${b.guestCount} người`],
                    ['🕒 Ngày đặt', b.createdAt ? new Date(b.createdAt).toLocaleString('vi-VN') : '---'],
                    ['🕐 Giờ check-in', new Date(b.reservationTime).toLocaleString('vi-VN')],
                    ['💰 Tiền đặt cọc', b.depositAmount || b.totalPreOrderAmount ? `${Number(b.depositAmount || b.totalPreOrderAmount).toLocaleString('vi-VN')}₫` : 'Không cọc'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ fontSize: '.87rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {isLockingState ? (
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/my-bookings/${b.id}/lock`);
                      }}
                    >
                      💳 Thanh toán / Xem bộ đếm
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/my-bookings/${b.id}/invoice`);
                      }}
                    >
                      🧾 Xem chi tiết hóa đơn
                    </button>
                  )}

                  {canCancel && (
                    <button className="btn-danger btn-sm" onClick={(e) => handleOpenCancelModal(b, e)}>
                      Huỷ đặt bàn
                    </button>
                  )}
                  {canReview && (
                    <button className="btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReviewing(b);
                      }}
                    >
                      ⭐ Đánh giá
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {reviewing && (
        <ReviewModal booking={reviewing} onClose={() => setReviewing(null)} onSubmit={handleReview} />
      )}

      {cancelingBooking && (
        <CancelBookingModal
          booking={cancelingBooking}
          onClose={() => setCancelingBooking(null)}
          onConfirm={handleConfirmCancel}
        />
      )}
    </div>
  )
}