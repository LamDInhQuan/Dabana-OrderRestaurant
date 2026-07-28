import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../../components/Navbar'
import { bookingApi,restaurantApi } from '../../api'

const STATUS_META = {
  CONFIRMED:        { label: 'Đã xác nhận', badge: 'badge-green', actions: ['check-in'] },
  CHECKED_IN:       { label: 'Đang phục vụ', badge: 'badge-blue', actions: ['check-out'] },
  PENDING_NO_SHOW:  { label: 'Nghi No-show', badge: 'badge-yellow', actions: ['check-in','no-show'] },
  COMPLETED:        { label: 'Hoàn tất', badge: 'badge-gray', actions: [] },
  NO_SHOW:          { label: 'No-show', badge: 'badge-red', actions: [] },
  CANCELLED_BY_CUSTOMER:   { label: 'KH huỷ', badge: 'badge-red', actions: [] },
  CANCELLED_BY_RESTAURANT: { label: 'NH huỷ', badge: 'badge-red', actions: [] },
}

export default function ManageBookings({bookings}) {
  const [params] = useSearchParams()
  
  const [filteredbookings, setBookings]   = useState([])
  const [filter, setFilter]       = useState('CONFIRMED')
  const [loading, setLoading]     = useState(true)

  const load = () => {
    setLoading(true)

    
      setBookings((bookings || []).filter(b => b.status === filter))
      setLoading(false)
   
  }

  useEffect(() => {
    load()
  }, [filter,bookings])

  const doAction = async (bookingId, action) => {
    try {
      if (action === 'check-in')  await bookingApi.checkIn(bookingId)
      if (action === 'check-out') await bookingApi.checkOut(bookingId)
      if (action === 'no-show')   await bookingApi.cancel(bookingId, { cancelledByRestaurant: false, reason: 'No-show' })
      if (action === 'cancel')    await bookingApi.cancel(bookingId, { cancelledByRestaurant: true })
      toast.success('Cập nhật thành công!')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật')
    }
  }

  return (
    <>

      <div className="page-container" style={{ padding: '2rem 1rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '1.5rem' }}>Quản lý đặt bàn</h1>

        {/* Status filter */}
        <div className="flex gap-2" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {Object.entries(STATUS_META).map(([k, { label }]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{ padding: '.4rem .875rem', borderRadius: 99, fontSize: '.82rem', fontWeight: 600,
                background: filter === k ? 'var(--brand)' : 'var(--white)',
                color: filter === k ? '#fff' : 'var(--text-muted)',
                border: '1.5px solid', borderColor: filter === k ? 'var(--brand)' : 'var(--border)' }}>
              {label}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p>}

        {filteredbookings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Không có đặt bàn nào ở trạng thái này.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
          {filteredbookings.map(b => {
            const meta = STATUS_META[b.status] || { label: b.status, badge: 'badge-gray', actions: [] }
            return (
              <div key={b.id} className="card" style={{ border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '.625rem' }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>#{b.id} – </span>
                    <span style={{ fontWeight: 600 }}>{b.contactName || 'Khách hàng'}</span>
                    <span style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginLeft: '.5rem' }}>
                      {b.contactPhone}
                    </span>
                  </div>
                  <span className={`badge ${meta.badge}`}>{meta.label}</span>
                </div>

                <div style={{ display: 'flex', gap: '.5rem', fontSize: '.87rem', marginBottom: '.875rem', flexWrap: 'wrap',flexDirection:'column' }}>
                  <p>
                    🪑  Bàn: {b.tables.map((table, index) => (
                            <strong key={table.id || index}>
                              {table.tableName}
                              {index < b.tables.length - 1 ? ', ' : ''}
                            </strong>
                          ))}
                  </p>
                  <p>👥 Khách: <strong>{b.guestCount}</strong></p>
                  <p>🕐 <strong>{new Date(b.reservationTime).toLocaleString('vi-VN')}</strong></p>
                  {b.depositAmount > 0 && <span>💰 Cọc: <strong>{Number(b.depositAmount).toLocaleString('vi-VN')}₫</strong></span>}
                </div>

                <div className="flex gap-2">
                  {meta.actions.includes('check-in') && (
                    <button className="btn-primary btn-sm" onClick={() => doAction(b.id, 'check-in')}>
                      ✅ Check-in
                    </button>
                  )}
                  {meta.actions.includes('check-out') && (
                    <button className="btn-primary btn-sm" onClick={() => doAction(b.id, 'check-out')}>
                      🚪 Check-out & Hoàn tất
                    </button>
                  )}
                  {meta.actions.includes('no-show') && (
                    <button className="btn-danger btn-sm" onClick={() => doAction(b.id, 'no-show')}>
                      ❌ Chốt No-show
                    </button>
                  )}
                  {b.status === 'CONFIRMED' && (
                    <button className="btn-outline btn-sm" onClick={() => doAction(b.id, 'cancel')}>
                      🚫 Nhà hàng huỷ
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
