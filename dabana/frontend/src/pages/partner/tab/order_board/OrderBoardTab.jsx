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

// Các mốc khung giờ phổ biến trong ngày để nhân viên check nhanh
const TIME_SLOTS = [
  { id: 'NOW', label: '⏱️ Hiện tại (Real-time)' },
  { id: '11:00', label: '11:00 Trưa' },
  { id: '12:30', label: '12:30 Trưa' },
  { id: '17:30', label: '17:30 Chiều' },
  { id: '19:00', label: '19:00 Tối' },
  { id: '20:30', label: '20:30 Tối' },
]

export default function OrderBoardTab({ orderBoard, onSelectTable }) {
  const {
    zones = [], visibleZones = [], loading, refreshing, lastUpdatedAt,
    activeZoneId, setActiveZoneId, summary = {}, reload, branchId, wsConnected,
  } = orderBoard || {}

  const [selectedTableId, setSelectedTableId] = useState(null)
  // State chọn khung giờ để xem trạng thái bàn tương lai
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('NOW')

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
      
      {/* THANH CHỌN KHUNG GIỜ (TIMELINE FILTER) */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '.75rem 1rem', background: '#FDFBF7', border: '1px solid #E8DECE' }}>
        <div style={{ fontSize: '.78rem', fontWeight: 700, marginBottom: '.5rem', color: '#8A6E57', textTransform: 'uppercase' }}>
          📅 Xem trạng thái bàn theo khung giờ:
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot.id}
              onClick={() => setSelectedTimeSlot(slot.id)}
              className={selectedTimeSlot === slot.id ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
              style={{ fontSize: '.8rem' }}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tổng quan trạng thái */}
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
                <TableCard 
                  key={table.tableId} 
                  table={table} 
                  selectedTimeSlot={selectedTimeSlot} 
                  onClick={handleSelectTable} 
                />
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