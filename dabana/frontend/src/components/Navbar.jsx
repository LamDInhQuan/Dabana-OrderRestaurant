import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { auth, logout, isRole } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Đã đăng xuất')
    navigate('/login')
  }

  return (
    <nav style={{
      background: 'var(--white)', borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100, boxShadow: 'var(--shadow-sm)'
    }}>
      <div className="page-container flex items-center justify-between" style={{ height: 60 }}>
        <Link to="/" style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--brand)' }}>
          🍽️ Dabana
        </Link>

        <div className="flex items-center gap-3">
          {!auth ? (
            <>
              <Link to="/login"><button className="btn-outline btn-sm">Đăng nhập</button></Link>
              <Link to="/register"><button className="btn-primary btn-sm">Đăng ký</button></Link>
            </>
          ) : (
            <>
              {isRole('CUSTOMER') && (
                <Link to="/my-bookings"><button className="btn-outline btn-sm">Đặt bàn của tôi</button></Link>
              )}
              {isRole('RESTAURANT_PARTNER') && (
                <Link to="/partner"><button className="btn-outline btn-sm">Quản lý</button></Link>
              )}
              {isRole('ADMIN') && (
                <Link to="/admin"><button className="btn-outline btn-sm">Admin</button></Link>
              )}
              <span style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>
                {auth.fullName}
              </span>
              <button className="btn-danger btn-sm" onClick={handleLogout}>Đăng xuất</button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
