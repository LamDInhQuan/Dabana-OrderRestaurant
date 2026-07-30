import { useState, useMemo } from 'react'
import { Folder, Check, Plus } from 'lucide-react'
import { S } from '../theme'

// Component chọn Ngành ẩm thực phân cấp gọn gàng
export default function CuisineSelector({ systemCuisines = [], restaurantForm, setRestaurantForm }) {
  // Lấy danh sách các nhóm unique từ danh sách systemCuisines
  const groupTypes = useMemo(() => {
    const types = systemCuisines.map(cat => {
      const type = cat.categoryType || 'OTHER'
      return type.startsWith('CUISINE_') ? type.replace('CUISINE_', '') : type
    })
    return Array.from(new Set(types))
  }, [systemCuisines])

  // State lưu nhóm đang được chọn để xem các mục con bên trong
  const [activeGroup, setActiveGroup] = useState(groupTypes[0] || '')

  // Lọc các mục con thuộc nhóm đang chọn
  const subCategories = useMemo(() => {
    return systemCuisines.filter(cat => {
      const type = cat.categoryType || 'OTHER'
      const cleanType = type.startsWith('CUISINE_') ? type.replace('CUISINE_', '') : type
      return cleanType === activeGroup
    })
  }, [systemCuisines, activeGroup])

  const currentList = restaurantForm.cuisineTypes || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={S.label}>Ngành ẩm thực (Chọn nhiều)</label>

      {/* 1. Hiển thị các Badge các mục đã được chọn */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '32px', padding: '6px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
        {currentList.length === 0 ? (
          <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' }}>Chưa chọn ngành ẩm thực nào</span>
        ) : (
          currentList.map((item, index) => (
            <span key={index} style={{
              background: '#fef3c7',
              color: '#92400e',
              padding: '3px 10px',
              borderRadius: '16px',
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid #fcd34d',
              fontWeight: 500
            }}>
              {item}
              <span
                style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', lineHeight: 1 }}
                onClick={() => {
                  const updated = currentList.filter(c => c !== item)
                  setRestaurantForm(p => ({ ...p, cuisineTypes: updated }))
                }}
              >×</span>
            </span>
          ))
        )}
      </div>

      {/* 2. Thanh tab chọn Nhóm phân loại (ASIAN, DRINK, STYLE...) */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
        {groupTypes.map(group => {
          const isActive = activeGroup === group
          return (
            <button
              key={group}
              type="button"
              onClick={() => setActiveGroup(group)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: isActive ? '1px solid #4f46e5' : '1px solid #d1d5db',
                background: isActive ? '#4f46e5' : '#fff',
                color: isActive ? '#fff' : '#374151',
                transition: 'all 0.2s'
              }}
            >
              <Folder size={14} style={{ verticalAlign: '-2px' }} /> {group}
            </button>
          )
        })}
      </div>

      {/* 3. Khu vực hiển thị các mục con của nhóm đang chọn để click chọn nhanh */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px', background: '#f3f4f6', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        {subCategories.length === 0 ? (
          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Không có danh mục con trong nhóm này.</span>
        ) : (
          subCategories.map(cat => {
            const isSelected = currentList.includes(cat.categoryName)
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    // Nếu chọn rồi thì bấm vào sẽ bỏ chọn
                    const updated = currentList.filter(c => c !== cat.categoryName)
                    setRestaurantForm(p => ({ ...p, cuisineTypes: updated }))
                  } else {
                    // Chưa chọn thì thêm vào
                    setRestaurantForm(p => ({ ...p, cuisineTypes: [...currentList, cat.categoryName] }))
                  }
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #059669' : '1px solid #d1d5db',
                  background: isSelected ? '#d1fae5' : '#fff',
                  color: isSelected ? '#065f46' : '#374151',
                  fontWeight: isSelected ? 600 : 400,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isSelected ? <Check size={14} /> : <Plus size={14} />} {cat.categoryName}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}