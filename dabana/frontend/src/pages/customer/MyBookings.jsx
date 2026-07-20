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
  CANCELLED_BY_CUSTOMER: { label: 'Đã huỷ', badge: 'badge-red' },
  CANCELLED_BY_RESTAURANT: { label: 'Nhà hàng huỷ', badge: 'badge-red' },
  NO_SHOW: { label: 'Không đến', badge: 'badge-red' },
  EXPIRED: { label: 'Hết hạn', badge: 'badge-gray' },
  PENDING_NO_SHOW: { label: 'Chờ xác nhận đến', badge: 'badge-yellow' },
}

function ReviewModal({ booking, onClose, onSubmit }) {
  const [form, setForm] = useState({ spaceRating: 5, serviceRating: 5, foodRating: 5, comment: '' })

  const ratingCategories = [
    { key: 'spaceRating', label: '🏠 Không gian' },
    { key: 'serviceRating', label: '👨‍🍳 Phục vụ' },
    { key: 'foodRating', label: '🍴 Đồ ăn' }
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, margin: '1rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Đánh giá {booking.branchName}</h2>
        {ratingCategories.map(({ key, label }) => (
          <div key={key} style={{ marginBottom: '.875rem' }}>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.4rem' }}>{label}</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(v => (
                <button key={v} onClick={() => setForm(p => ({ ...p, [key]: v }))}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', fontWeight: 700, fontSize: '.9rem',
                    background: form[key] >= v ? '#FBBF24' : 'var(--border)', color: form[key] >= v ? '#fff' : 'var(--text-muted)'
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
            placeholder="Chia sẻ trải nghiệm của bạn..." />
        </div>
        <div className="flex gap-3">
          <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Huỷ</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={() => onSubmit({ ...form, bookingId: booking.id })}>
            Gửi đánh giá
          </button>
        </div>
      </div>
    </div>
  )
}

// ... (Các phần import và ReviewModal giữ nguyên không đổi)

export default function MyBookings() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState(null)
  const [filter, setFilter] = useState('ALL')

  const load = () => {
    bookingApi.myBookings().then(r => {
      setBookings(r.data?.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleCancel = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Bạn có chắc muốn huỷ đặt bàn này?')) return
    try {
      await bookingApi.cancel(id, { reason: 'Khách hàng tự huỷ' })
      toast.success('Đã huỷ đặt bàn')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể huỷ')
    }
  }

  const handleReview = async (data) => {
    try {
      await reviewApi.create(data)
      toast.success('Cảm ơn đánh giá của bạn!')
      setReviewing(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi gửi đánh giá')
    }
  }

  // ✅ CHUẨN HOÁ LOGIC ĐIỀU HƯỚNG TẠI ĐÂY
  const handleCardClick = (booking) => {
    // Chỉ có HOLDING và AWAITING_PAYMENT mới được vào trang đếm ngược lock
    const isLockingActive = ['HOLDING', 'AWAITING_PAYMENT'].includes(booking.status)

    if (isLockingActive) {
      navigate(`/my-bookings/${booking.id}/lock`)
    } else {
      // Đơn hết hạn (EXPIRED), Đã cọc, Đã ăn... đều vào trang hoá đơn chi tiết
      navigate(`/my-bookings/${booking.id}/invoice`)
    }
  }

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter)

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ padding: '2rem 1rem' }}>
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
                background: filter === k ? 'var(--brand)' : 'var(--white)',
                color: filter === k ? '#fff' : 'var(--text-muted)',
                border: '1.5px solid', borderColor: filter === k ? 'var(--brand)' : 'var(--border)'
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

            // ✅ Chỉ hiển thị giao diện viền vàng cảnh báo cho đơn thực sự đang lock
            const isLockingState = ['HOLDING', 'AWAITING_PAYMENT'].includes(b.status)
            const canCancel = ['HOLDING', 'CONFIRMED'].includes(b.status)
            const canReview = b.status === 'COMPLETED'

            const tableDisplay = b.tables && b.tables.length > 0
              ? b.tables.map(t => t.tableName || t.name).join(', ')
              : 'Chưa xếp bàn'

            return (
              <div
                key={b.id}
                className={`card booking-card ${isLockingState ? 'locking-active' : ''}`}
                onClick={() => handleCardClick(b)}
                style={{
                  border: isLockingState ? '1px solid #FCD34D' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: isLockingState ? '#FFFDF5' : 'var(--white)'
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '.25rem' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{b.branchName}</h3>
                  <span className={`badge ${meta.badge}`}>{meta.label}</span>
                </div>
                <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.75rem' }}>
                  {b.restaurantName}
                </p>

                <div className="grid-2" style={{ marginBottom: '.875rem', gap: '.5rem' }}>
                  {[
                    ['🪑 Vị trí bàn', tableDisplay],
                    ['👥 Số khách', `${b.guestCount} người`],
                    ['🕐 Thời gian', new Date(b.reservationTime).toLocaleString('vi-VN')],
                    ['💰 Tiền đặt cọc', b.depositAmount ? `${Number(b.depositAmount).toLocaleString('vi-VN')}₫` : 'Không cọc'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ fontSize: '.87rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>

                {b.items && b.items.length > 0 && (
                  <div style={{ background: 'var(--bg-light)', padding: '.6rem .8rem', borderRadius: 6, marginBottom: '.875rem', fontSize: '.85rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '.3rem', color: 'var(--text-main)' }}>🛒 Món ăn đặt trước:</div>
                    <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-muted)' }}>
                      {b.items.map((item, idx) => (
                        <li key={idx}>
                          <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{item.name}</span> x{item.quantity} ({Number(item.price).toLocaleString('vi-VN')}₫)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2">
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
                    <button className="btn-danger btn-sm" onClick={(e) => handleCancel(b.id, e)}>
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
    </>
  )
}