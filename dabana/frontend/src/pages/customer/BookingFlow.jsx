import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../../components/Navbar'
import { branchApi, zoneApi, tableApi, menuApi, bookingApi } from '../../api'

const STEPS = ['Chọn bàn', 'Thông tin', 'Đặt món', 'Xác nhận & Cọc']
const TABLE_STATUS_COLOR = {
  AVAILABLE: '#22C55E', RESERVED: '#EF4444', OCCUPIED: '#F59E0B',
  CLEANING: '#94A3B8', HELD_FOR_WAITLIST: '#8B5CF6', MAINTENANCE: '#374151'
}
const TABLE_STATUS_LABEL = {
  AVAILABLE: 'Trống', RESERVED: 'Đã đặt', OCCUPIED: 'Đang dùng',
  CLEANING: 'Dọn dẹp', HELD_FOR_WAITLIST: 'Hàng chờ', MAINTENANCE: 'Bảo trì'
}

export default function BookingFlow() {
  const { branchId } = useParams()
  const navigate = useNavigate()
  const [step, setStep]           = useState(0)
  const [branch, setBranch]       = useState(null)
  const [zones, setZones]         = useState([])
  const [tables, setTables]       = useState({}) // zoneId → tables[]
  const [menuItems, setMenuItems] = useState([])
  const [bookingId, setBookingId] = useState(null)

  // Step 0 - Chọn bàn
  const [selectedTable, setSelectedTable]   = useState(null)
  const [guestCount, setGuestCount]         = useState(2)
  const [reservationTime, setReservationTime] = useState('')

  // Step 1 - Thông tin liên hệ
  const [contactName, setContactName]   = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [note, setNote]                 = useState('')

  // Step 2 - Đặt món trước (AF02: tùy chọn)
  const [cart, setCart] = useState({}) // menuItemId → qty

  // Step 3 - Confirm
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    branchApi.getById(branchId).then(r => setBranch(r.data))
    zoneApi.getByBranch(branchId).then(async r => {
      setZones(r.data)
      const tableMap = {}
      await Promise.all(r.data.map(async z => {
        const t = await tableApi.getByZone(z.id)
        tableMap[z.id] = t.data
      }))
      setTables(tableMap)
    })
    menuApi.getByBranch(branchId).then(r => setMenuItems(r.data.filter(m => m.status === 'SELLING')))
  }, [branchId])

  // ===== B01 Buoc 3: Tao giu ban =====
  const createHold = async () => {
    if (!selectedTable || !reservationTime) { toast.error('Vui lòng chọn bàn và giờ đặt'); return }
    setLoading(true)
    try {
      const { data } = await bookingApi.createHold({
        branchId: Number(branchId),
        tableId: selectedTable.id,
        guestCount,
        reservationTime: new Date(reservationTime).toISOString()
      })
      setBookingId(data.id)
      setBooking(data)
      toast.success('Đã giữ bàn 15 phút!')
      setStep(1)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể giữ bàn')
    } finally { setLoading(false) }
  }

  // ===== B01 Buoc 4: Thông tin liên hệ =====
  const saveContact = async () => {
    if (!contactName || !contactPhone) { toast.error('Vui lòng nhập đủ thông tin'); return }
    setLoading(true)
    try {
      await bookingApi.updateContactInfo(bookingId, { contactName, contactPhone, note })
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật thông tin')
    } finally { setLoading(false) }
  }

  // ===== B01 Buoc 5 + AF02: Đặt món trước (tùy chọn) =====
  const savePreOrder = async (skip = false) => {
    setLoading(true)
    try {
      if (!skip) {
        const items = Object.entries(cart)
          .filter(([, q]) => q > 0)
          .map(([id, q]) => ({ menuItemId: Number(id), quantity: q }))
        const { data } = await bookingApi.addPreOrder(bookingId, { items })
        setBooking(data)
      }
      setStep(3)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi đặt món')
    } finally { setLoading(false) }
  }

  // ===== B01 Buoc 8 / AF03: Xác nhận và cọc =====
  const confirm = async () => {
    setLoading(true)
    try {
      if (!booking?.depositAmount || booking.depositAmount === 0) {
        // AF03: không cần cọc
        await bookingApi.confirmWithoutDeposit(bookingId)
        toast.success('Đặt bàn thành công!')
      } else {
        // Chuyển đến trang thanh toán (tích hợp cổng payment thực tế)
        toast.success('Chuyển đến trang thanh toán...')
        // window.location.href = `/payment/gateway?bookingId=${bookingId}`
        // Demo: giả sử thanh toán thành công
        await bookingApi.confirmWithoutDeposit(bookingId)
        toast.success('Đặt bàn và đặt cọc thành công!')
      }
      navigate('/my-bookings')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xác nhận')
    } finally { setLoading(false) }
  }

  const toggleCart = (itemId, delta) => {
    setCart(p => ({ ...p, [itemId]: Math.max(0, (p[itemId] || 0) + delta) }))
  }

  const cartTotal = menuItems.reduce((sum, m) => sum + (cart[m.id] || 0) * m.price, 0)
    .toLocaleString('vi-VN') + '₫'

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ padding: '2rem 1rem', maxWidth: 800 }}>
        <h1 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '1.5rem' }}>
          Đặt bàn tại {branch?.name || '...'}
        </h1>

        {/* Step indicator */}
        <div className="flex items-center gap-2" style={{ marginBottom: '2rem', flexWrap: 'wrap' }}>
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', fontWeight: 700,
                background: i <= step ? 'var(--brand)' : 'var(--border)',
                color: i <= step ? '#fff' : 'var(--text-muted)'
              }}>{i + 1}</div>
              <span style={{ fontSize: '.85rem', fontWeight: i === step ? 600 : 400,
                color: i === step ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s}</span>
              {i < STEPS.length - 1 && <span style={{ color: 'var(--border)' }}>›</span>}
            </div>
          ))}
        </div>

        {/* ===== STEP 0: CHỌN BÀN ===== */}
        {step === 0 && (
          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Chọn thời gian & bàn ngồi</h2>
            <div className="grid-2" style={{ marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Số khách</label>
                <input type="number" value={guestCount} min={1} max={20}
                  onChange={e => setGuestCount(Number(e.target.value))} />
              </div>
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Giờ đặt bàn</label>
                <input type="datetime-local" value={reservationTime}
                  onChange={e => setReservationTime(e.target.value)} />
              </div>
            </div>

            {zones.map(zone => (
              <div key={zone.id} style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '.75rem', color: 'var(--text-muted)' }}>
                  Khu vực: {zone.name}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.625rem' }}>
                  {(tables[zone.id] || []).map(t => {
                    const isAvail = t.status === 'AVAILABLE'
                    const isSelected = selectedTable?.id === t.id
                    return (
                      <div key={t.id}
                        onClick={() => isAvail && setSelectedTable(t)}
                        style={{
                          width: 80, height: 70, borderRadius: 10,
                          border: isSelected ? '2.5px solid var(--brand)' : '1.5px solid var(--border)',
                          background: isSelected ? 'var(--brand-light)' : TABLE_STATUS_COLOR[t.status] + '18',
                          cursor: isAvail ? 'pointer' : 'not-allowed',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          opacity: isAvail ? 1 : 0.55
                        }}>
                        <span style={{ fontSize: '.75rem', fontWeight: 700 }}>{t.tableCode}</span>
                        <span style={{ fontSize: '.65rem', color: TABLE_STATUS_COLOR[t.status], fontWeight: 600 }}>
                          {TABLE_STATUS_LABEL[t.status]}
                        </span>
                        <span style={{ fontSize: '.65rem', color: 'var(--text-muted)' }}>{t.capacity} khách</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-3" style={{ flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {Object.entries(TABLE_STATUS_LABEL).map(([s, l]) => (
                <div key={s} className="flex items-center gap-2">
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: TABLE_STATUS_COLOR[s] }} />
                  <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{l}</span>
                </div>
              ))}
            </div>

            {selectedTable && (
              <div style={{ padding: '.875rem', background: 'var(--brand-light)', borderRadius: 8, marginBottom: '1rem' }}>
                Đã chọn: <strong>{selectedTable.tableCode}</strong> — Sức chứa {selectedTable.capacity} khách
              </div>
            )}
            <button className="btn-primary" onClick={createHold} disabled={loading} style={{ width: '100%', padding: '.8rem' }}>
              {loading ? 'Đang giữ bàn...' : 'Giữ bàn & Tiếp tục →'}
            </button>
          </div>
        )}

        {/* ===== STEP 1: THÔNG TIN LIÊN HỆ ===== */}
        {step === 1 && (
          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Thông tin đặt bàn</h2>
            {booking?.holdExpiresAt && (
              <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 8, padding: '.75rem', marginBottom: '1rem', fontSize: '.87rem' }}>
                ⏱️ Bàn được giữ đến: <strong>{new Date(booking.holdExpiresAt).toLocaleTimeString('vi-VN')}</strong>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Họ tên người đặt</label>
                <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Nguyễn Văn A" required />
              </div>
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Số điện thoại</label>
                <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="0901234567" required />
              </div>
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Ghi chú (tùy chọn)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Yêu cầu đặc biệt, dị ứng thực phẩm..." />
              </div>
              <button className="btn-primary" onClick={saveContact} disabled={loading} style={{ padding: '.8rem' }}>
                {loading ? 'Đang lưu...' : 'Tiếp tục → Đặt món'}
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 2: ĐẶT MÓN TRƯỚC ===== */}
        {step === 2 && (
          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: '.5rem' }}>Đặt món trước (tùy chọn)</h2>
            <p style={{ fontSize: '.87rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Chọn món để nhà hàng chuẩn bị sẵn. Bạn có thể bỏ qua bước này.
            </p>
            {menuItems.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Chi nhánh chưa có thực đơn.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem', marginBottom: '1.25rem' }}>
                {menuItems.map(m => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '.75rem', borderRadius: 8, border: '1px solid var(--border)'
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '.9rem' }}>{m.name}</p>
                      <p style={{ color: 'var(--brand)', fontWeight: 700, fontSize: '.88rem' }}>
                        {m.price.toLocaleString('vi-VN')}₫
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleCart(m.id, -1)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--border)', fontWeight: 700 }}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{cart[m.id] || 0}</span>
                      <button onClick={() => toggleCart(m.id, 1)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--brand)', color: '#fff', fontWeight: 700 }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {cartTotal !== '0₫' && (
              <div style={{ padding: '.75rem', background: 'var(--brand-light)', borderRadius: 8, marginBottom: '1rem' }}>
                Tổng món đặt trước: <strong>{cartTotal}</strong>
              </div>
            )}
            <div className="flex gap-3">
              <button className="btn-outline" onClick={() => savePreOrder(true)} disabled={loading} style={{ flex: 1, padding: '.8rem' }}>
                Bỏ qua
              </button>
              <button className="btn-primary" onClick={() => savePreOrder(false)} disabled={loading} style={{ flex: 2, padding: '.8rem' }}>
                {loading ? 'Đang lưu...' : 'Xác nhận món →'}
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 3: XÁC NHẬN & CỌC ===== */}
        {step === 3 && booking && (
          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Xác nhận đặt bàn</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem', marginBottom: '1.5rem' }}>
              {[
                ['Chi nhánh', booking.branchName],
                ['Bàn', booking.tableCode],
                ['Số khách', `${booking.guestCount} người`],
                ['Giờ đặt', new Date(booking.reservationTime).toLocaleString('vi-VN')],
                ['Liên hệ', contactName + ' – ' + contactPhone],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between" style={{ padding: '.625rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>{k}</span>
                  <span style={{ fontWeight: 600, fontSize: '.9rem' }}>{v}</span>
                </div>
              ))}
              {booking.depositAmount > 0 && (
                <div className="flex justify-between" style={{ padding: '.625rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Tiền cọc</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                    {Number(booking.depositAmount).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              )}
            </div>

            {booking.items?.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '.5rem', fontSize: '.95rem' }}>Món đặt trước</h3>
                {booking.items.map((item, i) => (
                  <div key={i} className="flex justify-between" style={{ fontSize: '.87rem', padding: '.3rem 0' }}>
                    <span>{item.name} × {item.quantity}</span>
                    <span style={{ fontWeight: 600 }}>{(item.price * item.quantity).toLocaleString('vi-VN')}₫</span>
                  </div>
                ))}
              </div>
            )}

            <button className="btn-primary" onClick={confirm} disabled={loading}
              style={{ width: '100%', padding: '.9rem', fontSize: '1rem', fontWeight: 700 }}>
              {loading ? 'Đang xử lý...' : booking.depositAmount > 0
                ? `✅ Xác nhận & Thanh toán cọc ${Number(booking.depositAmount).toLocaleString('vi-VN')}₫`
                : '✅ Xác nhận đặt bàn (không cần cọc)'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
