import { dbPositionToPercent } from '../../utils/layoutTransform'

export default function ShapeItem({ decoration, selected, onDragStart, onClick }) {
  const { left, top } = dbPositionToPercent(decoration.x, decoration.y)
  const isCircle = decoration.shape === 'circle'

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, decoration)}
      onClick={() => onClick?.(decoration)}
      style={{
        position: 'absolute', left: `${left}%`, top: `${top}%`,
        transform: 'translate(-50%, -50%)',
        width: 70, height: 70, borderRadius: isCircle ? '50%' : 8,
        background: 'rgba(59,130,246,.12)',
        border: `2px dashed ${selected ? '#1D4ED8' : '#3B82F6'}`,
        cursor: 'grab', userSelect: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '.72rem', fontWeight: 600, color: '#1D4ED8', textAlign: 'center',
        padding: '.25rem',
      }}>
      {decoration.name}
    </div>
  )
}