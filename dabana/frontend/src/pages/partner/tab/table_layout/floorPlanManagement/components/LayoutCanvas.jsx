import { useRef, useState } from 'react'
import TableItem from './TableItem'

export default function LayoutCanvas({ tables, isTableEditable, savingTableId, onMoveTable, onTableClick }) {
  const canvasRef = useRef(null)
  const [dragging, setDragging] = useState(null)

  const onDragStart = (e, table) => {
    setDragging(table)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDrop = (e) => {
    e.preventDefault()
    if (!dragging || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    onMoveTable(dragging, e.clientX, e.clientY, rect)
    setDragging(null)
  }

  return (
    <div ref={canvasRef}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      style={{
        position: 'relative', width: '100%', height: 480,
        background: 'var(--white)', border: '2px dashed var(--border)', borderRadius: 12,
        overflow: 'hidden', marginBottom: '1.5rem',
      }}>
      {tables.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '.5rem' }}>
          <span style={{ fontSize: '2rem' }}>🪑</span>
          <span>Khu vực chưa có bàn. Nhấn "Thêm bàn" để bắt đầu.</span>
        </div>
      )}
      {tables.map((table) => (
        <TableItem
          key={table.id}
          table={table}
          editable={isTableEditable(table)}
          saving={savingTableId === table.id}
          onDragStart={onDragStart}
          onClick={onTableClick}
        />
      ))}
    </div>
  )
}