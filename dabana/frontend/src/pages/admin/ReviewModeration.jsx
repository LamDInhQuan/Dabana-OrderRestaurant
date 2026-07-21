import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import { adminApi } from '../../api'

function Stars({ value }) {
  return <span style={{ color: '#F59E0B' }}>{'★'.repeat(value)}{'☆'.repeat(5 - value)}</span>
}

export default function ReviewModeration() {
  const [reviews, setReviews]       = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage]             = useState(0)
  const [filter, setFilter]         = useState('all') // all | visible | hidden
  const [loading, setLoading]       = useState(true)
  const [reasonFor, setReasonFor]   = useState(null)
  const [reason, setReason]         = useState('')

  const load = () => {
    setLoading(true)
    const hidden = filter === 'all' ? undefined : filter === 'hidden'
    adminApi.listReviews({ hidden, page, size: 10 })
      .then(r => { setReviews(r.data.content || []); setTotalPages(r.data.totalPages || 0) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, filter])

  const hide = async (id) => {
    if (!reason.trim()) { toast.error('Vui lòng nhập lý do ẩn đánh giá'); return }
    try {
      await adminApi.hideReview(id, { reason })
      toast.success('Đã ẩn đánh giá')
      setReasonFor(null); setReason('')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Thao tác thất bại') }
  }

  const unhide = async (id) => {
    try {
      await adminApi.unhideReview(id)
      toast.success('Đã hiện lại đánh giá')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Thao tác thất bại') }
  }

  const remove = async (id) => {
    if (!window.confirm('Xoá vĩnh viễn đánh giá này? Hành động không thể hoàn tác.')) return
    try {
      await adminApi.deleteReview(id)
      toast.success('Đã xoá đánh giá')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Thao tác thất bại') }
  }

  return (
    <AdminLayout title="Kiểm duyệt đánh giá" >
      <div className="flex gap-2" style={{ marginBottom: '1.5rem' }}>
        {[['all', 'Tất cả'], ['visible', 'Đang hiển thị'], ['hidden', 'Đã ẩn']].map(([k, l]) => (
          <button key={k} onClick={() => { setFilter(k); setPage(0) }}
            className={filter === k ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}>{l}</button>
        ))}
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p> : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Không có đánh giá nào.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.map(r => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between" style={{ marginBottom: '.5rem' }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{r.customer?.fullName || 'Khách hàng'}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}> · Chi nhánh: {r.branch?.name || `#${r.branch?.id}`}</span>
                </div>
                <span className={`badge ${r.hidden ? 'badge-red' : 'badge-green'}`}>{r.hidden ? 'Đã ẩn' : 'Hiển thị'}</span>
              </div>
              <div className="flex gap-3" style={{ marginBottom: '.5rem', fontSize: '.85rem' }}>
                <span>Không gian: <Stars value={r.spaceRating} /></span>
                <span>Phục vụ: <Stars value={r.serviceRating} /></span>
                <span>Đồ ăn: <Stars value={r.foodRating} /></span>
              </div>
              {r.comment && <p style={{ fontSize: '.9rem', marginBottom: '.5rem' }}>&ldquo;{r.comment}&rdquo;</p>}
              {r.hidden && r.moderationNote && (
                <p style={{ fontSize: '.8rem', color: 'var(--accent)', marginBottom: '.5rem' }}>Lý do ẩn: {r.moderationNote}</p>
              )}

              {reasonFor === r.id ? (
                <div className="flex gap-2">
                  <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Lý do ẩn đánh giá..." style={{ flex: 1 }} />
                  <button className="btn-outline btn-sm" onClick={() => { setReasonFor(null); setReason('') }}>Huỷ</button>
                  <button className="btn-danger btn-sm" onClick={() => hide(r.id)}>Xác nhận ẩn</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  {r.hidden
                    ? <button className="btn-primary btn-sm" onClick={() => unhide(r.id)}>👁️ Hiện lại</button>
                    : <button className="btn-danger btn-sm" onClick={() => setReasonFor(r.id)}>🚫 Ẩn đánh giá</button>}
                  <button className="btn-outline btn-sm" onClick={() => remove(r.id)}>🗑️ Xoá vĩnh viễn</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-2" style={{ marginTop: '1rem', justifyContent: 'center' }}>
          <button className="btn-outline btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Trước</button>
          <span style={{ alignSelf: 'center', fontSize: '.85rem', color: 'var(--text-muted)' }}>Trang {page + 1} / {totalPages}</span>
          <button className="btn-outline btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Sau →</button>
        </div>
      )}
    </AdminLayout>
  )
}
