import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../../components/Navbar'
import { bookingApi, restaurantApi } from '../../api'
import { Armchair, Users, Clock, Wallet, Check, DoorOpen, X, Ban, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_META = {
  ALL:                      { label: 'Tất cả trạng thái', badge: 'badge-gray', actions: [] },
  CONFIRMED:                { label: 'Đã xác nhận', badge: 'badge-green', actions: ['check-in'] },
  CHECKED_IN:               { label: 'Đang phục vụ', badge: 'badge-blue', actions: ['check-out'] },
  PENDING_NO_SHOW:          { label: 'Nghi No-show', badge: 'badge-yellow', actions: ['check-in','no-show'] },
  COMPLETED:                { label: 'Hoàn tất', badge: 'badge-gray', actions: [] },
  NO_SHOW:                  { label: 'No-show', badge: 'badge-red', actions: [] },
  CANCELLED_BY_CUSTOMER:    { label: 'KH huỷ', badge: 'badge-red', actions: [] },
  CANCELLED_BY_RESTAURANT:  { label: 'NH huỷ', badge: 'badge-red', actions: [] },
}

const TYPE_FILTERS = [
  { key: 'ALL', label: 'Tất cả loại' },
  { key: 'HAS_DEPOSIT', label: 'Có cọc đặt' },
  { key: 'WITH_CANCELLATION_POLICY', label: 'Có cọc & chính sách hủy' },
  { key: 'NO_CANCELLATION_POLICY', label: 'Có cọc, không chính sách hủy' },
]

const DATE_FILTERS = [
  { key: 'ALL', label: 'Mọi thời điểm' },
  { key: 'TODAY', label: 'Hôm nay' },
  { key: 'UPCOMING', label: 'Sắp tới' },
]

export default function ManageBookings({ bookings }) {
  const [params] = useSearchParams()
  
  const [filter, setFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL') // State lọc theo ngày
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const [loading, setLoading] = useState(true)

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null)
  const [cancellationInfo, setCancellationInfo] = useState(null)

  // Lọc danh sách theo trạng thái, loại cọc và ngày check-in
  const filteredbookings = useMemo(() => {
    let list = bookings || []
    
    // 1. Lọc theo trạng thái
    if (filter !== 'ALL') {
      list = list.filter(b => b.status === filter)
    }

    // 2. Lọc theo loại cọc / chính sách
    if (typeFilter === 'HAS_DEPOSIT') {
      list = list.filter(b => Number(b.depositAmount) > 0)
    } else if (typeFilter === 'WITH_CANCELLATION_POLICY') {
      list = list.filter(b => {
        const s = b.policySnapshot
        return Number(b.depositAmount) > 0 && s && (
          s.freeCancellationHours !== null || 
          s.freeRefundPercent !== null || 
          s.lateRefundPercent !== null || 
          s.noShowRefundPercent !== null
        )
      })
    } else if (typeFilter === 'NO_CANCELLATION_POLICY') {
      list = list.filter(b => {
        const s = b.policySnapshot
        const hasPolicy = s && (
          s.freeCancellationHours !== null || 
          s.freeRefundPercent !== null || 
          s.lateRefundPercent !== null || 
          s.noShowRefundPercent !== null
        )
      return Number(b.depositAmount) > 0 && !hasPolicy
      })
    }

    // 3. Lọc theo ngày check-in (reservationTime)
    if (dateFilter === 'TODAY') {
      const todayStr = new Date().toDateString()
      list = list.filter(b => new Date(b.reservationTime).toDateString() === todayStr)
    } else if (dateFilter === 'UPCOMING') {
      const now = new Date().getTime()
      list = list.filter(b => new Date(b.reservationTime).getTime() >= now)
    }

    return list
  }, [bookings, filter, typeFilter, dateFilter])

  const totalPages = Math.ceil(filteredbookings.length / pageSize) || 1
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredbookings.slice(start, start + pageSize)
  }, [filteredbookings, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [filter, typeFilter, dateFilter])

  const load = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 200)
  }

  useEffect(() => {
    load()
  }, [filter, bookings, typeFilter, dateFilter])

  const handleOpenCancelModal = (booking) => {
    setSelectedBookingForCancel(booking)
    
    const snapshot = booking.policySnapshot
    const hasPolicy = snapshot && (
      snapshot.freeCancellationHours !== null || 
      snapshot.freeRefundPercent !== null || 
      snapshot.lateRefundPercent !== null || 
      snapshot.noShowRefundPercent !== null
    )

    if (hasPolicy && Number(booking.depositAmount) > 0) {
      const reservationTime = new Date(booking.reservationTime).getTime()
      const now = new Date().getTime()
      const diffHours = (reservationTime - now) / (1000 * 60 * 60)

      let refundPercent = 0
      let ruleType = ''
      const deposit = booking.depositAmount || 0
      const freeHours = snapshot.freeCancellationHours || 0

      if (diffHours >= freeHours) {
        refundPercent = snapshot.freeRefundPercent || 0
        ruleType = `Trước giờ hẹn trên ${freeHours} tiếng (Miễn phí / Hoàn tiền theo chính sách)`
      } else {
        refundPercent = snapshot.lateRefundPercent || 0
        ruleType = `Hủy muộn (Dưới ${freeHours} tiếng trước giờ hẹn)`
      }

      const refundAmount = (deposit * refundPercent) / 100

      setCancellationInfo({
        hasPolicy: true,
        diffHours: diffHours.toFixed(1),
        refundPercent,
        refundAmount,
        deposit,
        ruleType,
        snapshot
      })
    } else {
      setCancellationInfo({ hasPolicy: false })
    }

    setCancelModalOpen(true)
  }

  const confirmCancelBooking = async () => {
    if (!selectedBookingForCancel) return
    try {
      await bookingApi.cancel(selectedBookingForCancel.id, { cancelledByRestaurant: true })
      toast.success('Đã huỷ đơn thành công!')
      setCancelModalOpen(false)
      setSelectedBookingForCancel(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi huỷ đơn')
    }
  }

  const doAction = async (bookingId, action) => {
    try {
      if (action === 'check-in')  await bookingApi.checkIn(bookingId)
      if (action === 'check-out') await bookingApi.checkOut(bookingId)
      if (action === 'no-show')   await bookingApi.cancel(bookingId, { cancelledByRestaurant: false, reason: 'No-show' })
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
        <div className="flex gap-2" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
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

        {/* Sub-filter theo loại cọc / chính sách hủy */}
        <div className="flex gap-2" style={{ marginBottom: '.75rem', flexWrap: 'wrap' }}>
          {TYPE_FILTERS.map(tf => (
            <button key={tf.key} onClick={() => setTypeFilter(tf.key)}
              style={{ padding: '.3rem .75rem', borderRadius: 8, fontSize: '.78rem', fontWeight: 500,
                background: typeFilter === tf.key ? '#374151' : '#f3f4f6',
                color: typeFilter === tf.key ? '#fff' : '#4b5563',
                border: 'none' }}>
              {tf.label}
            </button>
          ))}
        </div>

        {/* Sub-filter theo thời gian / ngày check-in */}
        <div className="flex gap-2" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Thời gian:</span>
          {DATE_FILTERS.map(df => (
            <button key={df.key} onClick={() => setDateFilter(df.key)}
              style={{ padding: '.3rem .75rem', borderRadius: 8, fontSize: '.78rem', fontWeight: 500,
                background: dateFilter === df.key ? 'var(--brand)' : '#f3f4f6',
                color: dateFilter === df.key ? '#fff' : '#4b5563',
                border: 'none' }}>
              {df.label}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p>}

        {!loading && filteredbookings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Không có đặt bàn nào thỏa mãn điều kiện lọc.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
          {paginatedBookings.map(b => {
            const meta = STATUS_META[b.status] || { label: b.status, badge: 'badge-gray', actions: [] }
            const s = b.policySnapshot
            const hasPolicy = s && (s.freeCancellationHours !== null || s.freeRefundPercent !== null || s.lateRefundPercent !== null || s.noShowRefundPercent !== null)

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

                <div style={{ display: 'flex', gap: '.5rem', fontSize: '.87rem', marginBottom: '.875rem', flexWrap: 'wrap', flexDirection: 'column' }}>
                  <p>
                    <Armchair size={16} style={{ verticalAlign: '-3px' }} /> Bàn: {b.tables?.map((table, index) => (
                          <strong key={table.id || index}>
                            {table.tableName}
                            {index < b.tables.length - 1 ? ', ' : ''}
                          </strong>
                        ))}
                  </p>
                  <p><Users size={16} style={{ verticalAlign: '-3px' }} /> Khách: <strong>{b.guestCount}</strong></p>
                  <p><Clock size={16} style={{ verticalAlign: '-3px' }} /> <strong>{new Date(b.reservationTime).toLocaleString('vi-VN')}</strong></p>
                  {b.depositAmount > 0 && (
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span><Wallet size={16} style={{ verticalAlign: '-3px' }} /> Cọc: <strong>{Number(b.depositAmount).toLocaleString('vi-VN')}₫</strong></span>
                      {hasPolicy ? (
                        <span style={{ fontSize: '.78rem', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          Có chính sách hủy (Miễn phí trước {s.freeCancellationHours}h - Hoàn {s.freeRefundPercent}%)
                        </span>
                      ) : (
                        <span style={{ fontSize: '.78rem', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          Không có chính sách hủy cọc
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {meta.actions.includes('check-in') && (
                    <button className="btn-primary btn-sm" onClick={() => doAction(b.id, 'check-in')}>
                      <Check size={15} style={{ verticalAlign: '-2px' }} /> Check-in
                    </button>
                  )}
                  {meta.actions.includes('check-out') && (
                    <button className="btn-primary btn-sm" onClick={() => doAction(b.id, 'check-out')}>
                      <DoorOpen size={15} style={{ verticalAlign: '-2px' }} /> Check-out & Hoàn tất
                    </button>
                  )}
                  {meta.actions.includes('no-show') && (
                    <button className="btn-danger btn-sm" onClick={() => doAction(b.id, 'no-show')}>
                      <X size={15} style={{ verticalAlign: '-2px' }} /> Chốt No-show
                    </button>
                  )}
                  {b.status === 'CONFIRMED' && (
                    <button className="btn-outline btn-sm" onClick={() => handleOpenCancelModal(b)}>
                      <Ban size={15} style={{ verticalAlign: '-2px' }} /> Nhà hàng huỷ
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Thanh phân trang FE */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between" style={{ marginTop: '1.5rem', padding: '0.5rem 0' }}>
            <span style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>
              Trang {currentPage} / {totalPages} (Tổng số {filteredbookings.length} đơn)
            </span>
            <div className="flex gap-1">
              <button 
                className="btn-outline btn-sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                <ChevronLeft size={16} /> Trước
              </button>
              <button 
                className="btn-outline btn-sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                Sau <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL XÁC NHẬN HỦY VÀ HOÀN CỌC --- */}
      {cancelModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, background: '#fff', padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: '#111827' }}>
              Xác nhận hủy đặt bàn #{selectedBookingForCancel?.id}
            </h3>

            {cancellationInfo?.hasPolicy ? (
              <div style={{ background: '#f9fafb', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '.9rem' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontWeight: 600, color: 'var(--brand)', marginBottom: '.5rem' }}>
                  <AlertCircle size={18} /> Áp dụng chính sách hoàn cọc
                </p>
                <p style={{ marginBottom: '.3rem' }}>Thời gian còn lại: <strong>{cancellationInfo.diffHours} giờ</strong> so với giờ hẹn.</p>
                <p style={{ marginBottom: '.3rem' }}>Quy tắc: <em>{cancellationInfo.ruleType}</em></p>
                <p style={{ marginBottom: '.3rem' }}>Tiền cọc ban đầu: <strong>{Number(cancellationInfo.deposit).toLocaleString('vi-VN')}₫</strong></p>
                <div style={{ marginTop: '.5rem', padding: '8px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                  <p style={{ color: '#047857', fontWeight: 700, fontSize: '.9rem' }}>
                    Số tiền hoàn lại cho khách ({cancellationInfo.refundPercent}%): {Number(cancellationInfo.refundAmount).toLocaleString('vi-VN')}₫
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '.95rem' }}>
                Đơn này không có cấu hình chính sách hoàn cọc (hoặc không có tiền cọc). Bạn có chắc chắn muốn hủy đơn này không?
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline btn-sm" onClick={() => setCancelModalOpen(false)}>
                Đóng
              </button>
              <button type="button" className="btn-danger btn-sm" onClick={confirmCancelBooking}>
                Xác nhận hủy đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}