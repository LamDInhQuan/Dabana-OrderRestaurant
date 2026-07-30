import { useState, useEffect, useRef } from 'react'
import { X, Check, Hourglass, Banknote, Landmark } from 'lucide-react'
import toast from 'react-hot-toast'
import { bookingApi, invoicePaymentApi } from '../../../../../api'
import { formatMoney } from './statusMeta'

const iconLabel = (Icon, text) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}><Icon size={16} /> {text}</span>
)

const PAYMENT_METHODS = [
  { value: 'CASH', label: iconLabel(Banknote, 'Tiền mặt') },
  { value: 'TRANSFER', label: iconLabel(Landmark, 'Chuyển khoản / QR') },
]

const POLL_INTERVAL_MS = 3000

/**
 * Modal "Thanh toan hoa don".
 * - CASH: chon phuong thuc -> bam xac nhan -> goi thang bookingApi.checkOut().
 * - TRANSFER: bam "Tao ma QR" -> BE tao link payOS (khong luu DB, xem
 *   InvoicePaymentService) -> hien QR -> FE tu poll status moi 3s bang cach
 *   hoi THANG payOS (khong qua webhook/DB) -> khi thay PAID moi bat nut
 *   "Xac nhan & Check-out" -> goi bookingApi.checkOut() nhu CASH.
 *
 * onConfirmed(bookingResponse) do component cha (TableDetailDrawer) xu ly:
 * in hoa don, toast, reload board, dong drawer - giu nguyen quy uoc dang co.
 */
export default function PaymentConfirmModal({ open, bookingId, tableName, onClose, onConfirmed }) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [surchargeInput, setSurchargeInput] = useState('0')
  const [submitting, setSubmitting] = useState(false)

  const [qr, setQr] = useState(null) // { orderCode, qrCode, checkoutUrl, amount, status }
  const [qrCreating, setQrCreating] = useState(false)
  const pollRef = useRef(null)

  useEffect(() => {
    if (!open || !bookingId) return
    setLoading(true)
    setPaymentMethod('CASH')
    setSurchargeInput('0')
    setQr(null)
    bookingApi.previewInvoice(bookingId)
      .then((res) => setPreview(res.data?.data ?? res.data))
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Không tải được thông tin hoá đơn')
        onClose?.()
      })
      .finally(() => setLoading(false))
  }, [open, bookingId])

  // Dung poll khi modal dong / doi bookingId
  useEffect(() => {
    return () => stopPolling()
  }, [open, bookingId])

  if (!open) return null

  const surcharge = Number(surchargeInput) || 0
  const subtotal = preview?.subtotalBeforeSurcharge || 0
  const depositPaid = preview?.depositPaid || 0
  const grandTotal = subtotal + surcharge
  const amountDue = grandTotal - depositPaid

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const handleSelectMethod = (value) => {
    setPaymentMethod(value)
    if (value === 'CASH') {
      stopPolling()
      setQr(null)
    }
  }

  const handleCreateQr = async () => {
    setQrCreating(true)
    try {
      const res = await invoicePaymentApi.create(bookingId, surcharge)
      const data = res.data?.data ?? res.data
      setQr(data)
      // bat dau poll trang thai moi 3s
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await invoicePaymentApi.getStatus(bookingId, data.orderCode)
          const statusData = statusRes.data?.data ?? statusRes.data
          setQr((prev) => prev ? { ...prev, status: statusData.status, amountPaid: statusData.amountPaid } : prev)
          if (statusData.status === 'PAID') {
            stopPolling()
            toast.success('Đã nhận được thanh toán!')
          }
        } catch {
          // bo qua loi 1 lan poll, thu lai lan sau
        }
      }, POLL_INTERVAL_MS)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tạo được mã QR')
    } finally {
      setQrCreating(false)
    }
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const res = await bookingApi.checkOut(bookingId, { paymentMethod, surcharge })
      stopPolling()
      onConfirmed?.(res.data?.data ?? res.data, { paymentMethod, surcharge, grandTotal, depositPaid, amountDue, preview })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thanh toán thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const lines = [...(preview?.preorderItems || []), ...(preview?.extraOrderItems || [])]

  const isTransfer = paymentMethod === 'TRANSFER'
  const qrPaid = qr?.status === 'PAID'
  // Amount da "khoa" theo QR da tao - khoa luon input phu thu de tranh lech voi so tien QR
  const surchargeLocked = isTransfer && !!qr

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 450, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: '100%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}
      >
        <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid #E8DECE', flexShrink: 0 }}>
          <div className="flex items-center justify-between">
            <h2 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Thanh toán hoá đơn</h2>
            <button className="btn-outline btn-sm" onClick={onClose}><X size={16} /></button>
          </div>
          <p style={{ fontSize: '.8rem', color: '#8A6E57', margin: 0 }}>{tableName}</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.1rem 1.4rem' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#8A6E57', padding: '2rem 0' }}>Đang tải hoá đơn...</p>
          ) : (
            <>
              {lines.length > 0 && (
                <table style={{ width: '100%', fontSize: '.85rem', marginBottom: '1rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E8DECE' }}>
                      <th style={{ textAlign: 'left', padding: '.3rem 0' }}>Món</th>
                      <th style={{ textAlign: 'center', padding: '.3rem 0' }}>SL</th>
                      <th style={{ textAlign: 'right', padding: '.3rem 0' }}>T.Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '.25rem 0' }}>{l.name}</td>
                        <td style={{ textAlign: 'center' }}>{l.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{formatMoney(l.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', fontSize: '.88rem', marginBottom: '1rem' }}>
                <Row label="Tạm tính (món đặt trước + gọi thêm)" value={formatMoney(subtotal)} />
                {depositPaid > 0 && <Row label="Đã cọc trước" value={`- ${formatMoney(depositPaid)}`} />}
                <div className="flex items-center justify-between">
                  <span>Phụ thu (nếu có)</span>
                  <input
                    type="number"
                    min="0"
                    value={surchargeInput}
                    disabled={surchargeLocked}
                    onChange={(e) => setSurchargeInput(e.target.value)}
                    style={{ width: 140, textAlign: 'right' }}
                  />
                </div>
                <div style={{ borderTop: '1px dashed #E8DECE', margin: '.3rem 0' }} />
                <Row label="Tổng hoá đơn" value={formatMoney(grandTotal)} bold />
                <Row label="Khách cần thanh toán" value={formatMoney(amountDue)} bold highlight />
              </div>

              <div style={{ marginBottom: '.25rem', fontWeight: 700, fontSize: '.85rem' }}>Phương thức thanh toán</div>
              <div style={{ display: 'flex', gap: '.6rem', marginBottom: isTransfer ? '1rem' : 0 }}>
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={paymentMethod === m.value ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
                    style={{ flex: 1 }}
                    disabled={surchargeLocked}
                    onClick={() => handleSelectMethod(m.value)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {isTransfer && (
                <div style={{ border: '1px solid #E8DECE', borderRadius: 8, padding: '1rem', textAlign: 'center' }}>
                  {!qr ? (
                    <button className="btn-primary" style={{ width: '100%' }} disabled={qrCreating} onClick={handleCreateQr}>
                      {qrCreating ? 'Đang tạo mã QR...' : `Tạo mã QR · ${formatMoney(amountDue)}`}
                    </button>
                  ) : (
                    <>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qr.qrCode)}`}
                        alt="QR thanh toán"
                        style={{ width: 220, height: 220, margin: '0 auto', display: 'block' }}
                      />
                      <p style={{ fontSize: '.8rem', color: '#8A6E57', marginTop: '.6rem' }}>
                        {qr.accountName ? `${qr.accountName} · ${qr.accountNumber}` : 'Quét mã để chuyển khoản'}
                      </p>
                      {qrPaid ? (
                        <p style={{ color: '#1E8E3E', fontWeight: 700, marginTop: '.5rem', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}><Check size={16} /> Đã nhận được thanh toán</p>
                      ) : (
                        <p style={{ color: '#8A6E57', marginTop: '.5rem', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}><Hourglass size={16} /> Đang chờ khách quét mã...</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ padding: '1rem 1.4rem', borderTop: '1px solid #E8DECE', flexShrink: 0, display: 'flex', gap: '.6rem' }}>
          <button className="btn-outline" style={{ flex: 1 }} onClick={onClose} disabled={submitting}>Huỷ</button>
          {(!isTransfer || qrPaid) && (
            <button className="btn-primary" style={{ flex: 2 }} onClick={handleConfirm} disabled={loading || submitting}>
              {submitting ? 'Đang xử lý...' : `Xác nhận đã thu ${formatMoney(amountDue)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold, highlight }) {
  return (
    <div className="flex items-center justify-between" style={{ fontWeight: bold ? 700 : 400, color: highlight ? '#B4552A' : undefined }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}