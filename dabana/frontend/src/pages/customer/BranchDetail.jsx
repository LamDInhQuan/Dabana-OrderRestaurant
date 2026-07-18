import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { branchApi, menuApi, reviewApi } from '../../api'
import { useAuth } from '../../context/AuthContext'

function unwrap(res) {
  const d = res?.data
  if (d && typeof d === 'object' && 'code' in d && 'data' in d) return d.data
  return d
}

const DAY_LABEL = {
  MONDAY: 'Thứ 2', TUESDAY: 'Thứ 3', WEDNESDAY: 'Thứ 4', THURSDAY: 'Thứ 5',
  FRIDAY: 'Thứ 6', SATURDAY: 'Thứ 7', SUNDAY: 'Chủ nhật',
}

export default function BranchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const [branch, setBranch]     = useState(null)
  const [categories, setCategories] = useState([])
  const [hours, setHours]       = useState([])
  const [reviews, setReviews]   = useState([])
  const [tab, setTab]           = useState('info') // info | menu | reviews

  useEffect(() => {
    branchApi.getById(id).then(r => setBranch(unwrap(r)))
    menuApi.getByBranch(id).then(r => setCategories(
      (unwrap(r) || []).map(c => ({ ...c, items: (c.items || []).filter(i => i.status === 'SELLING') }))
    )).catch(() => setCategories([]))
//    operatingHourApi.getByBranch(id).then(r => setHours(unwrap(r) || [])).catch(() => setHours([]))
    reviewApi.getByBranch(id, { page: 0, size: 10 }).then(r => {
      const d = unwrap(r)
      setReviews(d?.content || d || [])
    })
  }, [id])

  if (!branch) return (
    <>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Đang tải...</div>
    </>
  )

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.spaceRating + r.serviceRating + r.foodRating) / 3, 0) / reviews.length).toFixed(1)
    : null

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div style={{
        height: 260, background: 'linear-gradient(135deg,var(--brand) 0%,#8B5CF6 100%)',
        display: 'flex', alignItems: 'flex-end', padding: '1.5rem'
      }}>
        <div style={{ color: '#fff' }}>
          <h1 style={{ fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 800, marginBottom: '.4rem' }}>{branch.name}</h1>
          <p style={{ opacity: .9, fontSize: '.95rem' }}>📍 {branch.address}</p>
          {avgRating && <p style={{ opacity: .85, fontSize: '.9rem', marginTop: '.25rem' }}>⭐ {avgRating} · {reviews.length} đánh giá</p>}
        </div>
      </div>

      <div className="page-container" style={{ padding: '1.5rem 1rem' }}>
        {/* Tabs */}
        <div className="flex gap-3" style={{ borderBottom: '2px solid var(--border)', marginBottom: '1.5rem' }}>
          {[['info','Thông tin'],['menu','Thực đơn'],['reviews','Đánh giá']].map(([k,label]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{
                padding: '.6rem 1rem', background: 'none', borderRadius: 0, fontWeight: 600,
                fontSize: '.9rem', color: tab === k ? 'var(--brand)' : 'var(--text-muted)',
                borderBottom: tab === k ? '2px solid var(--brand)' : '2px solid transparent',
                marginBottom: -2
              }}>{label}</button>
          ))}
        </div>

        {/* TAB: Thông tin */}
        {tab === 'info' && (
          <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 700, marginBottom: '.75rem' }}>Giới thiệu</h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                📍 {branch.address || 'Chưa cập nhật địa chỉ.'}
              </p>
              {branch.phone && (
                <p style={{ color: 'var(--text-muted)', marginTop: '.4rem' }}>☎️ {branch.phone}</p>
              )}
            </div>
            <div className="card">
              <h2 style={{ fontWeight: 700, marginBottom: '.75rem' }}>Giờ mở cửa</h2>
              {hours.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Chưa cập nhật giờ mở cửa.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  {hours.map(h => (
                    <div key={h.id} className="flex justify-between" style={{ fontSize: '.88rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {DAY_LABEL[h.dayOfWeek] || h.dayOfWeek}{h.shiftName ? ` · ${h.shiftName}` : ''}
                      </span>
                      <span style={{ fontWeight: 600 }}>
                        {String(h.openTime).slice(0, 5)} – {String(h.closeTime).slice(0, 5)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Thực đơn */}
        {tab === 'menu' && (
          <div>
            {categories.length === 0
              ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Thực đơn đang được cập nhật.</p>
              : categories.map(cat => (
                <div key={cat.id} style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontWeight: 700, marginBottom: '.75rem', color: 'var(--text-muted)' }}>{cat.categoryName}</h3>
                  <div className="grid-2">
                    {cat.items.map(item => (
                      <div key={item.id} className="card flex gap-3" style={{ padding: '1rem' }}>
                        <div style={{
                          width: 72, height: 72, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                          background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem'
                        }}>
                          {item.imageUrl ? <img src={item.imageUrl} alt={item.itemName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍜'}
                        </div>
                        <div>
                          <h3 style={{ fontWeight: 700, fontSize: '.95rem' }}>{item.itemName}</h3>
                          {item.description && <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.4rem' }}>{item.description}</p>}
                          <p style={{ color: 'var(--brand)', fontWeight: 700 }}>{Number(item.price).toLocaleString('vi-VN')}₫</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* TAB: Đánh giá */}
        {tab === 'reviews' && (
          <div>
            {reviews.length === 0
              ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Chưa có đánh giá nào.</p>
              : reviews.map(r => (
                <div key={r.id} className="card" style={{ marginBottom: '.875rem' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '.5rem' }}>
                    <span style={{ fontWeight: 700 }}>{r.customer?.fullName || 'Khách hàng'}</span>
                    <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                      {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex gap-3" style={{ marginBottom: '.5rem', fontSize: '.82rem' }}>
                    <span>🏠 Không gian: <strong>{r.spaceRating}/5</strong></span>
                    <span>👨‍🍳 Phục vụ: <strong>{r.serviceRating}/5</strong></span>
                    <span>🍴 Đồ ăn: <strong>{r.foodRating}/5</strong></span>
                  </div>
                  {r.comment && <p style={{ color: 'var(--text-muted)', fontSize: '.88rem', lineHeight: 1.6 }}>{r.comment}</p>}
                </div>
              ))
            }
          </div>
        )}

        {/* CTA: Đặt bàn */}
        <div style={{
          position: 'sticky', bottom: 0, background: 'var(--white)',
          borderTop: '1px solid var(--border)', padding: '1rem 0', marginTop: '1.5rem'
        }}>
          <button className="btn-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700, borderRadius: 12 }}
            onClick={() => auth ? navigate(`/booking/${id}`) : navigate('/login')}>
            🗓️ Đặt bàn tại chi nhánh này
          </button>
        </div>
      </div>
    </>
  )
}
