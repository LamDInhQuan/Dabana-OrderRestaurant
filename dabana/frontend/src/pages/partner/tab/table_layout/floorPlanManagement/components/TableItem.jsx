import { useRef, useState } from 'react'
import { dbPositionToPercent, clampSize, angleFromCenter } from '../../utils/layoutTransform'
import { STATUS_META, DEFAULT_STATUS_META } from './statusMeta'

const DEFAULT_WIDTH = 90
const DEFAULT_HEIGHT = 80

export default function TableItem({ table, editable, saving, selected, onDragStart, onClick, onResize, onRotate }) {
  const { left, top } = dbPositionToPercent(table.positionX, table.positionY)
  const meta = STATUS_META[table.status] || DEFAULT_STATUS_META
  const elRef = useRef(null)

  const width = table.width ?? DEFAULT_WIDTH
  const height = table.height ?? DEFAULT_HEIGHT
  const rotation = table.rotation ?? 0

  const [liveSize, setLiveSize] = useState(null)
  const [liveRotation, setLiveRotation] = useState(null)
  const displayWidth = liveSize?.width ?? width
  const displayHeight = liveSize?.height ?? height
  const displayRotation = liveRotation ?? rotation
  const isTransforming = liveSize !== null || liveRotation !== null

  const startResize = (e) => {
    e.stopPropagation()
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const startW = width
    const startH = height

    const compute = (ev) => ({
      width: clampSize(startW + (ev.clientX - startX) * 2),
      height: clampSize(startH + (ev.clientY - startY) * 2),
    })

    const onMove = (ev) => setLiveSize(compute(ev))
    const onUp = (ev) => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const next = compute(ev)
      setLiveSize(null)
      onResize?.(table, next.width, next.height)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const startRotate = (e) => {
    e.stopPropagation()
    e.preventDefault()
    const rect = elRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    const onMove = (ev) => setLiveRotation(angleFromCenter(cx, cy, ev.clientX, ev.clientY))
    const onUp = (ev) => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const finalDeg = angleFromCenter(cx, cy, ev.clientX, ev.clientY)
      setLiveRotation(null)
      onRotate?.(table, finalDeg)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      ref={elRef}
      draggable={editable}
      onDragStart={editable ? (e) => onDragStart(e, table) : undefined}
      onClick={() => onClick?.(table)}
      title={editable ? undefined : 'Chỉ có thể chỉnh sửa khi bàn đang ở trạng thái Trống'}
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        transform: `translate(-50%, -50%) rotate(${displayRotation}deg)`,
        width: displayWidth, height: displayHeight, borderRadius: 10,
        background: meta.color + '22',
        border: `2.5px solid ${selected ? '#1D4ED8' : meta.color}`,
        boxShadow: selected ? '0 0 0 3px rgba(29,78,216,.25)' : 'var(--shadow-sm)',
        cursor: editable ? 'grab' : 'not-allowed',
        opacity: saving ? 0.6 : 1,
        userSelect: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center',
        transition: isTransforming ? 'none' : 'box-shadow .15s, opacity .15s',
      }}>
      <span style={{ fontWeight: 800, fontSize: '.85rem' }}>{table.tableName}</span>
      <span style={{ fontSize: '.7rem', fontWeight: 600, color: meta.color }}>{meta.label}</span>
      <span style={{ fontSize: '.65rem', color: 'var(--text-muted)' }}>{table.capacity} khách</span>
      {selected && editable && (
        <>
          <div
            onMouseDown={startRotate}
            title="Kéo để xoay"
            style={{
              position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)',
              width: 16, height: 16, borderRadius: '50%', background: '#1D4ED8',
              border: '2px solid #fff', cursor: 'grab', boxShadow: '0 1px 3px rgba(0,0,0,.3)',
            }}
          />
          <div
            onMouseDown={startResize}
            title="Kéo để đổi kích cỡ"
            style={{
              position: 'absolute', bottom: -6, right: -6,
              width: 14, height: 14, borderRadius: 4, background: '#1D4ED8',
              border: '2px solid #fff', cursor: 'nwse-resize', boxShadow: '0 1px 3px rgba(0,0,0,.3)',
            }}
          />
        </>
      )}
    </div>
  )
}
