import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import { subscriptionApi } from '../../../../api'
import { TriangleAlert, Ban, Calendar, ArrowUp, ArrowDown, CreditCard, Sparkles } from 'lucide-react'

// ── Design tokens (đồng bộ với PartnerDashboard.jsx) ─────────────
const C = {
  gold: '#C9A84C', goldLight: '#E8C97A', goldDark: '#8B6914',
  goldSubtle: 'rgba(201,168,76,.1)', goldBorder: 'rgba(201,168,76,.25)',
  brown: '#3D2B1F', brownMid: '#6B4226',
  cream: '#FBF7EF', creamDark: '#F0E8D5',
  text: '#2C1A0E', muted: '#8A6E57', border: '#E8DECE', white: '#FFFFFF',
  green: '#22C55E', greenBg: 'rgba(34,197,94,.1)',
  red: '#EF4444', redBg: 'rgba(239,68,68,.1)',
  amber: '#F59E0B', amberBg: 'rgba(245,158,11,.1)',
  blue: '#3B82F6', blueBg: 'rgba(59,130,246,.1)',
  slate: '#94A3B8', slateBg: 'rgba(148,163,184,.1)',
}
const serif = { fontFamily: "'Cormorant Garamond',Georgia,serif" }

const S = {
  eyebrow: { fontSize: '.7rem', fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: C.gold },
  card: { background: C.white, borderRadius: 4, boxShadow: '0 2px 12px rgba(61,43,31,.08)', padding: '1.5rem' },
  btnGold: { background: C.gold, color: C.brown, border: 'none', padding: '.6rem 1.4rem', fontWeight: 700, fontSize: '.82rem', letterSpacing: '.08em', textTransform: 'uppercase', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' },
  btnOut: { background: 'transparent', color: C.brown, border: `1.5px solid ${C.border}`, padding: '.58rem 1.2rem', fontWeight: 500, fontSize: '.82rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' },
  btnSm: { padding: '.4rem 1rem', fontSize: '.75rem', fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', border: 'none', transition: 'all .2s' },
}

const SUB_STATUS = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán lần đầu', color: C.amber, bg: C.amberBg },
  ACTIVE: { label: 'Đang hoạt động', color: C.green, bg: C.greenBg },
  PAST_DUE: { label: 'Quá hạn - đang ân hạn', color: C.amber, bg: C.amberBg },
  EXPIRED: { label: 'Đã hết hạn', color: C.red, bg: C.redBg },
  CANCELLED: { label: 'Đã hủy', color: C.slate, bg: C.slateBg },
}
const INVOICE_STATUS = {
  PENDING: { label: 'Chờ thanh toán', color: C.amber, bg: C.amberBg },
  PAID: { label: 'Đã thanh toán', color: C.green, bg: C.greenBg },
  OVERDUE: { label: 'Quá hạn', color: C.red, bg: C.redBg },
  CANCELLED: { label: 'Đã hủy', color: C.slate, bg: C.slateBg },
}
const INVOICE_TYPE_LABEL = { INITIAL: 'Đăng ký lần đầu', RENEWAL: 'Gia hạn', UPGRADE: 'Nâng cấp' }

/** Gia hạn nhưng áp dụng gói đã đặt lịch hạ cấp trước đó - ghi rõ để tránh nhầm là lỗi. */
function labelInvoiceType(inv) {
  if (inv.invoiceType === 'RENEWAL' && inv.downgradeRenewal) return 'Gia hạn (hạ cấp)'
  return INVOICE_TYPE_LABEL[inv.invoiceType] || inv.invoiceType
}

function fmtVnd(n) {
  return Number(n || 0).toLocaleString('vi-VN') + ' đ'
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN')
}

function Badge({ meta }) {
  if (!meta) return null
  return (
    <span style={{
      display: 'inline-block', padding: '.2rem .65rem', borderRadius: 2,
      fontSize: '.7rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
      color: meta.color, background: meta.bg, border: `1px solid ${meta.color}33`
    }}>
      {meta.label}
    </span>
  )
}

// ── Modal chọn gói (dùng chung cho Nâng cấp / Đặt lịch hạ cấp) ────
function PlanPickerModal({ title, plans, submitLabel, submitting, onSubmit, onClose }) {
  const [selectedId, setSelectedId] = useState(null)
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{ background: C.white, borderRadius: 8, width: '100%', maxWidth: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg,${C.brown},${C.brownMid})`, padding: '1rem 1.25rem', flexShrink: 0 }}>
          <h2 style={{ ...serif, fontWeight: 700, color: '#fff', fontSize: '1.1rem', margin: 0 }}>{title}</h2>
        </div>
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {plans.length === 0 && (
            <p style={{ color: C.muted, fontSize: '.85rem' }}>Không có gói nào phù hợp.</p>
          )}
          {plans.map(p => (
            <div key={p.id} onClick={() => setSelectedId(p.id)} style={{
              border: `2px solid ${selectedId === p.id ? C.gold : C.border}`,
              borderRadius: 6, padding: '1rem', cursor: 'pointer',
              background: selectedId === p.id ? C.goldSubtle : C.white, transition: 'all .15s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '.95rem', color: C.text }}>{p.name}</span>
                <span style={{ fontWeight: 700, color: C.goldDark }}>{fmtVnd(p.price)}/tháng</span>
              </div>
              <div style={{ fontSize: '.8rem', color: C.muted, marginTop: '.25rem' }}>
                Tối đa {p.maxBranches >= 999 ? 'không giới hạn' : p.maxBranches} chi nhánh
              </div>
              {p.description && <div style={{ fontSize: '.78rem', color: C.muted, marginTop: '.35rem' }}>{p.description}</div>}
            </div>
          ))}
        </div>
        <div style={{ padding: '1rem 1.25rem', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={S.btnOut}>Hủy</button>
          <button
            onClick={() => selectedId && onSubmit(selectedId)}
            disabled={!selectedId || submitting}
            style={{ ...S.btnGold, opacity: !selectedId || submitting ? .6 : 1 }}
          >
            {submitting ? 'Đang xử lý...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal thanh toán QR cho 1 hóa đơn (bám đúng luồng try-info/catch-create-link
// đã dùng cho đặt cọc booking: paymentApi.getDetail -> catch -> createPaymentLink) ──
function PaymentQrModal({ invoice, onClose, onPaid }) {
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const pollTimerRef = useRef(null)

  const fetchOrCreateLink = useCallback(async () => {
    setLoading(true)
    try {
      let res
      try {
        res = await subscriptionApi.getInvoicePaymentInfo(invoice.id)
      } catch {
        // Chưa từng tạo link (SUB_304 PAYMENT_LINK_NOT_FOUND) -> tạo mới, giống hệt
        // cách paymentApi xử lý PAYMENT_NOT_FOUND cho luồng đặt cọc.
        res = await subscriptionApi.createInvoicePaymentLink(invoice.id)
      }
      const info = res.data?.data
      setPaymentInfo(info)
      if (info?.invoiceStatus === 'PAID') {
        onPaid()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo link thanh toán')
    } finally {
      setLoading(false)
    }
  }, [invoice.id, onPaid])

  useEffect(() => { fetchOrCreateLink() }, [fetchOrCreateLink])

  // Poll trạng thái hóa đơn mỗi 3s (webhook payOS cập nhật ngầm ở BE) - khi PAID thì tự đóng modal.
  useEffect(() => {
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await subscriptionApi.getInvoicePaymentInfo(invoice.id)
        const info = res.data?.data
        if (info?.invoiceStatus === 'PAID') {
          clearInterval(pollTimerRef.current)
          toast.success('Thanh toán thành công! Gói dịch vụ đã được kích hoạt.')
          onPaid()
        }
      } catch {
        // bỏ qua lỗi polling, không làm phiền người dùng
      }
    }, 3000)
    return () => clearInterval(pollTimerRef.current)
  }, [invoice.id, onPaid])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{ background: C.white, borderRadius: 8, width: '100%', maxWidth: 420, overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg,${C.brown},${C.brownMid})`, padding: '1rem 1.25rem' }}>
          <h2 style={{ ...serif, fontWeight: 700, color: '#fff', fontSize: '1.1rem', margin: 0 }}>
            Thanh toán hóa đơn
          </h2>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '.85rem', color: C.muted }}>{invoice.planSnapshotName}</div>
            <div style={{ fontWeight: 700, fontSize: '1.3rem', color: C.goldDark }}>{fmtVnd(invoice.amount)}</div>
          </div>

          {loading && <p style={{ color: C.muted, fontSize: '.85rem' }}>Đang tạo link thanh toán...</p>}

          {!loading && paymentInfo?.qrCode && (
            <>
              <QRCodeSVG value={paymentInfo.qrCode} size={220} level="M" includeMargin={true} />
              <p style={{ fontSize: '.78rem', color: C.muted, textAlign: 'center', margin: 0 }}>
                Quét mã QR bằng app ngân hàng/ví điện tử để thanh toán qua payOS.
                Trang sẽ tự cập nhật khi thanh toán thành công.
              </p>
              {paymentInfo.checkoutUrl && (
                <a href={paymentInfo.checkoutUrl} target="_blank" rel="noreferrer"
                  style={{ fontSize: '.8rem', color: C.blue, textDecoration: 'underline' }}>
                  Hoặc mở trang thanh toán payOS
                </a>
              )}
            </>
          )}

          {!loading && !paymentInfo?.qrCode && (
            <p style={{ color: C.red, fontSize: '.85rem' }}>Không lấy được mã QR. Vui lòng thử lại.</p>
          )}

          <div style={{ display: 'flex', gap: '.75rem', width: '100%', marginTop: '.5rem' }}>
            <button onClick={onClose} style={{ ...S.btnOut, flex: 1 }}>Đóng</button>
            <button onClick={fetchOrCreateLink} style={{ ...S.btnGold, flex: 1 }}>Làm mới</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BillingTab() {
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null) // null = chưa đăng ký gói nào
  const [plans, setPlans] = useState([])
  const [invoices, setInvoices] = useState([])
  const [actionLoading, setActionLoading] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [downgradeModalOpen, setDowngradeModalOpen] = useState(false)
  const [payingInvoice, setPayingInvoice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [plansRes, invoicesRes] = await Promise.all([
        subscriptionApi.listPlans(),
        subscriptionApi.listInvoices().catch(() => ({ data: { data: [] } })),
      ])
      setPlans(plansRes.data?.data || [])
      setInvoices(invoicesRes.data?.data || [])
      try {
        const curRes = await subscriptionApi.getCurrent()
        setSubscription(curRes.data?.data || null)
      } catch {
        // 404 SUBSCRIPTION_NOT_FOUND = chưa đăng ký gói nào, không phải lỗi thật
        setSubscription(null)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải thông tin gói dịch vụ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const subscribeInitial = async (planId) => {
    setActionLoading(true)
    try {
      const res = await subscriptionApi.subscribeInitial(planId)
      toast.success('Đã tạo hóa đơn đăng ký.')
      await load()
      setPayingInvoice(res.data?.data) // mở QR thanh toán luôn, khỏi phải tìm trong bảng
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đăng ký gói')
    } finally {
      setActionLoading(false)
    }
  }

  const upgrade = async (newPlanId) => {
    setActionLoading(true)
    try {
      const res = await subscriptionApi.upgrade(newPlanId)
      toast.success('Đã tạo hóa đơn nâng cấp. Hạn mức mới có hiệu lực ngay sau khi thanh toán.')
      setUpgradeModalOpen(false)
      await load()
      setPayingInvoice(res.data?.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể nâng cấp gói')
    } finally {
      setActionLoading(false)
    }
  }

  const scheduleDowngrade = async (newPlanId) => {
    setActionLoading(true)
    try {
      await subscriptionApi.scheduleDowngrade(newPlanId)
      toast.success('Đã đặt lịch hạ cấp - áp dụng vào kỳ gia hạn tiếp theo.')
      setDowngradeModalOpen(false)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đặt lịch hạ cấp')
    } finally {
      setActionLoading(false)
    }
  }

  const cancelScheduledDowngrade = async () => {
    setActionLoading(true)
    try {
      await subscriptionApi.cancelScheduledDowngrade()
      toast.success('Đã hủy lịch hạ cấp.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể hủy lịch hạ cấp')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <p style={{ color: C.muted }}>Đang tải thông tin gói dịch vụ...</p>
  }

  const currentPlan = subscription ? plans.find(p => p.id === subscription.planId) : null
  const higherPlans = plans.filter(p => !currentPlan || p.displayOrder > currentPlan.displayOrder)
  const lowerPlans = plans.filter(p => currentPlan && p.displayOrder < currentPlan.displayOrder)
  const hasPendingInvoice = invoices.some(inv => inv.status === 'PENDING' || inv.status === 'OVERDUE')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ══════ CHƯA CÓ GÓI - hiện bảng chọn gói ══════ */}
      {!subscription && (
        <div style={S.card}>
          <div style={S.eyebrow}>Chọn gói dịch vụ</div>
          <p style={{ fontSize: '.85rem', color: C.muted, margin: '.5rem 0 1.25rem' }}>
            Nhà hàng chưa đăng ký gói dịch vụ nào. Chọn 1 gói để bắt đầu sử dụng nền tảng Dabana.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {plans.map(p => (
              <div key={p.id} style={{ border: `1.5px solid ${C.border}`, borderRadius: 6, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                <div style={{ ...serif, fontWeight: 700, fontSize: '1.1rem', color: C.text }}>{p.name}</div>
                <div style={{ fontWeight: 700, fontSize: '1.4rem', color: C.goldDark }}>{fmtVnd(p.price)}<span style={{ fontSize: '.75rem', fontWeight: 500, color: C.muted }}>/tháng</span></div>
                <div style={{ fontSize: '.8rem', color: C.muted }}>
                  Tối đa {p.maxBranches >= 999 ? 'không giới hạn' : p.maxBranches} chi nhánh
                </div>
                {p.description && <div style={{ fontSize: '.78rem', color: C.muted, flex: 1 }}>{p.description}</div>}
                <button onClick={() => subscribeInitial(p.id)} disabled={actionLoading} style={{ ...S.btnGold, marginTop: '.5rem' }}>
                  {actionLoading ? 'Đang xử lý...' : 'Đăng ký gói này'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════ ĐANG CÓ GÓI - hiện trạng thái + hành động ══════ */}
      {subscription && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={S.eyebrow}>Gói hiện tại</div>
              <div style={{ ...serif, fontWeight: 700, fontSize: '1.5rem', color: C.text, marginTop: '.25rem' }}>
                {subscription.planNameSnapshot}
              </div>
              <div style={{ fontSize: '.85rem', color: C.muted, marginTop: '.2rem' }}>
                {fmtVnd(subscription.priceSnapshot)}/tháng · Tối đa {subscription.maxBranchesSnapshot >= 999 ? 'không giới hạn' : subscription.maxBranchesSnapshot} chi nhánh
              </div>
            </div>
            <Badge meta={SUB_STATUS[subscription.status]} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', margin: '1.25rem 0' }}>
            <div>
              <div style={{ fontSize: '.72rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em' }}>Kỳ hiện tại</div>
              <div style={{ fontSize: '.88rem', fontWeight: 600, color: C.text, marginTop: '.2rem' }}>
                {fmtDate(subscription.currentPeriodStart)} → {fmtDate(subscription.currentPeriodEnd)}
              </div>
            </div>
            {subscription.status === 'PAST_DUE' && (
              <div>
                <div style={{ fontSize: '.72rem', color: C.red, textTransform: 'uppercase', letterSpacing: '.06em' }}>Hạn ân hạn</div>
                <div style={{ fontSize: '.88rem', fontWeight: 600, color: C.red, marginTop: '.2rem' }}>
                  Thanh toán trước {fmtDate(subscription.gracePeriodEnd)}
                </div>
              </div>
            )}
          </div>

          {subscription.status === 'PAST_DUE' && (
            <div style={{ background: C.amberBg, border: `1px solid ${C.amber}44`, borderRadius: 4, padding: '.75rem 1rem', fontSize: '.82rem', color: C.brown, marginBottom: '1rem' }}>
              <TriangleAlert size={15} style={{ verticalAlign: '-2px' }} /> Hóa đơn đang quá hạn thanh toán. Sau ngày ân hạn, các chi nhánh vượt hạn mức sẽ tự động bị tạm ngưng.
            </div>
          )}
          {subscription.status === 'EXPIRED' && (
            <div style={{ background: C.redBg, border: `1px solid ${C.red}44`, borderRadius: 4, padding: '.75rem 1rem', fontSize: '.82rem', color: C.brown, marginBottom: '1rem' }}>
              <Ban size={15} style={{ verticalAlign: '-2px' }} /> Gói dịch vụ đã hết hạn. Một số chi nhánh có thể đã bị tạm ngưng. Thanh toán hóa đơn bên dưới để khôi phục.
            </div>
          )}

          {subscription.pendingDowngradePlanName && (
            <div style={{ background: C.blueBg, border: `1px solid ${C.blue}44`, borderRadius: 4, padding: '.75rem 1rem', fontSize: '.82rem', color: C.brown, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>
              <span><Calendar size={15} style={{ verticalAlign: '-2px' }} /> Đã đặt lịch hạ cấp xuống <strong>{subscription.pendingDowngradePlanName}</strong>, áp dụng từ kỳ gia hạn tiếp theo.</span>
              <button onClick={cancelScheduledDowngrade} disabled={actionLoading} style={{ ...S.btnSm, background: C.white, border: `1px solid ${C.blue}`, color: C.blue }}>
                Hủy lịch hạ cấp
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
            <button onClick={() => setUpgradeModalOpen(true)} disabled={actionLoading || higherPlans.length === 0} style={S.btnGold}>
              <ArrowUp size={15} style={{ verticalAlign: '-2px' }} /> Nâng cấp gói
            </button>
            {!subscription.pendingDowngradePlanName && (
              <button onClick={() => setDowngradeModalOpen(true)} disabled={actionLoading || lowerPlans.length === 0} style={S.btnOut}>
                <ArrowDown size={15} style={{ verticalAlign: '-2px' }} /> Đặt lịch hạ cấp
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══════ CTA thanh toán hóa đơn đang chờ ══════ */}
      {hasPendingInvoice && (
        <div style={{ ...S.card, borderLeft: `4px solid ${C.amber}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '.9rem', color: C.text, marginBottom: '.2rem' }}>
              <CreditCard size={15} style={{ verticalAlign: '-2px' }} /> Có hóa đơn đang chờ thanh toán
            </div>
            <p style={{ fontSize: '.82rem', color: C.muted, margin: 0 }}>
              Quét mã QR để thanh toán qua payOS - gói dịch vụ sẽ được kích hoạt tự động ngay sau khi nhận tiền.
            </p>
          </div>
          <button
            onClick={() => setPayingInvoice(invoices.find(inv => inv.status === 'PENDING' || inv.status === 'OVERDUE'))}
            style={S.btnGold}
          >
            Thanh toán ngay
          </button>
        </div>
      )}

      {/* ══════ Lịch sử hóa đơn ══════ */}
      <div style={S.card}>
        <div style={S.eyebrow}>Lịch sử hóa đơn</div>
        {invoices.length === 0 ? (
          <p style={{ fontSize: '.85rem', color: C.muted, marginTop: '.75rem' }}>Chưa có hóa đơn nào.</p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${C.border}`, textAlign: 'left' }}>
                  <th style={{ padding: '.6rem .5rem', color: C.muted, fontWeight: 600, fontSize: '.72rem', textTransform: 'uppercase' }}>Loại</th>
                  <th style={{ padding: '.6rem .5rem', color: C.muted, fontWeight: 600, fontSize: '.72rem', textTransform: 'uppercase' }}>Gói</th>
                  <th style={{ padding: '.6rem .5rem', color: C.muted, fontWeight: 600, fontSize: '.72rem', textTransform: 'uppercase' }}>Số tiền</th>
                  <th style={{ padding: '.6rem .5rem', color: C.muted, fontWeight: 600, fontSize: '.72rem', textTransform: 'uppercase' }}>Kỳ áp dụng</th>
                  <th style={{ padding: '.6rem .5rem', color: C.muted, fontWeight: 600, fontSize: '.72rem', textTransform: 'uppercase' }}>Hạn thanh toán</th>
                  <th style={{ padding: '.6rem .5rem', color: C.muted, fontWeight: 600, fontSize: '.72rem', textTransform: 'uppercase' }}>Trạng thái</th>
                  <th style={{ padding: '.6rem .5rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '.6rem .5rem' }}>{labelInvoiceType(inv)}</td>
                    <td style={{ padding: '.6rem .5rem' }}>{inv.planSnapshotName}</td>
                    <td style={{ padding: '.6rem .5rem', fontWeight: 600 }}>{fmtVnd(inv.amount)}</td>
                    <td style={{ padding: '.6rem .5rem', color: C.muted }}>{fmtDate(inv.periodStart)} → {fmtDate(inv.periodEnd)}</td>
                    <td style={{ padding: '.6rem .5rem', color: C.muted }}>{fmtDate(inv.dueDate)}</td>
                    <td style={{ padding: '.6rem .5rem' }}><Badge meta={INVOICE_STATUS[inv.status]} /></td>
                    <td style={{ padding: '.6rem .5rem' }}>
                      {(inv.status === 'PENDING' || inv.status === 'OVERDUE') && (
                        <button onClick={() => setPayingInvoice(inv)} style={{ ...S.btnSm, background: C.gold, color: C.brown }}>
                          Thanh toán
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {upgradeModalOpen && (
        <PlanPickerModal
          title="Nâng cấp gói dịch vụ"
          plans={higherPlans}
          submitLabel={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}><Sparkles size={14} /> Nâng cấp ngay</span>}
          submitting={actionLoading}
          onSubmit={upgrade}
          onClose={() => setUpgradeModalOpen(false)}
        />
      )}
      {downgradeModalOpen && (
        <PlanPickerModal
          title="Đặt lịch hạ cấp"
          plans={lowerPlans}
          submitLabel="Đặt lịch hạ cấp"
          submitting={actionLoading}
          onSubmit={scheduleDowngrade}
          onClose={() => setDowngradeModalOpen(false)}
        />
      )}
      {payingInvoice && (
        <PaymentQrModal
          invoice={payingInvoice}
          onClose={() => setPayingInvoice(null)}
          onPaid={() => { setPayingInvoice(null); load() }}
        />
      )}
    </div>
  )
}