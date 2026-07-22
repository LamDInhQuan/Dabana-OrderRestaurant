import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
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

function formatVnd(v) {
  const n = Number(v || 0)
  return n.toLocaleString('vi-VN') + ' đ'
}

function timeAgo(iso) {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'vừa xong'
  if (min < 60) return `${min} phút trước`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} giờ trước`
  return `${Math.floor(hr / 24)} ngày trước`
}

const ACTIVITY_ICON = {
  USER_REGISTERED: '👤',
  RESTAURANT_SUBMITTED: '🏢',
  BRANCH_SUBMITTED: '🏪',
  BOOKING_CREATED: '📅',
  REVIEW_POSTED: '⭐',
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [summary, setSummary]   = useState(null)
  const [pending, setPending]   = useState({ users: 0, restaurants: 0, branches: 0 })
  const [activity, setActivity] = useState([])
  const [loading, setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    Promise.allSettled([
      adminApi.platformSummary().then(r => setSummary(r.data)),
      adminApi.pendingUsers().then(r => setPending(p => ({ ...p, users: (r.data || []).length }))),
      adminApi.pendingRestaurants().then(r => setPending(p => ({ ...p, restaurants: (r.data || []).length }))),
      adminApi.pendingBranches().then(r => setPending(p => ({ ...p, branches: (r.data || []).length }))),
      adminApi.recentActivity(10).then(r => setActivity(r.data || [])),
    ]).then((results) => {
      const failed = results.filter(r => r.status === 'rejected')
    }).finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout title="Tổng quan nền tảng" >
      {loading ? <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p> : (
        <>
          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            <StatCard icon="👥" label="Tổng người dùng"    value={summary?.totalUsers || 0}       color="var(--brand)" />
            <StatCard icon="🏢" label="Tổng nhà hàng"      value={summary?.totalRestaurants || 0}  color="#8B5CF6" />
            <StatCard icon="🏪" label="Tổng chi nhánh"     value={summary?.totalBranches || 0}     color="#22C55E" />
            <StatCard icon="📅" label="Tổng lượt đặt bàn"  value={summary?.totalBookings || 0}     color="#3B82F6"
              sub={`${summary?.completedBookings || 0} hoàn tất · ${summary?.noShowBookings || 0} không đến`} />
            <StatCard icon="⭐" label="Tổng đánh giá"       value={summary?.totalReviews || 0}      color="#F59E0B"
              sub={`${summary?.hiddenReviews || 0} đã ẩn`} />
            <StatCard icon="💰" label="Doanh thu (tạm tính)" value={formatVnd(summary?.totalRevenue)} color="#16A34A" />
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

          <button
            type="button"
            className="btn-primary"
            style={{ padding: '.8rem 2rem', marginBottom: '2rem' }}
            onClick={() => navigate('/admin/approvals')}
          >
            Đi đến trang phê duyệt →
          </button>

          {/* F46: Recent activity feed */}
          <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Hoạt động gần đây</h2>
          <div className="card">
            {activity.length === 0
              ? <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Chưa có hoạt động nào.</p>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
                  {activity.map((e, i) => (
                    <div key={i} className="flex items-center justify-between" style={{ borderBottom: i < activity.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: i < activity.length - 1 ? '.9rem' : 0 }}>
                      <div className="flex items-center gap-2">
                        <span>{ACTIVITY_ICON[e.type] || '•'}</span>
                        <span style={{ fontSize: '.88rem' }}>{e.message}</span>
                      </div>
                      <span style={{ fontSize: '.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{timeAgo(e.time)}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </>
      )}
    </AdminLayout>
  )
}
