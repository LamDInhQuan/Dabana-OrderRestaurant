export default function MenuHeader({ onOpenCategories, onAddItem }) {
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '.75rem' }}>
      <h1 style={{ fontWeight: 800, fontSize: '1.3rem' }}>Quản lý thực đơn</h1>
      <div className="flex gap-2">
        <button className="btn-outline" onClick={onOpenCategories}>Danh mục</button>
        <button className="btn-primary" onClick={onAddItem}>+ Thêm món mới</button>
      </div>
    </div>
  )
}