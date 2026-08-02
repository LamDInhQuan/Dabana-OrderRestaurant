import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../../components/Navbar'
import { bookingApi, reviewApi } from '../../api'
import { ClipboardList, Armchair, Users, Clock, Wallet, CreditCard, ReceiptText, Star, ShieldCheck } from 'lucide-react'
import wsService from '../../api/socket'

// Import các modal đã được tách ra file riêng (điều chỉnh lại đường dẫn cho khớp thư mục của bạn)
import CancelBookingModal from './modal/CancelBookingModal'
import ReviewModal from './modal/ReviewModal'

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

export default function MyBookings() {
  console.log("wsService",wsService);
  
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState(null)
  const [cancelingBooking, setCancelingBooking] = useState(null)
  const [filter, setFilter] = useState('ALL')

  // Lấy thông tin user đang đăng nhập từ localStorage (khớp với key 'dabana_auth' trong file api.js của bạn)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dabana_auth')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Tuỳ vào cấu trúc object lưu trong localStorage mà trỏ đến id của user cho đúng
        setCurrentUser(parsed.user || parsed) 
      }
    } catch (e) {
      console.error("Lỗi đọc thông tin user từ localStorage", e)
    }
  }, [])

  // socket 
  useEffect(() => {
  const userId = currentUser?.id; // Lấy ID của khách hàng đang đăng nhập
  if (!userId) return;

  wsService.connect(() => {
    // Lắng nghe kênh riêng của user này
    // (Lưu ý: Tiền tố prefix có thể thay đổi tùy thuộc vào cấu hình WebSocketConfigurer ở Backend của bạn, 
    // ví dụ: `/topic/user/${userId}/bookings` hoặc `/user/${userId}/queue/bookings`)
    const destination = `/topic/user/${userId}/bookings`; 

    const subscription = wsService.subscribe(destination, (bookingId) => {
      console.log("Nhận được cập nhật đơn hàng riêng cho user:", bookingId);
      // Gọi lại API để load lại danh sách đơn của tôi
      fetchMyBookings(); 
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  });
}, [currentUser]);

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
  const handleSaveReview = async (data) => {
    try {
      await reviewApi.create(data);
      toast.success('Cảm ơn đánh giá của bạn!');
      setReviewing(null);
      load(); // Tải lại danh sách để cập nhật trạng thái isReviewed
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi gửi đánh giá');
    }
  };

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main, #f9fafb)' }}>
      <Navbar solid={true} />

      <div className="page-container" style={{ padding: '5rem 1rem 2rem 1rem', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '1.5rem' }}>Lịch sử đặt bàn</h1>

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
            <div style={{ marginBottom: '1rem' }}><ClipboardList size={48} /></div>
            <p>Chưa có đặt bàn nào trong mục này.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(b => {
            const meta = STATUS_META[b.status] || { label: b.status, badge: 'badge-gray' }
            const isLockingState = ['HOLDING', 'AWAITING_PAYMENT'].includes(b.status)
            const canCancel = ['HOLDING', 'CONFIRMED'].includes(b.status)
            const canReview = b.status === 'COMPLETED' && !b.isReviewed

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
                    [Armchair, 'Vị trí bàn', tableDisplay],
                    [Users, 'Số khách', `${b.guestCount} người`],
                    [Clock, 'Ngày đặt', b.createdAt ? new Date(b.createdAt).toLocaleString('vi-VN') : '---'],
                    [Clock, 'Giờ check-in', new Date(b.reservationTime).toLocaleString('vi-VN')],
                    [Wallet, 'Tiền đặt cọc', b.depositAmount || b.totalPreOrderAmount ? `${Number(b.depositAmount || b.totalPreOrderAmount).toLocaleString('vi-VN')}₫` : 'Không cọc'],
                  ].map(([Icon, k, v]) => (
                    <div key={k} style={{ fontSize: '.87rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}><Icon size={14} /> {k}: </span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>

                {b.inGracePeriod && (
                  <div style={{
                    background: '#ECFDF5',
                    color: '#047857',
                    border: '1px solid #A7F3D0',
                    padding: '.4rem .75rem',
                    borderRadius: 6,
                    fontSize: '.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '.4rem',
                    marginBottom: '.875rem'
                  }}>
                    <ShieldCheck size={16} color="#059669" style={{ flexShrink: 0 }} />
                    <span>Đang trong thời gian ân hạn Dabana: Hoàn <strong>100% tiền cọc</strong> nếu huỷ trong <strong>~{Math.max(1, Math.ceil((b.gracePeriodRemainingSeconds || 0) / 60))} phút</strong> tới.</span>
                  </div>
                )}

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
                      <CreditCard size={15} style={{ verticalAlign: '-3px' }} /> Thanh toán / Xem bộ đếm
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
                      <ReceiptText size={15} style={{ verticalAlign: '-3px' }} /> Xem chi tiết hóa đơn
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
                      <Star size={15} fill="currentColor" style={{ verticalAlign: '-3px' }} /> Đánh giá
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Khi người dùng click vào nút đánh giá của một đơn hàng cụ thể */}
      {reviewing && !reviewing.isReviewed && (
        <ReviewModal
          booking={reviewing}
          onClose={() => setReviewing(null)}
          onSubmit={handleSaveReview}
        />
      )}

      {cancelingBooking && (
        <CancelBookingModal
          booking={cancelingBooking}
          onClose={() => setCancelingBooking(null)}
          onRefresh={load}
        />
      )}
    </div>
  )
}