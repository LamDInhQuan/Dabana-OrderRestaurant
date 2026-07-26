import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { branchApi, bookingApi, menuApi, zoneApi, tableApi, waitlistApi, reviewApi, notificationApi, restaurantApi, operatingHourApi, branchPolicyApi, reservationPolicyApi, subscriptionApi } from '../../api'

//   restaurantApi, operatingHourApi, depositPolicyApi } from '../../api'

import toast from 'react-hot-toast'
import PolicyResTab from './tab/reservation_policy/policyRestaurant/PolicyResTab'
import PolicyBranchTab from './tab/reservation_policy/policyBranch/PolicyBranchTab'

import TableLayoutTab from './tab/table_layout/TableLayoutTab';
import { useFloorPlanState } from './tab/table_layout/hooks/useFloorPlanState';

import OrderBoardTab from './tab/order_board/OrderBoardTab'
import { useOrderBoardState } from './tab/order_board/hooks/useOrderBoardState'

import MenuManagementTab from './tab/menu/MenuManagementTab'
import { useMenuState } from './tab/menu/hooks/useMenuState'
import BranchScheduleTab from './tab/operating_hours/BranchScheduleTab'
import { BranchLocationPicker } from './tab/settings/BranchLocationPicker'
import BillingTab from './tab/subscription/BillingTab'

// ── Google Font ─────────────────────────────────────────────────
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap'

// ── Design tokens ───────────────────────────────────────────────
const C = {
  gold: '#C9A84C', goldLight: '#E8C97A', goldDark: '#8B6914',
  goldSubtle: 'rgba(201,168,76,.1)', goldBorder: 'rgba(201,168,76,.25)',
  brown: '#3D2B1F', brownMid: '#6B4226', brownLight: '#A0714F',
  cream: '#FBF7EF', creamDark: '#F0E8D5',
  text: '#2C1A0E', muted: '#8A6E57', border: '#E8DECE',
  white: '#FFFFFF',
  green: '#22C55E', greenBg: 'rgba(34,197,94,.1)',
  red: '#EF4444', redBg: 'rgba(239,68,68,.1)',
  amber: '#F59E0B', amberBg: 'rgba(245,158,11,.1)',
  blue: '#3B82F6', blueBg: 'rgba(59,130,246,.1)',
  slate: '#94A3B8',
  purple: '#8B5CF6', purpleBg: 'rgba(139,92,246,.1)',
}

// ── Status meta ─────────────────────────────────────────────────

const BOOKING_STATUS = {
  CONFIRMED: { color: C.green, bg: C.greenBg, label: 'Đã xác nhận' },
  CHECKED_IN: { color: C.blue, bg: C.blueBg, label: 'Đang phục vụ' },
  PENDING_NO_SHOW: { color: C.amber, bg: C.amberBg, label: 'Nghi No-show' },
  COMPLETED: { color: C.slate, bg: 'rgba(148,163,184,.1)', label: 'Hoàn tất' },
  NO_SHOW: { color: C.red, bg: C.redBg, label: 'No-show' },
  CANCELLED_BY_CUSTOMER: { color: C.red, bg: C.redBg, label: 'KH huỷ' },
  CANCELLED_BY_RESTAURANT: { color: C.red, bg: C.redBg, label: 'NH huỷ' },
}

// ── Shared UI helpers ────────────────────────────────────────────
const BRANCH_STATUS = {
  1: { label: 'Ngừng hoạt động', color: C.muted },
  2: { label: 'Hoạt động', color: C.green },
  3: { label: 'Chờ duyệt', color: C.gold },
  4: { label: 'Bị từ chối', color: C.red },
  5: { label: 'Tạm ngưng', color: C.red },
}

// ── Shared UI helpers ────────────────────────────────────────────
const serif = { fontFamily: "'Cormorant Garamond',Georgia,serif" }

function GoldDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', margin: '1.25rem 0' }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right,transparent,${C.goldLight},transparent)` }} />
      <span style={{ color: C.gold, fontSize: '.8rem' }}>✦</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left,transparent,${C.goldLight},transparent)` }} />
    </div>
  )
}

function Badge({ status, statusMap }) {
  const meta = statusMap[status] || { color: C.muted, bg: 'rgba(138,110,87,.1)', label: status }
  return (
    <span style={{
      display: 'inline-block', padding: '.2rem .65rem', borderRadius: 2,
      fontSize: '.7rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
      color: meta.color, background: meta.bg, border: `1px solid ${meta.color}22`
    }}>
      {meta.label}
    </span>
  )
}

function StatCard({ icon, label, value, sub, color, trend }) {
  return (
    <div style={{
      background: C.white, borderRadius: 4, padding: '1.5rem',
      boxShadow: '0 2px 12px rgba(61,43,31,.08)', borderTop: `3px solid ${color}`,
      transition: 'transform .2s, box-shadow .2s'
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(61,43,31,.12)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(61,43,31,.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
        <div style={{ fontSize: '1.5rem' }}>{icon}</div>
        {trend && <span style={{
          fontSize: '.72rem', fontWeight: 700, color: trend > 0 ? C.green : C.red,
          background: trend > 0 ? C.greenBg : C.redBg, padding: '.2rem .5rem', borderRadius: 99
        }}>
          {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}%
        </span>}
      </div>
      <div style={{ ...serif, fontSize: '2rem', fontWeight: 700, color, lineHeight: 1, marginBottom: '.3rem' }}>{value}</div>
      <div style={{ fontSize: '.82rem', fontWeight: 600, color: C.text, marginBottom: sub ? '.15rem' : 0 }}>{label}</div>
      {sub && <div style={{ fontSize: '.75rem', color: C.muted }}>{sub}</div>}
    </div>
  )
}

// ── Countdown for waitlist invite ────────────────────────────────
function WaitCountdown({ expiresAt }) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000))
    setSecs(calc())
    const t = setInterval(() => setSecs(calc()), 1000)
    return () => clearInterval(t)
  }, [expiresAt])
  const m = Math.floor(secs / 60), s = secs % 60
  return <span style={{ color: secs < 120 ? C.red : C.amber, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
    {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
  </span>
}

// ══════════════════════════════════════════════════════════════════
export default function PartnerDashboard() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [activeBranch, setActiveBranch] = useState(null)
  const [branches, setBranches] = useState([])
  const [bookings, setBookings] = useState([])
  const [menu, setMenu] = useState([])
  const [waitlist, setWaitlist] = useState([])
  const [reviews, setReviews] = useState([])          // B13
  const [notifications, setNotifications] = useState([])  // B09
  const [customerQuery, setCustomerQuery] = useState('')  // B14
  const [reviewFilter, setReviewFilter] = useState('ALL')
  const [branchStats, setBranchStats] = useState([])
  const [branchDailyStats, setBranchDailyStats] = useState([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [replyDrafts, setReplyDrafts] = useState({})  // { [reviewId]: text }
  const [bkFilter, setBkFilter] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [branchBookingList, setBranchBookings] = useState([])
  const floorPlan = useFloorPlanState(activeBranch?.id)
  const orderBoard = useOrderBoardState(activeBranch?.id)
  const menuState = useMenuState(activeBranch?.id)
  const [TABLE_STATUS, setTables] = useState([])

  // ── modal states ───────────────────────────────────
  const [policyModal, setPolicyModal] = useState(false)
  const [policy, setPolicy] = useState({ depositRequired: true, depositType: 'FIXED_AMOUNT', depositValue: '200000', freeCancellationHours: 2, lateCancellationPenaltyPercent: 50, noShowPenaltyPercent: 100 })
  const [branchForm, setBranchForm] = useState({ name: '', address: '', phone: '', province: '', latitude: '', longitude: '' })
  const [savingBranch, setSavingBranch] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)

  // B03: hồ sơ thương hiệu nhà hàng
  const [restaurant, setRestaurant] = useState(null)
  const [restaurantForm, setRestaurantForm] = useState({ restaurantName: '', logoUrl: '', description: '', cuisineType: '', phone: '', email: '', website: '' })
  const [savingRestaurant, setSavingRestaurant] = useState(false)

  // B04: khung giờ hoạt động & tạo chi nhánh mới
  const [operatingHours, setOperatingHours] = useState([])
  const [savingHours, setSavingHours] = useState(false)
  const [newBranchModal, setNewBranchModal] = useState(false)
  const [newBranchForm, setNewBranchForm] = useState({
    restaurantId: 1, // 👈 Thêm ID nhà hàng tương ứng vào đây
    name: '',
    address: '',
    province: '',
    phone: '',
    latitude: '',
    longitude: '',
    branchImages: [] // 👈 Nên khởi tạo mảng rỗng cho đúng DTO
  }); const [creatingBranch, setCreatingBranch] = useState(false)

  const CATEGORIES = ['Khai vị', 'Món chính', 'Lẩu', 'Hải sản', 'Đồ uống', 'Tráng miệng', 'Khác']

  // ── Load data ──────────────────────────────────────

  //dining table status



  useEffect(() => {
    branchApi.getMyList()
      .then(r => {
        console.log("r", r);
        const list = r.data?.data || []; setBranches(list); if (list.length) setActiveBranch(list[0])
      })
      .catch(() => { setBranches([]); setActiveBranch(null) })
    // B03: hồ sơ thương hiệu chung của nhà hàng
    restaurantApi.getMine()
      .then(r => { const d = r.data.data || null; setRestaurant(d); setRestaurantForm(f => ({ ...f, ...(d || {}) })) }

      )
      .catch(() => { setRestaurant(null); setRestaurantForm(f => ({ ...f, restaurantName: '', logoUrl: '', description: '', cuisineType: '', phone: '', email: '', website: '' })) })
  }, [])
  // console.log("activeBranch", activeBranch);
  useEffect(() => {
    if (!activeBranch) return
    const bid = activeBranch.id
    setBranchForm({
      name: activeBranch.name || '',
      address: activeBranch.address || '',
      phone: activeBranch.phone || '',
      province: activeBranch.province || '',
      latitude: activeBranch.latitude ?? '',
      longitude: activeBranch.longitude ?? '',
    })
    // B04: khung giờ hoạt động của chi nhánh
    operatingHourApi.getByBranch(bid)
      .then(r => setOperatingHours(r.data?.length ? r.data : []))
      .catch(() => setOperatingHours([]))
    bookingApi.myBookings().then(r => setBookings(r.data?.data || [])).catch(() => setBookings([]))
    // menu
    // menu (backend tra ve theo Danh muc -> Mon an, can flatten cho UI dang phang)
    menuApi.getByBranch(bid).then(r => {
      const categories = r.data || []
      setMenuCategories(categories)
      const flat = categories.flatMap(cat => (cat.items || []).map(it => ({
        id: it.id,
        name: it.itemName,
        category: cat.categoryName,
        price: Number(it.price),
        status: it.status,
        description: it.description || '',
        emoji: '🍽️', // backend chua ho tro emoji, chi hien thi mac dinh
      })))
      setMenu(flat.length ? flat : [])
    }).catch(() => { setMenuCategories([]); setMenu([]) })
    // waitlist
    setWaitlist([])
    // reviews (B13)
reviewApi.getByBranch(bid).then(r => {
  const raw = r.data?.data?.content || r.data?.content || r.data || []
  const list = raw.map(rv => ({
    ...rv,
    rating: rv.rating ?? Math.round((rv.spaceRating + rv.serviceRating + rv.foodRating) / 3),
  }))
  setReviews(list.length ? list : [])
}).catch(() => setReviews([]))
    // B05: chính sách đặt cọc/hủy của chi nhánh
    // depositPolicyApi.getByBranch(bid).then(r => {
    //   if (r.data) setPolicy(p => ({ ...p, ...r.data }))
    // }).catch(() => { })
  }, [activeBranch])

  // notifications (B09) — nạp 1 lần khi vào trang
  useEffect(() => {
    notificationApi.getUnread()
      .then(r => {
        const unread = r.data || []
        setNotifications(unread.length ? unread.map(n => ({ ...n, read: false })) : [])
      })
      .catch(() => setNotifications([]))
  }, [])

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!activeBranch?.id) return
      try {
        setStatsLoading(true)
        const [dashboardRes, dailyRes] = await Promise.all([
          restaurantApi.Dashboard(),
          restaurantApi.PerDayReports(activeBranch.id),
        ])

        const dashboardData = dashboardRes?.data?.data || []
        const dailyData = dailyRes?.data?.data || []

        setBranchStats(dashboardData)
        setBranchDailyStats(dailyData)
      } catch (error) {
        console.error('Failed to load branch dashboard stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchDashboardStats()
  }, [activeBranch?.id])

  // fetch upcoming book
  useEffect(() => {
    const fetchBranchBookings = async () => {
      if (!activeBranch?.id) return
      try {
        setStatsLoading(true)
        const branchBookingRes = await restaurantApi.UpcomingBooking(activeBranch.id)
        const branchBookingData = branchBookingRes?.data?.data || branchBookingRes?.data || []
        setBranchBookings(Array.isArray(branchBookingData) ? branchBookingData : [])
      } catch (error) {
        console.error('Failed to load upcomingData:', error)
        setBranchBookings([])
      } finally {
        setStatsLoading(false)
      }
    }

    fetchBranchBookings()
  }, [activeBranch?.id])

  // fetch tables
  useEffect(() => {
    if (!activeBranch?.id) {
      setTables([])
      return
    }

    restaurantApi.GetTablesByBranch(activeBranch.id)
      .then(res => {
        const payload =
          Array.isArray(res?.data?.data) ? res.data.data :
            Array.isArray(res?.data?.content) ? res.data.content :
              Array.isArray(res?.data) ? res.data :
                []

        setTables(payload)
      })
      .catch(() => setTables([]))
  }, [activeBranch?.id])

  const allTables = TABLE_STATUS
  const tablesByStatus = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  }

  allTables.forEach((table) => {
    const rawStatus = table?.status ?? table?.statusCode ?? table?.statusValue
    const statusCode = Number(rawStatus)

    if (Number.isNaN(statusCode) || !tablesByStatus[statusCode]) {
      tablesByStatus[1].push(table)
      return
    }

    tablesByStatus[statusCode].push(table)
  })

  // ── Computed stats ─────────────────────────────────
  // const allTables = floorPlan.zones.flatMap(z => z.tables || [])
  const today = new Date().toDateString()
  const todayBookings = (bookings || []).filter(b => b?.reservationTime && new Date(b.reservationTime).toDateString() === today)

  const activeBranchStats = branchStats.find(item => item.branchId === activeBranch?.id) || null
  const branchSummary = activeBranchStats ? {
    todayBooking: activeBranchStats.todayBooking || 0,
    totalServing: activeBranchStats.totalServing || 0,
    totalBooked: activeBranchStats.totalBooked || 0,
    totalWait: activeBranchStats.totalWait || 0,
    fillRate: activeBranchStats.fillRate ?? 0,
    noShowRate30Day: activeBranchStats.no_showRate30Day ?? 0,
    totalReviewScore: activeBranchStats.totalReviewScore ?? 0,
  } : null

  const stats = {
    totalTables: allTables.length,
    available: tablesByStatus[1].length,
    occupied: tablesByStatus[3].length,
    reserved: tablesByStatus[2].length,
    cleaning: tablesByStatus[4].length,
    maintenance: tablesByStatus[5].length,
    fillRate: branchSummary?.fillRate != null ? Number(branchSummary.fillRate) : (allTables.length ? Math.round((allTables.filter(t => t.status !== 1).length / allTables.length) * 100) : 0),
    todayConfirmed: branchSummary?.todayBooking ?? todayBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN').length,
    totalRevenue: bookings.filter(b => b.status === 'COMPLETED').reduce((s, b) => s + (b.depositAmount || 0), 0),
    noShowRate: branchSummary?.noShowRate30Day != null ? Number(branchSummary.noShowRate30Day) : (bookings.length ? Math.round((bookings.filter(b => b.status === 'NO_SHOW').length / bookings.length) * 100) : 0),
  }

  // B13: điểm đánh giá trung bình
  const visibleReviews = reviews.filter(r => !r.hidden)
  const avgRating = visibleReviews.length
    ? (visibleReviews.reduce((s, r) => s + r.rating, 0) / visibleReviews.length).toFixed(1) : '0.0'
  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star, count: visibleReviews.filter(r => r.rating === star).length,
  }))
  const filteredReviews = reviewFilter === 'ALL' ? visibleReviews
    : reviewFilter === 'UNREPLIED' ? visibleReviews.filter(r => !r.reply)
      : visibleReviews.filter(r => String(r.rating) === reviewFilter)
  // B09: thông báo chưa đọc
  const unreadCount = notifications.filter(n => !n.read).length
  // B14: hồ sơ khách hàng & lịch sử đặt bàn (gộp từ bookings)
  const customerProfiles = Object.values(
    bookings.reduce((acc, b) => {
      const key = b.contactPhone || b.contactName
      if (!acc[key]) acc[key] = { key, name: b.contactName, phone: b.contactPhone, bookings: [] }
      acc[key].bookings.push(b)
      return acc
    }, {})
  ).map(c => ({
    ...c,
    totalBookings: c.bookings.length,
    completed: c.bookings.filter(b => b.status === 'COMPLETED').length,
    noShows: c.bookings.filter(b => b.status === 'NO_SHOW').length,
    cancelled: c.bookings.filter(b => b.status?.startsWith('CANCELLED')).length,
    totalSpent: c.bookings.reduce((s, b) => s + (b.depositAmount || 0), 0),
    lastVisit: c.bookings.reduce((max, b) => new Date(b.reservationTime) > new Date(max) ? b.reservationTime : max, c.bookings[0].reservationTime),
  })).filter(c => !customerQuery.trim() ||
    c.name?.toLowerCase().includes(customerQuery.toLowerCase()) ||
    c.phone?.includes(customerQuery)
  ).sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit))
  // B15: thống kê kinh doanh
  const menuByCategory = CATEGORIES.map(cat => ({
    cat, count: menu.filter(m => m.category === cat).length,
    revenue: menu.filter(m => m.category === cat && m.status === 'SELLING').reduce((s, m) => s + m.price, 0),
  })).filter(x => x.count > 0)
  const bookingStatusBreakdown = Object.keys(BOOKING_STATUS).map(k => ({
    status: k, count: bookings.filter(b => b.status === k).length, meta: BOOKING_STATUS[k],
  })).filter(x => x.count > 0)

  const doBookingAction = async (id, action) => {
    try {
      if (action === 'check-in') await bookingApi.checkIn(id)
      if (action === 'check-out') await bookingApi.checkOut(id)
      if (action === 'no-show') await bookingApi.cancel(id, { reason: 'No-show' })
      if (action === 'cancel') await bookingApi.cancel(id, { cancelledByRestaurant: true })
    } catch { }
    setBookings(prev => prev.map(b => b.id === id ? {
      ...b, status: action === 'check-in' ? 'CHECKED_IN' : action === 'check-out' ? 'COMPLETED' : action === 'no-show' ? 'NO_SHOW' : 'CANCELLED_BY_RESTAURANT'
    } : b))
    toast.success(action === 'check-in' ? 'Check-in thành công!' : action === 'check-out' ? 'Check-out & Hoàn tất!' : 'Đã cập nhật trạng thái')
  }

  // ── B13: phản hồi đánh giá ───────────────────────────
  const submitReply = (reviewId) => {
    const text = (replyDrafts[reviewId] || '').trim()
    if (!text) { toast.error('Vui lòng nhập nội dung phản hồi'); return }
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: text } : r))
    setReplyDrafts(prev => ({ ...prev, [reviewId]: '' }))
    toast.success('Đã gửi phản hồi đánh giá!')
  }

  // ── B09: xử lý thông báo ─────────────────────────────
  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }
  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('Đã đánh dấu tất cả đã đọc')
  }

  // ── B03: hồ sơ thương hiệu chung ─────────────────────
  const saveRestaurantInfo = async () => {
    if (!restaurantForm.restaurantName.trim()) {
      toast.error('Tên thương hiệu không được để trống'); return
    }
    setSavingRestaurant(true)
    try {
      const { data: res } = await restaurantApi.update(restaurantForm)
      setRestaurant(res.data)
      toast.success(
        res.data?.approvalStatus === 'PENDING_UPDATE'
          ? 'Đã lưu! Logo/mô tả mới đang chờ quản trị viên duyệt.'
          : 'Đã lưu thông tin thương hiệu!'
      )
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu thông tin thương hiệu')
    } finally { setSavingRestaurant(false) }
  }
  const cancelRestaurantPendingUpdate = async () => {
    try {
      const { data: res } = await restaurantApi.cancelPendingUpdate()
      setRestaurant(res.data); setRestaurantForm(f => ({ ...f, ...res.data }))
      toast.success('Đã huỷ yêu cầu cập nhật, khôi phục phiên bản đã duyệt trước đó')
    } catch { toast.error('Không thể huỷ yêu cầu cập nhật') }
  }

  const saveBranchInfo = async () => {
    if (!activeBranch) return
    if (!branchForm.name.trim() || !branchForm.address.trim()) {
      toast.error('Tên chi nhánh và địa chỉ không được để trống')
      return
    }
    setSavingBranch(true)
    try {
      const payload = {
        ...branchForm, latitude: branchForm.latitude === '' ? null : Number(branchForm.latitude),
        longitude: branchForm.longitude === '' ? null : Number(branchForm.longitude)
      }
      const { data: res } = await branchApi.update(activeBranch.id, payload)
      const updated = res.data
      setBranches(prev => prev.map(b => b.id === activeBranch.id ? { ...b, ...updated } : b))
      setActiveBranch(prev => ({ ...prev, ...updated }))
      toast.success('Đã lưu thông tin chi nhánh!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu thông tin chi nhánh')
    } finally {
      setSavingBranch(false)
    }
  }

  // ── B04: khung giờ hoạt động ──────────────────────────
  // const updateHourField = (day, field, value) => {
  //   setOperatingHours(prev => prev.map(h => h.dayOfWeek === day ? { ...h, [field]: value } : h))
  // }
  // const saveOperatingHours = async () => {
  //   if (!activeBranch) return
  //   const invalid = operatingHours.find(h => h.closeTime <= h.openTime)
  //   if (invalid) { toast.error(`Giờ đóng cửa phải sau giờ mở cửa (${WEEKDAYS.find(w => w[0] === invalid.dayOfWeek)?.[1]})`); return }
  //   setSavingHours(true)
  //   try {
  //     await operatingHourApi.save(activeBranch.id, operatingHours.map(h => ({
  //       dayOfWeek: h.dayOfWeek, openTime: h.openTime, closeTime: h.closeTime, shiftName: h.shiftName || 'Cả ngày',
  //     })))
  //     toast.success('Đã lưu khung giờ hoạt động!')
  //   } catch (err) {
  //     toast.error(err.response?.data?.message || 'Khung giờ không hợp lệ, vui lòng kiểm tra lại')
  //   } finally { setSavingHours(false) }
  // }

  // ── B04 AF03: tạm ngưng / mở lại chi nhánh ────────────
  const toggleBranchStatus = async () => {
    if (!activeBranch) return
    const isSuspended = activeBranch.status === 5
    const nextStatus = isSuspended ? 'ACTIVE' : 'SUSPENDED'
    if (!isSuspended && !window.confirm('Tạm ngưng chi nhánh sẽ ẩn khỏi tìm kiếm, ngừng nhận đặt bàn mới và tự động đóng toàn bộ hàng chờ đang hoạt động. Tiếp tục?')) return
    setChangingStatus(true)
    try {
      const { data: res } = await branchApi.updateStatus(activeBranch.id, nextStatus)
      const updated = res.data || { status: isSuspended ? 2 : 5 }
      setBranches(prev => prev.map(b => b.id === activeBranch.id ? { ...b, ...updated } : b))
      setActiveBranch(prev => ({ ...prev, ...updated }))
      toast.success(isSuspended ? 'Đã mở lại chi nhánh' : 'Đã tạm ngưng chi nhánh, hàng chờ đang hoạt động sẽ tự động đóng')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đổi trạng thái chi nhánh')
    } finally { setChangingStatus(false) }
  }

  // ── B04 bước 1: tạo chi nhánh mới ─────────────────────
  // ── B17: kiểm tra hạn mức chi nhánh theo gói trước khi mở form tạo mới ──
  // Đây CHỈ là UX cảnh báo sớm - backend (BranchService) vẫn tự kiểm tra lại
  // khi thực sự submit, nên không bỏ qua bước gọi API tạo chi nhánh thật.
  const openNewBranchModal = async () => {
    try {
      const { data: res } = await subscriptionApi.checkBranchLimit()
      const check = res?.data
      if (check && !check.allowed) {
        toast.error(check.message || 'Đã đạt giới hạn chi nhánh của gói hiện tại')
        setActiveTab('billing')
        return
      }
    } catch {
      // Nếu API kiểm tra lỗi (vd. chưa có gói) vẫn cho mở form - backend sẽ chặn đúng lúc submit
    }
    setNewBranchModal(true)
  }

  const createBranch = async (e) => {
    e.preventDefault()
    if (!newBranchForm.name.trim() || !newBranchForm.address.trim()) {
      toast.error('Tên chi nhánh và địa chỉ không được để trống'); return
    }
    setCreatingBranch(true)
    try {
      const payload = {
        ...newBranchForm,
        restaurantId: Number(newBranchForm.restaurantId),
        latitude: newBranchForm.latitude === '' || newBranchForm.latitude === null
          ? null
          : Number(newBranchForm.latitude),
        longitude: newBranchForm.longitude === '' || newBranchForm.longitude === null
          ? null
          : Number(newBranchForm.longitude),
      };
      const { data: res } = await branchApi.create(payload)
      const created = res.data || { id: Date.now(), ...newBranchForm, status: 3 }
      setBranches(prev => [...prev, created])
      setActiveBranch(created)
      setNewBranchModal(false)
      setNewBranchForm({ name: '', address: '', province: '', phone: '', latitude: '', longitude: '' })
      toast.success('Đã tạo chi nhánh mới! Đang chờ quản trị viên duyệt.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo chi nhánh')
    } finally { setCreatingBranch(false) }
  }

  // ── B05: lưu chính sách đặt cọc/hủy ───────────────────
  const savePolicy = async (e) => {
    e.preventDefault()
    if (!activeBranch) return
    if (policy.depositRequired && policy.depositType === 'PERCENTAGE' && Number(policy.depositValue) > 100) {
      toast.error('Tỷ lệ cọc không được vượt quá 100% (EF01)'); return
    }
    if (policy.depositRequired && Number(policy.depositValue) < 0) {
      toast.error('Mức cọc không được âm (EF01)'); return
    }
    try {
      await depositPolicyApi.upsert(activeBranch.id, {
        ...policy,
        depositValue: Number(policy.depositValue) || 0,
        freeCancellationHours: Number(policy.freeCancellationHours) || 0,
        lateCancellationPenaltyPercent: Number(policy.lateCancellationPenaltyPercent) || 0,
        noShowPenaltyPercent: Number(policy.noShowPenaltyPercent) || 0,
      })
      toast.success('Đã lưu chính sách! Áp dụng ngay cho các đơn đặt bàn mới.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu chính sách')
    }
  }

  // ── Styles ─────────────────────────────────────────
  const S = {
    eyebrow: { fontSize: '.7rem', fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: C.gold },
    label: { fontSize: '.73rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: C.brownMid, display: 'block', marginBottom: '.4rem' },
    input: { width: '100%', padding: '.65rem .875rem', border: `1.5px solid ${C.border}`, borderRadius: 4, fontFamily: 'inherit', fontSize: '.88rem', background: C.cream, color: C.text, outline: 'none', transition: 'border-color .2s' },
    card: { background: C.white, borderRadius: 4, boxShadow: '0 2px 12px rgba(61,43,31,.08)', padding: '1.5rem' },
    btnGold: { background: C.gold, color: C.brown, border: 'none', padding: '.6rem 1.4rem', fontWeight: 700, fontSize: '.82rem', letterSpacing: '.08em', textTransform: 'uppercase', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' },
    btnBrown: { background: C.brown, color: '#fff', border: 'none', padding: '.6rem 1.4rem', fontWeight: 600, fontSize: '.82rem', letterSpacing: '.06em', textTransform: 'uppercase', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' },
    btnOut: { background: 'transparent', color: C.brown, border: `1.5px solid ${C.border}`, padding: '.58rem 1.2rem', fontWeight: 500, fontSize: '.82rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' },
    btnSm: { padding: '.35rem .875rem', fontSize: '.75rem', fontWeight: 600, letterSpacing: '.04em', borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit', border: 'none', transition: 'all .2s' },
  }

  // ── TABS config ────────────────────────────────────
  const TABS = [
    { id: 'dashboard', icon: '📊', label: 'Tổng quan' },
    { id: 'bookings', icon: '📋', label: 'Đặt bàn' },
    { id: 'order_board', icon: '🛎️', label: 'Gọi món' },
    { id: 'tables', icon: '🪑', label: 'Sơ đồ bàn' },
    { id: 'menu', icon: '🍜', label: 'Thực đơn' },
    { id: 'waitlist', icon: '⏳', label: 'Hàng chờ' },
    { id: 'customers', icon: '👤', label: 'Khách hàng' },
    { id: 'reviews', icon: '⭐', label: 'Đánh giá', badge: reviews.filter(r => !r.reply && !r.hidden).length },
    { id: 'reports', icon: '📈', label: 'Thống kê' },
    { id: 'policy', icon: '💰', label: 'Chính sách' },
    { id: 'operating-hours', icon: '⏰', label: 'Khung giờ hoạt động' },
    { id: 'billing', icon: '💳', label: 'Gói dịch vụ' },
    { id: 'notifications', icon: '🔔', label: 'Thông báo', badge: unreadCount },
    { id: 'settings', icon: '⚙️', label: 'Cài đặt' },
  ]

  // ── Filtered bookings ──────────────────────────────
  const filteredBookings = bkFilter === 'ALL' ? branchBookingList : branchBookingList.filter(b => b.status === bkFilter)

  // ── RENDER ─────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif", background: C.cream }}>
      <link href={FONT_LINK} rel="stylesheet" />

      {/* ════════ SIDEBAR ════════ */}
      <aside style={{
        width: 240, flexShrink: 0, background: C.brown,
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{ padding: '1.75rem 1.5rem 1.25rem', borderBottom: `1px solid rgba(255,255,255,.08)` }}>
          <div style={{ ...serif, fontSize: '1.45rem', fontWeight: 700, color: C.gold, letterSpacing: '.04em', cursor: 'pointer' }}
            onClick={() => navigate('/')}>
            DA<span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,.45)' }}>bana</span>
          </div>
          <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.35)', marginTop: '.25rem', letterSpacing: '.08em' }}>
            PORTAL NHÀ HÀNG
          </div>
        </div>

        {/* Branch selector */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid rgba(255,255,255,.08)` }}>
          <div style={{
            fontSize: '.68rem', fontWeight: 600, letterSpacing: '.15em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,.3)', marginBottom: '.5rem'
          }}>Chi nhánh</div>
          <select
            value={activeBranch?.id || ''}
            onChange={e => {
              const b = branches.find(x => x.id == e.target.value);
              if (b) setActiveBranch(b);
            }}
            style={{
              width: '100%', padding: '.55rem .75rem', borderRadius: 4, border: 'none',
              background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.85)', fontSize: '.82rem', fontFamily: 'inherit', cursor: 'pointer'
            }}
          >
            {branches.map((b, index) => (
              // Dùng b.id + index để đảm bảo key không bao giờ bị trùng, 
              // và thêm style color để tránh chữ bị tàng hình trên một số trình duyệt
              <option key={`${b.id}-${index}`} value={b.id} style={{ color: '#333' }}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Nav links */}
        <nav style={{ padding: '1rem 0', flex: 1 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: '.875rem',
              width: '100%', padding: '.75rem 1.5rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: activeTab === tab.id ? 'rgba(201,168,76,.15)' : 'transparent',
              color: activeTab === tab.id ? C.goldLight : 'rgba(255,255,255,.5)',
              fontSize: '.85rem', fontWeight: activeTab === tab.id ? 600 : 400,
              borderLeft: activeTab === tab.id ? `3px solid ${C.gold}` : '3px solid transparent',
              transition: 'all .15s', textAlign: 'left'
            }}>
              <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
              <span style={{ flex: 1 }}>{tab.label}</span>
              {!!tab.badge && (
                <span style={{
                  background: C.gold, color: C.brown, fontSize: '.68rem', fontWeight: 800,
                  borderRadius: 99, padding: '.05rem .45rem', minWidth: 18, textAlign: 'center'
                }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div style={{
          padding: '1.25rem 1.5rem', borderTop: `1px solid rgba(255,255,255,.08)`,
          display: 'flex', alignItems: 'center', gap: '.75rem'
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: C.gold,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
            color: C.brown, fontSize: '.9rem', flexShrink: 0
          }}>
            {(auth?.fullName || 'N')[0]}
          </div>
          <div>
            <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'rgba(255,255,255,.8)', lineHeight: 1.2 }}>{auth?.fullName || 'Nhà hàng'}</div>
            <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)' }}>Đối tác</div>
          </div>
        </div>
      </aside>

      {/* ════════ MAIN CONTENT ════════ */}
      <main style={{ flex: 1, overflowY: 'auto', maxHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{
          background: C.white, borderBottom: `1px solid ${C.border}`,
          padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(8px)'
        }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: C.text }}>
              {TABS.find(t => t.id === activeTab)?.icon} {TABS.find(t => t.id === activeTab)?.label}
            </h1>
            <p style={{ fontSize: '.78rem', color: C.muted, marginTop: '.1rem' }}>
              {activeBranch?.name} · {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
            {waitlist.some(w => w.status === 'INVITED') && (
              <div style={{
                background: C.amberBg, border: `1px solid ${C.amber}44`, borderRadius: 4,
                padding: '.4rem .875rem', fontSize: '.78rem', fontWeight: 600, color: C.amber
              }}>
                ⏳ Có lời mời hàng chờ đang chờ phản hồi
              </div>
            )}
            <button onClick={() => setActiveTab('notifications')} style={{ ...S.btnOut, padding: '.45rem .75rem', fontSize: '.9rem', position: 'relative' }}>
              🔔
              {unreadCount > 0 && <span style={{
                position: 'absolute', top: -4, right: -4, background: C.red, color: '#fff',
                fontSize: '.62rem', fontWeight: 800, borderRadius: 99, padding: '.05rem .35rem'
              }}>{unreadCount}</span>}
            </button>
            <button onClick={() => navigate('/')} style={{ ...S.btnOut, padding: '.45rem 1rem', fontSize: '.78rem' }}>
              🌐 Về trang chủ
            </button>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>

          {/* ══════ DASHBOARD ══════ */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{ ...S.eyebrow, marginBottom: '1.5rem' }}>Tổng quan hôm nay</div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <StatCard icon="📅" label="Đặt bàn hôm nay" value={stats.todayConfirmed} sub="đang chờ đón khách" color={C.gold} trend={12} />
                <StatCard icon="🪑" label="Tỷ lệ lấp đầy" value={`${stats.fillRate}%`} sub={`${stats.available}/${stats.totalTables} bàn trống`} color={C.green} trend={5} />
                <StatCard icon="👥" label="Đang phục vụ" value={stats.occupied} sub="bàn đang có khách" color={C.amber} />
                <StatCard icon="📋" label="Bàn đã đặt" value={stats.reserved} sub="sắp có khách đến" color={C.blue} />
                <StatCard icon="⏳" label="Hàng chờ" value={waitlist.filter(w => w.status === 'WAITING').length} sub="đang chờ bàn trống" color={C.purple} />
                <StatCard icon="❌" label="Tỷ lệ No-show" value={`${stats.noShowRate}%`} sub="trong 30 ngày qua" color={C.red} />
                <StatCard icon="⭐" label="Đánh giá trung bình" value={avgRating} sub={`${visibleReviews.length} lượt đánh giá`} color={C.gold} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Mini sơ đồ bàn */}
                <div style={S.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={S.eyebrow}>Trạng thái bàn</div>
                    <button onClick={() => setActiveTab('tables')} style={{ ...S.btnSm, background: C.goldSubtle, color: C.goldDark, border: `1px solid ${C.goldBorder}` }}>
                      Xem chi tiết →
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {[
                      { code: 1, label: 'Trống', count: tablesByStatus[1].length, color: C.green, bg: C.greenBg },
                      { code: 2, label: 'Đã đặt', count: tablesByStatus[2].length, color: C.red, bg: C.redBg },
                      { code: 3, label: 'Đang dùng', count: tablesByStatus[3].length, color: C.amber, bg: C.amberBg },
                      { code: 4, label: 'Dọn dẹp', count: tablesByStatus[4].length, color: C.slate, bg: 'rgba(148,163,184,.12)' },
                      { code: 5, label: 'Bảo trì', count: tablesByStatus[5].length, color: C.brown, bg: 'rgba(61,43,31,.1)' },
                    ].map(({ code, label, count, color, bg }) => (
                      <div key={code} style={{
                        display: 'flex', alignItems: 'center', gap: '.5rem',
                        background: bg, border: `1px solid ${color}22`, borderRadius: 4, padding: '.4rem .75rem'
                      }}>
                        <span style={{ color, fontSize: '.8rem', fontWeight: 700 }}>{count}</span>
                        <span style={{ fontSize: '.75rem', color: C.muted }}>{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Bar chart */}

                  {/* {allTables.length > 0 && (
                    <div style={{ height: 12, borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
                      {Object.entries(TABLE_STATUS).map(([k, { color }]) => {
                        const w = allTables.length ? allTables.filter(t => t.status === Number(k)).length / allTables.length * 100 : 0
                        return w > 0 ? <div key={k} style={{ width: `${w}%`, background: color, transition: 'width .5s' }} /> : null
                      })}
                    </div>
                  )} */}
                </div>

                {/* Upcoming bookings */}
                <div style={S.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={S.eyebrow}>Đặt bàn sắp tới</div>
                    <button onClick={() => setActiveTab('bookings')} style={{ ...S.btnSm, background: C.goldSubtle, color: C.goldDark, border: `1px solid ${C.goldBorder}` }}>
                      Xem tất cả →
                    </button>
                  </div>
                  {branchBookingList.filter(b => ['CONFIRMED', 'CHECKED_IN'].includes(b.status)).slice(0, 5).map(b => (
                    <div key={b.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '.6rem 0', borderBottom: `1px solid ${C.creamDark}`, gap: '.5rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: '.87rem', color: C.text }}>{b.contactName}</p>
                        <p style={{ fontSize: '.75rem', color: C.muted }}>
                          Bàn {b.tableCode} · {b.guestCount} khách · {new Date(b.reservationTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <Badge status={b.status} statusMap={BOOKING_STATUS} />
                    </div>
                  ))}
                  {branchBookingList.filter(b => ['CONFIRMED', 'CHECKED_IN'].includes(b.status)).length === 0 && (
                    <p style={{ color: C.muted, fontSize: '.85rem', textAlign: 'center', padding: '1.5rem 0' }}>Không có đặt bàn sắp tới</p>
                  )}
                </div>

                {/* Revenue chart placeholder */}
                <div style={{ ...S.card, gridColumn: '1/-1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={S.eyebrow}>Doanh thu tiền cọc 7 ngày gần nhất</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.625rem', height: 120 }}>
                    {[65, 45, 80, 55, 90, 70, 100].map((h, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.35rem' }}>
                        <div style={{
                          width: '100%', background: `linear-gradient(to top,${C.gold},${C.goldLight})`,
                          height: `${h}%`, borderRadius: '4px 4px 0 0', transition: 'height .5s',
                          minHeight: 4, cursor: 'default'
                        }}
                          title={`${(h * 5000).toLocaleString('vi-VN')}₫`} />
                        <span style={{ fontSize: '.65rem', color: C.muted }}>
                          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════ TAB BRANCH BOOKINGS LIST══════ */}
          {activeTab === 'bookings' && (
            <div>
              {/* thanh lọc */}
              <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[['ALL', 'Tất cả'], ['CONFIRMED', 'Đã xác nhận'], ['CHECKED_IN', 'Đang phục vụ'],
                ['PENDING_NO_SHOW', 'Nghi No-show'], ['COMPLETED', 'Hoàn tất'], ['CANCELLED_BY_CUSTOMER', 'Đã huỷ']].map(([k, l]) => (
                  <button key={k} onClick={() => setBkFilter(k)} style={{
                    ...S.btnSm,
                    background: bkFilter === k ? C.brown : C.white,
                    color: bkFilter === k ? '#fff' : C.muted,
                    border: `1.5px solid ${bkFilter === k ? C.brown : C.border}`,
                  }}>{l} {k === 'ALL' ? `(${branchBookingList.length})` : branchBookingList.filter(b => b.status === k).length > 0 ? `(${branchBookingList.filter(b => b.status === k).length})` : ''}</button>
                ))}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredBookings.length === 0 && (
                  <div style={{ ...S.card, textAlign: 'center', padding: '3rem', color: C.muted }}>
                    Không có đặt bàn nào ở trạng thái này
                  </div>
                )}
                {/* danh sách đơn đặt */}
                {filteredBookings.map(b => {
                  const meta = BOOKING_STATUS[b.status] || { color: C.muted, bg: 'rgba(138,110,87,.1)', label: b.status }
                  return (
                    <div key={b.id} style={{ ...S.card, border: `1px solid ${C.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.875rem', flexWrap: 'wrap', gap: '.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.3rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '.95rem' }}>#{b.id} — {b.contactName}</span>
                            <Badge status={b.status} statusMap={BOOKING_STATUS} />
                          </div>
                          <p style={{ fontSize: '.8rem', color: C.muted }}>{b.contactPhone}{b.note && ` · 📝 ${b.note}`}</p>
                        </div>
                        <p style={{ fontSize: '.78rem', color: C.muted }}>
                          {new Date(b.reservationTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '.85rem', marginBottom: '1rem' }}>
                        
                        {/*  chi tiết tất cả bàn đặt */}
                        {/* TODO: lấy danh sách bàn đặt của đơn đặt */}
                        <span>🪑 Bàn: </span>
                        <span>👥 Khách: <strong>{b.guestCount}</strong></span>
                        {b.depositAmount > 0 && <span>💰 Cọc: <strong style={{ color: C.goldDark }}>{Number(b.depositAmount).toLocaleString('vi-VN')}₫</strong></span>}
                      </div>
                      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                        {b.status === 'CONFIRMED' && <>
                          <button onClick={() => doBookingAction(b.id, 'check-in')} style={{ ...S.btnSm, background: C.green, color: '#fff' }}>✅ Check-in</button>
                          <button onClick={() => doBookingAction(b.id, 'cancel')} style={{ ...S.btnSm, background: C.redBg, color: C.red, border: `1px solid ${C.red}33` }}>🚫 Huỷ (NH)</button>
                        </>}
                        {b.status === 'CHECKED_IN' && (
                          <button onClick={() => doBookingAction(b.id, 'check-out')} style={{ ...S.btnSm, background: C.brown, color: '#fff' }}>🚪 Check-out</button>
                        )}
                        {b.status === 'PENDING_NO_SHOW' && <>
                          <button onClick={() => doBookingAction(b.id, 'check-in')} style={{ ...S.btnSm, background: C.green, color: '#fff' }}>✅ Khách vừa đến</button>
                          <button onClick={() => doBookingAction(b.id, 'no-show')} style={{ ...S.btnSm, background: C.red, color: '#fff' }}>❌ Chốt No-show</button>
                        </>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ══════ GỌI MÓN (TAB GỌI MÓN - realtime bàn) ══════ */}
          {activeTab === 'order_board' && (
            <OrderBoardTab orderBoard={orderBoard} />
          )}

          {/* ══════ TABLES / SƠ ĐỒ BÀN ══════ */}
          {activeTab === 'tables' && (
            <div className="table-layout-container">
              <TableLayoutTab floorPlan={floorPlan} />
            </div>
          )}

          {/* ══════ MENU ══════ */}
          {activeTab === 'menu' && (
            <MenuManagementTab menu={menuState} />
          )}

          {/* ══════ WAITLIST ══════ */}
          {activeTab === 'waitlist' && (
            <div>
              <div style={{ ...S.card, marginBottom: '1.25rem', background: `linear-gradient(135deg,${C.brown},${C.brownMid})` }}>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Đang chờ', value: waitlist.filter(w => w.status === 'WAITING').length, color: C.goldLight },
                    { label: 'Đã mời', value: waitlist.filter(w => w.status === 'INVITED').length, color: C.amber },
                    { label: 'Đã chuyển', value: waitlist.filter(w => w.status === 'CONVERTED').length, color: C.green },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ ...serif, fontSize: '2rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                      <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)', marginTop: '.25rem', letterSpacing: '.08em' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {waitlist.length === 0 && (
                  <div style={{ ...S.card, textAlign: 'center', padding: '3rem', color: C.muted }}>
                    Không có khách hàng nào trong hàng chờ
                  </div>
                )}
                {waitlist.map((w, i) => (
                  <div key={w.id} style={{ ...S.card, border: `1.5px solid ${w.status === 'INVITED' ? C.amber + '55' : C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.3rem' }}>
                          <span style={{ fontWeight: 700 }}>#{i + 1} — {w.customer?.fullName}</span>
                          <span style={{
                            fontSize: '.7rem', fontWeight: 700, padding: '.2rem .6rem', borderRadius: 99,
                            background: w.status === 'WAITING' ? C.blueBg : w.status === 'INVITED' ? C.amberBg : C.greenBg,
                            color: w.status === 'WAITING' ? C.blue : w.status === 'INVITED' ? C.amber : C.green,
                          }}>{w.status === 'WAITING' ? 'Đang chờ' : w.status === 'INVITED' ? 'Đã mời' : 'Đã chuyển'}</span>
                        </div>
                        <p style={{ fontSize: '.82rem', color: C.muted }}>
                          👥 {w.guestCount} khách · ⏰ Giờ mong muốn: {new Date(w.desiredTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p style={{ fontSize: '.75rem', color: C.muted, marginTop: '.2rem' }}>
                          Đăng ký lúc {new Date(w.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {w.status === 'INVITED' && w.inviteExpiresAt && (
                        <div style={{
                          background: C.amberBg, border: `1px solid ${C.amber}33`, borderRadius: 4,
                          padding: '.6rem 1rem', textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '.7rem', color: C.muted, marginBottom: '.2rem' }}>Hạn phản hồi</div>
                          <WaitCountdown expiresAt={w.inviteExpiresAt} />
                        </div>
                      )}
                    </div>
                    {w.status === 'WAITING' && (
                      <div style={{ marginTop: '.875rem', paddingTop: '.875rem', borderTop: `1px solid ${C.creamDark}` }}>
                        <button onClick={() => {
                          setWaitlist(p => p.map(x => x.id === w.id ? { ...x, status: 'INVITED', inviteExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() } : x))
                          toast.success('Đã gửi lời mời đến khách hàng!')
                        }} style={{ ...S.btnSm, background: C.gold, color: C.brown }}>📨 Gửi lời mời</button>
                        <button onClick={() => { setWaitlist(p => p.filter(x => x.id !== w.id)); toast.success('Đã xoá khỏi hàng chờ') }}
                          style={{ ...S.btnSm, background: C.redBg, color: C.red, border: `1px solid ${C.red}22`, marginLeft: '.5rem' }}>
                          ✕ Xoá
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════ CUSTOMERS (B14) ══════ */}
          {activeTab === 'customers' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <input style={{ ...S.input, maxWidth: 340 }} placeholder="🔍 Tìm theo tên hoặc số điện thoại..."
                  value={customerQuery} onChange={e => setCustomerQuery(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {customerProfiles.length === 0 && (
                  <div style={{ ...S.card, textAlign: 'center', padding: '3rem', color: C.muted }}>Chưa có dữ liệu khách hàng</div>
                )}
                {customerProfiles.map(c => (
                  <div key={c.key} style={{ ...S.card, border: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', gap: '.875rem', alignItems: 'center' }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: '50%', background: C.goldSubtle,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: C.goldDark, flexShrink: 0
                        }}>
                          {(c.name || 'K')[0]}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '.92rem' }}>{c.name}</p>
                          <p style={{ fontSize: '.78rem', color: C.muted }}>{c.phone}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '.8rem', textAlign: 'center' }}>
                        <div><div style={{ fontWeight: 700, color: C.text }}>{c.totalBookings}</div><div style={{ color: C.muted, fontSize: '.72rem' }}>Lượt đặt</div></div>
                        <div><div style={{ fontWeight: 700, color: C.green }}>{c.completed}</div><div style={{ color: C.muted, fontSize: '.72rem' }}>Hoàn tất</div></div>
                        <div><div style={{ fontWeight: 700, color: C.red }}>{c.noShows + c.cancelled}</div><div style={{ color: C.muted, fontSize: '.72rem' }}>Huỷ/No-show</div></div>
                        <div><div style={{ fontWeight: 700, color: C.goldDark }}>{c.totalSpent.toLocaleString('vi-VN')}₫</div><div style={{ color: C.muted, fontSize: '.72rem' }}>Tổng cọc</div></div>
                      </div>
                    </div>
                    <div style={{ marginTop: '.875rem', paddingTop: '.875rem', borderTop: `1px solid ${C.creamDark}`, fontSize: '.78rem', color: C.muted }}>
                      Lần đến gần nhất: {new Date(c.lastVisit).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {(c.noShows >= 2) && <span style={{ marginLeft: '.75rem', color: C.red, fontWeight: 700 }}>⚠ Khách hàng có tiền sử No-show</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════ REVIEWS (B13) ══════ */}
          {activeTab === 'reviews' && (
            <div>
              <div style={{ ...S.card, marginBottom: '1.25rem', display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ ...serif, fontSize: '2.6rem', fontWeight: 700, color: C.gold, lineHeight: 1 }}>{avgRating}</div>
                  <div style={{ color: C.gold, fontSize: '.9rem', marginTop: '.25rem' }}>{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</div>
                  <div style={{ fontSize: '.72rem', color: C.muted, marginTop: '.2rem' }}>{visibleReviews.length} đánh giá</div>
                </div>
                <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                  {ratingBreakdown.map(({ star, count }) => (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                      <span style={{ fontSize: '.75rem', color: C.muted, width: 34 }}>{star} ★</span>
                      <div style={{ flex: 1, height: 8, borderRadius: 99, background: C.creamDark, overflow: 'hidden' }}>
                        <div style={{ width: `${visibleReviews.length ? count / visibleReviews.length * 100 : 0}%`, height: '100%', background: C.gold }} />
                      </div>
                      <span style={{ fontSize: '.75rem', color: C.muted, width: 20 }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {[['ALL', 'Tất cả'], ['UNREPLIED', 'Chưa phản hồi'], ['5', '5 sao'], ['4', '4 sao'], ['3', '3 sao'], ['2', '2 sao'], ['1', '1 sao']].map(([k, l]) => (
                  <button key={k} onClick={() => setReviewFilter(k)} style={{
                    ...S.btnSm,
                    background: reviewFilter === k ? C.brown : C.white, color: reviewFilter === k ? '#fff' : C.muted,
                    border: `1.5px solid ${reviewFilter === k ? C.brown : C.border}`
                  }}>{l}</button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredReviews.length === 0 && (
                  <div style={{ ...S.card, textAlign: 'center', padding: '3rem', color: C.muted }}>Không có đánh giá phù hợp</div>
                )}
                {filteredReviews.map(r => (
                  <div key={r.id} style={{ ...S.card, border: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.5rem' }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '.9rem' }}>{r.customer?.fullName || r.customerName}</p>
                        <p style={{ color: C.gold, fontSize: '.85rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p>
                      </div>
                      <span style={{ fontSize: '.75rem', color: C.muted }}>
                        {new Date(r.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '.87rem', color: C.text, margin: '.75rem 0', lineHeight: 1.6 }}>{r.comment}</p>
                    {r.reply ? (
                      <div style={{ background: C.cream, borderLeft: `3px solid ${C.gold}`, borderRadius: 4, padding: '.75rem 1rem' }}>
                        <p style={{ fontSize: '.72rem', fontWeight: 700, color: C.goldDark, marginBottom: '.2rem' }}>PHẢN HỒI TỪ NHÀ HÀNG</p>
                        <p style={{ fontSize: '.83rem', color: C.muted }}>{r.reply}</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
                        <input style={{ ...S.input, flex: 1 }} placeholder="Viết phản hồi tới khách hàng..."
                          value={replyDrafts[r.id] || ''} onChange={e => setReplyDrafts(p => ({ ...p, [r.id]: e.target.value }))} />
                        <button onClick={() => submitReply(r.id)} style={{ ...S.btnGold, padding: '.6rem 1.2rem' }}>Gửi</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════ REPORTS / THỐNG KÊ (B15) ══════ */}
          {activeTab === 'reports' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <StatCard icon="💰" label="Doanh thu cọc (tổng)" value={`${stats.totalRevenue.toLocaleString('vi-VN')}₫`} sub="từ đơn hoàn tất" color={C.gold} />
                <StatCard icon="📋" label="Tổng lượt đặt" value={bookings.length} sub={`${todayBookings.length} hôm nay`} color={C.blue} />
                <StatCard icon="👥" label="Khách hàng" value={customerProfiles.length} sub="đã từng đặt bàn" color={C.purple} />
                <StatCard icon="🍽️" label="Món đang bán" value={menu.filter(m => m.status === 'SELLING').length} sub={`/${menu.length} món`} color={C.green} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={S.card}>
                  <div style={{ ...S.eyebrow, marginBottom: '1rem' }}>Tỷ trọng trạng thái đặt bàn</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                    {bookingStatusBreakdown.map(({ status, count, meta }) => (
                      <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                        <span style={{ fontSize: '.78rem', color: C.muted, width: 120 }}>{meta.label}</span>
                        <div style={{ flex: 1, height: 10, borderRadius: 99, background: C.creamDark, overflow: 'hidden' }}>
                          <div style={{ width: `${bookings.length ? count / bookings.length * 100 : 0}%`, height: '100%', background: meta.color }} />
                        </div>
                        <span style={{ fontSize: '.78rem', fontWeight: 700, color: meta.color, width: 24, textAlign: 'right' }}>{count}</span>
                      </div>
                    ))}
                    {bookingStatusBreakdown.length === 0 && <p style={{ color: C.muted, fontSize: '.85rem' }}>Chưa có dữ liệu</p>}
                  </div>
                </div>

                <div style={S.card}>
                  <div style={{ ...S.eyebrow, marginBottom: '1rem' }}>Thực đơn theo danh mục</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                    {menuByCategory.map(({ cat, count, revenue }) => (
                      <div key={cat} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '.5rem 0', borderBottom: `1px solid ${C.creamDark}`
                      }}>
                        <span style={{ fontSize: '.85rem', color: C.text }}>{cat}</span>
                        <span style={{ fontSize: '.78rem', color: C.muted }}>{count} món · giá TB {(revenue / (count || 1)).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}₫</span>
                      </div>
                    ))}
                    {menuByCategory.length === 0 && <p style={{ color: C.muted, fontSize: '.85rem' }}>Chưa có dữ liệu</p>}
                  </div>
                </div>

                <div style={{ ...S.card, gridColumn: '1/-1' }}>
                  <div style={{ ...S.eyebrow, marginBottom: '1.25rem' }}>Doanh thu tiền cọc 7 ngày gần nhất</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.625rem', height: 120 }}>
                    {[65, 45, 80, 55, 90, 70, 100].map((h, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.35rem' }}>
                        <div style={{
                          width: '100%', background: `linear-gradient(to top,${C.gold},${C.goldLight})`,
                          height: `${h}%`, borderRadius: '4px 4px 0 0', minHeight: 4
                        }}
                          title={`${(h * 5000).toLocaleString('vi-VN')}₫`} />
                        <span style={{ fontSize: '.65rem', color: C.muted }}>{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════ NOTIFICATIONS (B09) ══════ */}
          {activeTab === 'notifications' && (
            <div style={{ maxWidth: 640 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button onClick={markAllNotificationsRead} style={{ ...S.btnOut, fontSize: '.78rem', padding: '.45rem 1rem' }}>
                  ✓ Đánh dấu đã đọc tất cả
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {notifications.length === 0 && (
                  <div style={{ ...S.card, textAlign: 'center', padding: '3rem', color: C.muted }}>Không có thông báo</div>
                )}
                {notifications.map(n => {
                  const iconMap = { BOOKING_NEW: '📋', WAITLIST_ACCEPTED: '⏳', CANCEL: '🚫', REVIEW_NEW: '⭐', NO_SHOW: '❗' }
                  return (
                    <div key={n.id} onClick={() => markNotificationRead(n.id)} style={{
                      ...S.card, cursor: 'pointer', display: 'flex', gap: '.875rem', alignItems: 'flex-start',
                      border: `1px solid ${n.read ? C.border : C.goldBorder}`,
                      background: n.read ? C.white : C.goldSubtle,
                    }}>
                      <div style={{ fontSize: '1.3rem' }}>{iconMap[n.type] || '🔔'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem' }}>
                          <p style={{ fontWeight: 700, fontSize: '.87rem', color: C.text }}>{n.title}</p>
                          {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold, flexShrink: 0, marginTop: 5 }} />}
                        </div>
                        <p style={{ fontSize: '.82rem', color: C.muted, marginTop: '.15rem' }}>{n.message}</p>
                        <p style={{ fontSize: '.7rem', color: C.muted, marginTop: '.3rem' }}>
                          {new Date(n.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ══════ POLICY ══════ */}
          {activeTab === "policy" && (
            <PolicyBranchTab branch={activeBranch} branches={branches} />
          )}

          {/* ══════ OPERATING HOUR ══════ */}
          {activeTab === "operating-hours" && (
            <BranchScheduleTab branch={activeBranch} />
          )}

          {/* ══════ BILLING: thu phi nen tang (module subscription) ══════ */}
          {activeTab === 'billing' && (
            <BillingTab />
          )}

          {/* ══════ SETTINGS: B03 + B04 ══════ */}
          {activeTab === 'settings' && (
            <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* ── B03: Thương hiệu nhà hàng ───────────────────── */}
              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '.5rem' }}>
                  <div style={S.eyebrow}>Thương hiệu nhà hàng (áp dụng chung mọi chi nhánh)</div>
                  {restaurant?.approvalStatus && (
                    <span style={{
                      fontSize: '.72rem', fontWeight: 700, padding: '.25rem .7rem', borderRadius: 99,
                      background: restaurant.approvalStatus === 'APPROVED' ? 'rgba(34,150,89,.12)'
                        : restaurant.approvalStatus === 'REJECTED' ? C.redBg : C.goldSubtle,
                      color: restaurant.approvalStatus === 'APPROVED' ? C.green
                        : restaurant.approvalStatus === 'REJECTED' ? C.red : C.goldDark
                    }}>
                      {{ APPROVED: '✓ Đã duyệt', PENDING: '⏳ Chờ duyệt', PENDING_UPDATE: '⏳ Chờ duyệt cập nhật', REJECTED: '✕ Bị từ chối' }[restaurant.approvalStatus] || restaurant.approvalStatus}
                    </span>
                  )}
                </div>

                {restaurant?.approvalStatus === 'PENDING_UPDATE' && (
                  <div style={{
                    background: C.goldSubtle, border: `1px solid ${C.goldBorder}`, borderRadius: 4,
                    padding: '.875rem 1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'
                  }}>
                    <p style={{ fontSize: '.82rem', color: C.goldDark }}>
                      Logo/mô tả mới đang chờ quản trị viên duyệt. Khách hàng vẫn thấy phiên bản đã duyệt trước đó.
                    </p>
                    <button onClick={cancelRestaurantPendingUpdate} style={{ ...S.btnOut, fontSize: '.78rem', padding: '.4rem .9rem', whiteSpace: 'nowrap' }}>
                      Huỷ yêu cầu cập nhật
                    </button>
                  </div>
                )}
                {restaurant?.approvalStatus === 'REJECTED' && restaurant?.rejectionReason && (
                  <div style={{ background: C.redBg, borderRadius: 4, padding: '.875rem 1rem', marginBottom: '1.25rem' }}>
                    <p style={{ fontSize: '.82rem', color: C.red }}>Lý do từ chối: {restaurant.rejectionReason}</p>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>Tên thương hiệu *</label>
                    <input style={S.input} value={restaurantForm.restaurantName}
                      onChange={e => setRestaurantForm(p => ({ ...p, restaurantName: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>Logo (URL ảnh)</label>
                    <input style={S.input} placeholder="https://..." value={restaurantForm.logoUrl}
                      onChange={e => setRestaurantForm(p => ({ ...p, logoUrl: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>Mô tả tổng quan</label>
                    <textarea style={{ ...S.input, resize: 'vertical' }} rows={3} value={restaurantForm.description}
                      onChange={e => setRestaurantForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>Ngành ẩm thực chính</label>
                    <input style={S.input} placeholder="VD: Ẩm thực Việt Nam" value={restaurantForm.cuisineType}
                      onChange={e => setRestaurantForm(p => ({ ...p, cuisineType: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>Số điện thoại</label>
                    <input style={S.input} value={restaurantForm.phone}
                      onChange={e => setRestaurantForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>Email liên hệ</label>
                    <input style={S.input} type="email" value={restaurantForm.email}
                      onChange={e => setRestaurantForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>Website</label>
                    <input style={S.input} placeholder="https://..." value={restaurantForm.website}
                      onChange={e => setRestaurantForm(p => ({ ...p, website: e.target.value }))} />
                  </div>
                </div>
                <button onClick={saveRestaurantInfo} disabled={savingRestaurant}
                  style={{ ...S.btnGold, marginTop: '1.25rem' }}>
                  {savingRestaurant ? 'Đang lưu...' : '✦ Lưu thương hiệu'}
                </button>
              </div>

              {/* ── B04: Danh sách & chuyển đổi chi nhánh ────────── */}
              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={S.eyebrow}>Chi nhánh ({branches.length})</div>
                  <button onClick={openNewBranchModal} style={{ ...S.btnOut, fontSize: '.78rem', padding: '.4rem .9rem' }}>+ Thêm chi nhánh</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                  {branches.map(b => {
                    const st = BRANCH_STATUS[b.status] || BRANCH_STATUS[2]
                    return (
                      <div key={b.id} onClick={() => setActiveBranch(b)} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', cursor: 'pointer',
                        padding: '.8rem 1rem', borderRadius: 4, border: `1.5px solid ${activeBranch?.id === b.id ? C.gold : C.border}`,
                        background: activeBranch?.id === b.id ? C.goldSubtle : C.white
                      }}>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '.87rem' }}>{b.name}</p>
                          <p style={{ fontSize: '.76rem', color: C.muted }}>{b.address}</p>
                        </div>
                        <span style={{ fontSize: '.7rem', fontWeight: 700, color: st.color, whiteSpace: 'nowrap' }}>● {st.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {activeBranch && (
                <>
                  <div style={S.card}>
                    <div style={{ ...S.eyebrow, marginBottom: '1.25rem' }}>Thông tin chi nhánh: {activeBranch.name}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={S.label}>Tên chi nhánh *</label>
                        <input style={S.input} value={branchForm.name}
                          onChange={e => setBranchForm(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={S.label}>Địa chỉ *</label>
                        <input style={S.input} value={branchForm.address}
                          onChange={e => setBranchForm(p => ({ ...p, address: e.target.value }))} />
                      </div>
                      <div>
                        <label style={S.label}>Tỉnh/Thành phố</label>
                        <input style={S.input} value={branchForm.province}
                          onChange={e => setBranchForm(p => ({ ...p, province: e.target.value }))} />
                      </div>
                      <div>
                        <label style={S.label}>Số điện thoại</label>
                        <input style={S.input} value={branchForm.phone}
                          onChange={e => setBranchForm(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                      <div>
                        <label style={S.label}>Vĩ độ (latitude)</label>
                        <input style={S.input} type="number" step="0.000001" placeholder="21.028511" value={branchForm.latitude}
                          onChange={e => setBranchForm(p => ({ ...p, latitude: e.target.value }))} />
                      </div>
                      <div>
                        <label style={S.label}>Kinh độ (longitude)</label>
                        <input style={S.input} type="number" step="0.000001" placeholder="105.854167" value={branchForm.longitude}
                          onChange={e => setBranchForm(p => ({ ...p, longitude: e.target.value }))} />
                      </div>
                    </div>
                    <p style={{ fontSize: '.74rem', color: C.muted, marginTop: '.5rem' }}>
                      💡 Vĩ độ/kinh độ dùng để hiển thị vị trí chi nhánh trên bản đồ khi khách tìm kiếm.
                    </p>
                    <button onClick={saveBranchInfo} disabled={savingBranch}
                      style={{ ...S.btnGold, marginTop: '1.25rem' }}>
                      {savingBranch ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>

                  {/* Khung giờ hoạt động */}
                  {/* <div style={S.card}>
                    <div style={{ ...S.eyebrow, marginBottom: '1.25rem' }}>Khung giờ hoạt động</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                      {WEEKDAYS.map(([day, label]) => {
                        const h = operatingHours.find(x => x.dayOfWeek === day) || { dayOfWeek: day, openTime: '10:00', closeTime: '22:00' }
                        return (
                          <div key={day} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr', gap: '.75rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '.82rem', fontWeight: 600, color: C.text }}>{label}</span>
                            <input type="time" style={S.input} value={h.openTime?.slice(0, 5) || ''}
                              onChange={e => updateHourField(day, 'openTime', e.target.value)} />
                            <input type="time" style={S.input} value={h.closeTime?.slice(0, 5) || ''}
                              onChange={e => updateHourField(day, 'closeTime', e.target.value)} />
                          </div>
                        )
                      })}
                    </div>
                    <p style={{ fontSize: '.74rem', color: C.muted, margin: '.75rem 0' }}>
                      ⚠ Nếu giờ mới ảnh hưởng tới đơn đặt bàn đã xác nhận nằm ngoài khung giờ, hệ thống sẽ từ chối lưu và yêu cầu xử lý các đơn liên quan trước.
                    </p>
                    <button onClick={saveOperatingHours} disabled={savingHours} style={S.btnGold}>
                      {savingHours ? 'Đang lưu...' : 'Lưu khung giờ hoạt động'}
                    </button>
                  </div> */}

                  {/* Trạng thái hoạt động / Tạm ngưng */}
                  {/* <div style={S.card}>
                    <div style={{ ...S.eyebrow, marginBottom: '1.25rem' }}>Trạng thái hoạt động</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '.88rem' }}>
                          {activeBranch.status === 5 ? '⏸ Chi nhánh đang tạm ngưng' : '● Chi nhánh đang hoạt động'}
                        </p>
                        <p style={{ fontSize: '.78rem', color: C.muted, marginTop: '.2rem', maxWidth: 440 }}>
                          {activeBranch.status === 5
                            ? 'Chi nhánh không hiển thị trong tìm kiếm và không nhận đơn mới. Mở lại để tiếp tục nhận đặt bàn.'
                            : 'Tạm ngưng sẽ ẩn chi nhánh khỏi tìm kiếm, ngừng nhận đặt bàn mới và tự động đóng hàng chờ. Đơn đã xác nhận vẫn được giữ nguyên.'}
                        </p>
                      </div>
                      <button onClick={toggleBranchStatus} disabled={changingStatus} style={{
                        ...S.btnOut, borderColor: activeBranch.status === 5 ? C.green : C.red,
                        color: activeBranch.status === 5 ? C.green : C.red, whiteSpace: 'nowrap'
                      }}>
                        {changingStatus ? '...' : activeBranch.status === 5 ? '▶ Mở lại chi nhánh' : '⏸ Tạm ngưng chi nhánh'}
                      </button>
                    </div>
                  </div> */}
                  {/* policy restaurant  */}
                  <PolicyResTab restaurantId={activeBranch.restaurantId} />
                </>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ════════ MODALS ════════ */}

      {/* New Branch Modal (B04 bước 1) */}
      {newBranchModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: C.white, borderRadius: 8, width: '100%', maxWidth: 520,
            // ✅ FIX 1: giới hạn chiều cao + flex column để body cuộn được
            maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            {/* Header — cố định */}
            <div style={{ background: `linear-gradient(135deg,${C.brown},${C.brownMid})`, padding: '1rem 1.25rem', flexShrink: 0 }}>
              <h2 style={{ ...serif, fontWeight: 700, color: '#fff', fontSize: '1.1rem', margin: 0 }}>Thêm chi nhánh mới</h2>
            </div>

            {/* Body — cuộn được */}
            <form onSubmit={createBranch} style={{
              padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem',
              // ✅ FIX 2: body cuộn, header + footer không cuộn
              overflowY: 'auto', flex: 1
            }}>
              <div>
                <label style={S.label}>Tên chi nhánh *</label>
                <input style={S.input} value={newBranchForm.name} required
                  onChange={e => setNewBranchForm(p => ({ ...p, name: e.target.value }))} />
              </div>

              <div>
                <label style={S.label}>Địa chỉ *</label>
                <input style={S.input} value={newBranchForm.address} required
                  onChange={e => setNewBranchForm(p => ({ ...p, address: e.target.value }))} />
              </div>

              {/* ✅ FIX 3: grid chỉ bọc province + phone, không bọc BranchLocationPicker */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={S.label}>Tỉnh/Thành phố</label>
                  <input style={S.input} value={newBranchForm.province}
                    onChange={e => setNewBranchForm(p => ({ ...p, province: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>Số điện thoại</label>
                  <input style={S.input} value={newBranchForm.phone}
                    onChange={e => setNewBranchForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>

              {/* ✅ FIX 3: BranchLocationPicker ra ngoài grid, full width */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem' }}>
                <BranchLocationPicker
                  value={{ latitude: newBranchForm.latitude, longitude: newBranchForm.longitude }}
                  onChange={({ latitude, longitude }) =>
                    setNewBranchForm(p => ({ ...p, latitude, longitude }))
                  }
                />
              </div>

              <p style={{ fontSize: '.76rem', color: C.muted, margin: 0 }}>
                Chi nhánh mới sẽ ở trạng thái "Chờ duyệt" cho đến khi quản trị viên xác thực.
                Sau khi tạo, hãy thiết lập khung giờ hoạt động và chính sách đặt cọc riêng.
              </p>

              {/* Footer — không cuộn cùng body */}
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setNewBranchModal(false)} style={S.btnOut}>Huỷ</button>
                <button type="submit" disabled={creatingBranch} style={S.btnGold}>
                  {creatingBranch ? 'Đang tạo...' : '✦ Tạo chi nhánh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}