import { useState, useMemo } from 'react'
import TableCard from './components/TableCard'
import TableDetailDrawer from './components/TableDetailDrawer'
import { TABLE_STATUS_META } from './components/statusMeta'

const SUMMARY_ITEMS = [
  { key: 'empty', status: 1, label: 'Trống' },
  { key: 'reserved', status: 2, label: 'Đã đặt' },
  { key: 'occupied', status: 3, label: 'Đang dùng' },
  { key: 'cleaning', status: 4, label: 'Dọn dẹp' },
  { key: 'maintenance', status: 5, label: 'Bảo trì' },
]

export default function OrderBoardTab({ orderBoard, onSelectTable }) {
  const {
    zones = [], visibleZones = [], loading, refreshing, lastUpdatedAt,
    activeZoneId, setActiveZoneId, summary = {}, reload, branchId, wsConnected,
  } = orderBoard || {}

  const [selectedTableId, setSelectedTableId] = useState(null)

  // Luon lay ban tu zones (nguon du lieu moi nhat sau moi lan reload) thay vi
  // giu 1 ban copy rieng trong state - tranh Drawer hien du lieu cu sau khi
  // check-in/them mon/doi trang thai.
  const selectedTable = useMemo(
    () => zones.flatMap((z) => z.tables || []).find((t) => t.tableId === selectedTableId) || null,
    [zones, selectedTableId]
  )

  const handleSelectTable = (table) => {
    setSelectedTableId(table.tableId)
    onSelectTable?.(table)
  }

  return (
    <div className="page-container" style={{ padding: '1.5rem 1rem' }}>
      {/* Header */}

      {/* Tong quan trang thai */}
      <div className="card" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '.72rem', color: 'var(--text-muted, #8A6E57)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Tổng số bàn</div>
          <div style={{ fontWeight: 800, fontSize: '1.4rem' }}>{summary.total || 0}</div>
        </div>
        {SUMMARY_ITEMS.map((item) => {
          const meta = TABLE_STATUS_META[item.status]
          return (
            <div key={item.key}>
              <div style={{ fontSize: '.72rem', color: meta.color, fontWeight: 700 }}>{meta.icon} {item.label}</div>
              <div style={{ fontWeight: 800, fontSize: '1.4rem', color: meta.color }}>{summary[item.key] || 0}</div>
            </div>
          )
        })}
      </div>

      {/* Filter theo Zone */}
      {zones.length > 0 && (
        <div className="flex gap-2" style={{ marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveZoneId?.('ALL')}
            className={activeZoneId === 'ALL' ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
          >
            Tất cả khu vực
          </button>
          {zones.map((z) => (
            <button
              key={z.zoneId}
              onClick={() => setActiveZoneId?.(z.zoneId)}
              className={activeZoneId === z.zoneId ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
            >
              {z.zoneName} ({(z.tables || []).length})
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && <p style={{ color: 'var(--text-muted, #8A6E57)' }}>Đang tải sơ đồ bàn...</p>}

      {/* Empty state */}
      {!loading && zones.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted, #8A6E57)' }}>
          Chi nhánh chưa có khu vực/bàn nào. Vui lòng thiết lập ở tab "Sơ đồ bàn".
        </div>
      )}

      {/* Danh sach ban theo tung Zone */}
      {!loading && visibleZones.map((zone) => (
        <div key={zone.zoneId} style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '.75rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{zone.zoneName}</h2>
            {zone.description && (
              <p style={{ fontSize: '.78rem', color: 'var(--text-muted, #8A6E57)' }}>{zone.description}</p>
            )}
          </div>

          {(zone.tables || []).length === 0 ? (
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted, #8A6E57)', fontSize: '.85rem' }}>
              Khu vực này chưa có bàn nào.
            </div>
          ) : (
            <div style={{
              display: 'grid', gap: '.9rem',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            }}>
              {zone.tables.map((table) => (
                <TableCard key={table.tableId} table={table} onClick={handleSelectTable} />
              ))}
            </div>
          )}
        </div>
      ))}

      <TableDetailDrawer
        table={selectedTable}
        branchId={branchId}
        onClose={() => setSelectedTableId(null)}
        onChanged={() => reload?.()}
      />
    </div>
  )
}