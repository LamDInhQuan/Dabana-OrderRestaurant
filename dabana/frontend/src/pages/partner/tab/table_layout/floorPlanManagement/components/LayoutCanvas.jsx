import { useRef, useState } from 'react'
import TableItem from './TableItem'
import ShapeItem from './ShapeItem'

export default function LayoutCanvas({
  tables, decorations, isTableEditable, savingTableId, selected,
  onMoveTable, onMoveDecoration, onSelectTable, onSelectDecoration,
}) {
  const canvasRef = useRef(null)
  const [dragging, setDragging] = useState(null) // { kind: 'table'|'decoration', item }

  const onDragStart = (kind) => (e, item) => {
    setDragging({ kind, item })
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDrop = (e) => {
    e.preventDefault()
    if (!dragging || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    if (dragging.kind === 'table') onMoveTable(dragging.item, e.clientX, e.clientY, rect)
    else onMoveDecoration(dragging.item, e.clientX, e.clientY, rect)
    setDragging(null)
  }

  const isEmpty = tables.length === 0 && decorations.length === 0

  return (
    <div ref={canvasRef}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      style={{
        position: 'relative', width: '100%', height: 480,
        background: 'var(--white)', border: '2px dashed var(--border)', borderRadius: 12,
        overflow: 'auto', marginBottom: '1.5rem',
      }}>
      {isEmpty && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '.5rem' }}>
          <span style={{ fontSize: '2rem' }}>🪑</span>
          <span>Khu vực chưa có gì. Dùng panel bên phải để thêm bàn hoặc vật thể.</span>
        </div>
      )}
      {tables.map((table) => (
        <TableItem
          key={`t_${table.id}`}
          table={table}
          editable={isTableEditable(table)}
          saving={savingTableId === table.id}
          selected={selected?.type === 'table' && selected.data.id === table.id}
          onDragStart={onDragStart('table')}
          onClick={onSelectTable}
        />
      ))}
      {decorations.map((dec) => (
        <ShapeItem
          key={dec.id}
          decoration={dec}
          selected={selected?.type === 'decoration' && selected.data.id === dec.id}
          onDragStart={onDragStart('decoration')}
          onClick={onSelectDecoration}
        />
      ))}
    </div>
  )
}