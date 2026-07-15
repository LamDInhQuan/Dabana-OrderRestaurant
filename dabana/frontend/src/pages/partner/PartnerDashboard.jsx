import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { branchApi, bookingApi, menuApi, zoneApi, tableApi, waitlistApi } from '../../api'
import toast from 'react-hot-toast'

// ── Google Font ─────────────────────────────────────────────────
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap'

// ── Design tokens ───────────────────────────────────────────────
const C = {
  gold:'#C9A84C', goldLight:'#E8C97A', goldDark:'#8B6914',
  goldSubtle:'rgba(201,168,76,.1)', goldBorder:'rgba(201,168,76,.25)',
  brown:'#3D2B1F', brownMid:'#6B4226', brownLight:'#A0714F',
  cream:'#FBF7EF', creamDark:'#F0E8D5',
  text:'#2C1A0E', muted:'#8A6E57', border:'#E8DECE',
  white:'#FFFFFF',
  green:'#22C55E', greenBg:'rgba(34,197,94,.1)',
  red:'#EF4444',   redBg:'rgba(239,68,68,.1)',
  amber:'#F59E0B', amberBg:'rgba(245,158,11,.1)',
  blue:'#3B82F6',  blueBg:'rgba(59,130,246,.1)',
  slate:'#94A3B8',
  purple:'#8B5CF6',purpleBg:'rgba(139,92,246,.1)',
}

// ── Status meta ─────────────────────────────────────────────────
const TABLE_STATUS = {
  AVAILABLE:         { color:C.green,  bg:C.greenBg,  label:'Trống',        icon:'✓' },
  RESERVED:          { color:C.red,    bg:C.redBg,    label:'Đã đặt',       icon:'📋' },
  OCCUPIED:          { color:C.amber,  bg:C.amberBg,  label:'Đang dùng',    icon:'👥' },
  CLEANING:          { color:C.slate,  bg:'rgba(148,163,184,.12)', label:'Dọn dẹp', icon:'🧹' },
  HELD_FOR_WAITLIST: { color:C.purple, bg:C.purpleBg, label:'Hàng chờ',     icon:'⏳' },
  MAINTENANCE:       { color:C.brown,  bg:'rgba(61,43,31,.1)',    label:'Bảo trì',  icon:'🔧' },
}
const BOOKING_STATUS = {
  CONFIRMED:         { color:C.green,  bg:C.greenBg,  label:'Đã xác nhận' },
  CHECKED_IN:        { color:C.blue,   bg:C.blueBg,   label:'Đang phục vụ' },
  PENDING_NO_SHOW:   { color:C.amber,  bg:C.amberBg,  label:'Nghi No-show' },
  COMPLETED:         { color:C.slate,  bg:'rgba(148,163,184,.1)', label:'Hoàn tất' },
  NO_SHOW:           { color:C.red,    bg:C.redBg,    label:'No-show' },
  CANCELLED_BY_CUSTOMER:   { color:C.red, bg:C.redBg, label:'KH huỷ' },
  CANCELLED_BY_RESTAURANT: { color:C.red, bg:C.redBg, label:'NH huỷ' },
}

// ── Demo data ────────────────────────────────────────────────────
const DEMO_BRANCHES = [
  { id:1, name:'Nhà Hàng Sen Vàng – Chi nhánh Hoàn Kiếm', address:'12 Hồ Hoàn Kiếm, Hà Nội', approvalStatus:'APPROVED', operatingStatus:'ACTIVE' },
  { id:2, name:'Nhà Hàng Sen Vàng – Chi nhánh Tây Hồ',   address:'88 Xuân Diệu, Tây Hồ, Hà Nội', approvalStatus:'APPROVED', operatingStatus:'ACTIVE' },
]
const DEMO_ZONES = {
  1:[{ id:1, name:'Trong nhà', active:true },{ id:2, name:'Sân vườn', active:true },{ id:3, name:'Phòng VIP', active:true }],
  2:[{ id:4, name:'Tầng 1', active:true },{ id:5, name:'Tầng 2', active:true }],
}
const DEMO_TABLES = {
  1:[
    { id:101,tableCode:'A1',capacity:2,positionX:12,positionY:18,status:'AVAILABLE' },
    { id:102,tableCode:'A2',capacity:4,positionX:30,positionY:18,status:'RESERVED' },
    { id:103,tableCode:'A3',capacity:4,positionX:50,positionY:18,status:'OCCUPIED' },
    { id:104,tableCode:'A4',capacity:6,positionX:70,positionY:18,status:'AVAILABLE' },
    { id:105,tableCode:'A5',capacity:2,positionX:12,positionY:52,status:'CLEANING' },
    { id:106,tableCode:'A6',capacity:4,positionX:30,positionY:52,status:'AVAILABLE' },
    { id:107,tableCode:'A7',capacity:4,positionX:50,positionY:52,status:'HELD_FOR_WAITLIST' },
    { id:108,tableCode:'A8',capacity:8,positionX:72,positionY:52,status:'AVAILABLE' },
  ],
  2:[
    { id:201,tableCode:'B1',capacity:4,positionX:20,positionY:30,status:'AVAILABLE' },
    { id:202,tableCode:'B2',capacity:4,positionX:50,positionY:30,status:'RESERVED' },
    { id:203,tableCode:'B3',capacity:6,positionX:80,positionY:30,status:'AVAILABLE' },
    { id:204,tableCode:'B4',capacity:2,positionX:35,positionY:65,status:'OCCUPIED' },
  ],
  3:[
    { id:301,tableCode:'VIP1',capacity:8,positionX:25,positionY:35,status:'AVAILABLE' },
    { id:302,tableCode:'VIP2',capacity:10,positionX:65,positionY:35,status:'RESERVED' },
    { id:303,tableCode:'VIP3',capacity:6,positionX:45,positionY:70,status:'AVAILABLE' },
  ],
  4:[
    { id:401,tableCode:'T1-01',capacity:2,positionX:15,positionY:20,status:'AVAILABLE' },
    { id:402,tableCode:'T1-02',capacity:4,positionX:40,positionY:20,status:'AVAILABLE' },
    { id:403,tableCode:'T1-03',capacity:4,positionX:65,positionY:20,status:'RESERVED' },
    { id:404,tableCode:'T1-04',capacity:6,positionX:15,positionY:60,status:'AVAILABLE' },
    { id:405,tableCode:'T1-05',capacity:8,positionX:55,positionY:60,status:'OCCUPIED' },
  ],
  5:[
    { id:501,tableCode:'T2-01',capacity:6,positionX:20,positionY:30,status:'AVAILABLE' },
    { id:502,tableCode:'T2-02',capacity:4,positionX:60,positionY:30,status:'AVAILABLE' },
    { id:503,tableCode:'T2-03',capacity:10,positionX:40,positionY:65,status:'AVAILABLE' },
  ],
}
const DEMO_BOOKINGS = [
  { id:1001,contactName:'Nguyễn Minh Châu',contactPhone:'0901234567',tableCode:'A2',guestCount:4,reservationTime:'2026-07-10T18:30:00',depositAmount:200000,status:'CONFIRMED',note:'Sinh nhật' },
  { id:1002,contactName:'Lê Trung Kiên',contactPhone:'0912345678',tableCode:'A3',guestCount:3,reservationTime:'2026-07-10T19:00:00',depositAmount:150000,status:'CHECKED_IN',note:'' },
  { id:1003,contactName:'Trần Thu Hà',contactPhone:'0923456789',tableCode:'VIP1',guestCount:6,reservationTime:'2026-07-10T19:30:00',depositAmount:500000,status:'CONFIRMED',note:'Phòng riêng' },
  { id:1004,contactName:'Phạm Văn Bình',contactPhone:'0934567890',tableCode:'A5',guestCount:2,reservationTime:'2026-07-10T20:00:00',depositAmount:0,status:'PENDING_NO_SHOW',note:'' },
  { id:1005,contactName:'Đỗ Thị Lan',contactPhone:'0945678901',tableCode:'A6',guestCount:4,reservationTime:'2026-07-11T12:00:00',depositAmount:200000,status:'CONFIRMED',note:'Ăn trưa công ty' },
]
const DEMO_MENU = [
  { id:1,name:'Lẩu Mắm Miền Tây',category:'Lẩu',price:320000,status:'SELLING',emoji:'🥘' },
  { id:2,name:'Tôm Hùm Hấp Gừng',category:'Hải sản',price:890000,status:'SELLING',emoji:'🦞' },
  { id:3,name:'Bò Wagyu Nướng Than',category:'Món chính',price:680000,status:'SELLING',emoji:'🥩' },
  { id:4,name:'Bún Bò Huế Hoàng Gia',category:'Món chính',price:95000,status:'SELLING',emoji:'🍜' },
  { id:5,name:'Chả Cá Lã Vọng',category:'Món chính',price:280000,status:'OUT_OF_STOCK',emoji:'🐟' },
  { id:6,name:'Chè Cung Đình Huế',category:'Tráng miệng',price:85000,status:'SELLING',emoji:'🍮' },
  { id:7,name:'Nước Ép Trái Cây',category:'Đồ uống',price:55000,status:'SELLING',emoji:'🥤' },
  { id:8,name:'Rượu Vang Đỏ Ý',category:'Đồ uống',price:450000,status:'DISCONTINUED',emoji:'🍷' },
]
const DEMO_WAITLIST = [
  { id:1,customer:{fullName:'Vũ Quốc Bình'},guestCount:4,desiredTime:'2026-07-10T19:00:00',status:'WAITING',createdAt:'2026-07-10T17:30:00' },
  { id:2,customer:{fullName:'Hoàng Thị Mai'},guestCount:2,desiredTime:'2026-07-10T20:00:00',status:'INVITED',createdAt:'2026-07-10T18:00:00',inviteExpiresAt:new Date(Date.now()+8*60*1000).toISOString() },
]

// ── Shared UI helpers ────────────────────────────────────────────
const serif = { fontFamily:"'Cormorant Garamond',Georgia,serif" }

function GoldDivider() {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:'.75rem',margin:'1.25rem 0' }}>
      <div style={{ flex:1,height:1,background:`linear-gradient(to right,transparent,${C.goldLight},transparent)` }} />
      <span style={{ color:C.gold,fontSize:'.8rem' }}>✦</span>
      <div style={{ flex:1,height:1,background:`linear-gradient(to left,transparent,${C.goldLight},transparent)` }} />
    </div>
  )
}

function Badge({ status, statusMap }) {
  const meta = statusMap[status] || { color:C.muted, bg:'rgba(138,110,87,.1)', label:status }
  return (
    <span style={{ display:'inline-block', padding:'.2rem .65rem', borderRadius:2,
      fontSize:'.7rem', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase',
      color:meta.color, background:meta.bg, border:`1px solid ${meta.color}22` }}>
      {meta.label}
    </span>
  )
}

function StatCard({ icon, label, value, sub, color, trend }) {
  return (
    <div style={{ background:C.white, borderRadius:4, padding:'1.5rem',
      boxShadow:'0 2px 12px rgba(61,43,31,.08)', borderTop:`3px solid ${color}`,
      transition:'transform .2s, box-shadow .2s' }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(61,43,31,.12)'}}
      onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 2px 12px rgba(61,43,31,.08)'}}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'.75rem' }}>
        <div style={{ fontSize:'1.5rem' }}>{icon}</div>
        {trend && <span style={{ fontSize:'.72rem',fontWeight:700,color:trend>0?C.green:C.red,
          background:trend>0?C.greenBg:C.redBg,padding:'.2rem .5rem',borderRadius:99 }}>
          {trend>0?'↑':'↓'}{Math.abs(trend)}%
        </span>}
      </div>
      <div style={{ ...serif,fontSize:'2rem',fontWeight:700,color,lineHeight:1,marginBottom:'.3rem' }}>{value}</div>
      <div style={{ fontSize:'.82rem',fontWeight:600,color:C.text,marginBottom:sub?'.15rem':0 }}>{label}</div>
      {sub&&<div style={{ fontSize:'.75rem',color:C.muted }}>{sub}</div>}
    </div>
  )
}

// ── Countdown for waitlist invite ────────────────────────────────
function WaitCountdown({ expiresAt }) {
  const [secs,setSecs] = useState(0)
  useEffect(() => {
    const calc = () => Math.max(0,Math.floor((new Date(expiresAt)-Date.now())/1000))
    setSecs(calc())
    const t = setInterval(()=>setSecs(calc()),1000)
    return ()=>clearInterval(t)
  },[expiresAt])
  const m=Math.floor(secs/60),s=secs%60
  return <span style={{ color:secs<120?C.red:C.amber,fontWeight:700,fontVariantNumeric:'tabular-nums' }}>
    {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
  </span>
}

// ══════════════════════════════════════════════════════════════════
export default function PartnerDashboard() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [activeBranch, setActiveBranch] = useState(null)
  const [branches, setBranches]   = useState([])
  const [zones,    setZones]      = useState([])
  const [tables,   setTables]     = useState({})
  const [bookings, setBookings]   = useState([])
  const [menu,     setMenu]       = useState([])
  const [menuCategories, setMenuCategories] = useState([]) // du lieu goc tu backend: [{id, categoryName, items:[...]}]
  const [waitlist, setWaitlist]   = useState([])
  const [activeZone, setActiveZone] = useState(null)
  const [bkFilter,  setBkFilter]  = useState('ALL')
  const [menuFilter,setMenuFilter]= useState('ALL')
  const [loading,  setLoading]    = useState(false)

  // ── modal states ───────────────────────────────────
  const [menuModal,  setMenuModal]  = useState(null)   // null | 'add' | item
  const [menuForm,   setMenuForm]   = useState({ name:'',category:'Món chính',price:'',emoji:'🍽️',description:'' })
  const [policyModal,setPolicyModal]= useState(false)
  const [policy,     setPolicy]     = useState({ depositRequired:true,depositType:'FIXED_AMOUNT',depositValue:'200000',freeCancellationHours:2,lateCancellationPenaltyPercent:50,noShowPenaltyPercent:100 })
  const [addTableModal,setAddTableModal]=useState(false)
  const [tableForm,setTableForm]    = useState({ tableCode:'',capacity:4 })
  const [addZoneModal,setAddZoneModal]=useState(false)
  const [zoneForm,setZoneForm]      = useState({ name:'',description:'' })
  const [selectedTable,setSelectedTable]=useState(null)
  const [branchForm,setBranchForm]  = useState({ name:'',address:'',phone:'',province:'' })
  const [savingBranch,setSavingBranch]=useState(false)

  const CATEGORIES = ['Khai vị','Món chính','Lẩu','Hải sản','Đồ uống','Tráng miệng','Khác']

  // ── Load data ──────────────────────────────────────
  useEffect(() => {
    branchApi.getMyList()
      .then(r => { const list=r.data||DEMO_BRANCHES; setBranches(list); if(list.length) setActiveBranch(list[0]) })
      .catch(() => { setBranches(DEMO_BRANCHES); setActiveBranch(DEMO_BRANCHES[0]) })
  },[])

  useEffect(() => {
    if (!activeBranch) return
    const bid = activeBranch.id
    setBranchForm({
      name:    activeBranch.name    || '',
      address: activeBranch.address || '',
      phone:   activeBranch.phone   || '',
      province:activeBranch.province|| '',
    })
    // zones & tables
    zoneApi.getByBranch(bid).then(async r => {
      const zList = r.data.length ? r.data : (DEMO_ZONES[bid]||DEMO_ZONES[1]||[])
      setZones(zList)
      setActiveZone(zList[0]||null)
      const tMap={}
      await Promise.all(zList.map(async z => {
        try { const t=await tableApi.getByZone(z.id); tMap[z.id]=t.data }
        catch { tMap[z.id]= DEMO_TABLES[z.id]||[] }
      }))
      setTables(tMap)
    }).catch(()=>{
      const zList=DEMO_ZONES[bid]||DEMO_ZONES[1]||[]
      setZones(zList); setActiveZone(zList[0]||null)
      const tMap={}; zList.forEach(z=>{ tMap[z.id]=DEMO_TABLES[z.id]||[] }); setTables(tMap)
    })
    // bookings
    bookingApi.myBookings().then(r=>setBookings(r.data||DEMO_BOOKINGS)).catch(()=>setBookings(DEMO_BOOKINGS))
    // menu
    // menu (backend tra ve theo Danh muc -> Mon an, can flatten cho UI dang phang)
    menuApi.getByBranch(bid).then(r => {
      const categories = r.data || []
      setMenuCategories(categories)
      const flat = categories.flatMap(cat => (cat.items||[]).map(it => ({
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
  },[activeBranch])

  // ── Computed stats ─────────────────────────────────
  const allTables = Object.values(tables).flat()
  const today = new Date().toDateString()
  const todayBookings = bookings.filter(b=>new Date(b.reservationTime).toDateString()===today)
  const stats = {
    totalTables: allTables.length,
    available:   allTables.filter(t=>t.status==='AVAILABLE').length,
    occupied:    allTables.filter(t=>t.status==='OCCUPIED').length,
    reserved:    allTables.filter(t=>t.status==='RESERVED').length,
    fillRate:    allTables.length ? Math.round((allTables.filter(t=>t.status!=='AVAILABLE').length/allTables.length)*100) : 0,
    todayConfirmed: todayBookings.filter(b=>b.status==='CONFIRMED'||b.status==='CHECKED_IN').length,
    totalRevenue: bookings.filter(b=>b.status==='COMPLETED').reduce((s,b)=>s+(b.depositAmount||0),0),
    noShowRate:  bookings.length ? Math.round((bookings.filter(b=>b.status==='NO_SHOW').length/bookings.length)*100) : 0,
  }

  // ── Actions ────────────────────────────────────────
  const updateTableStatus = async (tableId, newStatus) => {
    try { await tableApi.updateStatus(tableId,newStatus) } catch {}
    setTables(prev=>{
      const next={...prev}
      for(const zid of Object.keys(next))
        next[zid]=next[zid].map(t=>t.id===tableId?{...t,status:newStatus}:t)
      return next
    })
    toast.success('Cập nhật trạng thái bàn thành công')
    setSelectedTable(null)
  }

  const doBookingAction = async (id, action) => {
    try {
      if(action==='check-in')  await bookingApi.checkIn(id)
      if(action==='check-out') await bookingApi.checkOut(id)
      if(action==='no-show')   await bookingApi.cancel(id,{reason:'No-show'})
      if(action==='cancel')    await bookingApi.cancel(id,{cancelledByRestaurant:true})
    } catch {}
    setBookings(prev=>prev.map(b=> b.id===id ? {
      ...b, status: action==='check-in'?'CHECKED_IN':action==='check-out'?'COMPLETED':action==='no-show'?'NO_SHOW':'CANCELLED_BY_RESTAURANT'
    } : b))
    toast.success(action==='check-in'?'Check-in thành công!':action==='check-out'?'Check-out & Hoàn tất!':'Đã cập nhật trạng thái')
  }

  const saveMenuItem = async (e) => {
    e.preventDefault()
    if(!menuForm.price||Number(menuForm.price)<=0){toast.error('Giá phải lớn hơn 0');return}
    if(!activeBranch){toast.error('Chưa chọn chi nhánh');return}
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
        status: menuModal==='add' ? 'SELLING' : (menuModal.status || 'SELLING'),
      }

      if (menuModal==='add') {
        const { data: res } = await menuApi.createItem(payload)
        const created = res.data
        setMenu(p=>[...p,{ id:created.id, name:created.itemName, category:menuForm.category,
          price:Number(created.price), status:created.status, description:created.description||'', emoji:menuForm.emoji }])
        toast.success('Đã thêm món!')
      } else {
        const { data: res } = await menuApi.updateItem(menuModal.id, payload)
        const updated = res.data
        setMenu(p=>p.map(m=>m.id===menuModal.id?{ ...m, name:updated.itemName, category:menuForm.category,
          price:Number(updated.price), status:updated.status, description:updated.description||'', emoji:menuForm.emoji }:m))
        toast.success('Đã cập nhật!')
      }
      setMenuModal(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu món ăn')
    }
  }

  const cycleMenuStatus = async (item) => {
    const next={SELLING:'OUT_OF_STOCK',OUT_OF_STOCK:'DISCONTINUED',DISCONTINUED:'SELLING'}[item.status]
    try {
      await menuApi.updateStatus(item.id,next)
      setMenu(p=>p.map(m=>m.id===item.id?{...m,status:next}:m))
      toast.success(`Chuyển sang: ${next==='SELLING'?'Đang bán':next==='OUT_OF_STOCK'?'Hết món':'Ngừng bán'}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái món')
    }
  }

  const saveBranchInfo = async () => {
    if (!activeBranch) return
    if (!branchForm.name.trim() || !branchForm.address.trim()) {
      toast.error('Tên chi nhánh và địa chỉ không được để trống')
      return
    }
    setSavingBranch(true)
    try {
      const { data: res } = await branchApi.update(activeBranch.id, branchForm)
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

  const addTable = async (e) => {
    e.preventDefault()
    if(!activeZone){toast.error('Chưa chọn khu vực');return}
    try { await tableApi.create({...tableForm,zoneId:activeZone.id,capacity:Number(tableForm.capacity)}) } catch {}
    const newT={id:Date.now(),...tableForm,capacity:Number(tableForm.capacity),positionX:50,positionY:50,status:'AVAILABLE'}
    setTables(p=>({...p,[activeZone.id]:[...(p[activeZone.id]||[]),newT]}))
    setAddTableModal(false); setTableForm({tableCode:'',capacity:4})
    toast.success(`Đã thêm bàn ${tableForm.tableCode}`)
  }

  const addZone = (e) => {
    e.preventDefault()
    const newZ={id:Date.now(),...zoneForm,active:true}
    setZones(p=>[...p,newZ])
    setTables(p=>({...p,[newZ.id]:[]}))
    setAddZoneModal(false); setZoneForm({name:'',description:''})
    toast.success(`Đã thêm khu vực ${zoneForm.name}`)
  }

  // ── Styles ─────────────────────────────────────────
  const S = {
    eyebrow: { fontSize:'.7rem',fontWeight:700,letterSpacing:'.22em',textTransform:'uppercase',color:C.gold },
    label:   { fontSize:'.73rem',fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',color:C.brownMid,display:'block',marginBottom:'.4rem' },
    input:   { width:'100%',padding:'.65rem .875rem',border:`1.5px solid ${C.border}`,borderRadius:4,fontFamily:'inherit',fontSize:'.88rem',background:C.cream,color:C.text,outline:'none',transition:'border-color .2s' },
    card:    { background:C.white,borderRadius:4,boxShadow:'0 2px 12px rgba(61,43,31,.08)',padding:'1.5rem' },
    btnGold: { background:C.gold,color:C.brown,border:'none',padding:'.6rem 1.4rem',fontWeight:700,fontSize:'.82rem',letterSpacing:'.08em',textTransform:'uppercase',borderRadius:4,cursor:'pointer',fontFamily:'inherit',transition:'all .2s' },
    btnBrown:{ background:C.brown,color:'#fff',border:'none',padding:'.6rem 1.4rem',fontWeight:600,fontSize:'.82rem',letterSpacing:'.06em',textTransform:'uppercase',borderRadius:4,cursor:'pointer',fontFamily:'inherit',transition:'all .2s' },
    btnOut:  { background:'transparent',color:C.brown,border:`1.5px solid ${C.border}`,padding:'.58rem 1.2rem',fontWeight:500,fontSize:'.82rem',borderRadius:4,cursor:'pointer',fontFamily:'inherit',transition:'all .2s' },
    btnSm:   { padding:'.35rem .875rem',fontSize:'.75rem',fontWeight:600,letterSpacing:'.04em',borderRadius:2,cursor:'pointer',fontFamily:'inherit',border:'none',transition:'all .2s' },
  }

  // ── TABS config ────────────────────────────────────
  const TABS = [
    { id:'dashboard',  icon:'📊', label:'Tổng quan' },
    { id:'bookings',   icon:'📋', label:'Đặt bàn' },
    { id:'tables',     icon:'🪑', label:'Sơ đồ bàn' },
    { id:'menu',       icon:'🍜', label:'Thực đơn' },
    { id:'waitlist',   icon:'⏳', label:'Hàng chờ' },
    { id:'policy',     icon:'💰', label:'Chính sách' },
    { id:'settings',   icon:'⚙️', label:'Cài đặt' },
  ]

  // ── Filtered bookings ──────────────────────────────
  const filteredBookings = bkFilter==='ALL' ? bookings : bookings.filter(b=>b.status===bkFilter)
  const filteredMenu     = menuFilter==='ALL' ? menu : menu.filter(m=>m.category===menuFilter||m.status===menuFilter)

  // ── RENDER ─────────────────────────────────────────
  return (
    <div style={{ display:'flex',minHeight:'100vh',fontFamily:"'Be Vietnam Pro',system-ui,sans-serif",background:C.cream }}>
      <link href={FONT_LINK} rel="stylesheet"/>

      {/* ════════ SIDEBAR ════════ */}
      <aside style={{
        width:240,flexShrink:0,background:C.brown,
        display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh',overflowY:'auto'
      }}>
        {/* Logo */}
        <div style={{ padding:'1.75rem 1.5rem 1.25rem',borderBottom:`1px solid rgba(255,255,255,.08)` }}>
          <div style={{ ...serif,fontSize:'1.45rem',fontWeight:700,color:C.gold,letterSpacing:'.04em',cursor:'pointer' }}
            onClick={()=>navigate('/')}>
            DA<span style={{ fontStyle:'italic',color:'rgba(255,255,255,.45)' }}>bana</span>
          </div>
          <div style={{ fontSize:'.72rem',color:'rgba(255,255,255,.35)',marginTop:'.25rem',letterSpacing:'.08em' }}>
            PORTAL NHÀ HÀNG
          </div>
        </div>

        {/* Branch selector */}
        <div style={{ padding:'1rem 1.25rem',borderBottom:`1px solid rgba(255,255,255,.08)` }}>
          <div style={{ fontSize:'.68rem',fontWeight:600,letterSpacing:'.15em',textTransform:'uppercase',
            color:'rgba(255,255,255,.3)',marginBottom:'.5rem' }}>Chi nhánh</div>
          <select value={activeBranch?.id||''} onChange={e=>{
            const b=branches.find(x=>x.id===Number(e.target.value)); if(b) setActiveBranch(b)
          }} style={{ width:'100%',padding:'.55rem .75rem',borderRadius:4,border:'none',
            background:'rgba(255,255,255,.08)',color:'rgba(255,255,255,.85)',fontSize:'.82rem',fontFamily:'inherit',cursor:'pointer' }}>
            {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {/* Nav links */}
        <nav style={{ padding:'1rem 0',flex:1 }}>
          {TABS.map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{
              display:'flex',alignItems:'center',gap:'.875rem',
              width:'100%',padding:'.75rem 1.5rem',border:'none',cursor:'pointer',fontFamily:'inherit',
              background: activeTab===tab.id ? 'rgba(201,168,76,.15)' : 'transparent',
              color: activeTab===tab.id ? C.goldLight : 'rgba(255,255,255,.5)',
              fontSize:'.85rem',fontWeight: activeTab===tab.id ? 600 : 400,
              borderLeft: activeTab===tab.id ? `3px solid ${C.gold}` : '3px solid transparent',
              transition:'all .15s',textAlign:'left'
            }}>
              <span style={{ fontSize:'1rem' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div style={{ padding:'1.25rem 1.5rem',borderTop:`1px solid rgba(255,255,255,.08)`,
          display:'flex',alignItems:'center',gap:'.75rem' }}>
          <div style={{ width:36,height:36,borderRadius:'50%',background:C.gold,
            display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,
            color:C.brown,fontSize:'.9rem',flexShrink:0 }}>
            {(auth?.fullName||'N')[0]}
          </div>
          <div>
            <div style={{ fontSize:'.82rem',fontWeight:600,color:'rgba(255,255,255,.8)',lineHeight:1.2 }}>{auth?.fullName||'Nhà hàng'}</div>
            <div style={{ fontSize:'.7rem',color:'rgba(255,255,255,.3)' }}>Đối tác</div>
          </div>
        </div>
      </aside>

      {/* ════════ MAIN CONTENT ════════ */}
      <main style={{ flex:1,overflowY:'auto',maxHeight:'100vh' }}>
        {/* Top bar */}
        <div style={{ background:C.white,borderBottom:`1px solid ${C.border}`,
          padding:'1rem 2rem',display:'flex',alignItems:'center',justifyContent:'space-between',
          position:'sticky',top:0,zIndex:50,backdropFilter:'blur(8px)' }}>
          <div>
            <h1 style={{ fontWeight:700,fontSize:'1.1rem',color:C.text }}>
              {TABS.find(t=>t.id===activeTab)?.icon} {TABS.find(t=>t.id===activeTab)?.label}
            </h1>
            <p style={{ fontSize:'.78rem',color:C.muted,marginTop:'.1rem' }}>
              {activeBranch?.name} · {new Date().toLocaleDateString('vi-VN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
            </p>
          </div>
          <div style={{ display:'flex',gap:'.75rem',alignItems:'center' }}>
            {waitlist.some(w=>w.status==='INVITED') && (
              <div style={{ background:C.amberBg,border:`1px solid ${C.amber}44`,borderRadius:4,
                padding:'.4rem .875rem',fontSize:'.78rem',fontWeight:600,color:C.amber }}>
                ⏳ Có lời mời hàng chờ đang chờ phản hồi
              </div>
            )}
            <button onClick={()=>navigate('/')} style={{ ...S.btnOut,padding:'.45rem 1rem',fontSize:'.78rem' }}>
              🌐 Về trang chủ
            </button>
          </div>
        </div>

        <div style={{ padding:'2rem' }}>

          {/* ══════ DASHBOARD ══════ */}
          {activeTab==='dashboard' && (
            <div>
              <div style={{ ...S.eyebrow,marginBottom:'1.5rem' }}>Tổng quan hôm nay</div>

              {/* Stats */}
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'1.25rem',marginBottom:'2rem' }}>
                <StatCard icon="📅" label="Đặt bàn hôm nay" value={stats.todayConfirmed} sub="đang chờ đón khách" color={C.gold} trend={12}/>
                <StatCard icon="🪑" label="Tỷ lệ lấp đầy" value={`${stats.fillRate}%`} sub={`${stats.available}/${stats.totalTables} bàn trống`} color={C.green} trend={5}/>
                <StatCard icon="👥" label="Đang phục vụ" value={stats.occupied} sub="bàn đang có khách" color={C.amber}/>
                <StatCard icon="📋" label="Bàn đã đặt" value={stats.reserved} sub="sắp có khách đến" color={C.blue}/>
                <StatCard icon="⏳" label="Hàng chờ" value={waitlist.filter(w=>w.status==='WAITING').length} sub="đang chờ bàn trống" color={C.purple}/>
                <StatCard icon="❌" label="Tỷ lệ No-show" value={`${stats.noShowRate}%`} sub="trong 30 ngày qua" color={C.red}/>
              </div>

              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem' }}>
                {/* Mini sơ đồ bàn */}
                <div style={S.card}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem' }}>
                    <div style={S.eyebrow}>Trạng thái bàn</div>
                    <button onClick={()=>setActiveTab('tables')} style={{ ...S.btnSm,background:C.goldSubtle,color:C.goldDark,border:`1px solid ${C.goldBorder}` }}>
                      Xem chi tiết →
                    </button>
                  </div>
                  <div style={{ display:'flex',gap:'.75rem',flexWrap:'wrap',marginBottom:'1rem' }}>
                    {Object.entries(TABLE_STATUS).map(([k,{color,bg,label,icon}])=>{
                      const cnt=allTables.filter(t=>t.status===k).length
                      if(!cnt) return null
                      return (
                        <div key={k} style={{ display:'flex',alignItems:'center',gap:'.5rem',
                          background:bg,border:`1px solid ${color}22`,borderRadius:4,padding:'.4rem .75rem' }}>
                          <span style={{ color,fontSize:'.9rem' }}>{icon}</span>
                          <span style={{ fontSize:'.8rem',fontWeight:600,color }}>{cnt}</span>
                          <span style={{ fontSize:'.75rem',color:C.muted }}>{label}</span>
                        </div>
                      )
                    })}
                  </div>
                  {/* Bar chart */}
                  {allTables.length>0 && (
                    <div style={{ height:12,borderRadius:99,overflow:'hidden',display:'flex' }}>
                      {Object.entries(TABLE_STATUS).map(([k,{color}])=>{
                        const w=allTables.length?allTables.filter(t=>t.status===k).length/allTables.length*100:0
                        return w>0 ? <div key={k} style={{ width:`${w}%`,background:color,transition:'width .5s' }}/> : null
                      })}
                    </div>
                  )}
                </div>

                {/* Upcoming bookings */}
                <div style={S.card}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem' }}>
                    <div style={S.eyebrow}>Đặt bàn sắp tới</div>
                    <button onClick={()=>setActiveTab('bookings')} style={{ ...S.btnSm,background:C.goldSubtle,color:C.goldDark,border:`1px solid ${C.goldBorder}` }}>
                      Xem tất cả →
                    </button>
                  </div>
                  {bookings.filter(b=>['CONFIRMED','CHECKED_IN'].includes(b.status)).slice(0,5).map(b=>(
                    <div key={b.id} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',
                      padding:'.6rem 0',borderBottom:`1px solid ${C.creamDark}`,gap:'.5rem' }}>
                      <div style={{ flex:1 }}>
                        <p style={{ fontWeight:600,fontSize:'.87rem',color:C.text }}>{b.contactName}</p>
                        <p style={{ fontSize:'.75rem',color:C.muted }}>
                          Bàn {b.tableCode} · {b.guestCount} khách · {new Date(b.reservationTime).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}
                        </p>
                      </div>
                      <Badge status={b.status} statusMap={BOOKING_STATUS}/>
                    </div>
                  ))}
                  {bookings.filter(b=>['CONFIRMED','CHECKED_IN'].includes(b.status)).length===0 && (
                    <p style={{ color:C.muted,fontSize:'.85rem',textAlign:'center',padding:'1.5rem 0' }}>Không có đặt bàn sắp tới</p>
                  )}
                </div>

                {/* Revenue chart placeholder */}
                <div style={{ ...S.card,gridColumn:'1/-1' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem' }}>
                    <div style={S.eyebrow}>Doanh thu tiền cọc 7 ngày gần nhất</div>
                  </div>
                  <div style={{ display:'flex',alignItems:'flex-end',gap:'.625rem',height:120 }}>
                    {[65,45,80,55,90,70,100].map((h,i)=>(
                      <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'.35rem' }}>
                        <div style={{ width:'100%',background:`linear-gradient(to top,${C.gold},${C.goldLight})`,
                          height:`${h}%`,borderRadius:'4px 4px 0 0',transition:'height .5s',
                          minHeight:4,cursor:'default' }}
                          title={`${(h*5000).toLocaleString('vi-VN')}₫`}/>
                        <span style={{ fontSize:'.65rem',color:C.muted }}>
                          {['T2','T3','T4','T5','T6','T7','CN'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════ BOOKINGS ══════ */}
          {activeTab==='bookings' && (
            <div>
              <div style={{ display:'flex',gap:'.5rem',marginBottom:'1.5rem',flexWrap:'wrap' }}>
                {[['ALL','Tất cả'],['CONFIRMED','Đã xác nhận'],['CHECKED_IN','Đang phục vụ'],
                  ['PENDING_NO_SHOW','Nghi No-show'],['COMPLETED','Hoàn tất'],['CANCELLED_BY_CUSTOMER','Đã huỷ']].map(([k,l])=>(
                  <button key={k} onClick={()=>setBkFilter(k)} style={{
                    ...S.btnSm,
                    background: bkFilter===k ? C.brown : C.white,
                    color:      bkFilter===k ? '#fff' : C.muted,
                    border: `1.5px solid ${bkFilter===k ? C.brown : C.border}`,
                  }}>{l} {k==='ALL'?`(${bookings.length})`:bookings.filter(b=>b.status===k).length>0?`(${bookings.filter(b=>b.status===k).length})`:''}</button>
                ))}
              </div>

              <div style={{ display:'flex',flexDirection:'column',gap:'1rem' }}>
                {filteredBookings.length===0 && (
                  <div style={{ ...S.card,textAlign:'center',padding:'3rem',color:C.muted }}>
                    Không có đặt bàn nào ở trạng thái này
                  </div>
                )}
                {filteredBookings.map(b=>{
                  const meta=BOOKING_STATUS[b.status]||{color:C.muted,bg:'rgba(138,110,87,.1)',label:b.status}
                  return (
                    <div key={b.id} style={{ ...S.card,border:`1px solid ${C.border}` }}>
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'.875rem',flexWrap:'wrap',gap:'.5rem' }}>
                        <div>
                          <div style={{ display:'flex',alignItems:'center',gap:'.75rem',marginBottom:'.3rem' }}>
                            <span style={{ fontWeight:700,fontSize:'.95rem' }}>#{b.id} — {b.contactName}</span>
                            <Badge status={b.status} statusMap={BOOKING_STATUS}/>
                          </div>
                          <p style={{ fontSize:'.8rem',color:C.muted }}>{b.contactPhone}{b.note&&` · 📝 ${b.note}`}</p>
                        </div>
                        <p style={{ fontSize:'.78rem',color:C.muted }}>
                          {new Date(b.reservationTime).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})}
                        </p>
                      </div>
                      <div style={{ display:'flex',gap:'1.5rem',flexWrap:'wrap',fontSize:'.85rem',marginBottom:'1rem' }}>
                        <span>🪑 Bàn: <strong>{b.tableCode}</strong></span>
                        <span>👥 Khách: <strong>{b.guestCount}</strong></span>
                        {b.depositAmount>0 && <span>💰 Cọc: <strong style={{color:C.goldDark}}>{Number(b.depositAmount).toLocaleString('vi-VN')}₫</strong></span>}
                      </div>
                      <div style={{ display:'flex',gap:'.5rem',flexWrap:'wrap' }}>
                        {b.status==='CONFIRMED' && <>
                          <button onClick={()=>doBookingAction(b.id,'check-in')} style={{ ...S.btnSm,background:C.green,color:'#fff' }}>✅ Check-in</button>
                          <button onClick={()=>doBookingAction(b.id,'cancel')}   style={{ ...S.btnSm,background:C.redBg,color:C.red,border:`1px solid ${C.red}33` }}>🚫 Huỷ (NH)</button>
                        </>}
                        {b.status==='CHECKED_IN' && (
                          <button onClick={()=>doBookingAction(b.id,'check-out')} style={{ ...S.btnSm,background:C.brown,color:'#fff' }}>🚪 Check-out</button>
                        )}
                        {b.status==='PENDING_NO_SHOW' && <>
                          <button onClick={()=>doBookingAction(b.id,'check-in')}  style={{ ...S.btnSm,background:C.green,color:'#fff' }}>✅ Khách vừa đến</button>
                          <button onClick={()=>doBookingAction(b.id,'no-show')}   style={{ ...S.btnSm,background:C.red,color:'#fff' }}>❌ Chốt No-show</button>
                        </>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ══════ TABLES / SƠ ĐỒ BÀN ══════ */}
          {activeTab==='tables' && (
            <div>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem',flexWrap:'wrap',gap:'1rem' }}>
                <div style={{ display:'flex',gap:'.5rem',flexWrap:'wrap' }}>
                  {zones.map(z=>(
                    <button key={z.id} onClick={()=>setActiveZone(z)} style={{
                      ...S.btnSm,
                      background: activeZone?.id===z.id ? C.brown : C.white,
                      color: activeZone?.id===z.id ? '#fff' : C.muted,
                      border:`1.5px solid ${activeZone?.id===z.id ? C.brown : C.border}`,
                    }}>{z.name}</button>
                  ))}
                  <button onClick={()=>setAddZoneModal(true)} style={{ ...S.btnSm,background:C.goldSubtle,color:C.goldDark,border:`1px solid ${C.goldBorder}` }}>
                    + Thêm khu vực
                  </button>
                </div>
                <button onClick={()=>setAddTableModal(true)} style={S.btnGold}>+ Thêm bàn</button>
              </div>

              {/* Canvas sơ đồ */}
              <div style={{ ...S.card,marginBottom:'1.25rem' }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem' }}>
                  <div>
                    <div style={S.eyebrow}>{activeZone?.name} — Sơ đồ bàn</div>
                    <p style={{ fontSize:'.75rem',color:C.muted,marginTop:'.15rem' }}>
                      Click vào bàn để xem & đổi trạng thái · Kéo thả để di chuyển vị trí
                    </p>
                  </div>
                  <div style={{ display:'flex',gap:'.5rem',fontSize:'.78rem',color:C.muted }}>
                    {activeZone && (tables[activeZone.id]||[]).length} bàn
                  </div>
                </div>
                <div style={{ position:'relative',width:'100%',paddingBottom:'45%',
                  background:`linear-gradient(145deg,#faf7f0,#f5efe3)`,
                  border:`2px dashed ${C.border}`,borderRadius:4,overflow:'hidden',minHeight:280 }}>
                  {/* Grid lines */}
                  {[25,50,75].map(p=>(
                    <div key={p}>
                      <div style={{ position:'absolute',left:`${p}%`,top:0,bottom:0,width:1,background:`${C.border}55` }}/>
                      <div style={{ position:'absolute',top:`${p}%`,left:0,right:0,height:1,background:`${C.border}55` }}/>
                    </div>
                  ))}
                  {/* Entry label */}
                  <div style={{ position:'absolute',bottom:8,left:'50%',transform:'translateX(-50%)',
                    fontSize:'.65rem',color:C.muted,letterSpacing:'.1em',textTransform:'uppercase',
                    background:`${C.goldSubtle}`,padding:'.2rem .75rem',borderRadius:99,border:`1px solid ${C.goldBorder}` }}>
                    ↑ CỬA VÀO
                  </div>
                  {(activeZone ? (tables[activeZone.id]||[]) : []).map(t=>{
                    const meta=TABLE_STATUS[t.status]||TABLE_STATUS.AVAILABLE
                    const isSel=selectedTable?.id===t.id
                    const sz=t.capacity>6?96:t.capacity>4?84:74
                    return (
                      <div key={t.id} onClick={()=>setSelectedTable(isSel?null:t)} style={{
                        position:'absolute',
                        left:`${t.positionX}%`,top:`${t.positionY}%`,
                        transform:'translate(-50%,-50%)',
                        width:sz,height:sz-10,
                        background: isSel ? C.gold : meta.bg,
                        border:`2px solid ${isSel ? C.goldDark : meta.color}`,
                        borderRadius:6,cursor:'pointer',
                        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:1,
                        boxShadow: isSel ? `0 4px 20px ${C.gold}44` : 'none',
                        transition:'all .2s',
                        opacity:1
                      }}>
                        <span style={{ fontSize:'.82rem',fontWeight:800,color:isSel?C.brown:meta.color }}>{t.tableCode}</span>
                        <span style={{ fontSize:'.62rem',fontWeight:700,color:isSel?'rgba(61,43,31,.8)':meta.color }}>{meta.icon}</span>
                        <span style={{ fontSize:'.6rem',color:isSel?'rgba(61,43,31,.6)':C.muted }}>👥{t.capacity}</span>
                      </div>
                    )
                  })}
                </div>
                {/* Legend */}
                <div style={{ display:'flex',gap:'1.25rem',flexWrap:'wrap',marginTop:'1rem' }}>
                  {Object.entries(TABLE_STATUS).map(([k,{color,label,icon}])=>(
                    <div key={k} style={{ display:'flex',alignItems:'center',gap:'.35rem',fontSize:'.73rem',color:C.muted }}>
                      <div style={{ width:10,height:10,borderRadius:2,background:color }}/>
                      {icon} {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected table action panel */}
              {selectedTable && (
                <div style={{ ...S.card,background:`linear-gradient(135deg,${C.cream},${C.creamDark})`,
                  border:`1px solid ${C.goldBorder}`,marginBottom:'1.25rem' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem' }}>
                    <div>
                      <div style={{ ...S.eyebrow,marginBottom:'.25rem' }}>Bàn {selectedTable.tableCode} đang được chọn</div>
                      <p style={{ fontSize:'.85rem',color:C.muted }}>
                        Khu vực {activeZone?.name} · Sức chứa {selectedTable.capacity} khách ·
                        <span style={{ color:TABLE_STATUS[selectedTable.status]?.color,fontWeight:700 }}> {TABLE_STATUS[selectedTable.status]?.label}</span>
                      </p>
                    </div>
                    <div style={{ display:'flex',gap:'.5rem',flexWrap:'wrap' }}>
                      {Object.entries(TABLE_STATUS).filter(([k])=>k!==selectedTable.status&&k!=='MAINTENANCE').map(([k,{color,label}])=>(
                        <button key={k} onClick={()=>updateTableStatus(selectedTable.id,k)}
                          style={{ ...S.btnSm,background:`${color}18`,color,border:`1px solid ${color}33` }}>
                          {TABLE_STATUS[k].icon} {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Table list */}
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'.75rem' }}>
                {(activeZone ? (tables[activeZone.id]||[]) : []).map(t=>{
                  const meta=TABLE_STATUS[t.status]||TABLE_STATUS.AVAILABLE
                  return (
                    <div key={t.id} onClick={()=>setSelectedTable(selectedTable?.id===t.id?null:t)}
                      style={{ background:selectedTable?.id===t.id?C.gold:C.white,
                        border:`1.5px solid ${selectedTable?.id===t.id?C.goldDark:meta.color+'44'}`,
                        borderRadius:4,padding:'1rem',cursor:'pointer',transition:'all .2s' }}>
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.4rem' }}>
                        <span style={{ fontWeight:800,color:selectedTable?.id===t.id?C.brown:C.text }}>{t.tableCode}</span>
                        <div style={{ width:10,height:10,borderRadius:'50%',background:meta.color }}/>
                      </div>
                      <p style={{ fontSize:'.73rem',color:selectedTable?.id===t.id?'rgba(61,43,31,.7)':meta.color,fontWeight:600 }}>{meta.label}</p>
                      <p style={{ fontSize:'.7rem',color:selectedTable?.id===t.id?'rgba(61,43,31,.5)':C.muted,marginTop:'.2rem' }}>👥 {t.capacity} khách</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ══════ MENU ══════ */}
          {activeTab==='menu' && (
            <div>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem',flexWrap:'wrap',gap:'1rem' }}>
                <div style={{ display:'flex',gap:'.5rem',flexWrap:'wrap' }}>
                  {['ALL',...CATEGORIES,'SELLING','OUT_OF_STOCK','DISCONTINUED'].slice(0,8).map(f=>(
                    <button key={f} onClick={()=>setMenuFilter(f)} style={{
                      ...S.btnSm,
                      background:menuFilter===f?C.brown:C.white,
                      color:menuFilter===f?'#fff':C.muted,
                      border:`1.5px solid ${menuFilter===f?C.brown:C.border}`,
                    }}>
                      {f==='ALL'?'Tất cả':f==='SELLING'?'Đang bán':f==='OUT_OF_STOCK'?'Hết món':f==='DISCONTINUED'?'Ngừng bán':f}
                    </button>
                  ))}
                </div>
                <button onClick={()=>{setMenuForm({name:'',category:'Món chính',price:'',emoji:'🍽️',description:''});setMenuModal('add')}}
                  style={S.btnGold}>+ Thêm món</button>
              </div>

              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem' }}>
                {filteredMenu.map(item=>(
                  <div key={item.id} style={{ ...S.card,border:`1px solid ${C.border}`,transition:'box-shadow .2s' }}
                    onMouseEnter={e=>e.currentTarget.style.boxShadow='0 6px 20px rgba(61,43,31,.12)'}
                    onMouseLeave={e=>e.currentTarget.style.boxShadow='0 2px 12px rgba(61,43,31,.08)'}>
                    <div style={{ display:'flex',gap:'1rem' }}>
                      <div style={{ width:60,height:60,borderRadius:4,background:C.creamDark,
                        display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.6rem',flexShrink:0 }}>
                        {item.emoji||'🍽️'}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'.25rem' }}>
                          <h3 style={{ fontWeight:700,fontSize:'.9rem',color:C.text }}>{item.name}</h3>
                          <span style={{
                            fontSize:'.65rem',fontWeight:700,padding:'.15rem .5rem',borderRadius:99,
                            background: item.status==='SELLING'?C.greenBg:item.status==='OUT_OF_STOCK'?C.amberBg:C.redBg,
                            color: item.status==='SELLING'?C.green:item.status==='OUT_OF_STOCK'?C.amber:C.red,
                          }}>{item.status==='SELLING'?'Đang bán':item.status==='OUT_OF_STOCK'?'Hết món':'Ngừng bán'}</span>
                        </div>
                        <p style={{ fontSize:'.73rem',color:C.muted,marginBottom:'.4rem' }}>{item.category}</p>
                        <p style={{ color:C.goldDark,fontWeight:700,fontSize:'.92rem' }}>{Number(item.price).toLocaleString('vi-VN')}₫</p>
                      </div>
                    </div>
                    <div style={{ display:'flex',gap:'.5rem',marginTop:'1rem',paddingTop:'.875rem',borderTop:`1px solid ${C.creamDark}` }}>
                      <button onClick={()=>{setMenuForm({name:item.name,category:item.category,price:String(item.price),emoji:item.emoji||'🍽️',description:item.description||''});setMenuModal(item)}}
                        style={{ ...S.btnSm,background:C.cream,color:C.brown,border:`1px solid ${C.border}`,flex:1 }}>✏️ Sửa</button>
                      <button onClick={()=>cycleMenuStatus(item)}
                        style={{ ...S.btnSm,background:C.goldSubtle,color:C.goldDark,border:`1px solid ${C.goldBorder}`,flex:1 }}>🔄 Đổi trạng thái</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════ WAITLIST ══════ */}
          {activeTab==='waitlist' && (
            <div>
              <div style={{ ...S.card,marginBottom:'1.25rem',background:`linear-gradient(135deg,${C.brown},${C.brownMid})` }}>
                <div style={{ display:'flex',gap:'2rem',flexWrap:'wrap' }}>
                  {[
                    { label:'Đang chờ', value:waitlist.filter(w=>w.status==='WAITING').length, color:C.goldLight },
                    { label:'Đã mời',   value:waitlist.filter(w=>w.status==='INVITED').length, color:C.amber },
                    { label:'Đã chuyển',value:waitlist.filter(w=>w.status==='CONVERTED').length, color:C.green },
                  ].map(({label,value,color})=>(
                    <div key={label} style={{ textAlign:'center' }}>
                      <div style={{ ...serif,fontSize:'2rem',fontWeight:700,color,lineHeight:1 }}>{value}</div>
                      <div style={{ fontSize:'.75rem',color:'rgba(255,255,255,.5)',marginTop:'.25rem',letterSpacing:'.08em' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex',flexDirection:'column',gap:'1rem' }}>
                {waitlist.length===0 && (
                  <div style={{ ...S.card,textAlign:'center',padding:'3rem',color:C.muted }}>
                    Không có khách hàng nào trong hàng chờ
                  </div>
                )}
                {waitlist.map((w,i)=>(
                  <div key={w.id} style={{ ...S.card,border:`1.5px solid ${w.status==='INVITED'?C.amber+'55':C.border}` }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'1rem' }}>
                      <div>
                        <div style={{ display:'flex',alignItems:'center',gap:'.75rem',marginBottom:'.3rem' }}>
                          <span style={{ fontWeight:700 }}>#{i+1} — {w.customer?.fullName}</span>
                          <span style={{
                            fontSize:'.7rem',fontWeight:700,padding:'.2rem .6rem',borderRadius:99,
                            background: w.status==='WAITING'?C.blueBg:w.status==='INVITED'?C.amberBg:C.greenBg,
                            color: w.status==='WAITING'?C.blue:w.status==='INVITED'?C.amber:C.green,
                          }}>{w.status==='WAITING'?'Đang chờ':w.status==='INVITED'?'Đã mời':'Đã chuyển'}</span>
                        </div>
                        <p style={{ fontSize:'.82rem',color:C.muted }}>
                          👥 {w.guestCount} khách · ⏰ Giờ mong muốn: {new Date(w.desiredTime).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}
                        </p>
                        <p style={{ fontSize:'.75rem',color:C.muted,marginTop:'.2rem' }}>
                          Đăng ký lúc {new Date(w.createdAt).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}
                        </p>
                      </div>
                      {w.status==='INVITED' && w.inviteExpiresAt && (
                        <div style={{ background:C.amberBg,border:`1px solid ${C.amber}33`,borderRadius:4,
                          padding:'.6rem 1rem',textAlign:'center' }}>
                          <div style={{ fontSize:'.7rem',color:C.muted,marginBottom:'.2rem' }}>Hạn phản hồi</div>
                          <WaitCountdown expiresAt={w.inviteExpiresAt}/>
                        </div>
                      )}
                    </div>
                    {w.status==='WAITING' && (
                      <div style={{ marginTop:'.875rem',paddingTop:'.875rem',borderTop:`1px solid ${C.creamDark}` }}>
                        <button onClick={()=>{
                          setWaitlist(p=>p.map(x=>x.id===w.id?{...x,status:'INVITED',inviteExpiresAt:new Date(Date.now()+10*60*1000).toISOString()}:x))
                          toast.success('Đã gửi lời mời đến khách hàng!')
                        }} style={{ ...S.btnSm,background:C.gold,color:C.brown }}>📨 Gửi lời mời</button>
                        <button onClick={()=>{setWaitlist(p=>p.filter(x=>x.id!==w.id));toast.success('Đã xoá khỏi hàng chờ')}}
                          style={{ ...S.btnSm,background:C.redBg,color:C.red,border:`1px solid ${C.red}22`,marginLeft:'.5rem' }}>
                          ✕ Xoá
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════ POLICY ══════ */}
          {activeTab==='policy' && (
            <div style={{ maxWidth:700 }}>
              <div style={{ ...S.card,marginBottom:'1.5rem' }}>
                <div style={{ ...S.eyebrow,marginBottom:'1.25rem' }}>Chính sách đặt cọc & huỷ bàn</div>
                <form onSubmit={e=>{e.preventDefault();toast.success('Đã lưu chính sách!');setPolicyModal(false)}}
                  style={{ display:'flex',flexDirection:'column',gap:'1.25rem' }}>
                  {/* Deposit required */}
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
                    padding:'1rem',background:C.cream,borderRadius:4,border:`1px solid ${C.border}` }}>
                    <div>
                      <p style={{ fontWeight:600,color:C.text,marginBottom:'.2rem' }}>Yêu cầu đặt cọc</p>
                      <p style={{ fontSize:'.8rem',color:C.muted }}>Bật/tắt yêu cầu khách đặt cọc trước khi xác nhận bàn</p>
                    </div>
                    <button type="button" onClick={()=>setPolicy(p=>({...p,depositRequired:!p.depositRequired}))}
                      style={{ width:52,height:28,borderRadius:99,border:'none',cursor:'pointer',transition:'background .2s',
                        background:policy.depositRequired?C.green:'rgba(0,0,0,.15)',position:'relative' }}>
                      <div style={{ width:22,height:22,borderRadius:'50%',background:'#fff',position:'absolute',
                        top:3,left:policy.depositRequired?27:3,transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,.2)' }}/>
                    </button>
                  </div>

                  {policy.depositRequired && (
                    <>
                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem' }}>
                        <div>
                          <label style={S.label}>Loại đặt cọc</label>
                          <select value={policy.depositType} onChange={e=>setPolicy(p=>({...p,depositType:e.target.value}))} style={S.input}>
                            <option value="FIXED_AMOUNT">Số tiền cố định</option>
                            <option value="PERCENTAGE">Tỷ lệ phần trăm (%)</option>
                          </select>
                        </div>
                        <div>
                          <label style={S.label}>{policy.depositType==='FIXED_AMOUNT'?'Số tiền (₫)':'Tỷ lệ (%)'}</label>
                          <input style={S.input} type="number" min="0" max={policy.depositType==='PERCENTAGE'?100:undefined}
                            value={policy.depositValue} onChange={e=>setPolicy(p=>({...p,depositValue:e.target.value}))}/>
                        </div>
                        <div>
                          <label style={S.label}>Miễn phí huỷ trước (giờ)</label>
                          <input style={S.input} type="number" min="0" value={policy.freeCancellationHours}
                            onChange={e=>setPolicy(p=>({...p,freeCancellationHours:Number(e.target.value)}))}/>
                        </div>
                        <div>
                          <label style={S.label}>Phạt huỷ muộn (%)</label>
                          <input style={S.input} type="number" min="0" max="100" value={policy.lateCancellationPenaltyPercent}
                            onChange={e=>setPolicy(p=>({...p,lateCancellationPenaltyPercent:Number(e.target.value)}))}/>
                        </div>
                        <div>
                          <label style={S.label}>Phạt No-show (%)</label>
                          <input style={S.input} type="number" min="0" max="100" value={policy.noShowPenaltyPercent}
                            onChange={e=>setPolicy(p=>({...p,noShowPenaltyPercent:Number(e.target.value)}))}/>
                        </div>
                      </div>
                    </>
                  )}

                  <GoldDivider/>

                  {/* Preview */}
                  <div style={{ background:C.cream,borderRadius:4,padding:'1.25rem',border:`1px solid ${C.goldBorder}` }}>
                    <div style={{ ...S.eyebrow,marginBottom:'.875rem' }}>Xem trước hiển thị với khách hàng</div>
                    <p style={{ fontSize:'.87rem',color:C.muted,lineHeight:1.75 }}>
                      {policy.depositRequired
                        ? `Nhà hàng yêu cầu đặt cọc ${policy.depositType==='FIXED_AMOUNT'?`${Number(policy.depositValue).toLocaleString('vi-VN')}₫`:policy.depositValue+'%'}. Bạn có thể huỷ miễn phí trước ${policy.freeCancellationHours} giờ so với giờ hẹn. Huỷ muộn giữ ${policy.lateCancellationPenaltyPercent}% tiền cọc. No-show mất ${policy.noShowPenaltyPercent}% tiền cọc.`
                        : 'Nhà hàng không yêu cầu đặt cọc. Đặt bàn được xác nhận ngay.'
                      }
                    </p>
                  </div>

                  <button type="submit" style={{ ...S.btnGold,alignSelf:'flex-end',padding:'.75rem 2rem' }}>
                    ✦ Lưu chính sách
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ══════ SETTINGS ══════ */}
          {activeTab==='settings' && (
            <div style={{ maxWidth:700 }}>
              <div style={{ ...S.card,marginBottom:'1.25rem' }}>
                <div style={{ ...S.eyebrow,marginBottom:'1.25rem' }}>Thông tin chi nhánh</div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem' }}>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={S.label}>Tên chi nhánh</label>
                    <input style={S.input} value={branchForm.name}
                      onChange={e=>setBranchForm(p=>({...p,name:e.target.value}))}/>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={S.label}>Địa chỉ</label>
                    <input style={S.input} value={branchForm.address}
                      onChange={e=>setBranchForm(p=>({...p,address:e.target.value}))}/>
                  </div>
                  <div>
                    <label style={S.label}>Tỉnh/Thành phố</label>
                    <input style={S.input} value={branchForm.province}
                      onChange={e=>setBranchForm(p=>({...p,province:e.target.value}))}/>
                  </div>
                  <div>
                    <label style={S.label}>Số điện thoại</label>
                    <input style={S.input} value={branchForm.phone}
                      onChange={e=>setBranchForm(p=>({...p,phone:e.target.value}))}/>
                  </div>
                </div>
                <button onClick={saveBranchInfo} disabled={savingBranch}
                  style={{ ...S.btnGold,marginTop:'1.25rem' }}>
                  {savingBranch ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>

              <div style={{ ...S.card,marginBottom:'1.25rem' }}>
                <div style={{ ...S.eyebrow,marginBottom:'1.25rem' }}>Trạng thái hoạt động</div>
                {[
                  { label:'Nhận đặt bàn trực tuyến', sub:'Cho phép khách đặt bàn qua Dabana', key:'acceptBooking' },
                  { label:'Hiện trên kết quả tìm kiếm', sub:'Chi nhánh xuất hiện khi khách tìm kiếm', key:'visible' },
                  { label:'Hàng chờ tự động', sub:'Tự động mời khách trong hàng chờ khi có bàn trống', key:'autoWaitlist' },
                ].map(({ label,sub,key })=>(
                  <div key={key} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',
                    padding:'.875rem 0',borderBottom:`1px solid ${C.creamDark}`,gap:'1rem' }}>
                    <div>
                      <p style={{ fontWeight:600,fontSize:'.88rem' }}>{label}</p>
                      <p style={{ fontSize:'.78rem',color:C.muted }}>{sub}</p>
                    </div>
                    <div style={{ width:44,height:24,borderRadius:99,background:C.green,position:'relative',cursor:'pointer',flexShrink:0 }}>
                      <div style={{ width:18,height:18,borderRadius:'50%',background:'#fff',
                        position:'absolute',top:3,left:23,boxShadow:'0 1px 4px rgba(0,0,0,.2)' }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ════════ MODALS ════════ */}

      {/* Add/Edit Menu Modal */}
      {menuModal!==null && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:200,
          display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem' }}>
          <div style={{ background:C.white,borderRadius:4,width:'100%',maxWidth:460,overflow:'hidden' }}>
            <div style={{ background:`linear-gradient(135deg,${C.brown},${C.brownMid})`,padding:'1.25rem 1.5rem' }}>
              <h2 style={{ ...serif,fontWeight:700,color:'#fff',fontSize:'1.25rem' }}>
                {menuModal==='add'?'Thêm món mới':'Chỉnh sửa món ăn'}
              </h2>
            </div>
            <form onSubmit={saveMenuItem} style={{ padding:'1.5rem',display:'flex',flexDirection:'column',gap:'1rem' }}>
              <div style={{ display:'grid',gridTemplateColumns:'60px 1fr',gap:'1rem',alignItems:'end' }}>
                <div>
                  <label style={S.label}>Emoji</label>
                  <input style={{ ...S.input,textAlign:'center',fontSize:'1.5rem',padding:'.45rem' }}
                    value={menuForm.emoji} onChange={e=>setMenuForm(p=>({...p,emoji:e.target.value}))} maxLength={2}/>
                </div>
                <div>
                  <label style={S.label}>Tên món *</label>
                  <input style={S.input} value={menuForm.name} onChange={e=>setMenuForm(p=>({...p,name:e.target.value}))} required/>
                </div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem' }}>
                <div>
                  <label style={S.label}>Danh mục</label>
                  <select style={S.input} value={menuForm.category} onChange={e=>setMenuForm(p=>({...p,category:e.target.value}))}>
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Giá (₫) *</label>
                  <input style={S.input} type="number" min="1000" step="1000"
                    value={menuForm.price} onChange={e=>setMenuForm(p=>({...p,price:e.target.value}))} required/>
                </div>
              </div>
              <div>
                <label style={S.label}>Mô tả (tùy chọn)</label>
                <textarea style={{ ...S.input,resize:'vertical' }} rows={2}
                  value={menuForm.description} onChange={e=>setMenuForm(p=>({...p,description:e.target.value}))}/>
              </div>
              <div style={{ display:'flex',gap:'.75rem',justifyContent:'flex-end' }}>
                <button type="button" onClick={()=>setMenuModal(null)} style={S.btnOut}>Huỷ</button>
                <button type="submit" style={S.btnGold}>✦ Lưu món</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {addTableModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:200,
          display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem' }}>
          <div style={{ background:C.white,borderRadius:4,width:'100%',maxWidth:400,overflow:'hidden' }}>
            <div style={{ background:`linear-gradient(135deg,${C.brown},${C.brownMid})`,padding:'1.25rem 1.5rem' }}>
              <h2 style={{ ...serif,fontWeight:700,color:'#fff',fontSize:'1.25rem' }}>Thêm bàn mới</h2>
            </div>
            <form onSubmit={addTable} style={{ padding:'1.5rem',display:'flex',flexDirection:'column',gap:'1rem' }}>
              <div>
                <label style={S.label}>Khu vực</label>
                <select style={S.input} value={activeZone?.id||''} onChange={e=>setActiveZone(zones.find(z=>z.id===Number(e.target.value)))}>
                  {zones.map(z=><option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem' }}>
                <div>
                  <label style={S.label}>Mã bàn *</label>
                  <input style={S.input} value={tableForm.tableCode}
                    onChange={e=>setTableForm(p=>({...p,tableCode:e.target.value}))} placeholder="VD: A1, VIP-01" required/>
                </div>
                <div>
                  <label style={S.label}>Sức chứa</label>
                  <input style={S.input} type="number" min="1" max="30" value={tableForm.capacity}
                    onChange={e=>setTableForm(p=>({...p,capacity:e.target.value}))}/>
                </div>
              </div>
              <div style={{ display:'flex',gap:'.75rem',justifyContent:'flex-end' }}>
                <button type="button" onClick={()=>setAddTableModal(false)} style={S.btnOut}>Huỷ</button>
                <button type="submit" style={S.btnGold}>+ Thêm bàn</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Zone Modal */}
      {addZoneModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:200,
          display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem' }}>
          <div style={{ background:C.white,borderRadius:4,width:'100%',maxWidth:400,overflow:'hidden' }}>
            <div style={{ background:`linear-gradient(135deg,${C.brown},${C.brownMid})`,padding:'1.25rem 1.5rem' }}>
              <h2 style={{ ...serif,fontWeight:700,color:'#fff',fontSize:'1.25rem' }}>Thêm khu vực mới</h2>
            </div>
            <form onSubmit={addZone} style={{ padding:'1.5rem',display:'flex',flexDirection:'column',gap:'1rem' }}>
              <div>
                <label style={S.label}>Tên khu vực *</label>
                <input style={S.input} value={zoneForm.name}
                  onChange={e=>setZoneForm(p=>({...p,name:e.target.value}))}
                  placeholder="VD: Trong nhà, Sân vườn, Phòng VIP..." required/>
              </div>
              <div>
                <label style={S.label}>Mô tả</label>
                <input style={S.input} value={zoneForm.description}
                  onChange={e=>setZoneForm(p=>({...p,description:e.target.value}))}
                  placeholder="Mô tả ngắn về khu vực..."/>
              </div>
              <div style={{ display:'flex',gap:'.75rem',justifyContent:'flex-end' }}>
                <button type="button" onClick={()=>setAddZoneModal(false)} style={S.btnOut}>Huỷ</button>
                <button type="submit" style={S.btnGold}>+ Thêm khu vực</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
