import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import Navbar from '../../components/Navbar'
import { zoneApi, tableApi } from '../../api'

const STATUS_META = {
  AVAILABLE:         { color: '#22C55E', label: 'Trống' },
  RESERVED:          { color: '#EF4444', label: 'Đã đặt' },
  OCCUPIED:          { color: '#F59E0B', label: 'Đang dùng' },
  CLEANING:          { color: '#94A3B8', label: 'Dọn dẹp' },
  HELD_FOR_WAITLIST: { color: '#8B5CF6', label: 'Hàng chờ' },
  MAINTENANCE:       { color: '#1F2937', label: 'Bảo trì' },
}
const NEXT_STATUS = {
  AVAILABLE: 'RESERVED', RESERVED: 'OCCUPIED', OCCUPIED: 'CLEANING', CLEANING: 'AVAILABLE'
}

export default function TableLayout() {
  const { branchId } = useParams()
  const [zones, setZones]               = useState([])
  const [tables, setTables]             = useState({}) // zoneId → tables[]
  const [activeZone, setActiveZone]     = useState(null)
  const [dragging, setDragging]         = useState(null) // table being dragged
  const [adding, setAdding]             = useState(false)
  const [newTable, setNewTable]         = useState({ tableCode: '', capacity: 4 })
  const stompRef = useRef(null)
  const canvasRef = useRef(null)

  // ===== B08 Buoc 5: ket noi WebSocket de nhan cap nhat trang thai real-time =====
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      onConnect: () => {
        client.subscribe(`/topic/table-status/${branchId}`, (msg) => {
          const update = JSON.parse(msg.body) // { tableId, status }
          setTables(prev => {
            const next = { ...prev }
            for (const zid of Object.keys(next)) {
              next[zid] = next[zid].map(t => t.id === update.tableId ? { ...t, status: update.status } : t)
            }
            return next
          })
        })
      },
    })
    client.activate()
    stompRef.current = client
    return () => client.deactivate()
  }, [branchId])

  // Load zones & tables
  useEffect(() => {
    zoneApi.getByBranch(branchId).then(async r => {
      setZones(r.data)
      if (r.data.length > 0) setActiveZone(r.data[0])
      const tMap = {}
      await Promise.all(r.data.map(async z => {
        const t = await tableApi.getByZone(z.id)
        tMap[z.id] = t.data
      }))
      setTables(tMap)
    })
  }, [branchId])

  const activeZoneTables = activeZone ? (tables[activeZone.id] || []) : []

  // ===== B08 Buoc 2-3: cap nhat trang thai ban (nhan vien thao tac) =====
  const cycleStatus = async (table) => {
    const next = NEXT_STATUS[table.status]
    if (!next) { toast.error('Trạng thái bảo trì không thể thay đổi tự ý'); return }
    try {
      await tableApi.updateStatus(table.id, next)
      // WebSocket se cap nhat cho tat ca; tuy nhien ta cap nhat local de phan hoi nhanh
      setTables(prev => ({
        ...prev,
        [activeZone.id]: prev[activeZone.id].map(t => t.id === table.id ? { ...t, status: next } : t)
      }))
      toast.success(`Bàn ${table.tableCode}: ${STATUS_META[next]?.label}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật')
    }
  }

  // ===== B07 Buoc 2: keo-tha de cap nhat toa do =====
  const onDragStart = (e, table) => {
    setDragging(table)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDrop = async (e) => {
    e.preventDefault()
    if (!dragging || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1)
    const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1)
    try {
      await tableApi.updateLayout(dragging.id, { positionX: Number(x), positionY: Number(y) })
      setTables(prev => ({
        ...prev,
        [activeZone.id]: prev[activeZone.id].map(t =>
          t.id === dragging.id ? { ...t, positionX: Number(x), positionY: Number(y) } : t)
      }))
    } catch {}
    setDragging(null)
  }

  // ===== B07 Buoc 3: Them ban moi =====
  const handleAddTable = async (e) => {
    e.preventDefault()
    if (!activeZone) { toast.error('Vui lòng chọn khu vực'); return }
    try {
      const { data } = await tableApi.create({ ...newTable, zoneId: activeZone.id })
      setTables(prev => ({ ...prev, [activeZone.id]: [...(prev[activeZone.id] || []), data] }))
      setNewTable({ tableCode: '', capacity: 4 })
      setAdding(false)
      toast.success(`Đã thêm bàn ${data.tableCode}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi thêm bàn')
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ padding: '1.5rem 1rem' }}>
        <div className="flex items-center justify-between mb-4">
          <h1 style={{ fontWeight: 800, fontSize: '1.3rem' }}>Quản lý sơ đồ bàn</h1>
          <div className="flex gap-2">
            <button className="btn-outline btn-sm" onClick={() => setAdding(true)}>+ Thêm bàn</button>
          </div>
        </div>

        {/* Zone tabs */}
        <div className="flex gap-2" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
          {zones.map(z => (
            <button key={z.id} onClick={() => setActiveZone(z)}
              style={{
                padding: '.4rem 1rem', borderRadius: 99, fontSize: '.85rem', fontWeight: 600, border: '2px solid',
                borderColor: activeZone?.id === z.id ? 'var(--brand)' : 'var(--border)',
                background: activeZone?.id === z.id ? 'var(--brand-light)' : 'var(--white)',
                color: activeZone?.id === z.id ? 'var(--brand)' : 'var(--text-muted)',
              }}>
              {z.name}
            </button>
          ))}
        </div>

        {/* Canvas sơ đồ bàn (kéo-thả) */}
        <div ref={canvasRef}
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          style={{
            position: 'relative', width: '100%', height: 480,
            background: 'var(--white)', border: '2px dashed var(--border)', borderRadius: 12,
            overflow: 'hidden', marginBottom: '1.5rem'
          }}>
          {activeZoneTables.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '.5rem' }}>
              <span style={{ fontSize: '2rem' }}>🪑</span>
              <span>Khu vực chưa có bàn. Nhấn "Thêm bàn" để bắt đầu.</span>
            </div>
          )}
          {activeZoneTables.map(table => (
            <div key={table.id}
              draggable
              onDragStart={e => onDragStart(e, table)}
              onClick={() => cycleStatus(table)}
              style={{
                position: 'absolute',
                left: `${table.positionX || 10}%`,
                top:  `${table.positionY || 10}%`,
                transform: 'translate(-50%, -50%)',
                width: 90, height: 80, borderRadius: 10,
                background: STATUS_META[table.status]?.color + '22',
                border: `2.5px solid ${STATUS_META[table.status]?.color}`,
                cursor: 'grab', userSelect: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', boxShadow: 'var(--shadow-sm)',
                transition: 'box-shadow .15s'
              }}>
              <span style={{ fontWeight: 800, fontSize: '.85rem' }}>{table.tableCode}</span>
              <span style={{ fontSize: '.7rem', fontWeight: 600, color: STATUS_META[table.status]?.color }}>
                {STATUS_META[table.status]?.label}
              </span>
              <span style={{ fontSize: '.65rem', color: 'var(--text-muted)' }}>{table.capacity} khách</span>
            </div>
          ))}
        </div>

        {/* Legend + tip */}
        <div className="flex items-center gap-3" style={{ flexWrap: 'wrap', marginBottom: '1rem' }}>
          {Object.entries(STATUS_META).map(([s, { color, label }]) => (
            <div key={s} className="flex items-center gap-2">
              <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
              <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
          💡 Kéo bàn để thay đổi vị trí · Click bàn để chuyển trạng thái (Trống → Đã đặt → Đang dùng → Dọn dẹp)
        </p>

        {/* Form thêm bàn */}
        {adding && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ width: '100%', maxWidth: 380, margin: '1rem' }}>
              <h2 style={{ marginBottom: '1rem', fontWeight: 700 }}>Thêm bàn mới</h2>
              <form onSubmit={handleAddTable} style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
                <div>
                  <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Mã bàn</label>
                  <input value={newTable.tableCode} onChange={e => setNewTable(p => ({...p, tableCode: e.target.value}))} placeholder="VD: T01, VIP-02" required />
                </div>
                <div>
                  <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Sức chứa (khách)</label>
                  <input type="number" min={1} value={newTable.capacity} onChange={e => setNewTable(p => ({...p, capacity: Number(e.target.value)}))} />
                </div>
                <div className="flex gap-3">
                  <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setAdding(false)}>Huỷ</button>
                  <button type="submit" className="btn-primary" style={{ flex: 2 }}>Thêm bàn</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
