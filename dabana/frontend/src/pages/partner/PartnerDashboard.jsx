import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { branchApi, bookingApi } from '../../api'

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={{ borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: '1.6rem', marginBottom: '.4rem' }}>{icon}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

export default function PartnerDashboard() {
  const [branches, setBranches]   = useState([])
  const [bookings, setBookings]   = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      branchApi.getMyList().then(r => setBranches(r.data || [])),
    ]).finally(() => setLoading(false))
  }, [])

  const confirmedToday = bookings.filter(b =>
    b.status === 'CONFIRMED' &&
    new Date(b.reservationTime).toDateString() === new Date().toDateString()
  ).length

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ padding: '2rem 1rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '1.75rem' }}>
          Tổng quan chi nhánh
        </h1>

        {loading ? <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p> : (
          <>
            {/* Stats */}
            <div className="grid-3" style={{ marginBottom: '2rem' }}>
              <StatCard icon="🏪" label="Số chi nhánh" value={branches.length} color="var(--brand)" />
              <StatCard icon="📅" label="Đặt bàn hôm nay" value={confirmedToday} color="#22C55E" />
              <StatCard icon="⭐" label="Đánh giá TB" value="4.5" color="#F59E0B" />
            </div>

            {/* Danh sách chi nhánh */}
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Chi nhánh của bạn</h2>
            </div>

            {branches.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Bạn chưa có chi nhánh nào.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {branches.map(b => (
                  <div key={b.id} className="card" style={{ border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '.75rem' }}>
                      <div>
                        <h3 style={{ fontWeight: 700 }}>{b.name}</h3>
                        <p style={{ fontSize: '.87rem', color: 'var(--text-muted)' }}>{b.address}</p>
                      </div>
                      <span className={`badge ${b.approvalStatus === 'APPROVED' ? 'badge-green' : 'badge-yellow'}`}>
                        {b.approvalStatus === 'APPROVED' ? 'Đã duyệt' : 'Chờ duyệt'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/partner/table-layout/${b.id}`}>
                        <button className="btn-outline btn-sm">🪑 Sơ đồ bàn</button>
                      </Link>
                      <Link to={`/partner/menu/${b.id}`}>
                        <button className="btn-outline btn-sm">🍜 Thực đơn</button>
                      </Link>
                      <Link to={`/partner/bookings?branchId=${b.id}`}>
                        <button className="btn-primary btn-sm">📋 Đặt bàn</button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
