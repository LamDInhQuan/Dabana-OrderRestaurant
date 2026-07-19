import { useState, useEffect } from 'react'
import { STATUS_FILTER_OPTIONS } from '../utils/menuStatusMeta'

const label = { fontSize: '.78rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }

export default function MenuFilterBar({ filters, categories, onApply, onReset }) {
  // Draft rieng: go moi ky tu khong bat filter ngay, chi ap dung khi bam "Loc"
  // (khop voi mockup: 4 o filter + 1 nut Loc dung chung).
  const [draft, setDraft] = useState(filters)

  useEffect(() => { setDraft(filters) }, [filters])

  const change = (key, value) => setDraft((p) => ({ ...p, [key]: value }))

  const submit = (e) => {
    e.preventDefault()
    onApply(draft)
  }

  const hasActiveFilter = Object.entries(filters).some(([, v]) => v !== null && v !== '')

  return (
    <form onSubmit={submit} className="card"
      style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1rem' }}>
      <div style={{ flex: '2 1 220px' }}>
        <label style={label}>Tìm tên món ăn</label>
        <input value={draft.keyword} placeholder="Tìm tên món ăn..."
          onChange={(e) => change('keyword', e.target.value)} />
      </div>

      <div style={{ flex: '1 1 150px' }}>
        <label style={label}>Danh mục</label>
        <select value={draft.categoryId ?? ''}
          onChange={(e) => change('categoryId', e.target.value ? Number(e.target.value) : null)}>
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.categoryName}</option>
          ))}
        </select>
      </div>

      <div style={{ flex: '1 1 150px' }}>
        <label style={label}>Trạng thái</label>
        <select value={draft.status ?? ''} onChange={(e) => change('status', e.target.value || null)}>
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div style={{ flex: '1 1 220px', display: 'flex', gap: '.5rem' }}>
        <div style={{ flex: 1 }}>
          <label style={label}>Giá từ</label>
          <input type="number" min="0" step="1000" placeholder="0" value={draft.priceMin ?? ''}
            onChange={(e) => change('priceMin', e.target.value ? Number(e.target.value) : null)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={label}>Giá đến</label>
          <input type="number" min="0" step="1000" placeholder="Không giới hạn" value={draft.priceMax ?? ''}
            onChange={(e) => change('priceMax', e.target.value ? Number(e.target.value) : null)} />
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary btn-sm">Lọc</button>
        {hasActiveFilter && (
          <button type="button" className="btn-outline btn-sm" onClick={onReset}>Xoá lọc</button>
        )}
      </div>
    </form>
  )
}