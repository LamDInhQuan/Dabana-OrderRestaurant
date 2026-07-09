import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { branchApi } from '../../api'

// ─── Cuisine filters ───────────────────────────────────────────
const CUISINES = [
  { label: 'Tất cả',    value: '',          emoji: '🍽️' },
  { label: 'Việt Nam',  value: 'Việt Nam',  emoji: '🇻🇳' },
  { label: 'Nhật Bản',  value: 'Nhật Bản',  emoji: '🍣' },
  { label: 'Hàn Quốc',  value: 'Hàn Quốc',  emoji: '🥩' },
  { label: 'Hải sản',   value: 'Hải sản',   emoji: '🦞' },
  { label: 'Lẩu nướng', value: 'Lẩu & Nướng', emoji: '🫕' },
  { label: 'Âu',        value: 'Âu',         emoji: '🍝' },
]

// ─── Demo branch data shown when API returns empty ─────────────
const DEMO_BRANCHES = [
  { id:1, name:'Nhà Hàng Sen Vàng',   address:'12 Hồ Hoàn Kiếm, Hoàn Kiếm, Hà Nội',   restaurant:{ cuisineType:'Việt Nam'  }, emoji:'🪷', rating:4.8, badge:'Được yêu thích', tags:['Lẩu','Hải sản','Gia đình'] },
  { id:2, name:'Sakura Garden',        address:'88 Nguyễn Huệ, Q.1, TP. Hồ Chí Minh',  restaurant:{ cuisineType:'Nhật Bản'  }, emoji:'🌸', rating:4.7, badge:'Mới mở',         tags:['Sushi','Sashimi','Set menu'] },
  { id:3, name:'Seoul BBQ House',      address:'56 Tô Ngọc Vân, Tây Hồ, Hà Nội',       restaurant:{ cuisineType:'Hàn Quốc'  }, emoji:'🥩', rating:4.6, badge:'Nổi bật',        tags:['Nướng than','Kim chi'] },
  { id:4, name:'Hải Cảng Tươi Sống',  address:'Bãi biển Mỹ Khê, Sơn Trà, Đà Nẵng',   restaurant:{ cuisineType:'Hải sản'   }, emoji:'🦞', rating:4.9, badge:'Top 1 Đà Nẵng',  tags:['Hải sản','View biển'] },
  { id:5, name:'Maison de Huế',        address:'24 Lê Lợi, TP. Huế',                   restaurant:{ cuisineType:'Âu'         }, emoji:'🏯', rating:4.5, badge:'Heritage',       tags:['Cung đình','Fine dining'] },
  { id:6, name:'Phố Lẩu Việt',        address:'45 Trần Hưng Đạo, Q.5, TP. Hồ Chí Minh', restaurant:{ cuisineType:'Lẩu & Nướng' }, emoji:'🫕', rating:4.4, badge:'Giá tốt',     tags:['Lẩu thái','Nướng than hoa'] },
]

const CARD_GRADIENTS = [
  ['#6b4226','#3d2b1f'], ['#1a5276','#0d2137'], ['#1e8449','#0b3d25'],
  ['#7d3c98','#3d1a4d'], ['#c0392b','#6e1b18'], ['#d68910','#7d5109'],
]

const STATS = [
  { num: 248,   suffix: '+', label: 'Nhà hàng đối tác' },
  { num: 15420, suffix: '+', label: 'Bàn được đặt' },
  { num: 92000, suffix: '+', label: 'Thực khách hài lòng' },
  { num: 12,    suffix: '',  label: 'Thành phố phủ sóng' },
]

const EXPERIENCE = [
  { icon:'🗺️', title:'Sơ đồ bàn trực quan',     desc:'Chọn đúng vị trí bạn muốn — trong nhà, ngoài trời, phòng VIP — ngay trên bản đồ chi nhánh.' },
  { icon:'🍜', title:'Đặt món trước khi đến',   desc:'Tiết kiệm thời gian chờ, nhà hàng chuẩn bị sẵn phần ăn theo ý bạn.' },
  { icon:'🔔', title:'Nhắc lịch tự động',        desc:'SMS và thông báo nhắc trước 30 phút — không bỏ lỡ buổi hẹn nào.' },
  { icon:'🛡️', title:'Đặt cọc an toàn',          desc:'Hoàn tiền minh bạch theo chính sách từng nhà hàng. Mọi giao dịch đều được mã hóa.' },
]

const TESTIMONIALS = [
  { stars:5, text:'Từ lúc đặt bàn đến khi rời đi, mọi thứ đều hoàn hảo. Hệ thống nhắc lịch tự động rất tiện lợi!', author:'Nguyễn Minh Châu, Hà Nội' },
  { stars:5, text:'Sơ đồ bàn trực quan giúp tôi chọn được đúng bàn view đẹp nhất cho buổi hẹn sinh nhật.', author:'Lê Trung Kiên, TP.HCM' },
  { stars:5, text:'Đặt món trước rất hay, đến nơi là có ngay phần ăn đã chuẩn bị sẵn. Không phải chờ 30 phút.', author:'Trần Thu Hà, Đà Nẵng' },
]

// ─── Counter hook ──────────────────────────────────────────────
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

// ─── Scroll-reveal hook ────────────────────────────────────────
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

// ─── Sub-components ────────────────────────────────────────────
function StatItem({ num, suffix, label }) {
  const [ref, active] = useReveal()
  const val = useCounter(num, active)
  return (
    <div ref={ref} style={{ textAlign:'center' }}>
      <div style={{
        fontFamily:"'Cormorant Garamond',Georgia,serif",
        fontSize:'clamp(2rem,4vw,3rem)', fontWeight:700,
        color:'var(--gold-light)', lineHeight:1
      }}>{val.toLocaleString('vi-VN')}{suffix}</div>
      <div style={{ fontSize:'.75rem', fontWeight:500, color:'rgba(255,255,255,.5)',
        letterSpacing:'.1em', textTransform:'uppercase', marginTop:'.4rem' }}>{label}</div>
    </div>
  )
}

function BranchCard({ branch, index, onClick }) {
  const [hovered, setHovered] = useState(false)
  const [ref, visible] = useReveal()
  const [g0, g1] = CARD_GRADIENTS[index % CARD_GRADIENTS.length]
  const emoji = branch.emoji || '🍽️'
  const rating = branch.rating || null
  const badge  = branch.badge  || null
  const tags   = branch.tags   || []

  return (
    <div ref={ref} className="reveal" style={{ ...(visible ? { opacity:1, transform:'none' } : {}) }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:'var(--white)', borderRadius:4, overflow:'hidden',
        boxShadow: hovered ? 'var(--shadow)' : 'var(--shadow-sm)',
        transform: hovered ? 'translateY(-6px)' : 'none',
        transition:'all .3s', cursor:'pointer',
        opacity: visible ? 1 : 0,
        transitionDelay: `${(index % 3) * .08}s`
      }}>
      {/* Image area */}
      <div style={{ height:210, position:'relative', overflow:'hidden' }}>
        <div style={{
          position:'absolute', inset:0,
          background:`linear-gradient(135deg,${g0},${g1})`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'5rem',
          transform: hovered ? 'scale(1.06)' : 'scale(1)',
          transition:'transform .4s'
        }}>{emoji}</div>
        {badge && (
          <div style={{
            position:'absolute', top:'1rem', left:'1rem',
            background:'var(--gold)', color:'var(--brown)',
            fontSize:'.68rem', fontWeight:700, padding:'.3rem .75rem',
            letterSpacing:'.08em', textTransform:'uppercase'
          }}>{badge}</div>
        )}
        {rating && (
          <div style={{
            position:'absolute', top:'1rem', right:'1rem',
            background:'rgba(0,0,0,.6)', color:'var(--gold-light)',
            fontSize:'.8rem', fontWeight:600, padding:'.3rem .6rem',
            borderRadius:2, display:'flex', alignItems:'center', gap:'.3rem'
          }}>★ {rating}</div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding:'1.25rem 1.375rem 1.5rem' }}>
        <div style={{ fontSize:'.7rem', fontWeight:600, letterSpacing:'.15em',
          textTransform:'uppercase', color:'var(--gold)', marginBottom:'.4rem' }}>
          {branch.restaurant?.cuisineType || 'Ẩm thực'}
        </div>
        <h3 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif",
          fontSize:'1.3rem', fontWeight:700, color:'var(--brown)',
          marginBottom:'.5rem', lineHeight:1.25 }}>{branch.name}</h3>
        <p style={{ fontSize:'.82rem', color:'var(--muted)', marginBottom:'1rem',
          display:'flex', alignItems:'flex-start', gap:'.35rem' }}>
          📍 {branch.address}
        </p>
        {tags.length > 0 && (
          <div style={{ display:'flex', gap:'.45rem', flexWrap:'wrap', marginBottom:'1.1rem' }}>
            {tags.map(t => (
              <span key={t} style={{ fontSize:'.7rem', fontWeight:500,
                padding:'.25rem .65rem', background:'var(--cream)',
                color:'var(--muted)', borderRadius:99 }}>{t}</span>
            ))}
          </div>
        )}
        <button style={{
          width:'100%', background: hovered ? 'var(--gold)' : 'var(--cream-dark)',
          color: hovered ? 'var(--white)' : 'var(--brown)',
          border:'none', padding:'.7rem', fontSize:'.82rem', fontWeight:600,
          letterSpacing:'.06em', textTransform:'uppercase', cursor:'pointer',
          borderRadius:2, transition:'all .2s', fontFamily:'inherit'
        }}>Đặt Bàn Ngay</button>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate()
  const [branches,   setBranches]   = useState([])
  const [keyword,    setKeyword]    = useState('')
  const [cuisine,    setCuisine]    = useState('')
  const [loading,    setLoading]    = useState(false)
  const [heroLoaded, setHeroLoaded] = useState(false)

  // booking form state
  const [bName,       setBName]       = useState('')
  const [bPhone,      setBPhone]      = useState('')
  const [bEmail,      setBEmail]      = useState('')
  const [bDate,       setBDate]       = useState('')
  const [bTime,       setBTime]       = useState('')
  const [bGuests,     setBGuests]     = useState('2 người')
  const [bZone,       setBZone]       = useState('Trong nhà (máy lạnh)')
  const [bNote,       setBNote]       = useState('')
  const [bRestaurant, setBRestaurant] = useState('')
  const [bookSuccess, setBookSuccess] = useState(false)

  useEffect(() => {
    // small delay so hero animation triggers
    setTimeout(() => setHeroLoaded(true), 80)
    loadBranches()
  }, [])

  const loadBranches = async (params = {}) => {
    setLoading(true)
    try {
      const { data } = await branchApi.search(params)
      const list = data.content || data || []
      setBranches(list.length > 0 ? list : DEMO_BRANCHES)
    } catch {
      setBranches(DEMO_BRANCHES)
    } finally { setLoading(false) }
  }

  const handleSearch = () => {
    const params = {}
    if (keyword.trim())  params.keyword     = keyword.trim()
    if (cuisine)         params.cuisineType = cuisine
    loadBranches(params)
  }

  const handleBookSubmit = (e) => {
    e.preventDefault()
    // In real: bookingApi.createHold(...)
    setTimeout(() => setBookSuccess(true), 800)
  }

  // ── STYLES ──────────────────────────────────────────────────
  const S = {
    section: { padding: '6rem 5%' },
    eyebrow: { fontSize:'.72rem', fontWeight:600, letterSpacing:'.25em',
      textTransform:'uppercase', color:'var(--gold)', marginBottom:'.6rem' },
    title: { fontFamily:"'Cormorant Garamond',Georgia,serif",
      fontSize:'clamp(2rem,4vw,3rem)', fontWeight:700, color:'var(--brown)', lineHeight:1.15 },
    lead: { color:'var(--muted)', lineHeight:1.8, fontSize:'.95rem' },
  }

  // ── RENDER ──────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'Be Vietnam Pro',system-ui,sans-serif" }}>

      {/* Google Font */}
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <Navbar />

      {/* ══════════════ HERO ══════════════ */}
      <section style={{
        height:'100vh', minHeight:640, position:'relative',
        display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'
      }}>
        {/* Background */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(160deg,#1a0e06 0%,#3d2b1f 55%,#6b4226 100%)'
        }} />
        {/* Lotus pattern overlay */}
        <div style={{
          position:'absolute', inset:0, opacity:.06,
          backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L35 20L50 20L38 29L43 44L30 35L17 44L22 29L10 20L25 20Z' fill='%23C9A84C'/%3E%3C/svg%3E")`,
          backgroundRepeat:'repeat'
        }} />

        {/* Content */}
        <div style={{
          position:'relative', zIndex:2, textAlign:'center',
          padding:'0 1.5rem', maxWidth:800,
          opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'none' : 'translateY(20px)',
          transition:'opacity .8s ease, transform .8s ease'
        }}>
          <div style={{ fontSize:'.75rem', fontWeight:600, letterSpacing:'.28em',
            textTransform:'uppercase', color:'var(--gold-light)', marginBottom:'1.25rem' }}>
            ✦ Tinh hoa ẩm thực Việt ✦
          </div>
          <h1 style={{
            fontFamily:"'Cormorant Garamond',Georgia,serif",
            fontSize:'clamp(3rem,9vw,6.5rem)', fontWeight:700,
            color:'#fff', lineHeight:1.05, marginBottom:'1.25rem'
          }}>
            Nơi mỗi<br/>
            <em style={{ color:'var(--gold-light)', fontStyle:'italic' }}>bữa tiệc</em>
            <br/>là ký ức
          </h1>
          <p style={{ fontSize:'1rem', color:'rgba(255,255,255,.7)', lineHeight:1.75,
            maxWidth:500, margin:'0 auto 2.5rem' }}>
            Đặt bàn tại hàng trăm nhà hàng cao cấp trên toàn quốc — chọn bàn,
            đặt món, thanh toán cọc ngay trong vài giây.
          </p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => document.getElementById('restaurants').scrollIntoView({ behavior:'smooth' })}
              style={{
                background:'var(--gold)', color:'var(--brown)', border:'none',
                padding:'.9rem 2.5rem', fontSize:'.88rem', fontWeight:700,
                letterSpacing:'.1em', textTransform:'uppercase', cursor:'pointer',
                borderRadius:2, transition:'all .2s', fontFamily:'inherit'
              }}
              onMouseEnter={e => { e.target.style.background='var(--gold-light)'; e.target.style.transform='translateY(-2px)' }}
              onMouseLeave={e => { e.target.style.background='var(--gold)'; e.target.style.transform='none' }}>
              Khám Phá Nhà Hàng
            </button>
            <button onClick={() => document.getElementById('booking').scrollIntoView({ behavior:'smooth' })}
              style={{
                background:'transparent', color:'#fff',
                border:'1.5px solid rgba(255,255,255,.5)',
                padding:'.88rem 2.5rem', fontSize:'.88rem', fontWeight:500,
                letterSpacing:'.08em', textTransform:'uppercase', cursor:'pointer',
                borderRadius:2, transition:'all .2s', fontFamily:'inherit'
              }}
              onMouseEnter={e => { e.target.style.borderColor='var(--gold-light)'; e.target.style.color='var(--gold-light)' }}
              onMouseLeave={e => { e.target.style.borderColor='rgba(255,255,255,.5)'; e.target.style.color='#fff' }}>
              Đặt Bàn Ngay
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div onClick={() => document.getElementById('stats').scrollIntoView({ behavior:'smooth' })}
          style={{ position:'absolute', bottom:'2rem', left:'50%', transform:'translateX(-50%)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:'.4rem', cursor:'pointer', zIndex:2 }}>
          <span style={{ fontSize:'.68rem', letterSpacing:'.15em', textTransform:'uppercase',
            color:'rgba(255,255,255,.35)' }}>Cuộn xuống</span>
          <div style={{
            width:1, height:40,
            background:'linear-gradient(to bottom,rgba(255,255,255,.35),transparent)',
            animation:'pulse 1.8s ease-in-out infinite'
          }} />
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:.35}50%{opacity:.9}}`}</style>
      </section>

      {/* ══════════════ STATS ══════════════ */}
      <div id="stats" style={{
        background:'var(--brown)', padding:'3.5rem 5%',
        display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'2rem'
      }}>
        {STATS.map((s, i) => <StatItem key={i} {...s} />)}
      </div>

      {/* ══════════════ RESTAURANTS ══════════════ */}
      <section id="restaurants" style={S.section}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between',
          marginBottom:'2.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <div style={S.eyebrow}>Khám phá</div>
            <h2 style={S.title}>Nhà Hàng Nổi Bật</h2>
          </div>
          <p style={{ color:'var(--muted)', fontSize:'.88rem' }}>
            {loading ? 'Đang tải...' : `${branches.length} chi nhánh`}
          </p>
        </div>

        {/* Search bar */}
        <div style={{ display:'flex', gap:'.75rem', marginBottom:'2.5rem', flexWrap:'wrap' }}>
          <input value={keyword} onChange={e => setKeyword(e.target.value)}
            placeholder="Tìm tên nhà hàng, địa chỉ..."
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ flex:1, minWidth:220 }} />
          <select value={cuisine} onChange={e => setCuisine(e.target.value)}
            style={{ width:'auto', minWidth:180 }}>
            {CUISINES.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
          </select>
          <button onClick={handleSearch} style={{
            background:'var(--brown)', color:'#fff', border:'none',
            padding:'.65rem 1.75rem', fontSize:'.88rem', fontWeight:600,
            letterSpacing:'.06em', borderRadius:2, cursor:'pointer', fontFamily:'inherit',
            whiteSpace:'nowrap'
          }}>🔍 Tìm kiếm</button>
        </div>

        {/* Cuisine pills */}
        <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', marginBottom:'2.5rem' }}>
          {CUISINES.map(c => (
            <button key={c.value} onClick={() => { setCuisine(c.value); loadBranches(c.value ? { cuisineType:c.value } : {}) }}
              style={{
                padding:'.35rem .9rem', borderRadius:99, fontSize:'.8rem', fontWeight:600,
                border: cuisine === c.value ? '2px solid var(--gold)' : '1.5px solid var(--border)',
                background: cuisine === c.value ? 'var(--gold)' : 'var(--white)',
                color: cuisine === c.value ? 'var(--brown)' : 'var(--muted)',
                cursor:'pointer', transition:'all .2s', fontFamily:'inherit'
              }}>{c.emoji} {c.label}</button>
          ))}
        </div>

        {/* Cards grid */}
        {branches.length === 0 && !loading ? (
          <div style={{ textAlign:'center', padding:'5rem 0', color:'var(--muted)' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔍</div>
            <p>Không tìm thấy chi nhánh phù hợp. Thử từ khoá khác nhé!</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'2rem' }}>
            {branches.map((b, i) => (
              <BranchCard key={b.id} branch={b} index={i}
                onClick={() => navigate(`/branch/${b.id}`)} />
            ))}
          </div>
        )}
      </section>

      {/* ══════════════ EXPERIENCE ══════════════ */}
      <div id="experience" style={{
        display:'grid', gridTemplateColumns:'1fr 1fr',
        minHeight:520, background:'var(--brown)'
      }}>
        {/* Visual */}
        <div style={{
          background:'linear-gradient(135deg,#5c3a1e 0%,#8B6914 100%)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'8rem', minHeight:320
        }}>🏮</div>

        {/* Content */}
        <div style={{ padding:'5rem 4rem' }}>
          <div style={{ ...S.eyebrow, color:'var(--gold-light)' }}>Tại sao chọn Dabana</div>
          <h2 style={{ ...S.title, color:'var(--cream)', marginBottom:'.75rem' }}>
            Trải Nghiệm<br/>
            <em style={{ color:'var(--gold-light)', fontStyle:'italic' }}>Khác Biệt</em>
          </h2>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', margin:'1rem 0' }}>
            <div style={{ flex:1, height:1, background:'linear-gradient(to right,transparent,rgba(201,168,76,.4))' }} />
            <span style={{ color:'var(--gold)' }}>✦</span>
            <div style={{ flex:1, height:1, background:'linear-gradient(to left,transparent,rgba(201,168,76,.4))' }} />
          </div>
          <p style={{ ...S.lead, color:'rgba(251,247,239,.65)', marginBottom:'2rem' }}>
            Mỗi chi tiết đều được chăm chút — từ sơ đồ bàn trực quan đến nhắc lịch tự động.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            {EXPERIENCE.map(item => (
              <div key={item.title} style={{ display:'flex', gap:'1rem', alignItems:'flex-start' }}>
                <div style={{
                  width:40, height:40, border:'1px solid var(--gold)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'1rem', flexShrink:0, color:'var(--gold)'
                }}>{item.icon}</div>
                <div>
                  <h4 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif",
                    fontSize:'1.05rem', fontWeight:600, color:'var(--cream)', marginBottom:'.2rem' }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize:'.82rem', color:'rgba(251,247,239,.5)', lineHeight:1.65 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════ BOOKING FORM ══════════════ */}
      <section id="booking" style={{ ...S.section, background:'var(--cream-dark)' }}>
        <div style={{ maxWidth:820, margin:'0 auto' }}>
          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:'3rem' }}>
            <div style={S.eyebrow}>Giữ chỗ ngay</div>
            <h2 style={S.title}>Đặt Bàn Trực Tuyến</h2>
            <div style={{ display:'flex', alignItems:'center', gap:'1rem', margin:'1rem auto', maxWidth:300 }}>
              <div style={{ flex:1, height:1, background:'linear-gradient(to right,transparent,var(--gold-light),transparent)' }} />
              <span style={{ color:'var(--gold)' }}>✦</span>
              <div style={{ flex:1, height:1, background:'linear-gradient(to right,transparent,var(--gold-light),transparent)' }} />
            </div>
            <p style={{ ...S.lead, textAlign:'center', maxWidth:480, margin:'0 auto' }}>
              Điền thông tin bên dưới — chúng tôi xác nhận trong vòng 2 phút.
            </p>
          </div>

          {/* Form card */}
          <div style={{ background:'var(--white)', padding:'3rem', boxShadow:'var(--shadow)', borderRadius:4 }}>
            {!bookSuccess ? (
              <form onSubmit={handleBookSubmit}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
                  {/* Name */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
                    <label style={{ fontSize:'.75rem', fontWeight:600, letterSpacing:'.12em',
                      textTransform:'uppercase', color:'var(--brown-mid)' }}>Họ và tên</label>
                    <input value={bName} onChange={e=>setBName(e.target.value)}
                      placeholder="Nguyễn Văn A" required />
                  </div>
                  {/* Phone */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
                    <label style={{ fontSize:'.75rem', fontWeight:600, letterSpacing:'.12em',
                      textTransform:'uppercase', color:'var(--brown-mid)' }}>Số điện thoại</label>
                    <input value={bPhone} onChange={e=>setBPhone(e.target.value)}
                      placeholder="0901 234 567" required />
                  </div>
                  {/* Email */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
                    <label style={{ fontSize:'.75rem', fontWeight:600, letterSpacing:'.12em',
                      textTransform:'uppercase', color:'var(--brown-mid)' }}>Email</label>
                    <input type="email" value={bEmail} onChange={e=>setBEmail(e.target.value)}
                      placeholder="email@gmail.com" />
                  </div>
                  {/* Restaurant */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
                    <label style={{ fontSize:'.75rem', fontWeight:600, letterSpacing:'.12em',
                      textTransform:'uppercase', color:'var(--brown-mid)' }}>Nhà hàng</label>
                    <select value={bRestaurant} onChange={e=>setBRestaurant(e.target.value)} required>
                      <option value="">— Chọn nhà hàng —</option>
                      {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                  {/* Date */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
                    <label style={{ fontSize:'.75rem', fontWeight:600, letterSpacing:'.12em',
                      textTransform:'uppercase', color:'var(--brown-mid)' }}>Ngày đến</label>
                    <input type="date" value={bDate} onChange={e=>setBDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]} required />
                  </div>
                  {/* Time */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
                    <label style={{ fontSize:'.75rem', fontWeight:600, letterSpacing:'.12em',
                      textTransform:'uppercase', color:'var(--brown-mid)' }}>Giờ đến</label>
                    <select value={bTime} onChange={e=>setBTime(e.target.value)} required>
                      <option value="">— Chọn giờ —</option>
                      {['10:00','11:00','11:30','12:00','12:30','13:00',
                        '17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30'].map(t =>
                        <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  {/* Guests */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
                    <label style={{ fontSize:'.75rem', fontWeight:600, letterSpacing:'.12em',
                      textTransform:'uppercase', color:'var(--brown-mid)' }}>Số khách</label>
                    <select value={bGuests} onChange={e=>setBGuests(e.target.value)}>
                      {['1 người','2 người','3 người','4 người','5 người','6 người',
                        '7–10 người','Trên 10 người'].map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  {/* Zone */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
                    <label style={{ fontSize:'.75rem', fontWeight:600, letterSpacing:'.12em',
                      textTransform:'uppercase', color:'var(--brown-mid)' }}>Khu vực ngồi</label>
                    <select value={bZone} onChange={e=>setBZone(e.target.value)}>
                      {['Trong nhà (máy lạnh)','Ngoài trời (sân vườn)',
                        'Phòng VIP riêng','Không yêu cầu'].map(z => <option key={z}>{z}</option>)}
                    </select>
                  </div>
                  {/* Note */}
                  <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:'.4rem' }}>
                    <label style={{ fontSize:'.75rem', fontWeight:600, letterSpacing:'.12em',
                      textTransform:'uppercase', color:'var(--brown-mid)' }}>Yêu cầu đặc biệt</label>
                    <textarea value={bNote} onChange={e=>setBNote(e.target.value)} rows={3}
                      placeholder="Dị ứng thực phẩm, tiệc sinh nhật, trang trí đặc biệt..." />
                  </div>
                  {/* Submit */}
                  <div style={{ gridColumn:'1/-1', textAlign:'center', marginTop:'.5rem' }}>
                    <button type="submit" style={{
                      background:'var(--gold)', color:'var(--brown)', border:'none',
                      padding:'1rem 3.5rem', fontSize:'.9rem', fontWeight:700,
                      letterSpacing:'.12em', textTransform:'uppercase', cursor:'pointer',
                      borderRadius:2, fontFamily:'inherit', transition:'all .2s'
                    }}
                      onMouseEnter={e=>{ e.target.style.background='var(--brown)'; e.target.style.color='var(--gold-light)'; e.target.style.transform='translateY(-2px)' }}
                      onMouseLeave={e=>{ e.target.style.background='var(--gold)'; e.target.style.color='var(--brown)'; e.target.style.transform='none' }}>
                      ✦ Xác Nhận Đặt Bàn ✦
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div style={{
                background:'linear-gradient(135deg,#3d2b1f,#6b4226)',
                color:'var(--gold-light)', padding:'3rem 2rem',
                textAlign:'center', borderRadius:4
              }}>
                <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🎊</div>
                <h3 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif",
                  fontSize:'1.8rem', fontWeight:700, marginBottom:'.75rem' }}>
                  Đặt bàn thành công!
                </h3>
                <p style={{ color:'rgba(232,201,122,.75)', fontSize:'.95rem', lineHeight:1.7 }}>
                  Chúng tôi sẽ liên hệ xác nhận qua điện thoại trong vài phút.<br/>
                  Hẹn gặp bạn tại nhà hàng!
                </p>
                <button onClick={() => navigate('/my-bookings')}
                  style={{ marginTop:'1.5rem', background:'var(--gold)', color:'var(--brown)',
                    border:'none', padding:'.75rem 2rem', fontWeight:700, fontSize:'.85rem',
                    letterSpacing:'.08em', textTransform:'uppercase', borderRadius:2,
                    cursor:'pointer', fontFamily:'inherit' }}>
                  Xem đặt bàn của tôi →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section style={{ ...S.section, background:'linear-gradient(135deg,var(--brown) 0%,#1a0e06 100%)' }}>
        <div style={{ textAlign:'center', maxWidth:480, margin:'0 auto 3rem' }}>
          <div style={{ ...S.eyebrow, color:'var(--gold-light)' }}>Cảm nhận</div>
          <h2 style={{ ...S.title, color:'var(--cream)' }}>Khách Hàng Nói Gì</h2>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', margin:'1rem auto', maxWidth:260 }}>
            <div style={{ flex:1, height:1, background:'rgba(201,168,76,.3)' }} />
            <span style={{ color:'var(--gold)' }}>✦</span>
            <div style={{ flex:1, height:1, background:'rgba(201,168,76,.3)' }} />
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1.75rem' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              background:'rgba(255,255,255,.04)', border:'1px solid rgba(201,168,76,.18)',
              padding:'2rem', borderRadius:4, transition:'border-color .2s'
            }}>
              <div style={{ color:'var(--gold-light)', fontSize:'.9rem', letterSpacing:'.12em', marginBottom:'.875rem' }}>
                {'★'.repeat(t.stars)}{'☆'.repeat(5-t.stars)}
              </div>
              <p style={{ fontStyle:'italic', color:'rgba(251,247,239,.78)',
                lineHeight:1.75, fontSize:'.9rem', marginBottom:'1.25rem' }}>"{t.text}"</p>
              <div style={{ fontSize:'.75rem', fontWeight:600, letterSpacing:'.1em',
                textTransform:'uppercase', color:'var(--gold)', display:'flex', alignItems:'center', gap:'.5rem' }}>
                <div style={{ width:24, height:1, background:'var(--gold)' }} />
                {t.author}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer style={{ background:'#110800', padding:'4rem 5% 2rem', borderTop:'1px solid rgba(201,168,76,.12)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'3rem', marginBottom:'3rem', flexWrap:'wrap' }}>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif",
              fontSize:'1.5rem', fontWeight:700, color:'var(--gold)',
              letterSpacing:'.04em', marginBottom:'.875rem' }}>
              DA<span style={{ fontStyle:'italic', color:'rgba(255,255,255,.45)' }}>bana</span>
            </div>
            <p style={{ fontSize:'.85rem', color:'rgba(255,255,255,.38)', lineHeight:1.75, maxWidth:300 }}>
              Nền tảng đặt bàn nhà hàng hàng đầu Việt Nam — kết nối thực khách với
              những trải nghiệm ẩm thực đáng nhớ.
            </p>
          </div>
          {[
            { title:'Khám phá', links:[['#restaurants','Nhà hàng nổi bật'],['#experience','Trải nghiệm'],['#booking','Đặt bàn ngay'],['/register?role=partner','Đối tác nhà hàng']] },
            { title:'Liên hệ', links:[['#','📞 1900 2088'],['#','✉️ hello@dabana.vn'],['#','📍 Hà Nội · HCM · Đà Nẵng'],['#','Hỗ trợ 24/7']] },
          ].map(col => (
            <div key={col.title}>
              <h4 style={{ fontSize:'.7rem', fontWeight:600, letterSpacing:'.2em',
                textTransform:'uppercase', color:'var(--gold)', marginBottom:'1.1rem' }}>{col.title}</h4>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'.625rem' }}>
                {col.links.map(([href, label]) => (
                  <li key={label}><a href={href} style={{ fontSize:'.85rem', color:'rgba(255,255,255,.38)',
                    transition:'color .2s' }}
                    onMouseEnter={e => e.target.style.color='var(--gold-light)'}
                    onMouseLeave={e => e.target.style.color='rgba(255,255,255,.38)'}>{label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:'1.5rem',
          display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'.75rem' }}>
          <p style={{ fontSize:'.78rem', color:'rgba(255,255,255,.22)' }}>© 2026 Dabana. Bảo lưu mọi quyền.</p>
          <p style={{ fontSize:'.78rem', color:'rgba(255,255,255,.22)' }}>Dự án tốt nghiệp KLHK3252601</p>
        </div>
      </footer>

    </div>
  )
}
