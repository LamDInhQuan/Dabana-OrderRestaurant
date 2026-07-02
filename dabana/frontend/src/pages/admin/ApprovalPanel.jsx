import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../../components/Navbar'
import { adminApi } from '../../api'

function ApprovalCard({ item, type, onApprove, onReject }) {
  const [reason, setReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  const name = item.fullName || item.brandName || item.name || `ID: ${item.id}`
  const sub  = item.email || item.cuisineType || item.address || ''

  return (
    <div className="card" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '.625rem' }}>
        <div>
          <h3 style={{ fontWeight: 700 }}>{name}</h3>
          <p style={{ fontSize: '.83rem', color: 'var(--text-muted)' }}>{sub}</p>
        </div>
        <span className="badge badge-yellow">Chờ duyệt</span>
      </div>

      {!showReject ? (
        <div className="flex gap-2">
          <button className="btn-primary btn-sm" onClick={() => onApprove(item.id)}>✅ Phê duyệt</button>
          <button className="btn-danger btn-sm" onClick={() => setShowReject(true)}>❌ Từ chối</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Lý do từ chối (B02 EF04)..." />
          <div className="flex gap-2">
            <button className="btn-outline btn-sm" onClick={() => setShowReject(false)}>Huỷ</button>
            <button className="btn-danger btn-sm" onClick={() => onReject(item.id, reason)}>Xác nhận từ chối</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ApprovalPanel() {
  const [searchParams] = useSearchParams()
  const [tab, setTab]  = useState(searchParams.get('tab') || 'users')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const loaders = {
    users:       adminApi.pendingUsers,
    restaurants: adminApi.pendingRestaurants,
    branches:    adminApi.pendingBranches,
  }

  const load = () => {
    setLoading(true)
    loaders[tab]().then(r => { setData(r.data || []); setLoading(false) })
  }
  useEffect(() => { load() }, [tab])

  const approve = async (id) => {
    try {
      if (tab === 'users')       await adminApi.approveUser(id, { approved: true })
      if (tab === 'restaurants') await adminApi.approveRestaurant(id, { approved: true })
      if (tab === 'branches')    await adminApi.approveBranch(id, { approved: true })
      toast.success('Đã phê duyệt!')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi phê duyệt') }
  }

  const reject = async (id, reason) => {
    if (!reason.trim()) { toast.error('Vui lòng nhập lý do từ chối'); return }
    try {
      if (tab === 'users')       await adminApi.approveUser(id, { approved: false, reason })
      if (tab === 'restaurants') await adminApi.approveRestaurant(id, { approved: false, reason })
      if (tab === 'branches')    await adminApi.approveBranch(id, { approved: false, reason })
      toast.success('Đã từ chối')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi từ chối') }
  }

  const TABS = [
    ['users', '👤 Tài khoản đối tác (B02)'],
    ['restaurants', '🏢 Hồ sơ nhà hàng (B03)'],
    ['branches', '🏪 Chi nhánh (B04)'],
  ]

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ padding: '2rem 1rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '1.5rem' }}>Phê duyệt nội dung</h1>

        {/* Tabs */}
        <div className="flex gap-2" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ padding: '.5rem 1rem', borderRadius: 99, fontWeight: 600, fontSize: '.85rem',
                background: tab === k ? 'var(--brand)' : 'var(--white)',
                color: tab === k ? '#fff' : 'var(--text-muted)',
                border: '1.5px solid', borderColor: tab === k ? 'var(--brand)' : 'var(--border)' }}>
              {l}
            </button>
          ))}
        </div>

        {loading ? <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p>
          : data.length === 0
            ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
                <p>Không có mục nào chờ phê duyệt.</p>
              </div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {data.map(item => (
                  <ApprovalCard key={item.id} item={item} type={tab}
                    onApprove={approve} onReject={reject} />
                ))}
              </div>
            )
        }
      </div>
    </>
  )
}
