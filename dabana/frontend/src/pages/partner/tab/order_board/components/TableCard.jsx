import { TABLE_STATUS_META, DEFAULT_TABLE_STATUS_META, BOOKING_STATUS_LABEL, formatMoney, formatTime } from './statusMeta'

export default function TableCard({ table, onClick }) {
  const meta = TABLE_STATUS_META[table.status] || DEFAULT_TABLE_STATUS_META
  const booking = table.activeBooking
  const orderCount = (table.orders || []).length

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
      {/* Ten ban + trang thai */}
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
      </div>

      {/* Thong tin khach (neu co booking dang active) */}
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
          Chưa có khách
        </div>
      )}

      {/* Don hang + tong tien tam tinh */}
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