import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../../api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.forgotPassword({ email })
      setSent(true)
      toast.success('Mật khẩu mới đã được gửi về email của bạn!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.')
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
          Quên mật khẩu
        </h2>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '1rem' }}>
              Chúng tôi đã gửi mật khẩu mới đến email <b>{email}</b>.
              Vui lòng kiểm tra hộp thư (kể cả mục spam) và đăng nhập lại bằng mật khẩu mới.
            </p>
            <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
            <div>
              <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>
                Email đăng ký
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abc@gmail.com"
                required
              />
            </div>
            <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Nhập email bạn đã dùng để đăng ký. Chúng tôi sẽ gửi một mật khẩu mới về email này,
              bạn có thể đổi lại mật khẩu sau khi đăng nhập.
            </p>
            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '.5rem', padding: '.8rem' }}>
              {loading ? 'Đang gửi...' : 'Gửi mật khẩu mới'}
            </button>
          </form>
        )}

        {!sent && (
          <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '.87rem', color: 'var(--text-muted)' }}>
            Nhớ ra mật khẩu rồi? <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>Đăng nhập</Link>
          </p>
        )}
      </div>
    </div>
  )
}
