export default function MenuBulkActionBar({ count, onSetStatus, onClear, saving }) {
  if (count === 0) return null

  return (
    <div className="card flex items-center justify-between"
      style={{ padding: '.75rem 1rem', marginBottom: '.75rem', flexWrap: 'wrap', gap: '.5rem' }}>
      <span style={{ fontSize: '.85rem', fontWeight: 600 }}>Đã chọn {count} món</span>
      <div className="flex gap-2">
        <button className="btn-outline btn-sm" disabled={saving} onClick={() => onSetStatus('SELLING')}>Đưa vào bán</button>
        <button className="btn-outline btn-sm" disabled={saving} onClick={() => onSetStatus('OUT_OF_STOCK')}>Tạm ẩn</button>
        <button className="btn-outline btn-sm" disabled={saving} onClick={() => onSetStatus('DISCONTINUED')}>Ngừng bán</button>
        <button className="btn-outline btn-sm" disabled={saving} onClick={onClear}>Bỏ chọn</button>
      </div>
    </div>
  )
}