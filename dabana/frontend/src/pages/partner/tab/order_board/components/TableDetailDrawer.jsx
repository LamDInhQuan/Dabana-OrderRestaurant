import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { bookingApi, tableApi, extraOrderApi, preorderItemApi } from '../../../../../api'
import { TABLE_STATUS_META, DEFAULT_TABLE_STATUS_META, BOOKING_STATUS_LABEL, formatMoney, formatTime } from './statusMeta'
import MenuPickerModal from './MenuPickerModal'
import PaymentConfirmModal from './PaymentConfirmModal'

const MANUAL_STATUS_OPTIONS = [
  { status: 1, label: 'Trống' },
  { status: 4, label: 'Dọn dẹp' },
  { status: 5, label: 'Bảo trì' },
]

export default function TableDetailDrawer({ table, branchId, onClose, onChanged }) {
  const open = !!table

  const [savingRowId, setSavingRowId] = useState(null) // extraOrderId dang +/-/xoa
  const [checking, setChecking] = useState(false)
  const [changingStatus, setChangingStatus] = useState(null) // status code dang doi toi
  const [walkInGuestCount, setWalkInGuestCount] = useState(1)
  const [creatingWalkIn, setCreatingWalkIn] = useState(false)
  const [menuPickerOpen, setMenuPickerOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

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
  // Khach vang lai: chi can ban dang THUC SU Trong (status 1) - khop dung
  // BookingService#createWalkIn o backend (chan neu table.status != EMPTY).
  // KHONG con phu thuoc vao co booking (CONFIRMED sap toi) hay khong nua - neu
  // co, van chi canh bao ben duoi (activeBooking), khong khoa hanh dong.
  const canReceiveWalkIn = table?.status === 1

  // Nap thuc don gio nam trong MenuPickerModal (tu-quan-ly, chi mo khi can) -
  // thay cho useEffect nap truoc + <select> phang o day.

  useEffect(() => {
    setWalkInGuestCount(1)
  }, [table?.tableId])

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

  // Gop cac mon giong nhau (cung ten + cung gia - phong khi du lieu cu truoc
  // fix gop-luc-them van con dong trung lap, hoac gop chung preorder +
  // extra order neu trung ten mon) thanh 1 dong duy nhat cho hoa don.
  const buildInvoiceLines = () => {
    const map = new Map()
    for (const item of orders) {
      const key = `${item.itemName}__${item.price}`
      const line = map.get(key)
      if (line) {
        line.quantity += item.quantity
        line.subtotal += item.price * item.quantity
      } else {
        map.set(key, { itemName: item.itemName, price: item.price, quantity: item.quantity, subtotal: item.price * item.quantity })
      }
    }
    return Array.from(map.values())
  }

  const printInvoice = () => {
    const lines = buildInvoiceLines()
    const rowsHtml = lines.map((l) => `
      <tr>
        <td>${l.itemName}</td>
        <td style="text-align:center">${l.quantity}</td>
        <td style="text-align:right">${formatMoney(l.price)}</td>
        <td style="text-align:right">${formatMoney(l.subtotal)}</td>
      </tr>
    `).join('')

    const html = `
      <html>
        <head>
          <title>Hoá đơn - ${table.tableName}</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: 'Courier New', monospace; padding: 16px; max-width: 380px; margin: 0 auto; }
            h1 { font-size: 1.05rem; text-align: center; margin: 0 0 4px; }
            .sub { text-align: center; font-size: .78rem; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: .8rem; }
            th { text-align: left; border-bottom: 1px dashed #000; padding-bottom: 4px; }
            td { padding: 3px 0; vertical-align: top; }
            .total-row td { border-top: 1px dashed #000; font-weight: bold; padding-top: 6px; }
            .footer { text-align: center; margin-top: 16px; font-size: .76rem; }
          </style>
        </head>
        <body>
          <h1>HOÁ ĐƠN THANH TOÁN</h1>
          <div class="sub">
            ${table.tableName}${booking?.contactName ? ' · ' + booking.contactName : ''}<br/>
            ${new Date().toLocaleString('vi-VN')}
          </div>
          <table>
            <thead>
              <tr><th>Món</th><th style="text-align:center">SL</th><th style="text-align:right">Đơn giá</th><th style="text-align:right">T.Tiền</th></tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="total-row"><td colspan="3">TỔNG CỘNG</td><td style="text-align:right">${formatMoney(table.estimatedTotal)}</td></tr>
            </tbody>
          </table>
          <div class="footer">Cảm ơn quý khách!</div>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank', 'width=420,height=640')
    if (!printWindow) {
      toast.error('Trình duyệt đã chặn cửa sổ in, vui lòng cho phép popup')
      return
    }
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
    }
  }

  const handleOpenPayment = () => setPaymentModalOpen(true)

  const handlePaymentConfirmed = () => {
    printInvoice()
    setPaymentModalOpen(false)
    toast.success('Đã thanh toán & check-out, bàn chuyển sang Dọn dẹp')
    onChanged?.()
    onClose?.()
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

  // Khach vang lai: tao booking CHECKED_IN ngay cho ban dang Trong, khong qua
  // giu ban/dat coc nhu luong dat online (POST /api/bookings/walk-in phia BE).
  const handleCreateWalkIn = async (e) => {
    e.preventDefault()
    const guestCount = Number(walkInGuestCount) || 1
    setCreatingWalkIn(true)
    try {
      await bookingApi.createWalkIn({
        branchId,
        tableIds: [table.tableId],
        guestCount,
      })
      toast.success('Đã nhận khách vãng lai, bàn chuyển sang Đang phục vụ')
      onChanged?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Nhận khách vãng lai thất bại')
    } finally {
      setCreatingWalkIn(false)
    }
  }

  // Nhan gio mon tu MenuPickerModal (co the nhieu dong) - BE chua co endpoint
  // them hang loat nen goi LAN LUOT tung dong (await tuan tu, KHONG ban song
  // song): ban song song se khien nhieu request cung 401/refresh-token mot
  // luc (neu access token vua het han), token refresh bi dua nhau va chi 1
  // request "thang" -> cac dong con lai deu that bai dong loat du menu item
  // hop le. Van gom loi tung dong (khong dung throw som) de 1 dong loi (vd
  // het mon) khong lam mat cac dong da them thanh cong truoc do.
  const handleConfirmAddItems = async (cartLines) => {
    const results = []
    for (const line of cartLines) {
      try {
        await extraOrderApi.addItem({
          bookingId: booking.bookingId,
          menuItemId: line.id,
          quantity: line.quantity,
        })
        results.push({ status: 'fulfilled' })
      } catch (err) {
        results.push({ status: 'rejected', reason: err })
      }
    }
    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length === 0) {
      toast.success(`Đã thêm ${cartLines.length} món`)
    } else if (failed.length < cartLines.length) {
      toast.error(`Thêm được ${cartLines.length - failed.length}/${cartLines.length} món, một số món bị lỗi`)
    } else {
      toast.error('Thêm món thất bại')
    }
    onChanged?.()
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
    <>
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

          {/* Nhan khach vang lai - chi khi ban dang Trong va chua gan booking nao */}
          {canReceiveWalkIn && (
            <div>
              <h3 style={{ fontSize: '.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: '#8A6E57', marginBottom: '.5rem' }}>
                Nhận khách vãng lai
              </h3>
              {booking && (
                <div style={{
                  fontSize: '.8rem', color: '#B45309', background: 'rgba(180,83,9,.08)',
                  borderRadius: 8, padding: '.6rem .75rem', marginBottom: '.6rem', fontWeight: 600,
                }}>
                  ⏰ Bàn này có khách đặt trước lúc {formatTime(booking.reservationTime)}
                  ({booking.guestCount} khách) - cân nhắc xếp bàn khác nếu gần giờ.
                </div>
              )}
              <form onSubmit={handleCreateWalkIn} className="card flex items-center gap-2" style={{ padding: '.9rem', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '.82rem', color: '#8A6E57' }}>Số khách</label>
                <input
                  type="number" min={1} value={walkInGuestCount}
                  onChange={(e) => setWalkInGuestCount(e.target.value)}
                  style={{ width: 70 }}
                />
                <button type="submit" className="btn-primary btn-sm" disabled={creatingWalkIn}>
                  {creatingWalkIn ? 'Đang nhận khách...' : '✅ Nhận khách vào bàn'}
                </button>
              </form>
              <p style={{ fontSize: '.72rem', color: '#8A6E57', marginTop: '.4rem' }}>
                * Bàn sẽ chuyển sang Đang phục vụ ngay, không cần đặt cọc/xác nhận như đặt bàn online.
              </p>
            </div>
          )}

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

          {/* Them mon moi - chi khi ban dang CHECKED_IN (bao gom ca sau khi vua nhan khach vang lai) */}
          {canAddOrder && (
            <div>
              <h3 style={{ fontSize: '.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: '#8A6E57', marginBottom: '.5rem' }}>
                Thêm món
              </h3>
              <button className="btn-primary btn-sm" onClick={() => setMenuPickerOpen(true)}>
                🍽 Mở thực đơn để chọn món
              </button>
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
              <button className="btn-outline" style={{ width: '100%', marginBottom: '.5rem' }} onClick={printInvoice}>
                🖨 In hoá đơn
              </button>
            )}
            {canCheckOut && (
              <button className="btn-primary" style={{ width: '100%' }} disabled={checking} onClick={handleOpenPayment}>
                {`🚪 Thanh toán & Check-out · ${formatMoney(table.estimatedTotal)}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>

    <MenuPickerModal
      open={menuPickerOpen}
      branchId={branchId}
      tableName={table.tableName}
      onClose={() => setMenuPickerOpen(false)}
      onConfirm={handleConfirmAddItems}
    />

    <PaymentConfirmModal
      open={paymentModalOpen}
      bookingId={booking?.bookingId}
      tableName={table.tableName}
      onClose={() => setPaymentModalOpen(false)}
      onConfirmed={handlePaymentConfirmed}
    />
    </>
  )
}