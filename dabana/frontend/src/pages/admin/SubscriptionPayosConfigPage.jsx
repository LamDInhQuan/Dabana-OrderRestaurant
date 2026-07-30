import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import { subscriptionApi } from '../../api'

const EMPTY_FORM = { clientId: '', apiKey: '', checksumKey: '', webhookUrl: '', isActive: true }

export default function SubscriptionPayosConfigPage() {
  const [config, setConfig] = useState(null) // config hiện tại từ server (đã mask key)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    subscriptionApi.adminGetPayosConfig()
      .then(r => {
        const data = r.data?.data
        setConfig(data)
        if (data) {
          setForm(f => ({ ...f, clientId: data.clientId || '', webhookUrl: data.webhookUrl || '', isActive: data.isActive }))
        }
      })
      .catch(() => toast.error('Không thể tải cấu hình payOS'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.clientId.trim()) {
      toast.error('Vui lòng nhập Client ID'); return
    }
    if (!config?.configured && (!form.apiKey.trim() || !form.checksumKey.trim())) {
      toast.error('Lần cấu hình đầu tiên bắt buộc phải nhập đủ API Key và Checksum Key'); return
    }
    setSaving(true)
    try {
      // apiKey/checksumKey để trống = giữ nguyên key cũ (BE quy ước: chỉ đổi khi có giá trị mới)
      await subscriptionApi.adminSavePayosConfig(form)
      toast.success('Đã lưu cấu hình payOS.')
      setForm(f => ({ ...f, apiKey: '', checksumKey: '' })) // xóa khỏi form ngay sau khi lưu, không giữ trong state
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu cấu hình')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout
      title="Cấu hình payOS - Thu phí nền tảng"
      subtitle="Tài khoản payOS DUY NHẤT dùng chung để thu phí subscription từ nhà hàng đối tác (khác với tài khoản payOS riêng của từng chi nhánh dùng để nhận tiền cọc khách đặt bàn)."
    >
      {loading ? <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p> : (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <span className={`badge ${config?.configured ? 'badge-green' : 'badge-red'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
                {config?.configured ? <><Check size={14} /> Đã cấu hình</> : <><X size={14} /> Chưa cấu hình</>}
              </span>
              {config?.isActive === false && <span className="badge badge-gray">Đang tắt</span>}
            </div>
            {!config?.configured && (
              <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginTop: '.6rem' }}>
                Chưa có tài khoản payOS nào được cấu hình - nhà hàng sẽ không thể tạo link thanh toán
                cho đến khi Admin nhập đủ thông tin bên dưới.
              </p>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Thông tin tài khoản payOS</h3>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 520 }}>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Client ID</label>
                <input value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                  placeholder="Client ID lấy từ my.payos.vn" />
              </div>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>
                  API Key {config?.configured && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>— để trống nếu không đổi</span>}
                </label>
                <input type="password" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                  placeholder={config?.configured ? '••••••••••••' : 'Bắt buộc nhập lần đầu'} />
              </div>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>
                  Checksum Key {config?.configured && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>— để trống nếu không đổi</span>}
                </label>
                <input type="password" value={form.checksumKey} onChange={e => setForm(f => ({ ...f, checksumKey: e.target.value }))}
                  placeholder={config?.configured ? '••••••••••••' : 'Bắt buộc nhập lần đầu'} />
              </div>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Webhook URL</label>
                <input value={form.webhookUrl} onChange={e => setForm(f => ({ ...f, webhookUrl: e.target.value }))}
                  placeholder="https://your-domain.com/api/subscriptions/payos/webhook" />
                <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.3rem' }}>
                  Hệ thống sẽ thử tự động đăng ký URL này với payOS khi lưu. Nếu thất bại (ví dụ do thay đổi SDK),
                  vào <strong>my.payos.vn</strong> để đăng ký thủ công đúng URL trên.
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.85rem' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                Đang sử dụng tài khoản này để thu phí
              </label>
              <button className="btn-primary" type="submit" disabled={saving} style={{ alignSelf: 'flex-start' }}>
                {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </form>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
