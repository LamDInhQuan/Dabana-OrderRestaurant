import { STATUS_META } from './statusMeta'

export default function BulkPositionConfig({ savingTableId }) {
  return (
    <>
      <div className="flex items-center gap-3" style={{ flexWrap: 'wrap', marginBottom: '1rem' }}>
        {Object.values(STATUS_META).map((meta) => (
          <div key={meta.label} className="flex items-center gap-2">
            <div style={{ width: 10, height: 10, borderRadius: 3, background: meta.color }} />
            <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{meta.label}</span>
          </div>
        ))}
        {savingTableId && (
          <span style={{ fontSize: '.78rem', color: 'var(--brand)' }}>Đang lưu vị trí...</span>
        )}
      </div>
      <p style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
        💡 Kéo bàn (đang Trống) để thay đổi vị trí
      </p>
    </>
  )
}