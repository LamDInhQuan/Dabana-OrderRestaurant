import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import { adminApi } from '../../api'

const STATUS_LABEL = {
  1: ['Chờ xác thực OTP', 'badge-gray'],
  2: ['Chờ duyệt', 'badge-yellow'],
  3: ['Đang hoạt động', 'badge-green'],
  4: ['Bị từ chối', 'badge-red'],
  5: ['Đã khoá', 'badge-red'],
}

const ROLE_LABEL = {
  CUSTOMER: 'Khách hàng',
  RESTAURANT_PARTNER: 'Nhà hàng đối tác',
  ADMIN: 'Quản trị viên',
}

function LockModal({ user, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const isLocking = user.status !== 5

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div className="card" style={{ width: 420, maxWidth: '90vw' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '.75rem' }}>
          {isLocking ? `Khoá tài khoản "${user.fullName}"?` : `Mở khoá tài khoản "${user.fullName}"?`}
        </h3>
        {isLocking && (
          <input value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Lý do khoá tài khoản..." style={{ marginBottom: '1rem', width: '100%' }} />
        )}
        <div className="flex gap-2 justify-between">
          <button className="btn-outline btn-sm" onClick={onClose}>Huỷ</button>
          <button className={isLocking ? 'btn-danger btn-sm' : 'btn-primary btn-sm'}
            onClick={() => onConfirm(isLocking, reason)}>
            {isLocking ? 'Xác nhận khoá' : 'Xác nhận mở khoá'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UserManagement() {
  const [users, setUsers]     = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage]       = useState(0)
  const [role, setRole]       = useState('')
  const [status, setStatus]   = useState('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalUser, setModalUser] = useState(null)

  const load = () => {
    setLoading(true)
    adminApi.searchUsers({ role: role || undefined, status: status || undefined, keyword: keyword || undefined, page, size: 15 })
      .then(r => { setUsers(r.data.content || []); setTotalPages(r.data.totalPages || 0) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, role, status])

  const search = (e) => {
    e.preventDefault()
    setPage(0)
    load()
  }

  const confirmLock = async (locked, reason) => {
    try {
      await adminApi.lockUser(modalUser.id, { locked, reason })
      toast.success(locked ? 'Đã khoá tài khoản' : 'Đã mở khoá tài khoản')
      setModalUser(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại')
    }
  }

  return (
    <AdminLayout title="Quản lý tài khoản người dùng" >
      <form onSubmit={search} className="flex gap-2" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input value={keyword} onChange={e => setKeyword(e.target.value)}
          placeholder="Tìm theo tên, email, SĐT..." style={{ flex: 1, minWidth: 200 }} />
        <select value={role} onChange={e => { setRole(e.target.value); setPage(0) }}>
          <option value="">Tất cả vai trò</option>
          <option value="CUSTOMER">Khách hàng</option>
          <option value="RESTAURANT_PARTNER">Nhà hàng đối tác</option>
          <option value="ADMIN">Quản trị viên</option>
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}>
          <option value="">Tất cả trạng thái</option>
          <option value="2">Chờ duyệt</option>
          <option value="3">Đang hoạt động</option>
          <option value="4">Bị từ chối</option>
          <option value="5">Đã khoá</option>
        </select>
        <button className="btn-primary btn-sm" type="submit">Tìm kiếm</button>
      </form>

      {loading ? <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p> : (
        <>
          <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  {['Họ tên', 'Email / SĐT', 'Vai trò', 'Trạng thái', ''].map(h => (
                    <th key={h} style={{ padding: '.75rem 1rem', fontSize: '.8rem', color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Không tìm thấy tài khoản nào.</td></tr>
                )}
                {users.map(u => {
                  const [label, cls] = STATUS_LABEL[u.status] || ['—', 'badge-gray']
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '.75rem 1rem', fontWeight: 600 }}>{u.fullName}</td>
                      <td style={{ padding: '.75rem 1rem', fontSize: '.85rem' }}>{u.email}<br /><span style={{ color: 'var(--text-muted)' }}>{u.phone}</span></td>
                      <td style={{ padding: '.75rem 1rem', fontSize: '.85rem' }}>{ROLE_LABEL[u.role] || u.role}</td>
                      <td style={{ padding: '.75rem 1rem' }}><span className={`badge ${cls}`}>{label}</span></td>
                      <td style={{ padding: '.75rem 1rem', textAlign: 'right' }}>
                        {u.role !== 'ADMIN' && u.status !== 2 && (
                          <button className={u.status === 5 ? 'btn-primary btn-sm' : 'btn-danger btn-sm'}
                            onClick={() => setModalUser(u)}>
                            {u.status === 5 ? 'Mở khoá' : 'Khoá'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex gap-2" style={{ marginTop: '1rem', justifyContent: 'center' }}>
              <button className="btn-outline btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Trước</button>
              <span style={{ alignSelf: 'center', fontSize: '.85rem', color: 'var(--text-muted)' }}>Trang {page + 1} / {totalPages}</span>
              <button className="btn-outline btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Sau →</button>
            </div>
          )}
        </>
      )}

      {modalUser && <LockModal user={modalUser} onClose={() => setModalUser(null)} onConfirm={confirmLock} />}
    </AdminLayout>
  )
}
