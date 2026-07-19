export default function LayoutToolbar({ zones, activeZoneId, onSelectZone, onAddTableClick }) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ fontWeight: 800, fontSize: '1.3rem' }}>Sơ đồ bàn</h1>
        <div className="flex gap-2">
          <button className="btn-outline btn-sm" onClick={onAddTableClick}>+ Thêm bàn</button>
        </div>
      </div>

      <div className="flex gap-2" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
        {zones.map((z) => (
          <button key={z.id} onClick={() => onSelectZone(z.id)}
            style={{
              padding: '.4rem 1rem', borderRadius: 99, fontSize: '.85rem', fontWeight: 600, border: '2px solid',
              borderColor: activeZoneId === z.id ? 'var(--brand)' : 'var(--border)',
              background: activeZoneId === z.id ? 'var(--brand-light)' : 'var(--white)',
              color: activeZoneId === z.id ? 'var(--brand)' : 'var(--text-muted)',
            }}>
            {z.zoneName}
          </button>
        ))}
      </div>
    </>
  )
}