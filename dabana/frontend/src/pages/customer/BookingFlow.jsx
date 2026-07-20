import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import { branchApi, zoneApi, menuApi, bookingApi, availableSlotApi, tableApi, branchPolicyApi } from '../../api'

const STEPS = ['Thời gian & bàn', 'Thông tin', 'Đặt món', 'Xác nhận & cọc']

// dining_table.status (field vật lý, KHÔNG dùng để quyết định có chọn được bàn hay không):
// 1 EMPTY · 2 RESERVED · 3 OCCUPIED · 4 CLEANING · 5 MAINTENANCE
// Quyền chọn bàn phải dựa vào availabilityStatus (tính theo khung giờ đã chọn).
const TABLE_STATUS_META = {
  AVAILABLE: { label: 'Trống', color: '#22C55E' },
  HOLDING: { label: 'Đang giữ', color: '#3B82F6' },
  CONFIRMED: { label: 'Đã đặt', color: '#EF4444' },
  UNAVAILABLE: { label: 'Không dùng', color: '#94A3B8' }
};
const DOW = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const GUEST_PRESETS = [2, 4, 6, 8]
const SLOT_STEP_MIN = 30
const MIN_LEAD_MIN = 30
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

// Tính bậc cọc + có yêu cầu cọc theo khung giờ hay không, dùng chung ở bước 1 và bước 4
function computeDepositInfo(policy, guestCount, timeSlot) {
  if (!policy?.depositRules?.length) return { rule: null, needsDeposit: false }
  const rule = policy.depositRules.find(r => guestCount >= r.minGuest && guestCount <= r.maxGuest) || null
  if (!rule) return { rule: null, needsDeposit: false }
  const slotMin = toMinutes(timeSlot)
  const inSchedule = policy.status === 'ACTIVE' && policy.schedules?.some(sch => {
    if (sch.status !== 'ACTIVE') return false
    return slotMin >= toMinutes(sch.timeFrom) && slotMin < toMinutes(sch.timeTo)
  })
  return { rule, needsDeposit: !!inSchedule }
}

export default function BookingFlow() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()

  const [step, setStep] = useState(0)
  const [branch, setBranch] = useState(null)
  const [zones, setZones] = useState([])
  const [zonesLoading, setZonesLoading] = useState(true)
  const [activeZoneId, setActiveZoneId] = useState(null)
  const [tableAvailability, setTableAvailability] = useState(null)
  const [tablesLoading, setTablesLoading] = useState(false)
  const [daySlots, setDaySlots] = useState(null)
  const [slotsError, setSlotsError] = useState(false)
  const [categories, setCategories] = useState([])
  const [menuLoading, setMenuLoading] = useState(true)

  // Step 0 — thời gian, số khách, phương thức chọn bàn
  const [date, setDate] = useState(todayStr())
  const [timeSlot, setTimeSlot] = useState('')
  const [guestCount, setGuestCount] = useState(2)
  const [method, setMethod] = useState('manual')
  const [selectedTables, setSelectedTables] = useState([])

  // Step 1 — thông tin liên hệ
  const [contactName, setContactName] = useState(auth?.fullName || '')
  const [contactPhone, setContactPhone] = useState(auth?.phone || auth?.phoneNumber || '')
  const [note, setNote] = useState('')

  // Step 2 — đặt món trước (tùy chọn)
  const [activeCategory, setActiveCategory] = useState(null)
  const [cart, setCart] = useState({})

  const [policy, setPolicy] = useState(null)
  const [policyLoading, setPolicyLoading] = useState(true)

  const [loading, setLoading] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState(null)

  useEffect(() => {
    branchApi.getById(id).then(r => setBranch(unwrap(r))).catch(() => { })

    setZonesLoading(true)
    zoneApi.getByBranch(id)
      .then(r => setZones(unwrap(r) || []))
      .catch(() => setZones([]))
      .finally(() => setZonesLoading(false))

    setMenuLoading(true)
    menuApi.getByBranch(id)
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
  }, [id])

  useEffect(() => {
    if (zones.length > 0) {
      const isCurrentValid = zones.some(z => z.id === activeZoneId)
      if (!activeZoneId || !isCurrentValid) {
        setActiveZoneId(zones[0].id)
      }
    } else {
      setActiveZoneId(null)
    }
  }, [zones])

  useEffect(() => {
    if (!id || !date || !timeSlot || !activeZoneId) {
      setTableAvailability(null)
      return
    }
    setTablesLoading(true)
    const reservationTime = `${date}T${timeSlot}:00`
    tableApi.getAvailable(id, reservationTime, activeZoneId)
      .then(r => setTableAvailability(unwrap(r) || []))
      .catch(() => setTableAvailability([]))
      .finally(() => setTablesLoading(false))
  }, [id, date, timeSlot, activeZoneId])

  useEffect(() => {
    if (!id || !date) {
      setPolicy(null)
      return
    }
    setPolicyLoading(true)
    const referenceTime = `${date}T00:00:00`
    branchPolicyApi.getActivePolicy(id, referenceTime)
      .then(r => setPolicy(unwrap(r)))
      .catch(() => setPolicy(null))
      .finally(() => setPolicyLoading(false))
  }, [id, date])

  useEffect(() => { setSelectedTables([]) }, [timeSlot])

  useEffect(() => {
    if (!id || !date) return
    setSlotsError(false)
    availableSlotApi.getShifts(id, toApiDate(date))
      .then(r => setDaySlots(unwrap(r) || []))
      .catch(() => { setDaySlots(null); setSlotsError(true) })
  }, [id, date])

  useEffect(() => { setTimeSlot('') }, [date])

  const slotGroups = useMemo(() => {
    if (slotsError) return buildSlotGroups(date, FALLBACK_HOURS)
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

  const allMenuItems = useMemo(() => categories.flatMap(c => c.items), [categories])
  const preOrderTotal = allMenuItems.reduce((sum, m) => sum + (cart[m.id] || 0) * Number(m.price), 0)
  const itemsInCart = Object.values(cart).reduce((a, b) => a + b, 0)
  const totalCapacity = selectedTables.reduce((s, t) => s + (t.capacity || 0), 0)

  const { rule: depositRule, needsDeposit } = useMemo(
    () => computeDepositInfo(policy, guestCount, timeSlot || '00:00'),
    [policy, guestCount, timeSlot]
  )
  const depositAmount = useMemo(() => {
    if (!needsDeposit || !depositRule) return 0
    return depositRule.depositType === 'PER_PERSON'
      ? Number(depositRule.depositValue) * guestCount
      : Number(depositRule.depositValue)
  }, [needsDeposit, depositRule, guestCount])

  const goToContactStep = () => {
    if (!timeSlot) { toast.error('Vui lòng chọn khung giờ đến'); return }
    if (method === 'manual' && selectedTables.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 bàn hoặc dùng chức năng đề xuất bàn'); return
    }
    if (method === 'manual' && totalCapacity < guestCount) {
      toast.error(`Các bàn đã chọn chỉ chứa tối đa ${totalCapacity} khách`); return
    }
    setStep(1)
  }

  const goToMenuStep = () => {
    if (!contactName || !contactPhone) { toast.error('Vui lòng nhập đủ thông tin'); return }
    setStep(2)
  }

  const goToConfirmStep = () => setStep(3)

  // Xác nhận cuối cùng — theo đúng 4 endpoint riêng biệt của BE:
  // (1) createHold (2) updateContactInfo (3) addPreOrder (4) confirmWithoutDeposit hoặc chuyển trang cọc.
  // createHold KHÔNG nhận contactName/items — gửi kèm sẽ bị BE bỏ qua, khiến confirmWithoutDeposit
  // thất bại vì thiếu contact, và UI sẽ không bao giờ chuyển sang màn xác nhận thành công.
  const confirm = async () => {
    setLoading(true)

    try {
      const { data } = await bookingApi.createHold({
        branchId: Number(id),
        tableIds: method === 'manual'
          ? selectedTables.map(t => t.id)
          : [],
        guestCount,
        reservationTime: `${date}T${timeSlot}:00`,
        useAutoSuggest: method === 'auto',
        // Contact
        contactName,
        contactPhone,
        note,
        // Preorder
        items: Object.entries(cart)
          .filter(([, qty]) => qty > 0)
          .map(([menuItemId, qty]) => ({
            menuItemId: Number(menuItemId),
            quantity: qty
          }))
      })
      toast.success("Đặt bàn thành công")
      setTimeout(() => {
        navigate(`/my-bookings/${data.data.id}/lock`)
      }, 1500)
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra")
    } finally {
      setLoading(false)
    }
  }

  const toggleCart = (itemId, delta) => {
    setCart(p => ({ ...p, [itemId]: Math.max(0, (p[itemId] || 0) + delta) }))
  }

  const toggleSelectTable = (table) => {
    setSelectedTables(prev => {
      const exists = prev.find(t => t.id === table.id)
      if (exists) return prev.filter(t => t.id !== table.id)
      return [...prev, { ...table, zoneId: activeZoneId }]
    })
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

        {confirmedBooking ? (
          <BookingSuccess
            booking={confirmedBooking}
            branchId={id}
            zones={zones}
            onGoToBookings={() => navigate('/my-bookings')}
            onGoHome={() => navigate('/')}
          />
        ) : (
          <>
            <StepIndicator step={step} />

            {step === 0 && (
              <StepTimeAndTable
                date={date} setDate={setDate}
                timeSlot={timeSlot} setTimeSlot={setTimeSlot}
                slotGroups={slotGroups} isClosedThatDay={isClosedThatDay}
                usingFallbackHours={slotsError}
                guestCount={guestCount} setGuestCount={setGuestCount}
                method={method} setMethod={setMethod}
                zones={zones} zonesLoading={zonesLoading}
                activeZoneId={activeZoneId} setActiveZoneId={setActiveZoneId}
                tableAvailability={tableAvailability} tablesLoading={tablesLoading}
                selectedTables={selectedTables} onToggleTable={toggleSelectTable}
                onSubmit={goToContactStep}
                policy={policy} policyLoading={policyLoading}
              />
            )}

            {step === 1 && (
              <StepContact
                contactName={contactName} setContactName={setContactName}
                contactPhone={contactPhone} setContactPhone={setContactPhone}
                note={note} setNote={setNote}
                onBack={goBack} onSubmit={goToMenuStep}
                date={date} timeSlot={timeSlot} guestCount={guestCount}
                method={method} selectedTables={selectedTables}
                activeZoneId={activeZoneId} setActiveZoneId={setActiveZoneId} zones={zones}
                tableAvailability={tableAvailability} tablesLoading={tablesLoading}
              />
            )}

            {step === 2 && (
              <StepMenu
                categories={categories} menuLoading={menuLoading}
                activeCategory={activeCategory} setActiveCategory={setActiveCategory}
                cart={cart} toggleCart={toggleCart} preOrderTotal={preOrderTotal} itemsInCart={itemsInCart}
                onBack={goBack} onSubmit={goToConfirmStep}
              />
            )}

            {step === 3 && (
              <StepConfirm
                date={date} timeSlot={timeSlot} guestCount={guestCount}
                method={method} selectedTables={selectedTables}
                contactName={contactName} contactPhone={contactPhone} note={note}
                allMenuItems={allMenuItems} cart={cart} itemsInCart={itemsInCart} preOrderTotal={preOrderTotal}
                policy={policy} zones={zones}
                loading={loading}
                depositAmount={depositAmount}
                onBack={goBack} onSubmit={confirm}
              />
            )}
          </>
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

// Danh sách bàn đã chọn, GOM THEO ZONE — luôn tự đứng thành block riêng,
// KHÔNG đặt trực tiếp giữa 1 hàng flex chứa span (2 kiểu layout khác nhau, vỡ giao diện).
function SelectedTablesByZone({ selectedTables, zones }) {
  const grouped = (zones || [])
    .map(zone => ({ ...zone, tables: selectedTables.filter(t => t.zoneId === zone.id) }))
    .filter(z => z.tables.length)

  if (grouped.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
      {grouped.map(zone => (
        <div key={zone.id}>
          <p style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.35rem' }}>
            📍 {zone.zoneName} · {zone.tables.length} bàn
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
            {zone.tables.map(table => (
              <span key={table.id} className="btn-sm" style={{ background: 'var(--brand-light)', color: 'var(--brown-mid)' }}>
                {table.tableName} · {table.capacity} chỗ
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function TableAvailabilityGrid({ tables, selectedTables, onToggleTable, readOnly = false }) {
  return (
    <div style={{
      position: 'relative', width: '100%', height: '420px',
      background: '#f8fafc', border: '1px dashed var(--border)', borderRadius: 12,
      overflow: 'auto', marginBottom: '1rem'
    }}>
      {(tables || []).map(t => {
        const isAvail = t.availabilityStatus === 'AVAILABLE'
        const isSelected = selectedTables.some(st => st.id === t.id)
        const meta = TABLE_STATUS_META[t.availabilityStatus] || TABLE_STATUS_META.UNAVAILABLE
        const posX = typeof t.positionX === 'number' ? t.positionX : 40
        const posY = typeof t.positionY === 'number' ? t.positionY : 40
        const clickable = !readOnly && isAvail

        return (
          <div key={`table-${t.id}`}
            onClick={() => clickable && onToggleTable?.(t)}
            style={{
              position: 'absolute', left: `${posX}%`, top: `${posY}%`,
              transform: 'translate(-50%, -50%)',
              width: 85, height: 70, borderRadius: 8,
              border: isSelected ? '2.5px solid var(--brand)' : `1.5px solid ${meta.color}`,
              background: isSelected ? 'var(--brand-light)' : `${meta.color}22`,
              cursor: clickable ? 'pointer' : 'not-allowed',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              opacity: isAvail ? 1 : 0.7, userSelect: 'none'
            }}>
            <span style={{ fontSize: '.75rem', fontWeight: 700, textAlign: 'center', padding: '0 4px', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>
              {t.tableName}
            </span>
            <span style={{ fontSize: '.6rem', color: meta.color, fontWeight: 600 }}>{meta.label}</span>
            <span style={{ fontSize: '.6rem', color: 'var(--text-muted)' }}>{t.capacity} chỗ</span>
          </div>
        )
      })}
      {tables?.length === 0 && (
        <p style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '.85rem' }}>
          Khu vực này không có bàn.
        </p>
      )}
    </div>
  )
}

function StepTimeAndTable({
  date, setDate, timeSlot, setTimeSlot, slotGroups, isClosedThatDay, usingFallbackHours,
  guestCount, setGuestCount, method, setMethod,
  zones, zonesLoading,
  activeZoneId, setActiveZoneId,
  tableAvailability, tablesLoading,
  selectedTables, onToggleTable, onSubmit,
  policy, policyLoading
}) {
  const zonesFromApi = useMemo(() => (Array.isArray(zones) ? zones : []), [zones])

  const { rule: activeDepositRule } = useMemo(
    () => computeDepositInfo(policy, guestCount, timeSlot || '00:00'),
    [policy, guestCount, timeSlot]
  )

  const isSlotUnderDeposit = (slotTime) => {
    if (!policy?.depositRules?.length) return false
    const { rule, needsDeposit } = computeDepositInfo(policy, guestCount, slotTime)
    return !!rule && needsDeposit
  }

  const depositLabel = activeDepositRule
    ? activeDepositRule.depositType === 'PER_PERSON'
      ? `${formatVND(activeDepositRule.depositValue)}/người`
      : formatVND(activeDepositRule.depositValue)
    : null

  const activeZoneTables = tableAvailability
  const totalCapacity = selectedTables.reduce((s, t) => s + (t.capacity || 0), 0)

  const todayStr = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  const GUEST_PRESETS = [2, 4, 6, 8];

  return (
    <div className="card">
      <style>{`
      @keyframes depositPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,.45); }
        50% { box-shadow: 0 0 0 4px rgba(245,158,11,0); }
      }
      .deposit-badge {
        animation: depositPulse 2.2s ease-in-out infinite;
      }
    `}</style>
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

      {policyLoading ? (
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '.85rem' }}>Đang tải chính sách cọc...</p>
      ) : policy ? (
        <div style={{
          padding: '1rem 1.1rem', borderRadius: 12, marginBottom: '1.25rem',
          background: activeDepositRule
            ? 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)'
            : '#F0FDF4',
          border: `1.5px solid ${activeDepositRule ? '#FDBA74' : '#86EFAC'}`,
        }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '.5rem' }}>
            <span style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '.95rem',
              background: activeDepositRule ? '#F59E0B' : '#22C55E', flexShrink: 0,
            }}>
              <span style={{ filter: 'grayscale(0)' }}>{activeDepositRule ? '💰' : '✓'}</span>
            </span>
            <strong style={{ fontSize: '.92rem' }}>
              {activeDepositRule
                ? `Cần đặt cọc ${depositLabel} cho ${guestCount} khách`
                : 'Không yêu cầu đặt cọc cho số khách này'}
            </strong>
          </div>

          {policy.depositRules?.length > 0 && (
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.65rem' }}>
              {policy.depositRules
                .slice()
                .sort((a, b) => a.minGuest - b.minGuest)
                .map(rule => {
                  const isActive = rule.id === activeDepositRule?.id
                  const rangeLabel = rule.minGuest === rule.maxGuest
                    ? `${rule.minGuest} khách`
                    : `${rule.minGuest}–${rule.maxGuest} khách`
                  const amountLabel = rule.depositType === 'PER_PERSON'
                    ? `${formatVND(rule.depositValue)}/người`
                    : formatVND(rule.depositValue)
                  return (
                    <div key={rule.id} style={{
                      padding: '.4rem .65rem', borderRadius: 8, minWidth: 78, textAlign: 'center',
                      background: isActive ? '#F59E0B' : '#fff',
                      border: `1.5px solid ${isActive ? '#F59E0B' : '#F1D9BE'}`,
                      boxShadow: isActive ? '0 2px 8px rgba(245,158,11,.35)' : 'none',
                      transition: 'all .2s',
                    }}>
                      <div style={{ fontSize: '.68rem', fontWeight: 600, color: isActive ? '#fff' : 'var(--text-muted)' }}>
                        {rangeLabel}
                      </div>
                      <div style={{ fontSize: '.8rem', fontWeight: 700, color: isActive ? '#fff' : '#B45309' }}>
                        {amountLabel}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}

          <p style={{ fontSize: '.76rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            Áp dụng theo chính sách <strong>{policy.policy?.name}</strong>
            {policy.schedules?.[0] && (
              <> trong khung giờ <strong>{policy.schedules[0].timeFrom?.slice(0, 5)}–{policy.schedules[0].timeTo?.slice(0, 5)}</strong></>
            )}.
            {' '}Hủy trước 2 giờ được hoàn 100% cọc; hủy trong vòng 2 giờ hoặc không đến sẽ không hoàn cọc.
          </p>
        </div>
      ) : null}

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
                {g.slots.map(s => {
                  const needsDeposit = isSlotUnderDeposit(s)
                  return (
                    <button key={s} type="button" onClick={() => setTimeSlot(s)}
                      className="btn-sm"
                      style={{
                        position: 'relative', overflow: 'visible',
                        background: timeSlot === s ? 'var(--brand)' : needsDeposit ? '#FFFDF7' : 'var(--white)',
                        color: timeSlot === s ? '#fff' : 'var(--text-primary)',
                        border: `1.5px solid ${timeSlot === s ? 'var(--brand)' : needsDeposit ? '#FCD34D' : 'var(--border)'}`,
                      }}>
                      {s}
                      {needsDeposit && (
                        <span
                          className="deposit-badge"
                          title={`Yêu cầu cọc ${depositLabel}`}
                          style={{
                            position: 'absolute', top: -7, right: -7,
                            width: 18, height: 18, borderRadius: '50%',
                            background: timeSlot === s ? '#fff' : 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `1.5px solid ${timeSlot === s ? 'var(--brand)' : '#fff'}`,
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"
                              stroke={timeSlot === s ? 'var(--brand)' : '#fff'}
                              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      )}
                    </button>
                  )
                })}
                {slotGroups.some(g => g.slots.some(isSlotUnderDeposit)) && activeDepositRule && (
                  <div className="flex items-center gap-2" style={{ marginTop: '.6rem' }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"
                          stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <p style={{ fontSize: '.72rem', color: '#B45309', margin: 0 }}>
                      Khung giờ có icon ví yêu cầu đặt cọc theo bậc số khách ở trên
                    </p>
                  </div>
                )}
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
          <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>Chọn trực tiếp trên sơ đồ chi nhánh, có thể chọn nhiều bàn</div>
        </button>
        <button type="button" onClick={() => setMethod('auto')}
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
          Hệ thống sẽ tự động bố trí bàn phù hợp cho <strong>{guestCount} khách</strong> {timeSlot ? <> lúc <strong>{timeSlot}</strong></> : null} theo quy tắc sắp xếp của chi nhánh.
        </div>
      ) : zonesLoading ? (
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Đang tải khu vực...</p>
      ) : zonesFromApi.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Chi nhánh chưa có sơ đồ bàn.</p>
      ) : (
        <>
          {selectedTables.length > 0 && (
            <div style={{ padding: '.75rem .9rem', background: 'var(--brand-light)', borderRadius: 8, marginBottom: '1rem' }}>
              <p style={{ fontSize: '.8rem', fontWeight: 600, marginBottom: '.55rem' }}>
                Đã chọn {selectedTables.length} bàn · Sức chứa {totalCapacity} khách
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                {zonesFromApi
                  .map(zone => ({ ...zone, tables: selectedTables.filter(t => t.zoneId === zone.id) }))
                  .filter(z => z.tables.length)
                  .map(zone => (
                    <div key={zone.id}>
                      <p style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.3rem' }}>
                        📍 {zone.zoneName}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                        {zone.tables.map(t => (
                          <span key={t.id} className="btn-sm" style={{
                            background: 'var(--brand)', color: '#fff',
                            display: 'inline-flex', alignItems: 'center', gap: '.35rem'
                          }}>
                            {t.tableName}
                            <button type="button" onClick={() => onToggleTable(t)}
                              style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div style={{
            display: 'flex', gap: '.5rem', borderBottom: '2px solid var(--border)',
            marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '2px'
          }}>
            {zonesFromApi.map(zone => {
              const isActive = zone.id === activeZoneId;
              const countInZone = selectedTables.filter(t => t.zoneId === zone.id).length
              return (
                <button key={`zone-${zone.id}`} type="button" onClick={() => setActiveZoneId(zone.id)}
                  style={{
                    padding: '.6rem 1.2rem', border: 'none', background: 'none',
                    borderBottom: isActive ? '3px solid var(--brand)' : '3px solid transparent',
                    color: isActive ? 'var(--brand)' : 'var(--text-muted)',
                    fontWeight: isActive ? 700 : 500, fontSize: '.9rem', cursor: 'pointer',
                    whiteSpace: 'nowrap', marginBottom: '-2px'
                  }}>
                  📍 {zone.zoneName}{countInZone > 0 ? ` (${countInZone})` : ''}
                </button>
              );
            })}
          </div>

          {!timeSlot ? (
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', padding: '.875rem', background: '#F8FAFC', borderRadius: 8 }}>
              ⏰ Vui lòng chọn khung giờ đến ở trên để xem tình trạng bàn trống.
            </p>
          ) : tablesLoading ? (
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Đang tải tình trạng bàn...</p>
          ) : (
            <TableAvailabilityGrid
              tables={activeZoneTables}
              selectedTables={selectedTables}
              onToggleTable={onToggleTable}
            />
          )}

          <div className="flex items-center gap-4" style={{ marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {Object.values(TABLE_STATUS_META).map(meta => (
              <div key={meta.label} className="flex items-center gap-1">
                <div style={{ width: 12, height: 12, borderRadius: 3, background: `${meta.color}22`, border: `1px solid ${meta.color}` }} />
                <span style={{ fontSize: '.75rem' }}>{meta.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <button className="btn-primary" onClick={onSubmit} style={{ width: '100%', padding: '.85rem' }}>
        Tiếp tục →
      </button>
    </div>
  );
}

function StepContact({
  contactName, setContactName, contactPhone, setContactPhone, note, setNote,
  onBack, onSubmit,
  date, timeSlot, guestCount, method, selectedTables,
  activeZoneId, setActiveZoneId, zones, tableAvailability, tablesLoading
}) {
  const [y, m, d] = date.split('-')
  const activeZoneName = zones.find(z => z.id === activeZoneId)?.zoneName

  const zonesWithSelection = zones.filter(z => selectedTables.some(t => t.zoneId === z.id))

  useEffect(() => {
    if (method !== 'manual' || zonesWithSelection.length === 0) return
    const stillValid = zonesWithSelection.some(z => z.id === activeZoneId)
    if (!stillValid) setActiveZoneId(zonesWithSelection[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="card">
      <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Thông tin đặt bàn</h2>

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.9rem',
        padding: '.75rem .9rem', background: 'var(--brand-light)', borderRadius: 8, fontSize: '.85rem'
      }}>
        <span>📅 {d}/{m}/{y}</span>
        <span>·</span>
        <span>🕐 {timeSlot}</span>
        <span>·</span>
        <span>👥 {guestCount} khách</span>
      </div>

      {method === 'manual' && selectedTables.length > 0 && (
        <div style={{ marginBottom: '1.1rem' }}>
          <SelectedTablesByZone selectedTables={selectedTables} zones={zones} />
        </div>
      )}
      {method === 'auto' && (
        <p style={{ marginBottom: '1.1rem', fontSize: '.85rem', color: 'var(--text-muted)' }}>
          🪑 Hệ thống sẽ tự động bố trí bàn phù hợp cho {guestCount} khách.
        </p>
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
      </div>

      {method === 'manual' && (
        <div style={{ marginTop: '1.25rem' }}>
          <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.5rem' }}>
            Sơ đồ bàn {activeZoneName ? `— ${activeZoneName}` : ''} (chỉ xem lại)
          </label>

          {zonesWithSelection.length > 1 && (
            <div style={{
              display: 'flex', gap: '.5rem', borderBottom: '2px solid var(--border)',
              marginBottom: '1rem', overflowX: 'auto', paddingBottom: '2px'
            }}>
              {zonesWithSelection.map(zone => {
                const isActive = zone.id === activeZoneId
                return (
                  <button key={`review-zone-${zone.id}`} type="button" onClick={() => setActiveZoneId(zone.id)}
                    style={{
                      padding: '.5rem 1rem', border: 'none', background: 'none',
                      borderBottom: isActive ? '3px solid var(--brand)' : '3px solid transparent',
                      color: isActive ? 'var(--brand)' : 'var(--text-muted)',
                      fontWeight: isActive ? 700 : 500, fontSize: '.85rem', cursor: 'pointer',
                      whiteSpace: 'nowrap', marginBottom: '-2px'
                    }}>
                    📍 {zone.zoneName}
                  </button>
                )
              })}
            </div>
          )}

          {tablesLoading ? (
            <p style={{ color: 'var(--text-muted)' }}>Đang tải tình trạng bàn...</p>
          ) : (
            <TableAvailabilityGrid tables={tableAvailability} selectedTables={selectedTables} readOnly />
          )}
        </div>
      )}

      <div className="flex gap-3" style={{ marginTop: '1.25rem' }}>
        <button className="btn-outline" onClick={onBack} style={{ flex: 1, padding: '.8rem' }}>← Quay lại</button>
        <button className="btn-primary" onClick={onSubmit} style={{ flex: 2, padding: '.8rem' }}>
          Tiếp tục → Đặt món
        </button>
      </div>
    </div>
  )
}

function StepMenu({ categories, menuLoading, activeCategory, setActiveCategory, cart, toggleCart, preOrderTotal, itemsInCart, onBack, onSubmit }) {
  const current = categories.find(c => c.id === activeCategory) || categories[0]
  return (
    <div className="card">
      <h2 style={{ fontWeight: 700, marginBottom: '.35rem' }}>Đặt món trước (tùy chọn)</h2>
      <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '1.1rem' }}>
        Chọn món để nhà hàng chuẩn bị sẵn khi bạn đến. Không chọn món nào cũng có thể tiếp tục bình thường.
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
        <button className="btn-outline" onClick={onBack} style={{ flex: 1 }}>
          ← Quay lại
        </button>
        <button className="btn-primary" onClick={onSubmit} style={{ flex: 2 }}>
          Tiếp tục →
        </button>
      </div>
    </div>
  )
}

function StepConfirm({
  date, timeSlot, guestCount, method, selectedTables,
  contactName, contactPhone, note,
  allMenuItems, cart, itemsInCart, preOrderTotal,
  policy, zones,
  loading, depositAmount,
  onBack, onSubmit
}) {
  const [y, m, d] = date.split('-')
  const { rule, needsDeposit } = computeDepositInfo(policy, guestCount, timeSlot)

  const cartItems = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([itemId, qty]) => {
      const item = allMenuItems.find(mi => String(mi.id) === itemId)
      return item ? { ...item, qty } : null
    })
    .filter(Boolean)

  const rows = [
    ['Ngày đến', `${d}/${m}/${y}`],
    ['Giờ đến', timeSlot],
    ['Số khách', `${guestCount} người`],
    ['Cách chọn bàn', method === 'auto' ? 'Hệ thống đề xuất' : 'Tự chọn'],
    ['Người đặt', `${contactName} – ${contactPhone}`],
    ...(note ? [['Ghi chú', note]] : []),
  ]

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
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between" style={{ padding: '.5rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '.88rem' }}>{k}</span>
              <span style={{ fontWeight: 600, fontSize: '.88rem', textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>

        {method === 'manual' && selectedTables.length > 0 && (
          <div style={{ marginTop: '.9rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '.88rem', marginBottom: '.5rem' }}>Bàn đã chọn</p>
            <SelectedTablesByZone selectedTables={selectedTables} zones={zones} />
          </div>
        )}

        {cartItems.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '.5rem', fontSize: '.92rem' }}>Món đặt trước</h3>
            {cartItems.map(item => (
              <div key={item.id} className="flex justify-between" style={{ fontSize: '.86rem', padding: '.3rem 0' }}>
                <span>{item.itemName} × {item.qty}</span>
                <span style={{ fontWeight: 600 }}>{formatVND(item.price * item.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between" style={{ fontSize: '.86rem', padding: '.4rem 0', borderTop: '1px solid var(--border)', marginTop: '.3rem' }}>
              <strong>Tổng món</strong>
              <strong>{formatVND(preOrderTotal)}</strong>
            </div>
          </div>
        )}

        {rule && (
          <p style={{ fontSize: '.78rem', color: needsDeposit ? '#B45309' : 'var(--text-muted)', marginTop: '1rem' }}>
            {needsDeposit
              ? `Khung giờ này yêu cầu đặt cọc theo chính sách ${policy?.policy?.name || ''}. Hủy trước 2 giờ được hoàn 100% cọc; hủy trong vòng 2 giờ hoặc không đến sẽ không hoàn cọc.`
              : 'Không yêu cầu đặt cọc cho lượt đặt bàn này.'}
          </p>
        )}
      </div>

      <div className="ticket-perforation" />

      <div className="ticket-footer">
        {Number(depositAmount) > 0 ? (
          <div className="flex justify-between items-center" style={{ marginBottom: '.9rem' }}>
            <span style={{ opacity: .85, fontSize: '.88rem' }}>Tiền cọc cần thanh toán (ước tính)</span>
            <strong style={{ fontSize: '1.15rem', color: 'var(--gold-light)' }}>{formatVND(depositAmount)}</strong>
          </div>
        ) : (
          <p style={{ opacity: .85, fontSize: '.85rem', marginBottom: '.9rem' }}>Chi nhánh này không yêu cầu đặt cọc.</p>
        )}
        <div className="flex gap-3">
          <button className="btn-outline" onClick={onBack} disabled={loading}
            style={{ padding: '.85rem 1rem', borderColor: 'rgba(255,255,255,.4)', color: '#fff' }}>←</button>
          <button className="btn-primary" onClick={onSubmit} disabled={loading}
            style={{ flex: 1, padding: '.85rem', fontWeight: 700, opacity: loading ? .6 : 1 }}>
            {loading ? 'Đang xử lý...' : (Number(depositAmount) > 0 ? 'Thanh toán cọc' : 'Xác nhận đặt bàn')}
          </button>
        </div>
      </div>
    </div>
  )
}

function formatDateTime(v) {
  if (!v) return ''
  const dt = new Date(v)
  if (Number.isNaN(dt.getTime())) return String(v)
  const dd = String(dt.getDate()).padStart(2, '0')
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const yyyy = dt.getFullYear()
  const hh = String(dt.getHours()).padStart(2, '0')
  const mi = String(dt.getMinutes()).padStart(2, '0')
  return `${hh}:${mi} · ${dd}/${mm}/${yyyy}`
}

function formatCountdown(totalSec) {
  if (totalSec == null) return null
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const ss = String(totalSec % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

const BOOKING_STATUS_META = {
  HOLD: { label: 'Đang giữ bàn', color: '#3B82F6' },
  PENDING: { label: 'Chờ xác nhận', color: '#F59E0B' },
  PENDING_DEPOSIT: { label: 'Chờ thanh toán cọc', color: '#F59E0B' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#22C55E' },
  CANCELLED: { label: 'Đã huỷ', color: '#EF4444' },
  EXPIRED: { label: 'Đã hết hạn', color: '#94A3B8' },
}

function BookingSuccess({ booking, branchId, zones, onGoToBookings, onGoHome }) {
  const [remainingSec, setRemainingSec] = useState(null)
  const [zoneTablesMap, setZoneTablesMap] = useState({})
  const [zoneTablesLoading, setZoneTablesLoading] = useState(true)
  const [activeReviewZoneId, setActiveReviewZoneId] = useState(null)

  const statusMeta = BOOKING_STATUS_META[booking?.status] || { label: booking?.status || '—', color: '#94A3B8' }

  useEffect(() => {
    if (!booking?.holdExpiresAt) { setRemainingSec(null); return }
    const target = new Date(booking.holdExpiresAt).getTime()
    const tick = () => setRemainingSec(Math.max(0, Math.floor((target - Date.now()) / 1000)))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [booking?.holdExpiresAt])

  useEffect(() => {
    if (!branchId || !booking?.reservationTime || !zones?.length) {
      setZoneTablesLoading(false)
      return
    }
    let cancelled = false
    setZoneTablesLoading(true)
    Promise.all(
      zones.map(z =>
        tableApi.getAvailable(branchId, booking.reservationTime, z.id)
          .then(r => [z.id, unwrap(r) || []])
          .catch(() => [z.id, []])
      )
    ).then(entries => {
      if (cancelled) return
      setZoneTablesMap(Object.fromEntries(entries))
      setActiveReviewZoneId(prev => prev ?? zones[0]?.id ?? null)
    }).finally(() => { if (!cancelled) setZoneTablesLoading(false) })
    return () => { cancelled = true }
  }, [branchId, booking?.reservationTime, zones])

  const countdownLabel = formatCountdown(remainingSec)
  const isExpiringSoon = remainingSec != null && remainingSec <= 120
  const isExpired = remainingSec === 0

  const items = booking?.items || []

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
        <div className="flex items-center gap-2" style={{ marginBottom: '.75rem' }}>
          <span style={{
            width: 34, height: 34, borderRadius: '50%', background: '#22C55E',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0
          }}>✓</span>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.15rem' }}>Đặt bàn thành công!</h2>
            <p style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>Mã đặt bàn #{booking?.id}</p>
          </div>
        </div>

        {booking?.holdExpiresAt && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '.75rem .9rem', borderRadius: 10, marginBottom: '1.1rem',
            background: isExpiringSoon ? '#FEF2F2' : '#EFF6FF',
            border: `1.5px solid ${isExpiringSoon ? '#FCA5A5' : '#BFDBFE'}`,
          }}>
            <span style={{ fontSize: '.85rem', color: isExpiringSoon ? '#B91C1C' : '#1D4ED8', fontWeight: 600 }}>
              {isExpired ? '⏰ Hết hạn giữ bàn' : '⏳ Bàn đang được giữ trong'}
            </span>
            {!isExpired && (
              <strong style={{ fontSize: '1.1rem', color: isExpiringSoon ? '#B91C1C' : '#1D4ED8', fontVariantNumeric: 'tabular-nums' }}>
                {countdownLabel}
              </strong>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {[
            ['Chi nhánh', booking?.branchName || '—'],
            ['Bàn', booking?.tableCode || '—'],
            ['Số khách', booking?.guestCount != null ? `${booking.guestCount} người` : '—'],
            ['Thời gian đến', formatDateTime(booking?.reservationTime)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between" style={{ padding: '.5rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '.88rem' }}>{k}</span>
              <span style={{ fontWeight: 600, fontSize: '.88rem', textAlign: 'right' }}>{v}</span>
            </div>
          ))}
          <div className="flex justify-between items-center" style={{ padding: '.5rem 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '.88rem' }}>Trạng thái</span>
            <span style={{
              fontWeight: 700, fontSize: '.78rem', color: '#fff', padding: '.2rem .6rem',
              borderRadius: 999, background: statusMeta.color
            }}>{statusMeta.label}</span>
          </div>
        </div>

        {items.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '.5rem', fontSize: '.92rem' }}>Món đặt trước</h3>
            {items.map((item, idx) => {
              const name = item.itemName || item.menuItemName || item.name || 'Món'
              const qty = item.quantity ?? item.qty ?? 0
              const lineTotal = item.totalPrice ?? (Number(item.price || item.unitPrice || 0) * qty)
              return (
                <div key={item.id ?? idx} className="flex justify-between" style={{ fontSize: '.86rem', padding: '.3rem 0' }}>
                  <span>{name} × {qty}</span>
                  <span style={{ fontWeight: 600 }}>{formatVND(lineTotal)}</span>
                </div>
              )
            })}
            {booking?.totalPreOrderAmount != null && (
              <div className="flex justify-between" style={{ fontSize: '.86rem', padding: '.4rem 0', borderTop: '1px solid var(--border)', marginTop: '.3rem' }}>
                <strong>Tổng món</strong>
                <strong>{formatVND(booking.totalPreOrderAmount)}</strong>
              </div>
            )}
          </div>
        )}

        {Number(booking?.depositAmount) > 0 && (
          <div className="flex justify-between" style={{ marginTop: '.75rem', padding: '.6rem .75rem', background: '#FFF7ED', borderRadius: 8 }}>
            <span style={{ fontSize: '.85rem', color: '#B45309', fontWeight: 600 }}>Tiền cọc</span>
            <strong style={{ fontSize: '.9rem', color: '#B45309' }}>{formatVND(booking.depositAmount)}</strong>
          </div>
        )}

        <div style={{ marginTop: '1.4rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '.6rem', fontSize: '.92rem' }}>
            Trạng thái khóa bàn theo khu vực
          </h3>

          {zonesTablesEmpty(zones) ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Chi nhánh chưa có sơ đồ bàn.</p>
          ) : (
            <>
              <div style={{
                display: 'flex', gap: '.5rem', borderBottom: '2px solid var(--border)',
                marginBottom: '1rem', overflowX: 'auto', paddingBottom: '2px'
              }}>
                {zones.map(zone => {
                  const isActive = zone.id === activeReviewZoneId
                  return (
                    <button key={`success-zone-${zone.id}`} type="button" onClick={() => setActiveReviewZoneId(zone.id)}
                      style={{
                        padding: '.5rem 1rem', border: 'none', background: 'none',
                        borderBottom: isActive ? '3px solid var(--brand)' : '3px solid transparent',
                        color: isActive ? 'var(--brand)' : 'var(--text-muted)',
                        fontWeight: isActive ? 700 : 500, fontSize: '.85rem', cursor: 'pointer',
                        whiteSpace: 'nowrap', marginBottom: '-2px'
                      }}>
                      📍 {zone.zoneName}
                    </button>
                  )
                })}
              </div>

              {zoneTablesLoading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Đang tải trạng thái bàn...</p>
              ) : (
                <TableAvailabilityGrid
                  tables={zoneTablesMap[activeReviewZoneId] || []}
                  selectedTables={[]}
                  readOnly
                />
              )}

              <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
                {Object.values(TABLE_STATUS_META).map(meta => (
                  <div key={meta.label} className="flex items-center gap-1">
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: `${meta.color}22`, border: `1px solid ${meta.color}` }} />
                    <span style={{ fontSize: '.75rem' }}>{meta.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="ticket-perforation" />

      <div className="ticket-footer">
        <div className="flex gap-3">
          <button className="btn-outline" onClick={onGoHome}
            style={{ flex: 1, padding: '.85rem', borderColor: 'rgba(255,255,255,.4)', color: '#fff' }}>
            Về trang chủ
          </button>
          <button className="btn-primary" onClick={onGoToBookings}
            style={{ flex: 2, padding: '.85rem', fontWeight: 700 }}>
            Xem đặt bàn của tôi →
          </button>
        </div>
      </div>
    </div>
  )
}

function zonesTablesEmpty(zones) {
  return !zones || zones.length === 0
}