import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { bookingApi, restaurantApi, systemPolicyApi } from '../../api'
import { Armchair, Users, Clock, Wallet, Check, DoorOpen, X, Ban, AlertCircle, ChevronLeft, ChevronRight, CalendarPlus, ShieldCheck } from 'lucide-react'
import wsService from '../../api/socket'

const STATUS_META = {
  ALL: { label: 'Tất cả trạng thái', badge: 'badge-gray', actions: [] },
  CONFIRMED: { label: 'Đã xác nhận', badge: 'badge-green', actions: ['check-in'] },
  CHECKED_IN: { label: 'Đang phục vụ', badge: 'badge-blue', actions: ['check-out'] },
  PENDING_NO_SHOW: { label: 'Nghi No-show', badge: 'badge-yellow', actions: ['check-in', 'no-show'] },
  COMPLETED: { label: 'Hoàn tất', badge: 'badge-gray', actions: [] },
  NO_SHOW: { label: 'No-show', badge: 'badge-red', actions: [] },
  CANCELLED_BY_CUSTOMER: { label: 'KH huỷ', badge: 'badge-red', actions: [] },
  CANCELLED_BY_RESTAURANT: { label: 'NH huỷ', badge: 'badge-red', actions: [] },
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

export default function ManageBookings({ branchId }) {
  console.log("branchId ", branchId);

  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const [loading, setLoading] = useState(true)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null)
  const [cancellationInfo, setCancellationInfo] = useState(null)
  const [restaurantCancelPolicy, setRestaurantCancelPolicy] = useState({ minHoursBeforeReservation: 24, enabled: true })

  // 🚀 ĐÃ BỔ SUNG: State dạng Set lưu danh sách các ID đơn mới nhận qua WebSocket để giữ badge mark
  const [newBookingIds, setNewBookingIds] = useState(new Set())

  // Tải quy định thời gian tối thiểu nhà hàng được huỷ đơn từ System Policy
  useEffect(() => {
    systemPolicyApi.getRestaurantCancellationLeadTime()
      .then(res => {
        if (res.data?.data) {
          setRestaurantCancelPolicy(res.data.data)
        }
      })
      .catch(err => console.error('Lỗi tải quy định huỷ đơn nhà hàng:', err))
  }, [])

  // Hàm gọi API lấy danh sách và sắp xếp đơn mới nhất lên đầu (theo id giảm dần)
  const fetchBookings = async () => {
    try {
      setLoading(true)
      const res = await restaurantApi.UpcomingBooking(branchId)
      const rawList = res.data?.data || res || []

      // Sắp xếp đơn mới nhất lên đầu (ID lớn nhất / mới tạo nhất)
      const sortedList = rawList.sort((a, b) => b.id - a.id)

      setBookings(sortedList)
    } catch (err) {
      toast.error('Không thể tải danh sách đặt bàn')
    } finally {
      setLoading(false)
    }
  }

  // Gọi API lần đầu khi mở trang hoặc đổi branchId
  useEffect(() => {
    if (branchId) {
      fetchBookings()
    }
  }, [branchId])

  // Lắng nghe WebSocket Realtime: Bắn toast, mark đơn mới và fetch lại danh sách
  useEffect(() => {
    if (!branchId) return

    wsService.connect(() => {
      const subscription = wsService.subscribe(`/topic/branch/${branchId}/bookings`, (data) => {
        const newId = typeof data === 'object' ? (data.id || data.bookingId) : data
        console.log("Nhận được thông báo thay đổi đặt bàn realtime, ID:", newId)

        if (newId) {
          // Thêm ID mới vào danh sách đánh dấu (giữ nguyên không tự xóa)
          setNewBookingIds(prev => new Set(prev).add(newId))
        }

        toast.success(`📥 Có đơn đặt bàn mới #${newId || ''} vừa được tạo!`, {
          duration: 15000,
          position: 'top-right',
        })

        fetchBookings()
      })

      return () => {
        if (subscription) subscription.unsubscribe()
      }
    })
  }, [branchId])

  // Hàm xóa trạng thái mark khi đơn đã được tương tác/xử lý
  const markAsHandled = (bookingId) => {
    setNewBookingIds(prev => {
      const next = new Set(prev)
      next.delete(bookingId)
      return next
    })
  }
  
  // Logic lọc dữ liệu
  const filteredbookings = useMemo(() => {
    let list = bookings || []

    if (filter !== 'ALL') {
      list = list.filter(b => b.status === filter)
    }

    if (typeFilter === 'HAS_DEPOSIT') {
      list = list.filter(b => {
        const deposit = b.depositAmount ?? b.policySnapshotDto?.depositValue ?? b.policySnapshot?.depositValue ?? 0
        return Number(deposit) > 0
      })
    } else if (typeFilter === 'WITH_CANCELLATION_POLICY') {
      list = list.filter(b => {
        const s = b.policySnapshotDto || b.policySnapshot
        const deposit = b.depositAmount ?? s?.depositValue ?? 0
        return Number(deposit) > 0 && s && (
          s.freeCancellationHours !== null ||
          s.freeRefundPercent !== null ||
          s.lateRefundPercent !== null ||
          s.noShowRefundPercent !== null
        )
      })
    } else if (typeFilter === 'NO_CANCELLATION_POLICY') {
      list = list.filter(b => {
        const s = b.policySnapshotDto || b.policySnapshot
        const deposit = b.depositAmount ?? s?.depositValue ?? 0
        const hasPolicy = s && (
          s.freeCancellationHours !== null ||
          s.freeRefundPercent !== null ||
          s.lateRefundPercent !== null ||
          s.noShowRefundPercent !== null
        )
        return Number(deposit) > 0 && !hasPolicy
      })
    }

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

  // Xử lý mở Modal hủy đơn
  const handleOpenCancelModal = (booking) => {
    setSelectedBookingForCancel(booking)

    const reservationTime = new Date(booking.reservationTime).getTime()
    const now = new Date().getTime()
    const diffHours = (reservationTime - now) / (1000 * 60 * 60)

    const minHours = restaurantCancelPolicy?.enabled ? (restaurantCancelPolicy.minHoursBeforeReservation ?? 24) : 0
    const isTooLate = restaurantCancelPolicy?.enabled && diffHours > 0 && diffHours < minHours

    const snapshot = booking.policySnapshotDto || booking.policySnapshot
    const hasPolicy = snapshot && (
      snapshot.freeCancellationHours !== null ||
      snapshot.freeRefundPercent !== null ||
      snapshot.lateRefundPercent !== null ||
      snapshot.noShowRefundPercent !== null
    )

    const deposit = booking.depositAmount ?? snapshot?.depositValue ?? 0

    if (hasPolicy && Number(deposit) > 0) {
      let refundPercent = 0
      let ruleType = ''
      const freeHours = snapshot.freeCancellationHours || 0

      if (booking.inGracePeriod) {
        refundPercent = 100
        const remMins = Math.max(1, Math.ceil((booking.gracePeriodRemainingSeconds || 0) / 60))
        ruleType = `Chính sách ân hạn Dabana (Vừa CONFIRMED, còn ~${remMins} phút ân hạn)`
      } else if (diffHours >= freeHours) {
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
        isTooLate,
        minHours,
        refundPercent,
        refundAmount,
        deposit,
        ruleType,
        snapshot
      })
    } else {
      setCancellationInfo({
        hasPolicy: false,
        diffHours: diffHours.toFixed(1),
        isTooLate,
        minHours
      })
    }

    setCancelModalOpen(true)
  }

  // Xác nhận hủy đơn
  const confirmCancelBooking = async () => {
    if (!selectedBookingForCancel) return
    try {
      await bookingApi.cancel(selectedBookingForCancel.id, { cancelledByRestaurant: true })
      toast.success('Đã huỷ đơn thành công!')
      
      // 🚀 Xóa trạng thái mark mới khi nhà hàng đã xử lý hủy đơn này
      markAsHandled(selectedBookingForCancel.id)

      setCancelModalOpen(false)
      setSelectedBookingForCancel(null)
      fetchBookings()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi huỷ đơn')
    }
  }

  // Thực hiện các action (check-in, check-out, no-show)
  const doAction = async (bookingId, action) => {
    try {
      if (action === 'check-in') await bookingApi.checkIn(bookingId)
      if (action === 'check-out') await bookingApi.checkOut(bookingId)
      if (action === 'no-show') await bookingApi.cancel(bookingId, { cancelledByRestaurant: false, reason: 'No-show' })
      
      toast.success('Cập nhật thành công!')
      
      // 🚀 Xóa trạng thái mark mới khi đã bấm tương tác xử lý đơn
      markAsHandled(bookingId)

      fetchBookings()
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
              style={{
                padding: '.4rem .875rem', borderRadius: 99, fontSize: '.82rem', fontWeight: 600,
                background: filter === k ? 'var(--brand)' : 'var(--white)',
                color: filter === k ? '#fff' : 'var(--text-muted)',
                border: '1.5px solid', borderColor: filter === k ? 'var(--brand)' : 'var(--border)'
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Sub-filter theo loại cọc / chính sách hủy */}
        <div className="flex gap-2" style={{ marginBottom: '.75rem', flexWrap: 'wrap' }}>
          {TYPE_FILTERS.map(tf => (
            <button key={tf.key} onClick={() => setTypeFilter(tf.key)}
              style={{
                padding: '.3rem .75rem', borderRadius: 8, fontSize: '.78rem', fontWeight: 500,
                background: typeFilter === tf.key ? '#374151' : '#f3f4f6',
                color: typeFilter === tf.key ? '#fff' : '#4b5563',
                border: 'none'
              }}>
              {tf.label}
            </button>
          ))}
        </div>

        {/* Sub-filter theo thời gian / ngày check-in */}
        <div className="flex gap-2" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Thời gian:</span>
          {DATE_FILTERS.map(df => (
            <button key={df.key} onClick={() => setDateFilter(df.key)}
              style={{
                padding: '.3rem .75rem', borderRadius: 8, fontSize: '.78rem', fontWeight: 500,
                background: dateFilter === df.key ? 'var(--brand)' : '#f3f4f6',
                color: dateFilter === df.key ? '#fff' : '#4b5563',
                border: 'none'
              }}>
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
            const s = b.policySnapshotDto || b.policySnapshot
            const hasPolicy = s && (s.freeCancellationHours !== null || s.freeRefundPercent !== null || s.lateRefundPercent !== null || s.noShowRefundPercent !== null)
            const depositAmount = b.depositAmount ?? s?.depositValue ?? 0

            // 🚀 Kiểm tra đơn có nằm trong danh sách được mark mới qua WebSocket không
            const isNewIncoming = newBookingIds.has(b.id)

            return (
              <div
                key={b.id}
                className="card"
                style={{
                  border: isNewIncoming ? '2px solid #10b981' : '1px solid var(--border)',
                  backgroundColor: isNewIncoming ? '#f0fdf4' : 'var(--white)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '.625rem' }}>
                  <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700 }}>#{b.id} – </span>
                    <span style={{ fontWeight: 600 }}>{b.name || 'Khách hàng'}</span>
                    <span style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>
                      {b.contactPhone}
                    </span>
                    {/* Badge đánh dấu đơn mới realtime */}
                    {isNewIncoming && (
                      <span style={{ background: '#10b981', color: '#fff', fontSize: '.7rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}>
                        ✨ MỚI TẠO
                      </span>
                    )}
                    {/* Badge thời gian ân hạn huỷ hoàn cọc */}
                    {b.inGracePeriod && (
                      <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: '.7rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <ShieldCheck size={12} /> ÂN HẠN ({Math.max(1, Math.ceil((b.gracePeriodRemainingSeconds || 0) / 60))}p)
                      </span>
                    )}
                  </div>
                  <span className={`badge ${meta.badge}`}>{meta.label}</span>
                </div>

                <div style={{ display: 'flex', gap: '.4rem', fontSize: '.87rem', marginBottom: '.875rem', flexDirection: 'column' }}>
                  {/* Ngày tạo đơn */}
                  {b.createdAt && (
                    <p style={{ color: '#4b5563', fontSize: '.82rem' }}>
                      <CalendarPlus size={15} style={{ verticalAlign: '-3px', marginRight: '4px' }} />
                      Ngày tạo đơn: <strong>{new Date(b.createdAt).toLocaleString('vi-VN')}</strong>
                    </p>
                  )}
                  <p>
                    <Armchair size={16} style={{ verticalAlign: '-3px', marginRight: '4px' }} /> Bàn: {b.tables?.map((table, index) => (
                      <strong key={table.id || index}>
                        {table.tableName}
                        {index < b.tables.length - 1 ? ', ' : ''}
                      </strong>
                    ))}
                  </p>
                  <p><Users size={16} style={{ verticalAlign: '-3px', marginRight: '4px' }} /> Khách: <strong>{b.guestCount}</strong></p>
                  <p><Clock size={16} style={{ verticalAlign: '-3px', marginRight: '4px' }} /> Thời gian hẹn: <strong>{new Date(b.reservationTime).toLocaleString('vi-VN')}</strong></p>

                  {depositAmount > 0 && (
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '4px' }}>
                      <span><Wallet size={16} style={{ verticalAlign: '-3px', marginRight: '4px' }} /> Cọc: <strong>{Number(depositAmount).toLocaleString('vi-VN')}₫</strong></span>
                      {hasPolicy ? (
                        <span style={{ fontSize: '.78rem', background: '#e6f4ea', color: '#137333', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
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

            {cancellationInfo?.isTooLate ? (
              <div style={{ background: '#FEF2F2', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1.5px solid #FECACA', color: '#991B1B' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontWeight: 700, margin: '0 0 .35rem 0', fontSize: '.92rem' }}>
                  <Ban size={18} /> Không thể huỷ đơn đặt bàn này
                </p>
                <p style={{ fontSize: '.84rem', margin: 0, lineHeight: '1.5' }}>
                  Theo quy định của hệ thống Dabana, nhà hàng chỉ được phép huỷ đơn của khách trước giờ hẹn tối thiểu <strong>{cancellationInfo.minHours} tiếng</strong>. Hiện tại chỉ còn khoảng <strong>{cancellationInfo.diffHours} tiếng</strong> trước thời gian nhận bàn.
                </p>
              </div>
            ) : cancellationInfo?.hasPolicy ? (
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
              <button
                type="button"
                className="btn-danger btn-sm"
                disabled={cancellationInfo?.isTooLate}
                onClick={confirmCancelBooking}
                style={{ opacity: cancellationInfo?.isTooLate ? 0.5 : 1, cursor: cancellationInfo?.isTooLate ? 'not-allowed' : 'pointer' }}
              >
                Xác nhận hủy đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}