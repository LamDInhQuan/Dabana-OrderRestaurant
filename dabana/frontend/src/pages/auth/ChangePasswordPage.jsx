import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../../api'

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (form.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Xác nhận mật khẩu không khớp')
      return
    }

    setLoading(true)
    try {
      await authApi.changePassword(form)
      toast.success('Đổi mật khẩu thành công!')
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      navigate(-1)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center', color: 'var(--brand)' }}>
          Đổi mật khẩu
        </h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>
              Mật khẩu hiện tại
            </label>
            <input type="password" value={form.oldPassword} onChange={set('oldPassword')} placeholder="••••••••" required />
          </div>
          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>
              Mật khẩu mới
            </label>
            <input type="password" value={form.newPassword} onChange={set('newPassword')} placeholder="Tối thiểu 6 ký tự" required />
          </div>
          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>
              Xác nhận mật khẩu mới
            </label>
            <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••" required />
          </div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '.5rem', padding: '.8rem' }}>
            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '.87rem', color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--brand)', fontWeight: 600 }}>Quay lại trang chủ</Link>
        </p>
      </div>
    </div>
  )
}
