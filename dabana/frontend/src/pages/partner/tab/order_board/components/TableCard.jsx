import { TABLE_STATUS_META, DEFAULT_TABLE_STATUS_META, BOOKING_STATUS_LABEL, formatMoney, formatTime } from './statusMeta'

export default function TableCard({ table, selectedTimeSlot, onClick }) {
  const meta = TABLE_STATUS_META[table.status] || DEFAULT_TABLE_STATUS_META
  const booking = table.activeBooking
  const orderCount = (table.orders || []).length

  // Giả lập danh sách các ca đặt bàn xen kẽ trong ngày (có thể lấy từ table.upcomingBookings nếu backend hỗ trợ)
  const upcomingBookings = table.upcomingBookings || [
    { time: '17:30', name: 'Anh Tuấn', guests: 4, status: 'CONFIRMED' },
    { time: '19:30', name: 'Chị Mai', guests: 2, status: 'HOLDING' }
  ]

  return (
    <button
      onClick={() => onClick?.(table)}
      className="card"
      style={{
        textAlign: 'left', cursor: onClick ? 'pointer' : 'default', width: '100%',
        border: `1.5px solid ${meta.color}33`, borderTop: `4px solid ${meta.color}`,
        padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.6rem',
        background: '#fff', transition: 'box-shadow .15s, transform .15s',
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.boxShadow = '0 4px 14px rgba(61,43,31,.12)' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Tên bàn + trạng thái */}
      <div className="flex items-center justify-between">
        <span style={{ fontWeight: 700, fontSize: '.95rem' }}>{table.tableName}</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '.3rem',
          fontSize: '.72rem', fontWeight: 700, padding: '.2rem .55rem', borderRadius: 99,
          color: meta.color, background: meta.bg,
        }}>
          {meta.icon} {meta.label}
        </span>
      </div>

      <div style={{ fontSize: '.78rem', color: 'var(--text-muted, #8A6E57)' }}>
        🪑 Sức chứa: <strong>{table.capacity}</strong> khách
        {selectedTimeSlot !== 'NOW' && (
          <span style={{ float: 'right', color: '#D97706', fontWeight: 600 }}>
            🕒 Xem lúc {selectedTimeSlot}
          </span>
        )}
      </div>

      {/* Thông tin khách (nếu có booking đang active ở hiện tại) */}
      {booking ? (
        <div style={{ fontSize: '.8rem', borderTop: '1px dashed #E8DECE', paddingTop: '.5rem' }}>
          <div style={{ fontWeight: 600 }}>{booking.contactName}</div>
          <div style={{ color: 'var(--text-muted, #8A6E57)' }}>{booking.contactPhone}</div>
          <div style={{ color: 'var(--text-muted, #8A6E57)', marginTop: '.2rem' }}>
            🕐 {formatTime(booking.reservationTime)} · 👥 {booking.guestCount} khách
            {' · '}
            <span style={{ fontWeight: 600 }}>{BOOKING_STATUS_LABEL[booking.status] || booking.status}</span>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '.8rem', color: 'var(--text-muted, #8A6E57)', borderTop: '1px dashed #E8DECE', paddingTop: '.5rem' }}>
          Chưa có khách hiện tại
        </div>
      )}

      {/* THANH HIỂN THỊ CÁC BOOKING XEN KẼ TRONG NGÀY (TIMELINE BADGES) */}
      {upcomingBookings.length > 0 && (
        <div style={{ 
          background: '#F9F6F0', borderRadius: '6px', padding: '.4rem .6rem', 
          borderTop: '1px solid #E8DECE', fontSize: '.75rem' 
        }}>
          <div style={{ fontWeight: 700, color: '#8A6E57', marginBottom: '.2rem', fontSize: '.7rem' }}>
            📌 Lịch đặt bàn trong ngày:
          </div>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {upcomingBookings.map((b, idx) => (
              <span key={idx} style={{
                background: '#fff', border: '1px solid #D6C7B2', padding: '.1rem .4rem',
                borderRadius: '4px', fontSize: '.7rem', color: '#5C4033', fontWeight: 600
              }}>
                🕒 {b.time} - {b.name} ({b.guests}k)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Đơn hàng + tổng tiền tạm tính */}
      {orderCount > 0 && (
        <div className="flex items-center justify-between" style={{
          fontSize: '.82rem', borderTop: '1px dashed #E8DECE', paddingTop: '.5rem',
        }}>
          <span style={{ color: 'var(--text-muted, #8A6E57)' }}>🍽️ {orderCount} món</span>
          <span style={{ fontWeight: 700, color: '#8B6914' }}>{formatMoney(table.estimatedTotal)}</span>
        </div>
      )}
    </button>
  )
}