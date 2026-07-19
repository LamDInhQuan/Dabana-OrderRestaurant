import { useState, useEffect } from 'react'
import { STATUS_OPTIONS } from '../utils/menuStatusMeta'

const EMPTY_FORM = { categoryId: '', itemName: '', description: '', price: '', imageUrl: '', status: 'SELLING', displayOrder: 0 }
const label = { fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }

export default function MenuItemFormModal({ open, item, categories, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (!open) return
    setForm(item ? {
      categoryId: item.categoryId,
      itemName: item.itemName,
      description: item.description || '',
      price: item.price,
      imageUrl: item.imageUrl || '',
      status: item.status,
      displayOrder: item.displayOrder ?? 0,
    } : { ...EMPTY_FORM, categoryId: categories[0]?.id || '' })
  }, [item, open, categories])

  if (!open) return null

  const change = (key, value) => setForm((p) => ({ ...p, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.categoryId) { return }
    if (!form.price || Number(form.price) <= 0) { return }
    const ok = await onSubmit({
      categoryId: Number(form.categoryId),
      itemName: form.itemName,
      description: form.description,
      price: Number(form.price),
      imageUrl: form.imageUrl,
      status: form.status,
      displayOrder: Number(form.displayOrder) || 0,
    })
    if (ok) onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: 460, margin: '1rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '1rem', fontWeight: 700 }}>{item ? 'Sửa món ăn' : 'Thêm món mới'}</h2>

        {categories.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>
            Chưa có danh mục nào. Vui lòng tạo danh mục trước khi thêm món.
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
            <div>
              <label style={label}>Danh mục</label>
              <select value={form.categoryId} onChange={(e) => change('categoryId', e.target.value)} required>
                <option value="" disabled>Chọn danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.categoryName}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={label}>Tên món</label>
              <input value={form.itemName} onChange={(e) => change('itemName', e.target.value)} required />
            </div>

            <div>
              <label style={label}>Giá (₫)</label>
              <input type="number" min="1" step="1000" value={form.price}
                onChange={(e) => change('price', e.target.value)} required />
            </div>

            <div>
              <label style={label}>Ảnh (URL)</label>
              <input value={form.imageUrl} onChange={(e) => change('imageUrl', e.target.value)} placeholder="https://..." />
            </div>

            <div>
              <label style={label}>Mô tả</label>
              <textarea rows={2} value={form.description} onChange={(e) => change('description', e.target.value)} />
            </div>

            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label style={label}>Trạng thái</label>
                <select value={form.status} onChange={(e) => change('status', e.target.value)}>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={label}>Thứ tự hiển thị</label>
                <input type="number" value={form.displayOrder} onChange={(e) => change('displayOrder', e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Huỷ</button>
              <button type="submit" className="btn-primary" style={{ flex: 2 }}>Lưu</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}