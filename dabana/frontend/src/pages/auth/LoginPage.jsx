import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: res } = await authApi.login(form)
      const userData = res.data
      login(userData)
      toast.success(`Chào mừng, ${userData.fullName}!`)
      if (userData.role === 'ADMIN')               navigate('/admin')
      else if (userData.role === 'RESTAURANT_PARTNER') navigate('/partner')
      else                                          navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center', color: 'var(--brand)' }}>
          🍽️ Dabana
        </h1>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Đăng nhập tài khoản
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>
              Email hoặc Số điện thoại
            </label>
            <input value={form.identifier} onChange={set('identifier')} placeholder="abc@gmail.com" required />
          </div>
          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>
              Mật khẩu
            </label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required />
          </div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '.5rem', padding: '.8rem' }}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        {/* --- Phần UI mới cho Google Login --- */}
        {/* <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
          <span style={{ margin: '0 10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>hoặc</span>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Lỗi kết nối với Google')}
            theme="outline"
            size="large"
            text="signin_with"
            shape="rectangular"
          />
        </div> */}
        {/* --------------------------------- */}
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '.87rem', color: 'var(--text-muted)' }}>
          Chưa có tài khoản? <Link to="/register" style={{ color: 'var(--brand)', fontWeight: 600 }}>Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  )
}
