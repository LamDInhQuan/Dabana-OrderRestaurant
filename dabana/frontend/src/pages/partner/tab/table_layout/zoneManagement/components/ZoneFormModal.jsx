import { useState, useEffect } from 'react'

export default function ZoneFormModal({ open, zone, onClose, onSubmit }) {
  const [form, setForm] = useState({ zoneName: '', description: '' })

  useEffect(() => {
    setForm({ zoneName: zone?.zoneName || '', description: zone?.description || '' })
  }, [zone, open])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await onSubmit(form)
    if (ok) onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: 380, margin: '1rem' }}>
        <h2 style={{ marginBottom: '1rem', fontWeight: 700 }}>{zone ? 'Sửa khu vực' : 'Thêm khu vực'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Tên khu vực</label>
            <input value={form.zoneName}
              onChange={(e) => setForm((p) => ({ ...p, zoneName: e.target.value }))}
              placeholder="VD: Tầng 1, Ngoài trời" required />
          </div>
          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Mô tả</label>
            <input value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Huỷ</button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }}>Lưu</button>
          </div>
        </form>
      </div>
    </div>
  )
}