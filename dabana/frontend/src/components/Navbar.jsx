import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { auth, logout, isRole } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    logout()
    toast.success('Đã đăng xuất')
    navigate('/login')
  }

  const navStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
    height: 70,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 5%',
    transition: 'all .3s',
    background: scrolled ? 'rgba(251,247,239,.97)' : 'transparent',
    backdropFilter: scrolled ? 'blur(8px)' : 'none',
    boxShadow: scrolled ? '0 2px 20px rgba(61,43,31,.1)' : 'none',
  }

  const linkColor = scrolled ? 'var(--brown)' : 'rgba(255,255,255,.9)'
  const logoColor = scrolled ? 'var(--gold)' : 'var(--gold-light)'

  return (
    <>
      <nav style={navStyle}>
        {/* Logo */}
        <Link to="/" style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '1.6rem', fontWeight: 700,
          color: logoColor, letterSpacing: '.04em',
          transition: 'color .3s'
        }}>
          DA<span style={{ fontStyle: 'italic', color: scrolled ? 'var(--brown-mid)' : 'rgba(255,255,255,.7)' }}>bana</span>
        </Link>

        {/* Desktop links */}
        <ul style={{ display: 'flex', gap: '2rem', listStyle: 'none', alignItems: 'center' }}>
          {[
            ['/#restaurants', 'Nhà Hàng'],
            ['/#experience', 'Trải Nghiệm'],
            ['/#booking', 'Đặt Bàn'],
          ].map(([href, label]) => (
            <li key={href} style={{ display: 'none' }} className="nav-desktop-link">
              <a href={href} style={{
                fontSize: '.8rem', fontWeight: 500, color: linkColor,
                letterSpacing: '.1em', textTransform: 'uppercase',
                transition: 'color .2s',
              }}
                onMouseEnter={e => e.target.style.color = 'var(--gold-light)'}
                onMouseLeave={e => e.target.style.color = linkColor}
              >{label}</a>
            </li>
          ))}
        </ul>

        {/* Right side actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          {!auth ? (
            <>
              <Link to="/login">
                <button style={{
                  background: 'transparent', color: linkColor,
                  border: `1.5px solid ${scrolled ? 'var(--gold)' : 'rgba(255,255,255,.5)'}`,
                  padding: '.45rem 1.1rem', fontSize: '.78rem', fontWeight: 600,
                  letterSpacing: '.08em', textTransform: 'uppercase', borderRadius: 2,
                  cursor: 'pointer', transition: 'all .2s'
                }}>Đăng nhập</button>
              </Link>
              <Link to="/register">
                <button style={{
                  background: 'var(--gold)', color: 'var(--brown)',
                  border: 'none', padding: '.45rem 1.25rem', fontSize: '.78rem',
                  fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
                  borderRadius: 2, cursor: 'pointer', transition: 'all .2s'
                }}>Đăng ký</button>
              </Link>
            </>
          ) : (
            <>
              {isRole('CUSTOMER') && (
                <Link to="/my-bookings">
                  <button style={{
                    background: 'transparent', color: linkColor,
                    border: `1.5px solid ${scrolled ? 'var(--gold)' : 'rgba(255,255,255,.5)'}`,
                    padding: '.45rem 1.1rem', fontSize: '.78rem', fontWeight: 600,
                    letterSpacing: '.06em', textTransform: 'uppercase', borderRadius: 2,
                    cursor: 'pointer'
                  }}>Đặt bàn của tôi</button>
                </Link>
              )}
              {isRole('RESTAURANT_PARTNER') && (
                <Link to="/partner">
                  <button style={{
                    background: 'transparent', color: linkColor,
                    border: `1.5px solid ${scrolled ? 'var(--gold)' : 'rgba(255,255,255,.5)'}`,
                    padding: '.45rem 1.1rem', fontSize: '.78rem', fontWeight: 600,
                    letterSpacing: '.06em', textTransform: 'uppercase', borderRadius: 2,
                    cursor: 'pointer'
                  }}>Quản lý</button>
                </Link>
              )}
              {isRole('ADMIN') && (
                <Link to="/admin">
                  <button style={{
                    background: 'transparent', color: linkColor,
                    border: `1.5px solid ${scrolled ? 'var(--gold)' : 'rgba(255,255,255,.5)'}`,
                    padding: '.45rem 1.1rem', fontSize: '.78rem', fontWeight: 600,
                    letterSpacing: '.06em', textTransform: 'uppercase', borderRadius: 2,
                    cursor: 'pointer'
                  }}>Admin</button>
                </Link>
              )}
              <span style={{ fontSize: '.82rem', color: linkColor, fontWeight: 500 }}>
                {auth.fullName}
              </span>
              <button onClick={handleLogout} style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                padding: '.45rem 1rem', fontSize: '.78rem', fontWeight: 600,
                borderRadius: 2, cursor: 'pointer'
              }}>Đăng xuất</button>
            </>
          )}
        </div>
      </nav>

      {/* Google Font import */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap" rel="stylesheet" />
    </>
  )
}
