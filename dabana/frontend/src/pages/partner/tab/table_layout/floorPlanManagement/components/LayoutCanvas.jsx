import { useRef, useState } from 'react'
import TableItem from './TableItem'
import DecorationShape from './DecorationShape'
import DecorationPath from './DecorationPath'
import DecorationDoor from './DecorationDoor'
import { pxToDbPosition } from '../../utils/layoutTransform'

// Duoi nguong nay (px) tinh la 1 cai click binh thuong (de chon vat the), khong phai
// keo tha - tranh vat the bi "nhay" vi tri chi vi nguoi dung bam chon no.
const DRAG_THRESHOLD = 4

export default function LayoutCanvas({
  tables, decorations, isTableEditable, savingTableId, selected,
  onMoveTable, onMoveDecoration, onSelectTable, onSelectDecoration,
  onResizeTable, onRotateTable, onResizeDecoration, onRotateDecoration,
  // Ve duong di (path): dang ve dang do (mang diem tam thoi) + handler them diem/keo diem
  pathDraft, onAddPathDraftPoint, onDragPathPoint,
}) {
  const canvasRef = useRef(null)
  // { kind: 'table'|'decoration', id, left, top } - vi tri % dang keo tam thoi, dung de
  // ve LIVE ngay tren phan tu that (xem livePosition o TableItem/DecorationShape/Door).
  const [movePreview, setMovePreview] = useState(null)
  const isDrawingPath = Array.isArray(pathDraft)

  // Keo-tha di chuyen bang chuot thuc su (khong con dung native HTML5 drag/drop) - ly do:
  // trinh duyet tao "anh ghost" luc keo native drag ma BO QUA css transform (rotate) cua
  // phan tu nguon, nen vat the dang xoay se hien thi SAI goc (ve nhu chua xoay) trong suot
  // luc keo, chi dung lai dung goc sau khi tha chuot - day chinh la loi "xoay xong keo lai
  // ve goc cu" nguoi dung gap phai. Dung mousedown/mousemove/mouseup tu code (giong het co
  // che resize/rotate co san) de di chuyen CHINH phan tu React that, luon giu dung rotation
  // trong suot qua trinh keo va cho hinh anh muot hon.
  const startMove = (kind) => (e, item) => {
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    let moved = false

    const onMouseMove = (ev) => {
      if (!canvasRef.current) return
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD) return
      moved = true
      const rect = canvasRef.current.getBoundingClientRect()
      const { positionX, positionY } = pxToDbPosition(ev.clientX, ev.clientY, rect)
      setMovePreview({ kind, id: item.id, left: positionX, top: positionY })
    }
    const onMouseUp = (ev) => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      setMovePreview(null)
      if (!moved || !canvasRef.current) return // click thuong (chon), khong phai keo tha
      const rect = canvasRef.current.getBoundingClientRect()
      if (kind === 'table') onMoveTable(item, ev.clientX, ev.clientY, rect)
      else onMoveDecoration(item, ev.clientX, ev.clientY, rect)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const livePositionFor = (kind, id) => (
    movePreview && movePreview.kind === kind && movePreview.id === id
      ? { left: movePreview.left, top: movePreview.top }
      : null
  )

  // Che do dang ve duong di: nhap vao BAT KY vi tri nao tren canvas (ke ca dang de len 1
  // vat the khac) deu them 1 diem moi. Truoc day chi tinh khi e.target === canvasRef.current
  // nen cac khoi san/tuong/ban phu kin vung do se "nuot" mat click, khien khong the ve duong
  // di qua nhung khu vuc da co san vat the - day chinh la loi nguoi dung gap phai. De tranh
  // vua them diem vua vo tinh chon/keo trung 1 vat the khac, cac vat the khac tam thoi khong
  // nhan tuong tac chuot trong luc dang ve (xem pointerEvents ben duoi).
  const handleCanvasClick = (e) => {
    if (!isDrawingPath || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100))
    onAddPathDraftPoint?.(Math.round(x * 10) / 10, Math.round(y * 10) / 10)
  }

  // Vi tri z-order tu duoi len: san (floor) -> tuong (wall) -> cua (door) -> duong di
  // (path) -> ban an -> nhan/vat trang tri (marker) tren cung de khong bi san che chu.
  const floors = decorations.filter((d) => (d.kind || 'marker') === 'floor')
  const walls = decorations.filter((d) => (d.kind || 'marker') === 'wall')
  const doors = decorations.filter((d) => d.kind === 'door')
  const paths = decorations.filter((d) => d.kind === 'path')
  const markers = decorations.filter((d) => (d.kind || 'marker') === 'marker')

  const isEmpty = tables.length === 0 && decorations.length === 0 && !isDrawingPath

  return (
    <div ref={canvasRef}
      onClick={handleCanvasClick}
      style={{
        position: 'relative', width: '100%', height: 480,
        background: 'var(--white)', border: `2px dashed ${isDrawingPath ? '#1D4ED8' : 'var(--border)'}`, borderRadius: 12,
        overflow: 'auto', marginBottom: '1.5rem',
        cursor: isDrawingPath ? 'crosshair' : undefined,
      }}>
      {isEmpty && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '.5rem' }}>
          <span style={{ fontSize: '2rem' }}>🪑</span>
          <span>Khu vực chưa có gì. Dùng panel bên phải để thêm bàn hoặc vật thể.</span>
        </div>
      )}

      {/* Tam thoi vo hieu hoa tuong tac chuot cua tat ca vat the khi dang ve duong di,
          de moi click deu roi thang xuong canvas (them diem) thay vi bi 1 vat the nao
          do "nuot" mat - day la phan sua loi #1 (loi ve duong di). */}
      <div style={{ pointerEvents: isDrawingPath ? 'none' : undefined }}>
        {floors.map((dec) => (
          <DecorationShape key={dec.id} decoration={dec} editable
            selected={selected?.type === 'decoration' && selected.data.id === dec.id}
            livePosition={livePositionFor('decoration', dec.id)}
            onStartMove={startMove('decoration')} onClick={onSelectDecoration}
            onResize={onResizeDecoration} onRotate={onRotateDecoration} />
        ))}
        {walls.map((dec) => (
          <DecorationShape key={dec.id} decoration={dec} editable
            selected={selected?.type === 'decoration' && selected.data.id === dec.id}
            livePosition={livePositionFor('decoration', dec.id)}
            onStartMove={startMove('decoration')} onClick={onSelectDecoration}
            onResize={onResizeDecoration} onRotate={onRotateDecoration} />
        ))}
        {doors.map((dec) => (
          <DecorationDoor key={dec.id} decoration={dec} editable
            selected={selected?.type === 'decoration' && selected.data.id === dec.id}
            livePosition={livePositionFor('decoration', dec.id)}
            onStartMove={startMove('decoration')} onClick={onSelectDecoration} />
        ))}
        {paths.map((dec) => (
          <DecorationPath key={dec.id} decoration={dec} editable
            selected={selected?.type === 'decoration' && selected.data.id === dec.id}
            onClick={onSelectDecoration}
            onDragPoint={(idx, x, y, final) => onDragPathPoint?.(dec.id, idx, x, y, final)} />
        ))}

        {tables.map((table) => (
          <TableItem
            key={`t_${table.id}`}
            table={table}
            editable={isTableEditable(table)}
            saving={savingTableId === table.id}
            selected={selected?.type === 'table' && selected.data.id === table.id}
            livePosition={livePositionFor('table', table.id)}
            onStartMove={startMove('table')}
            onClick={onSelectTable}
            onResize={onResizeTable}
            onRotate={onRotateTable}
          />
        ))}

        {markers.map((dec) => (
          <DecorationShape key={dec.id} decoration={dec} editable
            selected={selected?.type === 'decoration' && selected.data.id === dec.id}
            livePosition={livePositionFor('decoration', dec.id)}
            onStartMove={startMove('decoration')} onClick={onSelectDecoration}
            onResize={onResizeDecoration} onRotate={onRotateDecoration} />
        ))}
      </div>

      {isDrawingPath && (
        <>
          {pathDraft.length >= 2 && (
            <DecorationPath decoration={{ points: pathDraft, strokeWidth: 4, color: '#1D4ED8', style: 'solid' }} />
          )}
          {pathDraft.map((p, i) => (
            <div key={`draft_${i}`} style={{
              position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%,-50%)',
              width: 10, height: 10, borderRadius: '50%', background: '#1D4ED8', border: '2px solid #fff',
              zIndex: 5, pointerEvents: 'none', boxShadow: '0 1px 3px rgba(0,0,0,.4)',
            }} />
          ))}
        </>
      )}
    </div>
  )
}