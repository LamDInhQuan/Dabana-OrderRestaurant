import { useState, useEffect, useCallback } from 'react'
import AdminLayout from './AdminLayout'
import { adminReportApi } from '../../api'
import { usePeriodState } from '../../features/reports/usePeriodState'
import PeriodFilterBar from '../../features/reports/PeriodFilterBar'
import KpiCardRow from '../../features/reports/KpiCardRow'
import MiniBarChart from '../../features/reports/MiniBarChart'
import MiniPieChart from '../../features/reports/MiniPieChart'

// Design tokens dùng chung — định nghĩa 1 lần, tái sử dụng cho cả 5 block để đồng nhất.
const S = {
  card: {
    background: 'var(--cream)',
    border: '1px solid var(--cream-dark)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,.05)',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--brown)',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: '1px solid var(--cream-dark)',
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 16,
    marginTop: 16,
  },
  chartBox: {
    background: 'var(--cream)',
    border: '1px solid var(--cream-dark)',
    borderRadius: 10,
    padding: 16,
  },
  caption: {
    fontSize: '.78rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: '.02em',
  },
  muted: { fontSize: '.85rem', color: 'var(--text-muted)' },
}

function formatNumber(v) {
  return Number(v || 0).toLocaleString('vi-VN')
}

function Section({ title, children }) {
  return (
    <section style={S.card}>
      <h2 style={S.sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}

// Panel biểu đồ: caption mờ phía trên + nội dung, viền nhạt — đọc như một dashboard thật.
function ChartBox({ caption, children }) {
  return (
    <div style={S.chartBox}>
      <div style={S.caption}>{caption}</div>
      {children}
    </div>
  )
}

function TopBranchTable({ rows = [] }) {
  if (!rows.length) return <p style={S.muted}>Chưa có dữ liệu.</p>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--cream-dark)', textAlign: 'left' }}>
            <th style={{ padding: '.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Chi nhánh</th>
            <th style={{ padding: '.5rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Lượt đặt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.branchId ?? r.branchName} style={{ borderBottom: '1px solid var(--cream-dark)' }}>
              <td style={{ padding: '.5rem', fontWeight: 600 }}>{r.branchName}</td>
              <td style={{ padding: '.5rem', textAlign: 'right', fontWeight: 700 }}>{formatNumber(r.reservationCount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Nhà hàng sắp hết hạn gói — cùng khuôn bảng với TopBranchTable ở trên.
function UpcomingExpiryTable({ rows = [] }) {
  if (!rows.length) return <p style={S.muted}>Không có nhà hàng sắp hết hạn.</p>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--cream-dark)', textAlign: 'left' }}>
            <th style={{ padding: '.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Nhà hàng</th>
            <th style={{ padding: '.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Gói</th>
            <th style={{ padding: '.5rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Ngày hết hạn</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.restaurantId ?? r.restaurantName} style={{ borderBottom: '1px solid var(--cream-dark)' }}>
              <td style={{ padding: '.5rem', fontWeight: 600 }}>{r.restaurantName}</td>
              <td style={{ padding: '.5rem' }}>{r.planName}</td>
              <td style={{ padding: '.5rem', textAlign: 'right' }}>{r.expiryDate ? new Date(r.expiryDate).toLocaleDateString('vi-VN') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Reports() {
  const periodState = usePeriodState('MONTH')
  const { queryParams } = periodState
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    setLoading(true)
    Promise.all([
      adminReportApi.subscriptions(queryParams),
      adminReportApi.restaurants(queryParams),
      adminReportApi.reservations(queryParams),
      adminReportApi.deposits(queryParams),
      adminReportApi.users(queryParams),
    ])
      .then(([sub, rst, rsv, dep, usr]) => {
        setData({
          subscriptions: sub.data?.data || {},
          restaurants: rst.data?.data || {},
          reservations: rsv.data?.data || {},
          deposits: dep.data?.data || {},
          users: usr.data?.data || {},
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [queryParams])

  useEffect(() => { reload() }, [reload])

  const sub = data.subscriptions || {}
  const rst = data.restaurants || {}
  const rsv = data.reservations || {}
  const dep = data.deposits || {}
  const usr = data.users || {}

  return (
    <AdminLayout title="Báo cáo & thống kê">
      <PeriodFilterBar state={periodState} onApply={reload} />

      {loading && <p style={{ ...S.muted, marginBottom: 16 }}>Đang tải dữ liệu...</p>}

      {/* 1. Gói dịch vụ */}
      <Section title="Gói dịch vụ (đăng ký & doanh thu)">
        <KpiCardRow cards={sub.kpis || []} />
        <div style={S.chartGrid}>
          <ChartBox caption="Doanh thu theo thời gian">
            <MiniBarChart data={sub.revenueByTime || []} colorBy="series" />
          </ChartBox>
          <ChartBox caption="Tỷ trọng doanh thu theo gói">
            <MiniPieChart data={sub.revenueByPlan || []} />
          </ChartBox>
        </div>
        <div style={{ ...S.chartGrid, gridTemplateColumns: '1fr' }}>
          <ChartBox caption="Cơ cấu trạng thái đăng ký">
            <MiniPieChart data={sub.subscriptionStatusBreakdown || []} />
          </ChartBox>
        </div>
        <div style={{ ...S.chartGrid, gridTemplateColumns: '1fr' }}>
          <ChartBox caption="Nhà hàng sắp hết hạn gói (7 ngày tới)">
            <UpcomingExpiryTable rows={sub.upcomingExpiries || []} />
          </ChartBox>
        </div>
      </Section>

      {/* 2. Nhà hàng */}
      <Section title="Nhà hàng">
        <KpiCardRow cards={rst.kpis || []} />
        <div style={S.chartGrid}>
          <ChartBox caption="Nhà hàng mới theo thời gian">
            <MiniBarChart data={rst.newRestaurantsByTime || []} colorBy="single" />
          </ChartBox>
          <ChartBox caption="Tỷ trọng trạng thái phê duyệt">
            <MiniPieChart data={rst.approvalStatusBreakdown || []} />
          </ChartBox>
        </div>
      </Section>

      {/* 3. Đặt bàn */}
      <Section title="Đặt bàn">
        <KpiCardRow cards={rsv.kpis || []} />
        <div style={S.chartGrid}>
          <ChartBox caption="Lượt đặt theo thời gian">
            <MiniBarChart data={rsv.reservationsByTime || []} colorBy="single" />
          </ChartBox>
          <ChartBox caption="Tỷ trọng trạng thái đặt bàn">
            <MiniPieChart data={rsv.statusBreakdown || []} />
          </ChartBox>
        </div>
        <div style={{ ...S.chartGrid, gridTemplateColumns: '1fr' }}>
          <ChartBox caption="Top chi nhánh">
            <TopBranchTable rows={rsv.topBranches || []} />
          </ChartBox>
        </div>
      </Section>

      {/* 4. Tiền cọc */}
      <Section title="Tiền cọc (dòng tiền)">
        <KpiCardRow cards={dep.kpis || []} />
        <div style={S.chartGrid}>
          <ChartBox caption="Dòng tiền theo thời gian">
            <MiniBarChart data={dep.cashflowByTime || []} colorBy="series" />
          </ChartBox>
          <ChartBox caption="Cơ cấu dòng tiền">
            <MiniPieChart data={dep.cashflowBreakdown || []} />
          </ChartBox>
        </div>
      </Section>

      {/* 5. Người dùng */}
      <Section title="Người dùng mới">
        <KpiCardRow cards={usr.kpis || []} />
        <div style={{ ...S.chartGrid, gridTemplateColumns: '1fr' }}>
          <ChartBox caption="Người dùng mới theo thời gian (theo vai trò)">
            <MiniBarChart data={usr.newUsersByTimeByRole || []} colorBy="series" />
          </ChartBox>
        </div>
      </Section>
    </AdminLayout>
  )
}
