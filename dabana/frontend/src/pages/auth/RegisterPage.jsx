import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../../api'
import { User, Store } from 'lucide-react'

const RESEND_COOLDOWN_SECONDS = 60

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'CUSTOMER',
    restaurantName: '',
    restaurantPhone: '',
    description: '',
    website: ''
  })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('form') // form | otp
  const [otp, setOtp] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.register(form)
      if (form.role === 'RESTAURANT_PARTNER') {
        toast.success('Đăng ký thành công! Mã OTP đã được gửi đến email của bạn.')
        setStep('otp')
        setResendCooldown(RESEND_COOLDOWN_SECONDS)
      } else {
        toast.success('Đăng ký thành công! Bạn có thể đăng nhập ngay.')
        navigate('/login')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const identifier = form.email || form.phone
      await authApi.verifyOtp({ identifier, otpCode: otp })
      toast.success('Xác thực OTP thành công! Tài khoản và thông tin nhà hàng đang chờ quản trị viên duyệt.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP không hợp lệ')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return
    setResending(true)
    try {
      const identifier = form.email || form.phone
      await authApi.resendOtp({ identifier })
      toast.success('Đã gửi lại mã OTP, vui lòng kiểm tra email.')
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi lại OTP thất bại')
    } finally {
      setResending(false)
    }
  }

  if (step === 'otp') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: 380 }}>
        <h2 style={{ marginBottom: '1rem' }}>Xác thực OTP</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '.9rem' }}>
          Mã OTP đã được gửi đến email <strong>{form.email || form.phone}</strong>. Vui lòng kiểm tra hộp thư đến (và cả mục Spam). Mã có hiệu lực 5 phút.
        </p>
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
          <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Nhập mã 6 số" maxLength={6} required />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Đang xác thực...' : 'Xác nhận OTP'}
          </button>
        </form>
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={resendCooldown > 0 || resending}
          style={{
            marginTop: '.9rem', width: '100%', background: 'none', border: 'none',
            color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--brand)',
            fontWeight: 600, fontSize: '.85rem', cursor: resendCooldown > 0 ? 'default' : 'pointer',
          }}
        >
          {resending
            ? 'Đang gửi lại...'
            : resendCooldown > 0
              ? `Gửi lại mã sau ${resendCooldown}s`
              : 'Không nhận được email? Gửi lại mã OTP'}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
      <div className="card" style={{ width: '100%', maxWidth: 500 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', color: 'var(--brand)', marginBottom: '1.5rem' }}>
          Đăng ký tài khoản
        </h1>

        {/* Chọn vai trò */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1.25rem' }}>
          {[['CUSTOMER', User, 'Khách hàng'], ['RESTAURANT_PARTNER', Store, 'Nhà hàng đối tác']].map(([r, Icon, label]) => (
            <button key={r} type="button"
              onClick={() => setForm(p => ({ ...p, role: r }))}
              style={{
                padding: '.75rem', borderRadius: 10, border: '2px solid',
                borderColor: form.role === r ? 'var(--brand)' : 'var(--border)',
                background: form.role === r ? 'var(--brand-light)' : 'var(--white)',
                color: form.role === r ? 'var(--brand-dark)' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '.85rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem'
              }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>

          {/* Thông tin cá nhân */}
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand)', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginTop: '4px' }}>
            Thông tin tài khoản đại diện
          </div>

          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Họ tên *</label>
            <input value={form.fullName} onChange={set('fullName')} placeholder="Nguyễn Văn A" required />
          </div>
          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Email *</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="abc@gmail.com" required />
          </div>
          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Số điện thoại *</label>
            <input value={form.phone} onChange={set('phone')} placeholder="0901234567" required />
          </div>
          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Mật khẩu *</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="Tối thiểu 8 ký tự" required />
          </div>

          {/* Phần mở rộng cho Nhà hàng đối tác */}
          {form.role === 'RESTAURANT_PARTNER' && (
            <>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand)', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginTop: '10px' }}>
                Thông tin nhà hàng ban đầu (Chờ duyệt)
              </div>

              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Tên thương hiệu nhà hàng *</label>
                <input value={form.restaurantName} onChange={set('restaurantName')} placeholder="Ví dụ: Gogi House - Trần Duy Hưng" required={form.role === 'RESTAURANT_PARTNER'} />
              </div>

              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Số điện thoại nhà hàng</label>
                <input value={form.restaurantPhone} onChange={set('restaurantPhone')} placeholder="0243123456" />
              </div>

              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Mô tả tổng quan</label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Giới thiệu ngắn gọn về nhà hàng..."
                  rows={2}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Website (Có thể bỏ trống)</label>
                <input value={form.website} onChange={set('website')} placeholder="https://example.com" />
              </div>
            </>
          )}

          <button className="btn-primary" type="submit" disabled={loading} style={{ padding: '.8rem', marginTop: '.5rem' }}>
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '.87rem', color: 'var(--text-muted)' }}>
          Đã có tài khoản? <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}