import { useState, useEffect } from 'react'
import { normalizeRotation } from '../../utils/layoutTransform'

const KIND_OPTIONS = [
  { key: 'table', label: '🪑 Bàn' },
  { key: 'square', label: '⬜ Hình vuông' },
  { key: 'circle', label: '⚪ Hình tròn' },
]

const DEFAULT_TABLE_SIZE = { width: 90, height: 80 }
const DEFAULT_DECORATION_SIZE = { width: 70, height: 70 }

const emptyForm = { tableName: '', capacity: 4, name: '', width: 90, height: 80, rotation: 0 }

export default function ObjectPanel({ floorPlan }) {
  const { selected, clearSelection, addTable, updateTable, deleteTable, updateTableGeometry,
    addDecoration, updateDecoration, deleteDecoration, savingLayout, savingTableId } = floorPlan

  const [kind, setKind] = useState('table')
  const [form, setForm] = useState(emptyForm)

  const isEditing = !!selected
  const editingKind = selected?.type === 'table' ? 'table' : selected?.type === 'decoration' ? selected.data.shape : null

  useEffect(() => {
    if (selected?.type === 'table') {
      setKind('table')
      setForm({
        tableName: selected.data.tableName, capacity: selected.data.capacity, name: '',
        width: selected.data.width ?? DEFAULT_TABLE_SIZE.width,
        height: selected.data.height ?? DEFAULT_TABLE_SIZE.height,
        rotation: selected.data.rotation ?? 0,
      })
    } else if (selected?.type === 'decoration') {
      setKind(selected.data.shape)
      setForm({
        tableName: '', capacity: 4, name: selected.data.name,
        width: selected.data.width ?? DEFAULT_DECORATION_SIZE.width,
        height: selected.data.height ?? DEFAULT_DECORATION_SIZE.height,
        rotation: selected.data.rotation ?? 0,
      })
    }
  }, [selected])

  const startCreate = (k) => {
    clearSelection()
    setKind(k)
    setForm({ ...emptyForm, ...(k === 'table' ? DEFAULT_TABLE_SIZE : DEFAULT_DECORATION_SIZE) })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const width = Number(form.width)
    const height = Number(form.height)
    const rotation = normalizeRotation(Number(form.rotation) || 0)
    let ok = false

    if (kind === 'table') {
      if (isEditing) {
        ok = await updateTable(selected.data.id, { tableName: form.tableName, capacity: Number(form.capacity) })
        const geometryChanged = width !== (selected.data.width ?? DEFAULT_TABLE_SIZE.width)
          || height !== (selected.data.height ?? DEFAULT_TABLE_SIZE.height)
          || rotation !== (selected.data.rotation ?? 0)
        if (ok && geometryChanged) {
          await updateTableGeometry(selected.data.id, { width, height, rotation })
        }
      } else {
        ok = await addTable({ tableName: form.tableName, capacity: Number(form.capacity), width, height, rotation })
      }
    } else {
      ok = isEditing
        ? await updateDecoration(selected.data.id, { name: form.name, width, height, rotation })
        : await addDecoration(kind, form.name, { width, height, rotation })
    }
    if (ok && !isEditing) setForm({ ...emptyForm, ...(kind === 'table' ? DEFAULT_TABLE_SIZE : DEFAULT_DECORATION_SIZE) })
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

        <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '.25rem' }}>
          Kích thước &amp; góc xoay
        </div>
        <div className="flex gap-2">
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '.8rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Rộng (px)</label>
            <input type="number" min={20} max={500} value={form.width}
              onChange={(e) => setForm((p) => ({ ...p, width: e.target.value }))} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '.8rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Cao (px)</label>
            <input type="number" min={20} max={500} value={form.height}
              onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: '.8rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Góc xoay (độ)</label>
          <input type="number" min={0} max={359.99} step={0.5} value={form.rotation}
            onChange={(e) => setForm((p) => ({ ...p, rotation: e.target.value }))} />
        </div>
        <p style={{ fontSize: '.72rem', color: 'var(--text-muted)', margin: 0 }}>
          💡 Cũng có thể kéo tay cầm trên sơ đồ để đổi kích cỡ / xoay bằng chuột.
        </p>

        <div className="flex gap-2">
          {isEditing && (
            <button type="button" className="btn-outline btn-sm" onClick={handleDelete} style={{ color: '#EF4444' }}>Xoá</button>
          )}
          <button type="submit" className="btn-primary btn-sm" style={{ flex: 1 }} disabled={savingLayout || !!savingTableId}>
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
