import { useEffect, useState } from 'react'
import { partnerReportApi, branchApi, subscriptionApi, restaurantApi } from '../../../api'
import { usePeriodState } from '../../../features/reports/usePeriodState'
import PeriodFilterBar from '../../../features/reports/PeriodFilterBar'
import MiniBarChart from '../../../features/reports/MiniBarChart'
import MiniPieChart from '../../../features/reports/MiniPieChart'
import KpiCardRow from '../../../features/reports/KpiCardRow'

const arr = (v) => (Array.isArray(v) ? v : [])
const fmtNum = (v) => Number(v || 0).toLocaleString('vi-VN')
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—')
const INVOICE_STATUS_LABEL = { PENDING: 'Chờ thanh toán', PAID: 'Đã thanh toán', OVERDUE: 'Quá hạn', CANCELLED: 'Đã hủy' }

// Period state -> {from,to} ISO 'YYYY-MM-DD' for Excel export range.
const pad = (n) => String(n).padStart(2, '0')
const lastDayISO = (y, m) => `${y}-${pad(m)}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
function periodToRange(ps) {
  const { period, date, from, to, year, quarter, month } = ps
  switch (period) {
    case 'DAY': return { from: date, to: date }
    case 'CUSTOM': return { from, to }
    case 'YEAR': return { from: `${year}-01-01`, to: `${year}-12-31` }
    case 'QUARTER': {
      const firstMonth = (quarter - 1) * 3 + 1
      return { from: `${year}-${pad(firstMonth)}-01`, to: lastDayISO(year, firstMonth + 2) }
    }
    default: return { from: `${year}-${pad(month)}-01`, to: lastDayISO(year, month) }
  }
}

// Reusable style tokens (defined once, shared across all blocks so every card
// and chart panel has identical structure/rhythm). Colors from design tokens only.
const T = {
  card: {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '1.5rem',
    marginBottom: '1.25rem',
  },
  sectionTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--brown)',
    margin: 0,
    paddingBottom: '.85rem',
    marginBottom: '1.25rem',
    borderBottom: '1px solid var(--cream-dark)',
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.25rem',
    marginTop: '1.25rem',
  },
  chartBox: {
    background: 'var(--cream)',
    border: '1px solid var(--cream-dark)',
    borderRadius: 6,
    padding: '1rem 1.15rem',
  },
  caption: {
    fontSize: '.72rem',
    fontWeight: 700,
    letterSpacing: '.05em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '.85rem',
  },
  toolbar: {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '1rem 1.25rem',
    marginBottom: '1.25rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    alignItems: 'flex-end',
  },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '.3rem' },
  fieldLabel: { fontSize: '.75rem', color: 'var(--text-muted)', fontWeight: 600 },
  select: { width: 'auto', minWidth: '13rem' },
}

function Block({ title, children }) {
  return (
    <section style={T.card}>
      <h2 style={T.sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}

function ChartBox({ caption, children }) {
  return (
    <div style={T.chartBox}>
      <div style={T.caption}>{caption}</div>
      {children}
    </div>
  )
}

function TopCashiersTable({ rows = [] }) {
  if (!rows.length) return <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Chưa có dữ liệu thu ngân.</p>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--cream-dark)', textAlign: 'left' }}>
            <th style={{ padding: '.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Thu ngân</th>
            <th style={{ padding: '.5rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Số hoá đơn</th>
            <th style={{ padding: '.5rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Doanh số</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.userId ?? r.cashierName} style={{ borderBottom: '1px solid var(--cream-dark)' }}>
              <td style={{ padding: '.5rem', fontWeight: 600 }}>{r.cashierName}</td>
              <td style={{ padding: '.5rem', textAlign: 'right' }}>{fmtNum(r.invoiceCount)}</td>
              <td style={{ padding: '.5rem', textAlign: 'right', fontWeight: 700 }}>{fmtNum(r.totalCollected)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PartnerReportsPage() {
  const periodState = usePeriodState('MONTH')
  const [branches, setBranches] = useState([])
  const [branchId, setBranchId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ revenue: {}, deposits: {}, reservations: {}, peak: {} })
  const [platformSub, setPlatformSub] = useState(null)
  const [platformInvoices, setPlatformInvoices] = useState([])
  const [exportType, setExportType] = useState('BOOKING')
  const [exporting, setExporting] = useState(false)
  const [exportErr, setExportErr] = useState('')

  async function handleExport() {
    let { from, to } = periodToRange(periodState)
    if (!from || !to) {
      // Fallback: current month range when DAY has no date / CUSTOM empty.
      const now = new Date()
      from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
      to = lastDayISO(now.getFullYear(), now.getMonth() + 1)
    }
    setExportErr('')
    setExporting(true)
    try {
      const res = await restaurantApi.export(branchId ? [branchId] : undefined, from, to, exportType)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'BaoCao_' + exportType + '_' + from + '_' + to + '.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Xuất Excel thất bại:', e)
      setExportErr('Xuất Excel thất bại, vui lòng thử lại.')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    branchApi.getMyList()
      .then((res) => setBranches(arr(res?.data?.data)))
      .catch(() => setBranches([]))
  }, [])

  // Gói dịch vụ nền tảng (scenario 5.6) — độc lập với bộ lọc kỳ, tải 1 lần khi mount.
  useEffect(() => {
    subscriptionApi.getCurrent()
      .then((res) => setPlatformSub(res?.data?.data ?? null))
      .catch(() => setPlatformSub(null))
    subscriptionApi.listInvoices()
      .then((res) => setPlatformInvoices(arr(res?.data?.data)))
      .catch(() => setPlatformInvoices([]))
  }, [])

  function load() {
    const params = { ...periodState.queryParams }
    if (branchId != null) params.branchId = branchId
    setLoading(true)
    Promise.all([
      partnerReportApi.revenue(params).then((r) => r?.data?.data ?? {}).catch(() => ({})),
      partnerReportApi.deposits(params).then((r) => r?.data?.data ?? {}).catch(() => ({})),
      partnerReportApi.reservations(params).then((r) => r?.data?.data ?? {}).catch(() => ({})),
      partnerReportApi.peakHours(params).then((r) => r?.data?.data ?? {}).catch(() => ({})),
    ])
      .then(([revenue, deposits, reservations, peak]) => setData({ revenue, deposits, reservations, peak }))
      .finally(() => setLoading(false))
  }

  // Mount + whenever branch changes. Apply is wired via PeriodFilterBar's onApply.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [branchId])

  const { revenue, deposits, reservations, peak } = data

  return (
    <div className="page-container" style={{ padding: '2rem 1.25rem' }}>
      <a href="/partner" style={{ color: 'var(--gold-dark)', fontSize: '.85rem', fontWeight: 600 }}>
        ← Về bảng điều khiển
      </a>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brown)', margin: '.5rem 0 1.5rem' }}>
        Thống kê &amp; Báo cáo
      </h1>

      <div style={T.toolbar}>
        <div style={T.fieldWrap}>
          <span style={T.fieldLabel}>Chi nhánh</span>
          <select
            style={T.select}
            value={branchId ?? ''}
            onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Tất cả chi nhánh</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.branchName || b.name || `Chi nhánh #${b.id}`}</option>
            ))}
          </select>
        </div>

        <div style={T.fieldWrap}>
          <span style={T.fieldLabel}>Loại báo cáo</span>
          <select
            style={T.select}
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
          >
            <option value="BOOKING">Đặt bàn</option>
            <option value="REVENUE">Doanh thu</option>
            <option value="DEPOSIT">Tiền cọc</option>
            <option value="INVOICE">Hoá đơn</option>
          </select>
        </div>

        <div style={T.fieldWrap}>
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Đang xuất…' : 'Xuất Excel'}
          </button>
          {exportErr && (
            <span style={{ ...T.fieldLabel, color: 'var(--danger, #dc2626)' }}>{exportErr}</span>
          )}
        </div>
      </div>

      <PeriodFilterBar state={periodState} onApply={load} />

      {loading && (
        <p style={{ fontSize: '.9rem', color: 'var(--text-muted)', padding: '.5rem 0 1rem' }}>Đang tải dữ liệu…</p>
      )}

      <Block title="Doanh thu hoá đơn">
        <KpiCardRow cards={arr(revenue.kpis)} />
        <div style={T.chartGrid}>
          <ChartBox caption="Doanh thu theo thời gian">
            <MiniBarChart data={arr(revenue.revenueByTime)} />
          </ChartBox>
          <ChartBox caption="Cơ cấu doanh thu">
            <MiniPieChart data={arr(revenue.revenueComposition)} />
          </ChartBox>
          <ChartBox caption="Phương thức thanh toán">
            <MiniPieChart data={arr(revenue.paymentMethodBreakdown)} />
          </ChartBox>
        </div>
      </Block>

      <Block title="Tiền cọc thu / hoàn / giữ">
        <KpiCardRow cards={arr(deposits.kpis)} />
        <div style={T.chartGrid}>
          <ChartBox caption="Dòng tiền cọc theo thời gian">
            <MiniBarChart data={arr(deposits.cashflowByTime)} colorBy="series" />
          </ChartBox>
          <ChartBox caption="Xử lý tiền cọc">
            <MiniPieChart data={arr(deposits.depositProcessingBreakdown)} />
          </ChartBox>
        </div>
      </Block>

      <Block title="Đặt bàn">
        <KpiCardRow cards={arr(reservations.kpis)} />
        <div style={T.chartGrid}>
          <ChartBox caption="Lượt đặt bàn theo thời gian">
            <MiniBarChart data={arr(reservations.reservationsByTime)} />
          </ChartBox>
          <ChartBox caption="Trạng thái đặt bàn">
            <MiniPieChart data={arr(reservations.statusBreakdown)} />
          </ChartBox>
        </div>
      </Block>

      <Block title="Khung giờ đông khách">
        <div style={T.chartGrid}>
          <ChartBox caption="Theo khung giờ">
            <MiniBarChart data={arr(peak.byHour)} colorBy="single" />
          </ChartBox>
          <ChartBox caption="Theo ngày trong tuần">
            <MiniBarChart data={arr(peak.byDayOfWeek)} colorBy="single" />
          </ChartBox>
        </div>
      </Block>

      <Block title="Gói dịch vụ nền tảng đang dùng">
        {!platformSub ? (
          <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Chưa đăng ký gói dịch vụ nào.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={T.caption}>Tên gói</div>
              <div style={{ fontWeight: 700, color: 'var(--brown)' }}>{platformSub.planNameSnapshot}</div>
            </div>
            <div>
              <div style={T.caption}>Ngày hết hạn</div>
              <div style={{ fontWeight: 700, color: 'var(--brown)' }}>{fmtDate(platformSub.currentPeriodEnd)}</div>
            </div>
            <div>
              <div style={T.caption}>Số chi nhánh tối đa</div>
              <div style={{ fontWeight: 700, color: 'var(--brown)' }}>
                {platformSub.maxBranchesSnapshot >= 999 ? 'Không giới hạn' : platformSub.maxBranchesSnapshot}
              </div>
            </div>
          </div>
        )}
        {platformInvoices.length === 0 ? (
          <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Chưa có hoá đơn nào.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--cream-dark)', textAlign: 'left' }}>
                  <th style={{ padding: '.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Kỳ/Gói</th>
                  <th style={{ padding: '.5rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Số tiền</th>
                  <th style={{ padding: '.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Trạng thái</th>
                  <th style={{ padding: '.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ngày thanh toán</th>
                </tr>
              </thead>
              <tbody>
                {platformInvoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--cream-dark)' }}>
                    <td style={{ padding: '.5rem', fontWeight: 600 }}>{inv.planSnapshotName}</td>
                    <td style={{ padding: '.5rem', textAlign: 'right', fontWeight: 700 }}>{fmtNum(inv.amount)}</td>
                    <td style={{ padding: '.5rem' }}>{INVOICE_STATUS_LABEL[inv.status] || inv.status}</td>
                    <td style={{ padding: '.5rem' }}>{fmtDate(inv.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Block>
    </div>
  )
}
