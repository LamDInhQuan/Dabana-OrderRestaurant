import { useState } from 'react'

export default function TableFormModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({ tableName: '', capacity: 4 })

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await onSubmit(form)
    if (ok) {
      setForm({ tableName: '', capacity: 4 })
      onClose()
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: 380, margin: '1rem' }}>
        <h2 style={{ marginBottom: '1rem', fontWeight: 700 }}>Thêm bàn mới</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Tên bàn</label>
            <input
              value={form.tableName}
              onChange={(e) => setForm((p) => ({ ...p, tableName: e.target.value }))}
              placeholder="VD: T01, VIP-02" required />
          </div>
          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Sức chứa (khách)</label>
            <input type="number" min={1} value={form.capacity}
              onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) }))} />
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Huỷ</button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }}>Thêm bàn</button>
          </div>
        </form>
      </div>
    </div>
  )
}