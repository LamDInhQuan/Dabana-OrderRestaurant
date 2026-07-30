// KpiCardRow — hàng thẻ KPI dùng chung Admin + Partner.
// Props: { cards: {key,label,value,previousValue,changePercent}[] }  (đúng List<KpiCard> từ BE)
function formatNumber(v) {
  return Number(v || 0).toLocaleString('vi-VN')
}

function ChangeBadge({ pct }) {
  if (pct === null || pct === undefined) return null
  const up = pct >= 0
  const color = up ? 'var(--green, #10B981)' : 'var(--red, #EF4444)'
  return (
    <span style={{ fontSize: '.72rem', fontWeight: 700, color }}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

export default function KpiCardRow({ cards = [] }) {
  if (!cards.length) {
    return <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Chưa có dữ liệu.</p>
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '.75rem' }}>
      {cards.map((c) => (
        <div key={c.key} style={{
          background: 'var(--cream, #fff)', border: '1px solid var(--cream-dark, #eee)',
          borderRadius: 10, padding: '.85rem 1rem',
        }}>
          <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: '.35rem' }}>{c.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatNumber(c.value)}</span>
            <ChangeBadge pct={c.changePercent} />
          </div>
        </div>
      ))}
    </div>
  )
}
