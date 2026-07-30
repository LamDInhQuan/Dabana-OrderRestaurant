import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { branchApi, menuApi, reviewApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { MapPin, Star, Search, Phone, Map, Soup, Home, ChefHat, Utensils, Calendar } from 'lucide-react'

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
  const [branch, setBranch] = useState(null)
  const [categories, setCategories] = useState([])
  const [hours, setHours] = useState([])
  const [reviews, setReviews] = useState([])
  const [tab, setTab] = useState('info') // info | menu | reviews

  // State lọc đánh giá (ALL | MY | 5 | 4 | 3 | 2 | 1)
  const [reviewFilter, setReviewFilter] = useState('ALL')

  // State quản lý việc hiển thị Modal phóng to ảnh
  const [activeImage, setActiveImage] = useState(null)

  useEffect(() => {
    branchApi.getById(id).then(r => setBranch(unwrap(r)))
    menuApi.getByBranch(id).then(r => setCategories(
      (unwrap(r) || []).map(c => ({ ...c, items: (c.items || []).filter(i => i.status === 'SELLING') }))
    )).catch(() => setCategories([]))
    
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

  // Lọc lấy ảnh bìa (isCover === 1) làm background Hero, nếu không có lấy ảnh đầu tiên
  const coverImage = branch.branchImageDtos?.find(img => img.isCover === 1)?.imageUrl 
    || branch.branchImageDtos?.[0]?.imageUrl 
    || null

  const galleryImages = branch.branchImageDtos || []

  // Logic lọc danh sách đánh giá
  const filteredReviews = reviews.filter(r => {
    const itemAvg = ((r.spaceRating || 5) + (r.serviceRating || 5) + (r.foodRating || 5)) / 3;
    if (reviewFilter === 'MY') {
      const currentUserId = auth?.userId || auth?.id || auth?.user?.id;
      const reviewUserId = r.customer?.id || r.customerId;
      return currentUserId && reviewUserId && String(currentUserId) === String(reviewUserId);
    }
    if (reviewFilter === '5') return Math.round(itemAvg) === 5;
    if (reviewFilter === '4') return Math.round(itemAvg) === 4;
    if (reviewFilter === '3') return Math.round(itemAvg) === 3;
    if (reviewFilter === '2') return Math.round(itemAvg) === 2;
    if (reviewFilter === '1') return Math.round(itemAvg) === 1;
    return true;
  });

  return (
    <>
      <Navbar />

      {/* Hero với Ảnh bìa */}
      <div style={{
        position: 'relative',
        height: 320,
        backgroundImage: coverImage ? `url(${coverImage})` : 'linear-gradient(135deg,var(--brand) 0%,#8B5CF6 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'flex-end',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)'
        }} />
        <div className="page-container" style={{ position: 'relative', zIndex: 2, padding: '1.5rem', width: '100%', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'inline-block', padding: '4px 10px', background: 'var(--brand)', borderRadius: 20, fontSize: '.75rem', fontWeight: 600, marginBottom: '.5rem' }}>
              Đang mở cửa
            </div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: '.4rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {branch.name}
            </h1>
            <p style={{ opacity: .95, fontSize: '.95rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={16} /> {branch.address} {branch.province ? `(${branch.province})` : ''}
            </p>
            {avgRating && (
              <p style={{ opacity: .9, fontSize: '.9rem', marginTop: '.3rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#FBBF24', display: 'inline-flex' }}><Star size={16} fill="currentColor" /></span> <strong>{avgRating}</strong> · {reviews.length} đánh giá từ thực khách
              </p>
            )}
          </div>

          {coverImage && (
            <button 
              onClick={() => setActiveImage(coverImage)}
              style={{
                background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
                padding: '6px 12px', borderRadius: 8, fontSize: '.8rem', cursor: 'pointer', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', gap: '5px', transition: 'background 0.2s', flexShrink: 0
              }}
            >
              <Search size={16} /> Xem ảnh bìa
            </button>
          )}
        </div>
      </div>

      <div className="page-container" style={{ padding: '1.5rem 1rem' }}>
        {/* Tabs */}
        <div className="flex gap-3" style={{ borderBottom: '2px solid var(--border)', marginBottom: '1.5rem' }}>
          {[['info', 'Thông tin & Không gian'], ['menu', 'Thực đơn'], ['reviews', 'Đánh giá']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{
                padding: '.6rem 1rem', background: 'none', borderRadius: 0, fontWeight: 600,
                fontSize: '.9rem', color: tab === k ? 'var(--brand)' : 'var(--text-muted)',
                borderBottom: tab === k ? '2px solid var(--brand)' : '2px solid transparent',
                cursor: 'pointer', marginBottom: -2, transition: 'all 0.2s'
              }}>{label}</button>
          ))}
        </div>

        {/* TAB: Thông tin */}
        {tab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Giới thiệu chi nhánh */}
            <div className="card" style={{ padding: '1.25rem', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '.75rem', color: '#111827' }}>Về chi nhánh</h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '.92rem' }}>
                <MapPin size={16} style={{ verticalAlign: '-3px' }} /> <strong>Địa chỉ chi tiết:</strong> {branch.address || 'Chưa cập nhật địa chỉ.'} {branch.province ? `- ${branch.province}` : ''}
              </p>
              {branch.phone && (
                <p style={{ color: 'var(--text-muted)', marginTop: '.5rem', fontSize: '.92rem' }}>
                  <Phone size={16} style={{ verticalAlign: '-3px' }} /> <strong>Hotline liên hệ:</strong> <a href={`tel:${branch.phone}`} style={{ color: 'var(--brand)', textDecoration: 'none' }}>{branch.phone}</a>
                </p>
              )}
            </div>

            {/* BẢN ĐỒ VỊ TRÍ CHÍNH XÁC (TỪ LATITUDE & LONGITUDE) */}
            {branch.latitude && branch.longitude && (
              <div className="card" style={{ padding: '1.25rem', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
                  <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827', margin: 0 }}>Vị trí bản đồ</h2>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontSize: '.82rem', color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}
                  >
                    <Map size={15} style={{ verticalAlign: '-2px' }} /> Mở Google Maps lớn &rarr;
                  </a>
                </div>
                <div style={{ width: '100%', height: 260, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <iframe
                    title="Branch Map Location"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://maps.google.com/maps?q=${branch.latitude},${branch.longitude}&z=15&output=embed`}
                  />
                </div>
              </div>
            )}

            {/* Bộ sưu tập ảnh */}
            {galleryImages.length > 0 && (
              <div className="card" style={{ padding: '1.25rem', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '.75rem', color: '#111827' }}>Không gian nhà hàng</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                  {galleryImages.map((img) => (
                    <div 
                      key={img.id} 
                      onClick={() => setActiveImage(img.imageUrl)}
                      style={{ 
                        position: 'relative', height: 105, borderRadius: 8, overflow: 'hidden', 
                        border: '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <img src={img.imageUrl} alt="Branch preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {img.isCover === 1 && (
                        <span style={{
                          position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.7)', color: '#fff',
                          fontSize: '.65rem', padding: '2px 6px', borderRadius: 4, fontWeight: 600
                        }}>Ảnh bìa</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Giờ mở cửa */}
            <div className="card" style={{ padding: '1.25rem', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '.75rem', color: '#111827' }}>Giờ hoạt động</h2>
              {hours.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Đang cập nhật lịch hoạt động các ngày trong tuần.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  {hours.map(h => (
                    <div key={h.id} className="flex justify-between items-center" style={{ fontSize: '.88rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '.4rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                        {DAY_LABEL[h.dayOfWeek] || h.dayOfWeek}{h.shiftName ? ` · ${h.shiftName}` : ''}
                      </span>
                      <span style={{ fontWeight: 600, color: '#1f2937' }}>
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
                  <h3 style={{ fontWeight: 700, marginBottom: '.75rem', color: '#374151', fontSize: '1.05rem', borderLeft: '4px solid var(--brand)', paddingLeft: '8px' }}>
                    {cat.categoryName}
                  </h3>
                  <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {cat.items.map(item => (
                      <div key={item.id} className="card flex gap-3" style={{ padding: '.85rem', borderRadius: 10, alignItems: 'center' }}>
                        <div 
                          onClick={() => item.imageUrl && setActiveImage(item.imageUrl)}
                          style={{
                            width: 68, height: 68, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                            background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                            cursor: item.imageUrl ? 'pointer' : 'default'
                          }}
                        >
                          {item.imageUrl ? <img src={item.imageUrl} alt={item.itemName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Soup size={24} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontWeight: 700, fontSize: '.92rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.itemName}</h4>
                          {item.description && <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '.3rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>}
                          <p style={{ color: 'var(--brand)', fontWeight: 700, fontSize: '.9rem' }}>{Number(item.price).toLocaleString('vi-VN')}₫</p>
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
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              {[['ALL', 'Tất cả'], ['MY', 'Đánh giá của tôi'], ['5', '5 sao'], ['4', '4 sao'], ['3', '3 sao'], ['2', '2 sao'], ['1', '1 sao']].map(([k, l]) => (
                <button key={k} onClick={() => setReviewFilter(k)} style={{
                  padding: '0.4rem 0.8rem', borderRadius: 8, fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
                  background: reviewFilter === k ? 'var(--brand)' : '#f3f4f6', 
                  color: reviewFilter === k ? '#fff' : '#4b5563',
                  border: 'none', transition: 'all 0.2s'
                }}>{l}</button>
              ))}
            </div>

            {filteredReviews.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Không có đánh giá nào phù hợp.</p>
            ) : (
              filteredReviews.map(r => {
                const itemAvg = Math.round(((r.spaceRating || 5) + (r.serviceRating || 5) + (r.foodRating || 5)) / 3);
                return (
                  <div key={r.id} className="card" style={{ marginBottom: '.875rem', borderRadius: 10, padding: '1rem' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '.4rem' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '.9rem', marginRight: '8px' }}>
                          {r.customer?.fullName || r.customerName || 'Khách hàng ẩn danh'}
                        </span>
                        <span style={{ color: '#FBBF24', fontSize: '.85rem', display: 'inline-flex' }}>{Array.from({ length: itemAvg }, (_, i) => <Star key={i} size={13} fill="currentColor" />)}</span>
                      </div>
                      <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : ''}
                      </span>
                    </div>

                    <div className="flex gap-3" style={{ marginBottom: '.5rem', fontSize: '.82rem', background: '#f9fafb', padding: '6px 10px', borderRadius: 6 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}><Home size={13} /> Không gian: <strong>{r.spaceRating}/5</strong></span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}><ChefHat size={13} /> Phục vụ: <strong>{r.serviceRating}/5</strong></span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}><Utensils size={13} /> Đồ ăn: <strong>{r.foodRating}/5</strong></span>
                    </div>

                    {r.comment && <p style={{ color: 'var(--text-muted)', fontSize: '.88rem', lineHeight: 1.5, marginBottom: '.75rem' }}>{r.comment}</p>}

                    {r.restaurantReply && (
                      <div style={{ background: 'var(--brand-light, #fdf4f8)', borderLeft: '3px solid var(--brand)', borderRadius: '0 6px 6px 0', padding: '.6rem .8rem', marginTop: '.5rem' }}>
                        <p style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--brand)', marginBottom: '.2rem' }}>PHẢN HỒI TỪ NHÀ HÀNG</p>
                        <p style={{ fontSize: '.85rem', color: '#374151', lineHeight: 1.4 }}>{r.restaurantReply}</p>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* CTA: Đặt bàn */}
        <div style={{ position: 'sticky', bottom: 0, background: 'var(--white)', borderTop: '1px solid var(--border)', padding: '1rem 0', marginTop: '1.5rem', zIndex: 10 }}>
          <button className="btn-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 700, borderRadius: 12, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            onClick={() => navigate(`/booking/${id}`)}>
            <Calendar size={18} style={{ verticalAlign: '-3px' }} /> Đặt bàn tại chi nhánh này
          </button>
        </div>
      </div>

      {/* MODAL XEM ẢNH PHÓNG TO */}
      {activeImage && (
        <div onClick={() => setActiveImage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button onClick={() => setActiveImage(null)} style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '1.8rem', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
            <img src={activeImage} alt="Enlarged view" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} />
          </div>
        </div>
      )}
    </>
  )
}