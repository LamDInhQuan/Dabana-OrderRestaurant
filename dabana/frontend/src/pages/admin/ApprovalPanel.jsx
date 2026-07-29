import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import { adminApi } from '../../api'

function ApprovalCard({ item, onApprove, onReject }) {
  const [reason, setReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [restaurant, setRestaurant] = useState(null)
  const [loadingRestaurant, setLoadingRestaurant] = useState(true)

  // State quản lý Modal Xác Nhận Phê Duyệt
  const [showApproveModal, setShowApproveModal] = useState(false)

  // Gọi API lấy thông tin nhà hàng theo userId khi card được render
  useEffect(() => {
    let isMounted = true
    adminApi.getRestaurantByUser(item.id)
      .then(res => {
        if (isMounted) setRestaurant(res.data)
      })
      .catch(() => {
        if (isMounted) setRestaurant(null)
      })
      .finally(() => {
        if (isMounted) setLoadingRestaurant(false)
      })
    return () => { isMounted = false }
  }, [item.id])

  return (
    <div style={{ 
      background: '#fff', 
      borderRadius: '16px', 
      border: '1px solid #e2e8f0', 
      padding: '1.5rem', 
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      {/* Header card: Tên & Trạng thái */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.25rem' }}>👤</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {item.fullName || `ID: ${item.id}`}
            </h3>
            <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
              {item.role || 'RESTAURANT_PARTNER'}
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, paddingLeft: '1.75rem' }}>
            Email: <strong style={{ color: '#334155' }}>{item.email}</strong> • SĐT: <strong style={{ color: '#334155' }}>{item.phone || 'Chưa cập nhật'}</strong>
          </p>
        </div>
        
        <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 }}>
          ⏳ Chờ duyệt
        </span>
      </div>

      {/* Thông tin nhà hàng đăng ký kèm */}
      <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid #f1f5f9' }}>
        {loadingRestaurant ? (
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>Đang tải thông tin nhà hàng...</div>
        ) : restaurant ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#4f46e5', marginBottom: '0.25rem' }}>
                🏪 Thương hiệu nhà hàng
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                {restaurant.restaurantName || restaurant.name || 'Chưa cập nhật tên nhà hàng'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                SĐT nhà hàng: {restaurant.phone || 'Không có'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>
                📝 Mô tả & Website
              </div>
              <div style={{ fontSize: '0.85rem', color: '#334155', fontStyle: 'italic', marginBottom: '0.25rem' }}>
                "{restaurant.description || 'Không có mô tả'}"
              </div>
              {restaurant.website && (
                <a href={restaurant.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#4f46e5', textDecoration: 'none', fontWeight: 500 }}>
                  🔗 {restaurant.website}
                </a>
              )}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: '#dc2626' }}>Không tìm thấy thông tin nhà hàng liên kết với tài khoản này.</div>
        )}
      </div>

      {/* Action buttons */}
      <div>
        {!showReject ? (
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => setShowReject(true)}
              style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.2s' }}>
              ❌ Từ chối
            </button>
            <button 
              onClick={() => setShowApproveModal(true)}
              style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)', transition: 'background 0.2s' }}>
              ✅ Phê duyệt tài khoản
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#fef2f2', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca' }}>
            <input 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder="Nhập lý do từ chối tài khoản này..." 
              style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid #fca5a5', outline: 'none', fontSize: '0.9rem', background: '#fff' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowReject(false)}
                style={{ background: '#fff', color: '#64748b', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                Huỷ
              </button>
              <button 
                onClick={() => onReject(item.id, reason)}
                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                Xác nhận từ chối
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL XÁC NHẬN PHÊ DUYỆT & GỬI EMAIL --- */}
      {showApproveModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', padding: '2rem', borderRadius: '16px', width: '400px', maxWidth: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Xác nhận phê duyệt đối tác?</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
              Hệ thống sẽ chuyển trạng thái tài khoản sang <strong>ACTIVE</strong>, kích hoạt nhà hàng liên quan và <strong>gửi email thông báo</strong> trực tiếp tới đối tác này. Bạn có chắc chắn muốn tiếp tục?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button 
                onClick={() => setShowApproveModal(false)}
                style={{ background: '#f1f5f9', color: '#334155', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Hủy bỏ
              </button>
              <button 
                onClick={() => {
                  setShowApproveModal(false)
                  onApprove(item.id)
                }}
                style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Đồng ý duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ApprovalPanel() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    adminApi.pendingUsers()
      .then(r => setData(r.data || []))
      .catch((err) => {
        setData([])
        toast.error(err.response?.data?.message || 'Không thể tải danh sách tài khoản chờ duyệt')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const approve = async (id) => {
    // Sử dụng toast.promise để hiển thị trạng thái loading mượt mà trong lúc chờ backend xử lý (gửi mail + DB)
    const actionPromise = adminApi.approveUser(id, { approved: true })
    
    toast.promise(actionPromise, {
      loading: 'Đang xử lý phê duyệt và gửi email thông báo...',
      success: 'Đã phê duyệt tài khoản và gửi email thành công!',
      error: (err) => err.response?.data?.message || 'Lỗi phê duyệt tài khoản',
    })

    try {
      await actionPromise
      load()
    } catch (err) {
      // Đã được xử lý hiển thị ở toast.promise bên trên
    }
  }

  const reject = async (id, reason) => {
    if (!reason.trim()) { 
      toast.error('Vui lòng nhập lý do từ chối'); 
      return 
    }

    const actionPromise = adminApi.approveUser(id, { approved: false, reason })
    
    toast.promise(actionPromise, {
      loading: 'Đang xử lý từ chối và gửi email thông báo...',
      success: 'Đã từ chối tài khoản thành công!',
      error: (err) => err.response?.data?.message || 'Lỗi khi từ chối tài khoản',
    })

    try {
      await actionPromise
      load()
    } catch (err) {
      // Đã được xử lý hiển thị ở toast.promise bên trên
    }
  }

  return (
    <AdminLayout title="Phê duyệt tài khoản đối tác">
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Danh sách các tài khoản đối tác nhà hàng đăng ký mới đang chờ xét duyệt quyền hoạt động trên hệ thống.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Đang tải dữ liệu...</div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>Tuyệt vời!</h3>
          <p style={{ fontSize: '0.9rem' }}>Hiện không có tài khoản đối tác nào đang chờ phê duyệt.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {data.map(item => (
            <ApprovalCard 
              key={item.id} 
              item={item} 
              onApprove={approve} 
              onReject={reject} 
            />
          ))}
        </div>
      )}
    </AdminLayout>
  )
}