import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import RestaurantSearchFilter from './RestaurantSearchFilter'
import { restaurantApi } from '../../../api'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const [flatBranches, setFlatBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const keyword = searchParams.get('keyword') || ''
  const province = searchParams.get('province') || ''
  const cuisine = searchParams.get('cuisine') || ''
  const priceRange = searchParams.get('priceRange') || ''

  // Dùng ref để lưu chuỗi query trước đó, tránh gọi API lặp vô hạn
  const prevQueryRef = useRef(null)

  useEffect(() => {
    const queryString = searchParams.toString()
    
    // Nếu query string không thay đổi so với lần gọi trước thì bỏ qua
    if (prevQueryRef.current === queryString) return
    prevQueryRef.current = queryString

    const params = { keyword, province, cuisine, priceRange }
    
    setLoading(true)
    restaurantApi.search(params)
      .then(res => {
        const restaurants = res.data?.data || res.data || []
        
        const extractedBranches = []
        restaurants.forEach(restaurant => {
          const restaurantName = restaurant.restaurantName || 'Nhà hàng'
          const restaurantLogo = restaurant.logoUrl || ''
          const cuisineTypes = restaurant.cuisineType ? restaurant.cuisineType.split(',').map(c => c.trim()) : []

          if (restaurant.branches && restaurant.branches.length > 0) {
            restaurant.branches.forEach(branch => {
              extractedBranches.push({
                ...branch,
                restaurantName,
                restaurantLogo,
                cuisineTypes
              })
            })
          }
        })

        // Lọc Frontend (chỉ lọc khi người dùng thực sự có chọn tiêu chí trên URL)
        const filtered = extractedBranches.filter(branch => {
          if (province && province.trim() !== '') {
            const branchProv = (branch.province || '').toLowerCase()
            const targetProv = province.toLowerCase()
            if (!branchProv.includes(targetProv)) return false
          }
          if (cuisine && cuisine.trim() !== '') {
            const hasCuisine = branch.cuisineTypes.some(c => c.toLowerCase().includes(cuisine.toLowerCase()))
            const restaurantNameMatch = (branch.restaurantName || '').toLowerCase().includes(cuisine.toLowerCase())
            if (!hasCuisine && !restaurantNameMatch) return false
          }
          if (keyword && keyword.trim() !== '') {
            const kw = keyword.toLowerCase()
            const matchName = (branch.name || '').toLowerCase().includes(kw)
            const matchAddress = (branch.address || '').toLowerCase().includes(kw)
            const matchRestName = (branch.restaurantName || '').toLowerCase().includes(kw)
            if (!matchName && !matchAddress && !matchRestName) return false
          }
          return true
        })

        setFlatBranches(filtered)
      })
      .catch(err => {
        console.error("Lỗi tìm kiếm:", err)
        setFlatBranches([])
      })
      .finally(() => setLoading(false))
  }, [searchParams])

  const handleFilterSearch = (filters) => {
    const queryParams = new URLSearchParams()
    if (filters.keyword) queryParams.append('keyword', filters.keyword)
    if (filters.province) queryParams.append('province', filters.province)
    if (filters.cuisine) queryParams.append('cuisine', filters.cuisine)
    if (filters.priceRange) queryParams.append('priceRange', filters.priceRange)

    navigate(`/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`)
  }

const handleBranchClick = (branchId) => {
    navigate(`/branch/${branchId}`) 
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 1.5rem', fontFamily: 'inherit' }}>
      
      {/* NÚT QUAY LẠI TRANG CHỦ */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f3f4f6',
            color: '#374151',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e5e7eb';
            e.currentTarget.style.color = '#111827';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#374151';
          }}
        >
          &larr; Quay lại trang chủ
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.4rem' }}>
          Kết Quả Tìm Kiếm Chi Nhánh
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.92rem' }}>
          Danh sách các chi nhánh nhà hàng phù hợp với tiêu chí tìm kiếm của bạn.
        </p>
      </div>
      
      <RestaurantSearchFilter onSearch={handleFilterSearch} />

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#4b5563', fontSize: '1rem' }}>
          Đang tìm kiếm...
        </div>
      )}

      {!loading && flatBranches.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', marginTop: '2rem' }}>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0 }}>Không tìm thấy chi nhánh nhà hàng nào phù hợp với bộ lọc.</p>
        </div>
      )}

      {/* LƯỚI CARD PHẲNG ĐỘC LẬP */}
      {!loading && flatBranches.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          {flatBranches.map((branch, idx) => {
            const branchImage = 
              (branch.branchImageDtos && branch.branchImageDtos.length > 0 ? branch.branchImageDtos[0].imageUrl : null) || 
              branch.restaurantLogo || 
              'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600';

            return (
              <div 
                key={branch.id || idx}
                onClick={() => handleBranchClick(branch.id)}
                style={{ 
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  willChange: 'transform, box-shadow',
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                }}
              >
                {/* Phần Ảnh đại diện chi nhánh */}
                <div style={{ width: '100%', height: '200px', background: '#f3f4f6', position: 'relative' }}>
                  <img 
                    src={branchImage} 
                    alt={branch.name} 
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                  />
                  {/* Nhãn Tỉnh/Thành góc trên phải */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    right: '12px', 
                    background: 'rgba(17, 24, 39, 0.75)', 
                    color: '#fff', 
                    fontSize: '0.72rem', 
                    fontWeight: 600, 
                    padding: '4px 10px', 
                    borderRadius: '20px',
                    backdropFilter: 'blur(4px)'
                  }}>
                    {branch.province}
                  </div>
                </div>

                {/* Phần Thông tin chi tiết của Card */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    {/* TÊN NHÀ HÀNG MẸ */}
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {branch.restaurantName}
                      </span>
                    </div>

                    {/* HIỂN THỊ ĐÚNG CÁC LOẠI ẨM THỰC */}
                    {branch.cuisineTypes && branch.cuisineTypes.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                        {branch.cuisineTypes.map((c, cIdx) => {
                          const isMatch = cuisine && c.toLowerCase().includes(cuisine.toLowerCase())
                          return (
                            <span 
                              key={cIdx}
                              style={{ 
                                fontSize: '0.7rem', 
                                fontWeight: isMatch ? 700 : 500, 
                                color: isMatch ? '#fff' : '#374151', 
                                background: isMatch ? '#4f46e5' : '#f3f4f6', 
                                padding: '2px 8px', 
                                borderRadius: '10px',
                                border: isMatch ? '1px solid #4338ca' : '1px solid transparent'
                              }}
                            >
                              {c}
                            </span>
                          )
                        })}
                      </div>
                    )}

                    {/* Tên Chi nhánh cụ thể */}
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
                      {branch.name}
                    </h3>

                    {/* Địa chỉ */}
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#6b7280', lineHeight: 1.4 }}>
                      {branch.address}, {branch.province}
                    </p>
                  </div>

                  {/* Footer Card: Số điện thoại & Nút hành động */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f3f4f6', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 500 }}>
                      {branch.phone ? `SĐT: ${branch.phone}` : 'Đang cập nhật SĐT'}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '5px 12px', borderRadius: '6px' }}>
                      Đặt bàn &rarr;
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}