import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { branchApi, bookingApi, menuApi, zoneApi, tableApi, waitlistApi, reviewApi, notificationApi, restaurantApi, operatingHourApi, branchPolicyApi, reservationPolicyApi, subscriptionApi, adminApi } from '../../api'
import { BarChart3, ClipboardList, ConciergeBell, Armchair, Soup, Hourglass, User, Star, TrendingUp, Wallet, AlarmClock, CreditCard, Bell, Settings, Calendar, Users, X, Utensils, Globe, Send, Mail, Search, TriangleAlert, Check, Ban, CircleAlert, Sparkles, Circle, Pencil, Save } from 'lucide-react'

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
import BranchBankAccountSettings from './tab/settings/BranchBankAccountSettings'
import BillingTab from './tab/subscription/BillingTab'
import BranchImageManager from './tab/settings/BranchImageManager'
import ExportExcelBar from './exportBar'
import ManageBookings from './ManageBookings'
import CuisineSelector from './component/CuisineSelector'
import PartnerReportsPage from './reports/PartnerReportsPage'
import NotificationBell from '../../components/NotificationBell'

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
      <span style={{ color: C.gold, fontSize: '.8rem', display: 'inline-flex' }}><Sparkles size={14} /></span>
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
        <div style={{ display: 'flex', color }}>{icon}</div>
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
async function exportExcel(branchid) {
  const blob = restaurantApi.exportExcel(branchApi)
}

// ── Star rating row (lucide) ─────────────────────────────────────
function Stars({ value, size = 16 }) {
  const n = Math.round(value)
  return (
    <>
      {[0, 1, 2, 3, 4].map(i => (
        <Star key={i} size={size} color={C.gold} fill={i < n ? C.gold : 'none'} />
      ))}
    </>
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

function SuspendedNotice({ branchName, tabName, status }) {
  const isInactive = Number(status) === 1
  const statusLabel = isInactive ? 'Ngừng hoạt động' : 'Tạm ngưng hoạt động'

  return (
    <div style={{
      background: '#FFF8F8',
      borderRadius: 12,
      padding: '4rem 2rem',
      textAlign: 'center',
      border: '1.5px solid #FECACA',
      boxShadow: '0 4px 20px rgba(239,68,68,.06)',
      margin: '1rem 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: '#FEE2E2',
        color: '#EF4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.25rem',
        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.2)'
      }}>
        <Ban size={36} />
      </div>
      <h2 style={{
        fontSize: '1.35rem',
        fontWeight: 700,
        color: '#991B1B',
        marginBottom: '.6rem'
      }}>
        Chi nhánh này đang {statusLabel.toLowerCase()}
      </h2>
      <p style={{
        color: '#7F1D1D',
        fontSize: '.92rem',
        maxWidth: 540,
        lineHeight: 1.6,
        marginBottom: '1.5rem'
      }}>
        Chi nhánh <strong>{branchName}</strong> hiện đang ở trạng thái <strong>{statusLabel}</strong>.
        Tính năng <strong>{tabName}</strong> và toàn bộ các thao tác liên quan tạm thời bị khóa.
      </p>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '.5rem',
        background: '#FEF2F2',
        padding: '.6rem 1.2rem',
        borderRadius: 99,
        border: '1px solid #FCA5A5',
        fontSize: '.85rem',
        color: '#B91C1C',
        fontWeight: 600
      }}>
        <TriangleAlert size={16} /> Vui lòng kích hoạt lại chi nhánh để tiếp tục sử dụng tính năng này
      </div>
    </div>
  )
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
  const [allTables, setTables] = useState([])
  const [exportBranchId, setExportBranchId] = useState(activeBranch?.id || "");
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [exportModal, setExportModal] = useState(false);

  const branchStatus = Number(activeBranch?.status);
  const isSuspended = branchStatus === 5;
  const isInactive = branchStatus === 1;
  const isBlocked = activeBranch && branchStatus !== 2;

  const handleTabClick = (tabId) => {
    if (isBlocked && ['bookings', 'order_board', 'waitlist'].includes(tabId)) {
      const msg = isInactive ? 'Chi nhánh này đang ngừng hoạt động' : 'Chi nhánh này đang tạm ngưng hoạt động';
      toast.error(msg);
    }
    setActiveTab(tabId);
  };

  useEffect(() => {
    if (activeBranch?.id) {
      setExportBranchId(activeBranch.id)
    }
  }, [activeBranch?.id])

  // ── modal states ───────────────────────────────────
  const [policyModal, setPolicyModal] = useState(false)
  const [policy, setPolicy] = useState({ depositRequired: true, depositType: 'FIXED_AMOUNT', depositValue: '200000', freeCancellationHours: 2, lateCancellationPenaltyPercent: 50, noShowPenaltyPercent: 100 })
  const [branchForm, setBranchForm] = useState({ name: '', address: '', phone: '', province: '', latitude: '', longitude: '' })
  const [savingBranch, setSavingBranch] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)

  // B03: hồ sơ thương hiệu nhà hàng
  const [restaurant, setRestaurant] = useState(null)
  const [restaurantForm, setRestaurantForm] = useState({ restaurantName: '', logoUrl: '', description: '', cuisineType: '', phone: '', email: '', website: '' })
  const [systemCuisines, setSystemCuisines] = useState([]);
  const [savingRestaurant, setSavingRestaurant] = useState(false)

  // B04: khung giờ hoạt động & tạo chi nhánh mới
  const [operatingHours, setOperatingHours] = useState([])
  const [savingHours, setSavingHours] = useState(false)
  const [newBranchModal, setNewBranchModal] = useState(false)
  const [newBranchForm, setNewBranchForm] = useState({

    name: "",
    address: "",
    province: "",
    phone: "",
    latitude: "",
    longitude: "",
    branchImageDtos: [] // Thêm mảng chứa danh sách ảnh
  });
  const [editBranchModal, setEditBranchModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null) // chi nhánh đang sửa
  const [editBranchForm, setEditBranchForm] = useState({
    name: '', address: '', province: '', phone: '', status: 1,
    latitude: '', longitude: '', branchImageDtos: []
  })
  const [savingEditBranch, setSavingEditBranch] = useState(false)
  const CATEGORIES = ['Khai vị', 'Món chính', 'Lẩu', 'Hải sản', 'Đồ uống', 'Tráng miệng', 'Khác']

  // ── Load data ──────────────────────────────────────
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [customerProfiles, setCustomerProfiles] = useState([]);

  useEffect(() => {
    adminApi.listCategories()
      .then(data => {
        if (Array.isArray(data.data)) {
          console.log("dataa", data);
          setSystemCuisines(data.data); // data nhận vào chính là mảng JSON bạn vừa gửi
        }
      })
      .catch(err => console.error("Lỗi tải danh mục ẩm thực:", err));
  }, []);
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
      branchImageDtos: activeBranch.branchImageDtos || []
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
        emoji: '', // backend chua ho tro emoji, chi hien thi mac dinh
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

  // notifications (B09) — nạp lại khi activeBranch thay đổi
  useEffect(() => {
    if (!activeBranch?.id) return;
    notificationApi.getUnread(activeBranch.id)
      .then(r => {
        const unread = r.data || []
        setNotifications(unread.length ? unread.map(n => ({ ...n, readByUser: false })) : [])
      })
      .catch(() => setNotifications([]))
  }, [activeBranch?.id])

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

  // B15: thống kê kinh doanh
  const menuByCategory = CATEGORIES.map(cat => ({
    cat, count: menu.filter(m => m.category === cat).length,
    revenue: menu.filter(m => m.category === cat && m.status === 'SELLING').reduce((s, m) => s + m.price, 0),
  })).filter(x => x.count > 0)
  const bookingStatusBreakdown = Object.keys(BOOKING_STATUS).map(k => ({
    status: k, count: bookings.filter(b => b.status === k).length, meta: BOOKING_STATUS[k],
  })).filter(x => x.count > 0)


  // ── B13: phản hồi đánh giá ───────────────────────────
  const submitReply = async (reviewId) => {
    const text = (replyDrafts[reviewId] || '').trim();
    if (!text) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }

    try {
      // Gọi API lên backend
      await reviewApi.reply(reviewId, { reply: text });

      // Cập nhật state local sau khi gọi API thành công
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: text } : r));
      setReplyDrafts(prev => ({ ...prev, [reviewId]: '' }));
      toast.success('Đã gửi phản hồi đánh giá!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi gửi phản hồi');
    }
  };

  // ── B09: xử lý thông báo ─────────────────────────────
  const markNotificationRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, readByUser: true } : n))
    try {
      await notificationApi.markAsRead(id)
    } catch {
      toast.error('Không thể đánh dấu thông báo là đã đọc')
    }
  }
  const markAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, readByUser: true })))
    try {
      await notificationApi.markAllAsRead()
      toast.success('Đã đánh dấu tất cả đã đọc')
    } catch {
      toast.error('Không thể đánh dấu tất cả là đã đọc')
    }
  }

  // ── B03: hồ sơ thương hiệu chung ─────────────────────
  const saveRestaurantInfo = async () => {
    if (!restaurantForm.restaurantName?.trim()) {
      toast.error('Tên thương hiệu không được để trống');
      return;
    }

    setSavingRestaurant(true);
    try {
      // 1. Chuẩn hóa cuisineTypes: Dù đang là mảng hay chuỗi đều gom lại thành chuỗi phân cách bằng dấu phẩy
      const rawCuisine = restaurantForm.cuisineTypes || restaurantForm.cuisineType || "";
      const cuisineString = Array.isArray(rawCuisine)
        ? rawCuisine.join(', ')
        : String(rawCuisine).trim();

      // 2. Tạo payload sạch sẽ, đồng bộ đúng chuẩn Backend yêu cầu
      const payload = {
        ...restaurantForm,
        cuisineType: cuisineString,
        // Xóa field thừa hoặc gán null nếu backend không dùng để tránh gửi nhầm field cũ
        cuisineTypes: undefined
      };

      const { data: res } = restaurant
        ? await restaurantApi.update(payload)
        : await restaurantApi.register(payload);

      setRestaurant(res.data);
      toast.success('Đã lưu thông tin thương hiệu!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu thông tin thương hiệu');
    } finally {
      setSavingRestaurant(false);
    }
  };
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
        longitude: branchForm.longitude === '' ? null : Number(branchForm.longitude),
        branchImages: (branchForm.branchImageDtos || []).map((img, index) => ({
          id: img.id || null,
          imageUrl: img.imageUrl,
          isCover: img.isCover ?? 0,
          displayOrder: img.displayOrder || index + 1
        }))
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
  const openEditBranchModal = (b) => {
    setEditingBranch(b)
    setEditBranchForm({
      name: b.name || '',
      address: b.address || '',
      province: b.province || '',
      phone: b.phone || '',
      status: b.status ?? 1,
      latitude: b.latitude ?? '',
      longitude: b.longitude ?? '',
      branchImageDtos: b.branchImageDtos || [],
    })
    setEditBranchModal(true)
  }

  const saveEditBranch = async (e) => {
    e.preventDefault()
    if (!editingBranch) return
    if (!editBranchForm.name.trim() || !editBranchForm.address.trim()) {
      toast.error('Tên chi nhánh và địa chỉ không được để trống')
      return
    }
    setSavingEditBranch(true)
    try {
      const payload = {
        ...editBranchForm,
        status: editBranchForm.status !== undefined ? Number(editBranchForm.status) : editingBranch.status,
        latitude: editBranchForm.latitude === '' ? null : Number(editBranchForm.latitude),
        longitude: editBranchForm.longitude === '' ? null : Number(editBranchForm.longitude),
        // Đưa mảng ảnh vào payload dưới tên branchImages (hoặc sửa tên trường theo đúng API của bạn)
        branchImages: editBranchForm.branchImageDtos.map((img, index) => ({
          id: img.id || null,
          imageUrl: img.imageUrl,
          isCover: img.isCover ?? 0,
          displayOrder: img.displayOrder || index + 1
        }))
      }
      const { data: res } = await branchApi.update(editingBranch.id, payload)
      const updated = res.data
      // chỉ cập nhật list branches, KHÔNG động vào activeBranch
      setBranches(prev => prev.map(b => b.id === editingBranch.id ? { ...b, ...updated } : b))
      // nếu chi nhánh đang sửa trùng activeBranch thì đồng bộ luôn cho UI nơi khác không lệch
      setActiveBranch(prev => prev && prev.id === editingBranch.id ? { ...prev, ...updated } : prev)
      toast.success('Đã cập nhật chi nhánh!')
      setEditBranchModal(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật chi nhánh')
    } finally {
      setSavingEditBranch(false)
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
    if (!restaurant?.id) {
      toast.error('Chưa tìm thấy hồ sơ nhà hàng, vui lòng lưu thông tin thương hiệu ở tab Cài đặt trước'); return
    }
    setCreatingBranch(true)
    try {
      const payload = {
        ...newBranchForm,
        restaurantId: restaurant.id,
        latitude: newBranchForm.latitude === '' || newBranchForm.latitude === null
          ? null
          : Number(newBranchForm.latitude),
        longitude: newBranchForm.longitude === '' || newBranchForm.longitude === null
          ? null
          : Number(newBranchForm.longitude),
        branchImages: (newBranchForm.branchImageDtos || []).map((img, index) => ({
          id: img.id || null,
          imageUrl: img.imageUrl,
          isCover: img.isCover ?? 0,
          displayOrder: img.displayOrder || index + 1
        }))
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
    { id: 'dashboard', icon: BarChart3, label: 'Tổng quan' },
    { id: 'bookings', icon: ClipboardList, label: 'Đặt bàn' },
    { id: 'order_board', icon: ConciergeBell, label: 'Gọi món' },
    { id: 'tables', icon: Armchair, label: 'Sơ đồ bàn' },
    { id: 'menu', icon: Soup, label: 'Thực đơn' },
    { id: 'waitlist', icon: Hourglass, label: 'Hàng chờ' },
    { id: 'customers', icon: User, label: 'Khách hàng' },
    { id: 'reviews', icon: Star, label: 'Đánh giá', badge: reviews.filter(r => !r.reply && !r.hidden).length },
    { id: 'reports', icon: TrendingUp, label: 'Thống kê' },
    { id: 'policy', icon: Wallet, label: 'Chính sách' },
    { id: 'operating-hours', icon: AlarmClock, label: 'Khung giờ hoạt động' },
    { id: 'billing', icon: CreditCard, label: 'Gói dịch vụ' },
    { id: 'notifications', icon: Bell, label: 'Thông báo', badge: unreadCount },
    { id: 'settings', icon: Settings, label: 'Cài đặt' },
  ]
  const activeMeta = TABS.find(t => t.id === activeTab)

  // ── Filtered bookings ──────────────────────────────
  const filteredBookings = bkFilter === 'ALL' ? branchBookingList : branchBookingList.filter(b => b.status === bkFilter)
  // Hàm gọi API lấy danh sách khách hàng
  const fetchBranchCustomers = async (keyword = '') => {
    if (!activeBranch?.id) return;

    try {
      const response = await bookingApi.getBranchCustomers(activeBranch.id, keyword);
      const data = response.data || response;

      if (Array.isArray(data)) {
        const formattedData = data.map((item, index) => ({
          key: item.customerId || `guest_${index}`,
          name: item.fullName || 'Khách vãng lai',
          phone: item.phone || 'Chưa cập nhật',
          email: item.email || '', // Bổ sung thêm email ở đây
          totalBookings: item.totalBookings || 0,
          completed: item.completedBookings || 0,
          cancelled: item.cancelledOrNoShow || 0,
          noShows: 0,
          totalSpent: item.totalDeposit || 0,
          lastVisit: item.lastVisit
        }));

        setCustomerProfiles(formattedData);
      } else {
        setCustomerProfiles([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách khách hàng:", error);
      setCustomerProfiles([]);
    }
  };

  // Dùng chung 1 useEffect xử lý cả khi đổi chi nhánh VÀ khi gõ tìm kiếm (có Debounce)
  useEffect(() => {
    if (!activeBranch?.id) return;

    const delayDebounceFn = setTimeout(() => {
      fetchBranchCustomers(customerQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [activeBranch?.id, customerQuery]); // Chỉ theo dõi id chi nhánh và từ khóa tìm kiếm

  // ── RENDER ─────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif", background: C.cream }}>
      <link href={FONT_LINK} rel="stylesheet" />
      {exportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
          <div style={{ width: 760, maxWidth: '100%', background: C.white, borderRadius: 8, padding: '1rem 1.25rem', boxShadow: '0 6px 30px rgba(0,0,0,.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>

              <button onClick={() => setExportModal(false)} style={{ ...S.btnOut }}>Đóng</button>
            </div>
            <ExportExcelBar branches={branches} onClose={() => setExportModal(false)} />
          </div>
        </div>
      )}

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
              if (b) {
                setActiveBranch(b);
                if (Number(b.status) === 5 && ['bookings', 'order_board', 'waitlist'].includes(activeTab)) {
                  toast.error('Chi nhánh này đang tạm ngưng hoạt động');
                }
              }
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
                {b.name} {Number(b.status) === 5 ? '(Tạm ngưng)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Nav links */}
        <nav style={{ padding: '1rem 0', flex: 1 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => handleTabClick(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: '.875rem',
              width: '100%', padding: '.75rem 1.5rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: activeTab === tab.id ? 'rgba(201,168,76,.15)' : 'transparent',
              color: activeTab === tab.id ? C.goldLight : 'rgba(255,255,255,.5)',
              fontSize: '.85rem', fontWeight: activeTab === tab.id ? 600 : 400,
              borderLeft: activeTab === tab.id ? `3px solid ${C.gold}` : '3px solid transparent',
              transition: 'all .15s', textAlign: 'left'
            }}>
              <span style={{ display: 'inline-flex' }}><tab.icon size={18} /></span>
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
            <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: C.text, display: 'inline-flex', alignItems: 'center', gap: '.5rem' }}>
              {activeMeta?.icon && <activeMeta.icon size={20} />} {activeMeta?.label}
              {isBlocked && (
                <span style={{
                  background: '#FEE2E2',
                  color: '#B91C1C',
                  fontSize: '.72rem',
                  fontWeight: 700,
                  padding: '.2rem .55rem',
                  borderRadius: 99,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '.3rem',
                  marginLeft: '.5rem',
                  border: '1px solid #FECACA'
                }}>
                  <Ban size={12} /> {isInactive ? 'Ngừng hoạt động' : isSuspended ? 'Tạm ngưng hoạt động' : 'Chưa kích hoạt'}
                </span>
              )}
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
                <Hourglass size={15} style={{ verticalAlign: '-2px' }} /> Có lời mời hàng chờ đang chờ phản hồi
              </div>
            )}
            <NotificationBell color="var(--text)" branchId={activeBranch?.id} onViewAll={() => setActiveTab('notifications')} />
            <button onClick={() => setExportModal(true)} style={{ ...S.btnOut, padding: '.45rem .75rem', fontSize: '.9rem' }}>📤 Xuất báo cáo</button>

            <button onClick={() => navigate('/')} style={{ ...S.btnOut, padding: '.45rem 1rem', fontSize: '.78rem' }}>
              <Globe size={15} style={{ verticalAlign: '-2px' }} /> Về trang chủ
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
                <StatCard icon={<Calendar size={26} />} label="Đặt bàn hôm nay" value={stats.todayConfirmed} sub="đang chờ đón khách" color={C.gold} trend={12} />
                <StatCard icon={<Armchair size={26} />} label="Tỷ lệ lấp đầy" value={`${stats.fillRate}%`} sub={`${stats.available}/${stats.totalTables} bàn trống`} color={C.green} trend={5} />
                <StatCard icon={<Users size={26} />} label="Đang phục vụ" value={stats.occupied} sub="bàn đang có khách" color={C.amber} />
                <StatCard icon={<ClipboardList size={26} />} label="Bàn đã đặt" value={stats.reserved} sub="sắp có khách đến" color={C.blue} />
                <StatCard icon={<Hourglass size={26} />} label="Hàng chờ" value={waitlist.filter(w => w.status === 'WAITING').length} sub="đang chờ bàn trống" color={C.purple} />
                <StatCard icon={<X size={26} />} label="Tỷ lệ No-show" value={`${stats.noShowRate}%`} sub="trong 30 ngày qua" color={C.red} />
                <StatCard icon={<Star size={26} />} label="Đánh giá trung bình" value={avgRating} sub={`${visibleReviews.length} lượt đánh giá`} color={C.gold} />
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
                    <button onClick={() => handleTabClick('bookings')} style={{ ...S.btnSm, background: C.goldSubtle, color: C.goldDark, border: `1px solid ${C.goldBorder}` }}>
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
                          Bàn: {b.tables.map((table, index) => (
                            <strong key={table.id || index}>
                              {table.tableName}
                              {index < b.tables.length - 1 ? ', ' : ''}
                            </strong>
                          ))} · {b.guestCount} khách · {new Date(b.reservationTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
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
            isBlocked ? (
              <SuspendedNotice branchName={activeBranch?.name} tabName="Đặt bàn" status={activeBranch?.status} />
            ) : (
              <ManageBookings branchId={activeBranch?.id} />
            )
          )}

          {/* ══════ GỌI MÓN (TAB GỌI MÓN - realtime bàn) ══════ */}
          {activeTab === 'order_board' && (
            isBlocked ? (
              <SuspendedNotice branchName={activeBranch?.name} tabName="Gọi món" status={activeBranch?.status} />
            ) : (
              <OrderBoardTab orderBoard={orderBoard} />
            )
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
            isBlocked ? (
              <SuspendedNotice branchName={activeBranch?.name} tabName="Hàng chờ" status={activeBranch?.status} />
            ) : (
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
                            <Users size={14} style={{ verticalAlign: '-2px' }} /> {w.guestCount} khách · <AlarmClock size={14} style={{ verticalAlign: '-2px' }} /> Giờ mong muốn: {new Date(w.desiredTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
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
                          }} style={{ ...S.btnSm, background: C.gold, color: C.brown }}><Send size={14} style={{ verticalAlign: '-2px' }} /> Gửi lời mời</button>
                          <button onClick={() => { setWaitlist(p => p.filter(x => x.id !== w.id)); toast.success('Đã xoá khỏi hàng chờ') }}
                            style={{ ...S.btnSm, background: C.redBg, color: C.red, border: `1px solid ${C.red}22`, marginLeft: '.5rem' }}>
                            <X size={14} style={{ verticalAlign: '-2px' }} /> Xoá
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* ══════ CUSTOMERS (B14) ══════ */}
          {/* ══════ CUSTOMERS (B14) ══════ */}
          {activeTab === 'customers' && (
            <div>
              <div style={{ marginBottom: '1.25rem', position: 'relative', maxWidth: 340 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                <input style={{ ...S.input, maxWidth: 340, paddingLeft: 36 }} placeholder="Tìm theo tên hoặc số điện thoại..."
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
                          {/* Hiển thị email nếu có */}
                          {c.email && <p style={{ fontSize: '.75rem', color: C.muted, marginTop: '2px' }}><Mail size={13} style={{ verticalAlign: '-2px' }} /> {c.email}</p>}
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
                      {(c.noShows >= 2) && <span style={{ marginLeft: '.75rem', color: C.red, fontWeight: 700 }}><TriangleAlert size={13} style={{ verticalAlign: '-2px' }} /> Khách hàng có tiền sử No-show</span>}
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
                  <div style={{ marginTop: '.25rem', display: 'flex', justifyContent: 'center', gap: 2 }}><Stars value={avgRating} size={18} /></div>
                  <div style={{ fontSize: '.72rem', color: C.muted, marginTop: '.2rem' }}>{visibleReviews.length} đánh giá</div>
                </div>
                <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                  {ratingBreakdown.map(({ star, count }) => (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                      <span style={{ fontSize: '.75rem', color: C.muted, width: 34, display: 'inline-flex', alignItems: 'center', gap: 2 }}>{star} <Star size={12} color={C.gold} fill={C.gold} /></span>
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
                {filteredReviews.map(r => {
                  // Tính sao trung bình từ space, service, food dựa theo cấu trúc JSON thực tế
                  const avgItemRating = r.rating || Math.round(((r.spaceRating || 5) + (r.serviceRating || 5) + (r.foodRating || 5)) / 3);

                  return (
                    <div key={r.id} style={{ ...S.card, border: `1px solid ${C.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.5rem' }}>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '.9rem' }}>{r.customer?.fullName || r.customerName}</p>
                          <p style={{ fontSize: '.85rem', display: 'flex', gap: 2 }}><Stars value={avgItemRating} size={15} /></p>
                        </div>
                        <span style={{ fontSize: '.75rem', color: C.muted }}>
                          {new Date(r.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      </div>

                      <p style={{ fontSize: '.87rem', color: C.text, margin: '.75rem 0', lineHeight: 1.6 }}>{r.comment}</p>

                      {/* Kiểm tra restaurantReply thay vì reply để ẩn/hiện form */}
                      {r.restaurantReply ? (
                        <div style={{ background: C.cream, borderLeft: `3px solid ${C.gold}`, borderRadius: 4, padding: '.75rem 1rem' }}>
                          <p style={{ fontSize: '.72rem', fontWeight: 700, color: C.goldDark, marginBottom: '.2rem' }}>PHẢN HỒI TỪ NHÀ HÀNG</p>
                          <p style={{ fontSize: '.83rem', color: C.muted }}>{r.restaurantReply}</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
                          <input style={{ ...S.input, flex: 1 }} placeholder="Viết phản hồi tới khách hàng..."
                            value={replyDrafts[r.id] || ''} onChange={e => setReplyDrafts(p => ({ ...p, [r.id]: e.target.value }))} />
                          <button onClick={() => submitReply(r.id)} style={{ ...S.btnGold, padding: '.6rem 1.2rem' }}>Gửi</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════ REPORTS / THỐNG KÊ (B15) ══════ */}
          {activeTab === 'reports' && (
            // <div>
            //   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            //     <StatCard icon={<Wallet size={26} />} label="Doanh thu cọc (tổng)" value={`${stats.totalRevenue.toLocaleString('vi-VN')}₫`} sub="từ đơn hoàn tất" color={C.gold} />
            //     <StatCard icon={<ClipboardList size={26} />} label="Tổng lượt đặt" value={bookings.length} sub={`${todayBookings.length} hôm nay`} color={C.blue} />
            //     <StatCard icon={<Users size={26} />} label="Khách hàng" value={customerProfiles.length} sub="đã từng đặt bàn" color={C.purple} />
            //     <StatCard icon={<Utensils size={26} />} label="Món đang bán" value={menu.filter(m => m.status === 'SELLING').length} sub={`/${menu.length} món`} color={C.green} />
            //   </div>

            //   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            //     <div style={S.card}>
            //       <div style={{ ...S.eyebrow, marginBottom: '1rem' }}>Tỷ trọng trạng thái đặt bàn</div>
            //       <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            //         {bookingStatusBreakdown.map(({ status, count, meta }) => (
            //           <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            //             <span style={{ fontSize: '.78rem', color: C.muted, width: 120 }}>{meta.label}</span>
            //             <div style={{ flex: 1, height: 10, borderRadius: 99, background: C.creamDark, overflow: 'hidden' }}>
            //               <div style={{ width: `${bookings.length ? count / bookings.length * 100 : 0}%`, height: '100%', background: meta.color }} />
            //             </div>
            //             <span style={{ fontSize: '.78rem', fontWeight: 700, color: meta.color, width: 24, textAlign: 'right' }}>{count}</span>
            //           </div>
            //         ))}
            //         {bookingStatusBreakdown.length === 0 && <p style={{ color: C.muted, fontSize: '.85rem' }}>Chưa có dữ liệu</p>}
            //       </div>
            //     </div>

            //     <div style={S.card}>
            //       <div style={{ ...S.eyebrow, marginBottom: '1rem' }}>Thực đơn theo danh mục</div>
            //       <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            //         {menuByCategory.map(({ cat, count, revenue }) => (
            //           <div key={cat} style={{
            //             display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            //             padding: '.5rem 0', borderBottom: `1px solid ${C.creamDark}`
            //           }}>
            //             <span style={{ fontSize: '.85rem', color: C.text }}>{cat}</span>
            //             <span style={{ fontSize: '.78rem', color: C.muted }}>{count} món · giá TB {(revenue / (count || 1)).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}₫</span>
            //           </div>
            //         ))}
            //         {menuByCategory.length === 0 && <p style={{ color: C.muted, fontSize: '.85rem' }}>Chưa có dữ liệu</p>}
            //       </div>
            //     </div>
            //     {/* doanh thu tiền cọc */}
            //     <div style={{ ...S.card, gridColumn: '1/-1' }}>
            //       <div style={{ ...S.eyebrow, marginBottom: '1.25rem' }}>Doanh thu tiền cọc 7 ngày gần nhất</div>
            //       <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.625rem', height: 120 }}>
            //         {[65, 45, 80, 55, 90, 70, 100].map((h, i) => (
            //           <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.35rem' }}>
            //             <div style={{
            //               width: '100%', background: `linear-gradient(to top,${C.gold},${C.goldLight})`,
            //               height: `${h}%`, borderRadius: '4px 4px 0 0', minHeight: 4
            //             }}
            //               title={`${(h * 5000).toLocaleString('vi-VN')}₫`} />
            //             <span style={{ fontSize: '.65rem', color: C.muted }}>{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}</span>
            //           </div>
            //         ))}
            //       </div>
            //     </div>
            //   </div>
            // </div>
            <PartnerReportsPage />
          )}

          {/* ══════ NOTIFICATIONS (B09) ══════ */}
          {activeTab === 'notifications' && (
            <div style={{ maxWidth: 640 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button onClick={markAllNotificationsRead} style={{ ...S.btnOut, fontSize: '.78rem', padding: '.45rem 1rem' }}>
                  <Check size={15} style={{ verticalAlign: '-2px' }} /> Đánh dấu đã đọc tất cả
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {notifications.length === 0 && (
                  <div style={{ ...S.card, textAlign: 'center', padding: '3rem', color: C.muted }}>Không có thông báo</div>
                )}
                {notifications.map(n => {
                  const TYPE_LABEL = {
                    BOOKING_CONFIRMED: 'Đặt bàn thành công',
                    BOOKING_REMINDER: 'Nhắc lịch hẹn',
                    BOOKING_CANCELLED: 'Hủy đặt bàn',
                    PAYMENT_SUCCESS: 'Thanh toán thành công',
                    SUB_RENEWAL_DUE: 'Đến hạn gia hạn',
                    SUB_PAST_DUE: 'Quá hạn thanh toán',
                    SUB_EXPIRED_SUSPEND: 'Tạm ngưng chi nhánh',
                    WAITLIST_INVITED: 'Mời từ hàng chờ'
                  }
                  const iconMap = { BOOKING_CONFIRMED: ClipboardList, WAITLIST_INVITED: Hourglass, BOOKING_CANCELLED: Ban, PAYMENT_SUCCESS: Check, NO_SHOW_WARNING: CircleAlert }
                  const NIcon = iconMap[n.type] || Bell
                  return (
                    <div key={n.id} onClick={() => markNotificationRead(n.id)} style={{
                      ...S.card, cursor: 'pointer', display: 'flex', gap: '.875rem', alignItems: 'flex-start',
                      border: `1px solid ${n.readByUser ? C.border : C.goldBorder}`,
                      background: n.readByUser ? C.white : C.goldSubtle,
                    }}>
                      <div style={{ display: 'flex', color: C.goldDark }}><NIcon size={22} /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem' }}>
                          <p style={{ fontWeight: 700, fontSize: '.87rem', color: C.text }}>{TYPE_LABEL[n.type] || n.type}</p>
                          {!n.readByUser && <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold, flexShrink: 0, marginTop: 5 }} />}
                        </div>
                        <p style={{ fontSize: '.82rem', color: C.muted, marginTop: '.15rem' }}>{n.content}</p>
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
                      {(() => {
                        const m = { APPROVED: [Check, 'Đã duyệt'], PENDING: [Hourglass, 'Chờ duyệt'], PENDING_UPDATE: [Hourglass, 'Chờ duyệt cập nhật'], REJECTED: [X, 'Bị từ chối'] }[restaurant.approvalStatus]
                        if (!m) return restaurant.approvalStatus
                        const [Icon, txt] = m
                        return <><Icon size={13} style={{ verticalAlign: '-2px' }} /> {txt}</>
                      })()}
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
                    <label style={S.label}>Ngành ẩm thực (Chọn nhiều)</label>

                    {/* Khu vực hiển thị các Badge đã chọn (Dù state là mảng hay chuỗi đều tự xử lý được) */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {(() => {
                        // Chuẩn hóa: Biến đổi linh hoạt dù cuisineTypes là mảng hay chuỗi
                        const raw = restaurantForm.cuisineType;
                        const currentArray = Array.isArray(raw)
                          ? raw
                          : String(raw || '').split(',').map(s => s.trim()).filter(Boolean);

                        return currentArray.map((item, index) => (
                          <span key={index} style={{
                            background: '#fdf3c7',
                            color: '#92400e',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: '1px solid #fcd34d'
                          }}>
                            {item}
                            <span
                              style={{ cursor: 'pointer', fontWeight: 'bold' }}
                              onClick={() => {
                                const updated = currentArray.filter(c => c !== item);
                                // Lưu về dạng chuỗi phân tách bằng dấu phẩy để khớp với backend
                                setRestaurantForm(p => ({ ...p, cuisineType: updated.join(', ') }));
                              }}
                            >×</span>
                          </span>
                        ));
                      })()}
                    </div>

                    {/* Gọi lại component chọn ngành ẩm thực phân cấp trực quan */}
                    <CuisineSelector
                      systemCuisines={systemCuisines}
                      restaurantForm={restaurantForm}
                      setRestaurantForm={setRestaurantForm}
                    />
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
                  {savingRestaurant ? 'Đang lưu...' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}><Sparkles size={14} /> Lưu thương hiệu</span>}
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
                      <div key={b.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
                        padding: '.8rem 1rem', borderRadius: 4, border: `1.5px solid ${activeBranch?.id === b.id ? C.gold : C.border}`,
                        background: activeBranch?.id === b.id ? C.goldSubtle : C.white
                      }}>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '.87rem' }}>{b.name}</p>
                          <p style={{ fontSize: '.76rem', color: C.muted }}>{b.address}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                          <span style={{ fontSize: '.7rem', fontWeight: 700, color: st.color, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}><Circle size={9} fill="currentColor" /> {st.label}</span>
                          <button onClick={() => openEditBranchModal(b)} style={{ ...S.btnSm, background: C.goldSubtle, color: C.goldDark, border: `1px solid ${C.goldBorder}` }}>
                            <Pencil size={13} style={{ verticalAlign: '-2px' }} /> Sửa
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              {activeBranch && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                  {/* Banner Ảnh Bìa Chính */}
                  {(() => {
                    const coverImg = (branchForm.branchImageDtos || []).find(img => img.isCover === 1) || (branchForm.branchImageDtos || [])[0];
                    return coverImg ? (
                      <div style={{ ...S.card, padding: 0, overflow: 'hidden', position: 'relative', height: 160, background: '#000' }}>
                        <img src={coverImg.imageUrl} alt="Branch Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                          onError={(e) => { e.target.src = "https://via.placeholder.com/600x160?text=Ảnh+Lỗi+Hoặc+Không+Tồn+Tại"; }} />
                        <div style={{
                          position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '1rem'
                        }}>
                          <span style={{ fontSize: '.7rem', color: C.gold, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}><Star size={13} fill="currentColor" /> Ảnh Bìa Đại Diện</span>
                          <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: 0 }}>{activeBranch.name}</h3>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Card Thông tin & Chỉnh sửa chi nhánh */}
                  <div style={S.card}>
                    {/* ... giữ nguyên nội dung form ... */}
                  </div>

                  {/* policy restaurant */}
                  <PolicyResTab restaurantId={activeBranch.restaurantId} />

                  {/* Tài khoản ngân hàng + payOS */}
                  <BranchBankAccountSettings branchId={activeBranch.id} />
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ════════ MODALS ════════ */}

      {/* New Branch Modal (B04 bước 1) */}
      {/* ════════ MODALS ════════ */}
      {editBranchModal && editingBranch && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: C.white, borderRadius: 8, width: '100%', maxWidth: 640,
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            {/* Header — cố định */}
            <div style={{
              background: `linear-gradient(135deg,${C.brown},${C.brownMid})`, padding: '1rem 1.25rem',
              flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h2 style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem', margin: 0 }}>
                Sửa chi nhánh — {editingBranch.name}
              </h2>
              <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.6)' }}>ID #{editingBranch.id}</span>
            </div>

            {/* form bọc ngoài, chiếm hết phần còn lại, chia làm 2 vùng con */}
            <form
              onSubmit={saveEditBranch}
              style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
            >
              {/* Body — CUỘN riêng, không kéo footer theo */}
              <div style={{
                padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem',
                overflowY: 'auto', flex: 1
              }}>
                <div>
                  <label style={S.label}>Tên chi nhánh *</label>
                  <input style={S.input} value={editBranchForm.name} required maxLength={150}
                    onChange={e => setEditBranchForm(p => ({ ...p, name: e.target.value }))} />
                </div>

                <div>
                  <label style={S.label}>Địa chỉ *</label>
                  <input style={S.input} value={editBranchForm.address} required
                    onChange={e => setEditBranchForm(p => ({ ...p, address: e.target.value }))} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={S.label}>Tỉnh/Thành phố</label>
                    <input style={S.input} value={editBranchForm.province || ''} maxLength={100}
                      onChange={e => setEditBranchForm(p => ({ ...p, province: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>Số điện thoại</label>
                    <input style={S.input} value={editBranchForm.phone || ''} maxLength={20}
                      onChange={e => setEditBranchForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label style={S.label}>Trạng thái hoạt động</label>
                  <select
                    style={S.input}
                    value={editBranchForm.status ?? 1}
                    onChange={e => setEditBranchForm(p => ({ ...p, status: Number(e.target.value) }))}
                  >
                    <option value={2}>Hoạt động</option>
                    <option value={1}>Ngừng hoạt động</option>
                    <option value={5}>Bị tạm ngưng</option>
                  </select>
                </div>

                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem' }}>
                  <BranchImageManager
                    images={editBranchForm.branchImageDtos || []}
                    onChange={(updatedImages) =>
                      setEditBranchForm(p => ({ ...p, branchImageDtos: updatedImages }))
                    }
                  />
                </div>

                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem' }}>
                  <BranchLocationPicker
                    value={{ latitude: editBranchForm.latitude, longitude: editBranchForm.longitude }}
                    onChange={({ latitude, longitude }) =>
                      setEditBranchForm(p => ({ ...p, latitude, longitude }))
                    }
                  />
                </div>

                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem' }}>
                  <PolicyResTab restaurantId={editingBranch.restaurantId} />
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem' }}>
                  <BranchBankAccountSettings branchId={editingBranch.id} />
                </div>
              </div>

              {/* Footer — LUÔN cố định ở đáy modal, không bị cuộn mất */}
              <div style={{
                flexShrink: 0, borderTop: `1px solid ${C.border}`, background: C.white,
                padding: '1rem 1.25rem', display: 'flex', gap: '.75rem', justifyContent: 'flex-end'
              }}>
                <button type="button" onClick={() => setEditBranchModal(false)} style={S.btnOut}>
                  Huỷ
                </button>
                <button type="submit" disabled={savingEditBranch} style={S.btnGold}>
                  {savingEditBranch ? 'Đang lưu...' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}><Save size={16} /> Lưu thay đổi</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* New Branch Modal */}
      {newBranchModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: C.white, borderRadius: 8, width: '100%', maxWidth: 580,
            maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            {/* Header — cố định */}
            <div style={{ background: `linear-gradient(135deg,${C.brown},${C.brownMid})`, padding: '1rem 1.25rem', flexShrink: 0 }}>
              <h2 style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem', margin: 0 }}>Thêm chi nhánh mới</h2>
            </div>

            {/* Body — cuộn được */}
            <form onSubmit={createBranch} style={{
              padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem',
              overflowY: 'auto', flex: 1
            }}>
              <div>
                <label style={S.label}>Tên chi nhánh * (Tối đa 150 ký tự)</label>
                <input style={S.input} value={newBranchForm.name} required maxLength={150}
                  onChange={e => setNewBranchForm(p => ({ ...p, name: e.target.value }))} />
              </div>

              <div>
                <label style={S.label}>Địa chỉ *</label>
                <input style={S.input} value={newBranchForm.address} required
                  onChange={e => setNewBranchForm(p => ({ ...p, address: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={S.label}>Tỉnh/Thành phố</label>
                  <input style={S.input} value={newBranchForm.province || ""} maxLength={100}
                    onChange={e => setNewBranchForm(p => ({ ...p, province: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>Số điện thoại</label>
                  <input style={S.input} value={newBranchForm.phone || ""} maxLength={20}
                    onChange={e => setNewBranchForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>

              {/* Quản lý danh sách ảnh & Banner */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem' }}>
                <BranchImageManager
                  images={newBranchForm.branchImageDtos || []}
                  onChange={(updatedImages) =>
                    setNewBranchForm(p => ({ ...p, branchImageDtos: updatedImages }))
                  }
                />
              </div>

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
              </p>

              {/* Footer — không cuộn cùng body */}
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', paddingTop: '.5rem' }}>
                <button type="button" onClick={() => setNewBranchModal(false)} style={S.btnOut}>Huỷ</button>
                <button type="submit" disabled={loading} style={S.btnGold}>
                  {loading ? 'Đang tạo...' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}><Sparkles size={14} /> Tạo chi nhánh</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}