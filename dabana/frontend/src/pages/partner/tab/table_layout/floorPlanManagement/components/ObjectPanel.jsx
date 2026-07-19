import { useState, useEffect } from 'react'

const KIND_OPTIONS = [
  { key: 'table', label: '🪑 Bàn' },
  { key: 'square', label: '⬜ Hình vuông' },
  { key: 'circle', label: '⚪ Hình tròn' },
]

const emptyForm = { tableName: '', capacity: 4, name: '' }

export default function ObjectPanel({ floorPlan }) {
  const { selected, clearSelection, addTable, updateTable, deleteTable,
    addDecoration, updateDecoration, deleteDecoration, savingLayout } = floorPlan

  const [kind, setKind] = useState('table')
  const [form, setForm] = useState(emptyForm)

  const isEditing = !!selected
  const editingKind = selected?.type === 'table' ? 'table' : selected?.type === 'decoration' ? selected.data.shape : null

  useEffect(() => {
    if (selected?.type === 'table') {
      setKind('table')
      setForm({ tableName: selected.data.tableName, capacity: selected.data.capacity, name: '' })
    } else if (selected?.type === 'decoration') {
      setKind(selected.data.shape)
      setForm({ tableName: '', capacity: 4, name: selected.data.name })
    }
  }, [selected])

  const startCreate = (k) => {
    clearSelection()
    setKind(k)
    setForm(emptyForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    let ok = false
    if (kind === 'table') {
      ok = isEditing ? await updateTable(selected.data.id, { tableName: form.tableName, capacity: Number(form.capacity) })
                     : await addTable({ tableName: form.tableName, capacity: Number(form.capacity) })
    } else {
      ok = isEditing ? await updateDecoration(selected.data.id, { name: form.name })
                     : await addDecoration(kind, form.name)
    }
    if (ok && !isEditing) setForm(emptyForm)
  }

  const handleDelete = async () => {
    if (!selected) return
    if (!window.confirm('Xoá vật thể này khỏi sơ đồ?')) return
    if (selected.type === 'table') await deleteTable(selected.data)
    else await deleteDecoration(selected.data.id)
  }

  return (
    <div className="card" style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <div style={{ fontSize: '.8rem', fontWeight: 600, marginBottom: '.5rem', color: 'var(--text-muted)' }}>Thêm mới</div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {KIND_OPTIONS.map((opt) => (
            <button key={opt.key} type="button"
              className={!isEditing && kind === opt.key ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
              onClick={() => startCreate(opt.key)}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {isEditing ? `Đang sửa: ${editingKind === 'table' ? form.tableName : form.name}` : 'Thông tin vật thể mới'}
        </div>

        {kind === 'table' ? (
          <>
            <div>
              <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Tên bàn</label>
              <input value={form.tableName}
                onChange={(e) => setForm((p) => ({ ...p, tableName: e.target.value }))}
                placeholder="VD: T01, VIP-02" required />
            </div>
            <div>
              <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Sức chứa (khách)</label>
              <input type="number" min={1} value={form.capacity}
                onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} />
            </div>
          </>
        ) : (
          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Tên minh hoạ</label>
            <input value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="VD: Quầy bar, Sân khấu" required />
          </div>
        )}

        <div className="flex gap-2">
          {isEditing && (
            <button type="button" className="btn-outline btn-sm" onClick={handleDelete} style={{ color: '#EF4444' }}>Xoá</button>
          )}
          <button type="submit" className="btn-primary btn-sm" style={{ flex: 1 }} disabled={savingLayout}>
            {isEditing ? 'Lưu thông tin' : kind === 'table' ? '+ Thêm bàn' : '+ Thêm vật thể'}
          </button>
        </div>
        {isEditing && (
          <button type="button" className="btn-outline btn-sm" onClick={clearSelection}>Huỷ chọn</button>
        )}
      </form>
    </div>
  )
}