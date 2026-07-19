import { useState } from 'react'

const EMPTY = { categoryName: '', displayOrder: 0 }

export default function CategoryManageModal({ open, categories, savingCategoryId, onClose, onCreate, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null) // null | 'new' | categoryId
  const [form, setForm] = useState(EMPTY)

  if (!open) return null

  const startEdit = (cat) => { setEditingId(cat.id); setForm({ categoryName: cat.categoryName, displayOrder: cat.displayOrder ?? 0 }) }
  const startCreate = () => { setEditingId('new'); setForm(EMPTY) }
  const cancelEdit = () => { setEditingId(null); setForm(EMPTY) }

  const submit = async (e) => {
    e.preventDefault()
    const payload = { categoryName: form.categoryName, displayOrder: Number(form.displayOrder) || 0 }
    const ok = editingId === 'new' ? await onCreate(payload) : await onUpdate(editingId, payload)
    if (ok) cancelEdit()
  }

  const handleDelete = (cat) => {
    // BE chan xoa neu danh muc con mon (MENU_ITEM_ALREADY_EXISTS-kieu rang buoc);
    // giu nguyen message loi tu BE tra ve, khong tu doan truoc o FE.
    if (window.confirm(`Xoá danh mục "${cat.categoryName}"?`)) {
      onDelete(cat.id)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 210,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, margin: '1rem', maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700 }}>Quản lý danh mục</h2>
          <button className="btn-outline btn-sm" onClick={onClose}>Đóng</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1rem' }}>
          {categories.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Chưa có danh mục nào.</p>
          )}
          {categories.map((cat) => (
            editingId === cat.id ? (
              <form key={cat.id} onSubmit={submit} className="flex gap-2"
                style={{ alignItems: 'center', padding: '.5rem', border: '1px solid var(--border)', borderRadius: 8 }}>
                <input style={{ flex: 2 }} value={form.categoryName}
                  onChange={(e) => setForm((p) => ({ ...p, categoryName: e.target.value }))} required autoFocus />
                <input style={{ flex: 1 }} type="number" value={form.displayOrder}
                  onChange={(e) => setForm((p) => ({ ...p, displayOrder: e.target.value }))} />
                <button type="submit" className="btn-primary btn-sm" disabled={savingCategoryId === cat.id}>Lưu</button>
                <button type="button" className="btn-outline btn-sm" onClick={cancelEdit}>Huỷ</button>
              </form>
            ) : (
              <div key={cat.id} className="flex items-center justify-between"
                style={{ padding: '.5rem .75rem', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{cat.categoryName}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Thứ tự hiển thị: {cat.displayOrder}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-outline btn-sm" onClick={() => startEdit(cat)}>Sửa</button>
                  <button className="btn-outline btn-sm" onClick={() => handleDelete(cat)}>Xoá</button>
                </div>
              </div>
            )
          ))}
        </div>

        {editingId === 'new' ? (
          <form onSubmit={submit} className="flex gap-2" style={{ alignItems: 'center' }}>
            <input style={{ flex: 2 }} placeholder="Tên danh mục" value={form.categoryName}
              onChange={(e) => setForm((p) => ({ ...p, categoryName: e.target.value }))} required autoFocus />
            <input style={{ flex: 1 }} type="number" placeholder="Thứ tự" value={form.displayOrder}
              onChange={(e) => setForm((p) => ({ ...p, displayOrder: e.target.value }))} />
            <button type="submit" className="btn-primary btn-sm">Thêm</button>
            <button type="button" className="btn-outline btn-sm" onClick={cancelEdit}>Huỷ</button>
          </form>
        ) : (
          <button className="btn-outline btn-sm" onClick={startCreate}>+ Thêm danh mục</button>
        )}
      </div>
    </div>
  )
}