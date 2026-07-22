import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { bookingApi, tableApi, extraOrderApi, preorderItemApi, menuApi } from '../../../../../api'
import { TABLE_STATUS_META, DEFAULT_TABLE_STATUS_META, BOOKING_STATUS_LABEL, formatMoney, formatTime } from './statusMeta'

const MANUAL_STATUS_OPTIONS = [
  { status: 1, label: 'Trống' },
  { status: 4, label: 'Dọn dẹp' },
  { status: 5, label: 'Bảo trì' },
]

export default function TableDetailDrawer({ table, branchId, onClose, onChanged }) {
  const open = !!table

  const [menuItems, setMenuItems] = useState([]) // flatten, chi lay mon dang SELLING
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [newItem, setNewItem] = useState({ menuItemId: '', quantity: 1 })
  const [savingRowId, setSavingRowId] = useState(null) // extraOrderId dang +/-/xoa
  const [addingItem, setAddingItem] = useState(false)
  const [checking, setChecking] = useState(false)
  const [changingStatus, setChangingStatus] = useState(null) // status code dang doi toi

  const booking = table?.activeBooking || null
  const orders = table?.orders || []
  const canAddOrder = booking?.status === 'CHECKED_IN'
  const canCheckIn = booking?.status === 'CONFIRMED'
  const canCheckOut = booking?.status === 'CHECKED_IN'
  const canChangeStatusManually = !booking
  // Mon dat truoc sua/xoa duoc rong hon mon goi them: cho phep ca khi booking
  // moi CONFIRMED (chua check-in), khong chi luc CHECKED_IN - khop dung
  // BookingItemService#assertBookingEditable o backend.
  const canEditPreorderItem = booking?.status === 'CONFIRMED' || booking?.status === 'CHECKED_IN'
  const canEditExtraOrder = booking?.status === 'CHECKED_IN'

  // Nap thuc don (chi mon dang ban) khi mo drawer cho 1 ban co the goi them mon
  useEffect(() => {
    if (!open || !canAddOrder || !branchId) return
    setLoadingMenu(true)
    menuApi.getByBranch(branchId)
      .then((res) => {
        const categories = res.data || []
        const flat = categories.flatMap((cat) => (cat.items || [])
          .filter((it) => it.status === 'SELLING')
          .map((it) => ({ id: it.id, name: it.itemName, price: Number(it.price), category: cat.categoryName })))
        setMenuItems(flat)
      })
      .catch(() => setMenuItems([]))
      .finally(() => setLoadingMenu(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canAddOrder, branchId])

  useEffect(() => {
    setNewItem({ menuItemId: '', quantity: 1 })
  }, [table?.tableId])

  const menuItemsByCategory = useMemo(() => {
    const map = {}
    for (const it of menuItems) {
      if (!map[it.category]) map[it.category] = []
      map[it.category].push(it)
    }
    return map
  }, [menuItems])

  if (!open) return null

  const statusMeta = TABLE_STATUS_META[table.status] || DEFAULT_TABLE_STATUS_META

  const handleCheckIn = async () => {
    setChecking(true)
    try {
      await bookingApi.checkIn(booking.bookingId)
      toast.success('Đã check-in bàn')
      onChanged?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in thất bại')
    } finally {
      setChecking(false)
    }
  }

  const handleCheckOut = async () => {
    if (!window.confirm(`Xác nhận thanh toán & check-out ${table.tableName}?`)) return
    setChecking(true)
    try {
      await bookingApi.checkOut(booking.bookingId)
      toast.success('Đã check-out, bàn chuyển sang Dọn dẹp')
      onChanged?.()
      onClose?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out thất bại')
    } finally {
      setChecking(false)
    }
  }

  const handleChangeStatus = async (status) => {
    setChangingStatus(status)
    try {
      await tableApi.updateStatus(table.tableId, status)
      toast.success('Đã đổi trạng thái bàn')
      onChanged?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi trạng thái thất bại')
    } finally {
      setChangingStatus(null)
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    if (!newItem.menuItemId) { toast.error('Vui lòng chọn món'); return }
    setAddingItem(true)
    try {
      await extraOrderApi.addItem({
        bookingId: booking.bookingId,
        menuItemId: Number(newItem.menuItemId),
        quantity: Number(newItem.quantity) || 1,
      })
      toast.success('Đã thêm món')
      setNewItem({ menuItemId: '', quantity: 1 })
      onChanged?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thêm món thất bại')
    } finally {
      setAddingItem(false)
    }
  }

  const apiForSource = (source) => (source === 'PREORDER' ? preorderItemApi : extraOrderApi)

  const handleChangeQuantity = async (item, nextQty) => {
    if (nextQty < 1) return
    setSavingRowId(item.id)
    try {
      await apiForSource(item.source).updateQuantity(item.id, nextQty)
      onChanged?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sửa số lượng thất bại')
    } finally {
      setSavingRowId(null)
    }
  }

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Xoá "${item.itemName}" khỏi đơn hàng?`)) return
    setSavingRowId(item.id)
    try {
      await apiForSource(item.source).deleteItem(item.id)
      toast.success('Đã xoá món')
      onChanged?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xoá món thất bại')
    } finally {
      setSavingRowId(null)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 300 }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 460,
          borderRadius: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0,
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E8DECE', flexShrink: 0 }}>
          <div className="flex items-center justify-between">
            <h2 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{table.tableName}</h2>
            <button className="btn-outline btn-sm" onClick={onClose}>✕ Đóng</button>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '.3rem', marginTop: '.4rem',
            fontSize: '.72rem', fontWeight: 700, padding: '.2rem .55rem', borderRadius: 99,
            color: statusMeta.color, background: statusMeta.bg,
          }}>
            {statusMeta.icon} {statusMeta.label}
          </span>
        </div>

        {/* Body scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Thong tin khach */}
          <div>
            <h3 style={{ fontSize: '.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: '#8A6E57', marginBottom: '.5rem' }}>
              Thông tin khách
            </h3>
            {booking ? (
              <div className="card" style={{ padding: '.9rem', fontSize: '.85rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '.2rem' }}>{booking.contactName}</div>
                <div style={{ color: '#8A6E57', marginBottom: '.3rem' }}>{booking.contactPhone}</div>
                <div style={{ color: '#8A6E57' }}>
                  🕐 {formatTime(booking.reservationTime)} · 👥 {booking.guestCount} khách
                  {' · '}<strong>{BOOKING_STATUS_LABEL[booking.status] || booking.status}</strong>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: '.9rem', fontSize: '.85rem', color: '#8A6E57', textAlign: 'center' }}>
                Bàn chưa gắn với khách đặt/đang phục vụ nào.
              </div>
            )}
          </div>

          {/* Unified Order: gop preorder + extra order */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: '.5rem' }}>
              <h3 style={{ fontSize: '.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: '#8A6E57' }}>
                Đơn hàng ({orders.length} món)
              </h3>
              <span style={{ fontWeight: 800, color: '#8B6914' }}>{formatMoney(table.estimatedTotal)}</span>
            </div>

            {orders.length === 0 ? (
              <div className="card" style={{ padding: '.9rem', fontSize: '.82rem', color: '#8A6E57', textAlign: 'center' }}>
                Chưa có món nào.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {orders.map((item) => {
                  const isPreorder = item.source === 'PREORDER'
                  const rowSaving = savingRowId === item.id
                  const canEditRow = isPreorder ? canEditPreorderItem : canEditExtraOrder
                  return (
                    <div key={`${item.source}-${item.id}`} className="card" style={{ padding: '.7rem .85rem' }}>
                      <div className="flex items-center justify-between" style={{ gap: '.5rem' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '.86rem' }}>{item.itemName}</span>
                            <span style={{
                              fontSize: '.65rem', fontWeight: 700, padding: '.1rem .4rem', borderRadius: 99,
                              color: isPreorder ? '#3B82F6' : '#8B6914',
                              background: isPreorder ? 'rgba(59,130,246,.1)' : 'rgba(201,168,76,.15)',
                            }}>
                              {isPreorder ? 'Đặt trước' : 'Gọi thêm'}
                            </span>
                          </div>
                          <div style={{ fontSize: '.76rem', color: '#8A6E57' }}>
                            {formatMoney(item.price)} × {item.quantity}
                            {!isPreorder && item.recordedByName && ` · ghi nhận bởi ${item.recordedByName}`}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexShrink: 0 }}>
                          {canEditRow ? (
                            <>
                              <button className="btn-outline btn-sm" style={{ padding: '.15rem .5rem' }}
                                disabled={rowSaving || item.quantity <= 1}
                                onClick={() => handleChangeQuantity(item, item.quantity - 1)}>−</button>
                              <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700 }}>{item.quantity}</span>
                              <button className="btn-outline btn-sm" style={{ padding: '.15rem .5rem' }}
                                disabled={rowSaving}
                                onClick={() => handleChangeQuantity(item, item.quantity + 1)}>+</button>
                              <button className="btn-outline btn-sm" style={{ padding: '.15rem .5rem', color: '#EF4444', borderColor: '#EF444455' }}
                                disabled={rowSaving}
                                onClick={() => handleDeleteItem(item)}>🗑</button>
                            </>
                          ) : (
                            <span style={{ fontWeight: 700, fontSize: '.85rem' }}>{formatMoney(item.lineTotal)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {orders.some((o) => o.source === 'PREORDER') && !canEditPreorderItem && (
              <p style={{ fontSize: '.72rem', color: '#8A6E57', marginTop: '.4rem' }}>
                * Món "Đặt trước" chỉ sửa/xoá được khi đơn đang Đã xác nhận hoặc Đang phục vụ.
              </p>
            )}
          </div>

          {/* Them mon moi - chi khi ban dang CHECKED_IN */}
          {canAddOrder && (
            <div>
              <h3 style={{ fontSize: '.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: '#8A6E57', marginBottom: '.5rem' }}>
                Thêm món
              </h3>
              <form onSubmit={handleAddItem} className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <select
                  value={newItem.menuItemId}
                  onChange={(e) => setNewItem((p) => ({ ...p, menuItemId: e.target.value }))}
                  style={{ flex: '1 1 220px' }}
                  disabled={loadingMenu}
                  required
                >
                  <option value="" disabled>{loadingMenu ? 'Đang tải thực đơn...' : 'Chọn món'}</option>
                  {Object.entries(menuItemsByCategory).map(([cat, items]) => (
                    <optgroup key={cat} label={cat}>
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>{it.name} — {formatMoney(it.price)}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <input
                  type="number" min={1} value={newItem.quantity}
                  onChange={(e) => setNewItem((p) => ({ ...p, quantity: e.target.value }))}
                  style={{ width: 70 }}
                />
                <button type="submit" className="btn-primary btn-sm" disabled={addingItem}>
                  {addingItem ? 'Đang thêm...' : '+ Thêm'}
                </button>
              </form>
            </div>
          )}

          {/* Doi trang thai thu cong - chi khi khong co booking dang active */}
          {canChangeStatusManually && (
            <div>
              <h3 style={{ fontSize: '.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: '#8A6E57', marginBottom: '.5rem' }}>
                Đổi trạng thái bàn
              </h3>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {MANUAL_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.status}
                    className={table.status === opt.status ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
                    disabled={table.status === opt.status || changingStatus === opt.status}
                    onClick={() => handleChangeStatus(opt.status)}
                  >
                    {changingStatus === opt.status ? 'Đang lưu...' : opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer: check-in / check-out */}
        {(canCheckIn || canCheckOut) && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E8DECE', flexShrink: 0 }}>
            {canCheckIn && (
              <button className="btn-primary" style={{ width: '100%' }} disabled={checking} onClick={handleCheckIn}>
                {checking ? 'Đang xử lý...' : '✅ Check-in bàn'}
              </button>
            )}
            {canCheckOut && (
              <button className="btn-primary" style={{ width: '100%' }} disabled={checking} onClick={handleCheckOut}>
                {checking ? 'Đang xử lý...' : `🚪 Thanh toán & Check-out · ${formatMoney(table.estimatedTotal)}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}