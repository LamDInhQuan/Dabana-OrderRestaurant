import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { restaurantApi, branchApi, authApi, bookingApi } from '../../api'
import GuestBookingLookup from './component/GuestBookingLookup'
import {
  Utensils, Flag, Fish, Beef, Shell, Soup, Map, Bell, Shield, Star, MapPin,
  X, Phone, Mail, Globe, Building2, Sparkles, Search, Lamp, PartyPopper,
} from 'lucide-react'
import BookingForm from './BookingForm'
import RestaurantSearchFilter from './component/RestaurantSearchFilter'


const CARD_GRADIENTS = [
  ['#6b4226', '#3d2b1f'], ['#1a5276', '#0d2137'], ['#1e8449', '#0b3d25'],
  ['#7d3c98', '#3d1a4d'], ['#c0392b', '#6e1b18'], ['#d68910', '#7d5109'],
]

const STATS = [
  { num: 248, suffix: '+', label: 'Nhà hàng đối tác' },
  { num: 15420, suffix: '+', label: 'Bàn được đặt' },
  { num: 92000, suffix: '+', label: 'Thực khách hài lòng' },
  { num: 12, suffix: '', label: 'Thành phố phủ sóng' },
]

const EXPERIENCE = [
  { icon: Map, title: 'Sơ đồ bàn trực quan', desc: 'Chọn đúng vị trí bạn muốn — trong nhà, ngoài trời, phòng VIP — ngay trên bản đồ chi nhánh.' },
  { icon: Soup, title: 'Đặt món trước khi đến', desc: 'Tiết kiệm thời gian chờ, nhà hàng chuẩn bị sẵn phần ăn theo ý bạn.' },
  { icon: Bell, title: 'Nhắc lịch tự động', desc: 'SMS và thông báo nhắc trước 30 phút — không bỏ lỡ buổi hẹn nào.' },
  { icon: Shield, title: 'Đặt cọc an toàn', desc: 'Hoàn tiền minh bạch theo chính sách từng nhà hàng. Mọi giao dịch đều được mã hóa.' },
]

// ─── Hooks (giữ nguyên) ────────────────────────────────────────
function useCounter(target, active) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    let cur = 0
    const step = target / 80
    const t = setInterval(() => {
      cur = Math.min(cur + step, target)
      setVal(Math.floor(cur))
      if (cur >= target) clearInterval(t)
    }, 16)
    return () => clearInterval(t)
  }, [active, target])
  return val
}

function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

// ─── StatItem (giữ nguyên) ─────────────────────────────────────
function StatItem({ num, suffix, label }) {
  const [ref, active] = useReveal()
  const val = useCounter(num, active)
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: "'Cormorant Garamond',Georgia,serif",
        fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 700,
        color: 'var(--gold-light)', lineHeight: 1
      }}>{val.toLocaleString('vi-VN')}{suffix}</div>
      <div style={{
        fontSize: '.75rem', fontWeight: 500, color: 'rgba(255,255,255,.5)',
        letterSpacing: '.1em', textTransform: 'uppercase', marginTop: '.4rem'
      }}>{label}</div>
    </div>
  )
}

// ─── RestaurantCard (giữ nguyên) — hiển thị theo brand ───────────────
function RestaurantCard({ restaurant, index, onClick }) {
  const [hovered, setHovered] = useState(false)
  const [ref, visible] = useReveal()
  const [g0, g1] = CARD_GRADIENTS[index % CARD_GRADIENTS.length]

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--white)', borderRadius: 4, overflow: 'hidden',
        boxShadow: hovered ? 'var(--shadow)' : 'var(--shadow-sm)',
        transform: hovered ? 'translateY(-6px)' : 'none',
        transition: 'all .3s', cursor: 'pointer',
        opacity: visible ? 1 : 0,
        transitionDelay: `${(index % 3) * .08}s`,
      }}
    >
      <div style={{ height: 200, position: 'relative', overflow: 'hidden' }}>
        {restaurant.logoUrl ? (
          <img
            src={restaurant.logoUrl}
            alt={restaurant.restaurantName}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform .4s',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(135deg,${g0},${g1})`,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'var(--gold-light)',
          }}><Utensils size={56} /></div>
        )}

        {restaurant.branchCount > 0 && (
          <div style={{
            position: 'absolute', top: '1rem', left: '1rem',
            background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)',
            color: 'var(--gold-light)', fontSize: '.7rem', fontWeight: 700,
            padding: '.3rem .75rem', letterSpacing: '.06em',
            borderRadius: 2, border: '1px solid rgba(201,168,76,.3)',
          }}>
            {restaurant.branchCount} chi nhánh
          </div>
        )}

        {restaurant.rating && (
          <div style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'rgba(0,0,0,.6)', color: 'var(--gold-light)',
            fontSize: '.8rem', fontWeight: 600, padding: '.3rem .6rem',
            borderRadius: 2, display: 'flex', alignItems: 'center', gap: '.3rem',
          }}><Star size={14} fill="currentColor" /> {restaurant.rating}</div>
        )}
      </div>

      <div style={{ padding: '1.2rem 1.375rem 1.4rem' }}>
        <div style={{
          fontSize: '.7rem', fontWeight: 600, letterSpacing: '.15em',
          textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '.35rem',
        }}>
          {restaurant.cuisineType || 'Ẩm thực'}
        </div>
        <h3 style={{
          fontFamily: "'Cormorant Garamond',Georgia,serif",
          fontSize: '1.3rem', fontWeight: 700, color: 'var(--brown)',
          marginBottom: '.45rem', lineHeight: 1.25,
        }}>{restaurant.restaurantName}</h3>
        {restaurant.description && (
          <p style={{
            fontSize: '.8rem', color: 'var(--muted)', lineHeight: 1.6,
            marginBottom: '1rem',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{restaurant.description}</p>
        )}
        <button style={{
          width: '100%',
          background: hovered ? 'var(--gold)' : 'var(--cream-dark)',
          color: hovered ? 'var(--white)' : 'var(--brown)',
          border: 'none', padding: '.7rem', fontSize: '.82rem', fontWeight: 600,
          letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer',
          borderRadius: 2, transition: 'all .2s', fontFamily: 'inherit',
        }}>Xem Chi Nhánh →</button>
      </div>
    </div>
  )
}

// ─── BranchCard (LÀM LẠI) — layout ngang, gọn, nhiều info hơn ─────
function BranchCard({ branch, index, onClick }) {
  const [hovered, setHovered] = useState(false)
  const coverImage =
    branch.branchImageDtos?.find(img => img.isCover === 1)?.imageUrl ||
    branch.branchImageDtos?.[0]?.imageUrl

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', gap: '.9rem',
        background: '#fff', borderRadius: 8,
        border: '1px solid var(--border)',
        boxShadow: hovered ? '0 6px 18px rgba(46,42,37,.1)' : 'none',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'all .2s', cursor: 'pointer', padding: '.7rem',
      }}
    >
      {/* Ảnh nhỏ, vuông, không chiếm hết chiều rộng card */}
      <div style={{
        width: 86, height: 86, borderRadius: 6, overflow: 'hidden',
        flexShrink: 0, position: 'relative', background: 'var(--cream-dark)',
      }}>
        {coverImage ? (
          <img src={coverImage} alt={branch.name} style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform .3s',
          }} />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--gold)',
          }}><Utensils size={26} /></div>
        )}
      </div>

      {/* Thông tin: tên + rating cùng hàng, địa chỉ 2 dòng, link đặt bàn nhỏ gọn */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '.3rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '.5rem' }}>
          <h4 style={{
            fontFamily: "'Cormorant Garamond',Georgia,serif",
            fontSize: '1.05rem', fontWeight: 700, color: 'var(--brown)',
            margin: 0, lineHeight: 1.25,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{branch.name}</h4>
          {branch.rating && (
            <span style={{
              fontSize: '.74rem', fontWeight: 700, color: '#B8903D',
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: '.2rem',
            }}><Star size={12} fill="currentColor" /> {branch.rating}</span>
          )}
        </div>

        <p style={{
          fontSize: '.78rem', color: 'var(--muted)', margin: 0, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          <MapPin size={13} style={{ verticalAlign: '-2px' }} /> {branch.address}{branch.province ? `, ${branch.province}` : ''}
        </p>

        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '.3rem',
          marginTop: '.1rem', color: 'var(--gold)',
          fontSize: '.78rem', fontWeight: 700, letterSpacing: '.03em',
          textTransform: 'uppercase',
        }}>
          Đặt bàn ngay
          <span style={{ transition: 'transform .2s', transform: hovered ? 'translateX(3px)' : 'none' }}>→</span>
        </span>
      </div>
    </div>
  )
}

// ─── BranchDrawer (SỬA) — render qua Portal + z-index cao, không bị Navbar đè ──
function BranchDrawer({ restaurant, branches, loading, onClose, onSelectBranch }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  const content = (
    <>
      {/* Backdrop — z-index rất cao để chắc chắn nằm trên Navbar */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,.55)',
          opacity: visible ? 1 : 0, transition: 'opacity .28s',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 9999,
        width: '100%', maxWidth: 480,
        background: 'var(--cream, #FAF8F5)',
        boxShadow: '-8px 0 32px rgba(0,0,0,.2)',
        display: 'flex', flexDirection: 'column',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Drawer header */}
        <div style={{
          background: 'linear-gradient(135deg,#5C3A1E,#7A4F2D)',
          padding: '1.1rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '.85rem', flexShrink: 0,
        }}>
          {restaurant.logoUrl && (
            <img src={restaurant.logoUrl} alt={restaurant.restaurantName}
              style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.55)', letterSpacing: '.1em', textTransform: 'uppercase', margin: '0 0 .15rem' }}>
              {restaurant.cuisineType || 'Ẩm thực'}
            </p>
            <h3 style={{
              fontFamily: "'Cormorant Garamond',Georgia,serif",
              fontSize: '1.15rem', fontWeight: 700, color: '#fff',
              margin: 0, lineHeight: 1.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{restaurant.restaurantName}</h3>
            <p style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.5)', margin: '.15rem 0 0' }}>
              {loading ? 'Đang tải...' : `${branches.length} chi nhánh`}
            </p>
          </div>
          <button onClick={handleClose} style={{
            background: 'rgba(255,255,255,.15)', border: 'none',
            color: '#fff', width: 32, height: 32, borderRadius: 6,
            cursor: 'pointer', fontSize: '1rem', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={18} /></button>
        </div>

        {/* Drawer body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>

          {/* --- BỔ SUNG: KHỐI THÔNG TIN CHI TIẾT NHÀ HÀNG --- */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '1.15rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(92, 58, 30, 0.1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <h4 style={{
              fontFamily: "'Cormorant Garamond',Georgia,serif",
              fontSize: '1rem', fontWeight: 700, color: '#5C3A1E',
              margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              Giới thiệu nhà hàng
            </h4>

            <p style={{ fontSize: '0.875rem', color: '#4B382A', lineHeight: 1.6, margin: '0 0 0.85rem 0' }}>
              {restaurant.description || 'Chưa có thông tin mô tả chi tiết cho nhà hàng này.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem', color: '#666', borderTop: '1px solid #f1f1f1', paddingTop: '0.75rem' }}>
              {restaurant.phone && (
                <div><Phone size={14} style={{ verticalAlign: '-2px' }} /> SĐT tổng: <strong style={{ color: '#333' }}>{restaurant.phone}</strong></div>
              )}
              {restaurant.email && (
                <div><Mail size={14} style={{ verticalAlign: '-2px' }} /> Email: <strong style={{ color: '#333' }}>{restaurant.email}</strong></div>
              )}
              {restaurant.website && (
                <div>
                  <Globe size={14} style={{ verticalAlign: '-2px' }} /> Website: <a href={restaurant.website} target="_blank" rel="noreferrer" style={{ color: '#5C3A1E', textDecoration: 'underline' }}>{restaurant.website}</a>
                </div>
              )}
            </div>
          </div>
          {/* ----------------------------------------------- */}

          {/* Tiêu đề danh sách chi nhánh */}
          <h4 style={{
            fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em',
            color: '#8C6D53', fontWeight: 700, marginBottom: '0.75rem'
          }}>
            Danh sách chi nhánh ({branches.length})
          </h4>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>⟳</div>
              <p style={{ fontSize: '.88rem' }}>Đang tải chi nhánh...</p>
            </div>
          ) : branches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--muted)' }}>
              <div style={{ marginBottom: '.75rem' }}><Building2 size={40} /></div>
              <p style={{ fontSize: '.88rem' }}>Chưa có chi nhánh hoạt động.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              {branches.map((b, i) => (
                <BranchCard
                  key={b.id}
                  branch={b}
                  index={i}
                  onClick={() => onSelectBranch(b.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )

  // Render thẳng vào document.body -> thoát mọi stacking context của cha,
  // đảm bảo luôn nằm trên Navbar bất kể Navbar dùng position/z-index gì
  return createPortal(content, document.body)
}

// ─── Main component ────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate()

  const [restaurants, setRestaurants] = useState([])
  const [keyword, setKeyword] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState('') // Lưu ẩm thực đang chọn ở badge
  const [cuisine, setCuisine] = useState('')
  const [loadingRestaurants, setLoadingRestaurants] = useState(false)

  const [drawerRestaurant, setDrawerRestaurant] = useState(null)
  const [drawerBranches, setDrawerBranches] = useState([])
  const [loadingBranches, setLoadingBranches] = useState(false)

  const [bName, setBName] = useState('')
  const [bPhone, setBPhone] = useState('')
  const [bEmail, setBEmail] = useState('')
  const [bDate, setBDate] = useState('')
  const [bTime, setBTime] = useState('')
  const [bGuests, setBGuests] = useState('2 người')
  const [bZone, setBZone] = useState('Trong nhà (máy lạnh)')
  const [bNote, setBNote] = useState('')
  const [bRestaurantId, setBRestaurantId] = useState('')
  const [bBranchId, setBBranchId] = useState('')
  const [bBranches, setBBranches] = useState([])
  const [bookSuccess, setBookSuccess] = useState(false)

  const [heroLoaded, setHeroLoaded] = useState(false)

  useEffect(() => {
    setTimeout(() => setHeroLoaded(true), 80)
    loadRestaurants()
  }, [])

  const loadRestaurants = async (params = {}) => {
    setLoadingRestaurants(true)
    try {
      const res = await restaurantApi.getAll()
      const list = res.data?.data ?? res.data ?? []
      setRestaurants(list)
    } catch (err) {
      console.error('loadRestaurants', err)
      setRestaurants([])
    } finally {
      setLoadingRestaurants(false)
    }
  }

  const openDrawer = async (restaurant) => {
    setDrawerRestaurant(restaurant)
    setDrawerBranches([])
    setLoadingBranches(true)
    try {
      const res = await branchApi.getByRestaurant(restaurant.id)
      const list = res.data?.data ?? res.data ?? []
      setDrawerBranches(list)
    } catch (err) {
      console.error('openDrawer', err)
      setDrawerBranches([])
    } finally {
      setLoadingBranches(false)
    }
  }

  const handleSelectFormRestaurant = async (restaurantId) => {
    setBRestaurantId(restaurantId)
    setBBranchId('')
    setBBranches([])
    if (!restaurantId) return
    try {
      const res = await branchApi.getAll()
      setBBranches(res)
    } catch (err) {
      console.error('handleSelectFormRestaurant', err)
    }
  }

  const handleSearch = () => {
    const params = {}
    if (keyword.trim()) params.keyword = keyword.trim()
    if (cuisine) params.cuisineType = cuisine
    loadRestaurants(params)
  }

  const handleBookSubmit = (e) => {
    e.preventDefault()
    setTimeout(() => setBookSuccess(true), 800)
  }



  // Hàm khi click Badge ẩm thực tại trang chủ (KHÔNG GỌI API)
  const handleCuisineBadgeClick = (cuisineName) => {
    setSelectedCuisine(cuisineName);

    if (cuisineName === 'Tất cả') {
      setFilteredRestaurants(restaurants);
    } else {
      const filtered = restaurants.filter(item => {
        const types = item.cuisineType ? item.cuisineType.toLowerCase() : '';
        return types.includes(cuisineName.toLowerCase());
      });
      setFilteredRestaurants(filtered);
    }
  };

  const S = {
    section: { padding: '6rem 5%' },
    eyebrow: {
      fontSize: '.72rem', fontWeight: 600, letterSpacing: '.25em',
      textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '.6rem',
    },
    title: {
      fontFamily: "'Cormorant Garamond',Georgia,serif",
      fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 700,
      color: 'var(--brown)', lineHeight: 1.15,
    },
    lead: { color: 'var(--muted)', lineHeight: 1.8, fontSize: '.95rem' },
  }

  const filteredRestaurants = useMemo(() => {
    if (!selectedCuisine) return restaurants
    return restaurants.filter(item => {
      if (!item.cuisineType) return false
      // Xử lý tách chuỗi phòng trường hợp 1 nhà hàng có nhiều kiểu ẩm thực gộp (vd: "Trung Hoa, Singapore")
      const cuisinesOfRestaurant = item.cuisineType.split(',').map(c => c.trim())
      return cuisinesOfRestaurant.includes(selectedCuisine)
    })
  }, [restaurants, selectedCuisine])
  return (
    <div style={{ fontFamily: "'Be Vietnam Pro',system-ui,sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <Navbar />

      {/* ══════════════ HERO (giữ nguyên) ══════════════ */}
      <section style={{
        height: '100vh', minHeight: 640, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#1a0e06 0%,#3d2b1f 55%,#6b4226 100%)' }} />
        <div style={{
          position: 'absolute', inset: 0, opacity: .06,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L35 20L50 20L38 29L43 44L30 35L17 44L22 29L10 20L25 20Z' fill='%23C9A84C'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }} />
        <div style={{
          position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 1.5rem', maxWidth: 800,
          opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'none' : 'translateY(20px)',
          transition: 'opacity .8s ease, transform .8s ease',
        }}>
          <div style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--gold-light)', marginBottom: '1.25rem' }}>
            <Sparkles size={14} style={{ verticalAlign: '-2px' }} /> Tinh hoa ẩm thực Việt <Sparkles size={14} style={{ verticalAlign: '-2px' }} />
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 'clamp(3rem,9vw,6.5rem)', fontWeight: 700, color: '#fff', lineHeight: 1.05, marginBottom: '1.25rem' }}>
            Nơi mỗi<br /><em style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>bữa tiệc</em><br />là ký ức
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,.7)', lineHeight: 1.75, maxWidth: 500, margin: '0 auto 2.5rem' }}>
            Đặt bàn tại hàng trăm nhà hàng cao cấp trên toàn quốc — chọn bàn, đặt món, thanh toán cọc ngay trong vài giây.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => document.getElementById('restaurants').scrollIntoView({ behavior: 'smooth' })}
              style={{ background: 'var(--gold)', color: 'var(--brown)', border: 'none', padding: '.9rem 2.5rem', fontSize: '.88rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>
              Khám Phá Nhà Hàng
            </button>
            <button onClick={() => document.getElementById('booking').scrollIntoView({ behavior: 'smooth' })}
              style={{ background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,.5)', padding: '.88rem 2.5rem', fontSize: '.88rem', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>
              Đặt Bàn / Tra Cứu
            </button>
          </div>
        </div>
        <div onClick={() => document.getElementById('stats').scrollIntoView({ behavior: 'smooth' })}
          style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem', cursor: 'pointer', zIndex: 2 }}>
          <span style={{ fontSize: '.68rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>Cuộn xuống</span>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom,rgba(255,255,255,.35),transparent)', animation: 'pulse 1.8s ease-in-out infinite' }} />
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:.35}50%{opacity:.9}}`}</style>
      </section>

      {/* ══════════════ STATS (giữ nguyên) ══════════════ */}
      {/* <div id="stats" style={{ background: 'var(--brown)', padding: '3.5rem 5%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
        {STATS.map((s, i) => <StatItem key={i} {...s} />)}
      </div> */}

      {/* ══════════════ RESTAURANTS ══════════════ */}
      <section id="restaurants" style={S.section}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={S.eyebrow}>Khám phá</div>
            <h2 style={S.title}>Nhà Hàng Nổi Bật</h2>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '.88rem' }}>
            {loadingRestaurants ? 'Đang tải...' : `${restaurants.length} thương hiệu`}
          </p>
        </div>

        <RestaurantSearchFilter
          onCuisineSelect={(selectedCuisine) => {
            // Lọc trực tiếp mảng nhà hàng ở trang chủ, TUYỆT ĐỐI KHÔNG gọi API
            handleCuisineBadgeClick(selectedCuisine);
          }}
        />

        {restaurants.length === 0 && !loadingRestaurants ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--muted)' }}>
            <div style={{ marginBottom: '1rem' }}><Search size={48} /></div>
            <p>Không tìm thấy nhà hàng phù hợp. Thử từ khoá khác nhé!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
            {filteredRestaurants.map((item, idx) => (
              <div
                key={idx}
                onClick={() => openDrawer(item)} // 👉 ĐÃ KHÔI PHỤC: Bấm vào card hoặc nút đều mở Drawer chi nhánh
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <img
                  src={item.logoUrl || 'https://via.placeholder.com/300'}
                  alt={item.restaurantName}
                  style={{ width: '100%', height: 160, objectFit: 'cover' }}
                />

                <div style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#b45309',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem',
                    minHeight: '18px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.cuisineType || 'Ẩm thực'}
                  </div>

                  <h3 style={{
                    fontSize: '1rem',
                    margin: '0 0 0.5rem 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    color: '#1f2937'
                  }}>
                    {item.restaurantName}
                  </h3>

                  <p style={{
                    fontSize: '0.85rem',
                    color: '#6b7280',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    marginBottom: '1rem'
                  }}>
                    {item.description}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation() // Chặn nổi bọt để tránh gọi sự kiện click 2 lần
                      openDrawer(item)
                    }}
                    style={{
                      marginTop: 'auto',
                      width: '100%',
                      padding: '0.6rem',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: '#374151',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
                  >
                    XEM CHI NHÁNH &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ══════════════ EXPERIENCE (giữ nguyên) ══════════════ */}
      <div id="experience" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', minHeight: 520, background: 'var(--brown)' }}>
        <div style={{ background: 'linear-gradient(135deg,#5c3a1e 0%,#8B6914 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}><Lamp size={96} color="var(--gold-light)" /></div>
        <div style={{ padding: '4rem 8%' }}>
          <div style={{ ...S.eyebrow, color: 'var(--gold-light)' }}>Tại sao chọn Dabana</div>
          <h2 style={{ ...S.title, color: 'var(--cream)', marginBottom: '.75rem' }}>
            Trải Nghiệm<br /><em style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>Khác Biệt</em>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '2rem' }}>
            {EXPERIENCE.map(item => (
              <div key={item.title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--gold)' }}><item.icon size={18} /></div>
                <div>
                  <h4 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: '1.05rem', fontWeight: 600, color: 'var(--cream)', marginBottom: '.2rem' }}>{item.title}</h4>
                  <p style={{ fontSize: '.82rem', color: 'rgba(251,247,239,.5)', lineHeight: 1.65 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════ BOOKING & LOOKUP ══════════════ */}
      <section id="booking" style={{ ...S.section, background: 'var(--cream-dark)' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={S.eyebrow}>Dịch vụ trực tuyến</div>
            <h2 style={S.title}>Đặt Bàn & Tra Cứu Lịch Sử</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem auto', maxWidth: 300 }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right,transparent,var(--gold-light),transparent)' }} />
              <span style={{ color: 'var(--gold)' }}><Sparkles size={14} /></span>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right,transparent,var(--gold-light),transparent)' }} />
            </div>
          </div>

          <GuestBookingLookup />

          <BookingForm />

        </div>
      </section>

      {/* ══════════════ BRANCH DRAWER ══════════════ */}
      {drawerRestaurant && (
        <BranchDrawer
          restaurant={drawerRestaurant}
          branches={drawerBranches}
          loading={loadingBranches}
          onClose={() => setDrawerRestaurant(null)}
          onSelectBranch={(branchId) => {
            setDrawerRestaurant(null)
            navigate(`/branch/${branchId}`)
          }}
        />
      )}
    </div>
  )
}