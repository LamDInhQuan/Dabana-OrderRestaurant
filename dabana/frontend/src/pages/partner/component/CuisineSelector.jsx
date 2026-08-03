import { useState, useMemo } from 'react'
import { Folder, Check, Plus } from 'lucide-react'
import { S } from '../theme'

export default function CuisineSelector({ systemCuisines = [], restaurantForm, setRestaurantForm }) {
  // 1. Chuẩn hóa lấy danh sách đang chọn từ trường cuisineType (chuỗi hoặc mảng)
  const currentList = useMemo(() => {
    const raw = restaurantForm.cuisineType || restaurantForm.cuisineTypes;
    if (Array.isArray(raw)) return raw;
    return String(raw || '').split(',').map(s => s.trim()).filter(Boolean);
  }, [restaurantForm.cuisineType, restaurantForm.cuisineTypes]);

  const groupTypes = useMemo(() => {
    const types = systemCuisines.map(cat => {
      const type = cat.categoryType || 'OTHER'
      return type.startsWith('CUISINE_') ? type.replace('CUISINE_', '') : type
    })
    return Array.from(new Set(types))
  }, [systemCuisines])

  const [activeGroup, setActiveGroup] = useState(groupTypes[0] || '')

  const subCategories = useMemo(() => {
    return systemCuisines.filter(cat => {
      const type = cat.categoryType || 'OTHER'
      const cleanType = type.startsWith('CUISINE_') ? type.replace('CUISINE_', '') : type
      return cleanType === activeGroup
    })
  }, [systemCuisines, activeGroup])

  const handleToggle = (catName) => {
    const isSelected = currentList.includes(catName);
    let updated;
    if (isSelected) {
      updated = currentList.filter(c => c !== catName);
    } else {
      updated = Array.from(new Set([...currentList, catName]));
    }

    // Cập nhật đồng bộ về dạng chuỗi phân cách bằng dấu phẩy (hoặc mảng tùy backend nhận)
    // Ở đây lưu dạng chuỗi `.join(', ')` để khớp với phần hiển thị badge phía trên của bạn
    setRestaurantForm(prev => ({
      ...prev,
      cuisineType: updated.join(', '),
      cuisineTypes: updated // dự phòng nếu chỗ khác cần mảng
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Thanh tab chọn Nhóm phân loại */}
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

      {/* Khu vực hiển thị các mục con với trạng thái check chuẩn xác */}
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
                onClick={() => handleToggle(cat.categoryName)}
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