import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { branchApi, bookingApi, menuApi, zoneApi, tableApi, waitlistApi, reviewApi, notificationApi, restaurantApi, operatingHourApi, branchPolicyApi, reservationPolicyApi } from '../../api'

//   restaurantApi, operatingHourApi, depositPolicyApi } from '../../api'

import toast from 'react-hot-toast'
import PolicyResTab from './tab/reservation_policy/policyRestaurant/PolicyResTab'
import PolicyBranchTab from './tab/reservation_policy/policyBranch/PolicyBranchTab'

import TableLayoutTab from './tab/table_layout/TableLayoutTab';
import TableFormModal from './tab/table_layout/floorPlanManagement/components/TableFormModal';
import ZoneFormModal from './tab/table_layout/zoneManagement/components/ZoneFormModal';

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
const TABLE_STATUS = {
  AVAILABLE: { color: C.green, bg: C.greenBg, label: 'Trống', icon: '✓' },
  RESERVED: { color: C.red, bg: C.redBg, label: 'Đã đặt', icon: '📋' },
  OCCUPIED: { color: C.amber, bg: C.amberBg, label: 'Đang dùng', icon: '👥' },
  CLEANING: { color: C.slate, bg: 'rgba(148,163,184,.12)', label: 'Dọn dẹp', icon: '🧹' },
  HELD_FOR_WAITLIST: { color: C.purple, bg: C.purpleBg, label: 'Hàng chờ', icon: '⏳' },
  MAINTENANCE: { color: C.brown, bg: 'rgba(61,43,31,.1)', label: 'Bảo trì', icon: '🔧' },
}
const BOOKING_STATUS = {
  CONFIRMED: { color: C.green, bg: C.greenBg, label: 'Đã xác nhận' },
  CHECKED_IN: { color: C.blue, bg: C.blueBg, label: 'Đang phục vụ' },
  PENDING_NO_SHOW: { color: C.amber, bg: C.amberBg, label: 'Nghi No-show' },
  COMPLETED: { color: C.slate, bg: 'rgba(148,163,184,.1)', label: 'Hoàn tất' },
  NO_SHOW: { color: C.red, bg: C.redBg, label: 'No-show' },
  CANCELLED_BY_CUSTOMER: { color: C.red, bg: C.redBg, label: 'KH huỷ' },
  CANCELLED_BY_RESTAURANT: { color: C.red, bg: C.redBg, label: 'NH huỷ' },
}

// ── Demo data ────────────────────────────────────────────────────
const DEMO_BRANCHES = [
  { id: 1, name: 'Nhà Hàng Sen Vàng – Chi nhánh Hoàn Kiếm', address: '12 Hồ Hoàn Kiếm, Hà Nội', province: 'Hà Nội', phone: '0901234567', latitude: 21.0285, longitude: 105.8542, approvalStatus: 'APPROVED', operatingStatus: 'ACTIVE', status: 2 },
  { id: 2, name: 'Nhà Hàng Sen Vàng – Chi nhánh Tây Hồ', address: '88 Xuân Diệu, Tây Hồ, Hà Nội', province: 'Hà Nội', phone: '0907654321', latitude: 21.0587, longitude: 105.8228, approvalStatus: 'APPROVED', operatingStatus: 'ACTIVE', status: 2 },
]
// B03: hồ sơ thương hiệu chung của nhà hàng đối tác
const DEMO_RESTAURANT = {
  restaurantName: 'Nhà Hàng Sen Vàng', logoUrl: '', description: 'Ẩm thực Việt Nam truyền thống với không gian sang trọng, phục vụ các món đặc sản ba miền.',
  cuisineType: 'Ẩm thực Việt Nam', phone: '0901234567', email: 'contact@senvang.vn', website: 'https://senvang.vn',
  approvalStatus: 'APPROVED', isActive: true,
}
const WEEKDAYS = [
  ['MONDAY', 'Thứ 2'], ['TUESDAY', 'Thứ 3'], ['WEDNESDAY', 'Thứ 4'], ['THURSDAY', 'Thứ 5'],
  ['FRIDAY', 'Thứ 6'], ['SATURDAY', 'Thứ 7'], ['SUNDAY', 'Chủ nhật'],
]
// B04: khung giờ hoạt động mặc định — mở/đóng cửa theo từng ngày trong tuần
const DEMO_HOURS = WEEKDAYS.map(([day]) => ({ dayOfWeek: day, openTime: '10:00', closeTime: '22:00', shiftName: 'Cả ngày' }))
const BRANCH_STATUS = {
  1: { label: 'Ngừng hoạt động', color: C.muted },
  2: { label: 'Đã duyệt - Hoạt động', color: C.green },
  3: { label: 'Chờ duyệt', color: C.gold },
  4: { label: 'Bị từ chối', color: C.red },
  5: { label: 'Tạm ngưng', color: C.red },
}
const DEMO_ZONES = {
  1: [{ id: 1, name: 'Trong nhà', active: true }, { id: 2, name: 'Sân vườn', active: true }, { id: 3, name: 'Phòng VIP', active: true }],
  2: [{ id: 4, name: 'Tầng 1', active: true }, { id: 5, name: 'Tầng 2', active: true }],
}
const DEMO_TABLES = {
  1: [
    { id: 101, tableCode: 'A1', capacity: 2, positionX: 12, positionY: 18, status: 'AVAILABLE' },
    { id: 102, tableCode: 'A2', capacity: 4, positionX: 30, positionY: 18, status: 'RESERVED' },
    { id: 103, tableCode: 'A3', capacity: 4, positionX: 50, positionY: 18, status: 'OCCUPIED' },
    { id: 104, tableCode: 'A4', capacity: 6, positionX: 70, positionY: 18, status: 'AVAILABLE' },
    { id: 105, tableCode: 'A5', capacity: 2, positionX: 12, positionY: 52, status: 'CLEANING' },
    { id: 106, tableCode: 'A6', capacity: 4, positionX: 30, positionY: 52, status: 'AVAILABLE' },
    { id: 107, tableCode: 'A7', capacity: 4, positionX: 50, positionY: 52, status: 'HELD_FOR_WAITLIST' },
    { id: 108, tableCode: 'A8', capacity: 8, positionX: 72, positionY: 52, status: 'AVAILABLE' },
  ],
  2: [
    { id: 201, tableCode: 'B1', capacity: 4, positionX: 20, positionY: 30, status: 'AVAILABLE' },
    { id: 202, tableCode: 'B2', capacity: 4, positionX: 50, positionY: 30, status: 'RESERVED' },
    { id: 203, tableCode: 'B3', capacity: 6, positionX: 80, positionY: 30, status: 'AVAILABLE' },
    { id: 204, tableCode: 'B4', capacity: 2, positionX: 35, positionY: 65, status: 'OCCUPIED' },
  ],
  3: [
    { id: 301, tableCode: 'VIP1', capacity: 8, positionX: 25, positionY: 35, status: 'AVAILABLE' },
    { id: 302, tableCode: 'VIP2', capacity: 10, positionX: 65, positionY: 35, status: 'RESERVED' },
    { id: 303, tableCode: 'VIP3', capacity: 6, positionX: 45, positionY: 70, status: 'AVAILABLE' },
  ],
  4: [
    { id: 401, tableCode: 'T1-01', capacity: 2, positionX: 15, positionY: 20, status: 'AVAILABLE' },
    { id: 402, tableCode: 'T1-02', capacity: 4, positionX: 40, positionY: 20, status: 'AVAILABLE' },
    { id: 403, tableCode: 'T1-03', capacity: 4, positionX: 65, positionY: 20, status: 'RESERVED' },
    { id: 404, tableCode: 'T1-04', capacity: 6, positionX: 15, positionY: 60, status: 'AVAILABLE' },
    { id: 405, tableCode: 'T1-05', capacity: 8, positionX: 55, positionY: 60, status: 'OCCUPIED' },
  ],
  5: [
    { id: 501, tableCode: 'T2-01', capacity: 6, positionX: 20, positionY: 30, status: 'AVAILABLE' },
    { id: 502, tableCode: 'T2-02', capacity: 4, positionX: 60, positionY: 30, status: 'AVAILABLE' },
    { id: 503, tableCode: 'T2-03', capacity: 10, positionX: 40, positionY: 65, status: 'AVAILABLE' },
  ],
}
const DEMO_BOOKINGS = [
  { id: 1001, contactName: 'Nguyễn Minh Châu', contactPhone: '0901234567', tableCode: 'A2', guestCount: 4, reservationTime: '2026-07-10T18:30:00', depositAmount: 200000, status: 'CONFIRMED', note: 'Sinh nhật' },
  { id: 1002, contactName: 'Lê Trung Kiên', contactPhone: '0912345678', tableCode: 'A3', guestCount: 3, reservationTime: '2026-07-10T19:00:00', depositAmount: 150000, status: 'CHECKED_IN', note: '' },
  { id: 1003, contactName: 'Trần Thu Hà', contactPhone: '0923456789', tableCode: 'VIP1', guestCount: 6, reservationTime: '2026-07-10T19:30:00', depositAmount: 500000, status: 'CONFIRMED', note: 'Phòng riêng' },
  { id: 1004, contactName: 'Phạm Văn Bình', contactPhone: '0934567890', tableCode: 'A5', guestCount: 2, reservationTime: '2026-07-10T20:00:00', depositAmount: 0, status: 'PENDING_NO_SHOW', note: '' },
  { id: 1005, contactName: 'Đỗ Thị Lan', contactPhone: '0945678901', tableCode: 'A6', guestCount: 4, reservationTime: '2026-07-11T12:00:00', depositAmount: 200000, status: 'CONFIRMED', note: 'Ăn trưa công ty' },
]
const DEMO_MENU = [
  { id: 1, name: 'Lẩu Mắm Miền Tây', category: 'Lẩu', price: 320000, status: 'SELLING', emoji: '🥘' },
  { id: 2, name: 'Tôm Hùm Hấp Gừng', category: 'Hải sản', price: 890000, status: 'SELLING', emoji: '🦞' },
  { id: 3, name: 'Bò Wagyu Nướng Than', category: 'Món chính', price: 680000, status: 'SELLING', emoji: '🥩' },
  { id: 4, name: 'Bún Bò Huế Hoàng Gia', category: 'Món chính', price: 95000, status: 'SELLING', emoji: '🍜' },
  { id: 5, name: 'Chả Cá Lã Vọng', category: 'Món chính', price: 280000, status: 'OUT_OF_STOCK', emoji: '🐟' },
  { id: 6, name: 'Chè Cung Đình Huế', category: 'Tráng miệng', price: 85000, status: 'SELLING', emoji: '🍮' },
  { id: 7, name: 'Nước Ép Trái Cây', category: 'Đồ uống', price: 55000, status: 'SELLING', emoji: '🥤' },
  { id: 8, name: 'Rượu Vang Đỏ Ý', category: 'Đồ uống', price: 450000, status: 'DISCONTINUED', emoji: '🍷' },
]
const DEMO_WAITLIST = [
  { id: 1, customer: { fullName: 'Vũ Quốc Bình' }, guestCount: 4, desiredTime: '2026-07-10T19:00:00', status: 'WAITING', createdAt: '2026-07-10T17:30:00' },
  { id: 2, customer: { fullName: 'Hoàng Thị Mai' }, guestCount: 2, desiredTime: '2026-07-10T20:00:00', status: 'INVITED', createdAt: '2026-07-10T18:00:00', inviteExpiresAt: new Date(Date.now() + 8 * 60 * 1000).toISOString() },
]
// B13: Đánh giá và xếp hạng nhà hàng
const DEMO_REVIEWS = [
  { id: 1, customer: { fullName: 'Nguyễn Minh Châu' }, rating: 5, comment: 'Món ăn tuyệt vời, phục vụ chu đáo. Sẽ quay lại!', createdAt: '2026-07-09T20:15:00', reply: null, hidden: false },
  { id: 2, customer: { fullName: 'Trần Thu Hà' }, rating: 4, comment: 'Không gian đẹp, đồ ăn ngon nhưng chờ hơi lâu vào giờ cao điểm.', createdAt: '2026-07-08T21:00:00', reply: 'Cảm ơn anh/chị đã góp ý, nhà hàng sẽ cải thiện tốc độ phục vụ ạ!', hidden: false },
  { id: 3, customer: { fullName: 'Phạm Văn Bình' }, rating: 2, comment: 'Bàn không đúng như đặt trước, nhân viên xử lý chưa nhanh.', createdAt: '2026-07-06T19:40:00', reply: null, hidden: false },
  { id: 4, customer: { fullName: 'Đỗ Thị Lan' }, rating: 5, comment: 'Lẩu mắm ngon xuất sắc, không gian sang trọng.', createdAt: '2026-07-05T12:30:00', reply: null, hidden: false },
]
// B09: Thông báo, xác nhận và nhắc lịch hẹn
const DEMO_NOTIFICATIONS = [
  { id: 1, type: 'BOOKING_NEW', title: 'Đặt bàn mới', message: 'Nguyễn Minh Châu vừa đặt bàn A2 lúc 18:30 hôm nay', createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), read: false },
  { id: 2, type: 'WAITLIST_ACCEPTED', title: 'Khách chấp nhận hàng chờ', message: 'Hoàng Thị Mai đã xác nhận nhận bàn từ hàng chờ', createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), read: false },
  { id: 3, type: 'CANCEL', title: 'Huỷ đặt bàn', message: 'Đơn #998 đã bị khách huỷ trước 3 giờ (miễn phí cọc)', createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), read: true },
  { id: 4, type: 'REVIEW_NEW', title: 'Đánh giá mới', message: 'Phạm Văn Bình vừa để lại đánh giá 2 sao', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), read: true },
  { id: 5, type: 'NO_SHOW', title: 'Nghi vấn No-show', message: 'Đơn #1004 quá 15 phút chưa check-in, cần xác nhận', createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), read: false },
]

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
  const [zones, setZones] = useState([])
  const [tables, setTables] = useState({})
  const [bookings, setBookings] = useState([])
  const [menu, setMenu] = useState([])
  const [menuCategories, setMenuCategories] = useState([]) // du lieu goc tu backend: [{id, categoryName, items:[...]}]
  const [waitlist, setWaitlist] = useState([])
  const [reviews, setReviews] = useState([])          // B13
  const [notifications, setNotifications] = useState([])  // B09
  const [customerQuery, setCustomerQuery] = useState('')  // B14
  const [reviewFilter, setReviewFilter] = useState('ALL')
  const [replyDrafts, setReplyDrafts] = useState({})  // { [reviewId]: text }
  const [activeZone, setActiveZone] = useState(null)
  const [bkFilter, setBkFilter] = useState('ALL')
  const [menuFilter, setMenuFilter] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [draggingTable, setDraggingTable] = useState(null) // bàn đang được kéo trên sơ đồ
  const canvasRef = useRef(null)

  // ── modal states ───────────────────────────────────
  const [menuModal, setMenuModal] = useState(null)   // null | 'add' | item
  const [menuForm, setMenuForm] = useState({ name: '', category: 'Món chính', price: '', emoji: '🍽️', description: '' })
  const [policyModal, setPolicyModal] = useState(false)
  const [policy, setPolicy] = useState({ depositRequired: true, depositType: 'FIXED_AMOUNT', depositValue: '200000', freeCancellationHours: 2, lateCancellationPenaltyPercent: 50, noShowPenaltyPercent: 100 })
  const [addTableModal, setAddTableModal] = useState(false)
  const [tableForm, setTableForm] = useState({ tableCode: '', capacity: 4 })
  const [addZoneModal, setAddZoneModal] = useState(false)
  const [zoneForm, setZoneForm] = useState({ name: '', description: '' })
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null); // Lưu data bàn cần edit nếu có
  const [selectedZone, setSelectedZone] = useState(null);   // Lưu data khu vực cần edit nếu có
  const [branchForm, setBranchForm] = useState({ name: '', address: '', phone: '', province: '', latitude: '', longitude: '' })
  const [savingBranch, setSavingBranch] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)

  // B03: hồ sơ thương hiệu nhà hàng
  const [restaurant, setRestaurant] = useState(null)
  const [restaurantForm, setRestaurantForm] = useState({ restaurantName: '', logoUrl: '', description: '', cuisineType: '', phone: '', email: '', website: '' })
  const [savingRestaurant, setSavingRestaurant] = useState(false)

  // B04: khung giờ hoạt động & tạo chi nhánh mới
  const [operatingHours, setOperatingHours] = useState(DEMO_HOURS)
  const [savingHours, setSavingHours] = useState(false)
  const [newBranchModal, setNewBranchModal] = useState(false)
  const [newBranchForm, setNewBranchForm] = useState({ name: '', address: '', province: '', phone: '', latitude: '', longitude: '' })
  const [creatingBranch, setCreatingBranch] = useState(false)

  const CATEGORIES = ['Khai vị', 'Món chính', 'Lẩu', 'Hải sản', 'Đồ uống', 'Tráng miệng', 'Khác']

  // ── Load data ──────────────────────────────────────
  useEffect(() => {
    branchApi.getMyList()
      .then(r => {
        console.log("r", r);
        const list = r.data.data || DEMO_BRANCHES; setBranches(list); if (list.length) setActiveBranch(list[0])
      })
      .catch(() => { setBranches(DEMO_BRANCHES); setActiveBranch(DEMO_BRANCHES[0]) })
    // B03: hồ sơ thương hiệu chung của nhà hàng
    restaurantApi.getMine()
      .then(r => { console.log("r", r); const d = r.data || DEMO_RESTAURANT; setRestaurant(d); setRestaurantForm(f => ({ ...f, ...d })) })
      .catch(() => { setRestaurant(DEMO_RESTAURANT); setRestaurantForm(f => ({ ...f, ...DEMO_RESTAURANT })) })
  }, [])
  console.log("activeBranch", activeBranch);
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
      .then(r => setOperatingHours(r.data?.length ? r.data : DEMO_HOURS))
      .catch(() => setOperatingHours(DEMO_HOURS))
    // zones & tables
    zoneApi.getByBranch(bid).then(async r => {
      const zList = r.data.length ? r.data : (DEMO_ZONES[bid] || DEMO_ZONES[1] || [])
      setZones(zList)
      setActiveZone(zList[0] || null)
      const tMap = {}
      await Promise.all(zList.map(async z => {
        try { const t = await tableApi.getByZone(z.id); tMap[z.id] = t.data }
        catch { tMap[z.id] = DEMO_TABLES[z.id] || [] }
      }))
      setTables(tMap)
    }).catch(() => {
      const zList = DEMO_ZONES[bid] || DEMO_ZONES[1] || []
      setZones(zList); setActiveZone(zList[0] || null)
      const tMap = {}; zList.forEach(z => { tMap[z.id] = DEMO_TABLES[z.id] || [] }); setTables(tMap)
    })
    bookings
    bookingApi.myBookings().then(r => setBookings(r.data || DEMO_BOOKINGS)).catch(() => setBookings(DEMO_BOOKINGS))
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
      setMenu(flat.length ? flat : DEMO_MENU)
    }).catch(() => { setMenuCategories([]); setMenu(DEMO_MENU) })
    // waitlist (demo)
    setWaitlist(DEMO_WAITLIST)
    // reviews (B13)
    reviewApi.getByBranch(bid).then(r => {
      const list = r.data?.content || r.data || []
      setReviews(list.length ? list : DEMO_REVIEWS)
    }).catch(() => setReviews(DEMO_REVIEWS))
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
        setNotifications(unread.length ? unread.map(n => ({ ...n, read: false })) : DEMO_NOTIFICATIONS)
      })
      .catch(() => setNotifications(DEMO_NOTIFICATIONS))
  }, [])

  // ── Computed stats ─────────────────────────────────
  const allTables = Object.values(tables).flat()
  const today = new Date().toDateString()
  const todayBookings = bookings.filter(b => new Date(b.reservationTime).toDateString() === today)
  const stats = {
    totalTables: allTables.length,
    available: allTables.filter(t => t.status === 'AVAILABLE').length,
    occupied: allTables.filter(t => t.status === 'OCCUPIED').length,
    reserved: allTables.filter(t => t.status === 'RESERVED').length,
    fillRate: allTables.length ? Math.round((allTables.filter(t => t.status !== 'AVAILABLE').length / allTables.length) * 100) : 0,
    todayConfirmed: todayBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN').length,
    totalRevenue: bookings.filter(b => b.status === 'COMPLETED').reduce((s, b) => s + (b.depositAmount || 0), 0),
    noShowRate: bookings.length ? Math.round((bookings.filter(b => b.status === 'NO_SHOW').length / bookings.length) * 100) : 0,
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

  // ── Actions ────────────────────────────────────────
  const updateTableStatus = async (tableId, newStatus) => {
    try { await tableApi.updateStatus(tableId, newStatus) } catch { }
    setTables(prev => {
      const next = { ...prev }
      for (const zid of Object.keys(next))
        next[zid] = next[zid].map(t => t.id === tableId ? { ...t, status: newStatus } : t)
      return next
    })
    toast.success('Cập nhật trạng thái bàn thành công')
    setSelectedTable(null)
  }
  const onTableDragStart = (e, table) => {
    setDraggingTable(table)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onCanvasDragOver = (e) => {
    e.preventDefault() // bắt buộc để onDrop được kích hoạt
    e.dataTransfer.dropEffect = 'move'
  }

  const onCanvasDrop = async (e) => {
    e.preventDefault()
    if (!draggingTable || !canvasRef.current || !activeZone) { setDraggingTable(null); return }
    const rect = canvasRef.current.getBoundingClientRect()
    let x = ((e.clientX - rect.left) / rect.width) * 100
    let y = ((e.clientY - rect.top) / rect.height) * 100
    x = Math.min(97, Math.max(3, Number(x.toFixed(1))))
    y = Math.min(97, Math.max(3, Number(y.toFixed(1))))

    // Cập nhật ngay trên giao diện để thao tác kéo-thả mượt, không phụ thuộc mạng
    setTables(prev => ({
      ...prev,
      [activeZone.id]: (prev[activeZone.id] || []).map(t =>
        t.id === draggingTable.id ? { ...t, positionX: x, positionY: y } : t)
    }))

    try {
      await tableApi.updateLayout(draggingTable.id, { positionX: x, positionY: y })
    } catch {
      // Bỏ qua lỗi mạng: vị trí vẫn được giữ ở giao diện, đồng bộ lại khi tải lại trang
    }
    setDraggingTable(null)
  }

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

  const saveMenuItem = async (e) => {
    e.preventDefault()
    if (!menuForm.price || Number(menuForm.price) <= 0) { toast.error('Giá phải lớn hơn 0'); return }
    if (!activeBranch) { toast.error('Chưa chọn chi nhánh'); return }
    try {
      // 1. Tim danh muc theo ten; neu chi nhanh chua co danh muc nay thi tao moi
      let category = menuCategories.find(c => c.categoryName === menuForm.category)
      if (!category) {
        const { data: res } = await menuApi.createCategory({ branchId: activeBranch.id, categoryName: menuForm.category })
        category = { ...res.data, items: [] }
        setMenuCategories(prev => [...prev, category])
      }

      const payload = {
        categoryId: category.id,
        itemName: menuForm.name,
        description: menuForm.description,
        price: Number(menuForm.price),
        imageUrl: '',
        status: menuModal === 'add' ? 'SELLING' : (menuModal.status || 'SELLING'),
      }

      if (menuModal === 'add') {
        const { data: res } = await menuApi.createItem(payload)
        const created = res.data
        setMenu(p => [...p, {
          id: created.id, name: created.itemName, category: menuForm.category,
          price: Number(created.price), status: created.status, description: created.description || '', emoji: menuForm.emoji
        }])
        toast.success('Đã thêm món!')
      } else {
        const { data: res } = await menuApi.updateItem(menuModal.id, payload)
        const updated = res.data
        setMenu(p => p.map(m => m.id === menuModal.id ? {
          ...m, name: updated.itemName, category: menuForm.category,
          price: Number(updated.price), status: updated.status, description: updated.description || '', emoji: menuForm.emoji
        } : m))
        toast.success('Đã cập nhật!')
      }
      setMenuModal(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu món ăn')
    }
  }

  const cycleMenuStatus = async (item) => {
    const next = { SELLING: 'OUT_OF_STOCK', OUT_OF_STOCK: 'DISCONTINUED', DISCONTINUED: 'SELLING' }[item.status]
    try {
      await menuApi.updateStatus(item.id, next)
      setMenu(p => p.map(m => m.id === item.id ? { ...m, status: next } : m))
      toast.success(`Chuyển sang: ${next === 'SELLING' ? 'Đang bán' : next === 'OUT_OF_STOCK' ? 'Hết món' : 'Ngừng bán'}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái món')
    }
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
  const updateHourField = (day, field, value) => {
    setOperatingHours(prev => prev.map(h => h.dayOfWeek === day ? { ...h, [field]: value } : h))
  }
  const saveOperatingHours = async () => {
    if (!activeBranch) return
    const invalid = operatingHours.find(h => h.closeTime <= h.openTime)
    if (invalid) { toast.error(`Giờ đóng cửa phải sau giờ mở cửa (${WEEKDAYS.find(w => w[0] === invalid.dayOfWeek)?.[1]})`); return }
    setSavingHours(true)
    try {
      await operatingHourApi.save(activeBranch.id, operatingHours.map(h => ({
        dayOfWeek: h.dayOfWeek, openTime: h.openTime, closeTime: h.closeTime, shiftName: h.shiftName || 'Cả ngày',
      })))
      toast.success('Đã lưu khung giờ hoạt động!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Khung giờ không hợp lệ, vui lòng kiểm tra lại')
    } finally { setSavingHours(false) }
  }

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
  const createBranch = async (e) => {
    e.preventDefault()
    if (!newBranchForm.name.trim() || !newBranchForm.address.trim()) {
      toast.error('Tên chi nhánh và địa chỉ không được để trống'); return
    }
    setCreatingBranch(true)
    try {
      const payload = {
        ...newBranchForm, latitude: newBranchForm.latitude === '' ? null : Number(newBranchForm.latitude),
        longitude: newBranchForm.longitude === '' ? null : Number(newBranchForm.longitude)
      }
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

  const addTable = async (e) => {
    e.preventDefault()
    if (!activeZone) { toast.error('Chưa chọn khu vực'); return }
    try { await tableApi.create({ ...tableForm, zoneId: activeZone.id, capacity: Number(tableForm.capacity) }) } catch { }
    const newT = { id: Date.now(), ...tableForm, capacity: Number(tableForm.capacity), positionX: 50, positionY: 50, status: 'AVAILABLE' }
    setTables(p => ({ ...p, [activeZone.id]: [...(p[activeZone.id] || []), newT] }))
    setAddTableModal(false); setTableForm({ tableCode: '', capacity: 4 })
    toast.success(`Đã thêm bàn ${tableForm.tableCode}`)
  }

  const addZone = (e) => {
    e.preventDefault()
    const newZ = { id: Date.now(), ...zoneForm, active: true }
    setZones(p => [...p, newZ])
    setTables(p => ({ ...p, [newZ.id]: [] }))
    setAddZoneModal(false); setZoneForm({ name: '', description: '' })
    toast.success(`Đã thêm khu vực ${zoneForm.name}`)
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
    { id: 'tables', icon: '🪑', label: 'Sơ đồ bàn' },
    { id: 'menu', icon: '🍜', label: 'Thực đơn' },
    { id: 'waitlist', icon: '⏳', label: 'Hàng chờ' },
    { id: 'customers', icon: '👤', label: 'Khách hàng' },
    { id: 'reviews', icon: '⭐', label: 'Đánh giá', badge: reviews.filter(r => !r.reply && !r.hidden).length },
    { id: 'reports', icon: '📈', label: 'Thống kê' },
    { id: 'policy', icon: '💰', label: 'Chính sách' },
    { id: 'notifications', icon: '🔔', label: 'Thông báo', badge: unreadCount },
    { id: 'settings', icon: '⚙️', label: 'Cài đặt' },
  ]

  // ── Filtered bookings ──────────────────────────────
  const filteredBookings = bkFilter === 'ALL' ? bookings : bookings.filter(b => b.status === bkFilter)
  const filteredMenu = menuFilter === 'ALL' ? menu : menu.filter(m => m.category === menuFilter || m.status === menuFilter)

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
                    {Object.entries(TABLE_STATUS).map(([k, { color, bg, label, icon }]) => {
                      const cnt = allTables.filter(t => t.status === k).length
                      if (!cnt) return null
                      return (
                        <div key={k} style={{
                          display: 'flex', alignItems: 'center', gap: '.5rem',
                          background: bg, border: `1px solid ${color}22`, borderRadius: 4, padding: '.4rem .75rem'
                        }}>
                          <span style={{ color, fontSize: '.9rem' }}>{icon}</span>
                          <span style={{ fontSize: '.8rem', fontWeight: 600, color }}>{cnt}</span>
                          <span style={{ fontSize: '.75rem', color: C.muted }}>{label}</span>
                        </div>
                      )
                    })}
                  </div>
                  {/* Bar chart */}
                  {allTables.length > 0 && (
                    <div style={{ height: 12, borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
                      {Object.entries(TABLE_STATUS).map(([k, { color }]) => {
                        const w = allTables.length ? allTables.filter(t => t.status === k).length / allTables.length * 100 : 0
                        return w > 0 ? <div key={k} style={{ width: `${w}%`, background: color, transition: 'width .5s' }} /> : null
                      })}
                    </div>
                  )}
                </div>

                {/* Upcoming bookings */}
                <div style={S.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={S.eyebrow}>Đặt bàn sắp tới</div>
                    <button onClick={() => setActiveTab('bookings')} style={{ ...S.btnSm, background: C.goldSubtle, color: C.goldDark, border: `1px solid ${C.goldBorder}` }}>
                      Xem tất cả →
                    </button>
                  </div>
                  {bookings.filter(b => ['CONFIRMED', 'CHECKED_IN'].includes(b.status)).slice(0, 5).map(b => (
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
                  {bookings.filter(b => ['CONFIRMED', 'CHECKED_IN'].includes(b.status)).length === 0 && (
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

          {/* ══════ BOOKINGS ══════ */}
          {activeTab === 'bookings' && (
            <div>
              <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[['ALL', 'Tất cả'], ['CONFIRMED', 'Đã xác nhận'], ['CHECKED_IN', 'Đang phục vụ'],
                ['PENDING_NO_SHOW', 'Nghi No-show'], ['COMPLETED', 'Hoàn tất'], ['CANCELLED_BY_CUSTOMER', 'Đã huỷ']].map(([k, l]) => (
                  <button key={k} onClick={() => setBkFilter(k)} style={{
                    ...S.btnSm,
                    background: bkFilter === k ? C.brown : C.white,
                    color: bkFilter === k ? '#fff' : C.muted,
                    border: `1.5px solid ${bkFilter === k ? C.brown : C.border}`,
                  }}>{l} {k === 'ALL' ? `(${bookings.length})` : bookings.filter(b => b.status === k).length > 0 ? `(${bookings.filter(b => b.status === k).length})` : ''}</button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredBookings.length === 0 && (
                  <div style={{ ...S.card, textAlign: 'center', padding: '3rem', color: C.muted }}>
                    Không có đặt bàn nào ở trạng thái này
                  </div>
                )}
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
                        <span>🪑 Bàn: <strong>{b.tableCode}</strong></span>
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

          {/* ══════ TABLES / SƠ ĐỒ BÀN ══════ */}
          {activeTab === 'tables' && (
            <div className="table-layout-container">
              {/* Giao diện chính của sơ đồ bàn, truyền các hàm mở modal xuống nếu cần */}
              <TableLayoutTab
                onOpenTableModal={(tableData) => {
                  setSelectedTable(tableData);
                  setIsTableModalOpen(true);
                }}
                onOpenZoneModal={(zoneData) => {
                  setSelectedZone(zoneData);
                  setIsZoneModalOpen(true);
                }}
              />

              {/* Modal thêm/sửa Bàn (Table) theo cấu trúc mới */}
              <TableFormModal
                isOpen={isTableModalOpen}
                onClose={() => {
                  setIsTableModalOpen(false);
                  setSelectedTable(null);
                }}
                tableData={selectedTable}
              />

              {/* Modal thêm/sửa Khu vực (Zone) theo cấu trúc mới */}
              <ZoneFormModal
                isOpen={isZoneModalOpen}
                onClose={() => {
                  setIsZoneModalOpen(false);
                  setSelectedZone(null);
                }}
                zoneData={selectedZone}
              />
            </div>
          )}

          {/* ══════ MENU ══════ */}
          {activeTab === 'menu' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  {['ALL', ...CATEGORIES, 'SELLING', 'OUT_OF_STOCK', 'DISCONTINUED'].slice(0, 8).map(f => (
                    <button key={f} onClick={() => setMenuFilter(f)} style={{
                      ...S.btnSm,
                      background: menuFilter === f ? C.brown : C.white,
                      color: menuFilter === f ? '#fff' : C.muted,
                      border: `1.5px solid ${menuFilter === f ? C.brown : C.border}`,
                    }}>
                      {f === 'ALL' ? 'Tất cả' : f === 'SELLING' ? 'Đang bán' : f === 'OUT_OF_STOCK' ? 'Hết món' : f === 'DISCONTINUED' ? 'Ngừng bán' : f}
                    </button>
                  ))}
                </div>
                <button onClick={() => { setMenuForm({ name: '', category: 'Món chính', price: '', emoji: '🍽️', description: '' }); setMenuModal('add') }}
                  style={S.btnGold}>+ Thêm món</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                {filteredMenu.map(item => (
                  <div key={item.id} style={{ ...S.card, border: `1px solid ${C.border}`, transition: 'box-shadow .2s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(61,43,31,.12)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(61,43,31,.08)'}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{
                        width: 60, height: 60, borderRadius: 4, background: C.creamDark,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0
                      }}>
                        {item.emoji || '🍽️'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.25rem' }}>
                          <h3 style={{ fontWeight: 700, fontSize: '.9rem', color: C.text }}>{item.name}</h3>
                          <span style={{
                            fontSize: '.65rem', fontWeight: 700, padding: '.15rem .5rem', borderRadius: 99,
                            background: item.status === 'SELLING' ? C.greenBg : item.status === 'OUT_OF_STOCK' ? C.amberBg : C.redBg,
                            color: item.status === 'SELLING' ? C.green : item.status === 'OUT_OF_STOCK' ? C.amber : C.red,
                          }}>{item.status === 'SELLING' ? 'Đang bán' : item.status === 'OUT_OF_STOCK' ? 'Hết món' : 'Ngừng bán'}</span>
                        </div>
                        <p style={{ fontSize: '.73rem', color: C.muted, marginBottom: '.4rem' }}>{item.category}</p>
                        <p style={{ color: C.goldDark, fontWeight: 700, fontSize: '.92rem' }}>{Number(item.price).toLocaleString('vi-VN')}₫</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem', paddingTop: '.875rem', borderTop: `1px solid ${C.creamDark}` }}>
                      <button onClick={() => { setMenuForm({ name: item.name, category: item.category, price: String(item.price), emoji: item.emoji || '🍽️', description: item.description || '' }); setMenuModal(item) }}
                        style={{ ...S.btnSm, background: C.cream, color: C.brown, border: `1px solid ${C.border}`, flex: 1 }}>✏️ Sửa</button>
                      <button onClick={() => cycleMenuStatus(item)}
                        style={{ ...S.btnSm, background: C.goldSubtle, color: C.goldDark, border: `1px solid ${C.goldBorder}`, flex: 1 }}>🔄 Đổi trạng thái</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                  <button onClick={() => setNewBranchModal(true)} style={{ ...S.btnOut, fontSize: '.78rem', padding: '.4rem .9rem' }}>+ Thêm chi nhánh</button>
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
                  <div style={S.card}>
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
                  </div>

                  {/* Trạng thái hoạt động / Tạm ngưng */}
                  <div style={S.card}>
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
                  </div>
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
          <div style={{ background: C.white, borderRadius: 4, width: '100%', maxWidth: 480, overflow: 'hidden' }}>
            <div style={{ background: `linear-gradient(135deg,${C.brown},${C.brownMid})`, padding: '1.25rem 1.5rem' }}>
              <h2 style={{ ...serif, fontWeight: 700, color: '#fff', fontSize: '1.25rem' }}>Thêm chi nhánh mới</h2>
            </div>
            <form onSubmit={createBranch} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                <div>
                  <label style={S.label}>Vĩ độ</label>
                  <input style={S.input} type="number" step="0.000001" value={newBranchForm.latitude}
                    onChange={e => setNewBranchForm(p => ({ ...p, latitude: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>Kinh độ</label>
                  <input style={S.input} type="number" step="0.000001" value={newBranchForm.longitude}
                    onChange={e => setNewBranchForm(p => ({ ...p, longitude: e.target.value }))} />
                </div>
              </div>
              <p style={{ fontSize: '.76rem', color: C.muted }}>
                Chi nhánh mới sẽ ở trạng thái "Chờ duyệt" cho đến khi quản trị viên xác thực hình ảnh và mô tả.
                Sau khi tạo, hãy thiết lập khung giờ hoạt động và chính sách đặt cọc riêng cho chi nhánh này.
              </p>
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

      {/* Add/Edit Menu Modal */}
      {menuModal !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{ background: C.white, borderRadius: 4, width: '100%', maxWidth: 460, overflow: 'hidden' }}>
            <div style={{ background: `linear-gradient(135deg,${C.brown},${C.brownMid})`, padding: '1.25rem 1.5rem' }}>
              <h2 style={{ ...serif, fontWeight: 700, color: '#fff', fontSize: '1.25rem' }}>
                {menuModal === 'add' ? 'Thêm món mới' : 'Chỉnh sửa món ăn'}
              </h2>
            </div>
            <form onSubmit={saveMenuItem} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '1rem', alignItems: 'end' }}>
                <div>
                  <label style={S.label}>Emoji</label>
                  <input style={{ ...S.input, textAlign: 'center', fontSize: '1.5rem', padding: '.45rem' }}
                    value={menuForm.emoji} onChange={e => setMenuForm(p => ({ ...p, emoji: e.target.value }))} maxLength={2} />
                </div>
                <div>
                  <label style={S.label}>Tên món *</label>
                  <input style={S.input} value={menuForm.name} onChange={e => setMenuForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={S.label}>Danh mục</label>
                  <select style={S.input} value={menuForm.category} onChange={e => setMenuForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Giá (₫) *</label>
                  <input style={S.input} type="number" min="1000" step="1000"
                    value={menuForm.price} onChange={e => setMenuForm(p => ({ ...p, price: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label style={S.label}>Mô tả (tùy chọn)</label>
                <textarea style={{ ...S.input, resize: 'vertical' }} rows={2}
                  value={menuForm.description} onChange={e => setMenuForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setMenuModal(null)} style={S.btnOut}>Huỷ</button>
                <button type="submit" style={S.btnGold}>✦ Lưu món</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {addTableModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{ background: C.white, borderRadius: 4, width: '100%', maxWidth: 400, overflow: 'hidden' }}>
            <div style={{ background: `linear-gradient(135deg,${C.brown},${C.brownMid})`, padding: '1.25rem 1.5rem' }}>
              <h2 style={{ ...serif, fontWeight: 700, color: '#fff', fontSize: '1.25rem' }}>Thêm bàn mới</h2>
            </div>
            <form onSubmit={addTable} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={S.label}>Khu vực</label>
                <select style={S.input} value={activeZone?.id || ''} onChange={e => setActiveZone(zones.find(z => z.id === Number(e.target.value)))}>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={S.label}>Mã bàn *</label>
                  <input style={S.input} value={tableForm.tableCode}
                    onChange={e => setTableForm(p => ({ ...p, tableCode: e.target.value }))} placeholder="VD: A1, VIP-01" required />
                </div>
                <div>
                  <label style={S.label}>Sức chứa</label>
                  <input style={S.input} type="number" min="1" max="30" value={tableForm.capacity}
                    onChange={e => setTableForm(p => ({ ...p, capacity: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setAddTableModal(false)} style={S.btnOut}>Huỷ</button>
                <button type="submit" style={S.btnGold}>+ Thêm bàn</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Zone Modal */}
      {addZoneModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{ background: C.white, borderRadius: 4, width: '100%', maxWidth: 400, overflow: 'hidden' }}>
            <div style={{ background: `linear-gradient(135deg,${C.brown},${C.brownMid})`, padding: '1.25rem 1.5rem' }}>
              <h2 style={{ ...serif, fontWeight: 700, color: '#fff', fontSize: '1.25rem' }}>Thêm khu vực mới</h2>
            </div>
            <form onSubmit={addZone} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={S.label}>Tên khu vực *</label>
                <input style={S.input} value={zoneForm.name}
                  onChange={e => setZoneForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="VD: Trong nhà, Sân vườn, Phòng VIP..." required />
              </div>
              <div>
                <label style={S.label}>Mô tả</label>
                <input style={S.input} value={zoneForm.description}
                  onChange={e => setZoneForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Mô tả ngắn về khu vực..." />
              </div>
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setAddZoneModal(false)} style={S.btnOut}>Huỷ</button>
                <button type="submit" style={S.btnGold}>+ Thêm khu vực</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
