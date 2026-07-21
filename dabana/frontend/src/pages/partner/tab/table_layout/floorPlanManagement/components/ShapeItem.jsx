import { useRef, useState } from 'react'
import { dbPositionToPercent, clampSize, angleFromCenter } from '../../utils/layoutTransform'

const DEFAULT_SIZE = 70

export default function ShapeItem({ decoration, selected, onDragStart, onClick, onResize, onRotate }) {
  const { left, top } = dbPositionToPercent(decoration.x, decoration.y)
  const isCircle = decoration.shape === 'circle'
  const elRef = useRef(null)

  const width = decoration.width ?? DEFAULT_SIZE
  const height = decoration.height ?? DEFAULT_SIZE
  const rotation = decoration.rotation ?? 0

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
      onResize?.(decoration, next.width, next.height)
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
      onRotate?.(decoration, finalDeg)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      ref={elRef}
      draggable
      onDragStart={(e) => onDragStart(e, decoration)}
      onClick={() => onClick?.(decoration)}
      style={{
        position: 'absolute', left: `${left}%`, top: `${top}%`,
        transform: `translate(-50%, -50%) rotate(${displayRotation}deg)`,
        width: displayWidth, height: displayHeight, borderRadius: isCircle ? '50%' : 8,
        background: 'rgba(59,130,246,.12)',
        border: `2px dashed ${selected ? '#1D4ED8' : '#3B82F6'}`,
        cursor: 'grab', userSelect: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '.72rem', fontWeight: 600, color: '#1D4ED8', textAlign: 'center',
        padding: '.25rem',
        transition: isTransforming ? 'none' : undefined,
      }}>
      {decoration.name}
      {selected && (
        <>
          <div
            onMouseDown={startRotate}
            title="Kéo để xoay"
            style={{
              position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)',
              width: 14, height: 14, borderRadius: '50%', background: '#1D4ED8',
              border: '2px solid #fff', cursor: 'grab', boxShadow: '0 1px 3px rgba(0,0,0,.3)',
            }}
          />
          <div
            onMouseDown={startResize}
            title="Kéo để đổi kích cỡ"
            style={{
              position: 'absolute', bottom: -6, right: -6,
              width: 12, height: 12, borderRadius: 4, background: '#1D4ED8',
              border: '2px solid #fff', cursor: 'nwse-resize', boxShadow: '0 1px 3px rgba(0,0,0,.3)',
            }}
          />
        </>
      )}
    </div>
  )
}
