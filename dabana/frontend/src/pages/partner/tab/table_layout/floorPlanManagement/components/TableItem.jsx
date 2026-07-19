import { dbPositionToPercent } from '../../utils/layoutTransform'
import { STATUS_META, DEFAULT_STATUS_META } from './statusMeta'

export default function TableItem({ table, editable, saving, onDragStart, onClick }) {
  const { left, top } = dbPositionToPercent(table.positionX, table.positionY)
  const meta = STATUS_META[table.status] || DEFAULT_STATUS_META

  return (
    <div
      draggable={editable}
      onDragStart={editable ? (e) => onDragStart(e, table) : undefined}
      onClick={() => onClick?.(table)}
      title={editable ? undefined : 'Chỉ có thể chỉnh sửa khi bàn đang ở trạng thái Trống'}
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        transform: 'translate(-50%, -50%)',
        width: 90, height: 80, borderRadius: 10,
        background: meta.color + '22',
        border: `2.5px solid ${meta.color}`,
        cursor: editable ? 'grab' : 'not-allowed',
        opacity: saving ? 0.6 : 1,
        userSelect: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', boxShadow: 'var(--shadow-sm)',
        transition: 'box-shadow .15s, opacity .15s',
      }}>
      <span style={{ fontWeight: 800, fontSize: '.85rem' }}>{table.tableName}</span>
      <span style={{ fontSize: '.7rem', fontWeight: 600, color: meta.color }}>{meta.label}</span>
      <span style={{ fontSize: '.65rem', color: 'var(--text-muted)' }}>{table.capacity} khách</span>
    </div>
  )
}