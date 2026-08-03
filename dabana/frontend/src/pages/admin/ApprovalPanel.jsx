import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { User, Hourglass, Store, FileText, Link as LinkIcon, X, Check, PartyPopper, ImageIcon, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import api, { adminApi } from '../../api'
import { translateLabel } from '../../utils/labelTranslator'

function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 99999, cursor: 'zoom-out'
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.15)',
          border: 'none', color: '#fff', borderRadius: '50%', width: 40, height: 40,
          fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >×</button>
      <img
        src={src}
        alt={alt}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 25px 60px rgba(0,0,0,0.6)', cursor: 'default', objectFit: 'contain' }}
      />
    </div>
  )
}

function AuthorizedImage({ src, alt, ...props }) {
  const [imageSrc, setImageSrc] = useState(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  
  useEffect(() => {
    if (!src) return
    let isMounted = true
    // Xử lý loại bỏ `/api` ở đầu url vì axios instance đã tự có baseURL='/api'
    const cleanSrc = src.startsWith('/api') ? src.slice(4) : src
    api.get(cleanSrc, { responseType: 'blob' })
      .then(res => {
        if (isMounted) setImageSrc(URL.createObjectURL(res.data))
      })
      .catch(err => console.error('Lỗi tải ảnh:', err))
    return () => {
      isMounted = false
      if (imageSrc) URL.revokeObjectURL(imageSrc)
    }
  }, [src])

  if (!imageSrc) return <div style={{width: 120, height: 120, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', borderRadius: 8, color: '#64748b'}}>Đang tải ảnh...</div>
  return (
    <>
      <img
        src={imageSrc}
        alt={alt}
        {...props}
        onClick={() => setLightboxOpen(true)}
        style={{ ...props.style, cursor: 'zoom-in' }}
      />
      {lightboxOpen && <ImageLightbox src={imageSrc} alt={alt} onClose={() => setLightboxOpen(false)} />}
    </>
  )
}

function UserCard({ item, onApprove, onReject }) {
  const [reason, setReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [restaurant, setRestaurant] = useState(null)
  const [loadingRestaurant, setLoadingRestaurant] = useState(true)
  const [showApproveModal, setShowApproveModal] = useState(false)

  useEffect(() => {
    let isMounted = true
    adminApi.getRestaurantByUser(item.id)
      .then(res => { if (isMounted) setRestaurant(res.data) })
      .catch(() => { if (isMounted) setRestaurant(null) })
      .finally(() => { if (isMounted) setLoadingRestaurant(false) })
    return () => { isMounted = false }
  }, [item.id])

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}><User size={20} /></span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{item.fullName || `ID: ${item.id}`}</h3>
            <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>{translateLabel (item.role || 'RESTAURANT_PARTNER')}</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, paddingLeft: '1.75rem' }}>
            Email: <strong style={{ color: '#334155' }}>{item.email}</strong> • SĐT: <strong style={{ color: '#334155' }}>{item.phone || 'Chưa cập nhật'}</strong>
          </p>
        </div>
        <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
          <Hourglass size={13} /> Chờ duyệt
        </span>
      </div>

      <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid #f1f5f9' }}>
        {loadingRestaurant ? (
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>Đang tải thông tin nhà hàng...</div>
        ) : restaurant ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#4f46e5', marginBottom: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}><Store size={14} /> Thương hiệu nhà hàng</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>{restaurant.restaurantName || restaurant.name || 'Chưa cập nhật'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}><FileText size={14} /> Mô tả & Website</div>
              <div style={{ fontSize: '0.85rem', color: '#334155', fontStyle: 'italic', marginBottom: '0.25rem' }}>"{restaurant.description || 'Không có mô tả'}"</div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: '#dc2626' }}>Không tìm thấy thông tin nhà hàng liên kết.</div>
        )}
      </div>

      <div>
        {!showReject ? (
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowReject(true)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}><X size={16} /> Từ chối</button>
            <button onClick={() => setShowApproveModal(true)} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}><Check size={16} /> Phê duyệt tài khoản</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#fef2f2', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca' }}>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Nhập lý do từ chối..." style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid #fca5a5', outline: 'none' }} />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowReject(false)} style={{ background: '#fff', color: '#64748b', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Huỷ</button>
              <button onClick={() => onReject(item.id, reason)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Xác nhận từ chối</button>
            </div>
          </div>
        )}
      </div>

      {showApproveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', width: '400px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Xác nhận phê duyệt đối tác?</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Hệ thống sẽ chuyển trạng thái tài khoản sang ACTIVE và gửi email thông báo.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowApproveModal(false)} style={{ background: '#f1f5f9', color: '#334155', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Hủy bỏ</button>
              <button onClick={() => { setShowApproveModal(false); onApprove(item.id); }} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Đồng ý duyệt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RestaurantCard({ item, onApprove, onReject }) {
  const restaurant = item.restaurant || item
  const licenses = item.licenses || []
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}><Building2 size={20} /></span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{restaurant.restaurantName}</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, paddingLeft: '1.75rem' }}>
            SĐT: <strong style={{ color: '#334155' }}>{restaurant.phone || 'Chưa cập nhật'}</strong>
          </p>
        </div>
        <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
          <Hourglass size={13} /> Chờ duyệt hồ sơ
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Mô tả nhà hàng:</div>
          <p style={{ fontSize: '0.9rem', color: '#334155', fontStyle: 'italic', margin: 0 }}>{restaurant.description || 'Không có'}</p>
          {restaurant.website && (
            <div style={{ marginTop: '0.5rem' }}>
              <a href={restaurant.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#4f46e5', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}><LinkIcon size={14} /> {restaurant.website}</a>
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Giấy phép kinh doanh ({licenses.length}):</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {licenses.length > 0 ? licenses.map((lic, idx) => (
              <div key={lic.id || idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', padding: 2 }}>
                 <AuthorizedImage src={lic.url} alt={lic.fileName} style={{ width: 120, height: 120, objectFit: 'contain', display: 'block' }} />
              </div>
            )) : (
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Không có ảnh giấy phép</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        {!showReject ? (
          <>
            <button onClick={() => setShowReject(true)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}><X size={16} /> Từ chối</button>
            <button onClick={() => setShowApproveModal(true)} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}><Check size={16} /> Phê duyệt</button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#fef2f2', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca', width: '100%' }}>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Nhập lý do từ chối..." style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid #fca5a5', outline: 'none' }} />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowReject(false)} style={{ background: '#fff', color: '#64748b', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Huỷ</button>
              <button onClick={() => onReject(restaurant.id, reason)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Xác nhận từ chối</button>
            </div>
          </div>
        )}
      </div>

      {showApproveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', width: '400px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Xác nhận phê duyệt nhà hàng?</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Hệ thống sẽ chuyển trạng thái hồ sơ nhà hàng và tài khoản đối tác sang ACTIVE, đồng thời gửi email thông báo.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowApproveModal(false)} style={{ background: '#f1f5f9', color: '#334155', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Hủy bỏ</button>
              <button onClick={() => { setShowApproveModal(false); onApprove(restaurant.id); }} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Đồng ý duyệt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ApprovalPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'users'
  
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    let fetchPromise;
    
    if (activeTab === 'users') {
      fetchPromise = adminApi.pendingUsers()
    } else if (activeTab === 'restaurants') {
      fetchPromise = adminApi.pendingRestaurants()
    }

    if (fetchPromise) {
      fetchPromise
        .then(r => setData(r.data || []))
        .catch((err) => {
          setData([])
          toast.error(err.response?.data?.message || 'Lỗi khi tải dữ liệu chờ duyệt')
        })
        .finally(() => setLoading(false))
    }
  }

  useEffect(() => { load() }, [activeTab])

  const changeTab = (tab) => {
    setSearchParams({ tab })
  }

  const approve = async (id) => {
    let actionPromise;
    let loadingMsg = '';
    
    if (activeTab === 'users') {
      actionPromise = adminApi.approveUser(id, { approved: true })
      loadingMsg = 'Đang xử lý phê duyệt tài khoản...'
    } else if (activeTab === 'restaurants') {
      actionPromise = adminApi.approveRestaurant(id, { approved: true })
      loadingMsg = 'Đang xử lý phê duyệt hồ sơ nhà hàng...'
    }

    toast.promise(actionPromise, {
      loading: loadingMsg,
      success: 'Đã phê duyệt thành công!',
      error: (err) => err.response?.data?.message || 'Lỗi phê duyệt',
    })

    try {
      await actionPromise
      load()
    } catch (err) {}
  }

  const reject = async (id, reason = 'Từ chối') => {
    let actionPromise;
    let loadingMsg = '';

    if (activeTab === 'users') {
      actionPromise = adminApi.approveUser(id, { approved: false, reason })
      loadingMsg = 'Đang xử lý từ chối tài khoản...'
    } else if (activeTab === 'restaurants') {
      actionPromise = adminApi.approveRestaurant(id, { approved: false, reason })
      loadingMsg = 'Đang xử lý từ chối hồ sơ nhà hàng...'
    } 
    
    toast.promise(actionPromise, {
      loading: loadingMsg,
      success: 'Đã từ chối thành công!',
      error: (err) => err.response?.data?.message || 'Lỗi khi từ chối',
    })

    try {
      await actionPromise
      load()
    } catch (err) {}
  }

  return (
    <AdminLayout title="Trung tâm phê duyệt">
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Quản lý các hồ sơ đăng ký đối tác, nhà hàng, chi nhánh đang chờ xét duyệt.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => changeTab('users')}
          style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'users' ? '2px solid #4f46e5' : '2px solid transparent', color: activeTab === 'users' ? '#4f46e5' : '#64748b', fontWeight: activeTab === 'users' ? 600 : 500, cursor: 'pointer', fontSize: '0.95rem' }}>
          Tài khoản đối tác
        </button>
        <button 
          onClick={() => changeTab('restaurants')}
          style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'restaurants' ? '2px solid #F59E0B' : '2px solid transparent', color: activeTab === 'restaurants' ? '#F59E0B' : '#64748b', fontWeight: activeTab === 'restaurants' ? 600 : 500, cursor: 'pointer', fontSize: '0.95rem' }}>
          Hồ sơ nhà hàng
        </button>
        {/* <button 
          onClick={() => changeTab('branches')}
          style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'branches' ? '2px solid #3B82F6' : '2px solid transparent', color: activeTab === 'branches' ? '#3B82F6' : '#64748b', fontWeight: activeTab === 'branches' ? 600 : 500, cursor: 'pointer', fontSize: '0.95rem' }}>
          Hồ sơ chi nhánh
        </button> */}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Đang tải dữ liệu...</div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}><PartyPopper size={48} /></div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>Tuyệt vời!</h3>
          <p style={{ fontSize: '0.9rem' }}>Hiện không có dữ liệu nào đang chờ phê duyệt ở mục này.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {data.map(item => {
            if (activeTab === 'users') {
              return <UserCard key={item.id} item={item} onApprove={approve} onReject={reject} />
            } else if (activeTab === 'restaurants') {
              // item = { restaurant, licenses }
              return <RestaurantCard key={item.restaurant?.id || item.id} item={item} onApprove={approve} onReject={reject} />
            }
            //    if (activeTab === 'branches') {
            //   return <BranchCard key={item.id} item={item} onApprove={approve} onReject={reject} />
            // }
            return null;
          })}
        </div>
      )}
    </AdminLayout>
  )
}
