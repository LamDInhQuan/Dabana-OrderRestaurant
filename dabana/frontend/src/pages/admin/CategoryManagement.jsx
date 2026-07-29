import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import { adminApi } from '../../api'

const DEFAULT_CONFIG = { color: '#6366f1', bg: '#e0e7ff', icon: '📁' }

export default function CategoryManagement() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeName, setTypeName] = useState('ASIAN')
  const [isCustomType, setIsCustomType] = useState(false)
  const [customTypeName, setCustomTypeName] = useState('')
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    adminApi.listCategories()
      .then(r => setCategories(r.data || []))
      .catch(() => toast.error('Không thể tải danh sách danh mục'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const existingTypes = Array.from(
    new Set(
      categories.map(c => {
        const t = c.categoryType || 'OTHER'
        return t.startsWith('CUISINE_') ? t.replace('CUISINE_', '') : t
      })
    )
  )

  const submit = async (e) => {
    e.preventDefault()
    
    const activeType = isCustomType ? customTypeName : typeName
    if (!activeType.trim() || !name.trim()) {
      toast.error('Vui lòng chọn/nhập phân loại và tên danh mục')
      return
    }

    setSubmitting(true)
    try {
      if (editing) {
        await adminApi.updateCategory(editing.id, { 
          categoryType: editing.categoryType, 
          categoryName: name.trim() 
        })
        toast.success('Cập nhật danh mục thành công')
      } else {
        const formattedType = activeType.trim().toUpperCase()
        const finalType = formattedType.startsWith('CUISINE_') ? formattedType : `CUISINE_${formattedType}`
        
        await adminApi.createCategory({ 
          categoryType: finalType, 
          categoryName: name.trim() 
        })
        toast.success('Thêm danh mục mới thành công')
      }
      setName('')
      setCustomTypeName('')
      setEditing(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (id, categoryName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${categoryName}" không?`)) return
    try {
      await adminApi.deleteCategory(id)
      toast.success('Đã xóa danh mục')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa (danh mục có thể đang được sử dụng)')
    }
  }

  const grouped = categories.reduce((acc, c) => {
    const key = c.categoryType || 'OTHER'
    ;(acc[key] ||= []).push(c)
    return acc
  }, {})

  return (
    <AdminLayout title="Quản lý danh mục hệ thống">
      {/* Hướng dẫn người dùng */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.85rem 1.2rem', marginBottom: '1.5rem', color: '#1e40af', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>💡</span>
        <span><strong>Hướng dẫn:</strong> Chọn phân loại có sẵn hoặc bấm vào nút <em>"+ Thêm nhóm mới"</em> để tự nhập nhóm phân loại tùy ý (Backend sẽ tự động đính kèm tiền tố <code style={{ background: '#dbeafe', padding: '2px 6px', borderRadius: '4px', color: '#1d4ed8' }}>CUISINE_</code>).</span>
      </div>

      {/* Form Thêm / Sửa Danh mục */}
      <div className="card" style={{ marginBottom: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderRadius: '12px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main, #1f2937)' }}>
            {editing ? `✏️ Đang sửa: "${editing.categoryName}"` : '➕ Thêm danh mục mới'}
          </h3>
          {editing && (
            <button 
              type="button" 
              onClick={() => { setEditing(null); setName(''); setCustomTypeName('') }}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
            >
              Hủy chỉnh sửa
            </button>
          )}
        </div>

        <form onSubmit={submit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '0 0 300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>PHÂN LOẠI</label>
              {!editing && (
                <button 
                  type="button" 
                  onClick={() => setIsCustomType(!isCustomType)}
                  style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, padding: 0 }}
                >
                  {isCustomType ? '← Chọn từ danh sách' : '+ Thêm nhóm mới'}
                </button>
              )}
            </div>

            {editing ? (
              <input 
                disabled
                value={editing.categoryType.startsWith('CUISINE_') ? editing.categoryType.replace('CUISINE_', '') : editing.categoryType}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', background: '#f3f4f6', color: '#6b7280' }}
              />
            ) : isCustomType ? (
              <input 
                autoFocus
                value={customTypeName}
                onChange={e => setCustomTypeName(e.target.value)}
                placeholder="VD: SEAFOOD, BAKERY..."
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #4f46e5', fontSize: '0.9rem', background: '#fff', outline: 'none', boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.1)' }}
              />
            ) : (
              <select 
                value={typeName}
                onChange={e => setTypeName(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', background: '#fff', cursor: 'pointer' }}
              >
                {Array.from(new Set(['ASIAN', 'DRINK', 'STYLE', ...existingTypes])).map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>TÊN DANH MỤC</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="VD: Trà chiều, Hàn Quốc..." 
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', background: '#fff' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end', marginTop: window.innerWidth < 768 ? '0' : '20px' }}>
            <button 
              className="btn-primary" 
              type="submit" 
              disabled={submitting}
              style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Đang lưu...' : (editing ? '💾 Lưu thay đổi' : '✨ Thêm mới')}
            </button>
            {editing && (
              <button 
                type="button" 
                className="btn-outline" 
                onClick={() => { setEditing(null); setName(''); setCustomTypeName('') }}
                style={{ padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Danh sách hiển thị trực quan các thẻ card */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted, #9ca3af)' }}>Đang tải danh mục hệ thống...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {Object.keys(grouped).length === 0 ? (
            <div style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#9ca3af', padding: '2rem' }}>Chưa có dữ liệu danh mục nào.</div>
          ) : (
            Object.entries(grouped).map(([t, items]) => {
              const displayTitle = t.startsWith('CUISINE_') ? t.replace('CUISINE_', '') : t
              return (
                <div key={t} className="card" style={{ borderRadius: '12px', borderTop: `4px solid ${DEFAULT_CONFIG.color}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#374151' }}>
                      <span>{DEFAULT_CONFIG.icon}</span> {displayTitle}
                    </h4>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: DEFAULT_CONFIG.bg, color: DEFAULT_CONFIG.color }}>
                      {items.length} mục
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                    {items.map(c => (
                      <div 
                        key={c.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '0.5rem 0.75rem', 
                          background: '#f9fafb', 
                          borderRadius: '8px', 
                          border: '1px solid #f3f4f6',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ fontSize: '0.88rem', fontWeight: 500, color: '#1f2937', wordBreak: 'break-word', flex: 1, paddingRight: '8px' }}>
                          {c.categoryName}
                        </span>
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                          <button 
                            className="btn-outline" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer' }}
                            onClick={() => { 
                              setEditing(c)
                              setName(c.categoryName)
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                          >
                            Sửa
                          </button>
                          <button 
                            className="btn-danger" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer', background: '#fee2e2', color: '#dc2626', border: 'none' }}
                            onClick={() => remove(c.id, c.categoryName)}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </AdminLayout>
  )
}