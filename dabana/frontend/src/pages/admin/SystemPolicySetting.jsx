import { useState, useEffect } from 'react'
import { ShieldAlert, ShieldCheck, Clock, CheckCircle2, AlertTriangle, Info, Sparkles, RefreshCw, Save, Store, UserCheck, CalendarX } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import { systemPolicyApi } from '../../api'

export default function SystemPolicySetting() {
  const [activeTab, setActiveTab] = useState('GRACE_PERIOD') // 'GRACE_PERIOD' | 'RESTAURANT_LEAD_TIME'
  const [loading, setLoading] = useState(true)
  const [savingGrace, setSavingGrace] = useState(false)
  const [savingRestaurant, setSavingRestaurant] = useState(false)

  // Form 1: Grace period
  const [graceForm, setGraceForm] = useState({
    gracePeriodMinutes: 15,
    enabled: true,
    description: '',
  })

  // Form 2: Restaurant cancellation lead time
  const [restaurantForm, setRestaurantForm] = useState({
    minHoursBeforeReservation: 24,
    enabled: true,
    description: '',
  })

  const loadAllPolicies = () => {
    setLoading(true)
    Promise.all([
      systemPolicyApi.getCancellationGracePeriod(),
      systemPolicyApi.getRestaurantCancellationLeadTime()
    ])
      .then(([graceRes, restRes]) => {
        const graceData = graceRes.data?.data
        if (graceData) {
          setGraceForm({
            gracePeriodMinutes: graceData.gracePeriodMinutes ?? 15,
            enabled: graceData.enabled ?? true,
            description: graceData.description || '',
          })
        }

        const restData = restRes.data?.data
        if (restData) {
          setRestaurantForm({
            minHoursBeforeReservation: restData.minHoursBeforeReservation ?? 24,
            enabled: restData.enabled ?? true,
            description: restData.description || '',
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
    loadAllPolicies()
  }, [])

  const handleSaveGrace = async (e) => {
    e.preventDefault()
    if (graceForm.gracePeriodMinutes < 0) {
      toast.error('Thời gian ân hạn phải lớn hơn hoặc bằng 0 phút')
      return
    }

    setSavingGrace(true)
    try {
      await systemPolicyApi.updateCancellationGracePeriod({
        gracePeriodMinutes: Number(graceForm.gracePeriodMinutes),
        enabled: graceForm.enabled,
        description: graceForm.description.trim(),
      })
      toast.success('Đã cập nhật chính sách ân hạn huỷ đơn thành công!')
      loadAllPolicies()
    } catch (err) {
      console.error('Lỗi cập nhật chính sách ân hạn:', err)
      toast.error(err.response?.data?.message || 'Không thể cập nhật chính sách')
    } finally {
      setSavingGrace(false)
    }
  }

  const handleSaveRestaurant = async (e) => {
    e.preventDefault()
    if (restaurantForm.minHoursBeforeReservation < 0) {
      toast.error('Số giờ tối thiểu phải lớn hơn hoặc bằng 0')
      return
    }

    setSavingRestaurant(true)
    try {
      await systemPolicyApi.updateRestaurantCancellationLeadTime({
        minHoursBeforeReservation: Number(restaurantForm.minHoursBeforeReservation),
        enabled: restaurantForm.enabled,
        description: restaurantForm.description.trim(),
      })
      toast.success('Đã cập nhật quy định thời gian nhà hàng huỷ đơn thành công!')
      loadAllPolicies()
    } catch (err) {
      console.error('Lỗi cập nhật quy định nhà hàng huỷ đơn:', err)
      toast.error(err.response?.data?.message || 'Không thể cập nhật quy định')
    } finally {
      setSavingRestaurant(false)
    }
  }

  return (
    <AdminLayout
      title="Chính sách hệ thống (System Policies)"
      subtitle="Cấu hình các chính sách và quy định toàn cục áp dụng cho Khách hàng và Nhà hàng đối tác trên nền tảng Dabana."
    >
      {/* TABS SELECTOR */}
      <div style={{
        display: 'flex',
        gap: '.5rem',
        borderBottom: '1px solid var(--border)',
        marginBottom: '1.5rem',
        paddingBottom: '.25rem'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('GRACE_PERIOD')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '.5rem',
            padding: '.6rem 1.1rem',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'GRACE_PERIOD' ? 'var(--primary-light, #EFF6FF)' : 'transparent',
            color: activeTab === 'GRACE_PERIOD' ? 'var(--primary, #2563EB)' : 'var(--text-muted)',
            fontWeight: activeTab === 'GRACE_PERIOD' ? 700 : 500,
            fontSize: '.9rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'GRACE_PERIOD' ? '2.5px solid var(--primary, #2563EB)' : '2.5px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <UserCheck size={18} />
          Ân hạn huỷ đơn cho Khách hàng
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RESTAURANT_LEAD_TIME')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '.5rem',
            padding: '.6rem 1.1rem',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'RESTAURANT_LEAD_TIME' ? 'var(--primary-light, #EFF6FF)' : 'transparent',
            color: activeTab === 'RESTAURANT_LEAD_TIME' ? 'var(--primary, #2563EB)' : 'var(--text-muted)',
            fontWeight: activeTab === 'RESTAURANT_LEAD_TIME' ? 700 : 500,
            fontSize: '.9rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'RESTAURANT_LEAD_TIME' ? '2.5px solid var(--primary, #2563EB)' : '2.5px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <Store size={18} />
          Quy định Nhà hàng huỷ đơn
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ marginBottom: '.5rem' }} />
          <p>Đang tải dữ liệu chính sách...</p>
        </div>
      ) : activeTab === 'GRACE_PERIOD' ? (
        /* ================= TAB 1: ÂN HẠN HUỶ ĐƠN (KHÁCH HÀNG) ================= */
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* CỘT TRÁI: FORM CẤU HÌNH */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: graceForm.enabled ? '#ECFDF5' : '#FEF2F2',
                color: graceForm.enabled ? '#059669' : '#DC2626',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {graceForm.enabled ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Thời gian ân hạn huỷ đơn (Cancellation Grace Period)
                </h3>
                <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
                  Hoàn 100% tiền cọc cho khách hàng nếu huỷ đơn ngay sau khi đơn được xác nhận
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveGrace} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Trạng thái Bật / Tắt */}
              <div style={{
                background: graceForm.enabled ? '#F0FDF4' : '#F9FAFB',
                border: `1.5px solid ${graceForm.enabled ? '#86EFAC' : '#E5E7EB'}`,
                padding: '1rem',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.9rem', color: graceForm.enabled ? '#166534' : '#374151' }}>
                    {graceForm.enabled ? 'Đang kích hoạt chính sách ân hạn' : 'Đang tắt chính sách ân hạn'}
                  </div>
                  <div style={{ fontSize: '.78rem', color: graceForm.enabled ? '#15803D' : '#6B7280', marginTop: '2px' }}>
                    {graceForm.enabled
                      ? 'Áp dụng hoàn 100% cọc cho tất cả đơn CONFIRMED bị huỷ trong thời gian ân hạn.'
                      : 'Hệ thống sẽ áp dụng ngay chính sách huỷ cọc của chi nhánh mà không có ân hạn.'}
                  </div>
                </div>

                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={graceForm.enabled}
                    onChange={e => setGraceForm(f => ({ ...f, enabled: e.target.checked }))}
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
                    value={graceForm.gracePeriodMinutes}
                    onChange={e => setGraceForm(f => ({ ...f, gracePeriodMinutes: Number(e.target.value) }))}
                    disabled={!graceForm.enabled}
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
                      disabled={!graceForm.enabled}
                      onClick={() => setGraceForm(f => ({ ...f, gracePeriodMinutes: mins }))}
                      style={{
                        padding: '2px 8px',
                        fontSize: '.75rem',
                        borderRadius: 6,
                        border: graceForm.gracePeriodMinutes === mins ? '1px solid #10B981' : '1px solid var(--border)',
                        background: graceForm.gracePeriodMinutes === mins ? '#ECFDF5' : '#fff',
                        color: graceForm.gracePeriodMinutes === mins ? '#059669' : '#4B5563',
                        cursor: graceForm.enabled ? 'pointer' : 'not-allowed',
                        fontWeight: graceForm.gracePeriodMinutes === mins ? 600 : 400
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
                  value={graceForm.description}
                  onChange={e => setGraceForm(f => ({ ...f, description: e.target.value }))}
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
              </div>

              {/* Nút lưu */}
              <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
                <button
                  type="submit"
                  disabled={savingGrace}
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
                  {savingGrace ? 'Đang lưu cấu hình...' : 'Lưu chính sách ân hạn'}
                </button>

                <button
                  type="button"
                  onClick={loadAllPolicies}
                  disabled={savingGrace}
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

          {/* CỘT PHẢI: XEM TRƯỚC (PREVIEW) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

                <div style={{ marginBottom: '.6rem', padding: '.6rem .75rem', borderRadius: 8, background: graceForm.enabled ? '#ECFDF5' : '#F3F4F6', border: `1px solid ${graceForm.enabled ? '#A7F3D0' : '#E5E7EB'}` }}>
                  <div style={{ fontWeight: 600, color: graceForm.enabled ? '#065F46' : '#6B7280' }}>
                    2. Trong vòng {graceForm.enabled ? `${graceForm.gracePeriodMinutes} phút` : '0 phút (Đang tắt)'}
                  </div>
                  <div style={{ fontSize: '.75rem', color: graceForm.enabled ? '#047857' : '#6B7280' }}>
                    {graceForm.enabled
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

            <div className="card" style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid #FEF3C7', background: '#FFFBEB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.5rem', color: '#92400E' }}>
                <AlertTriangle size={17} />
                <h4 style={{ margin: 0, fontSize: '.9rem', fontWeight: 700 }}>Lưu ý hiển thị</h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '.78rem', color: '#B45309', lineHeight: '1.5' }}>
                <li>Chính sách này được thông báo công khai ở thanh bảo chứng đặt bàn của Khách hàng.</li>
                <li>Nhà hàng đối tác có thể xem thông báo này trong mục cấu hình chính sách huỷ cọc của Chi nhánh.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* ================= TAB 2: QUY ĐỊNH NHÀ HÀNG HUỶ ĐƠN (ĐỐI TÁC) ================= */
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* CỘT TRÁI: FORM CẤU HÌNH */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: restaurantForm.enabled ? '#EFF6FF' : '#FEF2F2',
                color: restaurantForm.enabled ? '#2563EB' : '#DC2626',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <CalendarX size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Thời gian tối thiểu Nhà hàng được phép huỷ đơn của khách
                </h3>
                <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
                  Chặn nhà hàng huỷ đơn sát giờ hẹn nhằm bảo vệ kế hoạch và trải nghiệm của khách hàng
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveRestaurant} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Trạng thái Bật / Tắt */}
              <div style={{
                background: restaurantForm.enabled ? '#F0FDF4' : '#F9FAFB',
                border: `1.5px solid ${restaurantForm.enabled ? '#86EFAC' : '#E5E7EB'}`,
                padding: '1rem',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.9rem', color: restaurantForm.enabled ? '#166534' : '#374151' }}>
                    {restaurantForm.enabled ? 'Đang kích hoạt quy định giới hạn thời gian' : 'Đang tắt quy định giới hạn thời gian'}
                  </div>
                  <div style={{ fontSize: '.78rem', color: restaurantForm.enabled ? '#15803D' : '#6B7280', marginTop: '2px' }}>
                    {restaurantForm.enabled
                      ? `Nhà hàng chỉ được huỷ đơn trước giờ nhận bàn tối thiểu ${restaurantForm.minHoursBeforeReservation} giờ.`
                      : 'Nhà hàng có thể huỷ đơn bất cứ lúc nào trước khi khách check-in.'}
                  </div>
                </div>

                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={restaurantForm.enabled}
                    onChange={e => setRestaurantForm(f => ({ ...f, enabled: e.target.checked }))}
                    style={{ width: 20, height: 20, accentColor: '#10B981', cursor: 'pointer' }}
                  />
                </label>
              </div>

              {/* Số giờ tối thiểu (Giờ) */}
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.4rem', color: 'var(--text-primary)' }}>
                  <Clock size={15} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  Số giờ tối thiểu trước giờ nhận bàn được phép huỷ:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <input
                    type="number"
                    min="0"
                    max="720"
                    value={restaurantForm.minHoursBeforeReservation}
                    onChange={e => setRestaurantForm(f => ({ ...f, minHoursBeforeReservation: Number(e.target.value) }))}
                    disabled={!restaurantForm.enabled}
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
                  <span style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>giờ</span>
                </div>

                {/* Preset gợi ý nhanh */}
                <div style={{ display: 'flex', gap: '.4rem', marginTop: '.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Gợi ý nhanh:</span>
                  {[6, 12, 24, 48, 72].map(hrs => (
                    <button
                      key={hrs}
                      type="button"
                      disabled={!restaurantForm.enabled}
                      onClick={() => setRestaurantForm(f => ({ ...f, minHoursBeforeReservation: hrs }))}
                      style={{
                        padding: '2px 8px',
                        fontSize: '.75rem',
                        borderRadius: 6,
                        border: restaurantForm.minHoursBeforeReservation === hrs ? '1px solid #2563EB' : '1px solid var(--border)',
                        background: restaurantForm.minHoursBeforeReservation === hrs ? '#EFF6FF' : '#fff',
                        color: restaurantForm.minHoursBeforeReservation === hrs ? '#1D4ED8' : '#4B5563',
                        cursor: restaurantForm.enabled ? 'pointer' : 'not-allowed',
                        fontWeight: restaurantForm.minHoursBeforeReservation === hrs ? 600 : 400
                      }}
                    >
                      {hrs} giờ {hrs === 24 && '(Mặc định)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mô tả giải thích quy định */}
              <div>
                <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.4rem', color: 'var(--text-primary)' }}>
                  <Info size={15} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  Mô tả / Thông báo quy định:
                </label>
                <textarea
                  rows={3}
                  value={restaurantForm.description}
                  onChange={e => setRestaurantForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Nhập nội dung mô tả quy định hiển thị cho đối tác nhà hàng..."
                  style={{
                    width: '100%',
                    padding: '.6rem .75rem',
                    borderRadius: 8,
                    border: '1.5px solid var(--border)',
                    fontSize: '.85rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Nút lưu */}
              <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
                <button
                  type="submit"
                  disabled={savingRestaurant}
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
                  {savingRestaurant ? 'Đang lưu cấu hình...' : 'Lưu quy định nhà hàng huỷ đơn'}
                </button>

                <button
                  type="button"
                  onClick={loadAllPolicies}
                  disabled={savingRestaurant}
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

          {/* CỘT PHẢI: XEM TRƯỚC (PREVIEW) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid #E5E7EB', background: '#FAFAFA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.75rem', color: '#1F2937' }}>
                <Sparkles size={18} color="#2563EB" />
                <h4 style={{ margin: 0, fontSize: '.95rem', fontWeight: 700 }}>Minh hoạ cơ chế kiểm soát</h4>
              </div>

              <div style={{ fontSize: '.83rem', color: '#4B5563', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '.6rem', padding: '.6rem .75rem', borderRadius: 8, background: '#fff', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontWeight: 600, color: '#111827' }}>1. Đơn đặt bàn có mốc giờ hẹn</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Thời gian nhận bàn được xác định theo thông tin đặt bàn của khách.</div>
                </div>

                <div style={{ marginBottom: '.6rem', padding: '.6rem .75rem', borderRadius: 8, background: restaurantForm.enabled ? '#EFF6FF' : '#F3F4F6', border: `1px solid ${restaurantForm.enabled ? '#BFDBFE' : '#E5E7EB'}` }}>
                  <div style={{ fontWeight: 600, color: restaurantForm.enabled ? '#1E40AF' : '#6B7280' }}>
                    2. Nhà hàng yêu cầu huỷ đơn
                  </div>
                  <div style={{ fontSize: '.75rem', color: restaurantForm.enabled ? '#1D4ED8' : '#6B7280' }}>
                    {restaurantForm.enabled
                      ? `Hệ thống kiểm tra: Nếu thời gian đến giờ nhận bàn < ${restaurantForm.minHoursBeforeReservation} tiếng -> CHẶN huỷ đơn và thông báo lỗi.`
                      : 'Quy định đang tắt - Nhà hàng có thể huỷ đơn bất cứ lúc nào.'}
                  </div>
                </div>

                <div style={{ padding: '.6rem .75rem', borderRadius: 8, background: '#fff', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontWeight: 600, color: '#111827' }}>3. Khi nhà hàng huỷ đơn hợp lệ</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Khách hàng nhận được thông báo giải thích và được hoàn 100% tiền cọc về tài khoản.</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderRadius: 12, border: '1px solid #FEF3C7', background: '#FFFBEB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.5rem', color: '#92400E' }}>
                <AlertTriangle size={17} />
                <h4 style={{ margin: 0, fontSize: '.9rem', fontWeight: 700 }}>Lưu ý nghiệp vụ</h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '.78rem', color: '#B45309', lineHeight: '1.5' }}>
                <li>Quy định này áp dụng đồng bộ cho tất cả chi nhánh và nhà hàng đối tác trên toàn hệ thống.</li>
                <li>Giao diện Đối tác sẽ hiển thị cảnh báo và vô hiệu nút huỷ nếu vi phạm thời gian tối thiểu.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
