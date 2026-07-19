export default function ZoneList({ zones, onEdit, onDelete }) {
  const handleDeleteClick = (zone) => {
    // Xac nhan truoc khi xoa - trước bản này bấm là xoá ngay, không có bước hỏi lại.
    if (window.confirm(`Xoá khu vực "${zone.zoneName}"? Hành động này không thể hoàn tác.`)) {
      onDelete(zone)
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
      {zones.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Chưa có khu vực nào.</p>
      )}
      {zones.map((z) => (
        <div key={z.id} className="flex items-center justify-between"
          style={{ padding: '.6rem .75rem', border: '1px solid var(--border)', borderRadius: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{z.zoneName}</div>
            {z.description && <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{z.description}</div>}
            <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{(z.tables || []).length} bàn</div>
          </div>
          <div className="flex gap-2">
            <button className="btn-outline btn-sm" onClick={() => onEdit(z)}>Sửa</button>
            <button className="btn-outline btn-sm" onClick={() => handleDeleteClick(z)}>Xoá</button>
          </div>
        </div>
      ))}
    </div>
  )
}