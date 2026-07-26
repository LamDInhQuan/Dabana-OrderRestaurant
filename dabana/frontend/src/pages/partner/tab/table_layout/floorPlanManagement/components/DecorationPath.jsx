// Render "đường đi" (lối đi bộ) trong tiểu cảnh - polyline nhiều điểm chứ không phải
// 1 khối chữ nhật/tròn như DecorationShape.
//
// Toạ độ điểm (points[].x/y) tính theo % (0-100) giống hệt quy ước x/y của các
// decoration khác, nên vẽ đè bằng 1 lớp SVG phủ toàn bộ canvas với
// viewBox="0 0 100 100". Lưu ý: preserveAspectRatio="none" nên nếu canvas không
// vuông thì đường có thể hơi méo tỉ lệ - chấp nhận được vì mục đích chỉ là minh hoạ
// lối đi, không cần chính xác tuyệt đối. Độ dày nét (strokeWidth) dùng
// vector-effect="non-scaling-stroke" để luôn hiển thị đúng theo px, không bị kéo giãn.
export default function DecorationPath({ decoration, editable = false, selected = false, onClick, onDragPoint }) {
  const points = decoration.points || []
  if (points.length < 2) return null

  const strokeWidth = decoration.strokeWidth ?? 20
  const isStones = decoration.style === 'stones'
  const color = decoration.color || (isStones ? '#C9BBA0' : '#D8C9A3')
  const pointsAttr = points.map((p) => `${p.x},${p.y}`).join(' ')

  const startDragPoint = (idx) => (e) => {
    e.stopPropagation()
    if (!editable) return
    const svg = e.target.closest('svg')
    if (!svg) return

    const toPercent = (ev) => {
      const rect = svg.getBoundingClientRect()
      return {
        x: Math.min(100, Math.max(0, ((ev.clientX - rect.left) / rect.width) * 100)),
        y: Math.min(100, Math.max(0, ((ev.clientY - rect.top) / rect.height) * 100)),
      }
    }
    const onMove = (ev) => {
      const { x, y } = toPercent(ev)
      onDragPoint?.(idx, x, y, false)
    }
    const onUp = (ev) => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const { x, y } = toPercent(ev)
      onDragPoint?.(idx, x, y, true)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}>
      {/* Nền lối đi - nét liền cho kiểu 'solid' (đất nện/gạch), ẩn nếu kiểu 'stones' (đá lát rời) */}
      <polyline
        points={pointsAttr}
        fill="none"
        stroke={isStones ? 'transparent' : color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        onClick={() => editable && onClick?.(decoration)}
        style={{
          pointerEvents: editable ? 'stroke' : 'none',
          cursor: editable ? 'pointer' : 'default',
          filter: selected ? 'drop-shadow(0 0 2px #1D4ED8)' : undefined,
        }}
      />
      {/* Vet line giua mo, dut khuc - de "duong di" khong bi lam voi 1 vach mau/tuong
          phang le, gia tang cam giac co huong di lai. */}
      {!isStones && (
        <polyline
          points={pointsAttr} fill="none" stroke="rgba(255,255,255,.5)"
          strokeWidth={Math.max(1.5, strokeWidth * 0.12)} strokeDasharray={`${strokeWidth * 0.35} ${strokeWidth * 0.5}`}
          strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ pointerEvents: 'none' }}
        />
      )}
      {isStones && points.map((p, i) => (
        <circle key={`stone_${i}`} cx={p.x} cy={p.y} r={strokeWidth / 2.6}
          fill={color} stroke="rgba(0,0,0,.15)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ))}
      {editable && selected && points.map((p, i) => (
        <circle key={`handle_${i}`} cx={p.x} cy={p.y} r={4.5}
          fill="#1D4ED8" stroke="#fff" strokeWidth={1.5} vectorEffect="non-scaling-stroke"
          style={{ pointerEvents: 'all', cursor: 'grab' }}
          onMouseDown={startDragPoint(i)} />
      ))}
    </svg>
  )
}