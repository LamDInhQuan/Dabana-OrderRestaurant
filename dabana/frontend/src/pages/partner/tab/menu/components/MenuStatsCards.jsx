export default function MenuStatsCards({ stats, loading }) {
  const cards = [
    { label: 'Tổng số món', value: stats.total },
    { label: 'Đang bán', value: stats.selling },
    { label: 'Tạm ẩn', value: stats.outOfStock },
    { label: 'Danh mục', value: stats.categoryCount },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '.75rem', marginBottom: '1rem' }}>
      {cards.map((c) => (
        <div key={c.label} className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>{c.label}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{loading ? '…' : c.value}</div>
        </div>
      ))}
    </div>
  )
}