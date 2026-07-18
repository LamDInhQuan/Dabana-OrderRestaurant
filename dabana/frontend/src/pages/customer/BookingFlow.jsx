import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import { branchApi, zoneApi, menuApi, bookingApi, availableSlotApi } from '../../api'

const STEPS = ['Thời gian & bàn', 'Thông tin', 'Đặt món', 'Xác nhận & cọc']

// dining_table.status: 1 EMPTY · 2 RESERVED · 3 OCCUPIED · 4 CLEANING · 5 MAINTENANCE
const TABLE_STATUS_META = {
  1: { label: 'Trống',      color: '#22C55E' },
  2: { label: 'Đã đặt',     color: '#EF4444' },
  3: { label: 'Đang dùng',  color: '#F59E0B' },
  4: { label: 'Đang dọn',   color: '#94A3B8' },
  5: { label: 'Bảo trì',    color: '#374151' },
}

const DOW = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const GUEST_PRESETS = [2, 4, 6, 8]
const SLOT_STEP_MIN = 30
const MIN_LEAD_MIN = 30 // không cho đặt giờ quá sát hiện tại
// Dùng khi chi nhánh chưa cấu hình giờ mở cửa hoặc API giờ mở cửa chưa sẵn sàng
const FALLBACK_HOURS = [{ dayOfWeek: null, openTime: '10:00', closeTime: '22:00', shiftName: null }]

function unwrap(res) {
  const d = res?.data
  if (d && typeof d === 'object' && 'code' in d && 'data' in d) return d.data
  return d
}

function toMinutes(t) {
  if (Array.isArray(t)) return t[0] * 60 + (t[1] || 0)
  if (typeof t === 'string') {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + (m || 0)
  }
  return 0
}

function fmtHM(totalMin) {
  const h = String(Math.floor(totalMin / 60)).padStart(2, '0')
  const m = String(totalMin % 60).padStart(2, '0')
  return `${h}:${m}`
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// BE nhận date theo dd-MM-yyyy (xem AvailableSlotController#getShiftsByTargetDay)
function toApiDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${d}-${m}-${y}`
}

function buildSlotGroups(dateStr, hoursForDay) {
  if (!dateStr || !hoursForDay?.length) return []
  const isToday = dateStr === todayStr()
  const now = new Date()
  const nowMin = isToday ? now.getHours() * 60 + now.getMinutes() + MIN_LEAD_MIN : -1

  return hoursForDay
    .map((oh, i) => {
      const open = toMinutes(oh.openTime)
      const close = toMinutes(oh.closeTime)
      const slots = []
      for (let t = open; t < close; t += SLOT_STEP_MIN) {
        if (t >= nowMin) slots.push(fmtHM(t))
      }
      return { key: oh.id ?? i, label: oh.shiftName || null, slots }
    })
    .filter(g => g.slots.length > 0)
}

function formatVND(n) {
  return Number(n || 0).toLocaleString('vi-VN') + '₫'
}

export default function BookingFlow() {
  const { branchId } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()

  const [step, setStep] = useState(0)
  const [branch, setBranch] = useState(null)
  const [zones, setZones] = useState([])
  const [zonesLoading, setZonesLoading] = useState(true)
  const [daySlots, setDaySlots] = useState(null) // null = đang tải/chưa có; [] = chi nhánh đóng cửa ngày này
  const [slotsError, setSlotsError] = useState(false) // true = API lỗi → dùng khung giờ tham khảo
  const [categories, setCategories] = useState([])
  const [menuLoading, setMenuLoading] = useState(true)

  // Step 0 — thời gian, số khách, phương thức chọn bàn
  const [date, setDate] = useState(todayStr())
  const [timeSlot, setTimeSlot] = useState('')
  const [guestCount, setGuestCount] = useState(2)
  const [method, setMethod] = useState('manual') // 'manual' | 'auto' (B01 AF01)
  const [selectedTable, setSelectedTable] = useState(null)

  // Step 1 — thông tin liên hệ
  const [contactName, setContactName] = useState(auth?.fullName || '')
  const [contactPhone, setContactPhone] = useState(auth?.phone || auth?.phoneNumber || '')
  const [note, setNote] = useState('')

  // Step 2 — đặt món trước (AF02: tùy chọn)
  const [activeCategory, setActiveCategory] = useState(null)
  const [cart, setCart] = useState({}) // menuItemId → qty

  // Booking đang xử lý + giữ bàn
  const [bookingId, setBookingId] = useState(null)
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(false)
  const [nowTick, setNowTick] = useState(Date.now())

  useEffect(() => {
    branchApi.getById(branchId).then(r => setBranch(unwrap(r))).catch(() => {})

    setZonesLoading(true)
    zoneApi.getByBranch(branchId)
      .then(r => setZones(unwrap(r) || []))
      .catch(() => setZones([]))
      .finally(() => setZonesLoading(false))

    setMenuLoading(true)
    menuApi.getByBranch(branchId)
      .then(r => {
        const cats = (unwrap(r) || []).map(c => ({
          ...c,
          items: (c.items || []).filter(i => i.status === 'SELLING'),
        })).filter(c => c.items.length > 0)
        setCategories(cats)
        setActiveCategory(cats[0]?.id ?? null)
      })
      .catch(() => setCategories([]))
      .finally(() => setMenuLoading(false))
  }, [branchId])

  // Đếm ngược thời gian giữ bàn (BR06/EF04)
  useEffect(() => {
    if (!booking?.holdExpiresAt || step >= 3) return
    const t = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(t)
  }, [booking?.holdExpiresAt, step])

  const holdSecondsLeft = booking?.holdExpiresAt
    ? Math.max(0, Math.round((new Date(booking.holdExpiresAt).getTime() - nowTick) / 1000))
    : null

  useEffect(() => {
    if (holdSecondsLeft === 0 && step < 3) {
      toast.error('Hết thời gian giữ bàn, vui lòng đặt lại.')
      setStep(0)
      setBookingId(null)
      setBooking(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdSecondsLeft])

  // Khung giờ đến lấy theo từng ngày cụ thể (BE đã tính sẵn slot 60', áp dụng
  // giờ mở cửa + các ngoại lệ do nhà hàng cấu hình cho đúng ngày đó).
  useEffect(() => {
    if (!branchId || !date) return
    setSlotsError(false)
    availableSlotApi.getShifts(branchId, toApiDate(date))
      .then(r => setDaySlots(unwrap(r) || []))
      .catch(() => { setDaySlots(null); setSlotsError(true) })
  }, [branchId, date])

  const slotGroups = useMemo(() => {
    if (slotsError) return buildSlotGroups(date, FALLBACK_HOURS) // BE lỗi → dùng khung giờ tham khảo
    if (!daySlots?.length) return []
    const isToday = date === todayStr()
    const now = new Date()
    const nowMin = isToday ? now.getHours() * 60 + now.getMinutes() + MIN_LEAD_MIN : -1

    const groups = new Map()
    for (const p of daySlots) {
      const startMin = toMinutes(p.startTime)
      if (startMin < nowMin) continue
      const key = p.operatingHourId ?? p.description ?? 'default'
      if (!groups.has(key)) groups.set(key, { key, label: p.description || null, slots: [] })
      groups.get(key).slots.push(fmtHM(startMin))
    }
    return [...groups.values()].filter(g => g.slots.length > 0)
  }, [daySlots, slotsError, date])

  const isClosedThatDay = !slotsError && daySlots !== null && daySlots.length === 0

  useEffect(() => { setTimeSlot('') }, [date])

  const allMenuItems = useMemo(() => categories.flatMap(c => c.items), [categories])

  const preOrderTotal = allMenuItems.reduce((sum, m) => sum + (cart[m.id] || 0) * Number(m.price), 0)
  const itemsInCart = Object.values(cart).reduce((a, b) => a + b, 0)

  // ===== B01 Bước 3 (+AF01): tạo giữ bàn tạm thời =====
  const createHold = async () => {
    if (!timeSlot) { toast.error('Vui lòng chọn khung giờ đến'); return }
    if (method === 'manual' && !selectedTable) { toast.error('Vui lòng chọn bàn hoặc dùng chức năng đề xuất bàn'); return }
    if (method === 'manual' && selectedTable.capacity < guestCount) {
      toast.error(`Bàn ${selectedTable.tableName} chỉ chứa tối đa ${selectedTable.capacity} khách`); return
    }
    setLoading(true)
    try {
      const { data } = await bookingApi.createHold({
        branchId: Number(branchId),
        tableId: method === 'manual' ? selectedTable.id : null,
        guestCount,
        reservationTime: `${date}T${timeSlot}:00`,
        useAutoSuggest: method === 'auto',
      })
      const b = unwrap({ data })
      setBookingId(b.id)
      setBooking(b)
      toast.success('Đã giữ bàn trong 15 phút!')
      setStep(1)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể giữ bàn, vui lòng thử lại')
    } finally { setLoading(false) }
  }

  // ===== B01 Bước 4: thông tin liên hệ =====
  const saveContact = async () => {
    if (!contactName || !contactPhone) { toast.error('Vui lòng nhập đủ thông tin'); return }
    setLoading(true)
    try {
      const { data } = await bookingApi.updateContactInfo(bookingId, { contactName, contactPhone, note })
      setBooking(unwrap({ data }))
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật thông tin')
    } finally { setLoading(false) }
  }

  // ===== B01 Bước 5 + AF02: đặt món trước (tùy chọn) =====
  const savePreOrder = async (skip = false) => {
    setLoading(true)
    try {
      if (!skip && itemsInCart > 0) {
        const items = Object.entries(cart)
          .filter(([, q]) => q > 0)
          .map(([id, q]) => ({ menuItemId: Number(id), quantity: q }))
        const { data } = await bookingApi.addPreOrder(bookingId, { items })
        setBooking(unwrap({ data }))
      }
      setStep(3)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi đặt món')
    } finally { setLoading(false) }
  }

  // ===== B01 Bước 8/9 + AF03: xác nhận (và cọc nếu có) =====
  const confirm = async () => {
    setLoading(true)
    try {
      if (!booking?.depositAmount || Number(booking.depositAmount) === 0) {
        await bookingApi.confirmWithoutDeposit(bookingId)
        toast.success('Đặt bàn thành công!')
      } else {
        // TODO tích hợp cổng thanh toán thực tế trước khi gọi confirm
        toast.success('Đang chuyển đến cổng thanh toán đặt cọc...')
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

  const goBack = () => setStep(s => Math.max(0, s - 1))

  return (
    <>
      <Navbar />
      <div className="page-container page-with-navbar" style={{ padding: '1.5rem 1rem 6rem', maxWidth: 760 }}>
        <h1 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '.35rem' }}>
          Đặt bàn tại {branch?.name || '...'}
        </h1>
        {branch?.address && (
          <p style={{ color: 'var(--text-muted)', fontSize: '.85rem', marginBottom: '1.25rem' }}>📍 {branch.address}</p>
        )}

        <StepIndicator step={step} />

        {holdSecondsLeft !== null && step < 3 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: holdSecondsLeft < 120 ? '#FEE2E2' : '#FEF9C3',
            border: `1px solid ${holdSecondsLeft < 120 ? '#FCA5A5' : '#FDE68A'}`,
            borderRadius: 8, padding: '.65rem .9rem', marginBottom: '1.25rem', fontSize: '.85rem'
          }}>
            <span>⏱️ Bàn đang được giữ cho bạn</span>
            <strong>{Math.floor(holdSecondsLeft / 60)}:{String(holdSecondsLeft % 60).padStart(2, '0')}</strong>
          </div>
        )}

        {step === 0 && (
          <StepTimeAndTable
            date={date} setDate={setDate}
            timeSlot={timeSlot} setTimeSlot={setTimeSlot}
            slotGroups={slotGroups} isClosedThatDay={isClosedThatDay}
            usingFallbackHours={slotsError}
            guestCount={guestCount} setGuestCount={setGuestCount}
            method={method} setMethod={setMethod}
            zones={zones} zonesLoading={zonesLoading}
            selectedTable={selectedTable} setSelectedTable={setSelectedTable}
            onSubmit={createHold} loading={loading}
          />
        )}

        {step === 1 && (
          <StepContact
            contactName={contactName} setContactName={setContactName}
            contactPhone={contactPhone} setContactPhone={setContactPhone}
            note={note} setNote={setNote}
            onBack={goBack} onSubmit={saveContact} loading={loading}
          />
        )}

        {step === 2 && (
          <StepMenu
            categories={categories} menuLoading={menuLoading}
            activeCategory={activeCategory} setActiveCategory={setActiveCategory}
            cart={cart} toggleCart={toggleCart} preOrderTotal={preOrderTotal} itemsInCart={itemsInCart}
            onBack={goBack} onSkip={() => savePreOrder(true)} onSubmit={() => savePreOrder(false)} loading={loading}
          />
        )}

        {step === 3 && booking && (
          <StepConfirm
            booking={booking} date={date} timeSlot={timeSlot} contactName={contactName} contactPhone={contactPhone}
            onBack={goBack} onSubmit={confirm} loading={loading}
          />
        )}
      </div>
    </>
  )
}

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-2" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      {STEPS.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <div style={{
            width: 26, height: 26, borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700,
            background: i <= step ? 'var(--brand)' : 'var(--border)',
            color: i <= step ? '#fff' : 'var(--text-muted)',
            transition: 'background .25s',
          }}>{i + 1}</div>
          <span style={{
            fontSize: '.82rem', fontWeight: i === step ? 600 : 400,
            color: i === step ? 'var(--text-primary)' : 'var(--text-muted)'
          }}>{s}</span>
          {i < STEPS.length - 1 && <span style={{ color: 'var(--border)' }}>›</span>}
        </div>
      ))}
    </div>
  )
}

function StepTimeAndTable({
  date, setDate, timeSlot, setTimeSlot, slotGroups, isClosedThatDay, usingFallbackHours,
  guestCount, setGuestCount, method, setMethod, zones, zonesLoading,
  selectedTable, setSelectedTable, onSubmit, loading,
}) {
  return (
    <div className="card">
      <h2 style={{ fontWeight: 700, marginBottom: '1.1rem' }}>Chọn thời gian đến</h2>

      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
        <div>
          <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Ngày đến</label>
          <input type="date" value={date} min={todayStr()} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Số khách</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setGuestCount(c => Math.max(1, c - 1))}
              style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--border)', fontWeight: 700 }}>−</button>
            <span style={{ fontWeight: 700, minWidth: 28, textAlign: 'center' }}>{guestCount}</span>
            <button type="button" onClick={() => setGuestCount(c => Math.min(20, c + 1))}
              style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--brand)', color: '#fff', fontWeight: 700 }}>+</button>
            <div className="flex gap-2" style={{ marginLeft: '.4rem' }}>
              {GUEST_PRESETS.map(g => (
                <button key={g} type="button" onClick={() => setGuestCount(g)}
                  className="btn-sm" style={{
                    background: guestCount === g ? 'var(--brand)' : 'var(--brand-light)',
                    color: guestCount === g ? '#fff' : 'var(--brown-mid)'
                  }}>{g}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.5rem' }}>Khung giờ đến</label>
      {isClosedThatDay ? (
        <p style={{ color: 'var(--accent)', fontSize: '.87rem', marginBottom: '1.25rem' }}>
          Chi nhánh không mở cửa vào ngày bạn chọn. Vui lòng chọn ngày khác.
        </p>
      ) : slotGroups.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '.87rem', marginBottom: '1.25rem' }}>
          Không còn khung giờ nào khả dụng trong ngày này, vui lòng chọn ngày khác.
        </p>
      ) : (
        <div style={{ marginBottom: '1.25rem' }}>
          {slotGroups.map(g => (
            <div key={g.key} style={{ marginBottom: '.75rem' }}>
              {g.label && <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '.4rem' }}>{g.label}</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                {g.slots.map(s => (
                  <button key={s} type="button" onClick={() => setTimeSlot(s)}
                    className="btn-sm"
                    style={{
                      background: timeSlot === s ? 'var(--brand)' : 'var(--white)',
                      color: timeSlot === s ? '#fff' : 'var(--text-primary)',
                      border: `1.5px solid ${timeSlot === s ? 'var(--brand)' : 'var(--border)'}`,
                    }}>{s}</button>
                ))}
              </div>
            </div>
          ))}
          {usingFallbackHours && (
            <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.4rem' }}>
              * Khung giờ tham khảo, chi nhánh sẽ xác nhận lại giờ mở cửa chính xác.
            </p>
          )}
        </div>
      )}

      <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.5rem' }}>Cách chọn bàn</label>
      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
        <button type="button" onClick={() => setMethod('manual')}
          style={{
            textAlign: 'left', padding: '.85rem', borderRadius: 10, background: method === 'manual' ? 'var(--brand-light)' : 'var(--white)',
            border: `1.5px solid ${method === 'manual' ? 'var(--brand)' : 'var(--border)'}`,
          }}>
          <div style={{ fontWeight: 700, fontSize: '.9rem' }}>🪑 Tự chọn bàn</div>
          <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>Chọn trực tiếp trên sơ đồ chi nhánh</div>
        </button>
        <button type="button" onClick={() => { setMethod('auto'); setSelectedTable(null) }}
          style={{
            textAlign: 'left', padding: '.85rem', borderRadius: 10, background: method === 'auto' ? 'var(--brand-light)' : 'var(--white)',
            border: `1.5px solid ${method === 'auto' ? 'var(--brand)' : 'var(--border)'}`,
          }}>
          <div style={{ fontWeight: 700, fontSize: '.9rem' }}>✨ Để hệ thống đề xuất</div>
          <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>Dabana chọn bàn phù hợp nhất giúp bạn</div>
        </button>
      </div>

      {method === 'auto' ? (
        <div style={{ padding: '.875rem', background: 'var(--brand-light)', borderRadius: 8, marginBottom: '1.25rem', fontSize: '.87rem' }}>
          Hệ thống sẽ tự động bố trí bàn phù hợp cho <strong>{guestCount} khách</strong>
          {timeSlot ? <> lúc <strong>{timeSlot}</strong></> : null} theo quy tắc sắp xếp của chi nhánh.
        </div>
      ) : zonesLoading ? (
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Đang tải sơ đồ bàn...</p>
      ) : zones.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Chi nhánh chưa cập nhật sơ đồ bàn.</p>
      ) : (
        <>
          {zones.map(zone => (
            <div key={zone.id} style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '.6rem', color: 'var(--text-muted)', fontSize: '.88rem' }}>
                Khu vực: {zone.zoneName}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.625rem' }}>
                {(zone.tables || []).map(t => {
                  const meta = TABLE_STATUS_META[t.status] || TABLE_STATUS_META[1]
                  const isAvail = t.status === 1
                  const isSelected = selectedTable?.id === t.id
                  return (
                    <div key={t.id}
                      onClick={() => isAvail && setSelectedTable({ ...t, zoneName: zone.zoneName })}
                      style={{
                        width: 84, height: 72, borderRadius: 10,
                        border: isSelected ? '2.5px solid var(--brand)' : '1.5px solid var(--border)',
                        background: isSelected ? 'var(--brand-light)' : meta.color + '18',
                        cursor: isAvail ? 'pointer' : 'not-allowed',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        opacity: isAvail ? 1 : 0.55,
                      }}>
                      <span style={{ fontSize: '.78rem', fontWeight: 700 }}>{t.tableName}</span>
                      <span style={{ fontSize: '.65rem', color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                      <span style={{ fontSize: '.65rem', color: 'var(--text-muted)' }}>{t.capacity} khách</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {Object.values(TABLE_STATUS_META).map(m => (
              <div key={m.label} className="flex items-center gap-2">
                <div style={{ width: 10, height: 10, borderRadius: 3, background: m.color }} />
                <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{m.label}</span>
              </div>
            ))}
          </div>

          {selectedTable && (
            <div style={{ padding: '.875rem', background: 'var(--brand-light)', borderRadius: 8, marginBottom: '1rem', fontSize: '.87rem' }}>
              Đã chọn: <strong>{selectedTable.tableName}</strong> ({selectedTable.zoneName}) — Sức chứa {selectedTable.capacity} khách
            </div>
          )}
        </>
      )}

      <button className="btn-primary" onClick={onSubmit} disabled={loading} style={{ width: '100%', padding: '.85rem' }}>
        {loading ? 'Đang giữ bàn...' : 'Giữ bàn & tiếp tục →'}
      </button>
    </div>
  )
}

function StepContact({ contactName, setContactName, contactPhone, setContactPhone, note, setNote, onBack, onSubmit, loading }) {
  return (
    <div className="card">
      <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Thông tin đặt bàn</h2>
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
        <div className="flex gap-3">
          <button className="btn-outline" onClick={onBack} style={{ flex: 1, padding: '.8rem' }}>← Quay lại</button>
          <button className="btn-primary" onClick={onSubmit} disabled={loading} style={{ flex: 2, padding: '.8rem' }}>
            {loading ? 'Đang lưu...' : 'Tiếp tục → Đặt món'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StepMenu({ categories, menuLoading, activeCategory, setActiveCategory, cart, toggleCart, preOrderTotal, itemsInCart, onBack, onSkip, onSubmit, loading }) {
  const current = categories.find(c => c.id === activeCategory) || categories[0]
  return (
    <div className="card">
      <h2 style={{ fontWeight: 700, marginBottom: '.35rem' }}>Đặt món trước (tùy chọn)</h2>
      <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '1.1rem' }}>
        Chọn món để nhà hàng chuẩn bị sẵn khi bạn đến. Bạn có thể bỏ qua bước này.
      </p>

      {menuLoading ? (
        <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>Đang tải thực đơn...</p>
      ) : categories.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>Chi nhánh chưa có thực đơn.</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '.5rem', overflowX: 'auto', paddingBottom: '.5rem', marginBottom: '1rem' }}>
            {categories.map(c => (
              <button key={c.id} type="button" onClick={() => setActiveCategory(c.id)}
                className="btn-sm" style={{
                  whiteSpace: 'nowrap',
                  background: activeCategory === c.id ? 'var(--brand)' : 'var(--brand-light)',
                  color: activeCategory === c.id ? '#fff' : 'var(--brown-mid)',
                }}>{c.categoryName}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem', marginBottom: '1.25rem' }}>
            {(current?.items || []).map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: '.75rem',
                padding: '.75rem', borderRadius: 8, border: '1px solid var(--border)'
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                  background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem'
                }}>
                  {m.imageUrl ? <img src={m.imageUrl} alt={m.itemName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '.9rem' }}>{m.itemName}</p>
                  <p style={{ color: 'var(--brand-dark)', fontWeight: 700, fontSize: '.88rem' }}>{formatVND(m.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleCart(m.id, -1)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--border)', fontWeight: 700 }}>−</button>
                  <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{cart[m.id] || 0}</span>
                  <button onClick={() => toggleCart(m.id, 1)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--brand)', color: '#fff', fontWeight: 700 }}>+</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {itemsInCart > 0 && (
        <div className="flex justify-between" style={{ padding: '.75rem', background: 'var(--brand-light)', borderRadius: 8, marginBottom: '1rem' }}>
          <span>{itemsInCart} món đã chọn</span>
          <strong>{formatVND(preOrderTotal)}</strong>
        </div>
      )}

      <div className="flex gap-3">
        <button className="btn-outline" onClick={onBack} disabled={loading} style={{ padding: '.8rem 1rem' }}>←</button>
        <button className="btn-outline" onClick={onSkip} disabled={loading} style={{ flex: 1, padding: '.8rem' }}>Bỏ qua</button>
        <button className="btn-primary" onClick={onSubmit} disabled={loading} style={{ flex: 2, padding: '.8rem' }}>
          {loading ? 'Đang lưu...' : 'Xác nhận món →'}
        </button>
      </div>
    </div>
  )
}

function StepConfirm({ booking, date, timeSlot, contactName, contactPhone, onBack, onSubmit, loading }) {
  const [y, m, d] = date.split('-')
  return (
    <div className="ticket-card card" style={{ padding: 0, overflow: 'hidden' }}>
      <style>{`
        .ticket-card .ticket-body { padding: 1.5rem 1.5rem 1.1rem; }
        .ticket-card .ticket-perforation {
          position: relative; height: 0; border-top: 2px dashed var(--border); margin: .25rem 0 1.1rem;
        }
        .ticket-card .ticket-perforation::before, .ticket-card .ticket-perforation::after {
          content: ''; position: absolute; top: -10px; width: 20px; height: 20px; border-radius: 50%; background: var(--bg);
        }
        .ticket-card .ticket-perforation::before { left: -1.5rem; }
        .ticket-card .ticket-perforation::after { right: -1.5rem; }
        .ticket-card .ticket-footer { background: var(--brown); color: #fff; padding: 1.1rem 1.5rem; }
      `}</style>

      <div className="ticket-body">
        <h2 style={{ fontWeight: 700, marginBottom: '1.1rem' }}>Xác nhận đặt bàn</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {[
            ['Chi nhánh', booking.branchName],
            ['Bàn', booking.tableCode || 'Do hệ thống đề xuất'],
            ['Số khách', `${booking.guestCount} người`],
            ['Ngày đến', `${d}/${m}/${y}`],
            ['Giờ đến', timeSlot],
            ['Liên hệ', `${contactName} – ${contactPhone}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between" style={{ padding: '.5rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '.88rem' }}>{k}</span>
              <span style={{ fontWeight: 600, fontSize: '.88rem' }}>{v}</span>
            </div>
          ))}
        </div>

        {booking.items?.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '.5rem', fontSize: '.92rem' }}>Món đặt trước</h3>
            {booking.items.map((item, i) => (
              <div key={i} className="flex justify-between" style={{ fontSize: '.86rem', padding: '.3rem 0' }}>
                <span>{item.name} × {item.quantity}</span>
                <span style={{ fontWeight: 600 }}>{formatVND(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ticket-perforation" />

      <div className="ticket-footer">
        {Number(booking.depositAmount) > 0 ? (
          <div className="flex justify-between items-center" style={{ marginBottom: '.9rem' }}>
            <span style={{ opacity: .85, fontSize: '.88rem' }}>Tiền cọc cần thanh toán</span>
            <strong style={{ fontSize: '1.15rem', color: 'var(--gold-light)' }}>{formatVND(booking.depositAmount)}</strong>
          </div>
        ) : (
          <p style={{ opacity: .85, fontSize: '.85rem', marginBottom: '.9rem' }}>Chi nhánh này không yêu cầu đặt cọc.</p>
        )}
        <div className="flex gap-3">
          <button className="btn-outline" onClick={onBack} disabled={loading}
            style={{ padding: '.85rem 1rem', borderColor: 'rgba(255,255,255,.4)', color: '#fff' }}>←</button>
          <button className="btn-primary" onClick={onSubmit} disabled={loading}
            style={{ flex: 1, padding: '.85rem', fontWeight: 700 }}>
            {loading ? 'Đang xử lý...' : Number(booking.depositAmount) > 0
              ? `✅ Xác nhận & thanh toán cọc`
              : '✅ Xác nhận đặt bàn'}
          </button>
        </div>
      </div>
    </div>
  )
}
