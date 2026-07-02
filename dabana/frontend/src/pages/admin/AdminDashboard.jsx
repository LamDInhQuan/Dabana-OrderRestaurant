import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { adminApi } from '../../api'

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="card" style={{ borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: '1.8rem', marginBottom: '.4rem' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '.85rem', fontWeight: 600, marginTop: '.35rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>{sub}</div>}
    </div>
  )
}

export default function AdminDashboard() {
  const [summary, setSummary]   = useState(null)
  const [pending, setPending]   = useState({ users: 0, restaurants: 0, branches: 0 })
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.platformSummary().then(r => setSummary(r.data)),
      adminApi.pendingUsers().then(r => setPending(p => ({ ...p, users: r.data.length }))),
      adminApi.pendingRestaurants().then(r => setPending(p => ({ ...p, restaurants: r.data.length }))),
      adminApi.pendingBranches().then(r => setPending(p => ({ ...p, branches: r.data.length }))),
    ]).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ padding: '2rem 1rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '.5rem' }}>Tổng quan nền tảng</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '.9rem' }}>B15 – Thống kê toàn hệ thống</p>

        {loading ? <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p> : (
          <>
            <div className="grid-3" style={{ marginBottom: '2rem' }}>
              <StatCard icon="👥" label="Tổng người dùng"    value={summary?.totalUsers || 0}       color="var(--brand)" />
              <StatCard icon="🏢" label="Tổng nhà hàng"      value={summary?.totalRestaurants || 0}  color="#8B5CF6" />
              <StatCard icon="🏪" label="Tổng chi nhánh"     value={summary?.totalBranches || 0}     color="#22C55E" />
            </div>

            {/* Pending approvals */}
            <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Chờ phê duyệt</h2>
            <div className="grid-3" style={{ marginBottom: '2rem' }}>
              <Link to="/admin/approvals?tab=users" style={{ textDecoration: 'none' }}>
                <div className="card" style={{ border: pending.users > 0 ? '2px solid var(--accent)' : '1px solid var(--border)', cursor: 'pointer' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '.4rem' }}>👤</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>{pending.users}</div>
                  <div style={{ fontSize: '.87rem', fontWeight: 600 }}>Tài khoản đối tác</div>
                  {pending.users > 0 && <div style={{ fontSize: '.78rem', color: 'var(--accent)', marginTop: '.2rem' }}>⚠️ Cần duyệt</div>}
                </div>
              </Link>
              <Link to="/admin/approvals?tab=restaurants" style={{ textDecoration: 'none' }}>
                <div className="card" style={{ border: pending.restaurants > 0 ? '2px solid #F59E0B' : '1px solid var(--border)', cursor: 'pointer' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '.4rem' }}>🏢</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B' }}>{pending.restaurants}</div>
                  <div style={{ fontSize: '.87rem', fontWeight: 600 }}>Hồ sơ nhà hàng</div>
                </div>
              </Link>
              <Link to="/admin/approvals?tab=branches" style={{ textDecoration: 'none' }}>
                <div className="card" style={{ border: pending.branches > 0 ? '2px solid #3B82F6' : '1px solid var(--border)', cursor: 'pointer' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '.4rem' }}>🏪</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3B82F6' }}>{pending.branches}</div>
                  <div style={{ fontSize: '.87rem', fontWeight: 600 }}>Chi nhánh</div>
                </div>
              </Link>
            </div>

            <Link to="/admin/approvals">
              <button className="btn-primary" style={{ padding: '.8rem 2rem' }}>
                Đi đến trang phê duyệt →
              </button>
            </Link>
          </>
        )}
      </div>
    </>
  )
}
