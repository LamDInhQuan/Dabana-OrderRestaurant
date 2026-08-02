import { useEffect, useState } from "react"
import { branchBankAccountApi, refundBankInfoApi } from "../../../api"
import toast from "react-hot-toast"
import { Landmark, AlertCircle, CheckCircle2, ShieldCheck, RefreshCw, X, ArrowRight } from "lucide-react"

export default function RefundBankInfoModal({ booking, onClose, onSuccess }) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [banks, setBanks] = useState([])
  const [selectedBankId, setSelectedBankId] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')

  const refundAmount = Number(booking.refundAmount || booking.depositAmount || 0)

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    // Tải đồng thời danh sách ngân hàng và thông tin đã nhập trước đó (nếu có)
    Promise.allSettled([
      branchBankAccountApi.listBanks(),
      refundBankInfoApi.getByReservation(booking.id)
    ]).then(([banksRes, bankInfoRes]) => {
      if (banksRes.status === 'fulfilled') {
        const list = banksRes.value.data?.data || banksRes.value.data || []
        setBanks(list)
      }
      if (bankInfoRes.status === 'fulfilled') {
        const info = bankInfoRes.value.data?.data || bankInfoRes.value.data
        if (info) {
          setSelectedBankId(info.bankId || '')
          setAccountNumber(info.accountNumber || '')
          setAccountHolderName(info.accountHolderName || '')
        }
      }
      setLoading(false)
    }).catch(err => {
      console.error('Lỗi nạp dữ liệu ngân hàng:', err)
      setLoading(false)
    })

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [booking.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedBankId) {
      toast.error('Vui lòng chọn ngân hàng nhận tiền')
      return
    }
    if (!accountNumber.trim()) {
      toast.error('Vui lòng nhập số tài khoản')
      return
    }
    if (!accountHolderName.trim()) {
      toast.error('Vui lòng nhập tên chủ tài khoản')
      return
    }

    setSubmitting(true)
    try {
      await refundBankInfoApi.createOrUpdate({
        reservationId: booking.id,
        bankId: Number(selectedBankId),
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim().toUpperCase(),
      })

      toast.success('Đã lưu thông tin tài khoản! Hệ thống đang tự động kích hoạt chuyển tiền hoàn cọc qua PayOS.', {
        duration: 5000,
      })

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      console.error('Lỗi lưu thông tin ngân hàng hoàn tiền:', err)
      toast.error(err.response?.data?.message || 'Không thể lưu thông tin tài khoản. Vui lòng thử lại!')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
      backdropFilter: 'blur(2px)'
    }}>
      <div style={{
        background: '#fff',
        width: '100%',
        maxWidth: 520,
        borderRadius: 14,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F9FAFB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Landmark size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>
                Nhận tiền hoàn cọc đặt bàn #{booking.id}
              </h3>
              <span style={{ fontSize: '.78rem', color: '#6B7280' }}>
                {booking.branchName} • {booking.restaurantName}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#9CA3AF',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6B7280' }}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: '.5rem' }} />
              <p style={{ margin: 0, fontSize: '.88rem' }}>Đang tải thông tin ngân hàng...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Highlight số tiền hoàn */}
              <div style={{
                background: '#ECFDF5',
                border: '1.5px solid #A7F3D0',
                borderRadius: 10,
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '.8rem', color: '#065F46', fontWeight: 600, display: 'block' }}>
                    Số tiền hoàn lại cho bạn:
                  </span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#047857' }}>
                    {refundAmount.toLocaleString('vi-VN')}₫
                  </span>
                </div>
                <div style={{
                  padding: '.35rem .75rem',
                  borderRadius: 20,
                  background: '#D1FAE5',
                  color: '#065F46',
                  fontSize: '.75rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '.3rem'
                }}>
                  <ShieldCheck size={14} /> Tự động 100%
                </div>
              </div>

              {/* Thông báo giải thích */}
              <div style={{
                fontSize: '.8rem',
                color: '#4B5563',
                background: '#F9FAFB',
                padding: '.75rem 1rem',
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                lineHeight: '1.5'
              }}>
                <div style={{ display: 'flex', gap: '.4rem', alignItems: 'flex-start' }}>
                  <AlertCircle size={15} color="#2563EB" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>
                    Đơn đặt bàn đã được huỷ và đủ điều kiện nhận hoàn cọc. Vui lòng cung cấp số tài khoản ngân hàng để cổng <strong>PayOS</strong> chuyển tiền trực tiếp về tài khoản của bạn.
                  </span>
                </div>
              </div>

              {/* Chọn ngân hàng */}
              <div>
                <label style={{ display: 'block', fontSize: '.83rem', fontWeight: 600, color: '#374151', marginBottom: '.35rem' }}>
                  Ngân hàng thụ hưởng: <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  value={selectedBankId}
                  onChange={e => setSelectedBankId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '.6rem .75rem',
                    borderRadius: 8,
                    border: '1.5px solid #D1D5DB',
                    fontSize: '.88rem',
                    background: '#fff'
                  }}
                >
                  <option value="">-- Chọn ngân hàng --</option>
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.shortName || b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Số tài khoản */}
              <div>
                <label style={{ display: 'block', fontSize: '.83rem', fontWeight: 600, color: '#374151', marginBottom: '.35rem' }}>
                  Số tài khoản: <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value.replace(/\s+/g, ''))}
                  placeholder="Ví dụ: 19036888888..."
                  required
                  style={{
                    width: '100%',
                    padding: '.6rem .75rem',
                    borderRadius: 8,
                    border: '1.5px solid #D1D5DB',
                    fontSize: '.88rem'
                  }}
                />
              </div>

              {/* Tên chủ tài khoản */}
              <div>
                <label style={{ display: 'block', fontSize: '.83rem', fontWeight: 600, color: '#374151', marginBottom: '.35rem' }}>
                  Tên chủ tài khoản (không dấu): <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={e => setAccountHolderName(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: NGUYEN VAN A"
                  required
                  style={{
                    width: '100%',
                    padding: '.6rem .75rem',
                    borderRadius: 8,
                    border: '1.5px solid #D1D5DB',
                    fontSize: '.88rem',
                    textTransform: 'uppercase'
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '.75rem',
                justifyContent: 'flex-end',
                marginTop: '.5rem',
                paddingTop: '.75rem',
                borderTop: '1px solid #F3F4F6'
              }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  style={{
                    padding: '.55rem 1.1rem',
                    borderRadius: 8,
                    border: '1px solid #D1D5DB',
                    background: '#fff',
                    color: '#374151',
                    fontSize: '.85rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '.4rem',
                    padding: '.55rem 1.25rem',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--brand, #0284c7)',
                    color: '#fff',
                    fontSize: '.85rem',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={15} className="spin" /> Đang xử lý...
                    </>
                  ) : (
                    <>
                      Xác nhận nhận tiền <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
