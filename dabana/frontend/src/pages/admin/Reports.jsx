import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import { adminApi } from '../../api'

function formatVnd(v) {
  return Number(v || 0).toLocaleString('vi-VN') + ' đ'
}

function BarRow({ label, value, max, color }) {
  const pct = max > 0 ? Math.max((value / max) * 100, 2) : 2
  return (
    <div style={{ marginBottom: '.75rem' }}>
      <div className="flex items-center justify-between" style={{ fontSize: '.82rem', marginBottom: '.25rem' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ background: 'var(--cream-dark)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
    </div>
  )
}

export default function Reports() {
  const [revenue, setRevenue] = useState([])
  const [daily, setDaily]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.revenueByRestaurant().then(r => setRevenue(r.data || [])),
      adminApi.bookingsDaily(14).then(r => setDaily(r.data || [])),
    ]).finally(() => setLoading(false))
  }, [])

  const maxDaily = Math.max(...daily.map(d => d.count), 1)
  const download = (type) => window.open(adminApi.exportReportUrl(type), '_blank')

  return (
    <AdminLayout title="Báo cáo & thống kê" subtitle="F47–F50 · Doanh thu theo nhà hàng, thống kê lượt đặt bàn và xuất báo cáo">
      <div className="flex gap-2" style={{ marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button className="btn-outline btn-sm" onClick={() => download('users')}>⬇️ Xuất báo cáo người dùng (CSV)</button>
        <button className="btn-outline btn-sm" onClick={() => download('restaurants')}>⬇️ Xuất báo cáo nhà hàng (CSV)</button>
        <button className="btn-outline btn-sm" onClick={() => download('revenue')}>⬇️ Xuất báo cáo doanh thu (CSV)</button>
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p> : (
        <div className="grid-2">
          {/* F48: booking trend */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Lượt đặt bàn 14 ngày gần nhất</h3>
            {daily.length === 0
              ? <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Chưa có dữ liệu.</p>
              : daily.map(d => (
                  <BarRow key={d.date} label={d.date} value={d.count} max={maxDaily} color="var(--brand)" />
                ))}
          </div>

          {/* F47: revenue by restaurant */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Doanh thu theo nhà hàng (tạm tính)</h3>
            {revenue.length === 0
              ? <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Chưa có dữ liệu.</p>
              : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '.5rem' }}>Nhà hàng</th>
                        <th style={{ padding: '.5rem' }}>Chi nhánh</th>
                        <th style={{ padding: '.5rem' }}>Đơn hoàn tất</th>
                        <th style={{ padding: '.5rem', textAlign: 'right' }}>Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenue.map(r => (
                        <tr key={r.restaurantId} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '.5rem', fontWeight: 600 }}>{r.restaurantName}</td>
                          <td style={{ padding: '.5rem' }}>{r.branchCount}</td>
                          <td style={{ padding: '.5rem' }}>{r.completedBookings}</td>
                          <td style={{ padding: '.5rem', textAlign: 'right', fontWeight: 700, color: '#16A34A' }}>{formatVnd(r.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
