import { useState, useEffect } from 'react'
import { ShieldAlert, ShieldCheck, Clock, CheckCircle2, AlertTriangle, Info, Sparkles, RefreshCw, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import { systemPolicyApi } from '../../api'

export default function SystemPolicySetting() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    gracePeriodMinutes: 15,
    enabled: true,
    description: '',
  })

  const loadPolicy = () => {
    setLoading(true)
    systemPolicyApi.getCancellationGracePeriod()
      .then(res => {
        const data = res.data?.data
        if (data) {
          setForm({
            gracePeriodMinutes: data.gracePeriodMinutes ?? 15,
            enabled: data.enabled ?? true,
            description: data.description || '',
          })
        }
      })
      .catch(err => {
        console.error('Lỗi tải chính sách hệ thống:', err)
        toast.error('Không thể tải cấu hình chính sách hệ thống')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPolicy()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.gracePeriodMinutes < 0) {
      toast.error('Thời gian ân hạn phải lớn hơn hoặc bằng 0 phút')
      return
    }

    setSaving(true)
    try {
      await systemPolicyApi.updateCancellationGracePeriod({
        gracePeriodMinutes: Number(form.gracePeriodMinutes),
        enabled: form.enabled,
        description: form.description.trim(),
      })
      toast.success('Đã cập nhật chính sách ân hạn huỷ đơn thành công!')
      loadPolicy()
    } catch (err) {
      console.error('Lỗi cập nhật chính sách:', err)
      toast.error(err.response?.data?.message || 'Không thể cập nhật chính sách')
    } finally {
      setSaving(false)
    }
  }

  const setPresetMinutes = (mins) => {
    setForm(prev => ({ ...prev, gracePeriodMinutes: mins }))
  }

  return (
    <AdminLayout
      title="Chính sách hệ thống (System Policies)"
      subtitle="Cấu hình quy định ân hạn huỷ đơn hoàn cọc áp dụng chung cho toàn bộ đơn đặt bàn trên nền tảng Dabana."
    >
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ marginBottom: '.5rem' }} />
          <p>Đang tải dữ liệu chính sách...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* CỘT TRÁI: FORM CẤU HÌNH */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: form.enabled ? '#ECFDF5' : '#FEF2F2',
                color: form.enabled ? '#059669' : '#DC2626',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {form.enabled ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Thời gian ân hạn huỷ đơn (Cancellation Grace Period)
                </h3>
                <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
                  Hoàn 100% tiền cọc cho khách hàng nếu huỷ đơn ngay sau khi đơn được xác nhận
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Trạng thái Bật / Tắt */}
              <div style={{
                background: form.enabled ? '#F0FDF4' : '#F9FAFB',
                border: `1.5px solid ${form.enabled ? '#86EFAC' : '#E5E7EB'}`,
                padding: '1rem',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.9rem', color: form.enabled ? '#166534' : '#374151' }}>
                    {form.enabled ? 'Đang kích hoạt chính sách ân hạn' : 'Đang tắt chính sách ân hạn'}
                  </div>
                  <div style={{ fontSize: '.78rem', color: form.enabled ? '#15803D' : '#6B7280', marginTop: '2px' }}>
                    {form.enabled
                      ? 'Áp dụng hoàn 100% cọc cho tất cả đơn CONFIRMED bị huỷ trong thời gian ân hạn.'
                      : 'Hệ thống sẽ áp dụng ngay chính sách huỷ cọc của chi nhánh mà không có ân hạn.'}
                  </div>
                </div>

                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
                    style={{ width: 20, height: 20, accentColor: '#10B981', cursor: 'pointer' }}
                  />
                </label>
              </div>

              {/* Thời gian ân hạn (Phút) */}
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.4rem', color: 'var(--text-primary)' }}>
                  <Clock size={15} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  Số phút ân hạn sau khi đơn CONFIRMED:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <input
                    type="number"
                    min="0"
                    max="1440"
                    value={form.gracePeriodMinutes}
                    onChange={e => setForm(f => ({ ...f, gracePeriodMinutes: Number(e.target.value) }))}
                    disabled={!form.enabled}
                    style={{
                      width: 120,
                      padding: '.6rem .75rem',
                      borderRadius: 8,
                      border: '1.5px solid var(--border)',
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      textAlign: 'center'
                    }}
                    required
                  />
                  <span style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>phút</span>
                </div>

                {/* Preset gợi ý nhanh */}
                <div style={{ display: 'flex', gap: '.4rem', marginTop: '.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Gợi ý nhanh:</span>
                  {[5, 10, 15, 30, 60].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      disabled={!form.enabled}
                      onClick={() => setPresetMinutes(mins)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '.75rem',
                        borderRadius: 6,
                        border: form.gracePeriodMinutes === mins ? '1px solid #10B981' : '1px solid var(--border)',
                        background: form.gracePeriodMinutes === mins ? '#ECFDF5' : '#fff',
                        color: form.gracePeriodMinutes === mins ? '#059669' : '#4B5563',
                        cursor: form.enabled ? 'pointer' : 'not-allowed',
                        fontWeight: form.gracePeriodMinutes === mins ? 600 : 400
                      }}
                    >
                      {mins} phút
                    </button>
                  ))}
                </div>
              </div>

              {/* Mô tả giải thích chính sách */}
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.4rem', color: 'var(--text-primary)' }}>
                  <Info size={15} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  Mô tả / Thông báo chính sách:
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Nhập nội dung mô tả chính sách hiển thị cho khách hàng và nhà hàng đối tác..."
                  style={{
                    width: '100%',
                    padding: '.6rem .75rem',
                    borderRadius: 8,
                    border: '1.5px solid var(--border)',
                    fontSize: '.85rem',
                    resize: 'vertical'
                  }}
                />
                <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                  Nội dung này sẽ được tham chiếu trong thông báo và các tài liệu chính sách của nền tảng.
                </span>
              </div>

              {/* Nút lưu */}
              <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '.4rem',
                    padding: '.6rem 1.25rem',
                    fontWeight: 600,
                    borderRadius: 8
                  }}
                >
                  <Save size={16} />
                  {saving ? 'Đang lưu cấu hình...' : 'Lưu chính sách'}
                </button>

                <button
                  type="button"
                  onClick={loadPolicy}
                  disabled={saving}
                  style={{
                    padding: '.6rem 1rem',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: '#fff',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '.85rem',
                    fontWeight: 500
                  }}
                >
                  Khôi phục
                </button>
              </div>
            </form>
          </div>

          {/* CỘT PHẢI: XEM TRƯỚC (PREVIEW & GUIDELINES) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Card Preview cơ chế */}
            <div className="card" style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid #E5E7EB', background: '#FAFAFA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.75rem', color: '#1F2937' }}>
                <Sparkles size={18} color="#D97706" />
                <h4 style={{ margin: 0, fontSize: '.95rem', fontWeight: 700 }}>Minh hoạ luồng áp dụng</h4>
              </div>

              <div style={{ fontSize: '.83rem', color: '#4B5563', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '.6rem', padding: '.6rem .75rem', borderRadius: 8, background: '#fff', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontWeight: 600, color: '#111827' }}>1. Khách đặt cọc thành công</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Đơn chuyển sang trạng thái <strong>CONFIRMED</strong> và lưu mốc thời gian xác nhận.</div>
                </div>

                <div style={{ marginBottom: '.6rem', padding: '.6rem .75rem', borderRadius: 8, background: form.enabled ? '#ECFDF5' : '#F3F4F6', border: `1px solid ${form.enabled ? '#A7F3D0' : '#E5E7EB'}` }}>
                  <div style={{ fontWeight: 600, color: form.enabled ? '#065F46' : '#6B7280' }}>
                    2. Trong vòng {form.enabled ? `${form.gracePeriodMinutes} phút` : '0 phút (Đang tắt)'}
                  </div>
                  <div style={{ fontSize: '.75rem', color: form.enabled ? '#047857' : '#6B7280' }}>
                    {form.enabled
                      ? '✨ Nếu khách huỷ: Tự động hoàn 100% tiền cọc (bỏ qua quy định huỷ muộn/sát giờ).'
                      : 'Chính sách ân hạn đang tắt - áp dụng quy tắc phạt/hoàn cọc của chi nhánh.'}
                  </div>
                </div>

                <div style={{ padding: '.6rem .75rem', borderRadius: 8, background: '#fff', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontWeight: 600, color: '#111827' }}>3. Sau thời gian ân hạn</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Hệ thống tự động chuyển về áp dụng chính sách huỷ cọc riêng biệt của chi nhánh.</div>
                </div>
              </div>
            </div>

            {/* Card Lưu ý nghiệp vụ */}
            <div className="card" style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid #FEF3C7', background: '#FFFBEB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.5rem', color: '#92400E' }}>
                <AlertTriangle size={17} />
                <h4 style={{ margin: 0, fontSize: '.9rem', fontWeight: 700 }}>Lưu ý hiển thị</h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '.78rem', color: '#B45309', lineHeight: '1.5' }}>
                <li>Chính sách này được thông báo công khai ở thanh bảo chứng đặt bàn của Khách hàng.</li>
                <li>Nhà hàng đối tác có thể xem thông báo này trong mục cấu hình chính sách huỷ cọc của Chi nhánh.</li>
                <li>Khi đơn được huỷ trong thời gian ân hạn, hệ thống tự động ghi nhận lý do hoàn tiền 100% và gửi thông báo cho cả 2 bên.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
